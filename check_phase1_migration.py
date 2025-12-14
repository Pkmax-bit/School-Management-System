"""
Script kiểm tra Phase 1 Migration đã chạy chưa
Check if Phase 1 Migration has been executed
"""

import os
import sys
from supabase import create_client, Client

def check_migration_status(supabase: Client):
    """Kiểm tra trạng thái migration"""
    print("="*70)
    print("  KIỂM TRA PHASE 1 MIGRATION STATUS")
    print("="*70)
    print()
    
    # Danh sách các bảng cần kiểm tra
    required_tables = [
        'roles',
        'permissions',
        'role_permissions',
        'user_roles',
        'notifications',
        'notification_templates',
        'audit_logs',
        'report_definitions',
        'report_executions'
    ]
    
    print("📋 Kiểm tra các bảng Phase 1:")
    print("-" * 70)
    
    all_exist = True
    for table in required_tables:
        try:
            # Thử query bảng để kiểm tra tồn tại
            result = supabase.table(table).select('*').limit(1).execute()
            count_query = supabase.table(table).select('*', count='exact').limit(0).execute()
            count = count_query.count if hasattr(count_query, 'count') else 0
            print(f"✅ {table:30} - Tồn tại ({count} records)")
        except Exception as e:
            error_msg = str(e)
            if 'does not exist' in error_msg or 'relation' in error_msg.lower():
                print(f"❌ {table:30} - CHƯA TỒN TẠI")
                all_exist = False
            else:
                print(f"⚠️  {table:30} - Lỗi: {error_msg[:50]}")
    
    print()
    print("-" * 70)
    
    if all_exist:
        print("✅ TẤT CẢ CÁC BẢNG ĐÃ ĐƯỢC TẠO!")
        print()
        print("📊 Kiểm tra dữ liệu mặc định:")
        print("-" * 70)
        
        # Kiểm tra roles
        try:
            roles = supabase.table('roles').select('*').execute()
            print(f"✅ Roles: {len(roles.data) if roles.data else 0} roles")
            if roles.data:
                for role in roles.data:
                    print(f"   - {role.get('name')}: {role.get('description', '')[:50]}")
        except Exception as e:
            print(f"❌ Không thể lấy roles: {str(e)}")
        
        # Kiểm tra permissions
        try:
            permissions = supabase.table('permissions').select('*').execute()
            print(f"✅ Permissions: {len(permissions.data) if permissions.data else 0} permissions")
        except Exception as e:
            print(f"❌ Không thể lấy permissions: {str(e)}")
        
        # Kiểm tra notification templates
        try:
            templates = supabase.table('notification_templates').select('*').execute()
            print(f"✅ Notification Templates: {len(templates.data) if templates.data else 0} templates")
        except Exception as e:
            print(f"❌ Không thể lấy templates: {str(e)}")
        
        # Kiểm tra report definitions
        try:
            reports = supabase.table('report_definitions').select('*').execute()
            print(f"✅ Report Definitions: {len(reports.data) if reports.data else 0} definitions")
        except Exception as e:
            print(f"❌ Không thể lấy report definitions: {str(e)}")
        
    else:
        print("❌ MỘT SỐ BẢNG CHƯA ĐƯỢC TẠO!")
        print()
        print("💡 Cần chạy migration:")
        print("   1. Mở file: phase1_database_schema_optimized.sql")
        print("   2. Copy toàn bộ nội dung")
        print("   3. Paste vào Supabase SQL Editor")
        print("   4. Click Run")
    
    print()
    print("="*70)

def main():
    """Main function"""
    # Lấy Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Không tìm thấy Supabase credentials!")
        print()
        print("💡 Cần set environment variables:")
        print("   - SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_URL")
        print("   - SUPABASE_KEY hoặc SUPABASE_SERVICE_ROLE_KEY")
        print()
        print("Hoặc chạy trong thư mục có file .env")
        sys.exit(1)
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print(f"✅ Đã kết nối với Supabase: {supabase_url[:50]}...")
        print()
        check_migration_status(supabase)
    except Exception as e:
        print(f"❌ Lỗi kết nối Supabase: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

