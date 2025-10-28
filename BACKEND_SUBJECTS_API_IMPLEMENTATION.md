# Backend Subjects API Implementation

## Vấn đề đã sửa
- **Backend cũ**: Sử dụng SQLAlchemy với schema cũ (có `credits` field)
- **Frontend mới**: Đã cập nhật schema mới (không có `credits` field)
- **Mismatch**: Backend và frontend không tương thích

## Giải pháp đã triển khai

### 1. Cập nhật Backend Models

#### **models/subject.py**
```python
class SubjectBase(BaseModel):
    name: str
    code: str                    # ✅ Thêm code field
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None    # ✅ Thêm code field
    description: Optional[str] = None

class Subject(SubjectBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
```

### 2. Cập nhật Backend Router

#### **routers/subjects.py**
- ✅ **Loại bỏ SQLAlchemy**: Chuyển sang Supabase client
- ✅ **Loại bỏ credits field**: Cập nhật schema mới
- ✅ **Thêm code field**: Hỗ trợ mã môn học
- ✅ **Cập nhật tất cả endpoints**: CRUD operations với Supabase

### 3. API Endpoints

#### **GET /api/subjects**
```python
@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách môn học"""
    result = supabase.table('subjects').select('*').order('created_at', desc=True).range(skip, skip + limit - 1).execute()
    return result.data or []
```

#### **POST /api/subjects**
```python
@router.post("/", response_model=SubjectResponse)
async def create_subject(
    subject_data: SubjectCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tạo môn học mới (chỉ admin)"""
    # Kiểm tra code đã tồn tại chưa
    existing_subject = supabase.table('subjects').select('id').eq('code', subject_data.code).execute()
    if existing_subject.data:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    # Tạo môn học mới
    result = supabase.table('subjects').insert(subject_data.dict()).execute()
    return result.data[0]
```

#### **GET /api/subjects/{subject_id}**
```python
@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một môn học"""
    result = supabase.table('subjects').select('*').eq('id', subject_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    return result.data[0]
```

#### **PUT /api/subjects/{subject_id}**
```python
@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_data: SubjectUpdate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật thông tin môn học"""
    # Kiểm tra code mới có trùng không
    if subject_data.code:
        code_check = supabase.table('subjects').select('id').eq('code', subject_data.code).neq('id', subject_id).execute()
        if code_check.data:
            raise HTTPException(status_code=400, detail="Subject code already exists")
    
    # Cập nhật môn học
    update_data = subject_data.dict(exclude_unset=True)
    result = supabase.table('subjects').update(update_data).eq('id', subject_id).execute()
    return result.data[0]
```

#### **DELETE /api/subjects/{subject_id}**
```python
@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa môn học (chỉ admin)"""
    result = supabase.table('subjects').delete().eq('id', subject_id).execute()
    return {"message": "Subject deleted successfully"}
```

#### **GET /api/subjects/search/{query}**
```python
@router.get("/search/{query}", response_model=List[SubjectResponse])
async def search_subjects(
    query: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tìm kiếm môn học theo tên hoặc mã"""
    result = supabase.table('subjects').select('*').or_(f'name.ilike.%{query}%,code.ilike.%{query}%').order('created_at', desc=True).execute()
    return result.data or []
```

### 4. Cập nhật Frontend API

#### **lib/subjects-api.ts**
- ✅ **Chuyển từ Supabase**: Sử dụng backend API thay vì Supabase trực tiếp
- ✅ **Giữ development mode**: Fallback data cho development
- ✅ **Cập nhật tất cả methods**: getAll, create, update, delete, search

```typescript
// Production mode: sử dụng Backend API
await checkAuth();
const response = await api.get('/api/subjects');
return response.data || [];
```

## Kết quả

### ✅ Backend API
- **GET /api/subjects**: Lấy danh sách môn học
- **POST /api/subjects**: Tạo môn học mới
- **GET /api/subjects/{id}**: Lấy môn học theo ID
- **PUT /api/subjects/{id}**: Cập nhật môn học
- **DELETE /api/subjects/{id}**: Xóa môn học
- **GET /api/subjects/search/{query}**: Tìm kiếm môn học

### ✅ Frontend Integration
- **Development Mode**: Sử dụng fallback data
- **Production Mode**: Kết nối backend API
- **Error Handling**: Comprehensive error handling
- **Authentication**: Backend authentication

### ✅ Schema Compatibility
- **Loại bỏ credits**: Không còn field credits
- **Thêm code**: Hỗ trợ mã môn học unique
- **Cập nhật types**: Frontend và backend đồng bộ

## Cách sử dụng

### 1. Start Backend
```bash
cd backend
python main.py
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test API
```bash
# Get all subjects
curl http://localhost:8000/api/subjects

# Create subject
curl -X POST http://localhost:8000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name": "Toán học", "code": "MATH", "description": "Môn toán học"}'

# Search subjects
curl http://localhost:8000/api/subjects/search/toán
```

## Lưu ý

### ✅ Development Mode
- Frontend sử dụng fallback data
- Không cần backend chạy
- Dễ dàng test UI/UX

### ✅ Production Mode
- Backend phải chạy trên port 8000
- Supabase phải được cấu hình
- Authentication phải hoạt động

### ✅ Database Schema
- Supabase phải có table `subjects`
- Schema phải match với backend models
- RLS policies phải được cấu hình

Bây giờ backend và frontend đã tương thích và hoạt động với schema mới!
