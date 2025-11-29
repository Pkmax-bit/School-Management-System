# Cách hệ thống lưu trữ số lần làm bài

## 1. Nơi lưu trữ

### Bảng `assignment_submissions`
- **Vị trí**: Database Supabase
- **Mục đích**: Lưu trữ mỗi lần học sinh nộp bài tập
- **Cấu trúc**:
  ```sql
  CREATE TABLE assignment_submissions (
      id UUID PRIMARY KEY,
      assignment_id UUID REFERENCES assignments(id),
      student_id UUID REFERENCES students(id),
      answers JSONB NOT NULL,
      files JSONB DEFAULT '[]'::jsonb,
      links JSONB DEFAULT '[]'::jsonb,
      score DECIMAL(5,2),
      is_graded BOOLEAN DEFAULT FALSE,
      feedback TEXT,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      graded_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(assignment_id, student_id)  -- ⚠️ Quan trọng: Mỗi học sinh chỉ có 1 submission
  );
  ```

### Bảng `assignments`
- **Cột `attempts_allowed`**: Lưu số lượt tối đa cho phép làm bài
- **Ví dụ**: `attempts_allowed = 1` nghĩa là chỉ được làm 1 lần

## 2. Cách đếm số lượt

### Logic hiện tại:
```python
# Backend: backend/routers/assignments.py (dòng 767-774)
existing_submissions = supabase.table("assignment_submissions")
    .select("id")
    .eq("assignment_id", assignment_id)
    .eq("student_id", submission_data.student_id)
    .execute()

attempts_allowed = assignment.get("attempts_allowed", 1)

if existing_submissions.data and len(existing_submissions.data) >= attempts_allowed:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Bạn đã hết lượt làm bài (tối đa {attempts_allowed} lần)"
    )
```

### Frontend:
```typescript
// frontend/src/app/student/assignments/page.tsx
const getAttemptsInfo = (assignment: Assignment) => {
  const submission = submissions[assignment.id];
  const attemptsUsed = submission ? 1 : 0;  // Đếm từ submission
  const attemptsRemaining = assignment.attempts_allowed - attemptsUsed;
  return { attemptsUsed, attemptsRemaining, ... };
};
```

## 3. Vấn đề hiện tại

### ⚠️ Constraint UNIQUE
- Bảng `assignment_submissions` có constraint `UNIQUE(assignment_id, student_id)`
- **Hệ quả**: Mỗi học sinh chỉ có thể có **1 submission** cho mỗi assignment
- **Vấn đề**: Nếu `attempts_allowed > 1`, hệ thống không thể lưu nhiều lần làm bài

### Giải pháp hiện tại:
- Hệ thống chỉ hỗ trợ `attempts_allowed = 1` (làm 1 lần)
- Nếu muốn làm lại, cần xóa submission cũ trước

## 4. Cách kiểm tra số lượt

### Backend (khi nộp bài):
1. Query `assignment_submissions` với `assignment_id` và `student_id`
2. Đếm số lượng submissions: `len(existing_submissions.data)`
3. So sánh với `attempts_allowed`
4. Nếu `>= attempts_allowed` → Từ chối nộp bài

### Frontend (hiển thị):
1. Load submissions từ API: `/api/assignments/{id}/submissions`
2. Tìm submission của học sinh hiện tại
3. Tính toán:
   - `attemptsUsed = submission ? 1 : 0`
   - `attemptsRemaining = attempts_allowed - attemptsUsed`

## 5. Luồng hoạt động

```
1. Học sinh bấm "Làm bài"
   ↓
2. Frontend kiểm tra: Có submission chưa?
   - Nếu có → Hiển thị "Đã hết lượt"
   - Nếu chưa → Cho phép vào làm bài
   ↓
3. Học sinh làm bài và nộp
   ↓
4. Backend kiểm tra:
   - Query assignment_submissions
   - Đếm số submissions hiện có
   - So sánh với attempts_allowed
   ↓
5. Nếu còn lượt:
   - Insert submission mới vào assignment_submissions
   - Lưu answers, files, links, score, etc.
   ↓
6. Nếu hết lượt:
   - Trả về lỗi: "Bạn đã hết lượt làm bài"
```

## 6. Tóm tắt

- **Lưu ở đâu**: Bảng `assignment_submissions` trong database
- **Cách đếm**: Đếm số lượng rows trong `assignment_submissions` với cùng `assignment_id` và `student_id`
- **Giới hạn**: Hiện tại chỉ hỗ trợ 1 lần làm bài do constraint UNIQUE
- **Cải thiện**: Nếu muốn hỗ trợ nhiều lần làm bài, cần:
  1. Xóa constraint UNIQUE
  2. Thêm cột `attempt_number` để đánh số lần làm
  3. Cập nhật logic đếm số lượt


