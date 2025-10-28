"""
Assignments Router
Router cho quản lý bài tập
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.user import User, UserRole
from models.assignment import Assignment, AssignmentQuestion, AssignmentSubmission
from models.student import Student
from routers.auth import get_current_user

router = APIRouter()

class AssignmentCreate(BaseModel):
    title: str
    description: str = None
    classroom_id: str
    subject_id: str
    teacher_id: str
    assignment_type: str  # multiple_choice, essay
    total_points: float = 100.0
    due_date: datetime = None

class AssignmentQuestionCreate(BaseModel):
    question_text: str
    question_type: str  # multiple_choice, essay
    points: float = 1.0
    options: List[Dict[str, Any]] = None  # For multiple choice
    correct_answer: str = None  # For multiple choice
    order: int = 0

class AssignmentResponse(BaseModel):
    id: str
    title: str
    description: str
    classroom_id: str
    subject_id: str
    teacher_id: str
    assignment_type: str
    total_points: float
    due_date: datetime
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True

class AssignmentSubmissionCreate(BaseModel):
    assignment_id: str
    student_id: str
    answers: Dict[str, Any]  # {"question_id": "answer"}

class AssignmentSubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    answers: Dict[str, Any]
    score: float
    is_graded: bool
    submitted_at: str
    graded_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo bài tập mới (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_assignment = Assignment(**assignment_data.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/", response_model=List[AssignmentResponse])
async def get_assignments(
    skip: int = 0,
    limit: int = 100,
    classroom_id: Optional[str] = None,
    teacher_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách bài tập"""
    query = db.query(Assignment)
    
    if classroom_id:
        query = query.filter(Assignment.classroom_id == classroom_id)
    if teacher_id:
        query = query.filter(Assignment.teacher_id == teacher_id)
    
    assignments = query.offset(skip).limit(limit).all()
    return assignments

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin một bài tập"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment

@router.post("/{assignment_id}/questions", response_model=dict)
async def add_question(
    assignment_id: str,
    question_data: AssignmentQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thêm câu hỏi vào bài tập"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    question_data.assignment_id = assignment_id
    db_question = AssignmentQuestion(**question_data.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return {"message": "Question added successfully", "question_id": db_question.id}

@router.post("/submit", response_model=AssignmentSubmissionResponse)
async def submit_assignment(
    submission_data: AssignmentSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Nộp bài tập (chỉ học sinh)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra assignment có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == submission_data.assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    # Kiểm tra student có tồn tại không
    student = db.query(Student).filter(Student.id == submission_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Kiểm tra đã nộp bài chưa
    existing_submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == submission_data.assignment_id,
        AssignmentSubmission.student_id == submission_data.student_id
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment already submitted"
        )
    
    db_submission = AssignmentSubmission(**submission_data.dict())
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission

@router.get("/{assignment_id}/submissions", response_model=List[AssignmentSubmissionResponse])
async def get_submissions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách bài nộp (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()
    return submissions
