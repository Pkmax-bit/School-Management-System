# 📋 Tóm Tắt Chức Năng Của Các Roles
## Roles Functions Summary - School Management System

**Ngày cập nhật**: 2025-01-14  
**Hệ thống**: School Management System

---

## 🎯 TỔNG QUAN ROLES

Hệ thống hiện tại có **3 roles chính** cho School Management System:

| Role | Tên Tiếng Việt | Mô Tả | Quyền Hạn |
|------|----------------|-------|-----------|
| **admin** | Quản trị viên | Quản lý toàn bộ hệ thống | Toàn quyền |
| **teacher** | Giáo viên | Quản lý lớp học, bài tập, điểm danh | Quyền giáo viên |
| **student** | Học sinh | Xem thông tin, nộp bài tập | Quyền học sinh |

---

## 👨‍💼 1. ADMIN (Quản trị viên)

### 📊 Dashboard & Thống Kê
- ✅ Xem dashboard tổng quan
- ✅ Thống kê số lượng giáo viên, học sinh, lớp học
- ✅ Thống kê tài chính, thanh toán
- ✅ Xem báo cáo tổng hợp
- ✅ Xem audit logs

### 👥 Quản Lý Người Dùng
- ✅ **Quản lý Giáo viên** (`/api/teachers`)
  - Tạo, sửa, xóa giáo viên
  - Xem danh sách giáo viên
  - Tìm kiếm giáo viên
  - Xem thống kê giáo viên
  
- ✅ **Quản lý Học sinh** (`/api/students`)
  - Tạo, sửa, xóa học sinh
  - Xem danh sách học sinh
  - Xem thống kê học sinh
  - Gán học sinh vào lớp học
  
- ✅ **Quản lý Users** (`/api/users`)
  - Xem danh sách users
  - Sửa thông tin user
  - Xóa user
  - Quản lý roles và permissions

### 📚 Quản Lý Học Tập
- ✅ **Quản lý Môn học** (`/api/subjects`)
  - Tạo, sửa, xóa môn học
  - Xem danh sách môn học
  - Tìm kiếm môn học
  
- ✅ **Quản lý Lớp học** (`/api/classrooms`)
  - Tạo, sửa, xóa lớp học
  - Xem danh sách lớp học
  - Gán học sinh vào lớp
  - Tạo mã lớp tự động
  
- ✅ **Quản lý Lịch học** (`/api/schedules`)
  - Tạo, sửa, xóa lịch học
  - Xem danh sách lịch học
  - Quản lý thời khóa biểu

### 📝 Quản Lý Bài Tập & Điểm Danh
- ✅ **Quản lý Bài tập** (`/api/assignments`)
  - Tạo, sửa, xóa bài tập
  - Gán bài tập cho lớp học
  - Quản lý câu hỏi bài tập
  - Chấm điểm bài tập
  - Xem thống kê bài tập
  
- ✅ **Quản lý Điểm danh** (`/api/attendances`)
  - Xem danh sách điểm danh
  - Tạo, sửa, xóa điểm danh
  - Xem thống kê điểm danh

### 💰 Quản Lý Tài Chính
- ✅ **Quản lý Tài chính** (`/api/finances`)
  - Tạo, sửa, xóa giao dịch tài chính
  - Xem danh sách thu chi
  - Xem thống kê tài chính
  
- ✅ **Quản lý Thanh toán** (`/api/payments`)
  - Tạo, sửa, xóa thanh toán
  - Xem danh sách thanh toán
  - Xem tổng hợp thanh toán theo lớp
  
- ✅ **Quản lý Danh mục Chi phí** (`/api/expense-categories`)
  - Tạo, sửa, xóa danh mục chi phí
  - Xem danh sách danh mục

### 🏢 Quản Lý Cơ Sở Hạ Tầng
- ✅ **Quản lý Cơ sở** (`/api/campuses`)
  - Tạo, sửa, xóa cơ sở
  - Xem danh sách cơ sở
  
- ✅ **Quản lý Phòng học** (`/api/rooms`)
  - Tạo, sửa, xóa phòng học
  - Xem danh sách phòng học

### 📊 Báo Cáo & Phân Tích
- ✅ **Báo cáo** (`/api/reports`)
  - Báo cáo kết quả học tập học sinh
  - Báo cáo kết quả lớp học
  - Báo cáo tổng hợp giáo viên
  - Báo cáo tài chính
  - Báo cáo điểm danh

### 🔐 Quản Lý Phân Quyền
- ✅ **Quản lý Roles** (`/api/roles`)
  - Xem danh sách roles
  - Tạo, sửa, xóa roles
  - Gán permissions cho roles
  - Gán roles cho users
  
- ✅ **Quản lý Permissions** (`/api/roles/permissions`)
  - Xem danh sách permissions
  - Filter permissions theo module

### 🔔 Quản Lý Thông Báo
- ✅ **Quản lý Notifications** (`/api/notifications`)
  - Xem danh sách thông báo
  - Tạo thông báo mới
  - Gửi thông báo cho users/roles/classrooms
  - Quản lý templates thông báo
  - Đánh dấu đã đọc

### 📋 Audit Logs
- ✅ **Xem Audit Logs** (`/api/audit-logs`)
  - Xem lịch sử hoạt động
  - Xem thống kê audit logs
  - Xóa audit logs

### 📚 Quản Lý Bài Học
- ✅ **Quản lý Lessons** (`/api/lessons`)
  - Tạo, sửa, xóa bài học
  - Upload file bài học
  - Copy bài học
  - Quản lý files bài học
  - Xem bài học theo lớp

---

## 👨‍🏫 2. TEACHER (Giáo viên)

### 📊 Dashboard
- ✅ Xem dashboard giáo viên
- ✅ Xem thống kê lớp học của mình
- ✅ Xem thông báo

### 🏫 Quản Lý Lớp Học
- ✅ **Xem Lớp học của tôi**
  - Xem danh sách lớp học được phân công
  - Xem thông tin chi tiết lớp học
  - Xem danh sách học sinh trong lớp
  
- ✅ **Quản lý Lớp học** (`/api/classrooms`)
  - Xem thông tin lớp học (read-only)

### 📝 Quản Lý Bài Tập
- ✅ **Quản lý Bài tập** (`/api/assignments`)
  - Tạo bài tập mới
  - Sửa bài tập của mình
  - Xóa bài tập của mình
  - Gán bài tập cho lớp học
  - Tạo câu hỏi bài tập
  - Chấm điểm bài tập
  - Xem submissions của học sinh
  - Xem thống kê bài tập
  
- ✅ **Xem Bài tập** (`/api/assignments`)
  - Xem danh sách bài tập
  - Xem chi tiết bài tập

### 📅 Quản Lý Lịch Dạy
- ✅ **Lịch dạy** (`/api/schedules`)
  - Xem lịch dạy của mình
  - Xem thời khóa biểu
  - Xem chi tiết lịch học

### ✅ Điểm Danh
- ✅ **Điểm danh học sinh** (`/api/attendances`)
  - Tạo điểm danh cho lớp học
  - Sửa điểm danh
  - Xem danh sách điểm danh
  - Xem thống kê điểm danh
  
- ✅ **Xác nhận lớp dạy**
  - Xác nhận đã dạy xong
  - Ghi chú về lớp học
  - Upload tài liệu lớp học

### 🎓 Chấm Điểm
- ✅ **Chấm điểm bài tập**
  - Chấm điểm submissions
  - Nhập điểm cho học sinh
  - Xem tổng hợp điểm
  
- ✅ **Xem Kết quả học tập**
  - Xem điểm tổng hợp của học sinh
  - Xem điểm tổng hợp của lớp học

### 📚 Quản Lý Bài Học
- ✅ **Quản lý Bài học** (`/api/lessons`)
  - Tạo bài học mới
  - Sửa bài học
  - Xóa bài học
  - Upload file bài học
  - Copy bài học
  - Quản lý files bài học
  - Bắt đầu bài học
  - Xem bài học theo lớp

### 👥 Quản Lý Học Sinh
- ✅ **Xem Học sinh** (`/api/students`)
  - Xem danh sách học sinh trong lớp
  - Xem thông tin chi tiết học sinh
  - Xem thống kê học sinh

### 📊 Báo Cáo
- ✅ **Xem Báo cáo** (`/api/reports`)
  - Báo cáo kết quả học tập học sinh
  - Báo cáo kết quả lớp học
  - Báo cáo tổng hợp giáo viên

### 🔔 Thông Báo
- ✅ **Xem Thông báo** (`/api/notifications`)
  - Xem danh sách thông báo
  - Đánh dấu đã đọc
  - Xem số thông báo chưa đọc

---

## 🎓 3. STUDENT (Học sinh)

### 📊 Dashboard
- ✅ Xem dashboard học sinh
- ✅ Xem thông báo
- ✅ Xem lịch học

### 📝 Quản Lý Bài Tập
- ✅ **Xem Bài tập** (`/api/assignments`)
  - Xem danh sách bài tập được giao
  - Xem chi tiết bài tập
  - Xem câu hỏi bài tập
  
- ✅ **Nộp Bài tập** (`/api/assignments/{id}/submit`)
  - Nộp bài tập
  - Xem kết quả chấm điểm
  - Xem điểm số

### 📅 Lịch Học
- ✅ **Xem Lịch học** (`/api/schedules`)
  - Xem lịch học của mình
  - Xem thời khóa biểu
  - Xem chi tiết lịch học

### ✅ Điểm Danh
- ✅ **Xem Điểm danh** (`/api/attendances`)
  - Xem lịch sử điểm danh của mình
  - Xem thống kê điểm danh

### 🎓 Kết Quả Học Tập
- ✅ **Xem Điểm số** (`/api/assignments/students/{id}/grade-summary`)
  - Xem điểm tổng hợp
  - Xem điểm từng bài tập
  - Xem điểm trung bình

### 📚 Tài Liệu
- ✅ **Xem Tài liệu** (`/api/lessons`)
  - Xem bài học
  - Xem files bài học
  - Download tài liệu

### 🔔 Thông Báo
- ✅ **Xem Thông báo** (`/api/notifications`)
  - Xem danh sách thông báo
  - Đánh dấu đã đọc
  - Xem số thông báo chưa đọc

---

## 🔐 ROLES TRONG DATABASE (Chưa được sử dụng)

Hệ thống có các roles sau trong database nhưng chưa được tích hợp vào School Management System:

| Role | Tên Tiếng Việt | Mô Tả | Trạng Thái |
|------|----------------|-------|------------|
| **accountant** | Kế toán | Quản lý tài chính và báo cáo | ⚠️ Chưa tích hợp |
| **customer** | Khách hàng | Khách hàng sử dụng hệ thống | ⚠️ Chưa tích hợp |
| **employee** | Nhân viên | Nhân viên thông thường | ⚠️ Chưa tích hợp |
| **sales** | Nhân viên bán hàng | Quản lý bán hàng và khách hàng | ⚠️ Chưa tích hợp |
| **Supplier** | Nhà cung cấp | Quản lý công việc tại xưởng | ⚠️ Chưa tích hợp |
| **transport** | Nhân viên vận chuyển | Quản lý vận chuyển | ⚠️ Chưa tích hợp |
| **worker** | Công nhân | Công nhân thực hiện công việc | ⚠️ Chưa tích hợp |

---

## 📋 PERMISSIONS HIỆN CÓ

Hệ thống có các permissions sau (chưa được gán cho roles):

### Equipment (Thiết bị)
- `equipment_view` - Xem thiết bị/vật tư
- `equipment_edit` - Quản lý thiết bị/vật tư
- `equipment_approve` - Phê duyệt yêu cầu

### Finance (Tài chính)
- `finance_view` - Xem tài chính
- `finance_edit` - Quản lý tài chính
- `finance_approve` - Phê duyệt tài chính

### Project (Dự án)
- `project_view` - Xem dự án
- `project_create` - Tạo dự án mới
- `project_edit` - Chỉnh sửa dự án
- `project_delete` - Xóa dự án

### Report (Báo cáo)
- `report_view` - Xem báo cáo
- `report_create` - Tạo báo cáo

### Task (Công việc)
- `task_view` - Xem công việc
- `task_edit` - Quản lý công việc
- `task_assign` - Phân công công việc

### Team (Đội nhóm)
- `team_view` - Xem thành viên
- `team_edit` - Quản lý team

---

## 📊 SO SÁNH QUYỀN HẠN

| Chức Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| **Quản lý Users** | ✅ Full | ❌ | ❌ |
| **Quản lý Giáo viên** | ✅ Full | ❌ | ❌ |
| **Quản lý Học sinh** | ✅ Full | 👁️ View only | 👁️ View own |
| **Quản lý Lớp học** | ✅ Full | 👁️ View assigned | 👁️ View own |
| **Quản lý Môn học** | ✅ Full | 👁️ View | 👁️ View |
| **Quản lý Lịch học** | ✅ Full | 👁️ View own | 👁️ View own |
| **Tạo Bài tập** | ✅ Full | ✅ Own | ❌ |
| **Nộp Bài tập** | ✅ Full | ❌ | ✅ Own |
| **Chấm điểm** | ✅ Full | ✅ Own classes | ❌ |
| **Điểm danh** | ✅ Full | ✅ Own classes | 👁️ View own |
| **Quản lý Tài chính** | ✅ Full | ❌ | ❌ |
| **Quản lý Thanh toán** | ✅ Full | ❌ | ❌ |
| **Báo cáo** | ✅ Full | 👁️ View own | ❌ |
| **Quản lý Roles** | ✅ Full | ❌ | ❌ |
| **Quản lý Notifications** | ✅ Full | 👁️ View | 👁️ View |
| **Audit Logs** | ✅ Full | ❌ | ❌ |
| **Quản lý Bài học** | ✅ Full | ✅ Own | 👁️ View |

**Chú thích:**
- ✅ Full: Toàn quyền (Create, Read, Update, Delete)
- ✅ Own: Chỉ quản lý của mình
- 👁️ View: Chỉ xem
- 👁️ View own: Chỉ xem của mình
- ❌: Không có quyền

---

## 🚀 CÁC MODULES API

### Core Modules
1. **Authentication** (`/api/auth`) - Đăng nhập, đăng ký
2. **Users** (`/api/users`) - Quản lý users
3. **Teachers** (`/api/teachers`) - Quản lý giáo viên
4. **Students** (`/api/students`) - Quản lý học sinh
5. **Subjects** (`/api/subjects`) - Quản lý môn học
6. **Classrooms** (`/api/classrooms`) - Quản lý lớp học
7. **Schedules** (`/api/schedules`) - Quản lý lịch học
8. **Assignments** (`/api/assignments`) - Quản lý bài tập
9. **Attendances** (`/api/attendances`) - Quản lý điểm danh
10. **Lessons** (`/api/lessons`) - Quản lý bài học

### Finance Modules
11. **Finances** (`/api/finances`) - Quản lý tài chính
12. **Payments** (`/api/payments`) - Quản lý thanh toán
13. **Expense Categories** (`/api/expense-categories`) - Danh mục chi phí

### Infrastructure Modules
14. **Campuses** (`/api/campuses`) - Quản lý cơ sở
15. **Rooms** (`/api/rooms`) - Quản lý phòng học

### System Modules
16. **Reports** (`/api/reports`) - Báo cáo
17. **Roles** (`/api/roles`) - Quản lý roles & permissions
18. **Notifications** (`/api/notifications`) - Quản lý thông báo
19. **Audit Logs** (`/api/audit-logs`) - Lịch sử hoạt động

---

## 📝 GHI CHÚ

1. **Roles trong database** (accountant, customer, employee, sales, Supplier, transport, worker) có vẻ là từ hệ thống khác hoặc chưa được tích hợp vào School Management System.

2. **Permissions** hiện tại chưa được gán cho roles (role_permissions table trống).

3. **Phase 1, 2, 3** đã thêm nhiều tính năng mới nhưng chưa có backend API đầy đủ:
   - Phase 1: Reports, Roles, Notifications, Audit Logs ✅ (có API)
   - Phase 2: Import/Export, Exams, File Management, Calendar ⏳ (chưa có API)
   - Phase 3: Courses, Messaging, System Settings, Business Intelligence ⏳ (chưa có API)

4. **Frontend** đã có menu items cho từng role nhưng một số tính năng chưa có backend API tương ứng.

---

## 🎯 KẾT LUẬN

Hệ thống hiện tại có **3 roles chính** với quyền hạn rõ ràng:
- **Admin**: Toàn quyền quản lý hệ thống
- **Teacher**: Quản lý lớp học, bài tập, điểm danh
- **Student**: Xem thông tin, nộp bài tập

Các roles khác trong database chưa được tích hợp và cần được xem xét trong tương lai.

---

**Tài liệu này sẽ được cập nhật khi có thay đổi về roles và permissions.**

