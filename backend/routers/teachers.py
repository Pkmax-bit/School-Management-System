"""
Teachers Router
Router cho quản lý giáo viên
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from supabase import Client

from database import get_db
from models.teacher import Teacher, TeacherCreate, TeacherUpdate, TeacherCreateFromUser
from routers.auth import get_current_user, get_current_user_dev

router = APIRouter()

class TeacherResponse(BaseModel):
    id: str
    user_id: str
    teacher_code: str
    phone: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    # User info (from users table)
    name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.post("/", response_model=TeacherResponse)
async def create_teacher(
    teacher_data: TeacherCreateFromUser,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo giáo viên mới từ user data (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Tạo teacher_code tự động; user_id sẽ lấy từ Supabase Auth
    import uuid
    teacher_code = f"GV{str(uuid.uuid4())[:6].upper()}"
    
    # Kiểm tra email đã tồn tại trong bảng users
    existing_user = supabase.table('users').select('id').eq('email', teacher_data.email).execute()
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Kiểm tra teacher_code đã tồn tại chưa
    existing_teacher = supabase.table('teachers').select('id').eq('teacher_code', teacher_code).execute()
    if existing_teacher.data:
        # Regenerate teacher_code if exists
        teacher_code = f"GV{str(uuid.uuid4())[:6].upper()}"

    try:
        # 1) Tạo tài khoản Supabase Auth với mật khẩu (mặc định 123456 nếu không có)
        from datetime import datetime
        now = datetime.now().isoformat()
        
        # Use provided password or default to '123456'
        password = teacher_data.password if teacher_data.password and teacher_data.password.strip() else '123456'
        
        # Validate password length
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        
        # Tạo user trong Supabase Auth
        try:
            auth_resp = supabase.auth.sign_up({
                'email': teacher_data.email,
                'password': password
            })
            auth_user = getattr(auth_resp, 'user', None)
            if not auth_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create auth user"
                )
            user_id = auth_user.id
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auth creation error: {str(e)}"
            )

        # 2) Ghi bản ghi user ứng dụng, hash password để đồng bộ mô hình DB
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(password)
        
        user_result = supabase.table('users').insert({
            'id': user_id,
            'full_name': teacher_data.name,
            'email': teacher_data.email,
            'role': teacher_data.role,
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
        
        # 3) Tạo teacher
        teacher_result = supabase.table('teachers').insert({
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'teacher_code': teacher_code,
            'phone': teacher_data.phone,
            'address': teacher_data.address,
            'education_level': teacher_data.education_level,
            'degree_name': teacher_data.degree_name,
            'created_at': now,
            'updated_at': now
        }).execute()
        
        if not teacher_result.data:
            # Rollback user creation
            supabase.table('users').delete().eq('id', user_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create teacher"
            )
        
        # Return teacher with user info from database
        teacher_data_result = teacher_result.data[0]
        
        # Get user info from database to ensure consistency
        user_info = supabase.table('users').select('full_name, email').eq('id', user_id).execute()
        user_data = user_info.data[0] if user_info.data else {}
        
        return TeacherResponse(
            id=teacher_data_result['id'],
            user_id=teacher_data_result['user_id'],
            teacher_code=teacher_data_result['teacher_code'],
            phone=teacher_data_result.get('phone'),
            address=teacher_data_result.get('address'),
            specialization=teacher_data_result.get('specialization'),
            experience_years=teacher_data_result.get('experience_years'),
            created_at=teacher_data_result['created_at'],
            updated_at=teacher_data_result.get('updated_at'),
            name=user_data.get('full_name'),  # Get from database users.full_name
            email=user_data.get('email')       # Get from database users.email
        )
        
    except Exception as e:
        # Cleanup on error
        supabase.table('users').delete().eq('id', user_id).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create teacher: {str(e)}"
        )

@router.get("/", response_model=List[TeacherResponse])
async def get_teachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách giáo viên với thông tin user"""
    try:
        # Join teachers with users table
        query = supabase.table('teachers').select('*, users(full_name, email, role)')
        
        # Apply filters
        if search:
            query = query.or_(f'teacher_code.ilike.%{search}%,users.full_name.ilike.%{search}%,users.email.ilike.%{search}%')
        if department:
            query = query.eq('specialization', department)
        
        # Order by created_at desc
        query = query.order('created_at', desc=True)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        if not result.data:
            return []
        
        # Map to TeacherResponse
        teachers_data = []
        for item in result.data:
            teacher_response = TeacherResponse(
                id=item['id'],
                user_id=item['user_id'],
                teacher_code=item['teacher_code'],
                phone=item.get('phone'),
                address=item.get('address'),
                specialization=item.get('specialization'),
                experience_years=item.get('experience_years'),
                created_at=item['created_at'],
                updated_at=item.get('updated_at'),
                name=item['users']['full_name'] if item.get('users') else None,
                email=item['users']['email'] if item.get('users') else None
            )
            teachers_data.append(teacher_response)
        
        return teachers_data
        
    except Exception as e:
        print(f"Error fetching teachers: {e}")
        return []

@router.get("/simple", response_model=List[TeacherResponse])
async def get_teachers_simple(
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách giáo viên (không cần auth)"""
    result = supabase.table('teachers').select('*').order('created_at', desc=True).execute()
    return result.data or []

@router.get("/public-list", response_model=List[TeacherResponse])
async def get_teachers_public(
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách giáo viên công khai"""
    result = supabase.table('teachers').select('*').order('created_at', desc=True).execute()
    return result.data or []

@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin giáo viên theo ID"""
    result = supabase.table('teachers').select('*').eq('id', teacher_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    return result.data[0]

@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    teacher_data: TeacherUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông tin giáo viên"""
    try:
    
        # Kiểm tra giáo viên có tồn tại không và lấy user_id
        existing_teacher = supabase.table('teachers').select('id, user_id').eq('id', teacher_id).execute()
        if not existing_teacher.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )
        
        user_id = existing_teacher.data[0]['user_id']
        
        # Kiểm tra email đã tồn tại chưa (nếu cập nhật email)
        if teacher_data.email:
            email_check = supabase.table('users').select('id').eq('email', teacher_data.email).neq('id', user_id).execute()
            if email_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        
        # Cập nhật users table
        user_update_data = {}
        if teacher_data.name:
            user_update_data['full_name'] = teacher_data.name
        if teacher_data.email:
            user_update_data['email'] = teacher_data.email
        if teacher_data.role:
            user_update_data['role'] = teacher_data.role
        
        if user_update_data:
            user_result = supabase.table('users').update(user_update_data).eq('id', user_id).execute()
            if not user_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user"
                )
        
        # Cập nhật teachers table
        teacher_update_data = {}
        if teacher_data.phone:
            teacher_update_data['phone'] = teacher_data.phone
        if teacher_data.address:
            teacher_update_data['address'] = teacher_data.address
        if teacher_data.specialization:
            teacher_update_data['specialization'] = teacher_data.specialization
        if teacher_data.experience_years:
            teacher_update_data['experience_years'] = teacher_data.experience_years
        if teacher_data.education_level:
            teacher_update_data['education_level'] = teacher_data.education_level
        if teacher_data.degree_name:
            teacher_update_data['degree_name'] = teacher_data.degree_name
        
        if teacher_update_data:
            teacher_result = supabase.table('teachers').update(teacher_update_data).eq('id', teacher_id).execute()
            if not teacher_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update teacher"
                )
        
        # Lấy thông tin cập nhật với join
        updated_teacher = supabase.table('teachers').select('*, users(full_name, email)').eq('id', teacher_id).execute()
        if not updated_teacher.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated teacher"
            )
        
        teacher_data_result = updated_teacher.data[0]
        return TeacherResponse(
            id=teacher_data_result['id'],
            user_id=teacher_data_result['user_id'],
            teacher_code=teacher_data_result['teacher_code'],
            phone=teacher_data_result.get('phone'),
            address=teacher_data_result.get('address'),
            specialization=teacher_data_result.get('specialization'),
            experience_years=teacher_data_result.get('experience_years'),
            created_at=teacher_data_result['created_at'],
            updated_at=teacher_data_result.get('updated_at'),
            name=teacher_data_result['users']['full_name'] if teacher_data_result.get('users') else None,
            email=teacher_data_result['users']['email'] if teacher_data_result.get('users') else None
        )
        
    except Exception as e:
        print(f"Error updating teacher: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher: {str(e)}"
        )

@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa giáo viên (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Kiểm tra giáo viên có tồn tại không
    existing_teacher = supabase.table('teachers').select('id').eq('id', teacher_id).execute()
    if not existing_teacher.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    # Xóa giáo viên
    result = supabase.table('teachers').delete().eq('id', teacher_id).execute()
    return {"message": "Teacher deleted successfully"}

@router.get("/search/{query}", response_model=List[TeacherResponse])
async def search_teachers(
    query: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tìm kiếm giáo viên"""
    result = supabase.table('teachers').select('*').or_(
        f'name.ilike.%{query}%,email.ilike.%{query}%,subject.ilike.%{query}%'
    ).order('created_at', desc=True).execute()
    return result.data or []

@router.get("/stats/overview")
async def get_teacher_stats(
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thống kê giáo viên"""
    # Tổng số giáo viên
    total_teachers = supabase.table('teachers').select('id', count='exact').execute()
    
    # Giáo viên theo bộ môn
    departments = supabase.table('teachers').select('department').execute()
    department_stats = {}
    if departments.data:
        for teacher in departments.data:
            dept = teacher.get('department', 'Chưa phân loại')
            department_stats[dept] = department_stats.get(dept, 0) + 1
    
    return {
        "total_teachers": total_teachers.count or 0,
        "departments": department_stats,
        "average_salary": 0,  # TODO: Calculate average salary
        "recent_hires": 0     # TODO: Calculate recent hires
    }

@router.get("/test")
async def test_teachers():
    """Test endpoint"""
    return {"message": "Teachers API is working", "status": "success"}

@router.get("/simple-test")
async def test_teachers_simple():
    """Test endpoint (no auth)"""
    return {"message": "Teachers API simple test", "status": "success"}

@router.post("/create-sample")
async def create_sample_teachers(
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tạo dữ liệu mẫu cho giáo viên"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    sample_teachers = [
        {
            "name": "Nguyễn Văn An",
            "email": "an.nguyen@school.edu",
            "phone": "0123456789",
            "subject": "Toán học",
            "department": "Khoa học Tự nhiên",
            "salary": 15000000
        },
        {
            "name": "Trần Thị Bình",
            "email": "binh.tran@school.edu",
            "phone": "0987654321",
            "subject": "Vật lý",
            "department": "Khoa học Tự nhiên",
            "salary": 16000000
        },
        {
            "name": "Lê Văn Cường",
            "email": "cuong.le@school.edu",
            "phone": "0369258147",
            "subject": "Hóa học",
            "department": "Khoa học Tự nhiên",
            "salary": 15500000
        }
    ]
    
    result = supabase.table('teachers').insert(sample_teachers).execute()
    return {"message": f"Created {len(result.data)} sample teachers", "data": result.data}