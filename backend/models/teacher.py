"""
Teacher Pydantic Models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TeacherBase(BaseModel):
    user_id: str
    teacher_code: str
    phone: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[str] = None
    education_level: Optional[str] = None
    degree_name: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherCreateFromUser(BaseModel):
    name: str
    email: str
    password: Optional[str] = None  # Optional password, default to '123456' if not provided
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = "teacher"
    education_level: Optional[str] = None
    degree_name: Optional[str] = None

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[str] = None
    education_level: Optional[str] = None
    degree_name: Optional[str] = None

class Teacher(TeacherBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True