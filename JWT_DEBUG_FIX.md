# JWT Authentication Fix - School Management System

## 🔍 **Vấn Đề Hiện Tại:**

Backend log cho thấy JWT tokens bị expired ngay lập tức vì **inconsistency giữa các secret keys**.

## 📋 **Phân Tích Code:**

### 1. JWT Token Creation (backend/utils/auth.py):
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # ... code ...
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

### 2. JWT Token Verification (backend/utils/auth.py):
```python
def verify_token(token: str) -> dict:
    payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])  # ❌ SAI
    return payload

def get_current_user(...):
    # Try Supabase JWT first, then app JWT
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])  # ✅ ĐÚNG
```

### 3. Current Environment Variables:
```bash
SECRET_KEY="SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g=="
JWT_SECRET="WMqBxnWtzg7kfhh5QQCW73OyntUtX9C9wGcYxHv0b1A="  # ❌ KHÁC SECRET_KEY
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"  # ❌ CHƯA SET
```

## 🔧 **Cách Sửa:**

### **Option 1: Sử dụng SECRET_KEY cho tất cả (Đơn giản nhất)**

**Cập nhật backend/utils/auth.py:**
```python
def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])  # ✅ Sửa thành SECRET_KEY
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Environment Variables:**
```bash
# Chỉ cần SECRET_KEY, không cần JWT_SECRET và SUPABASE_JWT_SECRET
SECRET_KEY="SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g=="
# Xóa JWT_SECRET và SUPABASE_JWT_SECRET khỏi env vars
```

### **Option 2: Sử dụng JWT_SECRET riêng biệt (Nếu muốn)**

**Environment Variables:**
```bash
JWT_SECRET="SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g=="  # ✅ Set bằng SECRET_KEY
SUPABASE_JWT_SECRET="SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g=="  # ✅ Set bằng SECRET_KEY
SECRET_KEY="SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g=="
```

## 🎯 **Khuyến Nghị: Option 1 (Đơn giản)**

**Bước 1: Sửa code auth.py**
```python
# Thay dòng 36 trong backend/utils/auth.py
payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

**Bước 2: Cập nhật Environment Variables**
- Xóa `JWT_SECRET` khỏi env vars
- Xóa `SUPABASE_JWT_SECRET` khỏi env vars
- Giữ lại chỉ `SECRET_KEY`

**Bước 3: Redeploy Backend**

## 🔍 **Tại Sao Lại Xảy Ra:**

1. **verify_token()** sử dụng `SUPABASE_JWT_SECRET` nhưng env var này chưa được set đúng
2. **JWT_SECRET** và **SECRET_KEY** khác nhau, gây confusion
3. Frontend tạo token với một secret, backend verify với secret khác

## ✅ **Kết Quả Sau Khi Sửa:**

- JWT tokens sẽ được verify đúng cách
- Authentication sẽ hoạt động bình thường
- Không còn lỗi "token expired" nữa

## 🚀 **Test:**

Sau khi sửa và redeploy:
```bash
# Test health
curl https://school-management-backend-7yfd.onrender.com/api/health

# Test debug endpoint
curl https://school-management-backend-7yfd.onrender.com/api/debug

# Frontend authentication sẽ hoạt động
```

---

**Priority:** 🔴 **HIGH** - Cần sửa ngay để authentication hoạt động
