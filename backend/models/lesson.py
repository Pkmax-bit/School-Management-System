"""
Lesson Models
Model cho bài học
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class LessonBase(BaseModel):
    classroom_id: str
    title: str
    description: Optional[str] = None
    file_urls: Optional[List[str]] = None
    file_names: Optional[List[str]] = None
    storage_paths: Optional[List[str]] = None
    sort_order: int = 0
    shared_classroom_ids: List[str] = []
    available_at: Optional[datetime] = None
    youtube_urls: List[dict] = []

    # Keep backward compatibility
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_path: Optional[str] = None

    @field_validator('shared_classroom_ids', mode='before')
    @classmethod
    def validate_shared_classroom_ids(cls, v):
        if v is None:
            return []
        return v

    @field_validator('youtube_urls', mode='before')
    @classmethod
    def validate_youtube_urls(cls, v):
        if v is None:
            return []
        # Convert string arrays to object arrays for backward compatibility
        if isinstance(v, list) and len(v) > 0:
            if isinstance(v[0], str):
                return [{"url": url, "title": f"Video {i+1}"} for i, url in enumerate(v)]
        return v


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_urls: Optional[List[str]] = None
    file_names: Optional[List[str]] = None
    storage_paths: Optional[List[str]] = None
    sort_order: Optional[int] = None
    shared_classroom_ids: Optional[List[str]] = None
    available_at: Optional[datetime] = None
    youtube_urls: Optional[List[str]] = None
    # Backward compatibility
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    storage_path: Optional[str] = None


class Lesson(LessonBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_validator('shared_classroom_ids', mode='before')
    @classmethod
    def validate_shared_classroom_ids(cls, v):
        if v is None:
            return []
        return v

    @field_validator('youtube_urls', mode='before')
    @classmethod
    def validate_youtube_urls(cls, v):
        if v is None:
            return []
        # Convert string arrays to object arrays for backward compatibility
        if isinstance(v, list) and len(v) > 0:
            if isinstance(v[0], str):
                return [{"url": url, "title": f"Video {i+1}"} for i, url in enumerate(v)]
        return v

    @field_validator('file_urls', mode='before')
    @classmethod
    def validate_file_urls(cls, v):
        if v is None:
            return []
        return v

    @field_validator('file_names', mode='before')
    @classmethod
    def validate_file_names(cls, v):
        if v is None:
            return []
        return v

    @field_validator('storage_paths', mode='before')
    @classmethod
    def validate_storage_paths(cls, v):
        if v is None:
            return []
        return v
