#!/usr/bin/env python3
"""
Test script for Teachers API
Tests the real API endpoints for teachers CRUD operations
"""

import requests
import json
import time

# API Configuration
API_BASE_URL = "http://localhost:8000"
API_URL = f"{API_BASE_URL}/api/teachers/"

# Test data
test_teacher_data = {
    "name": "Nguyễn Văn Test",
    "email": "test@example.com",
    "phone": "0901234567",
    "address": "123 Test Street, District 1, HCMC",
    "role": "teacher"
}

def test_api_connection():
    """Test if API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API is running")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ API is not running - please start the backend server")
        return False
    except Exception as e:
        print(f"❌ Error connecting to API: {e}")
        return False

def test_create_teacher():
    """Test creating a teacher"""
    print("\n📝 Testing CREATE teacher...")
    
    try:
        response = requests.post(API_URL, json=test_teacher_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Teacher created successfully!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ Failed to create teacher")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating teacher: {e}")
        return None

def test_get_teachers():
    """Test getting all teachers"""
    print("\n📖 Testing GET teachers...")
    
    try:
        response = requests.get(API_URL, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Teachers retrieved successfully!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ Failed to get teachers")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting teachers: {e}")
        return None

def test_update_teacher(teacher_id):
    """Test updating a teacher"""
    print(f"\n✏️ Testing UPDATE teacher {teacher_id}...")
    
    update_data = {
        "name": "Nguyễn Văn Test (Updated)",
        "phone": "0909876543"
    }
    
    try:
        response = requests.put(f"{API_URL}{teacher_id}", json=update_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Teacher updated successfully!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ Failed to update teacher")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error updating teacher: {e}")
        return None

def test_delete_teacher(teacher_id):
    """Test deleting a teacher"""
    print(f"\n🗑️ Testing DELETE teacher {teacher_id}...")
    
    try:
        response = requests.delete(f"{API_URL}{teacher_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Teacher deleted successfully!")
            return True
        else:
            print(f"❌ Failed to delete teacher")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error deleting teacher: {e}")
        return False

def run_all_tests():
    """Run all API tests"""
    print("🧪 Testing Teachers API...")
    print("=" * 50)
    
    # Test API connection
    if not test_api_connection():
        print("\n❌ Cannot proceed - API is not running")
        return
    
    # Wait a moment for API to be ready
    print("\n⏳ Waiting for API to be ready...")
    time.sleep(2)
    
    # Test CREATE
    created_teacher = test_create_teacher()
    if not created_teacher:
        print("\n❌ CREATE test failed - stopping tests")
        return
    
    teacher_id = created_teacher.get('id')
    if not teacher_id:
        print("\n❌ No teacher ID returned - stopping tests")
        return
    
    # Test GET
    test_get_teachers()
    
    # Test UPDATE
    test_update_teacher(teacher_id)
    
    # Test DELETE
    test_delete_teacher(teacher_id)
    
    # Final GET to verify deletion
    print("\n📋 Final teachers list:")
    test_get_teachers()
    
    print("\n🎉 All API tests completed!")

if __name__ == "__main__":
    run_all_tests()