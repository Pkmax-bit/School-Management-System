# Cập Nhật Kiểm Tra Xung Đột Lịch Học Theo Ngày Cụ Thể

## Tổng Quan

Đã cập nhật hệ thống kiểm tra xung đột lịch học để **ưu tiên kiểm tra ngày cụ thể (dd/mm/yyyy) trước**, sau đó mới kiểm tra thời gian.

## Thay Đổi

### 1. Database Schema

**File:** `add_date_to_schedules.sql`

- Thêm trường `date` (DATE) vào bảng `schedules`
- Tạo index cho trường `date` để tăng tốc độ truy vấn
- Trường `date` có thể NULL để tương thích với dữ liệu cũ

```sql
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS date DATE;
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
```

### 2. Backend Changes

**File:** `backend/routers/schedules.py`

#### 2.1. Cập nhật Models

- Thêm trường `date: Optional[date]` vào `ScheduleCreate`
- Thêm trường `date: Optional[date]` vào `ScheduleResponse`

#### 2.2. Logic Kiểm Tra Xung Đột Mới

**Ưu tiên kiểm tra ngày cụ thể:**

1. **Nếu có ngày cụ thể (`date`):**
   - Tìm các lịch học có cùng phòng, cùng cơ sở, **cùng ngày cụ thể**
   - Kiểm tra xung đột thời gian trong cùng ngày đó

2. **Nếu không có ngày cụ thể:**
   - Tìm các lịch học có cùng phòng, cùng cơ sở, **cùng thứ trong tuần** (`day_of_week`)
   - Chỉ lấy các lịch không có ngày cụ thể (tương thích với dữ liệu cũ)
   - Kiểm tra xung đột thời gian

**Ví dụ:**

```python
# Nếu có date
if schedule_data.date:
    conflict_query = supabase.table("schedules").select("...")
        .eq("date", schedule_data.date.isoformat())
        .eq("room", schedule_data.room)
    
# Nếu không có date
else:
    conflict_query = supabase.table("schedules").select("...")
        .eq("day_of_week", schedule_data.day_of_week)
        .eq("room", schedule_data.room)
        .is_("date", "null")  # Chỉ lấy lịch không có ngày cụ thể
```

### 3. Frontend Changes

**File:** `frontend/src/lib/schedules-api.ts`

- Thêm trường `date?: string` vào interface `Schedule`
- Thêm trường `date?: string` vào interface `ScheduleCreate`
- Thêm trường `date?: string` vào interface `ScheduleUpdate`

**File:** `frontend/src/app/schedule/page.tsx`

#### 3.1. Cập nhật Hàm `checkRoomConflict`

**Tham số mới:**
- `specificDate?: string` - Ngày cụ thể (YYYY-MM-DD format)

**Logic mới:**

```typescript
if (specificDate) {
  // Kiểm tra theo ngày cụ thể: cùng phòng, cùng ngày cụ thể
  conflictingSchedules = existingSchedules.filter((schedule: Schedule) => 
    schedule.room === room && 
    schedule.date === specificDate &&
    (!excludeId || schedule.id !== excludeId)
  );
} else {
  // Kiểm tra theo day_of_week: cùng phòng, cùng thứ trong tuần, không có ngày cụ thể
  conflictingSchedules = existingSchedules.filter((schedule: Schedule) => 
    schedule.room === room && 
    schedule.day_of_week === dayOfWeek &&
    !schedule.date && // Chỉ lấy lịch không có ngày cụ thể
    (!excludeId || schedule.id !== excludeId)
  );
}
```

#### 3.2. Cập nhật `handleCreate`

- Truyền `scheduleItem.date` vào hàm `checkRoomConflict`
- Thêm `date` vào `scheduleData` trước khi gửi API

```typescript
const conflictCheck = await checkRoomConflict(
  scheduleItem.room,
  scheduleItem.day_of_week,
  scheduleItem.start_time,
  scheduleItem.end_time,
  selectedCampus,
  undefined,
  scheduleItem.date  // Truyền ngày cụ thể nếu có
);

if (scheduleItem.date) {
  scheduleData.date = scheduleItem.date;
}
```

#### 3.3. Cập nhật `handleUpdate`

- Tương tự `handleCreate`, truyền `date` vào `checkRoomConflict`

## Cách Hoạt Động

### Quy Trình Kiểm Tra Xung Đột

1. **Kiểm tra ngày cụ thể trước:**
   - Nếu lịch mới có ngày cụ thể → Tìm lịch cùng phòng, cùng ngày cụ thể
   - Nếu lịch mới không có ngày cụ thể → Tìm lịch cùng phòng, cùng thứ trong tuần, không có ngày cụ thể

2. **Sau đó kiểm tra thời gian:**
   - Chỉ kiểm tra xung đột thời gian trong các lịch đã lọc ở bước 1
   - Công thức: `newStart < existingEnd && newEnd > existingStart`

### Ví Dụ

**Trường hợp 1: Có ngày cụ thể**

```
Lịch hiện có: 
- Phòng: A101
- Ngày: 15/01/2024
- Giờ: 08:00 - 09:00

Lịch mới:
- Phòng: A101
- Ngày: 15/01/2024  ← Cùng ngày
- Giờ: 08:30 - 09:30  ← Xung đột thời gian

→ XUNG ĐỘT (vì cùng phòng, cùng ngày, trùng giờ)
```

**Trường hợp 2: Khác ngày**

```
Lịch hiện có: 
- Phòng: A101
- Ngày: 15/01/2024
- Giờ: 08:00 - 09:00

Lịch mới:
- Phòng: A101
- Ngày: 16/01/2024  ← Khác ngày
- Giờ: 08:00 - 09:00  ← Cùng giờ

→ KHÔNG XUNG ĐỘT (vì khác ngày, không cần kiểm tra thời gian)
```

**Trường hợp 3: Không có ngày cụ thể (lịch định kỳ)**

```
Lịch hiện có: 
- Phòng: A101
- Thứ: Thứ 2 (day_of_week = 0)
- Không có date
- Giờ: 08:00 - 09:00

Lịch mới:
- Phòng: A101
- Thứ: Thứ 2 (day_of_week = 0)
- Không có date
- Giờ: 08:30 - 09:30  ← Xung đột thời gian

→ XUNG ĐỘT (vì cùng phòng, cùng thứ, trùng giờ)
```

## Tương Thích Ngược

- Dữ liệu cũ không có trường `date` vẫn hoạt động bình thường
- Lịch không có ngày cụ thể sẽ được kiểm tra theo `day_of_week` như trước
- Lịch có ngày cụ thể sẽ được kiểm tra theo ngày cụ thể

## Cách Sử Dụng

### Chạy Migration Database

```bash
# Chạy SQL script để thêm trường date
psql -U your_user -d your_database -f add_date_to_schedules.sql
```

Hoặc chạy trực tiếp trong Supabase SQL Editor.

### Frontend

Khi tạo lịch học với ngày cụ thể:

```typescript
const scheduleData = {
  classroom_id: "...",
  subject_id: "...",
  teacher_id: "...",
  day_of_week: 0,  // Vẫn cần để tương thích
  start_time: "08:00",
  end_time: "09:00",
  room: "A101",
  date: "2024-01-15"  // Ngày cụ thể (YYYY-MM-DD format)
};
```

## Lưu Ý

1. **Format ngày:** Frontend gửi `date` dạng string `YYYY-MM-DD`, Pydantic sẽ tự động parse thành `date` object
2. **Index:** Đã tạo index cho trường `date` để tăng tốc độ truy vấn
3. **NULL handling:** Trường `date` có thể NULL, hệ thống sẽ tự động xử lý

## Testing

Để test kiểm tra xung đột:

1. Tạo lịch học với ngày cụ thể (ví dụ: 15/01/2024)
2. Thử tạo lịch khác cùng phòng, cùng ngày, trùng giờ → Phải bị chặn
3. Thử tạo lịch khác cùng phòng, khác ngày, trùng giờ → Phải cho phép
4. Thử tạo lịch khác cùng phòng, cùng ngày, khác giờ → Phải cho phép








