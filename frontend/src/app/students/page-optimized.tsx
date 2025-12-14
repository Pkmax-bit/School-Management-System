'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSidebar } from '@/contexts/SidebarContext';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonTable } from '@/components/ui/skeleton';
import { AlertCircle, Edit, Trash2, Plus, Search, Users, Mail, Phone, MapPin, Calendar, UserCheck } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useApiAuth } from '@/hooks/useApiAuth';
import { CreateStudentData } from '@/lib/students-api';
import { Student } from '@/types';

// Lazy load heavy components
const StudentFormDialog = dynamic(() => import('@/components/StudentFormDialog'), {
  loading: () => <div>Đang tải...</div>,
  ssr: false
});

// Memoized Student Row Component
const StudentRow = React.memo(({ student, onEdit, onDelete }: {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) => (
  <TableRow className="hover:bg-purple-50/50 transition-colors">
    <TableCell className="font-bold text-gray-900">{student.name}</TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-gray-400" />
        <span className="text-gray-700">{student.email}</span>
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold">
        {student.student_code}
      </Badge>
    </TableCell>
    <TableCell className="text-gray-700">{student.phone || <span className="text-gray-400">Chưa cập nhật</span>}</TableCell>
    <TableCell className="text-gray-700">{student.address || <span className="text-gray-400">Chưa cập nhật</span>}</TableCell>
    <TableCell className="text-gray-700">
      {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('vi-VN') : <span className="text-gray-400">Chưa cập nhật</span>}
    </TableCell>
    <TableCell>
      <div className="text-sm">
        <div className="font-medium text-gray-700">{student.parent_name || <span className="text-gray-400">Chưa cập nhật</span>}</div>
        {student.parent_phone && (
          <div className="text-gray-500">{student.parent_phone}</div>
        )}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(student)}
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(student)}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

StudentRow.displayName = 'StudentRow';

export default function StudentsPageOptimized() {
  const { isCollapsed } = useSidebar();
  const { user, loading } = useApiAuth();
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Use React Query hook
  const {
    students,
    total,
    isLoading,
    page,
    totalPages,
    pageSize,
    createStudent,
    updateStudent,
    deleteStudent,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStudents({
    page: currentPage,
    search: searchQuery,
    enabled: !loading && user?.role === 'admin'
  });

  // Memoized filtered students (client-side filtering if needed)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(student =>
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.student_code?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: students.length,
    withEmail: students.filter(s => s.email).length,
    withPhone: students.filter(s => s.phone).length,
    withAddress: students.filter(s => s.address).length,
    withBirthday: students.filter(s => s.date_of_birth).length,
    withParent: students.filter(s => s.parent_name).length,
  }), [students]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAdd = useCallback(() => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((student: Student) => {
    if (confirm(`Bạn có chắc muốn xóa học sinh "${student.name}"?`)) {
      deleteStudent(student.id);
    }
  }, [deleteStudent]);

  const handleCreate = useCallback(async (data: CreateStudentData) => {
    try {
      await createStudent(data);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating student:', error);
    }
  }, [createStudent]);

  const handleUpdate = useCallback(async (data: CreateStudentData) => {
    if (!editingStudent) return;
    try {
      await updateStudent({ id: editingStudent.id, data });
      setIsDialogOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  }, [editingStudent, updateStudent]);

  // Redirect if not admin
  if (!loading && (!user || user.role !== 'admin')) {
    router.push('/dashboard');
    return null;
  }

  return (
    <PageWithBackground>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar currentPage="students" />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="card-transparent border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Tổng số</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        {stats.total}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-transparent border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Có email</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                        {stats.withEmail}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Mail className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-transparent border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Có SĐT</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                        {stats.withPhone}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Phone className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-transparent border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Có địa chỉ</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                        {stats.withAddress}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-transparent border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Có ngày sinh</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                        {stats.withBirthday}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-transparent border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Có phụ huynh</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                        {stats.withParent}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <UserCheck className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Actions */}
            <Card className="card-transparent">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Danh sách Học sinh</CardTitle>
                    <p className="text-sm text-gray-600">Tổng số {total} học sinh</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1 md:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Tìm kiếm học sinh..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={handleAdd} className="bg-gradient-to-r from-purple-600 to-pink-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm học sinh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonTable rows={10} cols={8} />
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không có học sinh nào</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Mã HS</TableHead>
                          <TableHead>Số điện thoại</TableHead>
                          <TableHead>Địa chỉ</TableHead>
                          <TableHead>Ngày sinh</TableHead>
                          <TableHead>Phụ huynh</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <StudentRow
                            key={student.id}
                            student={student}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </TableBody>
                    </Table>
                    
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        pageSize={pageSize}
                        totalItems={total}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWithBackground>
  );
}

