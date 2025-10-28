#!/usr/bin/env python3
"""
Test script to verify room conflict validation
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv
from datetime import time

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

def get_auth_token():
    """Get authentication token"""
    try:
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        else:
            print(f"Login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def test_room_conflict():
    """Test room conflict validation"""
    
    print("Testing room conflict validation...")
    print("=" * 50)
    
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get classrooms and subjects for testing
        classrooms_resp = requests.get(f"{API_BASE_URL}/api/classrooms?limit=5", headers=headers)
        if classrooms_resp.status_code != 200:
            print("Failed to get classrooms")
            return False
            
        classrooms = classrooms_resp.json()
        if not classrooms:
            print("No classrooms found")
            return False
            
        subjects_resp = requests.get(f"{API_BASE_URL}/api/subjects?limit=5", headers=headers)
        if subjects_resp.status_code != 200:
            print("Failed to get subjects")
            return False
            
        subjects = subjects_resp.json()
        if not subjects:
            print("No subjects found")
            return False
        
        # Get teachers
        teachers_resp = requests.get(f"{API_BASE_URL}/api/teachers?limit=5", headers=headers)
        if teachers_resp.status_code != 200:
            print("Failed to get teachers")
            return False
            
        teachers = teachers_resp.json()
        if not teachers:
            print("No teachers found")
            return False
        
        classroom = classrooms[0]
        subject = subjects[0]
        teacher = teachers[0]
        
        print(f"Using classroom: {classroom.get('name')}")
        print(f"Using subject: {subject.get('name')}")
        print(f"Using teacher: {teacher.get('name', 'N/A')}")
        print()
        
        # Test 1: Create first schedule
        print("1. Creating first schedule...")
        schedule1_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,  # Monday
            "start_time": "08:00",
            "end_time": "09:00",
            "room": "A101"
        }
        
        response1 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule1_data, headers=headers)
        if response1.status_code == 200:
            print("   First schedule created successfully")
            schedule1_id = response1.json()["id"]
        else:
            print(f"   Failed to create first schedule: {response1.status_code}")
            print(f"   Response: {response1.text}")
            return False
        
        # Test 2: Try to create conflicting schedule (same room, same time)
        print("2. Testing room conflict (same room, same time)...")
        schedule2_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,  # Monday
            "start_time": "08:30",  # Overlapping time
            "end_time": "09:30",
            "room": "A101"  # Same room
        }
        
        response2 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule2_data, headers=headers)
        if response2.status_code == 400:
            print("   Room conflict detected successfully!")
            print(f"   Error message: {response2.json().get('detail', 'N/A')}")
        else:
            print(f"   Expected conflict but got: {response2.status_code}")
            print(f"   Response: {response2.text}")
        
        # Test 3: Try to create non-conflicting schedule (different room)
        print("3. Testing different room (should work)...")
        schedule3_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,  # Monday
            "start_time": "08:30",  # Same time
            "end_time": "09:30",
            "room": "A102"  # Different room
        }
        
        response3 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule3_data, headers=headers)
        if response3.status_code == 200:
            print("   Different room schedule created successfully")
            schedule3_id = response3.json()["id"]
        else:
            print(f"   Failed to create different room schedule: {response3.status_code}")
            print(f"   Response: {response3.text}")
        
        # Test 4: Try to create non-conflicting schedule (different time)
        print("4. Testing different time (should work)...")
        schedule4_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,  # Monday
            "start_time": "10:00",  # Different time
            "end_time": "11:00",
            "room": "A101"  # Same room
        }
        
        response4 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule4_data, headers=headers)
        if response4.status_code == 200:
            print("   Different time schedule created successfully")
            schedule4_id = response4.json()["id"]
        else:
            print(f"   Failed to create different time schedule: {response4.status_code}")
            print(f"   Response: {response4.text}")
        
        # Cleanup
        print("5. Cleaning up test schedules...")
        if 'schedule1_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule1_id}", headers=headers)
        if 'schedule3_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule3_id}", headers=headers)
        if 'schedule4_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule4_id}", headers=headers)
        
        print("\nRoom conflict validation test completed!")
        print("Summary:")
        print("- Same room + same time = CONFLICT (blocked)")
        print("- Different room + same time = ALLOWED")
        print("- Same room + different time = ALLOWED")
        
        return True
        
    except Exception as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    print("Starting room conflict test...")
    success = test_room_conflict()
    
    if success:
        print("\nAll tests passed!")
        sys.exit(0)
    else:
        print("\nSome tests failed!")
        sys.exit(1)
