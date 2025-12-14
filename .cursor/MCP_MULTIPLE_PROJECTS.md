# Cấu Hình Nhiều Supabase Projects trong MCP

## 📋 Tổng Quan

Bạn có thể cấu hình nhiều Supabase projects khác nhau trong cùng một file `mcp.json`. Mỗi project sẽ có:
- Tên server riêng (key trong `mcpServers`)
- Access token riêng
- Project ID riêng (tùy chọn)

## ⚙️ Cấu Trúc File

File `.cursor/mcp.json` sẽ có dạng:

```json
{
  "mcpServers": {
    "supabase-project-1": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_token_project_1"
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "project-id-1"
      }
    },
    "supabase-project-2": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_token_project_2"
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "project-id-2"
      }
    }
  }
}
```

## 🔑 Đặt Tên Server

Mỗi server cần có tên duy nhất (key). Ví dụ:
- `supabase` - Dự án đầu tiên
- `supabase-school-management` - Dự án School Management System
- `supabase-project-1` - Dự án số 1
- `supabase-project-2` - Dự án số 2

## 📝 Ví Dụ Cấu Hình 2 Projects

### Project 1: Dự án cũ
```json
"supabase": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    "sbp_9cc4ada61b0fe8d048cb3efe7b54023db238c36a"
  ]
}
```

### Project 2: School Management System
```json
"supabase-school-management": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    "sbp_f44f35e73c56d92751d66ddee90f3faae7c980f6"
  ],
  "env": {
    "SUPABASE_PROJECT_ID": "okauzglpkrdatujkqczc"
  }
}
```

## 🎯 Sử Dụng trong Cursor

Khi bạn yêu cầu AI làm việc với Supabase, AI sẽ tự động biết project nào cần dùng dựa trên context. Hoặc bạn có thể chỉ định rõ:

```
List tables in the school-management Supabase project
```

hoặc

```
Show me the schema of the first Supabase project
```

## ✅ Kiểm Tra

Sau khi cấu hình, restart Cursor và thử:

1. **Kiểm tra connection:**
   ```
   List all Supabase projects configured
   ```

2. **Test với project cụ thể:**
   ```
   Show me tables in the school-management project
   ```

## 🔒 Bảo Mật

⚠️ **Lưu ý:**
- File `.cursor/mcp.json` chứa access tokens nhạy cảm
- **KHÔNG** commit vào Git (đã có trong `.gitignore`)
- Mỗi project nên có access token riêng với quyền phù hợp

## 🐛 Troubleshooting

### Lỗi: "Duplicate server name"
- Đảm bảo mỗi server có tên (key) duy nhất
- Không được trùng tên trong `mcpServers`

### Lỗi: "Invalid JSON"
- Kiểm tra dấu phẩy (`,`) giữa các servers
- Đảm bảo đóng ngoặc đúng

### Một project không hoạt động
- Kiểm tra access token có đúng không
- Kiểm tra Project ID có đúng không
- Restart Cursor sau khi sửa

## 📚 Xem Thêm

- [MCP Setup Guide](MCP_SETUP_GUIDE.md) - Hướng dẫn cấu hình cơ bản
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)

