# Hướng dẫn cấu hình Supabase

## Vấn đề hiện tại
- **Lỗi**: `Failed to fetch` khi gọi Supabase API
- **Nguyên nhân**: Supabase chưa được cấu hình hoặc environment variables chưa được set

## Các bước cấu hình Supabase

### 1. Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/đăng nhập tài khoản
3. Tạo project mới:
   - **Name**: School Management System
   - **Database Password**: Tạo password mạnh
   - **Region**: Chọn region gần nhất (Singapore cho Việt Nam)

### 2. Lấy thông tin cấu hình

Sau khi tạo project, lấy thông tin từ Supabase Dashboard:

1. **Project URL**:
   - Vào Settings → API
   - Copy "Project URL" (dạng: `https://your-project-id.supabase.co`)

2. **Anon Key**:
   - Cùng trang Settings → API
   - Copy "anon public" key

### 3. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục `frontend/`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Lưu ý**: Thay thế `your-project-id` và `your-anon-key-here` bằng giá trị thực từ Supabase.

### 4. Chạy Database Schema

1. Vào Supabase Dashboard → SQL Editor
2. Copy và paste nội dung file `supabase_schema.sql`
3. Chạy script để tạo tables và sample data

### 5. Kiểm tra cấu hình

Sau khi cấu hình xong:

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Truy cập `/subjects` page
3. Kiểm tra console logs:
   - `Supabase URL: https://your-project-id.supabase.co`
   - `Supabase Key exists: true`
   - `Successfully fetched subjects: 4`

## Troubleshooting

### Lỗi "Supabase configuration is missing"
- **Nguyên nhân**: Environment variables chưa được set
- **Giải pháp**: Kiểm tra file `.env.local` và restart server

### Lỗi "Cannot connect to Supabase"
- **Nguyên nhân**: Network hoặc URL không đúng
- **Giải pháp**: Kiểm tra internet connection và URL

### Lỗi "Authentication error"
- **Nguyên nhân**: Anon key không đúng
- **Giải pháp**: Kiểm tra lại anon key từ Supabase dashboard

### Lỗi "Failed to fetch"
- **Nguyên nhân**: CORS hoặc network issues
- **Giải pháp**: Kiểm tra Supabase project settings và network

## Sample Data

Khi Supabase chưa được cấu hình, ứng dụng sẽ hiển thị sample data:

```javascript
[
  {
    id: '1',
    name: 'Toán học',
    code: 'MATH',
    description: 'Môn toán học cơ bản',
    credits: 3
  },
  {
    id: '2', 
    name: 'Vật lý',
    code: 'PHYS',
    description: 'Môn vật lý cơ bản',
    credits: 2
  },
  {
    id: '3',
    name: 'Hóa học', 
    code: 'CHEM',
    description: 'Môn hóa học cơ bản',
    credits: 2
  },
  {
    id: '4',
    name: 'Tiếng Anh',
    code: 'ENG', 
    description: 'Môn tiếng Anh',
    credits: 2
  }
]
```

## Development vs Production

### Development
- Sử dụng sample data khi Supabase chưa cấu hình
- CRUD operations bị disable với thông báo rõ ràng
- Console logs chi tiết để debug

### Production
- Bắt buộc phải có Supabase configuration
- Tất cả operations sử dụng real database
- Error handling chuyên nghiệp

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use Row Level Security (RLS)** in production
3. **Validate all inputs** before database operations
4. **Use proper authentication** for admin operations

## Next Steps

Sau khi cấu hình Supabase thành công:

1. Test tất cả CRUD operations
2. Thêm Row Level Security policies
3. Cấu hình authentication với Supabase Auth
4. Deploy với production environment variables
