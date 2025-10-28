# Triển khai CRUD cho Môn học (Subjects)

## Tổng quan
Đã triển khai đầy đủ chức năng CRUD (Create, Read, Update, Delete) cho môn học với database schema đã cung cấp.

## Database Schema
```sql
create table public.subjects (
  id uuid not null default extensions.uuid_generate_v4 (),
  name character varying(255) not null,
  code character varying(50) not null,
  description text null,
  credits integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint subjects_pkey primary key (id),
  constraint subjects_code_key unique (code)
);
```

## Các thay đổi đã thực hiện

### 1. Cập nhật Types (types/index.ts)
- ✅ **Subject interface**: Cập nhật theo database schema
  - `id: string` (UUID)
  - `name: string` (required)
  - `code: string` (required, unique)
  - `description?: string` (optional)
  - `credits: number` (default: 1)
  - `created_at?: string`
  - `updated_at?: string`

- ✅ **CreateSubjectRequest**: Interface cho tạo môn học mới
- ✅ **UpdateSubjectRequest**: Interface cho cập nhật môn học

### 2. API Functions (lib/api.ts)
- ✅ **subjectsAPI**: Đã có sẵn và hoạt động
  - `getSubjects()` - Lấy danh sách môn học
  - `getSubject(id)` - Lấy môn học theo ID
  - `createSubject(data)` - Tạo môn học mới
  - `updateSubject(id, data)` - Cập nhật môn học
  - `deleteSubject(id)` - Xóa môn học

### 3. Subjects Page (app/subjects/page.tsx)
- ✅ **State Management**:
  - `subjects: Subject[]` - Danh sách môn học
  - `loadingSubjects: boolean` - Trạng thái loading
  - `searchQuery: string` - Tìm kiếm
  - `isDialogOpen: boolean` - Mở/đóng dialog
  - `editingSubject: Subject | null` - Môn học đang chỉnh sửa
  - `formData: CreateSubjectRequest` - Dữ liệu form

- ✅ **CRUD Functions**:
  - `loadSubjects()` - Tải danh sách môn học
  - `handleCreate()` - Tạo môn học mới
  - `handleUpdate()` - Cập nhật môn học
  - `handleDelete()` - Xóa môn học
  - `handleEdit()` - Mở form chỉnh sửa
  - `handleAdd()` - Mở form tạo mới

### 4. UI Components
- ✅ **Search Functionality**: Tìm kiếm theo tên và mã môn học
- ✅ **Create/Edit Dialog**: Form với các trường:
  - Tên môn học (required)
  - Mã môn học (required, unique)
  - Mô tả (optional)
  - Số tín chỉ (number, default: 1)

- ✅ **Subject Cards**: Hiển thị thông tin môn học
  - Tên và mã môn học
  - Số tín chỉ
  - Mô tả (nếu có)
  - Ngày tạo
  - Buttons Edit/Delete

- ✅ **Statistics**: Thống kê động
  - Tổng số môn học
  - Tín chỉ trung bình
  - Tổng tín chỉ

### 5. Features
- ✅ **Loading States**: Spinner khi tải dữ liệu
- ✅ **Empty States**: Thông báo khi chưa có dữ liệu
- ✅ **Search States**: Thông báo khi không tìm thấy
- ✅ **Error Handling**: Xử lý lỗi API
- ✅ **Form Validation**: Validation cơ bản
- ✅ **Responsive Design**: Hoạt động tốt trên mobile

## Cách sử dụng

### Tạo môn học mới
1. Click nút "Thêm môn học"
2. Điền thông tin:
   - Tên môn học (bắt buộc)
   - Mã môn học (bắt buộc, duy nhất)
   - Mô tả (tùy chọn)
   - Số tín chỉ (mặc định: 1)
3. Click "Thêm mới"

### Chỉnh sửa môn học
1. Click nút Edit (✏️) trên môn học cần sửa
2. Chỉnh sửa thông tin trong form
3. Click "Cập nhật"

### Xóa môn học
1. Click nút Delete (🗑️) trên môn học cần xóa
2. Xác nhận xóa trong dialog

### Tìm kiếm
- Nhập từ khóa vào ô tìm kiếm
- Tìm kiếm theo tên hoặc mã môn học

## API Endpoints
- `GET /api/subjects` - Lấy danh sách môn học
- `GET /api/subjects/:id` - Lấy môn học theo ID
- `POST /api/subjects` - Tạo môn học mới
- `PUT /api/subjects/:id` - Cập nhật môn học
- `DELETE /api/subjects/:id` - Xóa môn học

## Validation Rules
- **name**: Bắt buộc, tối đa 255 ký tự
- **code**: Bắt buộc, tối đa 50 ký tự, duy nhất
- **description**: Tùy chọn, text
- **credits**: Số nguyên, mặc định 1

## Kết quả
- ✅ CRUD hoàn chỉnh cho môn học
- ✅ Giao diện đẹp và responsive
- ✅ Xử lý lỗi tốt
- ✅ Loading states
- ✅ Search functionality
- ✅ Sẵn sàng cho production
