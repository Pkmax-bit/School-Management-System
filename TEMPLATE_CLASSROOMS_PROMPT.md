# Prompt cho chức năng Template Classrooms

## Mô tả yêu cầu

Tạo chức năng "Tài liệu mẫu" (Template Classrooms) cho hệ thống quản lý trường học với các yêu cầu sau:

### Yêu cầu chức năng

1. **Lớp học mẫu (Template Classroom)**
   - Có thể tạo lớp học mẫu giống như lớp học thường
   - Có thể gắn bài học và bài tập vào lớp mẫu
   - Lớp mẫu không thể có học sinh hoặc lịch học thực tế
   - Lớp mẫu có thể được sử dụng để tạo lớp học mới

2. **Tạo lớp học từ Template**
   - Có thể chọn template và tạo lớp học mới từ template
   - Khi tạo lớp học mới, có thể chọn:
     - Sao chép bài học từ template
     - Sao chép bài tập từ template
   - Tất cả bài học và bài tập được sao chép sang lớp học mới

3. **Quản lý Template**
   - Xem danh sách template
   - Tạo template mới
   - Chỉnh sửa template
   - Xóa template
   - Xem chi tiết template (bài học, bài tập)

4. **Lịch sử sử dụng**
   - Lưu lại lịch sử khi template được sử dụng để tạo lớp học
   - Xem các lớp học đã được tạo từ template

### Yêu cầu kỹ thuật

1. **Database**
   - Thêm cột `is_template` vào bảng `classrooms`
   - Tạo bảng `template_usage` để lưu lịch sử sử dụng
   - Template có thể có bài học và bài tập (giống lớp học thường)

2. **Backend API**
   - CRUD operations cho template
   - Endpoint tạo lớp học từ template
   - Endpoint lấy lịch sử sử dụng template
   - Endpoint lấy bài học/bài tập của template

3. **Frontend**
   - Trang quản lý template
   - Trang tạo lớp học từ template
   - Component hiển thị chi tiết template

### Quy trình sử dụng

1. Admin/Teacher tạo template lớp học
2. Thêm bài học và bài tập vào template
3. Khi cần tạo lớp học mới, chọn template và tạo lớp học
4. Hệ thống tự động sao chép bài học và bài tập (nếu được chọn)
5. Lớp học mới được tạo với đầy đủ nội dung từ template

### Lưu ý

- Template không thể có học sinh
- Template không thể có lịch học
- Khi sao chép bài tập, tạo bài tập mới (không dùng chung)
- Khi sao chép bài học, tạo bài học mới (không dùng chung)
- Mã template tự động tạo theo format `Template####`

### Phân quyền

- Admin: Full access
- Teacher: Có thể tạo, xem, chỉnh sửa template (không thể xóa)
- Student: Không có quyền truy cập

## Prompt cho AI Assistant

```
Bạn cần tạo chức năng Template Classrooms (Lớp học mẫu) cho hệ thống quản lý trường học.

Yêu cầu:
1. Tạo lớp học mẫu có thể chứa bài học và bài tập như lớp học thường
2. Có thể sử dụng template để tạo lớp học mới, tự động sao chép bài học và bài tập
3. Quản lý template: CRUD operations
4. Lưu lịch sử sử dụng template

Cần tạo:
- Database schema (thêm is_template flag, bảng template_usage)
- Backend API endpoints
- Frontend pages và components
- Documentation

Hãy bắt đầu với database schema, sau đó tạo backend API, cuối cùng là frontend.
```

## Checklist Implementation

- [x] Database schema
  - [x] Thêm cột `is_template` vào `classrooms`
  - [x] Tạo bảng `template_usage`
  - [x] Tạo indexes

- [x] Backend Models
  - [x] TemplateClassroom models
  - [x] TemplateUsage models

- [x] Backend API
  - [x] POST /api/template-classrooms/ - Tạo template
  - [x] GET /api/template-classrooms/ - Lấy danh sách
  - [x] GET /api/template-classrooms/{id} - Lấy chi tiết
  - [x] PUT /api/template-classrooms/{id} - Cập nhật
  - [x] DELETE /api/template-classrooms/{id} - Xóa
  - [x] POST /api/template-classrooms/{id}/create-classroom - Tạo lớp học từ template
  - [x] GET /api/template-classrooms/{id}/usage - Lịch sử sử dụng
  - [x] GET /api/template-classrooms/{id}/lessons - Lấy bài học
  - [x] GET /api/template-classrooms/{id}/assignments - Lấy bài tập

- [x] Frontend
  - [x] API client (template-classrooms-api.ts)
  - [x] Trang quản lý template (/admin/template-classrooms)
  - [x] Trang tạo lớp học từ template (/admin/template-classrooms/[id]/create-classroom)
  - [x] Components cho hiển thị template

- [x] Documentation
  - [x] Feature documentation
  - [x] API documentation
  - [x] Usage guide
  - [x] Prompt documentation

## Testing Checklist

- [ ] Test tạo template
- [ ] Test thêm bài học vào template
- [ ] Test thêm bài tập vào template
- [ ] Test tạo lớp học từ template (có copy bài học)
- [ ] Test tạo lớp học từ template (có copy bài tập)
- [ ] Test tạo lớp học từ template (không copy gì)
- [ ] Test xem lịch sử sử dụng
- [ ] Test chỉnh sửa template
- [ ] Test xóa template
- [ ] Test phân quyền (admin, teacher, student)

