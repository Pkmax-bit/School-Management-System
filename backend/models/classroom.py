"""
Classroom Model
Model cho lớp học
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClassroomBase(BaseModel):
    name: str
    grade: str
    teacher_id: str
    description: Optional[str] = None

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    teacher_id: Optional[str] = None
    description: Optional[str] = None

class Classroom(ClassroomBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True