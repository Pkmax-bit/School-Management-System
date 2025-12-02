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
        student_code = f"HS{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now().isoformat()
        
        # Use provided password or default to '123456'
        password = student_data.password if student_data.password and student_data.password.strip() else '123456'
        
        # Validate password length
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        
        # Check if email already exists
        existing_user = supabase.table('users').select('id').eq('email', student_data.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # 1) Tạo tài khoản Supabase Auth với mật khẩu (mặc định 123456 nếu không có)
        # Sử dụng Admin API để tạo user mà không cần email confirmation
        user_id = None
        try:
            print(f"Creating Supabase Auth user for student: {student_data.email}")
            
            # Try using admin API first (requires service role key)
            try:
                admin_resp = supabase.auth.admin.create_user({
                    'email': student_data.email,
                    'password': password,
                    'email_confirm': True,  # Auto-confirm email
                    'user_metadata': {
                        'full_name': student_data.name,
                        'role': student_data.role
                    }
                })
                
                print(f"Admin API response: {admin_resp}")
                
                # Get user from admin response
                auth_user = getattr(admin_resp, 'user', None) or (
                    admin_resp.get('user') if isinstance(admin_resp, dict) else None
                )
                
                if auth_user:
                    user_id = getattr(auth_user, 'id', None) or (
                        auth_user.get('id') if isinstance(auth_user, dict) else None
                    )
                    print(f"User created via Admin API: {user_id}")
                
            except Exception as admin_error:
                print(f"Admin API failed, trying sign_up: {str(admin_error)}")
                # Fallback to sign_up if admin API fails
                auth_resp = supabase.auth.sign_up({
                    'email': student_data.email,
                    'password': password,
                    'options': {
                        'data': {
                            'full_name': student_data.name,
                            'role': student_data.role
                        }
                    }
                })
                
                # Check for errors in response
                if hasattr(auth_resp, 'error') and auth_resp.error:
                    error_msg = str(auth_resp.error)
                    print(f"Supabase Auth error: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Email không hợp lệ hoặc đã tồn tại: {error_msg}"
                    )
                
                # Get user from response
                auth_user = getattr(auth_resp, 'user', None) or (
                    auth_resp.get('user') if isinstance(auth_resp, dict) else None
                )
                
                if auth_user:
                    user_id = getattr(auth_user, 'id', None) or (
                        auth_user.get('id') if isinstance(auth_user, dict) else None
                    )
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Không thể tạo tài khoản đăng nhập. Vui lòng kiểm tra email và thử lại."
                )
                
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            print(f"Supabase Auth exception for student {student_data.email}: {error_msg}")
            import traceback
            traceback.print_exc()
            
            # Provide user-friendly error message
            if "invalid" in error_msg.lower() or "not authorized" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{student_data.email}' không hợp lệ hoặc không được phép. Vui lòng sử dụng email khác."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Lỗi tạo tài khoản: {error_msg}"
                )
        
        # 2) Ghi bản ghi user ứng dụng, hash password để đồng bộ mô hình DB
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(password)
        
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
            try:
                # Try to delete auth user
                try:
                    supabase.auth.admin.delete_user(user_id)
                except:
                    pass  # Ignore if admin API not available
                # Delete user from database
                supabase.table('users').delete().eq('id', user_id).execute()
            except:
                pass  # Ignore cleanup errors
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
        
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Cleanup on error
        error_msg = str(e)
        print(f"ERROR in create_student: {error_msg}")
        import traceback
        traceback.print_exc()
        # Only cleanup if user_id was created
        try:
            if 'user_id' in locals() and user_id:
                # Try to delete auth user if exists
                try:
                    supabase.auth.admin.delete_user(user_id)
                except:
                    pass  # Ignore if admin API not available or user doesn't exist
                # Delete user from database
                try:
                    supabase.table('users').delete().eq('id', user_id).execute()
                except:
                    pass  # Ignore if user doesn't exist
        except Exception as cleanup_error:
            print(f"Cleanup error (ignored): {str(cleanup_error)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create student: {error_msg}"
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

@router.get("/{student_id}/grades")
async def get_student_grades(
    student_id: str,
    classroom_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy điểm số của học sinh - convenience endpoint with frontend-compatible format"""
    # Import here to avoid circular dependency at module level
    from routers.assignments import get_student_grade_summary
    from models.user import User, UserRole
    
    try:
        # Convert current_user to proper User model format
        user_obj = User(
            id=current_user.id if hasattr(current_user, 'id') else str(current_user.get('id', '')),
            email=current_user.email if hasattr(current_user, 'email') else str(current_user.get('email', '')),
            role=UserRole(current_user.role if hasattr(current_user, 'role') else str(current_user.get('role', 'student')))
        )
        
        # Call the assignments endpoint function
        grade_data = await get_student_grade_summary(
            student_id=student_id,
            classroom_id=classroom_id,
            subject_id=subject_id,
            current_user=user_obj,
            supabase=supabase
        )
        
        # Get student name
        student_result = supabase.table('students').select('*, users(full_name)').eq('id', student_id).execute()
        student_name = 'Học sinh'
        if student_result.data and student_result.data[0].get('users'):
            student_name = student_result.data[0]['users'].get('full_name', 'Học sinh')
        elif student_result.data:
            # Fallback to first_name + last_name if available
            first_name = student_result.data[0].get('first_name', '')
            last_name = student_result.data[0].get('last_name', '')
            if first_name or last_name:
                student_name = f"{last_name} {first_name}".strip()
        
        # Group assignments by subject and calculate subject averages
        assignments = grade_data.get('assignments', [])
        subjects_map = {}
        
        for assignment in assignments:
            subj_id = assignment.get('subject_id')
            subj_name = assignment.get('subject_name', 'Chưa phân loại')
            
            if subj_id not in subjects_map:
                subjects_map[subj_id] = {
                    'subject_id': subj_id,
                    'subject_name': subj_name,
                    'total_assignments': 0,
                    'graded_assignments': 0,
                    'total_score': 0.0,
                    'max_total_score': 0.0,
                    'scores': []
                }
            
            subjects_map[subj_id]['total_assignments'] += 1
            if assignment.get('score') is not None:
                subjects_map[subj_id]['graded_assignments'] += 1
                score = float(assignment.get('score', 0))
                max_score = float(assignment.get('total_points', 100))
                subjects_map[subj_id]['total_score'] += score
                subjects_map[subj_id]['max_total_score'] += max_score
                subjects_map[subj_id]['scores'].append(score)
        
        # Calculate averages for each subject
        subjects_list = []
        for subj_data in subjects_map.values():
            avg_score = 0.0
            if subj_data['graded_assignments'] > 0:
                avg_score = subj_data['total_score'] / subj_data['graded_assignments']
            
            subjects_list.append({
                'subject_id': subj_data['subject_id'],
                'subject_name': subj_data['subject_name'],
                'total_assignments': subj_data['total_assignments'],
                'graded_assignments': subj_data['graded_assignments'],
                'average_score': round(avg_score, 2),
                'total_score': round(subj_data['total_score'], 2),
                'max_total_score': round(subj_data['max_total_score'], 2)
            })
        
        # Transform assignments to frontend-expected format
        assignments_list = []
        for assignment in grade_data.get('assignments', []):
            # Determine status
            status = 'graded' if assignment.get('score') is not None else 'pending'
            
            assignments_list.append({
                'assignment_id': assignment.get('assignment_id'),
                'assignment_title': assignment.get('assignment_title', ''),
                'subject_name': assignment.get('subject_name', 'Chưa phân loại'),
                'score': float(assignment.get('score', 0)) if assignment.get('score') is not None else 0,
                'max_score': float(assignment.get('total_points', 100)),
                'percentage': assignment.get('percentage', 0),
                'graded_at': assignment.get('graded_at'),
                'status': status
            })
        
        # Transform to frontend-expected format
        return {
            'student_id': grade_data.get('student_id'),
            'student_name': student_name,
            'total_assignments': grade_data.get('total_assignments', 0),
            'graded_assignments': grade_data.get('graded_assignments', 0),
            'pending_assignments': grade_data.get('pending_assignments', 0),
            'overall_average': grade_data.get('average_score', 0.0),  # Map average_score to overall_average
            'classification': grade_data.get('classification', 'Chưa có điểm'),
            'assignments': assignments_list,
            'subjects': subjects_list
        }
        
    except Exception as e:
        print(f"Error in get_student_grades: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student grades: {str(e)}"
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