-- Migration: Thêm cột start_date (ngày giờ mở bài tập) vào bảng assignments
-- start_date xác định khi nào bài tập được mở cho học sinh

-- Thêm cột start_date vào bảng assignments
ALTER TABLE assignments 
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

-- Tạo index cho start_date để tối ưu query
CREATE INDEX IF NOT EXISTS idx_assignments_start_date ON assignments(start_date);

-- Thêm comment cho cột
COMMENT ON COLUMN assignments.start_date IS 'Ngày giờ mở bài tập cho học sinh. Nếu NULL, bài tập có thể được mở ngay lập tức.';

