#!/usr/bin/env python3
"""
Test script to verify auto-fill subject functionality with authentication
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

def get_auth_token():
    """Get authentication token"""
    try:
        # Try to get token from existing admin user
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def test_auto_fill_subject():
    """Test that classrooms return subject_id for auto-fill functionality"""
    
    print("Testing auto-fill subject functionality...")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("Failed to get authentication token")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test 1: Get classrooms with subject_id
        print("1. Testing classrooms API with subject_id...")
        response = requests.get(f"{API_BASE_URL}/api/classrooms?limit=10", headers=headers)
        
        if response.status_code == 200:
            classrooms = response.json()
            print(f"   Found {len(classrooms)} classrooms")
            
            # Check if classrooms have subject_id
            for i, classroom in enumerate(classrooms[:3]):  # Check first 3
                print(f"   Classroom {i+1}: {classroom.get('name', 'N/A')}")
                print(f"   - Code: {classroom.get('code', 'N/A')}")
                print(f"   - Subject ID: {classroom.get('subject_id', 'NULL')}")
                print(f"   - Teacher ID: {classroom.get('teacher_id', 'NULL')}")
                print(f"   - Campus ID: {classroom.get('campus_id', 'NULL')}")
                print()
        else:
            print(f"   Failed to get classrooms: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
        # Test 2: Get subjects to verify mapping
        print("2. Testing subjects API...")
        response = requests.get(f"{API_BASE_URL}/api/subjects?limit=10", headers=headers)
        
        if response.status_code == 200:
            subjects = response.json()
            print(f"   Found {len(subjects)} subjects")
            
            for i, subject in enumerate(subjects[:3]):  # Check first 3
                print(f"   Subject {i+1}: {subject.get('name', 'N/A')} ({subject.get('code', 'N/A')})")
        else:
            print(f"   Failed to get subjects: {response.status_code}")
            return False
            
        # Test 3: Check if we have classrooms with subjects
        print("3. Checking classrooms with subjects...")
        classrooms_with_subjects = [c for c in classrooms if c.get('subject_id')]
        print(f"   Found {len(classrooms_with_subjects)} classrooms with subjects")
        
        if classrooms_with_subjects:
            print("   Sample classroom with subject:")
            sample = classrooms_with_subjects[0]
            print(f"   - Name: {sample.get('name')}")
            print(f"   - Subject ID: {sample.get('subject_id')}")
            
            # Find the subject name
            subject_id = sample.get('subject_id')
            subject = next((s for s in subjects if s.get('id') == subject_id), None)
            if subject:
                print(f"   - Subject Name: {subject.get('name')} ({subject.get('code')})")
            else:
                print(f"   - Subject Name: Not found in subjects list")
        else:
            print("   No classrooms with subjects found")
            print("   This means auto-fill won't work until classrooms are assigned subjects")
        
        print("\nAuto-fill subject functionality test completed!")
        print("   When creating a schedule:")
        print("   1. Select a campus")
        print("   2. Select a classroom")
        print("   3. Subject should auto-fill from classroom.subject_id")
        print("   4. Teacher should auto-fill from classroom.teacher_id")
        
        return True
        
    except Exception as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    print("Starting auto-fill subject test...")
    success = test_auto_fill_subject()
    
    if success:
        print("\nAll tests passed!")
        sys.exit(0)
    else:
        print("\nSome tests failed!")
        sys.exit(1)
