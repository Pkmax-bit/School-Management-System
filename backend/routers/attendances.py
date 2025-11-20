"""
Attendances Router
Router cho quản lý điểm danh (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator
from datetime import date, datetime
from supabase import Client
import json

from database import get_db
from routers.auth import get_current_user

router = APIRouter()

def normalize_records(records: Any) -> Dict[str, Dict[str, Any]]:
    """
    Normalize records to ensure proper format:
    - Parse string JSON to dict if needed
    - Ensure each record has student_id field
    - Validate structure
    """
    if not records:
        return {}
    
    # Parse string JSON if needed
    if isinstance(records, str):
        try:
            records = json.loads(records)
        except json.JSONDecodeError:
            return {}
    
    # Ensure it's a dict
    if not isinstance(records, dict):
        return {}
    
    # Normalize records: ensure each record has student_id
    normalized = {}
    for key, value in records.items():
        if isinstance(value, dict):
            # Ensure student_id is set (use key if not present)
            if 'student_id' not in value:
                value['student_id'] = key
            normalized[key] = value
    
    return normalized

class AttendanceCreate(BaseModel):
    classroom_id: str
    date: str  # YYYY-MM-DD format
    records: Dict[str, Dict[str, Any]]  # {student_id: {status, notes, timestamp, student_id}}
    confirmed_at: Optional[str] = None
    
    @validator('records')
    def validate_records(cls, v):
        """Validate and normalize records format"""
        if not v:
            return {}
        
        normalized = {}
        for key, value in v.items():
            if not isinstance(value, dict):
                continue
            
            # Ensure required fields
            if 'status' not in value:
                raise ValueError(f"Record for student {key} must have 'status' field")
            
            # Ensure student_id is set
            if 'student_id' not in value:
                value['student_id'] = key
            
            # Validate status
            valid_statuses = ['present', 'absent', 'late', 'excused']
            if value['status'] not in valid_statuses:
                raise ValueError(f"Invalid status '{value['status']}'. Must be one of: {valid_statuses}")
            
            normalized[key] = value
        
        return normalized

class AttendanceUpdate(BaseModel):
    records: Optional[Dict[str, Dict[str, Any]]] = None
    confirmed_at: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: str
    classroom_id: str
    date: str
    records: Dict[str, Dict[str, Any]]
    confirmed_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

@router.get("/")
async def get_attendances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    student_id: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),  # YYYY-MM-DD format
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy danh sách điểm danh"""
    try:
        query = supabase.table("attendances").select("*")
        
        if student_id:
            # If filtering by student_id, we need to check records field
            # This is a JSONB field, so we'll filter after fetching
            pass
        
        if classroom_id:
            query = query.eq("classroom_id", classroom_id)
        
        if date:
            query = query.eq("date", date)
        
        # Apply pagination
        query = query.range(skip, skip + limit - 1)
        
        result = query.execute()
        attendances = result.data or []
        
        # Normalize records (parse string JSON if needed)
        for att in attendances:
            if att.get("records"):
                print(f"[get_attendances] Raw records type: {type(att['records'])}")
                print(f"[get_attendances] Raw records: {att['records']}")
                att["records"] = normalize_records(att["records"])
                print(f"[get_attendances] Normalized records type: {type(att['records'])}")
                print(f"[get_attendances] Normalized records keys: {list(att['records'].keys()) if isinstance(att['records'], dict) else 'N/A'}")
        
        # Filter by student_id if provided (check in records JSONB)
        if student_id:
            filtered = []
            for att in attendances:
                records = att.get("records", {})
                if isinstance(records, dict):
                    # Check if student_id exists as key or in record's student_id field
                    if student_id in records:
                        filtered.append(att)
                    else:
                        # Check in record values
                        for record in records.values():
                            if isinstance(record, dict) and record.get("student_id") == student_id:
                                filtered.append(att)
                                break
            attendances = filtered
        
        return {"data": attendances, "count": len(attendances)}
    except Exception as e:
        print(f"Error in get_attendances: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendances: {str(e)}"
        )

@router.get("/{attendance_id}")
async def get_attendance(
    attendance_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Lấy thông tin một điểm danh"""
    try:
        result = supabase.table("attendances").select("*").eq("id", attendance_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance not found"
            )
        
        attendance = result.data[0]
        # Normalize records (parse string JSON if needed)
        if attendance.get("records"):
            print(f"[get_attendance] Raw records type: {type(attendance['records'])}")
            print(f"[get_attendance] Raw records: {attendance['records']}")
            attendance["records"] = normalize_records(attendance["records"])
            print(f"[get_attendance] Normalized records type: {type(attendance['records'])}")
            print(f"[get_attendance] Normalized records keys: {list(attendance['records'].keys()) if isinstance(attendance['records'], dict) else 'N/A'}")
        
        return attendance
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attendance: {str(e)}"
        )

@router.post("/")
async def create_attendance(
    attendance_data: AttendanceCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Tạo điểm danh mới (chỉ giáo viên và admin)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra classroom có tồn tại không
        classroom_result = supabase.table("classrooms").select("id").eq("id", attendance_data.classroom_id).execute()
        if not classroom_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found"
            )
        
        # Kiểm tra đã điểm danh chưa (theo classroom_id và date)
        existing_result = supabase.table("attendances").select("id").eq(
            "classroom_id", attendance_data.classroom_id
        ).eq("date", attendance_data.date).execute()
        
        if existing_result.data and len(existing_result.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already recorded for this classroom and date"
            )
        
        # Normalize records before saving
        normalized_records = normalize_records(attendance_data.records)
        
        # Validate records are not empty
        if not normalized_records:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Records cannot be empty. At least one student attendance record is required."
            )
        
        # Tạo attendance record
        attendance_record = {
            "classroom_id": attendance_data.classroom_id,
            "date": attendance_data.date,
            "records": normalized_records,  # Already normalized
            "confirmed_at": attendance_data.confirmed_at or datetime.utcnow().isoformat(),
        }
        
        print(f"[create_attendance] Saving records type: {type(normalized_records)}")
        print(f"[create_attendance] Saving records keys: {list(normalized_records.keys()) if isinstance(normalized_records, dict) else 'N/A'}")
        print(f"[create_attendance] Saving date: {attendance_data.date}")
        
        result = supabase.table("attendances").insert(attendance_record).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create attendance"
            )
        
        # Normalize records in response
        if result.data[0].get("records"):
            print(f"[create_attendance] Response records type: {type(result.data[0]['records'])}")
            result.data[0]["records"] = normalize_records(result.data[0]["records"])
            print(f"[create_attendance] Response normalized records keys: {list(result.data[0]['records'].keys()) if isinstance(result.data[0]['records'], dict) else 'N/A'}")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create attendance: {str(e)}"
        )

@router.put("/{attendance_id}")
async def update_attendance(
    attendance_id: str,
    attendance_data: AttendanceUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Cập nhật điểm danh (chỉ giáo viên và admin)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra attendance có tồn tại không
        existing_result = supabase.table("attendances").select("id").eq("id", attendance_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance not found"
            )
        
        # Cập nhật attendance
        update_data: Dict[str, Any] = {}
        
        if attendance_data.records is not None:
            # Normalize records before saving
            normalized_records = normalize_records(attendance_data.records)
            if not normalized_records:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Records cannot be empty. At least one student attendance record is required."
                )
            update_data["records"] = normalized_records
        
        if attendance_data.confirmed_at is not None:
            update_data["confirmed_at"] = attendance_data.confirmed_at
        else:
            # Auto-update confirmed_at if records are updated
            update_data["confirmed_at"] = datetime.utcnow().isoformat()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("attendances").update(update_data).eq("id", attendance_id).execute()
        
        # Normalize records in response
        if result.data and len(result.data) > 0:
            if result.data[0].get("records"):
                result.data[0]["records"] = normalize_records(result.data[0]["records"])
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update attendance"
            )
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update attendance: {str(e)}"
        )

@router.delete("/{attendance_id}")
async def delete_attendance(
    attendance_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    """Xóa điểm danh (chỉ admin)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        result = supabase.table("attendances").delete().eq("id", attendance_id).execute()
        
        return {"message": "Attendance deleted successfully", "deleted": True}
    except Exception as e:
        print(f"Error in delete_attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete attendance: {str(e)}"
        )
