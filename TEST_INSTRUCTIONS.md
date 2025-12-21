# Hướng dẫn Test Tạo Template với 2 Bài học và 2 Bài tập

## Cách 1: Test qua Browser Console (Nhanh nhất) ⚡

### Bước 1: Chuẩn bị
1. Đảm bảo backend đang chạy: `http://localhost:8000`
2. Đảm bảo frontend đang chạy: `http://localhost:3000`
3. Đăng nhập với tài khoản **Admin** hoặc **Teacher**

### Bước 2: Chạy Script
1. Mở trang bất kỳ trong frontend (ví dụ: `http://localhost:3000/documents`)
2. Mở **Developer Tools** (F12 hoặc Ctrl+Shift+I)
3. Vào tab **Console**
4. Copy toàn bộ nội dung file `test_template_automated.js`
5. Paste vào Console và nhấn Enter

### Bước 3: Xem kết quả
Script sẽ tự động:
- ✅ Tạo template
- ✅ Tạo 2 bài học
- ✅ Tạo 2 bài tập
- ✅ Gán bài tập cho template
- ✅ Hiển thị kết quả

Kết quả sẽ hiển thị trong Console với thông tin chi tiết.

---

## Cách 2: Test thủ công qua Giao diện (Chi tiết) 🖱️

### Bước 1: Tạo Template
1. Truy cập: `http://localhost:3000/documents`
2. Click **"Tạo Template Mới"**
3. Điền thông tin:
   ```
   Tên Template: Template Test - Toán lớp 10
   Mô tả: Template test với 2 bài học và 2 bài tập
   Sức chứa: 30
   ```
4. Click **"Lưu"**
5. **Lưu Template ID** (sẽ cần dùng sau)

### Bước 2: Thêm Bài học 1
1. Click icon **📄 File** trên template vừa tạo (hoặc click **👁️ Mắt** rồi click **"Mở để quản lý"**)
2. Scroll xuống phần **"Bài học"**
3. Click **"Tải lên bài học"**
4. Điền form:
   ```
   Tiêu đề: Bài học 1: Giới thiệu về Toán học
   Mô tả: Bài học giới thiệu các khái niệm cơ bản về toán học
   Thứ tự hiển thị: 1
   File: Upload file bất kỳ (PDF, Word, ...)
   ```
5. Click **"Tải lên bài học"**

### Bước 3: Thêm Bài học 2
1. Vẫn ở trang chi tiết template
2. Click **"Tải lên bài học"** lần nữa
3. Điền form:
   ```
   Tiêu đề: Bài học 2: Phép tính cơ bản
   Mô tả: Học về các phép tính cộng, trừ, nhân, chia
   Thứ tự hiển thị: 2
   File: Upload file bất kỳ
   ```
4. Click **"Tải lên bài học"**

### Bước 4: Tạo Bài tập 1 (Trắc nghiệm)
1. Vào menu **"Assignments"** hoặc scroll xuống phần **"Bài tập"**
2. Click **"Tạo bài tập mới"** hoặc **"Create Assignment"**
3. Chọn **"Trắc nghiệm"** (Multiple Choice)
4. Điền thông tin:
   ```
   Tiêu đề: Bài tập 1: Trắc nghiệm Toán cơ bản
   Mô tả: Bài tập trắc nghiệm về các phép tính cơ bản
   Tổng điểm: 100
   Thời gian: 60 phút
   ```
5. Thêm câu hỏi:
   - Click **"Thêm câu hỏi"**
   - **Câu hỏi**: `2 + 2 = ?`
   - **Loại**: Trắc nghiệm
   - **Điểm**: `10`
   - **Đáp án**:
     - A: `3`
     - B: `4` ✅ (Đúng)
     - C: `5`
     - D: `6`
   - Click **"Lưu câu hỏi"**
6. Click **"Lưu bài tập"**
7. **Gán cho template**: 
   - Tìm template vừa tạo trong danh sách
   - Chọn template
   - Click **"Gán"** hoặc **"Assign"**

### Bước 5: Tạo Bài tập 2 (Tự luận)
1. Click **"Tạo bài tập mới"** lần nữa
2. Chọn **"Tự luận"** (Essay)
3. Điền thông tin:
   ```
   Tiêu đề: Bài tập 2: Tự luận - Giải bài toán
   Mô tả: Bài tập tự luận yêu cầu giải các bài toán
   Tổng điểm: 100
   ```
4. Thêm câu hỏi:
   - Click **"Thêm câu hỏi"**
   - **Câu hỏi**: `Giải bài toán: Một cửa hàng có 50 quyển sách, bán đi 20 quyển. Hỏi còn lại bao nhiêu quyển?`
   - **Loại**: Tự luận
   - **Điểm**: `100`
   - Click **"Lưu câu hỏi"**
5. Click **"Lưu bài tập"**
6. **Gán cho template**: Chọn template vừa tạo

### Bước 6: Kiểm tra kết quả
1. Quay lại: `http://localhost:3000/documents`
2. Click icon **👁️ Mắt** trên template vừa tạo
3. Xem trong dialog:
   - **Bài học**: Phải có 2 bài
   - **Bài tập**: Phải có 2 bài

---

## Cách 3: Test bằng Postman/Thunder Client

### 1. Tạo Template
```
POST http://localhost:8000/api/template-classrooms/
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
  "name": "Template Test - Toán lớp 10",
  "description": "Template test với 2 bài học và 2 bài tập",
  "capacity": 30
}
```

### 2. Tạo Bài học 1
```
POST http://localhost:8000/api/lessons/upload
Headers:
  Authorization: Bearer YOUR_TOKEN

Body (form-data):
  classroom_id: TEMPLATE_ID
  title: Bài học 1: Giới thiệu về Toán học
  description: Bài học giới thiệu các khái niệm cơ bản
  sort_order: 1
  files: [chọn file]
```

### 3. Tạo Bài học 2
Tương tự bài học 1, thay:
- `title: Bài học 2: Phép tính cơ bản`
- `sort_order: 2`

### 4. Tạo Bài tập 1
```
POST http://localhost:8000/api/assignments/
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
  "title": "Bài tập 1: Trắc nghiệm Toán cơ bản",
  "description": "Bài tập trắc nghiệm về các phép tính cơ bản",
  "assignment_type": "multiple_choice",
  "total_points": 100.0,
  "time_limit_minutes": 60,
  "subject_id": "SUBJECT_ID",
  "teacher_id": "TEACHER_ID"
}
```

Sau đó gán cho template:
```
POST http://localhost:8000/api/assignments/ASSIGNMENT_ID/classrooms
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body: ["TEMPLATE_ID"]
```

### 5. Tạo Bài tập 2
Tương tự bài tập 1, thay:
- `title: Bài tập 2: Tự luận - Giải bài toán`
- `assignment_type: essay`
- `time_limit_minutes: 0`

### 6. Kiểm tra
```
GET http://localhost:8000/api/template-classrooms/TEMPLATE_ID/lessons
GET http://localhost:8000/api/template-classrooms/TEMPLATE_ID/assignments
```

---

## Checklist Test ✅

Sau khi test, kiểm tra:

- [ ] Template đã được tạo thành công
- [ ] Template có đúng 2 bài học
- [ ] Template có đúng 2 bài tập
- [ ] Có thể xem chi tiết template (click icon 👁️)
- [ ] Có thể mở template để quản lý (click icon 📄)
- [ ] Có thể tạo lớp học từ template (click icon 📋)
- [ ] Khi tạo lớp học, bài học được copy đúng
- [ ] Khi tạo lớp học, bài tập được copy đúng
- [ ] Lịch sử sử dụng template được lưu

---

## Troubleshooting 🔧

### Lỗi: "Not enough permissions"
- ✅ Đảm bảo đăng nhập với quyền Admin hoặc Teacher
- ✅ Kiểm tra token có hợp lệ không

### Lỗi: "Template not found"
- ✅ Kiểm tra template_id có đúng không
- ✅ Đảm bảo template đã được tạo thành công

### Bài học không hiển thị
- ✅ Kiểm tra `classroom_id` trong bài học có trùng với `template_id` không
- ✅ Kiểm tra file đã upload thành công chưa

### Bài tập không hiển thị
- ✅ Kiểm tra bài tập đã được gán cho template chưa (qua API `/api/assignments/{id}/classrooms`)
- ✅ Kiểm tra `assignment_classrooms` table có record không

### Không thể upload file
- ✅ Kiểm tra file có đúng định dạng không (PDF, Word, PowerPoint, Excel, Text, ZIP)
- ✅ Kiểm tra kích thước file (tối đa 50MB)
- ✅ Kiểm tra quyền truy cập storage

---

## Kết quả mong đợi 🎯

Sau khi test thành công:
- Template có 2 bài học với tiêu đề rõ ràng
- Template có 2 bài tập (1 trắc nghiệm, 1 tự luận)
- Có thể xem tất cả trong dialog chi tiết template
- Có thể tạo lớp học mới từ template và copy đầy đủ nội dung

