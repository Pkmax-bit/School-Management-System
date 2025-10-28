#!/usr/bin/env python3
"""
Test script để kiểm tra tạo môn học
"""

import requests
import json

def test_create_subject():
    """Test tạo môn học"""
    url = "http://localhost:8000/api/subjects"
    
    # Test data
    subject_data = {
        "name": "Toán học",
        "code": "MATH",
        "description": "Môn toán học cơ bản"
    }
    
    try:
        print("Testing create subject...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(subject_data, indent=2)}")
        
        # Test GET first
        print("\n1. Testing GET /api/subjects...")
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test POST
        print("\n2. Testing POST /api/subjects...")
        response = requests.post(url, json=subject_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Subject created successfully!")
        else:
            print("❌ Failed to create subject")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure backend is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_create_subject()
