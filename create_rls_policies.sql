-- ===========================================
-- RLS POLICIES FOR LESSONS AND LESSON_FILES
-- ===========================================
-- Copy and paste this into Supabase SQL Editor
-- https://app.supabase.com > SQL Editor > New Query

-- First, check if tables exist
SELECT 'lessons table exists' as check_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons');

SELECT 'lesson_files table exists' as check_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_files');

-- Enable RLS on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to run)
DROP POLICY IF EXISTS "Allow authenticated users to insert lessons" ON lessons;
DROP POLICY IF EXISTS "Allow authenticated users to select lessons" ON lessons;
DROP POLICY IF EXISTS "Allow authenticated users to update lessons" ON lessons;
DROP POLICY IF EXISTS "Allow authenticated users to delete lessons" ON lessons;

-- Create policies for lessons table
CREATE POLICY "Allow authenticated users to insert lessons"
ON lessons FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to select lessons"
ON lessons FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update lessons"
ON lessons FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete lessons"
ON lessons FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Enable RLS on lesson_files table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_files') THEN
        -- Enable RLS
        ALTER TABLE lesson_files ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Allow authenticated users to insert lesson_files" ON lesson_files;
        DROP POLICY IF EXISTS "Allow authenticated users to select lesson_files" ON lesson_files;
        DROP POLICY IF EXISTS "Allow authenticated users to update lesson_files" ON lesson_files;
        DROP POLICY IF EXISTS "Allow authenticated users to delete lesson_files" ON lesson_files;

        -- Create policies for lesson_files table
        CREATE POLICY "Allow authenticated users to insert lesson_files"
        ON lesson_files FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);

        CREATE POLICY "Allow authenticated users to select lesson_files"
        ON lesson_files FOR SELECT
        TO authenticated
        USING (auth.uid() IS NOT NULL);

        CREATE POLICY "Allow authenticated users to update lesson_files"
        ON lesson_files FOR UPDATE
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);

        CREATE POLICY "Allow authenticated users to delete lesson_files"
        ON lesson_files FOR DELETE
        TO authenticated
        USING (auth.uid() IS NOT NULL);

        RAISE NOTICE 'RLS policies created for lesson_files table';
    ELSE
        RAISE NOTICE 'lesson_files table does not exist, skipping policies';
    END IF;
END $$;

-- Success message
SELECT 'RLS policies created successfully! You can now upload lesson files.' as message;
