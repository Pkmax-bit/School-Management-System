'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    Search,
    Calendar,
    FileText,
    Video,
    Download,
    Eye
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    content?: string;
    file_url?: string;
    video_url?: string;
    created_at: string;
    available_at?: string;
    subject?: {
        id: string;
        name: string;
    };
    teacher?: {
        id: string;
        name?: string;
        email?: string;
    };
}

export default function StudentLessonsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadLessons();
        }
    }, [user, authLoading]);

    const loadLessons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Get student's classroom
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

                    // Get lessons for the classroom
                    const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons?classroom_id=${classroomId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });

                    if (lessonsRes.ok) {
                        const lessonsData = await lessonsRes.json();
                        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLessons = lessons.filter((lesson) =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                currentPage="lessons"
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Bài học</h1>
                        <p className="text-blue-100">Xem tài liệu và video bài giảng</p>
                    </div>

                    {/* Search */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm bài học..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lessons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredLessons.map((lesson) => (
                            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg mb-2">{lesson.title}</CardTitle>
                                            {lesson.subject && (
                                                <Badge variant="secondary" className="mb-2">
                                                    {lesson.subject.name}
                                                </Badge>
                                            )}
                                        </div>
                                        {lesson.video_url && (
                                            <Video className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    {lesson.description && (
                                        <CardDescription className="line-clamp-2">
                                            {lesson.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {lesson.available_at && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {new Date(lesson.available_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setSelectedLesson(lesson)}
                                                variant="default"
                                                className="flex-1"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Xem chi tiết
                                            </Button>
                                            {lesson.file_url && (
                                                <Button
                                                    onClick={() => window.open(lesson.file_url, '_blank')}
                                                    variant="outline"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredLessons.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="p-12 text-center">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500">Chưa có bài học nào</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Lesson Detail Modal */}
                    {selectedLesson && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-2xl mb-2">{selectedLesson.title}</CardTitle>
                                            {selectedLesson.subject && (
                                                <Badge variant="secondary">
                                                    {selectedLesson.subject.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => setSelectedLesson(null)}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedLesson.description && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Mô tả</h3>
                                            <p className="text-slate-600">{selectedLesson.description}</p>
                                        </div>
                                    )}

                                    {selectedLesson.video_url && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Video bài giảng</h3>
                                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                <video
                                                    src={selectedLesson.video_url}
                                                    controls
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedLesson.content && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Nội dung</h3>
                                            <div className="prose max-w-none">
                                                <p className="text-slate-600 whitespace-pre-wrap">{selectedLesson.content}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedLesson.file_url && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Tài liệu đính kèm</h3>
                                            <Button
                                                onClick={() => window.open(selectedLesson.file_url, '_blank')}
                                                variant="outline"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Tải xuống tài liệu
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
