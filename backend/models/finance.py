"""
Finance Model
Model cho tài chính
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class FinanceBase(BaseModel):
    type: str  # "income" or "expense"
    amount: Decimal
    description: str
    category: Optional[str] = None
    date: datetime

class FinanceCreate(FinanceBase):
    pass

class FinanceUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime] = None

class Finance(FinanceBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True