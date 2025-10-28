# Sửa lỗi 403 Forbidden cho Subjects API

## Vấn đề
- **Lỗi**: `Request failed with status code 403` khi gọi `subjectsAPI.getSubjects()`
- **Nguyên nhân**: Token inconsistency giữa authentication và API calls

## Nguyên nhân gốc rễ

### 1. Token Name Inconsistency
- `useApiAuth` sử dụng `auth_token` trong localStorage
- `api.ts` sử dụng `access_token` trong localStorage
- **Kết quả**: API calls không có token authentication

### 2. Error Handling
- Không xử lý lỗi 403 trong response interceptor
- Thiếu fallback data cho development

## Các sửa đổi đã thực hiện

### 1. Sửa Token Inconsistency (lib/api.ts)
```typescript
// Trước
const token = localStorage.getItem('access_token');

// Sau  
const token = localStorage.getItem('auth_token');
```

### 2. Cập nhật Response Interceptor
```typescript
// Trước
if (error.response?.status === 401) {
  localStorage.removeItem('access_token');
  window.location.href = '/login';
}

// Sau
if (error.response?.status === 401 || error.response?.status === 403) {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
```

### 3. Thêm Error Handling chi tiết (subjects/page.tsx)
```typescript
const loadSubjects = async () => {
  try {
    // Debug logging
    const token = localStorage.getItem('auth_token');
    console.log('Current user:', user);
    console.log('Auth token exists:', !!token);
    
    const response = await subjectsAPI.getSubjects();
    setSubjects(response.data);
  } catch (error: any) {
    // Specific error handling
    if (error.response?.status === 403) {
      alert('Bạn không có quyền truy cập môn học. Vui lòng đăng nhập lại.');
      logout();
    } else if (error.response?.status === 401) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      logout();
    } else {
      // Fallback data for development
      setSubjects([...fallbackData]);
      alert('Đang sử dụng dữ liệu demo. Kết nối API để sử dụng dữ liệu thực.');
    }
  }
};
```

### 4. Thêm Fallback Data
- Dữ liệu demo khi API không khả dụng
- 3 môn học mẫu: Toán học, Văn học, Tiếng Anh
- Cho phép test UI/UX khi backend chưa sẵn sàng

## Kết quả

### ✅ Đã sửa
- Token authentication consistency
- Error handling cho 401/403
- Fallback data cho development
- Debug logging để troubleshoot

### 🔧 Debug Information
Khi gặp lỗi, console sẽ hiển thị:
- Current user info
- Token existence check
- Token value (first 20 chars)
- Error response details
- Error status code

### 📱 User Experience
- **403/401**: Redirect to login với thông báo rõ ràng
- **Network error**: Hiển thị dữ liệu demo với thông báo
- **Success**: Hiển thị dữ liệu thực từ API

## Cách test

### 1. Test với Backend
1. Đảm bảo backend đang chạy
2. Đăng nhập với user có role 'admin'
3. Truy cập `/subjects` page
4. Kiểm tra console logs

### 2. Test Fallback Mode
1. Tắt backend hoặc thay đổi API URL
2. Truy cập `/subjects` page
3. Sẽ hiển thị dữ liệu demo
4. Thông báo "Đang sử dụng dữ liệu demo"

### 3. Test Authentication
1. Xóa token từ localStorage
2. Truy cập `/subjects` page
3. Sẽ redirect về login

## Lưu ý
- Fallback data chỉ dành cho development
- Production cần có backend API hoạt động
- Debug logs có thể remove trong production
