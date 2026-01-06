'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import {
    BookOpen,
    Search,
    Calendar,
    FileText,
    Video,
    Download,
    Eye,
    Lock,
    Play
} from 'lucide-react';
import { TeacherLessonPreviewModal } from '@/components/lessons/TeacherLessonPreviewModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    content?: string;
    file_urls?: string[];
    file_names?: string[];
    storage_paths?: string[];
    youtube_urls?: { url: string; title: string }[];
    created_at: string;
    available_at?: string;
    classroom_id: string;
    sort_order?: number;
}

interface Classroom {
    id: string;
    name: string;
    code?: string;
}

export default function TeacherLessonsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const params = useParams();
    const { isCollapsed } = useSidebar();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [classroomName, setClassroomName] = useState('Lớp học');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedLessonForPreview, setSelectedLessonForPreview] = useState<Lesson | null>(null);

    const classroomId = params.classroomId as string;

    const filteredLessons = lessons.filter((lesson) =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!authLoading && user && (user.role === 'teacher' || user.role === 'admin')) {
            loadLessons();
        }
    }, [user, authLoading, classroomId]);

    const loadLessons = async () => {
        try {
            if (!user || !classroomId) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Load classroom info
            const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${classroomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (classroomRes.ok) {
                const classroomData = await classroomRes.json();
                setClassroomName(classroomData.name || 'Lớp học');
            }

            // Load lessons
            const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons/classroom/${classroomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (lessonsRes.ok) {
                const lessonsData = await lessonsRes.json();
                setLessons(Array.isArray(lessonsData) ? lessonsData : []);
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

    const isLessonAvailable = (lesson: Lesson): boolean => {
        if (!lesson.available_at) return true;
        const now = new Date();
        const availableAt = new Date(lesson.available_at);
        return now >= availableAt;
    };

    const handlePreviewLesson = (lesson: Lesson) => {
        setSelectedLessonForPreview(lesson);
        setPreviewModalOpen(true);
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
                currentPage="lessons"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email, role: user?.role }}
            />

            <div
                className={`flex-1 overflow-y-auto transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                onClick={() => router.push('/teacher/view-lessons')}
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách lớp
                            </Button>
                        </div>
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
                                            {lesson.file_names && lesson.file_names.length > 0 && (
                                                <Badge variant="secondary" className="mb-2">
                                                    {getFileExtension(lesson.file_names[0])}
                                                </Badge>
                                            )}
                                        </div>
                                        {lesson.youtube_urls && lesson.youtube_urls.length > 0 && (
                                            <Video className="w-5 h-5 text-red-600" />
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
                                                onClick={() => handlePreviewLesson(lesson)}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Xem trước
                                            </Button>
                                            <Button
                                                onClick={() => router.push(`/teacher/lessons/${classroomId}/${lesson.id}`)}
                                                variant="default"
                                                className="flex-1"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Xem chi tiết
                                            </Button>
                                            {lesson.file_urls && lesson.file_urls.length > 0 && (
                                                <Button
                                                    onClick={() => window.open(lesson.file_urls![0], '_blank')}
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
                </div>
            </div>

            {/* Preview Modal */}
            <TeacherLessonPreviewModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                lesson={selectedLessonForPreview}
                classroomName={classroomName}
                onNavigateToLesson={(lessonId) => router.push(`/teacher/lessons/${classroomId}/${lessonId}`)}
            />
        </div>
    );
}