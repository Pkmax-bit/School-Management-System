'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    Eye,
    BookOpen,
    Search,
    Calendar,
    FileText,
    Video,
    Download,
    Play,
    Lock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Circle,
    Clock,
    User,
    Award,
    Menu,
    X
} from 'lucide-react';
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

export default function LessonPreviewPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const params = useParams();
    const { isCollapsed } = useSidebar();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const classroomId = params.classroomId as string;

    // Sort lessons by sort_order
    const sortedLessons = [...lessons].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Update current lesson index when selected lesson changes
    const currentLessonIndex = selectedLesson ? sortedLessons.findIndex(l => l.id === selectedLesson.id) : 0;

    useEffect(() => {
        if (!authLoading && user && (user.role === 'teacher' || user.role === 'admin')) {
            loadClassroomAndLessons();
        }
    }, [user, authLoading, classroomId]);

    const loadClassroomAndLessons = async () => {
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
                setClassroom(classroomData);
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
            console.error('Error loading classroom and lessons:', error);
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Main Teacher/Admin Sidebar */}
            {user.role === 'admin' ? (
                <AdminSidebar
                    currentPage="documents"
                    onNavigate={(page) => router.push(`/admin/${page}`)}
                    onLogout={logout}
                    userName={user?.name}
                    userEmail={user?.email}
                    userRole={user?.role}
                />
            ) : (
                <TeacherSidebar
                    currentPage="view-lessons"
                    onNavigate={(path) => router.push(path)}
                    onLogout={logout}
                    user={{ name: user?.name, email: user?.email, role: user?.role }}
                />
            )}

            {/* Main Content */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ml-0 ${
                isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            }`}>
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="lg:hidden"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {selectedLesson?.title || 'Chọn bài học'}
                                </h1>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview Mode - Học sinh sẽ thấy nội dung như thế này
                                </p>
                            </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const prevIndex = currentLessonIndex - 1;
                                    if (prevIndex >= 0) {
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
                                    if (nextIndex < sortedLessons.length) {
                                        setSelectedLesson(sortedLessons[nextIndex]);
                                    }
                                }}
                                disabled={currentLessonIndex === sortedLessons.length - 1}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {selectedLesson && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Tiến độ học tập</span>
                                <span>{Math.round(((currentLessonIndex + 1) / sortedLessons.length) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentLessonIndex + 1) / sortedLessons.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!selectedLesson ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Chọn bài học để xem</h3>
                                <p className="text-gray-500">Click vào một bài học trong sidebar để bắt đầu học</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto p-6 space-y-6">
                            {/* Lesson Header */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h2>
                                        {selectedLesson.description && (
                                            <p className="text-gray-600">{selectedLesson.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isLessonAvailable(selectedLesson) ? (
                                            <Badge className="bg-green-100 text-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Đã mở
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Chưa mở
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Tạo: {format(new Date(selectedLesson.created_at), "dd/MM/yyyy", { locale: vi })}</span>
                                    </div>
                                    {selectedLesson.available_at && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {isLessonAvailable(selectedLesson) ? 'Đã mở' : `Mở: ${format(new Date(selectedLesson.available_at), "dd/MM/yyyy HH:mm", { locale: vi })}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Video Content */}
                            {(() => {
                                // Handle YouTube videos first
                                const youtubeUrls = selectedLesson.youtube_urls || [];
                                if (youtubeUrls.length > 0) {
                                    const firstVideo = typeof youtubeUrls[0] === 'string' ? youtubeUrls[0] : youtubeUrls[0].url;
                                    const videoId = firstVideo.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];

                                    if (videoId) {
                                        return (
                                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                                <div className="p-4 border-b bg-gray-50">
                                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                                        <Play className="w-5 h-5 text-red-500" />
                                                        Video bài giảng
                                                    </h3>
                                                </div>
                                                <div className="aspect-video">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        className="w-full h-full"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                }

                                // Handle uploaded videos
                                const fileUrls = selectedLesson.file_urls || [];
                                const videoFiles = fileUrls.filter((_, index) => {
                                    const fileName = (selectedLesson.file_names || [])[index] || '';
                                    return isVideoFile(fileName);
                                });

                                if (videoFiles.length > 0) {
                                    return (
                                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                            <div className="p-4 border-b bg-gray-50">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <Play className="w-5 h-5 text-blue-500" />
                                                    Video bài giảng
                                                </h3>
                                            </div>
                                            <div className="aspect-video">
                                                <video
                                                    src={videoFiles[0]}
                                                    controls
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })()}

                            {/* Content and Materials */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    {selectedLesson.content && (
                                        <div className="bg-white rounded-lg shadow-sm border">
                                            <div className="p-4 border-b bg-gray-50">
                                                <h3 className="font-semibold text-lg">Nội dung bài học</h3>
                                            </div>
                                            <div className="p-6">
                                                <div className="prose max-w-none">
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedLesson.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Handle images */}
                                    {(() => {
                                        const fileUrls = selectedLesson.file_urls || [];
                                        const imageFiles = fileUrls.filter((_, index) => {
                                            const fileName = (selectedLesson.file_names || [])[index] || '';
                                            return isImageFile(fileName);
                                        });

                                        if (imageFiles.length > 0) {
                                            return (
                                                <div className="bg-white rounded-lg shadow-sm border">
                                                    <div className="p-4 border-b bg-gray-50">
                                                        <h3 className="font-semibold text-lg">Hình ảnh bài học</h3>
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {imageFiles.map((imageUrl, index) => (
                                                                <img
                                                                    key={index}
                                                                    src={imageUrl}
                                                                    alt={`Hình ảnh ${index + 1}`}
                                                                    className="w-full h-auto rounded-lg shadow-sm"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })()}
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Additional Videos */}
                                    {selectedLesson.youtube_urls && selectedLesson.youtube_urls.length > 1 && (
                                        <div className="bg-white rounded-lg shadow-sm border">
                                            <div className="p-4 border-b bg-gray-50">
                                                <h3 className="font-semibold text-lg">Video bổ sung</h3>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {selectedLesson.youtube_urls.slice(1).map((video, index) => {
                                                    const videoUrl = typeof video === 'string' ? video : video.url;
                                                    const videoTitle = typeof video === 'string' ? `Video ${index + 2}` : (video.title || `Video ${index + 2}`);
                                                    return (
                                                        <a
                                                            key={index}
                                                            href={videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                                                        >
                                                            <Play className="w-5 h-5" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm">{videoTitle}</p>
                                                                <p className="text-xs text-red-600">Click để xem</p>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* File Attachments */}
                                    {selectedLesson.file_urls && selectedLesson.file_urls.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-sm border">
                                            <div className="p-4 border-b bg-gray-50">
                                                <h3 className="font-semibold text-lg">Tài liệu đính kèm</h3>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {selectedLesson.file_urls.map((url, index) => {
                                                    const fileName = (selectedLesson.file_names || [])[index] || `File ${index + 1}`;
                                                    const isImage = isImageFile(fileName);
                                                    const isVideo = isVideoFile(fileName);

                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                                                    isImage ? 'bg-green-100 text-green-600' :
                                                                    isVideo ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {isImage ? 'IMG' : isVideo ? 'VID' : fileName.split('.').pop()?.toUpperCase()?.substring(0, 3) || 'DOC'}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                                                        {fileName}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {isImage ? 'Hình ảnh' : isVideo ? 'Video' : 'Tài liệu'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => window.open(url, '_blank')}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Download className="w-4 h-4 mr-1" />
                                                                Tải
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Lesson Info */}
                                    <div className="bg-white rounded-lg shadow-sm border">
                                        <div className="p-4 border-b bg-gray-50">
                                            <h3 className="font-semibold text-lg">Thông tin bài học</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-3 text-sm">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Bài học thứ {currentLessonIndex + 1}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <BookOpen className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Lớp: {classroom?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">
                                                    Cập nhật: {format(new Date(selectedLesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
