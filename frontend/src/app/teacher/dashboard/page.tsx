'use client';

import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TeacherDashboard } from '@/components/TeacherDashboard';

export default function TeacherDashboardPage() {
  const { user, loading, logout } = useTeacherAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      // Không redirect đến /dashboard để tránh vòng lặp
      // Chỉ hiển thị trang access denied
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
            <p className="text-gray-600 mb-2">Bạn không có quyền truy cập trang Teacher Dashboard.</p>
            <p className="text-sm text-gray-500 mb-6">Role hiện tại: <span className="font-semibold">{user?.role || 'Chưa đăng nhập'}</span></p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/teacher/login')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                🎓 Đăng nhập Teacher
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                🔐 Đăng nhập chung
              </button>
              
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                📝 Đăng ký tài khoản
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                🏠 Về trang chủ
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold mb-2">Thông tin đăng nhập Teacher:</p>
              <p className="text-xs text-blue-700">Email: teacher@school.com</p>
              <p className="text-xs text-blue-700">Password: teacher123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TeacherDashboard onNavigate={(page) => router.push(page.startsWith('/') ? page : `/${page}`)} onLogout={logout} user={user} />;
}

