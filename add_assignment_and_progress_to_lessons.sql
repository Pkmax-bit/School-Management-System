-- Add assignment_id to lessons table for linking assignments
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_assignment_id ON lessons(assignment_id);

-- Create lesson_progress table to track student progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lesson_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_classroom_id ON lesson_progress(classroom_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_classroom ON lesson_progress(user_id, classroom_id);

-- Trigger for updated_at
CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON COLUMN lessons.assignment_id IS 'Liên kết với bài tập (tự luận/trắc nghiệm) của lớp học';
COMMENT ON TABLE lesson_progress IS 'Lưu tiến trình học của học sinh cho từng bài học';

