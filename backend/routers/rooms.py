"""
Rooms Router
CRUD cho phòng học (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, constr
from supabase import Client

from database import get_db
from routers.auth import get_current_user

router = APIRouter()


class RoomCreate(BaseModel):
    campus_id: str
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    code: constr(strip_whitespace=True, min_length=1, max_length=50)
    capacity: Optional[int] = 30
    description: Optional[str] = None


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None


class RoomResponse(BaseModel):
    id: str
    campus_id: str
    name: str
    code: str
    capacity: Optional[int] = None
    description: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    campus: Optional[dict] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=RoomResponse)
async def create_room(
    room_data: RoomCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Check if campus exists
    campus_check = supabase.table("campuses").select("id").eq("id", room_data.campus_id).execute()
    if not campus_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")

    code = room_data.code.strip()
    # Check unique code within campus
    dup = supabase.table("rooms").select("id").eq("campus_id", room_data.campus_id).eq("code", code).execute()
    if dup.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room code already exists in this campus")

    payload = {
        "campus_id": room_data.campus_id,
        "name": room_data.name.strip(),
        "code": code,
        "capacity": room_data.capacity or 30,
        "description": room_data.description or None,
    }
    res = supabase.table("rooms").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create room")
    return res.data[0]


@router.get("/", response_model=List[RoomResponse])
async def list_rooms(
    campus_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    query = supabase.table("rooms").select("*, campuses(*)")
    if campus_id:
        query = query.eq("campus_id", campus_id)
    res = query.order("created_at", desc=True).execute()
    return res.data or []


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    res = supabase.table("rooms").select("*, campuses(*)").eq("id", room_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return res.data


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    room_data: RoomUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Check exists
    exists = supabase.table("rooms").select("id, campus_id").eq("id", room_id).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    data = room_data.dict(exclude_unset=True)
    if "code" in data and data["code"]:
        # Check unique code within campus
        campus_id = exists.data[0]["campus_id"]
        dup = supabase.table("rooms").select("id").eq("campus_id", campus_id).eq("code", data["code"]).neq("id", room_id).execute()
        if dup.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room code already exists in this campus")

    res = supabase.table("rooms").update(data).eq("id", room_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update room")
    return res.data[0]


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    exists = supabase.table("rooms").select("id").eq("id", room_id).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    res = supabase.table("rooms").delete().eq("id", room_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete room")
    return {"message": "Room deleted successfully"}

