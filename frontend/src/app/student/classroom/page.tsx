'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { School, Users, BookOpen, ClipboardCheck, Calendar, GraduationCap, Loader2, ChevronRight, ArrowRight } from 'lucide-react';
import { StudentSidebar } from '@/components/StudentSidebar';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Classroom {
    id: string;
    name: string;
    code?: string;
    description?: string;
    grade_level?: string;
    academic_year?: string;
    subject?: {
        id: string;
        name: string;
        code?: string;
    };
    teacher?: {
        id: string;
        name?: string;
        email?: string;
    };
    created_at: string;
    stats?: {
        totalLessons: number;
        totalAssignments: number;
    };
}

export default function StudentClassroomPage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useApiAuth();
    const { isCollapsed } = useSidebar();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            loadClassrooms();
        }
    }, [authLoading, user]);

    const loadClassrooms = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            if (!token) {
                router.push('/login');
                return;
            }

            // Get student profile
            const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                const student = studentsData.find((s: any) => s.user_id === user?.id);

                if (student && student.classroom_id) {
                    // Load classroom info
                    const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${student.classroom_id}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (classroomRes.ok) {
                        const classroomData = await classroomRes.json();

                        // Load lessons count
                        const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons/classroom/${student.classroom_id}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        let lessonsCount = 0;
                        if (lessonsRes.ok) {
                            const lessonsData = await lessonsRes.json();
                            lessonsCount = lessonsData.length;
                        }

                        // Load assignments count
                        const assignmentsRes = await fetch(`${API_BASE_URL}/api/assignments?classroom_id=${student.classroom_id}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        let assignmentsCount = 0;
                        if (assignmentsRes.ok) {
                            const assignmentsData = await assignmentsRes.json();
                            assignmentsCount = assignmentsData.length;
                        }

                        setClassrooms([{
                            ...classroomData,
                            stats: {
                                totalLessons: lessonsCount,
                                totalAssignments: assignmentsCount,
                            }
                        }]);
                    } else {
                        throw new Error('Không thể tải thông tin lớp học');
                    }
                } else {
                    setError('Bạn chưa được phân vào lớp học nào');
                }
            }
        } catch (err: any) {
            console.error('Error loading classrooms:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải thông tin lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleClassroomClick = (classroomId: string) => {
        router.push('/student/lessons');
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <StudentSidebar
                    currentPage="classroom"
                    onNavigate={(path) => router.push(path)}
                    onLogout={logout}
                    user={{ name: user?.name, email: user?.email }}
                />
                <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Auth check
    if (!user || user.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <StudentSidebar
                    currentPage="classroom"
                    onNavigate={(path) => router.push(path)}
                    onLogout={logout}
                    user={{ name: user?.name, email: user?.email }}
                />
                <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    <Card className="max-w-md mx-auto mt-20">
                        <CardContent className="pt-6 text-center space-y-4">
                            <School className="w-16 h-16 text-red-500 mx-auto" />
                            <p className="text-red-600 font-medium">{error}</p>
                            <Button onClick={() => router.push('/student/dashboard')} variant="outline">
                                Quay về trang chủ
                            </Button>
                        </CardContent>
                    </Card>
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
            <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <School className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Lớp học của tôi</h1>
                                <p className="text-blue-100 mt-1">Danh sách các lớp học bạn đang tham gia</p>
                            </div>
                        </div>
                    </div>

                    {/* Classrooms List */}
                    {classrooms.length > 0 ? (
                        <div className="space-y-4">
                            {classrooms.map((classroom) => (
                                <Card
                                    key={classroom.id}
                                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                                    onClick={() => handleClassroomClick(classroom.id)}
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left side - Gradient background */}
                                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 md:w-80 flex-shrink-0">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                                    <School className="w-6 h-6 text-white" />
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{classroom.name}</h3>
                                            {classroom.code && (
                                                <Badge className="bg-white/20 text-white hover:bg-white/30 mb-3">
                                                    {classroom.code}
                                                </Badge>
                                            )}
                                            {classroom.description && (
                                                <p className="text-blue-100 text-sm line-clamp-2">{classroom.description}</p>
                                            )}
                                        </div>

                                        {/* Right side - Details */}
                                        <div className="flex-1 p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                {classroom.subject && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <GraduationCap className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-500">Môn học</p>
                                                            <p className="font-semibold text-gray-900 truncate">{classroom.subject.name}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {classroom.grade_level && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <School className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-500">Khối</p>
                                                            <p className="font-semibold text-gray-900 truncate">{classroom.grade_level}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {classroom.academic_year && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Calendar className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-500">Năm học</p>
                                                            <p className="font-semibold text-gray-900 truncate">{classroom.academic_year}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {classroom.teacher && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Users className="w-5 h-5 text-orange-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-500">Giáo viên</p>
                                                            <p className="font-semibold text-gray-900 truncate">{classroom.teacher.name || classroom.teacher.email}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            {classroom.stats && (
                                                <div className="flex gap-4 pt-4 border-t">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-bold text-blue-600">{classroom.stats.totalLessons}</p>
                                                            <p className="text-xs text-gray-500">Bài học</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <ClipboardCheck className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-bold text-purple-600">{classroom.stats.totalAssignments}</p>
                                                            <p className="text-xs text-gray-500">Bài tập</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1"></div>

                                                    <Button
                                                        variant="outline"
                                                        className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClassroomClick(classroom.id);
                                                        }}
                                                    >
                                                        Xem bài học
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-0 shadow-md">
                            <CardContent className="text-center py-16 space-y-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                                    <School className="w-10 h-10 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-gray-900 text-lg font-semibold mb-2">Chưa có lớp học nào</p>
                                    <p className="text-gray-500">Bạn chưa được phân vào lớp học nào</p>
                                </div>
                                <Button onClick={() => router.push('/student/dashboard')} variant="outline">
                                    Quay về trang chủ
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
