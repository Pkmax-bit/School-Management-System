"""
Expense Categories Router
Router cho quản lý danh mục chi phí
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, constr
from supabase import Client

from database import get_db
from routers.auth import get_current_user_dev

router = APIRouter()


class ExpenseCategoryCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=255)
    code: Optional[str] = None  # Optional, sẽ tự động tạo nếu không có
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ExpenseCategoryResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


def _generate_next_category_code(supabase: Client) -> str:
    """Hàm helper để tạo mã danh mục tiếp theo theo mẫu DM001, DM002, ..."""
    # Lấy tất cả code dạng DM### (giới hạn để an toàn)
    codes_res = supabase.table('expense_categories').select('code').ilike('code', 'DM%').limit(1000).execute()
    
    # Tìm mã tiếp theo có sẵn
    attempt = 1
    while attempt <= 999:  # Giới hạn tối đa DM999
        candidate = f"DM{attempt:03d}"
        dup = supabase.table('expense_categories').select('id').eq('code', candidate).execute()
        if not dup.data:
            return candidate
        attempt += 1
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Không thể tạo mã danh mục mới (đã đạt giới hạn DM999)"
    )


@router.get("/next-code")
async def get_next_category_code(
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy mã danh mục tiếp theo theo mẫu DM001, DM002, ..."""
    try:
        next_code = _generate_next_category_code(supabase)
        return {"next_code": next_code}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy mã danh mục tiếp theo: {str(e)}"
        )


@router.post("/", response_model=ExpenseCategoryResponse)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Tạo danh mục chi phí mới"""
    try:
        # Tự động tạo code nếu không có
        category_code = category_data.code
        if not category_code or not category_code.strip():
            # Lấy mã tiếp theo
            category_code = _generate_next_category_code(supabase)
        else:
            # Normalize code: uppercase và strip
            category_code = category_code.strip().upper()
            # Check if code already exists
            existing = supabase.table('expense_categories').select('id').eq('code', category_code).execute()
            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mã danh mục '{category_code}' đã tồn tại"
                )

        # Create category
        category_dict = category_data.model_dump()
        category_dict['code'] = category_code
        # Không set created_by (không cần ghi ai tạo)
        if 'created_by' in category_dict:
            del category_dict['created_by']

        # Insert và chỉ select các cột cần thiết (không có created_by)
        result = supabase.table('expense_categories').insert(
            category_dict
        ).select('id, name, code, description, color, is_active, sort_order, created_at, updated_at').execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tạo danh mục chi phí"
            )

        # Loại bỏ created_by nếu có trong response (phòng trường hợp cache)
        data = result.data[0]
        if 'created_by' in data:
            del data['created_by']

        return ExpenseCategoryResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo danh mục chi phí: {str(e)}"
        )


@router.get("/", response_model=List[ExpenseCategoryResponse])
async def get_expense_categories(
    is_active: Optional[bool] = None,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách danh mục chi phí"""
    try:
        # Chỉ select các cột cần thiết (không có created_by)
        query = supabase.table('expense_categories').select('id, name, code, description, color, is_active, sort_order, created_at, updated_at')
        
        if is_active is not None:
            query = query.eq('is_active', is_active)
        
        query = query.order('sort_order').order('name')
        result = query.execute()

        # Loại bỏ created_by nếu có trong response (phòng trường hợp cache)
        categories = []
        for item in (result.data or []):
            if 'created_by' in item:
                del item['created_by']
            categories.append(ExpenseCategoryResponse(**item))

        return categories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách danh mục chi phí: {str(e)}"
        )


@router.get("/{category_id}", response_model=ExpenseCategoryResponse)
async def get_expense_category(
    category_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin danh mục chi phí"""
    try:
        # Chỉ select các cột cần thiết (không có created_by)
        result = supabase.table('expense_categories').select(
            'id, name, code, description, color, is_active, sort_order, created_at, updated_at'
        ).eq('id', category_id).single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy danh mục chi phí"
            )

        # Loại bỏ created_by nếu có trong response (phòng trường hợp cache)
        data = result.data
        if 'created_by' in data:
            del data['created_by']

        return ExpenseCategoryResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy thông tin danh mục chi phí: {str(e)}"
        )


@router.put("/{category_id}", response_model=ExpenseCategoryResponse)
async def update_expense_category(
    category_id: str,
    category_data: ExpenseCategoryUpdate,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Cập nhật danh mục chi phí"""
    try:
        # Check if category exists
        existing = supabase.table('expense_categories').select('id').eq('id', category_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy danh mục chi phí"
            )

        # Check if code already exists (if updating code)
        if category_data.code:
            code_check = supabase.table('expense_categories').select('id').eq('code', category_data.code).neq('id', category_id).execute()
            if code_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mã danh mục '{category_data.code}' đã tồn tại"
                )

        # Update category
        update_dict = {k: v for k, v in category_data.model_dump().items() if v is not None}
        # Không cho phép update created_by
        if 'created_by' in update_dict:
            del update_dict['created_by']
        
        # Update và chỉ select các cột cần thiết (không có created_by)
        result = supabase.table('expense_categories').update(update_dict).eq('id', category_id).select(
            'id, name, code, description, color, is_active, sort_order, created_at, updated_at'
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể cập nhật danh mục chi phí"
            )

        # Loại bỏ created_by nếu có trong response (phòng trường hợp cache)
        data = result.data[0]
        if 'created_by' in data:
            del data['created_by']

        return ExpenseCategoryResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật danh mục chi phí: {str(e)}"
        )


@router.delete("/{category_id}")
async def delete_expense_category(
    category_id: str,
    current_user = Depends(get_current_user_dev),
    supabase: Client = Depends(get_db)
):
    """Xóa danh mục chi phí"""
    try:
        # Check if category exists
        existing = supabase.table('expense_categories').select('id').eq('id', category_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy danh mục chi phí"
            )

        # Check if category is used in finances
        finances_check = supabase.table('finances').select('id').eq('category', existing.data.get('code')).limit(1).execute()
        if finances_check.data:
            # Instead of deleting, deactivate it
            result = supabase.table('expense_categories').update({'is_active': False}).eq('id', category_id).execute()
            return {"message": "Danh mục đã được vô hiệu hóa vì đang được sử dụng", "deactivated": True}
        else:
            # Delete if not used
            result = supabase.table('expense_categories').delete().eq('id', category_id).execute()
            return {"message": "Danh mục đã được xóa", "deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa danh mục chi phí: {str(e)}"
        )

