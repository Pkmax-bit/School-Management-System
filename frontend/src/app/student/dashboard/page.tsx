'use client';

import { StudentDashboard } from '@/components/StudentDashboard';
import { useRouter } from 'next/navigation';

export default function StudentDashboardPage() {
  const router = useRouter();

  return (
    <StudentDashboard onNavigate={(page) => router.push(`/${page}`)} />
  );
}

