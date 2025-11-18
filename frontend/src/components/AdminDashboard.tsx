'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AdminSidebar } from './AdminSidebar';
import { Users, UserCircle, School, DollarSign, TrendingUp, BookOpen, Calendar, Settings, BarChart, TrendingDown, MapPin, Loader2 } from 'lucide-react';

interface UserInfo {
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AdminDashboardProps {
  user?: UserInfo;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalClassrooms: number;
  totalSubjects: number;
  totalCampuses: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  totalPaidAmount: number;
  totalDiscount: number;
  paymentRate: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AdminDashboard({ user, onNavigate, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 0,
    totalStudents: 0,
    totalClassrooms: 0,
    totalSubjects: 0,
    totalCampuses: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyProfit: 0,
    totalPaidAmount: 0,
    totalDiscount: 0,
    paymentRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      };

      // Fetch all data in parallel
      const [teachersRes, studentsRes, classroomsRes, subjectsRes, campusesRes, financesRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/teachers?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/students?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/classrooms?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/subjects?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/campuses?limit=1000`, { headers }),
        fetch(`${API_BASE_URL}/api/finances/stats/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/payments?limit=10000`, { headers }),
      ]);

      // Process teachers
      let totalTeachers = 0;
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        const teachersList = Array.isArray(teachersData) ? teachersData : (Array.isArray((teachersData as any)?.data) ? (teachersData as any).data : []);
        totalTeachers = teachersList.length;
      }

      // Process students
      let totalStudents = 0;
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const studentsList = Array.isArray(studentsData) ? studentsData : (Array.isArray((studentsData as any)?.data) ? (studentsData as any).data : []);
        totalStudents = studentsList.length;
      }

      // Process classrooms
      let totalClassrooms = 0;
      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();
        const classroomsList = Array.isArray(classroomsData) ? classroomsData : (Array.isArray((classroomsData as any)?.data) ? (classroomsData as any).data : []);
        totalClassrooms = classroomsList.length;
      }

      // Process subjects
      let totalSubjects = 0;
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        const subjectsList = Array.isArray(subjectsData) ? subjectsData : (Array.isArray((subjectsData as any)?.data) ? (subjectsData as any).data : []);
        totalSubjects = subjectsList.length;
      }

      // Process campuses
      let totalCampuses = 0;
      if (campusesRes.ok) {
        const campusesData = await campusesRes.json();
        const campusesList = Array.isArray(campusesData) ? campusesData : (Array.isArray((campusesData as any)?.data) ? (campusesData as any).data : []);
        totalCampuses = campusesList.length;
      }

      // Process finances - get current month
      let monthlyIncome = 0;
      let monthlyExpense = 0;
      if (financesRes.ok) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Fetch all finances to filter by month
        const allFinancesRes = await fetch(`${API_BASE_URL}/api/finances?limit=10000`, { headers });
        if (allFinancesRes.ok) {
          const allFinances = await allFinancesRes.json();
          const financesList = Array.isArray(allFinances) ? allFinances : (Array.isArray((allFinances as any)?.data) ? (allFinances as any).data : []);

          financesList.forEach((finance: any) => {
            const financeDate = new Date(finance.date || finance.created_at);
            if (financeDate.getMonth() === currentMonth && financeDate.getFullYear() === currentYear) {
              if (finance.finance_type === 'income') {
                monthlyIncome += parseFloat(finance.amount) || 0;
              } else if (finance.finance_type === 'expense') {
                monthlyExpense += parseFloat(finance.amount) || 0;
              }
            }
          });
        }
      }

      // Process payments
      let totalPaidAmount = 0;
      let totalDiscount = 0;
      let totalPaidCount = 0;
      let totalPendingCount = 0;
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const paymentsList = Array.isArray(paymentsData) ? paymentsData : (Array.isArray((paymentsData as any)?.data) ? (paymentsData as any).data : []);

        // Get current month payments
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        paymentsList.forEach((payment: any) => {
          const paymentDate = new Date(payment.payment_date || payment.created_at);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            if (payment.payment_status === 'paid') {
              totalPaidAmount += parseFloat(payment.amount) || 0;
              totalPaidCount++;
              totalDiscount += (parseFloat(payment.amount) || 0) * ((parseFloat(payment.discount_percent) || 0) / 100);
            } else if (payment.payment_status === 'pending') {
              totalPendingCount++;
            }
          }
        });
      }

      const monthlyProfit = monthlyIncome + totalPaidAmount - monthlyExpense;
      const paymentRate = totalStudents > 0 ? ((totalPaidCount / totalStudents) * 100) : 0;

      setStats({
        totalTeachers,
        totalStudents,
        totalClassrooms,
        totalSubjects,
        totalCampuses,
        monthlyIncome: monthlyIncome + totalPaidAmount,
        monthlyExpense,
        monthlyProfit,
        totalPaidAmount,
        totalDiscount,
        paymentRate,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <AdminSidebar 
        currentPage="dashboard" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        userName={user?.full_name || user?.name || 'Admin'}
        userEmail={user?.email || ''}
        userRole={user?.role || 'admin'}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-slate-600 text-lg font-medium">Quản lý toàn bộ hệ thống trường học</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Chào mừng trở lại</p>
                  <p className="font-semibold text-slate-800">
                    {user?.full_name || user?.name || 'Admin'}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-slate-500">{user.email}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {(user?.full_name || user?.name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Tổng giáo viên"
                  value={stats.totalTeachers.toString()}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Tổng học sinh"
                  value={stats.totalStudents.toString()}
                  icon={UserCircle}
                  color="green"
                />
                <StatCard
                  title="Tổng lớp học"
                  value={stats.totalClassrooms.toString()}
                  icon={School}
                  color="purple"
                />
                <StatCard
                  title="Doanh thu tháng này"
                  value={formatCurrency(stats.monthlyIncome)}
                  icon={DollarSign}
                  color="green"
                />
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Môn học"
                  value={stats.totalSubjects.toString()}
                  icon={BookOpen}
                  color="indigo"
                />
                <StatCard
                  title="Cơ sở"
                  value={stats.totalCampuses.toString()}
                  icon={MapPin}
                  color="orange"
                />
                <StatCard
                  title="Chi phí tháng này"
                  value={formatCurrency(stats.monthlyExpense)}
                  icon={TrendingDown}
                  color="red"
                />
                <StatCard
                  title="Lợi nhuận tháng này"
                  value={formatCurrency(stats.monthlyProfit)}
                  icon={TrendingUp}
                  color={stats.monthlyProfit >= 0 ? 'green' : 'red'}
                />
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Thanh toán học sinh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tổng đã thu:</span>
                        <span className="font-bold text-green-600">{formatCurrency(stats.totalPaidAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tổng chiết khấu:</span>
                        <span className="font-bold text-red-600">{formatCurrency(stats.totalDiscount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tỷ lệ thanh toán:</span>
                        <span className="font-bold text-blue-600">{stats.paymentRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Management */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-slate-800 font-bold">Quản lý người dùng</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-base">Quản lý giáo viên và học sinh</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Giáo viên</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">{stats.totalTeachers}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <UserCircle className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Học sinh</span>
                        </div>
                        <span className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">{stats.totalStudents}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                      onClick={() => onNavigate('teachers')}
                    >
                      Quản lý người dùng
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-slate-800 font-bold">Quản lý học tập</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-base">Quản lý môn học và lớp học</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Môn học</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">{stats.totalSubjects}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500 rounded-lg">
                            <School className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Lớp học</span>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-200 px-3 py-1 rounded-full">{stats.totalClassrooms}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                      onClick={() => onNavigate('subjects')}
                    >
                      Quản lý học tập
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Management */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-slate-800 font-bold">Quản lý tài chính</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base">Thu chi và báo cáo tài chính</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Thu nhập tháng này</span>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Chi phí tháng này</span>
                          <p className="text-sm font-bold text-red-600">{formatCurrency(stats.monthlyExpense)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 md:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stats.monthlyProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Lợi nhuận tháng này</span>
                          <p className={`text-sm font-bold ${stats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(stats.monthlyProfit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    onClick={() => onNavigate('finance')}
                  >
                    Quản lý tài chính
                  </Button>
                </CardContent>
              </Card>

              {/* Overview Statistics */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BarChart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-slate-800 font-bold">Thống kê tổng quan</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base">Tổng hợp số liệu hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">Sĩ số trung bình</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalClassrooms > 0 ? Math.round(stats.totalStudents / stats.totalClassrooms) : 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">học sinh/lớp</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Tỷ lệ thanh toán</div>
                      <div className="text-2xl font-bold text-green-600">{stats.paymentRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500 mt-1">đã đóng</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-sm text-gray-600 mb-1">Tổng cơ sở</div>
                      <div className="text-2xl font-bold text-purple-600">{stats.totalCampuses}</div>
                      <div className="text-xs text-gray-500 mt-1">địa điểm</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm text-gray-600 mb-1">Tổng môn học</div>
                      <div className="text-2xl font-bold text-orange-600">{stats.totalSubjects}</div>
                      <div className="text-xs text-gray-500 mt-1">môn học</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}