'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    X,
    AlertCircle,
    Info,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    School,
    Eye,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { formatDateLocal } from '@/lib/date-utils';
import { getNotificationRoute } from '@/lib/notification-routes';

export function NotificationToast() {
    const { notifications, dismissNotification, markAsRead } = useNotifications();
    const { user } = useApiAuth();
    const router = useRouter();
    const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Use ref to store latest dismissNotification to avoid dependency issues
    const dismissNotificationRef = useRef(dismissNotification);
    useEffect(() => {
        dismissNotificationRef.current = dismissNotification;
    }, [dismissNotification]);

    const handleDismiss = useCallback((id: string) => {
        setIsVisible(false);
        // Wait for animation to complete
        setTimeout(() => {
            dismissNotificationRef.current(id);
            setCurrentNotification(null);
        }, 300);
    }, []); // No dependencies needed since we use ref

    const handleMarkAsRead = useCallback(async (id: string) => {
        await markAsRead(id);
        handleDismiss(id);
    }, [markAsRead, handleDismiss]);

    // Show first unread notification (only one at a time)
    // Use notification IDs string to track changes without causing dependency issues
    const notificationIds = notifications.map(n => n.id).join(',');

    useEffect(() => {
        if (notifications.length > 0 && !currentNotification && !isVisible) {
            // Sort by priority and created_at, show highest priority first
            const sorted = [...notifications].sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
                    (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            const firstNotification = sorted[0];
            if (firstNotification) {
                setCurrentNotification(firstNotification);
                setIsVisible(true);

                // Auto dismiss after 5 seconds
                const timer = setTimeout(() => {
                    handleDismiss(firstNotification.id);
                }, 5000);

                return () => clearTimeout(timer);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notificationIds, currentNotification?.id, isVisible]);

    if (!currentNotification || !isVisible) {
        return null;
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-500 bg-red-50';
            case 'high':
                return 'border-orange-500 bg-orange-50';
            case 'normal':
                return 'border-blue-500 bg-blue-50';
            case 'low':
                return 'border-gray-500 bg-gray-50';
            default:
                return 'border-blue-500 bg-blue-50';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'high':
                return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'normal':
                return <Info className="w-5 h-5 text-blue-600" />;
            case 'low':
                return <CheckCircle className="w-5 h-5 text-gray-600" />;
            default:
                return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'attendance_request':
                return <Clock className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 transition-all duration-300',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            )}
        >
            <Card className={cn('w-full max-w-md shadow-lg border-2', getPriorityColor(currentNotification.priority))}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getPriorityIcon(currentNotification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-800 text-sm">
                                            {currentNotification.title}
                                        </h4>
                                        {currentNotification.type === 'attendance_request' && (
                                            <Badge variant="secondary" className="text-xs">
                                                {getTypeIcon(currentNotification.type)}
                                                <span className="ml-1">Điểm danh</span>
                                            </Badge>
                                        )}
                                    </div>
                                    {(currentNotification.teacher_name || currentNotification.classroom_name) && (
                                        <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                                            {currentNotification.teacher_name && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {currentNotification.teacher_name}
                                                </span>
                                            )}
                                            {currentNotification.classroom_name && (
                                                <span className="flex items-center gap-1">
                                                    <School className="w-3 h-3" />
                                                    {currentNotification.classroom_name}
                                                    {currentNotification.classroom_grade && ` - Khối ${currentNotification.classroom_grade}`}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        {currentNotification.message}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 flex-shrink-0"
                                    onClick={() => handleDismiss(currentNotification.id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => handleMarkAsRead(currentNotification.id)}
                                >
                                    Đã xem
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        handleDismiss(currentNotification.id);
                                        const route = getNotificationRoute(user?.role);
                                        router.push(route);
                                    }}
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Xem tất cả
                                </Button>
                                <span className="text-xs text-slate-500">
                                    {formatDateLocal(currentNotification.created_at, 'HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

