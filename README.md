# School Management System

Hệ thống quản lý trường học với FastAPI backend và Next.js frontend.

## Tính năng

### Admin
- Quản lý giáo viên, học sinh, môn học, lớp học
- Quản lý thời khóa biểu
- Quản lý tài chính
- Xem báo cáo tổng quan

### Giáo viên
- Quản lý lớp học được phân công
- Quản lý học sinh trong lớp
- Giao bài tập (trắc nghiệm, tự luận)
- Điểm danh học sinh
- Xem lịch dạy

### Học sinh
- Xem lịch học
- Làm bài tập trắc nghiệm
- Nộp bài tập tự luận
- Xem kết quả bài tập

## Công nghệ sử dụng

### Backend
- FastAPI
- Supabase (PostgreSQL)
- JWT Authentication
- Pydantic

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React
- Supabase Client
- Axios

### Database
- Supabase (PostgreSQL)
- Real-time subscriptions
- Built-in authentication
- Row Level Security (RLS)

## Cài đặt

### 1. Thiết lập Supabase

Xem hướng dẫn chi tiết trong file [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 2. Backend

1. Tạo virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

3. Cấu hình Supabase:
```bash
copy env.example .env
# Điền thông tin Supabase vào .env
```

4. Chạy server:
```bash
python -m uvicorn main:app --reload
```

### 3. Frontend

1. Cài đặt dependencies:
```bash
cd frontend
npm install
```

2. Cấu hình Supabase:
```bash
copy env.example .env.local
# Điền thông tin Supabase vào .env.local
```

3. Chạy development server:
```bash
npm run dev
```

## Sử dụng

1. Chạy `start.bat` để khởi động cả backend và frontend
2. Truy cập http://localhost:3000
3. Đăng ký tài khoản mới hoặc đăng nhập

## API Documentation

Backend API có sẵn tại: http://localhost:8000/docs

## Cấu trúc dự án

```
School-Management-System/
├── backend/
│   ├── models/          # Database models
│   ├── routers/         # API routes
│   ├── main.py          # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities
│   │   └── types/       # TypeScript types
│   └── package.json
└── start.bat            # Start script
```

## Phân quyền

- **Admin**: Toàn quyền quản lý hệ thống
- **Giáo viên**: Quản lý lớp học, học sinh, giao bài tập
- **Học sinh**: Làm bài tập, xem lịch học

## Database Schema

- Users: Thông tin người dùng
- Teachers: Thông tin giáo viên
- Students: Thông tin học sinh
- Subjects: Môn học
- Classrooms: Lớp học
- Schedules: Thời khóa biểu
- Assignments: Bài tập
- AssignmentQuestions: Câu hỏi
- AssignmentSubmissions: Bài nộp
- Attendances: Điểm danh
- Finances: Tài chính
