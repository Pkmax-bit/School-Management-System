'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown, 
  CheckCircle, XCircle, Clock, CreditCard, Receipt
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Finance {
  id: string;
  title: string;
  description?: string;
  amount: number;
  finance_type: 'income' | 'expense';
  category: string;
  date: string;
  is_recurring: boolean;
  classroom_id?: string;
  student_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

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

export default function FinancesPage() {
  const { user, loading: authLoading, logout } = useApiAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('finances');

  // Finances state
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loadingFinances, setLoadingFinances] = useState(true);
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [financeFormData, setFinanceFormData] = useState({
    title: '',
    description: '',
    amount: '',
    finance_type: 'income' as 'income' | 'expense',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    classroom_id: '',
    student_id: ''
  });
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    profit: 0,
    profit_margin: 0
  });

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
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

  // Load finances
  const loadFinances = useCallback(async () => {
    try {
      setLoadingFinances(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/finances?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFinances(data);
      }
    } catch (error) {
      console.error('Error loading finances:', error);
    } finally {
      setLoadingFinances(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/finances/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, []);

  // Load payments
  const loadPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
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
      setLoadingPayments(false);
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
      loadFinances();
      loadSummary();
      loadPayments();
      loadStudents();
      loadClassrooms();
    }
  }, [user, loadFinances, loadSummary, loadPayments, loadStudents, loadClassrooms]);

  // Finance handlers
  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        ...financeFormData,
        amount: parseFloat(financeFormData.amount),
        date: new Date(financeFormData.date).toISOString(),
        classroom_id: financeFormData.classroom_id || null,
        student_id: financeFormData.student_id || null
      };

      const url = editingFinance
        ? `${API_BASE_URL}/api/finances/${editingFinance.id}`
        : `${API_BASE_URL}/api/finances`;
      
      const response = await fetch(url, {
        method: editingFinance ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsFinanceDialogOpen(false);
        setEditingFinance(null);
        setFinanceFormData({
          title: '',
          description: '',
          amount: '',
          finance_type: 'income',
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          classroom_id: '',
          student_id: ''
        });
        loadFinances();
        loadSummary();
      }
    } catch (error) {
      console.error('Error saving finance:', error);
      alert('Lỗi khi lưu giao dịch tài chính');
    }
  };

  const handleFinanceDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/finances/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadFinances();
        loadSummary();
      }
    } catch (error) {
      console.error('Error deleting finance:', error);
      alert('Lỗi khi xóa giao dịch');
    }
  };

  // Payment handlers
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount),
        payment_date: new Date(paymentFormData.payment_date).toISOString(),
        due_date: paymentFormData.due_date ? new Date(paymentFormData.due_date).toISOString() : null
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
        setIsPaymentDialogOpen(false);
        setEditingPayment(null);
        setPaymentFormData({
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

  const handlePaymentDelete = async (id: string) => {
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

  const filteredFinances = finances.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(financeSearchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(financeSearchQuery.toLowerCase());
    const matchesType = filterType === 'all' || f.finance_type === filterType;
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.student_name?.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
      (p.student_code?.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
      (p.classroom_name?.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
      (p.receipt_number?.toLowerCase().includes(paymentSearchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.payment_status === filterStatus;
    const matchesClassroom = filterClassroom === 'all' || p.classroom_id === filterClassroom;
    return matchesSearch && matchesStatus && matchesClassroom;
  });

  // Payment statistics
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
        currentPage="finance" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 p-6 space-y-6">
      <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài chính</h1>
          <p className="text-gray-600 mt-2">Ghi lại chi phí, thu nhập và theo dõi thanh toán học sinh</p>
        </div>

        {/* Summary Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Tổng Thu</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.total_income)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Tổng Chi</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.total_expense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.profit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Học sinh đã đóng</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            </CardContent>
          </Card>
      </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="finances" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Giao dịch Tài chính
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán Học sinh
            </TabsTrigger>
          </TabsList>

          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Giao dịch Tài chính</CardTitle>
                  <Dialog open={isFinanceDialogOpen} onOpenChange={setIsFinanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingFinance(null);
                        setFinanceFormData({
                          title: '',
                          description: '',
                          amount: '',
                          finance_type: 'income',
                          category: 'other',
                          date: new Date().toISOString().split('T')[0],
                          is_recurring: false,
                          classroom_id: '',
                          student_id: ''
                        });
                      }}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm Giao dịch
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingFinance ? 'Sửa' : 'Thêm'} Giao dịch Tài chính</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleFinanceSubmit} className="space-y-4">
                        <div>
                          <Label>Tiêu đề *</Label>
                          <Input
                            value={financeFormData.title}
                            onChange={(e) => setFinanceFormData({ ...financeFormData, title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Mô tả</Label>
                          <Textarea
                            value={financeFormData.description}
                            onChange={(e) => setFinanceFormData({ ...financeFormData, description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Số tiền *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={financeFormData.amount}
                              onChange={(e) => setFinanceFormData({ ...financeFormData, amount: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Loại *</Label>
                            <Select
                              value={financeFormData.finance_type}
                              onValueChange={(value) => setFinanceFormData({ ...financeFormData, finance_type: value as 'income' | 'expense' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Thu nhập</SelectItem>
                                <SelectItem value="expense">Chi phí</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Danh mục *</Label>
                            <Select
                              value={financeFormData.category}
                              onValueChange={(value) => setFinanceFormData({ ...financeFormData, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tuition">Học phí</SelectItem>
                                <SelectItem value="salary">Lương</SelectItem>
                                <SelectItem value="facility">Cơ sở vật chất</SelectItem>
                                <SelectItem value="equipment">Thiết bị</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Ngày *</Label>
                            <Input
                              type="date"
                              value={financeFormData.date}
                              onChange={(e) => setFinanceFormData({ ...financeFormData, date: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_recurring"
                            checked={financeFormData.is_recurring}
                            onChange={(e) => setFinanceFormData({ ...financeFormData, is_recurring: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="is_recurring">Định kỳ</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsFinanceDialogOpen(false)}>
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
                      placeholder="Tìm kiếm..."
                      value={financeSearchQuery}
                      onChange={(e) => setFinanceSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="income">Thu nhập</SelectItem>
                      <SelectItem value="expense">Chi phí</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="tuition">Học phí</SelectItem>
                      <SelectItem value="salary">Lương</SelectItem>
                      <SelectItem value="facility">Cơ sở vật chất</SelectItem>
                      <SelectItem value="equipment">Thiết bị</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFinances ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Định kỳ</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinances.map((finance) => (
                        <TableRow key={finance.id}>
                          <TableCell>{finance.title}</TableCell>
                          <TableCell>
                            <Badge variant={finance.finance_type === 'income' ? 'default' : 'destructive'}>
                              {finance.finance_type === 'income' ? 'Thu nhập' : 'Chi phí'}
                            </Badge>
                          </TableCell>
                          <TableCell>{finance.category}</TableCell>
                          <TableCell className={finance.finance_type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finance.amount)}
                          </TableCell>
                          <TableCell>{new Date(finance.date).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell>{finance.is_recurring ? 'Có' : 'Không'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingFinance(finance);
                                  setFinanceFormData({
                                    title: finance.title,
                                    description: finance.description || '',
                                    amount: finance.amount.toString(),
                                    finance_type: finance.finance_type,
                                    category: finance.category,
                                    date: new Date(finance.date).toISOString().split('T')[0],
                                    is_recurring: finance.is_recurring,
                                    classroom_id: finance.classroom_id || '',
                                    student_id: finance.student_id || ''
                                  });
                                  setIsFinanceDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFinanceDelete(finance.id)}
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
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thanh toán Học sinh</CardTitle>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingPayment(null);
                        setPaymentFormData({
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
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Học sinh *</Label>
                            <Select
                              value={paymentFormData.student_id}
                              onValueChange={(value) => setPaymentFormData({ ...paymentFormData, student_id: value })}
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
                              value={paymentFormData.classroom_id}
                              onValueChange={(value) => setPaymentFormData({ ...paymentFormData, classroom_id: value })}
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
                              value={paymentFormData.amount}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Ngày thanh toán *</Label>
                            <Input
                              type="date"
                              value={paymentFormData.payment_date}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Phương thức thanh toán</Label>
                            <Select
                              value={paymentFormData.payment_method}
                              onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_method: value })}
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
                              value={paymentFormData.payment_status}
                              onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_status: value })}
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
                            value={paymentFormData.due_date}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, due_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Số biên lai</Label>
                          <Input
                            value={paymentFormData.receipt_number}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, receipt_number: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea
                            value={paymentFormData.notes}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
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
                      value={paymentSearchQuery}
                      onChange={(e) => setPaymentSearchQuery(e.target.value)}
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
                {loadingPayments ? (
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
                                  setPaymentFormData({
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
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePaymentDelete(payment.id)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
