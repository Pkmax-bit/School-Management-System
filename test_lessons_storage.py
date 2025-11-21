"""
Script kiểm tra cấu hình Supabase Storage cho Lessons
Kiểm tra bucket, quyền truy cập và khả năng upload file
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
        print(f"  - Có thể truy cập database")
        return True
    except Exception as e:
        print(f"✗ Lỗi kết nối Supabase: {str(e)}")
        return False

def check_storage_bucket(supabase: Client, bucket_name: str = "lesson-materials"):
    """Kiểm tra bucket storage"""
    print("=" * 60)
    print(f"KIỂM TRA STORAGE BUCKET: {bucket_name}")
    print("=" * 60)
    
    try:
        # Liệt kê tất cả các bucket
        buckets = supabase.storage.list_buckets()
        bucket_names = [bucket.name for bucket in buckets]
        
        print(f"Danh sách buckets hiện có: {bucket_names}")
        
        if bucket_name in bucket_names:
            print(f"✓ Bucket '{bucket_name}' đã tồn tại")
            
            # Kiểm tra quyền truy cập
            try:
                # Thử list files trong bucket
                files = supabase.storage.from_(bucket_name).list()
                print(f"✓ Có thể truy cập bucket (có {len(files)} file)")
                
                # Kiểm tra public access
                try:
                    # Thử tạo một test file để kiểm tra upload
                    test_content = b"test"
                    test_path = "test_upload.txt"
                    
                    # Upload test file
                    upload_result = supabase.storage.from_(bucket_name).upload(
                        test_path,
                        test_content,
                        {"content-type": "text/plain"}
                    )
                    print(f"✓ Có thể upload file vào bucket")
                    
                    # Thử lấy public URL
                    try:
                        public_url = supabase.storage.from_(bucket_name).get_public_url(test_path)
                        print(f"✓ Có thể lấy public URL: {public_url}")
                        
                        # Xóa test file
                        supabase.storage.from_(bucket_name).remove([test_path])
                        print(f"✓ Đã xóa file test")
                        
                        return True, "OK"
                    except Exception as url_error:
                        print(f"⚠ Cảnh báo: Không thể lấy public URL: {str(url_error)}")
                        print(f"  → Bucket có thể không được đặt là public")
                        print(f"  → Cần cấu hình bucket là public trong Supabase Dashboard")
                        
                        # Xóa test file
                        try:
                            supabase.storage.from_(bucket_name).remove([test_path])
                        except:
                            pass
                        
                        return True, "NO_PUBLIC_URL"
                except Exception as upload_error:
                    print(f"✗ Không thể upload file: {str(upload_error)}")
                    print(f"  → Kiểm tra quyền truy cập (RLS policies)")
                    return False, f"UPLOAD_ERROR: {str(upload_error)}"
                    
            except Exception as access_error:
                print(f"✗ Không thể truy cập bucket: {str(access_error)}")
                print(f"  → Kiểm tra quyền truy cập (RLS policies)")
                return False, f"ACCESS_ERROR: {str(access_error)}"
        else:
            print(f"✗ Bucket '{bucket_name}' CHƯA TỒN TẠI")
            print(f"  → Cần tạo bucket trong Supabase Dashboard")
            print(f"  → Xem hướng dẫn trong LESSONS_STORAGE_SETUP.md")
            return False, "BUCKET_NOT_FOUND"
            
    except Exception as e:
        print(f"✗ Lỗi khi kiểm tra storage: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False, f"STORAGE_ERROR: {str(e)}"

def check_lessons_table(supabase: Client):
    """Kiểm tra bảng lessons"""
    print("=" * 60)
    print("KIỂM TRA BẢNG LESSONS")
    print("=" * 60)
    
    try:
        response = supabase.table("lessons").select("id").limit(1).execute()
        print("✓ Bảng 'lessons' tồn tại và có thể truy cập")
        return True
    except Exception as e:
        print(f"✗ Lỗi khi truy cập bảng 'lessons': {str(e)}")
        print(f"  → Kiểm tra xem bảng đã được tạo chưa")
        print(f"  → Chạy file lessons_schema.sql để tạo bảng")
        return False

def main():
    """Hàm chính"""
    print("\n" + "=" * 60)
    print("KIỂM TRA CẤU HÌNH LESSONS STORAGE")
    print("=" * 60 + "\n")
    
    # Kiểm tra biến môi trường
    env_ok, env_vars = check_env_variables()
    if not env_ok:
        print("\n❌ VUI LÒNG CẤU HÌNH CÁC BIẾN MÔI TRƯỜNG TRƯỚC!")
        print("   Tạo file .env với SUPABASE_URL và SUPABASE_KEY")
        return
    
    # Tạo Supabase client
    try:
        supabase = create_client(env_vars["SUPABASE_URL"], env_vars["SUPABASE_KEY"])
    except Exception as e:
        print(f"\n❌ Lỗi khi tạo Supabase client: {str(e)}")
        return
    
    # Kiểm tra kết nối
    if not check_supabase_connection(supabase):
        print("\n❌ KHÔNG THỂ KẾT NỐI VỚI SUPABASE!")
        return
    
    # Kiểm tra bảng lessons
    lessons_table_ok = check_lessons_table(supabase)
    
    # Kiểm tra storage bucket
    bucket_ok, bucket_status = check_storage_bucket(supabase)
    
    # Tổng kết
    print("\n" + "=" * 60)
    print("TỔNG KẾT")
    print("=" * 60)
    
    if env_ok:
        print("✓ Biến môi trường: OK")
    else:
        print("✗ Biến môi trường: LỖI")
    
    if lessons_table_ok:
        print("✓ Bảng lessons: OK")
    else:
        print("✗ Bảng lessons: LỖI")
    
    if bucket_ok:
        if bucket_status == "OK":
            print("✓ Storage bucket: OK (hoàn toàn sẵn sàng)")
        elif bucket_status == "NO_PUBLIC_URL":
            print("⚠ Storage bucket: CẢNH BÁO (cần đặt public)")
        else:
            print(f"⚠ Storage bucket: {bucket_status}")
    else:
        print("✗ Storage bucket: LỖI")
    
    print()
    
    if env_ok and lessons_table_ok and bucket_ok and bucket_status == "OK":
        print("✅ TẤT CẢ ĐỀU SẴN SÀNG! Có thể upload lessons.")
    elif bucket_status == "NO_PUBLIC_URL":
        print("⚠ CẦN CẤU HÌNH: Đặt bucket 'lesson-materials' là public")
        print("   Xem hướng dẫn trong LESSONS_STORAGE_SETUP.md")
    else:
        print("❌ CẦN SỬA CÁC LỖI TRƯỚC KHI CÓ THỂ UPLOAD LESSONS")
        print("   Xem hướng dẫn trong LESSONS_STORAGE_SETUP.md")

if __name__ == "__main__":
    main()

