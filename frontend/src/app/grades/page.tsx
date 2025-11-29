'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { 
    Award, 
    Clock, 
    CheckCircle, 
    FileText, 
    Search, 
    Eye,
    TrendingUp,
    Users,
    BarChart3
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Assignment {
    id: string;
    title: string;
    assignment_type: 'multiple_choice' | 'essay';
    total_points: number;
    due_date?: string;
    created_at: string;
    teacher_id: string;
    subject_id: string;
}

interface AssignmentStats {
    assignment_id: string;
    assignment_title: string;
    total_students: number;
    total_submissions: number;
    total_graded: number;
    completion_rate: number;
    average_score: number | null;
    score_distribution: {
        excellent: number;
        good: number;
        average: number;
        below_average: number;
        poor: number;
    };
    pending_grading: number;
}

interface Teacher {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

export default function GradesPage() {
    const { user, loading: authLoading } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<Record<string, AssignmentStats>>({});
    const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
    const [subjects, setSubjects] = useState<Record<string, Subject>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'multiple_choice' | 'essay'>('all');

    const isTeacher = user?.role === 'teacher';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!authLoading && user && (isTeacher || isAdmin)) {
            loadData();
        }
    }, [user, authLoading, isTeacher, isAdmin]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Load assignments
            let url = `${API_BASE_URL}/api/assignments?limit=1000`;
            if (isTeacher) {
                // Get teacher_id from user
                const teacherRes = await fetch(`${API_BASE_URL}/api/teachers?user_id=${user.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (teacherRes.ok) {
                    const teachersData = await teacherRes.json();
                    if (teachersData.length > 0) {
                        url += `&teacher_id=${teachersData[0].id}`;
                    }
                }
            }

            const assignmentsRes = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json() as Assignment[];
                setAssignments(assignmentsData);

                // Load stats for each assignment
                const statsMap: Record<string, AssignmentStats> = {};
                for (const assignment of assignmentsData) {
                    try {
                        const statsRes = await fetch(
                            `${API_BASE_URL}/api/assignments/${assignment.id}/statistics`,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                            }
                        );
                        if (statsRes.ok) {
                            const statsData = await statsRes.json() as AssignmentStats;
                            statsMap[assignment.id] = statsData;
                        }
                    } catch (error) {
                        console.error(`Error loading stats for assignment ${assignment.id}:`, error);
                    }
                }
                setStats(statsMap);

                // Load teachers and subjects
                const teacherIds = [...new Set(assignmentsData.map((a: Assignment) => a.teacher_id))];
                const subjectIds = [...new Set(assignmentsData.map((a: Assignment) => a.subject_id))];

                // Load teachers
                const teachersMap: Record<string, Teacher> = {};
                for (const teacherId of teacherIds) {
                    try {
                        const teacherRes = await fetch(`${API_BASE_URL}/api/teachers/${teacherId}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });
                        if (teacherRes.ok) {
                            const teacherData = await teacherRes.json() as Teacher;
                            teachersMap[teacherId] = teacherData;
                        }
                    } catch (error) {
                        console.error(`Error loading teacher ${teacherId}:`, error);
                    }
                }
                setTeachers(teachersMap);

                // Load subjects
                const subjectsMap: Record<string, Subject> = {};
                for (const subjectId of subjectIds) {
                    try {
                        const subjectRes = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });
                        if (subjectRes.ok) {
                            const subjectData = await subjectRes.json() as Subject;
                            subjectsMap[subjectId] = subjectData;
                        }
                    } catch (error) {
                        console.error(`Error loading subject ${subjectId}:`, error);
                    }
                }
                setSubjects(subjectsMap);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssignments = assignments.filter((assignment) => {
        const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || assignment.assignment_type === filterType;
        return matchesSearch && matchesType;
    });

    const handleViewSubmissions = (assignmentId: string) => {
        if (isTeacher) {
            router.push(`/teacher/assignments/${assignmentId}/submissions`);
        } else if (isAdmin) {
            router.push(`/admin/assignments/${assignmentId}/submissions`);
        }
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

    if (!user || (!isTeacher && !isAdmin)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    const totalAssignments = assignments.length;
    const totalPending = Object.values(stats).reduce((sum, s) => sum + s.pending_grading, 0);
    const totalGraded = Object.values(stats).reduce((sum, s) => sum + s.total_graded, 0);
    const avgScore = Object.values(stats)
        .filter((s) => s.average_score !== null)
        .reduce((sum, s) => sum + (s.average_score || 0), 0) / 
        Object.values(stats).filter((s) => s.average_score !== null).length || 0;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            {isTeacher ? (
                <TeacherSidebar
                    currentPage="grades"
                    onNavigate={(path) => router.push(path)}
                    onLogout={() => {}}
                    user={{ name: user?.name, email: user?.email }}
                />
            ) : (
                <AdminSidebar
                    currentPage="grades"
                    onNavigate={(path) => router.push(path)}
                    onLogout={() => {}}
                    userName={user?.name}
                    userEmail={user?.email}
                />
            )}

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
                    isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Quản lý Điểm số</h1>
                        <p className="text-purple-100">Xem và quản lý điểm số bài tập của học sinh</p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-slate-600 mb-1">Tổng bài tập</div>
                                        <div className="text-3xl font-bold text-blue-600">{totalAssignments}</div>
                                    </div>
                                    <FileText className="w-8 h-8 text-blue-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-slate-600 mb-1">Đã chấm</div>
                                        <div className="text-3xl font-bold text-green-600">{totalGraded}</div>
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
                                        <div className="text-3xl font-bold text-yellow-600">{totalPending}</div>
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
                                            {avgScore > 0 ? avgScore.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Tìm kiếm bài tập..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={filterType === 'all' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('all')}
                                    >
                                        Tất cả
                                    </Button>
                                    <Button
                                        variant={filterType === 'multiple_choice' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('multiple_choice')}
                                    >
                                        Trắc nghiệm
                                    </Button>
                                    <Button
                                        variant={filterType === 'essay' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('essay')}
                                    >
                                        Tự luận
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredAssignments.map((assignment) => {
                            const assignmentStats = stats[assignment.id];
                            const teacher = teachers[assignment.teacher_id];
                            const subject = subjects[assignment.subject_id];

                            return (
                                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-slate-800">
                                                        {assignment.title}
                                                    </h3>
                                                    <Badge
                                                        variant={
                                                            assignment.assignment_type === 'multiple_choice'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {assignment.assignment_type === 'multiple_choice'
                                                            ? 'Trắc nghiệm'
                                                            : 'Tự luận'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                                    {teacher && (
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            <span>{teacher.name}</span>
                                                        </div>
                                                    )}
                                                    {subject && (
                                                        <div className="flex items-center gap-1">
                                                            <Award className="w-4 h-4" />
                                                            <span>{subject.name}</span>
                                                        </div>
                                                    )}
                                                    {assignment.due_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>
                                                                Hạn nộp: {new Date(assignment.due_date).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {assignmentStats && (
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                                                        <div className="text-sm">
                                                            <div className="text-slate-500">Tổng HS</div>
                                                            <div className="font-semibold text-slate-700">
                                                                {assignmentStats.total_students}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="text-slate-500">Đã nộp</div>
                                                            <div className="font-semibold text-blue-600">
                                                                {assignmentStats.total_submissions}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="text-slate-500">Đã chấm</div>
                                                            <div className="font-semibold text-green-600">
                                                                {assignmentStats.total_graded}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="text-slate-500">Chờ chấm</div>
                                                            <div className="font-semibold text-yellow-600">
                                                                {assignmentStats.pending_grading}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="text-slate-500">Điểm TB</div>
                                                            <div className="font-semibold text-purple-600">
                                                                {assignmentStats.average_score !== null
                                                                    ? assignmentStats.average_score.toFixed(1)
                                                                    : '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleViewSubmissions(assignment.id)}
                                                    variant="default"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Xem & Chấm
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {filteredAssignments.length === 0 && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500">Không tìm thấy bài tập nào</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


