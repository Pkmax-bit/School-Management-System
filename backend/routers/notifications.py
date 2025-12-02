"""
Notifications Router
Router cho quản lý thông báo
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev

router = APIRouter()

class NotificationCreate(BaseModel):
    teacher_id: str
    classroom_id: Optional[str] = None
    type: str  # 'attendance_request', 'general', etc.
    title: str
    message: str
    priority: Optional[str] = 'normal'  # 'low', 'normal', 'high', 'urgent'
    read: Optional[bool] = False

class NotificationResponse(BaseModel):
    id: str
    teacher_id: str
    classroom_id: Optional[str] = None
    type: str
    title: str
    message: str
    priority: str
    read: bool
    created_at: str
    updated_at: Optional[str] = None
    teacher_name: Optional[str] = None
    classroom_name: Optional[str] = None
    classroom_grade: Optional[str] = None

@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo thông báo mới (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Check if teacher exists
        teacher_result = supabase.table('teachers').select('id, user_id').eq('id', notification_data.teacher_id).execute()
        if not teacher_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        # Create notification
        now = datetime.now().isoformat()
        notification_record = {
            'teacher_id': notification_data.teacher_id,
            'classroom_id': notification_data.classroom_id,
            'type': notification_data.type,
            'title': notification_data.title,
            'message': notification_data.message,
            'priority': notification_data.priority,
            'read': notification_data.read,
            'created_at': now,
            'updated_at': now
        }
        
        result = supabase.table('notifications').insert(notification_record).execute()
        
        if result.data and len(result.data) > 0:
            notification = result.data[0]
            
            # Enrich with teacher and classroom info
            enriched = dict(notification)
            
            # Get teacher name
            try:
                teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', notification_data.teacher_id).execute()
                if teacher_res.data:
                    teacher_data = teacher_res.data[0]
                    enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
            except Exception as e:
                print(f"Error fetching teacher info: {e}")
                enriched['teacher_name'] = None
            
            # Get classroom info
            if notification_data.classroom_id:
                try:
                    classroom_res = supabase.table('classrooms').select('name, grade').eq('id', notification_data.classroom_id).execute()
                    if classroom_res.data:
                        classroom_data = classroom_res.data[0]
                        enriched['classroom_name'] = classroom_data.get('name')
                        enriched['classroom_grade'] = classroom_data.get('grade')
                except Exception as e:
                    print(f"Error fetching classroom info: {e}")
                    enriched['classroom_name'] = None
                    enriched['classroom_grade'] = None
            
            return NotificationResponse(**enriched)
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create notification"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    teacher_id: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    read: Optional[bool] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách thông báo"""
    try:
        query = supabase.table('notifications').select('*')
        
        # If teacher, only show their notifications
        if current_user.role == 'teacher':
            # Get teacher_id from user_id
            teacher_result = supabase.table('teachers').select('id').eq('user_id', current_user.id).execute()
            if teacher_result.data:
                query = query.eq('teacher_id', teacher_result.data[0]['id'])
            else:
                return []
        
        if teacher_id and current_user.role == 'admin':
            query = query.eq('teacher_id', teacher_id)
        
        if classroom_id:
            query = query.eq('classroom_id', classroom_id)
        
        if read is not None:
            query = query.eq('read', read)
        
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        notifications = result.data or []
        
        # Enrich with teacher and classroom info
        enriched_notifications = []
        for notification in notifications:
            enriched = dict(notification)
            
            # Get teacher name
            if notification.get('teacher_id'):
                try:
                    teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', notification['teacher_id']).execute()
                    if teacher_res.data:
                        teacher_data = teacher_res.data[0]
                        enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    enriched['teacher_name'] = None
            
            # Get classroom info
            if notification.get('classroom_id'):
                try:
                    classroom_res = supabase.table('classrooms').select('name, grade').eq('id', notification['classroom_id']).execute()
                    if classroom_res.data:
                        classroom_data = classroom_res.data[0]
                        enriched['classroom_name'] = classroom_data.get('name')
                        enriched['classroom_grade'] = classroom_data.get('grade')
                except Exception as e:
                    print(f"Error fetching classroom info: {e}")
                    enriched['classroom_name'] = None
                    enriched['classroom_grade'] = None
            
            enriched_notifications.append(enriched)
        
        return enriched_notifications
        
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Đánh dấu thông báo đã đọc"""
    try:
        # Check if notification exists and belongs to teacher
        notification_result = supabase.table('notifications').select('*').eq('id', notification_id).execute()
        if not notification_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        notification = notification_result.data[0]
        
        # If teacher, verify it's their notification
        if current_user.role == 'teacher':
            teacher_result = supabase.table('teachers').select('id').eq('user_id', current_user.id).execute()
            if not teacher_result.data or teacher_result.data[0]['id'] != notification['teacher_id']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        # Update notification
        now = datetime.now().isoformat()
        result = supabase.table('notifications').update({
            'read': True,
            'updated_at': now
        }).eq('id', notification_id).execute()
        
        if result.data and len(result.data) > 0:
            updated_notification = result.data[0]
            
            # Enrich with teacher and classroom info
            enriched = dict(updated_notification)
            
            # Get teacher name
            if updated_notification.get('teacher_id'):
                try:
                    teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', updated_notification['teacher_id']).execute()
                    if teacher_res.data:
                        teacher_data = teacher_res.data[0]
                        enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    enriched['teacher_name'] = None
            
            # Get classroom info
            if updated_notification.get('classroom_id'):
                try:
                    classroom_res = supabase.table('classrooms').select('name, grade').eq('id', updated_notification['classroom_id']).execute()
                    if classroom_res.data:
                        classroom_data = classroom_res.data[0]
                        enriched['classroom_name'] = classroom_data.get('name')
                        enriched['classroom_grade'] = classroom_data.get('grade')
                except Exception as e:
                    print(f"Error fetching classroom info: {e}")
                    enriched['classroom_name'] = None
                    enriched['classroom_grade'] = None
            
            return NotificationResponse(**enriched)
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update notification"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification: {str(e)}"
        )

