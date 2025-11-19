-- Add date column to schedules table for specific date schedules
-- Thêm cột date vào bảng schedules để lưu ngày cụ thể của lịch học

-- Add date column if it doesn't exist
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS date DATE NULL;

-- Add comment
COMMENT ON COLUMN public.schedules.date IS 'Ngày cụ thể của lịch học (NULL nếu là lịch định kỳ theo day_of_week)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date) WHERE date IS NOT NULL;

-- Update unique constraint to include date
-- Drop old unique constraint if exists
DROP INDEX IF EXISTS ux_schedules_class_day_start;

-- Create new unique constraint that considers date
-- For schedules with specific date: unique on (classroom_id, date, start_time)
-- For schedules without date: unique on (classroom_id, day_of_week, start_time)
-- Note: PostgreSQL doesn't support conditional unique constraints directly,
-- so we'll use a partial unique index for each case

-- Unique index for schedules with specific date
CREATE UNIQUE INDEX IF NOT EXISTS ux_schedules_class_date_start 
ON public.schedules(classroom_id, date, start_time) 
WHERE date IS NOT NULL;

-- Unique index for schedules without date (recurring schedules)
CREATE UNIQUE INDEX IF NOT EXISTS ux_schedules_class_day_start 
ON public.schedules(classroom_id, day_of_week, start_time) 
WHERE date IS NULL;
