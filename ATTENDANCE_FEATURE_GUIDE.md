# Hướng dẫn sử dụng chức năng điểm danh học sinh và xác nhận lớp dạy

## Tổng quan

Chức năng điểm danh học sinh và xác nhận lớp dạy cho phép giáo viên:
- Điểm danh học sinh trong các lớp học
- Xác nhận hoàn thành lớp dạy
- Quản lý trạng thái lớp học
- Xuất báo cáo điểm danh

## Các tính năng chính

### 1. Điểm danh học sinh

#### Các trạng thái điểm danh:
- **Có mặt** (Present): Học sinh có mặt đúng giờ
- **Vắng mặt** (Absent): Học sinh không có mặt
- **Đi muộn** (Late): Học sinh đến muộn
- **Có phép** (Excused): Học sinh vắng mặt có phép

#### Tính năng:
- Tìm kiếm học sinh theo tên hoặc mã học sinh
- Lọc theo trạng thái điểm danh
- Thống kê tổng quan (số học sinh có mặt, vắng mặt, đi muộn, có phép)
- Lưu điểm danh vào hệ thống
- Xuất báo cáo Excel

### 2. Xác nhận lớp dạy

#### Các trạng thái lớp học:
- **Đã dạy** (Confirmed): Lớp học đã hoàn thành
- **Hủy lớp** (Cancelled): Lớp học bị hủy
- **Dời lịch** (Rescheduled): Lớp học được dời sang ngày khác

#### Thông tin xác nhận:
- Giờ bắt đầu và kết thúc thực tế
- Số học sinh có mặt
- Tài liệu sử dụng trong lớp
- Bài tập về nhà giao cho học sinh
- Ngày học tiếp theo (nếu dời lịch)
- Ghi chú thêm
- Chữ ký giáo viên

## Cách sử dụng

### Truy cập chức năng điểm danh

1. **Từ Teacher Dashboard:**
   - Đăng nhập với tài khoản teacher
   - Click vào menu "Điểm danh" trong sidebar
   - Hoặc click vào nút "Điểm danh" trên dashboard

2. **Từ trang chủ:**
   - Click vào nút "Teacher Dashboard"
   - Sau đó click vào menu "Điểm danh"

### Điểm danh học sinh

1. **Chọn lớp học:**
   - Tìm lớp học cần điểm danh
   - Click vào nút "Điểm danh" (màu xanh)

2. **Thực hiện điểm danh:**
   - Xem danh sách học sinh
   - Click vào các nút trạng thái cho từng học sinh:
     - ✅ Có mặt
     - ❌ Vắng mặt  
     - ⏰ Đi muộn
     - ⚠️ Có phép
   - Thêm ghi chú nếu cần

3. **Lưu điểm danh:**
   - Click nút "Lưu điểm danh" (màu xanh)
   - Hệ thống sẽ lưu và cập nhật trạng thái lớp

### Xác nhận lớp dạy

1. **Chọn lớp cần xác nhận:**
   - Tìm lớp học đã điểm danh
   - Click vào nút "Xác nhận" (màu xám)

2. **Điền thông tin xác nhận:**
   - Chọn trạng thái lớp học
   - Điền giờ bắt đầu/kết thúc thực tế
   - Nhập số học sinh có mặt
   - Thêm tài liệu đã sử dụng
   - Ghi bài tập về nhà
   - Thêm ghi chú nếu cần
   - Ký tên xác nhận

3. **Lưu xác nhận:**
   - Click nút "Xác nhận lớp học"
   - Hệ thống sẽ lưu thông tin xác nhận

## Giao diện người dùng

### Trang quản lý điểm danh

```
┌─────────────────────────────────────────────────────────┐
│  📊 Quản lý điểm danh                                   │
│  Điểm danh học sinh và xác nhận lớp dạy                 │
│  [Tạo lớp mới]                                          │
├─────────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm  📅 Ngày  📊 Trạng thái  [Xuất báo cáo]   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Lớp 10A1    │ │ Lớp 10A2    │ │ Lớp 11B1    │       │
│  │ Toán học    │ │ Vật lý      │ │ Hóa học     │       │
│  │ 07:00-08:30 │ │ 08:45-10:15 │ │ 10:30-12:00 │       │
│  │ 35 học sinh │ │ 32 học sinh │ │ 28 học sinh │       │
│  │ [Điểm danh] │ │ [Điểm danh] │ │ [Xem] [Xác  │       │
│  │ [Xác nhận]  │ │ [Xác nhận]  │ │ nhận]       │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Màn hình điểm danh

```
┌─────────────────────────────────────────────────────────┐
│  👥 Điểm danh lớp học                                   │
│  Lớp: 10A1 | Môn: Toán học | Ngày: 2024-01-15         │
│  Tổng: 35 học sinh                                      │
├─────────────────────────────────────────────────────────┤
│  ✅ 30 Có mặt  ❌ 3 Vắng mặt  ⏰ 2 Đi muộn  ⚠️ 0 Có phép │
├─────────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm học sinh  📊 Lọc theo trạng thái          │
├─────────────────────────────────────────────────────────┤
│  👤 Nguyễn Văn An    [✅] [❌] [⏰] [⚠️]               │
│  👤 Trần Thị Bình    [✅] [❌] [⏰] [⚠️]               │
│  👤 Lê Văn Cường     [✅] [❌] [⏰] [⚠️]               │
│  ...                                                   │
├─────────────────────────────────────────────────────────┤
│  [Hủy]  [Xuất Excel]  [Lưu điểm danh]                  │
└─────────────────────────────────────────────────────────┘
```

### Màn hình xác nhận lớp

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Xác nhận lớp dạy                                    │
│  Xác nhận thông tin và hoàn thành lớp học               │
│  Trạng thái: Đã xác nhận | 2024-01-15 12:00:00        │
├─────────────────────────────────────────────────────────┤
│  📚 Thông tin lớp học                                  │
│  Lớp: 10A1 | Môn: Toán học | 35 học sinh              │
│  Ngày: 2024-01-15 | 07:00-08:30 | Phòng A101          │
├─────────────────────────────────────────────────────────┤
│  ✏️ Xác nhận chi tiết                                  │
│  Trạng thái: [Đã dạy] [Hủy lớp] [Dời lịch]            │
│  Giờ bắt đầu: 07:00 | Giờ kết thúc: 08:30             │
│  Số học sinh có mặt: 32                               │
│  Tài liệu: [Sách giáo khoa] [Bài tập]                 │
│  Bài tập về nhà: Làm bài 1-10 trang 25                │
│  Ghi chú: Lớp học diễn ra tốt, học sinh tích cực      │
│  Chữ ký: Nguyễn Văn Giáo                              │
├─────────────────────────────────────────────────────────┤
│  [Hủy]  [Xem trước]  [Xác nhận lớp học]                │
└─────────────────────────────────────────────────────────┘
```

## Lưu ý quan trọng

### Bảo mật
- Chỉ giáo viên có quyền truy cập chức năng điểm danh
- Dữ liệu điểm danh được mã hóa và lưu trữ an toàn
- Chữ ký giáo viên được xác thực

### Hiệu suất
- Hệ thống hỗ trợ điểm danh cho lớp có tối đa 50 học sinh
- Dữ liệu được lưu tự động mỗi 30 giây
- Có thể xuất báo cáo Excel cho lớp lớn

### Tương thích
- Hỗ trợ tất cả trình duyệt hiện đại
- Responsive design cho mobile và tablet
- Tương thích với screen reader

## Xử lý sự cố

### Lỗi thường gặp

1. **Không thể lưu điểm danh:**
   - Kiểm tra kết nối internet
   - Refresh trang và thử lại
   - Liên hệ admin nếu vấn đề tiếp tục

2. **Danh sách học sinh không hiển thị:**
   - Kiểm tra lớp học có học sinh chưa
   - Refresh trang
   - Liên hệ admin để kiểm tra dữ liệu

3. **Không thể xuất báo cáo:**
   - Kiểm tra trình duyệt có chặn popup không
   - Thử trình duyệt khác
   - Liên hệ admin nếu vấn đề tiếp tục

### Hỗ trợ kỹ thuật

- **Email:** support@school.com
- **Hotline:** 1900-xxxx
- **Thời gian:** 8:00 - 17:00 (T2-T6)

## Cập nhật và nâng cấp

### Phiên bản hiện tại: v1.0.0
- Điểm danh cơ bản
- Xác nhận lớp dạy
- Xuất báo cáo Excel
- Giao diện responsive

### Kế hoạch phát triển
- v1.1.0: Thêm chức năng điểm danh tự động
- v1.2.0: Tích hợp camera nhận diện khuôn mặt
- v1.3.0: Thông báo tự động cho phụ huynh
- v2.0.0: AI phân tích hành vi học sinh

---

**Lưu ý:** Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra phiên bản mới nhất trên hệ thống.


