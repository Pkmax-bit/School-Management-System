"""
Roles & Permissions Router
Router cho quản lý roles và permissions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev
from models.role import (
    RoleCreate, RoleUpdate, RoleResponse,
    PermissionResponse, UserRoleAssign, UserRoleResponse
)

router = APIRouter()

# ==================== PERMISSIONS ====================

@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    module: Optional[str] = Query(None, description="Filter by module"),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách tất cả permissions"""
    try:
        query = supabase.table('permissions').select('*')
        if module:
            query = query.eq('module', module)
        
        result = query.order('module', desc=False).order('action', desc=False).execute()
        return result.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching permissions: {str(e)}"
        )

# ==================== ROLES ====================

@router.get("/", response_model=List[RoleResponse])
async def get_roles(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách tất cả roles"""
    try:
        result = supabase.table('roles').select('*').order('created_at', desc=True).execute()
        
        # Lấy permissions cho mỗi role
        roles_with_permissions = []
        for role in result.data:
            role_id = role['id']
            permissions_result = supabase.table('role_permissions').select('permissions(*)').eq('role_id', role_id).execute()
            permissions = [p['permissions'] for p in (permissions_result.data if permissions_result.data else []) if p.get('permissions')]
            role['permissions'] = permissions
            roles_with_permissions.append(role)
        
        return roles_with_permissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching roles: {str(e)}"
        )

@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin chi tiết của một role"""
    try:
        result = supabase.table('roles').select('*').eq('id', role_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role = result.data
        
        # Lấy permissions
        permissions_result = supabase.table('role_permissions').select('permissions(*)').eq('role_id', role_id).execute()
        permissions = [p['permissions'] for p in (permissions_result.data if permissions_result.data else []) if p.get('permissions')]
        role['permissions'] = permissions
        
        return role
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching role: {str(e)}"
        )

@router.post("/", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo role mới (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        from datetime import datetime
        now = datetime.now().isoformat()
        
        # Tạo role
        role_dict = {
            'name': role_data.name,
            'description': role_data.description,
            'is_system_role': role_data.is_system_role,
            'created_at': now,
            'updated_at': now
        }
        
        result = supabase.table('roles').insert(role_dict).execute()
        role = result.data[0]
        role_id = role['id']
        
        # Gán permissions nếu có
        if role_data.permission_ids:
            role_permissions = [
                {'role_id': role_id, 'permission_id': perm_id}
                for perm_id in role_data.permission_ids
            ]
            supabase.table('role_permissions').insert(role_permissions).execute()
        
        # Lấy lại role với permissions
        return await get_role(role_id, current_user, supabase)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating role: {str(e)}"
        )

@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật role (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra role có tồn tại không
        existing = supabase.table('roles').select('*').eq('id', role_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Role not found")
        
        existing_role = existing.data
        
        # Không cho phép cập nhật system roles
        if existing_role.get('is_system_role', False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update system roles"
            )
        
        from datetime import datetime
        now = datetime.now().isoformat()
        
        # Cập nhật role
        update_dict = {'updated_at': now}
        if role_data.name is not None:
            update_dict['name'] = role_data.name
        if role_data.description is not None:
            update_dict['description'] = role_data.description
        
        if update_dict:
            supabase.table('roles').update(update_dict).eq('id', role_id).execute()
        
        # Cập nhật permissions nếu có
        if role_data.permission_ids is not None:
            # Xóa permissions cũ
            supabase.table('role_permissions').delete().eq('role_id', role_id).execute()
            
            # Thêm permissions mới
            if role_data.permission_ids:
                role_permissions = [
                    {'role_id': role_id, 'permission_id': perm_id}
                    for perm_id in role_data.permission_ids
                ]
                supabase.table('role_permissions').insert(role_permissions).execute()
        
        # Lấy lại role với permissions
        return await get_role(role_id, current_user, supabase)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating role: {str(e)}"
        )

@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa role (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra role có tồn tại không
        existing = supabase.table('roles').select('*').eq('id', role_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Không cho phép xóa system roles
        if existing.data.get('is_system_role', False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system roles"
            )
        
        # Xóa role (cascade sẽ xóa role_permissions và user_roles)
        supabase.table('roles').delete().eq('id', role_id).execute()
        
        return {"message": "Role deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting role: {str(e)}"
        )

# ==================== USER ROLES ====================

@router.get("/users/{user_id}/roles", response_model=List[UserRoleResponse])
async def get_user_roles(
    user_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách roles của một user"""
    try:
        result = supabase.table('user_roles').select('*, roles(name)').eq('user_id', user_id).execute()
        
        user_roles = []
        for ur in (result.data if result.data else []):
            role_name = ur.get('roles', {}).get('name', '') if isinstance(ur.get('roles'), dict) else ''
            user_roles.append({
                'id': ur['id'],
                'user_id': ur['user_id'],
                'role_id': ur['role_id'],
                'role_name': role_name,
                'created_at': ur['created_at']
            })
        
        return user_roles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user roles: {str(e)}"
        )

@router.post("/users/assign", response_model=List[UserRoleResponse])
async def assign_roles_to_user(
    assignment: UserRoleAssign,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Gán roles cho user (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Xóa roles cũ
        supabase.table('user_roles').delete().eq('user_id', assignment.user_id).execute()
        
        # Thêm roles mới
        if assignment.role_ids:
            user_roles = [
                {'user_id': assignment.user_id, 'role_id': role_id}
                for role_id in assignment.role_ids
            ]
            supabase.table('user_roles').insert(user_roles).execute()
        
        # Lấy lại danh sách roles
        return await get_user_roles(assignment.user_id, current_user, supabase)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error assigning roles: {str(e)}"
        )

