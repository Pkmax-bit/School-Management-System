"""
Test register và login với tài khoản teacher
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_teacher_register_and_login():
    """Test register và login với tài khoản teacher"""
    
    # Thông tin đăng ký teacher
    register_data = {
        "email": "teacher@school.com",
        "password": "teacher123",
        "full_name": "Nguyen Van Giao",
        "role": "teacher"
    }
    
    login_data = {
        "email": "teacher@school.com",
        "password": "teacher123"
    }
    
    print("=" * 60)
    print("Testing Teacher Register and Login")
    print("=" * 60)
    
    # Test Register
    print("\n[STEP 1] Dang ky tai khoan teacher...")
    print(f"Email: {register_data['email']}")
    print(f"Password: {register_data['password']}")
    print(f"Full Name: {register_data['full_name']}")
    print(f"Role: {register_data['role']}")
    print("-" * 60)
    
    try:
        # Gọi API register
        register_response = requests.post(
            f"{API_BASE_URL}/api/auth/register",
            json=register_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Register Status Code: {register_response.status_code}")
        
        if register_response.status_code in [200, 201]:
            print("[SUCCESS] Dang ky thanh cong!")
            try:
                result = register_response.json()
                print("Response:", json.dumps(result, indent=2, ensure_ascii=False))
            except:
                pass
        else:
            print("[NOTE] Dang ky that bai hoac user da ton tai")
            try:
                error_data = register_response.json()
                print("Error:", json.dumps(error_data, indent=2, ensure_ascii=False))
                if "already registered" in str(error_data).lower():
                    print("[NOTE] User da ton tai, tiep tuc test login...")
            except:
                print("Error:", register_response.text)
        
    except requests.exceptions.ConnectionError:
        print("[ERROR] Khong the ket noi den backend!")
        print(f"       Hay dam bao backend dang chay tai {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"[ERROR] Loi khi dang ky: {str(e)}")
    
    # Test Login
    print("\n" + "=" * 60)
    print("[STEP 2] Dang nhap tai khoan teacher...")
    print(f"Email: {login_data['email']}")
    print(f"Password: {login_data['password']}")
    print("-" * 60)
    
    try:
        # Gọi API login
        login_response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Login Status Code: {login_response.status_code}")
        print("-" * 60)
        
        if login_response.status_code == 200:
            result = login_response.json()
            print("[SUCCESS] Dang nhap thanh cong!")
            print("-" * 60)
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
            
            print("\n" + "=" * 60)
            print("[SUCCESS] TEST THANH CONG!")
            print("=" * 60)
            return True
        else:
            print("[FAILED] Dang nhap that bai!")
            print(f"Error: {login_response.text}")
            
            try:
                error_data = login_response.json()
                print("Error Details:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                pass
            
            print("\n" + "=" * 60)
            print("[FAILED] TEST THAT BAI!")
            print("=" * 60)
            return False
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Khong the ket noi den backend!")
        print(f"       Hay dam bao backend dang chay tai {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"[ERROR] Loi: {str(e)}")
        return False

if __name__ == "__main__":
    test_teacher_register_and_login()

