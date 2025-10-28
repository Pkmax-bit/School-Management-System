#!/usr/bin/env python3
"""
Simple test for schedule creation
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
    print("Testing simple schedule creation...")
    
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
        
        # Create schedule
        schedule_data = {
            "classroom_id": classroom["id"],
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "day_of_week": 1,
            "start_time": "08:00",
            "end_time": "09:00",
            "room": "A101"
        }
        
        print(f"Creating schedule with data: {schedule_data}")
        
        response = requests.post(f"{API_BASE_URL}/api/schedules/", json=schedule_data, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 200:
            print("Schedule created successfully!")
        else:
            print("Failed to create schedule")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
