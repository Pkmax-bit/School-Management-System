# Troubleshooting Phase 1 Test

## ⚠️ Vấn Đề: PostgREST Schema Cache

Sau khi tạo các bảng mới qua migration, PostgREST (Supabase API layer) cần refresh schema cache để nhận ra các bảng mới.

## ✅ Giải Pháp

### Cách 1: Refresh Schema trong Supabase Dashboard (Khuyến nghị)

1. Truy cập: https://supabase.com/dashboard
2. Chọn project **Department-botchat** (mfmijckzlhevduwfigkl)
3. Vào **Settings** → **API**
4. Tìm nút **"Reload Schema"** hoặc **"Refresh Schema"**
5. Click để refresh

### Cách 2: Restart Project

1. Vào Supabase Dashboard
2. **Settings** → **General**
3. **Restart Project** (nếu có option)

### Cách 3: Đợi tự động (5-10 phút)

PostgREST sẽ tự động refresh schema cache sau một khoảng thời gian.

### Cách 4: Query trực tiếp vào các bảng

Đã chạy query vào các bảng để trigger refresh. Đợi 1-2 phút rồi test lại.

## 🔍 Xác Nhận Schema Đã Refresh

Sau khi refresh, chạy lại test:
```bash
python test_phase1_functions.py
```

Nếu vẫn lỗi, kiểm tra:
1. Backend server đang chạy: `http://localhost:8000`
2. Database connection đúng project
3. Token authentication hợp lệ

## 📝 Lưu Ý

- Schema cache refresh thường mất 1-5 phút
- Nếu vẫn lỗi sau 10 phút, thử restart Supabase project
- Các bảng đã được tạo thành công trong database
- Vấn đề chỉ là PostgREST chưa nhận ra

