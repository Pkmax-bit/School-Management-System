#!/usr/bin/env python3
"""
Test subjects API after fixing the AttributeError
"""

import requests
import json

def test_subjects_api():
    base_url = "http://localhost:8000"
    
    print("Testing Subjects API After Fix")
    print("=" * 40)
    
    # Test 1: Health check
    print("\n1. Testing backend health:")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get subjects (should work with mock token)
    print("\n2. Testing GET /api/subjects/ with mock token:")
    try:
        headers = {"Authorization": "Bearer mock-jwt-token-for-development"}
        response = requests.get(f"{base_url}/api/subjects/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Create subject (should work with mock token)
    print("\n3. Testing POST /api/subjects/ with mock token:")
    try:
        headers = {"Authorization": "Bearer mock-jwt-token-for-development"}
        data = {
            "name": "Test Subject",
            "code": "TEST001",
            "description": "Test subject for API testing"
        }
        response = requests.post(f"{base_url}/api/subjects/", headers=headers, json=data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Create subject without token (should fail)
    print("\n4. Testing POST /api/subjects/ without token:")
    try:
        data = {
            "name": "Test Subject 2",
            "code": "TEST002",
            "description": "Test subject without token"
        }
        response = requests.post(f"{base_url}/api/subjects/", json=data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_subjects_api()

