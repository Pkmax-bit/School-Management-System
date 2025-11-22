"""
Script test upload hình ảnh lên Supabase Storage
Upload file vào bucket lesson-materials với cấu trúc thư mục theo classroom
"""

import os
import sys
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# Load environment variables
load_dotenv()

def create_test_image():
    """Tạo một file ảnh test đơn giản (PNG)"""
    # Tạo một file PNG đơn giản (1x1 pixel màu đỏ)
    # PNG signature + minimal valid PNG structure
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D,  # IHDR chunk length
        0x49, 0x48, 0x44, 0x52,  # IHDR
        0x00, 0x00, 0x00, 0x01,  # width = 1
        0x00, 0x00, 0x00, 0x01,  # height = 1
        0x08, 0x02, 0x00, 0x00, 0x00,  # bit depth, color type, compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE,  # CRC
        0x00, 0x00, 0x00, 0x0A,  # IDAT chunk length
        0x49, 0x44, 0x41, 0x54,  # IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,  # compressed data
        0x0D, 0x0A, 0x2D, 0xB4,  # CRC
        0x00, 0x00, 0x00, 0x00,  # IEND chunk length
        0x49, 0x45, 0x4E, 0x44,  # IEND
        0xAE, 0x42, 0x60, 0x82   # CRC
    ])
    
    test_file_path = "test_image.png"
    with open(test_file_path, "wb") as f:
        f.write(png_data)
    return test_file_path

def get_first_classroom(supabase: Client):
    """Lấy classroom đầu tiên từ database"""
    try:
        response = supabase.table("classrooms").select("id, name, code").limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Lỗi khi lấy classroom: {str(e)}")
        return None

def upload_image_to_storage(supabase: Client, classroom_id: str, file_path: str):
    """Upload file ảnh lên storage với cấu trúc {classroom_id}/filename"""
    try:
        # Đọc file
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        # Tạo tên file với timestamp
        timestamp = int(time.time())
        filename = os.path.basename(file_path)
        safe_filename = filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        storage_path = f"{classroom_id}/{timestamp}_{safe_filename}"
        
        print(f"\n📤 Đang upload file...")
        print(f"   File: {filename}")
        print(f"   Đường dẫn storage: {storage_path}")
        print(f"   Kích thước: {len(file_content)} bytes")
        
        # Upload lên Supabase Storage
        upload_response = supabase.storage.from_("lesson-materials").upload(
            storage_path,
            file_content,
            {"content-type": "image/png"}
        )
        
        print(f"✓ Upload thành công!")
        print(f"   Response: {upload_response}")
        
        # Lấy public URL
        try:
            public_url = supabase.storage.from_("lesson-materials").get_public_url(storage_path)
            print(f"✓ Public URL: {public_url}")
            return public_url, storage_path
        except Exception as url_error:
            # Tạo URL thủ công nếu get_public_url thất bại
            supabase_url = os.getenv("SUPABASE_URL", "")
            if supabase_url:
                public_url = f"{supabase_url}/storage/v1/object/public/lesson-materials/{storage_path}"
                print(f"✓ Public URL (manual): {public_url}")
                return public_url, storage_path
            else:
                raise url_error
        
    except Exception as e:
        print(f"✗ Lỗi khi upload: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None, None

def main():
    print("=" * 60)
    print("TEST UPLOAD HÌNH ẢNH LÊN STORAGE")
    print("=" * 60)
    
    # Kiểm tra biến môi trường
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("✗ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_KEY")
        print("   Vui lòng cấu hình trong file .env")
        return
    
    print(f"✓ Đã cấu hình Supabase URL")
    
    # Tạo Supabase client
    try:
        supabase = create_client(supabase_url, supabase_key)
        print(f"✓ Đã kết nối với Supabase")
    except Exception as e:
        print(f"✗ Lỗi khi kết nối Supabase: {str(e)}")
        return
    
    # Lấy classroom đầu tiên
    print(f"\n📋 Đang lấy thông tin classroom...")
    classroom = get_first_classroom(supabase)
    
    if not classroom:
        print("✗ Không tìm thấy classroom nào trong database")
        print("   Vui lòng tạo classroom trước khi test upload")
        return
    
    print(f"✓ Tìm thấy classroom:")
    print(f"   ID: {classroom['id']}")
    print(f"   Tên: {classroom.get('name', 'N/A')}")
    print(f"   Mã: {classroom.get('code', 'N/A')}")
    
    # Tạo file ảnh test
    print(f"\n🖼️  Đang tạo file ảnh test...")
    test_file_path = create_test_image()
    print(f"✓ Đã tạo file: {test_file_path}")
    
    # Upload lên storage
    public_url, storage_path = upload_image_to_storage(
        supabase, 
        classroom['id'], 
        test_file_path
    )
    
    if public_url:
        print(f"\n✅ HOÀN THÀNH!")
        print(f"   File đã được upload thành công")
        print(f"   Đường dẫn: {storage_path}")
        print(f"   URL công khai: {public_url}")
        print(f"\n   Bạn có thể mở URL trên để xem ảnh")
        
        # Xóa file test local
        try:
            os.remove(test_file_path)
            print(f"✓ Đã xóa file test local")
        except:
            pass
    else:
        print(f"\n❌ UPLOAD THẤT BẠI")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()


