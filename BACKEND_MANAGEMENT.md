# Backend Management Guide
## Hướng dẫn quản lý Backend Server

### 🚀 Quick Start Commands

#### 1. Kiểm tra trạng thái backend
```bash
python manage_backend_simple.py status
```

#### 2. Khởi động backend
```bash
python manage_backend_simple.py start
```

#### 3. Tắt backend
```bash
python manage_backend_simple.py stop
```

#### 4. Khởi động lại backend
```bash
python manage_backend_simple.py restart
```

### 📋 Available Scripts

| Script | Mô tả |
|--------|-------|
| `manage_backend_simple.py` | Script quản lý chính (Start/Stop/Status/Restart) |
| `stop_backend_simple.py` | Script tắt tất cả backend servers |
| `start_backend.py` | Script khởi động backend (cũ) |

### 🔧 Troubleshooting

#### Lỗi "Failed to fetch"
1. **Kiểm tra backend có chạy không:**
   ```bash
   python manage_backend_simple.py status
   ```

2. **Nếu không chạy, khởi động:**
   ```bash
   python manage_backend_simple.py start
   ```

3. **Nếu vẫn lỗi, khởi động lại:**
   ```bash
   python manage_backend_simple.py restart
   ```

#### Lỗi "Port already in use"
1. **Tắt tất cả backend:**
   ```bash
   python stop_backend_simple.py
   ```

2. **Khởi động lại:**
   ```bash
   python manage_backend_simple.py start
   ```

### 🌐 Backend Endpoints

Khi backend chạy, bạn có thể truy cập:

- **API Base URL:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **API Documentation:** http://localhost:8000/docs
- **Interactive API:** http://localhost:8000/redoc

### 📝 Notes

- Backend server chạy trên port 8000
- Frontend chạy trên port 3000 (Next.js)
- Script tự động cài đặt dependencies khi khởi động
- Sử dụng `Ctrl+C` để dừng server khi đang chạy

### 🆘 Emergency Stop

Nếu backend không phản hồi, sử dụng:

```bash
# Tắt tất cả processes trên port 8000
netstat -ano | findstr :8000
taskkill /F /PID <PID_NUMBER>

# Hoặc tắt tất cả Python processes
taskkill /F /IM python.exe
```

### ✅ Verification

Sau khi khởi động backend, kiểm tra:

1. **Status check:**
   ```bash
   python manage_backend_simple.py status
   ```

2. **Health check trong browser:**
   - Mở http://localhost:8000/health
   - Phải thấy: `{"status": "ok", "message": "Server is running"}`

3. **API docs:**
   - Mở http://localhost:8000/docs
   - Phải thấy Swagger UI với các endpoints
