'use client';

import { useState, useEffect } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
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
  MapPin
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  date: string;
  studentCount: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  attendanceStatus: 'pending' | 'completed';
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
  const { user, loading } = useTeacherAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  // const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [showClassConfirmation, setShowClassConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

  // Mock data
  useEffect(() => {
    const mockClasses: Class[] = [
      {
        id: '1',
        name: '10A1',
        subject: 'Toán học',
        teacher: 'Nguyễn Văn Giáo',
        room: 'A101',
        time: '07:00 - 08:30',
        date: '2024-01-15',
        studentCount: 35,
        status: 'scheduled',
        attendanceStatus: 'pending'
      },
      {
        id: '2',
        name: '10A2',
        subject: 'Vật lý',
        teacher: 'Nguyễn Văn Giáo',
        room: 'A102',
        time: '08:45 - 10:15',
        date: '2024-01-15',
        studentCount: 32,
        status: 'in-progress',
        attendanceStatus: 'pending'
      },
      {
        id: '3',
        name: '11B1',
        subject: 'Hóa học',
        teacher: 'Nguyễn Văn Giáo',
        room: 'B201',
        time: '10:30 - 12:00',
        date: '2024-01-15',
        studentCount: 28,
        status: 'completed',
        attendanceStatus: 'completed'
      }
    ];
    setClasses(mockClasses);

    const mockStudents: Student[] = [
      { id: '1', name: 'Nguyễn Văn An', studentCode: 'HS001', className: '10A1' },
      { id: '2', name: 'Trần Thị Bình', studentCode: 'HS002', className: '10A1' },
      { id: '3', name: 'Lê Văn Cường', studentCode: 'HS003', className: '10A1' },
      { id: '4', name: 'Phạm Thị Dung', studentCode: 'HS004', className: '10A1' },
      { id: '5', name: 'Hoàng Văn Em', studentCode: 'HS005', className: '10A1' }
    ];

    const mockAttendanceRecords: AttendanceRecord[] = [
      {
        classId: '3',
        date: '2024-01-15',
        students: mockStudents,
        records: {
          '1': { status: 'present', timestamp: '2024-01-15T10:30:00Z' },
          '2': { status: 'present', timestamp: '2024-01-15T10:30:00Z' },
          '3': { status: 'late', notes: 'Đi muộn 5 phút', timestamp: '2024-01-15T10:35:00Z' },
          '4': { status: 'absent', notes: 'Có phép', timestamp: '2024-01-15T10:30:00Z' },
          '5': { status: 'present', timestamp: '2024-01-15T10:30:00Z' }
        },
        confirmedAt: '2024-01-15T12:00:00Z'
      }
    ];
    // setAttendanceRecords(mockAttendanceRecords);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
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

  const handleStartAttendance = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowAttendanceSheet(true);
  };

  const handleConfirmClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowClassConfirmation(true);
  };

  const handleSaveAttendance = async (attendance: any[]) => {
    console.log('Saving attendance:', attendance);
    // Here you would save to backend
    setShowAttendanceSheet(false);
    setSelectedClass(null);
  };

  const handleConfirmClassData = async (confirmation: any) => {
    console.log('Confirming class:', confirmation);
    // Here you would save to backend
    setShowClassConfirmation(false);
    setSelectedClass(null);
  };

  const mockStudents: Student[] = [
    { id: '1', name: 'Nguyễn Văn An', studentCode: 'HS001', className: '10A1' },
    { id: '2', name: 'Trần Thị Bình', studentCode: 'HS002', className: '10A1' },
    { id: '3', name: 'Lê Văn Cường', studentCode: 'HS003', className: '10A1' },
    { id: '4', name: 'Phạm Thị Dung', studentCode: 'HS004', className: '10A1' },
    { id: '5', name: 'Hoàng Văn Em', studentCode: 'HS005', className: '10A1' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                Quản lý điểm danh
              </h1>
              <p className="text-slate-900 text-lg font-bold">Điểm danh học sinh và xác nhận lớp dạy</p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lớp mới
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-800">{classItem.name}</CardTitle>
                    <CardDescription className="text-slate-600">{classItem.subject}</CardDescription>
                  </div>
                  <Badge className={cn("text-xs font-medium", getStatusColor(classItem.status))}>
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
                        className="flex-1 bg-blue-700 hover:bg-blue-800 font-bold"
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
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem điểm danh
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirmClass(classItem)}
                      className="flex-1"
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
              <p className="text-slate-500 mb-6">Chưa có lớp học nào phù hợp với bộ lọc của bạn.</p>
              <Button className="bg-blue-700 hover:bg-blue-800 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lớp học mới
              </Button>
            </CardContent>
          </Card>
        )}
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
              students={mockStudents}
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
