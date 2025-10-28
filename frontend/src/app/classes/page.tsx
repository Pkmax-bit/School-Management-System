"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { School, Plus, Edit, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';
import classroomsHybridApi from '../../lib/classrooms-api-hybrid';

export default function ClassesPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  // State management
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    capacity: 30,
    teacher_id: '',
    subject_id: '',
    description: '',
    open_date: '',
    close_date: ''
  });
  const [autoCode, setAutoCode] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [students, setStudents] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch teachers');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      const mapped = list.map((t: any) => ({ id: t.id, name: t.users?.full_name || t.name, email: t.users?.email }));
      setTeachers(mapped);
    } catch (e) {
      console.error('Load teachers failed', e);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/subjects?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setSubjects(list);
    } catch (e) {
      console.error('Load subjects failed', e);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await classroomsHybridApi.list();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setClasses(list);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const getNextCodeFromList = (list: Array<{ code?: string }>) => {
    let maxNum = 0;
    for (const c of list) {
      const code = (c.code || '').trim();
      if (code.startsWith('Class')) {
        const suffix = code.slice(5);
        if (/^\d{4}$/.test(suffix)) {
          const n = parseInt(suffix, 10);
          if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
        }
      }
    }
    const next = maxNum + 1;
    return `Class${String(next).padStart(4, '0')}`;
  };

  // Load data once
  useEffect(() => {
    if (user && user.role === 'admin' && !hasLoaded) {
      loadClasses();
      loadTeachers();
      loadSubjects();
      (async () => {
        try {
          setLoadingStudents(true);
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          const res = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
            headers: {
              'Content-Type': 'application/json',
              ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
            },
          });
          if (!res.ok) throw new Error('Failed to fetch students');
          const data = await res.json();
          const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
          const mapped = list.map((s: any) => ({ id: s.id, name: s.name || s.users?.full_name, email: s.email || s.users?.email, date_of_birth: s.date_of_birth || null }));
          setStudents(mapped);
        } catch (e) {
          console.error('Load students failed', e);
          setStudents([]);
        } finally {
          setLoadingStudents(false);
        }
      })();
      setHasLoaded(true);
    }
  }, [user, hasLoaded, loadClasses, loadTeachers]);

  const formatDob = (dob?: string | null) => {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const filteredStudents = students.filter((s: any) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    return (s.name && s.name.toLowerCase().includes(q)) || (s.email && s.email.toLowerCase().includes(q));
  });

  const scheduleHint = useCallback(() => {
    const startStr = formData.open_date;
    const endStr = formData.close_date;
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '';
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
    const weeks = Math.ceil(days / 7);
    const sessions = weeks * (sessionsPerWeek || 0);
    return `Khoảng thời gian: ${days} ngày • Ước tính số buổi: ${sessions} (≈ ${weeks} tuần, ${sessionsPerWeek} buổi/tuần)`;
  }, [formData.open_date, formData.close_date, sessionsPerWeek]);

  // Auto-sync capacity with selected students count (when > 0)
  useEffect(() => {
    const count = selectedStudentIds.length;
    if (count > 0) {
      setFormData((prev: any) => ({ ...prev, capacity: count }));
    }
  }, [selectedStudentIds]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên lớp học là bắt buộc';
    if (!formData.code.trim()) newErrors.code = 'Mã lớp là bắt buộc';
    if (formData.code && formData.code.length > 50) newErrors.code = 'Mã lớp không được quá 50 ký tự';
    // Kiểm tra format mã lớp Class0001, Class0002, ...
    if (formData.code && !/^Class\d{4}$/.test(formData.code)) {
      newErrors.code = 'Mã lớp phải có định dạng Class0001, Class0002, ...';
    }
    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1)) newErrors.capacity = 'Sĩ số phải >= 1';
    if (formData.description && formData.description.length > 500) newErrors.description = 'Mô tả không được quá 500 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateClassCode = (name: string): string => {
    const base = (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toUpperCase()
      .slice(0, 10);
    const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    return base ? `${base}` : `CLS${suffix}`;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setErrors({});
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        capacity: Number(formData.capacity) || 30,
        teacher_id: (formData.teacher_id || '').trim() || null,
        subject_id: (formData.subject_id || '').trim() || null,
        description: (formData.description || '').trim() || null,
        student_ids: selectedStudentIds,
        open_date: formData.open_date || null,
        close_date: formData.close_date || null,
      };
      
      // Check if backend is available before attempting to create
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (!healthCheck.ok) {
          throw new Error('Backend server không phản hồi');
        }
      } catch (healthError) {
        throw new Error('Không thể kết nối đến backend server. Vui lòng kiểm tra:\n1. Backend server đang chạy\n2. URL API đúng: ' + API_BASE_URL + '\n3. CORS được cấu hình đúng');
      }
      
      await classroomsHybridApi.create(payload);
      await loadClasses();
      setIsDialogOpen(false);
      resetForm();
      alert(`Tạo lớp học "${payload.name}" thành công!`);
    } catch (error: any) {
      console.error('Error creating class:', error);
      alert(error?.message || 'Có lỗi khi tạo lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingClass || !validateForm()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        capacity: Number(formData.capacity) || 30,
        teacher_id: (formData.teacher_id || '').trim() || null,
        subject_id: (formData.subject_id || '').trim() || null,
        description: (formData.description || '').trim() || null,
        student_ids: selectedStudentIds,
        open_date: formData.open_date || null,
        close_date: formData.close_date || null,
      };
      
      // Check if backend is available before attempting to update
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (!healthCheck.ok) {
          throw new Error('Backend server không phản hồi');
        }
      } catch (healthError) {
        throw new Error('Không thể kết nối đến backend server. Vui lòng kiểm tra:\n1. Backend server đang chạy\n2. URL API đúng: ' + API_BASE_URL + '\n3. CORS được cấu hình đúng');
      }
      
      await classroomsHybridApi.update(editingClass.id, payload);
      await loadClasses();
      setIsDialogOpen(false);
      setEditingClass(null);
      resetForm();
      alert('Cập nhật lớp học thành công!');
    } catch (error: any) {
      console.error('Error updating class:', error);
      alert(error?.message || 'Có lỗi khi cập nhật lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
    try {
      await classroomsHybridApi.remove(id);
      await loadClasses();
      alert('Xóa lớp học thành công!');
    } catch (error: any) {
      console.error('Error deleting class:', error);
      alert(error?.message || 'Có lỗi khi xóa lớp học');
    }
  };

  const handleEdit = (cls: any) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name || '',
      code: cls.code || '',
      capacity: typeof cls.capacity === 'number' ? cls.capacity : 30,
      teacher_id: cls.teacher_id || '',
      subject_id: cls.subject_id || '',
      description: cls.description || '',
      open_date: cls.open_date ? String(cls.open_date).slice(0, 10) : '',
      close_date: cls.close_date ? String(cls.close_date).slice(0, 10) : ''
    });
    setErrors({});
    setIsDialogOpen(true);
      setSelectedStudentIds([]);
  };

  const handleAdd = async () => {
    setEditingClass(null);
    resetForm();
    setAutoCode(true);
    
    // Prefill next code on client to avoid network dependency
    const nextCode = getNextCodeFromList(classes) || 'Class0001';
    setFormData((prev: any) => ({ ...prev, code: nextCode }));

    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: 'class', capacity: 30, teacher_id: '', subject_id: '', description: '', open_date: '', close_date: '' });
    setErrors({});
  };

  const filteredClasses = classes.filter((cls) =>
    (cls.name && cls.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (cls.code && cls.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        currentPage="classes" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 lg:ml-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-gray-900">Quản lý Lớp học</h1>
            <p className="text-gray-600">Quản lý danh sách lớp học trong hệ thống</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng lớp học</p>
                    <p className="text-3xl font-bold">{classes.length}</p>
                  </div>
                  <School className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có mô tả</p>
                    <p className="text-3xl font-bold">{classes.filter(c => c.description && c.description.trim()).length}</p>
                  </div>
                  <School className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sĩ số trung bình</p>
                    <p className="text-3xl font-bold">{classes.length ? Math.round(classes.reduce((s, c) => s + (c.capacity || 30), 0) / classes.length) : 0}</p>
                  </div>
                  <School className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách Lớp học</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Quản lý tất cả lớp học trong hệ thống</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm lớp học..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm lớp học
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingClass ? 'Cập nhật thông tin lớp học' : 'Thêm lớp học mới vào hệ thống'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Basic Information - 2 columns */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Tên lớp *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                                onChange={(e) => {
                                  setFormData({ ...formData, name: e.target.value });
                                }}
                            className={errors.name ? 'border-red-500' : ''}
                                placeholder="Nhập tên lớp học"
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Mã lớp *</Label>
                              <div className="flex gap-2">
                          <Input
                            id="code"
                            value={formData.code}
                                  onChange={(e) => { setFormData({ ...formData, code: e.target.value.toUpperCase() }); setAutoCode(false); }}
                            className={errors.code ? 'border-red-500' : ''}
                                  placeholder="Class0001, Class0002..."
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFormData({ ...formData, code: 'class' })}
                                  className="whitespace-nowrap"
                                >
                                  Tự động
                                </Button>
                              </div>
                          {errors.code && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.code}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Sĩ số</Label>
                          <Input
                            id="capacity"
                            type="number"
                            min={1}
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
                            className={errors.capacity ? 'border-red-500' : ''}
                                placeholder="30"
                          />
                          {errors.capacity && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.capacity}
                            </p>
                          )}
                        </div>
                          </div>
                        </div>
                        {/* Teacher and Subject - 2 columns */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Giảng dạy</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teacher_id">Giáo viên</Label>
                          <select
                            id="teacher_id"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.teacher_id}
                            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                            disabled={loadingTeachers}
                          >
                            <option value="">-- Không gán giáo viên --</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{t.name || t.email || t.id}</option>
                            ))}
                          </select>
                          {loadingTeachers && (
                            <div className="text-xs text-gray-500">Đang tải danh sách giáo viên...</div>
                          )}
                        </div>
                        <div className="space-y-2">
                              <Label htmlFor="subject_id">Môn học</Label>
                              <select
                                id="subject_id"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                disabled={loadingSubjects}
                              >
                                <option value="">-- Không gán môn học --</option>
                                {subjects.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                              </select>
                              {loadingSubjects && (
                                <div className="text-xs text-gray-500">Đang tải danh sách môn học...</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Schedule Information - 2 columns */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Thời gian học</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="open_date">Ngày bắt đầu</Label>
                              <Input id="open_date" type="date" value={formData.open_date} onChange={(e) => setFormData({ ...formData, open_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="close_date">Ngày kết thúc</Label>
                              <Input id="close_date" type="date" value={formData.close_date} onChange={(e) => setFormData({ ...formData, close_date: e.target.value })} />
                            </div>
                          </div>
                          
                          {/* Schedule hint - compact */}
                          {scheduleHint() && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-700 mb-2">{scheduleHint()}</p>
                              <div className="flex gap-4">
                                <label className="flex items-center text-sm">
                                  <input
                                    type="radio"
                                    name="sessionsPerWeek"
                                    value="2"
                                    checked={sessionsPerWeek === 2}
                                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                                    className="mr-2"
                                  />
                                  2 buổi/tuần
                                </label>
                                <label className="flex items-center text-sm">
                                  <input
                                    type="radio"
                                    name="sessionsPerWeek"
                                    value="3"
                                    checked={sessionsPerWeek === 3}
                                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                                    className="mr-2"
                                  />
                                  3 buổi/tuần
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Student Selection - compact */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Danh sách học sinh</h3>
                          <div className="space-y-3">
                          <Input
                              placeholder="Tìm kiếm học sinh..." 
                              value={studentSearch} 
                              onChange={(e) => setStudentSearch(e.target.value)} 
                            />
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                              {filteredStudents.map((s: any) => {
                                const label = `${s.name || s.email || s.id}${s.date_of_birth ? '-' + formatDob(s.date_of_birth) : ''}`;
                                const checked = selectedStudentIds.includes(s.id);
                                return (
                                  <label key={s.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                    <input
                                      type="checkbox"
                                      className="rounded"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedStudentIds((prev) => Array.from(new Set([...prev, s.id])));
                                        else setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                                      }}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{s.name || s.email || s.id}</div>
                                      <div className="text-xs text-gray-500">
                                        {s.date_of_birth ? formatDob(s.date_of_birth) : 'N/A'}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                              {loadingStudents && (
                                <div className="text-center py-4 text-gray-500 text-sm">Đang tải danh sách học sinh...</div>
                              )}
                              {!loadingStudents && filteredStudents.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">Không tìm thấy học sinh nào</div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                              Đã chọn: <span className="font-medium">{selectedStudentIds.length}</span> học sinh
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1" onClick={editingClass ? handleUpdate : handleCreate} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Đang xử lý...' : (editingClass ? 'Cập nhật' : 'Thêm mới')}
                          </Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingClasses ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải lớp học...</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <School className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? 'Không tìm thấy lớp học nào' : 'Chưa có lớp học nào'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Thêm lớp học đầu tiên để bắt đầu'}
                  </p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cls.name}</h3>
                        <p className="text-sm text-gray-600">{cls.code}</p>
                        <p className="text-sm text-gray-500 mt-1">Sĩ số: {cls.capacity ?? 30}</p>
                        <p className="text-xs text-gray-400">Giáo viên: {(() => {
                          if (!cls.teacher_id) return 'N/A';
                          const t = teachers.find((t) => t.id === cls.teacher_id);
                          return t ? (t.name || t.email || cls.teacher_id) : cls.teacher_id;
                        })()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => { window.location.href = `/classrooms/${cls.id}`; }}>Xem</Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(cls)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(cls.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
