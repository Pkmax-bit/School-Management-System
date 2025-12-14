"""
Notification Models
Models cho hệ thống thông báo
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str = "info"  # info, success, warning, error, system
    target_type: str  # user, role, classroom, all
    target_id: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    expires_at: Optional[str] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    target_type: str
    target_id: Optional[str]
    is_read: bool
    read_at: Optional[str]
    action_url: Optional[str]
    metadata: Dict[str, Any]
    created_by: Optional[str]
    created_at: str
    expires_at: Optional[str]
    
    class Config:
        from_attributes = True

class NotificationTemplateCreate(BaseModel):
    name: str
    title_template: str
    message_template: str
    notification_type: str = "info"
    variables: Optional[List[str]] = []

class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    title_template: Optional[str] = None
    message_template: Optional[str] = None
    notification_type: Optional[str] = None
    variables: Optional[List[str]] = None

class NotificationTemplateResponse(BaseModel):
    id: str
    name: str
    title_template: str
    message_template: str
    notification_type: str
    variables: List[str]
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True

class SendNotificationRequest(BaseModel):
    template_id: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    notification_type: str = "info"
    target_type: str
    target_id: Optional[str] = None
    variables: Optional[Dict[str, str]] = {}  # Variables để thay thế trong template
    action_url: Optional[str] = None
    expires_at: Optional[str] = None

