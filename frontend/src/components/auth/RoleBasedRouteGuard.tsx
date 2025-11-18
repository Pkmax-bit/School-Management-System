'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { NormalizedRole, normalizeRole } from '@/lib/auth';

interface RoleBasedRouteGuardProps {
  user: User | null;
  loading: boolean;
  allowedRoles?: NormalizedRole[];
  fallbackPath?: string;
  title?: string;
  description?: string;
  unauthorizedTitle?: string;
  unauthorizedDescription?: string;
  children: ReactNode;
}

export function RoleBasedRouteGuard({
  user,
  loading,
  allowedRoles,
  fallbackPath = '/dashboard',
  title = 'Đang xác thực',
  description = 'Vui lòng đợi trong giây lát…',
  unauthorizedTitle = 'Không có quyền truy cập',
  unauthorizedDescription = 'Tài khoản của bạn không đủ quyền để truy cập trang này.',
  children,
}: RoleBasedRouteGuardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-center text-gray-600">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <div>
          <p className="text-lg font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 text-center px-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">Phiên đăng nhập không hợp lệ</p>
          <p className="text-gray-600">Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.</p>
        </div>
        <Button onClick={() => router.push('/login')} className="px-6">
          Đến trang đăng nhập
        </Button>
      </div>
    );
  }

  const normalizedRole = normalizeRole(user.role);
  const isAllowed =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    allowedRoles.includes(normalizedRole);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 text-center px-4">
        <AlertCircle className="h-16 w-16 text-amber-500" />
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">{unauthorizedTitle}</p>
          <p className="text-gray-600">
            {unauthorizedDescription}{' '}
            <span className="font-medium">Role hiện tại: {normalizedRole || 'unknown'}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(fallbackPath)} className="px-6">
          Quay về trang chính
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export default RoleBasedRouteGuard;
