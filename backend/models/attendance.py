"""
Attendance Model
Model cho điểm danh
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class AttendanceBase(BaseModel):
    student_id: str
    classroom_id: str
    date: date
    status: str  # "present", "absent", "late"
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class Attendance(AttendanceBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True