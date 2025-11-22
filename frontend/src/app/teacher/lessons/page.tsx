"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import LessonUploadForm from "@/components/lessons/LessonUploadForm";
import LessonList from "@/components/lessons/LessonList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Upload, FileText, School, ChevronRight } from "lucide-react";

export default function TeacherLessonsPage() {
    const { user, loading, logout } = useTeacherAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
    const [loadingClassrooms, setLoadingClassrooms] = useState(true);
    const [refreshLessons, setRefreshLessons] = useState(0);
    const [editingLesson, setEditingLesson] = useState<any | null>(null);

    useEffect(() => {
        const fetchClassrooms = async () => {
            if (!user) return;

            try {
                // Get token from localStorage
                const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

                if (!token) {
                    console.warn('No auth token found');
                    setLoadingClassrooms(false);
                    return;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/classrooms`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setClassrooms(data);
                    if (data.length > 0) {
                        setSelectedClassroomId(data[0].id);
                    }
                } else {
                    console.error('Failed to fetch classrooms:', response.status);
                }
            } catch (error) {
                console.error("Failed to fetch classrooms", error);
            } finally {
                setLoadingClassrooms(false);
            }
        };

        if (!loading && user) {
            fetchClassrooms();
        }
    }, [user, loading]);

    // Loading state
    if (loading || loadingClassrooms) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <TeacherSidebar
                    currentPage="lessons"
                    onNavigate={(path) => router.push(path)}
                    onLogout={logout}
                    user={{ name: user?.name, email: user?.email }}
                />
                <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Auth check
    if (!user || user.role !== 'teacher') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
                    <Button onClick={() => router.push('/teacher/login')}>Đến trang đăng nhập giáo viên</Button>
                </div>
            </div>
        );
    }

    const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <TeacherSidebar
                currentPage="lessons"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email }}
            />
            <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                }`}>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Quản lý bài học</h1>
                                <p className="text-blue-100 mt-1">Tải lên và quản lý tài liệu bài học cho lớp của bạn</p>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    {selectedClassroom && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                            <School className="w-4 h-4" />
                            <span>Lớp học</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-medium text-gray-900">{selectedClassroom.name}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Classroom List Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-md border-0">
                                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-gray-50">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <School className="w-5 h-5 text-blue-600" />
                                        Danh sách lớp học
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-2">
                                        {classrooms.map((cls) => (
                                            <button
                                                key={cls.id}
                                                onClick={() => setSelectedClassroomId(cls.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedClassroomId === cls.id
                                                        ? "bg-blue-50 border-2 border-blue-500 text-blue-700 font-medium shadow-sm"
                                                        : "hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                                    }`}
                                            >
                                                <div className="font-medium">{cls.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{cls.code}</div>
                                            </button>
                                        ))}
                                        {classrooms.length === 0 && (
                                            <div className="text-center py-8">
                                                <School className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">Không có lớp học nào</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {selectedClassroomId ? (
                                <div className="space-y-6">
                                    {/* Upload Form Card */}
                                    <Card className="shadow-md border-0" data-lesson-form>
                                        <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Upload className="w-5 h-5 text-green-600" />
                                                {editingLesson ? 'Sửa bài học' : 'Tải lên bài học mới'}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Tải lên tài liệu, bài giảng cho lớp <span className="font-medium text-gray-900">{selectedClassroom?.name}</span>
                                            </p>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <LessonUploadForm
                                                classroomId={selectedClassroomId}
                                                classrooms={classrooms}
                                                onUploadSuccess={() => {
                                                    setRefreshLessons((prev) => prev + 1);
                                                    setEditingLesson(null);
                                                }}
                                                editingLesson={editingLesson}
                                                onCancelEdit={() => setEditingLesson(null)}
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Lessons List Card */}
                                    <Card className="shadow-md border-0">
                                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                Danh sách bài học
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Tất cả tài liệu đã tải lên cho lớp này
                                            </p>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <LessonList
                                                classroomId={selectedClassroomId}
                                                refreshTrigger={refreshLessons}
                                                classrooms={classrooms}
                                                onEditLesson={(lesson) => {
                                                    setEditingLesson(lesson);
                                                    // Scroll to form
                                                    setTimeout(() => {
                                                        const formCard = document.querySelector('[data-lesson-form]');
                                                        if (formCard) {
                                                            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }, 100);
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="shadow-md border-0">
                                    <CardContent className="py-16">
                                        <div className="text-center space-y-4">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                                <School className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-gray-600 font-medium">Chưa chọn lớp học</p>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Vui lòng chọn một lớp học từ danh sách bên trái để bắt đầu quản lý bài học
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
