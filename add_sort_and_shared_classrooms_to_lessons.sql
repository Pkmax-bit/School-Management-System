-- Add sort_order column
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Add shared_classroom_ids column as text array
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS shared_classroom_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

