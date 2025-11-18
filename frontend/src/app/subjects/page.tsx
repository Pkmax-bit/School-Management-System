'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Edit, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';
import { subjectsApi, Subject, CreateSubjectData, UpdateSubjectData } from '@/lib/subjects-api-hybrid';

export default function SubjectsPage() {
  const { isCollapsed } = useSidebar();
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  // State management
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<CreateSubjectData>({
    name: '',
    code: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const normalizedRole = (user?.role || '').toLowerCase().trim();

  const loadSubjects = useCallback(async () => {
    // Check if we have a token before making the request
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (!token || token.trim() === '') {
      console.warn('⚠️ No token found when loading subjects');
      if (user) {
        // User is logged in but no token - might need to refresh
        console.log('User exists but no token, checking auth...');
      } else {
        console.log('No user and no token, redirecting to login');
        router.push('/login');
        return;
      }
    }
    
    try {
      setLoadingSubjects(true);
      console.log('🔄 Loading subjects with token:', token ? 'Yes' : 'No');
      const data = await subjectsApi.getSubjects();
      console.log('✅ Subjects loaded:', data?.length || 0, 'subjects');
      setSubjects(data || []);
    } catch (error: any) {
      console.error('❌ Error loading subjects:', error);
      setSubjects([]);
      
      if (error.message?.includes('401') || error.message?.includes('Could not validate credentials')) {
        console.log('🔐 401 Unauthorized - Token expired or invalid');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        logout();
      } else if (error.message?.includes('Authentication required')) {
        console.log('🔐 Authentication required');
        alert('Bạn cần đăng nhập để truy cập chức năng này. Vui lòng đăng nhập lại.');
        logout();
      } else if (error.message?.includes('403')) {
        console.log('🚫 403 Forbidden - No permission');
        alert('Bạn không có quyền truy cập chức năng này.');
      }
    } finally {
      setLoadingSubjects(false);
    }
  }, [logout, user, router]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();

    if (!trimmedName) {
      newErrors.name = 'Tên môn học là bắt buộc';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Tên môn học phải có ít nhất 2 ký tự';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Tên môn học không được quá 100 ký tự';
    }

    if (!trimmedCode) {
      newErrors.code = 'Mã môn học là bắt buộc';
    } else if (trimmedCode.length < 2) {
      newErrors.code = 'Mã môn học phải có ít nhất 2 ký tự';
    } else if (trimmedCode.length > 20) {
      newErrors.code = 'Mã môn học không được quá 20 ký tự';
    } else if (!/^[A-Za-z0-9]+$/.test(trimmedCode)) {
      newErrors.code = 'Mã môn học chỉ được chứa chữ cái và số';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setEditingSubject(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await subjectsApi.createSubject({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description?.trim() || '',
      });
      await loadSubjects();
      setIsDialogOpen(false);
      resetForm();
      alert(`Thêm môn học "${formData.name}" thành công!`);
    } catch (error: any) {
      console.error('Error creating subject:', error);
      alert(error?.message || 'Có lỗi xảy ra khi tạo môn học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject || !validateForm()) return;

    try {
      setIsSubmitting(true);
      await subjectsApi.updateSubject(editingSubject.id, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description?.trim() || '',
      });
      await loadSubjects();
      setIsDialogOpen(false);
      setEditingSubject(null);
      resetForm();
      alert('Cập nhật môn học thành công!');
    } catch (error: any) {
      console.error('Error updating subject:', error);
      alert(error?.message || 'Có lỗi xảy ra khi cập nhật môn học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;
    try {
      await subjectsApi.deleteSubject(id);
      await loadSubjects();
      alert('Xóa môn học thành công!');
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      alert(error?.message || 'Có lỗi xảy ra khi xóa môn học');
    }
  };

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (subject) =>
        subject.name?.toLowerCase().includes(q) ||
        subject.code?.toLowerCase().includes(q) ||
        subject.description?.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  // Load subjects once admin session is confirmed
  useEffect(() => {
    if (loading) {
      return;
    }

    if (user?.role === 'admin' && !hasLoaded) {
      loadSubjects();
      setHasLoaded(true);
    }
  }, [user, loading, hasLoaded, loadSubjects]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || normalizedRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full mx-4 text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang Môn học.</p>
          <p className="text-sm text-gray-500">
            Vai trò hiện tại: <span className="font-semibold">{normalizedRole || 'Chưa đăng nhập'}</span>
          </p>
          <div className="space-y-2 pt-2">
            <Button className="w-full" onClick={() => router.push('/admin/login')}>
              Đăng nhập Admin
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Đăng nhập chung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || normalizedRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full mx-4 text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang Môn học.</p>
          <p className="text-sm text-gray-500">
            Vai trò hiện tại: <span className="font-semibold">{normalizedRole || 'Chưa đăng nhập'}</span>
          </p>
          <div className="space-y-2 pt-2">
            <Button className="w-full" onClick={() => router.push('/admin/login')}>
              Đăng nhập Admin
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Đăng nhập chung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithBackground>
      <div className="min-h-screen">
        <AdminSidebar
          currentPage="subjects"
          onNavigate={(page) => router.push(`/${page}`)}
          onLogout={logout}
        />
        <div
          className={`flex-1 h-screen flex flex-col overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="flex-1 flex flex-col p-6 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl mb-2 text-gray-900">Quản lý Môn học</h1>
                <p className="text-gray-600">Quản lý danh sách môn học trong hệ thống</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tổng môn học</p>
                        <p className="text-3xl font-bold">{subjects.length}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Môn học có mô tả</p>
                        <p className="text-3xl font-bold">
                          {subjects.filter(s => s.description && s.description.trim()).length}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Môn học mới nhất</p>
                        <p className="text-3xl font-bold">
                          {subjects.length > 0 && subjects[0].created_at
                            ? new Date(subjects[0].created_at).toLocaleDateString('vi-VN')
                            : '--'
                          }
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subjects List */}
              <Card className="card-transparent flex-1 flex flex-col min-h-0">
                <CardHeader className="card-transparent-header flex-shrink-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Danh sách Môn học</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Quản lý tất cả môn học trong hệ thống
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Tìm kiếm môn học..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm môn học
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
                            </DialogTitle>
                            <DialogDescription>
                              {editingSubject 
                                ? 'Cập nhật thông tin môn học' 
                                : 'Thêm môn học mới vào hệ thống'
                              }
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Tên môn học *</Label>
                              <Input 
                                id="name" 
                                placeholder="Toán học" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className={errors.name ? 'border-red-500' : ''}
                              />
                              {errors.name && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors.name}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="code">Mã môn học *</Label>
                              <Input 
                                id="code" 
                                placeholder="MATH" 
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                className={errors.code ? 'border-red-500' : ''}
                              />
                              {errors.code && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors.code}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Mô tả</Label>
                              <Input 
                                id="description" 
                                placeholder="Mô tả môn học..." 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className={errors.description ? 'border-red-500' : ''}
                              />
                              <div className="flex justify-between items-center">
                                {errors.description && (
                                  <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 ml-auto">
                                  {(formData.description || '').length}/500 ký tự
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button 
                                className="flex-1" 
                                onClick={editingSubject ? handleUpdate : handleCreate}
                                disabled={isSubmitting}
                              >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Đang xử lý...' : (editingSubject ? 'Cập nhật' : 'Thêm mới')}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isSubmitting}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <div className="space-y-4">
                    {loadingSubjects ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải môn học...</p>
                      </div>
                    ) : filteredSubjects.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">
                          {searchQuery ? 'Không tìm thấy môn học nào' : 'Chưa có môn học nào'}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Thêm môn học đầu tiên để bắt đầu'}
                        </p>
                      </div>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{subject.name}</h3>
                              <p className="text-sm text-gray-600">{subject.code}</p>
                              {subject.description && (
                                <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                Tạo: {subject.created_at ? new Date(subject.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(subject)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(subject.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageWithBackground>
  );
}
