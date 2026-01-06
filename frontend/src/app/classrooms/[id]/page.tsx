"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, ArrowLeft, Users, BookOpen, Calendar, Clock, 
  GraduationCap, Mail, Phone, Search, FileText, Eye,
  Download, Play, User, School, AlertCircle
} from 'lucide-react';
import LessonUploadForm from '@/components/lessons/LessonUploadForm';
import LessonList from '@/components/lessons/LessonList';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherInfo, setTeacherInfo] = useState<any | null>(null);
  const [refreshLessons, setRefreshLessons] = useState(0);
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const formatDob = (dob?: string | null) => {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    return format(d, 'dd/MM/yyyy', { locale: vi });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return format(d, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (jwt) headers.Authorization = `Bearer ${jwt}`;

        // Classroom
        const clsRes = await fetch(`${API_BASE_URL}/api/classrooms/${id}`, { headers });
        if (!clsRes.ok) {
            if (clsRes.status === 401) {
                const errorData = await clsRes.json().catch(() => ({ detail: 'Authentication failed' }));
                console.error('Authentication failed:', errorData);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            } else if (clsRes.status === 403) {
                try {
                    const errorData = await clsRes.json();
                    console.warn('Permission denied:', errorData);
                } catch {
                    console.warn('Permission denied: User does not have access to this classroom');
                }
                setClassroom(null);
            } else if (clsRes.status === 404) {
                console.error('Classroom not found');
                setClassroom(null);
            } else {
                throw new Error(`Failed to load classroom: ${clsRes.status} ${clsRes.statusText}`);
            }
        } else {
            const cls = await clsRes.json();
            setClassroom(cls);
            
            if (cls) {
                // Students of classroom
                const stuRes = await fetch(`${API_BASE_URL}/api/students?limit=1000&classroom_id=${id}`, { headers });
                if (stuRes.ok) {
                    const stuData = await stuRes.json();
                    const list = Array.isArray(stuData) ? stuData : (Array.isArray((stuData as any)?.data) ? (stuData as any).data : []);
                    setStudents(list);
                }

                // Teacher
                if (cls?.teacher_id) {
                    const tRes = await fetch(`${API_BASE_URL}/api/teachers/${cls.teacher_id}`, { headers });
                    if (tRes.ok) {
                        const t = await tRes.json();
                        setTeacherName(t?.users?.full_name || t?.name || '');
                        setTeacherInfo(t);
                    }
                }

                // Fetch all classrooms for the teacher (for lesson sharing)
                if (user?.role === 'teacher' || user?.role === 'admin') {
                    const clsListRes = await fetch(`${API_BASE_URL}/api/classrooms`, { headers });
                    if (clsListRes.ok) {
                        const clsList = await clsListRes.json();
                        setClassrooms(Array.isArray(clsList) ? clsList : []);
                    }
                }
            }
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id, user?.role, router]);

  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((s: any) => {
      const name = (s.users?.full_name || s.name || '').toLowerCase();
      const email = (s.users?.email || s.email || '').toLowerCase();
      const code = (s.student_code || '').toLowerCase();
      return name.includes(query) || email.includes(query) || code.includes(query);
    });
  }, [students, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải thông tin lớp học</h3>
                <p className="text-gray-600">
                  Bạn có thể không có quyền truy cập lớp học này hoặc lớp học không tồn tại.
                </p>
              </div>
              <Button onClick={() => router.push('/classrooms')} variant="outline">
                Quay lại danh sách lớp học
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Badge variant="secondary" className="text-sm">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
            </Badge>
          )}
        </div>

        {/* Classroom Header Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                <School className="w-10 h-10 lg:w-12 lg:h-12" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">{classroom.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Mã lớp:</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {classroom.code}
                    </Badge>
                  </div>
                  {classroom.open_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(classroom.open_date)}</span>
                    </div>
                  )}
                </div>
                {classroom.description && (
                  <p className="mt-3 text-indigo-100 text-sm lg:text-base max-w-3xl">
                    {classroom.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sĩ số</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">học sinh</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sức chứa</p>
                  <p className="text-3xl font-bold text-gray-900">{classroom.capacity ?? 30}</p>
                  <p className="text-xs text-gray-500 mt-1">học sinh</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Giáo viên</p>
                  <p className="text-lg font-semibold text-gray-900 truncate max-w-[150px]">
                    {teacherName || 'Chưa gán'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Info Card */}
        {teacherInfo && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông tin giáo viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 border-2 border-indigo-100">
                  <AvatarImage src={teacherInfo.users?.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                    {teacherName?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{teacherName}</h3>
                  {teacherInfo.users?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{teacherInfo.users.email}</span>
                    </div>
                  )}
                  {teacherInfo.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{teacherInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Tài liệu bài học
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <div className="mb-6">
                <LessonUploadForm
                  classroomId={id}
                  classrooms={classrooms}
                  onUploadSuccess={() => setRefreshLessons(prev => prev + 1)}
                />
              </div>
            )}
            <LessonList classroomId={id} refreshTrigger={refreshLessons} classrooms={classrooms} />
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-6 h-6 text-green-600" />
                Danh sách học sinh
                <Badge variant="secondary" className="ml-2">
                  {stats.totalStudents}
                </Badge>
              </CardTitle>
              {students.length > 0 && (
                <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm học sinh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Chưa có học sinh</p>
                <p className="text-sm text-gray-500 mt-2">Học sinh sẽ được hiển thị ở đây khi được thêm vào lớp</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Không tìm thấy học sinh</p>
                <p className="text-sm text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Họ và tên</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Ngày sinh</TableHead>
                      <TableHead className="font-semibold">Mã học sinh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s: any) => (
                      <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">
                          {s.users?.full_name || s.name || '—'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {s.users?.email || s.email || '—'}
                        </TableCell>
                        <TableCell>
                          {formatDob(s.date_of_birth) || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.student_code || '—'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classroom.open_date && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày mở lớp</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(classroom.open_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {classroom.close_date && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày đóng lớp</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(classroom.close_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
