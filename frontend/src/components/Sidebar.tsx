/**
 * Sidebar Component
 * Component sidebar cho ứng dụng
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBackendAuth } from '@/hooks/useBackendAuth';

export default function Sidebar() {
  const { user } = useBackendAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: '🏠',
      roles: ['admin', 'teacher', 'student']
    },
    // Admin specific menus
    {
      title: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: '👑',
      roles: ['admin']
    },
    {
      title: 'Quản lý Giáo viên',
      href: '/admin/teachers',
      icon: '👨‍🏫',
      roles: ['admin']
    },
    {
      title: 'Quản lý Học sinh',
      href: '/admin/students',
      icon: '👨‍🎓',
      roles: ['admin']
    },
    {
      title: 'Quản lý Môn học',
      href: '/admin/subjects',
      icon: '📚',
      roles: ['admin']
    },
    {
      title: 'Quản lý Lớp học',
      href: '/admin/classrooms',
      icon: '🏫',
      roles: ['admin']
    },
    {
      title: 'Quản lý Tài chính',
      href: '/admin/finances',
      icon: '💰',
      roles: ['admin']
    },
    // Teacher specific menus
    {
      title: 'Teacher Dashboard',
      href: '/teacher/dashboard',
      icon: '👨‍🏫',
      roles: ['teacher']
    },
    {
      title: 'Lớp học của tôi',
      href: '/teacher/classrooms',
      icon: '🏫',
      roles: ['teacher']
    },
    {
      title: 'Học sinh của tôi',
      href: '/teacher/students',
      icon: '👨‍🎓',
      roles: ['teacher']
    },
    {
      title: 'Giao bài tập',
      href: '/teacher/assignments',
      icon: '📝',
      roles: ['teacher']
    },
    {
      title: 'Điểm danh',
      href: '/teacher/attendances',
      icon: '✅',
      roles: ['teacher']
    },
    // Student specific menus
    {
      title: 'Student Dashboard',
      href: '/student/dashboard',
      icon: '👨‍🎓',
      roles: ['student']
    },
    {
      title: 'Bài tập của tôi',
      href: '/student/assignments',
      icon: '📝',
      roles: ['student']
    },
    {
      title: 'Thời khóa biểu',
      href: '/student/schedules',
      icon: '📅',
      roles: ['student']
    },
    {
      title: 'Điểm danh của tôi',
      href: '/student/attendances',
      icon: '✅',
      roles: ['student']
    },
    {
      title: 'Bảng điểm',
      href: '/student/grades',
      icon: '📊',
      roles: ['student']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-lg h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">
          School Management
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {user?.name} ({user?.role})
        </p>
      </div>
      
      <nav className="mt-6">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
              pathname === item.href ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' : ''
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}