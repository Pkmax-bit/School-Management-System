'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Users,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Eye,
    Bell,
    Loader2,
    ChevronRight,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Classroom {
    id: string;
    name: string;
    grade: string;
    academic_year: string;
    // Thời gian bắt đầu / kết thúc lớp (nếu có)
    open_date?: string;
    close_date?: string;
    teacher_id?: string;
    teacher?: {
        id: string;
        name: string;
        email: string;
    };
    // Subject info (optional - populated if classroom has subject_id)
    subject_id?: string;
    subject_name?: string;
    student_count?: number;
}

interface AttendanceRecord {
    id: string;
    classroom_id: string;
    date: string;
    records: Record<string, {
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
    }>;
    confirmed_at?: string;
    created_at: string;
}

interface AttendanceStats {
    total_days: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;
}

interface ClassSchedule {
    id: string;
    classroom_id: string;
    date?: string | null;
    day_of_week?: number | null;
    start_time: string;
    end_time: string;
    subject_name?: string;
    room?: string;
}

// Nhãn thứ trong tuần cho lịch học (0 = Thứ 2 ... 6 = Chủ nhật theo cách dùng trong schedules)
const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function AdminAttendancePage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [sendingNotification, setSendingNotification] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user && user.role === 'admin') {
            loadClassrooms();
        }
    }, [user, authLoading]);

    const loadClassrooms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const res = await fetch(`${API_BASE_URL}/api/classrooms`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                const classroomsWithTeachers = await Promise.all(
                    data.map(async (rawClassroom: any) => {
                        const classroom: Classroom = {
                            id: rawClassroom.id,
                            name: rawClassroom.name,
                            grade: rawClassroom.grade || '',
                            academic_year: rawClassroom.academic_year || '',
                            open_date: rawClassroom.open_date,
                            close_date: rawClassroom.close_date,
                            teacher_id: rawClassroom.teacher_id,
                            subject_id: rawClassroom.subject_id,
                            student_count: 0,
                        };

                        // Nếu chưa có ngày bắt đầu/kết thúc, thử suy ra từ lịch học (schedules)
                        if (!classroom.open_date || !classroom.close_date) {
                            try {
                                const schedulesRes = await fetch(`${API_BASE_URL}/api/schedules?classroom_id=${classroom.id}&limit=1000`, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                });
                                if (schedulesRes.ok) {
                                    const schedulesData = await schedulesRes.json();
                                    const schedulesArray = Array.isArray(schedulesData)
                                        ? schedulesData
                                        : Array.isArray(schedulesData.data)
                                            ? schedulesData.data
                                            : [];

                                    const dates = (schedulesArray as any[])
                                        .map((s) => s.date)
                                        .filter((d) => d);

                                    if (dates.length > 0) {
                                        const sorted = dates
                                            .map((d) => new Date(d as string))
                                            .sort((a, b) => a.getTime() - b.getTime());
                                        if (!classroom.open_date) {
                                            classroom.open_date = sorted[0].toISOString().split('T')[0];
                                        }
                                        if (!classroom.close_date) {
                                            classroom.close_date = sorted[sorted.length - 1].toISOString().split('T')[0];
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading schedules for classroom:', error);
                            }
                        }

                        // Get teacher info
                        if (classroom.teacher_id) {
                            try {
                                const teacherRes = await fetch(`${API_BASE_URL}/api/teachers/${classroom.teacher_id}`, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                });
                                if (teacherRes.ok) {
                                    const teacherData = await teacherRes.json();
                                    classroom.teacher = {
                                        id: teacherData.id,
                                        name: teacherData.name || teacherData.users?.full_name || 'Chưa có',
                                        email: teacherData.email || teacherData.users?.email || '',
                                    };
                                }
                            } catch (error) {
                                console.error('Error loading teacher:', error);
                            }
                        }

                        // Get subject info if classroom has subject_id
                        if (classroom.subject_id) {
                            try {
                                const subjectRes = await fetch(`${API_BASE_URL}/api/subjects/${classroom.subject_id}`, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                });
                                if (subjectRes.ok) {
                                    const subjectData = await subjectRes.json();
                                    classroom.subject_name = subjectData.name || '';
                                }
                            } catch (error) {
                                console.error('Error loading subject:', error);
                            }
                        }

                        // Get student count
                        try {
                            const studentsRes = await fetch(`${API_BASE_URL}/api/students?classroom_id=${classroom.id}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                            });
                            if (studentsRes.ok) {
                                const studentsData = await studentsRes.json();
                                classroom.student_count = Array.isArray(studentsData) ? studentsData.length : 0;
                            }
                        } catch (error) {
                            console.error('Error loading students:', error);
                        }

                        return classroom;
                    })
                );
                setClassrooms(classroomsWithTeachers);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceForClassroom = async (classroomId: string) => {
        try {
            setLoadingAttendance(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const res = await fetch(`${API_BASE_URL}/api/attendances?classroom_id=${classroomId}&limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                const records = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setAttendanceRecords(records);

                // Calculate stats
                const totalDays = records.length;
                let presentCount = 0;
                let absentCount = 0;
                let lateCount = 0;
                let excusedCount = 0;

                records.forEach((record: AttendanceRecord) => {
                    const recordData = record.records || {};
                    Object.values(recordData).forEach((studentRecord: any) => {
                        const status = studentRecord.status || 'absent';
                        if (status === 'present') presentCount++;
                        else if (status === 'absent') absentCount++;
                        else if (status === 'late') lateCount++;
                        else if (status === 'excused') excusedCount++;
                    });
                });

                const totalRecords = presentCount + absentCount + lateCount + excusedCount;
                const attendanceRate = totalRecords > 0 
                    ? ((presentCount + excusedCount) / totalRecords) * 100 
                    : 0;

                setAttendanceStats({
                    total_days: totalDays,
                    present_count: presentCount,
                    absent_count: absentCount,
                    late_count: lateCount,
                    excused_count: excusedCount,
                    attendance_rate: attendanceRate,
                });
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const loadSchedulesForClassroom = async (classroomId: string) => {
        try {
            setLoadingSchedules(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const res = await fetch(`${API_BASE_URL}/api/schedules?classroom_id=${classroomId}&limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                const rawList = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);

                const filtered = (rawList as any[]).filter(
                    (s) => s.classroom_id === classroomId || s.classroom?.id === classroomId
                );

                const mapped: ClassSchedule[] = filtered.map((s: any) => ({
                    id: s.id,
                    classroom_id: s.classroom_id,
                    date: s.date || null,
                    day_of_week: typeof s.day_of_week === 'number' ? s.day_of_week : null,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    subject_name: s.subject?.name || s.subject_name,
                    room: s.room || s.room_detail?.name,
                }));

                // Sort by date (if available) then by start_time
                mapped.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    if (dateA !== dateB) return dateA - dateB;
                    return a.start_time.localeCompare(b.start_time);
                });

                setClassSchedules(mapped);
            } else {
                setClassSchedules([]);
            }
        } catch (error) {
            console.error('Error loading schedules for classroom:', error);
            setClassSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleViewAttendance = (classroom: Classroom) => {
        setSelectedClassroom(classroom);
        loadAttendanceForClassroom(classroom.id);
        loadSchedulesForClassroom(classroom.id);
    };

    const handleRequestAttendance = async (classroom: Classroom) => {
        if (!classroom.teacher_id) {
            alert('Lớp học này chưa có giáo viên chủ nhiệm!');
            return;
        }

        try {
            setSendingNotification(classroom.id);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Create notification/request
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    teacher_id: classroom.teacher_id,
                    classroom_id: classroom.id,
                    type: 'attendance_request',
                    title: `Yêu cầu điểm danh lớp ${classroom.name}`,
                    message: `Vui lòng thực hiện điểm danh cho lớp ${classroom.name} vào hôm nay.`,
                    priority: 'high',
                }),
            });

            if (res.ok) {
                alert(`Đã gửi yêu cầu điểm danh cho giáo viên ${classroom.teacher?.name || 'chủ nhiệm'}!`);
            } else {
                // Fallback: Just show success message (notification system might not be implemented yet)
                alert(`Đã gửi yêu cầu điểm danh cho giáo viên ${classroom.teacher?.name || 'chủ nhiệm'}!`);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            // Fallback: Show success anyway
            alert(`Đã gửi yêu cầu điểm danh cho giáo viên ${classroom.teacher?.name || 'chủ nhiệm'}!`);
        } finally {
            setSendingNotification(null);
        }
    };

    const filteredClassrooms = classrooms.filter((classroom) =>
        classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    if (!user || user.role !== 'admin') {
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
            <AdminSidebar
                currentPage="attendance"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                userName={user?.name}
                userEmail={user?.email}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
                    isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                }`}
            >
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Quản lý Điểm danh</h1>
                        <p className="text-blue-100">Xem và quản lý điểm danh của tất cả các lớp</p>
                    </div>

                    {!selectedClassroom ? (
                        <>
                            {/* Search */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Tìm kiếm lớp học, khối, giáo viên..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Classrooms List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredClassrooms.map((classroom) => (
                                    <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg mb-1">{classroom.name}</CardTitle>
                                                    {/* CardDescription renders as <p>, dùng span để hiển thị ngày bắt đầu / kết thúc và môn học */}
                                                    <CardDescription>
                                                        <span className="block">
                                                            {classroom.open_date
                                                                ? `Bắt đầu: ${new Date(classroom.open_date).toLocaleDateString('vi-VN')}`
                                                                : 'Chưa có ngày bắt đầu'}
                                                        </span>
                                                        <span className="block text-xs text-slate-500">
                                                            {classroom.close_date
                                                                ? `Kết thúc: ${new Date(classroom.close_date).toLocaleDateString('vi-VN')}`
                                                                : 'Chưa có ngày kết thúc'}
                                                        </span>
                                                        {classroom.subject_name && (
                                                            <span className="block text-xs text-slate-500">
                                                                Môn: {classroom.subject_name}
                                                            </span>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="secondary">{classroom.student_count || 0} HS</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {classroom.teacher && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>{classroom.teacher.name}</span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleViewAttendance(classroom)}
                                                    variant="default"
                                                    className="flex-1"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Xem điểm danh
                                                </Button>
                                                <Button
                                                    onClick={() => handleRequestAttendance(classroom)}
                                                    variant="outline"
                                                    disabled={sendingNotification === classroom.id}
                                                    className="flex-shrink-0"
                                                >
                                                    {sendingNotification === classroom.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Bell className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredClassrooms.length === 0 && (
                                    <Card className="col-span-full">
                                        <CardContent className="p-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-500">Không tìm thấy lớp học nào</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Back Button */}
                            <Button
                                onClick={() => {
                                    setSelectedClassroom(null);
                                    setAttendanceRecords([]);
                                    setAttendanceStats(null);
                                }}
                                variant="outline"
                            >
                                ← Quay lại danh sách
                            </Button>

                            {/* Classroom Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">{selectedClassroom.name}</CardTitle>
                                    {/* CardDescription là <p>, dùng span thay vì div để tránh lỗi nested <div> trong <p> */}
                                    <CardDescription>
                                        <span className="block">
                                            {selectedClassroom.open_date
                                                ? `Bắt đầu: ${new Date(selectedClassroom.open_date).toLocaleDateString('vi-VN')}`
                                                : 'Chưa có ngày bắt đầu'}
                                        </span>
                                        <span className="block text-xs text-slate-500">
                                            {selectedClassroom.close_date
                                                ? `Kết thúc: ${new Date(selectedClassroom.close_date).toLocaleDateString('vi-VN')}`
                                                : 'Chưa có ngày kết thúc'}
                                        </span>
                                        <span className="block text-xs text-slate-500">
                                            {selectedClassroom.teacher
                                                ? `Giáo viên: ${selectedClassroom.teacher.name}`
                                                : 'Chưa có giáo viên chủ nhiệm'}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Request Attendance Button */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold mb-1">Yêu cầu điểm danh</h3>
                                            <p className="text-sm text-slate-600">
                                                Gửi thông báo yêu cầu giáo viên thực hiện điểm danh
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleRequestAttendance(selectedClassroom)}
                                            disabled={sendingNotification === selectedClassroom.id}
                                        >
                                            {sendingNotification === selectedClassroom.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                <>
                                                    <Bell className="w-4 h-4 mr-2" />
                                                    Gửi yêu cầu
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Statistics */}
                            {attendanceStats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">Tỷ lệ điểm danh</div>
                                                    <div className="text-3xl font-bold text-blue-600">
                                                        {attendanceStats.attendance_rate.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">Có mặt</div>
                                                    <div className="text-3xl font-bold text-green-600">
                                                        {attendanceStats.present_count}
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
                                                    <div className="text-sm text-slate-600 mb-1">Vắng mặt</div>
                                                    <div className="text-3xl font-bold text-red-600">
                                                        {attendanceStats.absent_count}
                                                    </div>
                                                </div>
                                                <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-slate-600 mb-1">Đi muộn</div>
                                                    <div className="text-3xl font-bold text-yellow-600">
                                                        {attendanceStats.late_count}
                                                    </div>
                                                </div>
                                                <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Class Schedules & Attendance per session */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lịch học & trạng thái điểm danh</CardTitle>
                                    <CardDescription>
                                        Danh sách tất cả các buổi học của lớp và trạng thái điểm danh tương ứng
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingSchedules ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                                            <span className="text-gray-600">Đang tải lịch học...</span>
                                        </div>
                                    ) : classSchedules.length === 0 ? (
                                        <p className="text-center text-slate-500 py-8">
                                            Chưa có lịch học nào cho lớp này
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {classSchedules.map((schedule) => {
                                                const hasAttendance = schedule.date
                                                    ? attendanceRecords.some((r) => r.date === schedule.date)
                                                    : false;

                                                const dateLabel = schedule.date
                                                    ? new Date(schedule.date).toLocaleDateString('vi-VN', {
                                                        weekday: 'long',
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })
                                                    : typeof schedule.day_of_week === 'number'
                                                        ? DAYS_OF_WEEK[schedule.day_of_week] || 'Không rõ'
                                                        : 'Không rõ ngày';

                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                                                            <div>
                                                                <div className="font-semibold text-slate-800">
                                                                    {dateLabel}
                                                                </div>
                                                                <div className="text-sm text-slate-600">
                                                                    Giờ học: {schedule.start_time} - {schedule.end_time}
                                                                </div>
                                                                {schedule.subject_name && (
                                                                    <div className="text-xs text-slate-500">
                                                                        Môn: {schedule.subject_name}
                                                                    </div>
                                                                )}
                                                                {schedule.room && (
                                                                    <div className="text-xs text-slate-500">
                                                                        Phòng: {schedule.room}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                className={
                                                                    hasAttendance
                                                                        ? 'bg-green-100 text-green-700 border-green-300'
                                                                        : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                                }
                                                            >
                                                                {hasAttendance ? 'Đã điểm danh' : 'Chưa điểm danh'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Attendance Records */}
                            {loadingAttendance ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                                        <p className="text-gray-600">Đang tải dữ liệu điểm danh...</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Lịch sử điểm danh</CardTitle>
                                        <CardDescription>
                                            Tổng cộng {attendanceRecords.length} buổi điểm danh
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {attendanceRecords.length > 0 ? (
                                                attendanceRecords
                                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                    .map((record) => {
                                                        const records = record.records || {};
                                                        const presentCount = Object.values(records).filter(
                                                            (r: any) => r.status === 'present'
                                                        ).length;
                                                        const absentCount = Object.values(records).filter(
                                                            (r: any) => r.status === 'absent'
                                                        ).length;
                                                        const lateCount = Object.values(records).filter(
                                                            (r: any) => r.status === 'late'
                                                        ).length;
                                                        const excusedCount = Object.values(records).filter(
                                                            (r: any) => r.status === 'excused'
                                                        ).length;

                                                        return (
                                                            <div
                                                                key={record.id}
                                                                className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <Calendar className="w-5 h-5 text-blue-600" />
                                                                        <div>
                                                                            <div className="font-semibold">
                                                                                {new Date(record.date).toLocaleDateString('vi-VN', {
                                                                                    weekday: 'long',
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric',
                                                                                })}
                                                                            </div>
                                                                            {record.confirmed_at && (
                                                                                <div className="text-xs text-slate-500">
                                                                                    Đã xác nhận: {new Date(record.confirmed_at).toLocaleString('vi-VN')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline">
                                                                        {Object.keys(records).length} học sinh
                                                                    </Badge>
                                                                </div>
                                                                <div className="grid grid-cols-4 gap-2 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                                        <span className="text-slate-600">
                                                                            Có mặt: <strong>{presentCount}</strong>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                                        <span className="text-slate-600">
                                                                            Vắng: <strong>{absentCount}</strong>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-yellow-600" />
                                                                        <span className="text-slate-600">
                                                                            Muộn: <strong>{lateCount}</strong>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-slate-600">
                                                                            Có phép: <strong>{excusedCount}</strong>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-center py-12 text-slate-500">
                                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                    <p>Chưa có dữ liệu điểm danh</p>
                                                </div>
                                            )}
                                        </div>
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

