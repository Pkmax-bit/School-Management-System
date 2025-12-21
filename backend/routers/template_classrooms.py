"""
Template Classrooms Router
Router cho quản lý lớp học mẫu (template)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from typing import List, Optional
from pydantic import BaseModel, constr, conint
from supabase import Client
from uuid import UUID
import json

from database import get_db
from routers.auth import get_current_user
from .classrooms import ClassroomCreate, ClassroomResponse

router = APIRouter()


class TemplateClassroomCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    code: Optional[constr(strip_whitespace=True, min_length=1, max_length=50)] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[conint(strict=True, ge=1)] = None


class TemplateClassroomUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[int] = None


class TemplateClassroomResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[str] = None
    capacity: Optional[int] = None
    is_template: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class CreateClassroomFromTemplate(BaseModel):
    template_id: str
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    code: constr(strip_whitespace=True, min_length=1, max_length=50)
    description: Optional[str] = None
    teacher_id: Optional[str] = None
    subject_id: Optional[str] = None
    campus_id: Optional[str] = None
    capacity: Optional[conint(strict=True, ge=1)] = None
    tuition_per_session: Optional[float] = None
    sessions_per_week: Optional[int] = None
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    copy_lessons: bool = True
    copy_assignments: bool = True
    student_ids: Optional[List[str]] = None


class TemplateUsageResponse(BaseModel):
    id: str
    template_id: str
    created_classroom_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=TemplateClassroomResponse)
async def create_template(
    template_data: TemplateClassroomCreate,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Tạo lớp học mẫu mới (chỉ admin và teacher)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Chuẩn hóa input
    normalized_name = template_data.name.strip()
    normalized_code = template_data.code.strip() if template_data.code else None
    normalized_description = template_data.description or None
    normalized_subject_id = template_data.subject_id or None
    normalized_capacity = template_data.capacity

    # Tạo code tự động nếu không có
    if not normalized_code:
        # Lấy tất cả code dạng Template####
        codes_res = (
            supabase.table("classrooms")
            .select("code")
            .ilike("code", "Template%")
            .eq("is_template", True)
            .limit(1000)
            .execute()
        )
        max_num = 0
        if codes_res.data:
            for row in codes_res.data:
                code = (row.get("code") or "").strip()
                if code.startswith("Template"):
                    suffix = code[8:]
                    if suffix.isdigit() and len(suffix) == 4:
                        try:
                            max_num = max(max_num, int(suffix))
                        except Exception:
                            pass
        # Tìm mã tiếp theo
        attempt = 1
        while True:
            candidate = f"Template{attempt:04d}"
            dup = (
                supabase.table("classrooms")
                .select("id")
                .eq("code", candidate)
                .execute()
            )
            if not dup.data:
                normalized_code = candidate
                break
            attempt += 1

    # Kiểm tra code đã tồn tại chưa
    existing = (
        supabase.table("classrooms")
        .select("id")
        .eq("code", normalized_code)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template code already exists"
        )

    # Kiểm tra subject có tồn tại không (nếu có)
    if normalized_subject_id:
        subject = (
            supabase.table("subjects")
            .select("id")
            .eq("id", normalized_subject_id)
            .execute()
        )
        if not subject.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

    insert_payload = {
        "name": normalized_name,
        "code": normalized_code,
        "description": normalized_description,
        "subject_id": normalized_subject_id,
        "capacity": normalized_capacity,
        "is_template": True,  # Đánh dấu là template
    }

    result = supabase.table("classrooms").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )
    return result.data[0]


@router.get("/", response_model=List[TemplateClassroomResponse])
async def get_templates(
    skip: int = 0,
    limit: int = 100,
    subject_id: Optional[str] = None,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách lớp học mẫu"""
    query = supabase.table("classrooms").select("*").eq("is_template", True)
    
    if subject_id:
        query = query.eq("subject_id", subject_id)
    
    result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    return result.data or []


@router.get("/{template_id}", response_model=TemplateClassroomResponse)
async def get_template(
    template_id: str,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy thông tin một lớp học mẫu"""
    result = (
        supabase.table("classrooms")
        .select("*")
        .eq("id", template_id)
        .eq("is_template", True)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return result.data[0]


@router.put("/{template_id}", response_model=TemplateClassroomResponse)
async def update_template(
    template_id: str,
    template_data: TemplateClassroomUpdate,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Cập nhật thông tin lớp học mẫu (chỉ admin và teacher)"""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Kiểm tra template có tồn tại không
    existing = (
        supabase.table("classrooms")
        .select("id, is_template")
        .eq("id", template_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    if not existing.data[0].get("is_template"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a template"
        )

    # Kiểm tra code trùng nếu thay đổi
    if template_data.code:
        code_check = (
            supabase.table("classrooms")
            .select("id")
            .eq("code", template_data.code)
            .neq("id", template_id)
            .execute()
        )
        if code_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template code already exists"
            )

    # Kiểm tra subject tồn tại nếu thay đổi
    if template_data.subject_id:
        subject = (
            supabase.table("subjects")
            .select("id")
            .eq("id", template_data.subject_id)
            .execute()
        )
        if not subject.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

    update_data = template_data.dict(exclude_unset=True)
    result = (
        supabase.table("classrooms")
        .update(update_data)
        .eq("id", template_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )
    return result.data[0]


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Xóa lớp học mẫu (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    existing = (
        supabase.table("classrooms")
        .select("id, is_template")
        .eq("id", template_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    if not existing.data[0].get("is_template"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a template"
        )

    result = supabase.table("classrooms").delete().eq("id", template_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/create-classroom", response_model=ClassroomResponse)
async def create_classroom_from_template(
    template_id: str,
    classroom_data: CreateClassroomFromTemplate,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Tạo lớp học mới từ template (copy lessons và assignments)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Kiểm tra template có tồn tại không
    template_result = (
        supabase.table("classrooms")
        .select("*")
        .eq("id", template_id)
        .eq("is_template", True)
        .execute()
    )
    if not template_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    template = template_result.data[0]

    # Validate classroom code
    import re
    normalized_code = classroom_data.code.strip()
    if not re.match(r'^Class\d{4}$', normalized_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classroom code must be in format Class0001, Class0002, etc."
        )
    
    # Kiểm tra code đã tồn tại chưa
    existing = (
        supabase.table("classrooms")
        .select("id")
        .eq("code", normalized_code)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Classroom code already exists"
        )

    # Kiểm tra teacher, subject, campus nếu có
    if classroom_data.teacher_id:
        teacher = (
            supabase.table("teachers")
            .select("id")
            .eq("id", classroom_data.teacher_id)
            .execute()
        )
        if not teacher.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )

    if classroom_data.subject_id:
        subject = (
            supabase.table("subjects")
            .select("id")
            .eq("id", classroom_data.subject_id)
            .execute()
        )
        if not subject.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )

    if classroom_data.campus_id:
        campus = (
            supabase.table("campuses")
            .select("id")
            .eq("id", classroom_data.campus_id)
            .execute()
        )
        if not campus.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campus not found"
            )

    # Tạo lớp học mới
    insert_payload = {
        "name": classroom_data.name.strip(),
        "code": normalized_code,
        "description": classroom_data.description if hasattr(classroom_data, 'description') and classroom_data.description else template.get("description"),
        "capacity": classroom_data.capacity or template.get("capacity") or 30,
        "teacher_id": classroom_data.teacher_id,
        "subject_id": classroom_data.subject_id or template.get("subject_id"),
        "campus_id": classroom_data.campus_id,
        "tuition_per_session": classroom_data.tuition_per_session or 50000,
        "sessions_per_week": classroom_data.sessions_per_week or 2,
        "open_date": classroom_data.open_date or None,
        "close_date": classroom_data.close_date or None,
        "is_template": False,  # Lớp học thực tế
    }

    result = supabase.table("classrooms").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create classroom"
        )
    
    created_classroom = result.data[0]
    created_classroom_id = created_classroom["id"]

    # Copy lessons nếu được yêu cầu
    if classroom_data.copy_lessons:
        lessons_result = (
            supabase.table("lessons")
            .select("*")
            .eq("classroom_id", template_id)
            .execute()
        )
        
        if lessons_result.data:
            for lesson in lessons_result.data:
                # Copy lesson files
                lesson_files_result = (
                    supabase.table("lesson_files")
                    .select("*")
                    .eq("lesson_id", lesson["id"])
                    .execute()
                )
                
                # Tạo lesson mới
                new_lesson = {
                    "classroom_id": created_classroom_id,
                    "title": lesson["title"],
                    "description": lesson.get("description"),
                    "file_url": lesson.get("file_url"),
                    "file_name": lesson.get("file_name"),
                    "storage_path": lesson.get("storage_path"),
                    "sort_order": lesson.get("sort_order", 0),
                    "shared_classroom_ids": [],
                    "available_at": lesson.get("available_at"),
                    "assignment_id": None,  # Sẽ xử lý sau nếu copy assignments
                }
                
                new_lesson_result = supabase.table("lessons").insert(new_lesson).execute()
                if new_lesson_result.data:
                    new_lesson_id = new_lesson_result.data[0]["id"]
                    
                    # Copy lesson files
                    if lesson_files_result.data:
                        for lesson_file in lesson_files_result.data:
                            new_lesson_file = {
                                "lesson_id": new_lesson_id,
                                "file_url": lesson_file.get("file_url"),
                                "file_name": lesson_file.get("file_name"),
                                "storage_path": lesson_file.get("storage_path"),
                                "file_size": lesson_file.get("file_size"),
                                "file_type": lesson_file.get("file_type"),
                                "sort_order": lesson_file.get("sort_order", 0),
                            }
                            supabase.table("lesson_files").insert(new_lesson_file).execute()

    # Copy assignments nếu được yêu cầu
    assignment_mapping = {}  # Map old assignment_id -> new assignment_id
    if classroom_data.copy_assignments:
        # Lấy tất cả assignments của template
        template_assignments_result = (
            supabase.table("assignment_classrooms")
            .select("assignment_id")
            .eq("classroom_id", template_id)
            .execute()
        )
        
        if template_assignments_result.data:
            assignment_ids = [item["assignment_id"] for item in template_assignments_result.data]
            
            # Lấy chi tiết assignments
            assignments_result = (
                supabase.table("assignments")
                .select("*")
                .in_("id", assignment_ids)
                .execute()
            )
            
            for assignment in assignments_result.data:
                # Tạo assignment mới
                new_assignment = {
                    "title": assignment["title"],
                    "description": assignment.get("description"),
                    "subject_id": classroom_data.subject_id or assignment.get("subject_id"),
                    "teacher_id": classroom_data.teacher_id or assignment.get("teacher_id"),
                    "assignment_type": assignment["assignment_type"],
                    "total_points": assignment.get("total_points", 100.0),
                    "due_date": assignment.get("due_date"),
                    "is_active": assignment.get("is_active", True),
                    "time_limit_minutes": assignment.get("time_limit_minutes", 0),
                    "attempts_allowed": assignment.get("attempts_allowed", 1),
                    "shuffle_questions": assignment.get("shuffle_questions", False),
                }
                
                new_assignment_result = supabase.table("assignments").insert(new_assignment).execute()
                if new_assignment_result.data:
                    new_assignment_id = new_assignment_result.data[0]["id"]
                    old_assignment_id = assignment["id"]
                    assignment_mapping[old_assignment_id] = new_assignment_id
                    
                    # Gán assignment cho lớp mới
                    supabase.table("assignment_classrooms").insert({
                        "assignment_id": new_assignment_id,
                        "classroom_id": created_classroom_id,
                    }).execute()
                    
                    # Copy assignment questions
                    questions_result = (
                        supabase.table("assignment_questions")
                        .select("*")
                        .eq("assignment_id", old_assignment_id)
                        .order("order_index")
                        .execute()
                    )
                    
                    if questions_result.data:
                        for question in questions_result.data:
                            new_question = {
                                "assignment_id": new_assignment_id,
                                "question_text": question["question_text"],
                                "question_type": question["question_type"],
                                "points": question.get("points", 1.0),
                                "options": question.get("options"),
                                "correct_answer": question.get("correct_answer"),
                                "order_index": question.get("order_index", 0),
                            }
                            supabase.table("assignment_questions").insert(new_question).execute()
            
            # Cập nhật assignment_id trong lessons nếu có
            if assignment_mapping and classroom_data.copy_lessons:
                lessons_result = (
                    supabase.table("lessons")
                    .select("*")
                    .eq("classroom_id", created_classroom_id)
                    .execute()
                )
                
                for lesson in lessons_result.data:
                    if lesson.get("assignment_id") and lesson["assignment_id"] in assignment_mapping:
                        supabase.table("lessons").update({
                            "assignment_id": assignment_mapping[lesson["assignment_id"]]
                        }).eq("id", lesson["id"]).execute()

    # Gán học sinh nếu có
    if classroom_data.student_ids:
        ids = [sid for sid in classroom_data.student_ids if sid and sid.strip()]
        if ids:
            supabase.table("students").update({"classroom_id": created_classroom_id}).in_("id", ids).execute()

    # Lưu lịch sử sử dụng template
    try:
        supabase.table("template_usage").insert({
            "template_id": template_id,
            "created_classroom_id": created_classroom_id,
            "created_by": current_user.id,
            "notes": f"Created from template: {template.get('name')}",
        }).execute()
    except Exception as e:
        print(f"Failed to log template usage: {e}")

    return created_classroom


@router.get("/{template_id}/usage", response_model=List[TemplateUsageResponse])
async def get_template_usage(
    template_id: str,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy lịch sử sử dụng template"""
    # Kiểm tra template có tồn tại không
    template_result = (
        supabase.table("classrooms")
        .select("id")
        .eq("id", template_id)
        .eq("is_template", True)
        .execute()
    )
    if not template_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    result = (
        supabase.table("template_usage")
        .select("*")
        .eq("template_id", template_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{template_id}/lessons")
async def get_template_lessons(
    template_id: str,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách bài học của template"""
    # Kiểm tra template có tồn tại không
    template_result = (
        supabase.table("classrooms")
        .select("id")
        .eq("id", template_id)
        .eq("is_template", True)
        .execute()
    )
    if not template_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    result = (
        supabase.table("lessons")
        .select("*")
        .eq("classroom_id", template_id)
        .order("sort_order")
        .execute()
    )
    return result.data or []


@router.get("/{template_id}/assignments")
async def get_template_assignments(
    template_id: str,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách bài tập của template"""
    # Kiểm tra template có tồn tại không
    template_result = (
        supabase.table("classrooms")
        .select("id")
        .eq("id", template_id)
        .eq("is_template", True)
        .execute()
    )
    if not template_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Lấy assignments từ assignment_classrooms
    class_result = (
        supabase.table("assignment_classrooms")
        .select("assignment_id")
        .eq("classroom_id", template_id)
        .execute()
    )
    
    if not class_result.data:
        return []
    
    assignment_ids = [item["assignment_id"] for item in class_result.data]
    
    # Lấy chi tiết assignments
    assignments_result = (
        supabase.table("assignments")
        .select("id, title, description, assignment_type, total_points, due_date")
        .in_("id", assignment_ids)
        .order("created_at", desc=True)
        .execute()
    )
    
    return assignments_result.data or []

