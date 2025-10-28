/**
 * Assignments Page
 * Trang quản lý bài tập
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export default function AssignmentsPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Vui lòng đăng nhập
        </h1>
        <p className="text-gray-600">
          Bạn cần đăng nhập để truy cập trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý Bài tập
        </h1>
        <p className="text-gray-600">
          Quản lý và theo dõi bài tập
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          Tính năng quản lý bài tập sẽ được triển khai trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}