# Hướng Dẫn Chạy Phase 1 Migration

## ⚠️ Lưu Ý

MCP Supabase có thể không có quyền thực thi SQL trực tiếp. Vui lòng chạy migration thủ công trong Supabase SQL Editor.

## 📋 Các Bước Thực Hiện

### Bước 1: Truy cập Supabase SQL Editor

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project **School Management System** (Project ID: `okauzglpkrdatujkqczc`)
3. Vào **SQL Editor** (menu bên trái)
4. Click **New query**

### Bước 2: Chạy Migration

1. Mở file `phase1_database_schema_optimized.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** hoặc nhấn `Ctrl+Enter`

### Bước 3: Kiểm Tra Kết Quả

Sau khi chạy, kiểm tra:

```sql
-- Kiểm tra các bảng đã được tạo
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'roles', 
    'permissions', 
    'role_permissions', 
    'user_roles',
    'notifications',
    'notification_templates',
    'audit_logs',
    'report_definitions',
    'report_executions'
)
ORDER BY table_name;
```

### Bước 4: Kiểm Tra Dữ Liệu Mặc Định

```sql
-- Kiểm tra roles
SELECT * FROM roles;

-- Kiểm tra permissions
SELECT COUNT(*) as total_permissions FROM permissions;

-- Kiểm tra role_permissions
SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name;

-- Kiểm tra notification templates
SELECT * FROM notification_templates;

-- Kiểm tra report definitions
SELECT * FROM report_definitions;
```

## 🔧 Nếu Gặp Lỗi

### Lỗi: "column does not exist"
- Chạy file `check_and_fix_notifications_table.sql` trước
- Sau đó chạy lại `phase1_database_schema_optimized.sql`

### Lỗi: "relation already exists"
- Bảng đã tồn tại, script sẽ bỏ qua (an toàn)
- Kiểm tra xem bảng có đầy đủ columns chưa

### Lỗi: "permission denied"
- Đảm bảo bạn đang dùng đúng project
- Kiểm tra quyền truy cập database

## ✅ Sau Khi Migration Thành Công

1. **Kiểm tra indexes:**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

2. **Test API endpoints:**
- `GET /api/roles/` - Lấy danh sách roles
- `GET /api/roles/permissions` - Lấy danh sách permissions
- `GET /api/notifications/` - Lấy thông báo
- `GET /api/reports/definitions` - Lấy định nghĩa báo cáo

## 📝 Ghi Chú

- File `phase1_database_schema_optimized.sql` đã được tối ưu để xử lý cả trường hợp bảng đã tồn tại
- Tất cả các lệnh đều sử dụng `IF NOT EXISTS` nên an toàn khi chạy nhiều lần
- Dữ liệu mặc định sử dụng `ON CONFLICT DO NOTHING` nên không bị duplicate

