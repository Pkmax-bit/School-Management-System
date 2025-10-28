#!/usr/bin/env python3
"""
Test authentication debug for subjects API
"""

import requests
import json

# Test different authentication methods
def test_auth_methods():
    base_url = "http://localhost:8000"
    
    print("Testing Subjects API Authentication Methods")
    print("=" * 50)
    
    # Test 1: No authentication
    print("\n1. Testing without authentication:")
    try:
        response = requests.get(f"{base_url}/api/subjects/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: With fake JWT token
    print("\n2. Testing with fake JWT token:")
    try:
        headers = {"Authorization": "Bearer fake-jwt-token"}
        response = requests.get(f"{base_url}/api/subjects/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: With fake Supabase token
    print("\n3. Testing with fake Supabase token:")
    try:
        headers = {"Authorization": "Bearer fake-supabase-token"}
        response = requests.get(f"{base_url}/api/subjects/", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Check backend status
    print("\n4. Testing backend health:")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 5: Check subjects endpoint specifically
    print("\n5. Testing subjects endpoint:")
    try:
        response = requests.get(f"{base_url}/api/subjects/")
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_auth_methods()
