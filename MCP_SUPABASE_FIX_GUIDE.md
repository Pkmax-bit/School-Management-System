# Hướng Dẫn Sửa Lỗi MCP Supabase - Quyền Truy Cập

## ⚠️ Vấn Đề

Khi sử dụng MCP Supabase để chạy migration, gặp lỗi:
```
Your account does not have the necessary privileges to access this endpoint
```

## 🔍 Nguyên Nhân

Access token trong MCP không có quyền:
- ❌ Thực thi SQL (`execute_sql`)
- ❌ Apply migration (`apply_migration`)
- ✅ Chỉ có thể đọc thông tin (list tables, get project info)

## ✅ Giải Pháp

### Cách 1: Sử Dụng Service Role Key (Khuyến Nghị)

1. **Lấy Service Role Key:**
   - Truy cập: https://supabase.com/dashboard
   - Chọn project **School Management System**
   - Vào **Settings** → **API**
   - Copy **service_role** key (⚠️ Bảo mật cao, không share)

2. **Cập Nhật MCP Config:**
   - Mở file: `c:\Users\Admin\.cursor\mcp.json`
   - Thay access token bằng service_role key:
   ```json
   {
     "mcpServers": {
       "supabase-school-management": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server-supabase@latest",
           "--access-token",
           "sbp_YOUR_SERVICE_ROLE_KEY_HERE"
         ],
         "env": {
           "SUPABASE_PROJECT_ID": "okauzglpkrdatujkqczc"
         }
       }
     }
   }
   ```

3. **Restart Cursor:**
   - Đóng hoàn toàn Cursor
   - Mở lại Cursor
   - Thử lại migration

### Cách 2: Chạy Thủ Công trong Supabase SQL Editor

Nếu không muốn dùng service_role key (bảo mật hơn), chạy thủ công:

1. **Truy cập Supabase SQL Editor:**
   - https://supabase.com/dashboard
   - Chọn project
   - **SQL Editor** → **New query**

2. **Chạy Migration:**
   - Mở file: `phase1_database_schema_optimized.sql`
   - Copy toàn bộ (255 dòng)
   - Paste vào SQL Editor
   - Click **Run**

## 🔐 Bảo Mật Service Role Key

⚠️ **CẢNH BÁO:**
- Service Role Key có quyền **FULL ACCESS** vào database
- **KHÔNG** commit vào Git
- **KHÔNG** share với ai
- Chỉ dùng cho development/local

## 🧪 Kiểm Tra Quyền Token

Sau khi cập nhật token, test:

```python
# Test trong Cursor chat:
"List all tables in my Supabase school-management project"
```

Nếu thấy danh sách bảng, token đã hoạt động.

## 📝 Lưu Ý

- **Access Token** (sbp_...): Quyền hạn chế, chỉ đọc
- **Service Role Key**: Quyền đầy đủ, có thể thực thi SQL
- MCP Supabase mặc định dùng Access Token, cần đổi sang Service Role Key để chạy migration

## 🔄 Sau Khi Cập Nhật Token

1. Restart Cursor
2. Thử lại migration:
   ```
   Apply phase1_database_schema_optimized.sql to my Supabase project
   ```
3. Hoặc chạy từng phần:
   ```
   Create roles table in my Supabase database
   ```

