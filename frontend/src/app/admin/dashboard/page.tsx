'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';

interface UserInfo {
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function AdminDashboardPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [localStorageLoading, setLocalStorageLoading] = useState(true);

  // Get user info from localStorage (set by login page)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Admin Dashboard - User from localStorage:', parsedUser);
        setUserInfo({
          full_name: parsedUser.full_name || parsedUser.name || '',
          name: parsedUser.name || parsedUser.full_name || '',
          email: parsedUser.email || '',
          role: parsedUser.role || ''
        });
      } else {
        console.log('Admin Dashboard - No user in localStorage');
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    } finally {
      setLocalStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is admin - use localStorage user first, then fallback to hook user
    const currentUser = userInfo || (user ? {
      full_name: user.name || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || ''
    } : null);

    if (!loading && !localStorageLoading) {
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('Admin Dashboard - Redirecting, user:', currentUser);
        router.push('/dashboard');
      }
    }
  }, [user, userInfo, loading, localStorageLoading, router]);

  // Show loading while checking auth
  if (loading || localStorageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin - use localStorage user first, then fallback to hook user
  const currentUser = userInfo || (user ? {
    full_name: user.name || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || ''
  } : null);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
        <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
        <p className="text-sm text-gray-500 mt-2">Role: {currentUser?.role || 'undefined'}</p>
        <p className="text-xs text-gray-400 mt-1">User: {JSON.stringify(currentUser)}</p>
      </div>
    );
  }

  // Use userInfo from localStorage or fallback to user from hook
  const displayUser = currentUser || {
    full_name: '',
    name: '',
    email: '',
    role: 'admin'
  };

  return (
    <AdminDashboard 
      user={displayUser}
      onNavigate={(page) => router.push(`/${page}`)} 
      onLogout={logout} 
    />
  );
}

