/**
 * Header Component
 * Component header cho ứng dụng
 */

'use client';

import { useBackendAuth } from '@/hooks/useBackendAuth';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Header() {
  const { user, logout } = useBackendAuth();
  const { isCollapsed } = useSidebar();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className={`bg-white shadow-sm border-b transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Chào mừng, {user?.name}!
          </h2>
          <p className="text-sm text-gray-600">
            Vai trò: {user?.role === 'admin' ? 'Quản trị viên' :
                     user?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}