"""
Finances Router
Router cho quản lý tài chính (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev, get_current_user
import re

router = APIRouter()

class FinanceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    finance_type: str  # income, expense
    category: str  # tuition, salary, facility, equipment, other
    date: str  # ISO format datetime string
    is_recurring: bool = False
    classroom_id: Optional[str] = None
    student_id: Optional[str] = None

class FinanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    finance_type: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    is_recurring: Optional[bool] = None
    classroom_id: Optional[str] = None
    student_id: Optional[str] = None

class FinanceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    amount: float
    finance_type: str
    category: str
    date: str
    is_recurring: bool
    classroom_id: Optional[str]
    student_id: Optional[str]
    created_by: Optional[str]
    created_at: str
    updated_at: str

def is_valid_uuid(uuid_string):
    """Kiểm tra xem string có phải UUID hợp lệ không"""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    return bool(uuid_pattern.match(str(uuid_string))) if uuid_string else False

@router.post("/", response_model=FinanceResponse)
async def create_finance(
    finance_data: FinanceCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo giao dịch tài chính mới"""
    try:
        # Lấy user ID, chỉ set created_by nếu là UUID hợp lệ
        user_id = None
        if hasattr(current_user, 'id') and current_user.id:
            if is_valid_uuid(current_user.id):
                user_id = current_user.id
            else:
                # Nếu không phải UUID hợp lệ (ví dụ "dev-user-id"), để null
                # Hoặc có thể thử lấy user từ token nếu cần
                user_id = None
        
        # Nếu không có user ID hợp lệ, có thể thử lấy từ request token
        # Nhưng hiện tại để null để tránh lỗi UUID
        
        now = datetime.now().isoformat()
        finance_dict = {
            'title': finance_data.title,
            'description': finance_data.description,
            'amount': finance_data.amount,
            'finance_type': finance_data.finance_type,
            'category': finance_data.category,
            'date': finance_data.date,
            'is_recurring': finance_data.is_recurring,
            'classroom_id': finance_data.classroom_id,
            'student_id': finance_data.student_id,
            'created_at': now,
            'updated_at': now
        }
        
        # Chỉ set created_by nếu có user ID hợp lệ
        if user_id:
            finance_dict['created_by'] = user_id
        
        result = supabase.table('finances').insert(finance_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create finance record"
            )
        
        return FinanceResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating finance: {str(e)}"
        )

@router.get("/", response_model=List[FinanceResponse])
async def get_finances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    finance_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách giao dịch tài chính"""
    try:
        query = supabase.table('finances').select('*')
        
        if finance_type:
            query = query.eq('finance_type', finance_type)
        if category:
            query = query.eq('category', category)
        if classroom_id:
            query = query.eq('classroom_id', classroom_id)
        if student_id:
            query = query.eq('student_id', student_id)
        
        query = query.order('date', desc=True)
        query = query.range(skip, skip + limit - 1)
        
        result = query.execute()
        
        return [FinanceResponse(**item) for item in result.data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching finances: {str(e)}"
        )

@router.get("/{finance_id}", response_model=FinanceResponse)
async def get_finance(
    finance_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một giao dịch tài chính"""
    try:
        result = supabase.table('finances').select('*').eq('id', finance_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Finance record not found"
            )
        
        return FinanceResponse(**result.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching finance: {str(e)}"
        )

@router.put("/{finance_id}", response_model=FinanceResponse)
async def update_finance(
    finance_id: str,
    finance_data: FinanceUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật giao dịch tài chính"""
    try:
        # Check if finance exists
        check_result = supabase.table('finances').select('id').eq('id', finance_id).single().execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Finance record not found"
            )
        
        # Build update data
        update_data = {}
        if finance_data.title is not None:
            update_data['title'] = finance_data.title
        if finance_data.description is not None:
            update_data['description'] = finance_data.description
        if finance_data.amount is not None:
            update_data['amount'] = finance_data.amount
        if finance_data.finance_type is not None:
            update_data['finance_type'] = finance_data.finance_type
        if finance_data.category is not None:
            update_data['category'] = finance_data.category
        if finance_data.date is not None:
            update_data['date'] = finance_data.date
        if finance_data.is_recurring is not None:
            update_data['is_recurring'] = finance_data.is_recurring
        if finance_data.classroom_id is not None:
            update_data['classroom_id'] = finance_data.classroom_id
        if finance_data.student_id is not None:
            update_data['student_id'] = finance_data.student_id
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        # Không cập nhật created_by khi update
        # created_by chỉ được set khi tạo mới
        
        result = supabase.table('finances').update(update_data).eq('id', finance_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update finance record"
            )
        
        return FinanceResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating finance: {str(e)}"
        )

@router.delete("/{finance_id}")
async def delete_finance(
    finance_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa giao dịch tài chính"""
    try:
        # Check if finance exists
        check_result = supabase.table('finances').select('id').eq('id', finance_id).single().execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Finance record not found"
            )
        
        supabase.table('finances').delete().eq('id', finance_id).execute()
        
        return {"message": "Finance record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting finance: {str(e)}"
        )

@router.get("/stats/summary")
async def get_finance_summary(
    classroom_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy tổng quan tài chính"""
    try:
        query_income = supabase.table('finances').select('amount').eq('finance_type', 'income')
        query_expense = supabase.table('finances').select('amount').eq('finance_type', 'expense')
        
        if classroom_id:
            query_income = query_income.eq('classroom_id', classroom_id)
            query_expense = query_expense.eq('classroom_id', classroom_id)
        
        income_result = query_income.execute()
        expense_result = query_expense.execute()
        
        total_income = sum(float(item['amount']) for item in income_result.data) if income_result.data else 0
        total_expense = sum(float(item['amount']) for item in expense_result.data) if expense_result.data else 0
        profit = total_income - total_expense
        
        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "profit": profit,
            "profit_margin": (profit / total_income * 100) if total_income > 0 else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching finance summary: {str(e)}"
        )
