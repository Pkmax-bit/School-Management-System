"""
Script để sync teacher user từ database sang Supabase Auth
Sử dụng service role key để tạo user với đúng user_id từ database
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY phải được cấu hình trong file .env")
    print("   SUPABASE_URL: URL của Supabase project")
    print("   SUPABASE_SERVICE_ROLE_KEY: Service role key từ Supabase Dashboard (Settings -> API)")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def sync_teacher_to_auth(email: str, password: str):
    """
    Sync teacher user từ database sang Supabase Auth
    """
    print("="*60)
    print(f"[SYNC] Đang sync user: {email}")
    print("="*60)
    
    # 1. Lấy user từ database
    print("\n[STEP 1] Đang kiểm tra user trong database...")
    user_result = supabase.table('users').select('*').eq('email', email).execute()
    
    if not user_result.data or len(user_result.data) == 0:
        print(f"[ERROR] User '{email}' không tồn tại trong database!")
        return False
    
    user = user_result.data[0]
    user_id = user['id']
    full_name = user.get('full_name', email.split('@')[0])
    role = user.get('role', 'teacher')
    
    print(f"[OK] Tìm thấy user trong database:")
    print(f"   ID: {user_id}")
    print(f"   Email: {user['email']}")
    print(f"   Full Name: {full_name}")
    print(f"   Role: {role}")
    
    # 2. Kiểm tra xem user đã có trong Supabase Auth chưa
    print("\n[STEP 2] Đang kiểm tra user trong Supabase Auth...")
    try:
        auth_users = supabase.auth.admin.list_users()
        existing_auth_user = None
        
        # Lấy danh sách users
        users_list = getattr(auth_users, 'users', [])
        if isinstance(auth_users, list):
            users_list = auth_users
        
        # Tìm user với email
        for auth_user in users_list:
            user_email = getattr(auth_user, 'email', None)
            if not user_email and isinstance(auth_user, dict):
                user_email = auth_user.get('email')
            
            if user_email == email:
                existing_auth_user = auth_user
                break
        
        if existing_auth_user:
            auth_user_id = getattr(existing_auth_user, 'id', None)
            if not auth_user_id and isinstance(existing_auth_user, dict):
                auth_user_id = existing_auth_user.get('id')
            
            print(f"[INFO] User đã tồn tại trong Supabase Auth:")
            print(f"   Auth ID: {auth_user_id}")
            print(f"   Database ID: {user_id}")
            
            if auth_user_id == user_id:
                print("\n[STEP 3] User ID trùng nhau, đang cập nhật password...")
                # Update password và confirm email
                supabase.auth.admin.update_user_by_id(
                    auth_user_id,
                    {
                        "password": password,
                        "email_confirm": True
                    }
                )
                print(f"[SUCCESS] Đã cập nhật password và confirm email cho user!")
                return True
            else:
                print(f"\n[WARNING] User ID không trùng nhau!")
                print(f"   Database ID: {user_id}")
                print(f"   Auth ID: {auth_user_id}")
                print(f"\n[OPTION 1] Xóa user cũ trong Supabase Auth và tạo lại")
                print(f"[OPTION 2] Cập nhật user_id trong database (nhưng có thể gây lỗi foreign key)")
                
                # Option 1: Xóa và tạo lại
                choice = input("\nBạn muốn xóa user cũ trong Supabase Auth và tạo lại? (y/n): ").lower()
                if choice == 'y':
                    try:
                        supabase.auth.admin.delete_user(auth_user_id)
                        print(f"[OK] Đã xóa user cũ trong Supabase Auth")
                    except Exception as e:
                        print(f"[ERROR] Không thể xóa user: {str(e)}")
                        return False
                else:
                    print("[SKIP] Bỏ qua việc sync")
                    return False
        
        # 3. Tạo user mới trong Supabase Auth
        print("\n[STEP 3] Đang tạo user trong Supabase Auth...")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Full Name: {full_name}")
        print(f"   Role: {role}")
        
        # Lưu ý: Supabase Admin API không cho phép set user_id cụ thể khi tạo user
        # Nên sẽ tạo user mới với ID tự động, sau đó cần update trong database nếu cần
        admin_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto confirm email
            "user_metadata": {
                "full_name": full_name,
                "role": role
            },
            "app_metadata": {
                "role": role
            }
        })
        
        if admin_response.user:
            new_auth_user_id = admin_response.user.id
            print(f"[OK] Đã tạo user trong Supabase Auth")
            print(f"   New Auth ID: {new_auth_user_id}")
            
            if new_auth_user_id == user_id:
                print(f"\n[SUCCESS] User ID trùng nhau! Sync thành công!")
                return True
            else:
                print(f"\n[WARNING] User ID không trùng nhau!")
                print(f"   Database ID: {user_id}")
                print(f"   New Auth ID: {new_auth_user_id}")
                
                # Kiểm tra foreign key constraint
                teacher_check = supabase.table("teachers").select("id").eq("user_id", user_id).limit(1).execute()
                has_foreign_key = teacher_check.data and len(teacher_check.data) > 0
                
                if has_foreign_key:
                    print(f"\n[ERROR] User có foreign key constraint (teacher record)!")
                    print(f"   Không thể update user_id trong database.")
                    print(f"\n[OPTIONS]")
                    print(f"   Option 1: Xóa user mới trong Supabase Auth và tạo thủ công trong Supabase Dashboard")
                    print(f"   Option 2: Update foreign key references trong teachers table")
                    
                    choice = input("\nBạn muốn xóa user mới trong Supabase Auth? (y/n): ").lower()
                    if choice == 'y':
                        try:
                            supabase.auth.admin.delete_user(new_auth_user_id)
                            print(f"[OK] Đã xóa user mới trong Supabase Auth")
                            print(f"\n[HƯỚNG DẪN] Để sync user với foreign key constraint:")
                            print(f"   1. Vào Supabase Dashboard → Authentication → Users")
                            print(f"   2. Tạo user mới với email: {email}")
                            print(f"   3. Set password: {password}")
                            print(f"   4. Confirm email")
                            print(f"   5. Lưu lại user_id được tạo")
                            print(f"   6. Update user_id trong database từ '{user_id}' sang user_id mới")
                            print(f"   7. Update foreign key references trong teachers table")
                        except Exception as e:
                            print(f"[ERROR] Không thể xóa user: {str(e)}")
                    return False
                else:
                    # Không có foreign key constraint, có thể update user_id
                    print(f"\n[INFO] Không có foreign key constraint, đang update user_id...")
                    try:
                        supabase.table("users").update({"id": new_auth_user_id}).eq("email", email).execute()
                        print(f"[SUCCESS] Đã update user_id trong database!")
                        print(f"   Old ID: {user_id}")
                        print(f"   New ID: {new_auth_user_id}")
                        return True
                    except Exception as e:
                        print(f"[ERROR] Không thể update user_id: {str(e)}")
                        return False
        else:
            print(f"[ERROR] Không thể tạo user trong Supabase Auth")
            return False
            
    except Exception as e:
        print(f"[ERROR] Lỗi khi sync: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    teacher_email = "teacher@school.com"
    teacher_password = "teacher123"
    
    print("\n" + "="*60)
    print("SYNC TEACHER USER TO SUPABASE AUTH")
    print("="*60)
    
    success = sync_teacher_to_auth(teacher_email, teacher_password)
    
    if success:
        print("\n" + "="*60)
        print("[SUCCESS] SYNC THÀNH CÔNG!")
        print("="*60)
        print(f"Bạn có thể đăng nhập với:")
        print(f"   Email: {teacher_email}")
        print(f"   Password: {teacher_password}")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("[FAILED] SYNC THẤT BẠI!")
        print("="*60)
        print("Vui lòng kiểm tra lại hoặc tạo user thủ công trong Supabase Dashboard")
        print("="*60)

