import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin,
  Calendar,
  AlertTriangle,
  Save,
  Send,
  Edit,
  Eye,
  CheckSquare
} from 'lucide-react';
import { cn } from './ui/utils';

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  date: string;
  studentCount: number;
  description?: string;
}

interface ClassConfirmationProps {
  classInfo: ClassInfo;
  onConfirm: (confirmation: ClassConfirmationData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface ClassConfirmationData {
  classId: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  notes: string;
  actualStartTime?: string;
  actualEndTime?: string;
  attendanceCount: number;
  materialsUsed: string[];
  homeworkAssigned: string;
  nextClassDate?: string;
  teacherSignature: string;
  confirmedAt: string;
}

export function ClassConfirmation({ 
  classInfo, 
  onConfirm, 
  onCancel, 
  isEditing = false 
}: ClassConfirmationProps) {
  const [confirmation, setConfirmation] = useState<ClassConfirmationData>({
    classId: classInfo.id,
    status: 'confirmed',
    notes: '',
    actualStartTime: classInfo.time.split(' - ')[0],
    actualEndTime: classInfo.time.split(' - ')[1],
    attendanceCount: classInfo.studentCount,
    materialsUsed: [],
    homeworkAssigned: '',
    teacherSignature: classInfo.teacher,
    confirmedAt: new Date().toISOString()
  });

  const [newMaterial, setNewMaterial] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setConfirmation(prev => ({
        ...prev,
        materialsUsed: [...prev.materialsUsed, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setConfirmation(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm(confirmation);
    } catch (error) {
      console.error('Error confirming class:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'rescheduled':
        return 'Đã dời lịch';
      default:
        return 'Chưa xác nhận';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-green-600" />
                Xác nhận lớp dạy
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Xác nhận thông tin và hoàn thành lớp học
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge className={cn("text-sm font-medium", getStatusColor(confirmation.status))}>
                {getStatusLabel(confirmation.status)}
              </Badge>
              <div className="text-sm text-slate-600 mt-1">
                {new Date(confirmation.confirmedAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Thông tin lớp học
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.name}</div>
                  <div className="text-sm text-slate-500">Tên lớp</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.subject}</div>
                  <div className="text-sm text-slate-500">Môn học</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.studentCount} học sinh</div>
                  <div className="text-sm text-slate-500">Số lượng</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.date}</div>
                  <div className="text-sm text-slate-500">Ngày học</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.time}</div>
                  <div className="text-sm text-slate-500">Thời gian</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{classInfo.room}</div>
                  <div className="text-sm text-slate-500">Phòng học</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Xác nhận chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              Trạng thái lớp học
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={confirmation.status === 'confirmed' ? 'default' : 'outline'}
                onClick={() => setConfirmation(prev => ({ ...prev, status: 'confirmed' }))}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Đã dạy
              </Button>
              <Button
                variant={confirmation.status === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setConfirmation(prev => ({ ...prev, status: 'cancelled' }))}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Hủy lớp
              </Button>
              <Button
                variant={confirmation.status === 'rescheduled' ? 'default' : 'outline'}
                onClick={() => setConfirmation(prev => ({ ...prev, status: 'rescheduled' }))}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Dời lịch
              </Button>
            </div>
          </div>

          {/* Time Information */}
          {confirmation.status === 'confirmed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium text-slate-700 mb-2 block">
                  Giờ bắt đầu thực tế
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={confirmation.actualStartTime}
                  onChange={(e) => setConfirmation(prev => ({ ...prev, actualStartTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-slate-700 mb-2 block">
                  Giờ kết thúc thực tế
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={confirmation.actualEndTime}
                  onChange={(e) => setConfirmation(prev => ({ ...prev, actualEndTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Attendance Count */}
          <div>
            <Label htmlFor="attendance" className="text-sm font-medium text-slate-700 mb-2 block">
              Số học sinh có mặt
            </Label>
            <Input
              id="attendance"
              type="number"
              min="0"
              max={classInfo.studentCount}
              value={confirmation.attendanceCount}
              onChange={(e) => setConfirmation(prev => ({ ...prev, attendanceCount: parseInt(e.target.value) || 0 }))}
              className="w-32"
            />
          </div>

          {/* Materials Used */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Tài liệu sử dụng
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm tài liệu..."
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
                />
                <Button onClick={addMaterial} size="sm">
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {confirmation.materialsUsed.map((material, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {material}
                    <button
                      onClick={() => removeMaterial(index)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Homework Assignment */}
          <div>
            <Label htmlFor="homework" className="text-sm font-medium text-slate-700 mb-2 block">
              Bài tập về nhà
            </Label>
            <Textarea
              id="homework"
              placeholder="Mô tả bài tập về nhà..."
              value={confirmation.homeworkAssigned}
              onChange={(e) => setConfirmation(prev => ({ ...prev, homeworkAssigned: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Next Class Date */}
          {confirmation.status === 'rescheduled' && (
            <div>
              <Label htmlFor="nextClass" className="text-sm font-medium text-slate-700 mb-2 block">
                Ngày học tiếp theo
              </Label>
              <Input
                id="nextClass"
                type="date"
                value={confirmation.nextClassDate}
                onChange={(e) => setConfirmation(prev => ({ ...prev, nextClassDate: e.target.value }))}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700 mb-2 block">
              Ghi chú thêm
            </Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú về lớp học..."
              value={confirmation.notes}
              onChange={(e) => setConfirmation(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Teacher Signature */}
          <div>
            <Label htmlFor="signature" className="text-sm font-medium text-slate-700 mb-2 block">
              Chữ ký giáo viên
            </Label>
            <Input
              id="signature"
              value={confirmation.teacherSignature}
              onChange={(e) => setConfirmation(prev => ({ ...prev, teacherSignature: e.target.value }))}
              placeholder="Tên giáo viên"
            />
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
            <Eye className="w-4 h-4" />
            Xem trước
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Xác nhận lớp học'}
          </Button>
        </div>
      </div>
    </div>
  );
}





