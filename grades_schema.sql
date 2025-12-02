-- Grades Management Schema
-- Bảng quản lý điểm số (Manual grades - khác với assignment grades)

-- Tạo bảng grades
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
    grade_type VARCHAR(50) NOT NULL CHECK (grade_type IN ('midterm', 'final', 'regular', 'other')),
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
    max_score DECIMAL(5,2) NOT NULL DEFAULT 10.0 CHECK (max_score > 0),
    notes TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT score_less_than_max CHECK (score <= max_score)
);

-- Tạo indexes cho performance
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_classroom_id ON grades(classroom_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_grade_type ON grades(grade_type);
CREATE INDEX IF NOT EXISTS idx_grades_graded_at ON grades(graded_at);

-- Composite index cho queries phổ biến
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON grades(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_classroom_subject ON grades(classroom_id, subject_id);

-- Trigger cho updated_at
CREATE TRIGGER update_grades_updated_at 
BEFORE UPDATE ON grades 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE grades IS 'Bảng lưu điểm số thủ công (giữa kỳ, cuối kỳ, thường xuyên)';
COMMENT ON COLUMN grades.grade_type IS 'Loại điểm: midterm (giữa kỳ), final (cuối kỳ), regular (thường xuyên), other (khác)';
COMMENT ON COLUMN grades.score IS 'Điểm số (phải <= max_score)';
COMMENT ON COLUMN grades.max_score IS 'Điểm tối đa (mặc định 10.0)';
