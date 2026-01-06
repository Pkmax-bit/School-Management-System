"""
Lessons Router
Router cho quản lý bài học (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from supabase import Client

from database import get_db
from models.user import User, UserRole
from models.lesson import Lesson, LessonCreate, LessonUpdate
from routers.auth import get_current_user

router = APIRouter()


def get_teacher_id_from_user(supabase: Client, user_id: str) -> Optional[str]:
    """Lấy teacher_id từ user_id"""
    try:
        result = supabase.table("teachers").select("id").eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        return None
    except Exception as e:
        print(f"Error getting teacher_id: {e}")
        return None


def validate_classroom_access(
    supabase: Client,
    classroom_id: str,
    current_user: User
) -> bool:
    """Kiểm tra giáo viên có quyền truy cập classroom không"""
    if current_user.role == UserRole.ADMIN:
        return True

    if current_user.role == UserRole.TEACHER:
        # Lấy teacher_id từ user
        teacher_id = get_teacher_id_from_user(supabase, current_user.id)
        if not teacher_id:
            return False

        # Kiểm tra classroom có thuộc về giáo viên này không
        classroom_result = supabase.table("classrooms").select("teacher_id").eq("id", classroom_id).execute()
        if not classroom_result.data:
            return False

        classroom_teacher_id = classroom_result.data[0].get("teacher_id")
        return classroom_teacher_id == teacher_id

    return False


def validate_lesson_access(
    supabase: Client,
    lesson_id: str,
    current_user: User
) -> bool:
    """Kiểm tra giáo viên có quyền truy cập lesson không"""
    if current_user.role == UserRole.ADMIN:
        return True

    if current_user.role == UserRole.TEACHER:
        # Lấy teacher_id từ user
        teacher_id = get_teacher_id_from_user(supabase, current_user.id)
        if not teacher_id:
            return False

        # Kiểm tra lesson thông qua classroom
        lesson_result = supabase.table("lessons").select("classroom_id").eq("id", lesson_id).execute()
        if not lesson_result.data:
            return False

        classroom_id = lesson_result.data[0].get("classroom_id")
        return validate_classroom_access(supabase, classroom_id, current_user)

    return False


# ========== Request/Response Models ==========


class CopyLessonsRequest(BaseModel):
    lesson_ids: List[str]
    target_classroom_id: str


class CopyLessonsResponse(BaseModel):
    copied_count: int
    errors: List[str] = []


# ========== Routes ==========

@router.get("/classroom/{classroom_id}", response_model=List[Lesson])
async def get_lessons_by_classroom(
    classroom_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách bài học theo lớp học"""
    # Kiểm tra quyền truy cập
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )

    # Nếu là giáo viên hoặc admin, kiểm tra quyền truy cập classroom
    if current_user.role in [UserRole.ADMIN, UserRole.TEACHER]:
        if not validate_classroom_access(supabase, classroom_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền truy cập lớp học này"
            )

    # Nếu là học sinh, kiểm tra xem có thuộc lớp này không
    if current_user.role == UserRole.STUDENT:
        student_result = supabase.table("students").select("classroom_id").eq("user_id", current_user.id).execute()
        if not student_result.data or student_result.data[0].get("classroom_id") != classroom_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không thuộc lớp học này"
            )

    try:
        # Lấy lessons theo classroom_id, sắp xếp theo sort_order và created_at
        result = supabase.table("lessons").select("*").eq("classroom_id", classroom_id).execute()

        lessons = result.data or []

        # Sắp xếp lessons
        lessons.sort(key=lambda x: (x.get('sort_order', 0), x.get('created_at', '')))

        return lessons

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tải danh sách bài học: {str(e)}"
        )


@router.post("/", response_model=Lesson)
async def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tạo bài học mới"""
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể tạo bài học"
        )

    # Kiểm tra quyền truy cập classroom
    if not validate_classroom_access(supabase, lesson_data.classroom_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền tạo bài học cho lớp học này"
        )

    try:
        # Chuẩn bị dữ liệu
        lesson_dict = lesson_data.dict()
        lesson_dict["created_at"] = datetime.utcnow().isoformat()
        lesson_dict["updated_at"] = datetime.utcnow().isoformat()

        # Handle backward compatibility: if single file fields are provided, convert to arrays
        if lesson_dict.get("file_url") and not lesson_dict.get("file_urls"):
            lesson_dict["file_urls"] = [lesson_dict["file_url"]]
            lesson_dict["file_names"] = [lesson_dict["file_name"]]
            lesson_dict["storage_paths"] = [lesson_dict["storage_path"]]

        # Ensure arrays are not None
        lesson_dict["file_urls"] = lesson_dict.get("file_urls") or []
        lesson_dict["file_names"] = lesson_dict.get("file_names") or []
        lesson_dict["storage_paths"] = lesson_dict.get("storage_paths") or []
        lesson_dict["youtube_urls"] = lesson_dict.get("youtube_urls") or []
        lesson_dict["shared_classroom_ids"] = lesson_dict.get("shared_classroom_ids") or []

        # Tạo lesson
        result = supabase.table("lessons").insert(lesson_dict).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tạo bài học"
            )

        lesson = result.data[0]

        # Nếu có multiple files, tạo records trong lesson_files table
        file_urls = lesson.get("file_urls", [])
        file_names = lesson.get("file_names", [])
        storage_paths = lesson.get("storage_paths", [])

        if file_urls and len(file_urls) > 0:
            lesson_files_data = []
            for i, (url, name, path) in enumerate(zip(file_urls, file_names, storage_paths)):
                lesson_files_data.append({
                    "lesson_id": lesson["id"],
                    "file_url": url,
                    "file_name": name,
                    "storage_path": path,
                    "sort_order": i,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })

            if lesson_files_data:
                supabase.table("lesson_files").insert(lesson_files_data).execute()

        return lesson

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo bài học: {str(e)}"
        )


@router.put("/{lesson_id}", response_model=Lesson)
async def update_lesson(
    lesson_id: str,
    lesson_data: LessonUpdate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật bài học"""
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể cập nhật bài học"
        )

    # Kiểm tra quyền truy cập lesson
    if not validate_lesson_access(supabase, lesson_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền cập nhật bài học này"
        )

    try:
        # Chuẩn bị dữ liệu cập nhật
        update_dict = lesson_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow().isoformat()

        # Handle backward compatibility: if single file fields are provided, convert to arrays
        if update_dict.get("file_url") and not update_dict.get("file_urls"):
            update_dict["file_urls"] = [update_dict["file_url"]]
            update_dict["file_names"] = [update_dict["file_name"]]
            update_dict["storage_paths"] = [update_dict["storage_path"]]

        # Ensure arrays are not None when provided
        if "file_urls" in update_dict:
            update_dict["file_urls"] = update_dict["file_urls"] or []
        if "file_names" in update_dict:
            update_dict["file_names"] = update_dict["file_names"] or []
        if "storage_paths" in update_dict:
            update_dict["storage_paths"] = update_dict["storage_paths"] or []
        if "youtube_urls" in update_dict:
            update_dict["youtube_urls"] = update_dict["youtube_urls"] or []
        if "shared_classroom_ids" in update_dict:
            update_dict["shared_classroom_ids"] = update_dict["shared_classroom_ids"] or []

        # Cập nhật lesson
        result = supabase.table("lessons").update(update_dict).eq("id", lesson_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bài học"
            )

        lesson = result.data[0]

        # Nếu có file_urls mới, thêm vào lesson_files table
        file_urls = update_dict.get("file_urls")
        if file_urls is not None:
            file_names = update_dict.get("file_names", [])
            storage_paths = update_dict.get("storage_paths", [])

            # Get current max sort_order for this lesson
            existing_files = supabase.table("lesson_files").select("sort_order").eq("lesson_id", lesson_id).execute()
            max_sort_order = max([f.get("sort_order", 0) for f in existing_files.data or []], default=-1)

            # Add new files
            lesson_files_data = []
            for i, (url, name, path) in enumerate(zip(file_urls, file_names, storage_paths)):
                lesson_files_data.append({
                    "lesson_id": lesson_id,
                    "file_url": url,
                    "file_name": name,
                    "storage_path": path,
                    "sort_order": max_sort_order + i + 1,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })

            if lesson_files_data:
                supabase.table("lesson_files").insert(lesson_files_data).execute()

        return lesson

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật bài học: {str(e)}"
        )


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa bài học"""
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể xóa bài học"
        )

    # Kiểm tra quyền truy cập lesson
    if not validate_lesson_access(supabase, lesson_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền xóa bài học này"
        )

    try:
        # Lấy thông tin lesson để xóa file nếu cần
        lesson_result = supabase.table("lessons").select("storage_path").eq("id", lesson_id).execute()

        # Xóa lesson
        result = supabase.table("lessons").delete().eq("id", lesson_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bài học"
            )

        # TODO: Xóa file từ Supabase Storage nếu có storage_path
        # Có thể thêm logic xóa file ở đây

        return {"message": "Đã xóa bài học thành công"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa bài học: {str(e)}"
        )


@router.post("/copy", response_model=CopyLessonsResponse)
async def copy_lessons(
    copy_data: CopyLessonsRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Sao chép nhiều bài học sang lớp khác"""
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể sao chép bài học"
        )

    if not copy_data.lesson_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Danh sách bài học không được trống"
        )

    # Kiểm tra quyền truy cập tất cả lessons
    for lesson_id in copy_data.lesson_ids:
        if not validate_lesson_access(supabase, lesson_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Không có quyền truy cập bài học {lesson_id}"
            )

    # Kiểm tra quyền truy cập target classroom
    if not validate_classroom_access(supabase, copy_data.target_classroom_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền tạo bài học cho lớp đích"
        )

    try:
        # Lấy thông tin các lessons cần copy
        lessons_result = supabase.table("lessons").select("*").in_("id", copy_data.lesson_ids).execute()
        lessons_to_copy = lessons_result.data or []

        if len(lessons_to_copy) != len(copy_data.lesson_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Một số bài học không tồn tại"
            )

        copied_count = 0
        errors = []

        # Copy từng lesson
        for lesson in lessons_to_copy:
            try:
                # Tạo bản copy với classroom_id mới
                new_lesson = lesson.copy()
                new_lesson["id"] = None  # Để Supabase tạo ID mới
                new_lesson["classroom_id"] = copy_data.target_classroom_id
                new_lesson["created_at"] = datetime.utcnow().isoformat()
                new_lesson["updated_at"] = datetime.utcnow().isoformat()

                # Thêm vào danh sách shared classrooms nếu cần
                if copy_data.target_classroom_id not in new_lesson.get("shared_classroom_ids", []):
                    new_lesson["shared_classroom_ids"] = new_lesson.get("shared_classroom_ids", []) + [copy_data.target_classroom_id]

                supabase.table("lessons").insert(new_lesson).execute()
                copied_count += 1

            except Exception as e:
                errors.append(f"Lỗi sao chép bài học '{lesson.get('title', 'Unknown')}': {str(e)}")

        return CopyLessonsResponse(
            copied_count=copied_count,
            errors=errors
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi sao chép bài học: {str(e)}"
        )