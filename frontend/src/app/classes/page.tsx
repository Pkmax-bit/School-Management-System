"use client";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { School, Plus, Edit, Trash2, Search, AlertCircle, Loader2, Download, Upload, FileSpreadsheet } from 'lucide-react';
import classroomsHybridApi from '../../lib/classrooms-api-hybrid';
import * as XLSX from 'xlsx';

export default function ClassesPage() {
  const { isCollapsed } = useSidebar();
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
    campus_id: '',
    description: '',
    open_date: '',
    close_date: '',
    tuition_per_session: 50000,
    sessions_per_week: 2
  });
  const [autoCode, setAutoCode] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [campuses, setCampuses] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
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

  const loadCampuses = useCallback(async () => {
    try {
      setLoadingCampuses(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/campuses?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch campuses');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setCampuses(list);
    } catch (e) {
      console.error('Load campuses failed', e);
      setCampuses([]);
    } finally {
      setLoadingCampuses(false);
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
      loadCampuses();
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
        campus_id: (formData.campus_id || '').trim() || null,
        description: (formData.description || '').trim() || null,
        tuition_per_session: Number(formData.tuition_per_session) || 50000,
        sessions_per_week: Number(formData.sessions_per_week) || 2,
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
        campus_id: (formData.campus_id || '').trim() || null,
        description: (formData.description || '').trim() || null,
        tuition_per_session: Number(formData.tuition_per_session) || 50000,
        sessions_per_week: Number(formData.sessions_per_week) || 2,
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
      campus_id: cls.campus_id || '',
      description: cls.description || '',
      open_date: cls.open_date ? String(cls.open_date).slice(0, 10) : '',
      close_date: cls.close_date ? String(cls.close_date).slice(0, 10) : '',
      tuition_per_session: typeof cls.tuition_per_session === 'number' ? cls.tuition_per_session : 50000,
      sessions_per_week: typeof cls.sessions_per_week === 'number' ? cls.sessions_per_week : 2
    });
    setSessionsPerWeek(typeof cls.sessions_per_week === 'number' ? cls.sessions_per_week : 2);
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
    setFormData({ name: '', code: 'class', capacity: 30, teacher_id: '', subject_id: '', campus_id: '', description: '', open_date: '', close_date: '', tuition_per_session: 50000, sessions_per_week: 2 });
    setSessionsPerWeek(2);
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
    <PageWithBackground>
      <div className="min-h-screen">
        <AdminSidebar 
        currentPage="classes" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className={`flex-1 h-screen flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-gray-900">Quản lý Lớp học</h1>
            <p className="text-gray-600">Quản lý danh sách lớp học trong hệ thống</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-transparent">
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
            <Card className="card-transparent">
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
            <Card className="card-transparent">
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
          <Card className="card-transparent flex-1 flex flex-col min-h-0">
            <CardHeader className="card-transparent-header flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách Lớp học</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Quản lý tất cả lớp học trong hệ thống</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Download file mẫu Excel để import học sinh
                      const ws = XLSX.utils.aoa_to_sheet([
                        ['Mã học sinh', 'Tên học sinh', 'Email', 'Ngày sinh (YYYY-MM-DD)', 'Số điện thoại', 'Địa chỉ'],
                        ['HS001', 'Nguyễn Văn A', 'nguyenvana@example.com', '2010-01-15', '0123456789', '123 Đường ABC'],
                        ['HS002', 'Trần Thị B', 'tranthib@example.com', '2010-03-20', '0987654321', '456 Đường XYZ'],
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
                      // Export danh sách lớp học ra Excel
                      const wsData = [
                        ['Mã lớp', 'Tên lớp', 'Sĩ số', 'Giáo viên', 'Môn học', 'Cơ sở', 'Học phí/buổi (VND)', 'Số buổi/tuần', 'Mô tả', 'Ngày mở', 'Ngày đóng'],
                        ...classes.map((cls: any) => [
                          cls.code || '',
                          cls.name || '',
                          cls.capacity || 30,
                          cls.teacher_id ? teachers.find(t => t.id === cls.teacher_id)?.name || '' : '',
                          cls.subject_id ? subjects.find(s => s.id === cls.subject_id)?.name || '' : '',
                          cls.campus_id ? campuses.find(c => c.id === cls.campus_id)?.name || '' : '',
                          cls.tuition_per_session || 50000,
                          cls.sessions_per_week || 2,
                          cls.description || '',
                          cls.open_date ? String(cls.open_date).slice(0, 10) : '',
                          cls.close_date ? String(cls.close_date).slice(0, 10) : '',
                        ])
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lớp học');
                      XLSX.writeFile(wb, `Danh_Sach_Lop_Hoc_${new Date().toISOString().split('T')[0]}.xlsx`);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Xuất Excel
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm lớp học..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
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
                          })).filter((s: any) => s.student_code || s.name);
                          
                          if (students.length === 0) {
                            alert('Không có dữ liệu học sinh hợp lệ trong file Excel');
                            return;
                          }
                          
                          // Show dialog to select classroom
                          const classList = classes.map((c: any) => `${c.code} - ${c.name}`).join('\n');
                          const selectedClassCode = prompt(`Nhập mã lớp để gán học sinh vào:\n\nDanh sách lớp:\n${classList}`);
                          if (!selectedClassCode) {
                            e.target.value = '';
                            return;
                          }
                          
                          const selectedClass = classes.find((c: any) => c.code === selectedClassCode.trim());
                          if (!selectedClass) {
                            alert('Không tìm thấy lớp học với mã: ' + selectedClassCode);
                            e.target.value = '';
                            return;
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
                                  classroom_id: selectedClass.id,
                                  date_of_birth: student.date_of_birth || null,
                                  phone: student.phone || null,
                                  address: student.address || null,
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
                          await loadClasses();
                          const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
                            headers: {
                              'Content-Type': 'application/json',
                              ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
                            },
                          });
                          if (studentsRes.ok) {
                            const studentsData = await studentsRes.json();
                            const list = Array.isArray(studentsData) ? studentsData : (Array.isArray((studentsData as any)?.data) ? (studentsData as any).data : []);
                            const mapped = list.map((s: any) => ({ id: s.id, name: s.name || s.users?.full_name, email: s.email || s.users?.email, date_of_birth: s.date_of_birth || null }));
                            setStudents(mapped);
                          }
                          
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
                              <Label htmlFor="campus_id">Cơ sở</Label>
                              <select
                                id="campus_id"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={formData.campus_id}
                                onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                disabled={loadingCampuses}
                              >
                                <option value="">-- Không gán cơ sở --</option>
                                {campuses.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                ))}
                              </select>
                              {loadingCampuses && (
                                <div className="text-xs text-gray-500">Đang tải danh sách cơ sở...</div>
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
                            </div>
                          )}
                        </div>
                        
                        {/* Học phí */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Học phí</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tuition_per_session">
                                Học phí mỗi buổi (VND) *
                              </Label>
                              <Input
                                id="tuition_per_session"
                                type="number"
                                min="0"
                                step="10000"
                                value={formData.tuition_per_session || 50000}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, tuition_per_session: value });
                                }}
                                placeholder="50,000"
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Ví dụ: 50,000 VND, 100,000 VND
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sessions_per_week">
                                Số buổi mỗi tuần *
                              </Label>
                              <Input
                                id="sessions_per_week"
                                type="number"
                                min="1"
                                max="7"
                                value={formData.sessions_per_week || 2}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value, 10) || 2;
                                  const validValue = Math.max(1, Math.min(7, value));
                                  setFormData({ ...formData, sessions_per_week: validValue });
                                  setSessionsPerWeek(validValue);
                                }}
                                placeholder="2"
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Doanh thu tháng = Học phí/buổi × Số buổi/tuần × 4 tuần
                              </p>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-700">
                              Doanh thu tháng dự kiến: <span className="font-semibold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                  (formData.tuition_per_session || 50000) * (formData.sessions_per_week || 2) * 4
                                )}
                              </span> / học sinh
                            </p>
                          </div>
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
            <CardContent className="flex-1 overflow-auto">
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
    </PageWithBackground>
  );
}
