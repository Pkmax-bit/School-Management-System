#!/usr/bin/env python3
"""
Test final fix for 307 redirect
"""

import requests
import json

def test_final_fix():
    """Test final fix"""
    base_url = "http://localhost:8000"
    
    # Test with trailing slash
    url = f"{base_url}/api/subjects/"
    
    try:
        print(f"Testing URL: {url}")
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: API working!")
        elif response.status_code == 401:
            print("AUTHENTICATION: Expected - need auth token")
        elif response.status_code == 403:
            print("FORBIDDEN: Expected - need auth token")
        else:
            print(f"UNEXPECTED: Status {response.status_code}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_final_fix()
