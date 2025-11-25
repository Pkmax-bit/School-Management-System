'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Calendar, Users, Download, ExternalLink, FileIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApiAuth } from '@/hooks/useApiAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LessonFile {
    id: string;
    lesson_id: string;
    file_url: string;
    file_name: string;
    storage_path?: string;
    file_size?: number;
    file_type?: string;
    sort_order: number;
}

interface Lesson {
    id: string;
    classroom_id: string;
    title: string;
    description?: string;
    file_url: string;
    file_name?: string;
    storage_path?: string;
    sort_order?: number;
    available_at?: string;
    assignment_id?: string;
    files?: LessonFile[];
    created_at: string;
    updated_at: string;
}

interface Classroom {
    id: string;
    name: string;
    code?: string;
    subject?: { name: string };
}

export default function StudentLessonsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useApiAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            loadLessons();
        }
    }, [authLoading, user]);

    const loadLessons = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            if (!token) {
                // Should be handled by layout, but safe to keep
                return;
            }

            console.log('Loading student data...');

            // Get student profile
            const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                const student = studentsData.find((s: any) => s.user_id === user?.id);

                console.log('Student data:', student);

                if (student && student.classroom_id) {
                    // Load classroom info
                    const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${student.classroom_id}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (classroomRes.ok) {
                        const classroomData = await classroomRes.json();
                        setClassroom(classroomData);
                        console.log('Classroom data:', classroomData);
                    }

                    // Load lessons for classroom
                    const lessonsRes = await fetch(`${API_BASE_URL}/api/lessons/classroom/${student.classroom_id}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    console.log('Lessons API status:', lessonsRes.status);

                    if (lessonsRes.ok) {
                        const lessonsData = await lessonsRes.json();
                        console.log('Lessons data:', lessonsData);

                        // Filter lessons by availability date
                        const now = new Date();
                        const availableLessons = lessonsData.filter((lesson: Lesson) => {
                            if (!lesson.available_at) return true;
                            const availableDate = new Date(lesson.available_at);
                            return availableDate <= now;
                        });

                        setLessons(availableLessons);
                    } else {
                        // Don't throw error if no lessons, just show empty state
                        const errorText = await lessonsRes.text();
                        console.warn('No lessons found or API error:', lessonsRes.status, errorText);
                        setLessons([]);
                    }
                } else {
                    setError('Bạn chưa được phân vào lớp học nào');
                }
            } else {
                throw new Error('Không thể tải thông tin học sinh');
            }
        } catch (err: any) {
            console.error('Error loading lessons:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải bài học');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (filename?: string) => {
        if (!filename) return <FileIcon className="w-5 h-5 text-gray-500" />;

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

    const getFileExtension = (filename?: string) => {
        if (!filename) return 'FILE';
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, "dd MMMM yyyy", { locale: vi });
        } catch {
            return dateString;
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const mb = bytes / 1024 / 1024;
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="max-w-md mx-auto mt-20">
                <CardContent className="pt-6 text-center space-y-4">
                    <BookOpen className="w-16 h-16 text-red-500 mx-auto" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button onClick={() => router.push('/student/dashboard')} variant="outline">
                        Quay về trang chủ
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Bài học của tôi</h1>
                        <p className="text-blue-100 mt-1">Xem và học các bài học được tải lên</p>
                    </div>
                </div>

                {classroom && (
                    <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit mt-4">
                        <Users className="w-4 h-4" />
                        <span>Lớp: {classroom.name}</span>
                        {classroom.subject && (
                            <>
                                <span className="text-blue-200">•</span>
                                <span>Môn: {classroom.subject.name}</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Lessons Grid */}
            {lessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson) => (
                        <Card key={lesson.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {getFileIcon(lesson.file_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg line-clamp-2 mb-2">
                                                {lesson.title}
                                            </CardTitle>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {getFileExtension(lesson.file_name)}
                                                </Badge>
                                                {lesson.files && lesson.files.length > 1 && (
                                                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                        {lesson.files.length} files
                                                    </Badge>
                                                )}
                                                {typeof lesson.sort_order === 'number' && (
                                                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                        Bài {lesson.sort_order}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {lesson.description && (
                                    <CardDescription className="line-clamp-2 mt-2">
                                        {lesson.description}
                                    </CardDescription>
                                )}
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(lesson.created_at)}</span>
                                    </div>

                                    {lesson.files && lesson.files.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Download className="w-4 h-4" />
                                            <span>
                                                {lesson.files.reduce((total, file) => total + (file.file_size || 0), 0) > 0
                                                    ? formatFileSize(lesson.files.reduce((total, file) => total + (file.file_size || 0), 0))
                                                    : 'Tài liệu học tập'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Linked Assignment */}
                                {lesson.assignment_id && (
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-purple-700">
                                            <FileText className="w-4 h-4" />
                                            <span className="font-medium">Có bài tập liên kết</span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                        onClick={() => router.push(`/student/lessons/${lesson.id}`)}
                                    >
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Học bài
                                    </Button>

                                    {lesson.assignment_id && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => router.push(`/student/assignments/${lesson.assignment_id}`)}
                                            title="Làm bài tập"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-md">
                    <CardContent className="text-center py-16 space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="w-10 h-10 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-gray-900 text-lg font-semibold mb-2">Chưa có bài học nào</p>
                            <p className="text-gray-500">Giáo viên chưa tải lên bài học cho lớp của bạn</p>
                        </div>
                        <Button onClick={() => router.push('/student/dashboard')} variant="outline">
                            Quay về trang chủ
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
