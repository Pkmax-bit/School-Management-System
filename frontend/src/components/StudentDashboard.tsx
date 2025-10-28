import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clipboard, ClipboardCheck, Award, Calendar, BookOpen, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Học tập và theo dõi tiến độ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bài tập chưa làm"
          value={5}
          icon={Clipboard}
          color="red"
        />
        <StatCard
          title="Bài tập đã nộp"
          value={12}
          icon={ClipboardCheck}
          color="green"
        />
        <StatCard
          title="Điểm trung bình"
          value={8.5}
          icon={Award}
          color="indigo"
        />
        <StatCard
          title="Lịch học hôm nay"
          value={3}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl mb-4">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('assignments')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clipboard className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="mb-1">Bài tập</h3>
              <p className="text-2xl text-red-600">5</p>
              <p className="text-xs text-gray-500 mt-1">Chưa hoàn thành</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('schedule')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="mb-1">Lịch học</h3>
              <p className="text-2xl text-purple-600">3</p>
              <p className="text-xs text-gray-500 mt-1">Buổi học hôm nay</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('grades')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="mb-1">Kết quả</h3>
              <p className="text-2xl text-indigo-600">8.5</p>
              <p className="text-xs text-gray-500 mt-1">Điểm trung bình</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('documents')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-1">Tài liệu</h3>
              <p className="text-2xl text-blue-600">24</p>
              <p className="text-xs text-gray-500 mt-1">Tài liệu mới</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule and Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lịch học hôm nay</CardTitle>
            <CardDescription>Chủ nhật, 26 Tháng 10, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '07:00 - 08:30', subject: 'Toán học', teacher: 'Nguyễn Văn An', room: 'Phòng 101', status: 'upcoming' },
                { time: '08:45 - 10:15', subject: 'Văn học', teacher: 'Trần Thị Bình', room: 'Phòng 201', status: 'upcoming' },
                { time: '10:30 - 12:00', subject: 'Tiếng Anh', teacher: 'Lê Văn Cường', room: 'Phòng 301', status: 'upcoming' },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="truncate">{schedule.subject}</p>
                      <Badge variant="outline" className="text-xs">{schedule.room}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{schedule.time} • {schedule.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bài tập cần làm</CardTitle>
            <CardDescription>Bài tập sắp đến hạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Bài tập Chương 1: Hàm số', subject: 'Toán học', deadline: '27/10/2025', status: 'pending', priority: 'high' },
                { title: 'Viết bài luận về văn học Việt Nam', subject: 'Văn học', deadline: '28/10/2025', status: 'pending', priority: 'medium' },
                { title: 'Bài tập Ngữ pháp Unit 5', subject: 'Tiếng Anh', deadline: '29/10/2025', status: 'pending', priority: 'low' },
              ].map((assignment, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="mb-1">{assignment.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{assignment.subject}</Badge>
                        <Badge 
                          className={`text-xs ${
                            assignment.priority === 'high' 
                              ? 'bg-red-100 text-red-600 hover:bg-red-100' 
                              : assignment.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-100'
                              : 'bg-green-100 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {assignment.priority === 'high' ? 'Khẩn cấp' : assignment.priority === 'medium' ? 'Trung bình' : 'Bình thường'}
                        </Badge>
                      </div>
                    </div>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Hạn nộp: {assignment.deadline}</p>
                    <Button size="sm">Làm bài</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kết quả học tập</CardTitle>
            <CardDescription>Điểm số các môn học</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: 'Toán học', grade: 8.5, maxGrade: 10, color: 'bg-blue-500' },
                { subject: 'Văn học', grade: 8.0, maxGrade: 10, color: 'bg-green-500' },
                { subject: 'Tiếng Anh', grade: 9.0, maxGrade: 10, color: 'bg-purple-500' },
                { subject: 'Vật lý', grade: 7.5, maxGrade: 10, color: 'bg-yellow-500' },
                { subject: 'Hóa học', grade: 8.8, maxGrade: 10, color: 'bg-red-500' },
              ].map((subject, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{subject.subject}</span>
                    <span>{subject.grade}/{subject.maxGrade}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${subject.color}`} 
                      style={{ width: `${(subject.grade / subject.maxGrade) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bài tập đã hoàn thành</CardTitle>
            <CardDescription>Lịch sử nộp bài gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Kiểm tra 15 phút: Đạo hàm', subject: 'Toán học', grade: 9.0, date: '20/10/2025' },
                { title: 'Bài tập về nhà Chương 3', subject: 'Văn học', grade: 8.5, date: '18/10/2025' },
                { title: 'Bài tập Listening Unit 4', subject: 'Tiếng Anh', grade: 9.5, date: '15/10/2025' },
              ].map((assignment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{assignment.title}</p>
                    <p className="text-xs text-gray-500">{assignment.subject} • {assignment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600">{assignment.grade}</p>
                    <p className="text-xs text-gray-500">Điểm</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

