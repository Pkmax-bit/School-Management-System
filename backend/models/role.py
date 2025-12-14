"""
Role & Permission Models
Models cho quản lý roles và permissions
"""

from pydantic import BaseModel
from typing import Optional, List

class PermissionResponse(BaseModel):
    id: str
    name: str
    module: str
    action: str
    description: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_system_role: bool = False
    permission_ids: Optional[List[str]] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_system_role: bool
    created_at: str
    updated_at: Optional[str]
    permissions: Optional[List[PermissionResponse]] = []
    
    class Config:
        from_attributes = True

class UserRoleAssign(BaseModel):
    user_id: str
    role_ids: List[str]

class UserRoleResponse(BaseModel):
    id: str
    user_id: str
    role_id: str
    role_name: str
    created_at: str
    
    class Config:
        from_attributes = True

