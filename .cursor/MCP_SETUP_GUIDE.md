# Hướng Dẫn Cấu Hình MCP Supabase cho Dự Án

File này hướng dẫn cách cấu hình MCP (Model Context Protocol) Supabase cho dự án School Management System.

## 📋 Tổng Quan

MCP Supabase cho phép Cursor AI truy cập trực tiếp vào Supabase project của bạn để:
- Xem và quản lý database schema
- Thực thi SQL queries
- Quản lý migrations
- Xem logs và metrics
- Quản lý projects và branches

## 🔑 Lấy Supabase Access Token

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn (School Management System)

### Bước 2: Tạo Access Token
1. Vào **Settings** → **Access Tokens** (hoặc **Account** → **Access Tokens`)
2. Click **Generate New Token**
3. Đặt tên token: `School-Management-System-MCP`
4. Chọn scope: **Full Access** (hoặc các quyền cần thiết)
5. Copy token (chỉ hiển thị 1 lần!)

### Bước 3: Lấy Project ID
1. Vào **Settings** → **General**
2. Copy **Reference ID** (Project ID)

## ⚙️ Cấu Hình File MCP

### File: `.cursor/mcp.json`

Mở file `.cursor/mcp.json` và thay thế:

```json
{
  "mcpServers": {
    "supabase-school-management": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_YOUR_ACTUAL_ACCESS_TOKEN_HERE"
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

**Thay thế:**
- `sbp_YOUR_ACTUAL_ACCESS_TOKEN_HERE` → Access token bạn vừa tạo
- `your-project-id-here` → Project ID của bạn (ví dụ: `okauzglpkrdatujkqczc`)

## 🔍 Kiểm Tra Cấu Hình

### Cách 1: Kiểm tra trong Cursor
1. Restart Cursor
2. Mở Command Palette (Ctrl+Shift+P)
3. Tìm "MCP" hoặc "Supabase"
4. Xem các commands có sẵn

### Cách 2: Test Connection
Trong Cursor chat, thử:
```
List all tables in my Supabase project
```

Nếu cấu hình đúng, AI sẽ có thể truy cập database của bạn.

## 📝 Ví Dụ Sử Dụng

Sau khi cấu hình, bạn có thể yêu cầu AI:

1. **Xem database schema:**
   ```
   Show me all tables in my Supabase database
   ```

2. **Thực thi SQL:**
   ```
   Run this SQL query: SELECT COUNT(*) FROM students
   ```

3. **Tạo migration:**
   ```
   Create a migration to add a new column to the teachers table
   ```

4. **Xem logs:**
   ```
   Show me recent API logs from my Supabase project
   ```

## 🔒 Bảo Mật

⚠️ **Lưu ý quan trọng:**
- Access token có quyền truy cập đầy đủ vào project
- **KHÔNG** commit file `.cursor/mcp.json` vào Git
- Thêm vào `.gitignore`:
  ```
  .cursor/mcp.json
  ```

## 🐛 Troubleshooting

### Lỗi: "Invalid access token"
- Kiểm tra lại token đã copy đúng chưa
- Đảm bảo token chưa hết hạn
- Tạo token mới nếu cần

### Lỗi: "Project not found"
- Kiểm tra Project ID đã đúng chưa
- Đảm bảo token có quyền truy cập project đó

### MCP không hoạt động
- Restart Cursor
- Kiểm tra file `.cursor/mcp.json` có đúng format JSON không
- Xem Cursor logs để biết lỗi chi tiết

## 📚 Tài Liệu Tham Khảo

- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [Cursor MCP Documentation](https://docs.cursor.com/mcp)
- [Supabase Dashboard](https://supabase.com/dashboard)

## 🔄 Cập Nhật

Nếu cần thay đổi token hoặc project:
1. Cập nhật file `.cursor/mcp.json`
2. Restart Cursor
3. Test lại connection

