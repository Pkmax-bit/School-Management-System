"use client";

import React from "react";
import { X, Download, Calendar, Eye, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

interface TeacherLessonPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: Lesson | null;
    classroomName: string;
    onNavigateToLesson: (lessonId: string) => void;
}

export const TeacherLessonPreviewModal: React.FC<TeacherLessonPreviewModalProps> = ({
    isOpen,
    onClose,
    lesson,
    classroomName,
    onNavigateToLesson,
}) => {
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

    if (!lesson) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl mb-2">{lesson.title}</DialogTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="mb-2">
                                    {classroomName}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Preview Mode
                                </Badge>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <CardContent className="space-y-6 pt-6">
                    {/* Description */}
                    {lesson.description && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">Mô tả bài học</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">{lesson.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {lesson.content && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">Nội dung bài học</h3>
                            <div className="bg-white border rounded-lg p-4">
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{lesson.content}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Content */}
                    {(() => {
                        // Handle YouTube videos first
                        const youtubeUrls = lesson.youtube_urls || [];
                        if (youtubeUrls.length > 0) {
                            const firstVideo = typeof youtubeUrls[0] === 'string' ? youtubeUrls[0] : youtubeUrls[0].url;
                            const videoId = getYouTubeVideoId(firstVideo);

                            if (videoId) {
                                return (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Play className="w-5 h-5 text-red-500" />
                                            Video bài giảng
                                        </h3>
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
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
                        const fileUrls = lesson.file_urls || [];
                        const videoFiles = fileUrls.filter((_, index) => {
                            const fileName = (lesson.file_names || [])[index] || '';
                            return isVideoFile(fileName);
                        });

                        if (videoFiles.length > 0) {
                            return (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Play className="w-5 h-5 text-blue-500" />
                                        Video bài giảng
                                    </h3>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                                        <video
                                            src={videoFiles[0]}
                                            controls
                                            className="w-full h-full"
                                            poster="/video-placeholder.jpg"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                </div>
                            );
                        }

                        // Handle images
                        const imageFiles = fileUrls.filter((_, index) => {
                            const fileName = (lesson.file_names || [])[index] || '';
                            return isImageFile(fileName);
                        });

                        if (imageFiles.length > 0) {
                            return (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Hình ảnh bài học</h3>
                                    <div className="bg-gray-100 rounded-lg p-4 flex justify-center">
                                        <img
                                            src={imageFiles[0]}
                                            alt={lesson.title}
                                            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })()}

                    {/* File Attachments */}
                    {lesson.file_urls && lesson.file_urls.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900">Tài liệu đính kèm</h3>
                            <div className="space-y-2">
                                {lesson.file_urls.map((url, index) => {
                                    const fileName = (lesson.file_names || [])[index] || `File ${index + 1}`;
                                    const isImage = isImageFile(fileName);
                                    const isVideo = isVideoFile(fileName);

                                    return (
                                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {isImage ? (
                                                        <img src={url} alt={fileName} className="w-10 h-10 object-cover rounded" />
                                                    ) : isVideo ? (
                                                        <Play className="w-10 h-10 text-blue-500" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">
                                                                {fileName.split('.').pop()?.toUpperCase()?.substring(0, 3) || 'DOC'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
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
                                                className="flex-shrink-0"
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Tải xuống
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Lesson Info */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">Thông tin bài học</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">
                                    Tạo: {format(new Date(lesson.created_at), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                                </span>
                            </div>

                            {lesson.available_at && (
                                <div className="flex items-center gap-2">
                                    {isLessonAvailable(lesson) ? (
                                        <Eye className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                                            <span className="text-amber-600 text-xs">⏰</span>
                                        </div>
                                    )}
                                    <span className="text-gray-700">
                                        {isLessonAvailable(lesson)
                                            ? 'Đã mở cho học sinh'
                                            : `Mở: ${format(new Date(lesson.available_at), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}`
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t">
                    <p className="text-sm text-gray-600">
                        Đây là chế độ xem trước - Học sinh sẽ thấy nội dung bài học như trên
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                        <Button
                            onClick={() => {
                                onNavigateToLesson(lesson.id);
                                onClose();
                            }}
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Mở trang quản lý
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
