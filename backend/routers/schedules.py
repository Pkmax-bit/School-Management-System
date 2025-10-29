"""
Schedules Router
Router cho quản lý thời khóa biểu (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
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
    # Related data
    classroom: Optional[dict] = None
    subject: Optional[dict] = None
    teacher: Optional[dict] = None
    campus: Optional[dict] = None
    
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

    # Lấy thông tin classroom để kiểm tra campus_id
    classroom_info = supabase.table("classrooms").select("campus_id").eq("id", schedule_data.classroom_id).execute()
    if not classroom_info.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    
    campus_id = classroom_info.data[0]["campus_id"]
    
    # Kiểm tra xung đột phòng học: cùng phòng, cùng cơ sở, cùng khung giờ
    # TODO: Temporarily disabled for debugging
    # if schedule_data.room and campus_id:
    #     # Tìm các lịch học có cùng phòng, cùng cơ sở, cùng ngày trong tuần
    #     conflict_query = supabase.table("schedules").select("""
    #         id,
    #         start_time,
    #         end_time,
    #         room,
    #         classrooms!inner(
    #             campus_id
    #         )
    #     """).eq("day_of_week", schedule_data.day_of_week).eq("room", schedule_data.room)
    #     
    #     # Filter by campus_id through classroom
    #     conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
    #     
    #     if conflict_result.data:
    #         # Kiểm tra xung đột thời gian
    #         new_start_str = schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
    #         new_end_str = schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time)
    #         
    #         # Convert to time objects for comparison
    #         from datetime import time
    #         new_start = time.fromisoformat(new_start_str.split('T')[-1])
    #         new_end = time.fromisoformat(new_end_str.split('T')[-1])
    #         
    #         for existing in conflict_result.data:
    #             existing_start = time.fromisoformat(existing["start_time"])
    #             existing_end = time.fromisoformat(existing["end_time"])
    #             
    #             # Kiểm tra xung đột thời gian
    #             if (new_start < existing_end and new_end > existing_start):
    #                 raise HTTPException(
    #                     status_code=status.HTTP_400_BAD_REQUEST, 
    #                     detail=f"Phòng {schedule_data.room} đã được sử dụng trong khung giờ {existing["start_time"]} - {existing["end_time"]} tại cơ sở này. Vui lòng chọn phòng khác hoặc khung giờ khác."
    #                 )

    payload = {
        "classroom_id": schedule_data.classroom_id,
        "subject_id": schedule_data.subject_id,
        "teacher_id": schedule_data.teacher_id,
        "day_of_week": schedule_data.day_of_week,
        "start_time": schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time),
        "end_time": schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time),
        "room": schedule_data.room,
    }

    result = supabase.table("schedules").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create schedule")
    return result.data[0]

@router.get("/test")
async def test_schedules(supabase: Client = Depends(get_db)):
    """Test endpoint without authentication"""
    try:
        result = supabase.table("schedules").select("*").limit(5).execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)}

@router.get("/")
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
    try:
        # Simple query to avoid Unicode issues
        result = supabase.table("schedules").select("*").execute()
        
        # Return basic data for now
        return result.data or []
    except Exception as e:
        print(f"Error in get_schedules: {e}")
        return []

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

    # Lấy thông tin classroom để kiểm tra campus_id
    classroom_info = supabase.table("classrooms").select("campus_id").eq("id", schedule_data.classroom_id).execute()
    if not classroom_info.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    
    campus_id = classroom_info.data[0]["campus_id"]
    
    # Kiểm tra xung đột phòng học: cùng phòng, cùng cơ sở, cùng khung giờ
    # TODO: Temporarily disabled for debugging
    # if schedule_data.room and campus_id:
    #     # Tìm các lịch học có cùng phòng, cùng cơ sở, cùng ngày trong tuần (trừ lịch hiện tại)
    #     conflict_query = supabase.table("schedules").select("""
    #         id,
    #         start_time,
    #         end_time,
    #         room,
    #         classrooms!inner(
    #             campus_id
    #         )
    #     """).eq("day_of_week", schedule_data.day_of_week).eq("room", schedule_data.room).neq("id", schedule_id)
    #     
    #     # Filter by campus_id through classroom
    #     conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
    #     
    #     if conflict_result.data:
    #         # Kiểm tra xung đột thời gian
    #         new_start_str = schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
    #         new_end_str = schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time)
    #         
    #         # Convert to time objects for comparison
    #         from datetime import time
    #         new_start = time.fromisoformat(new_start_str.split('T')[-1])
    #         new_end = time.fromisoformat(new_end_str.split('T')[-1])
    #         
    #         for existing in conflict_result.data:
    #             existing_start = time.fromisoformat(existing["start_time"])
    #             existing_end = time.fromisoformat(existing["end_time"])
    #             
    #             # Kiểm tra xung đột thời gian
    #             if (new_start < existing_end and new_end > existing_start):
    #                 raise HTTPException(
    #                     status_code=status.HTTP_400_BAD_REQUEST, 
    #                     detail=f"Phòng {schedule_data.room} đã được sử dụng trong khung giờ {existing["start_time"]} - {existing["end_time"]} tại cơ sở này. Vui lòng chọn phòng khác hoặc khung giờ khác."
    #                 )

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
