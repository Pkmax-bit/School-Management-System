"""
Notifications Router
Router cho hệ thống thông báo
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev
from models.notification import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    NotificationTemplateCreate, NotificationTemplateUpdate, NotificationTemplateResponse,
    SendNotificationRequest
)

router = APIRouter()

# ==================== NOTIFICATIONS ====================

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    target_type: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách thông báo cho user hiện tại"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else None
        
        # Lấy thông báo cho user hoặc all
        query = supabase.table('notifications').select('*')
        
        # Filter theo target
        if target_type:
            query = query.eq('target_type', target_type)
            if target_type == 'user' and user_id:
                query = query.eq('target_id', user_id)
        elif user_id:
            # Mặc định lấy thông báo cho user và all
            query = query.or_(f'target_type.eq.all,target_type.eq.user.and.target_id.eq.{user_id}')
        
        # Filter theo is_read
        if is_read is not None:
            query = query.eq('is_read', is_read)
        
        # Filter expired
        now = datetime.now().isoformat()
        query = query.or_(f'expires_at.is.null,expires_at.gt.{now}')
        
        result = query.order('created_at', desc=True).limit(limit).offset(offset).execute()
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notifications: {str(e)}"
        )

@router.get("/unread-count")
async def get_unread_count(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy số lượng thông báo chưa đọc"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else None
        
        query = supabase.table('notifications').select('id', count='exact')
        query = query.eq('is_read', False)
        
        if user_id:
            query = query.or_(f'target_type.eq.all,target_type.eq.user.and.target_id.eq.{user_id}')
        
        # Filter expired
        now = datetime.now().isoformat()
        query = query.or_(f'expires_at.is.null,expires_at.gt.{now}')
        
        result = query.execute()
        return {"count": result.count if hasattr(result, 'count') else 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching unread count: {str(e)}"
        )

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
        now = datetime.now().isoformat()
        notification_dict = {
            'title': notification_data.title,
            'message': notification_data.message,
            'notification_type': notification_data.notification_type,
            'target_type': notification_data.target_type,
            'target_id': notification_data.target_id,
            'action_url': notification_data.action_url,
            'metadata': notification_data.metadata or {},
            'created_by': current_user.id if hasattr(current_user, 'id') else None,
            'created_at': now,
            'expires_at': notification_data.expires_at
        }
        
<<<<<<< HEAD
        result = supabase.table('notifications').insert(notification_dict).execute()
        return result.data[0]
=======
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
                        # Handle nested users data safely
                        users_data = teacher_data.get('users')
                        if isinstance(users_data, dict):
                            enriched['teacher_name'] = users_data.get('full_name') or teacher_data.get('name') or 'Giáo viên'
                        elif isinstance(users_data, list) and len(users_data) > 0:
                            enriched['teacher_name'] = users_data[0].get('full_name') or teacher_data.get('name') or 'Giáo viên'
                        else:
                            enriched['teacher_name'] = teacher_data.get('name') or 'Giáo viên'
                    else:
                        enriched['teacher_name'] = None
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    import traceback
                    traceback.print_exc()
                    enriched['teacher_name'] = None
            
            # Get student name if student notification
            if notification_data.recipient_type == 'student' and notification_data.student_id:
                try:
                    student_res = supabase.table('students').select('*, users(full_name)').eq('id', notification_data.student_id).execute()
                    if student_res.data:
                        student_data = student_res.data[0]
                        # Handle nested users data safely
                        users_data = student_data.get('users')
                        if isinstance(users_data, dict):
                            enriched['student_name'] = users_data.get('full_name') or 'Học sinh'
                        elif isinstance(users_data, list) and len(users_data) > 0:
                            enriched['student_name'] = users_data[0].get('full_name') or 'Học sinh'
                        else:
                            enriched['student_name'] = 'Học sinh'
                        enriched['student_code'] = student_data.get('student_code')
                    else:
                        enriched['student_name'] = None
                        enriched['student_code'] = None
                except Exception as e:
                    print(f"Error fetching student info: {e}")
                    import traceback
                    traceback.print_exc()
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
>>>>>>> origin/master
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating notification: {str(e)}"
        )

<<<<<<< HEAD
@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
=======
@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    teacher_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    read: Optional[bool] = Query(None, description="Filter by read status (true/false)"),
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
            # Ensure read is a boolean
            read_bool = bool(read) if read is not None else None
            query = query.eq('read', read_bool)
        
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        notifications = result.data or []
        
        # Enrich with recipient and classroom info
        enriched_notifications = []
        for notification in notifications:
            try:
                enriched = dict(notification)
                
                # Get teacher name if teacher notification
                if notification.get('teacher_id'):
                    try:
                        teacher_res = supabase.table('teachers').select('*, users(full_name)').eq('id', notification['teacher_id']).execute()
                        if teacher_res.data:
                            teacher_data = teacher_res.data[0]
                            # Handle nested users data safely
                            users_data = teacher_data.get('users')
                            if isinstance(users_data, dict):
                                enriched['teacher_name'] = users_data.get('full_name') or teacher_data.get('name') or 'Giáo viên'
                            elif isinstance(users_data, list) and len(users_data) > 0:
                                enriched['teacher_name'] = users_data[0].get('full_name') or teacher_data.get('name') or 'Giáo viên'
                            else:
                                enriched['teacher_name'] = teacher_data.get('name') or 'Giáo viên'
                        else:
                            enriched['teacher_name'] = None
                    except Exception as e:
                        print(f"Error fetching teacher info for notification {notification.get('id')}: {e}")
                        import traceback
                        traceback.print_exc()
                        enriched['teacher_name'] = None
                
                # Get student name if student notification
                if notification.get('student_id'):
                    try:
                        student_res = supabase.table('students').select('*, users(full_name)').eq('id', notification['student_id']).execute()
                        if student_res.data:
                            student_data = student_res.data[0]
                            # Handle nested users data safely
                            users_data = student_data.get('users')
                            if isinstance(users_data, dict):
                                enriched['student_name'] = users_data.get('full_name') or 'Học sinh'
                            elif isinstance(users_data, list) and len(users_data) > 0:
                                enriched['student_name'] = users_data[0].get('full_name') or 'Học sinh'
                            else:
                                enriched['student_name'] = 'Học sinh'
                            enriched['student_code'] = student_data.get('student_code')
                        else:
                            enriched['student_name'] = None
                            enriched['student_code'] = None
                    except Exception as e:
                        print(f"Error fetching student info for notification {notification.get('id')}: {e}")
                        import traceback
                        traceback.print_exc()
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
                        else:
                            enriched['classroom_name'] = None
                            enriched['classroom_grade'] = None
                    except Exception as e:
                        print(f"Error fetching classroom info for notification {notification.get('id')}: {e}")
                        import traceback
                        traceback.print_exc()
                        enriched['classroom_name'] = None
                        enriched['classroom_grade'] = None
                
                enriched_notifications.append(enriched)
            except Exception as e:
                print(f"Error enriching notification {notification.get('id', 'unknown')}: {e}")
                import traceback
                traceback.print_exc()
                # Still add the notification without enrichment
                enriched_notifications.append(dict(notification))
        
        return enriched_notifications
        
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
>>>>>>> origin/master
    notification_id: str,
    notification_data: NotificationUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông báo (chủ yếu để đánh dấu đã đọc)"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else None
        
        # Kiểm tra notification có tồn tại không
        existing = supabase.table('notifications').select('*').eq('id', notification_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Chỉ cho phép user đánh dấu đọc thông báo của mình
        notification = existing.data
        if notification.get('target_type') == 'user' and notification.get('target_id') != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        update_dict = {}
        if notification_data.is_read is not None:
            update_dict['is_read'] = notification_data.is_read
            if notification_data.is_read:
                update_dict['read_at'] = datetime.now().isoformat()
        
<<<<<<< HEAD
        if update_dict:
            result = supabase.table('notifications').update(update_dict).eq('id', notification_id).execute()
            return result.data[0]
        
        return notification
=======
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
                        # Handle nested users data safely
                        users_data = teacher_data.get('users')
                        if isinstance(users_data, dict):
                            enriched['teacher_name'] = users_data.get('full_name') or teacher_data.get('name') or 'Giáo viên'
                        elif isinstance(users_data, list) and len(users_data) > 0:
                            enriched['teacher_name'] = users_data[0].get('full_name') or teacher_data.get('name') or 'Giáo viên'
                        else:
                            enriched['teacher_name'] = teacher_data.get('name') or 'Giáo viên'
                    else:
                        enriched['teacher_name'] = None
                except Exception as e:
                    print(f"Error fetching teacher info: {e}")
                    import traceback
                    traceback.print_exc()
                    enriched['teacher_name'] = None
            
            # Get student name if student notification
            if updated_notification.get('student_id'):
                try:
                    student_res = supabase.table('students').select('*, users(full_name)').eq('id', updated_notification['student_id']).execute()
                    if student_res.data:
                        student_data = student_res.data[0]
                        # Handle nested users data safely
                        users_data = student_data.get('users')
                        if isinstance(users_data, dict):
                            enriched['student_name'] = users_data.get('full_name') or 'Học sinh'
                        elif isinstance(users_data, list) and len(users_data) > 0:
                            enriched['student_name'] = users_data[0].get('full_name') or 'Học sinh'
                        else:
                            enriched['student_name'] = 'Học sinh'
                        enriched['student_code'] = student_data.get('student_code')
                    else:
                        enriched['student_name'] = None
                        enriched['student_code'] = None
                except Exception as e:
                    print(f"Error fetching student info: {e}")
                    import traceback
                    traceback.print_exc()
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
            
>>>>>>> origin/master
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating notification: {str(e)}"
        )

@router.post("/mark-all-read")
async def mark_all_notifications_read(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Đánh dấu tất cả thông báo là đã đọc"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else None
        
        now = datetime.now().isoformat()
        
        # Cập nhật tất cả thông báo chưa đọc của user
        query = supabase.table('notifications').update({
            'is_read': True,
            'read_at': now
        }).eq('is_read', False)
        
        if user_id:
            query = query.or_(f'target_type.eq.all,target_type.eq.user.and.target_id.eq.{user_id}')
        
        query.execute()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking notifications as read: {str(e)}"
        )

@router.post("/send", response_model=List[NotificationResponse])
async def send_notification(
    request: SendNotificationRequest,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Gửi thông báo sử dụng template hoặc custom (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        title = request.title
        message = request.message
        
        # Nếu có template_id, sử dụng template
        if request.template_id:
            template = supabase.table('notification_templates').select('*').eq('id', request.template_id).single().execute()
            if not template.data:
                raise HTTPException(status_code=404, detail="Template not found")
            
            template_data = template.data
            title_template = template_data.get('title_template', '')
            message_template = template_data.get('message_template', '')
            
            # Thay thế variables
            variables = request.variables or {}
            title = title_template
            message = message_template
            for key, value in variables.items():
                title = title.replace(f'{{{{{key}}}}}', str(value))
                message = message.replace(f'{{{{{key}}}}}', str(value))
        
        if not title or not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title and message are required"
            )
        
        # Xác định danh sách target_ids
        target_ids = []
        if request.target_type == 'user' and request.target_id:
            target_ids = [request.target_id]
        elif request.target_type == 'role' and request.target_id:
            # Lấy tất cả users có role này
            user_roles = supabase.table('user_roles').select('user_id').eq('role_id', request.target_id).execute()
            target_ids = [ur['user_id'] for ur in (user_roles.data if user_roles.data else [])]
        elif request.target_type == 'classroom' and request.target_id:
            # Lấy tất cả students trong classroom
            students = supabase.table('students').select('id').eq('classroom_id', request.target_id).execute()
            target_ids = [s['id'] for s in (students.data if students.data else [])]
        elif request.target_type == 'all':
            # Gửi cho tất cả (target_id = None)
            target_ids = [None]
        
        # Tạo notifications
        now = datetime.now().isoformat()
        notifications = []
        
        for target_id in target_ids:
            notification_dict = {
                'title': title,
                'message': message,
                'notification_type': request.notification_type,
                'target_type': request.target_type if request.target_type != 'all' else 'all',
                'target_id': target_id,
                'action_url': request.action_url,
                'metadata': {},
                'created_by': current_user.id if hasattr(current_user, 'id') else None,
                'created_at': now,
                'expires_at': request.expires_at
            }
            
            result = supabase.table('notifications').insert(notification_dict).execute()
            if result.data:
                notifications.append(result.data[0])
        
        return notifications
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

# ==================== NOTIFICATION TEMPLATES ====================

@router.get("/templates", response_model=List[NotificationTemplateResponse])
async def get_notification_templates(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách notification templates"""
    try:
        result = supabase.table('notification_templates').select('*').order('created_at', desc=True).execute()
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching templates: {str(e)}"
        )

@router.post("/templates", response_model=NotificationTemplateResponse)
async def create_notification_template(
    template_data: NotificationTemplateCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo notification template mới (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        now = datetime.now().isoformat()
        template_dict = {
            'name': template_data.name,
            'title_template': template_data.title_template,
            'message_template': template_data.message_template,
            'notification_type': template_data.notification_type,
            'variables': template_data.variables or [],
            'created_at': now,
            'updated_at': now
        }
        
        result = supabase.table('notification_templates').insert(template_dict).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating template: {str(e)}"
        )

@router.put("/templates/{template_id}", response_model=NotificationTemplateResponse)
async def update_notification_template(
    template_id: str,
    template_data: NotificationTemplateUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật notification template (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        now = datetime.now().isoformat()
        update_dict = {'updated_at': now}
        
        if template_data.name is not None:
            update_dict['name'] = template_data.name
        if template_data.title_template is not None:
            update_dict['title_template'] = template_data.title_template
        if template_data.message_template is not None:
            update_dict['message_template'] = template_data.message_template
        if template_data.notification_type is not None:
            update_dict['notification_type'] = template_data.notification_type
        if template_data.variables is not None:
            update_dict['variables'] = template_data.variables
        
        result = supabase.table('notification_templates').update(update_dict).eq('id', template_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating template: {str(e)}"
        )

@router.delete("/templates/{template_id}")
async def delete_notification_template(
    template_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa notification template (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        supabase.table('notification_templates').delete().eq('id', template_id).execute()
        return {"message": "Template deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting template: {str(e)}"
        )
