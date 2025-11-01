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
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Xác thực bằng Supabase Auth token
    try:
        auth_user_response = supabase.auth.get_user(credentials.credentials)
        if not getattr(auth_user_response, 'user', None):
            raise credentials_exception
        auth_user = auth_user_response.user
        auth_email = getattr(auth_user, 'email', None)
        auth_id = getattr(auth_user, 'id', None)
        if not auth_email or not auth_id:
            raise credentials_exception

        # Lấy thông tin ứng dụng từ bảng users
        try:
            db_user_resp = supabase.table('users').select('*').eq('id', auth_id).single().execute()
            if not db_user_resp.data:
                # Nếu chưa có thì tạo bản ghi tối thiểu
                full_name = (getattr(auth_user, 'user_metadata', {}) or {}).get('full_name', auth_email.split('@')[0])
                insert_resp = supabase.table('users').insert({
                    'id': auth_id,
                    'email': auth_email,
                    'full_name': full_name,
                    'role': 'teacher',
                    'is_active': True
                }).execute()
                db_user = insert_resp.data[0]
            else:
                db_user = db_user_resp.data
        except Exception:
            raise credentials_exception

        return User(
            id=db_user['id'],
            email=db_user['email'],
            full_name=db_user.get('full_name', auth_email),
            role=db_user.get('role', 'teacher'),
            is_active=db_user.get('is_active', True),
            created_at=db_user.get('created_at', datetime.now().isoformat())
        )
    except Exception:
        raise credentials_exception

@router.post("/login")
async def login(user_credentials: UserLogin, supabase: Client = Depends(get_db)):
    """Đăng nhập"""
    try:
        # Đăng nhập bằng Supabase Auth
        sign_in_resp = supabase.auth.sign_in_with_password({
            'email': user_credentials.email,
            'password': user_credentials.password
        })

        # Hỗ trợ cả object và dict
        session = getattr(sign_in_resp, 'session', None) or (
            sign_in_resp.get('session') if isinstance(sign_in_resp, dict) else None
        )
        user_obj = getattr(sign_in_resp, 'user', None) or (
            sign_in_resp.get('user') if isinstance(sign_in_resp, dict) else None
        )

        if not session or not user_obj:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login credentials. Please check your email and password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = getattr(session, 'access_token', None) or (
            session.get('access_token') if isinstance(session, dict) else None
        )
        refresh_token = getattr(session, 'refresh_token', None) or (
            session.get('refresh_token') if isinstance(session, dict) else None
        )
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Đảm bảo có bản ghi trong bảng users cho ứng dụng
        try:
            user_id = getattr(user_obj, 'id', None) or (user_obj.get('id') if isinstance(user_obj, dict) else None)
            user_email = getattr(user_obj, 'email', None) or (user_obj.get('email') if isinstance(user_obj, dict) else None)
            db_user_resp = supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not db_user_resp.data:
                user_metadata = getattr(user_obj, 'user_metadata', None) or (user_obj.get('user_metadata') if isinstance(user_obj, dict) else None) or {}
                full_name = user_metadata.get('full_name', user_email.split('@')[0] if user_email else '')
                insert_resp = supabase.table('users').insert({
                    'id': user_id,
                    'email': user_email,
                    'full_name': full_name,
                    'role': 'teacher',
                    'is_active': True
                }).execute()
                app_user = insert_resp.data[0]
            else:
                app_user = db_user_resp.data
        except Exception:
            # Không chặn đăng nhập nếu ghi DB phụ trợ lỗi
            app_user = {
                'id': user_id,
                'email': user_email,
                'full_name': (user_metadata if 'user_metadata' in locals() else {}) or {},
                'role': 'teacher',
                'is_active': True
            }

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'user': {
                'id': app_user['id'],
                'email': app_user['email'],
                'full_name': app_user.get('full_name', user_obj.email),
                'role': app_user.get('role', 'teacher'),
                'is_active': app_user.get('is_active', True)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        message = str(e)
        # Map một số lỗi thường gặp từ Supabase thành 401 thay vì 500
        lowered = message.lower()
        if 'invalid login' in lowered or 'invalid credentials' in lowered:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login credentials. Please check your email and password, or create an account first."
            )
        if 'email not confirmed' in lowered or 'email_not_confirmed' in lowered:
            # Trong development mode, có thể tự động confirm email
            try:
                # Thử lấy user từ email
                auth_user_list_response = supabase.auth.admin.list_users()
                auth_users = getattr(auth_user_list_response, 'users', None) or (
                    auth_user_list_response if isinstance(auth_user_list_response, list) else []
                )
                auth_user = None
                for u in auth_users:
                    user_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
                    if user_email == user_credentials.email:
                        auth_user = u
                        break
                
                if auth_user:
                    # Confirm email tự động cho development
                    try:
                        supabase.auth.admin.update_user_by_id(
                            auth_user.id,
                            {'email_confirm': True}
                        )
                        # Thử đăng nhập lại sau khi confirm
                        sign_in_resp = supabase.auth.sign_in_with_password({
                            'email': user_credentials.email,
                            'password': user_credentials.password
                        })
                        session = getattr(sign_in_resp, 'session', None) or (
                            sign_in_resp.get('session') if isinstance(sign_in_resp, dict) else None
                        )
                        user_obj = getattr(sign_in_resp, 'user', None) or (
                            sign_in_resp.get('user') if isinstance(sign_in_resp, dict) else None
                        )
                        
                        if session and user_obj:
                            access_token = getattr(session, 'access_token', None) or (
                                session.get('access_token') if isinstance(session, dict) else None
                            )
                            refresh_token = getattr(session, 'refresh_token', None) or (
                                session.get('refresh_token') if isinstance(session, dict) else None
                            )
                            
                            # Đảm bảo có bản ghi trong bảng users
                            user_id = getattr(user_obj, 'id', None) or (user_obj.get('id') if isinstance(user_obj, dict) else None)
                            user_email = getattr(user_obj, 'email', None) or (user_obj.get('email') if isinstance(user_obj, dict) else None)
                            db_user_resp = supabase.table('users').select('*').eq('id', user_id).single().execute()
                            if not db_user_resp.data:
                                user_metadata = getattr(user_obj, 'user_metadata', None) or (user_obj.get('user_metadata') if isinstance(user_obj, dict) else None) or {}
                                full_name = user_metadata.get('full_name', user_email.split('@')[0] if user_email else '')
                                insert_resp = supabase.table('users').insert({
                                    'id': user_id,
                                    'email': user_email,
                                    'full_name': full_name,
                                    'role': 'teacher',
                                    'is_active': True
                                }).execute()
                                app_user = insert_resp.data[0]
                            else:
                                app_user = db_user_resp.data
                            
                            return {
                                'access_token': access_token,
                                'refresh_token': refresh_token,
                                'token_type': 'bearer',
                                'user': {
                                    'id': app_user['id'],
                                    'email': app_user['email'],
                                    'full_name': app_user.get('full_name', user_email),
                                    'role': app_user.get('role', 'teacher'),
                                    'is_active': app_user.get('is_active', True)
                                }
                            }
                    except Exception as confirm_error:
                        # Nếu không thể confirm tự động, trả về lỗi
                        pass
            except Exception:
                pass
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not confirmed. Please check your email and confirm your account."
            )
        # Surface underlying error to help diagnose (consider reducing detail in production)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {message}"
        )

@router.post("/register", response_model=dict)
async def register(user_data: UserRegister, supabase: Client = Depends(get_db)):
    """Đăng ký tài khoản mới"""
    try:
        # Kiểm tra email đã tồn tại
        existing_user = get_user_by_email(supabase, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Tạo user trong Supabase Auth trước
        auth_response = supabase.auth.sign_up({
            'email': user_data.email,
            'password': user_data.password,
            'options': {
                'data': {
                    'full_name': user_data.full_name,
                    'role': user_data.role
                }
            }
        })
        
        # Hỗ trợ cả object và dict
        auth_user = getattr(auth_response, 'user', None) or (
            auth_response.get('user') if isinstance(auth_response, dict) else None
        )
        
        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create auth user"
            )
        
        user_id = getattr(auth_user, 'id', None) or (
            auth_user.get('id') if isinstance(auth_user, dict) else None
        )
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get user ID from auth response"
            )
        
        # Tạo user record trong bảng users
        hashed_password = get_password_hash(user_data.password)
        user_data_dict = {
            "id": user_id,
            "email": user_data.email,
            "password_hash": hashed_password,
            "full_name": user_data.full_name,
            "role": user_data.role,
            "is_active": True
        }
        
        response = supabase.table('users').insert(user_data_dict).execute()
        
        return {"message": "User created successfully", "user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        message = str(e)
        # Map một số lỗi thường gặp từ Supabase
        lowered = message.lower()
        if 'user already registered' in lowered or 'email already registered' in lowered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {message}"
        )

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
