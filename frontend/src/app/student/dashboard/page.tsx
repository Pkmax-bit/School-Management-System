'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StudentSidebar } from '@/components/StudentSidebar';
import { StudentDashboard } from '@/components/StudentDashboard';
import { useSidebar } from '@/contexts/SidebarContext';
import { Loader2 } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <StudentSidebar
          currentPage="dashboard"
          onNavigate={(path) => router.push(path)}
          onLogout={logout}
          user={{ name: user?.name, email: user?.email }}
        />
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
          <p className="text-sm text-gray-500 mt-2">Role: {user?.role || 'undefined'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <StudentSidebar
        currentPage="dashboard"
        onNavigate={(path) => router.push(path)}
        onLogout={logout}
        user={{ name: user?.name, email: user?.email }}
      />
      <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <StudentDashboard onNavigate={(page) => router.push(`/${page}`)} />
      </div>
    </div>
  );
}

