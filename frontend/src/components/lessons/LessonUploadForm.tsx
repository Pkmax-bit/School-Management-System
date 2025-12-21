"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { LessonCreate, Assignment, Lesson, LessonFile } from "@/types/lesson";
import { FileText, AlignLeft, Upload, Loader2, Clock, BookOpen, X, ExternalLink, Download, Sparkles, Hash, Calendar, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LessonUploadFormProps {
    classroomId: string;
    classrooms: Array<{ id: string; name: string; code?: string }>;
    onUploadSuccess: () => void;
    editingLesson?: Lesson | null;
    onCancelEdit?: () => void;
}

export default function LessonUploadForm({ classroomId, classrooms, onUploadSuccess, editingLesson, onCancelEdit }: LessonUploadFormProps) {
    const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<LessonCreate>();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [sharedClassrooms, setSharedClassrooms] = useState<string[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
    const [nextSortOrder, setNextSortOrder] = useState<number>(1);

    const selectedFiles = watch("files");

    // Fetch assignments and get next sort_order
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            if (!token) return;

            setIsLoadingAssignments(true);
            try {
                // Fetch assignments
                const assignmentsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/classroom/${classroomId}/assignments`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (assignmentsResponse.ok) {
                    const assignmentsData = await assignmentsResponse.json();
                    setAssignments(assignmentsData);
                }

                // Fetch lessons to get max sort_order
                const lessonsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/classroom/${classroomId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (lessonsResponse.ok) {
                    const lessonsData = await lessonsResponse.json();
                    if (lessonsData && lessonsData.length > 0) {
                        // Find max sort_order
                        const maxSortOrder = Math.max(
                            ...lessonsData.map((l: any) => l.sort_order ?? 0)
                        );
                        const nextOrder = maxSortOrder + 1;
                        setNextSortOrder(nextOrder);
                        setValue("sort_order", nextOrder);
                    } else {
                        setNextSortOrder(1);
                        setValue("sort_order", 1);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        fetchData();
    }, [classroomId]);

    // Load lesson data when editing
    useEffect(() => {
        if (editingLesson) {
            // Convert available_at to datetime-local format
            let availableAtLocal = "";
            if (editingLesson.available_at) {
                const date = new Date(editingLesson.available_at);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                availableAtLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
            }

            reset({
                title: editingLesson.title,
                description: editingLesson.description || "",
                sort_order: editingLesson.sort_order ?? nextSortOrder,
                available_at: availableAtLocal,
            });
            setSelectedAssignmentId(editingLesson.assignment_id || "");
            setSharedClassrooms(editingLesson.shared_classroom_ids || []);
        } else {
            // Reset form for new lesson
            reset();
            setSharedClassrooms([]);
            setSelectedAssignmentId("");
            setValue("sort_order", nextSortOrder);
        }
    }, [editingLesson, nextSortOrder, reset, setValue]);

    const onSubmit = async (data: LessonCreate) => {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

        if (!token) {
            setUploadError('Bạn cần đăng nhập để tải lên bài học');
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        // If editing, use PUT request
        if (editingLesson) {
            const formData = new FormData();
            formData.append("title", data.title);
            if (data.description !== undefined) {
                formData.append("description", data.description || "");
            }
            if (typeof data.sort_order === "number" && !Number.isNaN(data.sort_order)) {
                formData.append("sort_order", data.sort_order.toString());
            }
            if (data.available_at) {
                const localDateTime = new Date(data.available_at);
                const offsetMs = localDateTime.getTimezoneOffset() * 60000;
                const offsetHours = Math.floor(Math.abs(offsetMs) / 3600000);
                const offsetMinutes = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
                const offsetSign = offsetMs <= 0 ? '+' : '-';
                const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
                const isoString = `${data.available_at}:00${offsetString}`;
                formData.append("available_at", isoString);
            } else {
                formData.append("available_at", "");
            }
            if (selectedAssignmentId) {
                formData.append("assignment_id", selectedAssignmentId);
            } else {
                formData.append("assignment_id", "");
            }
            if (sharedClassrooms.length > 0) {
                sharedClassrooms.forEach((id) => formData.append("shared_classroom_ids", id));
            }
            // Only append files if new files are selected
            const fileList = data.files as unknown as FileList;
            if (fileList && fileList.length > 0) {
                for (let i = 0; i < fileList.length; i++) {
                    formData.append("files", fileList[i]);
                }
            }

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/${editingLesson.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Không thể cập nhật bài học");
                }

                setUploadSuccess(true);
                reset();
                setSharedClassrooms([]);
                setSelectedAssignmentId("");
                setValue("sort_order", nextSortOrder);
                setTimeout(() => setUploadSuccess(false), 3000);
                if (onCancelEdit) onCancelEdit();
                onUploadSuccess();
            } catch (err: any) {
                setUploadError(err.message);
            } finally {
                setIsUploading(false);
            }
        } else {
            // Create new lesson
            const formData = new FormData();
            formData.append("classroom_id", classroomId);
            formData.append("title", data.title);
            if (data.description) {
                formData.append("description", data.description);
            }
            if (typeof data.sort_order === "number" && !Number.isNaN(data.sort_order)) {
                formData.append("sort_order", data.sort_order.toString());
            }
            if (data.available_at) {
                const localDateTime = new Date(data.available_at);
                const offsetMs = localDateTime.getTimezoneOffset() * 60000;
                const offsetHours = Math.floor(Math.abs(offsetMs) / 3600000);
                const offsetMinutes = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
                const offsetSign = offsetMs <= 0 ? '+' : '-';
                const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
                const isoString = `${data.available_at}:00${offsetString}`;
                formData.append("available_at", isoString);
            }
            if (selectedAssignmentId) {
                formData.append("assignment_id", selectedAssignmentId);
            }
            sharedClassrooms.forEach((id) => formData.append("shared_classroom_ids", id));
            const fileList = data.files as unknown as FileList;
            for (let i = 0; i < fileList.length; i++) {
                formData.append("files", fileList[i]);
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/lessons/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Không thể tải lên bài học");
                }

                setUploadSuccess(true);
                reset();
                setSharedClassrooms([]);
                setSelectedAssignmentId("");
                setValue("sort_order", nextSortOrder + 1);
                setNextSortOrder(nextSortOrder + 1);
                setTimeout(() => setUploadSuccess(false), 3000);
                onUploadSuccess();
            } catch (err: any) {
                setUploadError(err.message);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Edit Mode Header */}
            {editingLesson && (
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Đang chỉnh sửa bài học</p>
                                    <p className="text-sm text-blue-700 font-medium">{editingLesson.title}</p>
                                </div>
                            </div>
                            {onCancelEdit && (
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all"
                                    title="Hủy sửa"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Form Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6" />
                        {editingLesson ? 'Chỉnh sửa Bài học' : 'Tạo Bài học Mới'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Title Field */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            Tiêu đề bài học <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            {...register("title", { required: "Tiêu đề là bắt buộc" })}
                            className="h-12 text-base border-2 focus:border-blue-500 transition-all"
                            placeholder="Nhập tiêu đề bài học..."
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm flex items-center gap-2 mt-1">
                                <span className="text-lg">⚠</span> 
                                <span>{errors.title.message as string}</span>
                            </p>
                        )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                                <AlignLeft className="w-4 h-4 text-purple-600" />
                            </div>
                            Mô tả
                        </Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            className="min-h-[120px] text-base border-2 focus:border-purple-500 transition-all resize-none"
                            placeholder="Mô tả chi tiết về bài học (tùy chọn)..."
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Thêm mô tả để học sinh hiểu rõ hơn về nội dung bài học
                        </p>
                    </div>

                    {/* Sort Order and Available Date in Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sort Order Field */}
                        <div className="space-y-2">
                            <Label htmlFor="sort_order" className="text-base font-semibold flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Hash className="w-4 h-4 text-green-600" />
                                </div>
                                Thứ tự hiển thị
                            </Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min={1}
                                {...register("sort_order", { 
                                    valueAsNumber: true,
                                    value: nextSortOrder,
                                    setValueAs: (v) => v === '' ? nextSortOrder : parseInt(v, 10)
                                })}
                                className="h-12 text-base border-2 focus:border-green-500 transition-all"
                                placeholder={`Tự động: ${nextSortOrder}`}
                            />
                            <div className="flex items-start gap-2 mt-1 p-2 bg-green-50 rounded-lg border border-green-200">
                                <Hash className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-green-700">
                                    Số thứ tự tự động điền dựa trên bài học trước đó. Bắt đầu từ 1.
                                </p>
                            </div>
                        </div>

                        {/* Available At Field */}
                        <div className="space-y-2">
                            <Label htmlFor="available_at" className="text-base font-semibold flex items-center gap-2">
                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-orange-600" />
                                </div>
                                Ngày giờ mở bài học
                            </Label>
                            <Input
                                id="available_at"
                                type="datetime-local"
                                {...register("available_at")}
                                className="h-12 text-base border-2 focus:border-orange-500 transition-all"
                            />
                            <div className="flex items-start gap-2 mt-1 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-orange-700">
                                    Chọn ngày giờ để mở bài học cho học sinh. Nếu để trống, bài học sẽ mở ngay lập tức.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Link Field */}
                    {assignments.length > 0 && (
                        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-500 rounded-lg">
                                        <Link2 className="w-4 h-4 text-white" />
                                    </div>
                                    Liên kết bài tập (tùy chọn)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <select
                                    value={selectedAssignmentId}
                                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                    className="w-full h-12 px-4 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white text-base"
                                >
                                    <option value="">-- Không liên kết bài tập --</option>
                                    {assignments.map((assignment) => (
                                        <option key={assignment.id} value={assignment.id}>
                                            {assignment.title} ({assignment.assignment_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'})
                                            {assignment.total_points && ` - ${assignment.total_points} điểm`}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-indigo-700">
                                        Chọn bài tập để gắn liên kết vào bài học. Học sinh có thể truy cập bài tập từ bài học này.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* File Upload Field */}
                    <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-1.5 bg-cyan-500 rounded-lg">
                                    <Upload className="w-4 h-4 text-white" />
                                </div>
                                Tệp tin tài liệu {!editingLesson && <span className="text-red-500">*</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                
                            {/* Current Files Display (when editing) */}
                            {editingLesson && (editingLesson.files && editingLesson.files.length > 0 || editingLesson.file_name) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-cyan-600" />
                                        <p className="text-sm font-semibold text-cyan-700">
                                            File hiện tại ({editingLesson.files?.length || 1})
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {editingLesson.files && editingLesson.files.length > 0 ? (
                                            editingLesson.files.map((file, index) => (
                                                <Card key={file.id} className="border-2 border-cyan-200 bg-white">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                                                                    <FileText className="w-6 h-6 text-cyan-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {file.file_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''} • Thứ tự: {file.sort_order + 1}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {file.file_url && (
                                                                    <>
                                                                        <a
                                                                            href={file.file_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                                                                            title="Xem file"
                                                                        >
                                                                            <ExternalLink className="w-5 h-5" />
                                                                        </a>
                                                                        <a
                                                                            href={file.file_url}
                                                                            download={file.file_name}
                                                                            className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                                                                            title="Tải xuống"
                                                                        >
                                                                            <Download className="w-5 h-5" />
                                                                        </a>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : editingLesson.file_name ? (
                                            <Card className="border-2 border-cyan-200 bg-white">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                                                                <FileText className="w-6 h-6 text-cyan-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {editingLesson.file_name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">File hiện tại</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {editingLesson.file_url && (
                                                                <>
                                                                    <a
                                                                        href={editingLesson.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                                                                        title="Xem file"
                                                                    >
                                                                        <ExternalLink className="w-5 h-5" />
                                                                    </a>
                                                                    <a
                                                                        href={editingLesson.file_url}
                                                                        download={editingLesson.file_name}
                                                                        className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                                                                        title="Tải xuống"
                                                                    >
                                                                        <Download className="w-5 h-5" />
                                                                    </a>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    {...register("files", { required: !editingLesson ? "Vui lòng chọn ít nhất một tệp tin" : false })}
                                    className="w-full text-base text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-blue-500 file:text-white hover:file:from-cyan-600 hover:file:to-blue-600 file:cursor-pointer cursor-pointer border-2 border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                                />
                                {editingLesson && (
                                    <div className="flex items-start gap-2 mt-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                                        <Upload className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-cyan-700">
                                            Chọn file mới để thay thế file hiện tại. Để trống nếu không muốn thay đổi.
                                        </p>
                                    </div>
                                )}
                            </div>
                
                            {/* New Files Selected Display */}
                            {selectedFiles && (selectedFiles as unknown as FileList).length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-green-600" />
                                        <p className="text-sm font-semibold text-green-700">
                                            File mới đã chọn ({(selectedFiles as unknown as FileList).length})
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {Array.from(selectedFiles as unknown as FileList).map((file, index) => (
                                            <Card key={index} className="border-2 border-green-200 bg-green-50">
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                
                            {errors.files && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-lg">⚠</span>
                                    <p className="text-sm text-red-700">{errors.files.message as string}</p>
                                </div>
                            )}
                            <div className="flex items-start gap-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                                <FileText className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-cyan-700">
                                    <span className="font-semibold">Hỗ trợ:</span> PDF, Word, PowerPoint, Excel, Text, ZIP (Tối đa 50MB mỗi file)
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shared Classrooms */}
                    {classrooms.length > 1 && (
                        <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-500 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-white" />
                                    </div>
                                    Chia sẻ cho lớp khác
                                </CardTitle>
                                <p className="text-xs text-purple-700 mt-2">
                                    Bạn chỉ có thể chọn các lớp do mình quản lý. Lớp hiện tại đã được chọn mặc định.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {classrooms.filter(cls => cls.id !== classroomId).map((cls) => {
                                        const checked = sharedClassrooms.includes(cls.id);
                                        return (
                                            <label 
                                                key={cls.id} 
                                                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                                    checked 
                                                        ? "border-purple-500 bg-white shadow-md" 
                                                        : "border-purple-200 bg-white/80 hover:border-purple-300 hover:shadow-sm"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-purple-500"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        setSharedClassrooms((prev) => {
                                                            if (e.target.checked) {
                                                                return [...prev, cls.id];
                                                            }
                                                            return prev.filter(id => id !== cls.id);
                                                        });
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">{cls.name}</p>
                                                    {cls.code && <p className="text-xs text-gray-500 mt-1">{cls.code}</p>}
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {classrooms.filter(cls => cls.id !== classroomId).length === 0 && (
                                        <p className="text-sm text-gray-500 col-span-2 text-center py-4">Không có lớp khác để chia sẻ.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {/* Error Message */}
            {uploadError && (
                <Card className="border-2 border-red-300 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠</span>
                            <div>
                                <p className="font-semibold text-red-800 mb-1">Lỗi</p>
                                <p className="text-sm text-red-700">{uploadError}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Message */}
            {uploadSuccess && (
                <Card className="border-2 border-green-300 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">✓</span>
                            <div>
                                <p className="font-semibold text-green-800 mb-1">Thành công</p>
                                <p className="text-sm text-green-700">Tải lên bài học thành công!</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
                {editingLesson && onCancelEdit && (
                    <Button
                        type="button"
                        onClick={onCancelEdit}
                        variant="outline"
                        disabled={isUploading}
                        className="flex-1 h-12 text-base border-2"
                    >
                        Hủy
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isUploading}
                    className={`${editingLesson ? 'flex-1' : 'w-full'} h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {editingLesson ? 'Đang cập nhật...' : 'Đang tải lên...'}
                        </>
                    ) : (
                        <>
                            {editingLesson ? (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Cập nhật bài học
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Tải lên bài học
                                </>
                            )}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
