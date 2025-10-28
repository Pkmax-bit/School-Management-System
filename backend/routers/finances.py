"""
Finances Router
Router cho quản lý tài chính
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.user import User, UserRole
from models.finance import Finance
from routers.auth import get_current_user

router = APIRouter()

class FinanceCreate(BaseModel):
    title: str
    description: str = None
    amount: float
    finance_type: str  # income, expense
    category: str  # tuition, salary, facility, equipment, other
    date: datetime
    is_recurring: bool = False

class FinanceResponse(BaseModel):
    id: str
    title: str
    description: str
    amount: float
    finance_type: str
    category: str
    date: datetime
    is_recurring: bool
    created_by: str
    created_at: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=FinanceResponse)
async def create_finance(
    finance_data: FinanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo giao dịch tài chính mới (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_finance = Finance(
        **finance_data.dict(),
        created_by=current_user.id
    )
    db.add(db_finance)
    db.commit()
    db.refresh(db_finance)
    return db_finance

@router.get("/", response_model=List[FinanceResponse])
async def get_finances(
    skip: int = 0,
    limit: int = 100,
    finance_type: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách giao dịch tài chính"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    query = db.query(Finance)
    
    if finance_type:
        query = query.filter(Finance.finance_type == finance_type)
    if category:
        query = query.filter(Finance.category == category)
    
    finances = query.offset(skip).limit(limit).all()
    return finances

@router.get("/{finance_id}", response_model=FinanceResponse)
async def get_finance(
    finance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin một giao dịch tài chính"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finance record not found"
        )
    return finance

@router.put("/{finance_id}", response_model=FinanceResponse)
async def update_finance(
    finance_id: str,
    finance_data: FinanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật giao dịch tài chính"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finance record not found"
        )
    
    update_data = finance_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(finance, field, value)
    
    db.commit()
    db.refresh(finance)
    return finance

@router.delete("/{finance_id}")
async def delete_finance(
    finance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa giao dịch tài chính (chỉ admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    finance = db.query(Finance).filter(Finance.id == finance_id).first()
    if not finance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finance record not found"
        )
    
    db.delete(finance)
    db.commit()
    return {"message": "Finance record deleted successfully"}

@router.get("/stats/summary")
async def get_finance_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tổng quan tài chính"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Tính tổng thu nhập
    total_income = db.query(Finance).filter(Finance.finance_type == "income").with_entities(
        db.func.sum(Finance.amount)
    ).scalar() or 0
    
    # Tính tổng chi phí
    total_expense = db.query(Finance).filter(Finance.finance_type == "expense").with_entities(
        db.func.sum(Finance.amount)
    ).scalar() or 0
    
    # Tính lợi nhuận
    profit = total_income - total_expense
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "profit": profit,
        "profit_margin": (profit / total_income * 100) if total_income > 0 else 0
    }
