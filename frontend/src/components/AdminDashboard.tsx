import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AdminSidebar } from './AdminSidebar';
import { Users, UserCircle, School, DollarSign, TrendingUp, BookOpen, Calendar, Settings, BarChart } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <AdminSidebar 
        currentPage="dashboard" 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
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
                  <p className="font-semibold text-slate-800">Admin</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tổng giáo viên"
              value="--"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Tổng học sinh"
              value="--"
              icon={UserCircle}
              color="green"
            />
            <StatCard
              title="Tổng lớp học"
              value="--"
              icon={School}
              color="purple"
            />
            <StatCard
              title="Doanh thu tháng"
              value="--"
              icon={DollarSign}
              color="green"
            />
          </div>

          {/* Quick Management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <span className="text-sm font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <UserCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Học sinh</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">(--)</span>
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
                    <span className="text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <School className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Lớp học</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-200 px-3 py-1 rounded-full">(--)</span>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Thu nhập tháng này</span>
                        <p className="text-sm font-bold text-green-600">--</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Chi phí tháng này</span>
                        <p className="text-sm font-bold text-red-600">--</p>
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
          </div>

          {/* Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-slate-800 font-bold">Hoạt động gần đây</span>
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">Những hoạt động mới nhất trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-slate-600 text-lg font-medium">Chưa có hoạt động nào</p>
                  <p className="text-slate-500 text-sm mt-2">Các hoạt động sẽ hiển thị ở đây khi có dữ liệu</p>
                </div>
              </div>
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
              <CardDescription className="text-slate-600 text-base">Tiến độ và hiệu suất hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-slate-600 text-lg font-medium">Chưa có dữ liệu thống kê</p>
                <p className="text-slate-500 text-sm mt-2">Biểu đồ và thống kê sẽ hiển thị ở đây</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}