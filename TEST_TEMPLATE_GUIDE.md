# Hướng dẫn Test Tạo Template với 2 Bài học và 2 Bài tập

## Cách 1: Test qua Giao diện (Khuyến nghị)

### Bước 1: Tạo Template
1. Đăng nhập với tài khoản **Admin** hoặc **Teacher**
2. Truy cập: `http://localhost:3000/documents`
3. Click nút **"Tạo Template Mới"**
4. Điền thông tin:
   - **Tên Template**: `Template Test - Toán lớp 10`
   - **Mô tả**: `Template test với 2 bài học và 2 bài tập`
   - **Môn học**: Chọn một môn học (nếu có)
   - **Sức chứa**: `30`
5. Click **"Lưu"**

### Bước 2: Thêm Bài học vào Template
1. Sau khi tạo template, click icon **File** (hoặc icon **Mắt** để xem chi tiết)
2. Bạn sẽ được chuyển đến trang chi tiết template (giống như lớp học thường)
3. Scroll xuống phần **"Bài học"**
4. Click **"Tải lên bài học"** hoặc **"Upload Lesson"**

#### Tạo Bài học 1:
- **Tiêu đề**: `Bài học 1: Giới thiệu về Toán học`
- **Mô tả**: `Bài học giới thiệu các khái niệm cơ bản về toán học`
- **Thứ tự hiển thị**: `1`
- **File**: Upload một file PDF hoặc Word (có thể dùng file test)
- Click **"Tải lên bài học"**

#### Tạo Bài học 2:
- **Tiêu đề**: `Bài học 2: Phép tính cơ bản`
- **Mô tả**: `Học về các phép tính cộng, trừ, nhân, chia`
- **Thứ tự hiển thị**: `2`
- **File**: Upload một file PDF hoặc Word
- Click **"Tải lên bài học"**

### Bước 3: Tạo Bài tập cho Template
1. Vẫn ở trang chi tiết template
2. Scroll xuống phần **"Bài tập"** hoặc vào menu **"Assignments"**
3. Click **"Tạo bài tập mới"** hoặc **"Create Assignment"**

#### Tạo Bài tập 1 (Trắc nghiệm):
1. Click **"Tạo bài tập mới"**
2. Chọn **"Trắc nghiệm"** (Multiple Choice)
3. Điền thông tin:
   - **Tiêu đề**: `Bài tập 1: Trắc nghiệm Toán cơ bản`
   - **Mô tả**: `Bài tập trắc nghiệm về các phép tính cơ bản`
   - **Tổng điểm**: `100`
   - **Thời gian**: `60 phút`
4. Thêm câu hỏi (ít nhất 1 câu):
   - **Câu hỏi**: `2 + 2 = ?`
   - **Loại**: Trắc nghiệm
   - **Điểm**: `10`
   - **Đáp án**: 
     - A: `3`
     - B: `4` (Đúng)
     - C: `5`
     - D: `6`
5. Click **"Lưu bài tập"**
6. **Gán cho template**: Chọn template vừa tạo trong danh sách lớp học

#### Tạo Bài tập 2 (Tự luận):
1. Click **"Tạo bài tập mới"**
2. Chọn **"Tự luận"** (Essay)
3. Điền thông tin:
   - **Tiêu đề**: `Bài tập 2: Tự luận - Giải bài toán`
   - **Mô tả**: `Bài tập tự luận yêu cầu giải các bài toán`
   - **Tổng điểm**: `100`
4. Thêm câu hỏi:
   - **Câu hỏi**: `Giải bài toán: Một cửa hàng có 50 quyển sách, bán đi 20 quyển. Hỏi còn lại bao nhiêu quyển?`
   - **Loại**: Tự luận
   - **Điểm**: `100`
5. Click **"Lưu bài tập"**
6. **Gán cho template**: Chọn template vừa tạo trong danh sách lớp học

### Bước 4: Kiểm tra kết quả
1. Quay lại trang `http://localhost:3000/documents`
2. Click icon **Mắt** (👁️) trên template vừa tạo
3. Xem trong dialog:
   - **Bài học**: Phải có 2 bài học
   - **Bài tập**: Phải có 2 bài tập

## Cách 2: Test bằng Script Python

### Yêu cầu:
- Python 3.7+
- Thư viện `requests`: `pip install requests`
- Backend server đang chạy
- Token authentication

### Các bước:
1. Mở file `test_create_template_with_content.py`
2. Thay đổi `AUTH_TOKEN` bằng token thực tế của bạn
3. Chạy script:
   ```bash
   python test_create_template_with_content.py
   ```

### Lấy Token:
1. Đăng nhập vào frontend
2. Mở Developer Tools (F12)
3. Vào tab **Console**
4. Chạy lệnh:
   ```javascript
   localStorage.getItem('auth_token')
   ```
5. Copy token và paste vào script

## Cách 3: Test bằng API trực tiếp (Postman/curl)

### 1. Tạo Template
```bash
curl -X POST http://localhost:8000/api/template-classrooms/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Template Test - Toán lớp 10",
    "description": "Template test với 2 bài học và 2 bài tập",
    "capacity": 30
  }'
```

Lưu `template_id` từ response.

### 2. Tạo Bài học 1
```bash
curl -X POST http://localhost:8000/api/lessons/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "classroom_id=TEMPLATE_ID" \
  -F "title=Bài học 1: Giới thiệu về Toán học" \
  -F "description=Bài học giới thiệu các khái niệm cơ bản" \
  -F "sort_order=1" \
  -F "files=@test_file.pdf"
```

### 3. Tạo Bài học 2
```bash
curl -X POST http://localhost:8000/api/lessons/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "classroom_id=TEMPLATE_ID" \
  -F "title=Bài học 2: Phép tính cơ bản" \
  -F "description=Học về các phép tính cộng, trừ, nhân, chia" \
  -F "sort_order=2" \
  -F "files=@test_file.pdf"
```

### 4. Tạo Bài tập 1
```bash
curl -X POST http://localhost:8000/api/assignments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bài tập 1: Trắc nghiệm Toán cơ bản",
    "description": "Bài tập trắc nghiệm về các phép tính cơ bản",
    "assignment_type": "multiple_choice",
    "total_points": 100.0,
    "time_limit_minutes": 60
  }'
```

Sau đó gán cho template:
```bash
curl -X POST http://localhost:8000/api/assignments/ASSIGNMENT_ID/classrooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["TEMPLATE_ID"]'
```

### 5. Tạo Bài tập 2
```bash
curl -X POST http://localhost:8000/api/assignments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bài tập 2: Tự luận - Giải bài toán",
    "description": "Bài tập tự luận yêu cầu giải các bài toán",
    "assignment_type": "essay",
    "total_points": 100.0
  }'
```

Gán cho template tương tự như trên.

### 6. Kiểm tra kết quả
```bash
# Lấy danh sách bài học
curl http://localhost:8000/api/template-classrooms/TEMPLATE_ID/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"

# Lấy danh sách bài tập
curl http://localhost:8000/api/template-classrooms/TEMPLATE_ID/assignments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Checklist Test

- [ ] Template đã được tạo thành công
- [ ] Template có 2 bài học
- [ ] Template có 2 bài tập
- [ ] Có thể xem chi tiết template
- [ ] Có thể tạo lớp học từ template
- [ ] Khi tạo lớp học, bài học được copy đúng
- [ ] Khi tạo lớp học, bài tập được copy đúng
- [ ] Lịch sử sử dụng template được lưu

## Troubleshooting

### Lỗi: "Not enough permissions"
- Đảm bảo bạn đăng nhập với quyền Admin hoặc Teacher
- Kiểm tra token có hợp lệ không

### Lỗi: "Template not found"
- Kiểm tra template_id có đúng không
- Đảm bảo template đã được tạo thành công

### Bài học/Bài tập không hiển thị
- Kiểm tra xem bài học/bài tập đã được gán đúng cho template chưa
- Kiểm tra `classroom_id` trong bài học/bài tập có trùng với `template_id` không

### Không thể upload file
- Kiểm tra file có đúng định dạng không
- Kiểm tra kích thước file (tối đa 50MB)
- Kiểm tra quyền truy cập storage




