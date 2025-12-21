/**
 * Utility functions for notification routing based on user role
 */

export function getNotificationRoute(role: string | undefined): string {
    switch (role) {
        case 'admin':
            return '/admin/notifications';
        case 'teacher':
            return '/teacher/notifications';
        case 'student':
            return '/student/notifications';
        default:
            return '/login';
    }
}

export function canAccessNotifications(role: string | undefined): boolean {
    return role === 'admin' || role === 'teacher' || role === 'student';
}

