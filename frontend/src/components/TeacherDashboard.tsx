import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TeacherSidebar } from './TeacherSidebar';
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                  Teacher Dashboard
                </h1>
                <p className="text-slate-900 text-lg font-bold">Quản lý lớp học và giảng dạy</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Chào mừng trở lại</p>
                  <p className="font-semibold text-slate-800">{user?.name || 'Giáo viên'}</p>
                  <p className="text-xs text-slate-400">{user?.email || ''}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{(user?.name?.charAt(0) || user?.email?.charAt(0) || 'T').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tổng lớp học"
              value="--"
              icon={School}
              color="blue"
            />
            <StatCard
              title="Tổng học sinh"
              value="--"
              icon={Users}
              color="green"
            />
            <StatCard
              title="Bài tập chờ chấm"
              value="--"
              icon={ClipboardCheck}
              color="red"
            />
            <StatCard
              title="Lịch dạy tuần này"
              value="--"
              icon={Calendar}
              color="purple"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <School className="w-6 h-6 text-blue-700" />
                  </div>
                  <span className="text-slate-800 font-bold">Lớp học</span>
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Quản lý các lớp đang giảng dạy</CardDescription>
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
                  className="w-full mt-6 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('classrooms')}
                >
                  Xem lớp học
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-blue-700" />
                  </div>
                  <span className="text-slate-800 font-bold">Bài tập</span>
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Tạo và chấm bài tập</CardDescription>
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
                  className="w-full mt-6 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('assignments')}
                >
                  Quản lý bài tập
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-700" />
                  </div>
                  <span className="text-slate-800 font-bold">Lịch dạy</span>
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Xem lịch giảng dạy</CardDescription>
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
                  className="w-full mt-6 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => onNavigate('schedule')}
                >
                  Xem lịch dạy
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Today and Recent Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-slate-800 font-bold">Lịch dạy hôm nay</span>
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Các buổi học trong ngày</CardDescription>
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

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-slate-800 font-bold">Bài tập cần chấm</span>
                </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Bài tập chưa chấm điểm</CardDescription>
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
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-slate-800 font-bold">Thành tích học sinh</span>
              </CardTitle>
                <CardDescription className="text-slate-900 font-bold">Hiệu suất học tập của các lớp</CardDescription>
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

