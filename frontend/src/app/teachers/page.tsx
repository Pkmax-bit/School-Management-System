'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Edit, Trash2, Search, AlertCircle, Loader2, Mail, Calendar } from 'lucide-react';
import { teachersApi, Teacher, CreateTeacherData, UpdateTeacherData } from '@/lib/teachers-api';
// Removed development auth-helper to avoid showing demo user data

export default function TeachersPage() {
  const { isCollapsed } = useSidebar();
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  // State management
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<CreateTeacherData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'teacher',
    education_level: '',
    degree_name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Redirect only if not authenticated; allow teachers to view their info
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadTeachers = useCallback(async () => {
    console.log('🔄 Loading teachers...');
    try {
      setLoadingTeachers(true);
      const data = await teachersApi.getTeachers();
      console.log('✅ Teachers loaded:', data);
      setTeachers(data);
      
      // Show development mode notice
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using fallback data');
      }
    } catch (error: any) {
      console.error('❌ Error loading teachers:', error);
      
      // Set empty array to prevent infinite loading
      setTeachers([]);
      
      if (error.message?.includes('Authentication required')) {
        console.log('🔐 Authentication required, redirecting to login');
        alert('Bạn cần đăng nhập để truy cập chức năng này. Vui lòng đăng nhập lại.');
        logout();
      } else if (error.message?.includes('403')) {
        console.log('🚫 403 Forbidden - No authentication token');
        // Don't show alert for 403, just set empty data
        setTeachers([]);
      } else {
        console.log('⚠️ Other error:', error.message);
        // Don't show alert for network errors, just set empty data
        setTeachers([]);
      }
    } finally {
      setLoadingTeachers(false);
    }
  }, [logout]);

  // Load teachers
  useEffect(() => {
    console.log('🔄 useEffect triggered - user:', user?.role, 'loading:', loading, 'hasLoaded:', hasLoaded);
    if (user && !hasLoaded) {
      loadTeachers();
      setHasLoaded(true);
    }
  }, [user, hasLoaded]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên giáo viên là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên giáo viên phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên giáo viên không được quá 100 ký tự';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password (optional, but if provided must be at least 6 characters)
    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Validate phone (optional)
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Validate role
    if (!formData.role || !['admin', 'teacher', 'student'].includes(formData.role)) {
      newErrors.role = 'Vai trò không hợp lệ';
    }

    // Validate address (optional)
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Địa chỉ không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({}); // Clear previous errors
      
      // Prepare data - only send password if provided
      const createData: CreateTeacherData = {
        ...formData,
        password: formData.password && formData.password.trim() ? formData.password.trim() : undefined
      };
      
      const newTeacher = await teachersApi.createTeacher(createData);
      console.log('Created teacher:', newTeacher);
      
      await loadTeachers();
      setIsDialogOpen(false);
      
      // Show success message with password info
      const passwordUsed = formData.password && formData.password.trim() ? formData.password.trim() : '123456';
      alert(`Tạo giáo viên "${newTeacher?.name}" thành công!\n\nEmail: ${formData.email}\nMật khẩu: ${passwordUsed}\n\nVui lòng ghi nhớ thông tin đăng nhập này để cung cấp cho giáo viên.`);
      
      resetForm();
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message);
      console.log('Error details:', error);
      
      // Hiển thị lỗi chi tiết cho user
      const errorMessage = error.message || 'Không thể tạo giáo viên. Vui lòng thử lại.';
      setErrors({ 
        submit: errorMessage,
        ...(error.message?.includes('Email already exists') || error.message?.includes('email') 
          ? { email: 'Email đã tồn tại trong hệ thống' } 
          : {})
      });
      alert(`Lỗi: ${errorMessage}`);
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
        alert('Bạn không có quyền tạo giáo viên. Vui lòng liên hệ quản trị viên.');
      } else if (error.message?.includes('Server Error')) {
        // Backend 500 error - fallback should have been used
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        // Reload teachers to show the mock data
        await loadTeachers();
        setIsDialogOpen(false);
        resetForm();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        // Network error - fallback should have been used
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi tạo giáo viên: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTeacher || !validateForm()) return;

    try {
      setIsSubmitting(true);
      
      await teachersApi.updateTeacher(editingTeacher.id, formData);
      console.log('Updated teacher:', editingTeacher.id);
      
      await loadTeachers();
      setIsDialogOpen(false);
      resetForm();
      
      // Show success message
      alert('Cập nhật giáo viên thành công!');
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      
      if (error.message?.includes('Authentication required')) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này.');
        logout();
      } else if (error.response?.status === 400) {
        alert('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền cập nhật giáo viên này.');
      } else if (error.message?.includes('Server Error')) {
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        await loadTeachers();
        setIsDialogOpen(false);
        resetForm();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi cập nhật giáo viên: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
      return;
    }

    try {
      await teachersApi.deleteTeacher(id);
      console.log('Deleted teacher:', id);
      
      await loadTeachers();
      alert('Xóa giáo viên thành công!');
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      
      if (error.message?.includes('Authentication required')) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này.');
        logout();
      } else if (error.response?.status === 403) {
        alert('Bạn không có quyền xóa giáo viên này.');
      } else if (error.message?.includes('Server Error')) {
        console.log('Server error detected, fallback should have been used');
        alert('Backend đang gặp lỗi. Đã sử dụng dữ liệu mẫu cho development.');
        await loadTeachers();
      } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        console.log('Network error detected, fallback should have been used');
        alert('Lỗi kết nối. Vui lòng thử lại sau.');
      } else {
        alert('Có lỗi xảy ra khi xóa giáo viên: ' + (error.message || 'Lỗi không xác định'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'teacher',
      education_level: '',
      degree_name: ''
    });
    setErrors({});
    setEditingTeacher(null);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      role: 'teacher', // Default role for editing
      education_level: teacher.education_level || '',
      degree_name: teacher.degree_name || ''
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    (teacher.name && teacher.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.teacher_code && teacher.teacher_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageWithBackground>
      <div className="flex min-h-screen">
        <AdminSidebar 
        currentPage="teachers" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout}
        userName={user?.name}
        userEmail={user?.email}
      />
      
      <div className={`flex-1 h-screen flex flex-col p-6 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Giáo viên</h1>
            <p className="text-gray-600">Quản lý danh sách giáo viên trong hệ thống</p>
            {user && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-gray-200 w-fit">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-gray-900">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="card-transparent">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng giáo viên</p>
                    <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-transparent">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Có địa chỉ</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teachers.filter(t => t.address && t.address.trim().length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="card-transparent mb-6 flex-shrink-0">
            <CardHeader className="card-transparent-header">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách Giáo viên</CardTitle>
                  <p className="text-sm text-gray-600">Tổng số {filteredTeachers.length} giáo viên</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm giáo viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm giáo viên
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTeacher ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingTeacher ? 'Cập nhật thông tin giáo viên' : 'Nhập thông tin giáo viên mới'}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Tên *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? 'border-red-500' : ''}
                            placeholder="Nhập tên giáo viên"
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
                            className={errors.email ? 'border-red-500' : ''}
                            placeholder="Nhập email"
                          />
                          {errors.email && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.email}
                            </div>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="password">Mật khẩu</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={errors.password ? 'border-red-500' : ''}
                            placeholder="Để trống sẽ dùng mật khẩu mặc định: 123456"
                            minLength={6}
                          />
                          <p className="text-xs text-gray-500">
                            Để trống sẽ tự động tạo mật khẩu mặc định: <strong>123456</strong>
                          </p>
                          {errors.password && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.password}
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
                            className={errors.phone ? 'border-red-500' : ''}
                            placeholder="Nhập số điện thoại"
                          />
                          {errors.phone && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.phone}
                            </div>
                          )}
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                          <Label htmlFor="role">Vai trò *</Label>
                          <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                          >
                            <option value="teacher">Giáo viên</option>
                            <option value="admin">Quản trị viên</option>
                            <option value="student">Học sinh</option>
                          </select>
                          {errors.role && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.role}
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

                        {/* Education Level */}
                        <div className="space-y-2">
                          <Label htmlFor="education_level">Trình độ học vấn</Label>
                          <select
                            id="education_level"
                            value={formData.education_level}
                            onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Chọn trình độ học vấn</option>
                            <option value="Sinh viên">Sinh viên</option>
                            <option value="Trung cấp">Trung cấp</option>
                            <option value="Cao đẳng">Cao đẳng</option>
                            <option value="Cử nhân">Cử nhân</option>
                            <option value="Thạc sĩ">Thạc sĩ</option>
                            <option value="Tiến sĩ">Tiến sĩ</option>
                            <option value="Giáo sư">Giáo sư</option>
                          </select>
                        </div>

                        {/* Degree Name */}
                        <div className="space-y-2">
                          <Label htmlFor="degree_name">Tên bằng cấp</Label>
                          <Input
                            id="degree_name"
                            value={formData.degree_name}
                            onChange={(e) => setFormData({ ...formData, degree_name: e.target.value })}
                            placeholder="Ví dụ: Kỹ thuật phần mềm, Quản trị kinh doanh..."
                          />
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
                          onClick={editingTeacher ? handleUpdate : handleCreate}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            editingTeacher ? 'Cập nhật' : 'Tạo mới'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loadingTeachers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="ml-2">Đang tải...</span>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có giáo viên nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mã GV</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Học vấn</TableHead>
                      <TableHead>Bằng cấp</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {teacher.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{teacher.teacher_code}</Badge>
                        </TableCell>
                        <TableCell>{teacher.phone || 'Chưa cập nhật'}</TableCell>
                        <TableCell>{teacher.address || 'Chưa cập nhật'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {teacher.education_level || 'Chưa cập nhật'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {teacher.degree_name || 'Chưa cập nhật'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(teacher.id)}
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
    </PageWithBackground>
  );
}