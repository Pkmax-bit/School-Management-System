# Tích hợp Supabase API cho Subjects

## Thay đổi chính
- **Loại bỏ**: Tất cả demo data và fallback data
- **Thay thế**: Sử dụng Supabase API thực tế
- **Kết quả**: Ứng dụng hoạt động với database thực

## Các file đã tạo/sửa đổi

### 1. Tạo Supabase API Functions (`lib/supabase-api.ts`)
```typescript
export const supabaseSubjectsAPI = {
  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });
    // ... error handling
  },
  
  createSubject: async (data: CreateSubjectRequest): Promise<Subject> => {
    const { data: result, error } = await supabase
      .from('subjects')
      .insert(convertToInsert(data))
      .select()
      .single();
    // ... error handling
  },
  
  updateSubject: async (id: string, data: UpdateSubjectRequest): Promise<Subject> => {
    const { data: result, error } = await supabase
      .from('subjects')
      .update(convertToUpdate(data))
      .eq('id', id)
      .select()
      .single();
    // ... error handling
  },
  
  deleteSubject: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    // ... error handling
  }
};
```

### 2. Cập nhật Subjects Page (`app/subjects/page.tsx`)

#### Thay đổi API calls:
```typescript
// Trước (Axios API)
import { subjectsAPI } from '@/lib/api';
const response = await subjectsAPI.getSubjects();
setSubjects(response.data);

// Sau (Supabase API)
import { supabaseSubjectsAPI } from '@/lib/supabase-api';
const subjects = await supabaseSubjectsAPI.getSubjects();
setSubjects(subjects);
```

#### Loại bỏ offline mode:
```typescript
// Đã xóa
const [isOfflineMode, setIsOfflineMode] = useState(false);
const getFallbackSubjects = (): Subject[] => [...];

// Đã xóa UI elements
{isOfflineMode && <div>Chế độ Offline</div>}
disabled={isOfflineMode}
```

#### Cải thiện error handling:
```typescript
// Supabase-specific error handling
if (error.message?.includes('duplicate key')) {
  alert('Mã môn học đã tồn tại. Vui lòng chọn mã khác.');
} else if (error.message?.includes('foreign key')) {
  alert('Không thể xóa môn học này vì đang được sử dụng.');
} else {
  alert('Có lỗi xảy ra: ' + error.message);
}
```

## Tính năng mới

### ✅ Supabase Integration
- **Real Database**: Kết nối trực tiếp với Supabase database
- **Type Safety**: TypeScript types từ Supabase schema
- **Error Handling**: Xử lý lỗi database cụ thể
- **CRUD Operations**: Create, Read, Update, Delete hoàn chỉnh

### ✅ Enhanced Error Messages
- **Duplicate Key**: "Mã môn học đã tồn tại"
- **Foreign Key**: "Không thể xóa vì đang được sử dụng"
- **JWT Errors**: "Lỗi xác thực. Vui lòng đăng nhập lại"
- **Network Errors**: "Không thể kết nối đến Supabase"

### ✅ Database Schema Compliance
- **UUID Primary Keys**: Sử dụng UUID cho tất cả records
- **Timestamps**: Tự động created_at và updated_at
- **Constraints**: Unique codes, foreign key relationships
- **Indexes**: Optimized queries với proper indexing

## Cấu trúc Database

### Subjects Table Schema
```sql
CREATE TABLE subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sample Data
```sql
INSERT INTO subjects (name, code, description, credits) VALUES 
('Toán học', 'MATH', 'Môn toán học cơ bản', 3),
('Vật lý', 'PHYS', 'Môn vật lý cơ bản', 2),
('Hóa học', 'CHEM', 'Môn hóa học cơ bản', 2),
('Tiếng Anh', 'ENG', 'Môn tiếng Anh', 2);
```

## API Functions

### 1. Get Subjects
```typescript
const subjects = await supabaseSubjectsAPI.getSubjects();
// Returns: Subject[] ordered by created_at DESC
```

### 2. Create Subject
```typescript
const newSubject = await supabaseSubjectsAPI.createSubject({
  name: 'Toán học',
  code: 'MATH101',
  description: 'Môn toán cơ bản',
  credits: 4
});
// Returns: Created Subject with generated ID
```

### 3. Update Subject
```typescript
const updatedSubject = await supabaseSubjectsAPI.updateSubject(id, {
  name: 'Toán học nâng cao',
  credits: 5
});
// Returns: Updated Subject
```

### 4. Delete Subject
```typescript
await supabaseSubjectsAPI.deleteSubject(id);
// Throws error if subject is referenced by other tables
```

## Error Handling

### Database Errors
- **Duplicate Code**: `duplicate key value violates unique constraint`
- **Foreign Key**: `update or delete on table "subjects" violates foreign key constraint`
- **JWT Expired**: `JWT expired` → Redirect to login
- **Network**: `Failed to fetch` → Connection error

### User-Friendly Messages
- **Success**: "Tạo môn học thành công!", "Cập nhật môn học thành công!"
- **Validation**: "Mã môn học đã tồn tại. Vui lòng chọn mã khác."
- **Constraint**: "Không thể xóa môn học này vì đang được sử dụng trong lớp học hoặc lịch học."

## Cách test

### 1. Test với Supabase
1. Đảm bảo Supabase project đang chạy
2. Kiểm tra environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Truy cập `/subjects` page
4. Test CRUD operations

### 2. Test Error Scenarios
1. **Duplicate Code**: Tạo 2 subjects với cùng code
2. **Delete Referenced**: Xóa subject đang được sử dụng
3. **Network Error**: Tắt Supabase connection
4. **JWT Expired**: Đợi token hết hạn

### 3. Verify Database
1. Kiểm tra Supabase dashboard
2. Xem subjects table data
3. Verify timestamps và relationships

## Lợi ích

### ✅ Real Database
- **Persistent Data**: Dữ liệu được lưu trữ vĩnh viễn
- **Scalable**: Hỗ trợ nhiều users đồng thời
- **Reliable**: Supabase đảm bảo uptime cao

### ✅ Type Safety
- **Generated Types**: Tự động từ database schema
- **Compile-time Checks**: Phát hiện lỗi trước khi runtime
- **IntelliSense**: Auto-completion cho database fields

### ✅ Production Ready
- **Authentication**: Supabase Auth integration
- **Row Level Security**: Database-level permissions
- **Real-time**: Có thể thêm real-time subscriptions
- **Backup**: Automatic database backups

## Lưu ý
- Cần cấu hình Supabase environment variables
- Database schema phải match với TypeScript types
- Test thoroughly với real data
- Consider adding Row Level Security (RLS) policies
