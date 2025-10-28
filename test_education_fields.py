#!/usr/bin/env python3
"""
Test script for education fields in teachers
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_education_fields():
    print("Testing Education Fields in Teachers...")
    print("=" * 50)
    
    # Test data with education fields
    timestamp = int(time.time())
    test_teacher_data = {
        "name": "Nguyen Van Education Test",
        "email": f"education{timestamp}@example.com",
        "phone": "0901234567",
        "address": "123 Education Street, District 1, HCMC",
        "role": "teacher",
        "education_level": "Thạc sĩ",
        "degree_name": "Kỹ thuật phần mềm"
    }
    
    print(f"Test Data:")
    print(f"   Name: {test_teacher_data['name']}")
    print(f"   Email: {test_teacher_data['email']}")
    print(f"   Phone: {test_teacher_data['phone']}")
    print(f"   Address: {test_teacher_data['address']}")
    print(f"   Role: {test_teacher_data['role']}")
    print(f"   Education Level: {test_teacher_data['education_level']}")
    print(f"   Degree Name: {test_teacher_data['degree_name']}")
    print()
    
    # Step 1: Create teacher with education fields
    print("1. Creating teacher with education fields...")
    try:
        create_response = requests.post(
            f"{API_BASE_URL}/api/teachers/",
            json=test_teacher_data,
            timeout=10
        )
        
        if create_response.status_code == 200:
            created_teacher = create_response.json()
            print("SUCCESS: Teacher created successfully!")
            print(f"   Teacher ID: {created_teacher['id']}")
            print(f"   Name: {created_teacher['name']}")
            print(f"   Email: {created_teacher['email']}")
            print(f"   Education Level: {created_teacher.get('education_level', 'Not found')}")
            print(f"   Degree Name: {created_teacher.get('degree_name', 'Not found')}")
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
                    print(f"   Education Level: {our_teacher.get('education_level', 'Not found')}")
                    print(f"   Degree Name: {our_teacher.get('degree_name', 'Not found')}")
                    
                    # Verify education fields
                    if (our_teacher.get('education_level') == test_teacher_data['education_level'] and 
                        our_teacher.get('degree_name') == test_teacher_data['degree_name']):
                        print("SUCCESS: Education fields correctly saved and retrieved!")
                    else:
                        print("ERROR: Education fields mismatch!")
                        print(f"   Expected Education Level: {test_teacher_data['education_level']}")
                        print(f"   Got Education Level: {our_teacher.get('education_level')}")
                        print(f"   Expected Degree Name: {test_teacher_data['degree_name']}")
                        print(f"   Got Degree Name: {our_teacher.get('degree_name')}")
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
    test_education_fields()

