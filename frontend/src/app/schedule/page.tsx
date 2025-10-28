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
import { Calendar, Plus, Edit, Trash2, Search, AlertCircle, Loader2, Building2, Clock, MapPin, User, BookOpen } from 'lucide-react';
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
      const data = await classroomsHybridApi.list();
      const list = Array.isArray(data) ? data : [];
      // Filter by campus if provided
      const filtered = campusId ? list.filter(c => c.campus_id === campusId) : list;
      setClassrooms(filtered);
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
      const params: any = {};
      if (selectedCampus) params.campus_id = selectedCampus;
      if (selectedDay !== null) params.day_of_week = selectedDay;
      
      const data = await schedulesApi.list(params);
      const list = Array.isArray(data) ? data : [];
      setSchedules(list);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.classroom_id) newErrors.classroom_id = 'Lớp học là bắt buộc';
    if (!formData.subject_id) newErrors.subject_id = 'Môn học là bắt buộc';
    if (!formData.teacher_id) newErrors.teacher_id = 'Giáo viên là bắt buộc';
    if (formData.start_time >= formData.end_time) {
      newErrors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setErrors({});
      await schedulesApi.create(formData);
      await loadSchedules();
      setIsDialogOpen(false);
      resetForm();
      alert('Tạo lịch học thành công!');
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      alert(error?.message || 'Có lỗi khi tạo lịch học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule || !validateForm()) return;
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
      alert(error?.message || 'Có lỗi khi cập nhật lịch học');
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
        subject_id: '', // Reset subject, let user choose
      }));
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
    setErrors({});
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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        currentPage="schedule" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 lg:ml-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-gray-900">Quản lý Lịch học</h1>
            <p className="text-gray-600">Quản lý thời khóa biểu theo cơ sở và lớp học</p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campus-filter">Cơ sở</Label>
                  <select
                    id="campus-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <Label htmlFor="day-filter">Thứ trong tuần</Label>
                  <select
                    id="day-filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <Label htmlFor="search">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Tìm theo lớp, môn, giáo viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm lịch học
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch học theo tuần</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải lịch học...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {groupedSchedules.map(({ day, dayIndex, schedules }) => (
                    <div key={dayIndex} className="space-y-2">
                      <div className="text-center font-semibold text-gray-700 bg-gray-100 p-2 rounded-lg">
                        {day}
                      </div>
                      <div className="space-y-2 min-h-[200px]">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors cursor-pointer group"
                            onClick={() => handleEdit(schedule)}
                          >
                            <div className="text-sm font-medium text-blue-900">
                              {schedule.classroom?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              {schedule.subject?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                            {schedule.room && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {schedule.room}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {schedule.teacher?.name || 'N/A'}
                            </div>
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(schedule);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(schedule.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {schedules.length === 0 && (
                          <div className="text-center text-gray-400 text-sm py-8">
                            Không có lịch học
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Chỉnh sửa lịch học' : 'Thêm lịch học mới'}
                </DialogTitle>
                <DialogDescription>
                  {editingSchedule ? 'Cập nhật thông tin lịch học' : 'Thêm lịch học mới vào hệ thống'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="campus-select">Cơ sở *</Label>
                  <select
                    id="campus-select"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classroom_id">Lớp học *</Label>
                    <select
                      id="classroom_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.classroom_id}
                      onChange={(e) => handleClassroomChange(e.target.value)}
                      disabled={loadingClassrooms || !selectedCampus}
                    >
                      <option value="">Chọn lớp học</option>
                      {classrooms.map((classroom) => {
                        const teacherName = teachers.find(t => t.id === classroom.teacher_id)?.name || 'Chưa gán';
                        return (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.name} - {teacherName}
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
                    <Label htmlFor="subject_id">Môn học *</Label>
                    <select
                      id="subject_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    {errors.subject_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.subject_id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Giáo viên *</Label>
                  <select
                    id="teacher_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Thứ trong tuần *</Label>
                  <select
                    id="day_of_week"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                  >
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Thời gian bắt đầu *</Label>
                    <select
                      id="start_time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    >
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Thời gian kết thúc *</Label>
                    <select
                      id="end_time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Phòng học</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Tên phòng học (tùy chọn)"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={editingSchedule ? handleUpdate : handleCreate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Đang xử lý...' : (editingSchedule ? 'Cập nhật' : 'Thêm mới')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
