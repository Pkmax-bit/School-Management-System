# Sửa Lỗi Upload Lessons - 500 Internal Server Error

## ✅ Đã Sửa

### 1. Cải Thiện Xử Lý Lỗi trong `backend/routers/lessons.py`

- ✅ **Kiểm tra classroom tồn tại** trước khi upload
- ✅ **Validate file** (tên file, không rỗng)
- ✅ **Xử lý lỗi chi tiết** với traceback logging
- ✅ **Fallback cho public URL** nếu `get_public_url()` thất bại
- ✅ **Tự động cleanup** file đã upload nếu insert database thất bại
- ✅ **Logging chi tiết** để debug dễ dàng

### 2. Tạo Script Kiểm Tra

- ✅ `test_lessons_storage.py` - Script kiểm tra cấu hình Supabase Storage

### 3. Tạo Hướng Dẫn

- ✅ `LESSONS_STORAGE_SETUP.md` - Hướng dẫn cấu hình storage bucket

## 🔍 Kết Quả Kiểm Tra

Script `test_lessons_storage.py` đã chạy thành công:
- ✅ Biến môi trường: OK
- ✅ Bảng lessons: OK  
- ✅ Storage bucket: OK (hoàn toàn sẵn sàng)

## 🚀 Các Bước Tiếp Theo

### 1. Restart Backend

Nếu backend đang chạy, cần restart để áp dụng code mới:

```bash
# Dừng backend (Ctrl+C nếu đang chạy)
# Sau đó khởi động lại:
python start_backend_simple.py
```

Hoặc nếu đang dùng `--reload`, code sẽ tự động reload.

### 2. Test Upload Lesson

1. Mở frontend và thử upload một lesson
2. Xem log backend để kiểm tra:
   - Đường dẫn file đang upload
   - Response từ storage
   - Public URL được tạo
   - Dữ liệu lesson đang insert

### 3. Kiểm Tra Log Backend

Khi upload, log sẽ hiển thị:
```
Uploading file to path: {classroom_id}/{timestamp}_{filename}
Storage upload response: {...}
Public URL: https://...
Inserting lesson data: {...}
```

Nếu có lỗi, sẽ hiển thị:
```
Error uploading file: {error_message}
Traceback: {...}
```

## 🐛 Xử Lý Lỗi (Nếu Vẫn Còn)

### Nếu vẫn gặp lỗi 500:

1. **Xem log backend** để biết lỗi cụ thể
2. **Kiểm tra**:
   - Token authentication có hợp lệ không
   - Classroom ID có đúng không
   - File có quá lớn không (max 50MB)
   - User có role "teacher" hoặc "admin" không

3. **Chạy lại script kiểm tra**:
   ```bash
   python test_lessons_storage.py
   ```

### Các Lỗi Thường Gặp:

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-------------|-----------|
| `403 Forbidden` | Không phải teacher/admin | Kiểm tra role của user |
| `404 Not Found` | Classroom không tồn tại | Kiểm tra classroom_id |
| `Failed to upload file` | Lỗi storage | Xem log chi tiết |
| `Failed to create lesson record` | Lỗi database | Kiểm tra bảng lessons |

## 📝 Thay Đổi Code Chi Tiết

### File: `backend/routers/lessons.py`

**Trước:**
- Không kiểm tra classroom tồn tại
- Xử lý lỗi đơn giản
- Không có cleanup khi lỗi

**Sau:**
- ✅ Kiểm tra classroom trước khi upload
- ✅ Validate file đầy đủ
- ✅ Logging chi tiết với traceback
- ✅ Fallback cho public URL
- ✅ Tự động cleanup file nếu lỗi

## ✅ Checklist

- [x] Code đã được cập nhật
- [x] Script kiểm tra đã chạy thành công
- [x] Cấu hình Supabase đã đúng
- [ ] Backend đã được restart
- [ ] Đã test upload lesson thành công

## 📞 Hỗ Trợ

Nếu vẫn gặp vấn đề:
1. Xem log backend chi tiết
2. Chạy `test_lessons_storage.py` và gửi kết quả
3. Kiểm tra Supabase Dashboard → Logs

