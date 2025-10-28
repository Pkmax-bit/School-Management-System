# Sửa lỗi Supabase "Failed to fetch"

## Vấn đề
- **Lỗi**: `Error fetching subjects: {}` và `Failed to fetch`
- **Nguyên nhân**: Supabase chưa được cấu hình hoặc environment variables chưa được set
- **Ảnh hưởng**: Không thể kết nối đến Supabase database

## Nguyên nhân gốc rễ

### 1. Missing Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` chưa được set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` chưa được set
- Hoặc sử dụng placeholder values

### 2. Poor Error Handling
- Không detect được configuration issues
- Không có fallback khi Supabase chưa cấu hình
- Error messages không rõ ràng

## Các sửa đổi đã thực hiện

### 1. Enhanced Supabase API Error Handling
```typescript
// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseKey === 'your-anon-key-here') {
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

// Enhanced error handling
if (error.message?.includes('Failed to fetch')) {
  throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase configuration.');
} else if (error.message?.includes('JWT')) {
  throw new Error('Authentication error. Please check your Supabase configuration.');
} else {
  throw new Error(`Database error: ${error.message}`);
}
```

### 2. Fallback Data for Development
```typescript
// Handle Supabase configuration errors
if (error.message?.includes('Supabase configuration is missing')) {
  console.log('Supabase not configured, using sample data for development');
  setSubjects([
    {
      id: '1',
      name: 'Toán học',
      code: 'MATH',
      description: 'Môn toán học cơ bản',
      credits: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // ... more sample data
  ]);
  alert('Supabase chưa được cấu hình. Đang sử dụng dữ liệu mẫu. Vui lòng cấu hình Supabase để sử dụng database thực.');
}
```

### 3. Disabled CRUD Operations
```typescript
// Create operation
if (error.message?.includes('Supabase configuration is missing')) {
  alert('Không thể tạo môn học. Supabase chưa được cấu hình. Vui lòng cấu hình Supabase để sử dụng database thực.');
}

// Update operation  
if (error.message?.includes('Supabase configuration is missing')) {
  alert('Không thể cập nhật môn học. Supabase chưa được cấu hình. Vui lòng cấu hình Supabase để sử dụng database thực.');
}

// Delete operation
if (error.message?.includes('Supabase configuration is missing')) {
  alert('Không thể xóa môn học. Supabase chưa được cấu hình. Vui lòng cấu hình Supabase để sử dụng database thực.');
}
```

### 4. Comprehensive Setup Guide
Tạo file `SUPABASE_SETUP_GUIDE.md` với:
- Hướng dẫn tạo Supabase project
- Cách lấy URL và API key
- Cấu hình environment variables
- Troubleshooting common issues
- Security best practices

## Tính năng mới

### ✅ Configuration Detection
- **Auto-detect**: Kiểm tra environment variables
- **Placeholder Detection**: Phát hiện placeholder values
- **Clear Messages**: Thông báo rõ ràng về configuration issues

### ✅ Development Fallback
- **Sample Data**: 4 môn học mẫu khi Supabase chưa cấu hình
- **Read-only Mode**: Chỉ hiển thị, không cho phép CRUD
- **Clear Notifications**: Thông báo về việc sử dụng sample data

### ✅ Enhanced Error Messages
- **Configuration**: "Supabase chưa được cấu hình"
- **Network**: "Không thể kết nối đến Supabase"
- **Auth**: "Lỗi xác thực Supabase"
- **Database**: "Database error: [specific message]"

### ✅ Debug Information
```typescript
console.log('Attempting to fetch subjects from Supabase...');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Successfully fetched subjects:', data?.length || 0);
```

## Cách cấu hình Supabase

### 1. Tạo Supabase Project
1. Truy cập [https://supabase.com](https://supabase.com)
2. Tạo project mới
3. Lấy Project URL và Anon Key

### 2. Cấu hình Environment Variables
Tạo file `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Chạy Database Schema
1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung `supabase_schema.sql`
3. Chạy script để tạo tables

### 4. Restart Development Server
```bash
npm run dev
```

## Kết quả

### ✅ Đã sửa
- Configuration detection hoàn chỉnh
- Fallback data cho development
- Enhanced error handling
- Clear user messages
- Comprehensive setup guide

### 📱 User Experience
- **With Supabase**: Hoạt động bình thường với real database
- **Without Supabase**: Hiển thị sample data với thông báo rõ ràng
- **Error States**: Thông báo lỗi cụ thể và hướng dẫn sửa

### 🔧 Development
- **Debug Logging**: Chi tiết configuration và connection status
- **Sample Data**: 4 môn học để test UI/UX
- **Setup Guide**: Hướng dẫn cấu hình từng bước

## Test Scenarios

### 1. Supabase Configured
- ✅ Loads real data from Supabase
- ✅ CRUD operations work
- ✅ No error messages

### 2. Supabase Not Configured
- ✅ Shows sample data
- ✅ Disables CRUD operations
- ✅ Clear configuration message

### 3. Network Issues
- ✅ Shows connection error
- ✅ Suggests checking internet/config
- ✅ Graceful degradation

### 4. Authentication Issues
- ✅ Shows auth error
- ✅ Suggests checking API key
- ✅ Clear troubleshooting steps

## Lưu ý
- Sample data chỉ dành cho development
- Production cần có Supabase configuration
- Environment variables phải được set correctly
- Restart server sau khi thay đổi .env.local
