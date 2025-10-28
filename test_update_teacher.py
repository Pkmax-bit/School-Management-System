#!/usr/bin/env python3
"""
Test script for UPDATE teacher API
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_update_teacher():
    print("Testing UPDATE teacher...")
    print("=" * 50)
    
    # First, get a teacher to update
    print("1. Getting teachers list...")
    try:
        get_response = requests.get(f"{API_BASE_URL}/api/teachers/", timeout=10)
        if get_response.status_code == 200:
            teachers = get_response.json()
            if teachers:
                teacher_to_update = teachers[0]
                print(f"Found teacher to update: {teacher_to_update['name']} (ID: {teacher_to_update['id']})")
                
                # Update data
                update_data = {
                    "name": f"Updated {teacher_to_update['name']}",
                    "email": f"updated{int(time.time())}@example.com",
                    "phone": "0987654321",
                    "address": "Updated Address, District 1, HCMC"
                }
                
                print(f"2. Updating teacher with data:")
                print(f"   Name: {update_data['name']}")
                print(f"   Email: {update_data['email']}")
                print(f"   Phone: {update_data['phone']}")
                print(f"   Address: {update_data['address']}")
                
                # Update teacher
                update_response = requests.put(
                    f"{API_BASE_URL}/api/teachers/{teacher_to_update['id']}",
                    json=update_data,
                    timeout=10
                )
                
                print(f"3. Update response:")
                print(f"   Status Code: {update_response.status_code}")
                
                if update_response.status_code == 200:
                    updated_teacher = update_response.json()
                    print("SUCCESS: Teacher updated successfully!")
                    print(f"   Updated Name: {updated_teacher['name']}")
                    print(f"   Updated Email: {updated_teacher['email']}")
                    print(f"   Updated Phone: {updated_teacher['phone']}")
                    print(f"   Updated Address: {updated_teacher['address']}")
                else:
                    print(f"ERROR: Failed to update teacher")
                    print(f"Response: {update_response.text}")
            else:
                print("ERROR: No teachers found to update")
        else:
            print(f"ERROR: Failed to get teachers - {get_response.status_code}")
            print(f"Response: {get_response.text}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_update_teacher()

