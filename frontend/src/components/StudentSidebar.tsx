import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Home,
    BookOpen,
    ClipboardCheck,
    Calendar,
    Award,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    School,
    User,
    Bell
} from 'lucide-react';
import { cn } from './ui/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface StudentSidebarProps {
    currentPage?: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    user?: {
        name?: string;
        email?: string;
        role?: string;
    };
}

export function StudentSidebar({ currentPage = 'dashboard', onNavigate, onLogout, user }: StudentSidebarProps) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    
    // Get unread count from NotificationContext
    // This will work if NotificationProvider is in the component tree
    const { unreadCount = 0 } = useNotifications();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Trang chủ',
            icon: Home,
            path: '/student/dashboard',
            description: 'Tổng quan'
        },
        {
            id: 'lessons',
            label: 'Bài học',
            icon: BookOpen,
            path: '/student/lessons',
            description: 'Xem bài học'
        },
        {
            id: 'assignments',
            label: 'Bài tập',
            icon: ClipboardCheck,
            path: '/student/assignments',
            description: 'Làm bài tập'
        },
        {
            id: 'classroom',
            label: 'Lớp học',
            icon: School,
            path: '/student/classroom',
            description: 'Thông tin lớp'
        },
        {
            id: 'schedule',
            label: 'Lịch học',
            icon: Calendar,
            path: '/student/schedule',
            description: 'Thời khóa biểu'
        },
        {
            id: 'grades',
            label: 'Kết quả',
            icon: Award,
            path: '/student/grades',
            description: 'Điểm số'
        },
        {
            id: 'profile',
            label: 'Hồ sơ',
            icon: User,
            path: '/student/profile',
            description: 'Thông tin cá nhân'
        },
        {
            id: 'settings',
            label: 'Cài đặt',
            icon: Settings,
            path: '/student/settings',
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
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-white font-bold text-sm">S</span>
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg text-gray-800">Student</h1>
                                    <p className="text-xs text-gray-500">Học sinh</p>
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
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white font-semibold text-sm">
                                        {(user.name?.charAt(0) || user.email?.charAt(0) || 'S').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold truncate text-gray-800">{user.name || 'Học sinh'}</p>
                                        <button
                                            onClick={() => {
                                                // Student có thể xem notifications qua toast hoặc có thể tạo trang riêng
                                                // Tạm thời chỉ hiển thị icon
                                            }}
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
                                    <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {isCollapsed && user && (
                        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 flex justify-center">
                            <button
                                onClick={() => {
                                    // Student có thể xem notifications qua toast
                                }}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Thông báo"
                            >
                                <Bell className="w-5 h-5 text-gray-600" />
                                {unreadCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold border-2 border-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                )}
                            </button>
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
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
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
