"""
Schedules Router
Router cho quản lý thời khóa biểu (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any, Union, Set, Tuple
from pydantic import BaseModel, Field
from datetime import time, date
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
    room: Optional[str] = None
    room_id: Optional[str] = None
    campus_id: Optional[str] = None
    date: Optional[str] = Field(default=None, description="Ngày cụ thể (YYYY-MM-DD format)")
    
    class Config:
        # Allow date to be None or omitted
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class ScheduleResponse(BaseModel):
    id: str
    classroom_id: str
    subject_id: str
    teacher_id: str
    day_of_week: int
    start_time: time
    end_time: time
    room: str
    room_id: Optional[str] = None
    campus_id: Optional[str] = None
    date: Optional[str] = None  # Keep as string to avoid validation issues
    created_at: str
    # Related data
    classroom: Optional[dict] = None
    subject: Optional[dict] = None
    teacher: Optional[dict] = None
    campus: Optional[dict] = None
    room_detail: Optional[dict] = None
    
    class Config:
        from_attributes = True


def _fetch_records_by_ids(
    supabase: Client,
    table: str,
    ids: Set[str],
    columns: str = "*"
) -> Dict[str, Dict[str, Any]]:
    if not ids:
        return {}
    try:
        response = supabase.table(table).select(columns).in_("id", list(ids)).execute()
        data = response.data or []
        return {item["id"]: item for item in data if item.get("id")}
    except Exception as fetch_error:
        print(f"Warning: Failed to fetch {table} records: {fetch_error}")
        return {}


def hydrate_schedule_relations(
    supabase: Client,
    schedules: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    if not schedules:
        return []

    classroom_ids: Set[str] = {
        schedule.get("classroom_id")
        for schedule in schedules
        if schedule.get("classroom_id")
    }
    subject_ids: Set[str] = {
        schedule.get("subject_id")
        for schedule in schedules
        if schedule.get("subject_id")
    }
    teacher_ids: Set[str] = {
        schedule.get("teacher_id")
        for schedule in schedules
        if schedule.get("teacher_id")
    }

    classroom_map = _fetch_records_by_ids(
        supabase,
        "classrooms",
        classroom_ids,
        "id,name,code,campus_id"
    )
    campus_ids: Set[str] = {
        classroom.get("campus_id")
        for classroom in classroom_map.values()
        if classroom.get("campus_id")
    }
    campus_map = _fetch_records_by_ids(
        supabase,
        "campuses",
        campus_ids,
        "id,name,code"
    )
    subject_map = _fetch_records_by_ids(
        supabase,
        "subjects",
        subject_ids,
        "id,name,code"
    )
    teacher_map: Dict[str, Dict[str, Any]] = {}
    teacher_records = _fetch_records_by_ids(
        supabase,
        "teachers",
        teacher_ids,
        "id,user_id,teacher_code,phone,address"
    )
    user_ids: Set[str] = {
        teacher.get("user_id")
        for teacher in teacher_records.values()
        if teacher.get("user_id")
    }
    user_map = _fetch_records_by_ids(
        supabase,
        "users",
        user_ids,
        "id,full_name,email"
    )
    for teacher_id, teacher in teacher_records.items():
        user = user_map.get(teacher.get("user_id")) or {}
        teacher_map[teacher_id] = {
            **teacher,
            "display_name": user.get("full_name"),
            "email": user.get("email"),
            "user": user,
        }

    room_ids: Set[str] = {
        schedule.get("room_id")
        for schedule in schedules
        if schedule.get("room_id")
    }
    room_map = _fetch_records_by_ids(
        supabase,
        "rooms",
        room_ids,
        "id,name,code,capacity,campus_id"
    )

    for schedule in schedules:
        classroom = classroom_map.get(schedule.get("classroom_id"))
        if classroom:
            schedule["classroom"] = classroom
            campus = campus_map.get(classroom.get("campus_id"))
            if campus:
                schedule["campus"] = campus

        subject = subject_map.get(schedule.get("subject_id"))
        if subject:
            schedule["subject"] = subject

        teacher = teacher_map.get(schedule.get("teacher_id"))
        if teacher:
            schedule["teacher"] = teacher

        room_detail = room_map.get(schedule.get("room_id"))
        if room_detail:
            schedule["room_detail"] = room_detail

    return schedules


def hydrate_single_schedule(supabase: Client, schedule: Dict[str, Any]) -> Dict[str, Any]:
    hydrated = hydrate_schedule_relations(supabase, [schedule])
    return hydrated[0] if hydrated else schedule


def _resolve_room_reference(
    supabase: Client,
    campus_id: Optional[str],
    room_id: Optional[str],
    room_label: Optional[str],
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Ensure provided room info corresponds to an existing room record.
    Returns tuple of (room_record, resolved_room_label).
    """
    resolved_label = (room_label or "").strip()
    room_record: Optional[Dict[str, Any]] = None

    if room_id:
        response = (
            supabase.table("rooms")
            .select("id, code, name, campus_id")
            .eq("id", room_id)
            .limit(1)
            .execute()
        )
        data = response.data or []
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phòng học đã chọn không tồn tại.",
            )
        room_record = data[0]
        if campus_id and room_record.get("campus_id") != campus_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phòng học không thuộc cùng cơ sở với lớp học.",
            )
        if not resolved_label:
            resolved_label = room_record.get("code") or room_record.get("name") or ""
    elif campus_id and resolved_label:
        response = (
            supabase.table("rooms")
            .select("id, code, name, campus_id")
            .eq("campus_id", campus_id)
            .eq("code", resolved_label)
            .limit(1)
            .execute()
        )
        data = response.data or []
        if not data:
            response = (
                supabase.table("rooms")
                .select("id, code, name, campus_id")
                .eq("campus_id", campus_id)
                .eq("name", resolved_label)
                .limit(1)
                .execute()
            )
            data = response.data or []
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy phòng học tương ứng trong cơ sở đã chọn. Vui lòng kiểm tra lại.",
            )
        room_record = data[0]
    elif campus_id and not resolved_label:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn phòng học hợp lệ.",
        )

    if room_record and not resolved_label:
        resolved_label = room_record.get("code") or room_record.get("name") or ""

    return room_record, resolved_label

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
    
    campus_id = classroom_info.data[0].get("campus_id") or schedule_data.campus_id
    if not campus_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lớp học chưa được gán cơ sở. Vui lòng cập nhật thông tin lớp trước khi tạo lịch.",
        )
    
    # Convert date string to date object if needed for conflict check
    schedule_date = None
    if schedule_data.date:
        if isinstance(schedule_data.date, str):
            try:
                schedule_date = date.fromisoformat(schedule_data.date)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            schedule_date = schedule_data.date

    room_record, resolved_room_label = _resolve_room_reference(
        supabase,
        campus_id,
        schedule_data.room_id,
        schedule_data.room,
    )
    room_value = (resolved_room_label or "").strip()
    if not room_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn phòng học hợp lệ.",
        )
    
    # Kiểm tra xung đột phòng học: ưu tiên kiểm tra ngày cụ thể trước
    if room_value and campus_id:
        try:
            # Nếu có ngày cụ thể, kiểm tra theo ngày cụ thể
            if schedule_date:
                # Tìm các lịch học có cùng phòng, cùng cơ sở, cùng ngày cụ thể
                conflict_query = supabase.table("schedules").select("""
                    id,
                    start_time,
                    end_time,
                    room,
                    date,
                    classrooms!inner(
                        campus_id
                    )
            """).eq("date", schedule_date.isoformat()).eq("room", room_value)
                
                # Filter by campus_id through classroom
                conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
            else:
                # Nếu không có ngày cụ thể, kiểm tra theo day_of_week (tương thích với dữ liệu cũ)
                conflict_query = supabase.table("schedules").select("""
                    id,
                    start_time,
                    end_time,
                    room,
                    date,
                    classrooms!inner(
                        campus_id
                    )
            """).eq("day_of_week", schedule_data.day_of_week).eq("room", room_value).is_("date", "null")
                
                # Filter by campus_id through classroom
                conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
            
            if conflict_result.data:
                # Kiểm tra xung đột thời gian
                new_start_str = schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
                new_end_str = schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time)
                
                # Convert to time objects for comparison
                from datetime import time
                new_start = time.fromisoformat(new_start_str.split('T')[-1])
                new_end = time.fromisoformat(new_end_str.split('T')[-1])
                
                for existing in conflict_result.data:
                    existing_start = time.fromisoformat(existing["start_time"])
                    existing_end = time.fromisoformat(existing["end_time"])
                    
                    # Kiểm tra xung đột thời gian
                    if (new_start < existing_end and new_end > existing_start):
                        date_info = f"ngày {schedule_date.strftime('%d/%m/%Y')}" if schedule_date else f"thứ {schedule_data.day_of_week + 2}"
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST, 
                            detail=f"Phòng {schedule_data.room} đã được sử dụng trong khung giờ {existing['start_time']} - {existing['end_time']} vào {date_info} tại cơ sở này. Vui lòng chọn phòng khác hoặc khung giờ khác."
                        )
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as conflict_error:
            # Nếu conflict check fail (có thể do column date chưa tồn tại hoặc query issue), log và bỏ qua
            print(f"Warning: Conflict check failed (may be due to missing date column or query issue): {str(conflict_error)}")
            # Continue without conflict check - schedule will be created anyway

    # Kiểm tra duplicate trước khi insert
    # Nếu có date: kiểm tra (classroom_id, date, start_time)
    # Nếu không có date: kiểm tra (classroom_id, day_of_week, start_time)
    try:
        if schedule_date:
            # Kiểm tra duplicate cho lịch có ngày cụ thể
            duplicate_check = supabase.table("schedules").select("id, date, start_time").eq(
                "classroom_id", schedule_data.classroom_id
            ).eq("date", schedule_date.isoformat()).eq(
                "start_time", schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
            ).execute()
            
            if duplicate_check.data and len(duplicate_check.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Đã tồn tại lịch học cho lớp này vào ngày {schedule_date.strftime('%d/%m/%Y')} lúc {schedule_data.start_time.strftime('%H:%M')}. Vui lòng chọn ngày hoặc giờ khác."
                )
        else:
            # Kiểm tra duplicate cho lịch định kỳ (không có date)
            duplicate_check = supabase.table("schedules").select("id, day_of_week, start_time").eq(
                "classroom_id", schedule_data.classroom_id
            ).eq("day_of_week", schedule_data.day_of_week).eq(
                "start_time", schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
            ).is_("date", "null").execute()
            
            if duplicate_check.data and len(duplicate_check.data) > 0:
                days = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
                day_name = days[schedule_data.day_of_week] if 0 <= schedule_data.day_of_week < 7 else f"Thứ {schedule_data.day_of_week + 2}"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Đã tồn tại lịch học cho lớp này vào {day_name} lúc {schedule_data.start_time.strftime('%H:%M')}. Vui lòng chọn ngày hoặc giờ khác."
                )
    except HTTPException:
        raise
    except Exception as dup_check_error:
        # Nếu kiểm tra duplicate fail, log và tiếp tục (có thể do column date chưa tồn tại)
        print(f"Warning: Duplicate check failed: {str(dup_check_error)}")
        # Continue - sẽ bắt lỗi ở database level nếu có duplicate

    payload = {
        "classroom_id": schedule_data.classroom_id,
        "subject_id": schedule_data.subject_id,
        "teacher_id": schedule_data.teacher_id,
        "day_of_week": schedule_data.day_of_week,
        "start_time": schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time),
        "end_time": schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time),
        "room": room_value,
    }
    
    # Thêm date vào payload nếu có (chỉ thêm nếu không phải None)
    # Nếu database chưa có cột date, sẽ không thêm vào payload
    if schedule_date:
        payload["date"] = schedule_date.isoformat()
    if campus_id:
        payload["campus_id"] = campus_id
    if room_record:
        payload["room_id"] = room_record["id"]

    try:
        result = supabase.table("schedules").insert(payload).execute()
        if not result.data:
            error_msg = "Failed to create schedule"
            if hasattr(result, 'error') and result.error:
                error_msg = f"Database error: {result.error}"
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)
        
        # Hydrate relations for the newly created schedule
        response_data = result.data[0]
        return hydrate_single_schedule(supabase, response_data)
    except HTTPException:
        raise
    except Exception as e:
        error_detail = str(e)
        error_lower = error_detail.lower()
        print(f"Error creating schedule: {error_detail}")
        print(f"Payload: {payload}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        # Xử lý lỗi duplicate key constraint
        if "23505" in error_detail or "duplicate key" in error_lower or "ux_schedules" in error_lower:
            if schedule_date:
                error_message = f"Đã tồn tại lịch học cho lớp này vào ngày {schedule_date.strftime('%d/%m/%Y')} lúc {schedule_data.start_time.strftime('%H:%M')}. Vui lòng chọn ngày hoặc giờ khác."
            else:
                days = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
                day_name = days[schedule_data.day_of_week] if 0 <= schedule_data.day_of_week < 7 else f"Thứ {schedule_data.day_of_week + 2}"
                error_message = f"Đã tồn tại lịch học cho lớp này vào {day_name} lúc {schedule_data.start_time.strftime('%H:%M')}. Vui lòng chọn ngày hoặc giờ khác."
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Check if error is about missing column
        if "column" in error_lower and ("date" in error_lower or "does not exist" in error_lower):
            # Try again without date field
            if "date" in payload:
                print("Retrying without date field...")
                payload_without_date = {k: v for k, v in payload.items() if k != "date"}
                try:
                    result = supabase.table("schedules").insert(payload_without_date).execute()
                    if result.data:
                        return result.data[0]
                except Exception as retry_error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                        detail=f"Database column 'date' not found. Please run migration: add_date_to_schedules.sql. Error: {str(retry_error)}"
                    )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Database column 'date' not found. Please run migration: add_date_to_schedules.sql"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to create schedule: {error_detail}"
        )

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
        schedules = result.data or []
        hydrated = hydrate_schedule_relations(supabase, schedules)
        return hydrated
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
    return hydrate_single_schedule(supabase, result.data[0])

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
    
    campus_id = classroom_info.data[0].get("campus_id") or schedule_data.campus_id
    if not campus_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lớp học chưa được gán cơ sở. Vui lòng cập nhật thông tin lớp trước khi cập nhật lịch.",
        )
    
    # Convert date string to date object if needed for conflict check
    schedule_date = None
    if schedule_data.date:
        try:
            schedule_date = date.fromisoformat(schedule_data.date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")
    
    room_record, resolved_room_label = _resolve_room_reference(
        supabase,
        campus_id,
        schedule_data.room_id,
        schedule_data.room,
    )
    room_value = (resolved_room_label or "").strip()
    if not room_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn phòng học hợp lệ.",
        )
    
    # Kiểm tra xung đột phòng học: ưu tiên kiểm tra ngày cụ thể trước
    if room_value and campus_id:
        # Nếu có ngày cụ thể, kiểm tra theo ngày cụ thể
        if schedule_date:
            # Tìm các lịch học có cùng phòng, cùng cơ sở, cùng ngày cụ thể (trừ lịch hiện tại)
            conflict_query = supabase.table("schedules").select("""
                id,
                start_time,
                end_time,
                room,
                date,
                classrooms!inner(
                    campus_id
                )
            """).eq("date", schedule_date.isoformat()).eq("room", room_value).neq("id", schedule_id)
            
            # Filter by campus_id through classroom
            conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
        else:
            # Nếu không có ngày cụ thể, kiểm tra theo day_of_week (tương thích với dữ liệu cũ)
            conflict_query = supabase.table("schedules").select("""
                id,
                start_time,
                end_time,
                room,
                date,
                classrooms!inner(
                    campus_id
                )
            """).eq("day_of_week", schedule_data.day_of_week).eq("room", room_value).is_("date", "null").neq("id", schedule_id)
            
            # Filter by campus_id through classroom
            conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
        
        if conflict_result.data:
            # Kiểm tra xung đột thời gian
            new_start_str = schedule_data.start_time.isoformat() if hasattr(schedule_data.start_time, 'isoformat') else str(schedule_data.start_time)
            new_end_str = schedule_data.end_time.isoformat() if hasattr(schedule_data.end_time, 'isoformat') else str(schedule_data.end_time)
            
            # Convert to time objects for comparison
            from datetime import time
            new_start = time.fromisoformat(new_start_str.split('T')[-1])
            new_end = time.fromisoformat(new_end_str.split('T')[-1])
            
            for existing in conflict_result.data:
                existing_start = time.fromisoformat(existing["start_time"])
                existing_end = time.fromisoformat(existing["end_time"])
                
                # Kiểm tra xung đột thời gian
                if (new_start < existing_end and new_end > existing_start):
                    date_info = f"ngày {schedule_date.strftime('%d/%m/%Y')}" if schedule_date else f"thứ {schedule_data.day_of_week + 2}"
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, 
                        detail=f"Phòng {room_value} đã được sử dụng trong khung giờ {existing['start_time']} - {existing['end_time']} vào {date_info} tại cơ sở này. Vui lòng chọn phòng khác hoặc khung giờ khác."
                    )

    update_data = schedule_data.dict(exclude_unset=True)
    if "start_time" in update_data:
        update_data["start_time"] = update_data["start_time"].isoformat()
    if "end_time" in update_data:
        update_data["end_time"] = update_data["end_time"].isoformat()
    if "date" in update_data:
        if update_data["date"]:
            # Convert string to date and back to isoformat for database
            try:
                date_obj = date.fromisoformat(update_data["date"])
                update_data["date"] = date_obj.isoformat()
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            # If date is None or empty string, set to None
            update_data["date"] = None
    update_data["room"] = room_value
    update_data["campus_id"] = campus_id
    if room_record:
        update_data["room_id"] = room_record["id"]

    result = supabase.table("schedules").update(update_data).eq("id", schedule_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update schedule")
    return hydrate_single_schedule(supabase, result.data[0])

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
