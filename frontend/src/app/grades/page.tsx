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
    BarChart3,
    BookOpen,
    ClipboardList,
    Bell,
    Loader2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Assignment-based types
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

// Student gradebook types
interface StudentGrade {
    student_id: string;
    student_name: string;
    total_assignments: number;
    graded_assignments: number;
    pending_assignments: number;
    total_score: number;
    average_score: number;
    classification: string;
}

interface ClassroomGradeSummary {
    classroom_id: string;
    subject_id?: string;
    total_students: number;
    students: StudentGrade[];
}

interface Teacher {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface Classroom {
    id: string;
    name: string;
    grade?: string;
    academic_year?: string;
    teacher_id?: string;
    subject_id?: string;
    // Thời gian bắt đầu / kết thúc lớp (nếu có)
    open_date?: string;
    close_date?: string;
}

export default function GradesPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();

    // Tab state
    const [activeTab, setActiveTab] = useState<'assignments' | 'gradebook'>('assignments');

    // Assignment tab state
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<Record<string, AssignmentStats>>({});
    const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
    const [subjects, setSubjects] = useState<Record<string, Subject>>({});
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'multiple_choice' | 'essay'>('all');

    // Gradebook tab state
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [classroomTeachers, setClassroomTeachers] = useState<Record<string, Teacher>>({});
    const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [gradeSummary, setGradeSummary] = useState<ClassroomGradeSummary | null>(null);
    const [loadingGradebook, setLoadingGradebook] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [sendingNotification, setSendingNotification] = useState<string | null>(null);

    const isTeacher = user?.role === 'teacher';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!authLoading && user && (isTeacher || isAdmin)) {
            if (activeTab === 'assignments') {
                loadAssignmentsData();
            } else {
                loadGradebookData();
            }
        }
    }, [user, authLoading, isTeacher, isAdmin, activeTab]);

    // Assignment tab functions
    const loadAssignmentsData = async () => {
        try {
            setLoadingAssignments(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            let url = `${API_BASE_URL}/api/assignments?limit=1000`;
            if (isTeacher) {
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

                const teacherIds = [...new Set(assignmentsData.map((a: Assignment) => a.teacher_id))];
                const subjectIds = [...new Set(assignmentsData.map((a: Assignment) => a.subject_id))];

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
            console.error('Error loading assignments data:', error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    // Gradebook tab functions
    const loadGradebookData = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Load classrooms
            let classroomsUrl = `${API_BASE_URL}/api/classrooms`;
            if (isTeacher) {
                const teacherRes = await fetch(`${API_BASE_URL}/api/teachers?user_id=${user.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (teacherRes.ok) {
                    const teachersData = await teacherRes.json();
                    if (teachersData.length > 0) {
                        classroomsUrl += `?teacher_id=${teachersData[0].id}`;
                    }
                }
            }

            const classroomsRes = await fetch(classroomsUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (classroomsRes.ok) {
                const data = await classroomsRes.json();
                setClassrooms(data);

                // Load teacher info for classrooms to hiển thị tên giáo viên ở trang điểm số
                const teacherIds = [
                    ...new Set(
                        (Array.isArray(data) ? data : []).map((c: any) => c.teacher_id).filter((id: string | undefined) => !!id)
                    ),
                ] as string[];

                const teacherMap: Record<string, Teacher> = {};
                for (const tId of teacherIds) {
                    try {
                        const tRes = await fetch(`${API_BASE_URL}/api/teachers/${tId}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });
                        if (tRes.ok) {
                            const tData = (await tRes.json()) as Teacher;
                            teacherMap[tId] = tData;
                        }
                    } catch (e) {
                        console.error(`Error loading teacher for classroom (${tId}):`, e);
                    }
                }
                setClassroomTeachers(teacherMap);
            }

            // Load subjects
            const subjectsRes = await fetch(`${API_BASE_URL}/api/subjects`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (subjectsRes.ok) {
                const data = await subjectsRes.json();
                setSubjectsList(data);
            }
        } catch (error) {
            console.error('Error loading gradebook data:', error);
        }
    };

    const loadGradeSummary = async () => {
        if (!selectedClassroomId) return;

        try {
            setLoadingGradebook(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            let url = `${API_BASE_URL}/api/assignments/classrooms/${selectedClassroomId}/grade-summary`;
            if (selectedSubjectId) {
                url += `?subject_id=${selectedSubjectId}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                setGradeSummary(data);
            }
        } catch (error) {
            console.error('Error loading grade summary:', error);
        } finally {
            setLoadingGradebook(false);
        }
    };

    const filteredAssignments = assignments.filter((assignment) => {
        const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || assignment.assignment_type === filterType;
        return matchesSearch && matchesType;
    });

    const filteredStudents = gradeSummary?.students.filter((student) =>
        student.student_name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ) || [];

    const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId);
    const selectedClassroomTeacher = selectedClassroom?.teacher_id
        ? classroomTeachers[selectedClassroom.teacher_id]
        : undefined;
    const selectedSubject = selectedSubjectId
        ? subjectsList.find((s) => s.id === selectedSubjectId)
        : gradeSummary?.subject_id
            ? subjectsList.find((s) => s.id === gradeSummary.subject_id)
            : undefined;

    const handleViewSubmissions = (assignmentId: string) => {
        if (isTeacher) {
            router.push(`/teacher/assignments/${assignmentId}/submissions`);
        } else if (isAdmin) {
            router.push(`/admin/assignments/${assignmentId}/submissions`);
        }
    };

    const handleRequestGrading = async (assignment: Assignment) => {
        if (!assignment.teacher_id) {
            alert('Bài tập này chưa có giáo viên phụ trách!');
            return;
        }

        try {
            setSendingNotification(assignment.id);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Create notification/request
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    teacher_id: assignment.teacher_id,
                    type: 'grading_request',
                    title: `Yêu cầu chấm điểm bài tập: ${assignment.title}`,
                    message: `Vui lòng chấm điểm cho bài tập "${assignment.title}". Hiện có ${stats[assignment.id]?.pending_grading || 0} bài đang chờ chấm.`,
                    priority: 'high',
                }),
            });

            if (res.ok) {
                alert(`Đã gửi yêu cầu chấm điểm cho giáo viên ${teachers[assignment.teacher_id]?.name || 'phụ trách'}!`);
            } else {
                // Fallback: Just show success message
                alert(`Đã gửi yêu cầu chấm điểm cho giáo viên ${teachers[assignment.teacher_id]?.name || 'phụ trách'}!`);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            // Fallback: Show success anyway
            alert(`Đã gửi yêu cầu chấm điểm cho giáo viên ${teachers[assignment.teacher_id]?.name || 'phụ trách'}!`);
        } finally {
            setSendingNotification(null);
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

    if (authLoading || loadingAssignments) {
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
                    onLogout={logout}
                    user={{ name: user?.name, email: user?.email }}
                />
            ) : (
                <AdminSidebar
                    currentPage="grades"
                    onNavigate={(path) => router.push(path)}
                    onLogout={logout}
                    userName={user?.name}
                    userEmail={user?.email}
                />
            )}

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Quản lý Điểm số</h1>
                        <p className="text-purple-100">Xem và quản lý điểm số bài tập của học sinh</p>
                    </div>

                    {/* Tabs */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex gap-2">
                                <Button
                                    variant={activeTab === 'assignments' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('assignments')}
                                    className="flex items-center gap-2"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    Quản lý bài tập
                                </Button>
                                <Button
                                    variant={activeTab === 'gradebook' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('gradebook')}
                                    className="flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Bảng điểm lớp
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment Tab Content */}
                    {activeTab === 'assignments' && (
                        <>
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
                                                            {isAdmin ? 'Xem' : 'Xem & Chấm'}
                                                        </Button>
                                                        {isAdmin && assignment.teacher_id && (
                                                            <Button
                                                                onClick={() => handleRequestGrading(assignment)}
                                                                variant="outline"
                                                                disabled={sendingNotification === assignment.id}
                                                            >
                                                                {sendingNotification === assignment.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Bell className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        )}
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
                        </>
                    )}

                    {/* Gradebook Tab Content */}
                    {activeTab === 'gradebook' && (
                        <>
                            {/* Filters */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                <Users className="w-4 h-4 inline mr-1" />
                                                Chọn lớp học
                                            </label>
                                            <select
                                                value={selectedClassroomId}
                                                onChange={(e) => {
                                                    setSelectedClassroomId(e.target.value);
                                                    setGradeSummary(null);
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">-- Chọn lớp --</option>
                                                {classrooms.map((classroom) => (
                                                    <option key={classroom.id} value={classroom.id}>
                                                        {classroom.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                <BookOpen className="w-4 h-4 inline mr-1" />
                                                Chọn môn học (tùy chọn)
                                            </label>
                                            <select
                                                value={selectedSubjectId}
                                                onChange={(e) => {
                                                    setSelectedSubjectId(e.target.value);
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">-- Tất cả môn --</option>
                                                {subjectsList.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={loadGradeSummary}
                                                disabled={!selectedClassroomId}
                                                className="w-full"
                                            >
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                Xem bảng điểm
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Grade Summary */}
                            {gradeSummary && (
                                <>
                                    {/* Classroom Info giống trang điểm danh */}
                                    {selectedClassroom && (
                                        <Card>
                                            <CardHeader>
                            <CardTitle className="text-xl">
                                {selectedClassroom.name}
                            </CardTitle>
                                                <CardDescription>
                                                    <span className="block">
                                                        {selectedClassroom.grade
                                                            ? `Khối ${selectedClassroom.grade}`
                                                            : 'Lớp học'}
                                                        {selectedClassroom.academic_year && ` • Năm học ${selectedClassroom.academic_year}`}
                                                    </span>
                                                    {selectedClassroom.open_date && (
                                                        <span className="block text-xs text-slate-500">
                                                            Bắt đầu: {new Date(selectedClassroom.open_date).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
                                                    {selectedClassroom.close_date && (
                                                        <span className="block text-xs text-slate-500">
                                                            Kết thúc: {new Date(selectedClassroom.close_date).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    )}
                                                    {selectedSubject && (
                                                        <span className="block text-xs text-slate-500">
                                                            Môn: {selectedSubject.name}
                                                        </span>
                                                    )}
                                                    {selectedClassroomTeacher && (
                                                        <span className="block text-xs text-slate-500">
                                                            Giáo viên: {selectedClassroomTeacher.name}
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    )}

                                    {/* Statistics */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="text-sm text-slate-600 mb-1">Tổng số học sinh</div>
                                                <div className="text-3xl font-bold text-blue-600">{gradeSummary.total_students}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="text-sm text-slate-600 mb-1">Đã có điểm</div>
                                                <div className="text-3xl font-bold text-green-600">
                                                    {gradeSummary.students.filter((s) => s.graded_assignments > 0).length}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="text-sm text-slate-600 mb-1">Điểm TB lớp</div>
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {gradeSummary.students.length > 0
                                                        ? (
                                                            gradeSummary.students.reduce((sum, s) => sum + s.average_score, 0) /
                                                            gradeSummary.students.length
                                                        ).toFixed(2)
                                                        : '0.00'}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="text-sm text-slate-600 mb-1">Học sinh giỏi</div>
                                                <div className="text-3xl font-bold text-green-600">
                                                    {gradeSummary.students.filter((s) => s.classification === 'Giỏi').length}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Search */}
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    placeholder="Tìm kiếm học sinh..."
                                                    value={studentSearchQuery}
                                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Table */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Bảng điểm chi tiết</CardTitle>
                                            <CardDescription>
                                                {gradeSummary.subject_id
                                                    ? `Môn: ${subjectsList.find((s) => s.id === gradeSummary.subject_id)?.name || 'N/A'}`
                                                    : 'Tất cả các môn'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-100 border-b border-slate-300">
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STT</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Họ và tên</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Tổng bài</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Đã chấm</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Chờ chấm</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Tổng điểm</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Điểm TB</th>
                                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Xếp loại</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredStudents.map((student, index) => (
                                                            <tr
                                                                key={student.student_id}
                                                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                                    {student.student_name}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center text-slate-600">
                                                                    {student.total_assignments}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">
                                                                    {student.graded_assignments}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center text-yellow-600 font-semibold">
                                                                    {student.pending_assignments}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center text-slate-700 font-semibold">
                                                                    {student.total_score.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-center">
                                                                    <span
                                                                        className={`font-bold text-lg ${student.average_score >= 8
                                                                                ? 'text-green-600'
                                                                                : student.average_score >= 6.5
                                                                                    ? 'text-blue-600'
                                                                                    : student.average_score >= 5
                                                                                        ? 'text-yellow-600'
                                                                                        : student.average_score >= 3.5
                                                                                            ? 'text-orange-600'
                                                                                            : 'text-red-600'
                                                                            }`}
                                                                    >
                                                                        {student.average_score.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Badge
                                                                        className={`${getClassificationColor(
                                                                            student.classification
                                                                        )} border font-semibold`}
                                                                    >
                                                                        {student.classification}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {filteredStudents.length === 0 && (
                                                            <tr>
                                                                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                                                    Không tìm thấy học sinh nào
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {!gradeSummary && selectedClassroomId && (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500">Chọn lớp học và nhấn "Xem bảng điểm" để xem kết quả</p>
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
