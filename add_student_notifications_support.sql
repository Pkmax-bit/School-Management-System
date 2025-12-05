-- Add student support to notifications table
-- This migration extends the notifications system to support both teacher and student recipients

-- Add new columns
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) DEFAULT 'teacher',
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Make teacher_id nullable since we now support students too
ALTER TABLE notifications 
  ALTER COLUMN teacher_id DROP NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);

-- Add check constraint to ensure data integrity
-- Either teacher_id is set (for teacher recipients) OR student_id is set (for student recipients)
ALTER TABLE notifications 
  ADD CONSTRAINT check_recipient_valid CHECK (
    (recipient_type = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL) OR
    (recipient_type = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL)
  );

-- Update comment
COMMENT ON TABLE notifications IS 'Bảng thông báo cho giáo viên và học sinh, hỗ trợ nhiều loại thông báo';
COMMENT ON COLUMN notifications.recipient_type IS 'Loại người nhận: teacher hoặc student';
COMMENT ON COLUMN notifications.student_id IS 'ID học sinh nhận thông báo (nếu recipient_type = student)';
