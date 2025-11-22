"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { LessonCreate, Assignment } from "@/types/lesson";
import { FileText, AlignLeft, Upload, Loader2, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonUploadFormProps {
    classroomId: string;
    classrooms: Array<{ id: string; name: string; code?: string }>;
    onUploadSuccess: () => void;
}

export default function LessonUploadForm({ classroomId, classrooms, onUploadSuccess }: LessonUploadFormProps) {
    const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<LessonCreate>();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [sharedClassrooms, setSharedClassrooms] = useState<string[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
    const [nextSortOrder, setNextSortOrder] = useState<number>(1);

    const selectedFile = watch("file");

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
            // datetime-local returns "YYYY-MM-DDTHH:MM" (no timezone, local time)
            // Convert to ISO format with local timezone offset to preserve exact time
            const localDateTime = new Date(data.available_at);
            // Get timezone offset (e.g., +07:00 for Vietnam)
            const offsetMs = localDateTime.getTimezoneOffset() * 60000; // offset in milliseconds
            const offsetHours = Math.floor(Math.abs(offsetMs) / 3600000);
            const offsetMinutes = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
            const offsetSign = offsetMs <= 0 ? '+' : '-'; // getTimezoneOffset returns negative for positive offsets
            const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
            
            // Format: YYYY-MM-DDTHH:MM:SS+HH:MM
            const isoString = `${data.available_at}:00${offsetString}`;
            formData.append("available_at", isoString);
        }
        if (selectedAssignmentId) {
            formData.append("assignment_id", selectedAssignmentId);
        }
        sharedClassrooms.forEach((id) => formData.append("shared_classroom_ids", id));
        const fileList = data.file as unknown as FileList;
        formData.append("file", fileList[0]);

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
            // Reset sort_order to next value after successful upload
            setValue("sort_order", nextSortOrder + 1);
            setNextSortOrder(nextSortOrder + 1);
            setTimeout(() => setUploadSuccess(false), 3000);
            onUploadSuccess();
        } catch (err: any) {
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Tiêu đề bài học <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    {...register("title", { required: "Tiêu đề là bắt buộc" })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Nhập tiêu đề bài học..."
                />
                {errors.title && <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.title.message as string}
                </p>}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <AlignLeft className="w-4 h-4 text-blue-600" />
                    Mô tả
                </label>
                <textarea
                    {...register("description")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Mô tả chi tiết về bài học (tùy chọn)..."
                    rows={4}
                />
            </div>

            {/* Sort Order Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 text-blue-600 text-xs font-semibold">#</span>
                    Thứ tự hiển thị
                </label>
                <input
                    type="number"
                    min={1}
                    {...register("sort_order", { 
                        valueAsNumber: true,
                        value: nextSortOrder,
                        setValueAs: (v) => v === '' ? nextSortOrder : parseInt(v, 10)
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={`Tự động: ${nextSortOrder}`}
                />
                <p className="text-xs text-gray-500">
                    Số thứ tự tự động điền dựa trên bài học trước đó. Bắt đầu từ 1.
                </p>
            </div>

            {/* Available At Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Ngày giờ mở bài học
                </label>
                <input
                    type="datetime-local"
                    {...register("available_at")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500">
                    Chọn ngày giờ để mở bài học cho học sinh. Nếu để trống, bài học sẽ mở ngay lập tức.
                </p>
            </div>

            {/* Assignment Link Field */}
            {assignments.length > 0 && (
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Liên kết bài tập (tùy chọn)
                    </label>
                    <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                        <option value="">-- Không liên kết bài tập --</option>
                        {assignments.map((assignment) => (
                            <option key={assignment.id} value={assignment.id}>
                                {assignment.title} ({assignment.assignment_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'})
                                {assignment.total_points && ` - ${assignment.total_points} điểm`}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Chọn bài tập để gắn liên kết vào bài học. Học sinh có thể truy cập bài tập từ bài học này.
                    </p>
                </div>
            )}

            {/* File Upload Field */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Upload className="w-4 h-4 text-blue-600" />
                    Tệp tin tài liệu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="file"
                        {...register("file", { required: "Vui lòng chọn tệp tin" })}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                    />
                </div>
                {selectedFile && (selectedFile as unknown as FileList).length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{(selectedFile as unknown as FileList)[0]?.name}</span>
                        <span className="text-xs text-gray-400">
                            ({((selectedFile as unknown as FileList)[0]?.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                )}
                {errors.file && <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.file.message as string}
                </p>}
                <p className="text-xs text-gray-500">
                    Hỗ trợ: PDF, Word, PowerPoint, Excel, Text, ZIP (Tối đa 50MB)
                </p>
            </div>

            {/* Shared Classrooms */}
            {classrooms.length > 1 && (
                <div className="space-y-3 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/60">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Chia sẻ cho lớp khác</p>
                        <p className="text-xs text-gray-500">
                            Bạn chỉ có thể chọn các lớp do mình quản lý. Lớp hiện tại đã được chọn mặc định.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                        {classrooms.filter(cls => cls.id !== classroomId).map((cls) => {
                            const checked = sharedClassrooms.includes(cls.id);
                            return (
                                <label key={cls.id} className={`flex items-start gap-3 p-3 rounded-lg border transition ${checked ? "border-blue-500 bg-white shadow-sm" : "border-gray-200 bg-white/60 hover:border-blue-200"}`}>
                                    <input
                                        type="checkbox"
                                        className="mt-1"
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
                                        <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                                        {cls.code && <p className="text-xs text-gray-500">{cls.code}</p>}
                                    </div>
                                </label>
                            );
                        })}
                        {classrooms.filter(cls => cls.id !== classroomId).length === 0 && (
                            <p className="text-sm text-gray-500">Không có lớp khác để chia sẻ.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {uploadError && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    <span className="text-lg">⚠</span>
                    <span>{uploadError}</span>
                </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
                <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    <span className="text-lg">✓</span>
                    <span>Tải lên bài học thành công!</span>
                </div>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tải lên...
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        Tải lên bài học
                    </>
                )}
            </Button>
        </form>
    );
}
