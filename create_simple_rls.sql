-- ===========================================
-- SIMPLE RLS POLICIES - Run this first
-- ===========================================

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('lessons', 'lesson_files')
AND schemaname = 'public';

-- Enable RLS on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create basic policy for lessons (allow all authenticated users)
DROP POLICY IF EXISTS "lessons_policy" ON lessons;
CREATE POLICY "lessons_policy" ON lessons
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Check if lesson_files table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_files') THEN
        -- Enable RLS
        ALTER TABLE lesson_files ENABLE ROW LEVEL SECURITY;

        -- Create basic policy
        DROP POLICY IF EXISTS "lesson_files_policy" ON lesson_files;
        CREATE POLICY "lesson_files_policy" ON lesson_files
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);

        RAISE NOTICE 'RLS enabled on lesson_files table';
    ELSE
        RAISE NOTICE 'lesson_files table does not exist';
    END IF;
END $$;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('lessons', 'lesson_files')
AND schemaname = 'public';
