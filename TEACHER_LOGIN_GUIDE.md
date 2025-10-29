# Hướng dẫn đăng nhập Teacher Dashboard

## Tóm tắt
Đã tạo thành công trang **Teacher Dashboard** và cấu hình authentication cho role teacher.

## Những gì đã thực hiện

### 1. Cập nhật Authentication Flow
- ✅ Cập nhật `frontend/src/lib/auth.ts` để redirect teacher đến `/teacher/dashboard`
- ✅ Tạo trang `frontend/src/app/teacher/dashboard/page.tsx`
- ✅ Tạo component `frontend/src/components/TeacherDashboard.tsx`

### 2. Cấu trúc Teacher Dashboard

Teacher Dashboard bao gồm các phần:
- **Header**: Chào mừng giáo viên
- **Statistics Cards**: 
  - Tổng lớp học
  - Tổng học sinh
  - Bài tập chờ chấm
  - Lịch dạy tuần này
- **Quick Actions**:
  - Quản lý lớp học
  - Quản lý bài tập
  - Xem lịch dạy
- **Today's Schedule**: Lịch dạy hôm nay
- **Pending Assignments**: Bài tập cần chấm
- **Student Performance**: Thành tích học sinh

### 3. Routing Flow

```
Login as teacher → /dashboard → Auto redirect → /teacher/dashboard
```

## Cách sử dụng

### Bước 1: Khởi động Backend và Frontend

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Bước 2: Tạo Teacher User

#### Cách 1: Sử dụng Test HTML (Đơn giản nhất)

1. Mở file `test_teacher_login.html` trong trình duyệt
2. Click nút "Register Teacher" để tạo tài khoản teacher
3. Click nút "Login as Teacher" để đăng nhập

#### Cách 2: Sử dụng API trực tiếp

**Đăng ký teacher:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "teacher123",
    "full_name": "Nguyen Van Giao",
    "role": "teacher"
  }'
```

**Đăng nhập:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "teacher123"
  }'
```

### Bước 3: Truy cập Teacher Dashboard

1. Mở trình duyệt và truy cập: `http://localhost:3000/login`
2. Đăng nhập với:
   - Email: `teacher@school.com`
   - Password: `teacher123`
3. Sau khi đăng nhập thành công, hệ thống sẽ tự động redirect đến `/teacher/dashboard`

## Thông tin đăng nhập mặc định

### Teacher Account
- **Email**: `teacher@school.com`
- **Password**: `teacher123`
- **Role**: `teacher`
- **Full Name**: `Nguyen Van Giao`

### Admin Account (nếu cần)
- **Email**: `admin@school.com`
- **Password**: `admin123`
- **Role**: `admin`

### Student Account (nếu cần)
- **Email**: `student@school.com`
- **Password**: `student123`
- **Role**: `student`

## Troubleshooting

### Lỗi: "Email already registered"
- User đã tồn tại trong database
- Bạn có thể đăng nhập trực tiếp với thông tin đã có

### Lỗi: "Could not connect to backend"
- Kiểm tra backend đang chạy tại `http://localhost:8000`
- Chạy lệnh: `cd backend && python -m uvicorn main:app --reload`

### Lỗi: "Incorrect email or password"
- Kiểm tra lại email và password
- Đảm bảo đã đăng ký user trước

### Dashboard không hiển thị đúng
- Kiểm tra role trong localStorage: mở DevTools → Application → localStorage
- Xóa localStorage và đăng nhập lại

## Files đã tạo/chỉnh sửa

### Đã tạo mới:
1. `frontend/src/app/teacher/dashboard/page.tsx` - Teacher dashboard page
2. `frontend/src/components/TeacherDashboard.tsx` - Teacher dashboard component
3. `test_teacher_login.html` - HTML test tool
4. `TEACHER_LOGIN_GUIDE.md` - Hướng dẫn này

### Đã chỉnh sửa:
1. `frontend/src/lib/auth.ts` - Cập nhật redirect path cho teacher

## Các tính năng trong Teacher Dashboard

### Đã triển khai:
- ✅ Authentication và authorization
- ✅ Role-based routing
- ✅ Dashboard layout với statistics
- ✅ Quick action cards
- ✅ Navigation menu

### Chưa kết nối data (hiển thị "--"):
- ⏳ Lớp học của giáo viên
- ⏳ Số lượng học sinh
- ⏳ Bài tập chờ chấm
- ⏳ Lịch dạy thực tế
- ⏳ Thống kê chi tiết

## Next Steps

Để hoàn thiện Teacher Dashboard, cần:

1. **Kết nối API để lấy dữ liệu thực**:
   - Lấy danh sách lớp học của giáo viên
   - Lấy số lượng học sinh
   - Lấy bài tập chưa chấm
   - Lấy lịch dạy hôm nay

2. **Thêm tính năng quản lý**:
   - Xem và quản lý lớp học
   - Tạo và chấm bài tập
   - Điểm danh học sinh
   - Xem lịch dạy chi tiết

3. **Cải thiện UI/UX**:
   - Thêm charts và graphs
   - Responsive design
   - Loading states
   - Error handling

## Kết luận

Teacher Dashboard đã được thiết lập thành công và sẵn sàng sử dụng. Bạn có thể:
- ✅ Đăng nhập với role teacher
- ✅ Truy cập trang dashboard riêng
- ✅ Xem giao diện teacher dashboard

Sử dụng file `test_teacher_login.html` để test nhanh chức năng đăng ký và đăng nhập!

