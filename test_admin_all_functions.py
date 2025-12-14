"""
Kịch bản test toàn diện cho tất cả các chức năng Admin
Test script for all Admin functions
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid

API_BASE_URL = "http://localhost:8000"

class AdminTestSuite:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.token: Optional[str] = None
        self.headers: Dict[str, str] = {
            "Content-Type": "application/json"
        }
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "details": []
        }
        # Test data storage
        self.created_ids = {
            "teacher_id": None,
            "student_id": None,
            "subject_id": None,
            "classroom_id": None,
            "campus_id": None,
            "schedule_id": None,
            "payment_id": None,
            "attendance_id": None,
        }

    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Ghi log kết quả test"""
        self.test_results["total"] += 1
        if passed:
            self.test_results["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results["failed"] += 1
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "status": status,
            "message": message
        }
        self.test_results["details"].append(result)
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")

    def print_section(self, title: str):
        """In tiêu đề section"""
        print("\n" + "=" * 70)
        print(f"  {title}")
        print("=" * 70)

    # ==================== AUTHENTICATION ====================
    
    def test_login(self, email: str = "admin@school.com", password: str = "password123"):
        """Test đăng nhập admin"""
        self.print_section("1. AUTHENTICATION - Đăng nhập")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password},
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token") or data.get("token")
                if self.token:
                    self.headers["Authorization"] = f"Bearer {self.token}"
                    self.log_test("Login", True, f"Token nhận được: {self.token[:20]}...")
                    return True
                else:
                    self.log_test("Login", False, "Không nhận được token")
                    return False
            else:
                self.log_test("Login", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Login", False, f"Exception: {str(e)}")
            return False

    def test_get_current_user(self):
        """Test lấy thông tin user hiện tại"""
        self.print_section("2. AUTHENTICATION - Lấy thông tin user")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                role = data.get("role", "")
                if role == "admin":
                    self.log_test("Get Current User", True, f"Role: {role}, Email: {data.get('email')}")
                    return True
                else:
                    self.log_test("Get Current User", False, f"Role không phải admin: {role}")
                    return False
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return False

    # ==================== DASHBOARD ====================
    
    def test_dashboard_stats(self):
        """Test lấy thống kê dashboard"""
        self.print_section("3. DASHBOARD - Thống kê tổng quan")
        
        endpoints = [
            ("Teachers", "/api/teachers?limit=1000"),
            ("Students", "/api/students?limit=1000"),
            ("Classrooms", "/api/classrooms?limit=1000"),
            ("Subjects", "/api/subjects?limit=1000"),
            ("Campuses", "/api/campuses?limit=1000"),
            ("Finance Stats", "/api/finances/stats/summary"),
            ("Payments", "/api/payments?limit=1000"),
        ]
        
        all_passed = True
        for name, endpoint in endpoints:
            try:
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=self.headers
                )
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else (len(data.get("data", [])) if isinstance(data, dict) else 0)
                    self.log_test(f"Dashboard - {name}", True, f"Lấy được {count} records")
                else:
                    self.log_test(f"Dashboard - {name}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Dashboard - {name}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    # ==================== TEACHERS ====================
    
    def test_create_teacher(self):
        """Test tạo giáo viên mới"""
        self.print_section("4. TEACHERS - Tạo giáo viên")
        
        teacher_data = {
            "name": f"Giáo viên Test {uuid.uuid4().hex[:6]}",
            "email": f"teacher_test_{uuid.uuid4().hex[:8]}@school.com",
            "password": "123456",
            "teacher_code": f"GV{uuid.uuid4().hex[:6].upper()}",
            "phone": "0901234567",
            "address": "123 Đường Test",
            "specialization": "Toán học",
            "experience_years": "5"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/teachers/",
                json=teacher_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["teacher_id"] = data.get("id")
                self.log_test("Create Teacher", True, f"ID: {self.created_ids['teacher_id']}, Tên: {teacher_data['name']}")
                return True
            else:
                self.log_test("Create Teacher", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Teacher", False, f"Exception: {str(e)}")
            return False

    def test_get_teachers(self):
        """Test lấy danh sách giáo viên"""
        self.print_section("5. TEACHERS - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/teachers/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                teachers = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Teachers", True, f"Tổng số: {len(teachers)} giáo viên")
                return True
            else:
                self.log_test("Get Teachers", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Teachers", False, f"Exception: {str(e)}")
            return False

    def test_update_teacher(self):
        """Test cập nhật giáo viên"""
        self.print_section("6. TEACHERS - Cập nhật giáo viên")
        
        if not self.created_ids["teacher_id"]:
            self.log_test("Update Teacher", False, "Không có teacher_id để test")
            return False
        
        update_data = {
            "phone": "0909999999",
            "address": "456 Đường Mới",
            "specialization": "Vật lý"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/teachers/{self.created_ids['teacher_id']}",
                json=update_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test("Update Teacher", True, "Cập nhật thành công")
                return True
            else:
                self.log_test("Update Teacher", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Teacher", False, f"Exception: {str(e)}")
            return False

    def test_delete_teacher(self):
        """Test xóa giáo viên"""
        self.print_section("7. TEACHERS - Xóa giáo viên")
        
        if not self.created_ids["teacher_id"]:
            self.log_test("Delete Teacher", False, "Không có teacher_id để test")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/teachers/{self.created_ids['teacher_id']}",
                headers=self.headers
            )
            
            if response.status_code in [200, 204]:
                self.log_test("Delete Teacher", True, "Xóa thành công")
                self.created_ids["teacher_id"] = None
                return True
            else:
                self.log_test("Delete Teacher", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Teacher", False, f"Exception: {str(e)}")
            return False

    # ==================== STUDENTS ====================
    
    def test_create_student(self):
        """Test tạo học sinh mới"""
        self.print_section("8. STUDENTS - Tạo học sinh")
        
        student_data = {
            "name": f"Học sinh Test {uuid.uuid4().hex[:6]}",
            "email": f"student_test_{uuid.uuid4().hex[:8]}@school.com",
            "password": "123456",
            "student_code": f"HS{uuid.uuid4().hex[:6].upper()}",
            "phone": "0907654321",
            "address": "789 Đường Học sinh",
            "date_of_birth": "2010-01-01",
            "parent_name": "Phụ huynh Test",
            "parent_phone": "0901111111"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/students/",
                json=student_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["student_id"] = data.get("id")
                self.log_test("Create Student", True, f"ID: {self.created_ids['student_id']}, Tên: {student_data['name']}")
                return True
            else:
                self.log_test("Create Student", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Student", False, f"Exception: {str(e)}")
            return False

    def test_get_students(self):
        """Test lấy danh sách học sinh"""
        self.print_section("9. STUDENTS - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/students/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                students = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Students", True, f"Tổng số: {len(students)} học sinh")
                return True
            else:
                self.log_test("Get Students", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Students", False, f"Exception: {str(e)}")
            return False

    def test_update_student(self):
        """Test cập nhật học sinh"""
        self.print_section("10. STUDENTS - Cập nhật học sinh")
        
        if not self.created_ids["student_id"]:
            self.log_test("Update Student", False, "Không có student_id để test")
            return False
        
        update_data = {
            "phone": "0908888888",
            "address": "999 Đường Cập nhật"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/students/{self.created_ids['student_id']}",
                json=update_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test("Update Student", True, "Cập nhật thành công")
                return True
            else:
                self.log_test("Update Student", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Student", False, f"Exception: {str(e)}")
            return False

    def test_delete_student(self):
        """Test xóa học sinh"""
        self.print_section("11. STUDENTS - Xóa học sinh")
        
        if not self.created_ids["student_id"]:
            self.log_test("Delete Student", False, "Không có student_id để test")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/students/{self.created_ids['student_id']}",
                headers=self.headers
            )
            
            if response.status_code in [200, 204]:
                self.log_test("Delete Student", True, "Xóa thành công")
                self.created_ids["student_id"] = None
                return True
            else:
                self.log_test("Delete Student", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Student", False, f"Exception: {str(e)}")
            return False

    # ==================== SUBJECTS ====================
    
    def test_create_subject(self):
        """Test tạo môn học mới"""
        self.print_section("12. SUBJECTS - Tạo môn học")
        
        subject_data = {
            "name": f"Môn học Test {uuid.uuid4().hex[:6]}",
            "code": f"MH{uuid.uuid4().hex[:6].upper()}",
            "description": "Môn học test tự động"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/subjects/",
                json=subject_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["subject_id"] = data.get("id")
                self.log_test("Create Subject", True, f"ID: {self.created_ids['subject_id']}, Tên: {subject_data['name']}")
                return True
            else:
                self.log_test("Create Subject", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Subject", False, f"Exception: {str(e)}")
            return False

    def test_get_subjects(self):
        """Test lấy danh sách môn học"""
        self.print_section("13. SUBJECTS - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/subjects/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                subjects = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Subjects", True, f"Tổng số: {len(subjects)} môn học")
                return True
            else:
                self.log_test("Get Subjects", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Subjects", False, f"Exception: {str(e)}")
            return False

    def test_update_subject(self):
        """Test cập nhật môn học"""
        self.print_section("14. SUBJECTS - Cập nhật môn học")
        
        if not self.created_ids["subject_id"]:
            self.log_test("Update Subject", False, "Không có subject_id để test")
            return False
        
        update_data = {
            "description": "Mô tả đã cập nhật"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/subjects/{self.created_ids['subject_id']}",
                json=update_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test("Update Subject", True, "Cập nhật thành công")
                return True
            else:
                self.log_test("Update Subject", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Subject", False, f"Exception: {str(e)}")
            return False

    def test_delete_subject(self):
        """Test xóa môn học"""
        self.print_section("15. SUBJECTS - Xóa môn học")
        
        if not self.created_ids["subject_id"]:
            self.log_test("Delete Subject", False, "Không có subject_id để test")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/subjects/{self.created_ids['subject_id']}",
                headers=self.headers
            )
            
            if response.status_code in [200, 204]:
                self.log_test("Delete Subject", True, "Xóa thành công")
                self.created_ids["subject_id"] = None
                return True
            else:
                self.log_test("Delete Subject", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Subject", False, f"Exception: {str(e)}")
            return False

    # ==================== CLASSROOMS ====================
    
    def test_create_classroom(self):
        """Test tạo lớp học mới"""
        self.print_section("16. CLASSROOMS - Tạo lớp học")
        
        # Cần có subject_id và campus_id, nếu chưa có thì lấy từ danh sách
        subject_id = self.created_ids.get("subject_id")
        if not subject_id:
            # Lấy subject đầu tiên
            try:
                res = requests.get(f"{self.base_url}/api/subjects/", headers=self.headers)
                if res.status_code == 200:
                    subjects = res.json()
                    if isinstance(subjects, list) and len(subjects) > 0:
                        subject_id = subjects[0].get("id")
            except:
                pass
        
        classroom_data = {
            "name": f"Lớp Test {uuid.uuid4().hex[:6]}",
            "code": f"LOP{uuid.uuid4().hex[:6].upper()}",
            "description": "Lớp học test",
            "capacity": 30,
            "subject_id": subject_id,
            "tuition_per_session": 50000,
            "sessions_per_week": 2
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/classrooms/",
                json=classroom_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["classroom_id"] = data.get("id")
                self.log_test("Create Classroom", True, f"ID: {self.created_ids['classroom_id']}, Tên: {classroom_data['name']}")
                return True
            else:
                self.log_test("Create Classroom", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Classroom", False, f"Exception: {str(e)}")
            return False

    def test_get_classrooms(self):
        """Test lấy danh sách lớp học"""
        self.print_section("17. CLASSROOMS - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/classrooms/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                classrooms = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Classrooms", True, f"Tổng số: {len(classrooms)} lớp học")
                return True
            else:
                self.log_test("Get Classrooms", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Classrooms", False, f"Exception: {str(e)}")
            return False

    def test_update_classroom(self):
        """Test cập nhật lớp học"""
        self.print_section("18. CLASSROOMS - Cập nhật lớp học")
        
        if not self.created_ids["classroom_id"]:
            self.log_test("Update Classroom", False, "Không có classroom_id để test")
            return False
        
        update_data = {
            "capacity": 35,
            "description": "Mô tả đã cập nhật"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/classrooms/{self.created_ids['classroom_id']}",
                json=update_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test("Update Classroom", True, "Cập nhật thành công")
                return True
            else:
                self.log_test("Update Classroom", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Classroom", False, f"Exception: {str(e)}")
            return False

    def test_delete_classroom(self):
        """Test xóa lớp học"""
        self.print_section("19. CLASSROOMS - Xóa lớp học")
        
        if not self.created_ids["classroom_id"]:
            self.log_test("Delete Classroom", False, "Không có classroom_id để test")
            return False
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/classrooms/{self.created_ids['classroom_id']}",
                headers=self.headers
            )
            
            if response.status_code in [200, 204]:
                self.log_test("Delete Classroom", True, "Xóa thành công")
                self.created_ids["classroom_id"] = None
                return True
            else:
                self.log_test("Delete Classroom", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Delete Classroom", False, f"Exception: {str(e)}")
            return False

    # ==================== CAMPUSES ====================
    
    def test_create_campus(self):
        """Test tạo cơ sở mới"""
        self.print_section("20. CAMPUSES - Tạo cơ sở")
        
        campus_data = {
            "name": f"Cơ sở Test {uuid.uuid4().hex[:6]}",
            "code": f"CS{uuid.uuid4().hex[:6].upper()}",
            "address": "123 Đường Cơ sở",
            "phone": "0901234567"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/campuses/",
                json=campus_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["campus_id"] = data.get("id")
                self.log_test("Create Campus", True, f"ID: {self.created_ids['campus_id']}, Tên: {campus_data['name']}")
                return True
            else:
                self.log_test("Create Campus", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Campus", False, f"Exception: {str(e)}")
            return False

    def test_get_campuses(self):
        """Test lấy danh sách cơ sở"""
        self.print_section("21. CAMPUSES - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/campuses/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                campuses = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Campuses", True, f"Tổng số: {len(campuses)} cơ sở")
                return True
            else:
                self.log_test("Get Campuses", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Campuses", False, f"Exception: {str(e)}")
            return False

    # ==================== SCHEDULES ====================
    
    def test_create_schedule(self):
        """Test tạo lịch học"""
        self.print_section("22. SCHEDULES - Tạo lịch học")
        
        # Cần có classroom_id
        classroom_id = self.created_ids.get("classroom_id")
        if not classroom_id:
            try:
                res = requests.get(f"{self.base_url}/api/classrooms/", headers=self.headers)
                if res.status_code == 200:
                    classrooms = res.json()
                    if isinstance(classrooms, list) and len(classrooms) > 0:
                        classroom_id = classrooms[0].get("id")
            except:
                pass
        
        if not classroom_id:
            self.log_test("Create Schedule", False, "Không có classroom_id để test")
            return False
        
        schedule_data = {
            "classroom_id": classroom_id,
            "day_of_week": 1,  # Monday
            "start_time": "08:00:00",
            "end_time": "09:30:00",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/schedules/",
                json=schedule_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["schedule_id"] = data.get("id")
                self.log_test("Create Schedule", True, f"ID: {self.created_ids['schedule_id']}")
                return True
            else:
                self.log_test("Create Schedule", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Schedule", False, f"Exception: {str(e)}")
            return False

    def test_get_schedules(self):
        """Test lấy danh sách lịch học"""
        self.print_section("23. SCHEDULES - Lấy danh sách")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/schedules/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                schedules = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Schedules", True, f"Tổng số: {len(schedules)} lịch học")
                return True
            else:
                self.log_test("Get Schedules", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Schedules", False, f"Exception: {str(e)}")
            return False

    # ==================== FINANCE ====================
    
    def test_get_finance_stats(self):
        """Test lấy thống kê tài chính"""
        self.print_section("24. FINANCE - Thống kê tài chính")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/finances/stats/summary",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Get Finance Stats", True, f"Stats: {json.dumps(data, ensure_ascii=False)}")
                return True
            else:
                self.log_test("Get Finance Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Finance Stats", False, f"Exception: {str(e)}")
            return False

    def test_get_payments(self):
        """Test lấy danh sách thanh toán"""
        self.print_section("25. FINANCE - Danh sách thanh toán")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/payments/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                payments = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Payments", True, f"Tổng số: {len(payments)} thanh toán")
                return True
            else:
                self.log_test("Get Payments", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Payments", False, f"Exception: {str(e)}")
            return False

    # ==================== ATTENDANCE ====================
    
    def test_get_attendances(self):
        """Test lấy danh sách điểm danh"""
        self.print_section("26. ATTENDANCE - Danh sách điểm danh")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/attendances/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                attendances = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Attendances", True, f"Tổng số: {len(attendances)} điểm danh")
                return True
            else:
                self.log_test("Get Attendances", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Attendances", False, f"Exception: {str(e)}")
            return False

    # ==================== ASSIGNMENTS ====================
    
    def test_get_assignments(self):
        """Test lấy danh sách bài tập"""
        self.print_section("27. ASSIGNMENTS - Danh sách bài tập")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/assignments/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                assignments = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Assignments", True, f"Tổng số: {len(assignments)} bài tập")
                return True
            else:
                self.log_test("Get Assignments", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Assignments", False, f"Exception: {str(e)}")
            return False

    # ==================== USERS ====================
    
    def test_get_users(self):
        """Test lấy danh sách users"""
        self.print_section("28. USERS - Danh sách users")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/users/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                users = data if isinstance(data, list) else data.get("data", [])
                self.log_test("Get Users", True, f"Tổng số: {len(users)} users")
                return True
            else:
                self.log_test("Get Users", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Users", False, f"Exception: {str(e)}")
            return False

    # ==================== RUN ALL TESTS ====================
    
    def run_all_tests(self, email: str = "admin@school.com", password: str = "password123"):
        """Chạy tất cả các test"""
        print("\n" + "=" * 70)
        print("  KỊCH BẢN TEST TOÀN DIỆN CHO ADMIN")
        print("  COMPREHENSIVE ADMIN TEST SUITE")
        print("=" * 70)
        print(f"\nAPI Base URL: {self.base_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Authentication
        if not self.test_login(email, password):
            print("\n❌ Không thể đăng nhập. Dừng test.")
            return
        
        self.test_get_current_user()
        
        # Dashboard
        self.test_dashboard_stats()
        
        # Teachers CRUD
        self.test_create_teacher()
        self.test_get_teachers()
        self.test_update_teacher()
        # Không xóa để test các chức năng khác có thể dùng
        
        # Students CRUD
        self.test_create_student()
        self.test_get_students()
        self.test_update_student()
        # Không xóa để test các chức năng khác có thể dùng
        
        # Subjects CRUD
        self.test_create_subject()
        self.test_get_subjects()
        self.test_update_subject()
        # Không xóa để test các chức năng khác có thể dùng
        
        # Classrooms CRUD
        self.test_create_classroom()
        self.test_get_classrooms()
        self.test_update_classroom()
        # Không xóa để test các chức năng khác có thể dùng
        
        # Campuses
        self.test_create_campus()
        self.test_get_campuses()
        
        # Schedules
        self.test_create_schedule()
        self.test_get_schedules()
        
        # Finance
        self.test_get_finance_stats()
        self.test_get_payments()
        
        # Attendance
        self.test_get_attendances()
        
        # Assignments
        self.test_get_assignments()
        
        # Users
        self.test_get_users()
        
        # Cleanup - Xóa các test data đã tạo
        self.print_section("CLEANUP - Dọn dẹp dữ liệu test")
        if self.created_ids["classroom_id"]:
            self.test_delete_classroom()
        if self.created_ids["student_id"]:
            self.test_delete_student()
        if self.created_ids["teacher_id"]:
            self.test_delete_teacher()
        if self.created_ids["subject_id"]:
            self.test_delete_subject()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """In tổng kết kết quả test"""
        self.print_section("TỔNG KẾT KẾT QUẢ TEST")
        
        total = self.test_results["total"]
        passed = self.test_results["passed"]
        failed = self.test_results["failed"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"\nTổng số test: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {success_rate:.2f}%")
        
        print("\n" + "-" * 70)
        print("CHI TIẾT KẾT QUẢ:")
        print("-" * 70)
        for detail in self.test_results["details"]:
            print(f"{detail['status']}: {detail['test']}")
            if detail['message']:
                print(f"   → {detail['message']}")
        
        print("\n" + "=" * 70)
        if failed == 0:
            print("🎉 TẤT CẢ TEST ĐỀU PASS!")
        else:
            print(f"⚠️  CÓ {failed} TEST FAILED. Vui lòng kiểm tra lại.")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    suite = AdminTestSuite()
    
    # Có thể thay đổi email/password nếu cần
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@school.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "password123"
    
    suite.run_all_tests(email, password)

