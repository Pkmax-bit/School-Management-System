<<<<<<< HEAD
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Building2, Clock, MapPin, User, BookOpen } from 'lucide-react';
import schedulesApi, { Schedule } from '@/lib/schedules-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DAYS_OF_WEEK = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'
];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (dateString?: string | null) => {
  if (!dateString) return null;
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateDisplay = (
  dateString?: string | null,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
) => {
  const date = parseDateOnly(dateString);
  if (!date) return '';
  return date.toLocaleDateString('vi-VN', options);
};

const getWeekStartDate = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // convert to Monday start
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const buildWeekDates = (startDate: Date) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, index) => {
    const dateObj = new Date(start);
    dateObj.setDate(start.getDate() + index);
    dateObj.setHours(0, 0, 0, 0);
    const isoDate = formatDateKey(dateObj);
    return {
      dayIndex: index,
      day: DAYS_OF_WEEK[index],
      dateObj,
      isoDate,
      display: dateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }),
      fullDisplay: dateObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
  });
};

const getTeacherDisplayName = (teacher?: Schedule['teacher']) =>
  teacher?.display_name ||
  teacher?.user?.full_name ||
  teacher?.email ||
  teacher?.teacher_code ||
  '';

const getTeacherEmail = (teacher?: Schedule['teacher']) =>
  teacher?.email || teacher?.user?.email || '';

export default function StudentSchedulePage() {
  const { isCollapsed } = useSidebar();
  const { user, loading: authLoading } = useApiAuth();
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [studentClassroomId, setStudentClassroomId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStartDate(new Date()));

  const loadStudentData = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      // Get student profile
      const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const student = studentsData.find((s: any) => s.user_id === user.id);

        if (student && student.classroom_id) {
          setStudentClassroomId(student.classroom_id);
          return student.classroom_id;
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
    return null;
  }, [user]);

  const loadSchedules = useCallback(async (classroomId: string) => {
    try {
      setLoadingSchedules(true);
      const data = await schedulesApi.list({ classroom_id: classroomId });
      const schedulesList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setSchedules(schedulesList);
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadStudentData().then((classroomId) => {
        if (classroomId) {
          loadSchedules(classroomId);
        }
      });
    }
  }, [authLoading, user, loadStudentData, loadSchedules]);

  const shiftWeek = (weeks: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setCurrentWeekStart(newDate);
  };

  const shiftMonth = (months: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setMonth(newDate.getMonth() + months);
    setCurrentWeekStart(getWeekStartDate(newDate));
  };

  const resetWeekToToday = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  const weekDates = useMemo(() => buildWeekDates(currentWeekStart), [currentWeekStart]);

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return '';
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];
    return `${first.display} - ${last.display}`;
  }, [weekDates]);

  const groupedSchedules = useMemo(() => {
    return weekDates.map(({ day, dayIndex, isoDate, display, fullDisplay }) => {
      const daySchedules = schedules.filter((schedule) => {
        // Nếu có ngày cụ thể (date), kiểm tra theo ngày
        if (schedule.date) {
          return schedule.date === isoDate;
        }
        // Nếu không có ngày cụ thể, kiểm tra theo day_of_week
        return schedule.day_of_week === dayIndex;
      });

      return {
        day,
        dayIndex,
        dateLabel: display,
        fullDateLabel: fullDisplay,
        schedules: daySchedules.sort((a, b) => {
          const timeA = a.start_time;
          const timeB = b.start_time;
          return timeA.localeCompare(timeB);
        }),
      };
    });
  }, [schedules, weekDates]);

  const schedulesForView = useMemo(() => {
    return schedules;
  }, [schedules]);

  if (authLoading || loadingSchedules) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải lịch học...</p>
        </div>
      </div>
    );
  }

  if (!studentClassroomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-600">Bạn chưa được gán vào lớp học nào</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <div className="flex-1 min-h-screen flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">📅 Lịch học</h1>
            <p className="text-lg text-gray-600">Xem thời khóa biểu của lớp học</p>
          </div>

          {/* Schedule Grid */}
          <Card className="card-transparent shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader className="card-transparent-header flex-shrink-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  📚 Lịch học theo tuần
                  <span className="text-sm font-normal text-gray-600">
                    ({schedulesForView.length} lịch học)
                  </span>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shiftMonth(-1)}
                    className="text-xs md:text-sm"
                  >
                    Tháng trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shiftWeek(-1)}
                    className="text-xs md:text-sm"
                  >
                    Tuần trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetWeekToToday}
                    className="text-xs md:text-sm"
                  >
                    Tuần hiện tại
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shiftWeek(1)}
                    className="text-xs md:text-sm"
                  >
                    Tuần sau
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shiftMonth(1)}
                    className="text-xs md:text-sm"
                  >
                    Tháng sau
                  </Button>
                  <span className="text-xs md:text-sm font-semibold text-gray-600">
                    {weekRangeLabel}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)', scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}>
              {loadingSchedules ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
                    <p className="text-lg text-gray-600">Đang tải lịch học...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {groupedSchedules.map(({ day, dayIndex, dateLabel, fullDateLabel, schedules }) => (
                    <div key={dayIndex} className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-200 shadow-md">
                        <h3 className="text-lg font-bold text-blue-900 mb-1">{day}</h3>
                        {dateLabel && (
                          <p className="text-sm text-blue-700 mb-2" title={fullDateLabel}>
                            {dateLabel}
                          </p>
                        )}
                        <div className="text-2xl font-bold text-blue-700 mb-1">{schedules.length}</div>
                        <p className="text-sm text-blue-600">lịch học</p>
                      </div>
                      <div className="space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#93c5fd #f1f5f9' }}>
                        {schedules.map((schedule) => {
                          const roomLabel = schedule.room_detail
                            ? `${schedule.room_detail.name || 'Phòng'} (${schedule.room_detail.code || schedule.room || ''})`
                            : schedule.room;
                          const teacherName = getTeacherDisplayName(schedule.teacher) || 'N/A';
                          const teacherEmail = getTeacherEmail(schedule.teacher);
                          return (
                            <div
                              key={schedule.id}
                              className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-300 transition-all duration-200"
                            >
                              {/* Classroom Information */}
                              <div className="mb-4">
                                <div className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                                  <BookOpen className="w-5 h-5 text-indigo-600" />
                                  <span className="text-gray-900">{schedule.classroom?.name || 'N/A'}</span>
                                  {schedule.classroom?.code && (
                                    <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-semibold">
                                      {schedule.classroom.code}
                                    </span>
                                  )}
                                </div>
                                {schedule.campus && (
                                  <div className="text-sm text-gray-700 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-600" />
                                    <span className="font-semibold">{schedule.campus.name}</span>
                                    {schedule.campus.code && (
                                      <span className="text-gray-500 text-xs">({schedule.campus.code})</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Subject Information */}
                              <div className="mb-4">
                                <div className="text-base font-semibold text-gray-800">
                                  <span className="text-gray-900">{schedule.subject?.name || 'N/A'}</span>
                                  {schedule.subject?.code && (
                                    <span className="text-sm text-gray-600 ml-2 font-normal">({schedule.subject.code})</span>
                                  )}
                                </div>
                              </div>

                              {/* Time and Room */}
                              <div className="mb-4 space-y-2">
                                <div className="text-sm text-gray-700 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-600" />
                                  <span className="font-semibold">{schedule.start_time} - {schedule.end_time}</span>
                                </div>
                                {schedule.date && (
                                  <div className="text-xs text-blue-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      Ngày: {formatDateDisplay(schedule.date)}
                                    </span>
                                  </div>
                                )}
                                {roomLabel && (
                                  <div className="text-sm text-gray-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-600" />
                                    <span className="font-semibold">Phòng: {roomLabel}</span>
                                  </div>
                                )}
                              </div>

                              {/* Teacher Information */}
                              <div className="mb-4">
                                <div className="text-sm text-gray-700 flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-600" />
                                  <span className="font-bold text-gray-900">{teacherName}</span>
                                </div>
                                {teacherEmail && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <span>Email:</span>
                                    <span>{teacherEmail}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {schedules.length === 0 && (
                          <div className="text-center text-gray-500 text-sm py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <div className="text-4xl mb-2">📅</div>
                            <div className="font-medium">Không có lịch học</div>
                            <div className="text-xs text-gray-400 mt-1">Chọn tuần khác để xem lịch học</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Summary */}
          {schedulesForView.length > 0 && (
            <Card className="card-transparent">
              <CardHeader className="card-transparent-header">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tổng quan lịch học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-800">{schedulesForView.length}</div>
                    <div className="text-sm font-semibold text-blue-700">Tổng số lịch học</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-800">
                      {new Set(schedulesForView.map(s => s.classroom?.name).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-green-700">Lớp học</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="text-3xl font-bold text-purple-800">
                      {new Set(schedulesForView.map(s => s.subject?.name).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-purple-700">Môn học</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="text-3xl font-bold text-orange-800">
                      {new Set(schedulesForView.map(s => getTeacherDisplayName(s.teacher)).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-orange-700">Giáo viên</div>
                  </div>
                </div>
                
                {/* Detailed breakdown by day */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Phân bố theo ngày trong tuần</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const daySchedules = schedulesForView.filter(s => s.day_of_week === index);
                      return (
                        <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="font-semibold text-gray-800 mb-2">{day}</div>
                          <div className="text-3xl font-bold text-indigo-700 mb-1">{daySchedules.length}</div>
                          <div className="text-xs font-medium text-gray-600">lịch học</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


=======
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
>>>>>>> origin/master
