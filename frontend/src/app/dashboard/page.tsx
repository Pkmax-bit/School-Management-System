/**
 * Dashboard Page
 * Trang dashboard chính - redirect to role-specific dashboards
 */

'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRedirectPathByRole } from '@/lib/auth';

export default function DashboardPage() {
  const { user, loading } = useApiAuth();
  const router = useRouter();

  useEffect(() => {
    // Try to get user from localStorage first (set by login page)
    let currentRole = user?.role || '';
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        currentRole = parsedUser.role || currentRole;
        console.log('Main Dashboard - User from localStorage:', parsedUser);
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
    
    console.log('Main Dashboard - User check:', { user, loading, role: currentRole });
    if (!loading) {
      if (currentRole) {
        const path = getRedirectPathByRole(currentRole);
        console.log('Main Dashboard - Redirecting to', path);
        router.push(path);
      } else if (!user) {
        // No user and no role, redirect to login
        router.push('/login');
      }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Chào mừng đến với Hệ thống Quản lý Trường học
          </h1>
          <p className="text-gray-600 mb-8">
            Vui lòng đăng nhập để tiếp tục
          </p>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  // This should not be reached due to redirect logic above
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}