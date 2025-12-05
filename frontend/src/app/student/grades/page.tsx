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
    Award,
    TrendingUp,
    BookOpen,
    CheckCircle,
    Clock,
    BarChart3
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

export default function StudentGradesPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [gradeSummary, setGradeSummary] = useState<GradeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadGrades();
        }
    }, [user, authLoading]);

    const loadGrades = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Get student info
            const studentRes = await fetch(`${API_BASE_URL}/api/students?user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (studentRes.ok) {
                const studentsData = await studentRes.json();
                if (studentsData.length > 0) {
                    const studentId = studentsData[0].id;

                    // Get grade summary
                    const gradesRes = await fetch(`${API_BASE_URL}/api/students/${studentId}/grades`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });

                    if (gradesRes.ok) {
                        const gradesData = await gradesRes.json();
                        setGradeSummary(gradesData);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading grades:', error);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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

    const filteredAssignments = selectedSubject === 'all'
        ? gradeSummary?.assignments || []
        : gradeSummary?.assignments.filter(a => a.subject_name === selectedSubject) || [];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage="grades"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Kết quả học tập</h1>
                            <p className="text-purple-100">
                                Xem điểm số tổng quan của bạn trên tất cả các lớp và môn học
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            onClick={() => router.push('/student/grades/classroom')}
                        >
                            Xem điểm theo lớp (giống giáo viên)
                        </Button>
                    </div>

                    {gradeSummary && (
                        <>
                            {/* Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-slate-600 mb-1">Tổng bài tập</div>
                                                <div className="text-3xl font-bold text-blue-600">
                                                    {gradeSummary.total_assignments}
                                                </div>
                                            </div>
                                            <BarChart3 className="w-8 h-8 text-blue-600 opacity-50" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-slate-600 mb-1">Đã có điểm</div>
                                                <div className="text-3xl font-bold text-green-600">
                                                    {gradeSummary.graded_assignments}
                                                </div>
                                            </div>
                                            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-slate-600 mb-1">Chờ chấm</div>
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
                                                <div className="text-sm text-slate-600 mb-1">Điểm TB</div>
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {gradeSummary.overall_average.toFixed(2)}
                                                </div>
                                            </div>
                                            <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Classification */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Xếp loại học lực</h3>
                                            <Badge
                                                className={`${getClassificationColor(gradeSummary.classification)} border font-semibold text-lg px-4 py-2`}
                                            >
                                                {gradeSummary.classification}
                                            </Badge>
                                        </div>
                                        <Award className="w-12 h-12 text-purple-600 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subject Grades */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Điểm theo môn học</CardTitle>
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
                                                    <h4 className="font-semibold text-slate-800">{subject.subject_name}</h4>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Số bài:</span>
                                                        <span className="font-semibold">{subject.total_assignments}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Đã chấm:</span>
                                                        <span className="font-semibold text-green-600">{subject.graded_assignments}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Điểm TB:</span>
                                                        <span className={`font-bold text-lg ${getScoreColor((subject.average_score / 10) * 100)}`}>
                                                            {subject.average_score.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assignment Grades */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Chi tiết điểm bài tập</CardTitle>
                                    <CardDescription>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="all">Tất cả môn học</option>
                                            {gradeSummary.subjects.map((subject) => (
                                                <option key={subject.subject_id} value={subject.subject_name}>
                                                    {subject.subject_name}
                                                </option>
                                            ))}
                                        </select>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {filteredAssignments.map((assignment) => (
                                            <div
                                                key={assignment.assignment_id}
                                                className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-800 mb-1">
                                                            {assignment.assignment_title}
                                                        </h4>
                                                        <p className="text-sm text-slate-600">{assignment.subject_name}</p>
                                                    </div>
                                                    {assignment.status === 'graded' ? (
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold ${getScoreColor(assignment.percentage)}`}>
                                                                {assignment.score}/{assignment.max_score}
                                                            </div>
                                                            <div className="text-sm text-slate-500">
                                                                {assignment.percentage.toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    ) : assignment.status === 'pending' ? (
                                                        <Badge variant="secondary">Chờ chấm</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Chưa nộp</Badge>
                                                    )}
                                                </div>
                                                {assignment.graded_at && (
                                                    <p className="text-xs text-slate-500">
                                                        Chấm lúc: {new Date(assignment.graded_at).toLocaleString('vi-VN')}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        {filteredAssignments.length === 0 && (
                                            <p className="text-center text-slate-500 py-8">
                                                Chưa có bài tập nào
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {!gradeSummary && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500">Chưa có dữ liệu điểm</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
