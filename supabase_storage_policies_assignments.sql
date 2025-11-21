-- Storage Policies for "Assignments" bucket
-- Chạy script này trong Supabase SQL Editor để tạo policies cho bucket "Assignments"

-- 1. Tạo bucket "Assignments" nếu chưa có
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Assignments',
  'Assignments',
  true, -- Public bucket để có thể truy cập file
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Cho phép authenticated users (teachers) upload hình ảnh câu hỏi
CREATE POLICY "Teachers can upload question images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Assignments' 
  AND (storage.foldername(name))[1] = 'questions'
  AND (auth.jwt() ->> 'role' = 'teacher' OR auth.jwt() ->> 'role' = 'admin')
);

-- 3. Policy: Cho phép authenticated users (students) upload file bài nộp
CREATE POLICY "Students can upload submission files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Assignments' 
  AND (storage.foldername(name))[1] = 'submissions'
  AND auth.jwt() ->> 'role' = 'student'
);

-- 4. Policy: Cho phép authenticated users xem tất cả file trong bucket
CREATE POLICY "Authenticated users can view all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'Assignments');

-- 5. Policy: Cho phép teachers và admins xóa file của họ
CREATE POLICY "Teachers and admins can delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Assignments' 
  AND (
    (auth.jwt() ->> 'role' = 'teacher' OR auth.jwt() ->> 'role' = 'admin')
    OR 
    -- Students can only delete their own submission files
    (
      auth.jwt() ->> 'role' = 'student' 
      AND (storage.foldername(name))[1] = 'submissions'
    )
  )
);

-- 6. Policy: Cho phép public (unauthenticated) xem file (nếu bucket là public)
-- Lưu ý: Chỉ áp dụng nếu bạn muốn file có thể truy cập công khai
CREATE POLICY "Public can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Assignments');

-- 7. Policy: Cho phép authenticated users update file của họ (nếu cần)
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Assignments' 
  AND (
    auth.jwt() ->> 'role' = 'teacher' 
    OR auth.jwt() ->> 'role' = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'Assignments' 
  AND (
    auth.jwt() ->> 'role' = 'teacher' 
    OR auth.jwt() ->> 'role' = 'admin'
  )
);

-- Lưu ý:
-- - Bucket "Assignments" được set là public để dễ truy cập file
-- - Teachers/Admins có thể upload vào folder "questions"
-- - Students có thể upload vào folder "submissions"
-- - Tất cả authenticated users có thể xem file
-- - Chỉ teachers/admins có thể xóa file
-- - File size limit: 10MB
-- - Allowed MIME types: images (jpeg, png, gif, webp), Word docs, ZIP files

