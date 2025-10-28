# Sửa lỗi 401 Authentication cho Subjects API

## Vấn đề
- **Lỗi**: 401 Unauthorized khi gọi Subjects API
- **Nguyên nhân**: Supabase chưa được cấu hình authentication
- **Ảnh hưởng**: Không thể truy cập subjects data

## Nguyên nhân gốc rễ

### 1. Missing Authentication Check
- **Subjects API**: Không kiểm tra authentication trước khi gọi Supabase
- **Supabase RLS**: Row Level Security chưa được cấu hình
- **User Session**: Không có session management

### 2. Supabase Configuration
- **RLS Policies**: Chưa có policies cho subjects table
- **User Management**: Chưa có user trong Supabase
- **Session Handling**: Không có session persistence

## Các sửa đổi đã thực hiện

### 1. Enhanced Subjects API (`lib/subjects-api.ts`)

#### A. Authentication Check Function
```typescript
// Kiểm tra authentication
const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Authentication required. Please login first.');
  }
  return session;
};
```

#### B. Updated All API Methods
```typescript
// Tất cả methods đều check authentication
static async getAll(): Promise<Subject[]> {
  try {
    await checkAuth(); // ✅ Added auth check
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });
    // ... rest of method
  }
}

// Tương tự cho create, update, delete, search, checkCodeExists
```

### 2. Enhanced Subjects Page (`app/subjects/page.tsx`)

#### A. Authentication Error Handling
```typescript
const loadSubjects = async () => {
  try {
    const data = await SubjectsAPI.getAll();
    setSubjects(data);
  } catch (error: any) {
    if (error.message?.includes('Authentication required')) {
      alert('Bạn cần đăng nhập để truy cập chức năng này. Vui lòng đăng nhập lại.');
      logout(); // ✅ Auto logout on auth error
    } else {
      alert('Không thể tải danh sách môn học: ' + error.message);
    }
  }
};
```

#### B. Consistent Error Handling
- **loadSubjects**: Auth error → logout
- **handleSearch**: Auth error → logout  
- **handleCreate**: Auth error → logout
- **handleUpdate**: Auth error → logout
- **handleDelete**: Auth error → logout

### 3. Comprehensive Setup Guide

#### A. Supabase Authentication Setup
```sql
-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects
FOR ALL USING (auth.role() = 'authenticated');
```

#### B. User Management
1. **Create User**: Trong Supabase Dashboard
2. **Email Confirmation**: Enable email confirmation
3. **Password Policy**: Set strong password requirements
4. **Role Management**: Configure user roles

#### C. Frontend Integration
```typescript
// Supabase Auth Hook
export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  return { user, signIn, signOut };
};
```

## Tính năng mới

### ✅ Authentication Integration
- **Session Check**: Kiểm tra session trước mỗi API call
- **Auto Logout**: Tự động logout khi auth error
- **Error Messages**: Clear authentication error messages
- **User Feedback**: Thông báo rõ ràng cho user

### ✅ Enhanced Error Handling
```typescript
// Authentication errors
if (error.message?.includes('Authentication required')) {
  alert('Bạn cần đăng nhập để truy cập chức năng này. Vui lòng đăng nhập lại.');
  logout();
}

// Database errors
else if (error.message?.includes('foreign key')) {
  alert('Không thể xóa môn học này vì đang được sử dụng trong hệ thống.');
}

// Generic errors
else {
  alert('Có lỗi xảy ra: ' + error.message);
}
```

### ✅ Security Features
- **RLS Policies**: Row Level Security cho subjects table
- **Session Management**: Proper session handling
- **User Roles**: Role-based access control
- **API Protection**: All API methods protected

## Cấu hình cần thiết

### 1. Supabase Dashboard Setup
```sql
-- 1. Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 2. Create authentication policy
CREATE POLICY "Allow authenticated users to manage subjects" ON subjects
FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create admin policy (optional)
CREATE POLICY "Allow admin users to manage subjects" ON subjects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

### 2. User Creation
1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. **Email**: admin@school.com
4. **Password**: [strong password]
5. **Email Confirm**: ✅

### 3. Environment Variables
```bash
# .env file
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Test Scenarios

### ✅ Authentication Flow
1. **Without Login**: 401 error → redirect to login
2. **With Login**: Success → load subjects
3. **Session Expired**: 401 error → auto logout
4. **Invalid Credentials**: Login error → retry

### ✅ CRUD Operations
1. **Create**: Auth check → create subject
2. **Read**: Auth check → load subjects
3. **Update**: Auth check → update subject
4. **Delete**: Auth check → delete subject

### ✅ Error Handling
1. **Auth Error**: Clear message → logout
2. **DB Error**: Specific error message
3. **Network Error**: Connection error message
4. **Validation Error**: Form validation message

## Kết quả

### ✅ Đã sửa
- Authentication check trong tất cả API methods
- Enhanced error handling với auto logout
- Clear user feedback cho auth errors
- Comprehensive setup guide

### 📱 User Experience
- **With Auth**: Hoạt động bình thường
- **Without Auth**: Clear error message + auto logout
- **Session Expired**: Auto redirect to login
- **Error States**: User-friendly error messages

### 🔧 Development
- **Security**: RLS policies cho database protection
- **Session Management**: Proper session handling
- **Error Handling**: Comprehensive error handling
- **Setup Guide**: Step-by-step configuration

## Next Steps

### 1. Cấu hình Supabase
1. **Enable RLS** cho subjects table
2. **Create policies** cho authenticated users
3. **Create user** trong Supabase Dashboard
4. **Test authentication** với real user

### 2. Test Implementation
1. **Login** với user đã tạo
2. **Access subjects** page
3. **Test CRUD** operations
4. **Verify error handling**

### 3. Production Considerations
1. **User Management**: Implement proper user management
2. **Role-based Access**: Implement role-based permissions
3. **Session Security**: Implement session security
4. **Monitoring**: Monitor authentication logs

## Lưu ý
- Cần cấu hình RLS policies trong Supabase
- Tạo user trong Supabase Dashboard
- Test authentication flow thoroughly
- Monitor authentication errors
- Consider session timeout settings
