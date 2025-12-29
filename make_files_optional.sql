-- Make file_url, file_name, and storage_path optional in lessons table
ALTER TABLE lessons ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE lessons ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE lessons ALTER COLUMN storage_path DROP NOT NULL;

-- Add comment to clarify the changes
COMMENT ON COLUMN lessons.file_url IS 'File URL (optional if YouTube URL is provided)';
COMMENT ON COLUMN lessons.file_name IS 'File name (optional if YouTube URL is provided)';
COMMENT ON COLUMN lessons.storage_path IS 'Storage path in Supabase Storage (optional if YouTube URL is provided)';
