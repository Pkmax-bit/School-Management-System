"""
Script test tạo template với 2 bài học và 2 bài tập
Chạy script này để test chức năng template classrooms
"""

import requests
import json
from typing import Optional

# Cấu hình
API_BASE_URL = "http://localhost:8000"
# Thông tin đăng nhập (mặc định là admin)
LOGIN_EMAIL = "admin@school.com"
LOGIN_PASSWORD = "password123"

AUTH_TOKEN = None  # Sẽ được lấy sau khi đăng nhập

def get_auth_token():
    """Đăng nhập và lấy token"""
    global AUTH_TOKEN
    if AUTH_TOKEN:
        return AUTH_TOKEN
    
    print("\n" + "="*60)
    print("🔐 Đăng nhập để lấy token...")
    print("="*60)
    
    login_data = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json=login_data
    )
    
    if response.status_code == 200:
        token_data = response.json()
        AUTH_TOKEN = token_data["access_token"]
        print(f"✅ Đăng nhập thành công!")
        print(f"   User: {token_data.get('user', {}).get('email', 'N/A')}")
        print(f"   Role: {token_data.get('user', {}).get('role', 'N/A')}")
        return AUTH_TOKEN
    else:
        print(f"❌ Lỗi đăng nhập: {response.status_code}")
        print(response.text)
        return None

def get_headers():
    """Lấy headers với token"""
    token = get_auth_token()
    if not token:
        raise Exception("Không thể lấy token. Vui lòng kiểm tra thông tin đăng nhập.")
    
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def print_step(step: str, data: any = None):
    """In thông tin bước thực hiện"""
    print(f"\n{'='*60}")
    print(f"📌 {step}")
    print(f"{'='*60}")
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))

def test_create_template():
    """Test tạo template"""
    print_step("BƯỚC 1: Tạo Template")
    
    # Lấy subject_id đầu tiên
    headers = get_headers()
    subjects_response = requests.get(
        f"{API_BASE_URL}/api/subjects/",
        headers=headers
    )
    subject_id = None
    if subjects_response.status_code == 200:
        subjects = subjects_response.json()
        if subjects and len(subjects) > 0:
            subject_id = subjects[0]["id"]
            print(f"📚 Sử dụng môn học: {subjects[0].get('name', 'N/A')}")
    
    template_data = {
        "name": "Template Test - Toán lớp 10",
        "description": "Template test với 2 bài học và 2 bài tập",
        "capacity": 30,
        "subject_id": subject_id
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/template-classrooms/",
        headers=headers,
        json=template_data
    )
    
    if response.status_code == 200:
        template = response.json()
        print_step("✅ Template đã được tạo", template)
        return template["id"]
    else:
        print(f"❌ Lỗi tạo template: {response.status_code}")
        print(response.text)
        return None

def test_create_lesson(template_id: str, title: str, description: str, sort_order: int):
    """Test tạo bài học cho template"""
    print_step(f"Tạo bài học: {title}")
    
    token = get_auth_token()
    if not token:
        raise Exception("Không thể lấy token")
    
    # Sử dụng FormData để upload (giống như frontend)
    files = {
        'files': ('test_lesson.pdf', b'fake pdf content', 'application/pdf')
    }
    
    form_data = {
        'classroom_id': template_id,
        'title': title,
        'description': description,
        'sort_order': str(sort_order)
    }
    
    # Cần sử dụng multipart/form-data
    upload_headers = {
        "Authorization": f"Bearer {token}"
        # Không set Content-Type, để requests tự set với boundary
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/lessons/upload",
        headers=upload_headers,
        files=files,
        data=form_data
    )
    
    if response.status_code == 200:
        lesson = response.json()
        print_step(f"✅ Bài học '{title}' đã được tạo", lesson)
        return lesson["id"]
    else:
        print(f"❌ Lỗi tạo bài học: {response.status_code}")
        print(response.text)
        return None

def test_create_assignment(template_id: str, title: str, description: str, assignment_type: str):
    """Test tạo bài tập cho template"""
    print_step(f"Tạo bài tập: {title}")
    
    headers = get_headers()
    
    # Lấy teacher_id và subject_id từ template
    template_response = requests.get(
        f"{API_BASE_URL}/api/template-classrooms/{template_id}",
        headers=headers
    )
    
    if template_response.status_code != 200:
        print(f"❌ Không thể lấy thông tin template: {template_response.status_code}")
        return None
    
    template = template_response.json()
    
    # Lấy teacher_id đầu tiên
    teachers_response = requests.get(
        f"{API_BASE_URL}/api/teachers/",
        headers=headers
    )
    teacher_id = None
    if teachers_response.status_code == 200:
        teachers = teachers_response.json()
        if teachers and len(teachers) > 0:
            teacher_id = teachers[0]["id"]
            print(f"👨‍🏫 Sử dụng giáo viên: {teachers[0].get('full_name', 'N/A')}")
    
    # Tạo assignment
    assignment_data = {
        "title": title,
        "description": description,
        "assignment_type": assignment_type,  # "multiple_choice" hoặc "essay"
        "total_points": 100.0,
        "subject_id": template.get("subject_id") or None,
        "teacher_id": teacher_id,
        "time_limit_minutes": 60 if assignment_type == "multiple_choice" else 0,
        "attempts_allowed": 1,
        "shuffle_questions": False
    }
    
    response = requests.post(
        f"{API_BASE_URL}/api/assignments/",
        headers=headers,
        json=assignment_data
    )
    
    if response.status_code == 200:
        assignment = response.json()
        assignment_id = assignment["id"]
        
        # Gán assignment cho template (classroom)
        assign_response = requests.post(
            f"{API_BASE_URL}/api/assignments/{assignment_id}/classrooms",
            headers=headers,
            json=[template_id]  # List of classroom_ids
        )
        
        if assign_response.status_code == 200:
            print_step(f"✅ Bài tập '{title}' đã được tạo và gán cho template", assignment)
            return assignment_id
        else:
            print(f"⚠️ Bài tập đã tạo nhưng không thể gán cho template: {assign_response.status_code}")
            return assignment_id
    else:
        print(f"❌ Lỗi tạo bài tập: {response.status_code}")
        print(response.text)
        return None

def test_get_template_content(template_id: str):
    """Kiểm tra nội dung template"""
    print_step("KIỂM TRA NỘI DUNG TEMPLATE")
    
    headers = get_headers()
    
    # Lấy lessons
    lessons_response = requests.get(
        f"{API_BASE_URL}/api/template-classrooms/{template_id}/lessons",
        headers=headers
    )
    
    # Lấy assignments
    assignments_response = requests.get(
        f"{API_BASE_URL}/api/template-classrooms/{template_id}/assignments",
        headers=headers
    )
    
    lessons = lessons_response.json() if lessons_response.status_code == 200 else []
    assignments = assignments_response.json() if assignments_response.status_code == 200 else []
    
    print(f"\n📚 Số bài học: {len(lessons)}")
    for i, lesson in enumerate(lessons, 1):
        print(f"  {i}. {lesson.get('title', 'N/A')}")
    
    print(f"\n📝 Số bài tập: {len(assignments)}")
    for i, assignment in enumerate(assignments, 1):
        print(f"  {i}. {assignment.get('title', 'N/A')} ({assignment.get('assignment_type', 'N/A')})")
    
    return len(lessons), len(assignments)

def main():
    """Hàm main để chạy test"""
    print("\n" + "="*60)
    print("🧪 TEST TẠO TEMPLATE VỚI 2 BÀI HỌC VÀ 2 BÀI TẬP")
    print("="*60)
    
    # Bước 1: Tạo template
    template_id = test_create_template()
    if not template_id:
        print("\n❌ Không thể tạo template. Dừng test.")
        return
    
    # Bước 2: Tạo 2 bài học
    print_step("BƯỚC 2: Tạo 2 Bài học")
    lesson1_id = test_create_lesson(
        template_id,
        "Bài học 1: Giới thiệu về Toán học",
        "Bài học giới thiệu các khái niệm cơ bản về toán học",
        1
    )
    
    lesson2_id = test_create_lesson(
        template_id,
        "Bài học 2: Phép tính cơ bản",
        "Học về các phép tính cộng, trừ, nhân, chia",
        2
    )
    
    # Bước 3: Tạo 2 bài tập
    print_step("BƯỚC 3: Tạo 2 Bài tập")
    assignment1_id = test_create_assignment(
        template_id,
        "Bài tập 1: Trắc nghiệm Toán cơ bản",
        "Bài tập trắc nghiệm về các phép tính cơ bản",
        "multiple_choice"
    )
    
    assignment2_id = test_create_assignment(
        template_id,
        "Bài tập 2: Tự luận - Giải bài toán",
        "Bài tập tự luận yêu cầu giải các bài toán",
        "essay"
    )
    
    # Bước 4: Kiểm tra kết quả
    print_step("BƯỚC 4: Kiểm tra kết quả")
    lesson_count, assignment_count = test_get_template_content(template_id)
    
    # Tổng kết
    print("\n" + "="*60)
    print("📊 TỔNG KẾT")
    print("="*60)
    print(f"✅ Template ID: {template_id}")
    print(f"✅ Số bài học: {lesson_count}/2")
    print(f"✅ Số bài tập: {assignment_count}/2")
    
    if lesson_count == 2 and assignment_count == 2:
        print("\n🎉 TEST THÀNH CÔNG! Template đã có đủ 2 bài học và 2 bài tập.")
    else:
        print(f"\n⚠️ TEST CHƯA HOÀN TẤT. Cần kiểm tra lại.")
    
    print(f"\n🔗 Xem template tại: http://localhost:3000/documents")
    print(f"🔗 Xem chi tiết template tại: http://localhost:3000/classrooms/{template_id}")

if __name__ == "__main__":
    import sys
    import io
    # Set UTF-8 encoding for Windows console
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("\n" + "="*60)
    print("LUU Y:")
    print("1. Dam bao backend server dang chay tai http://localhost:8000")
    print("2. Script se tu dong dang nhap voi tai khoan admin mac dinh")
    print("3. Co the thay doi LOGIN_EMAIL va LOGIN_PASSWORD trong script neu can")
    print("="*60)
    
    try:
        main()
    except Exception as e:
        print(f"\n❌ Loi: {e}")
        import traceback
        traceback.print_exc()

