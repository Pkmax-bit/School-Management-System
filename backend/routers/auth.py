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
from supabase_client import get_supabase_client
from config import settings
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings (using settings from config)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

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
    expires_in: int
    user: Optional[dict] = None  # Add user data to response

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
        # Sử dụng giá trị mặc định từ config (30 phút)
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
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
        print(f"[get_current_user] Attempting Supabase Auth validation...")
        auth_user_response = supabase.auth.get_user(credentials.credentials)
        if not getattr(auth_user_response, 'user', None):
            print(f"[get_current_user] Supabase Auth: No user in response")
            raise credentials_exception
        auth_user = auth_user_response.user
        auth_email = getattr(auth_user, 'email', None)
        auth_id = getattr(auth_user, 'id', None)
        if not auth_email or not auth_id:
            print(f"[get_current_user] Supabase Auth: Missing email or id. Email: {auth_email}, ID: {auth_id}")
            raise credentials_exception

        print(f"[get_current_user] Supabase Auth success. User ID: {auth_id}, Email: {auth_email}")

        # Lấy thông tin ứng dụng từ bảng users
        try:
            db_user_resp = supabase.table('users').select('*').eq('id', auth_id).single().execute()
            if not db_user_resp.data:
                # Nếu chưa có thì tạo bản ghi tối thiểu
                print(f"[get_current_user] User not found in DB, creating minimal record...")
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
            
            user_role = db_user.get('role', 'teacher')
            print(f"[get_current_user] DB user found. ID: {db_user.get('id')}, Role: {user_role}")
            
            return User(
                id=db_user['id'],
                email=db_user['email'],
                full_name=db_user.get('full_name', auth_email),
                role=user_role,
                is_active=db_user.get('is_active', True),
                created_at=db_user.get('created_at', datetime.now().isoformat())
            )
        except Exception as db_error:
            print(f"[get_current_user] Error accessing DB: {str(db_error)}")
            raise credentials_exception
    except HTTPException:
        raise
    except Exception as supabase_error:
        print(f"[get_current_user] Supabase Auth failed: {str(supabase_error)}, trying JWT fallback...")
        # Fallback: thử xác thực bằng app JWT do backend cấp
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            email: Optional[str] = payload.get("email")
            role: Optional[str] = payload.get("role")
            print(f"[get_current_user] JWT decoded. User ID: {user_id}, Email: {email}, Role: {role}")
            if user_id is None:
                print(f"[get_current_user] JWT: No user_id in payload")
                raise credentials_exception
            # Lấy user từ DB theo id (ưu tiên) hoặc email
            try:
                if user_id:
                    db_user_resp = supabase.table('users').select('*').eq('id', user_id).single().execute()
                elif email:
                    db_user_resp = supabase.table('users').select('*').eq('email', email).single().execute()
                else:
                    print(f"[get_current_user] JWT: No user_id or email")
                    raise credentials_exception
                if not db_user_resp.data:
                    print(f"[get_current_user] JWT: User not found in DB")
                    raise credentials_exception
                db_user = db_user_resp.data
                user_role = db_user.get('role', role or 'teacher')
                print(f"[get_current_user] JWT: User found. ID: {db_user.get('id')}, Role: {user_role}")
                return User(
                    id=db_user['id'],
                    email=db_user['email'],
                    full_name=db_user.get('full_name', db_user['email']),
                    role=user_role,
                    is_active=db_user.get('is_active', True),
                    created_at=db_user.get('created_at', datetime.now().isoformat())
                )
            except Exception as db_error:
                print(f"[get_current_user] JWT: Error accessing DB: {str(db_error)}")
                raise credentials_exception
        except jwt.ExpiredSignatureError:
            print(f"[get_current_user] JWT: Token expired")
            raise credentials_exception
        except jwt.JWTError as jwt_error:
            print(f"[get_current_user] JWT: Invalid token: {str(jwt_error)}")
            raise credentials_exception
        except Exception as jwt_error:
            print(f"[get_current_user] JWT: Unexpected error: {str(jwt_error)}")
            raise credentials_exception

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Login user with email and password
    - Admin: uses Supabase Auth
    - Teacher/Student: uses password_hash from users table
    """
    try:
        supabase = get_supabase_client()
        
        # First, get user from users table to check role
        user_result = supabase.table("users").select("*").eq("email", login_data.email).execute()
        
        if not user_result.data or len(user_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = user_result.data[0]
        user_role = user.get("role", "").lower()
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        # Admin uses Supabase Auth (with fallback to password_hash if not in Supabase Auth)
        if user_role == "admin":
            # Try Supabase Auth first
            auth_success = False
            try:
                auth_response = supabase.auth.sign_in_with_password({
                    "email": login_data.email,
                    "password": login_data.password
                })
                
                # Check for errors in response
                if hasattr(auth_response, 'error') and auth_response.error:
                    error_msg = str(auth_response.error)
                    print(f"Supabase Auth error for admin {login_data.email}: {error_msg}")
                    # Fallback to password_hash if user not in Supabase Auth
                    if "Invalid login credentials" in error_msg or "Email not confirmed" in error_msg:
                        print(f"Admin {login_data.email} not in Supabase Auth, trying password_hash fallback")
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Invalid email or password: {error_msg}"
                        )
                elif auth_response.user:
                    auth_success = True
                    # Update last login
                    try:
                        supabase.table("users").update({
                            "last_login": datetime.utcnow().isoformat()
                        }).eq("id", user["id"]).execute()
                    except Exception:
                        pass  # Skip if column doesn't exist
                    
                    # Return Supabase JWT token with user data
                    return Token(
                        access_token=auth_response.session.access_token,
                        token_type="bearer",
                        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                        user={
                            "id": user["id"],
                            "email": user["email"],
                            "full_name": user.get("full_name", ""),
                            "role": user_role,
                            "is_active": user.get("is_active", True)
                        }
                    )
            except HTTPException:
                raise
            except Exception as auth_error:
                error_msg = str(auth_error)
                print(f"Supabase Auth exception for admin {login_data.email}: {error_msg}")
                # Continue to fallback
            
            # Fallback: Use password_hash if Supabase Auth failed (for backward compatibility)
            if not auth_success:
                print(f"Using password_hash fallback for admin {login_data.email}")
                password_hash = user.get("password_hash")
                
                if not password_hash:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Admin account not configured. Please create user in Supabase Auth or set password_hash."
                    )
                
                # Verify password
                if not verify_password(login_data.password, password_hash):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )
                
                # Update last login
                try:
                    supabase.table("users").update({
                        "last_login": datetime.utcnow().isoformat()
                    }).eq("id", user["id"]).execute()
                except Exception:
                    pass  # Skip if column doesn't exist
                
                # Create app JWT token
                token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={
                        "sub": user["id"],
                        "email": user["email"],
                        "role": user_role
                    },
                    expires_delta=token_expires
                )
                
                return Token(
                    access_token=access_token,
                    token_type="bearer",
                    expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    user={
                        "id": user["id"],
                        "email": user["email"],
                        "full_name": user.get("full_name", ""),
                        "role": user_role,
                        "is_active": user.get("is_active", True)
                    }
                )
        
        # Teacher and Student use password_hash from users table
        elif user_role in ["teacher", "student"]:
            password_hash = user.get("password_hash")
            
            if not password_hash:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password not set for this user"
                )
            
            # Verify password
            if not verify_password(login_data.password, password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Update last login
            try:
                supabase.table("users").update({
                    "last_login": datetime.utcnow().isoformat()
                }).eq("id", user["id"]).execute()
            except Exception:
                pass  # Skip if column doesn't exist
            
            # Create app JWT token
            token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "sub": user["id"],
                    "email": user["email"],
                    "role": user_role
                },
                expires_delta=token_expires
            )
            
            return Token(
                access_token=access_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user role"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
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
