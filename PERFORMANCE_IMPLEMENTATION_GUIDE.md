# 🚀 Hướng Dẫn Triển Khai Tối Ưu Hóa Hiệu Suất
## Performance Optimization Implementation Guide

**Ngày tạo**: 2025-01-14  
**Status**: Phase 1 đang triển khai

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 1 - Quick Wins

1. ✅ **GZip Compression Middleware**
   - File: `backend/main.py`
   - Đã thêm `GZipMiddleware` với `minimum_size=1000`
   - **Impact**: Giảm 60-80% response size

2. ✅ **Database Indexes SQL**
   - File: `performance_phase1_database_indexes.sql`
   - Đã tạo indexes cho tất cả tables quan trọng
   - **Cần chạy**: Execute SQL file trong Supabase SQL Editor
   - **Impact**: Giảm 50-70% query time

3. ✅ **React Query Setup**
   - Package: `@tanstack/react-query` đã được cài đặt
   - File: `frontend/src/lib/react-query.ts`
   - Query keys factory đã được tạo
   - **Cần**: Wrap app với QueryClientProvider

4. ✅ **Pagination Component**
   - File: `frontend/src/components/ui/pagination.tsx`
   - Component đã sẵn sàng sử dụng
   - **Cần**: Integrate vào các pages

5. ✅ **Skeleton Loading Components**
   - File: `frontend/src/components/ui/skeleton.tsx`
   - Components: Skeleton, SkeletonTable, SkeletonCard, SkeletonList
   - **Cần**: Replace "Đang tải..." với skeleton

6. ✅ **Students API Updated**
   - File: `frontend/src/lib/students-api.ts`
   - Đã thêm pagination support (skip, limit)
   - **Cần**: Update các pages sử dụng API này

---

## 📋 CẦN THỰC HIỆN

### 1. Setup React Query Provider

**File**: `frontend/src/app/layout.tsx`

```tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 2. Apply Database Indexes

**Cách 1: Via Supabase Dashboard**
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung từ `performance_phase1_database_indexes.sql`
4. Execute SQL

**Cách 2: Via MCP**
```bash
# Sử dụng MCP Supabase tool để apply migration
```

### 3. Update Students Page với Pagination

**File**: `frontend/src/app/students/page.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTable } from '@/components/ui/skeleton';

// Thay thế useState và useEffect bằng React Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.students.list({ 
    page: currentPage, 
    search: searchQuery,
    limit: 20 
  }),
  queryFn: async () => {
    const result = await studentsApi.getStudents({
      skip: (currentPage - 1) * 20,
      limit: 20,
      search: searchQuery
    });
    return result;
  }
});

// Sử dụng skeleton thay vì "Đang tải..."
if (isLoading) {
  return <SkeletonTable rows={10} cols={6} />;
}

// Thêm pagination component
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil((data?.total || 0) / 20)}
  onPageChange={setCurrentPage}
  pageSize={20}
  totalItems={data?.total}
/>
```

### 4. Update Teachers API

**File**: `frontend/src/lib/teachers-api.ts`

Thêm pagination tương tự như students-api.ts:

```tsx
getTeachers: async (params?: { 
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<{ data: Teacher[]; total?: number }> => {
  // Similar to students API
}
```

### 5. Update Backend Default Pagination

Đảm bảo tất cả list endpoints có default limit = 20:

**File**: `backend/routers/students.py` (đã có)
```python
limit: int = Query(20, ge=1, le=100),  # Default 20, max 100
skip: int = Query(0, ge=0),
```

**Cần update**: teachers, subjects, classrooms, assignments, etc.

### 6. Add Memoization

**Example**: `frontend/src/app/students/page.tsx`

```tsx
import { useMemo, useCallback } from 'react';

// Memoize filtered students
const filteredStudents = useMemo(() => {
  if (!data?.data) return [];
  // Filter logic
  return data.data.filter(...);
}, [data, searchQuery]);

// Memoize callbacks
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query);
  setCurrentPage(1); // Reset to first page
}, []);
```

### 7. Code Splitting

**File**: `frontend/src/app/students/page.tsx`

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const StudentForm = dynamic(() => import('@/components/StudentForm'), {
  loading: () => <SkeletonCard />,
  ssr: false
});
```

---

## 🔄 PHASE 2: BACKEND OPTIMIZATION

### 1. Setup Redis (Cần cài đặt Redis server)

**Install Redis**:
```bash
# Windows (via WSL or Docker)
docker run -d -p 6379:6379 redis:alpine

# Or install Redis for Windows
```

**Backend**: Tạo `backend/cache.py`
```python
import redis
import json
from functools import wraps
from typing import Optional

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

def cache_result(ttl: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            redis_client.setex(cache_key, ttl, json.dumps(result, default=str))
            
            return result
        return wrapper
    return decorator
```

**Usage**:
```python
@router.get("/")
@cache_result(ttl=300)  # Cache for 5 minutes
async def get_students(...):
    # ...
```

### 2. HTTP Cache Headers

**File**: `backend/main.py`

```python
from fastapi.responses import Response

@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Cache static assets
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000"
    
    # Cache API responses (short)
    elif request.url.path.startswith("/api/"):
        if request.method == "GET":
            response.headers["Cache-Control"] = "public, max-age=60"
    
    return response
```

### 3. Connection Pooling

**File**: `backend/database.py`

```python
from supabase import create_client, Client
from config import settings
import os

# Connection pool configuration
_pool: Optional[Client] = None

def get_db() -> Client:
    global _pool
    if _pool is None:
        _pool = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
            options={
                "db": {
                    "schema": "public"
                },
                "global": {
                    "headers": {
                        "x-client-info": "school-management-system"
                    }
                }
            }
        )
    return _pool
```

---

## 🚀 PHASE 3: ADVANCED OPTIMIZATION

### 1. Next.js Image Optimization

**File**: `frontend/src/components/StudentAvatar.tsx`

```tsx
import Image from 'next/image';

export function StudentAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
      loading="lazy"
      placeholder="blur"
    />
  );
}
```

### 2. Bundle Analysis

**File**: `frontend/next.config.js`

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Run**:
```bash
ANALYZE=true npm run build
```

### 3. Service Worker (PWA)

**File**: `frontend/public/sw.js`

```javascript
const CACHE_NAME = 'school-management-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/api/students?limit=20',
  // ...
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

---

## 📊 MONITORING

### 1. Performance Metrics

Thêm vào `frontend/src/app/layout.tsx`:

```tsx
useEffect(() => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('Performance:', entry.name, entry.value);
        // Send to analytics
      }
    }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
  }
}, []);
```

---

## ✅ CHECKLIST

### Phase 1
- [x] GZip compression
- [x] Database indexes SQL
- [x] React Query setup
- [x] Pagination component
- [x] Skeleton components
- [ ] Apply database indexes
- [ ] Setup QueryClientProvider
- [ ] Update Students page
- [ ] Update Teachers page
- [ ] Update Subjects page
- [ ] Update Classrooms page
- [ ] Update Assignments page
- [ ] Add memoization
- [ ] Code splitting

### Phase 2
- [ ] Setup Redis
- [ ] Create cache decorator
- [ ] Add caching to endpoints
- [ ] HTTP cache headers
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Batch requests
- [ ] Rate limiting

### Phase 3
- [ ] CDN setup
- [ ] Image optimization
- [ ] Service Worker
- [ ] Performance monitoring
- [ ] SSR optimization
- [ ] Bundle optimization

---

## 🎯 NEXT STEPS

1. **Apply database indexes** (Ưu tiên cao)
2. **Setup React Query Provider** (Ưu tiên cao)
3. **Update Students page** với pagination và React Query
4. **Update các pages khác** tương tự
5. **Test performance** trước và sau

---

**Tài liệu này sẽ được cập nhật khi có thêm progress.**

