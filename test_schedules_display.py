#!/usr/bin/env python3
"""
Test script to check schedules API data structure
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
    print("Testing schedules API data structure...")
    
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get schedules
        response = requests.get(f"{API_BASE_URL}/api/schedules?limit=5", headers=headers)
        if response.status_code == 200:
            schedules = response.json()
            print(f"Found {len(schedules)} schedules")
            
            for i, schedule in enumerate(schedules):
                print(f"\nSchedule {i+1}:")
                print(f"  ID: {schedule.get('id', 'N/A')}")
                print(f"  Day: {schedule.get('day_of_week', 'N/A')}")
                print(f"  Time: {schedule.get('start_time', 'N/A')} - {schedule.get('end_time', 'N/A')}")
                print(f"  Room: {schedule.get('room', 'N/A')}")
                
                # Check classroom data
                classroom = schedule.get('classroom', {})
                print(f"  Classroom:")
                print(f"    ID: {classroom.get('id', 'N/A')}")
                print(f"    Name: {classroom.get('name', 'N/A')}")
                print(f"    Code: {classroom.get('code', 'N/A')}")
                
                # Check subject data
                subject = schedule.get('subject', {})
                print(f"  Subject:")
                print(f"    ID: {subject.get('id', 'N/A')}")
                print(f"    Name: {subject.get('name', 'N/A')}")
                print(f"    Code: {subject.get('code', 'N/A')}")
                
                # Check teacher data
                teacher = schedule.get('teacher', {})
                print(f"  Teacher:")
                print(f"    ID: {teacher.get('id', 'N/A')}")
                print(f"    Name: {teacher.get('name', 'N/A')}")
                print(f"    Email: {teacher.get('email', 'N/A')}")
                
                # Check campus data
                campus = schedule.get('campus', {})
                if campus:
                    print(f"  Campus:")
                    print(f"    ID: {campus.get('id', 'N/A')}")
                    print(f"    Name: {campus.get('name', 'N/A')}")
                    print(f"    Code: {campus.get('code', 'N/A')}")
                else:
                    print(f"  Campus: None")
                    
        else:
            print(f"Failed to get schedules: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
