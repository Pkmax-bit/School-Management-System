"use client";

import { useState, useEffect } from "react";
import { Lesson } from "@/types/lesson";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FileText, Download, Trash2, Loader2, FileIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonListProps {
    classroomId: string;
    refreshTrigger: number;
}

export default function LessonList({ classroomId, refreshTrigger }: LessonListProps) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchLessons = async () => {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

        if (!token) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/classroom/${classroomId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Không thể tải danh sách bài học");
            }

            const data = await response.json();
            setLessons(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [classroomId, refreshTrigger]);

    const handleDelete = async (lessonId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài học này không?")) return;

        // Get token from localStorage
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

        if (!token) return;

        setDeletingId(lessonId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/${lessonId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Không thể xóa bài học");
            }

            // Remove from list
            setLessons(lessons.filter(l => l.id !== lessonId));
        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

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
            default:
                return <FileIcon className={`${iconClass} text-gray-500`} />;
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-500 text-sm">Đang tải danh sách bài học...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center">
                    <p className="text-red-600 font-medium">Lỗi</p>
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
                <Button
                    onClick={fetchLessons}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                >
                    Thử lại
                </Button>
            </div>
        );
    }

    // Empty State
    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <div className="text-center">
                    <p className="text-gray-600 font-medium">Chưa có bài học nào</p>
                    <p className="text-gray-500 text-sm mt-1">Hãy tải lên bài học đầu tiên cho lớp này</p>
                </div>
            </div>
        );
    }

    // Lessons List
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                        {/* Header with icon and delete button */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {getFileIcon(lesson.file_name || '')}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={lesson.title}>
                                        {lesson.title}
                                    </h4>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                        {getFileExtension(lesson.file_name || '')}
                                    </span>
                                    {lesson.file_name && (
                                        <p className="text-xs text-gray-500 truncate mt-1" title={lesson.file_name}>
                                            {lesson.file_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {(user?.role === 'teacher' || user?.role === 'admin') && (
                                <button
                                    onClick={() => handleDelete(lesson.id)}
                                    disabled={deletingId === lesson.id}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors disabled:opacity-50"
                                    title="Xóa bài học"
                                >
                                    {deletingId === lesson.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        {lesson.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={lesson.description}>
                                {lesson.description}
                            </p>
                        )}

                        {/* Image Preview */}
                        {lesson.file_url && lesson.file_name && isImageFile(lesson.file_name) && (
                            <a
                                href={lesson.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mb-4"
                            >
                                <img
                                    src={lesson.file_url}
                                    alt={lesson.title}
                                    className="w-full h-48 object-cover rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                                />
                            </a>
                        )}

                        {/* Footer with date and download */}
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                            </span>

                            <a
                                href={lesson.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
