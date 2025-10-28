#!/usr/bin/env python3
"""
Script to check campus and classroom data
Kiem tra du lieu co so va lop hoc trong database
"""

import os
import sys
from supabase import create_client, Client

# Add backend to path
sys.path.append('backend')

def get_supabase_client():
    """Get Supabase client"""
    try:
        from backend.config import settings
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return None

def check_campuses(supabase):
    """Check campuses data"""
    print("CAMPUSES DATA")
    print("=" * 50)
    
    try:
        result = supabase.table("campuses").select("*").execute()
        campuses = result.data
        
        if not campuses:
            print("No campuses found in database")
            return []
        
        print(f"Found {len(campuses)} campuses:")
        for i, campus in enumerate(campuses, 1):
            print(f"  {i}. ID: {campus['id']}")
            print(f"     Name: {campus['name']}")
            print(f"     Code: {campus['code']}")
            print(f"     Address: {campus.get('address', 'N/A')}")
            print(f"     Phone: {campus.get('phone', 'N/A')}")
            print()
        
        return campuses
    except Exception as e:
        print(f"Error fetching campuses: {e}")
        return []

def check_classrooms(supabase):
    """Check classrooms data"""
    print("CLASSROOMS DATA")
    print("=" * 50)
    
    try:
        result = supabase.table("classrooms").select("""
            *,
            campuses(
                id,
                name,
                code
            )
        """).execute()
        classrooms = result.data
        
        if not classrooms:
            print("No classrooms found in database")
            return []
        
        print(f"Found {len(classrooms)} classrooms:")
        for i, classroom in enumerate(classrooms, 1):
            print(f"  {i}. ID: {classroom['id']}")
            print(f"     Name: {classroom['name']}")
            print(f"     Code: {classroom['code']}")
            print(f"     Campus ID: {classroom.get('campus_id', 'NULL')}")
            if classroom.get('campuses'):
                print(f"     Campus Name: {classroom['campuses']['name']} ({classroom['campuses']['code']})")
            else:
                print(f"     Campus Name: NOT ASSIGNED")
            print(f"     Teacher ID: {classroom.get('teacher_id', 'NULL')}")
            print(f"     Subject ID: {classroom.get('subject_id', 'NULL')}")
            print()
        
        return classrooms
    except Exception as e:
        print(f"Error fetching classrooms: {e}")
        return []

def check_classrooms_by_campus(supabase, campus_id):
    """Check classrooms for specific campus"""
    print(f"CLASSROOMS FOR CAMPUS {campus_id}")
    print("=" * 50)
    
    try:
        result = supabase.table("classrooms").select("""
            *,
            campuses(
                id,
                name,
                code
            )
        """).eq("campus_id", campus_id).execute()
        classrooms = result.data
        
        if not classrooms:
            print(f"No classrooms found for campus {campus_id}")
            return []
        
        print(f"Found {len(classrooms)} classrooms for this campus:")
        for i, classroom in enumerate(classrooms, 1):
            print(f"  {i}. {classroom['name']} ({classroom['code']})")
            print(f"     Teacher ID: {classroom.get('teacher_id', 'NULL')}")
            print(f"     Subject ID: {classroom.get('subject_id', 'NULL')}")
            print()
        
        return classrooms
    except Exception as e:
        print(f"Error fetching classrooms for campus: {e}")
        return []

def check_schedule_api():
    """Check schedule API endpoint"""
    print("SCHEDULE API CHECK")
    print("=" * 50)
    
    try:
        import requests
        response = requests.get("http://localhost:8000/api/classrooms?campus_id=test", timeout=5)
        print(f"API Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"API Response Data: {data}")
        else:
            print(f"API Error: {response.text}")
    except Exception as e:
        print(f"API Error: {e}")

def main():
    print("CHECKING CAMPUS AND CLASSROOM DATA")
    print("=" * 60)
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        print("Cannot connect to database")
        return
    
    # Check campuses
    campuses = check_campuses(supabase)
    
    # Check all classrooms
    classrooms = check_classrooms(supabase)
    
    # Check classrooms by campus if we have campuses
    if campuses:
        print("\n" + "=" * 60)
        for campus in campuses:
            check_classrooms_by_campus(supabase, campus['id'])
    
    # Check API
    print("\n" + "=" * 60)
    check_schedule_api()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Campuses: {len(campuses)}")
    print(f"Total Classrooms: {len(classrooms)}")
    
    # Count classrooms by campus
    campus_counts = {}
    for classroom in classrooms:
        campus_id = classroom.get('campus_id')
        if campus_id:
            campus_counts[campus_id] = campus_counts.get(campus_id, 0) + 1
        else:
            campus_counts['NULL'] = campus_counts.get('NULL', 0) + 1
    
    print("\nClassrooms by campus:")
    for campus_id, count in campus_counts.items():
        if campus_id == 'NULL':
            print(f"  Not assigned to any campus: {count}")
        else:
            campus_name = next((c['name'] for c in campuses if c['id'] == campus_id), 'Unknown')
            print(f"  {campus_name} ({campus_id}): {count}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopping...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
