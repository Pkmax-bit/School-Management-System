# Hướng Dẫn Cấu Hình Storage cho Lessons

Hướng dẫn này sẽ giúp bạn thiết lập Supabase Storage bucket để upload file bài học (lessons).

## 📋 Mục Lục

1. [Tạo Storage Bucket](#1-tạo-storage-bucket)
2. [Cấu Hình Quyền Truy Cập](#2-cấu-hình-quyền-truy-cập)
3. [Kiểm Tra Cấu Hình](#3-kiểm-tra-cấu-hình)
4. [Xử Lý Lỗi Thường Gặp](#4-xử-lý-lỗi-thường-gặp)

---

## 1. Tạo Storage Bucket

### Bước 1: Truy cập Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào mục **Storage** ở sidebar bên trái

### Bước 2: Tạo Bucket Mới

1. Click nút **"New bucket"** hoặc **"Create bucket"**
2. Điền thông tin:
   - **Name**: `lesson-materials` (phải chính xác tên này)
   - **Public bucket**: ✅ **BẬT** (quan trọng!)
   - **File size limit**: 50 MB (hoặc theo nhu cầu)
   - **Allowed MIME types**: Để trống hoặc thêm các loại file cần thiết:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-powerpoint`
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`
     - `application/zip`
     - `application/x-rar-compressed`

3. Click **"Create bucket"**

### Bước 3: Xác Nhận

Sau khi tạo, bạn sẽ thấy bucket `lesson-materials` trong danh sách.

---

## 2. Cấu Hình Quyền Truy Cập

### Bước 1: Mở RLS Policies

1. Vào **Storage** → **Policies**
2. Tìm bucket `lesson-materials`
3. Click vào bucket để xem các policies

### Bước 2: Tạo Policies (Nếu Cần)

Nếu bucket chưa có policies hoặc gặp lỗi quyền truy cập, tạo các policies sau:

#### Policy 1: Cho phép Upload (INSERT)

```sql
-- Policy name: Allow authenticated users to upload
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated users to upload lessons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials'
);
```

#### Policy 2: Cho phép Đọc (SELECT)

```sql
-- Policy name: Allow public read access
-- Operation: SELECT
-- Target roles: public

CREATE POLICY "Allow public read access to lessons"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'lesson-materials'
);
```

#### Policy 3: Cho phép Xóa (DELETE) - Cho Admin/Teacher

```sql
-- Policy name: Allow teachers and admins to delete
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow teachers and admins to delete lessons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  -- Có thể thêm điều kiện kiểm tra role ở đây nếu cần
);
```

### Bước 3: Kiểm Tra Public Access

1. Vào **Storage** → **Buckets**
2. Click vào bucket `lesson-materials`
3. Đảm bảo **"Public bucket"** đã được bật (toggle ON)

---

## 3. Kiểm Tra Cấu Hình

### Chạy Script Kiểm Tra

```bash
cd backend
python test_lessons_storage.py
```

Script sẽ kiểm tra:
- ✅ Biến môi trường (SUPABASE_URL, SUPABASE_KEY)
- ✅ Kết nối Supabase
- ✅ Bảng `lessons` trong database
- ✅ Bucket `lesson-materials` tồn tại
- ✅ Quyền upload file
- ✅ Quyền lấy public URL

### Kết Quả Mong Đợi

```
✅ TẤT CẢ ĐỀU SẴN SÀNG! Có thể upload lessons.
```

---

## 4. Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Bucket not found" hoặc "Bucket does not exist"

**Nguyên nhân**: Bucket `lesson-materials` chưa được tạo.

**Giải pháp**:
1. Làm theo [Bước 1: Tạo Storage Bucket](#1-tạo-storage-bucket)
2. Đảm bảo tên bucket chính xác là `lesson-materials`

---

### Lỗi 2: "Failed to upload file" hoặc "Permission denied"

**Nguyên nhân**: Thiếu quyền truy cập (RLS policies).

**Giải pháp**:
1. Kiểm tra RLS policies trong Supabase Dashboard
2. Tạo các policies như trong [Bước 2: Cấu Hình Quyền Truy Cập](#2-cấu-hình-quyền-truy-cập)
3. Đảm bảo user đã authenticated (có token)

---

### Lỗi 3: "Failed to generate file URL" hoặc "get_public_url failed"

**Nguyên nhân**: Bucket không được đặt là public.

**Giải pháp**:
1. Vào **Storage** → **Buckets**
2. Click vào bucket `lesson-materials`
3. Bật toggle **"Public bucket"** → **ON**
4. Hoặc sử dụng service role key thay vì anon key (không khuyến nghị)

---

### Lỗi 4: "File is too large"

**Nguyên nhân**: File vượt quá giới hạn kích thước.

**Giải pháp**:
1. Tăng **File size limit** trong cấu hình bucket
2. Hoặc giảm kích thước file trước khi upload

---

### Lỗi 5: "Failed to create lesson record"

**Nguyên nhân**: 
- Bảng `lessons` chưa được tạo
- Lỗi khi insert vào database
- File đã upload nhưng insert DB thất bại

**Giải pháp**:
1. Chạy file `lessons_schema.sql` để tạo bảng:
   ```bash
   # Trong Supabase Dashboard → SQL Editor
   # Copy nội dung từ lessons_schema.sql và chạy
   ```

2. Kiểm tra log backend để xem lỗi cụ thể
3. File đã upload sẽ được tự động xóa nếu insert DB thất bại (cleanup)

---

## 5. Kiểm Tra Biến Môi Trường

Đảm bảo file `.env` trong thư mục `backend` có các biến sau:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-or-anon-key
```

**Lưu ý**:
- Sử dụng **Service Role Key** để có đầy đủ quyền
- Hoặc sử dụng **Anon Key** nếu đã cấu hình RLS policies đúng

---

## 6. Test Upload Thủ Công

Sau khi cấu hình xong, bạn có thể test bằng cách:

1. Chạy backend:
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. Test endpoint:
   ```bash
   curl -X POST "http://localhost:8000/api/lessons/upload" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "classroom_id=YOUR_CLASSROOM_ID" \
     -F "title=Test Lesson" \
     -F "description=Test Description" \
     -F "file=@test.pdf"
   ```

---

## 7. Cấu Trúc File Trong Bucket

Files sẽ được lưu theo cấu trúc:
```
lesson-materials/
  └── {classroom_id}/
      └── {timestamp}_{filename}
```

Ví dụ:
```
lesson-materials/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1703123456_lesson_1.pdf
```

---

## 8. Troubleshooting

### Xem Log Backend

Khi gặp lỗi, kiểm tra log backend để xem chi tiết:

```bash
# Log sẽ hiển thị:
# - Đường dẫn file đang upload
# - Response từ storage
# - Public URL được tạo
# - Dữ liệu lesson đang insert
# - Lỗi chi tiết nếu có
```

### Kiểm Tra Trong Supabase Dashboard

1. **Storage** → **Files**: Xem files đã upload
2. **Database** → **Tables** → **lessons**: Xem records trong database
3. **Logs**: Xem error logs nếu có

---

## ✅ Checklist Hoàn Thành

Trước khi sử dụng tính năng upload lessons, đảm bảo:

- [ ] Bucket `lesson-materials` đã được tạo
- [ ] Bucket được đặt là **Public**
- [ ] RLS policies đã được cấu hình (nếu cần)
- [ ] Bảng `lessons` đã được tạo trong database
- [ ] Biến môi trường `SUPABASE_URL` và `SUPABASE_KEY` đã được cấu hình
- [ ] Script `test_lessons_storage.py` chạy thành công
- [ ] Có thể upload file test thành công

---

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề:
1. Chạy script `test_lessons_storage.py` và gửi kết quả
2. Kiểm tra log backend để xem lỗi chi tiết
3. Kiểm tra Supabase Dashboard → Logs

