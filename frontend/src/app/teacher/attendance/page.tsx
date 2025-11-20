'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { AttendanceSheet } from '@/components/AttendanceSheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  BookOpen,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import classroomsHybridApi from '@/lib/classrooms-api-hybrid';
import { attendancesAPI } from '@/lib/api';
import { studentsApi } from '@/lib/students-api';
import schedulesApi, { Schedule } from '@/lib/schedules-api';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { 
  parseAttendanceRecords, 
  getStudentAttendanceStatus,
  countAttendanceStats,
  type ParsedAttendanceRecords
} from '@/lib/attendance-utils';

interface Class {
  id: string;
  name: string;
  subject: string;
  subject_id?: string;
  teacher: string;
  teacher_id?: string;
  room?: string;
  time?: string;
  date: string;
  studentCount: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  attendanceStatus: 'pending' | 'completed';
  // Attendance statistics
  presentCount?: number;
  absentWithExcuse?: number;
  absentWithoutExcuse?: number;
  lateCount?: number;
  // Schedule attendance stats
  totalSchedules?: number;
  completedAttendanceCount?: number;
}

interface Student {
  id: string;
  name: string;
  studentCode: string;
  className: string;
  avatar?: string;
}

interface AttendanceRecord {
  classId: string;
  date: string;
  students: Student[];
  records: Record<string, {
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
    timestamp: string;
  }>;
  confirmedAt?: string;
}

export default function AttendancePage() {
  const { user, loading, logout } = useTeacherAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Record<string, Student[]>>({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [classSchedules, setClassSchedules] = useState<Record<string, Schedule[]>>({});
  const [loadingSchedules, setLoadingSchedules] = useState<Record<string, boolean>>({});
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<{ schedule: Schedule; classItem: Class } | null>(null);
  const [scheduleAttendances, setScheduleAttendances] = useState<Record<string, {
    totalStudents: number;
    attendedCount: number;
    status: 'complete' | 'incomplete' | 'not_started';
  }>>({});
  const [classAttendanceStats, setClassAttendanceStats] = useState<Record<string, {
    totalSchedules: number;
    completedCount: number;
  }>>({});
  const [todaySchedules, setTodaySchedules] = useState<Record<string, Schedule | null>>({});
  const [quickAttendanceLoading, setQuickAttendanceLoading] = useState<Record<string, boolean>>({});
  const [attendanceForStudentList, setAttendanceForStudentList] = useState<any>(null);
  const [loadingAttendanceForStudentList, setLoadingAttendanceForStudentList] = useState(false);
  
  const fetchAttendanceForSchedule = useCallback(async (classId: string, scheduleDate?: string | null) => {
    if (!scheduleDate) {
      console.warn('fetchAttendanceForSchedule: missing schedule date');
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const isTodaySchedule = scheduleDate === today;
    const queryDate = isTodaySchedule ? today : scheduleDate;

    const attendanceResponse = await attendancesAPI.getAttendances({
      classroom_id: classId,
      date: queryDate,
    });

    const attendance =
      attendanceResponse?.data &&
      Array.isArray(attendanceResponse.data) &&
      attendanceResponse.data.length > 0
        ? attendanceResponse.data[0]
        : null;

    if (!attendance) {
      return null;
    }

    const attendanceToSet = { ...attendance };
    if (attendanceToSet.records) {
      if (typeof attendanceToSet.records === 'string') {
        try {
          attendanceToSet.records = JSON.parse(attendanceToSet.records);
        } catch (err) {
          console.error('fetchAttendanceForSchedule: parse error', err);
          attendanceToSet.records = {};
        }
      } else if (typeof attendanceToSet.records === 'object' && !Array.isArray(attendanceToSet.records)) {
        attendanceToSet.records = { ...attendanceToSet.records };
      }
    } else {
      attendanceToSet.records = {};
    }

    return attendanceToSet;
  }, []);

  // Debug: Log when attendanceForStudentList changes
  useEffect(() => {
    console.log('🔄 attendanceForStudentList state changed:', attendanceForStudentList);
    if (attendanceForStudentList?.records) {
      console.log('🔄 Records in state:', attendanceForStudentList.records);
      console.log('🔄 Records type:', typeof attendanceForStudentList.records);
      console.log('🔄 Records keys:', Object.keys(attendanceForStudentList.records));
      console.log('🔄 Records keys count:', Object.keys(attendanceForStudentList.records).length);
    }
  }, [attendanceForStudentList]);

  // Load classrooms for teacher
  const loadClassrooms = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingClasses(true);
      setError(null);
      
      // Get teacher_id from user - query teachers table to find teacher by user_id
      let teacherId: string | null = null;
      
      try {
        // Try to get teacher_id from teachers table using user_id
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
        
        // Query all teachers and find the one matching user_id
        const teachersResponse = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          let teachers: any[] = [];
          
          // Handle different response formats
          if (Array.isArray(teachersData)) {
            teachers = teachersData;
          } else if (teachersData.data && Array.isArray(teachersData.data)) {
            teachers = teachersData.data;
          }
          
          // Find teacher with matching user_id
          const teacher = teachers.find((t: any) => t.user_id === user.id || t.id === user.id);
          if (teacher) {
            teacherId = teacher.id;
          } else {
            // If no match found, try using user.id as teacher_id (in case user.id is already teacher_id)
            teacherId = user.id;
          }
        } else {
          // Fallback to user.id if API call fails
          teacherId = user.id;
        }
      } catch (err) {
        console.warn('Could not fetch teacher_id from teachers table, using user.id:', err);
        // Fallback to user.id if query fails
        teacherId = user.id;
      }
      
      if (!teacherId) {
        setError('Không tìm thấy thông tin giáo viên');
        setLoadingClasses(false);
        return;
      }
      
      // Fetch classrooms for this teacher
      const classroomsData = await classroomsHybridApi.list({ teacher_id: teacherId });
      
      // Transform to Class format
      const transformedClasses: Class[] = await Promise.all(
        (classroomsData || []).map(async (classroom: any) => {
          // Get students in this classroom
          let studentList: Student[] = [];
          let attendanceStats = {
            presentCount: 0,
            absentWithExcuse: 0,
            absentWithoutExcuse: 0,
            lateCount: 0
          };
          
          try {
            // Get students from classroom
            if (classroom.students && Array.isArray(classroom.students)) {
              studentList = classroom.students.map((s: any) => ({
                id: s.id || s.student_id,
                name: s.name || s.full_name || 'N/A',
                studentCode: s.student_code || s.code || '',
                className: classroom.name || '',
                avatar: s.avatar
              }));
            }
            
            // Get today's attendance records
            const today = new Date().toISOString().split('T')[0];
            const attendanceResponse = await attendancesAPI.getAttendances({
              classroom_id: classroom.id,
              date: today
            });
            
            if (attendanceResponse?.data && Array.isArray(attendanceResponse.data) && attendanceResponse.data.length > 0) {
              const attendance = attendanceResponse.data[0];
              
              // Parse records using utility function
              const records = parseAttendanceRecords(attendance.records);
              
              if (records && Object.keys(records).length > 0) {
                // Use Object.entries to get both student_id (key) and record (value)
                Object.entries(records).forEach(([studentId, record]) => {
                  // Get normalized status
                  const attendanceInfo = getStudentAttendanceStatus(studentId, records);
                  
                  if (attendanceInfo.status === 'present') {
                    attendanceStats.presentCount++;
                  } else if (attendanceInfo.status === 'late') {
                    attendanceStats.lateCount++;
                  } else if (attendanceInfo.status === 'absent') {
                      attendanceStats.absentWithoutExcuse++;
                  } else if (attendanceInfo.status === 'excused') {
                    attendanceStats.absentWithExcuse++;
                  }
                });
              }
            }
          } catch (err) {
            console.warn('Error loading students/attendance for classroom:', classroom.id, err);
          }
          
          // Determine status based on current time and date
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const isToday = classroom.open_date === today || !classroom.open_date;
          
          let status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' = 'scheduled';
          if (classroom.close_date && classroom.close_date < today) {
            status = 'completed';
          } else if (isToday) {
            status = 'in-progress';
          }
          
          // Check if attendance is completed
          const attendanceStatus = attendanceStats.presentCount > 0 || 
                                   attendanceStats.absentWithExcuse > 0 || 
                                   attendanceStats.absentWithoutExcuse > 0 
                                   ? 'completed' : 'pending';
          
          return {
            id: classroom.id,
            name: classroom.name || '',
            subject: classroom.subject?.name || classroom.subject_name || 'Chưa có môn học',
            subject_id: classroom.subject_id,
            teacher: user.name || 'Giáo viên',
            teacher_id: teacherId,
            room: classroom.room || 'Chưa có phòng',
            time: classroom.schedule?.time || 'Chưa có lịch',
            date: today,
            studentCount: studentList.length || classroom.capacity || 0,
            status,
            attendanceStatus,
            ...attendanceStats
          };
        })
      );
      
      setClasses(transformedClasses);
      
      // Store students by classroom id from transformed classes
      const studentsMap: Record<string, Student[]> = {};
      (classroomsData || []).forEach((classroom: any, index: number) => {
        if (classroom.students && Array.isArray(classroom.students)) {
          const studentList: Student[] = classroom.students.map((s: any) => ({
            id: s.id || s.student_id,
            name: s.name || s.full_name || 'N/A',
            studentCode: s.student_code || s.code || '',
            className: classroom.name || '',
            avatar: s.avatar
          }));
          studentsMap[classroom.id] = studentList;
        }
      });
      setStudents(prev => ({ ...prev, ...studentsMap }));

      // Load today's schedules for all classrooms
      const today = new Date().toISOString().split('T')[0];
      for (const classroom of classroomsData || []) {
        try {
          const schedules = await schedulesApi.list({ classroom_id: classroom.id });
          const sortedSchedules = (schedules || []).sort((a: Schedule, b: Schedule) => {
            if (a.date && b.date) {
              return a.date.localeCompare(b.date);
            }
            if (a.date) return -1;
            if (b.date) return 1;
            return a.day_of_week - b.day_of_week;
          });
          
          // Find today's schedule
          const todaySchedule = sortedSchedules.find((s: Schedule) => s.date === today) || null;
          setTodaySchedules(prev => ({ ...prev, [classroom.id]: todaySchedule }));
          
          // If found today's schedule, load attendance status for it
          if (todaySchedule) {
            // Load students first if needed
            if (!studentsMap[classroom.id] || studentsMap[classroom.id].length === 0) {
              await loadStudentsForClass(classroom.id);
            }
            // Load attendance status for today's schedule
            await loadAttendanceStatusForSchedules(classroom.id, [todaySchedule]);
          }
        } catch (err) {
          console.warn(`Error loading today's schedule for classroom ${classroom.id}:`, err);
        }
      }
      
    } catch (err: any) {
      console.error('Error loading classrooms:', err);
      setError(err.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoadingClasses(false);
    }
  }, [user]);

  // Load students for selected class
  const loadStudentsForClass = useCallback(async (classId: string) => {
    try {
      console.log('Loading students for class:', classId);
      
      // Get classroom info first to get classroom name
      let classroomName = '';
    try {
      const classroom = await classroomsHybridApi.get(classId);
        classroomName = classroom.name || '';
        console.log('Classroom data:', classroom);
      } catch (err) {
        console.warn('Could not load classroom info:', err);
      }
      
      // Load students from students API with classroom_id filter
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const studentsResponse = await fetch(`${API_BASE_URL}/api/students?limit=1000&classroom_id=${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!studentsResponse.ok) {
        throw new Error(`Failed to load students: ${studentsResponse.status}`);
      }
      
      const studentsData = await studentsResponse.json();
      console.log('Students API response:', studentsData);
      
      // Handle different response formats
      let studentsList: any[] = [];
      if (Array.isArray(studentsData)) {
        studentsList = studentsData;
      } else if (studentsData.data && Array.isArray(studentsData.data)) {
        studentsList = studentsData.data;
      } else if (studentsData.students && Array.isArray(studentsData.students)) {
        studentsList = studentsData.students;
      }
      
      console.log('Parsed students list:', studentsList);
      
      if (studentsList.length > 0) {
        const studentList: Student[] = studentsList.map((s: any) => {
          // Ensure we use the correct student_id (from students table, not user_id)
          // s.id is the student_id from students table
          const studentId = s.id || s.student_id;
          if (!studentId) {
            console.warn('Student missing ID:', s);
          }
          return {
            id: studentId, // This is the student_id from students table
            name: s.name || s.full_name || s.users?.full_name || 'N/A',
            studentCode: s.student_code || s.code || s.users?.email || '',
            className: classroomName || s.classroom?.name || '',
            avatar: s.avatar
          };
        });
        
        console.log('Mapped students:', studentList);
        
        // Always update students state
        setStudents(prev => ({
          ...prev,
          [classId]: studentList
        }));
        
        return studentList;
      } else {
        console.warn('No students found for classroom:', classId);
        // Set empty array if no students
        setStudents(prev => ({
          ...prev,
          [classId]: []
        }));
        return [];
      }
    } catch (err) {
      console.error('Error loading students:', err);
      // Set empty array on error
      setStudents(prev => ({
        ...prev,
        [classId]: []
      }));
    return [];
    }
  }, []);

  const handleViewAttendance = useCallback(
    async (classItem: Class, schedule?: Schedule) => {
      if (!schedule?.date) {
        alert('Lịch học này chưa có ngày cụ thể, không thể xem điểm danh.');
        return;
      }

      try {
        await loadStudentsForClass(classItem.id);
        setLoadingAttendanceForStudentList(true);
        const attendance = await fetchAttendanceForSchedule(classItem.id, schedule.date);
        setLoadingAttendanceForStudentList(false);

        if (!attendance) {
          alert('Không tìm thấy dữ liệu điểm danh cho lịch học này.');
          return;
        }

        setSelectedSchedule({ schedule, classItem });
        setAttendanceForStudentList(attendance);
        setShowStudentList(true);
      } catch (error) {
        console.error('Error loading attendance for schedule:', error);
        setLoadingAttendanceForStudentList(false);
        alert('Không thể tải dữ liệu điểm danh. Vui lòng thử lại.');
      }
    },
    [fetchAttendanceForSchedule, loadStudentsForClass]
  );

  // Load schedules for a classroom
  const loadSchedulesForClass = useCallback(async (classId: string) => {
    if (classSchedules[classId]) {
      // Already loaded
      return;
    }

    try {
      setLoadingSchedules(prev => ({ ...prev, [classId]: true }));
      const schedules = await schedulesApi.list({ classroom_id: classId });
      
      // Sort schedules by date (if available) or by day_of_week
      const sortedSchedules = (schedules || []).sort((a: Schedule, b: Schedule) => {
        if (a.date && b.date) {
          return a.date.localeCompare(b.date);
        }
        if (a.date) return -1;
        if (b.date) return 1;
        return a.day_of_week - b.day_of_week;
      });

      setClassSchedules(prev => ({ ...prev, [classId]: sortedSchedules }));

      // Find today's schedule
      const today = new Date().toISOString().split('T')[0];
      const todaySchedule = sortedSchedules.find((s: Schedule) => s.date === today) || null;
      setTodaySchedules(prev => ({ ...prev, [classId]: todaySchedule }));

      // Load attendance status for each schedule (this will also update stats)
      await loadAttendanceStatusForSchedules(classId, sortedSchedules);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setClassSchedules(prev => ({ ...prev, [classId]: [] }));
    } finally {
      setLoadingSchedules(prev => ({ ...prev, [classId]: false }));
    }
  }, [classSchedules]);

  // Load attendance status for schedules
  const loadAttendanceStatusForSchedules = useCallback(async (classId: string, schedules: Schedule[]) => {
    try {
      // Ensure students are loaded first
      let totalStudents = students[classId]?.length || 0;
      
      if (totalStudents === 0) {
        // Try to load students if not already loaded
        const studentList = await loadStudentsForClass(classId);
        totalStudents = studentList.length;
      }
      
      // Load attendance for each schedule date
      const attendanceStatusMap: Record<string, {
        totalStudents: number;
        attendedCount: number;
        status: 'complete' | 'incomplete' | 'not_started';
      }> = {};

      for (const schedule of schedules) {
        if (!schedule.date) continue; // Skip recurring schedules without specific date
        
        const scheduleKey = `${classId}_${schedule.id}_${schedule.date}`;
        
        try {
          const attendanceResponse = await attendancesAPI.getAttendances({
            classroom_id: classId,
            date: schedule.date
          });

          if (attendanceResponse?.data && Array.isArray(attendanceResponse.data) && attendanceResponse.data.length > 0) {
            const attendance = attendanceResponse.data[0];
            
            // Parse records using utility function
            const records = parseAttendanceRecords(attendance.records);
            
            if (records && Object.keys(records).length > 0) {
              const attendedCount = Object.keys(records).length;
              
              console.log(`Schedule ${schedule.id} attendance:`, {
                scheduleKey,
                totalStudents,
                attendedCount,
                recordsKeys: Object.keys(records)
              });
              
              if (attendedCount === 0) {
                attendanceStatusMap[scheduleKey] = {
                  totalStudents,
                  attendedCount: 0,
                  status: 'not_started'
                };
              } else if (attendedCount < totalStudents) {
                attendanceStatusMap[scheduleKey] = {
                  totalStudents,
                  attendedCount,
                  status: 'incomplete'
                };
              } else {
                attendanceStatusMap[scheduleKey] = {
                  totalStudents,
                  attendedCount,
                  status: 'complete'
                };
              }
            } else {
              attendanceStatusMap[scheduleKey] = {
                totalStudents,
                attendedCount: 0,
                status: 'not_started'
              };
            }
          } else {
            attendanceStatusMap[scheduleKey] = {
              totalStudents,
              attendedCount: 0,
              status: 'not_started'
            };
          }
        } catch (err) {
          console.warn(`Error loading attendance for schedule ${schedule.id}:`, err);
          attendanceStatusMap[scheduleKey] = {
            totalStudents,
            attendedCount: 0,
            status: 'not_started'
          };
        }
      }

      setScheduleAttendances(prev => {
        const updated = { ...prev, ...attendanceStatusMap };
        
        // Update class attendance stats after setting attendance status
        // Count schedules with specific dates (only these can have attendance)
        const schedulesWithDates = schedules.filter(s => s.date);
        const totalSchedules = schedulesWithDates.length;
        
        // Count completed attendances from the updated map
        let completedCount = 0;
        schedulesWithDates.forEach(schedule => {
          const scheduleKey = `${classId}_${schedule.id}_${schedule.date}`;
          const status = updated[scheduleKey];
          if (status?.status === 'complete') {
            completedCount++;
          }
        });
        
        // Update class attendance stats
        setClassAttendanceStats(prevStats => ({
          ...prevStats,
          [classId]: {
            totalSchedules,
            completedCount
          }
        }));
        
        // Also update the class in classes array
        setClasses(prevClasses => prevClasses.map(cls => {
          if (cls.id === classId) {
            return {
              ...cls,
              totalSchedules,
              completedAttendanceCount: completedCount
            };
          }
          return cls;
        }));
        
        return updated;
      });
    } catch (err) {
      console.error('Error loading attendance status:', err);
    }
  }, [students, loadStudentsForClass]);

  // Handle class click to expand/collapse schedules
  const handleClassClick = async (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      setExpandedClassId(classId);
      await loadSchedulesForClass(classId);
    }
  };

  // Check if schedule date is today
  const isScheduleToday = (schedule: Schedule): boolean => {
    if (!schedule.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return schedule.date === today;
  };

  // Check if schedule date is before today
  const isScheduleBeforeToday = (schedule: Schedule): boolean => {
    if (!schedule.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return schedule.date < today;
  };

  // Check if schedule date is after today
  const isScheduleAfterToday = (schedule: Schedule): boolean => {
    if (!schedule.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return schedule.date > today;
  };

  // Format date for display
  const formatScheduleDate = (schedule: Schedule): string => {
    if (schedule.date) {
      const date = new Date(schedule.date);
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    // For recurring schedules, show day of week
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[schedule.day_of_week] || 'Không xác định';
  };

  useEffect(() => {
    if (!loading && user) {
      loadClassrooms();
    }
  }, [loading, user, loadClassrooms]);

  if (loading || loadingClasses) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <TeacherSidebar 
          currentPage="attendance" 
          onNavigate={(path) => router.push(path)} 
          onLogout={logout}
          user={{ name: user?.name, email: user?.email }}
        />
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
            <p className="text-gray-600 mb-6">Bạn không có quyền truy cập trang này.</p>
            <Button onClick={() => router.push('/teacher/dashboard')}>
              Về Teacher Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || cls.status === filterStatus;
    const matchesDate = !filterDate || cls.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Đã lên lịch';
      case 'in-progress':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getAttendanceStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chưa điểm danh';
      case 'completed':
        return 'Đã điểm danh';
      default:
        return 'Không xác định';
    }
  };

  const handleStartAttendance = async (classItem: Class, scheduleDate?: string) => {
    // Update class date if schedule date is provided
    const classWithDate = scheduleDate ? { ...classItem, date: scheduleDate } : classItem;
    setSelectedClass(classWithDate);
    // Load students - function will check if already loaded
    await loadStudentsForClass(classItem.id);
    setShowAttendanceSheet(true);
  };

  // Quick attendance - automatically mark all students as present if current time is within schedule
  const handleQuickAttendance = async (classItem: Class) => {
    // Set loading state
    setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: true }));
    
    try {
      // Load schedules for this class if not already loaded
      if (!classSchedules[classItem.id]) {
        await loadSchedulesForClass(classItem.id);
      }

      const schedules = classSchedules[classItem.id] || [];
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Find today's schedule
      const todaySchedule = schedules.find((s: Schedule) => s.date === today) || todaySchedules[classItem.id];
      
      if (!todaySchedule) {
        alert('Không tìm thấy lịch học hôm nay cho lớp này.');
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }

      // Check if current time is within schedule time
      const scheduleStart = todaySchedule.start_time;
      const scheduleEnd = todaySchedule.end_time;
      
      // Convert time strings to comparable format (HH:MM)
      const isWithinTime = currentTime >= scheduleStart && currentTime <= scheduleEnd;
      
      if (!isWithinTime) {
        alert(`Thời gian hiện tại (${currentTime}) không nằm trong khung giờ học (${scheduleStart} - ${scheduleEnd}).\n\nVui lòng điểm danh trong thời gian học.`);
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }

      // Confirm before quick attendance
      const confirmMessage = `Bạn có chắc muốn điểm danh nhanh cho lớp ${classItem.name}?\n\nThời gian: ${scheduleStart} - ${scheduleEnd}\nTất cả học sinh sẽ được đánh dấu là "Có mặt".`;
      
      if (!confirm(confirmMessage)) {
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }

      // Load students if not already loaded
      let studentList = students[classItem.id];
      if (!studentList || studentList.length === 0) {
        studentList = await loadStudentsForClass(classItem.id);
      }

      if (!studentList || studentList.length === 0) {
        alert('Không có học sinh trong lớp này.');
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }

      // Create attendance records for all students as "present"
      // Key in records must be student_id (UUID from students table)
      const records: Record<string, any> = {};
      studentList.forEach((student: Student) => {
        // Ensure student.id is a valid UUID (student_id from students table)
        if (!student.id) {
          console.error('Student missing ID:', student);
          return;
        }
        
        // Create record with proper format
        records[student.id] = {
          status: 'present',
          notes: 'Điểm danh nhanh',
          timestamp: new Date().toISOString(),
          student_id: student.id // Explicitly include student_id in the record
        };
      });
      
      // Validate records
      if (Object.keys(records).length === 0) {
        alert('Không có học sinh để điểm danh.');
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }
      
      console.log('Created attendance records:', {
        recordsCount: Object.keys(records).length,
        studentIds: Object.keys(records),
        records: records
      });

      // Validate records
      if (Object.keys(records).length === 0) {
        alert('Không có học sinh để điểm danh.');
        return;
      }

      console.log('Creating attendance with:', {
        classroom_id: classItem.id,
        date: today,
        recordsCount: Object.keys(records).length,
        records: records
      });

      // Check if attendance already exists
      let existingAttendance;
      try {
        existingAttendance = await attendancesAPI.getAttendances({
          classroom_id: classItem.id,
          date: today
        });
        console.log('Existing attendance check:', existingAttendance);
      } catch (err) {
        console.warn('Error checking existing attendance:', err);
        existingAttendance = null;
      }

      if (existingAttendance?.data && Array.isArray(existingAttendance.data) && existingAttendance.data.length > 0) {
        // Update existing attendance
        try {
          console.log('Updating existing attendance:', existingAttendance.data[0].id);
          await attendancesAPI.updateAttendance(existingAttendance.data[0].id, {
            records,
            confirmed_at: new Date().toISOString()
          });
          alert(`✅ Đã cập nhật điểm danh nhanh cho ${studentList.length} học sinh!`);
        } catch (err: any) {
          console.error('Error updating attendance:', err);
          console.error('Error response:', err.response?.data);
          alert(`Lỗi khi cập nhật điểm danh: ${err.response?.data?.detail || err.message || 'Vui lòng thử lại.'}`);
          return;
        }
      } else {
        // Create new attendance
        try {
          console.log('Creating new attendance...');
          const result = await attendancesAPI.createAttendance({
            classroom_id: classItem.id,
            date: today,
            records,
            confirmed_at: new Date().toISOString()
          });
          console.log('Attendance created successfully:', result);
          alert(`✅ Đã điểm danh nhanh cho ${studentList.length} học sinh!`);
        } catch (err: any) {
          console.error('Error creating attendance:', err);
          console.error('Error response:', err.response?.data);
          console.error('Error status:', err.response?.status);
          
          // If error is 400 and says already exists, try to update instead
          const errorDetail = err.response?.data?.detail || '';
          if (err.response?.status === 400 && (
            errorDetail.includes('already recorded') || 
            errorDetail.includes('already exists')
          )) {
            try {
              console.log('Attendance already exists, trying to update...');
              // Try to get the existing attendance again
              const retryAttendance = await attendancesAPI.getAttendances({
                classroom_id: classItem.id,
                date: today
              });
              if (retryAttendance?.data && Array.isArray(retryAttendance.data) && retryAttendance.data.length > 0) {
                await attendancesAPI.updateAttendance(retryAttendance.data[0].id, {
                  records,
                  confirmed_at: new Date().toISOString()
                });
                alert(`✅ Đã cập nhật điểm danh nhanh cho ${studentList.length} học sinh!`);
              } else {
                throw new Error('Không tìm thấy attendance record để cập nhật');
              }
            } catch (retryErr: any) {
              console.error('Error in retry update:', retryErr);
              alert(`Lỗi khi điểm danh: ${retryErr.message || 'Vui lòng thử lại.'}`);
              return;
            }
          } else {
            // Show detailed error message
            const errorMessage = errorDetail || err.message || 'Vui lòng thử lại.';
            alert(`Lỗi khi tạo điểm danh: ${errorMessage}`);
            return;
          }
        }
      }

      // Reload classrooms to update statistics
      await loadClassrooms();
      
      // Reload attendance status for schedules if class is expanded
      if (expandedClassId === classItem.id && classSchedules[classItem.id]) {
        await loadAttendanceStatusForSchedules(classItem.id, classSchedules[classItem.id]);
      } else if (classSchedules[classItem.id]) {
        // Even if not expanded, reload to update stats on card
        await loadAttendanceStatusForSchedules(classItem.id, classSchedules[classItem.id]);
      }

      // Reload today's schedule attendance status
      if (todaySchedule) {
        await loadAttendanceStatusForSchedules(classItem.id, [todaySchedule]);
      }
    } catch (err: any) {
      console.error('Error in quick attendance:', err);
      alert(`Lỗi khi điểm danh nhanh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      // Clear loading state
      setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
    }
  };

  const handleSaveAttendance = async (attendance: any[]) => {
    if (!selectedClass) return;
    
    try {
      // Use the date from selectedClass (which may be from a schedule)
      const attendanceDate = selectedClass.date || new Date().toISOString().split('T')[0];
      const records: Record<string, any> = {};
      
      attendance.forEach((record: any) => {
        // Ensure record.studentId is the student_id from students table
        if (!record.studentId) {
          console.error('Attendance record missing studentId:', record);
          return;
        }
        
        // Validate status
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(record.status)) {
          console.error('Invalid attendance status:', record.status);
          return;
        }
        
        // Create record with proper format
        records[record.studentId] = {
          status: record.status,
          notes: record.notes || '',
          timestamp: record.timestamp || new Date().toISOString(),
          student_id: record.studentId // Explicitly include student_id in the record
        };
      });
      
      // Validate records
      if (Object.keys(records).length === 0) {
        setError('Không có bản ghi điểm danh hợp lệ.');
        return;
      }
      
      // Check if attendance already exists
      const existingAttendance = await attendancesAPI.getAttendances({
        classroom_id: selectedClass.id,
        date: attendanceDate
      });
      
      if (existingAttendance?.data && Array.isArray(existingAttendance.data) && existingAttendance.data.length > 0) {
        // Update existing attendance
        await attendancesAPI.updateAttendance(existingAttendance.data[0].id, {
          records,
          confirmed_at: new Date().toISOString()
        });
      } else {
        // Create new attendance
        await attendancesAPI.createAttendance({
          classroom_id: selectedClass.id,
          date: attendanceDate,
          records,
          confirmed_at: new Date().toISOString()
        });
      }
      
      // Reload classrooms to update statistics
      await loadClassrooms();
      
      // Reload attendance status for schedules if class is expanded
      if (expandedClassId === selectedClass.id && classSchedules[selectedClass.id]) {
        await loadAttendanceStatusForSchedules(selectedClass.id, classSchedules[selectedClass.id]);
      } else if (classSchedules[selectedClass.id]) {
        // Even if not expanded, reload to update stats on card
        await loadAttendanceStatusForSchedules(selectedClass.id, classSchedules[selectedClass.id]);
      }
      
    setShowAttendanceSheet(false);
    setSelectedClass(null);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Không thể lưu điểm danh');
    }
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <TeacherSidebar 
        currentPage="attendance" 
        onNavigate={(path) => router.push(path)} 
        onLogout={logout}
        user={{ name: user?.name, email: user?.email }}
      />
      <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="card-transparent border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  Đóng
              </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-2">Quản lý điểm danh</h1>
              <p className="text-blue-100 text-sm lg:text-lg">Điểm danh học sinh và xác nhận lớp dạy</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-transparent">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-bold text-slate-900 mb-2 block">
                  Tìm kiếm
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Tên lớp, môn học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-bold text-slate-900 mb-2 block">
                  Trạng thái
                </Label>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <select
                    id="status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả</option>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="in-progress">Đang diễn ra</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-bold text-slate-900 mb-2 block">
                  Ngày
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full border-blue-200 text-blue-800 hover:text-blue-900 hover:border-blue-300 font-semibold">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="card-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{classItem.name}</CardTitle>
                    <CardDescription className="text-gray-600 font-medium">{classItem.subject}</CardDescription>
                  </div>
                  <Badge className={cn("text-xs font-semibold", getStatusColor(classItem.status))}>
                    {getStatusLabel(classItem.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{classItem.studentCount} học sinh</span>
                  </div>
                  {classItem.totalSchedules !== undefined && classItem.totalSchedules > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-600">Điểm danh:</span>
                      <span className={cn(
                        "font-bold",
                        classItem.completedAttendanceCount === classItem.totalSchedules
                          ? "text-green-600"
                          : classItem.completedAttendanceCount && classItem.completedAttendanceCount > 0
                          ? "text-yellow-600"
                          : "text-gray-500"
                      )}>
                        {classItem.completedAttendanceCount || 0}/{classItem.totalSchedules}
                      </span>
                      <span className="text-slate-500 text-xs">
                        ({classItem.totalSchedules - (classItem.completedAttendanceCount || 0)} chưa điểm danh)
                      </span>
                    </div>
                  )}
                </div>

                {/* Today's Schedule for Quick Attendance */}
                {todaySchedules[classItem.id] && (() => {
                  const todaySchedule = todaySchedules[classItem.id]!;
                  const isToday = isScheduleToday(todaySchedule);
                  const scheduleKey = `${classItem.id}_${todaySchedule.id}_${todaySchedule.date}`;
                  const attendanceStatus = scheduleAttendances[scheduleKey];
                  const now = new Date();
                  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  const isWithinTime = currentTime >= todaySchedule.start_time && currentTime <= todaySchedule.end_time;
                  
                  return (
                    <div className="p-3 rounded-lg border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-900">
                              Lịch học hôm nay
                            </span>
                            {attendanceStatus?.status === 'complete' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {attendanceStatus?.status === 'incomplete' && (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                            <span>
                              {todaySchedule.start_time} - {todaySchedule.end_time}
                            </span>
                            {isWithinTime && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Đang trong giờ học
                              </Badge>
                            )}
                  </div>
                          {todaySchedule.room_detail && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <MapPin className="w-4 h-4" />
                              <span>
                                {todaySchedule.room_detail.name || todaySchedule.room || 'Chưa có phòng'}
                                {todaySchedule.room_detail.code && ` (${todaySchedule.room_detail.code})`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {attendanceStatus && (
                        <div className="mb-2">
                          <Badge 
                            className={cn(
                              "text-xs",
                              attendanceStatus.status === 'complete' 
                                ? "bg-green-100 text-green-800"
                                : attendanceStatus.status === 'incomplete'
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {attendanceStatus.status === 'complete' 
                              ? 'Đã điểm danh đầy đủ'
                              : attendanceStatus.status === 'incomplete'
                              ? `Thiếu ${attendanceStatus.totalStudents - attendanceStatus.attendedCount} học sinh`
                              : 'Chưa điểm danh'}
                          </Badge>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {isWithinTime && attendanceStatus?.status !== 'complete' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickAttendance(classItem)}
                            disabled={quickAttendanceLoading[classItem.id]}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {quickAttendanceLoading[classItem.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Điểm danh nhanh
                              </>
                            )}
                          </Button>
                        )}
                        {isWithinTime && attendanceStatus?.status === 'complete' && (
                          <div className="flex-1 flex items-center justify-center p-2 bg-green-100 rounded-md">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Đã điểm danh đầy đủ</span>
                          </div>
                        )}
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={async () => {
                             await loadStudentsForClass(classItem.id);
                             setSelectedSchedule({ schedule: todaySchedule, classItem });
                             
                             // Load attendance records for this date
                             setLoadingAttendanceForStudentList(true);
                             try {
                               // Ensure date format is correct (YYYY-MM-DD)
                               const today = new Date().toISOString().split('T')[0];
                               const queryDate = todaySchedule.date || today;
                               
                               console.log('Querying attendance with:', {
                                 classroom_id: classItem.id,
                                 schedule_date: todaySchedule.date,
                                 query_date: queryDate,
                                 today: today
                               });
                               
                               const attendanceResponse = await attendancesAPI.getAttendances({
                                 classroom_id: classItem.id,
                                 date: queryDate
                               });
                               
                               console.log('=== Loading Attendance for Student List ===');
                               console.log('Query date:', queryDate);
                               console.log('Today:', today);
                               console.log('Schedule date:', todaySchedule.date);
                               console.log('Attendance response:', attendanceResponse);
                               console.log('Attendance response.data:', attendanceResponse?.data);
                               console.log('Attendance response.data type:', typeof attendanceResponse?.data);
                               console.log('Attendance response.data is array?', Array.isArray(attendanceResponse?.data));
                               
                               const attendance = attendanceResponse?.data && Array.isArray(attendanceResponse.data) && attendanceResponse.data.length > 0 
                                 ? attendanceResponse.data[0] 
                                 : null;
                               
                               console.log('Selected attendance:', attendance);
                               console.log('Selected attendance ID:', attendance?.id);
                               console.log('Selected attendance date:', attendance?.date);
                               console.log('Records raw:', attendance?.records);
                               console.log('Records type:', typeof attendance?.records);
                               console.log('Records is string?', typeof attendance?.records === 'string');
                               console.log('Records is object?', typeof attendance?.records === 'object' && !Array.isArray(attendance?.records));
                               if (attendance?.records) {
                                 if (typeof attendance.records === 'string') {
                                   console.log('Records string length:', attendance.records.length);
                                   console.log('Records string preview:', attendance.records.substring(0, 200));
                                 } else if (typeof attendance.records === 'object') {
                                   console.log('Records object keys:', Object.keys(attendance.records));
                                   console.log('Records object keys count:', Object.keys(attendance.records).length);
                                 }
                               }
                               
                               // Parse records if it's a string and create a new object to avoid mutation
                               const attendanceToSet = attendance ? { ...attendance } : null;
                               
                               if (attendanceToSet && attendanceToSet.records) {
                                 console.log('Before parsing - records type:', typeof attendanceToSet.records);
                                 console.log('Before parsing - records value:', attendanceToSet.records);
                                 
                                 if (typeof attendanceToSet.records === 'string') {
                                   try {
                                     const parsed = JSON.parse(attendanceToSet.records);
                                     attendanceToSet.records = parsed;
                                     console.log('✅ Parsed records from string:', parsed);
                                     console.log('Parsed records type:', typeof parsed);
                                     console.log('Parsed records keys:', Object.keys(parsed));
                                   } catch (err) {
                                     console.error('❌ Error parsing records:', err);
                                     attendanceToSet.records = {};
                                   }
                                 } else if (typeof attendanceToSet.records === 'object' && !Array.isArray(attendanceToSet.records)) {
                                   // Clone the object to avoid mutation
                                   attendanceToSet.records = { ...attendanceToSet.records };
                                   console.log('✅ Records is already an object, cloned it');
                                   console.log('Records keys:', Object.keys(attendanceToSet.records));
                                 }
                                 
                                 // Final validation
                                 console.log('Final attendanceToSet.records:', attendanceToSet.records);
                                 console.log('Final records type:', typeof attendanceToSet.records);
                                 console.log('Final records keys count:', Object.keys(attendanceToSet.records || {}).length);
                                 
                                 // Log each key-value pair
                                 if (attendanceToSet.records && typeof attendanceToSet.records === 'object') {
                                   Object.entries(attendanceToSet.records).forEach(([key, value]) => {
                                     console.log(`Record key: "${key}" (type: ${typeof key}), value:`, value);
                                   });
                                 }
                               } else {
                                 console.warn('⚠️ No attendance or records found');
                               }
                               
                               setAttendanceForStudentList(attendanceToSet);
                               console.log('✅ Set attendanceForStudentList:', attendanceToSet);
                               console.log('✅ Records in attendanceToSet:', attendanceToSet?.records);
                               console.log('✅ Records keys count:', attendanceToSet?.records ? Object.keys(attendanceToSet.records).length : 0);
                               
                               // CRITICAL: Only show modal after attendance is loaded
                               if (attendanceToSet) {
                                 setShowStudentList(true);
                               } else {
                                 console.warn('⚠️ No attendance data, not showing modal');
                                 alert('Không tìm thấy dữ liệu điểm danh cho lịch học này.');
                               }
                             } catch (err) {
                               console.error('Error loading attendance for student list:', err);
                               setAttendanceForStudentList(null);
                               alert('Không thể tải dữ liệu điểm danh. Vui lòng thử lại.');
                             } finally {
                               setLoadingAttendanceForStudentList(false);
                             }
                           }}
                           className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                         >
                           <Eye className="w-4 h-4 mr-1" />
                           Xem học sinh
                         </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Button to expand/collapse schedules */}
                <Button
                  variant="outline"
                  onClick={() => handleClassClick(classItem.id)}
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
                >
                  {expandedClassId === classItem.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Thu gọn lịch học
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Xem tất cả lịch học
                    </>
                  )}
                </Button>

                {/* Expanded Schedules List */}
                {expandedClassId === classItem.id && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    {loadingSchedules[classItem.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-slate-600">Đang tải lịch học...</span>
                      </div>
                    ) : classSchedules[classItem.id] && classSchedules[classItem.id].length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {classSchedules[classItem.id].map((schedule) => {
                          const isToday = isScheduleToday(schedule);
                          const isBefore = isScheduleBeforeToday(schedule);
                          const isAfter = isScheduleAfterToday(schedule);
                          const isLocked = isBefore || isAfter;

                          // Get attendance status for this schedule
                          const scheduleKey = `${classItem.id}_${schedule.id}_${schedule.date || ''}`;
                          const attendanceStatus = scheduleAttendances[scheduleKey];

                          // Determine border and background color based on attendance status
                          let borderColor = '';
                          let bgColor = '';
                          let hoverColor = '';
                          
                          if (isLocked) {
                            borderColor = 'border-gray-200';
                            bgColor = 'bg-gray-50';
                            hoverColor = 'hover:bg-gray-50';
                          } else if (attendanceStatus?.status === 'complete') {
                            // Đã điểm danh đầy đủ - màu xanh với dấu tích
                            borderColor = 'border-green-400';
                            bgColor = 'bg-green-50';
                            hoverColor = 'hover:bg-green-100';
                          } else if (attendanceStatus?.status === 'incomplete') {
                            // Điểm danh thiếu - màu đỏ
                            borderColor = 'border-red-400';
                            bgColor = 'bg-red-50';
                            hoverColor = 'hover:bg-red-100';
                          } else if (isToday) {
                            // Hôm nay chưa điểm danh - màu vàng
                            borderColor = 'border-yellow-300';
                            bgColor = 'bg-yellow-50';
                            hoverColor = 'hover:bg-yellow-100';
                          } else {
                            // Chưa đến hoặc chưa điểm danh - màu xanh nhạt
                            borderColor = 'border-blue-200';
                            bgColor = 'bg-blue-50';
                            hoverColor = 'hover:bg-blue-100';
                          }

                          return (
                            <div
                              key={schedule.id}
                              className={cn(
                                "p-3 rounded-lg border-2 transition-all relative",
                                borderColor,
                                bgColor,
                                hoverColor,
                                isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                              )}
                            >
                              {/* Attendance status badge */}
                              {attendanceStatus && attendanceStatus.status === 'complete' && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              {attendanceStatus && attendanceStatus.status === 'incomplete' && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-slate-600" />
                                    <span className="text-sm font-semibold text-slate-900">
                                      {formatScheduleDate(schedule)}
                                    </span>
                                    {attendanceStatus && (
                                      <Badge 
                                        className={cn(
                                          "text-xs",
                                          attendanceStatus.status === 'complete' 
                                            ? "bg-green-100 text-green-800"
                                            : attendanceStatus.status === 'incomplete'
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                        )}
                                      >
                                        {attendanceStatus.status === 'complete' 
                                          ? 'Đã điểm danh đầy đủ'
                                          : attendanceStatus.status === 'incomplete'
                                          ? `Thiếu ${attendanceStatus.totalStudents - attendanceStatus.attendedCount} học sinh`
                                          : 'Chưa điểm danh'}
                                      </Badge>
                                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {schedule.start_time} - {schedule.end_time}
                                    </span>
                  </div>
                                  {schedule.room_detail && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>
                                        {schedule.room_detail.name || schedule.room || 'Chưa có phòng'}
                                        {schedule.room_detail.code && ` (${schedule.room_detail.code})`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {isLocked && (
                                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                )}
                </div>

                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStartAttendance(classItem, schedule.date)}
                                  disabled={isLocked || !schedule.date}
                                  className={cn(
                                    "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold",
                                    (isLocked || !schedule.date) && "opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  <Users className="w-4 h-4 mr-1" />
                                  Điểm danh
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewAttendance(classItem, schedule)}
                                  disabled={!schedule.date || loadingAttendanceForStudentList}
                                  className={cn(
                                    "flex-1 border-blue-300 text-blue-600 hover:bg-blue-50",
                                    (!schedule.date || loadingAttendanceForStudentList) && "opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Xem điểm danh
                                </Button>
                              </div>

                              {isBefore && !isToday && (
                                <div className="mt-2 text-xs text-gray-500 text-center">
                                  Lịch học đã qua
                                </div>
                              )}

                              {isAfter && !isToday && (
                                <div className="mt-2 text-xs text-gray-500 text-center">
                                  Lịch học chưa đến
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-slate-500">
                        Không có lịch học nào
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance Statistics */}
                {classItem.attendanceStatus === 'completed' && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-xs text-green-600 font-medium">Có mặt</div>
                        <div className="text-lg font-bold text-green-700">{classItem.presentCount || 0}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <div className="text-xs text-yellow-600 font-medium">Đi muộn</div>
                        <div className="text-lg font-bold text-yellow-700">{classItem.lateCount || 0}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xs text-blue-600 font-medium">Vắng có phép</div>
                        <div className="text-lg font-bold text-blue-700">{classItem.absentWithExcuse || 0}</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-xs text-red-600 font-medium">Vắng không phép</div>
                        <div className="text-lg font-bold text-red-700">{classItem.absentWithoutExcuse || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium text-slate-700">Trạng thái:</span>
                    <Badge className={cn("text-xs font-medium", getAttendanceStatusColor(classItem.attendanceStatus))}>
                      {getAttendanceStatusLabel(classItem.attendanceStatus)}
                    </Badge>
                  </div>

                       {(() => {
                         // Check if today's schedule exists and is within time
                         const todaySchedule = todaySchedules[classItem.id];
                         if (!todaySchedule) return null;
                         
                         const now = new Date();
                         const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                         const isWithinTime = currentTime >= todaySchedule.start_time && currentTime <= todaySchedule.end_time;
                         
                         if (!isWithinTime) return null;
                         
                         // Check attendance status
                         const scheduleKey = `${classItem.id}_${todaySchedule.id}_${todaySchedule.date}`;
                         const attendanceStatus = scheduleAttendances[scheduleKey];
                         
                         // Don't show button if already fully attended
                         if (attendanceStatus?.status === 'complete') {
                           return (
                             <div className="w-full flex items-center justify-center p-2 bg-green-100 rounded-md">
                               <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                               <span className="text-sm font-semibold text-green-800">Đã điểm danh đầy đủ</span>
                             </div>
                           );
                         }
                         
                         // Show button if not fully attended
                         return (
                    <Button
                      size="sm"
                             onClick={() => handleQuickAttendance(classItem)}
                             disabled={quickAttendanceLoading[classItem.id]}
                             className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {quickAttendanceLoading[classItem.id] ? (
                               <>
                                 <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                 Đang xử lý...
                               </>
                             ) : (
                               <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                                 Điểm danh nhanh
                               </>
                             )}
                    </Button>
                         );
                       })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Không có lớp học nào</h3>
              <p className="text-slate-500 mb-6">Bạn chưa được phân công lớp học nào. Vui lòng liên hệ quản trị viên.</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Attendance Sheet Modal */}
      {showAttendanceSheet && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AttendanceSheet
              classId={selectedClass.id}
              className={selectedClass.name}
              subject={selectedClass.subject}
              date={selectedClass.date}
              students={students[selectedClass.id] || []}
              onSave={handleSaveAttendance}
              onCancel={() => {
                setShowAttendanceSheet(false);
                setSelectedClass(null);
              }}
            />
          </div>
        </div>
      )}


      {/* Student List Modal */}
      {showStudentList && selectedSchedule && attendanceForStudentList && (() => {
        // Debug logging - CRITICAL: Check if records are preserved from state
        console.log('=== Student List Modal Debug ===');
        console.log('🔍 attendanceForStudentList:', attendanceForStudentList);
        console.log('🔍 attendanceForStudentList?.records:', attendanceForStudentList?.records);
        console.log('🔍 records type:', typeof attendanceForStudentList?.records);
        console.log('🔍 records is null?', attendanceForStudentList?.records === null);
        console.log('🔍 records is undefined?', attendanceForStudentList?.records === undefined);
        console.log('🔍 records is empty object?', attendanceForStudentList?.records && Object.keys(attendanceForStudentList.records).length === 0);
        
        // CRITICAL: Parse attendance records - handle both string and object
        // IMPORTANT: Use the records directly from state, don't lose them!
        let rawRecords = attendanceForStudentList?.records;
        
        // CRITICAL CHECK: If no records at all, show error
        if (!rawRecords) {
          console.error('❌ CRITICAL: No records in attendanceForStudentList!');
          console.error('❌ attendanceForStudentList:', attendanceForStudentList);
          return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                <h2 className="text-xl font-bold text-red-600 mb-4">Lỗi</h2>
                <p className="text-gray-700 mb-4">Không tìm thấy dữ liệu điểm danh cho lịch học này.</p>
                <Button onClick={() => {
                  setShowStudentList(false);
                  setSelectedSchedule(null);
                  setAttendanceForStudentList(null);
                }}>
                  Đóng
                </Button>
              </div>
            </div>
          );
        }
        console.log('\n=== Records Parsing (CRITICAL) ===');
        console.log('📥 Raw records from state:', rawRecords);
        console.log('📥 Raw records type:', typeof rawRecords);
        console.log('📥 Raw records is string?', typeof rawRecords === 'string');
        console.log('📥 Raw records is object?', typeof rawRecords === 'object' && !Array.isArray(rawRecords));
        
        // If records is a string, parse it first
        if (rawRecords && typeof rawRecords === 'string') {
          try {
            rawRecords = JSON.parse(rawRecords);
            console.log('✅ Parsed from string:', rawRecords);
            console.log('✅ Parsed type:', typeof rawRecords);
            console.log('✅ Parsed keys:', Object.keys(rawRecords));
          } catch (err) {
            console.error('❌ Error parsing records string:', err);
            rawRecords = {};
          }
        }
        
        // Now parse using utility function (but it should already be an object)
        let records = parseAttendanceRecords(rawRecords);
        
        // CRITICAL VALIDATION: Ensure records are not lost
        console.log('\n=== CRITICAL VALIDATION ===');
        console.log('📊 Final records after parsing:', records);
        console.log('📊 Final records type:', typeof records);
        console.log('📊 Final records is object?', typeof records === 'object' && !Array.isArray(records));
        console.log('📊 Final records keys:', Object.keys(records));
        console.log('📊 Final records keys count:', Object.keys(records).length);
        console.log('📊 Raw records keys count (before parse):', rawRecords && typeof rawRecords === 'object' ? Object.keys(rawRecords).length : 0);
        
        // CRITICAL FIX: If parsing lost the records, use rawRecords directly
        if (Object.keys(records).length === 0 && rawRecords && typeof rawRecords === 'object' && !Array.isArray(rawRecords) && Object.keys(rawRecords).length > 0) {
          console.error('❌ CRITICAL ERROR: Records were lost during parsing!');
          console.error('❌ Raw records had keys:', Object.keys(rawRecords));
          console.error('❌ Raw records:', rawRecords);
          console.error('❌ But parsed records has no keys!');
          // Use rawRecords directly if parsing failed
          records = rawRecords as ParsedAttendanceRecords;
          console.log('✅ Recovered records directly from rawRecords:', records);
          console.log('✅ Recovered records keys:', Object.keys(records));
        }
        
        // Final check
        if (Object.keys(records).length === 0) {
          console.error('❌ FINAL ERROR: Records is still empty after all attempts!');
          console.error('❌ attendanceForStudentList:', attendanceForStudentList);
          console.error('❌ rawRecords:', rawRecords);
        } else {
          console.log('✅ SUCCESS: Records are valid with', Object.keys(records).length, 'keys');
        }
        console.log('Final parsed records:', records);
        console.log('Final records type:', typeof records);
        console.log('Final records is object?', typeof records === 'object' && !Array.isArray(records));
        console.log('Records keys:', Object.keys(records));
        console.log('Records keys count:', Object.keys(records).length);
        console.log('Records entries:', Object.entries(records));
        console.log('Records values:', Object.values(records));
        
        // Debug: Check if records has the expected structure
        if (Object.keys(records).length > 0) {
          const firstKey = Object.keys(records)[0];
          const firstValue = records[firstKey];
          console.log('First record key:', firstKey);
          console.log('First record key type:', typeof firstKey);
          console.log('First record value:', firstValue);
          console.log('First record value type:', typeof firstValue);
          console.log('First record has student_id?', firstValue && typeof firstValue === 'object' && 'student_id' in firstValue);
          if (firstValue && typeof firstValue === 'object') {
            console.log('First record student_id:', firstValue.student_id);
            console.log('First record status:', firstValue.status);
          }
        } else {
          console.warn('⚠️ Records is empty!');
          console.log('Raw records was:', rawRecords);
          console.log('Raw records type was:', typeof rawRecords);
        }
        
        // IMPORTANT: Use ONLY student.id (UUID) to match records
        // Records keys are student.id (UUID from students table)
        // DO NOT use studentCode or name to match
        
        const recordStudentIds = Object.keys(records);
        console.log('\n=== Records Student IDs (from records keys) ===');
        console.log('Record student IDs:', recordStudentIds);
        console.log('Record student IDs count:', recordStudentIds.length);
        
        // Get students for this class
        const classStudents = students[selectedSchedule.classItem.id] || [];
        console.log('\n=== Students Info (using ID only) ===');
        console.log('Class students count:', classStudents.length);
        console.log('Class students IDs (UUIDs):', classStudents.map(s => ({ 
          id: s.id, 
          name: s.name,
          studentCode: s.studentCode 
        })));
        
        // Create a map of student.id (UUID) -> student for quick lookup
        // KEY POINT: Use student.id (UUID) as the key, NOT studentCode or name
        const studentsMap = new Map<string, Student>();
        classStudents.forEach((student: Student) => {
          if (student.id) {
            studentsMap.set(student.id, student);
            console.log(`✅ Mapped student: ${student.id} -> ${student.name} (${student.studentCode})`);
          } else {
            console.warn(`⚠️ Student missing ID:`, student);
          }
        });
        
        console.log(`\n✅ Students map size: ${studentsMap.size}`);
        console.log('Students map keys:', Array.from(studentsMap.keys()));
        
        // Map records to students with attendance status
        // IMPORTANT: Use student.id (UUID) from records keys to find students
        const studentsWithAttendanceFromRecords = recordStudentIds
          .map((studentIdFromRecord) => {
            // Find student in class by student.id (UUID) - EXACT MATCH
            const student = studentsMap.get(studentIdFromRecord);
            
            // Get record for this student using student.id (UUID) as key
            const record = records[studentIdFromRecord];
            
            console.log(`\n=== Processing Record for Student ID (UUID): ${studentIdFromRecord} ===`);
            console.log('🔍 Looking up student by ID (UUID):', studentIdFromRecord);
            console.log('✅ Student found in class:', !!student);
            if (student) {
              console.log('   Student details:', { 
                id: student.id, 
                name: student.name, 
                studentCode: student.studentCode,
                idMatch: student.id === studentIdFromRecord
              });
            }
            console.log('✅ Record found in records:', !!record);
            if (record) {
              console.log('   Record details:', { 
                status: record.status, 
                notes: record.notes, 
                student_id: record.student_id,
                keyMatch: record.student_id === studentIdFromRecord
              });
            }
            console.log('📋 All records keys (UUIDs):', Object.keys(records));
            console.log('🔍 Student ID in records keys?', Object.keys(records).includes(studentIdFromRecord));
            console.log('🔍 Direct lookup test:', records[studentIdFromRecord] ? 'FOUND' : 'NOT FOUND');
          
          // Get attendance status - use the record directly if found
          let attendanceInfo;
          if (record) {
            // Use record directly
            const recordStatus = record.status || 'not_attended';
            let status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended' = 'not_attended';
            
            if (recordStatus === 'absent') {
              const recordNotes = (record.notes || '').toLowerCase();
              if (recordNotes.includes('phép') || recordNotes.includes('excused') || recordNotes.includes('có phép')) {
                status = 'excused';
              } else {
                status = 'absent';
              }
            } else if (['present', 'late', 'excused'].includes(recordStatus)) {
              status = recordStatus as 'present' | 'absent' | 'late' | 'excused';
            }
            
            attendanceInfo = {
              status,
              notes: record.notes || '',
              timestamp: record.timestamp || ''
            };
            
            console.log(`✅ Found record for ${studentIdFromRecord}:`, {
              recordStatus,
              finalStatus: status,
              notes: attendanceInfo.notes,
              timestamp: attendanceInfo.timestamp
            });
          } else {
            // Fallback to utility function
            attendanceInfo = getStudentAttendanceStatus(studentIdFromRecord, records);
            console.log(`⚠️ No direct record found, using utility function:`, attendanceInfo);
          }
          
          // If student not found in class, we still show the record
          // but we'll need to fetch student info from API
          if (!student && record) {
            console.warn(`⚠️ Student ${studentIdFromRecord} not found in class students list`);
            // Return a placeholder student object
            return {
              student: {
                id: studentIdFromRecord,
                name: 'Học sinh chưa xác định',
                studentCode: record.student_id || studentIdFromRecord,
                className: selectedSchedule.classItem.name,
              } as Student,
              status: attendanceInfo.status,
              notes: attendanceInfo.notes,
              timestamp: attendanceInfo.timestamp
            };
          }
          
          if (!student) {
            console.error(`❌ Student ${studentIdFromRecord} not found in class and no record!`);
            return null; // Filter out null values
          }
          
          return {
            student: student,
            status: attendanceInfo.status,
            notes: attendanceInfo.notes,
            timestamp: attendanceInfo.timestamp
          };
          })
          .filter((item): item is { student: Student; status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended'; notes: string; timestamp: string } => item !== null);
        
        // Also include students from class who don't have records yet
        // IMPORTANT: Use student.id (UUID) to check if they have records
        const studentsWithoutRecords = classStudents
          .filter((student: Student) => {
            // Check if student.id (UUID) is NOT in records keys
            const hasRecord = recordStudentIds.includes(student.id);
            if (!hasRecord) {
              console.log(`📝 Student ${student.id} (${student.name}) has no attendance record`);
            }
            return !hasRecord;
          })
          .map((student: Student) => {
            // Use student.id (UUID) to get attendance status
            const attendanceInfo = getStudentAttendanceStatus(student.id, records);
            console.log(`📝 Student ${student.id} (${student.name}) status: ${attendanceInfo.status}`);
            return {
              student,
              status: attendanceInfo.status,
              notes: attendanceInfo.notes,
              timestamp: attendanceInfo.timestamp
            };
          });
        
        // Combine both lists: students with records first, then students without records
        const studentsWithAttendance = [...studentsWithAttendanceFromRecords, ...studentsWithoutRecords];
        
        console.log('\n=== Final Students with Attendance ===');
        console.log('Total students with attendance:', studentsWithAttendance.length);
        console.log('Students from records:', studentsWithAttendanceFromRecords.length);
        console.log('Students without records:', studentsWithoutRecords.length);
        console.log('Students with attendance:', studentsWithAttendance);

        // Calculate statistics
        const stats = {
          present: studentsWithAttendance.filter(s => s && s.status === 'present').length,
          absent: studentsWithAttendance.filter(s => s && s.status === 'absent').length,
          late: studentsWithAttendance.filter(s => s && s.status === 'late').length,
          excused: studentsWithAttendance.filter(s => s && s.status === 'excused').length,
          notAttended: studentsWithAttendance.filter(s => s && s.status === 'not_attended').length
        };

        const getStatusBadge = (status: string) => {
          const variants = {
            present: 'bg-green-100 text-green-800',
            absent: 'bg-red-100 text-red-800',
            late: 'bg-yellow-100 text-yellow-800',
            excused: 'bg-blue-100 text-blue-800',
            not_attended: 'bg-gray-100 text-gray-800'
          };
          const labels = {
            present: 'Có mặt',
            absent: 'Vắng mặt',
            late: 'Đi muộn',
            excused: 'Có phép',
            not_attended: 'Chưa điểm danh'
          };
          return (
            <Badge className={cn("text-xs font-medium", variants[status as keyof typeof variants] || variants.not_attended)}>
              {labels[status as keyof typeof labels] || labels.not_attended}
            </Badge>
          );
        };

        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'present':
              return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'absent':
              return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'late':
              return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'excused':
              return <AlertCircle className="w-5 h-5 text-blue-600" />;
            default:
              return <Clock className="w-5 h-5 text-gray-400" />;
          }
        };

        const getStatusBorderColor = (status: string) => {
          switch (status) {
            case 'present':
              return 'border-l-4 border-green-500';
            case 'absent':
              return 'border-l-4 border-red-500';
            case 'late':
              return 'border-l-4 border-yellow-500';
            case 'excused':
              return 'border-l-4 border-blue-500';
            default:
              return 'border-l-4 border-gray-300';
          }
        };

        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Danh sách học sinh
                    </h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-semibold">{selectedSchedule.classItem.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatScheduleDate(selectedSchedule.schedule)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedSchedule.schedule.start_time} - {selectedSchedule.schedule.end_time}</span>
                      </div>
                      {selectedSchedule.schedule.room_detail && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {selectedSchedule.schedule.room_detail.name || selectedSchedule.schedule.room || 'Chưa có phòng'}
                            {selectedSchedule.schedule.room_detail.code && ` (${selectedSchedule.schedule.room_detail.code})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowStudentList(false);
                      setSelectedSchedule(null);
                      setAttendanceForStudentList(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>

                {/* Statistics */}
                {loadingAttendanceForStudentList ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Đang tải thông tin điểm danh...</p>
                  </div>
                ) : attendanceForStudentList && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">Có mặt</div>
                      <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                      <div className="text-xs text-red-600 font-medium mb-1">Vắng mặt</div>
                      <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                      <div className="text-xs text-yellow-600 font-medium mb-1">Đi muộn</div>
                      <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="text-xs text-blue-600 font-medium mb-1">Có phép</div>
                      <div className="text-2xl font-bold text-blue-700">{stats.excused}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <div className="text-xs text-gray-600 font-medium mb-1">Chưa điểm danh</div>
                      <div className="text-2xl font-bold text-gray-700">{stats.notAttended}</div>
          </div>
        </div>
      )}

                {/* Student List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Danh sách học sinh ({studentsWithAttendance.length} học sinh)
                  </h3>
                  {!students[selectedSchedule.classItem.id] ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Đang tải danh sách học sinh...</p>
                    </div>
                  ) : studentsWithAttendance.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {studentsWithAttendance.filter(item => item !== null).map((item, index) => (
                        <div
                          key={item.student.id}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all",
                            getStatusBorderColor(item.status),
                            item.status === 'present' ? 'bg-green-50/30' :
                            item.status === 'absent' ? 'bg-red-50/30' :
                            item.status === 'late' ? 'bg-yellow-50/30' :
                            item.status === 'excused' ? 'bg-blue-50/30' :
                            'bg-gray-50/30'
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg",
                              item.status === 'present' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              item.status === 'absent' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                              item.status === 'late' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                              item.status === 'excused' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-gray-400 to-gray-500'
                            )}>
                              {item.student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-semibold text-slate-800 text-lg">{item.student.name}</div>
                                {getStatusIcon(item.status)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="text-sm text-slate-500">Mã học sinh: {item.student.studentCode}</div>
                              {item.student.className && (
                                <div className="text-xs text-slate-400 mt-1">Lớp: {item.student.className}</div>
                              )}
                              {item.notes && (
                                <div className="text-xs text-slate-500 mt-1 italic">
                                  <span className="font-medium">Ghi chú:</span> {item.notes}
                                </div>
                              )}
                              {item.timestamp && (
                                <div className="text-xs text-slate-400 mt-1">
                                  <span className="font-medium">Thời gian điểm danh:</span> {new Date(item.timestamp).toLocaleString('vi-VN')}
                                </div>
                              )}
                              {item.status === 'not_attended' && (
                                <div className="text-xs text-red-500 mt-1 font-medium">
                                  ⚠️ Chưa được điểm danh
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500 font-medium">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">
                      Không có học sinh nào trong lớp này.
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStudentList(false);
                      setSelectedSchedule(null);
                      setAttendanceForStudentList(null);
                    }}
                  >
                    Đóng
                  </Button>
                  {isScheduleToday(selectedSchedule.schedule) && (
                    <Button
                      onClick={() => {
                        setShowStudentList(false);
                        handleStartAttendance(selectedSchedule.classItem, selectedSchedule.schedule.date);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Điểm danh
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
