#!/usr/bin/env python3
"""
Create Teachers Table - Simple Version
"""

import requests
import json

def create_teachers_simple():
    """Tạo bảng teachers và sample data"""
    
    print("Creating Teachers Table and Sample Data")
    print("=" * 50)
    
    # Sample data
    sample_teachers = [
        {
            "name": "Nguyen Van An",
            "email": "an.nguyen@school.edu",
            "phone": "0123456789",
            "subject": "Toan hoc",
            "department": "Khoa hoc Tu nhien",
            "hire_date": "2023-01-15",
            "salary": 15000000
        },
        {
            "name": "Tran Thi Binh",
            "email": "binh.tran@school.edu",
            "phone": "0987654321",
            "subject": "Vat ly",
            "department": "Khoa hoc Tu nhien",
            "hire_date": "2023-02-01",
            "salary": 16000000
        },
        {
            "name": "Le Van Cuong",
            "email": "cuong.le@school.edu",
            "phone": "0369258147",
            "subject": "Hoa hoc",
            "department": "Khoa hoc Tu nhien",
            "hire_date": "2023-03-10",
            "salary": 15500000
        },
        {
            "name": "Pham Thi Dung",
            "email": "dung.pham@school.edu",
            "phone": "0912345678",
            "subject": "Van hoc",
            "department": "Khoa hoc Xa hoi",
            "hire_date": "2023-04-05",
            "salary": 14500000
        },
        {
            "name": "Hoang Van Em",
            "email": "em.hoang@school.edu",
            "phone": "0923456789",
            "subject": "Lich su",
            "department": "Khoa hoc Xa hoi",
            "hire_date": "2023-05-20",
            "salary": 14000000
        }
    ]
    
    print("Sample Teachers Data:")
    for i, teacher in enumerate(sample_teachers, 1):
        print(f"{i:2d}. {teacher['name']} - {teacher['subject']} - {teacher['department']}")
    
    print(f"\nTotal: {len(sample_teachers)} teachers")
    print("\n" + "=" * 50)
    
    # Test API endpoints
    print("Testing API Endpoints:")
    base_url = "http://localhost:8000"
    
    try:
        # Test health
        response = requests.get(f"{base_url}/")
        print(f"Backend health: {response.status_code}")
        
        # Test teachers endpoints
        headers = {"Authorization": "Bearer mock-jwt-token-for-development"}
        
        # Test get teachers
        response = requests.get(f"{base_url}/api/teachers/", headers=headers)
        print(f"GET /api/teachers/: {response.status_code}")
        
        # Test create sample teachers
        response = requests.post(f"{base_url}/api/teachers/create-sample", headers=headers, json={})
        print(f"POST /api/teachers/create-sample: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"API Test Error: {e}")
    
    print("\n" + "=" * 50)
    print("Instructions:")
    print("1. Copy the SQL schema from teachers_schema.sql")
    print("2. Run it in your Supabase SQL Editor")
    print("3. Or use the API endpoint /api/teachers/create-sample")
    print("4. Test the frontend at /teachers page")
    
    return sample_teachers

if __name__ == "__main__":
    create_teachers_simple()

