# Notification Toast Feature - Hiển thị thông báo một lần

## ✅ Tính năng đã hoàn thành

### 1. Notification Context (`NotificationContext.tsx`)

**Chức năng:**
- ✅ Quản lý danh sách thông báo từ API
- ✅ Tự động polling mỗi 30 giây để lấy thông báo mới
- ✅ Lưu trạng thái đã hiển thị vào localStorage
- ✅ Chỉ trả về thông báo chưa được hiển thị
- ✅ Hỗ trợ mark as read và dismiss

**Logic "Chỉ hiển thị 1 lần":**
- Sử dụng `displayedNotifications` Set để track các notification đã hiển thị
- Lưu vào localStorage để persist qua các session
- Filter notifications trước khi trả về context
- Một khi đã dismiss, notification sẽ không hiển thị lại

### 2. Notification Toast Component (`NotificationToast.tsx`)

**Chức năng:**
- ✅ Hiển thị thông báo dạng card/toast ở góc trên bên phải
- ✅ Chỉ hiển thị 1 notification tại một thời điểm
- ✅ Tự động sắp xếp theo priority (urgent > high > normal > low)
- ✅ Auto dismiss sau 8 giây
- ✅ Có thể đóng thủ công hoặc đánh dấu "Đã xem"
- ✅ Animation fade in/out mượt mà

**UI Features:**
- Màu sắc theo priority:
  - `urgent`: Đỏ
  - `high`: Cam
  - `normal`: Xanh dương
  - `low`: Xám
- Icon theo priority và type
- Badge cho attendance_request
- Hiển thị thời gian tạo

### 3. Integration vào Layout

**File:** `frontend/src/app/layout.tsx`

- ✅ Thêm `NotificationProvider` vào root layout
- ✅ Thêm `NotificationToast` component
- ✅ Hoạt động ở mọi view trong ứng dụng

## Cách hoạt động

### Flow hoàn chỉnh:

1. **Admin tạo thông báo:**
   ```
   Admin → Click "Gửi yêu cầu điểm danh" 
   → POST /api/notifications 
   → Notification được lưu vào database
   ```

2. **Teacher nhận thông báo:**
   ```
   NotificationContext polling mỗi 30s 
   → GET /api/notifications?read=false
   → Lọc notifications chưa được hiển thị (check localStorage)
   → NotificationToast hiển thị notification đầu tiên
   ```

3. **Hiển thị và dismiss:**
   ```
   NotificationToast hiển thị card
   → User có thể:
     - Đóng (X) → dismiss và lưu vào localStorage
     - Click "Đã xem" → mark as read + dismiss
     - Tự động dismiss sau 8s
   → Notification ID được lưu vào localStorage
   → Không hiển thị lại notification này nữa
   ```

### Logic "Chỉ hiển thị 1 lần":

```typescript
// 1. Check localStorage khi mount
const stored = localStorage.getItem('displayed_notifications');
setDisplayedNotifications(new Set(JSON.parse(stored || '[]')));

// 2. Filter notifications
const newNotifications = notifications.filter(
  (n) => !displayedNotifications.has(n.id)
);

// 3. Khi dismiss, lưu vào localStorage
dismissNotification(id) {
  displayedNotifications.add(id);
  localStorage.setItem('displayed_notifications', 
    JSON.stringify(Array.from(displayedNotifications))
  );
}
```

## Files Created/Modified

### New Files:
1. `frontend/src/contexts/NotificationContext.tsx` - Context quản lý notifications
2. `frontend/src/components/NotificationToast.tsx` - Component hiển thị toast

### Modified Files:
1. `frontend/src/app/layout.tsx` - Thêm NotificationProvider và NotificationToast

## Cấu trúc Code

### NotificationContext
```typescript
interface NotificationContextType {
  notifications: Notification[];  // Chỉ notifications chưa hiển thị
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}
```

### NotificationToast
- Hiển thị 1 notification tại một thời điểm
- Sắp xếp theo priority
- Auto dismiss sau 8s
- Animation smooth

## Tính năng nổi bật

1. **Chỉ hiển thị 1 lần:**
   - Sử dụng localStorage để track
   - Một khi đã dismiss, không hiển thị lại
   - Persist qua các session

2. **Priority-based:**
   - Sắp xếp theo mức độ ưu tiên
   - Màu sắc và icon khác nhau
   - Urgent notifications hiển thị trước

3. **User-friendly:**
   - Auto dismiss sau 8s
   - Có thể đóng thủ công
   - Có thể đánh dấu "Đã xem"
   - Animation mượt mà

4. **Global:**
   - Hoạt động ở mọi view
   - Không cần import ở từng page
   - Tự động polling

## Testing

### Test Cases:

1. **Tạo thông báo mới:**
   - Admin tạo notification
   - Teacher sẽ thấy toast sau tối đa 30s
   - Toast hiển thị đúng thông tin

2. **Dismiss notification:**
   - Click X → Toast biến mất
   - Refresh page → Không hiển thị lại
   - Check localStorage → ID đã được lưu

3. **Multiple notifications:**
   - Tạo nhiều notifications
   - Chỉ hiển thị 1 tại một thời điểm
   - Sau khi dismiss, hiển thị notification tiếp theo

4. **Priority sorting:**
   - Tạo notifications với priority khác nhau
   - Urgent hiển thị trước
   - Sau đó high, normal, low

## Notes

- **localStorage key:** `displayed_notifications` - Array of notification IDs
- **Polling interval:** 30 seconds
- **Auto dismiss:** 8 seconds
- **Max width:** 384px (max-w-md)
- **Position:** Fixed top-right (top-4 right-4)
- **Z-index:** 50 (z-50)

## Future Enhancements (Optional)

1. **Sound notification:** Phát âm thanh khi có notification mới
2. **Desktop notifications:** Browser notification API
3. **Notification center:** Trang xem tất cả notifications
4. **Real-time:** WebSocket thay vì polling
5. **Customizable:** Cho phép user tùy chỉnh auto-dismiss time

