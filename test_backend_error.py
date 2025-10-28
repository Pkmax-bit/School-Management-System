#!/usr/bin/env python3
"""
Test script để kiểm tra lỗi backend
"""

import requests
import json

def test_backend_error():
    """Test backend error"""
    url = "http://localhost:8000/api/subjects"
    
    # Test data
    data = {
        "name": "Test Subject",
        "code": "TEST",
        "description": "Test description"
    }
    
    try:
        print("Testing POST /api/subjects...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Success!")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_backend_error()
