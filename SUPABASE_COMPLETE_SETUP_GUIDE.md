# Hướng dẫn cấu hình Supabase hoàn chỉnh

## Tình trạng hiện tại
- **Development Mode**: Đã bypass authentication cho development
- **Fallback Data**: Sử dụng dữ liệu mẫu khi Supabase chưa cấu hình
- **Next Step**: Cấu hình Supabase đầy đủ cho production

## Bước 1: Cấu hình Supabase Project

### A. Tạo Supabase Project
1. Truy cập [https://supabase.com](https://supabase.com)
2. **Sign up/Login** với tài khoản
3. **Create new project**:
   - **Name**: School Management System
   - **Database Password**: [password mạnh]
   - **Region**: Singapore (gần Việt Nam nhất)

### B. Lấy thông tin cấu hình
1. Vào **Settings** → **API**
2. Copy **Project URL**: `https://your-project-id.supabase.co`
3. Copy **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Bước 2: Cấu hình Environment Variables

### A. Tạo file `.env.local` trong `frontend/`
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### B. Restart Development Server
```bash
# Dừng server hiện tại (Ctrl+C)
npm run dev
```

## Bước 3: Tạo Database Schema

### A. Vào Supabase SQL Editor
1. **Database** → **SQL Editor**
2. **New query**

### B. Chạy SQL Schema
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO subjects (name, code, description) VALUES 
('Toán học', 'MATH', 'Môn toán học cơ bản'),
('Vật lý', 'PHYS', 'Môn vật lý cơ bản'),
('Hóa học', 'CHEM', 'Môn hóa học cơ bản'),
('Tiếng Anh', 'ENG', 'Môn tiếng Anh')
ON CONFLICT (code) DO NOTHING;
```

## Bước 4: Cấu hình Authentication

### A. Tạo User trong Supabase
1. **Authentication** → **Users**
2. **Add user** → **Create new user**
3. **Email**: admin@school.com
4. **Password**: [password mạnh]
5. **Email Confirm**: ✅ (check this)

### B. Cấu hình Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects
FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for public access (development)
CREATE POLICY "Allow public access for development" ON subjects
FOR ALL USING (true);
```

## Bước 5: Test Configuration

### A. Kiểm tra Environment Variables
```bash
# Trong terminal
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### B. Test Supabase Connection
1. Truy cập `/subjects` page
2. Kiểm tra console logs:
   - `Development mode: Bypassing authentication`
   - `Using fallback data for development`
   - Hoặc `Successfully fetched subjects: 4`

### C. Test CRUD Operations
1. **Create**: Tạo subject mới
2. **Read**: Load danh sách subjects
3. **Update**: Cập nhật subject
4. **Delete**: Xóa subject

## Bước 6: Production Configuration

### A. Disable Development Mode
```typescript
// Trong subjects-api.ts, comment out development bypass
const checkAuth = async () => {
  // const isDevelopment = process.env.NODE_ENV === 'development';
  // if (isDevelopment) {
  //   console.log('Development mode: Bypassing authentication');
  //   return { user: { id: 'dev-user', role: 'admin' } };
  // }
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Authentication required. Please login first.');
  }
  return session;
};
```

### B. Enable Authentication
1. **Remove fallback data** từ getAll method
2. **Enable RLS policies** cho production
3. **Test authentication flow**

## Troubleshooting

### A. Lỗi "Authentication required"
- **Nguyên nhân**: Chưa đăng nhập hoặc session expired
- **Giải pháp**: 
  1. Kiểm tra user đã tạo trong Supabase
  2. Đăng nhập với user credentials
  3. Kiểm tra RLS policies

### B. Lỗi "Failed to fetch subjects"
- **Nguyên nhân**: Supabase chưa cấu hình hoặc network error
- **Giải pháp**:
  1. Kiểm tra environment variables
  2. Kiểm tra Supabase project status
  3. Kiểm tra network connection

### C. Lỗi "RLS policy violation"
- **Nguyên nhân**: RLS policies không đúng
- **Giải pháp**:
  1. Kiểm tra RLS đã enable chưa
  2. Kiểm tra policies syntax
  3. Test policies với SQL Editor

## Development vs Production

### Development Mode
- ✅ **Bypass Authentication**: Không cần đăng nhập
- ✅ **Fallback Data**: Sử dụng dữ liệu mẫu
- ✅ **Easy Testing**: Dễ dàng test UI/UX
- ✅ **No Setup**: Không cần cấu hình Supabase

### Production Mode
- ✅ **Real Authentication**: Supabase Auth integration
- ✅ **Real Database**: Kết nối database thực
- ✅ **Security**: RLS policies và user management
- ✅ **Scalability**: Production-ready architecture

## Next Steps

### 1. Immediate (Development)
- ✅ **Current Setup**: Đã hoạt động với fallback data
- ✅ **UI/UX Testing**: Test tất cả features
- ✅ **Code Development**: Tiếp tục phát triển

### 2. Before Production
- 🔄 **Configure Supabase**: Setup database và authentication
- 🔄 **Test Real Data**: Test với database thực
- 🔄 **Security Review**: Review security policies
- 🔄 **Performance Test**: Test performance với real data

### 3. Production Deployment
- 🔄 **Environment Variables**: Set production env vars
- 🔄 **Database Migration**: Migrate to production database
- 🔄 **Authentication**: Enable production authentication
- 🔄 **Monitoring**: Setup monitoring và logging

## Lưu ý
- Development mode hiện tại đã hoạt động
- Có thể tiếp tục phát triển mà không cần Supabase
- Cấu hình Supabase khi sẵn sàng cho production
- Test thoroughly trước khi deploy
