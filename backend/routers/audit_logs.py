"""
Audit Logs Router
Router cho audit logging
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev
from models.audit_log import AuditLogResponse, AuditLogFilter

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    ip_address: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách audit logs (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        query = supabase.table('audit_logs').select('*')
        
        if user_id:
            query = query.eq('user_id', user_id)
        if action:
            query = query.eq('action', action)
        if resource_type:
            query = query.eq('resource_type', resource_type)
        if resource_id:
            query = query.eq('resource_id', resource_id)
        if start_date:
            query = query.gte('created_at', start_date)
        if end_date:
            query = query.lte('created_at', end_date)
        if ip_address:
            query = query.eq('ip_address', ip_address)
        
        result = query.order('created_at', desc=True).limit(limit).offset(offset).execute()
        return result.data if result.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching audit logs: {str(e)}"
        )

@router.get("/stats")
async def get_audit_log_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thống kê audit logs (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        query = supabase.table('audit_logs').select('action, resource_type, status_code')
        
        if start_date:
            query = query.gte('created_at', start_date)
        if end_date:
            query = query.lte('created_at', end_date)
        
        result = query.execute()
        logs = result.data if result.data else []
        
        # Tính toán thống kê
        total_logs = len(logs)
        actions_count = {}
        resource_types_count = {}
        status_codes_count = {}
        
        for log in logs:
            action = log.get('action', 'unknown')
            resource_type = log.get('resource_type', 'unknown')
            status_code = log.get('status_code')
            
            actions_count[action] = actions_count.get(action, 0) + 1
            resource_types_count[resource_type] = resource_types_count.get(resource_type, 0) + 1
            if status_code:
                status_codes_count[status_code] = status_codes_count.get(status_code, 0) + 1
        
        return {
            'total_logs': total_logs,
            'actions_count': actions_count,
            'resource_types_count': resource_types_count,
            'status_codes_count': status_codes_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching audit log stats: {str(e)}"
        )

@router.delete("/")
async def delete_audit_logs(
    older_than_days: int = Query(90, ge=1, description="Delete logs older than X days"),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa audit logs cũ (chỉ admin)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        from datetime import timedelta
        cutoff_date = (datetime.now() - timedelta(days=older_than_days)).isoformat()
        
        result = supabase.table('audit_logs').delete().lt('created_at', cutoff_date).execute()
        
        return {
            "message": f"Deleted audit logs older than {older_than_days} days",
            "deleted_count": len(result.data) if result.data else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting audit logs: {str(e)}"
        )

