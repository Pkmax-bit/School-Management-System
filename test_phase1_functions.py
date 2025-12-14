"""
Test Script cho Phase 1 Features
- Reports & Analytics
- Roles & Permissions
- Notifications
- Audit Logs
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid

API_BASE_URL = "http://localhost:8000"

class Phase1TestSuite:
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
            "report_definition_id": None,
            "role_id": None,
            "notification_id": None,
            "notification_template_id": None,
            "permission_id": None,
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
        self.print_section("AUTHENTICATION - Đăng nhập")
        
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

    # ==================== REPORTS & ANALYTICS ====================

    def test_get_report_definitions(self):
        """Test lấy danh sách report definitions"""
        self.print_section("REPORTS - Lấy danh sách Report Definitions")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/reports/definitions",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/reports/definitions", True, f"Tìm thấy {len(data)} report definitions")
                return True
            else:
                self.log_test("GET /api/reports/definitions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/reports/definitions", False, f"Exception: {str(e)}")
            return False

    def test_create_report_definition(self):
        """Test tạo report definition mới"""
        self.print_section("REPORTS - Tạo Report Definition")
        
        try:
            report_data = {
                "name": f"test_report_{uuid.uuid4().hex[:8]}",
                "description": "Test report definition",
                "report_type": "custom",
                "parameters": {"start_date": "2024-01-01", "end_date": "2024-12-31"}
            }
            
            response = requests.post(
                f"{self.base_url}/api/reports/definitions",
                json=report_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["report_definition_id"] = data.get("id")
                self.log_test("POST /api/reports/definitions", True, f"ID: {self.created_ids['report_definition_id']}")
                return True
            else:
                self.log_test("POST /api/reports/definitions", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/reports/definitions", False, f"Exception: {str(e)}")
            return False

    def test_get_student_performance_report(self):
        """Test lấy báo cáo học tập học sinh"""
        self.print_section("REPORTS - Student Performance Report")
        
        try:
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-12-31"
            }
            
            response = requests.get(
                f"{self.base_url}/api/reports/student-performance",
                params=params,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/reports/student-performance", True, "Báo cáo đã được tạo")
                return True
            else:
                self.log_test("GET /api/reports/student-performance", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/reports/student-performance", False, f"Exception: {str(e)}")
            return False

    def test_get_finance_summary_report(self):
        """Test lấy báo cáo tài chính"""
        self.print_section("REPORTS - Finance Summary Report")
        
        try:
            params = {
                "start_date": "2024-01-01",
                "end_date": "2024-12-31"
            }
            
            response = requests.get(
                f"{self.base_url}/api/reports/finance-summary",
                params=params,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/reports/finance-summary", True, "Báo cáo tài chính đã được tạo")
                return True
            else:
                self.log_test("GET /api/reports/finance-summary", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/reports/finance-summary", False, f"Exception: {str(e)}")
            return False

    # ==================== ROLES & PERMISSIONS ====================

    def test_get_permissions(self):
        """Test lấy danh sách permissions"""
        self.print_section("ROLES - Lấy danh sách Permissions")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/roles/permissions",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/roles/permissions", True, f"Tìm thấy {len(data)} permissions")
                if data:
                    self.created_ids["permission_id"] = data[0].get("id")
                return True
            else:
                self.log_test("GET /api/roles/permissions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/roles/permissions", False, f"Exception: {str(e)}")
            return False

    def test_get_roles(self):
        """Test lấy danh sách roles"""
        self.print_section("ROLES - Lấy danh sách Roles")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/roles/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/roles/", True, f"Tìm thấy {len(data)} roles")
                return True
            else:
                self.log_test("GET /api/roles/", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/roles/", False, f"Exception: {str(e)}")
            return False

    def test_create_role(self):
        """Test tạo role mới"""
        self.print_section("ROLES - Tạo Role mới")
        
        try:
            role_data = {
                "name": f"test_role_{uuid.uuid4().hex[:8]}",
                "description": "Test role for Phase 1",
                "is_system_role": False
            }
            
            response = requests.post(
                f"{self.base_url}/api/roles/",
                json=role_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["role_id"] = data.get("id")
                self.log_test("POST /api/roles/", True, f"Role ID: {self.created_ids['role_id']}")
                return True
            else:
                self.log_test("POST /api/roles/", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/roles/", False, f"Exception: {str(e)}")
            return False

    def test_assign_permission_to_role(self):
        """Test gán permission cho role"""
        self.print_section("ROLES - Gán Permission cho Role")
        
        if not self.created_ids.get("role_id") or not self.created_ids.get("permission_id"):
            self.log_test("POST /api/roles/{id}/permissions", False, "Thiếu role_id hoặc permission_id")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/roles/{self.created_ids['role_id']}/permissions",
                json={"permission_id": self.created_ids["permission_id"]},
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                self.log_test("POST /api/roles/{id}/permissions", True, "Permission đã được gán")
                return True
            else:
                self.log_test("POST /api/roles/{id}/permissions", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("POST /api/roles/{id}/permissions", False, f"Exception: {str(e)}")
            return False

    # ==================== NOTIFICATIONS ====================

    def test_get_notifications(self):
        """Test lấy danh sách notifications"""
        self.print_section("NOTIFICATIONS - Lấy danh sách Notifications")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/notifications/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/notifications/", True, f"Tìm thấy {len(data)} notifications")
                return True
            else:
                self.log_test("GET /api/notifications/", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/notifications/", False, f"Exception: {str(e)}")
            return False

    def test_get_unread_count(self):
        """Test lấy số lượng thông báo chưa đọc"""
        self.print_section("NOTIFICATIONS - Số lượng thông báo chưa đọc")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/notifications/unread-count",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                count = data.get("count", 0)
                self.log_test("GET /api/notifications/unread-count", True, f"Có {count} thông báo chưa đọc")
                return True
            else:
                self.log_test("GET /api/notifications/unread-count", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/notifications/unread-count", False, f"Exception: {str(e)}")
            return False

    def test_create_notification(self):
        """Test tạo notification mới"""
        self.print_section("NOTIFICATIONS - Tạo Notification")
        
        try:
            notification_data = {
                "title": "Test Notification",
                "message": "Đây là thông báo test từ Phase 1",
                "notification_type": "info",
                "target_type": "all"
            }
            
            response = requests.post(
                f"{self.base_url}/api/notifications/",
                json=notification_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["notification_id"] = data.get("id")
                self.log_test("POST /api/notifications/", True, f"Notification ID: {self.created_ids['notification_id']}")
                return True
            else:
                self.log_test("POST /api/notifications/", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/notifications/", False, f"Exception: {str(e)}")
            return False

    def test_mark_notification_read(self):
        """Test đánh dấu notification đã đọc"""
        self.print_section("NOTIFICATIONS - Đánh dấu đã đọc")
        
        if not self.created_ids.get("notification_id"):
            self.log_test("PUT /api/notifications/{id}/read", False, "Thiếu notification_id")
            return False
        
        try:
            response = requests.put(
                f"{self.base_url}/api/notifications/{self.created_ids['notification_id']}/read",
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test("PUT /api/notifications/{id}/read", True, "Đã đánh dấu đọc")
                return True
            else:
                self.log_test("PUT /api/notifications/{id}/read", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("PUT /api/notifications/{id}/read", False, f"Exception: {str(e)}")
            return False

    def test_get_notification_templates(self):
        """Test lấy danh sách notification templates"""
        self.print_section("NOTIFICATIONS - Lấy danh sách Templates")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/notifications/templates",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/notifications/templates", True, f"Tìm thấy {len(data)} templates")
                return True
            else:
                self.log_test("GET /api/notifications/templates", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/notifications/templates", False, f"Exception: {str(e)}")
            return False

    def test_create_notification_template(self):
        """Test tạo notification template"""
        self.print_section("NOTIFICATIONS - Tạo Template")
        
        try:
            template_data = {
                "name": f"test_template_{uuid.uuid4().hex[:8]}",
                "title_template": "Test: {{title}}",
                "message_template": "Test message: {{message}}",
                "notification_type": "info",
                "variables": ["title", "message"]
            }
            
            response = requests.post(
                f"{self.base_url}/api/notifications/templates",
                json=template_data,
                headers=self.headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.created_ids["notification_template_id"] = data.get("id")
                self.log_test("POST /api/notifications/templates", True, f"Template ID: {self.created_ids['notification_template_id']}")
                return True
            else:
                self.log_test("POST /api/notifications/templates", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/notifications/templates", False, f"Exception: {str(e)}")
            return False

    # ==================== AUDIT LOGS ====================

    def test_get_audit_logs(self):
        """Test lấy danh sách audit logs"""
        self.print_section("AUDIT LOGS - Lấy danh sách Audit Logs")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/audit-logs/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/audit-logs/", True, f"Tìm thấy {len(data)} audit logs")
                return True
            else:
                self.log_test("GET /api/audit-logs/", False, f"Status: {response.status_code}, Error: {response.text}")
                return False
        except Exception as e:
            self.log_test("GET /api/audit-logs/", False, f"Exception: {str(e)}")
            return False

    def test_get_audit_logs_with_filters(self):
        """Test lấy audit logs với filters"""
        self.print_section("AUDIT LOGS - Lấy với Filters")
        
        try:
            params = {
                "action": "create",
                "limit": 10
            }
            
            response = requests.get(
                f"{self.base_url}/api/audit-logs/",
                params=params,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/audit-logs/ (with filters)", True, f"Tìm thấy {len(data)} logs với filter")
                return True
            else:
                self.log_test("GET /api/audit-logs/ (with filters)", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/audit-logs/ (with filters)", False, f"Exception: {str(e)}")
            return False

    def test_get_audit_statistics(self):
        """Test lấy audit statistics"""
        self.print_section("AUDIT LOGS - Statistics")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/audit-logs/statistics",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/audit-logs/statistics", True, "Đã lấy được statistics")
                return True
            else:
                self.log_test("GET /api/audit-logs/statistics", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/audit-logs/statistics", False, f"Exception: {str(e)}")
            return False

    # ==================== CLEANUP ====================

    def cleanup_test_data(self):
        """Dọn dẹp test data"""
        self.print_section("CLEANUP - Dọn dẹp Test Data")
        
        # Xóa notification template
        if self.created_ids.get("notification_template_id"):
            try:
                requests.delete(
                    f"{self.base_url}/api/notifications/templates/{self.created_ids['notification_template_id']}",
                    headers=self.headers
                )
                self.log_test("DELETE notification template", True, "Đã xóa")
            except:
                pass
        
        # Xóa notification
        if self.created_ids.get("notification_id"):
            try:
                requests.delete(
                    f"{self.base_url}/api/notifications/{self.created_ids['notification_id']}",
                    headers=self.headers
                )
                self.log_test("DELETE notification", True, "Đã xóa")
            except:
                pass
        
        # Xóa role
        if self.created_ids.get("role_id"):
            try:
                requests.delete(
                    f"{self.base_url}/api/roles/{self.created_ids['role_id']}",
                    headers=self.headers
                )
                self.log_test("DELETE role", True, "Đã xóa")
            except:
                pass
        
        # Xóa report definition
        if self.created_ids.get("report_definition_id"):
            try:
                requests.delete(
                    f"{self.base_url}/api/reports/definitions/{self.created_ids['report_definition_id']}",
                    headers=self.headers
                )
                self.log_test("DELETE report definition", True, "Đã xóa")
            except:
                pass

    # ==================== RUN ALL TESTS ====================

    def run_all_tests(self, email: str = "admin@school.com", password: str = "password123"):
        """Chạy tất cả các test"""
        print("\n" + "=" * 70)
        print("  TEST PHASE 1 FEATURES")
        print("  Reports, Roles, Notifications, Audit Logs")
        print("=" * 70)
        print(f"\nAPI Base URL: {self.base_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Authentication
        if not self.test_login(email, password):
            print("\n❌ Không thể đăng nhập. Dừng test.")
            return
        
        # Reports & Analytics
        self.test_get_report_definitions()
        self.test_create_report_definition()
        self.test_get_student_performance_report()
        self.test_get_finance_summary_report()
        
        # Roles & Permissions
        self.test_get_permissions()
        self.test_get_roles()
        self.test_create_role()
        self.test_assign_permission_to_role()
        
        # Notifications
        self.test_get_notifications()
        self.test_get_unread_count()
        self.test_create_notification()
        self.test_mark_notification_read()
        self.test_get_notification_templates()
        self.test_create_notification_template()
        
        # Audit Logs
        self.test_get_audit_logs()
        self.test_get_audit_logs_with_filters()
        self.test_get_audit_statistics()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
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
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if failed > 0:
            print("\n❌ Các test bị lỗi:")
            for detail in self.test_results["details"]:
                if "❌" in detail["status"]:
                    print(f"   - {detail['test']}: {detail['message']}")
        
        print("\n" + "=" * 70)


if __name__ == "__main__":
    tester = Phase1TestSuite()
    tester.run_all_tests()

