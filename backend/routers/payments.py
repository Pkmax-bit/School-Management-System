"""
Student Payments Router
Router cho quản lý thanh toán của học sinh
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev
import re

router = APIRouter()

def is_valid_uuid(uuid_string):
    """Kiểm tra xem string có phải UUID hợp lệ không"""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    return bool(uuid_pattern.match(str(uuid_string))) if uuid_string else False

class PaymentCreate(BaseModel):
    student_id: str
    classroom_id: str
    amount: float
    payment_date: str  # ISO format datetime string
    payment_method: Optional[str] = 'cash'  # cash, bank_transfer, card, other
    payment_status: str = 'paid'  # pending, paid, overdue, cancelled
    due_date: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    discount_percent: Optional[float] = 0.0  # Chiết khấu theo phần trăm (0-100)

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    due_date: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    discount_percent: Optional[float] = None  # Chiết khấu theo phần trăm (0-100)

class PaymentResponse(BaseModel):
    id: str
    student_id: str
    classroom_id: str
    amount: float
    discount_percent: Optional[float] = 0.0
    payment_date: str
    payment_method: Optional[str]
    payment_status: str
    due_date: Optional[str]
    receipt_number: Optional[str]
    notes: Optional[str]
    created_by: Optional[str]
    created_at: str
    updated_at: str

class PaymentWithStudentResponse(PaymentResponse):
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    classroom_name: Optional[str] = None
    classroom_code: Optional[str] = None

@router.post("/", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo thanh toán mới cho học sinh"""
    try:
        # Lấy user ID, chỉ set created_by nếu là UUID hợp lệ
        user_id = None
        if hasattr(current_user, 'id') and current_user.id:
            if is_valid_uuid(current_user.id):
                user_id = current_user.id
            else:
                # Nếu không phải UUID hợp lệ (ví dụ "dev-user-id"), để null
                user_id = None
        
        now = datetime.now().isoformat()
        # Đảm bảo discount_percent trong khoảng 0-100
        discount_percent = max(0, min(100, payment_data.discount_percent or 0.0))
        
        payment_dict = {
            'student_id': payment_data.student_id,
            'classroom_id': payment_data.classroom_id,
            'amount': payment_data.amount,
            'payment_date': payment_data.payment_date,
            'payment_method': payment_data.payment_method,
            'payment_status': payment_data.payment_status,
            'due_date': payment_data.due_date,
            'receipt_number': payment_data.receipt_number,
            'notes': payment_data.notes,
            'discount_percent': discount_percent,
            'created_at': now,
            'updated_at': now
        }
        
        # Chỉ set created_by nếu có user ID hợp lệ
        if user_id:
            payment_dict['created_by'] = user_id
        
        result = supabase.table('student_payments').insert(payment_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment record"
            )
        
        # Tạo finance record tự động cho thu nhập từ học phí
        try:
            finance_dict = {
                'title': f'Học phí - Học sinh {payment_data.student_id}',
                'description': f'Thanh toán học phí - Receipt: {payment_data.receipt_number or "N/A"}',
                'amount': payment_data.amount,
                'finance_type': 'income',
                'category': 'tuition',
                'date': payment_data.payment_date,
                'classroom_id': payment_data.classroom_id,
                'student_id': payment_data.student_id,
                'created_at': now,
                'updated_at': now
            }
            
            # Chỉ set created_by nếu có user ID hợp lệ
            if user_id:
                finance_dict['created_by'] = user_id
            
            supabase.table('finances').insert(finance_dict).execute()
        except Exception:
            pass  # Không chặn tạo payment nếu finance creation fail
        
        return PaymentResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment: {str(e)}"
        )

@router.get("/", response_model=List[PaymentWithStudentResponse])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=10000),
    student_id: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách thanh toán"""
    try:
        query = supabase.table('student_payments').select('*')
        
        if student_id:
            query = query.eq('student_id', student_id)
        if classroom_id:
            query = query.eq('classroom_id', classroom_id)
        if payment_status:
            query = query.eq('payment_status', payment_status)
        
        query = query.order('payment_date', desc=True)
        query = query.range(skip, skip + limit - 1)
        
        result = query.execute()
        
        payments = []
        for payment in result.data:
            payment_dict = dict(payment)
            
            # Lấy thông tin học sinh
            try:
                student_result = supabase.table('students').select('student_code').eq('id', payment['student_id']).single().execute()
                if student_result.data:
                    user_result = supabase.table('users').select('full_name').eq('id', student_result.data.get('user_id')).single().execute()
                    if user_result.data:
                        payment_dict['student_name'] = user_result.data['full_name']
                    payment_dict['student_code'] = student_result.data['student_code']
            except:
                pass
            
            # Lấy thông tin lớp học
            try:
                classroom_result = supabase.table('classrooms').select('name, code').eq('id', payment['classroom_id']).single().execute()
                if classroom_result.data:
                    payment_dict['classroom_name'] = classroom_result.data['name']
                    payment_dict['classroom_code'] = classroom_result.data['code']
            except:
                pass
            
            payments.append(PaymentWithStudentResponse(**payment_dict))
        
        return payments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payments: {str(e)}"
        )

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một thanh toán"""
    try:
        result = supabase.table('student_payments').select('*').eq('id', payment_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )
        
        return PaymentResponse(**result.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payment: {str(e)}"
        )

@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    payment_data: PaymentUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thanh toán"""
    try:
        # Check if payment exists
        check_result = supabase.table('student_payments').select('id').eq('id', payment_id).single().execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )
        
        # Build update data
        update_data = {}
        if payment_data.amount is not None:
            update_data['amount'] = payment_data.amount
        if payment_data.payment_date is not None:
            update_data['payment_date'] = payment_data.payment_date
        if payment_data.payment_method is not None:
            update_data['payment_method'] = payment_data.payment_method
        if payment_data.payment_status is not None:
            update_data['payment_status'] = payment_data.payment_status
        if payment_data.due_date is not None:
            update_data['due_date'] = payment_data.due_date
        if payment_data.receipt_number is not None:
            update_data['receipt_number'] = payment_data.receipt_number
        if payment_data.notes is not None:
            update_data['notes'] = payment_data.notes
        if payment_data.discount_percent is not None:
            # Đảm bảo discount_percent trong khoảng 0-100
            update_data['discount_percent'] = max(0, min(100, payment_data.discount_percent))
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        result = supabase.table('student_payments').update(update_data).eq('id', payment_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update payment record"
            )
        
        return PaymentResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating payment: {str(e)}"
        )

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa thanh toán"""
    try:
        # Check if payment exists
        check_result = supabase.table('student_payments').select('id').eq('id', payment_id).single().execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )
        
        supabase.table('student_payments').delete().eq('id', payment_id).execute()
        
        return {"message": "Payment record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting payment: {str(e)}"
        )

@router.get("/classroom/{classroom_id}/summary")
async def get_classroom_payment_summary(
    classroom_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy tổng quan thanh toán của lớp học"""
    try:
        # Lấy tất cả học sinh trong lớp
        students_result = supabase.table('students').select('id').eq('classroom_id', classroom_id).execute()
        student_ids = [s['id'] for s in students_result.data] if students_result.data else []
        
        # Lấy tổng số tiền đã thu
        paid_payments = supabase.table('student_payments').select('amount').eq('classroom_id', classroom_id).eq('payment_status', 'paid').execute()
        total_paid = sum(float(p['amount']) for p in paid_payments.data) if paid_payments.data else 0
        
        # Lấy tổng số tiền chưa thu
        pending_payments = supabase.table('student_payments').select('amount').eq('classroom_id', classroom_id).eq('payment_status', 'pending').execute()
        total_pending = sum(float(p['amount']) for p in pending_payments.data) if pending_payments.data else 0
        
        # Lấy số học sinh đã đóng tiền
        paid_students = supabase.table('student_payments').select('student_id', distinct=True).eq('classroom_id', classroom_id).eq('payment_status', 'paid').execute()
        paid_student_count = len(set(p['student_id'] for p in paid_students.data)) if paid_students.data else 0
        
        # Lấy danh sách học sinh đã đóng tiền
        paid_student_ids = list(set(p['student_id'] for p in paid_students.data)) if paid_students.data else []
        
        return {
            "classroom_id": classroom_id,
            "total_students": len(student_ids),
            "paid_student_count": paid_student_count,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "paid_student_ids": paid_student_ids
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching classroom payment summary: {str(e)}"
        )

