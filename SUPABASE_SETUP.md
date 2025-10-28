# Hướng dẫn thiết lập Supabase

## 1. Tạo dự án Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/đăng nhập tài khoản
3. Tạo dự án mới với tên "School Management System"
4. Chọn region gần nhất (ví dụ: Singapore)

## 2. Cấu hình Database

1. Vào **SQL Editor** trong dashboard Supabase
2. Copy và paste nội dung file `supabase_schema.sql`
3. Chạy script để tạo các bảng và dữ liệu mẫu

## 3. Lấy thông tin kết nối

1. Vào **Settings** > **API**
2. Copy các giá trị sau:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_KEY)

## 4. Cấu hình Backend

1. Copy file `backend/env.example` thành `backend/.env`
2. Điền thông tin Supabase:

```env
SUPABASE_URL=your-project-url-here
SUPABASE_KEY=your-service-role-key-here
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 5. Cấu hình Frontend

1. Copy file `frontend/env.example` thành `frontend/.env.local`
2. Điền thông tin Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 6. Cài đặt dependencies

### Backend:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend:
```bash
cd frontend
npm install
```

## 7. Chạy ứng dụng

```bash
# Chạy cả backend và frontend
start.bat

# Hoặc chạy riêng lẻ:
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

## 8. Kiểm tra kết nối

1. Truy cập http://localhost:8000/docs để xem API documentation
2. Truy cập http://localhost:3000 để test frontend
3. Kiểm tra Supabase dashboard để xem dữ liệu

## 9. Tài khoản mẫu

Sau khi chạy script SQL, bạn có thể đăng nhập với:

- **Admin**: admin@school.com / password123
- **Teacher**: teacher1@school.com / password123  
- **Student**: student1@school.com / password123

## 10. Tính năng Supabase

- **Database**: PostgreSQL với real-time subscriptions
- **Authentication**: Built-in auth system (có thể sử dụng thay cho JWT)
- **Storage**: File upload cho assignments
- **Real-time**: Live updates cho notifications
- **Edge Functions**: Serverless functions cho business logic

## Troubleshooting

### Lỗi kết nối Supabase
- Kiểm tra URL và keys có đúng không
- Kiểm tra CORS settings trong Supabase
- Kiểm tra network connectivity

### Lỗi database
- Kiểm tra script SQL đã chạy thành công
- Kiểm tra RLS (Row Level Security) policies
- Kiểm tra permissions cho service role

### Lỗi authentication
- Kiểm tra JWT secret key
- Kiểm tra token expiration
- Kiểm tra user permissions
