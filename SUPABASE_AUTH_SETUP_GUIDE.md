# Hướng dẫn cấu hình Supabase Authentication

## Vấn đề hiện tại
- **Lỗi**: 401 Unauthorized khi gọi Subjects API
- **Nguyên nhân**: Supabase chưa được cấu hình authentication
- **Giải pháp**: Cấu hình Supabase Auth và Row Level Security (RLS)

## Các bước cấu hình

### 1. Cấu hình Supabase Authentication

#### A. Tạo User trong Supabase Dashboard
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Authentication** → **Users**
4. Click **Add user** → **Create new user**
5. Tạo user với:
   - **Email**: admin@school.com
   - **Password**: [password mạnh]
   - **Email Confirm**: ✅ (check this)

#### B. Cấu hình Row Level Security (RLS)
1. Vào **Database** → **Tables**
2. Chọn table `subjects`
3. Vào tab **RLS**
4. Enable RLS: ✅ **Enable Row Level Security**
5. Tạo policy mới:

```sql
-- Policy cho authenticated users
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects
FOR ALL USING (auth.role() = 'authenticated');
```

### 2. Cập nhật Database Schema

#### A. Chạy SQL trong Supabase SQL Editor
```sql
-- Enable RLS cho subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho authenticated users
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects
FOR ALL USING (auth.role() = 'authenticated');

-- Tạo policy cho admin users (nếu cần)
CREATE POLICY "Allow admin users to manage subjects" ON subjects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

### 3. Cập nhật Frontend Authentication

#### A. Tạo Supabase Auth Hook
Tạo file `src/hooks/useSupabaseAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
};
```

#### B. Tạo Login Page với Supabase Auth
Cập nhật login page để sử dụng Supabase Auth:

```typescript
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function LoginPage() {
  const { signIn, loading } = useSupabaseAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      alert('Đăng nhập thất bại: ' + error.message);
    } else {
      router.push('/dashboard');
    }
  };
  
  // ... rest of component
}
```

### 4. Test Authentication

#### A. Test Login
1. Truy cập login page
2. Đăng nhập với user đã tạo trong Supabase
3. Kiểm tra console logs để verify session

#### B. Test Subjects API
1. Sau khi đăng nhập, truy cập `/subjects`
2. Kiểm tra console logs:
   - `Authentication successful`
   - `Subjects loaded successfully`

#### C. Test CRUD Operations
1. **Create**: Tạo subject mới
2. **Read**: Load danh sách subjects
3. **Update**: Cập nhật subject
4. **Delete**: Xóa subject

### 5. Troubleshooting

#### A. Lỗi 401 Unauthorized
- **Nguyên nhân**: Chưa đăng nhập hoặc session expired
- **Giải pháp**: 
  1. Kiểm tra user đã đăng nhập chưa
  2. Kiểm tra RLS policies
  3. Kiểm tra Supabase configuration

#### B. Lỗi RLS Policy
- **Nguyên nhân**: RLS policy không đúng
- **Giải pháp**:
  1. Kiểm tra RLS đã enable chưa
  2. Kiểm tra policy syntax
  3. Test policy với SQL Editor

#### C. Lỗi Session Expired
- **Nguyên nhân**: Session hết hạn
- **Giải pháp**:
  1. Auto refresh session
  2. Redirect to login
  3. Handle session expiry

### 6. Production Considerations

#### A. Security
- **RLS Policies**: Cấu hình đúng policies
- **User Roles**: Phân quyền user roles
- **Session Management**: Quản lý session properly
- **API Keys**: Bảo mật API keys

#### B. Performance
- **Session Caching**: Cache session data
- **Connection Pooling**: Optimize connections
- **Query Optimization**: Optimize database queries

#### C. Monitoring
- **Auth Logs**: Monitor authentication logs
- **Error Tracking**: Track authentication errors
- **Performance**: Monitor API performance

## Kết quả mong đợi

### ✅ Sau khi cấu hình
- **Authentication**: User có thể đăng nhập
- **Authorization**: User có quyền truy cập subjects
- **CRUD Operations**: Tất cả operations hoạt động
- **Error Handling**: Clear error messages

### ✅ Test Scenarios
1. **Login**: Đăng nhập thành công
2. **Subjects List**: Load danh sách subjects
3. **Create Subject**: Tạo subject mới
4. **Update Subject**: Cập nhật subject
5. **Delete Subject**: Xóa subject
6. **Logout**: Đăng xuất và redirect

## Lưu ý
- Cần cấu hình RLS policies đúng
- Test thoroughly với real users
- Monitor authentication logs
- Consider session timeout settings
- Implement proper error handling
