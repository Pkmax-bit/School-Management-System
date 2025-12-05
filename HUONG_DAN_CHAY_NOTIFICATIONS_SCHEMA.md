# 📋 Hướng dẫn chạy Notifications Schema trên Supabase

## 🚀 Các bước thực hiện

### Bước 1: Truy cập Supabase Dashboard
1. Mở trình duyệt và truy cập: https://supabase.com/dashboard
2. Đăng nhập vào tài khoản của bạn
3. Chọn project **School Management System** (hoặc project của bạn)

### Bước 2: Mở SQL Editor
1. Trong menu bên trái, click vào **SQL Editor**
2. Hoặc truy cập trực tiếp: https://supabase.com/dashboard/project/[project-id]/sql/new

### Bước 3: Chạy SQL Script
1. Click vào nút **New query** (nếu chưa có query mới)
2. Mở file `notifications_schema_ready.sql` trong project của bạn
3. **Copy toàn bộ nội dung** của file
4. **Paste vào SQL Editor** của Supabase
5. Click nút **Run** (hoặc nhấn `Ctrl + Enter`)

### Bước 4: Kiểm tra kết quả
Sau khi chạy thành công, bạn sẽ thấy:
- ✅ Message: "Success. No rows returned"
- ✅ Bảng `notifications` đã được tạo trong database

## 🔍 Kiểm tra bảng đã được tạo

### Cách 1: Qua Table Editor
1. Vào **Table Editor** trong Supabase Dashboard
2. Tìm bảng `notifications` trong danh sách
3. Click vào để xem cấu trúc bảng

### Cách 2: Qua SQL Editor
Chạy query sau để kiểm tra:
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

## 📊 Cấu trúc bảng notifications

Bảng `notifications` bao gồm các cột sau:

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `id` | UUID | Primary key, tự động tạo |
| `recipient_type` | VARCHAR(20) | Loại người nhận: 'teacher' hoặc 'student' |
| `teacher_id` | UUID | ID giáo viên (nếu recipient_type = 'teacher') |
| `student_id` | UUID | ID học sinh (nếu recipient_type = 'student') |
| `classroom_id` | UUID | ID lớp học (nullable) |
| `type` | VARCHAR(50) | Loại thông báo: 'attendance_request', 'general', etc. |
| `title` | VARCHAR(255) | Tiêu đề thông báo |
| `message` | TEXT | Nội dung thông báo |
| `priority` | VARCHAR(20) | Độ ưu tiên: 'low', 'normal', 'high', 'urgent' |
| `read` | BOOLEAN | Đã đọc chưa (mặc định: false) |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật (tự động) |

## ✅ Tính năng đã được thêm

- ✅ **CHECK constraints**: Đảm bảo `recipient_type` và `priority` chỉ nhận giá trị hợp lệ
- ✅ **Foreign keys**: Liên kết với bảng `teachers`, `students`, `classrooms`
- ✅ **Indexes**: Tối ưu truy vấn theo `teacher_id`, `student_id`, `read`, `created_at`, etc.
- ✅ **Auto-update trigger**: Tự động cập nhật `updated_at` khi có thay đổi
- ✅ **Data integrity**: Constraint đảm bảo chỉ có `teacher_id` HOẶC `student_id` được set

## 🎯 Lưu ý quan trọng

1. **Đảm bảo các bảng phụ thuộc đã tồn tại**:
   - ✅ `teachers` table
   - ✅ `students` table  
   - ✅ `classrooms` table

2. **Nếu bảng đã tồn tại**: Script sử dụng `CREATE TABLE IF NOT EXISTS` nên an toàn để chạy lại

3. **Nếu có lỗi**: Kiểm tra xem các bảng `teachers`, `students`, `classrooms` đã được tạo chưa

## 🐛 Xử lý lỗi

### Lỗi: "relation 'teachers' does not exist"
**Giải pháp**: Chạy `supabase_schema.sql` trước để tạo các bảng cơ bản

### Lỗi: "constraint already exists"
**Giải pháp**: Bỏ qua, constraint đã được tạo trước đó

### Lỗi: "index already exists"
**Giải pháp**: Bỏ qua, index đã được tạo trước đó

## 📝 File SQL

File SQL đã được tối ưu và sẵn sàng chạy:
- 📄 `notifications_schema_ready.sql` - File SQL chính
- 📄 `create_notifications_table.sql` - File SQL gốc (có comments chi tiết)

## ✨ Sau khi hoàn thành

Sau khi chạy thành công, bạn có thể:
1. Sử dụng bảng `notifications` trong backend API
2. Tạo thông báo cho giáo viên và học sinh
3. Query thông báo theo `teacher_id`, `student_id`, `read` status, etc.

---

**Chúc bạn thành công! 🎉**


