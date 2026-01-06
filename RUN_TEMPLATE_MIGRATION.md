# Hướng dẫn chạy Migration cho Template Classrooms

## Cách 1: Chạy qua Supabase Dashboard (Khuyến nghị)

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn

### Bước 2: Mở SQL Editor
1. Vào **SQL Editor** ở sidebar bên trái
2. Click **New query**

### Bước 3: Chạy Migration
1. Copy toàn bộ nội dung file `template_classrooms_schema.sql`
2. Paste vào SQL Editor
3. Click **Run** hoặc nhấn `Ctrl+Enter`

### Bước 4: Kiểm tra kết quả
- Nếu thành công, bạn sẽ thấy message "Success. No rows returned"
- Kiểm tra bảng `classrooms` có cột `is_template` chưa
- Kiểm tra bảng `template_usage` đã được tạo chưa

## Cách 2: Chạy qua Supabase CLI

Nếu bạn đã cài đặt Supabase CLI:

```bash
# Đảm bảo đã login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Tạo migration file
supabase migration new add_template_classrooms

# Copy nội dung từ template_classrooms_schema.sql vào file migration vừa tạo
# File sẽ ở: supabase/migrations/xxxxx_add_template_classrooms.sql

# Apply migration
supabase db push
```

## Cách 3: Sử dụng MCP Supabase (Cần cấu hình)

### Cấu hình MCP Supabase

Để sử dụng MCP tool, bạn cần cấu hình project reference trong MCP settings:

1. **Lấy Project Reference:**
   - Vào Supabase Dashboard → Settings → General
   - Copy **Reference ID** (dạng: `abcdefghijklmnop`)

2. **Cấu hình MCP:**
   - Thêm project reference vào MCP configuration
   - Hoặc set environment variable: `SUPABASE_PROJECT_REF`

### Sau khi cấu hình, chạy:

```bash
# Migration sẽ được chạy tự động qua MCP tool
```

## Nội dung Migration

Migration sẽ thực hiện:

1. ✅ Thêm cột `is_template` (BOOLEAN) vào bảng `classrooms`
2. ✅ Tạo index `idx_classrooms_is_template` 
3. ✅ Tạo bảng `template_usage` với các trường:
   - `id` (UUID, Primary Key)
   - `template_id` (UUID, Foreign Key → classrooms.id)
   - `created_classroom_id` (UUID, Foreign Key → classrooms.id)
   - `created_by` (UUID, Foreign Key → users.id)
   - `created_at` (TIMESTAMP)
   - `notes` (TEXT)
4. ✅ Tạo các indexes cho `template_usage`
5. ✅ Thêm comments cho documentation

## Kiểm tra Migration đã chạy thành công

### Query kiểm tra:

```sql
-- Kiểm tra cột is_template đã được thêm chưa
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'classrooms' AND column_name = 'is_template';

-- Kiểm tra bảng template_usage đã được tạo chưa
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'template_usage';

-- Kiểm tra indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('classrooms', 'template_usage');
```

### Kết quả mong đợi:

1. Cột `is_template` có trong bảng `classrooms` với:
   - `data_type`: boolean
   - `column_default`: false

2. Bảng `template_usage` đã được tạo với đầy đủ các cột

3. Các indexes đã được tạo:
   - `idx_classrooms_is_template`
   - `idx_template_usage_template_id`
   - `idx_template_usage_created_classroom_id`
   - `idx_template_usage_created_by`

## Rollback (Nếu cần)

Nếu cần rollback migration:

```sql
-- Xóa bảng template_usage
DROP TABLE IF EXISTS template_usage CASCADE;

-- Xóa index
DROP INDEX IF EXISTS idx_classrooms_is_template;

-- Xóa cột is_template (CẨN THẬN: Chỉ làm nếu chắc chắn)
-- ALTER TABLE classrooms DROP COLUMN IF EXISTS is_template;
```

## Troubleshooting

### Lỗi: "column already exists"
- Migration đã được chạy trước đó
- Bỏ qua hoặc comment dòng `ADD COLUMN IF NOT EXISTS`

### Lỗi: "table already exists"
- Bảng `template_usage` đã tồn tại
- Migration đã được chạy trước đó

### Lỗi: "permission denied"
- Kiểm tra quyền của database user
- Đảm bảo user có quyền CREATE TABLE và ALTER TABLE

## Sau khi Migration thành công

1. ✅ Backend API đã sẵn sàng sử dụng
2. ✅ Frontend có thể tạo và quản lý template
3. ✅ Có thể tạo lớp học từ template

## Test Migration

Sau khi migration, test bằng cách:

```sql
-- Tạo template test
INSERT INTO classrooms (name, code, is_template) 
VALUES ('Test Template', 'Template0001', true)
RETURNING *;

-- Kiểm tra template_usage có hoạt động không
INSERT INTO template_usage (template_id, notes)
VALUES ((SELECT id FROM classrooms WHERE code = 'Template0001'), 'Test')
RETURNING *;

-- Cleanup test data
DELETE FROM template_usage WHERE notes = 'Test';
DELETE FROM classrooms WHERE code = 'Template0001';
```

