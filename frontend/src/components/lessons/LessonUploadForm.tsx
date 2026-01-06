"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  Youtube,
  Calendar,
  Clock
} from "lucide-react";
import { uploadLessonFile } from "@/lib/uploadToSupabase";
import { DatePicker } from "@/components/ui/date-picker";

interface LessonUploadFormProps {
  classroomId: string;
  classrooms: Array<{ id: string; name: string; code?: string }>;
  onUploadSuccess: () => void;
  editingLesson?: any;
  onCancelEdit?: () => void;
}

const LessonUploadForm: React.FC<LessonUploadFormProps> = ({
  classroomId,
  classrooms,
  onUploadSuccess,
  editingLesson,
  onCancelEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<{url: string, title: string}[]>([]);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [newYoutubeTitle, setNewYoutubeTitle] = useState("");
  const [availableAt, setAvailableAt] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  React.useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setDescription(editingLesson.description || "");
      // For editing, we don't repopulate files since they are already uploaded
      // Users would need to add additional files or keep existing ones
      // Handle both old string format and new object format
      const youtubeUrls = editingLesson.youtube_urls || [];
      if (youtubeUrls.length > 0 && typeof youtubeUrls[0] === 'string') {
        // Convert old format to new format
        setYoutubeUrls(youtubeUrls.map((url: string, index: number) => ({
          url,
          title: `Video ${index + 1}`
        })));
      } else {
        // Already in new format
        setYoutubeUrls(youtubeUrls.map((video: any) => ({
          url: video.url || video,
          title: video.title || `Video ${(youtubeUrls as any[]).indexOf(video) + 1}`
        })));
      }
      setAvailableAt(editingLesson.available_at ? new Date(editingLesson.available_at).toISOString().split('T')[0] : "");
      setSortOrder(editingLesson.sort_order || undefined);
      setIsExpanded(true);
    }
  }, [editingLesson]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFiles([]);
    setYoutubeUrls([]);
    setNewYoutubeUrl("");
    setNewYoutubeTitle("");
    setAvailableAt("");
    setSortOrder(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Check total file size (50MB limit per file)
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File ${oversizedFiles[0].name} vượt quá 50MB`);
      return;
    }

    // Add new files to existing ones
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const addYoutubeUrl = () => {
    if (newYoutubeUrl.trim()) {
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
      if (!youtubeRegex.test(newYoutubeUrl.trim())) {
        setError("URL YouTube không hợp lệ");
        return;
      }

      setYoutubeUrls([...youtubeUrls, {
        url: newYoutubeUrl.trim(),
        title: newYoutubeTitle.trim() || `Video ${youtubeUrls.length + 1}`
      }]);
      setNewYoutubeUrl("");
      setNewYoutubeTitle("");
      setError(null);
    }
  };

  const removeYoutubeUrl = (index: number) => {
    setYoutubeUrls(youtubeUrls.filter((_, i) => i !== index));
  };

  const updateYoutubeTitle = (index: number, title: string) => {
    const updated = [...youtubeUrls];
    updated[index] = { ...updated[index], title };
    setYoutubeUrls(updated);
  };

  const extractYoutubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề bài học");
      return;
    }

    if (selectedFiles.length === 0 && !description.trim() && youtubeUrls.length === 0) {
      setError("Vui lòng tải lên file, nhập mô tả hoặc thêm video YouTube");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload all selected files
      const uploadedFiles = [];
      for (const file of selectedFiles) {
        const uploadResult = await uploadLessonFile(file, classroomId);
        if (uploadResult.error) {
          throw new Error(`Upload failed for ${file.name}: ${uploadResult.error}`);
        }
        uploadedFiles.push({
          url: uploadResult.url,
          name: file.name,
          path: uploadResult.path,
          size: file.size,
          type: file.type
        });
      }

      // Prepare lesson data with multiple files
      let finalFileUrls: string[] = [];
      let finalFileNames: string[] = [];
      let finalStoragePaths: string[] = [];

      if (editingLesson) {
        // For updates, append new files to existing ones
        const existingUrls = editingLesson.file_urls || (editingLesson.file_url ? [editingLesson.file_url] : []);
        const existingNames = editingLesson.file_names || (editingLesson.file_name ? [editingLesson.file_name] : []);
        const existingPaths = editingLesson.storage_paths || (editingLesson.storage_path ? [editingLesson.storage_path] : []);

        finalFileUrls = [...existingUrls, ...uploadedFiles.map(f => f.url)];
        finalFileNames = [...existingNames, ...uploadedFiles.map(f => f.name)];
        finalStoragePaths = [...existingPaths, ...uploadedFiles.map(f => f.path)];
      } else {
        // For new lessons, use only uploaded files
        finalFileUrls = uploadedFiles.map(f => f.url);
        finalFileNames = uploadedFiles.map(f => f.name);
        finalStoragePaths = uploadedFiles.map(f => f.path);
      }

      const lessonData = {
        classroom_id: classroomId,
        title: title.trim(),
        description: description.trim() || null,
        file_urls: finalFileUrls,
        file_names: finalFileNames,
        storage_paths: finalStoragePaths,
        youtube_urls: youtubeUrls.length > 0 ? youtubeUrls.map(v => ({ url: v.url, title: v.title })) : [],
        available_at: availableAt ? new Date(availableAt).toISOString() : null,
        sort_order: sortOrder || 0,
        shared_classroom_ids: editingLesson?.shared_classroom_ids || [],
      };

      // Get auth token
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      // Create or update lesson record
      const method = editingLesson ? "PUT" : "POST";
      const url = editingLesson
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/${editingLesson.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Không thể ${editingLesson ? 'cập nhật' : 'tạo'} bài học`);
      }

      // Success
      if (editingLesson && onCancelEdit) {
        onCancelEdit();
      }
      resetForm();
      setIsExpanded(false);
      onUploadSuccess();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Có lỗi xảy ra khi tải lên bài học");
    } finally {
      setIsUploading(false);
    }
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

  if (!isExpanded) {
    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tải lên bài học mới
            </h3>
            <p className="text-gray-600 mb-4">
              Upload file, thêm mô tả hoặc chia sẻ video YouTube
            </p>
            <Button
              onClick={() => setIsExpanded(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm bài học
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            {editingLesson ? "Chỉnh sửa bài học" : "Tải lên bài học mới"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {editingLesson && onCancelEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                className="text-gray-600"
              >
                Hủy chỉnh sửa
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setIsExpanded(false);
                if (editingLesson && onCancelEdit) {
                  onCancelEdit();
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Tiêu đề bài học <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài học..."
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả bài học
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết về bài học..."
              className="mt-1 min-h-20"
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-sm font-medium">File bài học</Label>
            <div className="mt-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} đã chọn`
                      : "Chọn file để tải lên"
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, PowerPoint, Excel, TXT, ZIP, hình ảnh (tối đa 50MB)
                  </p>
                </div>
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {selectedFiles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Xóa tất cả
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* YouTube URLs */}
          <div>
            <Label className="text-sm font-medium">Video YouTube</Label>
            <div className="mt-1 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Input
                    value={newYoutubeTitle}
                    onChange={(e) => setNewYoutubeTitle(e.target.value)}
                    placeholder="Tên video (tùy chọn)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addYoutubeUrl}
                    variant="outline"
                    size="sm"
                    disabled={!newYoutubeUrl.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {youtubeUrls.length > 0 && (
                <div className="space-y-2">
                  {youtubeUrls.map((video, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-start gap-3">
                        <Youtube className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Input
                            value={video.title}
                            onChange={(e) => updateYoutubeTitle(index, e.target.value)}
                            placeholder="Tên video"
                            className="text-sm font-medium bg-white"
                          />
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 truncate">
                              ID: {extractYoutubeId(video.url)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{video.url}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeYoutubeUrl(index)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ngày mở bài học
              </Label>
              <div className="mt-1">
                <DatePicker
                  value={availableAt}
                  onChange={setAvailableAt}
                  placeholder="Chọn ngày mở bài học..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu muốn bài học mở ngay lập tức
              </p>
            </div>

            <div>
              <Label htmlFor="sortOrder" className="text-sm font-medium">
                Thứ tự sắp xếp
              </Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder || ""}
                onChange={(e) => setSortOrder(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
                className="mt-1"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số nhỏ hơn sẽ hiển thị trước
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsExpanded(false);
              }}
              disabled={isUploading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 min-w-32"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Tải lên
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LessonUploadForm;