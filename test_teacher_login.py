"""
Test login với tài khoản teacher
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_teacher_login():
    """Test login với tài khoản teacher"""
    
    # Thông tin đăng nhập teacher
    login_data = {
        "email": "teacher@school.com",
        "password": "teacher123"
    }
    
    print("=" * 50)
    print("Testing Teacher Login")
    print("=" * 50)
    print(f"Email: {login_data['email']}")
    print(f"Password: {login_data['password']}")
    print("-" * 50)
    
    try:
        # Gọi API login
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print("-" * 50)
        
        if response.status_code == 200:
            result = response.json()
            print("[SUCCESS] Login thanh cong!")
            print("-" * 50)
            print("Response:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # Kiểm tra token
            if "access_token" in result:
                print("\n[OK] Access Token:", result["access_token"][:50] + "...")
            
            # Kiểm tra user data
            if "user" in result:
                user = result["user"]
                print("\n[OK] User Data:")
                print(f"   ID: {user.get('id')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Full Name: {user.get('full_name')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Is Active: {user.get('is_active')}")
            
            return True
        else:
            print("[FAILED] Login that bai!")
            print(f"Error: {response.text}")
            
            try:
                error_data = response.json()
                print("Error Details:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                pass
            
            print("\n[NOTE] Co the user chua duoc tao trong Supabase Auth.")
            print("       Hay chay script create_teacher_user.py de tao user.")
            
            return False
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Khong the ket noi den backend!")
        print(f"       Hay dam bao backend dang chay tai {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"[ERROR] Loi: {str(e)}")
        return False

if __name__ == "__main__":
    test_teacher_login()

