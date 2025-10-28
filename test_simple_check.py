#!/usr/bin/env python3
"""
Simple test to check classroom data structure
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
    print("Testing classroom data structure...")
    
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get classrooms
        response = requests.get(f"{API_BASE_URL}/api/classrooms?limit=5", headers=headers)
        if response.status_code == 200:
            classrooms = response.json()
            print(f"Found {len(classrooms)} classrooms")
            
            for i, classroom in enumerate(classrooms):
                print(f"Classroom {i+1}:")
                print(f"  Name: {classroom.get('name', 'N/A')}")
                print(f"  Code: {classroom.get('code', 'N/A')}")
                print(f"  Subject ID: {classroom.get('subject_id', 'NULL')}")
                print(f"  Teacher ID: {classroom.get('teacher_id', 'NULL')}")
                print(f"  Campus ID: {classroom.get('campus_id', 'NULL')}")
                print()
        else:
            print(f"Failed to get classrooms: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
