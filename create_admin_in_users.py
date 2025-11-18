"""
Script để tạo admin user trong bảng users với password_hash
Chỉ tạo trong database, không tạo trong Supabase Auth
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
from passlib.context import CryptContext
import uuid
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
env_files = ['.env', 'backend/.env', os.path.join(os.path.dirname(__file__), '.env'), 
             os.path.join(os.path.dirname(__file__), 'backend', '.env')]
for env_file in env_files:
    if os.path.exists(env_file):
        load_dotenv(env_file)
        break
else:
    load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL và SUPABASE_KEY phải được cấu hình trong file .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    """Tạo admin user trong bảng users với password_hash"""
    
    admin_email = "admin@school.com"
    admin_password = "password123"
    admin_name = "Administrator"
    
    print("="*60)
    print("TẠO ADMIN USER TRONG BẢNG USERS")
    print("="*60)
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print(f"Tên: {admin_name}")
    print(f"Role: admin")
    print("="*60)
    
    try:
        # Kiểm tra xem user đã tồn tại chưa
        result = supabase.table('users').select('*').eq('email', admin_email).execute()
        
        if result.data and len(result.data) > 0:
            existing_user = result.data[0]
            print(f"\n[!] User đã tồn tại với email: {admin_email}")
            print(f"   User ID: {existing_user['id']}")
            print(f"   Role: {existing_user.get('role', 'N/A')}")
            
            # Hash password mới
            password_hash = pwd_context.hash(admin_password)
            
            # Cập nhật user
            print(f"\n[+] Đang cập nhật user...")
            update_result = supabase.table('users').update({
                'full_name': admin_name,
                'role': 'admin',
                'is_active': True,
                'password_hash': password_hash,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('email', admin_email).execute()
            
            if update_result.data:
                print(f"[✓] Đã cập nhật user thành công!")
                print(f"\n" + "="*60)
                print("THÔNG TIN ĐĂNG NHẬP:")
                print("="*60)
                print(f"Email: {admin_email}")
                print(f"Password: {admin_password}")
                print(f"Role: admin")
                print("="*60)
                return
            else:
                print(f"[✗] Không thể cập nhật user")
                return
        
        # Tạo user mới
        print(f"\n[+] Đang tạo user mới...")
        
        # Hash password
        password_hash = pwd_context.hash(admin_password)
        
        # Tạo UUID cho user
        user_id = str(uuid.uuid4())
        
        # Insert vào database
        user_data = {
            'id': user_id,
            'email': admin_email,
            'full_name': admin_name,
            'role': 'admin',
            'is_active': True,
            'password_hash': password_hash,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        insert_result = supabase.table('users').insert(user_data).execute()
        
        if insert_result.data:
            print(f"[✓] Đã tạo user thành công!")
            print(f"   User ID: {user_id}")
            print(f"\n" + "="*60)
            print("THÔNG TIN ĐĂNG NHẬP:")
            print("="*60)
            print(f"Email: {admin_email}")
            print(f"Password: {admin_password}")
            print(f"Role: admin")
            print(f"User ID: {user_id}")
            print("="*60)
            print("\n[INFO] User này có thể đăng nhập bằng password_hash")
            print("       (không cần tạo trong Supabase Auth)")
        else:
            print(f"[✗] Không thể tạo user")
            
    except Exception as e:
        print(f"\n[✗] Lỗi khi tạo admin user: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()

