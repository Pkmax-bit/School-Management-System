"""
Script để tạo user teacher trong database
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY phai duoc cau hinh trong file .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_teacher_user():
    """Tạo user teacher trong database"""
    
    teacher_email = "teacher@school.com"
    teacher_password = "teacher123"
    teacher_name = "Nguyen Van Giao"
    
    print(f"[+] Dang tao user teacher...")
    print(f"   Email: {teacher_email}")
    print(f"   Password: {teacher_password}")
    print(f"   Ten: {teacher_name}")
    
    try:
        # Kiểm tra xem user đã tồn tại chưa
        result = supabase.table('users').select('*').eq('email', teacher_email).execute()
        
        if result.data and len(result.data) > 0:
            print(f"[!] User teacher da ton tai voi email: {teacher_email}")
            user_id = result.data[0]['id']
            print(f"   User ID: {user_id}")
            
            # Kiem tra xem da co ban ghi teacher chua
            teacher_result = supabase.table('teachers').select('*').eq('user_id', user_id).execute()
            if teacher_result.data and len(teacher_result.data) > 0:
                print(f"[!] Teacher record da ton tai")
            else:
                print(f"[+] Chua co teacher record, dang tao...")
                # Tao teacher record
                teacher_code = f"TC{str(user_id)[:8].upper()}"
                teacher_insert = supabase.table('teachers').insert({
                    'user_id': user_id,
                    'teacher_code': teacher_code,
                    'specialization': 'Toan hoc',
                    'experience_years': '5 nam'
                }).execute()
                print(f"[+] Da tao teacher record voi ma: {teacher_code}")
            return
        
        # Tao user moi voi Supabase Auth
        print("[+] Dang tao user trong Supabase Auth...")
        auth_response = supabase.auth.sign_up({
            'email': teacher_email,
            'password': teacher_password
        })
        
        if not auth_response.user:
            print("[X] Khong the tao user trong Supabase Auth")
            return
        
        user_id = auth_response.user.id
        print(f"[+] Da tao user trong Supabase Auth, ID: {user_id}")
        
        # Tao user record trong table users
        print("[+] Dang tao user record trong database...")
        user_insert = supabase.table('users').insert({
            'id': user_id,
            'email': teacher_email,
            'full_name': teacher_name,
            'role': 'teacher',
            'is_active': True
        }).execute()
        
        print(f"[+] Da tao user record")
        
        # Tao teacher record
        print("[+] Dang tao teacher record...")
        teacher_code = f"TC{str(user_id)[:8].upper()}"
        teacher_insert = supabase.table('teachers').insert({
            'user_id': user_id,
            'teacher_code': teacher_code,
            'specialization': 'Toan hoc',
            'experience_years': '5 nam',
            'phone': '0912345678',
            'address': 'Ha Noi'
        }).execute()
        
        print(f"[+] Da tao teacher record voi ma: {teacher_code}")
        
        print("\n" + "="*50)
        print("[SUCCESS] TAO USER TEACHER THANH CONG!")
        print("="*50)
        print(f"Email: {teacher_email}")
        print(f"Password: {teacher_password}")
        print(f"Ten: {teacher_name}")
        print(f"Role: teacher")
        print(f"Teacher Code: {teacher_code}")
        print("="*50)
        
    except Exception as e:
        print(f"[X] Loi khi tao user teacher: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_teacher_user()

