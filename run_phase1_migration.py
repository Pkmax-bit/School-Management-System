"""
Script để chạy Phase 1 Migration trên Supabase
Run Phase 1 Migration Script
"""

import os
import sys
from supabase import create_client, Client

# Đọc file SQL
def read_sql_file(file_path: str) -> str:
    """Đọc nội dung file SQL"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Lỗi khi đọc file: {str(e)}")
        sys.exit(1)

# Chạy migration
def run_migration(supabase: Client, sql_content: str):
    """Chạy migration SQL"""
    try:
        print("🔄 Đang chạy migration...")
        
        # Supabase Python client không hỗ trợ execute SQL trực tiếp
        # Cần sử dụng REST API hoặc psycopg2
        
        print("⚠️  Supabase Python client không hỗ trợ execute SQL trực tiếp.")
        print("📝 Vui lòng chạy migration trong Supabase SQL Editor:")
        print("   1. Truy cập: https://supabase.com/dashboard")
        print("   2. Chọn project của bạn")
        print("   3. Vào SQL Editor")
        print("   4. Copy nội dung file: phase1_database_schema_optimized.sql")
        print("   5. Paste và Run")
        
        # In ra SQL để user copy
        print("\n" + "="*70)
        print("SQL CONTENT (Copy và paste vào Supabase SQL Editor):")
        print("="*70)
        print(sql_content)
        print("="*70)
        
    except Exception as e:
        print(f"❌ Lỗi khi chạy migration: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    print("="*70)
    print("  PHASE 1 MIGRATION - School Management System")
    print("="*70)
    print()
    
    # Đọc file SQL
    sql_file = "phase1_database_schema_optimized.sql"
    if not os.path.exists(sql_file):
        print(f"❌ File không tồn tại: {sql_file}")
        print("💡 Đang tìm file: phase1_database_schema.sql")
        sql_file = "phase1_database_schema.sql"
        if not os.path.exists(sql_file):
            print(f"❌ File không tồn tại: {sql_file}")
            sys.exit(1)
    
    sql_content = read_sql_file(sql_file)
    print(f"✅ Đã đọc file: {sql_file}")
    print(f"📏 Kích thước: {len(sql_content)} ký tự")
    print()
    
    # Kiểm tra Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("⚠️  Không tìm thấy Supabase credentials trong environment variables")
        print("💡 Sử dụng cách thủ công:")
        print()
        run_migration(None, sql_content)
        return
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Đã kết nối với Supabase")
        print()
        run_migration(supabase, sql_content)
    except Exception as e:
        print(f"⚠️  Không thể kết nối Supabase: {str(e)}")
        print("💡 Sử dụng cách thủ công:")
        print()
        run_migration(None, sql_content)

if __name__ == "__main__":
    main()

