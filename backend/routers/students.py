"""
Students API Router
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client

from models.student import StudentCreate, StudentCreateFromUser, StudentUpdate, StudentResponse
from database import get_db
from routers.auth import get_current_user_dev

router = APIRouter()

@router.post("/", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreateFromUser,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo học sinh mới"""
    try:
        # Generate unique IDs
        user_id = str(uuid.uuid4())
        student_code = f"HS{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now().isoformat()
        
        # Hash password 123456
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash("123456")
        
        # Tạo user trước
        user_result = supabase.table('users').insert({
            'id': user_id,
            'full_name': student_data.name,
            'email': student_data.email,
            'role': student_data.role,
            'password_hash': password_hash,
            'is_active': True,
            'created_at': now,
            'updated_at': now
        }).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Tạo student
        student_result = supabase.table('students').insert({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'student_code': student_code,
            'phone': student_data.phone,
            'address': student_data.address,
            'date_of_birth': student_data.date_of_birth,
            'parent_name': student_data.parent_name,
            'parent_phone': student_data.parent_phone,
            'classroom_id': student_data.classroom_id if student_data.classroom_id and student_data.classroom_id.strip() else None,
            'created_at': now,
            'updated_at': now
        }).execute()
        
        if not student_result.data:
            # Rollback user creation
            supabase.table('users').delete().eq('id', user_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create student"
            )
        
        # Return student with user info from database
        student_data_result = student_result.data[0]
        
        # Get user info from database to ensure consistency
        user_info = supabase.table('users').select('full_name, email').eq('id', user_id).execute()
        user_data = user_info.data[0] if user_info.data else {}
        
        return StudentResponse(
            id=student_data_result['id'],
            user_id=student_data_result['user_id'],
            student_code=student_data_result['student_code'],
            phone=student_data_result.get('phone'),
            address=student_data_result.get('address'),
            date_of_birth=student_data_result.get('date_of_birth'),
            parent_name=student_data_result.get('parent_name'),
            parent_phone=student_data_result.get('parent_phone'),
            classroom_id=student_data_result.get('classroom_id'),
            created_at=student_data_result['created_at'],
            updated_at=student_data_result.get('updated_at'),
            name=user_data.get('full_name'),
            email=user_data.get('email')
        )
        
    except Exception as e:
        # Cleanup on error
        print(f"ERROR in create_student: {str(e)}")
        import traceback
        traceback.print_exc()
        supabase.table('users').delete().eq('id', user_id).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create student: {str(e)}"
        )

@router.get("/", response_model=List[StudentResponse])
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách học sinh với thông tin user"""
    try:
        # Join students with users table
        query = supabase.table('students').select('*, users(full_name, email, role)')
        
        # Apply filters
        if search:
            query = query.or_(f'student_code.ilike.%{search}%,users.full_name.ilike.%{search}%,users.email.ilike.%{search}%')
        if classroom_id:
            query = query.eq('classroom_id', classroom_id)
        
        # Order by created_at desc
        query = query.order('created_at', desc=True)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        if not result.data:
            return []
        
        # Map to StudentResponse
        students_data = []
        for item in result.data:
            student_response = StudentResponse(
                id=item['id'],
                user_id=item['user_id'],
                student_code=item['student_code'],
                phone=item.get('phone'),
                address=item.get('address'),
                date_of_birth=item.get('date_of_birth'),
                parent_name=item.get('parent_name'),
                parent_phone=item.get('parent_phone'),
                classroom_id=item.get('classroom_id'),
                created_at=item['created_at'],
                updated_at=item.get('updated_at'),
                name=item['users']['full_name'] if item.get('users') else None,
                email=item['users']['email'] if item.get('users') else None
            )
            students_data.append(student_response)
        
        return students_data
        
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []

@router.get("/simple", response_model=List[StudentResponse])
async def get_students_simple(
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách học sinh đơn giản (không cần auth)"""
    try:
        result = supabase.table('students').select('*').order('created_at', desc=True).execute()
        return result.data or []
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin học sinh theo ID"""
    try:
        result = supabase.table('students').select('*, users(full_name, email)').eq('id', student_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        item = result.data[0]
        return StudentResponse(
            id=item['id'],
            user_id=item['user_id'],
            student_code=item['student_code'],
            phone=item.get('phone'),
            address=item.get('address'),
            date_of_birth=item.get('date_of_birth'),
            parent_name=item.get('parent_name'),
            parent_phone=item.get('parent_phone'),
            classroom_id=item.get('classroom_id'),
            created_at=item['created_at'],
            updated_at=item.get('updated_at'),
            name=item['users']['full_name'] if item.get('users') else None,
            email=item['users']['email'] if item.get('users') else None
        )
    except Exception as e:
        print(f"Error fetching student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student: {str(e)}"
        )

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_data: StudentUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông tin học sinh"""
    try:
        # Kiểm tra học sinh có tồn tại không và lấy user_id
        existing_student = supabase.table('students').select('id, user_id').eq('id', student_id).execute()
        if not existing_student.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        user_id = existing_student.data[0]['user_id']
        
        # Kiểm tra email đã tồn tại chưa (nếu cập nhật email)
        if student_data.email:
            email_check = supabase.table('users').select('id').eq('email', student_data.email).neq('id', user_id).execute()
            if email_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        
        # Cập nhật users table
        user_update_data = {}
        if student_data.name:
            user_update_data['full_name'] = student_data.name
        if student_data.email:
            user_update_data['email'] = student_data.email
        if student_data.role:
            user_update_data['role'] = student_data.role
        
        if user_update_data:
            user_result = supabase.table('users').update(user_update_data).eq('id', user_id).execute()
            if not user_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user"
                )
        
        # Cập nhật students table
        student_update_data = {}
        if student_data.phone:
            student_update_data['phone'] = student_data.phone
        if student_data.address:
            student_update_data['address'] = student_data.address
        if student_data.date_of_birth:
            student_update_data['date_of_birth'] = student_data.date_of_birth
        if student_data.parent_name:
            student_update_data['parent_name'] = student_data.parent_name
        if student_data.parent_phone:
            student_update_data['parent_phone'] = student_data.parent_phone
        if student_data.classroom_id and student_data.classroom_id.strip():
            student_update_data['classroom_id'] = student_data.classroom_id
        
        if student_update_data:
            student_result = supabase.table('students').update(student_update_data).eq('id', student_id).execute()
            if not student_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update student"
                )
        
        # Lấy thông tin cập nhật với join
        updated_student = supabase.table('students').select('*, users(full_name, email)').eq('id', student_id).execute()
        if not updated_student.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated student"
            )
        
        student_data_result = updated_student.data[0]
        return StudentResponse(
            id=student_data_result['id'],
            user_id=student_data_result['user_id'],
            student_code=student_data_result['student_code'],
            phone=student_data_result.get('phone'),
            address=student_data_result.get('address'),
            date_of_birth=student_data_result.get('date_of_birth'),
            parent_name=student_data_result.get('parent_name'),
            parent_phone=student_data_result.get('parent_phone'),
            classroom_id=student_data_result.get('classroom_id'),
            created_at=student_data_result['created_at'],
            updated_at=student_data_result.get('updated_at'),
            name=student_data_result['users']['full_name'] if student_data_result.get('users') else None,
            email=student_data_result['users']['email'] if student_data_result.get('users') else None
        )
        
    except Exception as e:
        print(f"Error updating student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update student: {str(e)}"
        )

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa học sinh"""
    try:
        # Lấy user_id trước khi xóa
        student_info = supabase.table('students').select('user_id').eq('id', student_id).execute()
        if not student_info.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        user_id = student_info.data[0]['user_id']
        
        # Xóa student trước (foreign key constraint)
        student_result = supabase.table('students').delete().eq('id', student_id).execute()
        if not student_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Xóa user (CASCADE sẽ tự động xóa student)
        user_result = supabase.table('users').delete().eq('id', user_id).execute()
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete user"
            )
        
        return {"message": "Student deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete student: {str(e)}"
        )

@router.get("/stats/overview")
async def get_student_stats(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thống kê tổng quan học sinh"""
    try:
        # Tổng số học sinh
        total_students = supabase.table('students').select('id', count='exact').execute()
        total_count = total_students.count if total_students.count else 0
        
        # Học sinh có địa chỉ
        students_with_address = supabase.table('students').select('id', count='exact').not_.is_('address', 'null').execute()
        address_count = students_with_address.count if students_with_address.count else 0
        
        # Học sinh có ngày sinh
        students_with_birthday = supabase.table('students').select('id', count='exact').not_.is_('date_of_birth', 'null').execute()
        birthday_count = students_with_birthday.count if students_with_birthday.count else 0
        
        # Học sinh có thông tin phụ huynh
        students_with_parent = supabase.table('students').select('id', count='exact').not_.is_('parent_name', 'null').execute()
        parent_count = students_with_parent.count if students_with_parent.count else 0
        
        return {
            "total_students": total_count,
            "students_with_address": address_count,
            "students_with_birthday": birthday_count,
            "students_with_parent": parent_count
        }
        
    except Exception as e:
        print(f"Error fetching student stats: {e}")
        return {
            "total_students": 0,
            "students_with_address": 0,
            "students_with_birthday": 0,
            "students_with_parent": 0
        }