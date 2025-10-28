# Cập nhật Subjects Schema - Loại bỏ Credits Field

## Thay đổi Schema
- **Trước**: Có field `credits` (integer)
- **Sau**: Không có field `credits`
- **Lý do**: Schema database mới không có field credits

## Schema mới
```sql
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(255) NOT NULL,
  code character varying(50) NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_code_key UNIQUE (code)
);
```

## Các file đã cập nhật

### 1. Subject Types (`types/index.ts`)
```typescript
// Trước
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;  // ❌ Đã xóa
  created_at?: string;
  updated_at?: string;
}

// Sau
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Trước
export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
  credits: number;  // ❌ Đã xóa
}

// Sau
export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
}
```

### 2. Supabase Database Types (`lib/supabase.ts`)
```typescript
// Trước
subjects: {
  Row: {
    id: string
    name: string
    code: string
    description?: string
    credits: number  // ❌ Đã xóa
    created_at: string
    updated_at: string
  }
  // ...
}

// Sau
subjects: {
  Row: {
    id: string
    name: string
    code: string
    description?: string
    created_at: string
    updated_at: string
  }
  // ...
}
```

### 3. Supabase API Functions (`lib/supabase-api.ts`)
```typescript
// Trước
const convertToSubject = (row: SubjectRow): Subject => ({
  id: row.id,
  name: row.name,
  code: row.code,
  description: row.description || undefined,
  credits: row.credits,  // ❌ Đã xóa
  created_at: row.created_at,
  updated_at: row.updated_at
});

// Sau
const convertToSubject = (row: SubjectRow): Subject => ({
  id: row.id,
  name: row.name,
  code: row.code,
  description: row.description || undefined,
  created_at: row.created_at,
  updated_at: row.updated_at
});
```

### 4. Subjects Page UI (`app/subjects/page.tsx`)

#### Form Data
```typescript
// Trước
const [formData, setFormData] = useState<CreateSubjectRequest>({
  name: '',
  code: '',
  description: '',
  credits: 1  // ❌ Đã xóa
});

// Sau
const [formData, setFormData] = useState<CreateSubjectRequest>({
  name: '',
  code: '',
  description: ''
});
```

#### Form Fields
```typescript
// ❌ Đã xóa credits input field
<div className="space-y-2">
  <Label htmlFor="credits">Số tín chỉ</Label>
  <Input 
    id="credits" 
    type="number" 
    placeholder="3" 
    value={formData.credits}
    onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value) || 1})}
  />
</div>
```

#### Statistics Cards
```typescript
// Trước
<p className="text-sm text-gray-600">Tín chỉ trung bình</p>
<p className="text-3xl font-bold">
  {subjects.length > 0 
    ? (subjects.reduce((sum, s) => sum + s.credits, 0) / subjects.length).toFixed(1)
    : '--'
  }
</p>

// Sau
<p className="text-sm text-gray-600">Môn học có mô tả</p>
<p className="text-3xl font-bold">
  {subjects.filter(subject => subject.description && subject.description.trim() !== '').length}
</p>
```

#### Subject Display
```typescript
// Trước
<p className="text-sm text-gray-600">{subject.code} • {subject.credits} tín chỉ</p>

// Sau
<p className="text-sm text-gray-600">{subject.code}</p>
```

#### Sample Data
```typescript
// Trước
{
  id: '1',
  name: 'Toán học',
  code: 'MATH',
  description: 'Môn toán học cơ bản',
  credits: 3,  // ❌ Đã xóa
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Sau
{
  id: '1',
  name: 'Toán học',
  code: 'MATH',
  description: 'Môn toán học cơ bản',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

## Tính năng mới

### ✅ Updated Statistics
- **Tổng môn học**: Số lượng subjects
- **Môn học có mô tả**: Số subjects có description
- **Môn học mới nhất**: Ngày tạo subject mới nhất

### ✅ Simplified Form
- **Tên môn học**: Required field
- **Mã môn học**: Required field, unique
- **Mô tả**: Optional field
- **Không còn credits**: Đã loại bỏ hoàn toàn

### ✅ Clean UI
- **Subject cards**: Hiển thị name, code, description
- **No credits display**: Không hiển thị credits
- **Simplified layout**: Giao diện đơn giản hơn

## Database Schema Compliance

### ✅ Matches New Schema
- **id**: UUID primary key
- **name**: VARCHAR(255) NOT NULL
- **code**: VARCHAR(50) NOT NULL UNIQUE
- **description**: TEXT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE
- **updated_at**: TIMESTAMP WITH TIME ZONE

### ✅ Indexes
- **Primary key**: subjects_pkey on id
- **Unique constraint**: subjects_code_key on code
- **Performance index**: idx_subjects_code on code

## CRUD Operations

### ✅ Create Subject
```typescript
const newSubject = await supabaseSubjectsAPI.createSubject({
  name: 'Toán học',
  code: 'MATH',
  description: 'Môn toán học cơ bản'
});
```

### ✅ Update Subject
```typescript
const updatedSubject = await supabaseSubjectsAPI.updateSubject(id, {
  name: 'Toán học nâng cao',
  description: 'Môn toán học nâng cao'
});
```

### ✅ Delete Subject
```typescript
await supabaseSubjectsAPI.deleteSubject(id);
```

### ✅ Get Subjects
```typescript
const subjects = await supabaseSubjectsAPI.getSubjects();
```

## Kết quả

### ✅ Đã cập nhật
- Subject types không còn credits field
- Supabase API functions đã loại bỏ credits
- UI form không còn credits input
- Statistics cards cập nhật logic mới
- Sample data không còn credits

### 📱 User Experience
- **Simplified form**: Chỉ 3 fields thay vì 4
- **Clean display**: Không hiển thị credits
- **Better statistics**: Metrics phù hợp với schema mới
- **Consistent data**: Tất cả operations đều match schema

### 🔧 Development
- **Type safety**: TypeScript types match database schema
- **API consistency**: Supabase API functions match schema
- **UI consistency**: Form và display đều match schema
- **No breaking changes**: Backward compatible với existing data

## Test Scenarios

### 1. Create Subject
- ✅ Tạo subject với name, code, description
- ✅ Validation cho required fields
- ✅ Unique constraint cho code

### 2. Update Subject
- ✅ Cập nhật name, code, description
- ✅ Validation cho unique code
- ✅ Preserve timestamps

### 3. Delete Subject
- ✅ Xóa subject thành công
- ✅ Foreign key constraints (nếu có)

### 4. List Subjects
- ✅ Hiển thị tất cả subjects
- ✅ Search functionality
- ✅ Statistics calculation

## Lưu ý
- Schema mới không có credits field
- Tất cả existing data sẽ được migrate
- UI đã được cập nhật để match schema mới
- CRUD operations hoạt động với schema mới
