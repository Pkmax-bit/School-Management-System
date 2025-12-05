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
    recipient_type: str  # 'teacher' or 'student'
    teacher_id: Optional[str] = None
    student_id: Optional[str] = None
    classroom_id: Optional[str] = None
    type: str  # 'attendance_request', 'general', etc.
    title: str
    message: str
    priority: Optional[str] = 'normal'  # 'low', 'normal', 'high', 'urgent'
    read: Optional[bool] = False

class NotificationResponse(BaseModel):
    id: str
    recipient_type: str
    teacher_id: Optional[str] = None
    student_id: Optional[str] = None
    classroom_id: Optional[str] = None
    type: str
    title: str
    message: str
    priority: str
    read: bool
    created_at: str
    updated_at: Optional[str] = None
    teacher_name: Optional[str] = None
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    classroom_name: Optional[str] = None
    classroom_grade: Optional[str] = None

@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo thông báo mới (admin và teacher với giới hạn quyền)"""
    # Check permissions
    if current_user.role == 'teacher':
        # Teachers can only create notifications for students
        if notification_data.recipient_type != 'student':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teachers can only create notifications for students"
            )
    elif current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Validate recipient based on type
        if notification_data.recipient_type == 'teacher':
            if not notification_data.teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="teacher_id is required for teacher notifications"
                )
            # Check if teacher exists
            teacher_result = supabase.table('teachers').select('id, user_id').eq('id', notification_data.teacher_id).execute()
            if not teacher_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Teacher not found"
                )
        elif notification_data.recipient_type == 'student':
            if not notification_data.student_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="student_id is required for student notifications"
                )
            # Check if student exists
            student_result = supabase.table('students').select('id, user_id').eq('id', notification_data.student_id).execute()
            if not student_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Student not found"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recipient_type. Must be 'teacher' or 'student'"
            )
        
        # Create notification
        now = datetime.now().isoformat()
        notification_record = {
            'recipient_type': notification_data.recipient_type,
            'teacher_id': notification_data.teacher_id,
            'student_id': notification_data.student_id,
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
            
            # Enrich with recipient info
            enriched = dict(notification)
            
            # Get teacher name if teacher notification
            if notification_data.recipient_type == 'teacher' and notification_data.teacher_id:
                try:
                    teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', notification_data.teacher_id).execute()
                    if teacher_res.data:
                        teacher_data = teacher_res.data[0]
                        enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    enriched['teacher_name'] = None
            
            # Get student name if student notification
            if notification_data.recipient_type == 'student' and notification_data.student_id:
                try:
                    student_res = supabase.table('students').select('*, users(full_name)').eq('id', notification_data.student_id).execute()
                    if student_res.data:
                        student_data = student_res.data[0]
                        enriched['student_name'] = student_data.get('users', {}).get('full_name') or 'Học sinh'
                        enriched['student_code'] = student_data.get('student_code')
                except Exception as e:
                    print(f"Error fetching student info: {e}")
                    enriched['student_name'] = None
                    enriched['student_code'] = None
            
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
    student_id: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    read: Optional[bool] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """
    Lấy danh sách thông báo
    
    - Admin: Xem TẤT CẢ thông báo (của tất cả giáo viên và học sinh)
    - Teacher: Chỉ xem thông báo được chỉ định cho chính họ
    - Student: Chỉ xem thông báo được chỉ định cho chính họ
    
    Admin có thể filter bằng query params (teacher_id, student_id, classroom_id, read)
    """
    try:
        query = supabase.table('notifications').select('*')
        
        # Filter based on current user role
        # Admin: Không filter gì, xem tất cả thông báo
        if current_user.role == 'teacher':
            # Teacher: Chỉ xem thông báo được chỉ định cho chính họ
            teacher_result = supabase.table('teachers').select('id').eq('user_id', current_user.id).execute()
            if teacher_result.data:
                # Show notifications where this teacher is the recipient
                query = query.eq('recipient_type', 'teacher').eq('teacher_id', teacher_result.data[0]['id'])
            else:
                return []
        elif current_user.role == 'student':
            # Student: Chỉ xem thông báo được chỉ định cho chính họ
            student_result = supabase.table('students').select('id').eq('user_id', current_user.id).execute()
            if student_result.data:
                # Show notifications where this student is the recipient
                query = query.eq('recipient_type', 'student').eq('student_id', student_result.data[0]['id'])
            else:
                return []
        # Admin: Không có filter mặc định, xem tất cả thông báo
        
        # Admin có thể filter bằng query params (optional filters)
        if teacher_id and current_user.role == 'admin':
            query = query.eq('teacher_id', teacher_id)
        
        if student_id and current_user.role == 'admin':
            query = query.eq('student_id', student_id)
        
        if classroom_id:
            query = query.eq('classroom_id', classroom_id)
        
        if read is not None:
            query = query.eq('read', read)
        
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        notifications = result.data or []
        
        # Enrich with recipient and classroom info
        enriched_notifications = []
        for notification in notifications:
            enriched = dict(notification)
            
            # Get teacher name if teacher notification
            if notification.get('teacher_id'):
                try:
                    teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', notification['teacher_id']).execute()
                    if teacher_res.data:
                        teacher_data = teacher_res.data[0]
                        enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    enriched['teacher_name'] = None
            
            # Get student name if student notification
            if notification.get('student_id'):
                try:
                    student_res = supabase.table('students').select('*, users(full_name)').eq('id', notification['student_id']).execute()
                    if student_res.data:
                        student_data = student_res.data[0]
                        enriched['student_name'] = student_data.get('users', {}).get('full_name') or 'Học sinh'
                        enriched['student_code'] = student_data.get('student_code')
                except Exception as e:
                    print(f"Error fetching student info: {e}")
                    enriched['student_name'] = None
                    enriched['student_code'] = None
            
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
    """
    Đánh dấu thông báo đã đọc
    
    - Admin: Có thể đánh dấu bất kỳ thông báo nào
    - Teacher: Chỉ có thể đánh dấu thông báo của chính họ
    - Student: Chỉ có thể đánh dấu thông báo của chính họ
    """
    try:
        # Check if notification exists
        notification_result = supabase.table('notifications').select('*').eq('id', notification_id).execute()
        if not notification_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        notification = notification_result.data[0]
        
        # Admin: Có thể mark as read bất kỳ thông báo nào
        if current_user.role == 'admin':
            pass  # Admin có quyền mark as read tất cả
        elif current_user.role == 'teacher':
            # Teacher: Chỉ có thể mark as read thông báo của chính họ
            teacher_result = supabase.table('teachers').select('id').eq('user_id', current_user.id).execute()
            if not teacher_result.data or teacher_result.data[0]['id'] != notification['teacher_id']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions. You can only mark your own notifications as read."
                )
        elif current_user.role == 'student':
            # Student: Chỉ có thể mark as read thông báo của chính họ
            student_result = supabase.table('students').select('id').eq('user_id', current_user.id).execute()
            if not student_result.data or student_result.data[0]['id'] != notification['student_id']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions. You can only mark your own notifications as read."
                )
        else:
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
            
            # Enrich with recipient and classroom info
            enriched = dict(updated_notification)
            
            # Get teacher name if teacher notification
            if updated_notification.get('teacher_id'):
                try:
                    teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', updated_notification['teacher_id']).execute()
                    if teacher_res.data:
                        teacher_data = teacher_res.data[0]
                        enriched['teacher_name'] = teacher_data.get('users', {}).get('full_name') or teacher_data.get('name') or 'Giáo viên'
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    enriched['teacher_name'] = None
            
            # Get student name if student notification
            if updated_notification.get('student_id'):
                try:
                    student_res = supabase.table('students').select('*, users(full_name)').eq('id', updated_notification['student_id']).execute()
                    if student_res.data:
                        student_data = student_res.data[0]
                        enriched['student_name'] = student_data.get('users', {}).get('full_name') or 'Học sinh'
                        enriched['student_code'] = student_data.get('student_code')
                except Exception as e:
                    print(f"Error fetching student info: {e}")
                    enriched['student_name'] = None
                    enriched['student_code'] = None
            
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

