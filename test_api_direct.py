#!/usr/bin/env python3
"""
Test API directly
Test API trực tiếp
"""

import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    print("Testing API endpoints...")
    print("=" * 50)
    
    # Test health
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health error: {e}")
    
    # Test campuses (without auth - should fail)
    try:
        response = requests.get(f"{base_url}/api/campuses")
        print(f"Campuses (no auth): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Campuses error: {e}")
    
    # Test classrooms (without auth - should fail)
    try:
        response = requests.get(f"{base_url}/api/classrooms")
        print(f"Classrooms (no auth): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Classrooms error: {e}")
    
    # Test classrooms with campus_id (without auth - should fail)
    try:
        response = requests.get(f"{base_url}/api/classrooms?campus_id=test")
        print(f"Classrooms with campus_id (no auth): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Classrooms with campus_id error: {e}")

if __name__ == "__main__":
    test_api()
