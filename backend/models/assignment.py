"""
Assignment Models
Model cho bài tập
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    classroom_id: str
    teacher_id: str
    due_date: datetime
    assignment_type: str  # "multiple_choice" or "essay"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assignment_type: Optional[str] = None

class Assignment(AssignmentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AssignmentQuestionBase(BaseModel):
    assignment_id: str
    question_text: str
    question_type: str  # "multiple_choice" or "essay"
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: int = 1

class AssignmentQuestionCreate(AssignmentQuestionBase):
    pass

class AssignmentQuestion(AssignmentQuestionBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssignmentSubmissionBase(BaseModel):
    assignment_id: str
    student_id: str
    answers: List[str]
    score: Optional[float] = None

class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    pass

class AssignmentSubmission(AssignmentSubmissionBase):
    id: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True