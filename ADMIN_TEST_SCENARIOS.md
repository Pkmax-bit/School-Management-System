# Kịch Bản Test Toàn Diện Cho Admin
## Comprehensive Admin Test Scenarios

Tài liệu này mô tả chi tiết tất cả các kịch bản test cho các chức năng Admin trong hệ thống quản lý trường học.

---

## 📋 Mục Lục

1. [Authentication - Xác thực](#1-authentication---xác-thực)
2. [Dashboard - Bảng điều khiển](#2-dashboard---bảng-điều-khiển)
3. [Teachers - Quản lý Giáo viên](#3-teachers---quản-lý-giáo-viên)
4. [Students - Quản lý Học sinh](#4-students---quản-lý-học-sinh)
5. [Subjects - Quản lý Môn học](#5-subjects---quản-lý-môn-học)
6. [Classrooms - Quản lý Lớp học](#6-classrooms---quản-lý-lớp-học)
7. [Campuses - Quản lý Cơ sở](#7-campuses---quản-lý-cơ-sở)
8. [Schedules - Quản lý Lịch học](#8-schedules---quản-lý-lịch-học)
9. [Finance - Quản lý Tài chính](#9-finance---quản-lý-tài-chính)
10. [Attendance - Quản lý Điểm danh](#10-attendance---quản-lý-điểm-danh)
11. [Assignments - Quản lý Bài tập](#11-assignments---quản-lý-bài-tập)
12. [Users - Quản lý Người dùng](#12-users---quản-lý-người-dùng)

---

## 1. Authentication - Xác thực

### 1.1. Đăng nhập Admin
**Mục đích:** Kiểm tra khả năng đăng nhập với tài khoản admin

**Test Case:**
- **Input:** 
  - Email: `admin@school.com`
  - Password: `password123`
- **Expected:** 
  - Status Code: `200`
  - Response chứa `access_token` hoặc `token`
  - Token được lưu vào headers cho các request tiếp theo

**API Endpoint:**
```
POST /api/auth/login
```

**Test Steps:**
1. Gửi POST request với email và password
2. Kiểm tra status code = 200
3. Lấy token từ response
4. Lưu token vào Authorization header

---

### 1.2. Lấy thông tin User hiện tại
**Mục đích:** Kiểm tra khả năng lấy thông tin user đang đăng nhập

**Test Case:**
- **Input:** Authorization header với Bearer token
- **Expected:** 
  - Status Code: `200`
  - Response chứa thông tin user
  - Role = `admin`

**API Endpoint:**
```
GET /api/auth/me
```

**Test Steps:**
1. Gửi GET request với Authorization header
2. Kiểm tra status code = 200
3. Kiểm tra role = "admin"

---

## 2. Dashboard - Bảng điều khiển

### 2.1. Lấy thống kê tổng quan
**Mục đích:** Kiểm tra khả năng lấy các thống kê cho dashboard

**Test Cases:**

#### 2.1.1. Thống kê Giáo viên
- **Endpoint:** `GET /api/teachers?limit=1000`
- **Expected:** Status 200, trả về danh sách giáo viên

#### 2.1.2. Thống kê Học sinh
- **Endpoint:** `GET /api/students?limit=1000`
- **Expected:** Status 200, trả về danh sách học sinh

#### 2.1.3. Thống kê Lớp học
- **Endpoint:** `GET /api/classrooms?limit=1000`
- **Expected:** Status 200, trả về danh sách lớp học

#### 2.1.4. Thống kê Môn học
- **Endpoint:** `GET /api/subjects?limit=1000`
- **Expected:** Status 200, trả về danh sách môn học

#### 2.1.5. Thống kê Cơ sở
- **Endpoint:** `GET /api/campuses?limit=1000`
- **Expected:** Status 200, trả về danh sách cơ sở

#### 2.1.6. Thống kê Tài chính
- **Endpoint:** `GET /api/finances/stats/summary`
- **Expected:** Status 200, trả về thống kê tài chính

#### 2.1.7. Thống kê Thanh toán
- **Endpoint:** `GET /api/payments?limit=1000`
- **Expected:** Status 200, trả về danh sách thanh toán

---

## 3. Teachers - Quản lý Giáo viên

### 3.1. Tạo Giáo viên mới
**Mục đích:** Kiểm tra khả năng tạo giáo viên mới

**Test Case:**
- **Input:**
```json
{
  "name": "Giáo viên Test",
  "email": "teacher_test@school.com",
  "password": "123456",
  "teacher_code": "GV123456",
  "phone": "0901234567",
  "address": "123 Đường Test",
  "specialization": "Toán học",
  "experience_years": "5"
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin giáo viên vừa tạo
  - Lưu `id` để dùng cho các test tiếp theo

**API Endpoint:**
```
POST /api/teachers/
```

---

### 3.2. Lấy danh sách Giáo viên
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả giáo viên

**Test Case:**
- **Input:** Authorization header
- **Expected:** 
  - Status Code: `200`
  - Response là array hoặc object chứa `data` array
  - Mỗi item có đầy đủ thông tin giáo viên

**API Endpoint:**
```
GET /api/teachers/
```

---

### 3.3. Cập nhật Giáo viên
**Mục đích:** Kiểm tra khả năng cập nhật thông tin giáo viên

**Test Case:**
- **Input:**
  - Teacher ID (từ test 3.1)
  - Update data:
```json
{
  "phone": "0909999999",
  "address": "456 Đường Mới",
  "specialization": "Vật lý"
}
```
- **Expected:** 
  - Status Code: `200`
  - Response chứa thông tin giáo viên đã cập nhật

**API Endpoint:**
```
PUT /api/teachers/{id}
```

---

### 3.4. Xóa Giáo viên
**Mục đích:** Kiểm tra khả năng xóa giáo viên

**Test Case:**
- **Input:** Teacher ID (từ test 3.1)
- **Expected:** 
  - Status Code: `200` hoặc `204`
  - Giáo viên đã bị xóa khỏi hệ thống

**API Endpoint:**
```
DELETE /api/teachers/{id}
```

---

## 4. Students - Quản lý Học sinh

### 4.1. Tạo Học sinh mới
**Mục đích:** Kiểm tra khả năng tạo học sinh mới

**Test Case:**
- **Input:**
```json
{
  "name": "Học sinh Test",
  "email": "student_test@school.com",
  "password": "123456",
  "student_code": "HS123456",
  "phone": "0907654321",
  "address": "789 Đường Học sinh",
  "date_of_birth": "2010-01-01",
  "parent_name": "Phụ huynh Test",
  "parent_phone": "0901111111"
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin học sinh vừa tạo

**API Endpoint:**
```
POST /api/students/
```

---

### 4.2. Lấy danh sách Học sinh
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả học sinh

**Test Case:**
- **Input:** Authorization header
- **Expected:** 
  - Status Code: `200`
  - Response là array hoặc object chứa `data` array

**API Endpoint:**
```
GET /api/students/
```

---

### 4.3. Cập nhật Học sinh
**Mục đích:** Kiểm tra khả năng cập nhật thông tin học sinh

**Test Case:**
- **Input:**
  - Student ID (từ test 4.1)
  - Update data:
```json
{
  "phone": "0908888888",
  "address": "999 Đường Cập nhật"
}
```
- **Expected:** Status Code: `200`

**API Endpoint:**
```
PUT /api/students/{id}
```

---

### 4.4. Xóa Học sinh
**Mục đích:** Kiểm tra khả năng xóa học sinh

**Test Case:**
- **Input:** Student ID (từ test 4.1)
- **Expected:** Status Code: `200` hoặc `204`

**API Endpoint:**
```
DELETE /api/students/{id}
```

---

## 5. Subjects - Quản lý Môn học

### 5.1. Tạo Môn học mới
**Mục đích:** Kiểm tra khả năng tạo môn học mới

**Test Case:**
- **Input:**
```json
{
  "name": "Môn học Test",
  "code": "MH123456",
  "description": "Môn học test tự động"
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin môn học vừa tạo

**API Endpoint:**
```
POST /api/subjects/
```

---

### 5.2. Lấy danh sách Môn học
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả môn học

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/subjects/
```

---

### 5.3. Cập nhật Môn học
**Mục đích:** Kiểm tra khả năng cập nhật thông tin môn học

**Test Case:**
- **Input:**
  - Subject ID (từ test 5.1)
  - Update data:
```json
{
  "description": "Mô tả đã cập nhật"
}
```
- **Expected:** Status Code: `200`

**API Endpoint:**
```
PUT /api/subjects/{id}
```

---

### 5.4. Xóa Môn học
**Mục đích:** Kiểm tra khả năng xóa môn học

**Test Case:**
- **Input:** Subject ID (từ test 5.1)
- **Expected:** Status Code: `200` hoặc `204`

**API Endpoint:**
```
DELETE /api/subjects/{id}
```

---

## 6. Classrooms - Quản lý Lớp học

### 6.1. Tạo Lớp học mới
**Mục đích:** Kiểm tra khả năng tạo lớp học mới

**Test Case:**
- **Input:**
```json
{
  "name": "Lớp Test",
  "code": "LOP123456",
  "description": "Lớp học test",
  "capacity": 30,
  "subject_id": "<subject_id>",
  "tuition_per_session": 50000,
  "sessions_per_week": 2
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin lớp học vừa tạo

**API Endpoint:**
```
POST /api/classrooms/
```

---

### 6.2. Lấy danh sách Lớp học
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả lớp học

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/classrooms/
```

---

### 6.3. Cập nhật Lớp học
**Mục đích:** Kiểm tra khả năng cập nhật thông tin lớp học

**Test Case:**
- **Input:**
  - Classroom ID (từ test 6.1)
  - Update data:
```json
{
  "capacity": 35,
  "description": "Mô tả đã cập nhật"
}
```
- **Expected:** Status Code: `200`

**API Endpoint:**
```
PUT /api/classrooms/{id}
```

---

### 6.4. Xóa Lớp học
**Mục đích:** Kiểm tra khả năng xóa lớp học

**Test Case:**
- **Input:** Classroom ID (từ test 6.1)
- **Expected:** Status Code: `200` hoặc `204`

**API Endpoint:**
```
DELETE /api/classrooms/{id}
```

---

## 7. Campuses - Quản lý Cơ sở

### 7.1. Tạo Cơ sở mới
**Mục đích:** Kiểm tra khả năng tạo cơ sở mới

**Test Case:**
- **Input:**
```json
{
  "name": "Cơ sở Test",
  "code": "CS123456",
  "address": "123 Đường Cơ sở",
  "phone": "0901234567"
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin cơ sở vừa tạo

**API Endpoint:**
```
POST /api/campuses/
```

---

### 7.2. Lấy danh sách Cơ sở
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả cơ sở

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/campuses/
```

---

## 8. Schedules - Quản lý Lịch học

### 8.1. Tạo Lịch học mới
**Mục đích:** Kiểm tra khả năng tạo lịch học mới

**Test Case:**
- **Input:**
```json
{
  "classroom_id": "<classroom_id>",
  "day_of_week": 1,
  "start_time": "08:00:00",
  "end_time": "09:30:00",
  "date": "2024-01-15"
}
```
- **Expected:** 
  - Status Code: `200` hoặc `201`
  - Response chứa thông tin lịch học vừa tạo

**API Endpoint:**
```
POST /api/schedules/
```

---

### 8.2. Lấy danh sách Lịch học
**Mục đích:** Kiểm tra khả năng lấy danh sách tất cả lịch học

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/schedules/
```

---

## 9. Finance - Quản lý Tài chính

### 9.1. Lấy thống kê Tài chính
**Mục đích:** Kiểm tra khả năng lấy thống kê tài chính

**Test Case:**
- **Input:** Authorization header
- **Expected:** 
  - Status Code: `200`
  - Response chứa các thống kê: income, expense, profit, etc.

**API Endpoint:**
```
GET /api/finances/stats/summary
```

---

### 9.2. Lấy danh sách Thanh toán
**Mục đích:** Kiểm tra khả năng lấy danh sách thanh toán

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/payments/
```

---

## 10. Attendance - Quản lý Điểm danh

### 10.1. Lấy danh sách Điểm danh
**Mục đích:** Kiểm tra khả năng lấy danh sách điểm danh

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/attendances/
```

---

## 11. Assignments - Quản lý Bài tập

### 11.1. Lấy danh sách Bài tập
**Mục đích:** Kiểm tra khả năng lấy danh sách bài tập

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/assignments/
```

---

## 12. Users - Quản lý Người dùng

### 12.1. Lấy danh sách Users
**Mục đích:** Kiểm tra khả năng lấy danh sách users

**Test Case:**
- **Input:** Authorization header
- **Expected:** Status Code: `200`

**API Endpoint:**
```
GET /api/users/
```

---

## 🚀 Cách Chạy Test

### Yêu cầu:
- Python 3.7+
- Thư viện: `requests`
- Backend server đang chạy tại `http://localhost:8000`
- Tài khoản admin: `admin@school.com` / `password123`

### Cài đặt:
```bash
pip install requests
```

### Chạy test:
```bash
# Chạy với thông tin đăng nhập mặc định
python test_admin_all_functions.py

# Chạy với thông tin đăng nhập tùy chỉnh
python test_admin_all_functions.py admin@school.com password123
```

### Kết quả:
Script sẽ:
1. Chạy tất cả các test case
2. Hiển thị kết quả từng test (✅ PASS / ❌ FAIL)
3. In tổng kết cuối cùng với:
   - Tổng số test
   - Số test passed
   - Số test failed
   - Tỷ lệ thành công
   - Chi tiết từng test

---

## 📊 Test Coverage

| Module | Create | Read | Update | Delete | Stats |
|--------|--------|------|--------|--------|-------|
| Authentication | ✅ | ✅ | - | - | - |
| Dashboard | - | ✅ | - | - | ✅ |
| Teachers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Students | ✅ | ✅ | ✅ | ✅ | - |
| Subjects | ✅ | ✅ | ✅ | ✅ | - |
| Classrooms | ✅ | ✅ | ✅ | ✅ | - |
| Campuses | ✅ | ✅ | - | - | - |
| Schedules | ✅ | ✅ | - | - | - |
| Finance | - | ✅ | - | - | ✅ |
| Attendance | - | ✅ | - | - | - |
| Assignments | - | ✅ | - | - | - |
| Users | - | ✅ | - | - | - |

---

## 🔍 Lưu Ý

1. **Dữ liệu Test:** Script sẽ tạo dữ liệu test và tự động dọn dẹp ở cuối
2. **Dependencies:** Một số test phụ thuộc vào dữ liệu từ test trước (ví dụ: tạo schedule cần classroom_id)
3. **Error Handling:** Script sẽ tiếp tục chạy ngay cả khi một số test fail
4. **Cleanup:** Các dữ liệu test sẽ được xóa ở phần cleanup cuối cùng

---

## 📝 Ghi Chú

- Tất cả các API endpoint đều yêu cầu authentication (Bearer token)
- Một số endpoint có thể yêu cầu role `admin`
- Script test có thể được mở rộng để test thêm các chức năng khác
- Có thể thêm test cases cho các edge cases và error handling

