/**
 * Lazy Route Components
 * Code splitting for better performance
 */

import dynamic from 'next/dynamic';

// Lazy load admin pages
export const StudentsPage = dynamic(() => import('./students/page'), {
  loading: () => <div>Đang tải...</div>,
});

export const TeachersPage = dynamic(() => import('./teachers/page'), {
  loading: () => <div>Đang tải...</div>,
});

export const SubjectsPage = dynamic(() => import('./subjects/page'), {
  loading: () => <div>Đang tải...</div>,
});

export const ClassroomsPage = dynamic(() => import('./classrooms/page'), {
  loading: () => <div>Đang tải...</div>,
});

export const AssignmentsPage = dynamic(() => import('./assignments/page'), {
  loading: () => <div>Đang tải...</div>,
});

// Lazy load heavy components
export const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <div>Đang tải dashboard...</div>,
});

export const StudentFormDialog = dynamic(() => import('@/components/StudentFormDialog'), {
  loading: () => <div>Đang tải form...</div>,
  ssr: false
});

