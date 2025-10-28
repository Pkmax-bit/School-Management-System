"""
Schedule Model
Model cho thời khóa biểu
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, time

class ScheduleBase(BaseModel):
    classroom_id: str
    subject_id: str
    teacher_id: str
    day_of_week: int  # 0-6 (Monday-Sunday)
    start_time: time
    end_time: time
    room: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    classroom_id: Optional[str] = None
    subject_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None

class Schedule(ScheduleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True