# Trạng Thái Migration Phase 1 qua MCP

## ⚠️ Vấn Đề Hiện Tại

**MCP Supabase không có quyền thực thi SQL trực tiếp** do hạn chế của access token. Lỗi:
```
Your account does not have the necessary privileges to access this endpoint
```

## ✅ Giải Pháp

### Cách 1: Chạy Thủ Công trong Supabase SQL Editor (Khuyến Nghị)

1. **Truy cập Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Chọn project: **School Management System** (ID: `okauzglpkrdatujkqczc`)

2. **Vào SQL Editor:**
   - Click **SQL Editor** (menu bên trái)
   - Click **New query**

3. **Chạy Migration:**
   - Mở file: `phase1_database_schema_optimized.sql`
   - Copy toàn bộ nội dung (255 dòng)
   - Paste vào SQL Editor
   - Click **Run** hoặc nhấn `Ctrl+Enter`

4. **Kiểm Tra Kết Quả:**
   - Xem kết quả ở phần dưới
   - Nếu có lỗi, sẽ hiển thị chi tiết

### Cách 2: Kiểm Tra Bằng Script Python

```bash
# Chạy script kiểm tra
python check_phase1_migration.py
```

Script sẽ:
- Kiểm tra các bảng đã được tạo chưa
- Đếm số records trong mỗi bảng
- Kiểm tra dữ liệu mặc định (roles, permissions, templates)

### Cách 3: Kiểm Tra Thủ Công trong SQL Editor

Chạy query này trong Supabase SQL Editor:

```sql
-- Kiểm tra các bảng Phase 1
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE columns.table_name = tables.table_name) as column_count
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

## 📊 Kết Quả Mong Đợi

Sau khi migration thành công, bạn sẽ có:

### Bảng (9 bảng):
- ✅ `roles` - Quản lý roles
- ✅ `permissions` - Danh sách permissions
- ✅ `role_permissions` - Mối quan hệ roles-permissions
- ✅ `user_roles` - Mối quan hệ users-roles
- ✅ `notifications` - Hệ thống thông báo
- ✅ `notification_templates` - Template thông báo
- ✅ `audit_logs` - Log audit
- ✅ `report_definitions` - Định nghĩa báo cáo
- ✅ `report_executions` - Lịch sử chạy báo cáo

### Dữ Liệu Mặc Định:
- ✅ 3 system roles: admin, teacher, student
- ✅ 27 permissions
- ✅ 27 role_permissions (admin có tất cả permissions)
- ✅ 4 notification templates
- ✅ 5 report definitions

### Indexes:
- ✅ 13 indexes cho performance

## 🔍 Kiểm Tra Chi Tiết

### Kiểm tra Roles:
```sql
SELECT * FROM roles;
```

### Kiểm tra Permissions:
```sql
SELECT module, COUNT(*) as count 
FROM permissions 
GROUP BY module 
ORDER BY module;
```

### Kiểm tra Role Permissions:
```sql
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name;
```

## 🐛 Nếu Gặp Lỗi

### Lỗi: "column does not exist"
- Chạy file `check_and_fix_notifications_table.sql` trước
- Sau đó chạy lại `phase1_database_schema_optimized.sql`

### Lỗi: "relation already exists"
- An toàn, script sẽ bỏ qua
- Kiểm tra xem bảng có đầy đủ columns chưa

### Lỗi: "permission denied"
- Đảm bảo đang dùng đúng project
- Kiểm tra quyền database user

## 📝 Ghi Chú

- File `phase1_database_schema_optimized.sql` đã được tối ưu
- Tất cả lệnh sử dụng `IF NOT EXISTS` nên an toàn
- Có thể chạy nhiều lần mà không bị lỗi
- Dữ liệu mặc định sử dụng `ON CONFLICT DO NOTHING`

## ✅ Sau Khi Migration Thành Công

1. **Test API Endpoints:**
   ```bash
   # Test roles API
   curl http://localhost:8000/api/roles/ \
     -H "Authorization: Bearer <token>"
   
   # Test notifications API
   curl http://localhost:8000/api/notifications/ \
     -H "Authorization: Bearer <token>"
   ```

2. **Kiểm tra trong Frontend:**
   - Truy cập `/admin/dashboard`
   - Kiểm tra các chức năng mới

