'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import RoleBasedRouteGuard from '@/components/auth/RoleBasedRouteGuard';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminDashboardPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  const displayUser = user
    ? {
        full_name: (user as any).full_name || user.name || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      }
    : undefined;

  return (
    <RoleBasedRouteGuard user={user} loading={loading} allowedRoles={['admin']}>
      <AdminDashboard
        user={displayUser}
        onNavigate={(page) => router.push(page.startsWith('/') ? page : `/${page}`)}
        onLogout={logout}
      />
    </RoleBasedRouteGuard>
  );
}
