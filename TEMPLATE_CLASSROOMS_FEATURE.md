# Chức năng Template Classrooms (Lớp học mẫu)

## Tổng quan

Chức năng Template Classrooms cho phép tạo các lớp học mẫu có thể chứa bài học và bài tập, sau đó sử dụng để tạo các lớp học mới một cách nhanh chóng. Điều này giúp tiết kiệm thời gian khi cần tạo nhiều lớp học có cấu trúc tương tự.

## Tính năng chính

1. **Tạo Template**: Tạo lớp học mẫu với thông tin cơ bản (tên, mô tả, môn học, sức chứa)
2. **Quản lý Template**: Xem, chỉnh sửa, xóa template
3. **Gắn Bài học và Bài tập**: Template có thể chứa bài học và bài tập giống như lớp học thường
4. **Tạo lớp học từ Template**: Sao chép template thành lớp học mới, bao gồm:
   - Thông tin lớp học
   - Bài học (tùy chọn)
   - Bài tập (tùy chọn)
5. **Lịch sử sử dụng**: Theo dõi các lớp học đã được tạo từ template

## Cấu trúc Database

### Bảng `classrooms`
- Thêm cột `is_template` (BOOLEAN) để đánh dấu lớp học là template hay lớp học thực tế
- Template không thể có học sinh hoặc lịch học thực tế

### Bảng `template_usage`
- Lưu lịch sử khi template được sử dụng để tạo lớp học mới
- Các trường:
  - `id`: UUID
  - `template_id`: UUID (FK -> classrooms.id)
  - `created_classroom_id`: UUID (FK -> classrooms.id)
  - `created_by`: UUID (FK -> users.id)
  - `created_at`: TIMESTAMP
  - `notes`: TEXT

## API Endpoints

### 1. Tạo Template
```
POST /api/template-classrooms/
```

**Request Body:**
```json
{
  "name": "Template Toán lớp 10",
  "code": "Template0001",  // Optional, tự động tạo nếu không có
  "description": "Template cho môn Toán lớp 10",
  "subject_id": "uuid",
  "capacity": 30
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Template Toán lớp 10",
  "code": "Template0001",
  "description": "Template cho môn Toán lớp 10",
  "subject_id": "uuid",
  "capacity": 30,
  "is_template": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 2. Lấy danh sách Template
```
GET /api/template-classrooms/?skip=0&limit=100&subject_id=uuid
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Template Toán lớp 10",
    "code": "Template0001",
    ...
  }
]
```

### 3. Lấy thông tin Template
```
GET /api/template-classrooms/{template_id}
```

### 4. Cập nhật Template
```
PUT /api/template-classrooms/{template_id}
```

**Request Body:**
```json
{
  "name": "Template Toán lớp 10 (Updated)",
  "description": "Mô tả mới",
  ...
}
```

### 5. Xóa Template
```
DELETE /api/template-classrooms/{template_id}
```

### 6. Tạo lớp học từ Template
```
POST /api/template-classrooms/{template_id}/create-classroom
```

**Request Body:**
```json
{
  "template_id": "uuid",
  "name": "Toán lớp 10A1",
  "code": "Class0001",
  "teacher_id": "uuid",
  "subject_id": "uuid",
  "campus_id": "uuid",
  "capacity": 30,
  "tuition_per_session": 50000,
  "sessions_per_week": 2,
  "open_date": "2024-01-01",
  "close_date": "2024-12-31",
  "copy_lessons": true,
  "copy_assignments": true,
  "student_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Toán lớp 10A1",
  "code": "Class0001",
  "is_template": false,
  ...
}
```

### 7. Lấy lịch sử sử dụng Template
```
GET /api/template-classrooms/{template_id}/usage
```

**Response:**
```json
[
  {
    "id": "uuid",
    "template_id": "uuid",
    "created_classroom_id": "uuid",
    "created_by": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "notes": "Created from template: Template Toán lớp 10"
  }
]
```

### 8. Lấy danh sách Bài học của Template
```
GET /api/template-classrooms/{template_id}/lessons
```

### 9. Lấy danh sách Bài tập của Template
```
GET /api/template-classrooms/{template_id}/assignments
```

## Quy trình sử dụng

### Bước 1: Tạo Template
1. Vào trang "Quản lý Template Lớp học" (`/admin/template-classrooms`)
2. Click "Tạo Template"
3. Điền thông tin:
   - Tên template
   - Mã template (hoặc để trống để tự động tạo)
   - Mô tả
   - Môn học
   - Sức chứa
4. Click "Lưu"

### Bước 2: Thêm Bài học và Bài tập vào Template
1. Vào trang chi tiết lớp học (template có thể được quản lý như lớp học thường)
2. Upload bài học và tạo bài tập như bình thường
3. Template sẽ lưu tất cả bài học và bài tập

### Bước 3: Tạo lớp học từ Template
1. Vào trang "Quản lý Template Lớp học"
2. Click nút "Copy" hoặc "Tạo lớp học từ Template này"
3. Điền thông tin lớp học mới:
   - Tên lớp học
   - Mã lớp học
   - Giáo viên
   - Cơ sở
   - Các thông tin khác
4. Chọn tùy chọn:
   - ☑ Sao chép bài học từ template
   - ☑ Sao chép bài tập từ template
5. Click "Tạo lớp học"

### Bước 4: Xem lịch sử sử dụng
1. Vào trang chi tiết template
2. Xem danh sách các lớp học đã được tạo từ template này

## Lưu ý quan trọng

1. **Template không thể có học sinh**: Template chỉ là mẫu, không thể gán học sinh vào
2. **Template không thể có lịch học**: Template không có lịch học thực tế
3. **Sao chép Bài tập**: Khi sao chép bài tập từ template:
   - Tạo bài tập mới với cùng nội dung
   - Tạo câu hỏi mới cho bài tập
   - Gán bài tập cho lớp học mới
   - Cập nhật liên kết assignment_id trong bài học (nếu có)
4. **Sao chép Bài học**: Khi sao chép bài học từ template:
   - Tạo bài học mới với cùng nội dung
   - Sao chép tất cả file đính kèm
   - Giữ nguyên thứ tự (sort_order)
5. **Mã Template**: Mã template tự động tạo theo format `Template####` (ví dụ: Template0001, Template0002)

## Phân quyền

- **Admin**: Có thể tạo, xem, chỉnh sửa, xóa template và tạo lớp học từ template
- **Teacher**: Có thể tạo, xem, chỉnh sửa template (không thể xóa)
- **Student**: Không có quyền truy cập

## Frontend Routes

- `/admin/template-classrooms` - Trang quản lý template
- `/admin/template-classrooms/[id]/create-classroom` - Trang tạo lớp học từ template

## Migration

Chạy file SQL migration để tạo schema:
```sql
-- Chạy file: template_classrooms_schema.sql
```

## Testing

### Test Cases

1. **Tạo Template**
   - Tạo template với đầy đủ thông tin
   - Tạo template không có mã (tự động tạo)
   - Tạo template với mã trùng (phải báo lỗi)

2. **Quản lý Template**
   - Xem danh sách template
   - Xem chi tiết template
   - Chỉnh sửa template
   - Xóa template

3. **Thêm Bài học/Bài tập vào Template**
   - Upload bài học vào template
   - Tạo bài tập cho template
   - Xem danh sách bài học/bài tập của template

4. **Tạo lớp học từ Template**
   - Tạo lớp học với copy bài học
   - Tạo lớp học với copy bài tập
   - Tạo lớp học không copy gì
   - Kiểm tra bài học/bài tập đã được sao chép đúng

5. **Lịch sử sử dụng**
   - Xem lịch sử sử dụng template
   - Kiểm tra thông tin được lưu đúng

## Troubleshooting

### Template không hiển thị
- Kiểm tra `is_template = true` trong database
- Kiểm tra quyền truy cập của user

### Không thể tạo lớp học từ template
- Kiểm tra template có tồn tại không
- Kiểm tra mã lớp học có đúng format không (Class####)
- Kiểm tra mã lớp học có trùng không

### Bài học/Bài tập không được sao chép
- Kiểm tra `copy_lessons` và `copy_assignments` trong request
- Kiểm tra template có bài học/bài tập không
- Kiểm tra log backend để xem lỗi chi tiết

## Future Enhancements

1. **Template Versioning**: Lưu các phiên bản của template
2. **Template Sharing**: Chia sẻ template giữa các giáo viên
3. **Template Categories**: Phân loại template theo môn học, cấp độ
4. **Bulk Create**: Tạo nhiều lớp học từ template cùng lúc
5. **Template Preview**: Xem trước template trước khi tạo lớp học

