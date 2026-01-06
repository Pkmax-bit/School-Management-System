"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Search, AlertCircle, Loader2, Building2, Clock, MapPin, User, BookOpen, CheckCircle } from 'lucide-react';
import schedulesApi, { Schedule, ScheduleCreate } from '../../lib/schedules-api';
import campusesApi from '../../lib/campuses-api';
import classroomsHybridApi from '../../lib/classrooms-api-hybrid';
import roomsApi, { Room } from '../../lib/rooms-api';
import subjectsApi from '../../lib/subjects-api-hybrid';
import { teachersApi } from '../../lib/teachers-api';

type TeacherOption = {
  id: string;
  name?: string;
  email?: string;
};

const DAYS_OF_WEEK = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'
];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
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

const getScheduleDayIndex = (date: Date) => {
  const jsDay = date.getDay(); // 0 (Sun) - 6 (Sat)
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0 = Monday
};

const getTeacherDisplayName = (teacher?: Schedule['teacher']) =>
  teacher?.display_name ||
  teacher?.user?.full_name ||
  teacher?.email ||
  teacher?.teacher_code ||
  '';

const getTeacherEmail = (teacher?: Schedule['teacher']) =>
  teacher?.email || teacher?.user?.email || '';

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
  return Array.from({ length: 7 }, (_, index) => {
    const dateObj = new Date(start);
    dateObj.setDate(start.getDate() + index);
    dateObj.setHours(0, 0, 0, 0);
    const isoDate = formatDateKey(dateObj);
    return {
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

export default function SchedulePage() {
  const { isCollapsed } = useSidebar();
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  // State management
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<ScheduleCreate>({
    classroom_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 0,
    start_time: '08:00',
    end_time: '09:00',
    room: '',
    room_id: '',
    campus_id: '',
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [scheduleList, setScheduleList] = useState<Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
    room_id?: string;
    date?: string;
  }>>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStartDate(new Date()));
  const [classroomSchedules, setClassroomSchedules] = useState<Schedule[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const loadCampuses = useCallback(async () => {
    try {
      setLoadingCampuses(true);
      const data = await campusesApi.list();
      setCampuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading campuses:', error);
      setCampuses([]);
    } finally {
      setLoadingCampuses(false);
    }
  }, []);

  const loadClassrooms = useCallback(async (campusId?: string) => {
    try {
      setLoadingClassrooms(true);
      const params = campusId ? { campus_id: campusId } : {};
      const data = await classroomsHybridApi.list(params);
      const list = Array.isArray(data) ? data : [];
      setClassrooms(list);
    } catch (error) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      const data = await subjectsApi.getSubjects({ limit: 1000 });
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setSubjects(list);
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    try {
      setLoadingTeachers(true);
      const data = await teachersApi.getTeachers();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      const mapped = list.map((t: any) => ({
        id: t.id,
        name: t.name || t.users?.full_name,
        email: t.email || t.users?.email,
      }));
      setTeachers(mapped);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true);
      
      // Load schedules from API
      const params: any = {};
      if (selectedCampus) {
        params.campus_id = selectedCampus;
      }
      if (selectedDay !== null) {
        params.day_of_week = selectedDay;
      }
      
      const data = await schedulesApi.list(params);
      const schedulesList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setSchedules(schedulesList);
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedCampus, selectedDay]);

  // Load data once
  useEffect(() => {
    if (user && user.role === 'admin' && !hasLoaded) {
      loadCampuses();
      loadClassrooms();
      loadSubjects();
      loadTeachers();
      loadSchedules();
      setHasLoaded(true);
    }
  }, [user, hasLoaded, loadCampuses, loadClassrooms, loadSubjects, loadTeachers, loadSchedules]);

  // Reload when filters change
  useEffect(() => {
    if (hasLoaded) {
      loadSchedules();
    }
  }, [selectedCampus, selectedDay, hasLoaded, loadSchedules]);

  const checkRoomConflict = async (
    room: string, 
    dayOfWeek: number, 
    startTime: string, 
    endTime: string, 
    campusId: string, 
    excludeId?: string,
    specificDate?: string  // Ngày cụ thể (YYYY-MM-DD format)
  ) => {
    try {
      // Lấy danh sách lịch học cùng phòng, cùng cơ sở
      // Nếu có ngày cụ thể, lấy tất cả lịch để lọc theo ngày
      // Nếu không có ngày cụ thể, lọc theo day_of_week
      const existingSchedules = await schedulesApi.list({
        campus_id: campusId,
        ...(specificDate ? {} : { day_of_week: dayOfWeek })
      });
      
      // Lọc các lịch học cùng phòng
      // Ưu tiên kiểm tra ngày cụ thể trước
      let conflictingSchedules: Schedule[] = [];
      
      if (specificDate) {
        // Kiểm tra theo ngày cụ thể: cùng phòng, cùng ngày cụ thể
        conflictingSchedules = existingSchedules.filter((schedule: Schedule) => 
          schedule.room === room && 
          schedule.date === specificDate &&
          (!excludeId || schedule.id !== excludeId)
        );
      } else {
        // Kiểm tra theo day_of_week: cùng phòng, cùng thứ trong tuần, không có ngày cụ thể
        conflictingSchedules = existingSchedules.filter((schedule: Schedule) => 
          schedule.room === room && 
          schedule.day_of_week === dayOfWeek &&
          !schedule.date && // Chỉ lấy lịch không có ngày cụ thể
          (!excludeId || schedule.id !== excludeId)
        );
      }
      
      // Nếu không có lịch cùng phòng, không có xung đột
      if (conflictingSchedules.length === 0) {
        return { hasConflict: false };
      }
      
      // Kiểm tra xung đột thời gian
      const newStart = new Date(`2000-01-01T${startTime}`);
      const newEnd = new Date(`2000-01-01T${endTime}`);
      
      for (const schedule of conflictingSchedules) {
        const existingStart = new Date(`2000-01-01T${schedule.start_time}`);
        const existingEnd = new Date(`2000-01-01T${schedule.end_time}`);
        
        if (newStart < existingEnd && newEnd > existingStart) {
          const dateInfo = schedule.date 
            ? formatDateDisplay(schedule.date, { day: '2-digit', month: '2-digit', year: 'numeric' })
            : `thứ ${dayOfWeek + 2}`;
          
          return {
            hasConflict: true,
            conflictSchedule: schedule,
            message: `Phòng ${room} đã được sử dụng trong khung giờ ${schedule.start_time} - ${schedule.end_time} vào ${dateInfo}`
          };
        }
      }
      
      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking room conflict:', error);
      return { hasConflict: false };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.classroom_id) newErrors.classroom_id = 'Lớp học là bắt buộc';
    if (!formData.subject_id) newErrors.subject_id = 'Môn học là bắt buộc';
    if (!formData.teacher_id) newErrors.teacher_id = 'Giáo viên là bắt buộc';
    const requireRoom = selectedCampus && rooms.length > 0;
    if (requireRoom && !formData.room_id) {
      newErrors.room = 'Vui lòng chọn phòng học hợp lệ';
    }
    if (formData.start_time >= formData.end_time) {
      newErrors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (scheduleList.length === 0) {
      alert('Vui lòng thêm ít nhất một lịch học vào danh sách');
      return;
    }

    if (!formData.classroom_id || !formData.subject_id || !formData.teacher_id) {
      alert('Vui lòng chọn lớp học, môn học và giáo viên');
      return;
    }

    // Tất cả lịch phải có phòng học
    const hasMissingRoom = scheduleList.some(item => !item.room_id);
    if (hasMissingRoom) {
      alert('Vui lòng nhập phòng học cho tất cả lịch trước khi tạo');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrors({});
      
      const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
      const campusForSchedule = selectedCampus || selectedClassroom?.campus_id || formData.campus_id;

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Tạo từng lịch học
      for (let i = 0; i < scheduleList.length; i++) {
        const scheduleItem = scheduleList[i];
        
        try {
          const scheduleData: ScheduleCreate = {
            ...formData,
            day_of_week: scheduleItem.day_of_week,
            start_time: scheduleItem.start_time,
            end_time: scheduleItem.end_time,
            room: scheduleItem.room,
            room_id: scheduleItem.room_id || undefined,
            campus_id: campusForSchedule || undefined,
          };

          // Kiểm tra xung đột phòng học (ưu tiên kiểm tra ngày cụ thể trước)
          if (scheduleItem.room && campusForSchedule) {
            const conflictCheck = await checkRoomConflict(
              scheduleItem.room,
              scheduleItem.day_of_week,
              scheduleItem.start_time,
              scheduleItem.end_time,
              campusForSchedule,
              undefined,
              scheduleItem.date  // Truyền ngày cụ thể nếu có
            );
            
            if (conflictCheck.hasConflict) {
              errors.push(`Lịch ${i + 1}: ${conflictCheck.message}`);
              failedCount++;
              continue; // Skip this schedule and continue with next
            }
          }

          // Thêm date vào scheduleData nếu có
          if (scheduleItem.date) {
            scheduleData.date = scheduleItem.date;
          }

          await schedulesApi.create(scheduleData);
          successCount++;
          
          // Small delay between requests to avoid overwhelming the server
          if (i < scheduleList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error: any) {
          console.error(`Error creating schedule ${i + 1}:`, error);
          const errorMessage = error?.message || 'Có lỗi khi tạo lịch học';
          
          // Check if it's an authentication error
          if (errorMessage.includes('401') || errorMessage.includes('hết hạn') || errorMessage.includes('Unauthorized')) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử lại.');
            // Redirect to login or refresh page
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/login';
            }
            return;
          }
          
          errors.push(`Lịch ${i + 1}: ${errorMessage}`);
          failedCount++;
        }
      }
      
      // Reload schedules if at least one was created
      if (successCount > 0) {
        await loadSchedules();
      }
      
      // Show results
      if (successCount === scheduleList.length) {
        setIsDialogOpen(false);
        resetForm();
        alert(`✅ Tạo thành công ${successCount} lịch học!`);
      } else if (successCount > 0) {
        setIsDialogOpen(false);
        resetForm();
        alert(`⚠️ Tạo thành công ${successCount}/${scheduleList.length} lịch học.\n\nLỗi:\n${errors.join('\n')}`);
      } else {
        // All failed
        const errorMessage = errors.length > 0 
          ? errors.join('\n')
          : 'Không thể tạo lịch học. Vui lòng thử lại.';
        
        // Kiểm tra nếu là lỗi xung đột phòng học
        if (errorMessage.includes('Phòng') && errorMessage.includes('đã được sử dụng')) {
          alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${errorMessage}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác trong tuần`);
        } else {
          alert(`❌ Lỗi tạo lịch học:\n\n${errorMessage}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating schedules:', error);
      const errorMessage = error?.message || 'Có lỗi khi tạo lịch học';
      
      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('hết hạn') || errorMessage.includes('Unauthorized')) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử lại.');
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        return;
      }
      
      // Kiểm tra nếu là lỗi xung đột phòng học
      if (errorMessage.includes('Phòng') && errorMessage.includes('đã được sử dụng')) {
        alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${errorMessage}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác trong tuần`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule || !validateForm()) return;
    
    // Kiểm tra xung đột phòng học trước khi cập nhật (ưu tiên kiểm tra ngày cụ thể trước)
    const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
    const campusForSchedule = selectedCampus || selectedClassroom?.campus_id || formData.campus_id || editingSchedule.campus_id || editingSchedule.campus?.id || '';

    if (formData.room && campusForSchedule) {
      const conflictCheck = await checkRoomConflict(
        formData.room,
        formData.day_of_week,
        formData.start_time,
        formData.end_time,
        campusForSchedule,
        editingSchedule.id,
        (formData as any).date  // Truyền ngày cụ thể nếu có
      );
      
      if (conflictCheck.hasConflict) {
        alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${conflictCheck.message}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác`);
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      const payload: ScheduleCreate = {
        ...formData,
        room_id: formData.room_id || undefined,
        campus_id: campusForSchedule || undefined,
      };
      await schedulesApi.update(editingSchedule.id, payload);
      await loadSchedules();
      setIsDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      alert('Cập nhật lịch học thành công!');
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      const errorMessage = error?.message || 'Có lỗi khi cập nhật lịch học';
      
      // Kiểm tra nếu là lỗi xung đột phòng học
      if (errorMessage.includes('Phòng') && errorMessage.includes('đã được sử dụng')) {
        alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${errorMessage}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác trong tuần`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch học này?')) return;
    try {
      const result = await schedulesApi.delete(id);
      
      // Check if schedule was not found (already deleted)
      if (result?.notFound) {
        await loadSchedules();
        alert('Lịch học không tồn tại hoặc đã được xóa. Danh sách đã được cập nhật.');
        return;
      }
      
      await loadSchedules();
      alert('Xóa lịch học thành công!');
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      alert(error?.message || 'Có lỗi khi xóa lịch học');
    }
  };

  const handleEdit = async (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      classroom_id: schedule.classroom_id,
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || '',
      room_id: schedule.room_id || '',
      campus_id: schedule.campus_id || schedule.campus?.id || '',
    });
    setErrors({});
    setIsDialogOpen(true);
    setClassroomSchedules(schedules.filter(item => item.classroom_id === schedule.classroom_id));
    
    // Load rooms if campus is available from schedule
    if (schedule.campus?.id) {
      setSelectedCampus(schedule.campus.id);
      await loadRooms(schedule.campus.id);
    }
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    resetForm();
    setIsDialogOpen(true);
    setClassroomSchedules([]);
  };

  const loadRooms = useCallback(async (campusId?: string) => {
    if (!campusId) {
      setRooms([]);
      return;
    }
    try {
      setLoadingRooms(true);
      const data = await roomsApi.list(campusId);
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const handleCampusChange = (campusId: string) => {
    setSelectedCampus(campusId);
    loadClassrooms(campusId);
    loadRooms(campusId);
    setFormData(prev => ({ ...prev, campus_id: campusId, room: '', room_id: '' }));
    setScheduleList(prev =>
      prev.map(item => ({
        ...item,
        room: '',
        room_id: undefined,
      }))
    );
  };

  const handleClassroomChange = (classroomId: string) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (classroom) {
      setFormData(prev => ({
        ...prev,
        classroom_id: classroomId,
        teacher_id: classroom.teacher_id || '',
        subject_id: classroom.subject_id || '', // Auto-fill subject from classroom
        room: '',
        room_id: '',
      }));

      if (classroom.campus_id && classroom.campus_id !== selectedCampus) {
        setSelectedCampus(classroom.campus_id);
        loadClassrooms(classroom.campus_id);
        loadRooms(classroom.campus_id);
      } else {
        loadRooms(selectedCampus);
      }

      // Không tự động chọn ngày, chỉ hiển thị khoảng thời gian để người dùng chọn
      // Xóa selectedDates khi chọn lớp học mới
      setSelectedDates([]);
    }
  };

  const resetForm = () => {
    setFormData({
      classroom_id: '',
      subject_id: '',
      teacher_id: '',
      day_of_week: 0,
      start_time: '08:00',
      end_time: '09:00',
      room: '',
      room_id: '',
      campus_id: '',
    });
    setSelectedDates([]);
    setScheduleList([]);
    setErrors({});
    setRooms([]);
    setClassroomSchedules([]);
  };


  const handleDateToggle = (date: string) => {
    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };

  const getClassroomDateRange = () => {
    // Nếu đã chọn lớp học và có ngày mở/đóng
    if (formData.classroom_id) {
      const classroom = classrooms.find(c => c.id === formData.classroom_id);
      if (classroom && classroom.open_date && classroom.close_date) {
        const startDate = parseDateOnly(classroom.open_date);
        const endDate = parseDateOnly(classroom.close_date);
        if (!startDate || !endDate) {
          return [];
        }
        const dates = [];
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dayOfWeek = getScheduleDayIndex(currentDate);
          dates.push({
            date: formatDateKey(currentDate),
            dayOfWeek: dayOfWeek,
            display: currentDate.toLocaleDateString('vi-VN', { 
              day: '2-digit', 
              month: '2-digit' 
            }),
            fullDisplay: currentDate.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
      }
    }
    
    // Fallback: hiển thị 2 tuần tiếp theo nếu chưa chọn lớp học
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) { // 2 tuần
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: formatDateKey(date),
        dayOfWeek: getScheduleDayIndex(date), // Convert to 0=Monday, 6=Sunday
        display: date.toLocaleDateString('vi-VN', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        fullDisplay: date.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      });
    }
    return dates;
  };

  // Lấy tháng từ date string (YYYY-MM-DD)
  const getMonthFromDate = (dateString: string) => {
    const date = parseDateOnly(dateString);
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Lấy số tháng từ date string để so sánh
  const getMonthNumber = (dateString: string) => {
    const date = parseDateOnly(dateString);
    if (!date) return -1;
    return date.getMonth() * 100 + date.getFullYear(); // Combine month and year for comparison
  };

  // Sắp xếp tất cả ngày từ gần hiện tại nhất đến xa nhất
  const getAllSortedDates = () => {
    const allDates = getClassroomDateRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sắp xếp tất cả ngày theo thời gian (từ gần hiện tại nhất đến xa nhất)
    return [...allDates].sort((a, b) => {
      const dateA = parseDateOnly(a.date);
      const dateB = parseDateOnly(b.date);
      if (!dateA || !dateB) return 0;
      
      // Tính khoảng cách từ ngày hiện tại
      const diffA = Math.abs(dateA.getTime() - today.getTime());
      const diffB = Math.abs(dateB.getTime() - today.getTime());
      
      // Ưu tiên ngày gần hiện tại nhất (khoảng cách nhỏ nhất)
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      
      // Nếu cùng khoảng cách, ưu tiên ngày trong tương lai
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Tạo các hàng ngang để căn chỉnh đúng - mỗi hàng có 7 cột
  // Xuống dòng mới khi:
  // 1. Chuyển từ Chủ nhật (6) sang Thứ 2 (0) - chuyển tuần
  // 2. Chuyển từ tháng này sang tháng khác - chuyển tháng
  const getDatesByRows = () => {
    const sortedDates = getAllSortedDates();
    const rows: Array<Array<typeof sortedDates[0] | null>> = [];
    
    if (sortedDates.length === 0) return rows;
    
    // Nhóm các ngày theo tuần và tháng
    let currentRow: Array<typeof sortedDates[0] | null> = new Array(7).fill(null);
    let previousDayOfWeek: number | null = null;
    let previousMonth: number | null = null;
    
    sortedDates.forEach((dateItem, index) => {
      const currentDayOfWeek = dateItem.dayOfWeek;
      const currentMonth = getMonthNumber(dateItem.date);
      
      // Kiểm tra xem có cần tạo hàng mới không
      let needNewRow = false;
      
      // 1. Chuyển từ Chủ nhật (6) sang Thứ 2 (0) - chuyển tuần
      if (previousDayOfWeek === 6 && currentDayOfWeek === 0) {
        needNewRow = true;
      }
      
      // 2. Chuyển từ tháng này sang tháng khác - chuyển tháng
      if (previousMonth !== null && currentMonth !== previousMonth) {
        needNewRow = true;
      }
      
      // Tạo hàng mới nếu cần
      if (needNewRow) {
        // Lưu hàng hiện tại và tạo hàng mới
        rows.push(currentRow);
        currentRow = new Array(7).fill(null);
      }
      
      // Đặt ngày vào đúng cột trong hàng hiện tại
      currentRow[currentDayOfWeek] = dateItem;
      previousDayOfWeek = currentDayOfWeek;
      previousMonth = currentMonth;
      
      // Nếu là ngày cuối cùng, thêm hàng cuối vào danh sách
      if (index === sortedDates.length - 1) {
        rows.push(currentRow);
      }
    });
    
    return rows;
  };

  const addToScheduleList = () => {
    if (selectedDates.length === 0) {
      alert('Vui lòng chọn ít nhất một ngày cụ thể');
      return;
    }
    
    if (!formData.start_time || !formData.end_time) {
      alert('Vui lòng điền đầy đủ thời gian');
      return;
    }

    if (!formData.room || !formData.room.trim()) {
      alert('Vui lòng nhập phòng học trước khi thêm vào danh sách');
      return;
    }

    const newSchedules: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      room: string;
      room_id?: string;
      date?: string;
    }> = [];
    
    // Thêm từ ngày cụ thể
    if (selectedDates.length > 0) {
      const dateSchedules = selectedDates.map(date => {
        const dateObj = parseDateOnly(date);
        return {
          day_of_week: dateObj ? getScheduleDayIndex(dateObj) : formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room: formData.room || '',
          room_id: formData.room_id || undefined,
          date
        };
      });
      newSchedules.push(...dateSchedules);
    }

    setScheduleList(prev => [...prev, ...newSchedules]);
    setSelectedDates([]);
  };

  const removeFromScheduleList = (index: number) => {
    setScheduleList(prev => prev.filter((_, i) => i !== index));
  };

  const clearScheduleList = () => {
    setScheduleList([]);
  };

  const updateScheduleInList = (index: number, field: string, value: string) => {
    setScheduleList(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleFormRoomSelect = (roomId: string) => {
    if (!roomId) {
      setFormData(prev => ({ ...prev, room_id: '', room: '' }));
      return;
    }
    const selectedRoom = rooms.find(r => r.id === roomId);
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        room_id: selectedRoom.id,
        room: selectedRoom.code || selectedRoom.name || '',
      }));
    }
  };

  const handleScheduleRoomSelect = (index: number, roomId: string) => {
    if (!roomId) {
      setScheduleList(prev => prev.map((item, i) =>
        i === index ? { ...item, room_id: undefined, room: '' } : item
      ));
      return;
    }
    const selectedRoom = rooms.find(r => r.id === roomId);
    if (selectedRoom) {
      setScheduleList(prev => prev.map((item, i) =>
        i === index
          ? { ...item, room_id: selectedRoom.id, room: selectedRoom.code || selectedRoom.name || '' }
          : item
      ));
    }
  };

  const weekDates = useMemo(() => buildWeekDates(currentWeekStart), [currentWeekStart]);
  const weekStartDate = weekDates[0]?.dateObj;
  const weekEndDate = weekDates[6]?.dateObj;
  const weekRangeLabel = weekDates.length > 0
    ? `${weekDates[0].fullDisplay} ➜ ${weekDates[6].fullDisplay}`
    : '';

  const filteredSchedules = schedules.filter((schedule) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        schedule.classroom?.name?.toLowerCase().includes(query) ||
        schedule.subject?.name?.toLowerCase().includes(query) ||
        getTeacherDisplayName(schedule.teacher).toLowerCase().includes(query) ||
        schedule.room?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const schedulesForView = useMemo(() => {
    if (!weekStartDate || !weekEndDate) {
      return filteredSchedules;
    }
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);
    return filteredSchedules.filter(schedule => {
      if (!schedule.date) {
        return true;
      }
      const scheduleDate = parseDateOnly(schedule.date);
      if (!scheduleDate) {
        return true;
      }
      return scheduleDate >= start && scheduleDate <= end;
    });
  }, [filteredSchedules, weekStartDate, weekEndDate]);

  // Group schedules by day of week for grid view
  const groupedSchedules = DAYS_OF_WEEK.map((day, index) => {
    const columnDateInfo = weekDates[index];
    const columnIsoDate = columnDateInfo?.isoDate;
    const daySchedules = schedulesForView.filter(schedule => {
      if (schedule.date) {
        return columnIsoDate ? schedule.date === columnIsoDate : false;
      }
      return schedule.day_of_week === index;
    });
    return {
      day,
      dayIndex: index,
      dateLabel: columnDateInfo?.display || '',
      fullDateLabel: columnDateInfo?.fullDisplay || '',
      schedules: daySchedules
    };
  });

  const shiftWeek = (offset: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset * 7);
      return getWeekStartDate(next);
    });
  };

  const shiftMonth = (offset: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return getWeekStartDate(next);
    });
  };

  const resetWeekToToday = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  const requiresRoomSelection = Boolean(selectedCampus && rooms.length > 0);
  const missingRoomSelection = requiresRoomSelection && !formData.room_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWithBackground>
      <div className="min-h-screen overflow-y-auto">
        <AdminSidebar 
        currentPage="schedule" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className={`flex-1 min-h-screen flex flex-col overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">📅 Quản lý Lịch học</h1>
            <p className="text-lg text-gray-600">Quản lý thời khóa biểu theo cơ sở và lớp học</p>
          </div>

          {/* Filters */}
          <Card className="card-transparent shadow-lg">
            <CardHeader className="card-transparent-header">
              <CardTitle className="text-xl flex items-center gap-2">
                🔍 Bộ lọc & Tìm kiếm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="campus-filter" className="text-sm font-semibold text-gray-700">🏢 Cơ sở</Label>
                  <select
                    id="campus-filter"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={selectedCampus}
                    onChange={(e) => handleCampusChange(e.target.value)}
                    disabled={loadingCampuses}
                  >
                    <option value="">Tất cả cơ sở</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} ({campus.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day-filter" className="text-sm font-semibold text-gray-700">📅 Thứ trong tuần</Label>
                  <select
                    id="day-filter"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={selectedDay || ''}
                    onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Tất cả thứ</option>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700">🔎 Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="search"
                      placeholder="Tìm theo lớp, môn, giáo viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm lịch học
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
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
                              className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                              onClick={() => handleEdit(schedule)}
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
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Email:</span>
                                    <span>{teacherEmail}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-4 text-sm border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(schedule);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Sửa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-4 text-sm border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(schedule.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Xóa
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {schedules.length === 0 && (
                          <div className="text-center text-gray-500 text-sm py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <div className="text-4xl mb-2">📅</div>
                            <div className="font-medium">Không có lịch học</div>
                            <div className="text-xs text-gray-400 mt-1">Chọn ngày khác hoặc thêm lịch học mới</div>
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
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
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

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-hidden flex flex-col p-0">
              <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg flex-shrink-0">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {editingSchedule ? '✏️ Chỉnh sửa lịch học' : '➕ Thêm lịch học mới'}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  {editingSchedule ? 'Cập nhật thông tin lịch học' : 'Thêm lịch học mới vào hệ thống'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 p-6 flex-1 overflow-y-auto">
                {/* Cột trái - Form tạo lịch học (8 phần) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Thông tin cơ bản</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="campus-select" className="text-base font-semibold text-gray-700">🏢 Cơ sở *</Label>
                        <select
                          id="campus-select"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          value={selectedCampus}
                          onChange={(e) => handleCampusChange(e.target.value)}
                          disabled={loadingCampuses}
                        >
                          <option value="">Chọn cơ sở</option>
                          {campuses.map((campus) => (
                            <option key={campus.id} value={campus.id}>
                              {campus.name} ({campus.code})
                            </option>
                          ))}
                        </select>
                        {errors.campus_id && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.campus_id}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classroom_id" className="text-base font-semibold text-gray-700">🏫 Lớp học *</Label>
                        <select
                          id="classroom_id"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          value={formData.classroom_id}
                          onChange={(e) => handleClassroomChange(e.target.value)}
                          disabled={loadingClassrooms || !selectedCampus}
                        >
                          <option value="">Chọn lớp học</option>
                          {classrooms.map((classroom) => {
                            const teacherName = teachers.find(t => t.id === classroom.teacher_id)?.name || 'Chưa gán';
                            const subjectName = subjects.find(s => s.id === classroom.subject_id)?.name || 'Chưa gán';
                            return (
                              <option key={classroom.id} value={classroom.id}>
                                {classroom.name} - {teacherName} - {subjectName}
                              </option>
                            );
                          })}
                        </select>
                        {errors.classroom_id && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.classroom_id}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject_id" className="text-base font-semibold text-gray-700">📚 Môn học *</Label>
                        <select
                          id="subject_id"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          value={formData.subject_id}
                          onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                          disabled={loadingSubjects}
                        >
                          <option value="">Chọn môn học</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                        </select>
                        {formData.classroom_id && formData.subject_id && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Môn học đã được tự động điền từ lớp học đã chọn
                          </p>
                        )}
                        {errors.subject_id && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.subject_id}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacher_id" className="text-base font-semibold text-gray-700">👨‍🏫 Giáo viên *</Label>
                        <select
                          id="teacher_id"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          value={formData.teacher_id}
                          onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                          disabled={loadingTeachers}
                        >
                          <option value="">Chọn giáo viên</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.email})
                            </option>
                          ))}
                        </select>
                        {errors.teacher_id && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.teacher_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Thời gian và phòng học */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">⏰ Thời gian và Phòng học</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time" className="text-base font-semibold text-gray-700">🕐 Thời gian bắt đầu *</Label>
                        <select
                          id="start_time"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        >
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.start_time && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.start_time}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time" className="text-base font-semibold text-gray-700">🕐 Thời gian kết thúc *</Label>
                        <select
                          id="end_time"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                          value={formData.end_time}
                          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        >
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        {errors.end_time && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.end_time}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room" className="text-base font-semibold text-gray-700">🚪 Phòng học *</Label>
                        {selectedCampus ? (
                          <>
                            <select
                              id="room"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                              value={formData.room_id || ''}
                              onChange={(e) => handleFormRoomSelect(e.target.value)}
                              disabled={loadingRooms || rooms.length === 0}
                            >
                              <option value="">Chọn phòng học</option>
                              {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                  {room.name} ({room.code}){room.capacity ? ` - ${room.capacity} chỗ` : ''}
                                </option>
                              ))}
                            </select>
                            {loadingRooms && (
                              <p className="text-xs text-gray-500">Đang tải danh sách phòng học...</p>
                            )}
                            {!loadingRooms && rooms.length === 0 && (
                              <p className="text-xs text-yellow-600">
                                ⚠️ Cơ sở này chưa có phòng học. Vui lòng thêm phòng học trong trang Quản lý Cơ sở.
                              </p>
                            )}
                            {missingRoomSelection && (
                              <p className="text-xs text-red-500">
                                Vui lòng chọn phòng học trước khi thêm vào danh sách.
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <Input
                              id="room"
                              type="text"
                              placeholder="Vui lòng chọn cơ sở trước"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100"
                              value={formData.room}
                              disabled
                            />
                            <p className="text-xs text-gray-500">Vui lòng chọn cơ sở để hiển thị danh sách phòng học</p>
                          </>
                        )}
                        {errors.room && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.room}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chọn ngày cụ thể - Hiển thị theo cột */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📆 Chọn ngày cụ thể</h3>
                    {formData.classroom_id && (() => {
                      const classroom = classrooms.find(c => c.id === formData.classroom_id);
                      if (classroom && classroom.open_date && classroom.close_date) {
                        const startDate = formatDateDisplay(classroom.open_date, { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const endDate = formatDateDisplay(classroom.close_date, { day: '2-digit', month: '2-digit', year: 'numeric' });
                        return (
                          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg mb-4">
                            <strong>📅 Khoảng thời gian lớp học:</strong> {startDate} - {endDate}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="space-y-4">
                      {/* Calendar Grid - Giống lịch bình thường */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
                        {/* Header với 7 cột cố định - Sticky */}
                        <div className="grid grid-cols-7 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 sticky top-0 z-10">
                          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                            const sortedDates = getAllSortedDates();
                            const datesForDay = sortedDates.filter(d => d.dayOfWeek === dayIndex);
                            return (
                              <div 
                                key={dayIndex} 
                                className="p-3 text-center border-r border-gray-300 last:border-r-0"
                              >
                                <div className="font-bold text-sm text-gray-700">{dayName}</div>
                                <div className="text-xs text-gray-500 mt-1">{datesForDay.length} ngày</div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Body với 7 cột - Scroll chung - Hiển thị theo hàng để căn chỉnh đúng */}
                        <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                          {(() => {
                            const sortedDates = getAllSortedDates();
                            const rows = getDatesByRows();
                            
                            // Nhóm ngày theo tháng để hiển thị label tháng
                            const datesByMonth: { [key: number]: typeof sortedDates } = {};
                            sortedDates.forEach(dateItem => {
                              const monthKey = getMonthNumber(dateItem.date);
                              if (!datesByMonth[monthKey]) {
                                datesByMonth[monthKey] = [];
                              }
                              datesByMonth[monthKey].push(dateItem);
                            });

                            // Sắp xếp các tháng theo thứ tự (từ gần đến xa)
                            const sortedMonths = Object.keys(datesByMonth)
                              .map(Number)
                              .sort((a, b) => a - b);

                            // Tạo map để tra cứu nhanh tháng của mỗi ngày
                            const dateToMonthMap = new Map<string, number>();
                            sortedDates.forEach(dateItem => {
                              dateToMonthMap.set(dateItem.date, getMonthNumber(dateItem.date));
                            });

                            // Tạo map để tra cứu tháng đầu tiên và cuối cùng trong mỗi hàng
                            const rowToMonthMap = new Map<number, number>();
                            rows.forEach((row, rowIndex) => {
                              const dateInRow = row.find(cell => cell !== null);
                              if (dateInRow) {
                                rowToMonthMap.set(rowIndex, getMonthNumber(dateInRow.date));
                              }
                            });

                            let currentMonth = -1;
                            const rowIndex = 0;

                            return (
                              <div className="space-y-1">
                                {rows.map((row, index) => {
                                  // Kiểm tra xem có cần hiển thị label tháng không
                                  const firstDateInRow = row.find(cell => cell !== null);
                                  let showMonthLabel = false;
                                  let monthName = '';
                                  let isFirstMonth = false;

                                  if (firstDateInRow) {
                                    const monthKey = getMonthNumber(firstDateInRow.date);
                                    if (monthKey !== currentMonth) {
                                      currentMonth = monthKey;
                                      showMonthLabel = true;
                                      monthName = getMonthFromDate(firstDateInRow.date);
                                      isFirstMonth = sortedMonths[0] === monthKey;
                                    }
                                  }

                                  return (
                                    <div key={index}>
                                      {/* Label tháng - Hiển thị ở hàng đầu tiên của tháng */}
                                      {showMonthLabel && (
                                        <div className={isFirstMonth ? "mb-2" : "my-4"}>
                                          {!isFirstMonth && (
                                            <>
                                              {/* Đường phân chia */}
                                              <div className="relative mb-3">
                                                <div className="absolute inset-0 flex items-center">
                                                  <div className="w-full border-t-2 border-dashed border-gray-400"></div>
                                                </div>
                                                <div className="relative flex justify-center">
                                                  <span className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-[10px] font-bold text-gray-700 rounded-lg border-2 border-gray-400 shadow-sm">
                                                    📅 {monthName}
                                                  </span>
                                                </div>
                                              </div>
                                              {/* Bỏ hẳn 1 hàng trống */}
                                              <div className="h-8"></div>
                                            </>
                                          )}
                                          {isFirstMonth && (
                                            <div className="text-center">
                                              <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 text-[10px] font-bold rounded-lg shadow-sm">
                                                📅 {monthName}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Hàng ngày - 7 cột */}
                                      <div className="grid grid-cols-7 gap-1">
                                        {row.map((dateItem, colIndex) => {
                                          if (dateItem === null) {
                                            // Cột trống - giữ khoảng trống để căn chỉnh
                                            return (
                                              <div key={colIndex} className="h-10"></div>
                                            );
                                          }

                                          const { date, display, fullDisplay = '' } = dateItem;
                                          const isSelected = selectedDates.includes(date);
                                          const dateObj = parseDateOnly(date);
                                          const isToday = dateObj && 
                                            dateObj.toDateString() === new Date().toDateString();

                                          return (
                                            <button
                                              key={`${date}-${colIndex}`}
                                              type="button"
                                              className={`h-10 rounded border-2 text-xs font-medium transition-colors duration-150 flex items-center justify-center ${
                                                isSelected
                                                  ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                                                  : isToday
                                                  ? 'bg-yellow-400 border-yellow-500 text-yellow-900 font-bold'
                                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
                                              }`}
                                              onClick={() => handleDateToggle(date)}
                                              title={fullDisplay}
                                            >
                                              <span className="text-sm font-semibold">{display}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {selectedDates.length > 0 && (
                        <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border-2 border-cyan-200">
                          <strong>✅ Đã chọn:</strong> {selectedDates.length} ngày
                          <div className="text-xs text-gray-500 mt-1">
                            💡 Xem danh sách chi tiết bên phải
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Nút thêm vào danh sách */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addToScheduleList}
                      className="flex-1 py-3 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-semibold"
                      disabled={
                        selectedDates.length === 0 ||
                        !formData.start_time ||
                        !formData.end_time ||
                        missingRoomSelection
                      }
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Thêm vào danh sách
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearScheduleList}
                      disabled={scheduleList.length === 0}
                      className="text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 py-3 font-semibold"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Xóa tất cả
                    </Button>
                  </div>
                </div>
                
                {/* Cột phải - Danh sách lịch học sẽ tạo (2 phần) */}
                <div className="lg:col-span-2 space-y-4">
                  {editingSchedule && classroomSchedules.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        📘 Lịch hiện có của lớp {editingSchedule.classroom?.name || 'N/A'}
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({classroomSchedules.length} lịch)
                        </span>
                      </h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {classroomSchedules.map((item, idx) => {
                          const roomLabel = item.room_detail
                            ? `${item.room_detail.name || 'Phòng'} (${item.room_detail.code || item.room || ''})`
                            : item.room;
                          const teacherName = getTeacherDisplayName(item.teacher) || 'N/A';
                          return (
                            <div
                              key={item.id || idx}
                              className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="font-semibold text-blue-700">
                                    {item.date
                                      ? formatDateDisplay(item.date)
                                      : DAYS_OF_WEEK[item.day_of_week]}
                                  </p>
                                  {item.date && (
                                    <p className="text-xs text-gray-500">
                                      {DAYS_OF_WEEK[item.day_of_week]}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-700">
                                  {item.start_time} - {item.end_time}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>
                                  <strong>Phòng:</strong> {roomLabel || 'Chưa có'}
                                </p>
                                <p>
                                  <strong>Giáo viên:</strong> {teacherName}
                                </p>
                                <p>
                                  <strong>Môn:</strong> {item.subject?.name || 'N/A'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200 shadow-sm sticky top-0">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
                      <span>📋 Lịch đã chọn</span>
                      <span className="text-sm font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {scheduleList.length}
                      </span>
                    </h3>

                    {scheduleList.length > 0 ? (
                      <div className="space-y-2 max-h-[calc(95vh-250px)] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#fbbf24 #fef3c7' }}>
                        {scheduleList.map((schedule, index) => {
                          const draftRoom = rooms.find(room => room.id === schedule.room_id);
                          const draftRoomLabel = draftRoom
                            ? `${draftRoom.name || 'Phòng'} (${draftRoom.code})`
                            : schedule.room;
                          const dateObj = schedule.date ? parseDateOnly(schedule.date) : null;
                          const dateDisplay = schedule.date 
                            ? formatDateDisplay(schedule.date, { day: '2-digit', month: '2-digit' })
                            : DAYS_OF_WEEK[schedule.day_of_week];
                          
                          return (
                            <div
                              key={index}
                              className="p-3 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all shadow-sm"
                            >
                              {/* Header với số thứ tự và nút xóa */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-900">
                                      {dateDisplay}
                                  </div>
                                  {schedule.date && (
                                      <div className="text-xs text-gray-500">
                                      {DAYS_OF_WEEK[schedule.day_of_week]}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                  variant="ghost"
                                size="sm"
                                onClick={() => removeFromScheduleList(index)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                  <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            
                              {/* Thông tin thời gian và phòng */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="font-semibold text-gray-700">
                                    {schedule.start_time} - {schedule.end_time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <MapPin className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-600">
                                    {draftRoomLabel || 'Chưa chọn phòng'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Dropdown để chỉnh sửa (collapsed by default, có thể expand) */}
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                                  Chỉnh sửa
                                </summary>
                                <div className="mt-2 space-y-2 pt-2 border-t border-gray-200">
                              <div>
                                    <Label className="text-xs font-semibold text-gray-700 mb-1 block">Thời gian bắt đầu</Label>
                                <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                                  value={schedule.start_time}
                                  onChange={(e) => updateScheduleInList(index, 'start_time', e.target.value)}
                                >
                                  {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                    <Label className="text-xs font-semibold text-gray-700 mb-1 block">Thời gian kết thúc</Label>
                                <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                                  value={schedule.end_time}
                                  onChange={(e) => updateScheduleInList(index, 'end_time', e.target.value)}
                                >
                                  {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                              </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-gray-700 mb-1 block">Phòng học</Label>
                              {selectedCampus && rooms.length > 0 ? (
                                <select
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                                  value={schedule.room_id || ''}
                                  onChange={(e) => handleScheduleRoomSelect(index, e.target.value)}
                                >
                                        <option value="">Chọn phòng</option>
                                  {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                            {room.code}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                        className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                                  value={schedule.room}
                                  onChange={(e) => updateScheduleInList(index, 'room', e.target.value)}
                                        placeholder="Mã phòng"
                                />
                              )}
                            </div>
                              </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Chưa có lịch</p>
                        <p className="text-[10px] mt-1">Chọn ngày bên trái</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Nút action ở dưới cùng */}
              <div className="flex gap-4 p-6 bg-gray-50 border-t">
                <Button 
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg" 
                  onClick={editingSchedule ? handleUpdate : handleCreate} 
                  disabled={isSubmitting || (!editingSchedule && scheduleList.length === 0)}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isSubmitting 
                    ? 'Đang xử lý...' 
                    : editingSchedule 
                      ? 'Cập nhật' 
                      : `Tạo ${scheduleList.length} lịch học`
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  disabled={isSubmitting}
                  className="py-3 px-8 border-2 border-gray-300 hover:border-gray-400 font-semibold"
                >
                  Hủy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
    </PageWithBackground>
  );
}
