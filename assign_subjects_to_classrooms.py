#!/usr/bin/env python3
"""
Script to assign subjects to classrooms that don't have subjects
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
    print("Assigning subjects to classrooms...")
    
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Get classrooms without subjects
        response = requests.get(f"{API_BASE_URL}/api/classrooms?limit=100", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get classrooms: {response.status_code}")
            return
            
        classrooms = response.json()
        classrooms_without_subjects = [c for c in classrooms if not c.get('subject_id')]
        
        print(f"Found {len(classrooms_without_subjects)} classrooms without subjects")
        
        if not classrooms_without_subjects:
            print("All classrooms already have subjects assigned!")
            return
        
        # Get subjects
        response = requests.get(f"{API_BASE_URL}/api/subjects?limit=100", headers=headers)
        if response.status_code != 200:
            print(f"Failed to get subjects: {response.status_code}")
            return
            
        subjects = response.json()
        if not subjects:
            print("No subjects found!")
            return
            
        print(f"Found {len(subjects)} subjects")
        
        # Assign first subject to classrooms without subjects
        first_subject_id = subjects[0]['id']
        first_subject_name = subjects[0]['name']
        
        print(f"Assigning subject '{first_subject_name}' to classrooms...")
        
        updated_count = 0
        for classroom in classrooms_without_subjects:
            classroom_id = classroom['id']
            classroom_name = classroom['name']
            
            # Update classroom with subject
            update_data = {
                "subject_id": first_subject_id
            }
            
            response = requests.put(
                f"{API_BASE_URL}/api/classrooms/{classroom_id}",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"  Updated: {classroom_name}")
                updated_count += 1
            else:
                print(f"  Failed to update {classroom_name}: {response.status_code}")
        
        print(f"\nSuccessfully updated {updated_count} classrooms")
        print("Now auto-fill subject should work in schedule creation!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
