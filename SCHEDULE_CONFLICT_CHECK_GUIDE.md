# Hướng Dẫn Kiểm Tra Xung Đột Lịch Học

## Tổng Quan

Hệ thống kiểm tra xung đột khi tạo/cập nhật lịch học để đảm bảo:
- **Không có 2 lịch học cùng sử dụng một phòng** trong cùng một khung giờ
- **Cùng cơ sở (campus)** và **cùng ngày trong tuần**

## Cách Hoạt Động

### 1. Frontend - Kiểm Tra Xung Đột (Đang Hoạt Động)

**Vị trí:** `frontend/src/app/schedule/page.tsx`

**Hàm:** `checkRoomConflict()`

```typescript
const checkRoomConflict = async (
  room: string,           // Tên phòng học
  dayOfWeek: number,      // Ngày trong tuần (0=Thứ 2, 6=Chủ nhật)
  startTime: string,      // Giờ bắt đầu (format: "HH:MM")
  endTime: string,        // Giờ kết thúc (format: "HH:MM")
  campusId: string,       // ID cơ sở
  excludeId?: string      // ID lịch cần loại trừ (khi edit)
)
```

**Quy trình kiểm tra:**

1. **Lấy danh sách lịch học hiện có:**
   - Lọc theo `campus_id` và `day_of_week`
   - Lấy tất cả lịch học trong cùng cơ sở và cùng ngày

2. **Lọc các lịch cùng phòng:**
   - Tìm các lịch có `room` trùng với phòng mới
   - Loại trừ lịch hiện tại nếu đang edit (dùng `excludeId`)

3. **Kiểm tra xung đột thời gian:**
   - Công thức: `newStart < existingEnd && newEnd > existingStart`
   - Nếu có xung đột → Trả về `{ hasConflict: true, message: "..." }`
   - Nếu không có xung đột → Trả về `{ hasConflict: false }`

**Ví dụ xung đột:**
```
Lịch hiện có: 08:00 - 09:00 (phòng A101, Thứ 2)
Lịch mới:     08:30 - 09:30 (phòng A101, Thứ 2)
→ XUNG ĐỘT (vì 08:30 < 09:00 và 09:30 > 08:00)
```

**Ví dụ không xung đột:**
```
Lịch hiện có: 08:00 - 09:00 (phòng A101, Thứ 2)
Lịch mới:     09:00 - 10:00 (phòng A101, Thứ 2)
→ KHÔNG XUNG ĐỘT (vì 09:00 = 09:00, không overlap)
```

### 2. Backend - Kiểm Tra Xung Đột (Đang Bị Disable)

**Vị trí:** `backend/routers/schedules.py`

**Trạng thái:** Code kiểm tra xung đột đang bị comment (dòng 78-113)

**Lý do:** Đã tạm thời disable để debug

**Code đã có sẵn:**
```python
# Kiểm tra xung đột phòng học: cùng phòng, cùng cơ sở, cùng khung giờ
if schedule_data.room and campus_id:
    # Tìm các lịch học có cùng phòng, cùng cơ sở, cùng ngày trong tuần
    conflict_query = supabase.table("schedules").select("""
        id,
        start_time,
        end_time,
        room,
        classrooms!inner(
            campus_id
        )
    """).eq("day_of_week", schedule_data.day_of_week).eq("room", schedule_data.room)
    
    # Filter by campus_id through classroom
    conflict_result = conflict_query.eq("classrooms.campus_id", campus_id).execute()
    
    if conflict_result.data:
        # Kiểm tra xung đột thời gian
        new_start = time.fromisoformat(...)
        new_end = time.fromisoformat(...)
        
        for existing in conflict_result.data:
            existing_start = time.fromisoformat(existing["start_time"])
            existing_end = time.fromisoformat(existing["end_time"])
            
            # Kiểm tra xung đột thời gian
            if (new_start < existing_end and new_end > existing_start):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Phòng {schedule_data.room} đã được sử dụng..."
                )
```

## Các Loại Xung Đột Được Kiểm Tra

### ✅ Xung Đột Phòng Học (Room Conflict)
- **Điều kiện:** Cùng phòng + Cùng cơ sở + Cùng ngày + Khung giờ trùng nhau
- **Ví dụ:** 
  - Phòng A101, Cơ sở 1, Thứ 2, 08:00-09:00
  - Phòng A101, Cơ sở 1, Thứ 2, 08:30-09:30
  - → **XUNG ĐỘT**

### ❌ Chưa Kiểm Tra: Xung Đột Giáo Viên (Teacher Conflict)
- Hiện tại hệ thống **CHƯA** kiểm tra xung đột giáo viên
- Có thể có 2 lịch học cùng giáo viên trong cùng khung giờ

### ❌ Chưa Kiểm Tra: Xung Đột Lớp Học (Classroom Conflict)
- Hiện tại hệ thống **CHƯA** kiểm tra xung đột lớp học
- Có thể có 2 lịch học cùng lớp trong cùng khung giờ

## Cách Sử Dụng

### Khi Tạo Lịch Mới

1. Người dùng nhập thông tin lịch học
2. Hệ thống tự động gọi `checkRoomConflict()` trước khi tạo
3. Nếu có xung đột → Hiển thị cảnh báo và không cho tạo
4. Nếu không có xung đột → Tiến hành tạo lịch

**Code trong `handleCreate()`:**
```typescript
// Kiểm tra xung đột phòng học
if (scheduleItem.room && selectedCampus) {
  const conflictCheck = await checkRoomConflict(
    scheduleItem.room,
    scheduleItem.day_of_week,
    scheduleItem.start_time,
    scheduleItem.end_time,
    selectedCampus
  );
  
  if (conflictCheck.hasConflict) {
    alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${conflictCheck.message}`);
    return;
  }
}
```

### Khi Cập Nhật Lịch

1. Tương tự như tạo mới
2. Thêm tham số `excludeId` để loại trừ lịch hiện tại khỏi danh sách kiểm tra

**Code trong `handleUpdate()`:**
```typescript
const conflictCheck = await checkRoomConflict(
  formData.room,
  formData.day_of_week,
  formData.start_time,
  formData.end_time,
  selectedCampus,
  editingSchedule.id  // Loại trừ lịch hiện tại
);
```

## Test Xung Đột

Có sẵn file test: `test_room_conflict.py`

**Chạy test:**
```bash
python test_room_conflict.py
```

**Test cases:**
1. ✅ Tạo lịch đầu tiên (thành công)
2. ✅ Tạo lịch xung đột (cùng phòng, cùng giờ) → Phải bị chặn
3. ✅ Tạo lịch khác phòng (thành công)
4. ✅ Tạo lịch khác giờ (thành công)

## Cải Thiện Đề Xuất

### 1. Bật Lại Kiểm Tra Xung Đột Ở Backend
- Uncomment code ở `backend/routers/schedules.py` (dòng 78-113)
- Đảm bảo kiểm tra xung đột ở cả frontend và backend

### 2. Thêm Kiểm Tra Xung Đột Giáo Viên
```typescript
const checkTeacherConflict = async (
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string
) => {
  // Tương tự checkRoomConflict nhưng lọc theo teacher_id
}
```

### 3. Thêm Kiểm Tra Xung Đột Lớp Học
```typescript
const checkClassroomConflict = async (
  classroomId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string
) => {
  // Kiểm tra xem lớp học đã có lịch trong khung giờ này chưa
}
```

### 4. Hiển Thị Cảnh Báo Trước Khi Lưu
- Kiểm tra xung đột ngay khi người dùng chọn phòng/giờ
- Hiển thị cảnh báo real-time thay vì chỉ khi submit

## Tóm Tắt

| Tính năng | Trạng thái | Vị trí |
|-----------|------------|--------|
| Kiểm tra xung đột phòng học (Frontend) | ✅ Hoạt động | `frontend/src/app/schedule/page.tsx` |
| Kiểm tra xung đột phòng học (Backend) | ❌ Disabled | `backend/routers/schedules.py` |
| Kiểm tra xung đột giáo viên | ❌ Chưa có | - |
| Kiểm tra xung đột lớp học | ❌ Chưa có | - |

## Công Thức Kiểm Tra Xung Đột Thời Gian

Hai khung giờ xung đột nếu:
```
newStart < existingEnd && newEnd > existingStart
```

**Ví dụ:**
- Lịch 1: 08:00 - 09:00
- Lịch 2: 08:30 - 09:30
- → `08:30 < 09:00` ✅ và `09:30 > 08:00` ✅ → **XUNG ĐỘT**

- Lịch 1: 08:00 - 09:00
- Lịch 2: 09:00 - 10:00
- → `09:00 < 09:00` ❌ → **KHÔNG XUNG ĐỘT**







