/**
 * Attendances Page
 * Trang quản lý điểm danh - Redirect to role-specific pages
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';

export default function AttendancesPage() {
  const { user, loading } = useApiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin/attendance');
      } else if (user.role === 'teacher') {
        router.push('/teacher/attendance');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
