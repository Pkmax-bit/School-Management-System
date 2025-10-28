/**
 * Finances Page
 * Trang quản lý tài chính
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export default function FinancesPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Không có quyền truy cập
        </h1>
        <p className="text-gray-600">
          Chỉ quản trị viên mới có thể truy cập trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý Tài chính
        </h1>
        <p className="text-gray-600">
          Quản lý tài chính của trường học
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          Tính năng quản lý tài chính sẽ được triển khai trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}
