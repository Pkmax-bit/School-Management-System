'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    MapPin,
    BookOpen,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

interface Schedule {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string;
    subject?: {
        id: string;
        name: string;
    };
    teacher?: {
        id: string;
        name?: string;
        email?: string;
    };
}

export default function StudentSchedulePage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadSchedule();
        }
    }, [user, authLoading]);

    const loadSchedule = async () => {
        try {
            if (!user) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Get student's classroom
            const studentRes = await fetch(`${API_BASE_URL}/api/students?user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (studentRes.ok) {
                const studentsData = await studentRes.json();
                if (studentsData.length > 0) {
                    const classroomId = studentsData[0].classroom_id;

                    // Get schedules for the classroom
                    const schedulesRes = await fetch(`${API_BASE_URL}/api/schedules?classroom_id=${classroomId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });

                    if (schedulesRes.ok) {
                        const schedulesData = await schedulesRes.json();
                        setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeekDates = () => {
        const start = new Date(currentWeek);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    };

    const getSchedulesForDay = (dayIndex: number) => {
        return schedules
            .filter(s => s.day_of_week === dayIndex)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    const previousWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeek(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeek(newDate);
    };

    const goToToday = () => {
        setCurrentWeek(new Date());
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

    const weekDates = getWeekDates();

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage="schedule"
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
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Thời khóa biểu</h1>
                        <p className="text-blue-100">Lịch học trong tuần</p>
                    </div>

                    {/* Week Navigation */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <Button onClick={previousWeek} variant="outline" size="sm">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="text-center">
                                    <p className="font-semibold text-lg">
                                        {weekDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {weekDates[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                    <Button onClick={goToToday} variant="ghost" size="sm" className="mt-1">
                                        Hôm nay
                                    </Button>
                                </div>
                                <Button onClick={nextWeek} variant="outline" size="sm">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {DAYS_OF_WEEK.map((dayName, index) => {
                            const daySchedules = getSchedulesForDay(index);
                            const isToday = weekDates[index].toDateString() === new Date().toDateString();

                            return (
                                <Card key={index} className={isToday ? 'ring-2 ring-blue-500' : ''}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <span>{dayName}</span>
                                            {isToday && (
                                                <Badge variant="default">Hôm nay</Badge>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-slate-500">
                                            {weekDates[index].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {daySchedules.length > 0 ? (
                                            daySchedules.map((schedule) => (
                                                <div
                                                    key={schedule.id}
                                                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-semibold text-blue-900">
                                                            {schedule.start_time} - {schedule.end_time}
                                                        </span>
                                                    </div>
                                                    {schedule.subject && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <BookOpen className="w-4 h-4 text-slate-600" />
                                                            <span className="text-sm font-medium text-slate-800">
                                                                {schedule.subject.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {schedule.room && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-slate-500" />
                                                            <span className="text-xs text-slate-600">
                                                                Phòng {schedule.room}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-400 text-center py-4">
                                                Không có lịch học
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
