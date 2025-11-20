'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCcw,
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
import { supabase } from '@/lib/supabase';
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

type ScheduleAttendanceInfo = {
  totalStudents: number;
  attendedCount: number;
  status: 'complete' | 'incomplete' | 'not_started';
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
};

const extractApiDataArray = (response: any) => {
  if (!response) return [];
  const payload = response.data !== undefined ? response.data : response;
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
};

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
  const [scheduleAttendances, setScheduleAttendances] = useState<Record<string, ScheduleAttendanceInfo>>({});
  const [classAttendanceStats, setClassAttendanceStats] = useState<Record<string, {
    totalSchedules: number;
    completedCount: number;
  }>>({});
  const [todaySchedules, setTodaySchedules] = useState<Record<string, Schedule | null>>({});
  const [quickAttendanceLoading, setQuickAttendanceLoading] = useState<Record<string, boolean>>({});
  const [attendanceForStudentList, setAttendanceForStudentList] = useState<any>(null);
  const [loadingAttendanceForStudentList, setLoadingAttendanceForStudentList] = useState(false);
  const [activeClassForDetail, setActiveClassForDetail] = useState<Class | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<{ schedule: Schedule; classItem: Class } | null>(null);
  const [detailAttendance, setDetailAttendance] = useState<any>(null);
  const [loadingDetailAttendance, setLoadingDetailAttendance] = useState(false);
  const [pendingAttendanceChanges, setPendingAttendanceChanges] = useState<Record<string, Record<string, 'present' | 'absent' | 'late' | 'excused'>>>({});
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({});
  
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

    const attendanceList = extractApiDataArray(attendanceResponse);
    let attendance = attendanceList.find(
      (item: any) =>
        item &&
        item.classroom_id === classId &&
        item.date === scheduleDate
    ) || attendanceList[0];

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

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const storedToken =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');

    if (storedToken && storedToken.trim() !== '') {
      return storedToken.trim();
    }

    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (err) {
      console.warn('AttendancePage: unable to get Supabase session token', err);
      return null;
    }
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
        const token = await getAuthToken();
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('AttendancePage: no auth token found when fetching teachers');
        }
        
        const teachersResponse = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
          headers,
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
          const errorText = await teachersResponse.text();
          console.warn('AttendancePage: teachers API failed', {
            status: teachersResponse.status,
            errorText,
          });
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
      let classroomsData: any[] = [];
      try {
        classroomsData = await classroomsHybridApi.list({ teacher_id: teacherId });
      } catch (apiError: any) {
        console.error('Không thể tải danh sách lớp học:', apiError);
        if (apiError?.message?.includes('Forbidden')) {
          setError('Bạn không có quyền truy cập danh sách lớp học. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.');
        } else if (apiError?.message?.includes('HTTP 401')) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
        } else {
          setError(apiError?.message || 'Không thể tải danh sách lớp học.');
        }
        setLoadingClasses(false);
        return;
      }
      
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
            const attendanceList = extractApiDataArray(attendanceResponse);
            const attendance = attendanceList.find(
              (item: any) => item && item.classroom_id === classroom.id && item.date === today
            ) || attendanceList[0];
            
            if (attendance) {
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
  }, [getAuthToken, user]);

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
        setSelectedSchedule({ schedule, classItem });

        if (attendance) {
          setAttendanceForStudentList(attendance);
        } else {
          setAttendanceForStudentList({
            classroom_id: classItem.id,
            date: schedule.date,
            records: {}
          });
          alert('Không tìm thấy dữ liệu điểm danh cho lịch học này. Vui lòng điểm danh để bắt đầu.');
        }

        setShowStudentList(true);
      } catch (error) {
        console.error('Error loading attendance for schedule:', error);
        alert('Không thể tải dữ liệu điểm danh. Vui lòng thử lại.');
      } finally {
        setLoadingAttendanceForStudentList(false);
      }
    },
    [fetchAttendanceForSchedule, loadStudentsForClass]
  );

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
      const attendanceStatusMap: Record<string, ScheduleAttendanceInfo> = {};

      for (const schedule of schedules) {
        if (!schedule.date) continue; // Skip recurring schedules without specific date
        
        const scheduleKey = `${classId}_${schedule.id}_${schedule.date}`;
        
        try {
          const attendance = await fetchAttendanceForSchedule(classId, schedule.date);

          if (attendance) {
            // Parse records using utility function
            const records = parseAttendanceRecords(attendance.records);
            const stats = countAttendanceStats(records);
            const attendedCount = stats.total;
            
            console.log(`Schedule ${schedule.id} attendance:`, {
              scheduleKey,
              totalStudents,
              attendedCount,
              recordsKeys: Object.keys(records)
            });

            let status: ScheduleAttendanceInfo['status'] = 'not_started';
            if (attendedCount === 0) {
              status = 'not_started';
            } else if (attendedCount < totalStudents) {
              status = 'incomplete';
            } else {
              status = 'complete';
            }

            attendanceStatusMap[scheduleKey] = {
              totalStudents,
              attendedCount,
              status,
              presentCount: stats.present,
              absentCount: stats.absent,
              lateCount: stats.late,
              excusedCount: stats.excused
            };
          } else {
            attendanceStatusMap[scheduleKey] = {
              totalStudents,
              attendedCount: 0,
              status: 'not_started',
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              excusedCount: 0
            };
          }
        } catch (err) {
          console.warn(`Error loading attendance for schedule ${schedule.id}:`, err);
          attendanceStatusMap[scheduleKey] = {
            totalStudents,
            attendedCount: 0,
            status: 'not_started',
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0
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
  }, [students, loadStudentsForClass, fetchAttendanceForSchedule]);

  const handleSelectAttendanceStatus = useCallback((scheduleContext: { schedule: Schedule; classItem: Class } | null, studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!scheduleContext?.schedule?.date || !studentId) return;
    const today = new Date().toISOString().split('T')[0];
    if (scheduleContext.schedule.date !== today) {
      alert('Bạn chỉ có thể chọn trạng thái trong đúng ngày của lịch học.');
      return;
    }

    const scheduleKey = getScheduleKey(scheduleContext.classItem.id, scheduleContext.schedule);
    setPendingAttendanceChanges(prev => ({
      ...prev,
      [scheduleKey]: {
        ...(prev[scheduleKey] || {}),
        [studentId]: status
      }
    }));
  }, []);

  const handleSavePendingAttendance = useCallback(async (classItem: Class, schedule: Schedule) => {
    if (!schedule?.date) {
      alert('Lịch học này chưa có ngày cụ thể.');
      return;
    }
    const scheduleKey = getScheduleKey(classItem.id, schedule);
    const pendingChanges = pendingAttendanceChanges[scheduleKey];
    if (!pendingChanges || Object.keys(pendingChanges).length === 0) {
      alert('Không có thay đổi nào cần lưu.');
      return;
    }

    setSavingAttendance(prev => ({ ...prev, [scheduleKey]: true }));
    try {
      let attendanceRecord = await fetchAttendanceForSchedule(classItem.id, schedule.date);
      const existingRecords = parseAttendanceRecords(attendanceRecord?.records || {});
      const updatedRecords = { ...existingRecords };

      Object.entries(pendingChanges).forEach(([studentId, status]) => {
        updatedRecords[studentId] = {
          ...(existingRecords[studentId] || {}),
          status,
          notes: existingRecords[studentId]?.notes || '',
          timestamp: new Date().toISOString(),
          student_id: studentId
        };
      });

      if (attendanceRecord?.id) {
        await attendancesAPI.updateAttendance(attendanceRecord.id, {
          records: updatedRecords,
          confirmed_at: new Date().toISOString()
        });
      } else {
        const created = await attendancesAPI.createAttendance({
          classroom_id: classItem.id,
          date: schedule.date,
          records: updatedRecords,
          confirmed_at: new Date().toISOString()
        });
        attendanceRecord = created?.data ? created.data : created;
      }

      setPendingAttendanceChanges(prev => {
        const next = { ...prev };
        delete next[scheduleKey];
        return next;
      });

      if (detailSchedule && detailSchedule.classItem.id === classItem.id && detailSchedule.schedule.date === schedule.date) {
        setDetailAttendance(attendanceRecord);
      }

      if (selectedSchedule && selectedSchedule.classItem.id === classItem.id && selectedSchedule.schedule.date === schedule.date) {
        setAttendanceForStudentList(attendanceRecord);
      }

      const schedulesForUpdate = classSchedules[classItem.id] && classSchedules[classItem.id]!.length > 0
        ? classSchedules[classItem.id]!
        : [schedule];
      await loadAttendanceStatusForSchedules(classItem.id, schedulesForUpdate);
      await loadClassrooms();
      if (detailSchedule?.classItem.id === classItem.id) {
        await handleDetailScheduleSelect(classItem, schedule);
      }
      alert('✅ Đã lưu điểm danh cho lịch học này.');
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Không thể lưu điểm danh. Vui lòng thử lại.');
    } finally {
      setSavingAttendance(prev => {
        const next = { ...prev };
        delete next[scheduleKey];
        return next;
      });
    }
  }, [classSchedules, detailSchedule, fetchAttendanceForSchedule, loadAttendanceStatusForSchedules, pendingAttendanceChanges, selectedSchedule]);

  // Load schedules for a classroom
  const loadSchedulesForClass = useCallback(async (classId: string): Promise<Schedule[]> => {
    if (classSchedules[classId]) {
      // Already loaded
      return classSchedules[classId];
    }

    try {
      setLoadingSchedules(prev => ({ ...prev, [classId]: true }));
      const schedules = await schedulesApi.list({ classroom_id: classId });
      
      const classroomSchedules = filterSchedulesForClass(classId, schedules || []);
      
      // Sort schedules by date (if available) or by day_of_week
      const sortedSchedules = classroomSchedules.sort((a: Schedule, b: Schedule) => {
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

      return sortedSchedules;
    } catch (err) {
      console.error('Error loading schedules:', err);
      setClassSchedules(prev => ({ ...prev, [classId]: [] }));
      return [];
    } finally {
      setLoadingSchedules(prev => ({ ...prev, [classId]: false }));
    }
  }, [classSchedules, loadAttendanceStatusForSchedules]);

  // Handle class click to expand/collapse schedules
  const handleClassClick = async (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      setExpandedClassId(classId);
      await loadSchedulesForClass(classId);
    }
  };

  const handleDetailScheduleSelect = useCallback(async (classItem: Class, schedule: Schedule) => {
    if (!schedule?.date) {
      alert('Lịch học này chưa có ngày cụ thể, không thể hiển thị chi tiết.');
      return;
    }

    setActiveClassForDetail(classItem);
    setDetailSchedule({ schedule, classItem });
    setLoadingDetailAttendance(true);

    try {
      await loadStudentsForClass(classItem.id);
      const attendance = await fetchAttendanceForSchedule(classItem.id, schedule.date);
      if (attendance) {
        setDetailAttendance(attendance);
      } else {
        setDetailAttendance({
          classroom_id: classItem.id,
          date: schedule.date,
          records: {}
        });
      }
    } catch (err) {
      console.error('Error loading attendance for detail view:', err);
      setDetailAttendance({
        classroom_id: classItem.id,
        date: schedule.date,
        records: {}
      });
    } finally {
      setLoadingDetailAttendance(false);
    }
  }, [fetchAttendanceForSchedule, loadStudentsForClass]);

  const handleFocusClass = useCallback(async (classItem: Class) => {
    setActiveClassForDetail(classItem);
    await loadStudentsForClass(classItem.id);
    const schedules = await loadSchedulesForClass(classItem.id);
    const existingSchedules = classSchedules[classItem.id] || schedules || [];

    if (existingSchedules.length === 0) {
      setDetailSchedule(null);
      setDetailAttendance(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let defaultSchedule = existingSchedules.find((s) => s.date === today);

    if (!defaultSchedule) {
      defaultSchedule = existingSchedules.find((s) => s.date && s.date > today) || existingSchedules[0];
    }

    if (defaultSchedule) {
      await handleDetailScheduleSelect(classItem, defaultSchedule);
    }
  }, [classSchedules, handleDetailScheduleSelect, loadSchedulesForClass, loadStudentsForClass]);

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

  const getScheduleKey = (classId: string, schedule: Schedule) => {
    return `${classId}_${schedule.id}_${schedule.date || ''}`;
  };

  const getScheduleVisualState = (info?: ScheduleAttendanceInfo) => {
    if (!info) {
      return {
        border: 'border-blue-200',
        background: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        badge: 'bg-blue-100 text-blue-800',
        label: 'Chưa điểm danh'
      };
    }

    const presentEquivalent = info.presentCount + info.lateCount;
    const absentEquivalent = info.absentCount + info.excusedCount;

    if (info.attendedCount === 0) {
      return {
        border: 'border-blue-200',
        background: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        badge: 'bg-blue-100 text-blue-800',
        label: 'Chưa điểm danh'
      };
    }

    if (info.attendedCount < info.totalStudents) {
      return {
        border: 'border-amber-300',
        background: 'bg-amber-50',
        hover: 'hover:bg-amber-100',
        badge: 'bg-amber-100 text-amber-800',
        label: `Đã điểm danh ${info.attendedCount}/${info.totalStudents}`
      };
    }

    if (absentEquivalent === info.totalStudents) {
      return {
        border: 'border-red-400',
        background: 'bg-red-50',
        hover: 'hover:bg-red-100',
        badge: 'bg-red-100 text-red-800',
        label: 'Tất cả học sinh vắng'
      };
    }

    if (presentEquivalent > absentEquivalent) {
      return {
        border: 'border-green-400',
        background: 'bg-green-50',
        hover: 'hover:bg-green-100',
        badge: 'bg-green-100 text-green-800',
        label: 'Học sinh đi học nhiều hơn vắng'
      };
    }

    if (absentEquivalent > presentEquivalent) {
      return {
        border: 'border-yellow-400',
        background: 'bg-yellow-50',
        hover: 'hover:bg-yellow-100',
        badge: 'bg-yellow-100 text-yellow-800',
        label: 'Vắng nhiều hơn đi học'
      };
    }

    return {
      border: 'border-green-400',
      background: 'bg-green-50',
      hover: 'hover:bg-green-100',
      badge: 'bg-green-100 text-green-800',
      label: 'Học sinh đi học nhiều hơn vắng'
    };
  };

  const canEditScheduleAttendance = (schedule: Schedule): boolean => {
    if (!schedule.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return schedule.date === today;
  };

  const attendanceStatusLabels = {
    present: 'Có mặt',
    absent: 'Vắng mặt',
    late: 'Đi muộn',
    excused: 'Có phép',
    not_attended: 'Chưa điểm danh'
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800',
      not_attended: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={cn("text-xs font-medium", variants[status as keyof typeof variants] || variants.not_attended)}>
        {attendanceStatusLabels[status as keyof typeof attendanceStatusLabels] || attendanceStatusLabels.not_attended}
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

  const attendanceActionOrder: Array<'present' | 'late' | 'excused' | 'absent'> = [
    'present',
    'late',
    'excused',
    'absent',
  ];

  const attendanceActionConfig: Record<typeof attendanceActionOrder[number], {
    label: string;
    className: string;
  }> = {
    present: {
      label: 'Có mặt',
      className: 'border-green-200 text-green-700 hover:bg-green-50',
    },
    late: {
      label: 'Đi muộn',
      className: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50',
    },
    excused: {
      label: 'Có phép',
      className: 'border-blue-200 text-blue-700 hover:bg-blue-50',
    },
    absent: {
      label: 'Vắng',
      className: 'border-red-200 text-red-700 hover:bg-red-50',
    },
  };

  const filterSchedulesForClass = (classId: string, schedules: Schedule[] = []) =>
    schedules.filter(schedule => !schedule.classroom_id || schedule.classroom_id === classId);

  const getPendingStatus = (scheduleKey: string | null, studentId: string | undefined) => {
    if (!scheduleKey || !studentId) return undefined;
    return pendingAttendanceChanges[scheduleKey]?.[studentId];
  };

  const hasPendingChangesForSchedule = (scheduleKey: string | null) => {
    if (!scheduleKey) return false;
    const pending = pendingAttendanceChanges[scheduleKey];
    return !!pending && Object.keys(pending).length > 0;
  };

  const buildAttendanceViewData = useCallback((
    scheduleContext: { schedule: Schedule; classItem: Class } | null,
    attendancePayload: any | null
  ) => {
    if (!scheduleContext) return null;

    const classId = scheduleContext.classItem.id;
    const classStudents = students[classId] || [];
    const studentsMap = new Map<string, Student>();
    classStudents.forEach((student) => {
      if (student.id) {
        studentsMap.set(student.id, student);
      }
    });

    const records = parseAttendanceRecords(attendancePayload?.records || {});
    const recordStudentIds = Object.keys(records);

    const studentsFromRecords = recordStudentIds.map((studentId) => {
      const student = studentsMap.get(studentId) || {
        id: studentId,
        name: 'Học sinh chưa xác định',
        studentCode: records[studentId]?.student_id || studentId,
        className: scheduleContext.classItem.name
      };
      const attendanceInfo = getStudentAttendanceStatus(studentId, records);
      return {
        student,
        status: attendanceInfo.status,
        notes: attendanceInfo.notes,
        timestamp: attendanceInfo.timestamp
      };
    });

    const studentsWithoutRecords = classStudents
      .filter((student) => !recordStudentIds.includes(student.id))
      .map((student) => {
        const attendanceInfo = getStudentAttendanceStatus(student.id, records);
        return {
          student,
          status: attendanceInfo.status,
          notes: attendanceInfo.notes,
          timestamp: attendanceInfo.timestamp
        };
      });

    const uniqueStudents: Array<{
      student: Student;
      status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended';
      notes: string;
      timestamp: string;
    }> = [];
    const seen = new Set<string>();

    [...studentsFromRecords, ...studentsWithoutRecords].forEach((item) => {
      const key = item.student.id;
      if (!key || seen.has(key)) return;
      seen.add(key);
      uniqueStudents.push(item);
    });

    const stats = uniqueStudents.reduce(
      (acc, item) => {
        switch (item.status) {
          case 'present':
            acc.present += 1;
            break;
          case 'absent':
            acc.absent += 1;
            break;
          case 'late':
            acc.late += 1;
            break;
          case 'excused':
            acc.excused += 1;
            break;
          default:
            acc.notAttended += 1;
            break;
        }
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0, notAttended: 0 }
    );

    return {
      classStudentsCount: classStudents.length,
      studentsWithAttendance: uniqueStudents,
      stats,
      records
    };
  }, [students]);

  const detailAttendanceView = useMemo(
    () => buildAttendanceViewData(detailSchedule, detailAttendance),
    [buildAttendanceViewData, detailSchedule, detailAttendance]
  );

  const modalAttendanceView = useMemo(
    () => buildAttendanceViewData(selectedSchedule, attendanceForStudentList),
    [attendanceForStudentList, buildAttendanceViewData, selectedSchedule]
  );

  const renderAttendanceActionButtons = (
    item: {
      student: Student;
      status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended';
    },
    scheduleContext: { schedule: Schedule; classItem: Class } | null
  ) => {
    if (!scheduleContext?.schedule?.date || !item.student.id) return null;
    const editable = canEditScheduleAttendance(scheduleContext.schedule);
    const scheduleKey = getScheduleKey(scheduleContext.classItem.id, scheduleContext.schedule);
    const pendingStatus = getPendingStatus(scheduleKey, item.student.id);
    const displayStatus = pendingStatus || item.status;

    return (
      <div className="flex flex-col gap-1 mt-3">
        <div className="flex flex-wrap gap-2">
          {attendanceActionOrder.map((actionKey) => (
            <Button
              key={actionKey}
              size="sm"
              variant={displayStatus === actionKey ? 'default' : 'outline'}
              className={cn(
                "h-7 px-3 text-xs font-medium",
                attendanceActionConfig[actionKey].className,
                displayStatus === actionKey && 'bg-slate-900 text-white hover:bg-slate-800'
              )}
              disabled={!editable}
              onClick={() => handleSelectAttendanceStatus(scheduleContext, item.student.id, actionKey)}
            >
              {attendanceActionConfig[actionKey].label}
            </Button>
          ))}
        </div>
        {!editable && (
          <span className="text-[11px] text-slate-500">
            Chỉ có thể chọn trạng thái trong đúng ngày của lịch học.
          </span>
        )}
      </div>
    );
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

      // Find today's schedule
      const todaySchedule = schedules.find((s: Schedule) => s.date === today) || todaySchedules[classItem.id];
      
      if (!todaySchedule) {
        alert('Không tìm thấy lịch học hôm nay cho lớp này.');
        setQuickAttendanceLoading(prev => ({ ...prev, [classItem.id]: false }));
        return;
      }

      // Confirm before quick attendance
      const confirmMessage = `Bạn có chắc muốn điểm danh nhanh cho lớp ${classItem.name}?\n\nNgày học: ${todaySchedule.date}\nTất cả học sinh sẽ được đánh dấu là "Có mặt" trong ngày này.`;
      
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
      let existingAttendanceRecord: any = null;
      try {
        const existingAttendance = await attendancesAPI.getAttendances({
          classroom_id: classItem.id,
          date: today
        });
        const existingList = extractApiDataArray(existingAttendance);
        existingAttendanceRecord = existingList.find(
          (item: any) => item && item.classroom_id === classItem.id && item.date === today
        ) || existingList[0];
        console.log('Existing attendance check:', existingAttendanceRecord);
      } catch (err) {
        console.warn('Error checking existing attendance:', err);
        existingAttendanceRecord = null;
      }

      if (existingAttendanceRecord?.id) {
        // Update existing attendance
        try {
          console.log('Updating existing attendance:', existingAttendanceRecord.id);
          await attendancesAPI.updateAttendance(existingAttendanceRecord.id, {
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
              const retryList = extractApiDataArray(retryAttendance);
              const retryRecord = retryList.find(
                (item: any) => item && item.classroom_id === classItem.id && item.date === today
              ) || retryList[0];
              if (retryRecord?.id) {
                await attendancesAPI.updateAttendance(retryRecord.id, {
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

      if (detailSchedule?.classItem.id === classItem.id && todaySchedule) {
        await handleDetailScheduleSelect(classItem, todaySchedule);
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
      const existingList = extractApiDataArray(existingAttendance);
      const existingRecord = existingList.find(
        (item: any) => item && item.classroom_id === selectedClass.id && item.date === attendanceDate
      ) || existingList[0];
      
      if (existingRecord?.id) {
        // Update existing attendance
        await attendancesAPI.updateAttendance(existingRecord.id, {
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
                  const todayString = new Date().toISOString().split('T')[0];
                  const isSameDay = todaySchedule.date === todayString;
                  const scheduleKey = `${classItem.id}_${todaySchedule.id}_${todaySchedule.date}`;
                  const attendanceStatus = scheduleAttendances[scheduleKey];
                  
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
                            {isSameDay && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Đang trong ngày học
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
                        {isSameDay && attendanceStatus?.status !== 'complete' && (
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
                        {isSameDay && attendanceStatus?.status === 'complete' && (
                          <div className="flex-1 flex items-center justify-center p-2 bg-green-100 rounded-md">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Đã điểm danh đầy đủ</span>
                          </div>
                        )}
                        {!isSameDay && (
                          <div className="flex-1 text-xs text-slate-500 flex items-center justify-center">
                            Chỉ có thể điểm danh trong ngày học
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAttendance(classItem, todaySchedule)}
                          disabled={!todaySchedule.date || loadingAttendanceForStudentList}
                          className={cn(
                            "flex-1 border-blue-300 text-blue-600 hover:bg-blue-50",
                            (!todaySchedule.date || loadingAttendanceForStudentList) && "opacity-60 cursor-not-allowed"
                          )}
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
                        {filterSchedulesForClass(classItem.id, classSchedules[classItem.id]).map((schedule) => {
                          const isToday = isScheduleToday(schedule);
                          const isBefore = isScheduleBeforeToday(schedule);
                          const isAfter = isScheduleAfterToday(schedule);
                          const isLocked = isBefore || isAfter;
                          const scheduleKey = getScheduleKey(classItem.id, schedule);
                          const attendanceInfo = scheduleAttendances[scheduleKey];
                          const visualState = getScheduleVisualState(attendanceInfo);

                          return (
                            <div
                              key={schedule.id}
                              className={cn(
                                "p-3 rounded-lg border-2 transition-all relative",
                                visualState.border,
                                visualState.background,
                                visualState.hover,
                                isLocked && 'opacity-60 cursor-not-allowed'
                              )}
                            >
                              {/* Attendance status badge */}
                              {attendanceInfo && attendanceInfo.attendedCount === attendanceInfo.totalStudents && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              {attendanceInfo && attendanceInfo.attendedCount > 0 && attendanceInfo.attendedCount < attendanceInfo.totalStudents && (
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
                                    {attendanceInfo && (
                                      <Badge className={cn("text-xs", visualState.badge)}>
                                        {visualState.label}
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

                <Button
                  variant="default"
                  onClick={() => handleFocusClass(classItem)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Hiển thị màn hình chi tiết
                </Button>

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

        {activeClassForDetail && (() => {
          const detailClass = filteredClasses.find(cls => cls.id === activeClassForDetail.id) || activeClassForDetail;
          if (!detailClass) return null;
          const detailClassSchedules = filterSchedulesForClass(detailClass.id, classSchedules[detailClass.id] || []);
          const detailScheduleKey =
            detailSchedule && detailSchedule.classItem.id === detailClass.id
              ? getScheduleKey(detailSchedule.classItem.id, detailSchedule.schedule)
              : null;
          return (
          <Card className="mt-6 border-blue-200 shadow-xl">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Màn hình điểm danh chi tiết
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  {detailClass.name} · {detailClass.subject}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => loadSchedulesForClass(detailClass.id)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Làm mới lịch
                </Button>
                {(() => {
                  const todaySchedule = todaySchedules[detailClass.id];
                  const canQuickAttend =
                    todaySchedule &&
                    canEditScheduleAttendance(todaySchedule) &&
                    !(scheduleAttendances[getScheduleKey(detailClass.id, todaySchedule)]?.status === 'complete');
                  
                  if (!todaySchedule) {
                    return null;
                  }

                  return (
                    <Button
                      onClick={() => handleQuickAttendance(detailClass)}
                      disabled={!canQuickAttend || quickAttendanceLoading[detailClass.id]}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {quickAttendanceLoading[detailClass.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang điểm danh nhanh
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Điểm danh nhanh
                        </>
                      )}
                    </Button>
                  );
                })()}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setActiveClassForDetail(null);
                    setDetailSchedule(null);
                    setDetailAttendance(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Đóng màn hình chi tiết
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Danh sách lịch học</h3>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {detailClassSchedules.length} lịch
                    </Badge>
                  </div>
                  {loadingSchedules[detailClass.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-slate-600">Đang tải lịch học...</span>
                    </div>
                  ) : classSchedules[detailClass.id] && classSchedules[detailClass.id].length > 0 ? (
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {detailClassSchedules.map((schedule) => {
                        const scheduleKey = getScheduleKey(detailClass.id, schedule);
                        const attendanceInfo = scheduleAttendances[scheduleKey];
                        const visualState = getScheduleVisualState(attendanceInfo);
                        const isSelected = detailSchedule?.schedule.id === schedule.id;

                        return (
                          <button
                            key={schedule.id}
                            onClick={() => handleDetailScheduleSelect(detailClass, schedule)}
                            className={cn(
                              "w-full text-left p-4 rounded-xl border-2 transition-all",
                              visualState.border,
                              visualState.background,
                              visualState.hover,
                              !schedule.date && "opacity-50 cursor-not-allowed",
                              schedule.date && "cursor-pointer",
                              isSelected && "ring-2 ring-blue-400"
                            )}
                            disabled={!schedule.date}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {formatScheduleDate(schedule)}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                                {schedule.room_detail && (
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {schedule.room_detail.name || schedule.room || 'Chưa có phòng'}
                                  </div>
                                )}
                              </div>
                              {attendanceInfo && (
                                <Badge className={cn("text-xs", visualState.badge)}>
                                  {visualState.label}
                                </Badge>
                              )}
                            </div>
                            {attendanceInfo ? (
                              <div className="text-xs text-slate-600 mt-3 flex flex-wrap gap-3">
                                <span>
                                  Có mặt: <span className="font-semibold text-green-700">
                                    {attendanceInfo.presentCount + attendanceInfo.lateCount}
                                  </span>/{attendanceInfo.totalStudents}
                                </span>
                                <span>
                                  Vắng: <span className="font-semibold text-red-600">
                                    {attendanceInfo.absentCount + attendanceInfo.excusedCount}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 mt-3">
                                Chưa có dữ liệu điểm danh
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed rounded-xl text-center text-sm text-slate-500">
                      Chưa có lịch học nào cho lớp này.
                    </div>
                  )}
                </div>
                <div className="xl:col-span-2">
                  {detailSchedule ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatScheduleDate(detailSchedule.schedule)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{detailSchedule.schedule.start_time} - {detailSchedule.schedule.end_time}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleStartAttendance(detailSchedule.classItem, detailSchedule.schedule.date)}
                            disabled={!canEditScheduleAttendance(detailSchedule.schedule)}
                            className="border-blue-200 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            {canEditScheduleAttendance(detailSchedule.schedule) ? 'Chỉnh sửa điểm danh' : 'Không trong ngày học'}
                          </Button>
                          {hasPendingChangesForSchedule(detailScheduleKey) && detailSchedule && (
                            <Button
                              onClick={() => handleSavePendingAttendance(detailSchedule.classItem, detailSchedule.schedule)}
                              disabled={!!detailScheduleKey && savingAttendance[detailScheduleKey]}
                              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {detailScheduleKey && savingAttendance[detailScheduleKey] ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Đang lưu...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Lưu điểm danh
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                                  onClick={() => handleViewAttendance(detailSchedule.classItem, detailSchedule.schedule)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Mở toàn màn hình
                          </Button>
                        </div>
                      </div>

                      {loadingDetailAttendance ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-slate-600">Đang tải danh sách học sinh...</span>
                        </div>
                      ) : detailAttendanceView ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="p-4 rounded-lg border bg-green-50">
                              <div className="text-xs text-green-600 font-semibold">Có mặt</div>
                              <div className="text-2xl font-bold text-green-700">{detailAttendanceView.stats.present}</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-red-50">
                              <div className="text-xs text-red-600 font-semibold">Vắng mặt</div>
                              <div className="text-2xl font-bold text-red-700">{detailAttendanceView.stats.absent}</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-yellow-50">
                              <div className="text-xs text-yellow-600 font-semibold">Đi muộn</div>
                              <div className="text-2xl font-bold text-yellow-700">{detailAttendanceView.stats.late}</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-blue-50">
                              <div className="text-xs text-blue-600 font-semibold">Có phép</div>
                              <div className="text-2xl font-bold text-blue-700">{detailAttendanceView.stats.excused}</div>
                            </div>
                            <div className="p-4 rounded-lg border bg-gray-50">
                              <div className="text-xs text-gray-600 font-semibold">Chưa điểm danh</div>
                              <div className="text-2xl font-bold text-gray-700">{detailAttendanceView.stats.notAttended}</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 mt-4 mb-3">
                              Danh sách học sinh ({detailAttendanceView.studentsWithAttendance.length} học sinh)
                            </h4>
                            {detailAttendanceView.studentsWithAttendance.length > 0 ? (
                              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                {detailAttendanceView.studentsWithAttendance.map((item, index) => (
                                  <div
                                    key={item.student.id || `${item.student.name}-${index}`}
                                    className={cn(
                                      "flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm",
                                      getStatusBorderColor(item.status),
                                      item.status === 'present' && 'bg-green-50/40',
                                      item.status === 'absent' && 'bg-red-50/40',
                                      item.status === 'late' && 'bg-yellow-50/40',
                                      item.status === 'excused' && 'bg-blue-50/40'
                                    )}
                                  >
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold flex items-center justify-center text-lg">
                                        {item.student.name?.charAt(0)?.toUpperCase() || 'H'}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-slate-900">{item.student.name}</span>
                                          {getStatusIcon(item.status)}
                                          {getStatusBadge(item.status)}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          Mã học sinh: {item.student.studentCode || '—'}
                                        </div>
                                        {item.notes && (
                                          <div className="text-xs text-slate-500 mt-1 italic">
                                            Ghi chú: {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                              {renderAttendanceActionButtons(item, detailSchedule)}
                            </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 border-2 border-dashed rounded-xl text-center text-sm text-slate-500">
                                Chưa có học sinh nào trong lớp hoặc dữ liệu chưa được tải.
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="p-6 border-2 border-dashed rounded-xl text-center text-sm text-slate-500">
                          Chưa có dữ liệu điểm danh cho lịch học này.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed rounded-xl text-center text-sm text-slate-500">
                      Chọn một lịch học ở cột bên trái để xem chi tiết điểm danh.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })()}

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
      {showStudentList && selectedSchedule && (
        (() => {
          const selectedScheduleKey = getScheduleKey(selectedSchedule.classItem.id, selectedSchedule.schedule);
          const modalHasPending = hasPendingChangesForSchedule(selectedScheduleKey);
          const modalSaving = savingAttendance[selectedScheduleKey];
          return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh sách học sinh</h2>
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

                {loadingAttendanceForStudentList ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Đang tải thông tin điểm danh...</p>
                  </div>
              ) : modalAttendanceView ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="text-xs text-green-600 font-medium mb-1">Có mặt</div>
                      <div className="text-2xl font-bold text-green-700">{modalAttendanceView.stats.present}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                      <div className="text-xs text-red-600 font-medium mb-1">Vắng mặt</div>
                      <div className="text-2xl font-bold text-red-700">{modalAttendanceView.stats.absent}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                      <div className="text-xs text-yellow-600 font-medium mb-1">Đi muộn</div>
                      <div className="text-2xl font-bold text-yellow-700">{modalAttendanceView.stats.late}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="text-xs text-blue-600 font-medium mb-1">Có phép</div>
                      <div className="text-2xl font-bold text-blue-700">{modalAttendanceView.stats.excused}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <div className="text-xs text-gray-600 font-medium mb-1">Chưa điểm danh</div>
                      <div className="text-2xl font-bold text-gray-700">{modalAttendanceView.stats.notAttended}</div>
          </div>
        </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Danh sách học sinh ({modalAttendanceView.studentsWithAttendance.length} học sinh)
                  </h3>
                    {modalAttendanceView.studentsWithAttendance.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {modalAttendanceView.studentsWithAttendance.map((item, index) => (
                        <div
                          key={item.student.id || `${item.student.name}-${index}`}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm",
                            getStatusBorderColor(item.status),
                            item.status === 'present' && 'bg-green-50/40',
                            item.status === 'absent' && 'bg-red-50/40',
                            item.status === 'late' && 'bg-yellow-50/40',
                            item.status === 'excused' && 'bg-blue-50/40'
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold flex items-center justify-center">
                              {item.student.name?.charAt(0)?.toUpperCase() || 'H'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">{item.student.name}</span>
                                {getStatusIcon(item.status)}
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="text-sm text-slate-500">Mã học sinh: {item.student.studentCode || '—'}</div>
                              {item.notes && (
                                <div className="text-xs text-slate-500 mt-1 italic">
                                  Ghi chú: {item.notes}
                                </div>
                              )}
                              {item.timestamp && (
                                <div className="text-xs text-slate-400 mt-1">
                                  Thời gian điểm danh: {new Date(item.timestamp).toLocaleString('vi-VN')}
                                </div>
                              )}
                              {renderAttendanceActionButtons(item, selectedSchedule)}
                                </div>
                            </div>
                          <span className="text-sm text-slate-500 font-semibold">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                      <div className="text-center py-6 text-sm text-gray-500">
                        Chưa có dữ liệu điểm danh cho lịch học này.
                    </div>
                  )}
                </div>
                </>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                  Không tìm thấy dữ liệu điểm danh.
                </div>
              )}

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  {modalHasPending && (
                    <Button
                      onClick={() => handleSavePendingAttendance(selectedSchedule.classItem, selectedSchedule.schedule)}
                      disabled={modalSaving}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {modalSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Lưu điểm danh
                        </>
                      )}
                    </Button>
                  )}
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
                    disabled={!canEditScheduleAttendance(selectedSchedule.schedule)}
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
        })()
      )}
    </div>
  );
}
