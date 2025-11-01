"""
Script để tạo admin user trong Supabase Auth và database
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables from multiple possible locations
env_files = ['.env', 'backend/.env', os.path.join(os.path.dirname(__file__), '.env'), 
             os.path.join(os.path.dirname(__file__), 'backend', '.env')]
for env_file in env_files:
    if os.path.exists(env_file):
        load_dotenv(env_file)
        break
else:
    # Fallback: try loading from current directory
    load_dotenv()

# Supabase configuration - try multiple variable names
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY phai duoc cau hinh trong file .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_admin_user():
    """Tạo admin user trong Supabase Auth và database"""
    
    admin_email = "admin@school.com"
    admin_password = "password123"
    admin_name = "Administrator"
    
    print(f"[+] Đang tạo admin user...")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    print(f"   Tên: {admin_name}")
    
    try:
        # Kiểm tra xem user đã tồn tại chưa trong bảng users
        result = supabase.table('users').select('*').eq('email', admin_email).execute()
        
        if result.data and len(result.data) > 0:
            print(f"[!] User đã tồn tại trong database với email: {admin_email}")
            user_id = result.data[0]['id']
            print(f"   User ID: {user_id}")
            print(f"   Role: {result.data[0].get('role', 'N/A')}")
            
            # Kiểm tra xem user có trong Supabase Auth không
            try:
                # Thử lấy user từ auth bằng admin API
                auth_users = supabase.auth.admin.list_users()
                auth_user = None
                for u in auth_users.users:
                    if u.email == admin_email:
                        auth_user = u
                        break
                
                if auth_user:
                    print(f"[+] User đã tồn tại trong Supabase Auth")
                    print(f"   Auth User ID: {auth_user.id}")
                    print("\n" + "="*50)
                    print("[INFO] ADMIN USER ĐÃ TỒN TẠI!")
                    print("="*50)
                    print(f"Email: {admin_email}")
                    print(f"Password: {admin_password}")
                    print(f"Tên: {admin_name}")
                    print(f"Role: {result.data[0].get('role', 'admin')}")
                    print("="*50)
                    return
                else:
                    print(f"[!] User chưa tồn tại trong Supabase Auth, đang tạo...")
            except Exception as e:
                print(f"[!] Không thể kiểm tra Supabase Auth: {e}")
                print(f"[+] Đang thử tạo user trong Supabase Auth...")
        
        # Tạo user mới trong Supabase Auth bằng admin API để confirm email ngay
        print("[+] Đang tạo user trong Supabase Auth (admin API)...")
        try:
            # Thử tìm user đã tồn tại trước
            auth_users_response = supabase.auth.admin.list_users()
            auth_users = getattr(auth_users_response, 'users', None) or (
                auth_users_response if isinstance(auth_users_response, list) else []
            )
            existing_auth_user = None
            for u in auth_users:
                user_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
                if user_email == admin_email:
                    existing_auth_user = u
                    break
            
            if existing_auth_user:
                print(f"[+] User đã tồn tại trong Supabase Auth")
                user_id = existing_auth_user.id
                print(f"   Auth User ID: {user_id}")
                
                # Confirm email nếu chưa confirm
                if not getattr(existing_auth_user, 'email_confirmed_at', None):
                    print("[+] Đang confirm email...")
                    try:
                        supabase.auth.admin.update_user_by_id(
                            user_id,
                            {'email_confirm': True}
                        )
                        print("[+] Đã confirm email")
                    except Exception as e:
                        print(f"[!] Không thể confirm email: {e}")
            else:
                # Tạo user mới với admin API (email_confirm = True)
                auth_response = supabase.auth.admin.create_user({
                    'email': admin_email,
                    'password': admin_password,
                    'email_confirm': True,
                    'user_metadata': {
                        'full_name': admin_name,
                        'role': 'admin'
                    }
                })
                auth_user = getattr(auth_response, 'user', None) or (auth_response.get('user') if isinstance(auth_response, dict) else None)
                if not auth_user:
                    print("[X] Không thể tạo user trong Supabase Auth")
                    return
                user_id = getattr(auth_user, 'id', None) or (auth_user.get('id') if isinstance(auth_user, dict) else None)
                print(f"[+] Đã tạo user trong Supabase Auth, ID: {user_id}")
        except Exception as e:
            print(f"[!] Lỗi khi sử dụng admin API: {e}")
            # Fallback: thử sign_up thông thường
            print("[+] Thử tạo user bằng sign_up...")
            try:
                auth_response = supabase.auth.sign_up({
                    'email': admin_email,
                    'password': admin_password,
                    'options': {
                        'data': {
                            'full_name': admin_name,
                            'role': 'admin'
                        }
                    }
                })
                auth_user = getattr(auth_response, 'user', None) or (auth_response.get('user') if isinstance(auth_response, dict) else None)
                if auth_user:
                    user_id = getattr(auth_user, 'id', None) or (auth_user.get('id') if isinstance(auth_user, dict) else None)
                    print(f"[+] Đã tạo user bằng sign_up, ID: {user_id}")
                    # Sau đó confirm email bằng admin API
                    try:
                        supabase.auth.admin.update_user_by_id(user_id, {'email_confirm': True})
                        print("[+] Đã confirm email")
                    except:
                        print("[!] Không thể confirm email tự động, vui lòng confirm email thủ công trong Supabase Dashboard")
                else:
                    # Nếu user đã tồn tại trong DB, lấy user_id từ đó
                    if result.data and len(result.data) > 0:
                        user_id = result.data[0]['id']
                        print(f"[+] Sử dụng user_id từ database: {user_id}")
                        # Thử confirm email
                        try:
                            supabase.auth.admin.update_user_by_id(user_id, {'email_confirm': True})
                            print("[+] Đã confirm email")
                        except:
                            pass
                    else:
                        return
            except Exception as signup_error:
                print(f"[X] Lỗi khi tạo user bằng sign_up: {signup_error}")
                if result.data and len(result.data) > 0:
                    user_id = result.data[0]['id']
                    print(f"[+] Sử dụng user_id từ database: {user_id}")
                else:
                    return
        
        # Tạo hoặc cập nhật user record trong bảng users
        print("[+] Đang tạo/cập nhật user record trong database...")
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(admin_password)
        
        # Kiểm tra xem đã tồn tại chưa
        existing_user = supabase.table('users').select('*').eq('email', admin_email).execute()
        
        if existing_user.data and len(existing_user.data) > 0:
            existing_user_id = existing_user.data[0]['id']
            if existing_user_id != user_id:
                # User ID không khớp - xóa bản ghi cũ và tạo mới với user_id từ Auth
                print(f"[!] User ID trong database ({existing_user_id}) khác với user ID trong Supabase Auth ({user_id})")
                print(f"[+] Đang xóa bản ghi cũ và tạo mới với user ID đúng...")
                supabase.table('users').delete().eq('email', admin_email).execute()
                user_insert = supabase.table('users').insert({
                    'id': user_id,
                    'email': admin_email,
                    'full_name': admin_name,
                    'role': 'admin',
                    'is_active': True,
                    'password_hash': password_hash
                }).execute()
                print(f"[+] Đã tạo lại user record với user ID đúng")
            else:
                # Cập nhật user hiện tại
                user_update = supabase.table('users').update({
                    'id': user_id,
                    'full_name': admin_name,
                    'role': 'admin',
                    'is_active': True,
                    'password_hash': password_hash
                }).eq('email', admin_email).execute()
                print(f"[+] Đã cập nhật user record")
        else:
            # Tạo user mới
            user_insert = supabase.table('users').insert({
                'id': user_id,
                'email': admin_email,
                'full_name': admin_name,
                'role': 'admin',
                'is_active': True,
                'password_hash': password_hash
            }).execute()
            print(f"[+] Đã tạo user record")
        
        print("\n" + "="*50)
        print("[SUCCESS] TẠO ADMIN USER THÀNH CÔNG!")
        print("="*50)
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print(f"Tên: {admin_name}")
        print(f"Role: admin")
        print(f"User ID: {user_id}")
        print("="*50)
        
    except Exception as e:
        print(f"[X] Lỗi khi tạo admin user: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
