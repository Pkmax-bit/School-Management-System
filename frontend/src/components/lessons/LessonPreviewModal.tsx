"use client";

import { useMemo, useState } from "react";
import { Lesson } from "@/types/lesson";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { X, Download, FileText, FileIcon, BookOpen, Calendar, Clock, CheckCircle2, Play, ExternalLink, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LessonPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessons: Lesson[];
    classroomName: string;
    classroomId: string;
}

export default function LessonPreviewModal({ isOpen, onClose, lessons, classroomName, classroomId }: LessonPreviewModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [savingProgress, setSavingProgress] = useState<string | null>(null);
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    
    // Check if current user is admin or teacher (preview mode)
    const isPreviewMode = user?.role === 'admin' || user?.role === 'teacher';
    
    // Check if lesson is available (available_at is null or has passed)
    const isLessonAvailable = (lesson: Lesson): boolean => {
        if (!lesson.available_at) return true; // No restriction, available immediately
        const now = new Date();
        const availableAt = new Date(lesson.available_at);
        return now >= availableAt;
    };

    // Filter and sort lessons
    // In preview mode (admin/teacher), show ALL lessons
    // In student view, only show available lessons
    const studentViewLessons = useMemo(() => {
        const filteredLessons = isPreviewMode 
            ? lessons // Show all lessons in preview mode
            : lessons.filter(lesson => isLessonAvailable(lesson)); // Only show available lessons for students
        
        return filteredLessons.sort((a, b) => {
            // Sort by sort_order (ascending), then by created_at (descending)
            const orderA = a.sort_order ?? 0;
            const orderB = b.sort_order ?? 0;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [lessons, isPreviewMode]);

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const isImageFile = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconClass = "w-6 h-6";

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

    const getFileTypeColor = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'doc':
            case 'docx':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'xls':
            case 'xlsx':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'ppt':
            case 'pptx':
                return 'bg-orange-50 border-orange-200 text-orange-700';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const toggleLesson = (lessonId: string) => {
        setExpandedLessons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lessonId)) {
                newSet.delete(lessonId);
            } else {
                newSet.add(lessonId);
            }
            return newSet;
        });
    };

    const handleStartLesson = async (lessonId: string) => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
        if (!token) {
            console.warn("No token available for saving progress");
            // Still allow viewing the lesson file even without saving progress
            const lesson = studentViewLessons.find(l => l.id === lessonId);
            if (lesson) {
                window.open(lesson.file_url, '_blank');
            }
            return;
        }

        setSavingProgress(lessonId);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/${lessonId}/start`,
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
                const lesson = studentViewLessons.find(l => l.id === lessonId);
                if (lesson) {
                    window.open(lesson.file_url, '_blank');
                }
            } else if (response.status === 401 || response.status === 403) {
                // Token expired or invalid - don't clear token in preview mode
                // Just log and allow viewing the file
                console.warn("Authentication failed when saving progress, but allowing file view");
                const lesson = studentViewLessons.find(l => l.id === lessonId);
                if (lesson) {
                    window.open(lesson.file_url, '_blank');
                }
            } else {
                // Other errors - still allow viewing the file
                console.error("Failed to save progress:", response.status, response.statusText);
                const lesson = studentViewLessons.find(l => l.id === lessonId);
                if (lesson) {
                    window.open(lesson.file_url, '_blank');
                }
            }
        } catch (err) {
            console.error("Failed to save progress:", err);
            // Still allow viewing the lesson file even if saving progress fails
            const lesson = studentViewLessons.find(l => l.id === lessonId);
            if (lesson) {
                window.open(lesson.file_url, '_blank');
            }
        } finally {
            setSavingProgress(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            {/* Header - Full width, LMS style */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Tài liệu học tập</h1>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        {classroomName}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-700">
                                    {studentViewLessons.length} bài học
                                </p>
                                <p className="text-xs text-gray-500">
                                    {lessons.length - studentViewLessons.length > 0 && (
                                        <span className="text-amber-600">
                                            {lessons.length - studentViewLessons.length} bài chưa mở
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Button
                                onClick={onClose}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <X className="w-4 h-4" />
                                Đóng
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Full screen */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {studentViewLessons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-gray-400" />
                            </div>
                            <div className="text-center max-w-md">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài học nào được mở</h3>
                                <p className="text-gray-500">
                                    Học sinh sẽ không thấy bài học nào cho đến khi đến thời gian mở đã được thiết lập.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Progress Section */}
                            <div className="mb-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Tiến độ học tập</h2>
                                        <span className="text-sm font-medium text-blue-600">
                                            {studentViewLessons.length} / {lessons.length} bài học
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${(studentViewLessons.length / lessons.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Lessons List - Horizontal Layout (1 bài 1 hàng) */}
                            <div className="space-y-4">
                                {studentViewLessons.map((lesson, index) => {
                                    const isExpanded = expandedLessons.has(lesson.id);
                                    return (
                                        <div
                                            key={lesson.id}
                                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Summary Row - Always Visible */}
                                            <div className={`p-5 ${!isLessonAvailable(lesson) && isPreviewMode ? 'bg-amber-50/30 border-l-4 border-amber-400' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    {/* Thứ tự */}
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                                                            !isLessonAvailable(lesson) && isPreviewMode
                                                                ? 'bg-amber-50 border-amber-300'
                                                                : 'bg-blue-50 border-blue-200'
                                                        }`}>
                                                            <span className={`text-lg font-bold ${
                                                                !isLessonAvailable(lesson) && isPreviewMode
                                                                    ? 'text-amber-600'
                                                                    : 'text-blue-600'
                                                            }`}>
                                                                {typeof lesson.sort_order === "number" && !Number.isNaN(lesson.sort_order) 
                                                                    ? lesson.sort_order 
                                                                    : index + 1}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Icon và File Type */}
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 flex items-center justify-center">
                                                            {getFileIcon(lesson.file_name || '')}
                                                        </div>
                                                    </div>

                                                    {/* Thông tin chính */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div 
                                                                className="flex-1 min-w-0 cursor-pointer hover:text-blue-600 transition-colors"
                                                                onClick={() => {
                                                                    // Pass lesson data via sessionStorage for preview mode
                                                                    if (isPreviewMode) {
                                                                        sessionStorage.setItem(`lesson_preview_${lesson.id}`, JSON.stringify(lesson));
                                                                    }
                                                                    // Route based on user role
                                                                    const route = user?.role === 'admin' 
                                                                        ? `/admin/lessons/${lesson.id}`
                                                                        : user?.role === 'teacher'
                                                                        ? `/teacher/lessons/${lesson.id}`
                                                                        : `/student/lessons/${lesson.id}`;
                                                                    router.push(route);
                                                                }}
                                                            >
                                                                <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
                                                                    {lesson.title}
                                                                </h3>
                                                                {lesson.description && (
                                                                    <p className="text-sm text-gray-600 line-clamp-1">
                                                                        {lesson.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                                {/* Ngày */}
                                                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>
                                                                        {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                                                                    </span>
                                                                </div>

                                                                {/* Trạng thái bài học (chưa mở) - chỉ hiển thị trong preview mode */}
                                                                {!isLessonAvailable(lesson) && isPreviewMode && (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <span>Chưa mở</span>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Có bài tập hay không */}
                                                                {lesson.assignment_id ? (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                                        <BookOpen className="w-3.5 h-3.5" />
                                                                        <span>Có bài tập</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                                                        <span>Không có bài tập</span>
                                                                    </div>
                                                                )}

                                                                {/* View Detail Button */}
                                                                <button
                                                                    onClick={() => {
                                                                        // Pass lesson data via sessionStorage for preview mode
                                                                        if (isPreviewMode) {
                                                                            sessionStorage.setItem(`lesson_preview_${lesson.id}`, JSON.stringify(lesson));
                                                                        }
                                                                        // Route based on user role
                                                                        const route = user?.role === 'admin' 
                                                                            ? `/admin/lessons/${lesson.id}`
                                                                            : user?.role === 'teacher'
                                                                            ? `/teacher/lessons/${lesson.id}`
                                                                            : `/student/lessons/${lesson.id}`;
                                                                        router.push(route);
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    <span>Xem</span>
                                                                </button>

                                                                {/* Expand Icon */}
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleLesson(lesson.id);
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="w-5 h-5" />
                                                                    ) : (
                                                                        <ChevronDown className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details - Hiển thị khi click */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-200 bg-gray-50">
                                                    <div className="p-6 space-y-4">
                                                        {/* Mô tả đầy đủ */}
                                                        {lesson.description && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Mô tả:</h4>
                                                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                                    {lesson.description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* File Info */}
                                                        {lesson.file_name && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FileIcon className="w-4 h-4" />
                                                                <span>{lesson.file_name}</span>
                                                                <span className="text-xs text-gray-400">
                                                                    ({getFileExtension(lesson.file_name)})
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Image Preview */}
                                                        {lesson.file_url && lesson.file_name && isImageFile(lesson.file_name) && (
                                                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                                                <img
                                                                    src={lesson.file_url}
                                                                    alt={lesson.title}
                                                                    className="w-full max-h-64 object-contain bg-white"
                                                                />
                                                            </div>
                                                        )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Pass lesson data via sessionStorage for preview mode
                                                        if (isPreviewMode) {
                                                            sessionStorage.setItem(`lesson_preview_${lesson.id}`, JSON.stringify(lesson));
                                                        }
                                                        // Route based on user role
                                                        const route = user?.role === 'admin' 
                                                            ? `/admin/lessons/${lesson.id}`
                                                            : user?.role === 'teacher'
                                                            ? `/teacher/lessons/${lesson.id}`
                                                            : `/student/lessons/${lesson.id}`;
                                                        router.push(route);
                                                    }}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    <span>Xem chi tiết</span>
                                                </button>
                                                <a
                                                    href={lesson.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-5 rounded-lg transition-all duration-200 border border-gray-300 hover:bg-gray-50"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span>Tải xuống</span>
                                                </a>
                                            </div>

                                                        {/* Link bài tập - Ở cuối */}
                                                        {lesson.assignment_id && (
                                                            <div className="pt-4 border-t border-gray-200">
                                                                <a
                                                                    href={`/student/assignments/${lesson.assignment_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex items-center justify-center gap-2 w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 px-5 rounded-lg transition-all duration-200 border border-purple-200"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    <span>Làm bài tập liên kết</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Locked Lessons Info - chỉ hiển thị khi không phải preview mode */}
                            {!isPreviewMode && lessons.length > studentViewLessons.length && (
                                <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-amber-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-amber-900 mb-2">
                                                {lessons.length - studentViewLessons.length} bài học đang chờ mở
                                            </h3>
                                            <p className="text-sm text-amber-800">
                                                Các bài học này sẽ tự động hiển thị cho học sinh khi đến thời gian mở đã được giáo viên thiết lập.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Preview Mode Info - chỉ hiển thị trong preview mode */}
                            {isPreviewMode && (
                                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <Eye className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                                Chế độ xem trước
                                            </h3>
                                            <p className="text-sm text-blue-800">
                                                Bạn đang xem tất cả bài học (bao gồm cả những bài chưa mở). Học sinh sẽ chỉ thấy những bài học đã đến thời gian mở.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Footer - Optional */}
            <footer className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs text-gray-500">
                        Xem trước giao diện học sinh • {classroomName}
                    </p>
                </div>
            </footer>
        </div>
    );
}
