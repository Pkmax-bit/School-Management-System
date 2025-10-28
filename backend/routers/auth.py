"""
Authentication Router
Router cho xác thực người dùng
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

from database import get_db
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác minh mật khẩu"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash mật khẩu"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Tạo access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(supabase: Client, email: str) -> Optional[User]:
    """Lấy user theo email"""
    try:
        response = supabase.table('users').select('*').eq('email', email).single().execute()
        if response.data:
            return User(**response.data)
        return None
    except:
        return None

def authenticate_user(supabase: Client, email: str, password: str) -> Optional[User]:
    """Xác thực người dùng"""
    user = get_user_by_email(supabase, email)
    if not user:
        return None
    
    # Kiểm tra mật khẩu (tạm thời bỏ qua để demo)
    # Trong production, sử dụng Supabase Auth
    # if not verify_password(password, user.password_hash):
    #     return None
    
    return user

async def get_current_user_dev() -> User:
    """Development mode: bypass authentication"""
    return User(
        id="dev-user-id",
        email="dev@example.com",
        full_name="Development User",
        role="admin",
        is_active=True,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_db)
) -> User:
    """Lấy user hiện tại từ token"""
    # Development mode: bypass authentication
    import os
    # Always bypass authentication for now (temporary fix)
    if True:  # Change this to False in production
        # Return mock user for development
        return User(
            id="dev-user-id",
            email="dev@example.com",
            full_name="Development User",
            role="admin",
            is_active=True,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(supabase, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/login")
async def login(user_credentials: UserLogin, supabase: Client = Depends(get_db)):
    """Đăng nhập"""
    user = authenticate_user(supabase, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@router.post("/register", response_model=dict)
async def register(user_data: UserRegister, supabase: Client = Depends(get_db)):
    """Đăng ký tài khoản mới"""
    # Kiểm tra email đã tồn tại
    if get_user_by_email(supabase, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Tạo user mới
    hashed_password = get_password_hash(user_data.password)
    user_data_dict = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "is_active": True
    }
    
    response = supabase.table('users').insert(user_data_dict).execute()
    
    return {"message": "User created successfully", "user_id": response.data[0]['id']}

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Lấy thông tin user hiện tại"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active
    }
