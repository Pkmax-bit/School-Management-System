"""
Student Pydantic Models
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Any
from datetime import datetime, date

class StudentBase(BaseModel):
    user_id: str
    student_code: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    classroom_id: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentCreateFromUser(BaseModel):
    name: str
    email: str
    password: Optional[str] = None  # Optional password, default to '123456' if not provided
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = "student"
    date_of_birth: Optional[Any] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    classroom_id: Optional[str] = None
    
    @field_validator('date_of_birth', mode='before')
    @classmethod
    def validate_date_of_birth(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            return v
        if isinstance(v, date):
            return v.isoformat()
        return str(v)

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    classroom_id: Optional[str] = None

class Student(StudentBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    id: str
    user_id: str
    student_code: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    classroom_id: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    # User info (from users table)
    name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True