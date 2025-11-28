# Tính năng Tổng điểm, Điểm trung bình và Xếp loại Học sinh

## Tổng quan

Hệ thống đã được bổ sung tính năng tính toán và hiển thị:
- **Tổng điểm**: Tổng tất cả điểm đã chấm của học sinh
- **Điểm trung bình**: Điểm trung bình các bài tập đã chấm
- **Xếp loại**: Phân loại học sinh dựa trên điểm trung bình

## Xếp loại

| Điểm trung bình | Xếp loại |
|----------------|----------|
| >= 8.0 | Giỏi |
| >= 6.5 và < 8.0 | Khá |
| >= 5.0 và < 6.5 | Trung bình |
| >= 3.5 và < 5.0 | Yếu |
| < 3.5 | Kém |

## API Endpoints

### 1. Lấy điểm tổng hợp của một học sinh

**Endpoint**: `GET /api/assignments/students/{student_id}/grade-summary`

**Query Parameters**:
- `classroom_id` (optional): Filter theo lớp học
- `subject_id` (optional): Filter theo môn học

**Response**:
```json
{
  "student_id": "uuid",
  "classroom_id": "uuid",
  "subject_id": "uuid",
  "total_assignments": 10,
  "graded_assignments": 8,
  "pending_assignments": 2,
  "total_score": 750.0,
  "average_score": 93.75,
  "classification": "Giỏi",
  "assignments": [
    {
      "assignment_id": "uuid",
      "assignment_title": "Bài tập 1",
      "subject_id": "uuid",
      "subject_name": "Toán",
      "score": 95.0,
      "total_points": 100.0,
      "percentage": 95.0,
      "submitted_at": "2024-01-15T10:00:00Z",
      "graded_at": "2024-01-16T09:00:00Z"
    }
  ]
}
```

**Phân quyền**:
- **Admin**: Có thể xem điểm của tất cả học sinh
- **Teacher**: Chỉ có thể xem điểm của học sinh trong lớp của mình
- **Student**: Chỉ có thể xem điểm của chính mình

### 2. Lấy bảng điểm tổng hợp của cả lớp

**Endpoint**: `GET /api/assignments/classrooms/{classroom_id}/grade-summary`

**Query Parameters**:
- `subject_id` (optional): Filter theo môn học

**Response**:
```json
{
  "classroom_id": "uuid",
  "subject_id": "uuid",
  "total_students": 30,
  "students": [
    {
      "student_id": "uuid",
      "student_name": "Nguyễn Văn A",
      "total_assignments": 10,
      "graded_assignments": 8,
      "pending_assignments": 2,
      "total_score": 750.0,
      "average_score": 93.75,
      "classification": "Giỏi"
    }
  ]
}
```

**Phân quyền**:
- **Admin**: Có thể xem bảng điểm của tất cả lớp
- **Teacher**: Chỉ có thể xem bảng điểm của lớp mà mình đang dạy

## Frontend

### Trang Bảng Điểm Tổng Hợp

**URL**: `/student-grades`

**Tính năng**:
1. Chọn lớp học (bắt buộc)
2. Chọn môn học (tùy chọn - để xem điểm theo môn)
3. Hiển thị bảng điểm với các thông tin:
   - STT
   - Họ và tên học sinh
   - Tổng số bài tập
   - Số bài đã chấm
   - Số bài chờ chấm
   - Tổng điểm
   - Điểm trung bình (màu sắc theo mức độ)
   - Xếp loại (badge màu sắc)
4. Tìm kiếm học sinh
5. Thống kê tổng quan:
   - Tổng số học sinh
   - Số học sinh đã có điểm
   - Điểm trung bình của lớp
   - Số học sinh giỏi

**Màu sắc điểm trung bình**:
- >= 8.0: Xanh lá (Giỏi)
- >= 6.5: Xanh dương (Khá)
- >= 5.0: Vàng (Trung bình)
- >= 3.5: Cam (Yếu)
- < 3.5: Đỏ (Kém)

## Cách sử dụng

### Cho Giáo viên/Admin:

1. Truy cập trang `/student-grades`
2. Chọn lớp học từ dropdown
3. (Tùy chọn) Chọn môn học để xem điểm theo môn cụ thể
4. Nhấn "Xem bảng điểm"
5. Xem bảng điểm tổng hợp với đầy đủ thông tin

### Cho Học sinh:

1. Học sinh có thể xem điểm của chính mình thông qua API
2. (Có thể tạo trang riêng cho học sinh xem điểm cá nhân)

## Files đã tạo/cập nhật

1. **Backend**:
   - `backend/routers/assignments.py`:
     - Function `calculate_grade_classification()`: Tính xếp loại
     - Endpoint `GET /api/assignments/students/{student_id}/grade-summary`
     - Endpoint `GET /api/assignments/classrooms/{classroom_id}/grade-summary`

2. **Frontend**:
   - `frontend/src/app/student-grades/page.tsx`: Trang bảng điểm tổng hợp

## Lưu ý

- Điểm trung bình chỉ tính từ các bài đã được chấm điểm (`is_graded = TRUE`)
- Nếu học sinh chưa có bài nào được chấm, xếp loại sẽ là "Chưa có điểm"
- Tổng điểm và điểm trung bình được làm tròn đến 2 chữ số thập phân
- Học sinh được sắp xếp theo điểm trung bình giảm dần trong bảng điểm lớp


