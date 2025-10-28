#!/usr/bin/env python3
"""
Simple test for Teachers API
"""

import requests
import json

# API Configuration
API_BASE_URL = "http://localhost:8000"
API_URL = f"{API_BASE_URL}/api/teachers/"

# Test data
import time
timestamp = int(time.time())
test_teacher_data = {
    "name": "Nguyen Van Test",
    "email": f"test{timestamp}@example.com",
    "phone": "0901234567",
    "address": "123 Test Street, District 1, HCMC",
    "role": "teacher"
}

def test_api():
    print("Testing Teachers API...")
    
    # Test API connection
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("API is running")
        else:
            print(f"API returned status {response.status_code}")
            return
    except:
        print("API is not running - please start the backend server")
        return
    
    # Test CREATE teacher
    print("\nTesting CREATE teacher...")
    try:
        response = requests.post(API_URL, json=test_teacher_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("Teacher created successfully!")
            print(f"Teacher ID: {data.get('id')}")
        else:
            print("Failed to create teacher")
            
    except Exception as e:
        print(f"Error creating teacher: {e}")

if __name__ == "__main__":
    test_api()