'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Users,
    Search,
    Loader2,
    Eye,
    BookOpen,
    FileText,
    ChevronRight,
    Award,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Classroom {
    id: string;
    name: string;
    grade: string;
    academic_year: string;
    open_date?: string;
    close_date?: string;
    teacher_id?: string;
    teacher?: {
        id: string;
        name: string;
        email: string;
    };
    subject_id?: string;
    subject_name?: string;
    student_count?: number;
}

type AssignmentType = 'quiz' | 'essay';

interface Assignment {
    id: string;
    classroom_id: string;
    title: string;
    type: AssignmentType; // 'quiz' = trắc nghiệm, 'essay' = tự luận
    description?: string;
    due_date?: string;
    total_points?: number;
    created_at?: string;
}

interface SubmissionSummary {
    id: string;
    assignment_id: string;
    student_id: string;
    student_name: string;
    latest_score?: number | null;
    attempts_count: number;
    last_submitted_at?: string | null;
}

interface SubmissionAttempt {
    id: string;
    assignment_id: string;
    student_id: string;
    attempt_number?: number;
    score?: number | null;
    submitted_at: string;
    is_graded?: boolean;
    feedback?: string | null;
    answers?: Record<string, any>;
    files?: Array<{ name: string; url: string; type?: string; size?: number }>;
    links?: string[];
    graded_at?: string | null;
}

interface SubmissionDetail extends SubmissionAttempt {
    assignment?: Assignment;
}

export default function TeacherGradesPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loadingClassrooms, setLoadingClassrooms] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');
    const [attempts, setAttempts] = useState<SubmissionAttempt[]>([]);
    const [loadingAttempts, setLoadingAttempts] = useState(false);

    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
    const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);

    useEffect(() => {
        if (!authLoading && user && user.role === 'teacher') {
            loadClassrooms();
        }
    }, [user, authLoading]);

    const loadClassrooms = async () => {
        try {
            setLoadingClassrooms(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            // Lấy teacher_id từ user hiện tại
            let classroomsUrl = `${API_BASE_URL}/api/classrooms`;
            if (user?.id) {
                try {
                    const teacherRes = await fetch(
                        `${API_BASE_URL}/api/teachers?user_id=${user.id}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        }
                    );

                    if (teacherRes.ok) {
                        const teachersData = await teacherRes.json();
                        if (Array.isArray(teachersData) && teachersData.length > 0) {
                            const teacherId = teachersData[0].id;
                            classroomsUrl += `?teacher_id=${teacherId}`;
                        }
                    }
                } catch (e) {
                    console.error('Error loading teacher for teacher grades page:', e);
                }
            }

            const res = await fetch(classroomsUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                const list: Classroom[] = (Array.isArray(data) ? data : []).map((raw: any) => ({
                    id: raw.id,
                    name: raw.name,
                    grade: raw.grade || '',
                    academic_year: raw.academic_year || '',
                    open_date: raw.open_date,
                    close_date: raw.close_date,
                    teacher_id: raw.teacher_id,
                    subject_id: raw.subject_id,
                    subject_name: raw.subject?.name || raw.subject_name,
                    student_count: raw.student_count,
                    teacher: raw.teacher
                        ? {
                              id: raw.teacher.id,
                              name:
                                  raw.teacher.name ||
                                  raw.teacher.users?.full_name ||
                                  'Chưa có',
                              email: raw.teacher.email || raw.teacher.users?.email || '',
                          }
                        : undefined,
                }));
                setClassrooms(list);
            } else {
                setClassrooms([]);
            }
        } catch (error) {
            console.error('Error loading classrooms for teacher grades page:', error);
            setClassrooms([]);
        } finally {
            setLoadingClassrooms(false);
        }
    };

    const loadAssignments = async (classroom: Classroom) => {
        try {
            setLoadingAssignments(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            const res = await fetch(
                `${API_BASE_URL}/api/assignments?classroom_id=${classroom.id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                const list: Assignment[] = (Array.isArray(data?.data) ? data.data : data || []).map(
                    (raw: any) => ({
                        id: raw.id,
                        classroom_id: raw.classroom_id,
                        title: raw.title || raw.name || 'Bài tập không tên',
                        type: (raw.type || 'quiz') as AssignmentType,
                        description: raw.description,
                        due_date: raw.due_date,
                        total_points: raw.total_points,
                        created_at: raw.created_at,
                    })
                );
                setAssignments(list);
            } else {
                setAssignments([]);
            }
        } catch (error) {
            console.error('Error loading assignments (teacher grades):', error);
            setAssignments([]);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const loadSubmissions = async (assignment: Assignment) => {
        try {
            setLoadingSubmissions(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            const res = await fetch(
                `${API_BASE_URL}/api/assignments/${assignment.id}/submissions`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                const allSubmissions: any[] = Array.isArray(data) ? data : [];

                const studentMap = new Map<string, SubmissionSummary>();

                for (const raw of allSubmissions) {
                    const studentId = raw.student_id;
                    if (!studentMap.has(studentId)) {
                        let studentName = 'Học sinh';
                        if (raw.student?.users?.full_name) {
                            studentName = raw.student.users.full_name;
                        } else if (raw.student?.name) {
                            studentName = raw.student.name;
                        }

                        studentMap.set(studentId, {
                            id: raw.id,
                            assignment_id: raw.assignment_id,
                            student_id: studentId,
                            student_name: studentName,
                            latest_score: null,
                            attempts_count: 0,
                            last_submitted_at: null,
                        });
                    }

                    const summary = studentMap.get(studentId)!;
                    summary.attempts_count++;

                    const submittedAt = raw.submitted_at;
                    if (submittedAt) {
                        if (
                            !summary.last_submitted_at ||
                            new Date(submittedAt) > new Date(summary.last_submitted_at)
                        ) {
                            summary.last_submitted_at = submittedAt;
                            summary.latest_score = raw.score ?? null;
                        }
                    }
                }

                setSubmissions(Array.from(studentMap.values()));
            } else {
                setSubmissions([]);
            }
        } catch (error) {
            console.error('Error loading submissions (teacher grades):', error);
            setSubmissions([]);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const loadAttempts = async (assignmentId: string, studentId: string) => {
        try {
            setLoadingAttempts(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            const res = await fetch(
                `${API_BASE_URL}/api/assignments/${assignmentId}/submissions`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                const allSubmissions: any[] = Array.isArray(data) ? data : [];

                const studentSubmissions = allSubmissions
                    .filter((raw: any) => raw.student_id === studentId)
                    .sort((a: any, b: any) => {
                        const dateA = new Date(a.submitted_at).getTime();
                        const dateB = new Date(b.submitted_at).getTime();
                        return dateB - dateA;
                    })
                    .map((raw: any, idx: number) => ({
                        id: raw.id,
                        assignment_id: raw.assignment_id,
                        student_id: raw.student_id,
                        attempt_number: raw.attempt_number ?? idx + 1,
                        score: raw.score ?? null,
                        submitted_at: raw.submitted_at,
                        is_graded: raw.is_graded ?? false,
                        feedback: raw.feedback ?? null,
                        answers: raw.answers ?? {},
                        files: raw.files ?? [],
                        links: raw.links ?? [],
                        graded_at: raw.graded_at ?? null,
                    }));

                setAttempts(studentSubmissions);
            } else {
                setAttempts([]);
            }
        } catch (error) {
            console.error('Error loading attempts (teacher grades):', error);
            setAttempts([]);
        } finally {
            setLoadingAttempts(false);
        }
    };

    const loadSubmissionDetail = async (submissionId: string, assignmentId: string) => {
        try {
            setLoadingSubmissionDetail(true);
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
                    : null;

            const submissionsRes = await fetch(
                `${API_BASE_URL}/api/assignments/${assignmentId}/submissions`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (submissionsRes.ok) {
                const submissionsData = await submissionsRes.json();
                const allSubmissions: any[] = Array.isArray(submissionsData)
                    ? submissionsData
                    : [];
                const submission = allSubmissions.find((s: any) => s.id === submissionId);

                if (submission) {
                    const assignmentRes = await fetch(
                        `${API_BASE_URL}/api/assignments/${assignmentId}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        }
                    );

                    let assignment: Assignment | undefined;
                    if (assignmentRes.ok) {
                        const assignmentData = await assignmentRes.json();
                        assignment = {
                            id: assignmentData.id,
                            classroom_id: assignmentData.classroom_id,
                            title:
                                assignmentData.title ||
                                assignmentData.name ||
                                'Bài tập không tên',
                            type: (assignmentData.type || 'quiz') as AssignmentType,
                            description: assignmentData.description,
                            due_date: assignmentData.due_date,
                            total_points: assignmentData.total_points,
                            created_at: assignmentData.created_at,
                        };
                    }

                    const detail: SubmissionDetail = {
                        id: submission.id,
                        assignment_id: submission.assignment_id,
                        student_id: submission.student_id,
                        attempt_number: submission.attempt_number,
                        score: submission.score ?? null,
                        submitted_at: submission.submitted_at,
                        is_graded: submission.is_graded ?? false,
                        feedback: submission.feedback ?? null,
                        answers: submission.answers ?? {},
                        files: submission.files ?? [],
                        links: submission.links ?? [],
                        graded_at: submission.graded_at ?? null,
                        assignment,
                    };

                    setSelectedSubmission(detail);
                }
            }
        } catch (error) {
            console.error('Error loading submission detail (teacher grades):', error);
        } finally {
            setLoadingSubmissionDetail(false);
        }
    };

    const handleSelectClassroom = (classroom: Classroom) => {
        setSelectedClassroom(classroom);
        setSelectedAssignment(null);
        setSelectedStudentId(null);
        setSelectedStudentName('');
        setSelectedSubmission(null);
        setAttempts([]);
        setSubmissions([]);
        loadAssignments(classroom);
    };

    const handleSelectAssignment = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setSelectedStudentId(null);
        setSelectedStudentName('');
        setSelectedSubmission(null);
        setAttempts([]);
        loadSubmissions(assignment);
    };

    const handleSelectStudent = (submission: SubmissionSummary) => {
        setSelectedStudentId(submission.student_id);
        setSelectedStudentName(submission.student_name);
        setSelectedSubmission(null);
        loadAttempts(submission.assignment_id, submission.student_id);
    };

    const handleSelectSubmission = (attempt: SubmissionAttempt) => {
        if (selectedAssignment) {
            loadSubmissionDetail(attempt.id, selectedAssignment.id);
        }
    };

    const filteredClassrooms = classrooms.filter((classroom) => {
        const q = searchQuery.toLowerCase();
        return (
            classroom.name.toLowerCase().includes(q) ||
            classroom.grade.toLowerCase().includes(q) ||
            (classroom.teacher?.name || '').toLowerCase().includes(q)
        );
    });

    if (authLoading || loadingClassrooms) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'teacher') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        Bạn không có quyền truy cập trang này
                    </p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    const renderAssignmentTypeBadge = (type: AssignmentType) => {
        if (type === 'quiz') {
            return (
                <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                    Trắc nghiệm
                </Badge>
            );
        }
        return (
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                Tự luận
            </Badge>
        );
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <TeacherSidebar
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
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Quản lý Điểm số</h1>
                        <p className="text-indigo-100">
                            Xem điểm theo lớp, theo bài tập và theo từng học sinh (chỉ các lớp bạn phụ trách)
                        </p>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-indigo-600"
                            onClick={() => {
                                setSelectedClassroom(null);
                                setSelectedAssignment(null);
                                setSelectedStudentId(null);
                                setSelectedStudentName('');
                                setAttempts([]);
                                setSubmissions([]);
                            }}
                        >
                            Lớp học
                        </button>
                        {selectedClassroom && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:text-indigo-600"
                                    onClick={() => {
                                        setSelectedAssignment(null);
                                        setSelectedStudentId(null);
                                        setSelectedStudentName('');
                                        setAttempts([]);
                                        setSubmissions([]);
                                    }}
                                >
                                    {selectedClassroom.name}
                                </button>
                            </>
                        )}
                        {selectedAssignment && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:text-indigo-600"
                                    onClick={() => {
                                        setSelectedStudentId(null);
                                        setSelectedStudentName('');
                                        setAttempts([]);
                                    }}
                                >
                                    {selectedAssignment.title}
                                </button>
                            </>
                        )}
                        {selectedStudentId && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:text-indigo-600"
                                    onClick={() => {
                                        setSelectedSubmission(null);
                                    }}
                                >
                                    {selectedStudentName}
                                </button>
                            </>
                        )}
                        {selectedSubmission && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span>Lần nộp {selectedSubmission.attempt_number || 'N/A'}</span>
                            </>
                        )}
                    </div>

                    {/* Bước 1: Danh sách lớp (chỉ lớp của giáo viên) */}
                    {!selectedClassroom && (
                        <>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Tìm kiếm lớp học, khối..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredClassrooms.map((classroom) => (
                                    <Card
                                        key={classroom.id}
                                        className="hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => handleSelectClassroom(classroom)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg mb-1">
                                                        {classroom.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        <span className="block">
                                                            {classroom.academic_year
                                                                ? `Năm học: ${classroom.academic_year}`
                                                                : 'Chưa có năm học'}
                                                        </span>
                                                        {classroom.subject_name && (
                                                            <span className="block text-xs text-slate-500">
                                                                Môn: {classroom.subject_name}
                                                            </span>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="secondary">
                                                    {classroom.student_count || 0} HS
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Users className="w-4 h-4" />
                                                <span>{classroom.teacher?.name || 'Bạn'}</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-center"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectClassroom(classroom);
                                                }}
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Xem bài tập & điểm
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredClassrooms.length === 0 && (
                                    <Card className="col-span-full">
                                        <CardContent className="p-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-500">
                                                Hiện bạn chưa được gán vào lớp nào
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    )}

                    {/* Bước 2: Danh sách bài tập trong lớp */}
                    {selectedClassroom && !selectedAssignment && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">
                                        {selectedClassroom.name}
                                    </CardTitle>
                                    <CardDescription>
                                        <span className="block">
                                            Quản lý bài tập và điểm số của lớp này
                                        </span>
                                        {selectedClassroom.teacher && (
                                            <span className="block text-xs text-slate-500">
                                                Giáo viên: {selectedClassroom.teacher.name}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Danh sách bài tập</CardTitle>
                                    <CardDescription>
                                        Bấm vào từng bài để xem danh sách học sinh nộp
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingAssignments ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                                            <span className="text-gray-600">
                                                Đang tải danh sách bài tập...
                                            </span>
                                        </div>
                                    ) : assignments.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>Chưa có bài tập nào cho lớp này</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {assignments.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-100"
                                                    onClick={() =>
                                                        handleSelectAssignment(assignment)
                                                    }
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {assignment.type === 'quiz' ? (
                                                            <Award className="w-5 h-5 text-indigo-600 mt-1" />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-emerald-600 mt-1" />
                                                        )}
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <div className="font-semibold text-slate-800">
                                                                    {assignment.title}
                                                                </div>
                                                                {renderAssignmentTypeBadge(
                                                                    assignment.type
                                                                )}
                                                            </div>
                                                            {assignment.description && (
                                                                <div className="text-sm text-slate-600 line-clamp-2">
                                                                    {assignment.description}
                                                                </div>
                                                            )}
                                                            <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-3">
                                                                {assignment.due_date && (
                                                                    <span>
                                                                        Hạn nộp:{' '}
                                                                        {new Date(
                                                                            assignment.due_date
                                                                        ).toLocaleString('vi-VN')}
                                                                    </span>
                                                                )}
                                                                {typeof assignment.total_points ===
                                                                    'number' && (
                                                                    <span>
                                                                        Thang điểm:{' '}
                                                                        {assignment.total_points}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectAssignment(assignment);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Danh sách nộp
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Bước 3: Danh sách học sinh nộp bài */}
                    {selectedClassroom && selectedAssignment && !selectedStudentId && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        {selectedAssignment.title}
                                    </CardTitle>
                                    <CardDescription>
                                        Danh sách học sinh đã nộp bài - bấm vào để xem các lần
                                        nộp chi tiết
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Học sinh nộp bài</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingSubmissions ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                                            <span className="text-gray-600">
                                                Đang tải danh sách nộp...
                                            </span>
                                        </div>
                                    ) : submissions.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>Chưa có học sinh nào nộp bài</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {submissions.map((submission) => (
                                                <div
                                                    key={submission.id}
                                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-100"
                                                    onClick={() => handleSelectStudent(submission)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Users className="w-5 h-5 text-slate-600 mt-1" />
                                                        <div>
                                                            <div className="font-semibold text-slate-800">
                                                                {submission.student_name}
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-500 space-x-3">
                                                                <span>
                                                                    Số lần nộp:{' '}
                                                                    <strong>
                                                                        {submission.attempts_count}
                                                                    </strong>
                                                                </span>
                                                                {submission.last_submitted_at && (
                                                                    <span>
                                                                        Lần cuối:{' '}
                                                                        {new Date(
                                                                            submission.last_submitted_at
                                                                        ).toLocaleString('vi-VN')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {typeof submission.latest_score ===
                                                            'number' && (
                                                            <div className="flex items-center gap-1 text-sm text-indigo-700">
                                                                <Award className="w-4 h-4" />
                                                                <span>
                                                                    Điểm:{' '}
                                                                    <strong>
                                                                        {submission.latest_score}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectStudent(submission);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Xem các lần nộp
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Bước 4: Các lần nộp của một học sinh */}
                    {selectedClassroom && selectedAssignment && selectedStudentId && !selectedSubmission && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        Các bài đã nộp của {selectedStudentName}
                                    </CardTitle>
                                    <CardDescription>
                                        Bài: {selectedAssignment.title} - Lớp:{' '}
                                        {selectedClassroom.name}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Lịch sử nộp bài</CardTitle>
                                    <CardDescription>
                                        Bấm vào một lần nộp để xem chi tiết
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingAttempts ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
                                            <span className="text-gray-600">
                                                Đang tải các lần nộp...
                                            </span>
                                        </div>
                                    ) : attempts.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>Chưa có dữ liệu lần nộp cho học sinh này</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {attempts.map((attempt) => (
                                                <div
                                                    key={attempt.id}
                                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                                                    onClick={() => handleSelectSubmission(attempt)}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-semibold text-slate-800">
                                                            Lần nộp {attempt.attempt_number || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {typeof attempt.score === 'number' && (
                                                                <div className="flex items-center gap-1 text-sm text-indigo-700">
                                                                    <Award className="w-4 h-4" />
                                                                    <span>
                                                                        Điểm:{' '}
                                                                        <strong>
                                                                            {attempt.score}
                                                                        </strong>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {attempt.is_graded && (
                                                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                                                    Đã chấm
                                                                </Badge>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectSubmission(attempt);
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Xem chi tiết
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-600">
                                                        Nộp lúc:{' '}
                                                        {new Date(
                                                            attempt.submitted_at
                                                        ).toLocaleString('vi-VN')}
                                                    </div>
                                                    {attempt.graded_at && (
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            Chấm lúc:{' '}
                                                            {new Date(
                                                                attempt.graded_at
                                                            ).toLocaleString('vi-VN')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Bước 5: Chi tiết lần nộp */}
                    {selectedClassroom && selectedAssignment && selectedStudentId && selectedSubmission && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        Chi tiết lần nộp {selectedSubmission.attempt_number || 'N/A'}
                                    </CardTitle>
                                    <CardDescription>
                                        Học sinh: {selectedStudentName} - Bài:{' '}
                                        {selectedAssignment.title}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {loadingSubmissionDetail ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
                                        <p className="text-gray-600">Đang tải chi tiết...</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Thông tin bài tập */}
                                    {selectedSubmission.assignment && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Thông tin bài tập</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">
                                                        Tên bài tập
                                                    </div>
                                                    <div className="font-semibold text-slate-800">
                                                        {selectedSubmission.assignment.title}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {renderAssignmentTypeBadge(
                                                        selectedSubmission.assignment.type
                                                    )}
                                                    {typeof selectedSubmission.assignment.total_points ===
                                                        'number' && (
                                                        <Badge variant="outline">
                                                            Thang điểm:{' '}
                                                            {selectedSubmission.assignment.total_points}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {selectedSubmission.assignment.description && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Mô tả
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {selectedSubmission.assignment.description}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedSubmission.assignment.due_date && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Hạn nộp
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {new Date(
                                                                selectedSubmission.assignment.due_date
                                                            ).toLocaleString('vi-VN')}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Thông tin nộp bài */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Thông tin nộp bài</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">
                                                        Thời gian nộp
                                                    </div>
                                                    <div className="font-semibold text-slate-800">
                                                        {new Date(
                                                            selectedSubmission.submitted_at
                                                        ).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                                {selectedSubmission.score !== null &&
                                                    selectedSubmission.score !== undefined && (
                                                        <div>
                                                            <div className="text-sm text-slate-600 mb-1">
                                                                Điểm số
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Award className="w-5 h-5 text-indigo-600" />
                                                                <span className="text-2xl font-bold text-indigo-700">
                                                                    {selectedSubmission.score}
                                                                    {selectedSubmission.assignment?.total_points &&
                                                                        ` / ${selectedSubmission.assignment.total_points}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">
                                                        Trạng thái
                                                    </div>
                                                    <div>
                                                        {selectedSubmission.is_graded ? (
                                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                                Đã chấm
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                                                Chưa chấm
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedSubmission.graded_at && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-1">
                                                            Thời gian chấm
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {new Date(
                                                                selectedSubmission.graded_at
                                                            ).toLocaleString('vi-VN')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedSubmission.feedback && (
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-2">
                                                        Nhận xét của giáo viên
                                                    </div>
                                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-slate-700">
                                                        {selectedSubmission.feedback}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Files */}
                                            {selectedSubmission.files &&
                                                selectedSubmission.files.length > 0 && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-2">
                                                            Files đã nộp
                                                        </div>
                                                        <div className="space-y-2">
                                                            {selectedSubmission.files.map(
                                                                (file, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="w-4 h-4 text-slate-600" />
                                                                            <span className="text-slate-700">
                                                                                {file.name}
                                                                            </span>
                                                                            {file.size && (
                                                                                <span className="text-xs text-slate-500">
                                                                                    (
                                                                                    {(
                                                                                        file.size /
                                                                                        1024
                                                                                    ).toFixed(2)}{' '}
                                                                                    KB)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                window.open(
                                                                                    file.url,
                                                                                    '_blank'
                                                                                );
                                                                            }}
                                                                        >
                                                                            Mở
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Links */}
                                            {selectedSubmission.links &&
                                                selectedSubmission.links.length > 0 && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-2">
                                                            Links đã nộp
                                                        </div>
                                                        <div className="space-y-2">
                                                            {selectedSubmission.links.map(
                                                                (link, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                                                                    >
                                                                        <a
                                                                            href={link}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-indigo-600 hover:underline break-all"
                                                                        >
                                                                            {link}
                                                                        </a>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Answers */}
                                            {selectedSubmission.answers &&
                                                Object.keys(selectedSubmission.answers).length >
                                                    0 && (
                                                    <div>
                                                        <div className="text-sm text-slate-600 mb-2">
                                                            Câu trả lời
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                            <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                                                                {JSON.stringify(
                                                                    selectedSubmission.answers,
                                                                    null,
                                                                    2
                                                                )}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


