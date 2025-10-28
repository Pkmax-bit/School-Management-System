#!/usr/bin/env python3
"""
Test script to reproduce student creation error
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_student_error():
    print("Testing Student Creation Error...")
    print("=" * 50)
    
    # Test data that might cause error
    timestamp = int(time.time())
    test_student_data = {
        "name": "Test Student Error",
        "email": f"testerror{timestamp}@example.com",
        "phone": "0777802410",
        "address": "Test Address",
        "role": "student",
        "date_of_birth": "2009-10-14",
        "parent_name": "Test Parent",
        "parent_phone": "100000",
        "classroom_id": ""
    }
    
    print(f"Test Data:")
    for key, value in test_student_data.items():
        print(f"   {key}: {value}")
    print()
    
    # Step 1: Create student
    print("1. Creating student...")
    try:
        create_response = requests.post(
            f"{API_BASE_URL}/api/students/",
            json=test_student_data,
            timeout=10
        )
        
        print(f"Status Code: {create_response.status_code}")
        print(f"Response: {create_response.text}")
        
        if create_response.status_code == 200:
            created_student = create_response.json()
            print("SUCCESS: Student created successfully!")
            print(f"   Student ID: {created_student['id']}")
            print(f"   Student Code: {created_student['student_code']}")
            print(f"   Name: {created_student['name']}")
            print(f"   Email: {created_student['email']}")
        else:
            print(f"ERROR: Failed to create student - {create_response.status_code}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_student_error()

