"""
Campuses Router
CRUD cho cơ sở (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, constr
from supabase import Client

from database import get_db
from routers.auth import get_current_user

router = APIRouter()


class CampusCreate(BaseModel):
    code: constr(strip_whitespace=True, min_length=1, max_length=50)
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None


class CampusUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class CampusResponse(BaseModel):
    id: str
    code: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=CampusResponse)
async def create_campus(
    campus_data: CampusCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    code = campus_data.code.strip()
    # Unique code
    dup = supabase.table("campuses").select("id").eq("code", code).execute()
    if dup.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campus code already exists")

    payload = {
        "code": code,
        "name": campus_data.name.strip(),
        "address": campus_data.address or None,
        "phone": campus_data.phone or None,
    }
    res = supabase.table("campuses").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create campus")
    return res.data[0]


@router.get("/", response_model=List[CampusResponse])
async def list_campuses(
    q: Optional[str] = None,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    query = supabase.table("campuses").select("*")
    if q:
        like = f"%{q}%"
        query = query.or_(f"code.ilike.{like},name.ilike.{like}")
    res = query.order("created_at", desc=True).execute()
    return res.data or []


@router.get("/{campus_id}", response_model=CampusResponse)
async def get_campus(
    campus_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    res = supabase.table("campuses").select("*").eq("id", campus_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")
    return res.data


@router.put("/{campus_id}", response_model=CampusResponse)
async def update_campus(
    campus_id: str,
    campus_data: CampusUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Check exists
    exists = supabase.table("campuses").select("id").eq("id", campus_id).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")

    data = campus_data.dict(exclude_unset=True)
    if "code" in data and data["code"]:
        dup = supabase.table("campuses").select("id").eq("code", data["code"]).neq("id", campus_id).execute()
        if dup.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campus code already exists")

    res = supabase.table("campuses").update(data).eq("id", campus_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update campus")
    return res.data[0]


@router.delete("/{campus_id}")
async def delete_campus(
    campus_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    exists = supabase.table("campuses").select("id").eq("id", campus_id).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campus not found")

    res = supabase.table("campuses").delete().eq("id", campus_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete campus")
    return {"message": "Campus deleted successfully"}


