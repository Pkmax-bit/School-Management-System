"""
Template Classroom Models
Model cho lớp học mẫu (template)
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TemplateClassroomBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[int] = None


class TemplateClassroomCreate(TemplateClassroomBase):
    pass


class TemplateClassroomUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[int] = None


class TemplateClassroomResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[int] = None
    is_template: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class CreateClassroomFromTemplate(BaseModel):
    """Dữ liệu để tạo lớp học mới từ template"""
    template_id: str
    name: str
    code: str
    description: Optional[str] = None
    teacher_id: Optional[str] = None
    subject_id: Optional[str] = None
    campus_id: Optional[str] = None
    capacity: Optional[int] = None
    tuition_per_session: Optional[float] = None
    sessions_per_week: Optional[int] = None
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    copy_lessons: bool = True  # Có copy bài học không
    copy_assignments: bool = True  # Có copy bài tập không
    student_ids: Optional[List[str]] = None  # Danh sách học sinh để gán vào lớp mới


class TemplateUsageResponse(BaseModel):
    """Lịch sử sử dụng template"""
    id: str
    template_id: str
    created_classroom_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

