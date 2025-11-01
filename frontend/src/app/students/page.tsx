'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Edit, Trash2, Plus, Search, Users, Mail, Phone, MapPin, Calendar, UserCheck, Loader2, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { studentsApi, CreateStudentData, UpdateStudentData } from '@/lib/students-api';
import { Student } from '@/types';
import { useApiAuth } from '@/hooks/useApiAuth';
import * as XLSX from 'xlsx';

// Helper functions
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

function createMockToken() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', 'mock-jwt-token-for-development');
    console.log('🔧 Development mode: Mock token created');
  }
}

export default function StudentsPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Navigation handler
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    router.push(`/${page}`);
  };
  const [formData, setFormData] = useState<CreateStudentData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'student',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    classroom_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const loadStudents = useCallback(async () => {
    console.log('🔄 Loading students...');
    try {
      setLoadingStudents(true);
      const response = await studentsApi.getStudents();
      console.log('✅ Students loaded:', response);
      setStudents(response);
    } catch (error: any) {
      console.error('Error loading students:', error);
      setStudents([]);
      if (error.message?.includes('Authentication required')) {
        console.log('🔐 Authentication required, logging out...');
        logout();
      }
    } finally {
      setLoadingStudents(false);
    }
  }, [logout]);

  // Load students
  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', user?.role, 'loading:', loading, 'hasLoaded:', hasLoaded);
    if (user && user.role === 'admin' && !hasLoaded) {
      // Create mock token for development if not authenticated
      if (isDevelopment() && !isAuthenticated()) {
        console.log('🔧 Development mode: Creating mock authentication token');
        createMockToken();
      }
      loadStudents();
      setHasLoaded(true);
    }
  }, [user, hasLoaded]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên học sinh là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên học sinh phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên học sinh không được quá 100 ký tự';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    } else if (formData.email.trim().length > 255) {
      newErrors.email = 'Email không được quá 255 ký tự';
    }

    // Validate phone
    if (formData.phone && formData.phone.trim().length > 20) {
      newErrors.phone = 'Số điện thoại không được quá 20 ký tự';
    }

    // Validate address
    if (formData.address && formData.address.trim().length > 500) {
      newErrors.address = 'Địa chỉ không được quá 500 ký tự';
    }

    // Validate parent name
    if (formData.parent_name && formData.parent_name.trim().length > 255) {
      newErrors.parent_name = 'Tên phụ huynh không được quá 255 ký tự';
    }

    // Validate parent phone
    if (formData.parent_phone && formData.parent_phone.trim().length > 20) {
      newErrors.parent_phone = 'Số điện thoại phụ huynh không được quá 20 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({}); // Clear previous errors
      
      const newStudent = await studentsApi.createStudent(formData);
      console.log('Created student:', newStudent);
      
      await loadStudents();
      setIsDialogOpen(false);
      resetForm();
      
      // Show success message
      alert(`Tạo học sinh "${newStudent?.name || 'thành công'}" thành công!`);
    } catch (error: any) {
      console.error('Error creating student:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message);
      console.log('Error response:', error.response);
      
      if (error.message?.includes('Authentication required')) {
        alert('Bạn cần đăng nhập để truy cập chức năng này. Vui lòng đăng nhập lại.');
        logout();
      } else if (error.response?.status === 400) {
        // Handle validation errors from backend
        const errorData = error.response.data;
        if (errorData.detail?.includes('email already exists')) {
          setErrors({ email: 'Email đã tồn tại' });
        } else {
          alert('Dữ liệu không hợp lệ: ' + errorData.detail);
        }
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền tạo học sinh. Vui lòng liên hệ quản trị viên.');
      } else if (error.message?.includes('Server Error')) {
        // Backend 500 error - fallback should have been used
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        // Reload students to show the mock data
        await loadStudents();
        setIsDialogOpen(false);
        resetForm();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        // Network error - fallback should have been used
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi tạo học sinh: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingStudent || !validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({}); // Clear previous errors
      
      await studentsApi.updateStudent(editingStudent.id, formData);
      console.log('Updated student:', editingStudent.id);
      
      await loadStudents();
      setIsDialogOpen(false);
      resetForm();
      
      // Show success message
      alert('Cập nhật học sinh thành công!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      
      if (error.message?.includes('Authentication required')) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này.');
        logout();
      } else if (error.response?.status === 400) {
        alert('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền cập nhật học sinh này.');
      } else if (error.message?.includes('Server Error')) {
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        await loadStudents();
        setIsDialogOpen(false);
        resetForm();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi cập nhật học sinh: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.name}"?`)) {
      return;
    }

    try {
      await studentsApi.deleteStudent(student.id);
      console.log('Deleted student:', student.id);
      
      await loadStudents();
      alert('Xóa học sinh thành công!');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      
      if (error.message?.includes('Authentication required')) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này.');
        logout();
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền xóa học sinh này.');
      } else if (error.message?.includes('Server Error')) {
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        await loadStudents();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi xóa học sinh: ' + (error.message || 'Lỗi không xác định'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      role: 'student',
      date_of_birth: '',
      parent_name: '',
      parent_phone: '',
      classroom_id: ''
    });
    setErrors({});
    setEditingStudent(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      address: student.address || '',
      role: 'student', // Default role for editing
      date_of_birth: student.date_of_birth || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      classroom_id: student.classroom_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={logout} />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Học sinh</h1>
            <p className="text-gray-600 mt-2">Quản lý thông tin học sinh trong hệ thống</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng học sinh</p>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Có địa chỉ</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.filter(s => s.address && s.address.trim().length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Có ngày sinh</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.filter(s => s.date_of_birth && s.date_of_birth.trim().length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Có thông tin phụ huynh</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.filter(s => s.parent_name && s.parent_name.trim().length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách Học sinh</CardTitle>
                  <p className="text-sm text-gray-600">Tổng số {filteredStudents.length} học sinh</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Download file mẫu Excel để import học sinh
                      const ws = XLSX.utils.aoa_to_sheet([
                        ['Mã học sinh', 'Tên học sinh', 'Email', 'Ngày sinh (YYYY-MM-DD)', 'Số điện thoại', 'Địa chỉ', 'Tên phụ huynh', 'SĐT phụ huynh'],
                        ['HS001', 'Nguyễn Văn A', 'nguyenvana@example.com', '2010-01-15', '0123456789', '123 Đường ABC', 'Nguyễn Văn B', '0987654321'],
                        ['HS002', 'Trần Thị B', 'tranthib@example.com', '2010-03-20', '0987654321', '456 Đường XYZ', 'Trần Thị C', '0123456789'],
                      ]);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
                      XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh.xlsx');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải mẫu Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Export danh sách học sinh ra Excel
                      const wsData = [
                        ['Mã học sinh', 'Tên học sinh', 'Email', 'Ngày sinh', 'Số điện thoại', 'Địa chỉ', 'Tên phụ huynh', 'SĐT phụ huynh', 'Mã lớp', 'Ngày tạo'],
                        ...students.map((student: Student) => [
                          student.student_code || '',
                          student.name || '',
                          student.email || '',
                          student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : '',
                          student.phone || '',
                          student.address || '',
                          student.parent_name || '',
                          student.parent_phone || '',
                          student.classroom_id || '',
                          student.created_at ? String(student.created_at).slice(0, 10) : '',
                        ])
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
                      XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Xuất Excel
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          const data = await file.arrayBuffer();
                          const workbook = XLSX.read(data);
                          const sheetName = workbook.SheetNames[0];
                          const worksheet = workbook.Sheets[sheetName];
                          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                          
                          // Skip header row
                          const students = jsonData.slice(1).map((row: any) => ({
                            student_code: row[0] || '',
                            name: row[1] || '',
                            email: row[2] || '',
                            date_of_birth: row[3] || '',
                            phone: row[4] || '',
                            address: row[5] || '',
                            parent_name: row[6] || '',
                            parent_phone: row[7] || '',
                          })).filter((s: any) => s.student_code || s.name);
                          
                          if (students.length === 0) {
                            alert('Không có dữ liệu học sinh hợp lệ trong file Excel');
                            return;
                          }
                          
                          // Prompt user to select classroom (optional)
                          const selectedClassCode = prompt(`Nhập mã lớp để gán học sinh vào (hoặc để trống nếu không gán lớp):\n\nLưu ý: Có thể để trống nếu chưa có lớp học`);
                          let selectedClassId = null;
                          
                          if (selectedClassCode && selectedClassCode.trim()) {
                            // Try to find classroom
                            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                            
                            try {
                              const classResponse = await fetch(`${API_BASE_URL}/api/classrooms?code=${encodeURIComponent(selectedClassCode.trim())}`, {
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                                },
                              });
                              
                              if (classResponse.ok) {
                                const classData = await classResponse.json();
                                const classList = Array.isArray(classData) ? classData : (Array.isArray((classData as any)?.data) ? (classData as any).data : []);
                                if (classList.length > 0) {
                                  selectedClassId = classList[0].id;
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching classroom:', error);
                            }
                            
                            if (!selectedClassId && selectedClassCode.trim()) {
                              const confirm = window.confirm(`Không tìm thấy lớp học với mã: ${selectedClassCode}\n\nBạn có muốn tiếp tục import học sinh mà không gán lớp không?`);
                              if (!confirm) {
                                e.target.value = '';
                                return;
                              }
                            }
                          }
                          
                          // Import students
                          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                          const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                          
                          let successCount = 0;
                          let errorCount = 0;
                          const errors: string[] = [];
                          
                          for (const student of students) {
                            try {
                              // Create user first
                              let userId = null;
                              try {
                                const userResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                                  },
                                  body: JSON.stringify({
                                    email: student.email || `${student.student_code}@school.local`,
                                    password: 'TempPassword123!',
                                    full_name: student.name,
                                    role: 'student'
                                  }),
                                });
                                
                                if (userResponse.ok) {
                                  const userData = await userResponse.json();
                                  userId = userData.user_id || userData.user?.id || userData.id;
                                } else {
                                  const errorData = await userResponse.json().catch(() => ({ detail: 'Unknown error' }));
                                  // Check if user already exists
                                  if (userResponse.status === 400 && (errorData.detail?.includes('already') || errorData.detail?.includes('registered'))) {
                                    // Try to get existing user by email
                                    const getUsersRes = await fetch(`${API_BASE_URL}/api/users?email=${encodeURIComponent(student.email || `${student.student_code}@school.local`)}`, {
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                                      },
                                    });
                                    if (getUsersRes.ok) {
                                      const usersData = await getUsersRes.json();
                                      const usersList = Array.isArray(usersData) ? usersData : (Array.isArray((usersData as any)?.data) ? (usersData as any).data : []);
                                      if (usersList.length > 0) {
                                        userId = usersList[0].id;
                                      }
                                    }
                                  }
                                  if (!userId) {
                                    throw new Error(errorData.detail || 'Failed to create user');
                                  }
                                }
                              } catch (error: any) {
                                errors.push(`${student.student_code || student.name}: ${error.message || 'Lỗi tạo user'}`);
                                errorCount++;
                                continue;
                              }
                              
                              // Create student
                              const studentResponse = await fetch(`${API_BASE_URL}/api/students`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                                },
                                body: JSON.stringify({
                                  student_code: student.student_code,
                                  name: student.name,
                                  email: student.email || `${student.student_code}@school.local`,
                                  user_id: userId,
                                  classroom_id: selectedClassId || null,
                                  date_of_birth: student.date_of_birth || null,
                                  phone: student.phone || null,
                                  address: student.address || null,
                                  parent_name: student.parent_name || null,
                                  parent_phone: student.parent_phone || null,
                                  role: 'student'
                                }),
                              });
                              
                              if (studentResponse.ok) {
                                successCount++;
                              } else {
                                const errorData = await studentResponse.json().catch(() => ({ detail: 'Unknown error' }));
                                errors.push(`${student.student_code || student.name}: ${errorData.detail || 'Lỗi tạo học sinh'}`);
                                errorCount++;
                              }
                            } catch (error: any) {
                              errors.push(`${student.student_code || student.name}: ${error.message || 'Lỗi không xác định'}`);
                              errorCount++;
                              console.error('Error importing student:', student.student_code, error);
                            }
                          }
                          
                          let message = `Import hoàn tất!\n\nThành công: ${successCount}\nLỗi: ${errorCount}`;
                          if (errors.length > 0 && errors.length <= 10) {
                            message += `\n\nChi tiết lỗi:\n${errors.join('\n')}`;
                          } else if (errors.length > 10) {
                            message += `\n\nChi tiết lỗi (${errors.length} lỗi, hiển thị 10 lỗi đầu):\n${errors.slice(0, 10).join('\n')}`;
                          }
                          alert(message);
                          
                          // Reload data
                          await loadStudents();
                          
                          // Reset file input
                          e.target.value = '';
                        } catch (error) {
                          console.error('Error importing Excel:', error);
                          alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button type="button" variant="outline" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import Excel
                    </Button>
                  </label>
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm học sinh..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm học sinh
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingStudent ? 'Cập nhật thông tin học sinh' : 'Nhập thông tin học sinh mới'}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Tên học sinh *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nhập tên học sinh"
                            className={errors.name ? 'border-red-500' : ''}
                          />
                          {errors.name && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.name}
                            </div>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Nhập email"
                            className={errors.email ? 'border-red-500' : ''}
                          />
                          {errors.email && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.email}
                            </div>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Nhập số điện thoại"
                            className={errors.phone ? 'border-red-500' : ''}
                          />
                          {errors.phone && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.phone}
                            </div>
                          )}
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth">Ngày sinh</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          />
                        </div>

                        {/* Parent Name */}
                        <div className="space-y-2">
                          <Label htmlFor="parent_name">Tên phụ huynh</Label>
                          <Input
                            id="parent_name"
                            value={formData.parent_name}
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                            placeholder="Nhập tên phụ huynh"
                            className={errors.parent_name ? 'border-red-500' : ''}
                          />
                          {errors.parent_name && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.parent_name}
                            </div>
                          )}
                        </div>

                        {/* Parent Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="parent_phone">Số điện thoại phụ huynh</Label>
                          <Input
                            id="parent_phone"
                            value={formData.parent_phone}
                            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                            placeholder="Nhập số điện thoại phụ huynh"
                            className={errors.parent_phone ? 'border-red-500' : ''}
                          />
                          {errors.parent_phone && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.parent_phone}
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Địa chỉ</Label>
                          <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Nhập địa chỉ"
                            rows={3}
                          />
                          {errors.address && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.address}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={editingStudent ? handleUpdate : handleCreate}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            editingStudent ? 'Cập nhật' : 'Tạo mới'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="ml-2">Đang tải...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có học sinh nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mã HS</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Ngày sinh</TableHead>
                      <TableHead>Phụ huynh</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {student.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.student_code}</Badge>
                        </TableCell>
                        <TableCell>{student.phone || 'Chưa cập nhật'}</TableCell>
                        <TableCell>{student.address || 'Chưa cập nhật'}</TableCell>
                        <TableCell>
                          {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{student.parent_name || 'Chưa cập nhật'}</div>
                            {student.parent_phone && (
                              <div className="text-gray-500">{student.parent_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(student)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(student)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}