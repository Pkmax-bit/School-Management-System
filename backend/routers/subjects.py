"""
Subjects Router
Router cho quản lý môn học
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from supabase import Client

from database import get_db
from models.subject import Subject, SubjectCreate, SubjectUpdate
from routers.auth import get_current_user

router = APIRouter()

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    description: str = None
    created_at: str
    updated_at: str = None
    
    class Config:
        from_attributes = True

@router.post("/", response_model=SubjectResponse)
async def create_subject(
    subject_data: SubjectCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tạo môn học mới (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra code đã tồn tại chưa
    existing_subject = supabase.table('subjects').select('id').eq('code', subject_data.code).execute()
    if existing_subject.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject code already exists"
        )
    
    # Tạo môn học mới
    result = supabase.table('subjects').insert(subject_data.dict()).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subject"
        )
    
    return result.data[0]

@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách môn học"""
    result = supabase.table('subjects').select('*').order('created_at', desc=True).range(skip, skip + limit - 1).execute()
    return result.data or []

@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một môn học"""
    result = supabase.table('subjects').select('*').eq('id', subject_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    return result.data[0]

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_data: SubjectUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông tin môn học"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra môn học có tồn tại không
    existing_subject = supabase.table('subjects').select('id').eq('id', subject_id).execute()
    if not existing_subject.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Kiểm tra code mới có trùng không (nếu có thay đổi code)
    if subject_data.code:
        code_check = supabase.table('subjects').select('id').eq('code', subject_data.code).neq('id', subject_id).execute()
        if code_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject code already exists"
            )
    
    # Cập nhật môn học
    update_data = subject_data.dict(exclude_unset=True)
    result = supabase.table('subjects').update(update_data).eq('id', subject_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update subject"
        )
    
    return result.data[0]

@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa môn học (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra môn học có tồn tại không
    existing_subject = supabase.table('subjects').select('id').eq('id', subject_id).execute()
    if not existing_subject.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Xóa môn học
    result = supabase.table('subjects').delete().eq('id', subject_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete subject"
        )
    
    return {"message": "Subject deleted successfully"}

@router.get("/search/{query}", response_model=List[SubjectResponse])
async def search_subjects(
    query: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tìm kiếm môn học theo tên hoặc mã"""
    result = supabase.table('subjects').select('*').or_(f'name.ilike.%{query}%,code.ilike.%{query}%').order('created_at', desc=True).execute()
    return result.data or []
