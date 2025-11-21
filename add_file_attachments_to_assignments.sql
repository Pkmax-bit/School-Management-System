-- Migration: Thêm hỗ trợ upload hình ảnh/link cho câu hỏi và file/link cho bài nộp

-- 1. Thêm cột cho câu hỏi: hình ảnh và link đính kèm (cho giáo viên)
ALTER TABLE assignment_questions 
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_link TEXT;

-- 2. Thêm cột cho bài nộp: files và links (cho học sinh)
ALTER TABLE assignment_submissions 
    ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Cấu trúc JSONB cho files:
-- [{"name": "filename.docx", "url": "https://...", "type": "word|zip|other", "size": 12345}]
-- Cấu trúc JSONB cho links:
-- ["https://drive.google.com/...", "https://github.com/..."]

-- 3. Tạo index cho tìm kiếm
CREATE INDEX IF NOT EXISTS idx_assignment_questions_image_url ON assignment_questions(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_files ON assignment_submissions USING GIN(files);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_links ON assignment_submissions USING GIN(links);

