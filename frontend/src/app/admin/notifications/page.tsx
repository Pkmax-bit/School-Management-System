'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { PageWithBackground } from '@/components/PageWithBackground';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Bell, 
    Plus, 
    Search, 
    Filter,
    CheckCircle2,
    Circle,
    AlertCircle,
    AlertTriangle,
    Info,
    Clock,
    Users,
    User,
    School,
    Loader2,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';
import { CreateNotificationModal } from '@/components/notifications/CreateNotificationModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDateLocal } from '@/lib/date-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Notification {
    id: string;
    recipient_type: string;
    teacher_id?: string;
    student_id?: string;
    classroom_id?: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    read: boolean;
    created_at: string;
    updated_at?: string;
    teacher_name?: string;
    student_name?: string;
    student_code?: string;
    classroom_name?: string;
    classroom_grade?: string;
}

export default function AdminNotificationsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterRecipient, setFilterRecipient] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === id ? { ...n, read: true } : n)
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter(notification => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    notification.title.toLowerCase().includes(query) ||
                    notification.message.toLowerCase().includes(query) ||
                    notification.teacher_name?.toLowerCase().includes(query) ||
                    notification.student_name?.toLowerCase().includes(query) ||
                    notification.classroom_name?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Read filter
            if (filterRead === 'read' && !notification.read) return false;
            if (filterRead === 'unread' && notification.read) return false;

            // Priority filter
            if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;

            // Recipient type filter
            if (filterRecipient !== 'all' && notification.recipient_type !== filterRecipient) return false;

            return true;
        });
    }, [notifications, searchQuery, filterRead, filterPriority, filterRecipient]);

    const stats = useMemo(() => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.read).length;
        const urgent = notifications.filter(n => n.priority === 'urgent' && !n.read).length;
        const teacherNotifications = notifications.filter(n => n.recipient_type === 'teacher').length;
        const studentNotifications = notifications.filter(n => n.recipient_type === 'student').length;

        return { total, unread, urgent, teacherNotifications, studentNotifications };
    }, [notifications]);

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'high':
                return <AlertTriangle className="w-4 h-4 text-orange-600" />;
            case 'normal':
                return <Info className="w-4 h-4 text-blue-600" />;
            case 'low':
                return <Circle className="w-4 h-4 text-gray-600" />;
            default:
                return <Bell className="w-4 h-4 text-gray-600" />;
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'Khẩn cấp';
            case 'high':
                return 'Cao';
            case 'normal':
                return 'Bình thường';
            case 'low':
                return 'Thấp';
            default:
                return priority;
        }
    };

    if (authLoading || loading) {
        return (
            <PageWithBackground>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </PageWithBackground>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <PageWithBackground>
            <div className="flex min-h-screen">
                <AdminSidebar 
                    currentPage="notifications" 
                    onNavigate={(page) => router.push(page.startsWith('/') ? page : `/${page}`)} 
                    onLogout={logout}
                    userName={user?.name}
                    userEmail={user?.email}
                />
                
                <div className={`flex-1 min-h-screen flex flex-col p-4 lg:p-6 overflow-y-auto transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg mb-4 lg:mb-6">
                                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Quản lý Thông báo</h1>
                                <p className="text-amber-100 text-sm lg:text-lg">Tạo và quản lý thông báo cho giáo viên và học sinh</p>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
                            <Card className="card-transparent border-l-4 border-l-blue-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Tổng thông báo</p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                                {stats.total}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Bell className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card-transparent border-l-4 border-l-red-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Chưa đọc</p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                                                {stats.unread}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Circle className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card-transparent border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Khẩn cấp</p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                                                {stats.urgent}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <AlertCircle className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card-transparent border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Giáo viên</p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                                                {stats.teacherNotifications}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card-transparent border-l-4 border-l-purple-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Học sinh</p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                                                {stats.studentNotifications}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search and Filters */}
                        <Card className="card-transparent mb-6 flex-shrink-0">
                            <CardHeader className="card-transparent-header">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-gray-900">Danh sách Thông báo</CardTitle>
                                        <p className="text-sm text-gray-600">Tổng số {filteredNotifications.length} thông báo</p>
                                    </div>
                                    <Button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo thông báo mới
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Tìm kiếm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Trạng thái đọc" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="unread">Chưa đọc</SelectItem>
                                            <SelectItem value="read">Đã đọc</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Mức độ ưu tiên" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="urgent">Khẩn cấp</SelectItem>
                                            <SelectItem value="high">Cao</SelectItem>
                                            <SelectItem value="normal">Bình thường</SelectItem>
                                            <SelectItem value="low">Thấp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterRecipient} onValueChange={setFilterRecipient}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Loại người nhận" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="teacher">Giáo viên</SelectItem>
                                            <SelectItem value="student">Học sinh</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications List */}
                        <Card className="card-transparent flex-1">
                            <CardContent className="p-6">
                                {filteredNotifications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg">Không có thông báo nào</p>
                                        <p className="text-gray-500 text-sm mt-2">
                                            {searchQuery || filterRead !== 'all' || filterPriority !== 'all' || filterRecipient !== 'all'
                                                ? 'Thử thay đổi bộ lọc để xem thêm thông báo'
                                                : 'Tạo thông báo mới để bắt đầu'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredNotifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                                                    notification.read
                                                        ? 'bg-gray-50 border-gray-200'
                                                        : 'bg-white border-amber-200 shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            {getPriorityIcon(notification.priority)}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className={`text-lg font-bold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                                        {notification.title}
                                                                    </h3>
                                                                    {!notification.read && (
                                                                        <Badge className="bg-amber-500 text-white">Mới</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-600 mb-3">{notification.message}</p>
                                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                                    <div className="flex items-center gap-1">
                                                                        {notification.recipient_type === 'teacher' ? (
                                                                            <>
                                                                                <User className="w-4 h-4" />
                                                                                <span>Giáo viên: {notification.teacher_name || 'N/A'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Users className="w-4 h-4" />
                                                                                <span>Học sinh: {notification.student_name || 'N/A'}</span>
                                                                                {notification.student_code && (
                                                                                    <span className="text-gray-400">({notification.student_code})</span>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {notification.classroom_name && (
                                                                        <div className="flex items-center gap-1">
                                                                            <School className="w-4 h-4" />
                                                                            <span>{notification.classroom_name}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span>
                                                                            {formatDateLocal(notification.created_at, 'dd/MM/yyyy HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getPriorityBadgeColor(notification.priority)}>
                                                            {getPriorityLabel(notification.priority)}
                                                        </Badge>
                                                        {!notification.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Đánh dấu đã đọc
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <CreateNotificationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchNotifications();
                }}
            />
        </PageWithBackground>
    );
}
