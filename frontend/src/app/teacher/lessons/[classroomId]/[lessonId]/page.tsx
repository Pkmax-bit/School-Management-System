'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Play, FileText, Calendar, Lock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Lesson {
    id: string;
    title: string;
    description?: string;
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

export default function LessonDetailPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const params = useParams();
    const { isCollapsed } = useSidebar();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);

    const classroomId = params.classroomId as string;
    const lessonId = params.lessonId as string;

    useEffect(() => {
        if (!authLoading && user && (user.role === 'teacher' || user.role === 'admin')) {
            loadLessonDetail();
            loadRelatedLessons();
        }
    }, [user, authLoading, classroomId, lessonId]);

    const loadLessonDetail = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Load lesson detail
            const lessonRes = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (lessonRes.ok) {
                const lessonData = await lessonRes.json();
                setLesson(lessonData);
            }

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
        } catch (error) {
            console.error('Error loading lesson detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedLessons = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons/classroom/${classroomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (lessonsRes.ok) {
                const lessonsData = await lessonsRes.json();
                // Exclude current lesson and limit to 5 related lessons
                const related = (Array.isArray(lessonsData) ? lessonsData : [])
                    .filter((l: Lesson) => l.id !== lessonId)
                    .slice(0, 5);
                setRelatedLessons(related);
            }
        } catch (error) {
            console.error('Error loading related lessons:', error);
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

    // Check if lesson is available
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

    if (!lesson) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Không tìm thấy bài học</p>
                    <Button onClick={() => router.back()}>Quay lại</Button>
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
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                onClick={() => router.back()}
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                        <p className="text-blue-100">Lớp: {classroom?.name || 'N/A'}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm">Chế độ xem học sinh - Video và tài liệu bài học</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Video Player */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Play className="w-5 h-5" />
                                        Nội dung bài học
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                        {(() => {
                                            // Handle YouTube videos first
                                            const youtubeUrls = lesson.youtube_urls || [];
                                            if (youtubeUrls.length > 0) {
                                                const firstVideo = typeof youtubeUrls[0] === 'string' ? youtubeUrls[0] : youtubeUrls[0].url;
                                                const videoId = getYouTubeVideoId(firstVideo);

                                                if (videoId) {
                                                    return (
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${videoId}`}
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    );
                                                }
                                            }

                                            // Handle uploaded videos
                                            const fileUrls = lesson.file_urls || [];
                                            const videoFiles = fileUrls.filter((_, index) => {
                                                const fileName = (lesson.file_names || [])[index] || '';
                                                return isVideoFile(fileName);
                                            });

                                            if (videoFiles.length > 0) {
                                                return (
                                                    <video
                                                        src={videoFiles[0]}
                                                        controls
                                                        className="w-full h-full"
                                                        poster="/video-placeholder.jpg"
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                );
                                            }

                                            // Handle images
                                            const imageFiles = fileUrls.filter((_, index) => {
                                                const fileName = (lesson.file_names || [])[index] || '';
                                                return isImageFile(fileName);
                                            });

                                            if (imageFiles.length > 0) {
                                                return (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                        <img
                                                            src={imageFiles[0]}
                                                            alt={lesson.title}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // No media available
                                            return (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                    <div className="text-center text-gray-500">
                                                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                        <p>Không có video hoặc hình ảnh</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lesson Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin bài học</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {lesson.description && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Mô tả</h4>
                                            <p className="text-gray-600 leading-relaxed">{lesson.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>Tạo: {format(new Date(lesson.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                                        </div>

                                        {lesson.available_at && (
                                            <div className="flex items-center gap-2">
                                                {isLessonAvailable(lesson) ? (
                                                    <Eye className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Lock className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span>
                                                    {isLessonAvailable(lesson) ? 'Đã mở' : `Mở: ${format(new Date(lesson.available_at), "dd/MM/yyyy HH:mm", { locale: vi })}`}
                                                </span>
                                            </div>
                                        )}

                                        {lesson.youtube_urls && lesson.youtube_urls.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Play className="w-4 h-4 text-red-500" />
                                                <span>{lesson.youtube_urls.length} video YouTube</span>
                                            </div>
                                        )}

                                        {lesson.file_urls && lesson.file_urls.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                <span>{lesson.file_urls.length} file đính kèm</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* YouTube Videos */}
                            {lesson.youtube_urls && lesson.youtube_urls.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Video YouTube</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {lesson.youtube_urls.map((video, index) => {
                                                const videoUrl = typeof video === 'string' ? video : video.url;
                                                const videoTitle = typeof video === 'string' ? `Video ${index + 1}` : (video.title || `Video ${index + 1}`);

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
                                    </CardContent>
                                </Card>
                            )}

                            {/* File Downloads */}
                            {lesson.file_urls && lesson.file_urls.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tài liệu đính kèm</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {lesson.file_urls.map((url, index) => {
                                                const fileName = (lesson.file_names || [])[index] || `File ${index + 1}`;
                                                const isImage = isImageFile(fileName);
                                                const isVideo = isVideoFile(fileName);

                                                return (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-shrink-0">
                                                            {isImage ? (
                                                                <img src={url} alt={fileName} className="w-8 h-8 object-cover rounded" />
                                                            ) : isVideo ? (
                                                                <Play className="w-8 h-8 text-blue-500" />
                                                            ) : (
                                                                <FileText className="w-8 h-8 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={fileName}>
                                                                {fileName}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            onClick={() => window.open(url, '_blank')}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Related Lessons */}
                            {relatedLessons.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Bài học khác</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {relatedLessons.map((relatedLesson) => (
                                                <button
                                                    key={relatedLesson.id}
                                                    onClick={() => router.push(`/teacher/lessons/${classroomId}/${relatedLesson.id}`)}
                                                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <p className="text-sm font-medium truncate">{relatedLesson.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {format(new Date(relatedLesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




