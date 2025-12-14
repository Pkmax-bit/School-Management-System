-- ============================================================
-- NOTIFICATIONS TABLE SCHEMA
-- Bảng thông báo cho giáo viên và học sinh
-- ============================================================
-- Hướng dẫn: Copy toàn bộ nội dung file này và paste vào Supabase SQL Editor
-- ============================================================

-- Tạo bảng notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) DEFAULT 'teacher' CHECK (recipient_type IN ('teacher', 'student')),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE, -- Nullable: not all notifications are classroom-specific
    type VARCHAR(50) NOT NULL DEFAULT 'general', -- 'attendance_request', 'general', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm constraint để đảm bảo tính toàn vẹn dữ liệu
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_recipient_valid'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT check_recipient_valid CHECK (
            (recipient_type = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL) OR
            (recipient_type = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL)
        );
    END IF;
END $$;

-- Tạo indexes cho truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_notifications_teacher_id ON notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_classroom_id ON notifications(classroom_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Tạo trigger function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động cập nhật updated_at khi có thay đổi
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Thêm comments để mô tả bảng và các cột
COMMENT ON TABLE notifications IS 'Bảng thông báo cho giáo viên và học sinh, hỗ trợ nhiều loại thông báo';
COMMENT ON COLUMN notifications.recipient_type IS 'Loại người nhận: teacher hoặc student';
COMMENT ON COLUMN notifications.teacher_id IS 'ID giáo viên nhận thông báo (nếu recipient_type = teacher)';
COMMENT ON COLUMN notifications.student_id IS 'ID học sinh nhận thông báo (nếu recipient_type = student)';
COMMENT ON COLUMN notifications.classroom_id IS 'ID lớp học liên quan (có thể NULL nếu thông báo không liên quan đến lớp cụ thể)';
COMMENT ON COLUMN notifications.type IS 'Loại thông báo: attendance_request, general, assignment, grade, etc.';
COMMENT ON COLUMN notifications.priority IS 'Độ ưu tiên: low, normal, high, urgent';

-- ============================================================
-- HOÀN THÀNH!
-- ============================================================
-- Sau khi chạy script này, bảng notifications sẽ được tạo với:
-- ✅ Cấu trúc bảng đầy đủ
-- ✅ Constraints đảm bảo tính toàn vẹn dữ liệu
-- ✅ Indexes để tối ưu truy vấn
-- ✅ Trigger tự động cập nhật updated_at
-- ✅ Comments mô tả rõ ràng
-- ============================================================

