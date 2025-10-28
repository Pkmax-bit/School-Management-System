#!/usr/bin/env python3
"""
Assign campus to classroom for testing
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
    print("Assigning campus to classroom...")
    
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
        if response.status_code != 200:
            print(f"Failed to get classrooms: {response.status_code}")
            return
            
        classrooms = response.json()
        print(f"Found {len(classrooms)} classrooms")
        
        # Get campuses
        response = requests.get(f"{API_BASE_URL}/api/campuses?limit=5", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get campuses: {response.status_code}")
            return
            
        campuses = response.json()
        if not campuses:
            print("No campuses found")
            return
            
        campus = campuses[0]
        print(f"Using campus: {campus.get('name')} ({campus.get('id')})")
        
        # Assign campus to first classroom
        classroom = classrooms[0]
        print(f"Updating classroom: {classroom.get('name')}")
        
        update_data = {
            "campus_id": campus["id"]
        }
        
        response = requests.put(
            f"{API_BASE_URL}/api/classrooms/{classroom['id']}",
            json=update_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print("Campus assigned successfully!")
        else:
            print(f"Failed to assign campus: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
