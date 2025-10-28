#!/usr/bin/env python3
"""
Test campus filter
Test filter theo campus
"""

import requests
import json

def test_campus_filter():
    base_url = "http://localhost:8000"
    
    # Login
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get campuses first
        print("Getting campuses...")
        response = requests.get(f"{base_url}/api/campuses", headers=headers)
        if response.status_code == 200:
            campuses = response.json()
            print(f"Found {len(campuses)} campuses:")
            for campus in campuses:
                print(f"  - {campus['name']} (ID: {campus['id']})")
            
            # Test filter by first campus
            if campuses:
                campus_id = campuses[0]['id']
                print(f"\nTesting filter by campus {campus_id}...")
                
                response = requests.get(f"{base_url}/api/classrooms?campus_id={campus_id}", headers=headers)
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    classrooms = response.json()
                    print(f"Found {len(classrooms)} classrooms for this campus")
                    for classroom in classrooms:
                        print(f"  - {classroom['name']} ({classroom['code']})")
                else:
                    print(f"Error: {response.text}")
        else:
            print(f"Error getting campuses: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_campus_filter()
