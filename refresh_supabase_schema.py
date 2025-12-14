"""
Script để refresh Supabase PostgREST schema cache
Chạy script này sau khi tạo bảng mới
"""

import requests
import time

API_BASE_URL = "http://localhost:8000"

def refresh_schema_by_querying():
    """Refresh schema bằng cách query vào tất cả các bảng Phase 1"""
    
    print("🔄 Đang refresh PostgREST schema cache...")
    print("   Bằng cách query vào các bảng Phase 1...\n")
    
    tables = [
        "report_definitions",
        "report_executions", 
        "roles",
        "permissions",
        "role_permissions",
        "user_roles",
        "notification_templates",
        "audit_logs"
    ]
    
    # Login để lấy token
    try:
        login_response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json={"email": "admin@school.com", "password": "password123"}
        )
        
        if login_response.status_code != 200:
            print("❌ Không thể đăng nhập")
            return False
        
        token = login_response.json().get("access_token") or login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Query vào từng bảng
        for table in tables:
            try:
                # Sử dụng Supabase REST API để query
                response = requests.get(
                    f"{API_BASE_URL}/api/{table.replace('_', '-')}",
                    headers=headers
                )
                print(f"   ✅ {table}: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  {table}: {str(e)}")
        
        print("\n✅ Đã query vào tất cả các bảng")
        print("   Đợi 5-10 giây để PostgREST refresh schema cache...")
        time.sleep(10)
        print("   ✅ Hoàn tất!")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        return False

if __name__ == "__main__":
    refresh_schema_by_querying()

