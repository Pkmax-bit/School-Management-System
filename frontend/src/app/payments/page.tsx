'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Payment {
  id: string;
  student_id: string;
  classroom_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  payment_status: string;
  due_date?: string;
  receipt_number?: string;
  notes?: string;
  student_name?: string;
  student_code?: string;
  classroom_name?: string;
  classroom_code?: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  student_code: string;
  user_id: string;
  classroom_id?: string;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
}

export default function PaymentsPage() {
  const { user, loading: authLoading, logout } = useApiAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    classroom_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_status: 'paid',
    due_date: '',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/payments?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, []);

  const loadClassrooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/classrooms?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadPayments();
      loadStudents();
      loadClassrooms();
    }
  }, [user, loadPayments, loadStudents, loadClassrooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        payment_date: new Date(formData.payment_date).toISOString(),
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };

      const url = editingPayment
        ? `${API_BASE_URL}/api/payments/${editingPayment.id}`
        : `${API_BASE_URL}/api/payments`;
      
      const response = await fetch(url, {
        method: editingPayment ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingPayment(null);
        setFormData({
          student_id: '',
          classroom_id: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          payment_status: 'paid',
          due_date: '',
          receipt_number: '',
          notes: ''
        });
        loadPayments();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Lỗi khi lưu thanh toán');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thanh toán này?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Lỗi khi xóa thanh toán');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'outline'
    };
    const labels: Record<string, string> = {
      paid: 'Đã đóng',
      pending: 'Chờ đóng',
      overdue: 'Quá hạn',
      cancelled: 'Hủy'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.student_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.student_code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.classroom_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.payment_status === filterStatus;
    const matchesClassroom = filterClassroom === 'all' || p.classroom_id === filterClassroom;
    return matchesSearch && matchesStatus && matchesClassroom;
  });

  // Calculate statistics
  const totalPaid = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter(p => p.payment_status === 'paid').length;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar 
        currentPage="payments" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Thanh toán Học sinh</h1>
          <p className="text-gray-600 mt-2">Theo dõi thanh toán học phí của học sinh</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng đã thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng chờ thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPending)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Số học sinh đã đóng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{paidCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPaid + totalPending)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách Thanh toán</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPayment(null);
                    setFormData({
                      student_id: '',
                      classroom_id: '',
                      amount: '',
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'cash',
                      payment_status: 'paid',
                      due_date: '',
                      receipt_number: '',
                      notes: ''
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Thêm Thanh toán
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPayment ? 'Sửa' : 'Thêm'} Thanh toán</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Học sinh *</Label>
                          <Select
                            value={formData.student_id}
                            onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                          >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học sinh" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.student_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Lớp học *</Label>
                        <Select
                          value={formData.classroom_id}
                          onValueChange={(value) => setFormData({ ...formData, classroom_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lớp học" />
                          </SelectTrigger>
                          <SelectContent>
                            {classrooms.map((classroom) => (
                              <SelectItem key={classroom.id} value={classroom.id}>
                                {classroom.name} ({classroom.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Số tiền *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Ngày thanh toán *</Label>
                        <Input
                          type="date"
                          value={formData.payment_date}
                          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phương thức thanh toán</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Tiền mặt</SelectItem>
                            <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                            <SelectItem value="card">Thẻ</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Trạng thái *</Label>
                        <Select
                          value={formData.payment_status}
                          onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Đã đóng</SelectItem>
                            <SelectItem value="pending">Chờ đóng</SelectItem>
                            <SelectItem value="overdue">Quá hạn</SelectItem>
                            <SelectItem value="cancelled">Hủy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Hạn đóng</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Số biên lai</Label>
                      <Input
                        value={formData.receipt_number}
                        onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Ghi chú</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button type="submit">Lưu</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm học sinh, lớp học, số biên lai..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="paid">Đã đóng</SelectItem>
                  <SelectItem value="pending">Chờ đóng</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                  <SelectItem value="cancelled">Hủy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClassroom} onValueChange={setFilterClassroom}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lớp học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Lớp học</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngày thanh toán</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số biên lai</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.student_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.student_code || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.classroom_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.classroom_code || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount)}
                      </TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        {payment.payment_method === 'cash' ? 'Tiền mặt' :
                         payment.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                         payment.payment_method === 'card' ? 'Thẻ' : 'Khác'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.payment_status)}
                          {getStatusBadge(payment.payment_status)}
                        </div>
                      </TableCell>
                      <TableCell>{payment.receipt_number || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPayment(payment);
                              setFormData({
                                student_id: payment.student_id,
                                classroom_id: payment.classroom_id,
                                amount: payment.amount.toString(),
                                payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
                                payment_method: payment.payment_method || 'cash',
                                payment_status: payment.payment_status,
                                due_date: payment.due_date ? new Date(payment.due_date).toISOString().split('T')[0] : '',
                                receipt_number: payment.receipt_number || '',
                                notes: payment.notes || ''
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

