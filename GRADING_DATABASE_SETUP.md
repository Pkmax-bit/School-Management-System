# Hướng dẫn Setup Database cho Hệ thống Quản lý Điểm số

## Tổng quan

Hệ thống quản lý điểm số yêu cầu các bảng và cột sau trong database:

### Bảng `assignment_submissions`

Bảng này lưu trữ các bài nộp của học sinh và điểm số đã chấm.

**Các cột cần thiết:**

1. **id** (UUID, PRIMARY KEY) - ID duy nhất của bài nộp
2. **assignment_id** (UUID, FOREIGN KEY) - ID của bài tập
3. **student_id** (UUID, FOREIGN KEY) - ID của học sinh
4. **answers** (JSONB) - Câu trả lời của học sinh: `{"question_id": "answer"}`
5. **files** (JSONB) - Danh sách file đính kèm: `[{"name": "...", "url": "...", "type": "word|zip|other", "size": 12345}]`
6. **links** (JSONB) - Danh sách liên kết: `["https://...", "https://..."]`
7. **score** (DECIMAL(5,2)) - Điểm số đã chấm
8. **is_graded** (BOOLEAN) - Đã chấm điểm chưa
9. **feedback** (TEXT) - Nhận xét của giáo viên/admin
10. **submitted_at** (TIMESTAMP) - Thời gian nộp bài
11. **graded_at** (TIMESTAMP) - Thời gian chấm điểm

## Cách kiểm tra Database

### 1. Chạy script kiểm tra

```bash
# Kết nối với Supabase database và chạy:
psql -h <your-db-host> -U <your-user> -d <your-database> -f check_grading_database.sql
```

Hoặc chạy trực tiếp trong Supabase SQL Editor:

```sql
-- Xem file check_grading_database.sql
```

### 2. Kiểm tra thủ công

```sql
-- Kiểm tra các cột trong bảng assignment_submissions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'
ORDER BY ordinal_position;
```

## Cách cập nhật Database

### Nếu database đã tồn tại

Chạy migration script để thêm các cột còn thiếu:

```bash
# Chạy migration
psql -h <your-db-host> -U <your-user> -d <your-database> -f add_grading_columns_to_submissions.sql
```

Hoặc chạy trong Supabase SQL Editor:

```sql
-- Xem file add_grading_columns_to_submissions.sql
```

### Nếu tạo database mới

File `supabase_schema.sql` đã được cập nhật với đầy đủ các cột cần thiết. Chỉ cần chạy:

```bash
psql -h <your-db-host> -U <your-user> -d <your-database> -f supabase_schema.sql
```

## Các file Migration

1. **`add_grading_columns_to_submissions.sql`** - Thêm các cột files, links, feedback vào bảng assignment_submissions
2. **`add_file_attachments_to_assignments.sql`** - Thêm hỗ trợ file/link cho câu hỏi và bài nộp (đã có sẵn)
3. **`check_grading_database.sql`** - Script kiểm tra database có đầy đủ các cột chưa

## Cấu trúc dữ liệu

### Files (JSONB)
```json
[
  {
    "name": "bai_tap.docx",
    "url": "https://storage.supabase.co/...",
    "type": "word",
    "size": 12345
  },
  {
    "name": "anh_minh_hoa.zip",
    "url": "https://storage.supabase.co/...",
    "type": "zip",
    "size": 54321
  }
]
```

### Links (JSONB)
```json
[
  "https://drive.google.com/file/d/...",
  "https://github.com/username/repo",
  "https://docs.google.com/document/..."
]
```

### Answers (JSONB)
```json
{
  "question_id_1": "Đáp án A",
  "question_id_2": "Câu trả lời tự luận dài...",
  "question_id_3": "B"
}
```

## Indexes đã tạo

Để tối ưu hiệu suất truy vấn, các index sau đã được tạo:

1. `idx_assignment_submissions_assignment_id` - Tìm bài nộp theo assignment
2. `idx_assignment_submissions_student_id` - Tìm bài nộp theo học sinh
3. `idx_assignment_submissions_files` - Tìm kiếm trong files (GIN index)
4. `idx_assignment_submissions_links` - Tìm kiếm trong links (GIN index)
5. `idx_assignment_submissions_graded` - Tìm bài đã chấm điểm

## Lưu ý

- Tất cả các migration script đều sử dụng `IF NOT EXISTS` nên có thể chạy nhiều lần an toàn
- Nếu database đã có các cột này rồi, migration sẽ không tạo lại
- Nên backup database trước khi chạy migration


