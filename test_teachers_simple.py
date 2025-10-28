#!/usr/bin/env python3
"""
Test Teachers API - Simple version
"""

import requests
import json

def test_teachers_simple():
    base_url = "http://localhost:8000"
    
    print("Testing Teachers API - Simple")
    print("=" * 40)
    
    # Test 1: Health check
    print("\n1. Testing backend health:")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Test endpoints without auth
    print("\n2. Testing test endpoints without auth:")
    try:
        response = requests.get(f"{base_url}/api/teachers/simple-test")
        print(f"   /simple-test Status: {response.status_code}")
        print(f"   /simple-test Response: {response.text}")
    except Exception as e:
        print(f"   /simple-test Error: {e}")
    
    # Test 3: Get teachers simple (no auth)
    print("\n3. Testing GET /api/teachers/simple (no auth):")
    try:
        response = requests.get(f"{base_url}/api/teachers/simple")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: Get teachers public (no auth)
    print("\n4. Testing GET /api/teachers/public-list (no auth):")
    try:
        response = requests.get(f"{base_url}/api/teachers/public-list")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_teachers_simple()

