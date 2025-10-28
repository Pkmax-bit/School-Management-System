"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
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
        if (!clsRes.ok) throw new Error('Failed to load classroom');
        const cls = await clsRes.json();
        setClassroom(cls);

        // Students of classroom
        const stuRes = await fetch(`${API_BASE_URL}/api/students?limit=1000&classroom_id=${id}`, { headers });
        if (!stuRes.ok) throw new Error('Failed to load students');
        const stuData = await stuRes.json();
        const list = Array.isArray(stuData) ? stuData : (Array.isArray((stuData as any)?.data) ? (stuData as any).data : []);
        setStudents(list);

        // Teacher
        if (cls?.teacher_id) {
          const tRes = await fetch(`${API_BASE_URL}/api/teachers/${cls.teacher_id}`, { headers });
          if (tRes.ok) {
            const t = await tRes.json();
            setTeacherName(t?.users?.full_name || t?.name || '');
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
        <div>Không tìm thấy lớp học.</div>
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
            <div><span className="font-medium">Ngày mở lớp:</span> {classroom.open_date ? classroom.open_date.slice(0,10) : '—'}</div>
            <div><span className="font-medium">Ngày đóng lớp:</span> {classroom.close_date ? classroom.close_date.slice(0,10) : '—'}</div>
          </div>
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


