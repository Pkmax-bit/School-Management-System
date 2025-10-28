#!/usr/bin/env python3
"""
Test API with authentication
Test API với authentication
"""

import requests
import json

def login_and_get_token():
    """Login and get auth token"""
    base_url = "http://localhost:8000"
    
    # Try to login with admin credentials
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_with_auth():
    base_url = "http://localhost:8000"
    
    # Get auth token
    token = login_and_get_token()
    if not token:
        print("Could not get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("Testing API with authentication...")
    print("=" * 50)
    
    # Test campuses
    try:
        response = requests.get(f"{base_url}/api/campuses", headers=headers)
        print(f"Campuses: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} campuses:")
            for campus in data:
                print(f"  - {campus['name']} ({campus['code']}) - ID: {campus['id']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Campuses error: {e}")
    
    # Test classrooms
    try:
        response = requests.get(f"{base_url}/api/classrooms", headers=headers)
        print(f"\nClassrooms: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} classrooms:")
            for classroom in data:
                print(f"  - {classroom['name']} ({classroom['code']}) - Campus: {classroom.get('campus_id', 'NULL')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Classrooms error: {e}")
    
    # Test classrooms with campus_id
    try:
        response = requests.get(f"{base_url}/api/classrooms?campus_id=test", headers=headers)
        print(f"\nClassrooms with campus_id=test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} classrooms for campus 'test'")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Classrooms with campus_id error: {e}")

if __name__ == "__main__":
    test_with_auth()
