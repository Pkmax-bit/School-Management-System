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
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from './ui/utils';
import { useSidebar } from '@/contexts/SidebarContext';

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
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      label: 'Quản lý Bài tập',
      icon: ClipboardCheck,
      path: 'http://localhost:3000/assignments',
      description: 'Quản lý tất cả bài tập'
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
    setIsMobileOpen(false); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 shadow-lg text-gray-800 transition-all duration-300 ease-in-out fixed left-0 top-0 h-full z-50",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">Teacher</h1>
              <p className="text-xs text-gray-500">Giảng dạy</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">
                {(user.name?.charAt(0) || user.email?.charAt(0) || 'T').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800">{user.name || 'Giáo viên'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-all duration-200 flex-shrink-0",
                isActive ? "text-white" : "text-gray-600"
              )} />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                </div>
              )}
              {isCollapsed && (
                <div className="absolute left-16 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className={cn(
            "w-full bg-white hover:bg-gray-50 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 font-medium py-2 rounded-lg transition-all duration-200",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>
      </div>
      </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-40 lg:hidden bg-white/90 backdrop-blur-sm shadow-lg border-blue-200"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
}
