# Chạy Migration Phase 1 Qua MCP Supabase

## ⚠️ Lưu Ý Quan Trọng

**MCP Supabase hiện tại KHÔNG THỂ chạy migration** do access token không có quyền thực thi SQL.

## 🔧 Cách Sửa: Cập Nhật Access Token

### Bước 1: Lấy Service Role Key

1. Truy cập: https://supabase.com/dashboard
2. Chọn project: **School Management System**
3. Vào **Settings** → **API**
4. Tìm **service_role** key (⚠️ Bảo mật cao!)
5. Copy key (format: `sbp_...`)

### Bước 2: Cập Nhật MCP Config

Mở file: `c:\Users\Admin\.cursor\mcp.json`

**Thay đổi:**
```json
{
  "mcpServers": {
    "supabase-school-management": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_YOUR_SERVICE_ROLE_KEY_HERE"  ← Thay bằng service_role key
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "okauzglpkrdatujkqczc"
      }
    }
  }
}
```

### Bước 3: Restart Cursor

1. Đóng hoàn toàn Cursor
2. Mở lại Cursor
3. MCP sẽ tự động kết nối với token mới

### Bước 4: Chạy Migration

Sau khi restart, trong Cursor chat, yêu cầu:

```
Apply the migration from phase1_database_schema_optimized.sql to my Supabase school-management project
```

Hoặc:

```
Create all Phase 1 tables (roles, permissions, notifications, audit_logs, reports) in my Supabase database
```

## ✅ Kiểm Tra Sau Khi Chạy

Trong Cursor chat:
```
List all tables in my Supabase school-management project
```

Nếu thấy các bảng:
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `notifications`
- `notification_templates`
- `audit_logs`
- `report_definitions`
- `report_executions`

→ Migration đã thành công! ✅

## 🔐 Bảo Mật

⚠️ **QUAN TRỌNG:**
- Service Role Key có quyền **FULL ACCESS**
- **KHÔNG** commit file `mcp.json` vào Git
- File đã có trong `.gitignore` nhưng cần kiểm tra lại

## 🐛 Nếu Vẫn Lỗi

1. **Kiểm tra Project ID:**
   - Đảm bảo `okauzglpkrdatujkqczc` là đúng
   - Kiểm tra trong Supabase Dashboard → Settings → General

2. **Kiểm tra Token:**
   - Token phải bắt đầu bằng `sbp_`
   - Không có khoảng trắng
   - Copy đầy đủ

3. **Kiểm tra Quyền:**
   - Service Role Key phải có quyền "Full Access"
   - Không dùng anon key hoặc access token thông thường

## 📚 Tài Liệu Tham Khảo

- [Supabase Access Control](https://supabase.com/docs/guides/platform/access-control)
- [MCP Supabase Server](https://github.com/supabase/mcp-server-supabase)

