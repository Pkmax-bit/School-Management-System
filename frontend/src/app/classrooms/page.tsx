"use client";

import { useEffect, useMemo, useState } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import classroomsHybridApi from '../../lib/classrooms-api-hybrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { PageWithBackground } from '@/components/PageWithBackground';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';

export default function ClassroomsPage() {
  const { user, loading: authLoading, logout } = useApiAuth();
  const teacherAuth = useTeacherAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formCampusId, setFormCampusId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formOpenDate, setFormOpenDate] = useState<string>('');
  const [formCloseDate, setFormCloseDate] = useState<string>('');
  const [formTuitionPerSession, setFormTuitionPerSession] = useState<number>(50000);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [autoCode, setAutoCode] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [campuses, setCampuses] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingCampuses, setLoadingCampuses] = useState<boolean>(false);
  const [students, setStudents] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Determine user role - check both useApiAuth and useTeacherAuth
  const normalizedRole = (() => {
    if (user?.role) {
      return (user.role || '').toLowerCase().trim();
    }
    if (teacherAuth.user?.role) {
      return (teacherAuth.user.role || '').toLowerCase().trim();
    }
    return '';
  })();

  const handleOpenCreate = async () => {
    setEditing(null);
    setFormName('');
    setFormCode('Class0001'); // Default fallback
    setFormCapacity(30);
    setFormTeacherId('');
    setFormSubjectId('');
    setFormCampusId('');
    setFormDescription('');
    setFormOpenDate('');
    setFormCloseDate('');
    setFormTuitionPerSession(50000);
    setSessionsPerWeek(2);
    setAutoCode(true);
    setErrorMsg('');
    setSelectedStudentIds([]);
    
    // Lấy mã lớp tiếp theo trước khi mở dialog
    try {
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/classrooms/next-code`, {
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormCode(data.next_code || 'Class0001');
      } else {
        setFormCode(getNextCodeFromList(items));
      }
    } catch (error) {
      console.error('Error getting next class code:', error);
      setFormCode(getNextCodeFromList(items));
    }
    
    setIsDialogOpen(true);
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


  const loadData = async () => {
    try {
      setLoading(true);
      const res = await classroomsHybridApi.list();
      const data = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      setItems(data);
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load teachers (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      const mapped = list.map((t: any) => ({ id: t.id, name: t.users?.full_name || t.name, email: t.users?.email }));
      setTeachers(mapped);
    } catch (e) {
      console.error('Failed to load teachers list', e);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      // Determine current role
      const currentRole = (() => {
        if (user?.role) return (user.role || '').toLowerCase().trim();
        if (teacherAuth.user?.role) return (teacherAuth.user.role || '').toLowerCase().trim();
        return '';
      })();
      
      // Only load subjects if user is admin
      if (currentRole !== 'admin') {
        setSubjects([]);
        setLoadingSubjects(false);
        return;
      }
      
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/subjects?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) {
        // Don't throw error for 403, just log and set empty array
        if (res.status === 403) {
          console.warn('No permission to load subjects');
          setSubjects([]);
          return;
        }
        throw new Error(`Failed to load subjects (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setSubjects(list);
    } catch (e) {
      console.error('Failed to load subjects list', e);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadCampuses = async () => {
    try {
      setLoadingCampuses(true);
      // Determine current role
      const currentRole = (() => {
        if (user?.role) return (user.role || '').toLowerCase().trim();
        if (teacherAuth.user?.role) return (teacherAuth.user.role || '').toLowerCase().trim();
        return '';
      })();
      
      // Only load campuses if user is admin
      if (currentRole !== 'admin') {
        setCampuses([]);
        setLoadingCampuses(false);
        return;
      }
      
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/campuses?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) {
        // Don't throw error for 403, just log and set empty array
        if (res.status === 403) {
          console.warn('No permission to load campuses');
          setCampuses([]);
          return;
        }
        throw new Error(`Failed to load campuses (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setCampuses(list);
    } catch (e) {
      console.error('Failed to load campuses list', e);
      setCampuses([]);
    } finally {
      setLoadingCampuses(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load students (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      const mapped = list.map((s: any) => ({
        id: s.id,
        name: s.name || s.users?.full_name,
        email: s.email || s.users?.email,
        date_of_birth: s.date_of_birth || null,
      }));
      setStudents(mapped);
    } catch (e) {
      console.error('Failed to load students list', e);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const formatDob = (dob?: string | null) => {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const scheduleHint = useMemo(() => {
    if (!formOpenDate || !formCloseDate) return '';
    const start = new Date(formOpenDate);
    const end = new Date(formCloseDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '';
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
    const weeks = Math.ceil(days / 7);
    const sessions = weeks * (sessionsPerWeek || 0);
    return `Khoảng thời gian: ${days} ngày • Ước tính số buổi: ${sessions} (≈ ${weeks} tuần, ${sessionsPerWeek} buổi/tuần)`;
  }, [formOpenDate, formCloseDate, sessionsPerWeek]);

  // Auto-sync capacity with selected students count (when > 0)
  useEffect(() => {
    const count = selectedStudentIds.length;
    if (count > 0) {
      setFormCapacity(count);
    }
  }, [selectedStudentIds]);

  useEffect(() => {
    if (user) {
      loadData();
      loadTeachers();
      loadSubjects();
      loadCampuses();
      loadStudents();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || !['admin', 'teacher'].includes(normalizedRole)) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
        <p className="text-gray-600">
          Chỉ quản trị viên và giáo viên mới có thể truy cập trang này.
        </p>
      </div>
    );
  }

  // Determine which sidebar to use based on user role
  const isTeacher = normalizedRole === 'teacher';
  const displayUser = isTeacher ? teacherAuth.user : user;

  return (
    <PageWithBackground>
      <div className="min-h-screen">
        {isTeacher ? (
          <TeacherSidebar
            currentPage="classrooms"
            onNavigate={(page) => router.push(`/${page}`)}
            onLogout={teacherAuth.logout || logout}
            user={{ name: displayUser?.name, email: displayUser?.email }}
          />
        ) : (
          <AdminSidebar
            currentPage="classes"
            onNavigate={(page) => router.push(`/${page}`)}
            onLogout={logout}
          />
        )}
        <div className={`flex-1 h-screen flex flex-col p-4 lg:p-6 overflow-hidden transition-all duration-300 ml-0 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg w-full sm:w-auto">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Quản lý Lớp học</h1>
                <p className="text-indigo-100 text-sm lg:text-lg">Quản lý thông tin lớp học trong hệ thống</p>
              </div>
              {normalizedRole === 'admin' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    onClick={handleOpenCreate} 
                    data-testid="open-create-classroom" 
                    aria-haspopup="dialog" 
                    aria-expanded={isDialogOpen}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Thêm lớp học
                  </Button>
                </div>
              )}
            </div>

            <Card className="card-transparent">
              <CardHeader className="card-transparent-header">
                <CardTitle className="flex items-center justify-between text-2xl font-bold text-gray-900">
                  <span>Danh sách lớp học</span>
                  <div className="relative w-72">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Tìm theo tên, mã, mô tả" 
                      className="pl-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                    />
                  </div>
                </CardTitle>
              </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Sĩ số</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    {normalizedRole === 'admin' && <TableHead className="w-[200px]">Hành động</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-indigo-50/50 transition-colors">
                      <TableCell className="font-bold text-gray-900">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-semibold">
                          {c.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">{c.capacity ?? 30}</TableCell>
                      <TableCell className="text-gray-700">
                        {(() => {
                          if (!c.teacher_id) return <span className="text-gray-400">Chưa gán</span>;
                          const t = teachers.find((t) => t.id === c.teacher_id);
                          return t ? (t.name || t.email || c.teacher_id) : c.teacher_id;
                        })()}
                      </TableCell>
                      <TableCell className="text-gray-700">{c.description || <span className="text-gray-400">—</span>}</TableCell>
                      {normalizedRole === 'admin' && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => { window.location.href = `/classrooms/${c.id}`; }}
                              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                            >
                              Xem
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditing(c);
                                setFormName(c.name || '');
                                setFormCode(c.code || '');
                                setFormCapacity(typeof c.capacity === 'number' ? c.capacity : 30);
                                setFormTeacherId(c.teacher_id || '');
                                setFormSubjectId(c.subject_id || '');
                                setFormCampusId(c.campus_id || '');
                                setFormDescription(c.description || '');
                                setFormOpenDate(c.open_date ? c.open_date.slice(0, 10) : '');
                                setFormCloseDate(c.close_date ? c.close_date.slice(0, 10) : '');
                                setFormTuitionPerSession(typeof c.tuition_per_session === 'number' ? c.tuition_per_session : 50000);
                                setSessionsPerWeek(typeof c.sessions_per_week === 'number' ? c.sessions_per_week : 2);
                                setErrorMsg('');
                                setIsDialogOpen(true);
                              }}
                              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={async () => {
                                if (confirm('Xóa lớp học này?')) {
                                  await classroomsHybridApi.remove(c.id);
                                  loadData();
                                }
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-2 text-gray-600 py-6">
                          <AlertCircle className="w-4 h-4" /> Không có dữ liệu
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setSaving(false); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật lớp học' : 'Thêm lớp học'}</DialogTitle>
            <DialogDescription>Nhập thông tin lớp học</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errorMsg && (
              <div className="text-sm text-red-600">{errorMsg}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Mã lớp</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => {
                  setFormCode(e.target.value.toUpperCase());
                  setAutoCode(false);
                }}
                placeholder="Tự động tạo mã Class0001, Class0002... (gõ 'class' để tự động)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Sĩ số</Label>
              <Input id="capacity" type="number" min={1} value={formCapacity} onChange={(e) => setFormCapacity(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Giáo viên</Label>
              <select
                id="teacher_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formTeacherId}
                onChange={(e) => setFormTeacherId(e.target.value)}
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
                value={formCampusId}
                onChange={(e) => setFormCampusId(e.target.value)}
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
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            
            {/* Thời gian học */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Thời gian học</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open_date">Ngày mở lớp</Label>
                  <Input id="open_date" type="date" value={formOpenDate} onChange={(e) => setFormOpenDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_date">Ngày đóng lớp</Label>
                  <Input id="close_date" type="date" value={formCloseDate} onChange={(e) => setFormCloseDate(e.target.value)} />
                </div>
              </div>
            </div>
            
            {/* Học phí */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Học phí</h3>
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
                    value={formTuitionPerSession}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormTuitionPerSession(value);
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
                    value={sessionsPerWeek}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 2;
                      setSessionsPerWeek(Math.max(1, Math.min(7, value)));
                    }}
                    placeholder="2"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Doanh thu tháng = Học phí/buổi × Số buổi/tuần × 4 tuần
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-600">
              <div>
                {scheduleHint}
              </div>
              <div className="text-sm text-gray-500">
                Doanh thu tháng = {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formTuitionPerSession)} × {sessionsPerWeek} buổi/tuần × 4 tuần × số học sinh
              </div>
            </div>
            {/* Danh sách học sinh */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Danh sách học sinh</h3>
            <div className="space-y-2">
              <Label htmlFor="student_search">Tìm kiếm học sinh</Label>
              <Input id="student_search" placeholder="Tìm theo tên/email" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
              <div className="w-full border border-gray-300 rounded-md h-48 overflow-y-auto p-2">
                {loadingStudents ? (
                  <div className="text-xs text-gray-500 px-1 py-2">Đang tải danh sách học sinh...</div>
                ) : (
                  filteredStudents.map((s: any) => {
                    const label = `${s.name || s.email || s.id}${s.date_of_birth ? '-' + formatDob(s.date_of_birth) : ''}`;
                    const checked = selectedStudentIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds((prev) => Array.from(new Set([...prev, s.id])));
                            else setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                          }}
                        />
                        <span className="text-sm text-gray-800">{label}</span>
                      </label>
                    );
                  })
                )}
                {(!loadingStudents && filteredStudents.length === 0) && (
                  <div className="text-xs text-gray-500 px-1 py-2">Không có học sinh phù hợp</div>
                )}
              </div>
              {selectedStudentIds.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Đã chọn: <span className="font-semibold">{selectedStudentIds.length}</span> học sinh
                </p>
              )}
            </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={saving}>Hủy</Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    setErrorMsg('');
                    if (!formName.trim() || !formCode.trim()) {
                      setErrorMsg('Tên lớp và Mã lớp là bắt buộc.');
                      return;
                    }
                    // Kiểm tra format mã lớp Class0001, Class0002, ...
                    if (!/^Class\d{4}$/.test(formCode.trim())) {
                      setErrorMsg('Mã lớp phải có định dạng Class0001, Class0002, ...');
                      return;
                    }
                    setSaving(true);
                    const payload: any = {
                      name: formName.trim(),
                      code: formCode.trim(),
                      capacity: formCapacity && formCapacity > 0 ? formCapacity : 30,
                      teacher_id: formTeacherId.trim() || null,
                      subject_id: formSubjectId.trim() || null,
                      campus_id: formCampusId.trim() || null,
                      description: formDescription.trim() || null,
                      tuition_per_session: formTuitionPerSession && formTuitionPerSession > 0 ? formTuitionPerSession : 50000,
                      sessions_per_week: sessionsPerWeek && sessionsPerWeek > 0 ? sessionsPerWeek : 2,
                      student_ids: selectedStudentIds,
                      open_date: formOpenDate || null,
                      close_date: formCloseDate || null,
                    };
                    if (editing) {
                      await classroomsHybridApi.update(editing.id, payload);
                    } else {
                      await classroomsHybridApi.create(payload);
                    }
                    setIsDialogOpen(false);
                    loadData();
                  } catch (err: any) {
                    const apiMsg = err?.response?.data?.detail || err?.message || 'Thao tác thất bại. Vui lòng thử lại.';
                    setErrorMsg(apiMsg);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >{saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm mới')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
          </div>
        </div>
      </div>
    </PageWithBackground>
  );
}
