#!/usr/bin/env python3
"""
Test script để kiểm tra 307 redirect fix
"""

import requests
import json

def test_307_fix():
    """Test 307 redirect fix"""
    base_url = "http://localhost:8000"
    
    # Test different URL formats
    urls_to_test = [
        f"{base_url}/api/subjects",
        f"{base_url}/api/subjects/",
        f"{base_url}/api/subjects",
    ]
    
    for url in urls_to_test:
        try:
            print(f"\nTesting URL: {url}")
            response = requests.get(url, allow_redirects=False)
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 307:
                print(f"Redirect Location: {response.headers.get('Location', 'Not specified')}")
            elif response.status_code == 200:
                print("✅ Success!")
            elif response.status_code == 401:
                print("🔒 Authentication required (expected)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to backend")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_307_fix()
