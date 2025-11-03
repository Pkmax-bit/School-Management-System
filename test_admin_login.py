"""
Test login với tài khoản admin để so sánh
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_admin_login():
    """Test login với tài khoản admin"""
    
    login_data = {
        "email": "admin@school.com",
        "password": "password123"
    }
    
    print("=" * 50)
    print("Testing Admin Login")
    print("=" * 50)
    print(f"Email: {login_data['email']}")
    print(f"Password: {login_data['password']}")
    print("-" * 50)
    
    try:
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
            return False
            
    except Exception as e:
        print(f"[ERROR] Loi: {str(e)}")
        return False

if __name__ == "__main__":
    test_admin_login()

