from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None


class LessonCreate(LessonBase):
    classroom_id: UUID


class LessonUpdate(LessonBase):
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_path: Optional[str] = None


class Lesson(LessonBase):
    id: UUID
    classroom_id: UUID
    file_url: str
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

