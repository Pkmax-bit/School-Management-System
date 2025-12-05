'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Loader2,
    BookOpen,
    Award,
    Clock,
    ChevronRight,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AssignmentGrade {
    assignment_id: string;
    assignment_title: string;
    subject_name: string;
    score: number;
    max_score: number;
    percentage: number;
    graded_at?: string;
    status: 'graded' | 'pending' | 'not_submitted';
}

interface SubjectGrade {
    subject_id: string;
    subject_name: string;
    total_assignments: number;
    graded_assignments: number;
    average_score: number;
    total_score: number;
    max_total_score: number;
}

interface GradeSummary {
    student_id: string;
    student_name: string;
    total_assignments: number;
    graded_assignments: number;
    pending_assignments: number;
    overall_average: number;
    classification: string;
    assignments: AssignmentGrade[];
    subjects: SubjectGrade[];
}

interface Classroom {
    id: string;
    name: string;
    grade?: string;
    academic_year?: string;
    open_date?: string;
    close_date?: string;
}

export default function StudentClassroomGradesPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();

    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [gradeSummary, setGradeSummary] = useState<GradeSummary | null>(null);

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadData();
        }
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            // 1. Lấy thông tin student hiện tại (bao gồm classroom_id)
            const studentRes = await fetch(
                `${API_BASE_URL}/api/students?user_id=${user?.id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (!studentRes.ok) {
                setGradeSummary(null);
                setClassroom(null);
                return;
            }

            const studentsData = await studentRes.json();
            if (!Array.isArray(studentsData) || studentsData.length === 0) {
                setGradeSummary(null);
                setClassroom(null);
                return;
            }

            const student = studentsData[0];
            const currentStudentId = student.id as string;
            const classroomId = student.classroom_id as string | null;
            setStudentId(currentStudentId);

            if (!classroomId) {
                // Học sinh chưa được gán lớp
                setClassroom(null);
                setGradeSummary(null);
                return;
            }

            // 2. Lấy thông tin lớp học của học sinh
            const classroomRes = await fetch(
                `${API_BASE_URL}/api/classrooms/${classroomId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (classroomRes.ok) {
                const classroomData = await classroomRes.json();
                setClassroom({
                    id: classroomData.id,
                    name: classroomData.name,
                    grade: classroomData.grade,
                    academic_year: classroomData.academic_year,
                    open_date: classroomData.open_date,
                    close_date: classroomData.close_date,
                });
            } else {
                setClassroom(null);
            }

            // 3. Lấy điểm theo lớp (filter classroom_id) – chỉ điểm của học sinh hiện tại
            const gradesRes = await fetch(
                `${API_BASE_URL}/api/students/${currentStudentId}/grades?classroom_id=${classroomId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (gradesRes.ok) {
                const gradesData = await gradesRes.json();
                setGradeSummary(gradesData);
            } else {
                setGradeSummary(null);
            }
        } catch (error) {
            console.error('Error loading classroom grades for student:', error);
            setGradeSummary(null);
            setClassroom(null);
        } finally {
            setLoading(false);
        }
    };

    const getClassificationColor = (classification: string) => {
        switch (classification) {
            case 'Giỏi':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'Khá':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Trung bình':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'Yếu':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'Kém':
                return 'bg-red-100 text-red-700 border-red-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 65) return 'text-blue-600';
        if (percentage >= 50) return 'text-yellow-600';
        if (percentage >= 35) return 'text-orange-600';
        return 'text-red-600';
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage="grades"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email, role: user?.role }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
                    isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Điểm số theo lớp</h1>
                            <p className="text-indigo-100">
                                Xem kết quả học tập trong lớp mà bạn đang theo học, giống cách xem
                                của giáo viên và admin nhưng chỉ dành cho bạn.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            onClick={() => router.push('/student/grades')}
                        >
                            Xem tổng quan kết quả
                        </Button>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-indigo-600"
                            onClick={loadData}
                        >
                            Lớp học
                        </button>
                        {classroom && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span>{classroom.name}</span>
                            </>
                        )}
                    </div>

                    {/* Không có lớp */}
                    {!classroom && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500">
                                    Bạn hiện chưa được gán vào lớp nào, nên chưa có bảng điểm theo lớp.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Thông tin lớp & thống kê giống admin/teacher nhưng cho học sinh */}
                    {classroom && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">{classroom.name}</CardTitle>
                                    <CardDescription>
                                        <span className="block">
                                            {classroom.grade
                                                ? `Khối ${classroom.grade}`
                                                : 'Lớp học'}
                                            {classroom.academic_year &&
                                                ` • Năm học ${classroom.academic_year}`}
                                        </span>
                                        {classroom.open_date && (
                                            <span className="block text-xs text-slate-500">
                                                Bắt đầu:{' '}
                                                {new Date(classroom.open_date).toLocaleDateString(
                                                    'vi-VN'
                                                )}
                                            </span>
                                        )}
                                        {classroom.close_date && (
                                            <span className="block text-xs text-slate-500">
                                                Kết thúc:{' '}
                                                {new Date(classroom.close_date).toLocaleDateString(
                                                    'vi-VN'
                                                )}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {gradeSummary && (
                                <>
                                    {/* Statistics giống teacher/admin style */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Tổng bài tập
                                                        </div>
                                                        <div className="text-3xl font-bold text-blue-600">
                                                            {gradeSummary.total_assignments}
                                                        </div>
                                                    </div>
                                                    <BookOpen className="w-8 h-8 text-blue-600 opacity-50" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Đã có điểm
                                                        </div>
                                                        <div className="text-3xl font-bold text-green-600">
                                                            {gradeSummary.graded_assignments}
                                                        </div>
                                                    </div>
                                                    <Award className="w-8 h-8 text-green-600 opacity-50" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Chờ chấm
                                                        </div>
                                                        <div className="text-3xl font-bold text-yellow-600">
                                                            {gradeSummary.pending_assignments}
                                                        </div>
                                                    </div>
                                                        <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Điểm TB lớp của bạn
                                                        </div>
                                                        <div className="text-3xl font-bold text-purple-600">
                                                            {gradeSummary.overall_average.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Xếp loại */}
                                    <Card>
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">
                                                    Xếp loại trong lớp này
                                                </h3>
                                                <Badge
                                                    className={`${getClassificationColor(
                                                        gradeSummary.classification
                                                    )} border font-semibold text-lg px-4 py-2`}
                                                >
                                                    {gradeSummary.classification}
                                                </Badge>
                                            </div>
                                            <Award className="w-12 h-12 text-purple-600 opacity-50" />
                                        </CardContent>
                                    </Card>

                                    {/* Điểm theo môn (nếu có nhiều môn trong cùng lớp) */}
                                    {gradeSummary.subjects.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Điểm theo môn học trong lớp</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {gradeSummary.subjects.map((subject) => (
                                                        <div
                                                            key={subject.subject_id}
                                                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                                                        >
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                                                <h4 className="font-semibold text-slate-800">
                                                                    {subject.subject_name}
                                                                </h4>
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">
                                                                        Số bài:
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            subject.total_assignments
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">
                                                                        Đã chấm:
                                                                    </span>
                                                                    <span className="font-semibold text-green-600">
                                                                        {
                                                                            subject.graded_assignments
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-600">
                                                                        Điểm TB:
                                                                    </span>
                                                                    <span
                                                                        className={`font-bold text-lg ${getScoreColor(
                                                                            (subject.average_score /
                                                                                10) *
                                                                                100
                                                                        )}`}
                                                                    >
                                                                        {subject.average_score.toFixed(
                                                                            2
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Danh sách bài tập trong lớp này */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Chi tiết điểm bài tập trong lớp</CardTitle>
                                            <CardDescription>
                                                Danh sách tất cả bài tập của bạn trong lớp này, với
                                                điểm số và trạng thái chấm.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {gradeSummary.assignments.map((assignment) => (
                                                    <div
                                                        key={assignment.assignment_id}
                                                        className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-slate-800 mb-1">
                                                                    {assignment.assignment_title}
                                                                </h4>
                                                                <p className="text-sm text-slate-600">
                                                                    {assignment.subject_name}
                                                                </p>
                                                            </div>
                                                            {assignment.status === 'graded' ? (
                                                                <div className="text-right">
                                                                    <div
                                                                        className={`text-2xl font-bold ${getScoreColor(
                                                                            assignment.percentage
                                                                        )}`}
                                                                    >
                                                                        {assignment.score}/
                                                                        {assignment.max_score}
                                                                    </div>
                                                                    <div className="text-sm text-slate-500">
                                                                        {assignment.percentage.toFixed(
                                                                            0
                                                                        )}
                                                                        %
                                                                    </div>
                                                                </div>
                                                            ) : assignment.status === 'pending' ? (
                                                                <Badge variant="secondary">
                                                                    Chờ chấm
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">
                                                                    Chưa nộp
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {assignment.graded_at && (
                                                            <p className="text-xs text-slate-500">
                                                                Chấm lúc:{' '}
                                                                {new Date(
                                                                    assignment.graded_at
                                                                ).toLocaleString('vi-VN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                                {gradeSummary.assignments.length === 0 && (
                                                    <p className="text-center text-slate-500 py-8">
                                                        Chưa có bài tập nào trong lớp này
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {!gradeSummary && classroom && (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500">
                                            Chưa có dữ liệu điểm cho lớp này.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


