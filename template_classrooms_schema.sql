-- Migration: Tạo schema cho chức năng Template Classrooms (Lớp mẫu)
-- Template classrooms có thể chứa bài học và bài tập, dùng để tạo lớp học mới

-- 1. Thêm cột is_template vào bảng classrooms
ALTER TABLE classrooms 
    ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- 2. Tạo index cho is_template để query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_classrooms_is_template ON classrooms(is_template) WHERE is_template = TRUE;

-- 3. Tạo bảng template_usage để theo dõi việc sử dụng template
-- Lưu lại lịch sử khi nào template được dùng để tạo lớp mới
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    created_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 4. Tạo indexes cho template_usage
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_classroom_id ON template_usage(created_classroom_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_by ON template_usage(created_by);

-- 5. Thêm comment cho các cột và bảng
COMMENT ON COLUMN classrooms.is_template IS 'Đánh dấu lớp học là template (mẫu) hay lớp học thực tế';
COMMENT ON TABLE template_usage IS 'Lưu lịch sử sử dụng template để tạo lớp học mới';

-- 6. Ràng buộc: Template không thể có học sinh (students) gán vào
-- Điều này được xử lý ở application level, không cần constraint ở DB level
-- vì students.classroom_id có thể NULL

-- 7. Ràng buộc: Template không thể có schedules (lịch học thực tế)
-- Cũng được xử lý ở application level

