import { StatCard } from './StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { School, Users, Clipboard, Calendar, ClipboardCheck, Award, BookOpen, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Quản lý lớp học và giảng dạy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Lớp học của tôi"
          value={3}
          icon={School}
          color="green"
        />
        <StatCard
          title="Học sinh của tôi"
          value={75}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Bài tập chưa chấm"
          value={12}
          icon={Clipboard}
          color="yellow"
        />
        <StatCard
          title="Lịch dạy hôm nay"
          value={4}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl mb-4">Công việc hôm nay</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('my-classes')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <School className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="mb-1">Lớp học</h3>
              <p className="text-2xl text-green-600">3</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('assignments')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clipboard className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="mb-1">Bài tập mới</h3>
              <p className="text-2xl text-yellow-600">12</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('attendance')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-1">Điểm danh</h3>
              <p className="text-2xl text-blue-600">2</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('grading')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="mb-1">Chấm điểm</h3>
              <p className="text-2xl text-purple-600">8</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule and Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lịch dạy hôm nay</CardTitle>
            <CardDescription>Chủ nhật, 26 Tháng 10, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '07:00 - 08:30', subject: 'Toán học', class: '10A1', room: 'Phòng 101', status: 'upcoming' },
                { time: '08:45 - 10:15', subject: 'Toán học', class: '10A2', room: 'Phòng 102', status: 'upcoming' },
                { time: '10:30 - 12:00', subject: 'Toán học', class: '11B1', room: 'Phòng 103', status: 'upcoming' },
                { time: '13:30 - 15:00', subject: 'Toán học', class: '11B2', room: 'Phòng 104', status: 'upcoming' },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="truncate">{schedule.subject}</p>
                      <Badge variant="outline" className="text-xs">{schedule.class}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{schedule.time} • {schedule.room}</p>
                  </div>
                  <Button size="sm" variant="outline">Bắt đầu</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lớp học của tôi</CardTitle>
            <CardDescription>Danh sách lớp đang giảng dạy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: '10A1', subject: 'Toán học', students: 30, avgGrade: 8.2 },
                { name: '10A2', subject: 'Toán học', students: 28, avgGrade: 7.8 },
                { name: '11B1', subject: 'Toán học', students: 17, avgGrade: 8.5 },
              ].map((classItem, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <School className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3>{classItem.name}</h3>
                        <p className="text-xs text-gray-500">{classItem.subject}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-600 hover:bg-green-100">
                      {classItem.students} học sinh
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs mb-1">Điểm TB</p>
                      <p>{classItem.avgGrade}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Chi tiết</Button>
                      <Button size="sm">Điểm danh</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Bài tập cần chấm</CardTitle>
          <CardDescription>Bài tập học sinh đã nộp chờ chấm điểm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Bài tập Chương 1: Hàm số', class: '10A1', submitted: 28, total: 30, deadline: '25/10/2025' },
              { title: 'Kiểm tra 15 phút: Đạo hàm', class: '10A2', submitted: 25, total: 28, deadline: '24/10/2025' },
              { title: 'Bài tập Chương 2: Lượng giác', class: '11B1', submitted: 15, total: 17, deadline: '26/10/2025' },
            ].map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{assignment.title}</h4>
                    <Badge variant="outline" className="text-xs">{assignment.class}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {assignment.submitted}/{assignment.total} học sinh đã nộp • Hạn: {assignment.deadline}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }} 
                    />
                  </div>
                </div>
                <Button className="ml-4">Chấm điểm</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

