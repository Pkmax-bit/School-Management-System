import { useState } from 'react';
import { Button } from './ui/button';
import { 
  Home, 
  School, 
  ClipboardCheck, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Bell
} from 'lucide-react';
import { cn } from './ui/utils';

interface TeacherSidebarProps {
  currentPage?: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export function TeacherSidebar({ currentPage = 'dashboard', onNavigate, onLogout, user }: TeacherSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/teacher/dashboard',
      description: 'Tổng quan'
    },
    {
      id: 'attendance',
      label: 'Điểm danh',
      icon: ClipboardCheck,
      path: '/teacher/attendance',
      description: 'Điểm danh & Xác nhận lớp'
    },
    {
      id: 'classrooms',
      label: 'Lớp học',
      icon: School,
      path: '/classrooms',
      description: 'Quản lý lớp học'
    },
    {
      id: 'assignments',
      label: 'Bài tập',
      icon: ClipboardCheck,
      path: '/teacher/assignments',
      description: 'Tạo và chấm bài'
    },
    {
      id: 'schedule',
      label: 'Lịch dạy',
      icon: Calendar,
      path: '/schedule',
      description: 'Thời khóa biểu'
    },
    {
      id: 'students',
      label: 'Học sinh',
      icon: Users,
      path: '/students',
      description: 'Danh sách học sinh'
    },
    {
      id: 'subjects',
      label: 'Môn học',
      icon: BookOpen,
      path: '/subjects',
      description: 'Quản lý môn học'
    },
    {
      id: 'grades',
      label: 'Điểm số',
      icon: Award,
      path: '/grades',
      description: 'Chấm điểm'
    },
    {
      id: 'reports',
      label: 'Báo cáo',
      icon: BarChart3,
      path: '/reports',
      description: 'Thống kê'
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Bell,
      path: '/notifications',
      description: 'Tin nhắn'
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      path: '/settings',
      description: 'Cấu hình'
    }
  ];

  const handleNavigation = (item: typeof menuItems[0]) => {
    onNavigate(item.path);
  };

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-md border-r border-blue-200/60 shadow-xl text-slate-800 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">Teacher</h1>
              <p className="text-xs text-slate-900 font-bold">Giảng dạy</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-700 hover:text-blue-900 hover:bg-white/60"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-blue-200/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0) || 'T'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900">{user.name || 'Giáo viên'}</p>
              <p className="text-xs text-slate-700 truncate">{user.email || 'teacher@school.com'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-700/25"
                  : "text-slate-800 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-white/20" 
                  : "bg-blue-100/70 group-hover:bg-white"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive ? "text-white" : "text-blue-700 group-hover:text-blue-900"
                )} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-900 font-semibold truncate">{item.description}</p>
                </div>
              )}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
        {!isCollapsed && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-xs text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Trực tuyến</span>
            </div>
          </div>
        )}
        
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className={cn(
            "w-full bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-800 hover:text-blue-900 font-semibold py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>
      </div>
    </div>
  );
}
