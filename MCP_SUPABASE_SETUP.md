# Cấu hình MCP Supabase để chạy Migration

## Vấn đề hiện tại

MCP Supabase tool báo lỗi: "Project reference in URL is not valid"

## Giải pháp

### Cách 1: Chạy Migration thủ công (Khuyến nghị)

Sử dụng file `run_template_migration.sql` hoặc `template_classrooms_schema.sql`:

1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung file SQL
3. Paste và chạy

Xem chi tiết trong file `RUN_TEMPLATE_MIGRATION.md`

### Cách 2: Cấu hình MCP Supabase

Để sử dụng MCP tool, bạn cần:

#### Bước 1: Lấy Project Reference

1. Vào Supabase Dashboard
2. Settings → General
3. Copy **Reference ID** (dạng: `abcdefghijklmnop`)

#### Bước 2: Cấu hình MCP

Tùy thuộc vào cách bạn cấu hình MCP:

**Option A: Environment Variable**
```bash
export SUPABASE_PROJECT_REF=your-project-ref-here
```

**Option B: MCP Configuration File**
Thêm vào file cấu hình MCP:
```json
{
  "supabase": {
    "project_ref": "your-project-ref-here",
    "access_token": "your-access-token"
  }
}
```

**Option C: Cursor Settings**
Nếu dùng Cursor, có thể cấu hình trong settings:
- Settings → MCP → Supabase
- Thêm project reference

#### Bước 3: Lấy Access Token (Nếu cần)

1. Vào Supabase Dashboard
2. Settings → Access Tokens
3. Tạo token mới hoặc sử dụng token hiện có

#### Bước 4: Test MCP Connection

Sau khi cấu hình, test bằng cách:
```bash
# List tables để kiểm tra kết nối
mcp_supabase_list_tables
```

## Sau khi cấu hình xong

Bạn có thể chạy migration bằng MCP tool:

```python
# Sử dụng apply_migration
mcp_supabase_apply_migration(
    name="add_template_classrooms_feature",
    query="<SQL content>"
)
```

## Lưu ý

- MCP Supabase cần project reference hợp lệ
- Cần quyền truy cập database (service_role key hoặc access token)
- Migration sẽ được track trong Supabase migrations

## Alternative: Sử dụng Supabase CLI

Nếu MCP không hoạt động, có thể dùng Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Create migration
supabase migration new add_template_classrooms

# Copy SQL vào file migration
# File location: supabase/migrations/xxxxx_add_template_classrooms.sql

# Apply migration
supabase db push
```

