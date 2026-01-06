'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, BookOpen } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Classroom {
    id: string;
    name: string;
    code?: string;
    teacher_id?: string;
}

export default function ViewLessonsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user && (user.role === 'teacher' || user.role === 'admin')) {
            loadClassrooms();
        }
    }, [user, authLoading]);

    const loadClassrooms = async () => {
        try {
            if (!user) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const response = await fetch(`${API_BASE_URL}/api/classrooms`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setClassrooms(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewLessons = async (classroomId: string) => {
        // Chuyển đến trang preview bài học cho teacher/admin
        router.push(`/teacher/lesson-preview/${classroomId}`);
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

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
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
            <TeacherSidebar
                currentPage="view-lessons"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email, role: user?.role }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                onClick={() => router.push('/assignments')}
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">📖 Xem bài học như học sinh</h1>
                        <p className="text-green-100">Chọn lớp học để xem danh sách bài học từ góc nhìn của học sinh</p>
                        <div className="mt-4 flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm">Click &quot;Xem bài học&quot; để trải nghiệm như học sinh</span>
                        </div>
                    </div>

                    {/* Classrooms List */}
                    <div className="space-y-3">
                        {classrooms.map((classroom) => (
                            <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{classroom.name}</h3>
                                                {classroom.code && (
                                                    <p className="text-sm text-gray-600">Mã lớp: {classroom.code}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleViewLessons(classroom.id)}
                                            className="gap-2"
                                            variant="default"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Xem bài học
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {classrooms.length === 0 && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500">Chưa có lớp học nào</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
