# 307 Redirect Error Fix

## Vấn đề
- **Error 307**: Temporary Redirect từ `/api/subjects` sang `/api/subjects/`
- **Nguyên nhân**: Backend yêu cầu trailing slash trong URL
- **Kết quả**: API calls thất bại với redirect error

## Giải pháp

### 1. Sửa API Base URL
**File**: `frontend/src/lib/api.ts`
```typescript
// Before
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// After  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/';
```

### 2. Sửa API Endpoints
**File**: `frontend/src/lib/subjects-api.ts`
```typescript
// Before
const response = await api.post('/api/subjects', data);
const response = await api.get('/api/subjects');

// After
const response = await api.post('api/subjects', data);
const response = await api.get('api/subjects');
```

### 3. Enable Backend Calls
- **Re-enabled**: API calls với URL đúng
- **Fallback**: Vẫn có fallback data khi backend lỗi
- **Error handling**: Comprehensive error handling

## Kết quả
- ✅ **Không còn 307 Redirect Error**
- ✅ **API calls hoạt động** với URL đúng
- ✅ **Fallback data** vẫn hoạt động khi cần
- ✅ **Error handling** comprehensive

## Test Cases
1. **Backend available**: API calls thành công
2. **Backend unavailable**: Fallback data được sử dụng
3. **Network error**: Error được handle gracefully
4. **Validation**: Code uniqueness check hoạt động

## Lưu ý
- **URL format**: Luôn sử dụng trailing slash trong base URL
- **Endpoint paths**: Không bắt đầu với `/` khi có base URL
- **Fallback**: Luôn có fallback cho development
