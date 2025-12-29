# 🎥 Hướng Dẫn Sử Dụng Nhiều YouTube URLs

## Tổng Quan

Hệ thống đã được nâng cấp để hỗ trợ **nhiều YouTube URLs** cho mỗi bài học. Giáo viên có thể:
- ✅ Gắn nhiều video YouTube vào một bài học
- ✅ Thêm tiêu đề và mô tả cho từng video
- ✅ Sắp xếp thứ tự hiển thị
- ✅ Sửa/xóa từng video riêng biệt
- ✅ Học sinh xem được tất cả videos trong giao diện

## 📋 Yêu Cầu Hệ Thống

### Database Migration (Chạy một lần)

Trước khi sử dụng, cần tạo bảng `lesson_youtube_urls`:

```sql
-- Chạy trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lesson_youtube_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_youtube_urls_lesson_id ON lesson_youtube_urls(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_youtube_urls_sort_order ON lesson_youtube_urls(sort_order);

COMMENT ON TABLE lesson_youtube_urls IS 'Multiple YouTube URLs for lessons';
COMMENT ON COLUMN lesson_youtube_urls.lesson_id IS 'Reference to the lesson';
COMMENT ON COLUMN lesson_youtube_urls.youtube_url IS 'YouTube video URL';
COMMENT ON COLUMN lesson_youtube_urls.title IS 'Optional title for the video';
COMMENT ON COLUMN lesson_youtube_urls.description IS 'Optional description for the video';
COMMENT ON COLUMN lesson_youtube_urls.sort_order IS 'Display order of videos';
```

### API Endpoints Mới

```
POST   /api/lessons/{lesson_id}/youtube-urls          # Thêm YouTube URL
GET    /api/lessons/{lesson_id}/youtube-urls          # Lấy danh sách YouTube URLs
PUT    /api/lessons/{lesson_id}/youtube-urls/{id}     # Cập nhật YouTube URL
DELETE /api/lessons/{lesson_id}/youtube-urls/{id}     # Xóa YouTube URL
```

## 🎯 Cách Sử Dụng

### 1. Thêm Nhiều YouTube URLs Khi Tạo/Sửa Bài Học

#### Giao Diện Admin/Teacher:
1. Vào trang tạo/sửa bài học
2. Điền thông tin cơ bản (tiêu đề, mô tả)
3. **(Tùy chọn)** Thêm YouTube URL đơn lẻ (legacy)
4. **(Mới)** Nhấn "Thêm Video" trong phần "YouTube Videos"
5. Điền:
   - **YouTube URL**: Link video (bắt buộc)
   - **Tiêu đề**: Tên video (tùy chọn)
   - **Mô tả**: Mô tả video (tùy chọn)
6. Nhấn "Thêm Video" để thêm video tiếp theo
7. Sắp xếp thứ tự bằng cách kéo thả hoặc sửa sort_order

### 2. Quản Lý YouTube URLs

#### Thêm Video Mới:
```javascript
POST /api/lessons/{lesson_id}/youtube-urls
{
  "lesson_id": "uuid",
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "title": "Video Title",
  "description": "Video description",
  "sort_order": 0
}
```

#### Sửa Video:
- Nhấn icon ✏️ bên cạnh video
- Sửa thông tin và nhấn "Cập nhật"

#### Xóa Video:
- Nhấn icon ❌ bên cạnh video
- Xác nhận xóa

### 3. Xem Bài Học Với Nhiều Videos

#### Học Sinh:
1. Vào trang bài học
2. Thấy section "Video YouTube" trong sidebar
3. Click vào từng video để xem
4. Videos hiển thị theo thứ tự sort_order

#### Giáo Viên/Admin:
- Preview mode tương tự học sinh
- Có thể sửa/xóa videos trực tiếp

## 🔧 Chi Tiết Kỹ Thuật

### Database Schema

```sql
lesson_youtube_urls (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Frontend Types

```typescript
interface LessonYouTubeUrl {
  id: string;
  lesson_id: string;
  youtube_url: string;
  title?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  // ... existing fields
  youtube_urls?: LessonYouTubeUrl[]; // Mới
}
```

### Backward Compatibility

- ✅ Hỗ trợ YouTube URL đơn lẻ (legacy)
- ✅ Migration dữ liệu tự động
- ✅ UI hiển thị cả 2 loại
- ✅ API tương thích ngược

## 🧪 Test Cases

### Test 1: API Endpoints (Chạy script test)
```bash
# Chạy script test API
python test_youtube_urls_api.py
```

### Test 2: Frontend UI
1. **Tạo lesson mới** trong admin dashboard
2. **Thêm nhiều YouTube URLs:**
   - Nhấn "Thêm Video" trong section "YouTube Videos"
   - Thêm 2-3 videos khác nhau
   - Lưu lesson
3. **Xem từ student page:**
   - Thấy section "Video YouTube" với tất cả videos
   - Click từng video xem được nội dung khác nhau

### Test 3: Edit/Delete Videos
1. **Edit lesson** đã tạo
2. **Sửa** tiêu đề video trong section "YouTube Videos"
3. **Xóa** một video bằng nút ❌
4. **Lưu** và kiểm tra kết quả

### Test 4: Mixed Content
1. Tạo lesson với:
   - 2 YouTube videos
   - 1-2 files
   - Mô tả đầy đủ
2. Xem từ cả student và teacher pages
3. Verify priority display: YouTube → Files → Description

## 🚀 Lợi Ích

### Cho Giáo Viên:
- ✅ Tạo bài học với nhiều video liên quan
- ✅ Phân chia nội dung thành nhiều phần
- ✅ Dễ dàng cập nhật từng video
- ✅ Tăng tương tác với học sinh

### Cho Học Sinh:
- ✅ Xem nhiều videos trong 1 bài học
- ✅ Điều hướng dễ dàng giữa các video
- ✅ Tiết kiệm thời gian chuyển trang
- ✅ Học tập liên tục

### Cho Hệ Thống:
- ✅ Database schema mở rộng
- ✅ API RESTful hoàn chỉnh
- ✅ UI/UX nhất quán
- ✅ Performance tối ưu với indexes

## 🔍 Troubleshooting

### Lỗi "table doesn't exist"
```sql
-- Chạy migration SQL ở trên trong Supabase dashboard
```

### Lỗi "permission denied"
- Chỉ admin/teacher mới được thêm/sửa/xóa YouTube URLs
- Kiểm tra role trong token

### Videos không hiển thị
- Kiểm tra YouTube URL format
- Đảm bảo video không private/restricted
- Check console logs cho errors

### Thứ tự không đúng
- Sửa sort_order trong API call
- Refresh trang để cập nhật

## 🎉 Kết Luận

Tính năng **nhiều YouTube URLs** đã hoàn thành và sẵn sàng sử dụng! Giáo viên có thể tạo các bài học phong phú với nhiều video, tăng khả năng tương tác và hiệu quả học tập cho học sinh.

**Bắt đầu sử dụng ngay hôm nay!** 🎥📚
