# 🔍 Kiểm Tra Tính Năng Đảo Câu Hỏi Trắc Nghiệm
## Assignment Shuffle Questions Check

**Ngày kiểm tra**: 2025-01-14  
**Kết quả**: ❌ **CHƯA CÓ TÍNH NĂNG ĐẢO CÂU HỎI**

---

## 📊 KẾT QUẢ KIỂM TRA

### ✅ Đã Có (Database & Models)

1. **Database Schema**
   - Field `shuffle_questions` trong bảng `assignments`
   - Type: `BOOLEAN`
   - Default: `FALSE`

2. **Backend Models**
   - `AssignmentCreate.shuffle_questions: bool = False` (line 98)
   - `AssignmentUpdate.shuffle_questions: Optional[bool] = None` (line 119)
   - `AssignmentResponse.shuffle_questions: bool` (line 134)

3. **Frontend Models**
   - `Quiz.shuffleQuestions: boolean` (đã có trong code)

---

### ❌ CHƯA CÓ (Implementation)

#### Backend (`backend/routers/assignments.py`)

**File**: `backend/routers/assignments.py`  
**Function**: `get_questions()` (line 641-655)

```python
@router.get("/{assignment_id}/questions", response_model=List[AssignmentQuestionResponse])
async def get_questions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách câu hỏi của bài tập"""
    try:
        result = supabase.table("assignment_questions").select("*").eq("assignment_id", assignment_id).order("order_index").execute()
        questions = result.data or []
        return [AssignmentQuestionResponse(**q) for q in questions]
```

**Vấn đề**: 
- ❌ Không kiểm tra `shuffle_questions`
- ❌ Luôn sort theo `order_index` (không shuffle)

#### Frontend (`frontend/src/app/student/assignments/[id]/page.tsx`)

**File**: `frontend/src/app/student/assignments/[id]/page.tsx`  
**Line**: 200

```typescript
if (questionsRes.ok) {
    const questionsData = await questionsRes.json();
    setQuestions(questionsData.sort((a: Question, b: Question) => a.order_index - b.order_index));
}
```

**Vấn đề**:
- ❌ Không kiểm tra `assignment.shuffle_questions`
- ❌ Luôn sort theo `order_index` (không shuffle)

---

## 🔧 CẦN IMPLEMENT

### 1. Backend - Shuffle Questions

**File**: `backend/routers/assignments.py`  
**Function**: `get_questions()`

```python
@router.get("/{assignment_id}/questions", response_model=List[AssignmentQuestionResponse])
async def get_questions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách câu hỏi của bài tập"""
    try:
        # Lấy thông tin assignment để kiểm tra shuffle_questions
        assignment_result = supabase.table("assignments").select("shuffle_questions").eq("id", assignment_id).execute()
        assignment = assignment_result.data[0] if assignment_result.data else None
        shuffle_questions = assignment.get("shuffle_questions", False) if assignment else False
        
        # Lấy câu hỏi
        result = supabase.table("assignment_questions").select("*").eq("assignment_id", assignment_id).order("order_index").execute()
        questions = result.data or []
        
        # Shuffle nếu được bật
        if shuffle_questions:
            import random
            random.shuffle(questions)
        
        return [AssignmentQuestionResponse(**q) for q in questions]
        
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return []
```

### 2. Frontend - Shuffle Questions

**File**: `frontend/src/app/student/assignments/[id]/page.tsx`  
**Line**: 198-201

```typescript
if (questionsRes.ok) {
    const questionsData = await questionsRes.json();
    
    // Shuffle nếu assignment có shuffle_questions = true
    if (assignmentData.shuffle_questions) {
        // Fisher-Yates shuffle algorithm
        const shuffled = [...questionsData];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setQuestions(shuffled);
    } else {
        setQuestions(questionsData.sort((a: Question, b: Question) => a.order_index - b.order_index));
    }
}
```

### 3. Shuffle Options (Cho Multiple Choice)

Nếu muốn đảo cả các lựa chọn (A, B, C, D) trong mỗi câu hỏi:

```typescript
// Shuffle options trong mỗi câu hỏi
if (assignmentData.shuffle_questions) {
    const shuffled = questionsData.map(question => {
        if (question.question_type === 'multiple_choice' && question.options) {
            // Shuffle options
            const shuffledOptions = [...question.options];
            for (let i = shuffledOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
            }
            
            // Update correct_answer to match new position
            const oldCorrectIndex = question.options.findIndex(opt => opt.id === question.correct_answer);
            if (oldCorrectIndex >= 0) {
                question.correct_answer = shuffledOptions[oldCorrectIndex].id;
            }
            
            return { ...question, options: shuffledOptions };
        }
        return question;
    });
    
    // Shuffle questions
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setQuestions(shuffled);
}
```

---

## 📋 CHECKLIST IMPLEMENTATION

### Backend
- [ ] Update `get_questions()` để kiểm tra `shuffle_questions`
- [ ] Implement shuffle logic (Fisher-Yates)
- [ ] Test với `shuffle_questions = true`
- [ ] Test với `shuffle_questions = false`

### Frontend
- [ ] Update `loadAssignment()` để kiểm tra `shuffle_questions`
- [ ] Implement shuffle logic (Fisher-Yates)
- [ ] Optional: Shuffle options trong mỗi câu hỏi
- [ ] Test với `shuffle_questions = true`
- [ ] Test với `shuffle_questions = false`

### Testing
- [ ] Test shuffle questions
- [ ] Test shuffle options (nếu implement)
- [ ] Test với nhiều học sinh (mỗi người có thứ tự khác nhau)
- [ ] Test với `shuffle_questions = false` (giữ nguyên thứ tự)

---

## 🎯 LƯU Ý

1. **Shuffle mỗi lần load**: Mỗi học sinh sẽ thấy thứ tự câu hỏi khác nhau
2. **Shuffle options**: Cần cập nhật `correct_answer` để match với vị trí mới
3. **Consistency**: Nếu muốn mỗi học sinh có thứ tự cố định (nhưng khác nhau), cần lưu thứ tự đã shuffle vào database
4. **Performance**: Shuffle ở backend tốt hơn frontend (tránh client-side manipulation)

---

## 📝 KẾT LUẬN

**Tính năng đảo câu hỏi đã được thiết kế nhưng chưa được implement.**

- ✅ Database schema: Có
- ✅ Backend models: Có
- ✅ Frontend models: Có
- ❌ Backend logic: Chưa có
- ❌ Frontend logic: Chưa có

**Cần implement cả backend và frontend để tính năng hoạt động.**

