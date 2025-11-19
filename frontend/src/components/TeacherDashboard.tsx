import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TeacherSidebar } from './TeacherSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Users, BookOpen, Calendar, ClipboardCheck, Clock, FileText, Award, School, CheckCircle, Home, Settings } from 'lucide-react';
import { Badge } from './ui/badge';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export function TeacherDashboard({ onNavigate, onLogout, user }: TeacherDashboardProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Sidebar */}
      <TeacherSidebar 
        currentPage="dashboard" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        user={user}
      />
      
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ml-0 ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Teacher Dashboard</h1>
                <p className="text-blue-100 text-sm lg:text-lg">Quản lý lớp học và giảng dạy</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-blue-100">Chào mừng trở lại</p>
                  <p className="font-bold text-white text-lg">{user?.name || 'Giáo viên'}</p>
                  <p className="text-xs text-blue-200">{user?.email || ''}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <span className="text-white font-bold text-xl">{(user?.name?.charAt(0) || user?.email?.charAt(0) || 'T').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="card-transparent border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng lớp học</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      --
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <School className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-transparent border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng học sinh</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                      --
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-transparent border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Bài tập chờ chấm</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                      --
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ClipboardCheck className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-transparent border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Lịch dạy tuần này</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      --
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card className="card-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold">Lớp học</span>
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">Quản lý các lớp đang giảng dạy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <School className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Lớp của tôi</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800 bg-blue-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Học sinh</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-800 bg-indigo-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('classrooms')}
                >
                  Xem lớp học
                </Button>
              </CardContent>
            </Card>

            <Card className="card-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold">Bài tập</span>
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">Tạo và chấm bài tập</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <ClipboardCheck className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Chờ chấm</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800 bg-blue-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Đã chấm</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-800 bg-indigo-200 px-3 py-1 rounded-full">(--)</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('assignments')}
                >
                  Quản lý bài tập
                </Button>
              </CardContent>
            </Card>

            <Card className="card-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold">Lịch dạy</span>
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">Xem lịch giảng dạy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Tuần này</span>
                        <p className="text-sm font-extrabold text-blue-800">-- buổi</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Hôm nay</span>
                        <p className="text-sm font-extrabold text-indigo-800">-- buổi</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('schedule')}
                >
                  Xem lịch dạy
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Today and Recent Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-transparent">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold">Lịch dạy hôm nay</span>
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">Các buổi học trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-slate-600 text-lg font-medium">Chưa có lịch dạy</p>
                  <p className="text-slate-500 text-sm mt-2">Lịch giảng dạy sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-transparent">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold">Bài tập cần chấm</span>
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">Bài tập chưa chấm điểm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-slate-600 text-lg font-medium">Không có bài tập cần chấm</p>
                  <p className="text-slate-500 text-sm mt-2">Bài tập cần chấm sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Performance */}
          <Card className="card-transparent">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 font-bold">Thành tích học sinh</span>
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">Hiệu suất học tập của các lớp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-slate-600 text-lg font-medium">Chưa có dữ liệu thành tích</p>
                <p className="text-slate-500 text-sm mt-2">Thống kê thành tích sẽ hiển thị ở đây</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

