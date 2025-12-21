'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    ArrowLeft, Download, FileText, FileIcon, Calendar,
    BookOpen, ExternalLink, Play, Clock, Loader2,
    ChevronRight, Menu, X, Video, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useApiAuth } from '@/hooks/useApiAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LessonFile {
    id: string;
    lesson_id: string;
    file_url: string;
    file_name: string;
    storage_path?: string;
    file_size?: number;
    file_type?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface Lesson {
    id: string;
    classroom_id: string;
    title: string;
    description?: string;
    file_url: string;
    file_name?: string;
    storage_path?: string;
    sort_order?: number;
    available_at?: string;
    assignment_id?: string;
    files?: LessonFile[];
    created_at: string;
    updated_at: string;
}

export default function AdminLessonPreviewPage() {
    const router = useRouter();
    const params = useParams();
    const lessonId = params.id as string;
    const { user, loading: authLoading } = useApiAuth();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [classroomId, setClassroomId] = useState<string | null>(null);
    const [activeFile, setActiveFile] = useState<LessonFile | { file_url: string; file_name: string; id: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/admin/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchLesson = async () => {
            if (authLoading) return;
            
            if (!user || user.role !== 'admin') {
                router.push('/admin/login');
                return;
            }

            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            try {
                // Try to get lesson data from sessionStorage first (passed from preview modal)
                const cachedLesson = sessionStorage.getItem(`lesson_preview_${lessonId}`);
                if (cachedLesson) {
                    try {
                        const lessonData = JSON.parse(cachedLesson);
                        setLesson(lessonData);
                        setClassroomId(lessonData.classroom_id);
                        
                        if (lessonData.files && lessonData.files.length > 0) {
                            setActiveFile(lessonData.files[0]);
                        } else if (lessonData.file_url) {
                            setActiveFile({
                                id: 'main',
                                file_url: lessonData.file_url,
                                file_name: lessonData.file_name || 'Main File'
                            });
                        }
                        
                        sessionStorage.removeItem(`lesson_preview_${lessonId}`);
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.warn("Failed to parse cached lesson:", e);
                    }
                }

                // Fetch from API
                const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        setError('Không có quyền truy cập bài học này.');
                    } else if (response.status === 404) {
                        setError('Không tìm thấy bài học.');
                    } else {
                        setError('Không thể tải bài học.');
                    }
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setLesson(data);
                setClassroomId(data.classroom_id);

                if (data.files && data.files.length > 0) {
                    setActiveFile(data.files[0]);
                } else if (data.file_url) {
                    setActiveFile({
                        id: 'main',
                        file_url: data.file_url,
                        file_name: data.file_name || 'Main File'
                    });
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        if (lessonId && !authLoading && user) {
            fetchLesson();
        }
    }, [lessonId, authLoading, user, router]);

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconClass = "w-5 h-5";

        switch (ext) {
            case 'pdf':
                return <FileText className={`${iconClass} text-red-500`} />;
            case 'doc':
            case 'docx':
                return <FileText className={`${iconClass} text-blue-500`} />;
            case 'xls':
            case 'xlsx':
                return <FileText className={`${iconClass} text-green-500`} />;
            case 'ppt':
            case 'pptx':
                return <FileText className={`${iconClass} text-orange-500`} />;
            case 'mp4':
            case 'webm':
                return <Video className={`${iconClass} text-purple-500`} />;
            default:
                return <FileIcon className={`${iconClass} text-gray-500`} />;
        }
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

    const isVideoFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['mp4', 'webm', 'ogg'].includes(ext);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải bài học...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error || 'Không tìm thấy bài học'}</p>
                            <Button onClick={() => router.back()} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isLessonAvailable = (lesson: Lesson): boolean => {
        if (!lesson.available_at) return true;
        const now = new Date();
        const availableAt = new Date(lesson.available_at);
        return now >= availableAt;
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Preview Badge */}
            <div className="fixed top-4 right-4 z-50">
                <Badge className="bg-amber-500 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                    <Eye className="w-4 h-4 mr-2 inline" />
                    Chế độ xem trước (Admin)
                </Badge>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 h-16">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.back()}
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-100 rounded-full"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 truncate max-w-xl">{lesson.title}</h1>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                </span>
                                {!isLessonAvailable(lesson) && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Chưa mở
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                {/* Content Viewer */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 flex justify-center">
                    <div className="w-full max-w-5xl space-y-6">
                        {activeFile ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[60vh]">
                                {activeFile.file_name.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={activeFile.file_url}
                                        className="w-full h-[80vh]"
                                        title={activeFile.file_name}
                                    />
                                ) : isVideoFile(activeFile.file_name) ? (
                                    <div className="aspect-video bg-black flex items-center justify-center">
                                        <video
                                            controls
                                            className="w-full h-full"
                                            src={activeFile.file_url}
                                        >
                                            Trình duyệt của bạn không hỗ trợ thẻ video.
                                        </video>
                                    </div>
                                ) : isImageFile(activeFile.file_name) ? (
                                    <div className="flex items-center justify-center p-4 bg-gray-50 h-full min-h-[60vh]">
                                        <img
                                            src={activeFile.file_url}
                                            alt={activeFile.file_name}
                                            className="max-w-full max-h-[80vh] object-contain rounded shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center">
                                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                            {getFileIcon(activeFile.file_name)}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{activeFile.file_name}</h3>
                                        <p className="text-gray-500 mb-8 max-w-md">
                                            File này không hỗ trợ xem trước trực tiếp. Vui lòng tải về để xem.
                                        </p>
                                        <Button asChild size="lg" className="gap-2">
                                            <a href={activeFile.file_url} download={activeFile.file_name}>
                                                <Download className="w-5 h-5" />
                                                Tải xuống
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                                <FileText className="w-16 h-16 mb-4 opacity-20" />
                                <p>Chọn một tài liệu để xem</p>
                            </div>
                        )}

                        {/* Description Section */}
                        {lesson.description && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Giới thiệu bài học</h3>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p className="whitespace-pre-wrap">{lesson.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
                `}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Nội dung bài học</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                            {/* Files List */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tài liệu</h3>
                                {lesson.files && lesson.files.length > 0 ? (
                                    lesson.files.map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => setActiveFile(file)}
                                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${activeFile?.id === file.id
                                                    ? 'bg-blue-50 border-blue-100 ring-1 ring-blue-200'
                                                    : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                        >
                                            <div className="mt-0.5">
                                                {activeFile?.id === file.id ? (
                                                    <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                                                ) : (
                                                    <div className="text-gray-400">
                                                        {getFileIcon(file.file_name)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${activeFile?.id === file.id ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                    {file.file_name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                ) : lesson.file_url ? (
                                    <button
                                        onClick={() => setActiveFile({
                                            id: 'main',
                                            file_url: lesson.file_url,
                                            file_name: lesson.file_name || 'Main File'
                                        })}
                                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${activeFile?.id === 'main'
                                                ? 'bg-blue-50 border-blue-100 ring-1 ring-blue-200'
                                                : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {activeFile?.id === 'main' ? (
                                                <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                                            ) : (
                                                <div className="text-gray-400">
                                                    {getFileIcon(lesson.file_name || '')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${activeFile?.id === 'main' ? 'text-blue-700' : 'text-gray-700'
                                                }`}>
                                                {lesson.file_name || 'Tài liệu chính'}
                                            </p>
                                        </div>
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500 italic px-2">Không có tài liệu nào.</p>
                                )}
                            </div>

                            <Separator />

                            {/* Related Assignment */}
                            {lesson.assignment_id && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bài tập</h3>
                                    <Card className="bg-purple-50 border-purple-100">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Bài tập về nhà</h4>
                                                    <p className="text-xs text-purple-700 mt-1">Có bài tập liên quan đến bài học này.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </aside>
        </div>
    );
}

