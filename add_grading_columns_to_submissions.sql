-- Migration: Thêm các cột cần thiết cho hệ thống quản lý điểm số
-- Đảm bảo bảng assignment_submissions có đầy đủ các cột: files, links, feedback

-- 1. Thêm cột files (JSONB) nếu chưa có
ALTER TABLE assignment_submissions 
    ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- 2. Thêm cột links (JSONB) nếu chưa có  
ALTER TABLE assignment_submissions 
    ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- 3. Thêm cột feedback (TEXT) để giáo viên/admin nhập nhận xét
ALTER TABLE assignment_submissions 
    ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 4. Tạo index cho files và links để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_files 
    ON assignment_submissions USING GIN(files) 
    WHERE files IS NOT NULL AND jsonb_array_length(files) > 0;

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_links 
    ON assignment_submissions USING GIN(links) 
    WHERE links IS NOT NULL AND jsonb_array_length(links) > 0;

-- 5. Tạo index cho feedback để tìm kiếm
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_feedback 
    ON assignment_submissions(feedback) 
    WHERE feedback IS NOT NULL;

-- 6. Tạo index cho is_graded và score để truy vấn thống kê nhanh hơn
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded 
    ON assignment_submissions(is_graded, score) 
    WHERE is_graded = TRUE;

-- Cấu trúc JSONB cho files:
-- [{"name": "filename.docx", "url": "https://...", "type": "word|zip|other", "size": 12345}]
-- Cấu trúc JSONB cho links:
-- ["https://drive.google.com/...", "https://github.com/..."]

-- Ghi chú:
-- - files: Mảng các object chứa thông tin file đính kèm
-- - links: Mảng các string chứa URL liên kết
-- - feedback: Text nhận xét của giáo viên/admin cho học sinh


