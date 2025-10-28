import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Edit, Trash2, Mail, Phone, Award } from 'lucide-react';
import { Student } from '../types';

export function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  };

  // const avgGPA = students.reduce((sum, s) => sum + s.gpa, 0) / students.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
            <h1 className="text-3xl mb-2 text-black">Quản lý Học sinh</h1>
            <p className="text-black">Quản lý danh sách học sinh trong hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Tổng học sinh</p>
            <p className="text-3xl text-green-600">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Đang học</p>
            <p className="text-3xl text-blue-600">{students.filter(s => s.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
            <p className="text-3xl text-purple-600">N/A</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Lớp học</p>
            <p className="text-3xl text-yellow-600">{new Set(students.map(s => s.classroom_id).filter(Boolean)).size}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Danh sách Học sinh</CardTitle>
              <CardDescription>Tổng số {filteredStudents.length} học sinh</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm học sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm học sinh
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
                    </DialogTitle>
                    <DialogDescription>
                      Điền thông tin học sinh vào form bên dưới
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input id="name" placeholder="Nguyễn Văn A" defaultValue={editingStudent?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@student.edu.vn" defaultValue={editingStudent?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" placeholder="0901234567" defaultValue={editingStudent?.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classroom_id">Lớp học</Label>
                      <Input id="classroom_id" placeholder="10A1" defaultValue={editingStudent?.classroom_id} />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        {editingStudent ? 'Cập nhật' : 'Thêm mới'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Lớp học</TableHead>
                  <TableHead>Điểm TB</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">{student.name?.charAt(0) || 'N'}</span>
                        </div>
                        <span>{student.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{student.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.classroom_id || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600">
                          N/A
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={student.status === 'active' ? 'bg-green-100 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                        {student.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
