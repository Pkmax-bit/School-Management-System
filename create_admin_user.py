#!/usr/bin/env python3
"""
Create admin user
Tạo user admin
"""

import requests
import json

def create_admin_user():
    base_url = "http://localhost:8000"
    
    # Register admin user
    user_data = {
        "email": "admin@example.com",
        "password": "admin123",
        "full_name": "Administrator",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=user_data)
        print(f"Register response: {response.status_code}")
        if response.status_code == 200:
            print("Admin user created successfully!")
            print(response.json())
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Register error: {e}")

if __name__ == "__main__":
    create_admin_user()
