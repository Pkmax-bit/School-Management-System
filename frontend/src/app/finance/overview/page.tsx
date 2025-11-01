'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, School,
  CheckCircle, XCircle, Clock, BarChart, PieChart, Calendar
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FinanceOverview {
  total_income: number;
  total_expense: number;
  profit: number;
  total_students: number;
  total_classrooms: number;
  paid_students: number;
  pending_payments: number;
}

interface DailySummary {
  date: string;
  total_income: number;
  total_expense: number;
  profit: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
}

interface PaymentStatus {
  status: string;
  count: number;
  amount: number;
}

export default function FinanceOverviewPage() {
  const { user, loading: authLoading, logout } = useApiAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [overview, setOverview] = useState<FinanceOverview>({
    total_income: 0,
    total_expense: 0,
    profit: 0,
    total_students: 0,
    total_classrooms: 0,
    paid_students: 0,
    pending_payments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Load finances summary
      const financesResponse = await fetch(`${API_BASE_URL}/api/finances/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let totalIncome = 0;
      let totalExpense = 0;
      if (financesResponse.ok) {
        const financesData = await financesResponse.json();
        totalIncome = financesData.total_income || 0;
        totalExpense = financesData.total_expense || 0;
      }

      // Load all finances for daily summary and category breakdown
      const allFinancesResponse = await fetch(`${API_BASE_URL}/api/finances?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let allFinances: any[] = [];
      if (allFinancesResponse.ok) {
        allFinances = await allFinancesResponse.json();
      }

      // Calculate daily summary (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyMap = new Map<string, { income: number; expense: number }>();
      allFinances.forEach((finance: any) => {
        const date = new Date(finance.date || finance.created_at).toISOString().split('T')[0];
        if (new Date(date) >= thirtyDaysAgo) {
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { income: 0, expense: 0 });
          }
          const dayData = dailyMap.get(date)!;
          if (finance.finance_type === 'income') {
            dayData.income += finance.amount;
          } else {
            dayData.expense += finance.amount;
          }
        }
      });

      const dailySummaryData: DailySummary[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          total_income: data.income,
          total_expense: data.expense,
          profit: data.income - data.expense,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

      setDailySummary(dailySummaryData);

      // Calculate category expenses
      const categoryMap = new Map<string, number>();
      allFinances
        .filter((f: any) => f.finance_type === 'expense')
        .forEach((finance: any) => {
          const category = finance.category || 'other';
          categoryMap.set(category, (categoryMap.get(category) || 0) + finance.amount);
        });

      const categoryExpensesData: CategoryExpense[] = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryExpenses(categoryExpensesData);

      // Load students and classrooms count
      const studentsResponse = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      let totalStudents = 0;
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        totalStudents = Array.isArray(studentsData) ? studentsData.length : 0;
      }

      const classroomsResponse = await fetch(`${API_BASE_URL}/api/classrooms?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      let totalClassrooms = 0;
      if (classroomsResponse.ok) {
        const classroomsData = await classroomsResponse.json();
        totalClassrooms = Array.isArray(classroomsData) ? classroomsData.length : 0;
      }

      // Load payments summary
      const paymentsResponse = await fetch(`${API_BASE_URL}/api/payments?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let paidStudents = 0;
      let pendingPayments = 0;
      const paymentStatusMap = new Map<string, { count: number; amount: number }>();

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const paidStudentIds = new Set(
          paymentsData
            .filter((p: any) => p.payment_status === 'paid')
            .map((p: any) => p.student_id)
        );
        paidStudents = paidStudentIds.size;

        paymentsData.forEach((payment: any) => {
          const status = payment.payment_status || 'pending';
          if (!paymentStatusMap.has(status)) {
            paymentStatusMap.set(status, { count: 0, amount: 0 });
          }
          const statusData = paymentStatusMap.get(status)!;
          statusData.count += 1;
          statusData.amount += payment.amount;

          if (status === 'pending') {
            pendingPayments += payment.amount;
          }
        });
      }

      const paymentStatusesData: PaymentStatus[] = Array.from(paymentStatusMap.entries())
        .map(([status, data]) => ({ status, count: data.count, amount: data.amount }));

      setPaymentStatuses(paymentStatusesData);

      // Set overview
      setOverview({
        total_income: totalIncome,
        total_expense: totalExpense,
        profit: totalIncome - totalExpense,
        total_students: totalStudents,
        total_classrooms: totalClassrooms,
        paid_students: paidStudents,
        pending_payments: pendingPayments,
      });
    } catch (error) {
      console.error('Error loading overview:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadOverview();
    }
  }, [user, loadOverview]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      tuition: 'Học phí',
      salary: 'Lương',
      facility: 'Cơ sở vật chất',
      equipment: 'Thiết bị',
      other: 'Khác',
    };
    return labels[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Đã đóng',
      pending: 'Chờ đóng',
      overdue: 'Quá hạn',
      cancelled: 'Hủy',
    };
    return labels[status] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar currentPage="finance" onNavigate={(page) => router.push(`/${page}`)} onLogout={logout} />
        <div className="flex-1 lg:ml-64 p-6">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
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
      <AdminSidebar currentPage="finance" onNavigate={(page) => router.push(`/${page}`)} onLogout={logout} />
      <div className="flex-1 lg:ml-64 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tổng quan Tài chính</h1>
            <p className="text-gray-600 mt-2">Tổng hợp và phân tích tài chính của hệ thống</p>
          </div>
          <Button onClick={() => router.push('/finance')} variant="outline">
            Quay lại Quản lý Tài chính
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Tổng Thu</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.total_income)}
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
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.total_expense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.profit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Học sinh đã đóng</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.paid_students}</div>
              <p className="text-xs text-gray-500 mt-1">/ {overview.total_students} học sinh</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng số lớp học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <School className="h-8 w-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold">{overview.total_classrooms}</div>
                  <p className="text-xs text-gray-500">lớp học</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tiền chờ đóng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(overview.pending_payments)}
                  </div>
                  <p className="text-xs text-gray-500">đang chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tổng số học sinh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{overview.total_students}</div>
                  <p className="text-xs text-gray-500">học sinh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Thu chi 30 ngày gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dailySummary.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
                ) : (
                  dailySummary.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <div className="font-medium">{new Date(day.date).toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-gray-500">
                          Thu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(day.total_income)} | 
                          Chi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(day.total_expense)}
                        </div>
                      </div>
                      <div className={`font-bold ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(day.profit)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Chi phí theo danh mục
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryExpenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
                ) : (
                  categoryExpenses.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{getCategoryLabel(item.category)}</span>
                      </div>
                      <span className="font-bold text-red-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Trạng thái Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {paymentStatuses.length === 0 ? (
                <p className="text-center text-gray-500 col-span-4 py-8">Chưa có dữ liệu thanh toán</p>
              ) : (
                paymentStatuses.map((status) => (
                  <div key={status.status} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{getStatusLabel(status.status)}</span>
                      {status.status === 'paid' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {status.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {status.status === 'overdue' && <XCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="text-2xl font-bold">{status.count}</div>
                    <div className="text-sm text-gray-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(status.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

