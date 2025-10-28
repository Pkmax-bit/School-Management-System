#!/usr/bin/env python3
"""
Test with IDs only
"""

import requests
import json

def test():
    base_url = "http://localhost:8000"
    
    # Login
    login_data = {"email": "admin@example.com", "password": "admin123"}
    response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get campuses
    response = requests.get(f"{base_url}/api/campuses", headers=headers)
    campuses = response.json()
    print(f"Campuses: {len(campuses)}")
    for c in campuses:
        print(f"  ID: {c['id']}")
    
    # Get classrooms
    response = requests.get(f"{base_url}/api/classrooms", headers=headers)
    classrooms = response.json()
    print(f"\nClassrooms: {len(classrooms)}")
    for c in classrooms:
        print(f"  Name: {c['name']}, Campus ID: {c.get('campus_id', 'NULL')}")
    
    # Test filter
    if campuses:
        campus_id = campuses[0]['id']
        print(f"\nTesting filter by campus {campus_id}")
        response = requests.get(f"{base_url}/api/classrooms?campus_id={campus_id}", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            filtered = response.json()
            print(f"Filtered classrooms: {len(filtered)}")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    test()
