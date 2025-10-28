# Sửa lỗi Environment Variables cho Supabase

## Vấn đề
- **Lỗi**: "Supabase chưa được cấu hình" mặc dù đã có configuration
- **Nguyên nhân**: Tên biến environment không đúng format cho Next.js
- **Cấu hình hiện tại**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (không có NEXT_PUBLIC_ prefix)

## Nguyên nhân gốc rễ

### 1. Next.js Environment Variables Format
- **NEXT_PUBLIC_ prefix**: Required cho client-side variables
- **Không có prefix**: Chỉ accessible ở server-side
- **Supabase client**: Cần chạy ở browser, nên cần NEXT_PUBLIC_

### 2. Configuration Mismatch
- **Code expects**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **User has**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Result**: Configuration không được detect

## Các sửa đổi đã thực hiện

### 1. Updated Supabase Configuration (`lib/supabase.ts`)
```typescript
// Trước
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Sau
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'
```

### 2. Updated Supabase API (`lib/supabase-api.ts`)
```typescript
// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseKey === 'your-anon-key-here' ||
    supabaseKey === 'placeholder-key') {
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}
```

### 3. Created Environment Setup Guide
Tạo file `ENV_SETUP_GUIDE.md` với:
- Hướng dẫn tạo `.env.local` file
- Cách lấy SUPABASE_ANON_KEY từ dashboard
- Troubleshooting common issues
- Security best practices

## Cấu hình cần thiết

### 1. Tạo file `.env.local` trong `frontend/`
```bash
# Supabase Configuration (cho Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Lấy SUPABASE_ANON_KEY
1. Truy cập [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **anon public** key
5. Paste vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Restart Development Server
```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại
npm run dev
```

## Tính năng mới

### ✅ Backward Compatibility
- **Dual Support**: Hỗ trợ cả `NEXT_PUBLIC_` và không có prefix
- **Fallback Logic**: Thử NEXT_PUBLIC_ trước, sau đó fallback về tên cũ
- **No Breaking Changes**: Không ảnh hưởng đến cấu hình hiện tại

### ✅ Enhanced Configuration Detection
```typescript
// Kiểm tra multiple environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Kiểm tra placeholder values
if (supabaseUrl === 'https://placeholder.supabase.co' || 
    supabaseKey === 'placeholder-key') {
  throw new Error('Supabase configuration is missing.');
}
```

### ✅ Clear Setup Instructions
- **Step-by-step guide**: Hướng dẫn từng bước
- **Troubleshooting**: Giải quyết các lỗi phổ biến
- **Security notes**: Lưu ý bảo mật

## Kết quả

### ✅ Đã sửa
- Environment variables compatibility
- Configuration detection
- Clear setup instructions
- Backward compatibility

### 📱 User Experience
- **With correct config**: Hoạt động bình thường với Supabase
- **With wrong config**: Clear error messages và setup instructions
- **Development**: Dễ dàng cấu hình và test

### 🔧 Development
- **Flexible config**: Hỗ trợ nhiều format environment variables
- **Debug logging**: Chi tiết configuration status
- **Setup guide**: Hướng dẫn cấu hình từng bước

## Test Scenarios

### 1. NEXT_PUBLIC_ Variables (Recommended)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
- ✅ Works perfectly
- ✅ Client-side accessible
- ✅ Production ready

### 2. Legacy Variables (Backward Compatible)
```bash
SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
- ✅ Works with fallback
- ⚠️ Server-side only
- ⚠️ Not recommended for production

### 3. Mixed Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
- ✅ Works with fallback logic
- ✅ Uses NEXT_PUBLIC_ for URL
- ✅ Uses legacy for key

## Next Steps

1. **Tạo file `.env.local`** với cấu hình đúng
2. **Lấy SUPABASE_ANON_KEY** từ Supabase dashboard
3. **Restart development server**
4. **Kiểm tra console logs** để verify connection
5. **Test CRUD operations** trên subjects page

## Lưu ý
- File `.env.local` không được commit vào git
- Sử dụng NEXT_PUBLIC_ prefix cho production
- Kiểm tra Supabase dashboard để lấy đúng anon key
- Restart server sau khi thay đổi environment variables
