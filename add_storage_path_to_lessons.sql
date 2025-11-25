-- Add storage_path column to lessons table if it does not exist
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Backfill storage_path from existing file_url values when possible
UPDATE lessons
SET storage_path = regexp_replace(file_url, '^.+/lesson-materials/', '')
WHERE (storage_path IS NULL OR storage_path = '')
  AND file_url LIKE '%lesson-materials/%';

-- Ensure storage_path is populated for new rows
ALTER TABLE lessons
ALTER COLUMN storage_path SET NOT NULL;



