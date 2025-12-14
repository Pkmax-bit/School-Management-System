"""
Batch API Router
Allows multiple API calls in a single request for better performance
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev

router = APIRouter()

class BatchRequest(BaseModel):
    requests: List[Dict[str, Any]]

class BatchResponse(BaseModel):
    responses: List[Dict[str, Any]]

@router.post("/batch", response_model=BatchResponse)
async def batch_request(
    batch_data: BatchRequest,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """
    Execute multiple API requests in a single batch
    Reduces network overhead and improves performance
    
    Example:
    {
      "requests": [
        {"method": "GET", "path": "/api/students", "params": {"limit": 20}},
        {"method": "GET", "path": "/api/teachers", "params": {"limit": 20}},
        {"method": "GET", "path": "/api/classrooms", "params": {}}
      ]
    }
    """
    if len(batch_data.requests) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 requests per batch"
        )
    
    responses = []
    
    for req in batch_data.requests:
        try:
            method = req.get("method", "GET").upper()
            path = req.get("path", "")
            params = req.get("params", {})
            
            # Validate path
            if not path.startswith("/api/"):
                responses.append({
                    "error": "Invalid path",
                    "status": 400
                })
                continue
            
            # For now, only support GET requests
            # In production, you'd want to route to actual endpoints
            if method == "GET":
                # Extract resource type from path
                resource = path.split("/")[2] if len(path.split("/")) > 2 else ""
                
                if resource == "students":
                    from routers.students import get_students
                    result = await get_students(
                        skip=params.get("skip", 0),
                        limit=params.get("limit", 20),
                        search=params.get("search"),
                        classroom_id=params.get("classroom_id"),
                        current_user=current_user,
                        supabase=supabase
                    )
                    responses.append({
                        "path": path,
                        "status": 200,
                        "data": result
                    })
                elif resource == "teachers":
                    from routers.teachers import get_teachers
                    result = await get_teachers(
                        skip=params.get("skip", 0),
                        limit=params.get("limit", 20),
                        search=params.get("search"),
                        department=params.get("department"),
                        current_user=current_user,
                        supabase=supabase
                    )
                    responses.append({
                        "path": path,
                        "status": 200,
                        "data": result
                    })
                else:
                    responses.append({
                        "path": path,
                        "error": f"Resource '{resource}' not supported in batch",
                        "status": 400
                    })
            else:
                responses.append({
                    "path": path,
                    "error": f"Method '{method}' not supported in batch",
                    "status": 400
                })
                
        except Exception as e:
            responses.append({
                "path": req.get("path", "unknown"),
                "error": str(e),
                "status": 500
            })
    
    return BatchResponse(responses=responses)

