#!/usr/bin/env python3
"""
Test script for Students CRUD functionality
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_students_crud():
    print("Testing Students CRUD...")
    print("=" * 50)
    
    # Test data with unique email
    timestamp = int(time.time())
    test_student_data = {
        "name": "Nguyen Van Student Test",
        "email": f"student{timestamp}@example.com",
        "phone": "0901234567",
        "address": "123 Student Street, District 1, HCMC",
        "role": "student",
        "date_of_birth": "2010-05-15",
        "parent_name": "Nguyen Van Parent",
        "parent_phone": "0987654321"
    }
    
    print(f"Test Data:")
    print(f"   Name: {test_student_data['name']}")
    print(f"   Email: {test_student_data['email']}")
    print(f"   Phone: {test_student_data['phone']}")
    print(f"   Address: {test_student_data['address']}")
    print(f"   Role: {test_student_data['role']}")
    print(f"   Date of Birth: {test_student_data['date_of_birth']}")
    print(f"   Parent Name: {test_student_data['parent_name']}")
    print(f"   Parent Phone: {test_student_data['parent_phone']}")
    print()
    
    # Step 1: Create student
    print("1. Creating student...")
    try:
        create_response = requests.post(
            f"{API_BASE_URL}/api/students/",
            json=test_student_data,
            timeout=10
        )
        
        if create_response.status_code == 200:
            created_student = create_response.json()
            print("SUCCESS: Student created successfully!")
            print(f"   Student ID: {created_student['id']}")
            print(f"   User ID: {created_student['user_id']}")
            print(f"   Student Code: {created_student['student_code']}")
            print(f"   Name: {created_student['name']}")
            print(f"   Email: {created_student['email']}")
            print(f"   Phone: {created_student['phone']}")
            print(f"   Address: {created_student['address']}")
            print(f"   Date of Birth: {created_student['date_of_birth']}")
            print(f"   Parent Name: {created_student['parent_name']}")
            print(f"   Parent Phone: {created_student['parent_phone']}")
            print()
            
            # Step 2: Get all students to verify
            print("2. Getting all students to verify...")
            get_response = requests.get(f"{API_BASE_URL}/api/students/", timeout=10)
            
            if get_response.status_code == 200:
                students = get_response.json()
                print(f"SUCCESS: Retrieved {len(students)} students")
                
                # Find our created student
                our_student = None
                for student in students:
                    if student['id'] == created_student['id']:
                        our_student = student
                        break
                
                if our_student:
                    print(f"SUCCESS: Found our student in the list:")
                    print(f"   Name: {our_student['name']}")
                    print(f"   Email: {our_student['email']}")
                    print(f"   Student Code: {our_student['student_code']}")
                    print(f"   Phone: {our_student['phone']}")
                    print(f"   Address: {our_student['address']}")
                    print(f"   Date of Birth: {our_student['date_of_birth']}")
                    print(f"   Parent Name: {our_student['parent_name']}")
                    print(f"   Parent Phone: {our_student['parent_phone']}")
                    
                    # Step 3: Update student
                    print("\n3. Updating student...")
                    update_data = {
                        "name": f"Updated {our_student['name']}",
                        "phone": "0999888777",
                        "address": "Updated Student Address",
                        "parent_name": "Updated Parent Name"
                    }
                    
                    update_response = requests.put(
                        f"{API_BASE_URL}/api/students/{our_student['id']}",
                        json=update_data,
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        updated_student = update_response.json()
                        print("SUCCESS: Student updated successfully!")
                        print(f"   Updated Name: {updated_student['name']}")
                        print(f"   Updated Phone: {updated_student['phone']}")
                        print(f"   Updated Address: {updated_student['address']}")
                        print(f"   Updated Parent Name: {updated_student['parent_name']}")
                        
                        # Step 4: Delete student
                        print("\n4. Deleting student...")
                        delete_response = requests.delete(
                            f"{API_BASE_URL}/api/students/{our_student['id']}",
                            timeout=10
                        )
                        
                        if delete_response.status_code == 200:
                            print("SUCCESS: Student deleted successfully!")
                            
                            # Step 5: Verify deletion
                            print("\n5. Verifying deletion...")
                            verify_response = requests.get(f"{API_BASE_URL}/api/students/", timeout=10)
                            
                            if verify_response.status_code == 200:
                                remaining_students = verify_response.json()
                                student_exists = any(s['id'] == our_student['id'] for s in remaining_students)
                                
                                if not student_exists:
                                    print("SUCCESS: Student successfully deleted and no longer exists!")
                                else:
                                    print("ERROR: Student still exists after deletion!")
                            else:
                                print(f"ERROR: Failed to verify deletion - {verify_response.status_code}")
                        else:
                            print(f"ERROR: Failed to delete student - {delete_response.status_code}")
                            print(f"Response: {delete_response.text}")
                    else:
                        print(f"ERROR: Failed to update student - {update_response.status_code}")
                        print(f"Response: {update_response.text}")
                else:
                    print("ERROR: Could not find our created student in the list!")
            else:
                print(f"ERROR: Failed to get students - {get_response.status_code}")
                print(f"Response: {get_response.text}")
        else:
            print(f"ERROR: Failed to create student - {create_response.status_code}")
            print(f"Response: {create_response.text}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_students_crud()

