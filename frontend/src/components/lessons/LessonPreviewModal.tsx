"use client";

import React from "react";
import { X, Download, FileText, Video, Calendar, Lock, Eye } from "lucide-react";
import { Lesson } from "@/types/lesson";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface LessonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  classroomName: string;
  classroomId: string;
}

const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  isOpen,
  onClose,
  lessons,
  classroomName,
  classroomId,
}) => {
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
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  // Check if lesson is available (available_at is null or has passed)
  const isLessonAvailable = (lesson: Lesson): boolean => {
    if (!lesson.available_at) return true; // No restriction, available immediately
    const now = new Date();
    const availableAt = new Date(lesson.available_at);
    return now >= availableAt;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Xem trước bài học - Học sinh
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Lớp: {classroomName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 font-medium">Chưa có bài học nào</p>
                <p className="text-gray-500 text-sm mt-1">Hãy tải lên bài học đầu tiên cho lớp này</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  {/* File Icon and Title */}
                  <div className="flex items-start gap-3 mb-3">
                    {getFileIcon(lesson.file_name || '')}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={lesson.title}>
                        {lesson.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          {getFileExtension(lesson.file_name || '')}
                        </span>
                      </div>
                      {lesson.file_name && (
                        <p className="text-xs text-gray-500 truncate mt-1" title={lesson.file_name}>
                          {lesson.file_name}
                        </p>
                      )}
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

                  {/* File/Image Previews */}
                  {(() => {
                    // Handle both single files (backward compatibility) and multiple files
                    const fileUrls = lesson.file_urls || (lesson.file_url ? [lesson.file_url] : []);
                    const fileNames = lesson.file_names || (lesson.file_name ? [lesson.file_name] : []);
                    const imageFiles = fileUrls.filter((_, index) => {
                      const fileName = fileNames[index] || '';
                      return isImageFile(fileName);
                    });

                    // Show first image if there are image files
                    if (imageFiles.length > 0) {
                      return (
                        <a
                          href={imageFiles[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mb-4"
                        >
                          <img
                            src={imageFiles[0]}
                            alt={lesson.title}
                            className="w-full h-48 object-cover rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                          />
                        </a>
                      );
                    }

                    // Show file count if there are files but no images
                    if (fileUrls.length > 0) {
                      return (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{fileUrls.length} file{fileUrls.length > 1 ? 's' : ''} đính kèm</span>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* YouTube Videos */}
                  {lesson.youtube_urls && lesson.youtube_urls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Video bài giảng</p>
                      <div className="space-y-2">
                        {lesson.youtube_urls.map((video, index) => {
                          // Handle both string and object formats
                          const videoUrl = typeof video === 'string' ? video : video.url;
                          const videoTitle = typeof video === 'string' ? `Video ${index + 1}` : (video.title || `Video ${index + 1}`);

                          return (
                            <a
                              key={index}
                              href={videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              <span className="text-sm font-medium">{videoTitle}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer with date and download */}
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(lesson.created_at), "dd/MM/yyyy", { locale: vi })}
                    </span>

                    {isLessonAvailable(lesson) ? (
                      (() => {
                        // Handle multiple files
                        const fileUrls = lesson.file_urls || (lesson.file_url ? [lesson.file_url] : []);

                        if (fileUrls.length === 0) {
                          return null;
                        }

                        if (fileUrls.length === 1) {
                          // Single file - direct download
                          return (
                            <a
                              href={fileUrls[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
                              title="Tải xuống"
                            >
                              <Download className="w-4 h-4" />
                              Tải xuống
                            </a>
                          );
                        } else {
                          // Multiple files
                          return (
                            <button
                              onClick={() => {
                                // Open all files in new tabs
                                fileUrls.forEach(url => window.open(url, '_blank'));
                              }}
                              className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
                              title={`Tải xuống ${fileUrls.length} files`}
                            >
                              <Download className="w-4 h-4" />
                              Tải xuống ({fileUrls.length})
                            </button>
                          );
                        }
                      })()
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPreviewModal;