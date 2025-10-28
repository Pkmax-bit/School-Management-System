"""
Schedules Router
Router cho quản lý thời khóa biểu (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import time
from supabase import Client

from database import get_db
from routers.auth import get_current_user

router = APIRouter()

class ScheduleCreate(BaseModel):
    classroom_id: str
    subject_id: str
    teacher_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    room: str = None

class ScheduleResponse(BaseModel):
    id: str
    classroom_id: str
    subject_id: str
    teacher_id: str
    day_of_week: int
    start_time: time
    end_time: time
    room: str
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ScheduleResponse)
async def create_schedule(
    schedule_data: ScheduleCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Tạo thời khóa biểu mới (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Kiểm tra classroom có tồn tại không
    classroom = supabase.table("classrooms").select("id").eq("id", schedule_data.classroom_id).execute()
    if not classroom.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    
    # Kiểm tra subject có tồn tại không
    subject = supabase.table("subjects").select("id").eq("id", schedule_data.subject_id).execute()
    if not subject.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    
    # Kiểm tra teacher có tồn tại không
    teacher = supabase.table("teachers").select("id").eq("id", schedule_data.teacher_id).execute()
    if not teacher.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    payload = {
        "classroom_id": schedule_data.classroom_id,
        "subject_id": schedule_data.subject_id,
        "teacher_id": schedule_data.teacher_id,
        "day_of_week": schedule_data.day_of_week,
        "start_time": schedule_data.start_time.isoformat(),
        "end_time": schedule_data.end_time.isoformat(),
        "room": schedule_data.room,
    }

    result = supabase.table("schedules").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create schedule")
    return result.data[0]

@router.get("/", response_model=List[ScheduleResponse])
async def get_schedules(
    skip: int = 0,
    limit: int = 100,
    classroom_id: Optional[str] = None,
    teacher_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    day_of_week: Optional[int] = None,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách thời khóa biểu"""
    query = supabase.table("schedules").select("""
        *,
        classrooms!inner(
            id,
            name,
            code,
            campus_id,
            campuses(
                id,
                name,
                code
            )
        ),
        subjects!inner(
            id,
            name,
            code
        ),
        teachers!inner(
            id,
            users!inner(
                full_name,
                email
            )
        )
    """)
    
    if classroom_id:
        query = query.eq("classroom_id", classroom_id)
    if teacher_id:
        query = query.eq("teacher_id", teacher_id)
    if day_of_week is not None:
        query = query.eq("day_of_week", day_of_week)
    if campus_id:
        query = query.eq("classrooms.campus_id", campus_id)
    
    result = query.order("day_of_week", desc=False).order("start_time", desc=False).range(skip, skip + limit - 1).execute()
    
    # Transform the data to match the expected format
    schedules = []
    for item in result.data or []:
        schedule = {
            "id": item["id"],
            "classroom_id": item["classroom_id"],
            "subject_id": item["subject_id"],
            "teacher_id": item["teacher_id"],
            "day_of_week": item["day_of_week"],
            "start_time": item["start_time"],
            "end_time": item["end_time"],
            "room": item["room"],
            "created_at": item["created_at"],
            "updated_at": item["updated_at"],
            "classroom": {
                "id": item["classrooms"]["id"],
                "name": item["classrooms"]["name"],
                "code": item["classrooms"]["code"],
                "campus_id": item["classrooms"]["campus_id"],
            },
            "subject": {
                "id": item["subjects"]["id"],
                "name": item["subjects"]["name"],
                "code": item["subjects"]["code"],
            },
            "teacher": {
                "id": item["teachers"]["id"],
                "name": item["teachers"]["users"]["full_name"],
                "email": item["teachers"]["users"]["email"],
            },
            "campus": {
                "id": item["classrooms"]["campuses"]["id"],
                "name": item["classrooms"]["campuses"]["name"],
                "code": item["classrooms"]["campuses"]["code"],
            } if item["classrooms"]["campuses"] else None,
        }
        schedules.append(schedule)
    
    return schedules

@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy thông tin một thời khóa biểu"""
    result = supabase.table("schedules").select("*").eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return result.data[0]

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_data: ScheduleCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Cập nhật thời khóa biểu"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Check if schedule exists
    existing = supabase.table("schedules").select("id").eq("id", schedule_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    update_data = schedule_data.dict(exclude_unset=True)
    if "start_time" in update_data:
        update_data["start_time"] = update_data["start_time"].isoformat()
    if "end_time" in update_data:
        update_data["end_time"] = update_data["end_time"].isoformat()

    result = supabase.table("schedules").update(update_data).eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update schedule")
    return result.data[0]

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Xóa thời khóa biểu (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    existing = supabase.table("schedules").select("id").eq("id", schedule_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    result = supabase.table("schedules").delete().eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete schedule")
    return {"message": "Schedule deleted successfully"}
