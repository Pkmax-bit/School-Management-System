"""
Users Router
Router cho quản lý người dùng
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from supabase import Client

from database import get_db
from models.user import User, UserRole
from routers.auth import get_current_user

router = APIRouter()

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: str = None
    is_active: bool = None

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách tất cả người dùng (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        response = supabase.table('users').select('*').range(skip, skip + limit - 1).execute()
        users_data = response.data if response.data else []
        
        # Convert to UserResponse format
        users = []
        for user_data in users_data:
            users.append(UserResponse(
                id=user_data['id'],
                email=user_data['email'],
                full_name=user_data.get('full_name', ''),
                role=UserRole(user_data['role']),
                is_active=user_data.get('is_active', True),
                created_at=user_data.get('created_at', '')
            ))
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một người dùng"""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = response.data[0]
        return UserResponse(
            id=user_data['id'],
            email=user_data['email'],
            full_name=user_data.get('full_name', ''),
            role=UserRole(user_data['role']),
            is_active=user_data.get('is_active', True),
            created_at=user_data.get('created_at', '')
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông tin người dùng"""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Check if user exists
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data = user_update.dict(exclude_unset=True)
        if not update_data:
            # If no data to update, return current user
            user_data = response.data[0]
            return UserResponse(
                id=user_data['id'],
                email=user_data['email'],
                full_name=user_data.get('full_name', ''),
                role=UserRole(user_data['role']),
                is_active=user_data.get('is_active', True),
                created_at=user_data.get('created_at', '')
            )
        
        # Update user
        from datetime import datetime
        update_data['updated_at'] = datetime.now().isoformat()
        
        update_response = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not update_response.data or len(update_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
        
        updated_user_data = update_response.data[0]
        return UserResponse(
            id=updated_user_data['id'],
            email=updated_user_data['email'],
            full_name=updated_user_data.get('full_name', ''),
            role=UserRole(updated_user_data['role']),
            is_active=updated_user_data.get('is_active', True),
            created_at=updated_user_data.get('created_at', '')
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa người dùng (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Check if user exists
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user
        supabase.table('users').delete().eq('id', user_id).execute()
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )
