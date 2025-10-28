#!/usr/bin/env python3
"""
Test script for GET teachers API
"""

import requests
import json

# API Configuration
API_BASE_URL = "http://localhost:8000"
API_URL = f"{API_BASE_URL}/api/teachers/"

def test_get_teachers():
    print("Testing GET teachers...")
    
    try:
        response = requests.get(API_URL, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Teachers retrieved successfully!")
            print(f"Number of teachers: {len(data)}")
            
            if data:
                print("\nFirst teacher:")
                print(json.dumps(data[0], indent=2))
            else:
                print("No teachers found")
                
            return data
        else:
            print(f"Failed to get teachers")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error getting teachers: {e}")
        return None

if __name__ == "__main__":
    test_get_teachers()

