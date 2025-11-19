'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { AttendanceSheet } from '@/components/AttendanceSheet';
import { ClassConfirmation } from '@/components/ClassConfirmation';
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
  const [showClassConfirmation, setShowClassConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

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
            
            if (attendanceResponse?.data && attendanceResponse.data.length > 0) {
              const attendance = attendanceResponse.data[0];
              if (attendance.records) {
                Object.values(attendance.records).forEach((record: any) => {
                  if (record.status === 'present') {
                    attendanceStats.presentCount++;
                  } else if (record.status === 'late') {
                    attendanceStats.lateCount++;
                  } else if (record.status === 'absent') {
                    // Check if it's excused based on notes
                    const notes = (record.notes || '').toLowerCase();
                    if (notes.includes('phép') || notes.includes('excused') || notes.includes('có phép')) {
                      attendanceStats.absentWithExcuse++;
                    } else {
                      attendanceStats.absentWithoutExcuse++;
                    }
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
      const classroom = await classroomsHybridApi.get(classId);
      if (classroom.students && Array.isArray(classroom.students)) {
        const studentList: Student[] = classroom.students.map((s: any) => ({
          id: s.id || s.student_id,
          name: s.name || s.full_name || 'N/A',
          studentCode: s.student_code || s.code || '',
          className: classroom.name || '',
          avatar: s.avatar
        }));
        
        // Use functional update to check and set atomically
        setStudents(prev => {
          // Check if already loaded to avoid overwriting
          if (prev[classId]) {
            return prev;
          }
          return { ...prev, [classId]: studentList };
        });
        return studentList;
      }
    } catch (err) {
      console.error('Error loading students:', err);
    }
    
    return [];
  }, []);

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

  const handleStartAttendance = async (classItem: Class) => {
    setSelectedClass(classItem);
    // Load students - function will check if already loaded
    await loadStudentsForClass(classItem.id);
    setShowAttendanceSheet(true);
  };

  const handleConfirmClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowClassConfirmation(true);
  };

  const handleSaveAttendance = async (attendance: any[]) => {
    if (!selectedClass) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const records: Record<string, any> = {};
      
      attendance.forEach((record: any) => {
        records[record.studentId] = {
          status: record.status,
          notes: record.notes || '',
          timestamp: new Date().toISOString()
        };
      });
      
      // Check if attendance already exists
      const existingAttendance = await attendancesAPI.getAttendances({
        classroom_id: selectedClass.id,
        date: today
      });
      
      if (existingAttendance?.data && existingAttendance.data.length > 0) {
        // Update existing attendance
        await attendancesAPI.updateAttendance(existingAttendance.data[0].id, {
          records,
          confirmed_at: new Date().toISOString()
        });
      } else {
        // Create new attendance
        await attendancesAPI.createAttendance({
          classroom_id: selectedClass.id,
          date: today,
          records,
          confirmed_at: new Date().toISOString()
        });
      }
      
      // Reload classrooms to update statistics
      await loadClassrooms();
      
    setShowAttendanceSheet(false);
    setSelectedClass(null);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Không thể lưu điểm danh');
    }
  };

  const handleConfirmClassData = async (confirmation: any) => {
    console.log('Confirming class:', confirmation);
    // Here you would save to backend
    setShowClassConfirmation(false);
    setSelectedClass(null);
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
                    <Calendar className="w-4 h-4" />
                    <span>{classItem.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{classItem.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{classItem.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{classItem.studentCount} học sinh</span>
                  </div>
                </div>

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
                    <span className="text-sm font-medium text-slate-700">Điểm danh:</span>
                    <Badge className={cn("text-xs font-medium", getAttendanceStatusColor(classItem.attendanceStatus))}>
                      {getAttendanceStatusLabel(classItem.attendanceStatus)}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    {classItem.attendanceStatus === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartAttendance(classItem)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Điểm danh
                      </Button>
                    )}
                    
                    {classItem.attendanceStatus === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartAttendance(classItem)}
                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem điểm danh
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirmClass(classItem)}
                      className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Xác nhận
                    </Button>
                  </div>
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

      {/* Class Confirmation Modal */}
      {showClassConfirmation && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ClassConfirmation
              classInfo={{
                id: selectedClass.id,
                name: selectedClass.name,
                subject: selectedClass.subject,
                teacher: selectedClass.teacher,
                room: selectedClass.room,
                time: selectedClass.time,
                date: selectedClass.date,
                studentCount: selectedClass.studentCount
              }}
              onConfirm={handleConfirmClassData}
              onCancel={() => {
                setShowClassConfirmation(false);
                setSelectedClass(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
