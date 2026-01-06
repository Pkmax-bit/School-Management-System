#!/usr/bin/env python3
"""
Test script for classroom creation functionality
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def login(email, password):
    """Login and get access token"""
    url = f"{API_BASE}/auth/login"
    data = {
        "email": email,
        "password": password
    }

    try:
        response = requests.post(url, json=data)
        print(f"Login status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Login successful for {email}")
            return result.get("access_token")
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_classroom_creation(token):
    """Test classroom creation"""
    url = f"{API_BASE}/classrooms"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test data for classroom creation - use a unique code
    classroom_data = {
        "name": "Lop Toan 10A1 - Basic Test",
        "code": "Class9997",  # Use a high number to ensure uniqueness
        "description": "Lop toan 10A1 dung de test chuc nang tao lop",
        "capacity": 35,
        "tuition_per_session": 50000,
        "sessions_per_week": 2,
        "open_date": "2026-01-15",
        "close_date": "2026-05-30"
    }

    print(f"\nTesting classroom creation with data:")
    print(json.dumps(classroom_data, indent=2))

    try:
        response = requests.post(url, json=classroom_data, headers=headers)
        print(f"\nClassroom creation response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("Classroom created successfully!")
            print(f"Classroom ID: {result.get('id')}")
            print(f"Classroom Code: {result.get('code')}")
            print(f"Classroom Name: {result.get('name')}")
            return result
        else:
            print(f"Classroom creation failed: {response.text}")
            return None
    except Exception as e:
        print(f"Classroom creation error: {e}")
        return None

def test_get_classrooms(token):
    """Test getting classrooms list"""
    url = f"{API_BASE}/classrooms"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"\nGet classrooms status: {response.status_code}")

        if response.status_code == 200:
            classrooms = response.json()
            print(f"Retrieved {len(classrooms)} classrooms")
            for i, classroom in enumerate(classrooms[:3]):  # Show first 3
                print(f"  {i+1}. {classroom.get('name')} ({classroom.get('code')})")
            return classrooms
        else:
            print(f"Get classrooms failed: {response.text}")
            return []
    except Exception as e:
        print(f"Get classrooms error: {e}")
        return []

def test_auto_code_generation(token):
    """Test auto code generation"""
    url = f"{API_BASE}/classrooms/next-code"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"\n🔢 Next code generation status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            next_code = result.get("next_code")
            print(f"Next available code: {next_code}")
            return next_code
        else:
            print(f"Next code generation failed: {response.text}")
            return None
    except Exception as e:
        print(f"Next code generation error: {e}")
        return None

def get_teachers_and_subjects(token):
    """Get available teachers and subjects for testing"""
    headers = {"Authorization": f"Bearer {token}"}

    # Get teachers
    teachers_response = requests.get(f"{API_BASE}/teachers?limit=10", headers=headers)
    teachers = []
    if teachers_response.status_code == 200:
        teachers = teachers_response.json()

    # Get subjects
    subjects_response = requests.get(f"{API_BASE}/subjects?limit=10", headers=headers)
    subjects = []
    if subjects_response.status_code == 200:
        subjects = subjects_response.json()

    # Get campuses
    campuses_response = requests.get(f"{API_BASE}/campuses?limit=10", headers=headers)
    campuses = []
    if campuses_response.status_code == 200:
        campuses = campuses_response.json()

    return teachers, subjects, campuses

def test_teacher_subject_assignment(token):
    """Test creating classroom with teacher, subject, and campus assignment"""
    teachers, subjects, campuses = get_teachers_and_subjects(token)

    print("\nTesting teacher/subject/campus assignment...")
    print(f"Available teachers: {len(teachers)}")
    print(f"Available subjects: {len(subjects)}")
    print(f"Available campuses: {len(campuses)}")

    url = f"{API_BASE}/classrooms"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Get next code
    next_code_response = requests.get(f"{API_BASE}/classrooms/next-code", headers=headers)
    next_code = "Class9998"
    if next_code_response.status_code == 200:
        next_code = next_code_response.json().get("next_code", "Class9998")

    # Create classroom with assignments
    classroom_data = {
        "name": "Lop Toan 10A2 - Full Assignment Test",
        "code": next_code,
        "description": "Lop voi day du thong tin giao vien, mon hoc, co so",
        "capacity": 40,
        "tuition_per_session": 60000,
        "sessions_per_week": 3,
        "open_date": "2026-02-01",
        "close_date": "2026-06-30"
    }

    # Add teacher if available
    if teachers:
        classroom_data["teacher_id"] = teachers[0]["id"]
        print(f"Assigning teacher ID: {teachers[0]['id']}")

    # Add subject if available
    if subjects:
        classroom_data["subject_id"] = subjects[0]["id"]
        print(f"Assigning subject ID: {subjects[0]['id']}")

    # Add campus if available
    if campuses:
        classroom_data["campus_id"] = campuses[0]["id"]
        print(f"Assigning campus ID: {campuses[0]['id']}")

    print(f"Creating classroom with full assignments...")
    try:
        response = requests.post(url, json=classroom_data, headers=headers)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("Classroom with assignments created successfully!")
            print(f"ID: {result.get('id')}")
            print(f"Teacher ID: {result.get('teacher_id')}")
            print(f"Subject ID: {result.get('subject_id')}")
            print(f"Campus ID: {result.get('campus_id')}")
            return result
        else:
            print(f"Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_validation_rules(token):
    """Test validation rules for classroom creation"""
    url = f"{API_BASE}/classrooms"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test cases for validation
    test_cases = [
        {
            "name": "Test invalid code format",
            "data": {
                "name": "Lop Test",
                "code": "INVALID123",  # Wrong format
                "capacity": 30
            },
            "expected_error": "must be in format Class0001"
        },
        {
            "name": "Test duplicate code",
            "data": {
                "name": "Lop Test Duplicate",
                "code": "Class9999",  # Already used
                "capacity": 30
            },
            "expected_error": "already exists"
        },
        {
            "name": "Test missing required fields",
            "data": {
                "name": "",  # Empty name
                "code": "Class9997"
            },
            "expected_error": "required"
        }
    ]

    print(f"\nTesting validation rules...")

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n  {i}. {test_case['name']}")
        try:
            response = requests.post(url, json=test_case['data'], headers=headers)
            if response.status_code == 400:
                print(f"    Validation working: {response.json().get('detail', 'Unknown error')}")
            elif response.status_code == 422:  # Pydantic validation
                print(f"    Validation working: {response.json().get('detail', 'Unknown error')}")
            elif response.status_code == 200:
                print(f"    Validation failed - should have been rejected: {response.json()}")
            else:
                print(f"    Unexpected status: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"    Validation test error: {e}")

def test_permissions(token):
    """Test that only admin can create classrooms"""
    print("\nTesting permissions...")

    # Test admin access (should work)
    print("1. Testing admin access (should work)...")
    url = f"{API_BASE}/classrooms"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    test_data = {
        "name": "Permission Test Class",
        "code": "Class9996",
        "capacity": 30
    }

    response = requests.post(url, json=test_data, headers=headers)
    if response.status_code == 200:
        print("   Admin access: ALLOWED (correct)")
        # Clean up - delete the test classroom
        classroom_id = response.json()["id"]
        delete_response = requests.delete(f"{url}/{classroom_id}", headers=headers)
        print(f"   Cleanup: {'success' if delete_response.status_code == 200 else 'failed'}")
    else:
        print(f"   Admin access: DENIED (unexpected): {response.status_code}")

    # Test teacher access (should be denied)
    print("2. Testing teacher access (should be denied)...")
    teacher_token = login("teacher@school.com", "teacher123")

    if teacher_token:
        teacher_headers = {
            "Authorization": f"Bearer {teacher_token}",
            "Content-Type": "application/json"
        }

        test_data_teacher = {
            "name": "Teacher Test Class",
            "code": "Class9995",
            "capacity": 30
        }

        teacher_response = requests.post(url, json=test_data_teacher, headers=teacher_headers)
        if teacher_response.status_code == 403:
            print("   Teacher access: DENIED (correct)")
        else:
            print(f"   Teacher access: ALLOWED (unexpected): {teacher_response.status_code}")
    else:
        print("   Cannot login as teacher for permission test")

def main():
    """Main test function"""
    print("Testing Classroom Creation Functionality")
    print("=" * 50)

    # Test login
    print("\nTesting login...")
    token = login("admin@school.com", "password123")

    if not token:
        print("Cannot login, stopping tests")
        sys.exit(1)

    # Test getting classrooms
    classrooms_before = test_get_classrooms(token)

    # Test auto code generation
    next_code = test_auto_code_generation(token)

    # Test classroom creation
    created_classroom = test_classroom_creation(token)

    # Test getting classrooms after creation
    if created_classroom:
        classrooms_after = test_get_classrooms(token)
        if len(classrooms_after) > len(classrooms_before):
            print(f"\nClassroom count increased from {len(classrooms_before)} to {len(classrooms_after)}")

    # Test teacher/subject/campus assignment
    test_teacher_subject_assignment(token)

    # Test permissions
    test_permissions(token)

    # Test validation rules
    test_validation_rules(token)

    print(f"\nClassroom creation testing completed!")

if __name__ == "__main__":
    main()
