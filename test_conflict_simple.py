#!/usr/bin/env python3
"""
Test room conflict with simple approach
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

def main():
    print("Testing room conflict...")
    
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get first classroom
        response = requests.get(f"{API_BASE_URL}/api/classrooms?limit=1", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get classrooms: {response.status_code}")
            return
            
        classrooms = response.json()
        if not classrooms:
            print("No classrooms found")
            return
            
        classroom = classrooms[0]
        print(f"Using classroom: {classroom.get('name')}")
        
        # Get first subject
        response = requests.get(f"{API_BASE_URL}/api/subjects?limit=1", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get subjects: {response.status_code}")
            return
            
        subjects = response.json()
        if not subjects:
            print("No subjects found")
            return
            
        subject = subjects[0]
        print(f"Using subject: {subject.get('name')}")
        
        # Get first teacher
        response = requests.get(f"{API_BASE_URL}/api/teachers?limit=1", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get teachers: {response.status_code}")
            return
            
        teachers = response.json()
        if not teachers:
            print("No teachers found")
            return
            
        teacher = teachers[0]
        print(f"Using teacher: {teacher.get('name', 'N/A')}")
        
        # Test 1: Create first schedule
        print("\n1. Creating first schedule...")
        schedule1_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,
            "start_time": "08:00",
            "end_time": "09:00",
            "room": "A101"
        }
        
        response1 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule1_data, headers=headers)
        print(f"   Status: {response1.status_code}")
        if response1.status_code == 200:
            print("   First schedule created successfully")
            schedule1_id = response1.json()["id"]
        else:
            print(f"   Failed: {response1.text}")
            return
        
        # Test 2: Try to create conflicting schedule
        print("\n2. Testing room conflict (same room, overlapping time)...")
        schedule2_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,
            "start_time": "08:30",  # Overlapping time
            "end_time": "09:30",
            "room": "A101"  # Same room
        }
        
        response2 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule2_data, headers=headers)
        print(f"   Status: {response2.status_code}")
        if response2.status_code == 400:
            print("   Room conflict detected successfully!")
            print(f"   Error: {response2.json().get('detail', 'N/A')}")
        elif response2.status_code == 200:
            print("   WARNING: Conflict not detected - this should not happen!")
            schedule2_id = response2.json()["id"]
        else:
            print(f"   Unexpected status: {response2.text}")
        
        # Test 3: Try different room (should work)
        print("\n3. Testing different room (should work)...")
        schedule3_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,
            "start_time": "08:30",  # Same overlapping time
            "end_time": "09:30",
            "room": "A102"  # Different room
        }
        
        response3 = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule3_data, headers=headers)
        print(f"   Status: {response3.status_code}")
        if response3.status_code == 200:
            print("   Different room schedule created successfully")
            schedule3_id = response3.json()["id"]
        else:
            print(f"   Failed: {response3.text}")
        
        # Cleanup
        print("\n4. Cleaning up...")
        if 'schedule1_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule1_id}", headers=headers)
            print("   Deleted schedule 1")
        if 'schedule2_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule2_id}", headers=headers)
            print("   Deleted schedule 2")
        if 'schedule3_id' in locals():
            requests.delete(f"{API_BASE_URL}/api/schedules/{schedule3_id}", headers=headers)
            print("   Deleted schedule 3")
        
        print("\nTest completed!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
