-- ============================================
-- Migration: Template Classrooms Feature
-- Chạy script này trong Supabase SQL Editor
-- ============================================

-- 1. Thêm cột is_template vào bảng classrooms
ALTER TABLE classrooms 
    ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- 2. Tạo index cho is_template để query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_classrooms_is_template 
ON classrooms(is_template) 
WHERE is_template = TRUE;

-- 3. Tạo bảng template_usage để theo dõi việc sử dụng template
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    created_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 4. Tạo indexes cho template_usage
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id 
ON template_usage(template_id);

CREATE INDEX IF NOT EXISTS idx_template_usage_created_classroom_id 
ON template_usage(created_classroom_id);

CREATE INDEX IF NOT EXISTS idx_template_usage_created_by 
ON template_usage(created_by);

-- 5. Thêm comment cho các cột và bảng
COMMENT ON COLUMN classrooms.is_template IS 'Đánh dấu lớp học là template (mẫu) hay lớp học thực tế';
COMMENT ON TABLE template_usage IS 'Lưu lịch sử sử dụng template để tạo lớp học mới';

-- ============================================
-- Kiểm tra kết quả (chạy sau khi migration)
-- ============================================

-- Kiểm tra cột is_template
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'classrooms' 
AND column_name = 'is_template';

-- Kiểm tra bảng template_usage
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'template_usage'
ORDER BY ordinal_position;

-- Kiểm tra indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('classrooms', 'template_usage')
ORDER BY tablename, indexname;

