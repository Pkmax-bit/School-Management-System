from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Set, Union
from uuid import UUID
from datetime import datetime
from supabase import Client
import os
import time
import traceback
import re

from database import get_db
from models.lesson import Lesson, LessonProgressCreate, LessonProgressResponse, LessonFile, LessonFileCreate
from routers.auth import get_current_user, User

router = APIRouter()


def slugify_classroom_folder(name: Optional[str], code: Optional[str], fallback: str) -> str:
    """
    Build a filesystem-safe folder name derived from classroom metadata.
    Preference order: name -> code -> fallback (classroom_id).
    """
    base_value = (name or "").strip() or (code or "").strip() or fallback
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", base_value).strip("-").lower()
    return slug or fallback


def get_teacher_classroom_ids(db: Client, user_id: str) -> Set[str]:
    """
    Return the set of classroom IDs managed by the teacher (linked via users table).
    """
    teacher_resp = (
        db.table("teachers")
        .select("id")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not teacher_resp.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher profile not found. Please contact administrator."
        )

    teacher_id = teacher_resp.data["id"]
    classrooms_resp = (
        db.table("classrooms")
        .select("id")
        .eq("teacher_id", teacher_id)
        .execute()
    )
    classrooms = {item["id"] for item in classrooms_resp.data or []}

    if not classrooms:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa được gán lớp nào để tải bài học."
        )

    return classrooms


@router.post("/upload", response_model=Lesson)
async def upload_lesson(
    classroom_id: UUID = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    sort_order: Optional[int] = Form(None),
    shared_classroom_ids: Optional[Union[str, List[str]]] = Form(None),
    available_at: Optional[str] = Form(None),
    assignment_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Upload lesson files and create a lesson record. Supports multiple files.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can upload lessons"
        )

    # Fetch classroom metadata for folder naming
    try:
        classroom_check = (
            db.table("classrooms")
            .select("id,name,code")
            .eq("id", str(classroom_id))
            .single()
            .execute()
        )
        classroom = classroom_check.data
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Classroom with id {classroom_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking classroom: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify classroom: {str(e)}"
        )

    shared_classrooms: List[str] = []
    # Normalize shared_classroom_ids: handle both string and list cases
    if shared_classroom_ids is None:
        raw_shared_ids = []
    elif isinstance(shared_classroom_ids, str):
        raw_shared_ids = [shared_classroom_ids]
    else:
        raw_shared_ids = shared_classroom_ids
    normalized_shared_ids: List[str] = []
    seen_shared_ids: Set[str] = set()
    for cls_id in raw_shared_ids:
        if not cls_id:
            continue
        cls_id_str = str(cls_id)
        if cls_id_str == str(classroom_id) or cls_id_str in seen_shared_ids:
            continue
        seen_shared_ids.add(cls_id_str)
        normalized_shared_ids.append(cls_id_str)

    # Validate accessible classrooms for teachers
    if current_user.role == "teacher":
        allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
        if str(classroom_id) not in allowed_classrooms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không được phép tải bài học cho lớp này."
            )
        if normalized_shared_ids:
            invalid = [cls_id for cls_id in normalized_shared_ids if cls_id not in allowed_classrooms]
            if invalid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn chỉ có thể gán bài học cho các lớp mình quản lý."
                )
            shared_classrooms = normalized_shared_ids
    else:
        shared_classrooms = normalized_shared_ids

    # Ensure target classrooms exist
    if shared_classrooms:
        shared_resp = (
            db.table("classrooms")
            .select("id")
            .in_("id", shared_classrooms)
            .execute()
        )
        existing_shared = {item["id"] for item in shared_resp.data or []}
        missing = set(shared_classrooms) - existing_shared
        if missing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Một hoặc nhiều lớp chia sẻ không tồn tại."
            )

    # Validate files
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required"
        )

    # Upload all files
    uploaded_files = []
    classroom_folder = slugify_classroom_folder(
        classroom.get("name") if classroom else None,
        classroom.get("code") if classroom else None,
        str(classroom_id)
    )

    try:
        for idx, file in enumerate(files):
            if not file.filename:
                continue

            file_content = await file.read()
            if not file_content:
                continue

            timestamp = int(time.time())
            safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
            storage_path = f"{classroom_folder}/{timestamp}_{idx}_{safe_filename}"

            print(f"Uploading file {idx + 1}/{len(files)} to path: {storage_path}")
            storage_response = db.storage.from_("lesson-materials").upload(
                storage_path,
                file_content,
                {"content-type": file.content_type or "application/octet-stream"}
            )
            print(f"Storage upload response: {storage_response}")

            try:
                public_url = db.storage.from_("lesson-materials").get_public_url(storage_path)
            except Exception as url_error:
                print(f"Warning: get_public_url failed: {str(url_error)}")
                supabase_url = os.getenv("SUPABASE_URL", "")
                if supabase_url:
                    public_url = f"{supabase_url}/storage/v1/object/public/lesson-materials/{storage_path}"
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to generate file URL. SUPABASE_URL not configured."
                    )

            uploaded_files.append({
                "file_url": public_url,
                "file_name": file.filename,
                "storage_path": storage_path,
                "file_size": len(file_content),
                "file_type": file.content_type,
                "sort_order": idx
            })

        if not uploaded_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid files were uploaded"
            )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"Error uploading files: {error_msg}")
        print(f"Traceback: {error_trace}")
        # Cleanup uploaded files on error
        for uploaded_file in uploaded_files:
            try:
                if uploaded_file.get("storage_path"):
                    db.storage.from_("lesson-materials").remove([uploaded_file["storage_path"]])
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {error_msg}"
        )

    # Parse available_at if provided
    available_at_datetime = None
    if available_at:
        try:
            # Parse ISO format datetime string with timezone
            # Frontend sends: "YYYY-MM-DDTHH:MM:SS+HH:MM" (with timezone offset)
            if 'Z' in available_at:
                # UTC timezone
                available_at_datetime = datetime.fromisoformat(available_at.replace('Z', '+00:00'))
            elif '+' in available_at or (available_at.count('-') >= 3 and 'T' in available_at):
                # Has timezone offset (e.g., +07:00) or ISO format with timezone
                available_at_datetime = datetime.fromisoformat(available_at)
            else:
                # Fallback: try parsing without timezone (shouldn't happen with new frontend code)
                available_at_datetime = datetime.strptime(available_at, "%Y-%m-%dT%H:%M")
        except (ValueError, AttributeError) as e:
            try:
                # Try parsing other common formats
                if ':' in available_at and 'T' in available_at:
                    available_at_datetime = datetime.strptime(available_at, "%Y-%m-%dT%H:%M")
                else:
                    raise ValueError(f"Unsupported format: {available_at}")
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid available_at format: {str(e)}. Expected ISO format (YYYY-MM-DDTHH:MM:SS+HH:MM)"
                )

    # Validate assignment_id if provided
    assignment_id_uuid = None
    if assignment_id:
        try:
            assignment_id_uuid = UUID(assignment_id)
            # Verify assignment exists and belongs to this classroom
            assignment_check = (
                db.table("assignment_classrooms")
                .select("assignment_id")
                .eq("assignment_id", str(assignment_id_uuid))
                .eq("classroom_id", str(classroom_id))
                .execute()
            )
            if not assignment_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bài tập không tồn tại hoặc không thuộc lớp này"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid assignment_id format"
            )

    # Use first file for backward compatibility (file_url, file_name, storage_path in lessons table)
    first_file = uploaded_files[0]
    
    lesson_data = {
        "classroom_id": str(classroom_id),
        "title": title,
        "description": description,
        "file_url": first_file["file_url"],
        "file_name": first_file["file_name"],
        "storage_path": first_file["storage_path"],
        "sort_order": sort_order if sort_order is not None else 0,
        "shared_classroom_ids": shared_classrooms,
        "available_at": available_at_datetime.isoformat() if available_at_datetime else None,
        "assignment_id": str(assignment_id_uuid) if assignment_id_uuid else None
    }

    try:
        print(f"Inserting lesson data: {lesson_data}")
        lesson_response = db.table("lessons").insert(lesson_data).execute()

        if not lesson_response.data or len(lesson_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create lesson record: No data returned"
            )

        lesson_id = lesson_response.data[0]["id"]

        # Insert all files into lesson_files table
        lesson_files_data = []
        for file_data in uploaded_files:
            lesson_files_data.append({
                "lesson_id": lesson_id,
                "file_url": file_data["file_url"],
                "file_name": file_data["file_name"],
                "storage_path": file_data["storage_path"],
                "file_size": file_data["file_size"],
                "file_type": file_data["file_type"],
                "sort_order": file_data["sort_order"]
            })

        if lesson_files_data:
            db.table("lesson_files").insert(lesson_files_data).execute()

        # Fetch lesson with files
        lesson_result = (
            db.table("lessons")
            .select("*")
            .eq("id", lesson_id)
            .single()
            .execute()
        )

        return lesson_result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"Error creating lesson record: {error_msg}")
        print(f"Traceback: {error_trace}")

        # If insert failed, we should cleanup the uploaded file
        if storage_path:
            try:
                db.storage.from_("lesson-materials").remove([storage_path])
                print(f"Cleaned up uploaded file: {storage_path}")
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup file {storage_path}: {str(cleanup_error)}")

        # Check for specific database errors
        if "column" in error_msg and "does not exist" in error_msg:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database schema mismatch: {error_msg}. Please contact admin."
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lesson record: {error_msg}"
        )


@router.get("/{lesson_id}", response_model=Lesson)
async def get_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get a specific lesson by ID with its files.
    """
    try:
        response = (
            db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        lesson = response.data
        
        # Fetch files for this lesson
        files_response = (
            db.table("lesson_files")
            .select("*")
            .eq("lesson_id", str(lesson_id))
            .order("sort_order")
            .execute()
        )
        
        # Add files to lesson (for backward compatibility, keep file_url, file_name, storage_path)
        lesson["files"] = files_response.data or []
        
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lesson: {str(e)}"
        )


@router.get("/classroom/{classroom_id}", response_model=List[Lesson])
async def get_lessons_by_classroom(
    classroom_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get all lessons for a specific classroom with their files.
    """
    try:
        classroom_id_str = str(classroom_id)
        filter_expr = f"classroom_id.eq.{classroom_id_str},shared_classroom_ids.cs.{{{classroom_id_str}}}"
        response = (
            db.table("lessons")
            .select("*")
            .or_(filter_expr)
            .order("sort_order")
            .order("created_at", desc=True)
            .execute()
        )
        
        lessons = response.data or []
        
        # Fetch files for all lessons
        if lessons:
            lesson_ids = [str(lesson["id"]) for lesson in lessons]
            files_response = (
                db.table("lesson_files")
                .select("*")
                .in_("lesson_id", lesson_ids)
                .order("sort_order")
                .execute()
            )
            
            # Group files by lesson_id
            files_by_lesson = {}
            for file_data in (files_response.data or []):
                lesson_id = file_data["lesson_id"]
                if lesson_id not in files_by_lesson:
                    files_by_lesson[lesson_id] = []
                files_by_lesson[lesson_id].append(file_data)
            
            # Add files to each lesson
            for lesson in lessons:
                lesson["files"] = files_by_lesson.get(str(lesson["id"]), [])
        
        return lessons
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lessons: {str(e)}"
        )


@router.put("/{lesson_id}", response_model=Lesson)
async def update_lesson(
    lesson_id: UUID,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    sort_order: Optional[int] = Form(None),
    shared_classroom_ids: Optional[Union[str, List[str]]] = Form(None),
    available_at: Optional[str] = Form(None),
    assignment_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Update a lesson. When sort_order changes, reorder other lessons.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can update lessons"
        )

    try:
        # Get current lesson
        lesson_response = (
            db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        classroom_id = lesson["classroom_id"]
        old_sort_order = lesson.get("sort_order", 0)

        # Get classroom info for file upload if needed
        classroom = None
        if file and file.filename:
            classroom_resp = (
                db.table("classrooms")
                .select("*")
                .eq("id", classroom_id)
                .single()
                .execute()
            )
            classroom = classroom_resp.data if classroom_resp.data else None

        # Validate teacher access
        if current_user.role == "teacher":
            allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
            if classroom_id not in allowed_classrooms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không được phép sửa bài học này."
                )

        # Parse available_at if provided
        available_at_datetime = None
        if available_at and available_at.strip():
            try:
                if 'Z' in available_at:
                    available_at_datetime = datetime.fromisoformat(available_at.replace('Z', '+00:00'))
                elif '+' in available_at or (available_at.count('-') >= 3 and 'T' in available_at):
                    available_at_datetime = datetime.fromisoformat(available_at)
                else:
                    available_at_datetime = datetime.strptime(available_at, "%Y-%m-%dT%H:%M")
            except (ValueError, AttributeError) as e:
                try:
                    available_at_datetime = datetime.strptime(available_at, "%Y-%m-%dT%H:%M")
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid available_at format: {str(e)}"
                    )

        # Normalize shared_classroom_ids
        shared_classrooms: List[str] = []
        if shared_classroom_ids is not None:
            if isinstance(shared_classroom_ids, str):
                raw_shared_ids = [shared_classroom_ids]
            else:
                raw_shared_ids = shared_classroom_ids
            
            normalized_shared_ids: List[str] = []
            seen_shared_ids: Set[str] = set()
            for cls_id in raw_shared_ids:
                if not cls_id:
                    continue
                cls_id_str = str(cls_id)
                if cls_id_str == classroom_id or cls_id_str in seen_shared_ids:
                    continue
                seen_shared_ids.add(cls_id_str)
                normalized_shared_ids.append(cls_id_str)

            # Validate accessible classrooms for teachers
            if current_user.role == "teacher":
                allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
                invalid = [cls_id for cls_id in normalized_shared_ids if cls_id not in allowed_classrooms]
                if invalid:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Bạn chỉ có thể gán bài học cho các lớp mình quản lý."
                    )
            shared_classrooms = normalized_shared_ids

        # Validate assignment_id if provided
        assignment_id_uuid = None
        if assignment_id:
            try:
                assignment_id_uuid = UUID(assignment_id)
                assignment_check = (
                    db.table("assignment_classrooms")
                    .select("assignment_id")
                    .eq("assignment_id", str(assignment_id_uuid))
                    .eq("classroom_id", classroom_id)
                    .execute()
                )
                if not assignment_check.data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Bài tập không tồn tại hoặc không thuộc lớp này"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid assignment_id format"
                )

        # Handle sort_order change - reorder lessons
        new_sort_order = sort_order if sort_order is not None else old_sort_order
        if new_sort_order != old_sort_order and sort_order is not None:
            # Get all lessons in the same classroom (including shared)
            all_lessons = (
                db.table("lessons")
                .select("id, sort_order, classroom_id, shared_classroom_ids")
                .or_(f"classroom_id.eq.{classroom_id},shared_classroom_ids.cs.{{{classroom_id}}}")
                .execute()
            )
            
            lessons_to_update = []
            for l in all_lessons.data or []:
                current_order = l.get("sort_order", 0)
                lesson_id_str = str(l["id"])
                
                if lesson_id_str == str(lesson_id):
                    continue  # Skip the lesson being updated
                
                # If moving forward (old < new): shift lessons between old+1 and new backward by 1
                if old_sort_order < new_sort_order:
                    if old_sort_order < current_order <= new_sort_order:
                        lessons_to_update.append({
                            "id": lesson_id_str,
                            "new_order": current_order - 1
                        })
                # If moving backward (old > new): shift lessons between new and old-1 forward by 1
                elif old_sort_order > new_sort_order:
                    if new_sort_order <= current_order < old_sort_order:
                        lessons_to_update.append({
                            "id": lesson_id_str,
                            "new_order": current_order + 1
                        })

            # Update other lessons
            for update_item in lessons_to_update:
                db.table("lessons").update({
                    "sort_order": update_item["new_order"]
                }).eq("id", update_item["id"]).execute()

        # Build update data
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if sort_order is not None:
            update_data["sort_order"] = sort_order
        if shared_classroom_ids is not None:
            update_data["shared_classroom_ids"] = shared_classrooms
        if available_at is not None:
            if available_at_datetime is not None:
                update_data["available_at"] = available_at_datetime.isoformat()
            elif available_at.strip() == "":
                # Empty string means remove available_at (set to NULL)
                update_data["available_at"] = None
        if assignment_id is not None:
            update_data["assignment_id"] = str(assignment_id_uuid) if assignment_id_uuid else None

        # Handle file update if a new file is provided
        if file and file.filename:
            try:
                file_content = await file.read()
                if file_content:
                    # Delete old file if exists
                    old_storage_path = lesson.get("storage_path")
                    if old_storage_path:
                        try:
                            db.storage.from_("lesson-materials").remove([old_storage_path])
                            print(f"Deleted old file: {old_storage_path}")
                        except Exception as cleanup_error:
                            print(f"Warning: Failed to delete old file {old_storage_path}: {str(cleanup_error)}")

                    # Upload new file
                    timestamp = int(time.time())
                    safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
                    classroom_folder = slugify_classroom_folder(
                        classroom.get("name") if classroom else None,
                        classroom.get("code") if classroom else None,
                        str(classroom_id)
                    )
                    storage_path = f"{classroom_folder}/{timestamp}_{safe_filename}"

                    print(f"Uploading new file to path: {storage_path}")
                    storage_response = db.storage.from_("lesson-materials").upload(
                        storage_path,
                        file_content,
                        {"content-type": file.content_type or "application/octet-stream"}
                    )
                    print(f"Storage upload response: {storage_response}")

                    try:
                        public_url = db.storage.from_("lesson-materials").get_public_url(storage_path)
                    except Exception as url_error:
                        print(f"Warning: get_public_url failed: {str(url_error)}")
                        supabase_url = os.getenv("SUPABASE_URL", "")
                        if supabase_url:
                            public_url = f"{supabase_url}/storage/v1/object/public/lesson-materials/{storage_path}"
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Failed to generate file URL. SUPABASE_URL not configured."
                            )

                    update_data["file_url"] = public_url
                    update_data["file_name"] = file.filename
                    update_data["storage_path"] = storage_path
            except Exception as file_error:
                print(f"Error updating file: {str(file_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to update file: {str(file_error)}"
                )

        # Update lesson
        if update_data:
            result = (
                db.table("lessons")
                .update(update_data)
                .eq("id", str(lesson_id))
                .execute()
            )
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update lesson"
                )
            
            return result.data[0]
        else:
            return lesson

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update lesson: {str(e)}"
        )


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Delete a lesson and its associated file. Automatically reorder remaining lessons.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can delete lessons"
        )

    try:
        lesson_response = (
            db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        classroom_id = lesson["classroom_id"]
        deleted_sort_order = lesson.get("sort_order", 0)

        # Validate teacher access
        if current_user.role == "teacher":
            allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
            if classroom_id not in allowed_classrooms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không được phép xóa bài học này."
                )

        # Delete file
        storage_path = lesson.get("storage_path")
        if not storage_path:
            file_url = lesson.get("file_url", "")
            if "lesson-materials/" in file_url:
                storage_path = file_url.split("lesson-materials/")[1]

        if storage_path:
            try:
                db.storage.from_("lesson-materials").remove([storage_path])
            except Exception as e:
                print(f"Warning: Failed to delete file {storage_path}: {str(e)}")

        # Delete lesson
        db.table("lessons").delete().eq("id", str(lesson_id)).execute()

        # Reorder remaining lessons - shift all lessons after deleted one up by 1
        all_lessons = (
            db.table("lessons")
            .select("id, sort_order, classroom_id, shared_classroom_ids")
            .or_(f"classroom_id.eq.{classroom_id},shared_classroom_ids.cs.{{{classroom_id}}}")
            .execute()
        )

        for l in all_lessons.data or []:
            current_order = l.get("sort_order", 0)
            if current_order > deleted_sort_order:
                db.table("lessons").update({
                    "sort_order": current_order - 1
                }).eq("id", l["id"]).execute()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete lesson: {str(e)}"
        )


class CopyLessonsRequest(BaseModel):
    lesson_ids: List[UUID]
    target_classroom_id: UUID

@router.post("/copy", status_code=status.HTTP_201_CREATED)
async def copy_lessons(
    copy_req: CopyLessonsRequest,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Copy selected lessons to another classroom.
    Duplicates files in storage to ensure independence.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can copy lessons"
        )

    # Verify target classroom
    try:
        target_classroom = (
            db.table("classrooms")
            .select("id,name,code")
            .eq("id", str(copy_req.target_classroom_id))
            .single()
            .execute()
        )
        if not target_classroom.data:
             raise HTTPException(status_code=404, detail="Target classroom not found")
        
        target_cls_data = target_classroom.data
    except Exception:
        raise HTTPException(status_code=404, detail="Target classroom not found")

    results = []
    errors = []

    for lesson_id in copy_req.lesson_ids:
        try:
            # 1. Get original lesson
            lesson_resp = db.table("lessons").select("*").eq("id", str(lesson_id)).single().execute()
            if not lesson_resp.data:
                errors.append(f"Lesson {lesson_id} not found")
                continue
            
            original_lesson = lesson_resp.data
            original_path = original_lesson.get("storage_path")
            
            # 2. Prepare new storage path
            if original_path:
                # Generate new path in target classroom folder
                timestamp = int(time.time())
                original_filename = original_lesson.get("file_name", "unknown")
                safe_filename = original_filename.replace(" ", "_").replace("/", "_")
                
                target_folder = slugify_classroom_folder(
                    target_cls_data.get("name"),
                    target_cls_data.get("code"),
                    str(copy_req.target_classroom_id)
                )
                new_storage_path = f"{target_folder}/{timestamp}_copy_{safe_filename}"
                
                # 3. Copy file in storage
                try:
                    db.storage.from_("lesson-materials").copy(original_path, new_storage_path)
                    
                    # Get new public URL
                    try:
                        new_public_url = db.storage.from_("lesson-materials").get_public_url(new_storage_path)
                    except:
                        # Fallback URL construction
                        supabase_url = os.getenv("SUPABASE_URL", "")
                        new_public_url = f"{supabase_url}/storage/v1/object/public/lesson-materials/{new_storage_path}"
                        
                except Exception as storage_err:
                    errors.append(f"Failed to copy file for lesson {lesson_id}: {str(storage_err)}")
                    continue
            else:
                # No file to copy (shouldn't happen given schema, but handle anyway)
                new_storage_path = None
                new_public_url = original_lesson.get("file_url")

            # 4. Create new lesson record
            new_lesson_data = {
                "classroom_id": str(copy_req.target_classroom_id),
                "title": original_lesson["title"],
                "description": original_lesson.get("description"),
                "file_url": new_public_url,
                "file_name": original_lesson["file_name"],
                "storage_path": new_storage_path
            }
            
            insert_resp = db.table("lessons").insert(new_lesson_data).execute()
            if insert_resp.data:
                results.append(insert_resp.data[0])

        except Exception as e:
            errors.append(f"Error copying lesson {lesson_id}: {str(e)}")

    return {
        "copied_count": len(results),
        "results": results,
        "errors": errors
    }


@router.post("/{lesson_id}/start", response_model=LessonProgressResponse)
async def start_lesson(
    lesson_id: UUID,
    progress_data: LessonProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Lưu tiến trình khi học sinh bắt đầu học bài học.
    """
    try:
        # Verify lesson exists
        lesson_check = (
            db.table("lessons")
            .select("id, classroom_id")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        if not lesson_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )

        lesson = lesson_check.data
        # Verify classroom_id matches
        if str(progress_data.classroom_id) != str(lesson["classroom_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Classroom ID does not match lesson"
            )

        # Check if progress already exists
        existing_progress = (
            db.table("lesson_progress")
            .select("*")
            .eq("lesson_id", str(lesson_id))
            .eq("user_id", current_user.id)
            .execute()
        )

        if existing_progress.data:
            # Update last_accessed_at
            updated = (
                db.table("lesson_progress")
                .update({
                    "last_accessed_at": datetime.now().isoformat()
                })
                .eq("id", existing_progress.data[0]["id"])
                .execute()
            )
            return updated.data[0]
        else:
            # Create new progress record
            progress_data_dict = {
                "lesson_id": str(lesson_id),
                "user_id": current_user.id,
                "classroom_id": str(progress_data.classroom_id),
                "started_at": datetime.now().isoformat(),
                "last_accessed_at": datetime.now().isoformat(),
                "is_completed": False
            }
            result = db.table("lesson_progress").insert(progress_data_dict).execute()
            return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save progress: {str(e)}"
        )


@router.get("/classroom/{classroom_id}/assignments")
async def get_classroom_assignments(
    classroom_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Lấy danh sách bài tập (tự luận/trắc nghiệm) của lớp học để gắn vào bài học.
    """
    try:
        # Get assignments for this classroom
        class_result = (
            db.table("assignment_classrooms")
            .select("assignment_id")
            .eq("classroom_id", str(classroom_id))
            .execute()
        )
        
        if not class_result.data:
            return []

        assignment_ids = [item["assignment_id"] for item in class_result.data]
        
        # Get assignment details
        assignments_result = (
            db.table("assignments")
            .select("id, title, description, assignment_type, total_points, due_date")
            .in_("id", assignment_ids)
            .order("created_at", desc=True)
            .execute()
        )

        return assignments_result.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignments: {str(e)}"
        )


@router.get("/{lesson_id}/files", response_model=List[LessonFile])
async def get_lesson_files(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get all files for a specific lesson.
    """
    try:
        # Verify lesson exists
        lesson_check = (
            db.table("lessons")
            .select("id")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        if not lesson_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )

        response = (
            db.table("lesson_files")
            .select("*")
            .eq("lesson_id", str(lesson_id))
            .order("sort_order")
            .execute()
        )
        
        return response.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lesson files: {str(e)}"
        )


@router.post("/{lesson_id}/files", response_model=LessonFile)
async def add_lesson_file(
    lesson_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Add a file to an existing lesson.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can add files"
        )

    try:
        # Verify lesson exists and user has access
        lesson_response = (
            db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        classroom_id = lesson["classroom_id"]

        # Validate teacher access
        if current_user.role == "teacher":
            allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
            if classroom_id not in allowed_classrooms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không được phép thêm file vào bài học này."
                )

        # Get classroom info
        classroom_resp = (
            db.table("classrooms")
            .select("*")
            .eq("id", classroom_id)
            .single()
            .execute()
        )
        classroom = classroom_resp.data if classroom_resp.data else None

        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File name is required"
            )

        file_content = await file.read()
        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )

        # Get current max sort_order for this lesson
        existing_files = (
            db.table("lesson_files")
            .select("sort_order")
            .eq("lesson_id", str(lesson_id))
            .order("sort_order", desc=True)
            .limit(1)
            .execute()
        )
        next_sort_order = 0
        if existing_files.data and len(existing_files.data) > 0:
            next_sort_order = (existing_files.data[0].get("sort_order", 0) or 0) + 1

        # Upload file
        timestamp = int(time.time())
        safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        classroom_folder = slugify_classroom_folder(
            classroom.get("name") if classroom else None,
            classroom.get("code") if classroom else None,
            str(classroom_id)
        )
        storage_path = f"{classroom_folder}/{timestamp}_{safe_filename}"

        db.storage.from_("lesson-materials").upload(
            storage_path,
            file_content,
            {"content-type": file.content_type or "application/octet-stream"}
        )

        try:
            public_url = db.storage.from_("lesson-materials").get_public_url(storage_path)
        except Exception as url_error:
            supabase_url = os.getenv("SUPABASE_URL", "")
            if supabase_url:
                public_url = f"{supabase_url}/storage/v1/object/public/lesson-materials/{storage_path}"
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate file URL. SUPABASE_URL not configured."
                )

        # Insert file record
        file_data = {
            "lesson_id": str(lesson_id),
            "file_url": public_url,
            "file_name": file.filename,
            "storage_path": storage_path,
            "file_size": len(file_content),
            "file_type": file.content_type,
            "sort_order": next_sort_order
        }

        response = db.table("lesson_files").insert(file_data).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create file record"
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add file: {str(e)}"
        )


@router.delete("/{lesson_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson_file(
    lesson_id: UUID,
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Delete a file from a lesson.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can delete files"
        )

    try:
        # Verify lesson exists
        lesson_response = (
            db.table("lessons")
            .select("*")
            .eq("id", str(lesson_id))
            .single()
            .execute()
        )
        lesson = lesson_response.data
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        classroom_id = lesson["classroom_id"]

        # Validate teacher access
        if current_user.role == "teacher":
            allowed_classrooms = get_teacher_classroom_ids(db, current_user.id)
            if classroom_id not in allowed_classrooms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không được phép xóa file từ bài học này."
                )

        # Get file info
        file_response = (
            db.table("lesson_files")
            .select("*")
            .eq("id", str(file_id))
            .eq("lesson_id", str(lesson_id))
            .single()
            .execute()
        )
        
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")

        file_data = file_response.data
        storage_path = file_data.get("storage_path")

        # Delete from storage
        if storage_path:
            try:
                db.storage.from_("lesson-materials").remove([storage_path])
            except Exception as e:
                print(f"Warning: Failed to delete file from storage: {str(e)}")

        # Delete from database
        db.table("lesson_files").delete().eq("id", str(file_id)).execute()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
