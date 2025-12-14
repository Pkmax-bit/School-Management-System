# Troubleshooting MCP Supabase - Lỗi Quyền Truy Cập

## ⚠️ Vấn Đề Hiện Tại

Sau khi cập nhật token, vẫn gặp lỗi:
```
Your account does not have the necessary privileges to access this endpoint
```

## 🔍 Kiểm Tra

### 1. Kiểm Tra Token Đã Đúng Chưa

**Service Role Key phải:**
- Bắt đầu bằng `sbp_` (không phải `eyJ...` - đó là JWT token)
- Có độ dài khoảng 40-50 ký tự sau `sbp_`
- Ví dụ: `sbp_1234567890abcdef1234567890abcdef12345678`

**KHÔNG phải:**
- ❌ Anon key (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
- ❌ Access token thông thường
- ❌ JWT token

### 2. Kiểm Tra File MCP Config

File: `c:\Users\Admin\.cursor\mcp.json`

**Phải có cấu trúc:**
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
        "SUPABASE_PROJECT_ID": "okauzglpkrdatujkqczc"
      }
    }
  }
}
```

### 3. Kiểm Tra Project ID

Project ID phải đúng:
- Vào Supabase Dashboard
- Settings → General
- Copy **Reference ID**
- So sánh với `okauzglpkrdatujkqczc`

## 🔧 Các Bước Sửa

### Bước 1: Lấy Service Role Key Đúng

1. Truy cập: https://supabase.com/dashboard
2. Chọn project **School Management System**
3. Vào **Settings** → **API**
4. Tìm phần **Project API keys**
5. Copy **service_role** key (⚠️ Bảo mật!)
   - Không phải "anon" key
   - Không phải "service_role" secret (JWT)
   - Phải là **Access Token** với format `sbp_...`

### Bước 2: Tạo Access Token Mới (Nếu Cần)

Nếu không thấy service_role access token:

1. Vào **Account Settings** (icon user góc trên phải)
2. **Access Tokens**
3. **Generate New Token**
4. Đặt tên: `School-Management-MCP-Service`
5. Chọn scope: **Full Access** hoặc **Database Admin**
6. Copy token (chỉ hiển thị 1 lần!)

### Bước 3: Cập Nhật MCP Config

1. Mở: `c:\Users\Admin\.cursor\mcp.json`
2. Thay token trong `supabase-school-management`
3. Lưu file
4. **QUAN TRỌNG:** Đóng hoàn toàn Cursor và mở lại

### Bước 4: Test Connection

Sau khi restart Cursor, trong chat thử:
```
List all tables in my Supabase school-management project
```

Nếu thấy danh sách bảng → Token đã hoạt động ✅

## 🎯 Giải Pháp Thay Thế

Nếu vẫn không được, **chạy migration thủ công** trong Supabase SQL Editor:

1. Truy cập: https://supabase.com/dashboard
2. Chọn project → **SQL Editor**
3. Copy file `phase1_database_schema_optimized.sql`
4. Paste và Run

Đây là cách **an toàn và đáng tin cậy nhất**.

## 📝 Ghi Chú

- MCP Supabase có thể có hạn chế về quyền
- Service Role Key rất nhạy cảm, không share
- Nếu không cần thiết, chạy thủ công trong SQL Editor là tốt nhất

