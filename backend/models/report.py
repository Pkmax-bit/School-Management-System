"""
Report Models
Models cho báo cáo và phân tích
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReportDefinitionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: str  # student, classroom, teacher, finance, attendance
    query_template: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = {}
    is_system_report: bool = False

class ReportDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    query_template: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    is_system_report: Optional[bool] = None

class ReportDefinitionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    report_type: str
    query_template: Optional[str]
    parameters: Dict[str, Any]
    is_system_report: bool
    created_by: Optional[str]
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True

class ReportExecutionCreate(BaseModel):
    report_definition_id: str
    parameters: Optional[Dict[str, Any]] = {}

class ReportExecutionResponse(BaseModel):
    id: str
    report_definition_id: str
    executed_by: Optional[str]
    parameters: Dict[str, Any]
    result_data: Optional[Dict[str, Any]]
    file_url: Optional[str]
    status: str
    error_message: Optional[str]
    execution_time_ms: Optional[int]
    created_at: str
    completed_at: Optional[str]
    
    class Config:
        from_attributes = True

class StudentPerformanceReport(BaseModel):
    student_id: str
    student_name: str
    student_code: str
    classroom_id: Optional[str]
    classroom_name: Optional[str]
    total_assignments: int
    completed_assignments: int
    average_score: float
    attendance_rate: float
    total_attendance: int
    present_days: int
    absent_days: int
    grades_by_subject: List[Dict[str, Any]]

class ClassroomPerformanceReport(BaseModel):
    classroom_id: str
    classroom_name: str
    classroom_code: str
    total_students: int
    average_score: float
    completion_rate: float
    attendance_rate: float
    top_students: List[Dict[str, Any]]
    struggling_students: List[Dict[str, Any]]
    grade_distribution: Dict[str, int]

class TeacherSummaryReport(BaseModel):
    teacher_id: str
    teacher_name: str
    total_classrooms: int
    total_students: int
    total_assignments: int
    average_completion_rate: float
    average_student_score: float

class FinanceSummaryReport(BaseModel):
    period_start: str
    period_end: str
    total_income: float
    total_expense: float
    net_profit: float
    income_by_category: Dict[str, float]
    expense_by_category: Dict[str, float]
    revenue_by_classroom: Dict[str, float]

class AttendanceStatisticsReport(BaseModel):
    period_start: str
    period_end: str
    total_students: int
    average_attendance_rate: float
    attendance_by_classroom: Dict[str, float]
    students_with_low_attendance: List[Dict[str, Any]]

