"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';
import LessonUploadForm from '@/components/lessons/LessonUploadForm';
import LessonList from '@/components/lessons/LessonList';
import { useAuth } from '@/contexts/AuthContext';

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [refreshLessons, setRefreshLessons] = useState(0);
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const { user } = useAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const formatDob = (dob?: string | null) => {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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
                // Authentication error - token expired or invalid
                const errorData = await clsRes.json().catch(() => ({ detail: 'Authentication failed' }));
                console.error('Authentication failed:', errorData);
                // Clear tokens and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            } else if (clsRes.status === 403) {
                // Permission error - user doesn't have access
                // Try to get error message, but don't fail if response is not JSON
                try {
                    const errorData = await clsRes.json();
                    console.warn('Permission denied:', errorData);
                } catch {
                    console.warn('Permission denied: User does not have access to this classroom');
                }
                // Don't throw - just set classroom to null and show error message
                setClassroom(null);
                // Continue to show error state
            } else if (clsRes.status === 404) {
                // Classroom not found
                console.error('Classroom not found');
                setClassroom(null);
            } else {
                // Other errors
                throw new Error(`Failed to load classroom: ${clsRes.status} ${clsRes.statusText}`);
            }
        } else {
            const cls = await clsRes.json();
            setClassroom(cls);
            
            // Only continue if we successfully loaded the classroom
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
  }, [id]);

  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
    };
  }, [students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Không thể tải thông tin lớp học.</p>
              <p className="text-gray-600 text-sm mb-4">
                Bạn có thể không có quyền truy cập lớp học này hoặc lớp học không tồn tại.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Button>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin lớp học</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><span className="font-medium">Tên lớp:</span> {classroom.name}</div>
          <div><span className="font-medium">Mã lớp:</span> {classroom.code}</div>
          <div><span className="font-medium">Giáo viên:</span> {teacherName || (classroom.teacher_id || 'N/A')}</div>
          <div><span className="font-medium">Sĩ số:</span> {classroom.capacity ?? 30}</div>
          <div><span className="font-medium">Mô tả:</span> {classroom.description || '—'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-medium">Ngày mở lớp:</span> {classroom.open_date ? classroom.open_date.slice(0, 10) : '—'}</div>
            <div><span className="font-medium">Ngày đóng lớp:</span> {classroom.close_date ? classroom.close_date.slice(0, 10) : '—'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tài liệu bài học</CardTitle>
        </CardHeader>
        <CardContent>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <LessonUploadForm
              classroomId={id}
              classrooms={classrooms}
              onUploadSuccess={() => setRefreshLessons(prev => prev + 1)}
            />
          )}
          <LessonList classroomId={id} refreshTrigger={refreshLessons} classrooms={classrooms} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh ({stats.totalStudents})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-sm text-gray-600">Chưa có học sinh</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Mã học sinh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.users?.full_name || s.name || '—'}</TableCell>
                      <TableCell>{s.users?.email || s.email || '—'}</TableCell>
                      <TableCell>{formatDob(s.date_of_birth)}</TableCell>
                      <TableCell>{s.student_code}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


