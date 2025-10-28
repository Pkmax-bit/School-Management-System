#!/usr/bin/env python3
"""
Test script to simulate frontend update teacher call
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_frontend_update_simulation():
    print("Testing Frontend Update Simulation...")
    print("=" * 50)
    
    # Get a teacher to update
    print("1. Getting teachers list...")
    try:
        get_response = requests.get(f"{API_BASE_URL}/api/teachers/", timeout=10)
        if get_response.status_code == 200:
            teachers = get_response.json()
            if teachers:
                teacher_to_update = teachers[0]
                print(f"Found teacher: {teacher_to_update['name']} (ID: {teacher_to_update['id']})")
                
                # Simulate frontend update data
                update_data = {
                    "name": f"Frontend Updated {teacher_to_update['name']}",
                    "email": f"frontend{int(time.time())}@example.com",
                    "phone": "0999888777",
                    "address": "Frontend Updated Address"
                }
                
                print(f"2. Simulating frontend update call:")
                print(f"   URL: {API_BASE_URL}/api/teachers/{teacher_to_update['id']}")
                print(f"   Method: PUT")
                print(f"   Data: {json.dumps(update_data, indent=2)}")
                
                # Make the PUT request
                headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
                
                update_response = requests.put(
                    f"{API_BASE_URL}/api/teachers/{teacher_to_update['id']}",
                    json=update_data,
                    headers=headers,
                    timeout=10
                )
                
                print(f"3. Response:")
                print(f"   Status Code: {update_response.status_code}")
                print(f"   Headers: {dict(update_response.headers)}")
                
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
    test_frontend_update_simulation()

