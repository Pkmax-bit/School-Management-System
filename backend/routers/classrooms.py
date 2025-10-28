"""
Classrooms Router
Router cho quản lý lớp học
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models.user import User, UserRole
from models.classroom import Classroom
from models.teacher import Teacher
from routers.auth import get_current_user

router = APIRouter()

class ClassroomCreate(BaseModel):
    name: str
    code: str
    description: str = None
    capacity: int = 30
    teacher_id: str = None

class ClassroomResponse(BaseModel):
    id: str
    name: str
    code: str
    description: str
    capacity: int
    teacher_id: str
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ClassroomResponse)
async def create_classroom(
    classroom_data: ClassroomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo lớp học mới (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra code đã tồn tại chưa
    existing_classroom = db.query(Classroom).filter(Classroom.code == classroom_data.code).first()
    if existing_classroom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classroom code already exists"
        )
    
    # Kiểm tra teacher có tồn tại không
    if classroom_data.teacher_id:
        teacher = db.query(Teacher).filter(Teacher.id == classroom_data.teacher_id).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
    
    db_classroom = Classroom(**classroom_data.dict())
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@router.get("/", response_model=List[ClassroomResponse])
async def get_classrooms(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách lớp học"""
    query = db.query(Classroom)
    
    if teacher_id:
        query = query.filter(Classroom.teacher_id == teacher_id)
    
    classrooms = query.offset(skip).limit(limit).all()
    return classrooms

@router.get("/{classroom_id}", response_model=ClassroomResponse)
async def get_classroom(
    classroom_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin một lớp học"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )
    return classroom

@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: str,
    classroom_data: ClassroomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin lớp học"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )
    
    update_data = classroom_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classroom, field, value)
    
    db.commit()
    db.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa lớp học (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )
    
    db.delete(classroom)
    db.commit()
    return {"message": "Classroom deleted successfully"}
