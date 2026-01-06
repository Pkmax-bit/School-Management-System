'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Lesson } from '@/types/lesson';
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
    Eye,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Circle,
    Lock,
    Menu
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudentLessonsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Check if this is a teacher preview
    const isTeacherPreview = searchParams.get('preview') === 'teacher';
    const classroomId = searchParams.get('classroom');

    // Sort lessons by sort_order
    const sortedLessons = [...lessons].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Update current lesson index when selected lesson changes
    const currentLessonIndex = selectedLesson ? sortedLessons.findIndex(l => l.id === selectedLesson.id) : 0;

    useEffect(() => {
        if (!authLoading && user && (user.role === 'student' || ((user.role === 'teacher' || user.role === 'admin') && isTeacherPreview))) {
            loadLessons();
        }
    }, [user, authLoading, isTeacherPreview, classroomId]);

    const loadLessons = async () => {
        try {
            if (!user) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            let targetClassroomId = classroomId;

            // If not teacher preview, get student's classroom
            if (!isTeacherPreview) {
                const studentRes = await fetch(`${API_BASE_URL}/api/students?user_id=${user.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (studentRes.ok) {
                    const studentsData = await studentRes.json();
                    if (studentsData.length > 0) {
                        targetClassroomId = studentsData[0].classroom_id;
                    }
                }
            }

            if (targetClassroomId) {
                // Get lessons for the classroom
                const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons/classroom/${targetClassroomId}`, {
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
        } catch (error) {
            console.error('Error loading lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    const getYouTubeVideoId = (url: string): string => {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : "";
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

    const isVideoFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext);
    };

    const isLessonAvailable = (lesson: Lesson): boolean => {
        if (!lesson.available_at) return true;
        const now = new Date();
        const availableAt = new Date(lesson.available_at);
        return now >= availableAt;
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

    if (!user || (!isTeacherPreview && user.role !== 'student') || (isTeacherPreview && user.role !== 'teacher' && user.role !== 'admin')) {
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
        <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {selectedLesson?.title || 'Chọn bài học để học'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {selectedLesson ? 'Đang học bài giảng' : 'Click vào một bài học trong sidebar để bắt đầu'}
                        </p>
                    </div>

                    {/* Navigation Controls for teacher preview */}
                    {isTeacherPreview && selectedLesson && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const prevIndex = currentLessonIndex - 1;
                                    if (prevIndex >= 0 && isLessonAvailable(sortedLessons[prevIndex])) {
                                        setSelectedLesson(sortedLessons[prevIndex]);
                                    }
                                }}
                                disabled={currentLessonIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-600 px-2">
                                {currentLessonIndex + 1} / {sortedLessons.length}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const nextIndex = currentLessonIndex + 1;
                                    if (nextIndex < sortedLessons.length && isLessonAvailable(sortedLessons[nextIndex])) {
                                        setSelectedLesson(sortedLessons[nextIndex]);
                                    }
                                }}
                                disabled={currentLessonIndex === sortedLessons.length - 1}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Progress Bar for teacher preview */}
                {isTeacherPreview && selectedLesson && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Tiến độ học tập</span>
                            <span>{Math.round(((currentLessonIndex + 1) / sortedLessons.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentLessonIndex + 1) / sortedLessons.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lessons Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Danh sách bài học
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {sortedLessons.map((lesson, index) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => setSelectedLesson(lesson)}
                                    disabled={!isLessonAvailable(lesson) && !isTeacherPreview}
                                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                                        selectedLesson?.id === lesson.id
                                            ? 'bg-blue-100 border-l-4 border-blue-500'
                                            : isLessonAvailable(lesson) || isTeacherPreview
                                            ? 'hover:bg-gray-100'
                                            : 'opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isLessonAvailable(lesson)
                                                ? selectedLesson?.id === lesson.id ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isLessonAvailable(lesson) ? (
                                                selectedLesson?.id === lesson.id ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-3 h-3" />
                                            ) : (
                                                <Lock className="w-3 h-3" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm truncate ${
                                                selectedLesson?.id === lesson.id ? 'text-blue-700' : 'text-gray-700'
                                            }`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {lesson.video_url && (
                                                    <Video className="w-3 h-3 text-red-500" />
                                                )}
                                                {lesson.file_url && (
                                                    <FileText className="w-3 h-3 text-blue-500" />
                                                )}
                                                {!isLessonAvailable(lesson) && !isTeacherPreview && (
                                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                                        <Lock className="w-2 h-2 mr-1" />
                                                        Chưa mở
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Chọn bài học để bắt đầu học</h3>
                        <p className="text-gray-500">Click vào một bài học trong sidebar để bắt đầu học tập</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
