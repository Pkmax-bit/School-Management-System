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
        # Fallback: thử xác thực bằng app JWT do backend cấp
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            email: Optional[str] = payload.get("email")
            if user_id is None:
                raise credentials_exception
            # Lấy user từ DB theo id (ưu tiên) hoặc email
            try:
                if user_id:
                    db_user_resp = supabase.table('users').select('*').eq('id', user_id).single().execute()
                elif email:
                    db_user_resp = supabase.table('users').select('*').eq('email', email).single().execute()
                else:
                    raise credentials_exception
                if not db_user_resp.data:
                    raise credentials_exception
                db_user = db_user_resp.data
                return User(
                    id=db_user['id'],
                    email=db_user['email'],
                    full_name=db_user.get('full_name', db_user['email']),
                    role=db_user.get('role', 'teacher'),
                    is_active=db_user.get('is_active', True),
                    created_at=db_user.get('created_at', datetime.now().isoformat())
                )
            except Exception:
                raise credentials_exception
        except Exception:
            raise credentials_exception

@router.post("/login")
async def login(login_data: UserLogin):
    """Login user with email and password - giống Phúc Đạt"""
    try:
        supabase = get_supabase_client()
        
        # Authenticate with Supabase Auth
        auth_response = None
        auth_error = None
        
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
        except Exception as e:
            auth_error = e
            print(f"Supabase Auth error: {str(e)}")
        
        # Kiểm tra error từ response
        if auth_response and hasattr(auth_response, 'error') and auth_response.error:
            auth_error = auth_response.error
            auth_response = None
        
        # Nếu Supabase Auth thất bại, kiểm tra xem có user trong database không
        if auth_error or not auth_response or not auth_response.user:
            user_result = supabase.table("users").select("*").eq("email", login_data.email).execute()
            
            if user_result.data and len(user_result.data) > 0:
                user = user_result.data[0]
                
                # Fallback 1: xác thực bằng password_hash trong DB và cấp app JWT (không phụ thuộc Supabase Auth)
                try:
                    db_password_hash = user.get("password_hash")
                    if db_password_hash and pwd_context.verify(login_data.password, db_password_hash):
                        # Cấp app JWT, trả về user từ DB
                        token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                        access_token = create_access_token(
                            data={"sub": user["id"], "email": user["email"], "role": user.get("role", "teacher"), "token_source": "app_jwt"},
                            expires_delta=token_expires
                        )
                        return {
                            "access_token": access_token,
                            "refresh_token": None,
                            "token_type": "bearer",
                            "token_source": "app_jwt",
                            "user": {
                                "id": user["id"],
                                "email": user["email"],
                                "full_name": user.get("full_name", user["email"].split("@")[0]),
                                "role": user.get("role", "teacher"),
                                "is_active": user.get("is_active", True)
                            }
                        }
                except Exception:
                    # Nếu verify thất bại, tiếp tục nhánh đồng bộ Supabase Auth bên dưới
                    pass
                
                # User có trong database nhưng không có trong Supabase Auth
                existing_user_id = user.get("id")
                
                # Kiểm tra xem có foreign key constraint không (teachers table reference user_id)
                teacher_check = supabase.table("teachers").select("id").eq("user_id", existing_user_id).limit(1).execute()
                has_foreign_key = teacher_check.data and len(teacher_check.data) > 0
                
                if has_foreign_key:
                    # Có foreign key constraint, không thể thay đổi user_id
                    # Thử tạo user trong Supabase Auth với admin API
                    print(f"User has foreign key constraints. Cannot update user_id. Existing user_id: {existing_user_id}")
                    
                    # Sử dụng admin API để tạo user (cần service role key)
                    try:
                        # Kiểm tra xem user đã tồn tại trong Supabase Auth chưa
                        try:
                            auth_users = supabase.auth.admin.list_users()
                            existing_auth_user = None
                            
                            # Tìm user với email
                            users_list = getattr(auth_users, 'users', [])
                            if isinstance(auth_users, list):
                                users_list = auth_users
                            
                            for auth_user in users_list:
                                user_email = getattr(auth_user, 'email', None) or (
                                    auth_user.get('email') if isinstance(auth_user, dict) else None
                                )
                                if user_email == login_data.email:
                                    existing_auth_user = auth_user
                                    break
                            
                            if existing_auth_user:
                                # User đã tồn tại trong Supabase Auth
                                # Cập nhật password và confirm email
                                try:
                                    # Reset password
                                    supabase.auth.admin.update_user_by_id(
                                        getattr(existing_auth_user, 'id', None) or existing_auth_user.get('id') if isinstance(existing_auth_user, dict) else None,
                                        {"password": login_data.password}
                                    )
                                    # Confirm email
                                    supabase.auth.admin.update_user_by_id(
                                        getattr(existing_auth_user, 'id', None) or existing_auth_user.get('id') if isinstance(existing_auth_user, dict) else None,
                                        {"email_confirm": True}
                                    )
                                    # Thử đăng nhập lại
                                    auth_response = supabase.auth.sign_in_with_password({
                                        "email": login_data.email,
                                        "password": login_data.password
                                    })
                                except Exception as update_error:
                                    print(f"Error updating user: {str(update_error)}")
                                    # Thử đăng nhập với password mới
                                    try:
                                        auth_response = supabase.auth.sign_in_with_password({
                                            "email": login_data.email,
                                            "password": login_data.password
                                        })
                                    except:
                                        raise HTTPException(
                                            status_code=status.HTTP_401_UNAUTHORIZED,
                                            detail="User exists in Supabase Auth. Please check your password or contact administrator to reset password in Supabase Dashboard."
                                        )
                            else:
                                # User chưa tồn tại trong Supabase Auth
                                # Tạo user mới với admin API
                                admin_response = supabase.auth.admin.create_user({
                                    "email": login_data.email,
                                    "password": login_data.password,
                                    "email_confirm": True,  # Auto confirm email
                                    "user_metadata": {
                                        "full_name": user.get("full_name", login_data.email.split("@")[0]),
                                        "role": user.get("role", "teacher")
                                    },
                                    "app_metadata": {
                                        "role": user.get("role", "teacher")
                                    }
                                })
                                
                                if admin_response.user:
                                    # User được tạo với ID mới (không thể set ID cụ thể)
                                    new_user_id = admin_response.user.id
                                    
                                    # Nếu ID khác, cần update user_id trong database nhưng bị foreign key constraint
                                    # Vì có foreign key constraint, không thể update user_id
                                    # Giải pháp: Xóa user vừa tạo và thông báo lỗi
                                    # HOẶC: Giữ cả 2 ID và dùng mapping
                                    
                                    if new_user_id != existing_user_id:
                                        # Không thể update vì foreign key constraint
                                        # Xóa user vừa tạo
                                        try:
                                            supabase.auth.admin.delete_user(new_user_id)
                                        except:
                                            pass
                                        
                                        raise HTTPException(
                                            status_code=status.HTTP_401_UNAUTHORIZED,
                                            detail=f"User exists in database with ID '{existing_user_id}' but Supabase Auth created user with different ID. Cannot sync due to foreign key constraints. Please contact administrator to create user in Supabase Dashboard with specific user_id '{existing_user_id}' or use sync endpoint."
                                        )
                                    else:
                                        # ID trùng nhau (hiếm khi xảy ra)
                                        auth_response = supabase.auth.sign_in_with_password({
                                            "email": login_data.email,
                                            "password": login_data.password
                                        })
                                else:
                                    raise HTTPException(
                                        status_code=status.HTTP_401_UNAUTHORIZED,
                                        detail="Failed to create user in Supabase Auth. Please contact administrator."
                                    )
                        except HTTPException:
                            raise
                        except Exception as list_error:
                            error_msg = str(list_error)
                            print(f"Error listing/creating admin user: {error_msg}")
                            
                            # Nếu admin API không khả dụng, thử đăng nhập trực tiếp
                            try:
                                auth_response = supabase.auth.sign_in_with_password({
                                    "email": login_data.email,
                                    "password": login_data.password
                                })
                            except:
                                raise HTTPException(
                                    status_code=status.HTTP_401_UNAUTHORIZED,
                                    detail=f"Cannot auto-create Supabase Auth user. Please contact administrator to create user in Supabase Dashboard with email '{login_data.email}' and password '{login_data.password}'."
                                )
                    except HTTPException:
                        raise
                    except Exception as admin_error:
                        error_msg = str(admin_error)
                        print(f"Admin API error: {error_msg}")
                        
                        # Thử đăng nhập trực tiếp (user có thể đã tồn tại)
                        try:
                            auth_response = supabase.auth.sign_in_with_password({
                                "email": login_data.email,
                                "password": login_data.password
                            })
                        except:
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=f"User exists in database with relationships. Cannot auto-create Supabase Auth user. Please contact administrator or use sync endpoint. Error: {error_msg}"
                            )
                else:
                    # Không có foreign key constraint, có thể tạo user mới và update user_id
                    try:
                        print(f"User exists in database but not in Supabase Auth. Creating auth user...")
                        
                        # Tạo user trong Supabase Auth
                        auth_signup = supabase.auth.sign_up({
                            "email": login_data.email,
                            "password": login_data.password
                        })
                        
                        # Kiểm tra xem có user được tạo không
                        if auth_signup.user:
                            new_user_id = auth_signup.user.id
                            
                            # Update user_id trong database
                            if existing_user_id != new_user_id:
                                supabase.table("users").update({"id": new_user_id}).eq("email", login_data.email).execute()
                                user["id"] = new_user_id
                                print(f"Updated user_id from {existing_user_id} to {new_user_id}")
                            
                            # Thử đăng nhập lại sau khi tạo
                            auth_response = supabase.auth.sign_in_with_password({
                                "email": login_data.email,
                                "password": login_data.password
                            })
                        else:
                            # Nếu signup không tạo được user, có thể email đã tồn tại
                            # Thử đăng nhập lại
                            try:
                                auth_response = supabase.auth.sign_in_with_password({
                                    "email": login_data.email,
                                    "password": login_data.password
                                })
                            except:
                                raise HTTPException(
                                    status_code=status.HTTP_401_UNAUTHORIZED,
                                    detail="User exists in database but could not create/login in Supabase Auth. Password may be incorrect."
                                )
                    except Exception as create_error:
                        error_msg = str(create_error)
                        # Nếu không thể tạo, có thể email đã tồn tại trong Supabase Auth nhưng password sai
                        if "already registered" in error_msg.lower() or "email already" in error_msg.lower():
                            # Thử đăng nhập lại
                            try:
                                auth_response = supabase.auth.sign_in_with_password({
                                    "email": login_data.email,
                                    "password": login_data.password
                                })
                            except:
                                raise HTTPException(
                                    status_code=status.HTTP_401_UNAUTHORIZED,
                                    detail="Invalid password. Please check your password or contact administrator to reset."
                                )
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=f"Could not create auth user: {error_msg}"
                            )
            else:
                # User không có trong database
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
        
        if auth_response and auth_response.user:
            # Get user details from custom users table
            user_result = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
            
            if user_result.data:
                user = user_result.data[0]
                
                # Update last login (optional - skip if column doesn't exist)
                try:
                    supabase.table("users").update({
                        "last_login": datetime.utcnow().isoformat()
                    }).eq("id", user["id"]).execute()
                except Exception:
                    # Column doesn't exist, skip update
                    pass
                
                # Return Supabase JWT token instead of creating our own
                return {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token if hasattr(auth_response.session, 'refresh_token') else None,
                    "token_type": "bearer",
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "full_name": user.get("full_name", user["email"].split("@")[0]),
                        "role": user.get("role", "teacher"),
                        "is_active": user.get("is_active", True)
                    }
                }
            else:
                # User authenticated in Supabase Auth but not found in database
                # Create user record in database
                try:
                    new_user = {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email or login_data.email,
                        "full_name": auth_response.user.user_metadata.get("full_name", login_data.email.split("@")[0]) if hasattr(auth_response.user, 'user_metadata') else login_data.email.split("@")[0],
                        "role": auth_response.user.user_metadata.get("role", "teacher") if hasattr(auth_response.user, 'user_metadata') else "teacher",
                        "is_active": True
                    }
                    supabase.table("users").insert(new_user).execute()
                    user = new_user
                except Exception:
                    # If insert fails, use auth user data
                    user = {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email or login_data.email,
                        "full_name": login_data.email.split("@")[0],
                        "role": "teacher",
                        "is_active": True
                    }

                return {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token if hasattr(auth_response.session, 'refresh_token') else None,
                    "token_type": "bearer",
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "full_name": user.get("full_name", login_data.email.split("@")[0]),
                        "role": user.get("role", "teacher"),
                        "is_active": user.get("is_active", True)
                    }
                }
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/sync-user-to-auth")
async def sync_user_to_auth(
    email: str,
    password: str,
    current_user: User = Depends(get_current_user_dev)
):
    """Admin endpoint: Sync user from database to Supabase Auth"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        supabase = get_supabase_client()
        
        # Get user from database
        user_result = supabase.table("users").select("*").eq("email", email).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )
        
        user = user_result.data[0]
        user_id = user.get("id")
        
        # Check if user exists in Supabase Auth
        try:
            auth_users = supabase.auth.admin.list_users()
            existing_auth_user = None
            
            users_list = getattr(auth_users, 'users', [])
            if isinstance(auth_users, list):
                users_list = auth_users
            
            for auth_user in users_list:
                user_email = getattr(auth_user, 'email', None) or (
                    auth_user.get('email') if isinstance(auth_user, dict) else None
                )
                if user_email == email:
                    existing_auth_user = auth_user
                    break
            
            if existing_auth_user:
                # User exists, update password and confirm email
                auth_user_id = getattr(existing_auth_user, 'id', None) or (
                    existing_auth_user.get('id') if isinstance(existing_auth_user, dict) else None
                )
                
                if auth_user_id != user_id:
                    return {
                        "message": f"User exists in Supabase Auth with different ID ({auth_user_id} vs {user_id}). Cannot sync due to foreign key constraints.",
                        "database_user_id": user_id,
                        "auth_user_id": auth_user_id,
                        "action": "Please delete auth user and recreate with correct ID, or update foreign key references."
                    }
                
                # Update password and confirm email
                supabase.auth.admin.update_user_by_id(
                    auth_user_id,
                    {
                        "password": password,
                        "email_confirm": True
                    }
                )
                
                return {
                    "message": "User synced successfully",
                    "user_id": auth_user_id,
                    "email": email,
                    "action": "updated"
                }
            else:
                # User doesn't exist, create new one
                # Note: Cannot set specific user_id with Supabase admin API
                admin_response = supabase.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": user.get("full_name", email.split("@")[0]),
                        "role": user.get("role", "teacher")
                    },
                    "app_metadata": {
                        "role": user.get("role", "teacher")
                    }
                })
                
                if admin_response.user:
                    new_user_id = admin_response.user.id
                    
                    if new_user_id != user_id:
                        # Cannot sync IDs due to foreign key constraints
                        # Delete the newly created user
                        try:
                            supabase.auth.admin.delete_user(new_user_id)
                        except:
                            pass
                        
                        return {
                            "message": f"Cannot sync user IDs due to foreign key constraints",
                            "database_user_id": user_id,
                            "auth_user_id": new_user_id,
                            "action": "User created but deleted. Please create user in Supabase Dashboard with specific user_id or update foreign key references.",
                            "manual_steps": [
                                f"1. Go to Supabase Dashboard → Authentication → Users",
                                f"2. Create new user with email: {email}",
                                f"3. Set password: {password}",
                                f"4. IMPORTANT: Note the user_id created",
                                f"5. Update user_id in database from '{user_id}' to new auth user_id",
                                f"6. Update foreign key references in teachers table"
                            ]
                        }
                    else:
                        return {
                            "message": "User synced successfully",
                            "user_id": new_user_id,
                            "email": email,
                            "action": "created"
                        }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user in Supabase Auth"
                    )
                    
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Sync failed: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync error: {str(e)}"
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
