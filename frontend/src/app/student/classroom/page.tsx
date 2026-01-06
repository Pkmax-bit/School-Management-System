'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Users,
    School,
    Mail,
    Phone,
    Calendar,
    BookOpen
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Student {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
}

interface Teacher {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    specialization?: string;
}

interface Classroom {
    id: string;
    name: string;
    grade: string;
    academic_year: string;
    room?: string;
    teacher?: Teacher;
    students?: Student[];
}

export default function StudentClassroomPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadClassroomInfo();
        }
    }, [user, authLoading]);

    const loadClassroomInfo = async () => {
        try {
            if (!user) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Get student info to find classroom_id
            const studentRes = await fetch(`${API_BASE_URL}/api/students?user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (studentRes.ok) {
                const studentsData = await studentRes.json();
                if (studentsData.length > 0) {
                    const classroomId = studentsData[0].classroom_id;

                    // Get classroom details
                    const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${classroomId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });

                    if (classroomRes.ok) {
                        const classroomData = await classroomRes.json();

                        // Get teacher details if available
                        let teacherData = null;
                        if (classroomData.teacher_id) {
                            const teacherRes = await fetch(`${API_BASE_URL}/api/teachers/${classroomData.teacher_id}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                            });
                            if (teacherRes.ok) {
                                teacherData = await teacherRes.json();
                            }
                        }

                        // Get students list
                        const studentsRes = await fetch(`${API_BASE_URL}/api/students?classroom_id=${classroomId}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });

                        let studentsList = [];
                        if (studentsRes.ok) {
                            studentsList = await studentsRes.json();
                        }

                        setClassroom({
                            ...classroomData,
                            teacher: teacherData,
                            students: studentsList
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading classroom info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage="classroom"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <School className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">{classroom?.name || 'Lớp học của tôi'}</h1>
                                <p className="text-indigo-100">
                                    Niên khóa: {classroom?.academic_year || 'N/A'} • Phòng: {classroom?.room || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {classroom ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Teacher Info */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-600" />
                                            Giáo viên chủ nhiệm
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {classroom.teacher ? (
                                            <div className="text-center">
                                                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-indigo-50">
                                                    <AvatarImage src={classroom.teacher.avatar_url} />
                                                    <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                                                        {classroom.teacher.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <h3 className="text-xl font-bold text-slate-800 mb-1">
                                                    {classroom.teacher.name}
                                                </h3>
                                                <p className="text-slate-500 mb-4">{classroom.teacher.specialization || 'Giáo viên'}</p>

                                                <div className="space-y-3 text-left bg-slate-50 p-4 rounded-lg">
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        <span className="text-slate-600">{classroom.teacher.email}</span>
                                                    </div>
                                                    {classroom.teacher.phone && (
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <Phone className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">{classroom.teacher.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                Chưa có thông tin giáo viên
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                            Thông tin lớp học
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Sĩ số</span>
                                            <span className="font-semibold text-slate-800">
                                                {classroom.students?.length || 0} học sinh
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Khối</span>
                                            <span className="font-semibold text-slate-800">
                                                {classroom.grade}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Phòng học</span>
                                            <span className="font-semibold text-slate-800">
                                                {classroom.room || 'Chưa cập nhật'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Students List */}
                            <div className="lg:col-span-2">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-indigo-600" />
                                                Danh sách thành viên
                                            </div>
                                            <Badge variant="secondary">
                                                {classroom.students?.length || 0} thành viên
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {classroom.students?.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                                                >
                                                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                        <AvatarImage src={student.avatar_url} />
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                            {student.last_name?.charAt(0) || student.first_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {student.last_name} {student.first_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {student.student_code}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!classroom.students || classroom.students.length === 0) && (
                                                <div className="col-span-full text-center py-12 text-slate-500">
                                                    Chưa có danh sách học sinh
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <School className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500">
                                    Bạn chưa được phân vào lớp học nào.
                                    <br />
                                    Vui lòng liên hệ quản trị viên để được hỗ trợ.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
