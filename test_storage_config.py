"""
Script kiểm tra và cấu hình Supabase Storage cho School Management System
Kiểm tra buckets, policies và khả năng upload file
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def check_env_variables():
    """Kiểm tra các biến môi trường cần thiết"""
    print("=" * 60)
    print("KIỂM TRA BIẾN MÔI TRƯỜNG")
    print("=" * 60)

    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_KEY": os.getenv("SUPABASE_KEY"),
    }

    all_present = True
    for var_name, var_value in required_vars.items():
        if var_value:
            print(f"✓ {var_name}: {'*' * 20} (đã cấu hình)")
        else:
            print(f"✗ {var_name}: CHƯA ĐƯỢC CẤU HÌNH")
            all_present = False

    print()
    return all_present, required_vars

def check_supabase_connection(supabase: Client):
    """Kiểm tra kết nối với Supabase"""
    print("=" * 60)
    print("KIỂM TRA KẾT NỐI SUPABASE")
    print("=" * 60)

    try:
        # Thử query một bảng đơn giản để kiểm tra kết nối
        response = supabase.table("classrooms").select("id").limit(1).execute()
        print("✓ Kết nối Supabase thành công")
        print("  - Có thể truy cập database")
        return True
    except Exception as e:
        print(f"✗ Lỗi kết nối Supabase: {str(e)}")
        return False

def check_storage_buckets(supabase: Client):
    """Kiểm tra buckets tồn tại"""
    print("=" * 60)
    print("KIỂM TRA STORAGE BUCKETS")
    print("=" * 60)

    required_buckets = ["Assignments", "lesson-materials"]
    existing_buckets = []

    try:
        # Liệt kê tất cả buckets
        buckets_result = supabase.storage.list_buckets()
        if hasattr(buckets_result, 'data'):
            buckets = buckets_result.data
        else:
            buckets = buckets_result

        print(f"✓ Tìm thấy {len(buckets)} bucket(s):")
        for bucket in buckets:
            bucket_name = bucket.get('name') or bucket.get('id')
            print(f"  - {bucket_name}")
            if bucket_name in required_buckets:
                existing_buckets.append(bucket_name)

        missing_buckets = [b for b in required_buckets if b not in existing_buckets]

        if missing_buckets:
            print(f"✗ Thiếu bucket(s): {', '.join(missing_buckets)}")
            print("  → Cần tạo buckets này trong Supabase Dashboard")
            return False
        else:
            print("✓ Tất cả buckets cần thiết đều tồn tại")
            return True

    except Exception as e:
        print(f"✗ Lỗi khi kiểm tra buckets: {str(e)}")
        return False

def test_upload_permissions(supabase: Client):
    """Test quyền upload file"""
    print("=" * 60)
    print("TEST QUYỀN UPLOAD FILE")
    print("=" * 60)

    test_file_content = b"Test file content for permissions check"
    test_filename = "test_permissions.txt"

    buckets_to_test = ["Assignments", "lesson-materials"]

    all_passed = True

    for bucket_name in buckets_to_test:
        print(f"\n📤 Test upload vào bucket '{bucket_name}':")

        try:
            # Test upload
            upload_result = supabase.storage.from_(bucket_name).upload(
                f"test/{test_filename}",
                test_file_content,
                {"content-type": "text/plain"}
            )

            if hasattr(upload_result, 'error') and upload_result.error:
                print(f"  ✗ Upload thất bại: {upload_result.error}")
                all_passed = False
            else:
                print("  ✓ Upload thành công")

                # Test lấy public URL
                try:
                    public_url_result = supabase.storage.from_(bucket_name).get_public_url(f"test/{test_filename}")
                    if public_url_result:
                        print("  ✓ Public URL được tạo thành công")
                    else:
                        print("  ⚠ Public URL không được tạo")
                except Exception as url_error:
                    print(f"  ⚠ Lỗi khi lấy public URL: {str(url_error)}")

                # Cleanup - xóa file test
                try:
                    supabase.storage.from_(bucket_name).remove([f"test/{test_filename}"])
                    print("  ✓ File test đã được dọn dẹp")
                except Exception as cleanup_error:
                    print(f"  ⚠ Không thể xóa file test: {str(cleanup_error)}")

        except Exception as e:
            print(f"  ✗ Lỗi upload: {str(e)}")
            all_passed = False

    return all_passed

def generate_storage_setup_sql():
    """Tạo SQL để cấu hình storage buckets và policies"""
    print("=" * 60)
    print("SQL CẤU HÌNH STORAGE (COPY VÀO SUPABASE SQL EDITOR)")
    print("=" * 60)

    sql = """
-- ===========================================
-- CẤU HÌNH STORAGE BUCKETS CHO SCHOOL MANAGEMENT
-- Chạy script này trong Supabase SQL Editor
-- ===========================================

-- 1. TẠO BUCKET "Assignments" (nếu chưa có)
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

-- 2. TẠO BUCKET "lesson-materials" (nếu chưa có)
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
-- POLICIES CHO BUCKET "Assignments"
-- ===========================================

-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Teachers can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submission files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Policy: Cho phép authenticated users upload files
CREATE POLICY "Allow authenticated users to upload to Assignments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Assignments');

-- Policy: Cho phép public xem files (bucket public)
CREATE POLICY "Allow public read access to Assignments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Assignments');

-- Policy: Cho phép authenticated users xóa files
CREATE POLICY "Allow authenticated users to delete from Assignments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Assignments');

-- ===========================================
-- POLICIES CHO BUCKET "lesson-materials"
-- ===========================================

-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Teachers can upload lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete lesson files" ON storage.objects;

-- Policy: Cho phép authenticated users upload files
CREATE POLICY "Allow authenticated users to upload to lesson-materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-materials');

-- Policy: Cho phép public xem files (bucket public)
CREATE POLICY "Allow public read access to lesson-materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lesson-materials');

-- Policy: Cho phép authenticated users xóa files
CREATE POLICY "Allow authenticated users to delete from lesson-materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-materials');

-- ===========================================
-- HOÀN THÀNH
-- ===========================================

-- Kiểm tra buckets đã được tạo
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('Assignments', 'lesson-materials');

-- Kiểm tra policies đã được tạo
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
"""

    print(sql)

def main():
    print("=" * 60)
    print("KIỂM TRA CẤU HÌNH SUPABASE STORAGE")
    print("CHO SCHOOL MANAGEMENT SYSTEM")
    print("=" * 60)

    # Kiểm tra biến môi trường
    env_ok, env_vars = check_env_variables()
    if not env_ok:
        print("❌ Thiếu biến môi trường. Vui lòng cấu hình file .env")
        return

    # Tạo Supabase client
    try:
        supabase = create_client(env_vars["SUPABASE_URL"], env_vars["SUPABASE_KEY"])
        print("✓ Đã tạo Supabase client")
    except Exception as e:
        print(f"✗ Lỗi tạo Supabase client: {str(e)}")
        return

    # Kiểm tra kết nối
    connection_ok = check_supabase_connection(supabase)
    if not connection_ok:
        print("❌ Không thể kết nối với Supabase")
        return

    # Kiểm tra buckets
    buckets_ok = check_storage_buckets(supabase)

    # Test upload permissions
    upload_ok = test_upload_permissions(supabase)

    # Kết luận
    print("\n" + "=" * 60)
    print("KẾT QUẢ KIỂM TRA")
    print("=" * 60)

    if buckets_ok and upload_ok:
        print("✅ HOÀN THÀNH! Storage đã được cấu hình đúng.")
        print("   → Upload file sẽ hoạt động bình thường.")
    else:
        print("❌ CÓ VẤN ĐỀ! Cần khắc phục:")
        if not buckets_ok:
            print("   → Buckets chưa được tạo hoặc cấu hình sai")
        if not upload_ok:
            print("   → RLS policies chưa được cấu hình đúng")
        print("\n🔧 HƯỚNG DẪN KHẮC PHỤC:")
        print("   1. Copy SQL dưới đây")
        print("   2. Vào Supabase Dashboard → SQL Editor")
        print("   3. Paste và chạy script")
        print("   4. Chạy lại script này để kiểm tra")
        generate_storage_setup_sql()

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
