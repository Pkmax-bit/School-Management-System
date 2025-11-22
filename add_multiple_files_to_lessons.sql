-- Migration: Add support for multiple files per lesson
-- This creates a new lesson_files table and migrates existing data

-- Create lesson_files table
CREATE TABLE IF NOT EXISTS lesson_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT,
    file_size BIGINT,
    file_type TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lesson_files_lesson_id ON lesson_files(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_files_sort_order ON lesson_files(lesson_id, sort_order);

-- Migrate existing data from lessons table to lesson_files
-- This assumes lessons table has file_url, file_name, storage_path columns
INSERT INTO lesson_files (lesson_id, file_url, file_name, storage_path, sort_order, created_at, updated_at)
SELECT 
    id as lesson_id,
    file_url,
    file_name,
    storage_path,
    0 as sort_order,
    created_at,
    updated_at
FROM lessons
WHERE file_url IS NOT NULL AND file_name IS NOT NULL;

-- Add comment
COMMENT ON TABLE lesson_files IS 'Stores multiple files for each lesson';
COMMENT ON COLUMN lesson_files.sort_order IS 'Order of files within a lesson';

