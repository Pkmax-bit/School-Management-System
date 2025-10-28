#!/usr/bin/env python3
"""
Simple test script for Students API
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_students_simple():
    print("Testing Students API (Simple)...")
    print("=" * 50)
    
    # Test data without date_of_birth
    timestamp = int(time.time())
    test_student_data = {
        "name": "Simple Student Test",
        "email": f"simple{timestamp}@example.com",
        "phone": "0901234567",
        "address": "123 Simple Street",
        "role": "student"
    }
    
    print(f"Test Data:")
    print(f"   Name: {test_student_data['name']}")
    print(f"   Email: {test_student_data['email']}")
    print(f"   Phone: {test_student_data['phone']}")
    print(f"   Address: {test_student_data['address']}")
    print(f"   Role: {test_student_data['role']}")
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
    test_students_simple()

