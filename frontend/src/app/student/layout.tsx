'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentSidebar } from '@/components/StudentSidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { Loader2 } from 'lucide-react';

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useApiAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { isCollapsed } = useSidebar();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Check if current path is login page - don't apply auth check for login
    const isLoginPage = pathname === '/student/login';

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) {
            setIsAuthorized(true);
            return;
        }

        if (!loading) {
            if (!user || user.role !== 'student') {
                router.push('/login');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router, isLoginPage]);

    // For login page, render without sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Or a custom 403 page, but the effect will redirect
    }

    // Extract current page from pathname for sidebar highlighting
    const currentPage = pathname?.split('/').pop() || 'dashboard';

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage={currentPage}
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email, role: user?.role }}
            />
            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                {children}
            </div>
        </div>
    );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <StudentLayoutContent>{children}</StudentLayoutContent>
        </SidebarProvider>
    );
}
