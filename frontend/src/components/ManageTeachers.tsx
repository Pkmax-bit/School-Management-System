import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { Teacher } from '../types';

export function ManageTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = teachers.filter(teacher =>
    (teacher.name && teacher.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.teacher_code && teacher.teacher_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (teacher.specialization && teacher.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
            <h1 className="text-3xl mb-2 text-black">Quản lý Giáo viên</h1>
            <p className="text-black">Quản lý danh sách giáo viên trong hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Tổng giáo viên</p>
            <p className="text-3xl text-blue-600">{teachers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Đang hoạt động</p>
            <p className="text-3xl text-green-600">{teachers.filter(t => t.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Tạm nghỉ</p>
            <p className="text-3xl text-yellow-600">{teachers.filter(t => t.status === 'inactive').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Chuyên môn</p>
            <p className="text-3xl text-purple-600">{new Set(teachers.map(t => t.specialization).filter(Boolean)).size}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Danh sách Giáo viên</CardTitle>
              <CardDescription>Tổng số {filteredTeachers.length} giáo viên</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm giáo viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm giáo viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTeacher ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}
                    </DialogTitle>
                    <DialogDescription>
                      Điền thông tin giáo viên vào form bên dưới
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input id="name" placeholder="Nguyễn Văn A" defaultValue={editingTeacher?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@school.edu.vn" defaultValue={editingTeacher?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" placeholder="0901234567" defaultValue={editingTeacher?.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher_code">Mã giáo viên</Label>
                      <Input id="teacher_code" placeholder="GV001" defaultValue={editingTeacher?.teacher_code} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Chuyên môn</Label>
                      <Input id="specialization" placeholder="Toán học" defaultValue={editingTeacher?.specialization} />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
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
                  <TableHead>Mã GV</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600">{teacher.name?.charAt(0) || '?'}</span>
                        </div>
                        <span>{teacher.name || 'Chưa cập nhật'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{teacher.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{teacher.teacher_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{teacher.specialization || 'Chưa cập nhật'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={teacher.status === 'active' ? 'bg-green-100 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                        {teacher.status === 'active' ? 'Hoạt động' : 'Tạm nghỉ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(teacher.id)}>
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
