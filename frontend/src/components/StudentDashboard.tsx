import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Clipboard,
  ClipboardCheck,
  Award,
  Calendar,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  ArrowRight,
  Star,
  TrendingUp
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xin chào, Học sinh! 👋</h1>
          <p className="text-gray-600 mt-1">Chúc bạn một ngày học tập hiệu quả.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
            Học kỳ 1
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="px-3 text-sm text-gray-600">
            Năm học 2025-2026
          </div>
        </div>
      </div>

      {/* Continue Learning - Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4">
                    Tiếp tục học
                  </Badge>
                  <h2 className="text-2xl font-bold mb-2">Toán học: Đạo hàm và ứng dụng</h2>
                  <p className="text-blue-100 mb-6 max-w-lg">
                    Bài học đang học dở. Hãy tiếp tục để hoàn thành chương này nhé!
                  </p>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => onNavigate('student/lessons/latest')}
                      className="bg-white text-blue-600 hover:bg-blue-50 border-0 font-semibold"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Học tiếp
                    </Button>
                    <div className="text-sm text-blue-100">
                      Tiến độ: 65%
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Bài tập cần làm</p>
                <h3 className="text-2xl font-bold text-gray-900">3</h3>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => onNavigate('student/assignments')}>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Điểm trung bình</p>
                <h3 className="text-2xl font-bold text-gray-900">8.5</h3>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => onNavigate('student/grades')}>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Schedule & Assignments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Lịch học hôm nay
              </h2>
              <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => onNavigate('student/schedule')}>
                Xem tất cả
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { time: '07:00 - 08:30', subject: 'Toán học', teacher: 'Nguyễn Văn An', room: 'P.101', status: 'completed' },
                { time: '08:45 - 10:15', subject: 'Văn học', teacher: 'Trần Thị Bình', room: 'P.201', status: 'ongoing' },
                { time: '10:30 - 12:00', subject: 'Tiếng Anh', teacher: 'Lê Văn Cường', room: 'P.301', status: 'upcoming' },
              ].map((schedule, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${schedule.status === 'ongoing'
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-blue-100'
                    }`}
                >
                  <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${schedule.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600'
                    }`}>
                    <span className="text-xs font-medium">{schedule.time.split(' - ')[0]}</span>
                    <Clock className="w-4 h-4 my-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{schedule.subject}</h3>
                    <p className="text-sm text-gray-500">{schedule.teacher}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={schedule.status === 'ongoing' ? 'default' : 'secondary'} className={
                      schedule.status === 'ongoing' ? 'bg-blue-600' : ''
                    }>
                      {schedule.room}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {schedule.status === 'ongoing' ? 'Đang học' : schedule.status === 'completed' ? 'Đã xong' : 'Sắp tới'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-orange-500" />
                Bài tập sắp đến hạn
              </h2>
              <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => onNavigate('student/assignments')}>
                Xem tất cả
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Bài tập Đại số', subject: 'Toán', due: 'Hôm nay', priority: 'high' },
                { title: 'Soạn văn: Chí Phèo', subject: 'Văn', due: 'Ngày mai', priority: 'medium' },
                { title: 'Unit 5: Vocabulary', subject: 'Tiếng Anh', due: '2 ngày nữa', priority: 'low' },
                { title: 'Báo cáo thí nghiệm', subject: 'Vật lý', due: '3 ngày nữa', priority: 'medium' },
              ].map((assignment, index) => (
                <Card key={index} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className={`${assignment.priority === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                          assignment.priority === 'medium' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                            'text-green-600 border-green-200 bg-green-50'
                        }`}>
                        {assignment.subject}
                      </Badge>
                      <span className="text-xs font-medium text-gray-500">{assignment.due}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {assignment.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                        ))}
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 p-0 h-auto">
                        Làm bài <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Achievements & Notifications */}
        <div className="space-y-8">
          {/* Recent Achievements */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                Thành tích mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <p className="font-bold">Học sinh chăm chỉ</p>
                    <p className="text-xs text-purple-100">Hoàn thành 10 bài tập liên tiếp</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-blue-900">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Điểm tuyệt đối</p>
                    <p className="text-xs text-purple-100">Đạt 10 điểm môn Toán</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Thông báo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { text: 'Giáo viên Toán đã đăng bài tập mới', time: '1 giờ trước', type: 'info' },
                  { text: 'Nhắc nhở: Hạn nộp bài Văn ngày mai', time: '3 giờ trước', type: 'warning' },
                  { text: 'Kết quả thi Giữa kỳ đã được cập nhật', time: '1 ngày trước', type: 'success' },
                ].map((notif, index) => (
                  <div key={index} className="flex gap-3 items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'info' ? 'bg-blue-500' :
                        notif.type === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                    <div>
                      <p className="text-sm text-gray-700">{notif.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
