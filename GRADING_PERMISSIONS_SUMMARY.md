# Tóm tắt Phân quyền Quản lý Điểm số

## Đã triển khai

### 1. Backend API - Phân quyền đầy đủ ✅

#### `GET /api/assignments`
- **Admin**: Có thể xem tất cả bài tập, có thể filter theo `teacher_id`
- **Teacher**: Tự động filter chỉ hiển thị bài tập của chính giáo viên đó
  - Nếu giáo viên cố gắng filter theo `teacher_id` khác → 403 Forbidden

#### `GET /api/assignments/{assignment_id}/submissions`
- **Admin**: Có thể xem bài nộp của tất cả assignment
- **Teacher**: Chỉ có thể xem bài nộp của assignment thuộc về mình
  - Validation: Kiểm tra `assignment.teacher_id == current_teacher_id`
  - Nếu không thuộc về giáo viên → 403 Forbidden

#### `PUT /api/assignments/{assignment_id}/submissions/{submission_id}/grade`
- **Admin**: Có thể chấm điểm tất cả bài nộp
- **Teacher**: Chỉ có thể chấm điểm bài nộp của assignment thuộc về mình
  - Validation: Kiểm tra `assignment.teacher_id == current_teacher_id`
  - Nếu không thuộc về giáo viên → 403 Forbidden

#### `GET /api/assignments/{assignment_id}/statistics`
- **Admin**: Có thể xem thống kê tất cả assignment
- **Teacher**: Chỉ có thể xem thống kê assignment thuộc về mình
  - Validation: Kiểm tra `assignment.teacher_id == current_teacher_id`
  - Nếu không thuộc về giáo viên → 403 Forbidden

### 2. Frontend - Filter tự động ✅

#### Trang `/grades` (Quản lý điểm số tổng quan)
- **Admin**: Load tất cả assignments (không filter)
- **Teacher**: Tự động filter theo `teacher_id` khi load data
  ```typescript
  if (isTeacher) {
      // Get teacher_id from user
      const teacherRes = await fetch(`${API_BASE_URL}/api/teachers?user_id=${user.id}`);
      if (teacherRes.ok) {
          const teachersData = await teacherRes.json();
          if (teachersData.length > 0) {
              url += `&teacher_id=${teachersData[0].id}`;
          }
      }
  }
  ```

#### Trang `/teacher/assignments/[id]/submissions` (Chấm điểm - Teacher)
- Chỉ hiển thị assignment của giáo viên đó (backend đã validate)
- Nếu giáo viên cố truy cập assignment của giáo viên khác → Backend trả về 403

#### Trang `/admin/assignments/[id]/submissions` (Chấm điểm - Admin)
- Có thể xem và chấm điểm tất cả assignment

## Helper Functions

### `validate_assignment_access()`
```python
def validate_assignment_access(
    supabase: Client,
    assignment_id: str,
    current_user: User
) -> bool:
    """Kiểm tra giáo viên có quyền truy cập assignment không
    - Admin: có quyền truy cập tất cả
    - Teacher: chỉ có quyền truy cập assignment của chính mình
    """
```

## Luồng hoạt động

### Giáo viên xem danh sách bài tập
1. Frontend gọi `GET /api/assignments?teacher_id={teacher_id}`
2. Backend tự động filter nếu là teacher (override nếu teacher_id khác)
3. Trả về chỉ bài tập của giáo viên đó

### Giáo viên xem/chấm bài nộp
1. Frontend gọi `GET /api/assignments/{id}/submissions`
2. Backend kiểm tra `validate_assignment_access()`
3. Nếu không có quyền → 403 Forbidden
4. Nếu có quyền → Trả về danh sách bài nộp

### Admin xem/chấm bài nộp
1. Frontend gọi `GET /api/assignments/{id}/submissions`
2. Backend kiểm tra role = ADMIN → Cho phép
3. Trả về danh sách bài nộp

## Bảo mật

✅ **Đã đảm bảo:**
- Giáo viên không thể xem/chấm assignment của giáo viên khác
- Giáo viên không thể filter xem assignment của giáo viên khác
- Admin có quyền truy cập đầy đủ
- Validation ở cả backend (bắt buộc) và frontend (UX tốt hơn)

## Test Cases

### Test Case 1: Giáo viên xem assignment của mình
- ✅ Có thể xem danh sách
- ✅ Có thể xem bài nộp
- ✅ Có thể chấm điểm
- ✅ Có thể xem thống kê

### Test Case 2: Giáo viên cố xem assignment của giáo viên khác
- ✅ Không thể xem danh sách (filter tự động)
- ✅ Không thể xem bài nộp (403 Forbidden)
- ✅ Không thể chấm điểm (403 Forbidden)
- ✅ Không thể xem thống kê (403 Forbidden)

### Test Case 3: Admin xem tất cả
- ✅ Có thể xem tất cả assignment
- ✅ Có thể xem bài nộp của bất kỳ assignment nào
- ✅ Có thể chấm điểm bất kỳ bài nộp nào
- ✅ Có thể xem thống kê của bất kỳ assignment nào


