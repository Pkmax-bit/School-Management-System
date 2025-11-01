"""
Classrooms Router
Router cho quản lý lớp học (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, constr, conint
from supabase import Client

from database import get_db
from routers.auth import get_current_user

router = APIRouter()


class ClassroomCreate(BaseModel):
    # name: varchar(255) not null
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    # code: varchar(50) not null unique
    code: constr(strip_whitespace=True, min_length=1, max_length=50)
    # description: text null
    description: Optional[str] = None
    # capacity: integer null default 30
    capacity: Optional[conint(strict=True, ge=1)] = 30
    # teacher_id: uuid null (FK)
    teacher_id: Optional[str] = None
    # subject_id: uuid null (FK)
    subject_id: Optional[str] = None
    # campus_id: uuid null (FK)
    campus_id: Optional[str] = None
    # tuition_per_session: học phí mỗi buổi
    tuition_per_session: Optional[float] = 50000
    # sessions_per_week: số buổi mỗi tuần
    sessions_per_week: Optional[int] = 2
    # optional list of students to assign to this classroom upon creation
    student_ids: Optional[List[str]] = None
    # dates
    open_date: Optional[str] = None
    close_date: Optional[str] = None


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    teacher_id: Optional[str] = None
    subject_id: Optional[str] = None
    campus_id: Optional[str] = None
    tuition_per_session: Optional[float] = None
    sessions_per_week: Optional[int] = None
    open_date: Optional[str] = None
    close_date: Optional[str] = None


class ClassroomResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    capacity: Optional[int] = 30
    teacher_id: Optional[str] = None
    subject_id: Optional[str] = None
    campus_id: Optional[str] = None
    tuition_per_session: Optional[float] = 50000
    sessions_per_week: Optional[int] = 2
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=ClassroomResponse)
async def create_classroom(
    classroom_data: ClassroomCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Tạo lớp học mới (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Chuẩn hóa input
    normalized_name = classroom_data.name.strip()
    normalized_code = classroom_data.code.strip()
    normalized_description = (classroom_data.description or None)
    normalized_capacity = classroom_data.capacity or 30
    normalized_teacher_id = classroom_data.teacher_id or None
    normalized_subject_id = classroom_data.subject_id or None
    normalized_campus_id = classroom_data.campus_id or None

    # Tạo code tự động nếu client gửi Class
    if normalized_code.lower() == "class":
        # Lấy tất cả code dạng Class#### (giới hạn để an toàn)
        codes_res = supabase.table("classrooms").select("code").ilike("code", "Class%").limit(1000).execute()
        max_num = 0
        if codes_res.data:
            for row in codes_res.data:
                code = (row.get("code") or "").strip()
                if code.startswith("Class"):
                    suffix = code[5:]
                    if suffix.isdigit() and len(suffix) == 4:  # Đảm bảo đúng format 4 chữ số
                        try:
                            max_num = max(max_num, int(suffix))
                        except Exception:
                            pass
        # Bắt đầu từ Class0001, tăng dần
        attempt = 1
        while True:
            candidate = f"Class{attempt:04d}"
            dup = supabase.table("classrooms").select("id").eq("code", candidate).execute()
            if not dup.data:
                normalized_code = candidate
                break
            attempt += 1
    else:
        # Kiểm tra format mã lớp (Class0001, Class0002, ...)
        import re
        if not re.match(r'^Class\d{4}$', normalized_code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom code must be in format Class0001, Class0002, etc.")
        
        # Kiểm tra code đã tồn tại chưa (unique constraint)
        existing = supabase.table("classrooms").select("id").eq("code", normalized_code).execute()
        if existing.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom code already exists")

    # Kiểm tra teacher có tồn tại không (nếu có)
    if normalized_teacher_id:
        teacher = supabase.table("teachers").select("id").eq("id", normalized_teacher_id).execute()
        if not teacher.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    # Kiểm tra subject có tồn tại không (nếu có)
    if normalized_subject_id:
        subject = supabase.table("subjects").select("id").eq("id", normalized_subject_id).execute()
        if not subject.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Kiểm tra campus có tồn tại không (nếu có)
    if normalized_campus_id:
        campus = supabase.table("campuses").select("id").eq("id", normalized_campus_id).execute()
        if not campus.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")

    insert_payload = {
        "name": normalized_name,
        "code": normalized_code,
        "description": normalized_description,
        "capacity": normalized_capacity,
        "teacher_id": normalized_teacher_id,
        "subject_id": normalized_subject_id,
        "campus_id": normalized_campus_id,
        "tuition_per_session": classroom_data.tuition_per_session or 50000,
        "sessions_per_week": classroom_data.sessions_per_week or 2,
        "open_date": classroom_data.open_date or None,
        "close_date": classroom_data.close_date or None,
    }

    result = supabase.table("classrooms").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create classroom")
    created_classroom = result.data[0]

    # Assign students to this classroom if provided
    if classroom_data.student_ids:
        # Only keep non-empty ids
        ids = [sid for sid in classroom_data.student_ids if sid and sid.strip()]
        if ids:
            supabase.table("students").update({"classroom_id": created_classroom["id"]}).in_("id", ids).execute()

    return created_classroom


@router.get("/", response_model=List[ClassroomResponse])
async def get_classrooms(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách lớp học"""
    query = supabase.table("classrooms").select("*")
    if teacher_id:
        query = query.eq("teacher_id", teacher_id)
    if campus_id:
        query = query.eq("campus_id", campus_id)
    result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    return result.data or []


@router.get("/{classroom_id}", response_model=ClassroomResponse)
async def get_classroom(
    classroom_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy thông tin một lớp học"""
    result = supabase.table("classrooms").select("*").eq("id", classroom_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    return result.data[0]


@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: str,
    classroom_data: ClassroomUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Cập nhật thông tin lớp học (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Tồn tại lớp?
    existing = supabase.table("classrooms").select("id").eq("id", classroom_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    # Kiểm tra code trùng nếu thay đổi
    if classroom_data.code:
        # Kiểm tra format mã lớp (Class0001, Class0002, ...)
        import re
        if not re.match(r'^Class\d{4}$', classroom_data.code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom code must be in format Class0001, Class0002, etc.")
        
        code_check = (
            supabase.table("classrooms").select("id").eq("code", classroom_data.code).neq("id", classroom_id).execute()
        )
        if code_check.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom code already exists")

    # Kiểm tra teacher tồn tại nếu thay đổi teacher_id
    if classroom_data.teacher_id:
        teacher = supabase.table("teachers").select("id").eq("id", classroom_data.teacher_id).execute()
        if not teacher.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    # Kiểm tra subject tồn tại nếu thay đổi subject_id
    if classroom_data.subject_id:
        subject = supabase.table("subjects").select("id").eq("id", classroom_data.subject_id).execute()
        if not subject.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Kiểm tra campus tồn tại nếu thay đổi campus_id
    if classroom_data.campus_id:
        campus = supabase.table("campuses").select("id").eq("id", classroom_data.campus_id).execute()
        if not campus.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")

    update_data = classroom_data.dict(exclude_unset=True)
    result = supabase.table("classrooms").update(update_data).eq("id", classroom_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update classroom")
    return result.data[0]


@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Xóa lớp học (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    existing = supabase.table("classrooms").select("id").eq("id", classroom_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    result = supabase.table("classrooms").delete().eq("id", classroom_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete classroom")
    return {"message": "Classroom deleted successfully"}


# ----- Students management within classroom -----
class ClassroomAssignStudents(BaseModel):
    student_ids: List[str]


@router.get("/next-code")
async def get_next_class_code(
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy mã lớp tiếp theo (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Lấy tất cả code dạng Class#### (giới hạn để an toàn)
    codes_res = supabase.table("classrooms").select("code").ilike("code", "Class%").limit(1000).execute()
    max_num = 0
    if codes_res.data:
        for row in codes_res.data:
            code = (row.get("code") or "").strip()
            if code.startswith("Class"):
                suffix = code[5:]  # Lấy phần sau "Class"
                if suffix.isdigit() and len(suffix) == 4:  # Đảm bảo đúng format 4 chữ số
                    try:
                        max_num = max(max_num, int(suffix))
                    except Exception:
                        pass
    
    # Tìm mã tiếp theo có sẵn
    attempt = 1
    while True:
        candidate = f"Class{attempt:04d}"
        dup = supabase.table("classrooms").select("id").eq("code", candidate).execute()
        if not dup.data:
            return {"next_code": candidate}
        attempt += 1

@router.post("/{classroom_id}/students")
async def add_students_to_classroom(
    classroom_id: str,
    payload: ClassroomAssignStudents,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Thêm nhiều học sinh vào lớp (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Check classroom exists
    existing = supabase.table("classrooms").select("id").eq("id", classroom_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    ids = [sid for sid in (payload.student_ids or []) if sid and sid.strip()]
    if not ids:
        return {"updated": 0}

    # Update students' classroom_id
    update_result = supabase.table("students").update({"classroom_id": classroom_id}).in_("id", ids).execute()

    # Supabase python client doesn't return affected count reliably; fetch to count
    updated_students = supabase.table("students").select("id").eq("classroom_id", classroom_id).in_("id", ids).execute()
    return {"updated": len(updated_students.data or [])}


