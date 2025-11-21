-- Update Storage Policies for "Assignments" bucket
-- Run this script in the Supabase SQL Editor to fix the RLS policy violation

-- 1. Ensure "Assignments" bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Assignments',
  'Assignments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];

-- 2. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Teachers can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submission files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- 3. Create new, more permissive policies

-- Policy: Allow any authenticated user to upload files to "Assignments" bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Assignments'
);

-- Policy: Allow public to view files (since bucket is public)
CREATE POLICY "Public can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Assignments');

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Assignments' 
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'Assignments' 
  AND owner = auth.uid()
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Assignments' 
  AND owner = auth.uid()
);

-- Policy: Allow teachers and admins to delete any file (optional, but useful for management)
CREATE POLICY "Teachers and admins can delete any file"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Assignments' 
  AND (auth.jwt() ->> 'role' = 'teacher' OR auth.jwt() ->> 'role' = 'admin')
);
