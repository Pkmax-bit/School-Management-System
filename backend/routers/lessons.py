from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from supabase import Client
import os
import time
import traceback
import re

from database import get_db
from models.lesson import Lesson
from routers.auth import get_current_user

router = APIRouter()


def slugify_classroom_folder(name: Optional[str], code: Optional[str], fallback: str) -> str:
    """
    Build a filesystem-safe folder name derived from classroom metadata.
    Preference order: name -> code -> fallback (classroom_id).
    """
    base_value = (name or "").strip() or (code or "").strip() or fallback
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", base_value).strip("-").lower()
    return slug or fallback


@router.post("/upload", response_model=Lesson)
async def upload_lesson(
    classroom_id: UUID = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Upload a lesson file and create a lesson record.
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

    storage_path = None
    public_url = None

    try:
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

        timestamp = int(time.time())
        safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
        classroom_folder = slugify_classroom_folder(
            classroom.get("name") if classroom else None,
            classroom.get("code") if classroom else None,
            str(classroom_id)
        )
        storage_path = f"{classroom_folder}/{timestamp}_{safe_filename}"

        print(f"Uploading file to path: {storage_path}")
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

        print(f"Public URL: {public_url}")

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"Error uploading file: {error_msg}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {error_msg}"
        )

    lesson_data = {
        "classroom_id": str(classroom_id),
        "title": title,
        "description": description,
        "file_url": public_url,
        "file_name": file.filename,
        "storage_path": storage_path
    }

    try:
        print(f"Inserting lesson data: {lesson_data}")
        response = db.table("lessons").insert(lesson_data).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create lesson record: No data returned"
            )

        return response.data[0]
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


@router.get("/classroom/{classroom_id}", response_model=List[Lesson])
async def get_lessons_by_classroom(
    classroom_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Get all lessons for a specific classroom.
    """
    try:
        response = (
            db.table("lessons")
            .select("*")
            .eq("classroom_id", str(classroom_id))
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lessons: {str(e)}"
        )


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Delete a lesson and its associated file.
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

        storage_path = lesson.get("storage_path")
        if not storage_path:
            file_url = lesson.get("file_url", "")
            if "lesson-materials/" in file_url:
                storage_path = file_url.split("lesson-materials/")[1]

        if storage_path:
            db.storage.from_("lesson-materials").remove([storage_path])

        db.table("lessons").delete().eq("id", str(lesson_id)).execute()

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
    current_user: dict = Depends(get_current_user),
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
