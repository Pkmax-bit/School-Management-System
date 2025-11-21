from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None


class LessonCreate(LessonBase):
    classroom_id: UUID
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None


class LessonUpdate(LessonBase):
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None


class Lesson(LessonBase):
    id: UUID
    classroom_id: UUID
    file_url: str
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

