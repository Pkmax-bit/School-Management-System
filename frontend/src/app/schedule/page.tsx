"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Search, AlertCircle, Loader2, Building2, Clock, MapPin, User, BookOpen, CheckCircle } from 'lucide-react';
import schedulesApi, { Schedule, ScheduleCreate } from '../../lib/schedules-api';
import campusesApi from '../../lib/campuses-api';
import classroomsHybridApi from '../../lib/classrooms-api-hybrid';

const DAYS_OF_WEEK = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'
];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

export default function SchedulePage() {
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
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
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
    room: ''
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [scheduleList, setScheduleList] = useState<Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string;
    date?: string;
  }>>([]);
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/subjects?limit=1000`, {
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        }
      });
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        }
      });
      if (!res.ok) throw new Error('Failed to fetch teachers');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      const mapped = list.map((t: any) => ({ id: t.id, name: t.users?.full_name || t.name, email: t.users?.email }));
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
      
      // For now, use mock data to test the display
      const mockData = [
        {
          "id": "4714d3bc-72c3-4795-898b-61b0f901651f",
          "classroom_id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
          "subject_id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
          "teacher_id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
          "day_of_week": 0,
          "start_time": "08:00:00",
          "end_time": "09:00:00",
          "room": "1",
          "created_at": "2025-10-28T17:45:54.367209+00:00",
          "updated_at": "2025-10-28T17:45:54.367209+00:00",
          "classroom": {
            "id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
            "name": "hehe",
            "code": "Class0004",
            "campus_id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590"
          },
          "subject": {
            "id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
            "name": "Test Subject1",
            "code": "TEST001"
          },
          "teacher": {
            "id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
            "name": "Teacher User",
            "email": "teacher@school.com"
          },
          "campus": {
            "id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590",
            "name": "Cở sở 1 - q6",
            "code": "CS001"
          }
        },
        {
          "id": "685cd226-1458-46f0-8b14-d7aceccc7d1f",
          "classroom_id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
          "subject_id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
          "teacher_id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
          "day_of_week": 1,
          "start_time": "08:30:00",
          "end_time": "09:30:00",
          "room": "A101",
          "created_at": "2025-10-28T17:51:19.602182+00:00",
          "updated_at": "2025-10-28T17:51:19.602182+00:00",
          "classroom": {
            "id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
            "name": "hehe",
            "code": "Class0004",
            "campus_id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590"
          },
          "subject": {
            "id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
            "name": "Test Subject1",
            "code": "TEST001"
          },
          "teacher": {
            "id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
            "name": "Teacher User",
            "email": "teacher@school.com"
          },
          "campus": {
            "id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590",
            "name": "Cở sở 1 - q6",
            "code": "CS001"
          }
        },
        {
          "id": "71d4b2d5-bf44-4097-9532-4736d24eef1a",
          "classroom_id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
          "subject_id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
          "teacher_id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
          "day_of_week": 1,
          "start_time": "08:00:00",
          "end_time": "09:00:00",
          "room": "A101",
          "created_at": "2025-10-28T17:54:34.765017+00:00",
          "updated_at": "2025-10-28T17:54:34.765017+00:00",
          "classroom": {
            "id": "9e43a26f-c352-42a9-a480-5a7a308ca7c9",
            "name": "hehe",
            "code": "Class0004",
            "campus_id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590"
          },
          "subject": {
            "id": "dc4aa965-db18-4319-9c1d-fb93763849ea",
            "name": "Test Subject1",
            "code": "TEST001"
          },
          "teacher": {
            "id": "0700abd0-79c4-4ea9-b30a-5f039b346e82",
            "name": "Teacher User",
            "email": "teacher@school.com"
          },
          "campus": {
            "id": "2b06f738-d5fd-47a8-a3fb-46c71bee2590",
            "name": "Cở sở 1 - q6",
            "code": "CS001"
          }
        }
      ];
      
      setSchedules(mockData);
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

  const checkRoomConflict = async (room: string, dayOfWeek: number, startTime: string, endTime: string, campusId: string, excludeId?: string) => {
    try {
      // Lấy danh sách lịch học cùng phòng, cùng cơ sở, cùng ngày
      const existingSchedules = await schedulesApi.list({
        campus_id: campusId,
        day_of_week: dayOfWeek
      });
      
      // Lọc các lịch học cùng phòng (trừ lịch hiện tại nếu đang edit)
      const conflictingSchedules = existingSchedules.filter((schedule: Schedule) => 
        schedule.room === room && 
        (!excludeId || schedule.id !== excludeId)
      );
      
      // Kiểm tra xung đột thời gian
      const newStart = new Date(`2000-01-01T${startTime}`);
      const newEnd = new Date(`2000-01-01T${endTime}`);
      
      for (const schedule of conflictingSchedules) {
        const existingStart = new Date(`2000-01-01T${schedule.start_time}`);
        const existingEnd = new Date(`2000-01-01T${schedule.end_time}`);
        
        if (newStart < existingEnd && newEnd > existingStart) {
          return {
            hasConflict: true,
            conflictSchedule: schedule,
            message: `Phòng ${room} đã được sử dụng trong khung giờ ${schedule.start_time} - ${schedule.end_time}`
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
    if (!formData.room || !formData.room.trim()) newErrors.room = 'Phòng học là bắt buộc';
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
    const hasMissingRoom = scheduleList.some(item => !item.room || !item.room.trim());
    if (hasMissingRoom) {
      alert('Vui lòng nhập phòng học cho tất cả lịch trước khi tạo');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrors({});
      
      // Tạo từng lịch học
      for (const scheduleItem of scheduleList) {
        const scheduleData = {
          ...formData,
          day_of_week: scheduleItem.day_of_week,
          start_time: scheduleItem.start_time,
          end_time: scheduleItem.end_time,
          room: scheduleItem.room
        };

        // Kiểm tra xung đột phòng học
        if (scheduleItem.room && selectedCampus) {
          const conflictCheck = await checkRoomConflict(
            scheduleItem.room,
            scheduleItem.day_of_week,
            scheduleItem.start_time,
            scheduleItem.end_time,
            selectedCampus
          );
          
          if (conflictCheck.hasConflict) {
            alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${conflictCheck.message}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác trong tuần`);
            return;
          }
        }

        await schedulesApi.create(scheduleData);
      }
      
      await loadSchedules();
      setIsDialogOpen(false);
      resetForm();
      alert(`Tạo thành công ${scheduleList.length} lịch học!`);
    } catch (error: any) {
      console.error('Error creating schedules:', error);
      const errorMessage = error?.message || 'Có lỗi khi tạo lịch học';
      
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
    
    // Kiểm tra xung đột phòng học trước khi cập nhật
    if (formData.room && selectedCampus) {
      const conflictCheck = await checkRoomConflict(
        formData.room,
        formData.day_of_week,
        formData.start_time,
        formData.end_time,
        selectedCampus,
        editingSchedule.id
      );
      
      if (conflictCheck.hasConflict) {
        alert(`❌ XUNG ĐỘT PHÒNG HỌC\n\n${conflictCheck.message}\n\n💡 Gợi ý:\n• Chọn phòng học khác\n• Thay đổi khung giờ\n• Chọn ngày khác trong tuần`);
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      await schedulesApi.update(editingSchedule.id, formData);
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
      await schedulesApi.delete(id);
      await loadSchedules();
      alert('Xóa lịch học thành công!');
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      alert(error?.message || 'Có lỗi khi xóa lịch học');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      classroom_id: schedule.classroom_id,
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || ''
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCampusChange = (campusId: string) => {
    setSelectedCampus(campusId);
    loadClassrooms(campusId);
  };

  const handleClassroomChange = (classroomId: string) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (classroom) {
      setFormData(prev => ({
        ...prev,
        classroom_id: classroomId,
        teacher_id: classroom.teacher_id || '',
        subject_id: classroom.subject_id || '', // Auto-fill subject from classroom
      }));

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
      room: ''
    });
    setSelectedDates([]);
    setScheduleList([]);
    setErrors({});
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

  const generateDateRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const getClassroomDateRange = () => {
    // Nếu đã chọn lớp học và có ngày mở/đóng
    if (formData.classroom_id) {
      const classroom = classrooms.find(c => c.id === formData.classroom_id);
      if (classroom && classroom.open_date && classroom.close_date) {
        const startDate = new Date(classroom.open_date);
        const endDate = new Date(classroom.close_date);
        const dates = [];
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push({
            date: currentDate.toISOString().split('T')[0],
            dayOfWeek: currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1, // Convert to 0=Monday, 6=Sunday
            display: currentDate.toLocaleDateString('vi-VN', { 
              weekday: 'short', 
              day: '2-digit', 
              month: '2-digit' 
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
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay() === 0 ? 6 : date.getDay() - 1, // Convert to 0=Monday, 6=Sunday
        display: date.toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        })
      });
    }
    return dates;
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
      date?: string;
    }> = [];
    
    // Thêm từ ngày cụ thể
    if (selectedDates.length > 0) {
      const dateSchedules = selectedDates.map(date => {
        const dateObj = new Date(date);
        return {
          day_of_week: dateObj.getDay(),
          start_time: formData.start_time,
          end_time: formData.end_time,
          room: formData.room || '',
          date: date
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

  const filteredSchedules = schedules.filter((schedule) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        schedule.classroom?.name?.toLowerCase().includes(query) ||
        schedule.subject?.name?.toLowerCase().includes(query) ||
        schedule.teacher?.name?.toLowerCase().includes(query) ||
        schedule.room?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group schedules by day of week for grid view
  const groupedSchedules = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: filteredSchedules.filter(s => s.day_of_week === index)
  }));

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminSidebar 
        currentPage="schedule" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 lg:ml-64">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">📅 Quản lý Lịch học</h1>
            <p className="text-lg text-gray-600">Quản lý thời khóa biểu theo cơ sở và lớp học</p>
          </div>

          {/* Filters */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl flex items-center gap-2">
                🔍 Bộ lọc & Tìm kiếm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-2xl flex items-center gap-2">
                📚 Lịch học theo tuần
                <span className="text-sm font-normal text-gray-600">
                  ({filteredSchedules.length} lịch học)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingSchedules ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
                    <p className="text-lg text-gray-600">Đang tải lịch học...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                  {groupedSchedules.map(({ day, dayIndex, schedules }) => (
                    <div key={dayIndex} className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-200 shadow-md">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">{day}</h3>
                        <div className="text-2xl font-bold text-blue-700 mb-1">{schedules.length}</div>
                        <p className="text-sm text-blue-600">lịch học</p>
                      </div>
                      <div className="space-y-3 min-h-[300px]">
                        {schedules.map((schedule) => (
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
                              {schedule.room && (
                                <div className="text-sm text-gray-700 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <span className="font-semibold">Phòng: {schedule.room}</span>
                                </div>
                              )}
                            </div>

                            {/* Teacher Information */}
                            <div className="mb-4">
                              <div className="text-sm text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="font-bold text-gray-900">{schedule.teacher?.name || 'N/A'}</span>
                                {schedule.teacher?.email && (
                                  <span className="text-gray-500 ml-1 text-xs">({schedule.teacher.email})</span>
                                )}
                              </div>
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
                        ))}
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
          {schedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tổng quan lịch học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-800">{schedules.length}</div>
                    <div className="text-sm font-semibold text-blue-700">Tổng số lịch học</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-800">
                      {new Set(schedules.map(s => s.classroom?.name).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-green-700">Lớp học</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="text-3xl font-bold text-purple-800">
                      {new Set(schedules.map(s => s.subject?.name).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-purple-700">Môn học</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="text-3xl font-bold text-orange-800">
                      {new Set(schedules.map(s => s.teacher?.name).filter(Boolean)).size}
                    </div>
                    <div className="text-sm font-semibold text-orange-700">Giáo viên</div>
                  </div>
                </div>
                
                {/* Detailed breakdown by day */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Phân bố theo ngày trong tuần</h4>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const daySchedules = schedules.filter(s => s.day_of_week === index);
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
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {editingSchedule ? '✏️ Chỉnh sửa lịch học' : '➕ Thêm lịch học mới'}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  {editingSchedule ? 'Cập nhật thông tin lịch học' : 'Thêm lịch học mới vào hệ thống'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                {/* Cột trái - Form tạo lịch học */}
                <div className="space-y-6">
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
                  
                  
                  {/* Chọn ngày cụ thể */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📆 Chọn ngày cụ thể</h3>
                    {formData.classroom_id && (() => {
                      const classroom = classrooms.find(c => c.id === formData.classroom_id);
                      if (classroom && classroom.open_date && classroom.close_date) {
                        const startDate = new Date(classroom.open_date).toLocaleDateString('vi-VN');
                        const endDate = new Date(classroom.close_date).toLocaleDateString('vi-VN');
                        return (
                          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg mb-4">
                            <strong>📅 Khoảng thời gian lớp học:</strong> {startDate} - {endDate}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {getClassroomDateRange().map(({ date, dayOfWeek, display }) => (
                          <button
                            key={date}
                            type="button"
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              selectedDates.includes(date)
                                ? 'bg-cyan-100 border-cyan-500 text-cyan-700'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => handleDateToggle(date)}
                          >
                            <div className="text-xs text-gray-500 mb-1">
                              {DAYS_OF_WEEK[dayOfWeek]}
                            </div>
                            <div className="font-semibold">
                              {display}
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedDates.length > 0 && (
                        <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                          <strong>Đã chọn:</strong> {selectedDates.length} ngày
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
                      disabled={selectedDates.length === 0 || !formData.start_time || !formData.end_time || !formData.room || !formData.room.trim()}
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
                
                {/* Cột phải - Danh sách lịch học sẽ tạo */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      📋 Danh sách lịch học sẽ tạo 
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({scheduleList.length} lịch)
                      </span>
                    </h3>

                    {scheduleList.length > 0 ? (
                      <div className="space-y-3">
                        {scheduleList.map((schedule, index) => (
                          <div
                            key={index}
                            className="p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-lg font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-xl">
                                    {schedule.date 
                                      ? new Date(schedule.date).toLocaleDateString('vi-VN', { 
                                          weekday: 'long', 
                                          day: '2-digit', 
                                          month: '2-digit',
                                          year: 'numeric'
                                        })
                                      : DAYS_OF_WEEK[schedule.day_of_week]
                                    }
                                  </div>
                                  {schedule.date && (
                                    <div className="text-sm text-gray-500">
                                      {DAYS_OF_WEEK[schedule.day_of_week]}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromScheduleList(index)}
                                className="text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-2">Thời gian bắt đầu</Label>
                                <select
                                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
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
                                <Label className="text-sm font-semibold text-gray-700 mb-2">Thời gian kết thúc</Label>
                                <select
                                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
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
                            </div>
                            
                            <div className="mt-4">
                              <Label className="text-sm font-semibold text-gray-700 mb-2">Phòng học</Label>
                              <Input
                                className="text-sm px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                                value={schedule.room}
                                onChange={(e) => updateScheduleInList(index, 'room', e.target.value)}
                                placeholder="Tên phòng học"
                              />
                            </div>
                            
                            <div className="mt-3 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                              <strong>Thời gian:</strong> {schedule.start_time} - {schedule.end_time} | 
                              <strong> Phòng:</strong> {schedule.room || 'Chưa chọn'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">Chưa có lịch học nào</p>
                        <p className="text-sm">Hãy chọn ngày bên trái và nhấn &quot;Thêm vào danh sách&quot;</p>
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
  );
}
