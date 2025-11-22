"use client";

import { useState, useEffect, useMemo } from "react";
import { Lesson } from "@/types/lesson";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FileText, Download, Trash2, Loader2, FileIcon, AlertCircle, Copy, CheckSquare, Square, X, Clock, Lock, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyLessonModal } from "./CopyLessonModal";
import LessonPreviewModal from "./LessonPreviewModal";

interface LessonListProps {
    classroomId: string;
    refreshTrigger: number;
    classrooms: Array<{ id: string; name: string; code?: string }>;
    onEditLesson?: (lesson: Lesson | null) => void;
}

export default function LessonList({ classroomId, refreshTrigger, classrooms, onEditLesson }: LessonListProps) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { user } = useAuth();

    // Selection states
    const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const classroomLookup = useMemo(() => {
        const map = new Map<string, { name: string; code?: string }>();
        classrooms.forEach((cls) => {
            map.set(cls.id, { name: cls.name, code: cls.code });
        });
        return map;
    }, [classrooms]);

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
            // Sort lessons by sort_order (ascending), then by created_at (descending)
            const sortedData = [...data].sort((a, b) => {
                const orderA = a.sort_order ?? 0;
                const orderB = b.sort_order ?? 0;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setLessons(sortedData);
            setSelectedLessons(new Set()); // Reset selection on refresh
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

            // Remove from selection if selected
            if (selectedLessons.has(lessonId)) {
                const newSelected = new Set(selectedLessons);
                newSelected.delete(lessonId);
                setSelectedLessons(newSelected);
            }
        } catch (err: any) {
            alert(`Lỗi: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    // Selection Handlers
    const toggleSelection = (lessonId: string) => {
        const newSelected = new Set(selectedLessons);
        if (newSelected.has(lessonId)) {
            newSelected.delete(lessonId);
        } else {
            newSelected.add(lessonId);
        }
        setSelectedLessons(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedLessons.size === lessons.length) {
            setSelectedLessons(new Set());
        } else {
            setSelectedLessons(new Set(lessons.map(l => l.id)));
        }
    };

    const handleCopyLessons = async (targetClassroomId: string) => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
        if (!token) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/copy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    lesson_ids: Array.from(selectedLessons),
                    target_classroom_id: targetClassroomId
                }),
            });

            if (!response.ok) {
                throw new Error("Không thể sao chép bài học");
            }

            const result = await response.json();
            alert(`Đã sao chép thành công ${result.copied_count} bài học!`);
            setSelectedLessons(new Set()); // Clear selection
        } catch (err: any) {
            alert(`Lỗi sao chép: ${err.message}`);
            throw err; // Let modal handle error state
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

    // Check if lesson is available (available_at is null or has passed)
    const isLessonAvailable = (lesson: Lesson): boolean => {
        if (!lesson.available_at) return true; // No restriction, available immediately
        const now = new Date();
        const availableAt = new Date(lesson.available_at);
        return now >= availableAt;
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
            {/* Selection Toolbar */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        {selectedLessons.size === lessons.length && lessons.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                        )}
                        {selectedLessons.size > 0 ? `Đã chọn ${selectedLessons.size}` : 'Chọn tất cả'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <Button
                            onClick={() => setIsPreviewModalOpen(true)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Xem trước (Học sinh)
                        </Button>
                    )}
                    {selectedLessons.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                            <Button
                                onClick={() => setIsCopyModalOpen(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Gán cho lớp khác
                            </Button>
                            <Button
                                onClick={() => setSelectedLessons(new Set())}
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                                Hủy
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className={`bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 group relative ${selectedLessons.has(lesson.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200'
                            }`}
                    >
                        {/* Checkbox Overlay */}
                        <div className="absolute top-3 right-3 z-10">
                            <button
                                onClick={() => toggleSelection(lesson.id)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {selectedLessons.has(lesson.id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600 bg-white rounded" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                )}
                            </button>
                        </div>

                        {/* Header with icon, meta info and delete button */}
                        <div className="flex justify-between items-start mb-3 pr-8">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {getFileIcon(lesson.file_name || '')}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={lesson.title}>
                                        {lesson.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                            {getFileExtension(lesson.file_name || '')}
                                        </span>
                                        {typeof lesson.sort_order === "number" && !Number.isNaN(lesson.sort_order) && (
                                            <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded">
                                                Thứ tự: {lesson.sort_order}
                                            </span>
                                        )}
                                    </div>
                                    {lesson.file_name && (
                                        <p className="text-xs text-gray-500 truncate mt-1" title={lesson.file_name}>
                                            {lesson.file_name}
                                        </p>
                                    )}
                                    {lesson.classroom_id !== classroomId && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Nguồn: {classroomLookup.get(lesson.classroom_id)?.name || "Lớp khác"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {lesson.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={lesson.description}>
                                {lesson.description}
                            </p>
                        )}

                        {/* Available At Status */}
                        {lesson.available_at && !isLessonAvailable(lesson) && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-amber-800 mb-1">Bài học chưa mở</p>
                                        <p className="text-xs text-amber-700">
                                            Sẽ mở vào: {format(new Date(lesson.available_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shared classrooms */}
                        {lesson.shared_classroom_ids && lesson.shared_classroom_ids.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chia sẻ với</p>
                                <div className="flex flex-wrap gap-2">
                                    {lesson.shared_classroom_ids.map((clsId) => (
                                        <span
                                            key={clsId}
                                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        >
                                            {classroomLookup.get(clsId)?.name || "Lớp đã xoá"}
                                        </span>
                                    ))}
                                </div>
                            </div>
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

                            <div className="flex items-center gap-2">
                                {(user?.role === 'teacher' || user?.role === 'admin') && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onEditLesson) {
                                                    onEditLesson(lesson);
                                                }
                                            }}
                                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                            title="Sửa bài học"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lesson.id)}
                                            disabled={deletingId === lesson.id}
                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                            title="Xóa bài học"
                                        >
                                            {deletingId === lesson.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </>
                                )}
                                {(user?.role === 'teacher' || user?.role === 'admin' || isLessonAvailable(lesson)) ? (
                                    <a
                                        href={lesson.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
                                        title="Tải xuống"
                                    >
                                        <Download className="w-4 h-4" />
                                        Tải xuống
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-400 font-medium py-1.5 px-3 rounded-lg cursor-not-allowed"
                                        title={`Bài học sẽ mở vào ${format(new Date(lesson.available_at!), "dd/MM/yyyy HH:mm", { locale: vi })}`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        Chưa mở
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CopyLessonModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onCopy={handleCopyLessons}
                currentClassroomId={classroomId}
                selectedCount={selectedLessons.size}
            />

            <LessonPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                lessons={lessons}
                classroomName={classroomLookup.get(classroomId)?.name || "Lớp học"}
                classroomId={classroomId}
            />

        </div>
    );
}
