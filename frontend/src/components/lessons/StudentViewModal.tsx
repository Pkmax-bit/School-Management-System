"use client";

import React, { useState } from "react";
import { X, Play, FileText, Download, Calendar, Lock, Eye } from "lucide-react";
import { Lesson } from "@/types/lesson";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  classroomName: string;
  classroomId: string;
}

export const StudentViewModal: React.FC<StudentViewModalProps> = ({
  isOpen,
  onClose,
  lessons,
  classroomName,
  classroomId,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const isImageFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return !!ext && ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  };

  // Check if lesson is available
  const isLessonAvailable = (lesson: Lesson): boolean => {
    if (!lesson.available_at) return true;
    const now = new Date();
    const availableAt = new Date(lesson.available_at);
    return now >= availableAt;
  };

  const getYouTubeVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  if (!isOpen) return null;

  const currentLesson = selectedLesson || lessons[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Xem bài học như học sinh
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

        <div className="flex h-[calc(90vh-140px)]">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Video Player Area */}
            <div className="flex-1 p-6">
              {currentLesson && (
                <div className="h-full flex flex-col space-y-4">
                  {/* Video Player */}
                  <div className="flex-1 bg-black rounded-lg overflow-hidden">
                    {(() => {
                      // Handle YouTube videos first
                      const youtubeUrls = currentLesson.youtube_urls || [];
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
                      const fileUrls = currentLesson.file_urls || [];
                      const videoFiles = fileUrls.filter((_, index) => {
                        const fileName = (currentLesson.file_names || [])[index] || '';
                        const ext = fileName.split('.').pop()?.toLowerCase();
                        return ext && ['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext);
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

                      // Fallback: Show image or placeholder
                      const imageFiles = fileUrls.filter((_, index) => {
                        const fileName = (currentLesson.file_names || [])[index] || '';
                        return isImageFile(fileName);
                      });

                      if (imageFiles.length > 0) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <img
                              src={imageFiles[0]}
                              alt={currentLesson.title}
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

                  {/* Lesson Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-semibold text-gray-800">
                        {currentLesson.title}
                      </h4>
                      {currentLesson.available_at && !isLessonAvailable(currentLesson) && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                          <Lock className="w-4 h-4" />
                          <span>
                            Mở vào: {format(new Date(currentLesson.available_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                        </div>
                      )}
                    </div>

                    {currentLesson.description && (
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {currentLesson.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(currentLesson.created_at), "dd/MM/yyyy", { locale: vi })}
                        </span>

                        {currentLesson.youtube_urls && currentLesson.youtube_urls.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            {currentLesson.youtube_urls.length} video
                          </span>
                        )}
                      </div>

                      {/* Download buttons */}
                      {isLessonAvailable(currentLesson) && (
                        <div className="flex gap-2">
                          {currentLesson.file_urls && currentLesson.file_urls.length > 0 && (
                            <button
                              onClick={() => {
                                if (currentLesson.file_urls!.length === 1) {
                                  window.open(currentLesson.file_urls![0], '_blank');
                                } else {
                                  currentLesson.file_urls!.forEach(url => window.open(url, '_blank'));
                                }
                              }}
                              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Tải xuống ({currentLesson.file_urls!.length})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Lessons List */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h4 className="font-semibold text-gray-800">
                Danh sách bài học ({lessons.length})
              </h4>
            </div>

            <div className="p-2">
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có bài học</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={
                        selectedLesson?.id === lesson.id
                          ? 'p-3 rounded-lg cursor-pointer transition-all bg-blue-100 border-blue-300 border'
                          : 'p-3 rounded-lg cursor-pointer transition-all bg-white hover:bg-gray-100 border border-gray-200'
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={
                            selectedLesson?.id === lesson.id
                              ? 'w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-600'
                              : 'w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gray-400'
                          }
                        />

                        <div className="flex-1 min-w-0">
                          <h5
                            className={
                              selectedLesson?.id === lesson.id
                                ? 'font-medium text-sm line-clamp-2 text-blue-800'
                                : 'font-medium text-sm line-clamp-2 text-gray-800'
                            }
                          >
                            {lesson.title}
                          </h5>

                          {selectedLesson?.id === lesson.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = `/teacher/lessons/${classroomId}/${lesson.id}`;
                                window.open(url, '_blank');
                              }}
                              className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
                            >
                              Học bài →
                            </button>
                          )}

                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(lesson.created_at), "dd/MM", { locale: vi })}</span>

                            {lesson.youtube_urls && lesson.youtube_urls.length > 0 && (
                              <>
                                <span>•</span>
                                <Play className="w-3 h-3" />
                                <span>{lesson.youtube_urls.length}</span>
                              </>
                            )}

                            {lesson.available_at && !isLessonAvailable(lesson) && (
                              <>
                                <span>•</span>
                                <Lock className="w-3 h-3" />
                              </>
                            )}
                          </div>

                          {lesson.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};