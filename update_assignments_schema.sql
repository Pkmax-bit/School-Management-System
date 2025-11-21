-- Migration: Cập nhật schema cho bài tập trắc nghiệm và tự luận
-- Hỗ trợ gán bài tập cho nhiều lớp học

-- 1. Tạo bảng junction assignment_classrooms
CREATE TABLE IF NOT EXISTS assignment_classrooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, classroom_id)
);

-- 2. Tạo indexes cho bảng assignment_classrooms
CREATE INDEX IF NOT EXISTS idx_assignment_classrooms_assignment_id ON assignment_classrooms(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_classrooms_classroom_id ON assignment_classrooms(classroom_id);

-- 3. Thêm các cột mới vào bảng assignments (nếu chưa có)
ALTER TABLE assignments 
    ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attempts_allowed INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE;

-- 4. Migration dữ liệu: Nếu assignments có classroom_id, di chuyển sang bảng junction
-- Lưu ý: Chỉ chạy nếu còn dữ liệu trong classroom_id cũ
DO $$
BEGIN
    -- Di chuyển dữ liệu từ classroom_id sang assignment_classrooms
    INSERT INTO assignment_classrooms (assignment_id, classroom_id)
    SELECT id, classroom_id
    FROM assignments
    WHERE classroom_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM assignment_classrooms ac 
        WHERE ac.assignment_id = assignments.id 
        AND ac.classroom_id = assignments.classroom_id
    );
END $$;

-- 5. Làm cho classroom_id có thể NULL (vì chúng ta dùng assignment_classrooms)
ALTER TABLE assignments 
    ALTER COLUMN classroom_id DROP NOT NULL;

-- 6. (Tùy chọn) Sau khi migration xong, có thể xóa cột classroom_id cũ
-- ALTER TABLE assignments DROP COLUMN IF EXISTS classroom_id;

-- 7. Cập nhật trigger cho updated_at
CREATE TRIGGER update_assignment_classrooms_updated_at 
    BEFORE UPDATE ON assignment_classrooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

