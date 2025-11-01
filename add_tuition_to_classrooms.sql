-- Add tuition columns to classrooms table
-- Thêm cột học phí vào bảng lớp học

-- Add tuition_per_session column (Học phí mỗi buổi)
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS tuition_per_session DECIMAL(15,2) DEFAULT 50000;

-- Add sessions_per_week column (Số buổi mỗi tuần)
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS sessions_per_week INT DEFAULT 2;

-- Add comment for documentation
COMMENT ON COLUMN classrooms.tuition_per_session IS 'Học phí mỗi buổi học (VND), mặc định: 50,000 VND';
COMMENT ON COLUMN classrooms.sessions_per_week IS 'Số buổi học mỗi tuần, mặc định: 2 buổi/tuần';

