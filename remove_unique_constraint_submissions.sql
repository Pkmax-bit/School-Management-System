-- Migration: Xóa constraint UNIQUE và thêm attempt_number để hỗ trợ nhiều lần làm bài
-- Remove UNIQUE constraint and add attempt_number to support multiple attempts

-- 1. Xóa constraint UNIQUE cũ
ALTER TABLE assignment_submissions 
DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_student_id_key;

-- 2. Thêm cột attempt_number để đánh số lần làm bài
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- 3. Cập nhật attempt_number cho các submissions hiện có
-- Đếm số lần làm bài và gán attempt_number
DO $$
DECLARE
    submission_record RECORD;
    attempt_count INTEGER;
BEGIN
    FOR submission_record IN 
        SELECT assignment_id, student_id, id, submitted_at
        FROM assignment_submissions
        ORDER BY assignment_id, student_id, submitted_at
    LOOP
        -- Đếm số submissions trước submission này (cùng assignment_id và student_id)
        SELECT COUNT(*) INTO attempt_count
        FROM assignment_submissions
        WHERE assignment_id = submission_record.assignment_id
          AND student_id = submission_record.student_id
          AND submitted_at <= submission_record.submitted_at;
        
        -- Cập nhật attempt_number
        UPDATE assignment_submissions
        SET attempt_number = attempt_count
        WHERE id = submission_record.id;
    END LOOP;
END $$;

-- 4. Tạo index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_attempt 
ON assignment_submissions(assignment_id, student_id, attempt_number);

-- 5. Tạo composite index để tối ưu query theo assignment và student
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_student 
ON assignment_submissions(assignment_id, student_id);


