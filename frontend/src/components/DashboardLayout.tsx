import { ReactNode, useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  FileText,
  Calendar,
  ClipboardCheck,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  UserCircle,
  Clipboard,
  Award,
} from 'lucide-react';
import { UserRole } from '../types';
import { cn } from './ui/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function DashboardLayout({ children, role, currentPage, onNavigate, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
          { icon: Users, label: 'Giáo viên', page: 'teachers' },
          { icon: UserCircle, label: 'Học sinh', page: 'students' },
          { icon: BookOpen, label: 'Môn học', page: 'subjects' },
          { icon: School, label: 'Lớp học', page: 'classes' },
          { icon: DollarSign, label: 'Tài chính', page: 'finance' },
          { icon: BarChart, label: 'Báo cáo', page: 'reports' },
          { icon: Settings, label: 'Cài đặt', page: 'settings' },
        ];
      case 'teacher':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
          { icon: School, label: 'Lớp học của tôi', page: 'my-classes' },
          { icon: Clipboard, label: 'Bài tập', page: 'assignments' },
          { icon: Calendar, label: 'Lịch dạy', page: 'schedule' },
          { icon: ClipboardCheck, label: 'Điểm danh', page: 'attendance' },
          { icon: Award, label: 'Chấm điểm', page: 'grading' },
          { icon: Settings, label: 'Cài đặt', page: 'settings' },
        ];
      case 'student':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
          { icon: Clipboard, label: 'Bài tập', page: 'assignments' },
          { icon: Calendar, label: 'Lịch học', page: 'schedule' },
          { icon: ClipboardCheck, label: 'Điểm danh', page: 'attendance' },
          { icon: Award, label: 'Kết quả học tập', page: 'grades' },
          { icon: FileText, label: 'Tài liệu', page: 'documents' },
          { icon: Settings, label: 'Cài đặt', page: 'settings' },
        ];
      default:
        return [];
    }
  };

  const getRoleName = () => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giáo viên';
      case 'student':
        return 'Học sinh';
      default:
        return '';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-blue-600';
      case 'teacher':
        return 'bg-green-600';
      case 'student':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const menuItems = getMenuItems();

  return (
        <div className="min-h-screen bg-white">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getRoleColor())}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">School System</h1>
              <p className="text-xs text-gray-500">{getRoleName()}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  currentPage === item.page
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Avatar>
                <AvatarFallback className={getRoleColor()}>
                  {getRoleName().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {role === 'admin' && 'Admin User'}
                  {role === 'teacher' && 'Nguyễn Văn An'}
                  {role === 'student' && 'Nguyễn Thị Lan'}
                </p>
                <p className="text-xs text-gray-500 truncate">{getRoleName()}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getRoleColor())}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold">School System</h1>
                    <p className="text-xs text-gray-500">{getRoleName()}</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      onNavigate(item.page);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      currentPage === item.page
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* User profile */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Avatar>
                    <AvatarFallback className={getRoleColor()}>
                      {getRoleName().charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {role === 'admin' && 'Admin User'}
                      {role === 'teacher' && 'Nguyễn Văn An'}
                      {role === 'student' && 'Nguyễn Thị Lan'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{getRoleName()}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 bg-white border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getRoleColor())}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span>School System</span>
            </div>
            <div className="w-6" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
