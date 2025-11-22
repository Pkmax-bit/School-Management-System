'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft, Download, FileText, FileIcon, Calendar, BookOpen, ExternalLink, Play, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    created_at: string;
    updated_at: string;
}

export default function LessonDetailPage() {
    const router = useRouter();
    const params = useParams();
    const lessonId = params.id as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingProgress, setSavingProgress] = useState(false);
    const [classroomId, setClassroomId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            if (!token) {
                setError('Bạn cần đăng nhập để xem bài học');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Không tìm thấy bài học');
                    }
                    throw new Error('Không thể tải bài học');
                }

                const data = await response.json();
                setLesson(data);
                setClassroomId(data.classroom_id);
                
                // Auto save progress when viewing lesson
                if (data.classroom_id) {
                    try {
                        await fetch(
                            `${API_BASE_URL}/api/lessons/${lessonId}/start`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    classroom_id: data.classroom_id,
                                }),
                            }
                        );
                    } catch (progressErr) {
                        console.error("Failed to save progress:", progressErr);
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const handleStartLesson = async () => {
        if (!lesson || !classroomId) return;

        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
        if (!token) return;

        setSavingProgress(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/lessons/${lesson.id}/start`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        classroom_id: classroomId,
                    }),
                }
            );

            if (response.ok) {
                // Open lesson file in new tab
                window.open(lesson.file_url, '_blank');
            }
        } catch (err) {
            console.error("Failed to save progress:", err);
        } finally {
            setSavingProgress(false);
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconClass = "w-8 h-8";

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
            default:
                return <FileIcon className={`${iconClass} text-gray-500`} />;
        }
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải bài học...</p>
                </div>
            </div>
        );
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        size="sm"
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div className="flex items-center gap-4">
                        {getFileIcon(lesson.file_name || '')}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {format(new Date(lesson.created_at), "dd MMMM yyyy", { locale: vi })}
                                    </span>
                                </div>
                                {typeof lesson.sort_order === "number" && !Number.isNaN(lesson.sort_order) && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                                        Thứ tự: {lesson.sort_order}
                                    </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                    {getFileExtension(lesson.file_name || '')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* Description */}
                    {lesson.description && (
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô tả bài học</h2>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {lesson.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* File Preview/Display */}
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tài liệu bài học</h2>
                            
                            {/* File Preview */}
                            {lesson.file_url && (
                                <div className="mb-6">
                                    {/* PDF Preview */}
                                    {lesson.file_name && lesson.file_name.toLowerCase().endsWith('.pdf') && (
                                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                                            <iframe
                                                src={lesson.file_url}
                                                className="w-full h-[600px]"
                                                title={lesson.title}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Image Preview */}
                                    {lesson.file_name && isImageFile(lesson.file_name) && (
                                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                                            <img
                                                src={lesson.file_url}
                                                alt={lesson.title}
                                                className="w-full max-h-96 object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* Other file types - Show file info */}
                                    {lesson.file_name && 
                                     !lesson.file_name.toLowerCase().endsWith('.pdf') && 
                                     !isImageFile(lesson.file_name) && (
                                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                                                    {getFileIcon(lesson.file_name)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 text-lg">{lesson.file_name}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {getFileExtension(lesson.file_name)} • 
                                                        {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* File Info (if not shown above) */}
                            {(!lesson.file_url || (lesson.file_name && !lesson.file_name.toLowerCase().endsWith('.pdf') && !isImageFile(lesson.file_name))) && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {getFileIcon(lesson.file_name || '')}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{lesson.file_name || 'Tài liệu'}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {getFileExtension(lesson.file_name || '')} • 
                                                {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={handleStartLesson}
                                    disabled={savingProgress}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                >
                                    {savingProgress ? (
                                        <>
                                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Học bài
                                        </>
                                    )}
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                >
                                    <a
                                        href={lesson.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Tải xuống
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment Link */}
                    {lesson.assignment_id && (
                        <Card className="border-purple-200 bg-purple-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Bài tập liên kết</h2>
                                        <p className="text-sm text-gray-600">Làm bài tập sau khi học xong bài học này</p>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <a
                                        href={`/student/assignments/${lesson.assignment_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Làm bài tập
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

