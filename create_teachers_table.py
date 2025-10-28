#!/usr/bin/env python3
"""
Create Teachers Table and Sample Data
Tạo bảng teachers và dữ liệu mẫu
"""

import requests
import json
from datetime import datetime

def create_teachers_table():
    """Tạo bảng teachers và sample data"""
    
    print("Creating Teachers Table and Sample Data")
    print("=" * 50)
    
    # SQL để tạo bảng teachers
    create_table_sql = """
    -- Teachers Table Schema
    CREATE TABLE IF NOT EXISTS public.teachers (
        id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
        name character varying(255) NOT NULL,
        email character varying(255) NOT NULL,
        phone character varying(20),
        subject character varying(100) NOT NULL,
        department character varying(100),
        hire_date timestamp with time zone,
        salary numeric(15,2),
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT teachers_pkey PRIMARY KEY (id),
        CONSTRAINT teachers_email_key UNIQUE (email)
    ) TABLESPACE pg_default;
    
    -- Tạo index cho email
    CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers USING btree (email) TABLESPACE pg_default;
    
    -- Tạo index cho subject
    CREATE INDEX IF NOT EXISTS idx_teachers_subject ON public.teachers USING btree (subject) TABLESPACE pg_default;
    
    -- Tạo index cho department
    CREATE INDEX IF NOT EXISTS idx_teachers_department ON public.teachers USING btree (department) TABLESPACE pg_default;
    
    -- Tạo trigger để cập nhật updated_at
    CREATE OR REPLACE FUNCTION update_teachers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_teachers_updated_at 
        BEFORE UPDATE ON public.teachers 
        FOR EACH ROW 
        EXECUTE FUNCTION update_teachers_updated_at();
    """
    
    print("📋 SQL Schema for Teachers Table:")
    print(create_table_sql)
    print("\n" + "=" * 50)
    
    # Sample data
    sample_teachers = [
        {
            "name": "Nguyễn Văn An",
            "email": "an.nguyen@school.edu",
            "phone": "0123456789",
            "subject": "Toán học",
            "department": "Khoa học Tự nhiên",
            "hire_date": "2023-01-15",
            "salary": 15000000
        },
        {
            "name": "Trần Thị Bình",
            "email": "binh.tran@school.edu",
            "phone": "0987654321",
            "subject": "Vật lý",
            "department": "Khoa học Tự nhiên",
            "hire_date": "2023-02-01",
            "salary": 16000000
        },
        {
            "name": "Lê Văn Cường",
            "email": "cuong.le@school.edu",
            "phone": "0369258147",
            "subject": "Hóa học",
            "department": "Khoa học Tự nhiên",
            "hire_date": "2023-03-10",
            "salary": 15500000
        },
        {
            "name": "Phạm Thị Dung",
            "email": "dung.pham@school.edu",
            "phone": "0912345678",
            "subject": "Văn học",
            "department": "Khoa học Xã hội",
            "hire_date": "2023-04-05",
            "salary": 14500000
        },
        {
            "name": "Hoàng Văn Em",
            "email": "em.hoang@school.edu",
            "phone": "0923456789",
            "subject": "Lịch sử",
            "department": "Khoa học Xã hội",
            "hire_date": "2023-05-20",
            "salary": 14000000
        },
        {
            "name": "Võ Thị Phương",
            "email": "phuong.vo@school.edu",
            "phone": "0934567890",
            "subject": "Tiếng Anh",
            "department": "Ngoại ngữ",
            "hire_date": "2023-06-10",
            "salary": 14800000
        },
        {
            "name": "Đặng Văn Quang",
            "email": "quang.dang@school.edu",
            "phone": "0945678901",
            "subject": "Sinh học",
            "department": "Khoa học Tự nhiên",
            "hire_date": "2023-07-15",
            "salary": 15200000
        },
        {
            "name": "Bùi Thị Hoa",
            "email": "hoa.bui@school.edu",
            "phone": "0956789012",
            "subject": "Địa lý",
            "department": "Khoa học Xã hội",
            "hire_date": "2023-08-01",
            "salary": 13800000
        }
    ]
    
    print("👥 Sample Teachers Data:")
    for i, teacher in enumerate(sample_teachers, 1):
        print(f"{i:2d}. {teacher['name']} - {teacher['subject']} - {teacher['department']}")
    
    print(f"\n📊 Total: {len(sample_teachers)} teachers")
    print("\n" + "=" * 50)
    
    # Test API endpoints
    print("🧪 Testing API Endpoints:")
    base_url = "http://localhost:8000"
    
    try:
        # Test health
        response = requests.get(f"{base_url}/")
        print(f"✅ Backend health: {response.status_code}")
        
        # Test teachers endpoints
        headers = {"Authorization": "Bearer mock-jwt-token-for-development"}
        
        # Test get teachers
        response = requests.get(f"{base_url}/api/teachers/", headers=headers)
        print(f"✅ GET /api/teachers/: {response.status_code}")
        
        # Test create sample teachers
        response = requests.post(f"{base_url}/api/teachers/create-sample", headers=headers, json={})
        print(f"✅ POST /api/teachers/create-sample: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"❌ API Test Error: {e}")
    
    print("\n" + "=" * 50)
    print("📝 Instructions:")
    print("1. Copy the SQL schema above")
    print("2. Run it in your Supabase SQL Editor")
    print("3. Or use the API endpoint /api/teachers/create-sample")
    print("4. Test the frontend at /teachers page")
    
    return sample_teachers

if __name__ == "__main__":
    create_teachers_table()

