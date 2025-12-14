# Hướng Dẫn Setup MCP Supabase

## 🚀 Quick Setup

### Bước 1: Tạo thư mục .cursor (nếu chưa có)
```bash
mkdir .cursor
```

### Bước 2: Copy file mẫu
```bash
# Windows
copy mcp.json.example .cursor\mcp.json

# Linux/Mac
cp mcp.json.example .cursor/mcp.json
```

### Bước 3: Lấy Supabase Access Token

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Vào **Account Settings** → **Access Tokens**
3. Click **Generate New Token**
4. Đặt tên: `School-Management-System-MCP`
5. Copy token (format: `sbp_...`)

### Bước 4: Lấy Project ID

1. Vào **Settings** → **General** trong Supabase Dashboard
2. Copy **Reference ID** (Project ID)

### Bước 5: Cập nhật file `.cursor/mcp.json`

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
        "sbp_YOUR_TOKEN_HERE"  ← Thay bằng token của bạn
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "your-project-id"  ← Thay bằng project ID
      }
    }
  }
}
```

### Bước 6: Restart Cursor

1. Đóng Cursor hoàn toàn
2. Mở lại Cursor
3. MCP sẽ tự động kết nối

## ✅ Kiểm Tra

Trong Cursor chat, thử:
```
List all tables in my Supabase database
```

Nếu AI có thể liệt kê các bảng, nghĩa là đã cấu hình thành công!

## 📚 Xem thêm

Chi tiết đầy đủ tại: [.cursor/MCP_SETUP_GUIDE.md](.cursor/MCP_SETUP_GUIDE.md)

