-- ===========================================
-- FIX STORAGE POLICIES FOR SCHOOL MANAGEMENT SYSTEM
-- Run this in Supabase Dashboard > SQL Editor
-- ===========================================

-- First, check current buckets and policies
SELECT id, name, public FROM storage.buckets WHERE id IN ('Assignments', 'lesson-materials');

-- Check existing policies
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ===========================================
-- CREATE/UPDATE BUCKETS
-- ===========================================

-- Create Assignments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Assignments',
  'Assignments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ];

-- Create lesson-materials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-materials',
  'lesson-materials',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ];

-- ===========================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ===========================================

DROP POLICY IF EXISTS "Teachers can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submission files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete lesson files" ON storage.objects;

-- Drop any other policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated users to upload to Assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to Assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from Assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to lesson-materials" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to lesson-materials" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from lesson-materials" ON storage.objects;

-- ===========================================
-- CREATE NEW POLICIES - ALLOW ALL AUTHENTICATED USERS
-- ===========================================

-- Policy for Assignments bucket - INSERT (upload)
CREATE POLICY "school_assignments_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Assignments');

-- Policy for Assignments bucket - SELECT (read)
CREATE POLICY "school_assignments_read_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Assignments');

-- Policy for Assignments bucket - DELETE
CREATE POLICY "school_assignments_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Assignments');

-- Policy for lesson-materials bucket - INSERT (upload)
CREATE POLICY "school_lessons_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-materials');

-- Policy for lesson-materials bucket - SELECT (read)
CREATE POLICY "school_lessons_read_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lesson-materials');

-- Policy for lesson-materials bucket - DELETE
CREATE POLICY "school_lessons_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-materials');

-- ===========================================
-- VERIFY SETUP
-- ===========================================

-- Check buckets
SELECT id, name, public, file_size_limit FROM storage.buckets
WHERE id IN ('Assignments', 'lesson-materials');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;




