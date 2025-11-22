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
    available_at: Optional[datetime] = None
    assignment_id: Optional[UUID] = None


class LessonUpdate(LessonBase):
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None
    available_at: Optional[datetime] = None
    assignment_id: Optional[UUID] = None


class Lesson(LessonBase):
    id: UUID
    classroom_id: UUID
    file_url: str
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None
    available_at: Optional[datetime] = None
    assignment_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonProgressCreate(BaseModel):
    classroom_id: UUID


class LessonProgressResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    user_id: UUID
    classroom_id: UUID
    started_at: datetime
    last_accessed_at: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonFile(BaseModel):
    id: UUID
    lesson_id: UUID
    file_url: str
    file_name: str
    storage_path: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonFileCreate(BaseModel):
    file_url: str
    file_name: str
    storage_path: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    sort_order: Optional[int] = 0

