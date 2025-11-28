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
    TrendingUp, 
    Users, 
    BookOpen,
    Search,
    Download,
    Filter,
    BarChart3
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface Classroom {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

export default function StudentGradesPage() {
    const { user, loading: authLoading } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [classroomId, setClassroomId] = useState<string>('');
    const [subjectId, setSubjectId] = useState<string>('');
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [gradeSummary, setGradeSummary] = useState<ClassroomGradeSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isTeacher = user?.role === 'teacher';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!authLoading && user && (isTeacher || isAdmin)) {
            loadClassrooms();
            loadSubjects();
        }
    }, [user, authLoading, isTeacher, isAdmin]);

    const loadClassrooms = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            let url = `${API_BASE_URL}/api/classrooms`;
            
            if (isTeacher) {
                // Get teacher_id
                const teacherRes = await fetch(`${API_BASE_URL}/api/teachers?user_id=${user.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (teacherRes.ok) {
                    const teachersData = await teacherRes.json();
                    if (teachersData.length > 0) {
                        url += `?teacher_id=${teachersData[0].id}`;
                    }
                }
            }

            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
        }
    };

    const loadSubjects = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/subjects`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const loadGradeSummary = async () => {
        if (!classroomId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            let url = `${API_BASE_URL}/api/assignments/classrooms/${classroomId}/grade-summary`;
            if (subjectId) {
                url += `?subject_id=${subjectId}`;
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

    const filteredStudents = gradeSummary?.students.filter((student) =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

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
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Bảng Điểm Tổng Hợp</h1>
                        <p className="text-indigo-100">Xem tổng điểm, điểm trung bình và xếp loại của học sinh</p>
                    </div>

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
                                        value={classroomId}
                                        onChange={(e) => {
                                            setClassroomId(e.target.value);
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
                                        value={subjectId}
                                        onChange={(e) => {
                                            setSubjectId(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Tất cả môn --</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={loadGradeSummary}
                                        disabled={!classroomId}
                                        className="w-full"
                                    >
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Xem bảng điểm
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grade Summary Table */}
                    {gradeSummary && (
                        <>
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
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
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
                                            ? `Môn: ${subjects.find((s) => s.id === gradeSummary.subject_id)?.name || 'N/A'}`
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
                                                                className={`font-bold text-lg ${
                                                                    student.average_score >= 8
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

                    {!gradeSummary && classroomId && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-500">Chọn lớp học và nhấn "Xem bảng điểm" để xem kết quả</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}


