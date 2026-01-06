import { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCircle,
  BookOpen,
  School,
  DollarSign,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Calendar,
  ClipboardCheck,
  Award,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { cn } from './ui/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function AdminSidebar({ currentPage, onNavigate, onLogout, userName, userEmail, userRole }: AdminSidebarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Get unread count from NotificationContext
  // This will work if NotificationProvider is in the component tree
  const { unreadCount = 0 } = useNotifications();

  const displayName = (userName && userName.trim()) || undefined;
  const displayEmail = (userEmail && userEmail.trim()) || undefined;
  const initial = (displayName?.charAt(0) || displayEmail?.charAt(0) || 'A').toUpperCase();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard', color: 'text-blue-600' },
    { icon: Users, label: 'Giáo viên', page: 'teachers', color: 'text-green-600' },
    { icon: UserCircle, label: 'Học sinh', page: 'students', color: 'text-purple-600' },
    { icon: BookOpen, label: 'Môn học', page: 'subjects', color: 'text-orange-600' },
    { icon: School, label: 'Lớp học', page: 'classes', color: 'text-indigo-600' },
    { icon: Building2, label: 'Cơ sở', page: 'campuses', color: 'text-teal-600' },
    { icon: Calendar, label: 'Lịch học', page: 'schedule', color: 'text-pink-600' },
    { icon: DollarSign, label: 'Tài chính', page: 'finance', color: 'text-emerald-600' },
    { icon: BarChart, label: 'Báo cáo', page: 'reports', color: 'text-cyan-600' },
    { icon: ClipboardCheck, label: 'Điểm danh', page: 'attendance', color: 'text-red-600' },
    { icon: Award, label: 'Điểm số', page: 'grades', color: 'text-yellow-600' },
    { icon: Bell, label: 'Thông báo', page: 'notifications', color: 'text-amber-600' },
    { icon: FileText, label: 'Tài liệu', page: 'documents', color: 'text-gray-600' },
    { icon: Settings, label: 'Cài đặt', page: 'settings', color: 'text-slate-600' },
  ];

  const quickActions = [
    { icon: Users, label: 'Thêm giáo viên', action: () => onNavigate('/teachers') },
    { icon: UserCircle, label: 'Thêm học sinh', action: () => onNavigate('/students') },
    { icon: School, label: 'Tạo lớp học', action: () => onNavigate('/classrooms') },
    { icon: DollarSign, label: 'Thu học phí', action: () => onNavigate('/finance') },
  ];

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
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* User Info Header */}
          {!isCollapsed && (
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName || 'Administrator'}</p>
                      <button
                        onClick={() => onNavigate('/admin/notifications')}
                        className="relative p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Thông báo"
                      >
                        <Bell className="w-4 h-4 text-gray-600" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold border-2 border-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{displayEmail || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-gray-50 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
          )}

          {/* Collapsed Header */}
          {isCollapsed && (
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400">
            {menuItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  // Map page to full path
                  const pathMap: Record<string, string> = {
                    'dashboard': '/admin/dashboard',
                    'teachers': '/teachers',
                    'students': '/students',
                    'subjects': '/subjects',
                    'classes': '/classrooms',
                    'campuses': '/campuses',
                    'schedule': '/schedule',
                    'finance': '/finance',
                    'reports': '/reports',
                    'attendance': '/admin/attendance',
                    'grades': '/grades',
                    'notifications': '/admin/notifications',
                    'documents': '/documents',
                    'settings': '/settings',
                  };
                  onNavigate(pathMap[item.page] || `/${item.page}`);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  currentPage === item.page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-200 flex-shrink-0",
                  currentPage === item.page
                    ? "text-white"
                    : "text-gray-600"
                )} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-700 mb-3">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="flex items-center gap-1.5 text-xs bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700 font-medium py-1.5 px-2 rounded-md transition-all duration-200"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Logout Button */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white hover:bg-gray-50 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 font-medium py-2 rounded-lg transition-all duration-200"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-40 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
}
