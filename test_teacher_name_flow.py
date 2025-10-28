#!/usr/bin/env python3
"""
Test script to verify teacher name flow from users.full_name
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_teacher_name_flow():
    print("Testing Teacher Name Flow...")
    print("=" * 50)
    
    # Test data with unique email
    timestamp = int(time.time())
    test_teacher_data = {
        "name": "Nguyen Van Test Name",
        "email": f"testname{timestamp}@example.com",
        "phone": "0901234567",
        "address": "123 Test Street, District 1, HCMC",
        "role": "teacher"
    }
    
    print(f"Test Data:")
    print(f"   Name: {test_teacher_data['name']}")
    print(f"   Email: {test_teacher_data['email']}")
    print(f"   Phone: {test_teacher_data['phone']}")
    print(f"   Address: {test_teacher_data['address']}")
    print(f"   Role: {test_teacher_data['role']}")
    print()
    
    # Step 1: Create teacher
    print("1. Creating teacher...")
    try:
        create_response = requests.post(
            f"{API_BASE_URL}/api/teachers/",
            json=test_teacher_data,
            timeout=10
        )
        
        if create_response.status_code == 200:
            created_teacher = create_response.json()
            print(f"SUCCESS: Teacher created successfully!")
            print(f"   Teacher ID: {created_teacher['id']}")
            print(f"   User ID: {created_teacher['user_id']}")
            print(f"   Teacher Code: {created_teacher['teacher_code']}")
            print(f"   Name (from users.full_name): {created_teacher['name']}")
            print(f"   Email (from users.email): {created_teacher['email']}")
            print()
            
            # Step 2: Get all teachers to verify
            print("2. Getting all teachers to verify...")
            get_response = requests.get(f"{API_BASE_URL}/api/teachers/", timeout=10)
            
            if get_response.status_code == 200:
                teachers = get_response.json()
                print(f"SUCCESS: Retrieved {len(teachers)} teachers")
                
                # Find our created teacher
                our_teacher = None
                for teacher in teachers:
                    if teacher['id'] == created_teacher['id']:
                        our_teacher = teacher
                        break
                
                if our_teacher:
                    print(f"SUCCESS: Found our teacher in the list:")
                    print(f"   Name: {our_teacher['name']}")
                    print(f"   Email: {our_teacher['email']}")
                    print(f"   Teacher Code: {our_teacher['teacher_code']}")
                    
                    # Verify name comes from users.full_name
                    if our_teacher['name'] == test_teacher_data['name']:
                        print("SUCCESS: Name correctly retrieved from users.full_name!")
                    else:
                        print(f"ERROR: Name mismatch!")
                        print(f"   Expected: {test_teacher_data['name']}")
                        print(f"   Got: {our_teacher['name']}")
                else:
                    print("ERROR: Could not find our created teacher in the list!")
            else:
                print(f"ERROR: Failed to get teachers - {get_response.status_code}")
                print(f"Response: {get_response.text}")
        else:
            print(f"ERROR: Failed to create teacher - {create_response.status_code}")
            print(f"Response: {create_response.text}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_teacher_name_flow()
