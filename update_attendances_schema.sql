-- Update attendances table to support new format with records (JSONB) and confirmed_at
-- Cập nhật bảng attendances để hỗ trợ format mới với records (JSONB) và confirmed_at

-- Add records column (JSONB) to store multiple students' attendance in one record
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS records JSONB;

-- Add confirmed_at column
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Make student_id nullable (since we're using records now)
-- Note: This might fail if there are existing NOT NULL constraints
-- If it fails, you may need to update existing records first
ALTER TABLE attendances 
ALTER COLUMN student_id DROP NOT NULL;

-- Update unique constraint to allow multiple records per classroom and date
-- First, drop the old unique constraint if it exists
ALTER TABLE attendances 
DROP CONSTRAINT IF EXISTS attendances_student_id_classroom_id_date_key;

-- Create new unique constraint on (classroom_id, date) only
-- This allows one attendance record per classroom per date
CREATE UNIQUE INDEX IF NOT EXISTS ux_attendances_classroom_date 
ON attendances(classroom_id, date) 
WHERE records IS NOT NULL;

-- Add index on records for better query performance
CREATE INDEX IF NOT EXISTS idx_attendances_records ON attendances USING GIN (records);

-- Add index on confirmed_at
CREATE INDEX IF NOT EXISTS idx_attendances_confirmed_at ON attendances(confirmed_at);

-- Comment on columns
COMMENT ON COLUMN attendances.records IS 'JSONB object containing attendance records for multiple students: {student_id: {status, notes, timestamp}}';
COMMENT ON COLUMN attendances.confirmed_at IS 'Timestamp when attendance was confirmed by teacher';

