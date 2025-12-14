# Sửa Project ID trong MCP Config

## ⚠️ Vấn Đề

Project ID trong MCP config (`okauzglpkrdatujkqczc`) **KHÔNG TỒN TẠI** trong danh sách projects của bạn.

## 📋 Projects Hiện Có

Từ MCP, tôi thấy bạn có 2 projects:

1. **Project 1:**
   - ID: `kuyktanrrizxtrfugphc`
   - Name: "backen-pixel's Project"
   - Status: **INACTIVE** ❌

2. **Project 2:**
   - ID: `mfmijckzlhevduwfigkl`
   - Name: "Department-botchat"
   - Status: **ACTIVE_HEALTHY** ✅

## ✅ Giải Pháp

### Option 1: Sử Dụng Project Đang Active

Nếu "Department-botchat" là project School Management System của bạn:

1. **Cập nhật file:** `c:\Users\Admin\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "supabase-school-management": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_YOUR_SERVICE_ROLE_KEY"
      ],
      "env": {
        "SUPABASE_PROJECT_ID": "mfmijckzlhevduwfigkl"  ← Đổi thành project ID này
      }
    }
  }
}
```

2. **Restart Cursor**

3. **Thử lại migration**

### Option 2: Tạo Project Mới

Nếu cần project riêng cho School Management System:

1. Truy cập: https://supabase.com/dashboard
2. **New Project**
3. Đặt tên: "School Management System"
4. Copy **Reference ID** mới
5. Cập nhật vào MCP config

### Option 3: Kiểm Tra Project ID Đúng

1. Truy cập: https://supabase.com/dashboard
2. Tìm project "School Management System"
3. Vào **Settings** → **General**
4. Copy **Reference ID**
5. So sánh với `okauzglpkrdatujkqczc`

## 🔍 Xác Định Project Đúng

Để biết project nào là School Management System:

1. Vào Supabase Dashboard
2. Xem tên project
3. Hoặc kiểm tra URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`

## 📝 Sau Khi Sửa

1. Restart Cursor
2. Test connection:
   ```
   List all tables in my Supabase school-management project
   ```
3. Nếu thành công, chạy migration:
   ```
   Apply phase1_database_schema_optimized.sql to my Supabase project
   ```

