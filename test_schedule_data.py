#!/usr/bin/env python3
"""
Test script to check schedule data and display complete information
"""

import sys
import os
sys.path.append('backend')

from backend.supabase_client import get_supabase_client

def test_schedules():
    """Test and display complete schedule data"""
    try:
        supabase = get_supabase_client()
        
        # Get all schedules with related data
        result = supabase.table('schedules').select('''
            *,
            classrooms!inner(
                id,
                name,
                code,
                campus_id,
                campuses(
                    id,
                    name,
                    code
                )
            ),
            subjects!inner(
                id,
                name,
                code
            ),
            teachers!inner(
                id,
                users!inner(
                    full_name,
                    email
                )
            )
        ''').execute()
        
        print(f"=== SCHEDULE DATA ANALYSIS ===")
        print(f"Total schedules found: {len(result.data)}")
        print()
        
        if not result.data:
            print("No schedule data found in database.")
            return
        
        # Group by day of week
        days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
        
        for day_index in range(7):
            day_schedules = [s for s in result.data if s['day_of_week'] == day_index]
            if day_schedules:
                print(f"=== {days[day_index]} ===")
                for schedule in day_schedules:
                    print(f"ID: {schedule['id']}")
                    print(f"  Lớp học: {schedule['classrooms']['name'] if schedule['classrooms'] else 'N/A'}")
                    print(f"  Mã lớp: {schedule['classrooms']['code'] if schedule['classrooms'] else 'N/A'}")
                    print(f"  Môn học: {schedule['subjects']['name'] if schedule['subjects'] else 'N/A'}")
                    print(f"  Mã môn: {schedule['subjects']['code'] if schedule['subjects'] else 'N/A'}")
                    print(f"  Giáo viên: {schedule['teachers']['users']['full_name'] if schedule['teachers'] and schedule['teachers']['users'] else 'N/A'}")
                    print(f"  Email GV: {schedule['teachers']['users']['email'] if schedule['teachers'] and schedule['teachers']['users'] else 'N/A'}")
                    print(f"  Thời gian: {schedule['start_time']} - {schedule['end_time']}")
                    print(f"  Phòng học: {schedule['room'] or 'N/A'}")
                    print(f"  Cơ sở: {schedule['classrooms']['campuses']['name'] if schedule['classrooms'] and schedule['classrooms']['campuses'] else 'N/A'}")
                    print(f"  Mã cơ sở: {schedule['classrooms']['campuses']['code'] if schedule['classrooms'] and schedule['classrooms']['campuses'] else 'N/A'}")
                    print(f"  Ngày tạo: {schedule['created_at']}")
                    print("  ---")
                print()
        
        # Check for missing data
        print("=== DATA COMPLETENESS CHECK ===")
        missing_classroom = sum(1 for s in result.data if not s['classrooms'])
        missing_subject = sum(1 for s in result.data if not s['subjects'])
        missing_teacher = sum(1 for s in result.data if not s['teachers'] or not s['teachers']['users'])
        missing_campus = sum(1 for s in result.data if not s['classrooms'] or not s['classrooms']['campuses'])
        
        print(f"Schedules missing classroom data: {missing_classroom}")
        print(f"Schedules missing subject data: {missing_subject}")
        print(f"Schedules missing teacher data: {missing_teacher}")
        print(f"Schedules missing campus data: {missing_campus}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_schedules()
