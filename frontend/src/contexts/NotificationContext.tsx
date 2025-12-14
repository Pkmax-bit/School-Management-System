'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';

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
    teacher_name?: string;
    student_name?: string;
    student_code?: string;
    classroom_name?: string;
    classroom_grade?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    dismissNotification: (id: string) => void;
    refreshNotifications: () => Promise<void>;
    createNotification: (data: {
        recipient_type: string;
        teacher_id?: string;
        student_id?: string;
        classroom_id?: string;
        type: string;
        title: string;
        message: string;
        priority?: string;
    }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useApiAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [displayedNotifications, setDisplayedNotifications] = useState<Set<string>>(new Set());

    // Load displayed notifications from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('displayed_notifications');
            if (stored) {
                try {
                    const ids = JSON.parse(stored);
                    setDisplayedNotifications(new Set(ids));
                } catch (e) {
                    console.error('Error parsing displayed notifications:', e);
                }
            }
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        if (!user || (user.role !== 'teacher' && user.role !== 'student' && user.role !== 'admin')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            // Admin xem tất cả thông báo chưa đọc, teacher/student chỉ xem của mình
            const res = await fetch(`${API_BASE_URL}/api/notifications?read=false`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.ok) {
                const data = await res.json();
                const newNotifications = Array.isArray(data) ? data : [];
                setNotifications(newNotifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!user || (user.role !== 'teacher' && user.role !== 'student' && user.role !== 'admin')) {
            return;
        }

        // Initial load
        refreshNotifications();

        // Poll every 30 seconds
        const interval = setInterval(() => {
            refreshNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [user, refreshNotifications]);

    const markAsRead = useCallback(async (id: string) => {
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
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    const dismissNotification = useCallback((id: string) => {
        // Mark as displayed in localStorage
        const newDisplayed = new Set(displayedNotifications);
        newDisplayed.add(id);
        setDisplayedNotifications(newDisplayed);

        if (typeof window !== 'undefined') {
            localStorage.setItem('displayed_notifications', JSON.stringify(Array.from(newDisplayed)));
        }

        // Remove from notifications list
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, [displayedNotifications]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Get notifications that haven't been displayed yet
    const newNotifications = notifications.filter((n) => !displayedNotifications.has(n.id));

    const createNotification = useCallback(async (data: {
        recipient_type: string;
        teacher_id?: string;
        student_id?: string;
        classroom_id?: string;
        type: string;
        title: string;
        message: string;
        priority?: string;
    }) => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to create notification');
            }

            // Refresh notifications after creating one
            await refreshNotifications();
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }, [refreshNotifications]);

    // Clean up old displayed notifications from localStorage (older than 7 days)
    useEffect(() => {
        if (typeof window !== 'undefined' && displayedNotifications.size > 0) {
            const stored = localStorage.getItem('displayed_notifications');
            if (stored) {
                try {
                    const ids = JSON.parse(stored);
                    // Keep only recent ones (we'll let it grow naturally, but could add cleanup logic here)
                    localStorage.setItem('displayed_notifications', JSON.stringify(ids));
                } catch (e) {
                    console.error('Error cleaning displayed notifications:', e);
                }
            }
        }
    }, [displayedNotifications.size]);

    return (
        <NotificationContext.Provider
            value={{
                notifications: newNotifications, // Only return notifications that haven't been displayed
                unreadCount,
                markAsRead,
                dismissNotification,
                refreshNotifications,
                createNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

