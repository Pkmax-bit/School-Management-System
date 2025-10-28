# Hướng dẫn cấu hình Environment Variables

## Vấn đề hiện tại
Bạn đã có Supabase configuration nhưng tên biến environment không đúng format cho Next.js.

## Cấu hình hiện tại của bạn
```
SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
SUPABASE_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_ANON_KEY=...
```

## Cấu hình cần thiết cho Next.js

### 1. Tạo file `.env.local` trong thư mục `frontend/`

```bash
# Supabase Configuration (cho Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Lấy SUPABASE_ANON_KEY từ Supabase Dashboard

1. Truy cập [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **anon public** key
5. Paste vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Restart Development Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại
npm run dev
```

## Tại sao cần NEXT_PUBLIC_ prefix?

- **NEXT_PUBLIC_**: Biến này sẽ được expose ra client-side
- **Không có prefix**: Chỉ accessible ở server-side
- **Supabase client**: Cần chạy ở browser, nên cần NEXT_PUBLIC_

## Kiểm tra cấu hình

Sau khi cấu hình xong, kiểm tra console logs:

```javascript
// Sẽ thấy:
Supabase URL: https://okauzglpkrdatujkqczc.supabase.co
Supabase Key exists: true
Successfully fetched subjects: [số lượng]
```

## Troubleshooting

### Lỗi "Supabase configuration is missing"
- **Nguyên nhân**: Environment variables chưa được set đúng
- **Giải pháp**: Kiểm tra file `.env.local` và restart server

### Lỗi "Cannot connect to Supabase"
- **Nguyên nhân**: URL hoặc key không đúng
- **Giải pháp**: Kiểm tra lại URL và anon key từ Supabase dashboard

### Lỗi "Authentication error"
- **Nguyên nhân**: Anon key không đúng
- **Giải pháp**: Lấy lại anon key từ Supabase dashboard

## Database Schema

Đảm bảo đã chạy database schema trong Supabase:

1. Vào Supabase Dashboard → **SQL Editor**
2. Copy nội dung file `supabase_schema.sql`
3. Chạy script để tạo tables và sample data

## Sample Data

Sau khi cấu hình đúng, bạn sẽ thấy 4 môn học mẫu:
- Toán học (MATH)
- Vật lý (PHYS) 
- Hóa học (CHEM)
- Tiếng Anh (ENG)

## Next Steps

1. **Cấu hình environment variables** theo hướng dẫn trên
2. **Restart development server**
3. **Kiểm tra console logs** để verify connection
4. **Test CRUD operations** trên subjects page
5. **Thêm dữ liệu thực** thay vì sample data

## Lưu ý bảo mật

- **Never commit `.env.local`** to version control
- **Use Row Level Security (RLS)** trong production
- **Validate inputs** trước khi gửi lên database
- **Use proper authentication** cho admin operations
