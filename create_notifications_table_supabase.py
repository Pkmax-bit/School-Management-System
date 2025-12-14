#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để tự động tạo notifications table trên Supabase sử dụng Supabase Python client
Lưu ý: Supabase client không hỗ trợ chạy SQL trực tiếp, nên script này sẽ:
1. Kiểm tra xem table đã tồn tại chưa
2. Nếu chưa, sẽ hướng dẫn chạy SQL trong Supabase Dashboard
3. Hoặc có thể tạo table thông qua Supabase REST API nếu có quyền
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables from backend/.env if exists
backend_env = Path("backend/.env")
if backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()  # Try root .env

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Cần cài đặt supabase-py:")
    print("   pip install supabase")
    sys.exit(1)

def get_supabase_client() -> Client:
    """Tạo Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")  # Service role key
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "Cần cấu hình SUPABASE_URL và SUPABASE_KEY trong backend/.env file"
        )
    
    return create_client(supabase_url, supabase_key)

def check_table_exists(supabase: Client) -> bool:
    """Kiểm tra xem bảng notifications đã tồn tại chưa"""
    try:
        # Thử query bảng notifications
        result = supabase.table("notifications").select("id").limit(1).execute()
        return True
    except Exception as e:
        error_str = str(e).lower()
        if "relation" in error_str and "does not exist" in error_str:
            return False
        # Nếu là lỗi khác, có thể table đã tồn tại nhưng empty
        return True

def read_sql_file(file_path: str) -> str:
    """Đọc nội dung SQL file"""
    sql_file = Path(file_path)
    if not sql_file.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {file_path}")
    
    with open(sql_file, "r", encoding="utf-8") as f:
        return f.read()

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 TẠO NOTIFICATIONS TABLE TRÊN SUPABASE")
    print("=" * 60)
    
    try:
        # Đọc SQL file
        sql_file = "create_notifications_table.sql"
        print(f"\n📖 Đang đọc file: {sql_file}")
        sql_content = read_sql_file(sql_file)
        print(f"✅ Đã đọc {len(sql_content)} ký tự")
        
        # Kết nối Supabase
        print("\n📡 Đang kết nối đến Supabase...")
        supabase = get_supabase_client()
        print("✅ Kết nối thành công!")
        
        # Kiểm tra table đã tồn tại chưa
        print("\n🔍 Đang kiểm tra bảng notifications...")
        if check_table_exists(supabase):
            print("⚠️  Bảng notifications đã tồn tại!")
            response = input("Bạn có muốn tiếp tục? (y/n): ").strip().lower()
            if response != 'y':
                print("❌ Đã hủy.")
                return
        else:
            print("✅ Bảng notifications chưa tồn tại, có thể tạo mới.")
        
        # Supabase Python client không hỗ trợ chạy SQL trực tiếp
        # Cần chạy SQL trong Supabase Dashboard
        print("\n" + "=" * 60)
        print("📝 HƯỚNG DẪN TẠO BẢNG")
        print("=" * 60)
        print("\n⚠️  Supabase Python client không hỗ trợ chạy SQL trực tiếp.")
        print("Vui lòng làm theo các bước sau:\n")
        print("1. Truy cập Supabase Dashboard:")
        print("   https://supabase.com/dashboard")
        print("\n2. Chọn project của bạn")
        print("\n3. Vào SQL Editor (Database → SQL Editor)")
        print("\n4. Tạo New Query")
        print("\n5. Copy và paste nội dung SQL sau:\n")
        print("-" * 60)
        print(sql_content)
        print("-" * 60)
        print("\n6. Nhấn Run để thực thi")
        print("\n" + "=" * 60)
        
        # Lưu SQL vào file để dễ copy
        output_file = "notifications_schema_to_run.sql"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(sql_content)
        print(f"\n💾 Đã lưu SQL vào file: {output_file}")
        print("   Bạn có thể copy nội dung file này vào Supabase SQL Editor")
        
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"❌ {e}")
        print("\n💡 Hướng dẫn:")
        print("   1. Đảm bảo file backend/.env tồn tại")
        print("   2. Cấu hình SUPABASE_URL và SUPABASE_KEY")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()


