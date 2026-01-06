"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import templateClassroomsApi from '@/lib/template-classrooms-api';
import classroomsHybridApi from '@/lib/classrooms-api-hybrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, ArrowLeft, Save } from 'lucide-react';
import { PageWithBackground } from '@/components/PageWithBackground';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { DatePicker } from '@/components/ui/date-picker';

export default function CreateClassroomFromTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useApiAuth();
  const { isCollapsed } = useSidebar();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [template, setTemplate] = useState<any>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(''); // Sẽ được điền tự động
  const [loadingCode, setLoadingCode] = useState(false);
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formCampusId, setFormCampusId] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formDescription, setFormDescription] = useState('');
  const [formOpenDate, setFormOpenDate] = useState('');
  const [formCloseDate, setFormCloseDate] = useState('');
  const [formTuitionPerSession, setFormTuitionPerSession] = useState<number>(50000);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(2);
  const [copyLessons, setCopyLessons] = useState(true);
  const [copyAssignments, setCopyAssignments] = useState(true);

  // Options
  const [teachers, setTeachers] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [campuses, setCampuses] = useState<Array<{ id: string; name?: string; code?: string }>>([]);

  // Hàm lấy mã lớp học tự động
  const fetchNextCode = async () => {
    if (loadingCode) return; // Tránh gọi nhiều lần
    
    setLoadingCode(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    };

    try {
      const codeRes = await fetch(`${API_BASE_URL}/api/classrooms/next-code`, { headers });
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        if (codeData.next_code) {
          setFormCode(codeData.next_code);
          setLoadingCode(false);
          return;
        }
      }
      // Fallback nếu API không trả về mã
      console.warn('API không trả về mã, sử dụng fallback');
      const timestamp = Date.now().toString().slice(-4);
      setFormCode(`Class${timestamp}`);
    } catch (error) {
      console.warn('Lỗi khi lấy mã lớp học:', error);
      // Fallback: tạo mã từ timestamp
      const timestamp = Date.now().toString().slice(-4);
      setFormCode(`Class${timestamp}`);
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && templateId) {
      loadTemplate();
      loadOptions();
      // Tự động lấy mã lớp học mới
      fetchNextCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const templateData = await templateClassroomsApi.get(templateId);
      setTemplate(templateData);
      
      // Pre-fill form with template data
      setFormName(templateData.name || '');
      setFormDescription(templateData.description || '');
      setFormSubjectId(templateData.subject_id || '');
      setFormCapacity(templateData.capacity || 30);
    } catch (error: any) {
      console.error('Error loading template:', error);
      setErrorMsg(error.message || 'Không thể tải template');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    };

    try {
      // Load teachers
      try {
        const teachersRes = await fetch(`${API_BASE_URL}/api/teachers/`, { headers });
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData || []);
        }
      } catch (err) {
        console.warn('Error loading teachers:', err);
      }

      // Load subjects
      try {
        const subjectsRes = await fetch(`${API_BASE_URL}/api/subjects/`, { headers });
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData || []);
        }
      } catch (err) {
        console.warn('Error loading subjects:', err);
      }

      // Load campuses
      try {
        const campusesRes = await fetch(`${API_BASE_URL}/api/campuses/`, { headers });
        if (campusesRes.ok) {
          const campusesData = await campusesRes.json();
          setCampuses(campusesData || []);
        }
      } catch (err) {
        console.warn('Error loading campuses:', err);
      }

      // Mã lớp học đã được lấy trong fetchNextCode() riêng biệt
    } catch (error) {
      console.error('Error loading options:', error);
      // Đảm bảo có mã mặc định
      if (!formCode) {
        setFormCode('Class0001');
      }
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setErrorMsg('Vui lòng nhập tên lớp học');
      return;
    }

    if (!formCode.trim()) {
      setErrorMsg('Vui lòng nhập mã lớp học');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        template_id: templateId,
        name: formName.trim(),
        code: formCode.trim(),
        teacher_id: formTeacherId || null,
        subject_id: formSubjectId || null,
        campus_id: formCampusId || null,
        capacity: formCapacity || null,
        tuition_per_session: formTuitionPerSession || null,
        sessions_per_week: sessionsPerWeek || null,
        open_date: formOpenDate || null,
        close_date: formCloseDate || null,
        copy_lessons: copyLessons,
        copy_assignments: copyAssignments,
      };

      await templateClassroomsApi.createClassroomFromTemplate(payload);
      
      // Redirect to classrooms page
      router.push('/classrooms');
    } catch (error: any) {
      console.error('Error creating classroom:', error);
      setErrorMsg(error.message || 'Không thể tạo lớp học');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <PageWithBackground>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageWithBackground>
    );
  }

  const userRole = user?.role?.toLowerCase() || '';
  const canAccess = userRole === 'admin' || userRole === 'teacher';
  
  if (!user || !canAccess) {
    return (
      <PageWithBackground>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Bạn không có quyền truy cập trang này</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWithBackground>
    );
  }

  return (
    <PageWithBackground>
      <div className="flex h-screen overflow-hidden">
        {userRole === 'admin' ? (
          <AdminSidebar
            currentPage="template-classrooms"
            onNavigate={(page) => router.push(`/admin/${page}`)}
            onLogout={() => router.push('/login')}
            userName={user?.name}
            userEmail={user?.email}
            userRole={user?.role}
          />
        ) : (
          <TeacherSidebar
            currentPage="template-classrooms"
            onNavigate={(page) => router.push(`/teacher/${page}`)}
            onLogout={() => router.push('/login')}
            user={user}
          />
        )}
        <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Tạo lớp học từ Template</h1>
                  <p className="text-gray-600 mt-1">
                    Template: {template?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin lớp học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên lớp học *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ví dụ: Toán lớp 10A1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="code">Mã lớp học *</Label>
                    <div className="relative">
                      <Input
                        id="code"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder={loadingCode ? "Đang tạo mã..." : "Mã sẽ tự động tạo"}
                        disabled={loadingCode}
                        className="pr-20"
                      />
                      {loadingCode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {!loadingCode && formCode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={fetchNextCode}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                          title="Tạo mã mới"
                        >
                          🔄 Mới
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mã lớp học sẽ được tạo tự động. Bạn có thể chỉnh sửa nếu cần.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả về lớp học..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teacher">Giáo viên</Label>
                      <select
                        id="teacher"
                        value={formTeacherId}
                        onChange={(e) => setFormTeacherId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Chọn giáo viên</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Môn học</Label>
                      <select
                        id="subject"
                        value={formSubjectId}
                        onChange={(e) => setFormSubjectId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Chọn môn học</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="campus">Cơ sở</Label>
                      <select
                        id="campus"
                        value={formCampusId}
                        onChange={(e) => setFormCampusId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Chọn cơ sở</option>
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="capacity">Sức chứa</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formCapacity}
                        onChange={(e) => setFormCapacity(parseInt(e.target.value) || 30)}
                        min={1}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tuition">Học phí mỗi buổi (VNĐ)</Label>
                      <Input
                        id="tuition"
                        type="number"
                        value={formTuitionPerSession}
                        onChange={(e) => setFormTuitionPerSession(parseFloat(e.target.value) || 50000)}
                        min={0}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sessions">Số buổi mỗi tuần</Label>
                      <Input
                        id="sessions"
                        type="number"
                        value={sessionsPerWeek}
                        onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 2)}
                        min={1}
                      />
                    </div>

                    <div>
                      <Label htmlFor="openDate">Ngày mở</Label>
                      <DatePicker
                        id="openDate"
                        value={formOpenDate}
                        onChange={setFormOpenDate}
                        placeholder="Chọn ngày mở lớp"
                        max={formCloseDate || undefined}
                      />
                    </div>

                    <div>
                      <Label htmlFor="closeDate">Ngày đóng</Label>
                      <DatePicker
                        id="closeDate"
                        value={formCloseDate}
                        onChange={setFormCloseDate}
                        placeholder="Chọn ngày đóng lớp"
                        min={formOpenDate || undefined}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-semibold">Tùy chọn sao chép</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="copyLessons"
                        checked={copyLessons}
                        onCheckedChange={(checked) => setCopyLessons(checked as boolean)}
                      />
                      <Label htmlFor="copyLessons" className="cursor-pointer">
                        Sao chép bài học từ template
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="copyAssignments"
                        checked={copyAssignments}
                        onCheckedChange={(checked) => setCopyAssignments(checked as boolean)}
                      />
                      <Label htmlFor="copyAssignments" className="cursor-pointer">
                        Sao chép bài tập từ template
                      </Label>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => router.back()}>
                      Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Tạo lớp học
                        </>
                      )}
                    </Button>
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

