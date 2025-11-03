import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Save,
  Download,
  Search,
  Filter,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';
import { cn } from './ui/utils';

interface Student {
  id: string;
  name: string;
  studentCode: string;
  className: string;
  avatar?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  timestamp?: string;
}

interface AttendanceSheetProps {
  classId: string;
  className: string;
  subject: string;
  date: string;
  students: Student[];
  onSave: (attendance: AttendanceRecord[]) => void;
  onCancel: () => void;
}

export function AttendanceSheet({ 
  classId, 
  className, 
  subject, 
  date, 
  students, 
  onSave, 
  onCancel 
}: AttendanceSheetProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize attendance records
  useEffect(() => {
    const initialAttendance: Record<string, AttendanceRecord> = {};
    students.forEach(student => {
      initialAttendance[student.id] = {
        studentId: student.id,
        status: 'present', // Default to present
        notes: '',
        timestamp: new Date().toISOString()
      };
    });
    setAttendance(initialAttendance);
  }, [students]);

  const updateAttendance = (studentId: string, status: AttendanceRecord['status'], notes?: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        notes: notes || prev[studentId]?.notes || '',
        timestamp: new Date().toISOString()
      }
    }));
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const variants = {
      present: 'bg-green-100 text-green-800 hover:bg-green-100',
      absent: 'bg-red-100 text-red-800 hover:bg-red-100',
      late: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      excused: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    };

    const labels = {
      present: 'Có mặt',
      absent: 'Vắng mặt',
      late: 'Đi muộn',
      excused: 'Có phép'
    };

    return (
      <Badge className={cn("text-xs font-medium", variants[status])}>
        {labels[status]}
      </Badge>
    );
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || attendance[student.id]?.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const attendanceRecords = Object.values(attendance);
      await onSave(attendanceRecords);
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStats = () => {
    const records = Object.values(attendance);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const total = records.length;

    return { present, absent, late, excused, total };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-blue-600" />
                Điểm danh lớp học
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span><strong>Lớp:</strong> {className}</span>
                  <span><strong>Môn:</strong> {subject}</span>
                  <span><strong>Ngày:</strong> {date}</span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-slate-600">Tổng số học sinh</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.present}</div>
                <div className="text-sm text-green-600">Có mặt</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-800">{stats.absent}</div>
                <div className="text-sm text-red-600">Vắng mặt</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-800">{stats.late}</div>
                <div className="text-sm text-yellow-600">Đi muộn</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-800">{stats.excused}</div>
                <div className="text-sm text-blue-600">Có phép</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-slate-700 mb-2 block">
                Tìm kiếm học sinh
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="filter" className="text-sm font-medium text-slate-700 mb-2 block">
                Lọc theo trạng thái
              </Label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select
                  id="filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng mặt</option>
                  <option value="late">Đi muộn</option>
                  <option value="excused">Có phép</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Danh sách học sinh ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const attendanceRecord = attendance[student.id];
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{student.name}</div>
                      <div className="text-sm text-slate-500">Mã: {student.studentCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(attendanceRecord?.status || 'present')}
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={attendanceRecord?.status === 'present' ? 'default' : 'outline'}
                        onClick={() => updateAttendance(student.id, 'present')}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={attendanceRecord?.status === 'absent' ? 'default' : 'outline'}
                        onClick={() => updateAttendance(student.id, 'absent')}
                        className="h-8 w-8 p-0"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={attendanceRecord?.status === 'late' ? 'default' : 'outline'}
                        onClick={() => updateAttendance(student.id, 'late')}
                        className="h-8 w-8 p-0"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={attendanceRecord?.status === 'excused' ? 'default' : 'outline'}
                        onClick={() => updateAttendance(student.id, 'excused')}
                        className="h-8 w-8 p-0"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}
          </Button>
        </div>
      </div>
    </div>
  );
}



