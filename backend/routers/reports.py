"""
Reports Router
Router cho báo cáo và phân tích nâng cao
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from supabase import Client
from pydantic import BaseModel

from database import get_db
from routers.auth import get_current_user_dev
from models.report import (
    ReportDefinitionCreate, ReportDefinitionUpdate, ReportDefinitionResponse,
    ReportExecutionCreate, ReportExecutionResponse,
    StudentPerformanceReport, ClassroomPerformanceReport,
    TeacherSummaryReport, FinanceSummaryReport, AttendanceStatisticsReport
)

router = APIRouter()

# ==================== REPORT DEFINITIONS ====================

@router.get("/definitions", response_model=List[ReportDefinitionResponse])
async def get_report_definitions(
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách các định nghĩa báo cáo"""
    try:
        query = supabase.table('report_definitions').select('*')
        
        if report_type:
            query = query.eq('report_type', report_type)
        
        result = query.order('created_at', desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching report definitions: {str(e)}"
        )

@router.post("/definitions", response_model=ReportDefinitionResponse)
async def create_report_definition(
    report_data: ReportDefinitionCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo định nghĩa báo cáo mới (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        now = datetime.now().isoformat()
        report_dict = {
            'name': report_data.name,
            'description': report_data.description,
            'report_type': report_data.report_type,
            'query_template': report_data.query_template,
            'parameters': report_data.parameters or {},
            'is_system_report': report_data.is_system_report,
            'created_by': current_user.id if hasattr(current_user, 'id') else None,
            'created_at': now,
            'updated_at': now
        }
        
        result = supabase.table('report_definitions').insert(report_dict).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report definition: {str(e)}"
        )

# ==================== STUDENT PERFORMANCE REPORT ====================

@router.get("/students/{student_id}/performance", response_model=StudentPerformanceReport)
async def get_student_performance_report(
    student_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Báo cáo học tập chi tiết của học sinh"""
    try:
        # Lấy thông tin học sinh
        student = supabase.table('students').select('*, users(name, email)').eq('id', student_id).execute()
        if not student.data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        student_data = student.data[0]
        student_name = student_data.get('users', {}).get('name', '') if isinstance(student_data.get('users'), dict) else ''
        
        # Lấy danh sách bài tập và điểm
        assignments_query = supabase.table('assignment_submissions').select('*, assignments(*)').eq('student_id', student_id)
        if start_date:
            assignments_query = assignments_query.gte('submitted_at', start_date)
        if end_date:
            assignments_query = assignments_query.lte('submitted_at', end_date)
        
        submissions = assignments_query.execute()
        submissions_data = submissions.data if submissions.data else []
        
        # Tính toán thống kê
        total_assignments = len(submissions_data)
        completed_assignments = len([s for s in submissions_data if s.get('is_graded', False)])
        scores = [float(s.get('score', 0)) for s in submissions_data if s.get('score') is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Lấy điểm danh
        attendances_query = supabase.table('attendances').select('*').eq('student_id', student_id)
        if start_date:
            attendances_query = attendances_query.gte('date', start_date)
        if end_date:
            attendances_query = attendances_query.lte('date', end_date)
        
        attendances = attendances_query.execute()
        attendances_data = attendances.data if attendances.data else []
        
        total_attendance = len(attendances_data)
        present_days = len([a for a in attendances_data if a.get('is_present', False)])
        absent_days = total_attendance - present_days
        attendance_rate = (present_days / total_attendance * 100) if total_attendance > 0 else 0
        
        # Lấy lớp học
        classroom_id = None
        classroom_name = None
        if student_data.get('classroom_id'):
            classroom = supabase.table('classrooms').select('id, name').eq('id', student_data['classroom_id']).execute()
            if classroom.data:
                classroom_id = classroom.data[0]['id']
                classroom_name = classroom.data[0]['name']
        
        # Điểm theo môn học (simplified)
        grades_by_subject = []
        
        return StudentPerformanceReport(
            student_id=student_id,
            student_name=student_name or student_data.get('student_code', ''),
            student_code=student_data.get('student_code', ''),
            classroom_id=classroom_id,
            classroom_name=classroom_name,
            total_assignments=total_assignments,
            completed_assignments=completed_assignments,
            average_score=round(average_score, 2),
            attendance_rate=round(attendance_rate, 2),
            total_attendance=total_attendance,
            present_days=present_days,
            absent_days=absent_days,
            grades_by_subject=grades_by_subject
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating student performance report: {str(e)}"
        )

# ==================== CLASSROOM PERFORMANCE REPORT ====================

@router.get("/classrooms/{classroom_id}/performance", response_model=ClassroomPerformanceReport)
async def get_classroom_performance_report(
    classroom_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Báo cáo học tập của lớp học"""
    try:
        # Lấy thông tin lớp học
        classroom = supabase.table('classrooms').select('*').eq('id', classroom_id).execute()
        if not classroom.data:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        classroom_data = classroom.data[0]
        
        # Lấy danh sách học sinh trong lớp
        students = supabase.table('students').select('id').eq('classroom_id', classroom_id).execute()
        student_ids = [s['id'] for s in (students.data if students.data else [])]
        
        if not student_ids:
            return ClassroomPerformanceReport(
                classroom_id=classroom_id,
                classroom_name=classroom_data.get('name', ''),
                classroom_code=classroom_data.get('code', ''),
                total_students=0,
                average_score=0,
                completion_rate=0,
                attendance_rate=0,
                top_students=[],
                struggling_students=[],
                grade_distribution={}
            )
        
        # Lấy điểm số của tất cả học sinh
        submissions = supabase.table('assignment_submissions').select('student_id, score, is_graded').in_('student_id', student_ids).execute()
        submissions_data = submissions.data if submissions.data else []
        
        # Tính toán thống kê
        scores = [float(s.get('score', 0)) for s in submissions_data if s.get('score') is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        graded_count = len([s for s in submissions_data if s.get('is_graded', False)])
        total_submissions = len(submissions_data)
        completion_rate = (graded_count / total_submissions * 100) if total_submissions > 0 else 0
        
        # Lấy điểm danh
        attendances = supabase.table('attendances').select('*').eq('classroom_id', classroom_id).execute()
        attendances_data = attendances.data if attendances.data else []
        
        total_attendance_records = len(attendances_data)
        present_records = len([a for a in attendances_data if a.get('is_present', False)])
        attendance_rate = (present_records / total_attendance_records * 100) if total_attendance_records > 0 else 0
        
        # Top students và struggling students (simplified)
        top_students = []
        struggling_students = []
        
        # Grade distribution (simplified)
        grade_distribution = {
            'A': 0,
            'B': 0,
            'C': 0,
            'D': 0,
            'F': 0
        }
        
        return ClassroomPerformanceReport(
            classroom_id=classroom_id,
            classroom_name=classroom_data.get('name', ''),
            classroom_code=classroom_data.get('code', ''),
            total_students=len(student_ids),
            average_score=round(average_score, 2),
            completion_rate=round(completion_rate, 2),
            attendance_rate=round(attendance_rate, 2),
            top_students=top_students,
            struggling_students=struggling_students,
            grade_distribution=grade_distribution
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating classroom performance report: {str(e)}"
        )

# ==================== TEACHER SUMMARY REPORT ====================

@router.get("/teachers/{teacher_id}/summary", response_model=TeacherSummaryReport)
async def get_teacher_summary_report(
    teacher_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Báo cáo tổng hợp giáo viên"""
    try:
        # Lấy thông tin giáo viên
        teacher = supabase.table('teachers').select('*, users(name)').eq('id', teacher_id).execute()
        if not teacher.data:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        teacher_data = teacher.data[0]
        teacher_name = teacher_data.get('users', {}).get('name', '') if isinstance(teacher_data.get('users'), dict) else ''
        
        # Lấy lớp học của giáo viên
        classrooms = supabase.table('classrooms').select('id').eq('teacher_id', teacher_id).execute()
        classroom_ids = [c['id'] for c in (classrooms.data if classrooms.data else [])]
        
        # Lấy học sinh
        students = supabase.table('students').select('id').in_('classroom_id', classroom_ids).execute()
        student_ids = [s['id'] for s in (students.data if students.data else [])]
        
        # Lấy bài tập
        assignments = supabase.table('assignments').select('id').eq('teacher_id', teacher_id).execute()
        assignment_ids = [a['id'] for a in (assignments.data if assignments.data else [])]
        
        # Tính toán completion rate
        submissions = supabase.table('assignment_submissions').select('is_graded').in_('assignment_id', assignment_ids).execute()
        submissions_data = submissions.data if submissions.data else []
        graded_count = len([s for s in submissions_data if s.get('is_graded', False)])
        completion_rate = (graded_count / len(submissions_data) * 100) if submissions_data else 0
        
        # Tính average score
        scores = [float(s.get('score', 0)) for s in submissions_data if s.get('score') is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        return TeacherSummaryReport(
            teacher_id=teacher_id,
            teacher_name=teacher_name or teacher_data.get('teacher_code', ''),
            total_classrooms=len(classroom_ids),
            total_students=len(student_ids),
            total_assignments=len(assignment_ids),
            average_completion_rate=round(completion_rate, 2),
            average_student_score=round(average_score, 2)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating teacher summary report: {str(e)}"
        )

# ==================== FINANCE SUMMARY REPORT ====================

@router.get("/finance/summary", response_model=FinanceSummaryReport)
async def get_finance_summary_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Báo cáo tài chính tổng hợp"""
    try:
        # Mặc định là tháng hiện tại
        if not start_date:
            start_date = datetime.now().replace(day=1).isoformat()
        if not end_date:
            end_date = datetime.now().isoformat()
        
        # Lấy thu nhập
        income_query = supabase.table('finances').select('amount, category, classroom_id').eq('finance_type', 'income')
        if start_date:
            income_query = income_query.gte('date', start_date)
        if end_date:
            income_query = income_query.lte('date', end_date)
        
        incomes = income_query.execute()
        income_data = incomes.data if incomes.data else []
        
        # Lấy chi phí
        expense_query = supabase.table('finances').select('amount, category').eq('finance_type', 'expense')
        if start_date:
            expense_query = expense_query.gte('date', start_date)
        if end_date:
            expense_query = expense_query.lte('date', end_date)
        
        expenses = expense_query.execute()
        expense_data = expenses.data if expenses.data else []
        
        # Tính toán
        total_income = sum(float(i.get('amount', 0)) for i in income_data)
        total_expense = sum(float(e.get('amount', 0)) for e in expense_data)
        net_profit = total_income - total_expense
        
        # Income by category
        income_by_category = {}
        for income in income_data:
            category = income.get('category', 'other')
            amount = float(income.get('amount', 0))
            income_by_category[category] = income_by_category.get(category, 0) + amount
        
        # Expense by category
        expense_by_category = {}
        for expense in expense_data:
            category = expense.get('category', 'other')
            amount = float(expense.get('amount', 0))
            expense_by_category[category] = expense_by_category.get(category, 0) + amount
        
        # Revenue by classroom
        revenue_by_classroom = {}
        for income in income_data:
            classroom_id = income.get('classroom_id')
            if classroom_id:
                amount = float(income.get('amount', 0))
                revenue_by_classroom[classroom_id] = revenue_by_classroom.get(classroom_id, 0) + amount
        
        return FinanceSummaryReport(
            period_start=start_date,
            period_end=end_date,
            total_income=round(total_income, 2),
            total_expense=round(total_expense, 2),
            net_profit=round(net_profit, 2),
            income_by_category=income_by_category,
            expense_by_category=expense_by_category,
            revenue_by_classroom=revenue_by_classroom
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating finance summary report: {str(e)}"
        )

# ==================== ATTENDANCE STATISTICS REPORT ====================

@router.get("/attendance/statistics", response_model=AttendanceStatisticsReport)
async def get_attendance_statistics_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Thống kê điểm danh"""
    try:
        # Mặc định là tháng hiện tại
        if not start_date:
            start_date = datetime.now().replace(day=1).date().isoformat()
        if not end_date:
            end_date = datetime.now().date().isoformat()
        
        # Lấy tất cả điểm danh trong khoảng thời gian
        attendances_query = supabase.table('attendances').select('*, classrooms(id, name)')
        if start_date:
            attendances_query = attendances_query.gte('date', start_date)
        if end_date:
            attendances_query = attendances_query.lte('date', end_date)
        
        attendances = attendances_query.execute()
        attendances_data = attendances.data if attendances.data else []
        
        # Tính toán
        student_ids = set(a.get('student_id') for a in attendances_data if a.get('student_id'))
        total_students = len(student_ids)
        
        total_records = len(attendances_data)
        present_records = len([a for a in attendances_data if a.get('is_present', False)])
        average_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0
        
        # Attendance by classroom
        attendance_by_classroom = {}
        for attendance in attendances_data:
            classroom_id = attendance.get('classroom_id')
            if classroom_id:
                if classroom_id not in attendance_by_classroom:
                    attendance_by_classroom[classroom_id] = {'total': 0, 'present': 0}
                attendance_by_classroom[classroom_id]['total'] += 1
                if attendance.get('is_present', False):
                    attendance_by_classroom[classroom_id]['present'] += 1
        
        # Convert to percentage
        attendance_by_classroom_percent = {}
        for classroom_id, stats in attendance_by_classroom.items():
            rate = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
            attendance_by_classroom_percent[classroom_id] = round(rate, 2)
        
        # Students with low attendance (simplified)
        students_with_low_attendance = []
        
        return AttendanceStatisticsReport(
            period_start=start_date,
            period_end=end_date,
            total_students=total_students,
            average_attendance_rate=round(average_attendance_rate, 2),
            attendance_by_classroom=attendance_by_classroom_percent,
            students_with_low_attendance=students_with_low_attendance
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating attendance statistics report: {str(e)}"
        )

