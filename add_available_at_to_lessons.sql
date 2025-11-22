-- Add available_at column to lessons table
-- This column stores the date and time when the lesson becomes available for students

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance when filtering by available_at
CREATE INDEX IF NOT EXISTS idx_lessons_available_at ON lessons(available_at);

-- Add comment to explain the column
COMMENT ON COLUMN lessons.available_at IS 'Ngày giờ bài học được mở cho học sinh. Nếu NULL, bài học có thể truy cập ngay lập tức.';

