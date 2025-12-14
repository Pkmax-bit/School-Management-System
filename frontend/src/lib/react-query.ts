/**
 * React Query Configuration
 * Setup cho data fetching và caching
 */

import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    stats: () => [...queryKeys.students.all, 'stats'] as const,
  },
  // Teachers
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.teachers.lists(), filters] as const,
    details: () => [...queryKeys.teachers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teachers.details(), id] as const,
    stats: () => [...queryKeys.teachers.all, 'stats'] as const,
  },
  // Subjects
  subjects: {
    all: ['subjects'] as const,
    lists: () => [...queryKeys.subjects.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.subjects.lists(), filters] as const,
    details: () => [...queryKeys.subjects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subjects.details(), id] as const,
  },
  // Classrooms
  classrooms: {
    all: ['classrooms'] as const,
    lists: () => [...queryKeys.classrooms.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.classrooms.lists(), filters] as const,
    details: () => [...queryKeys.classrooms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classrooms.details(), id] as const,
  },
  // Assignments
  assignments: {
    all: ['assignments'] as const,
    lists: () => [...queryKeys.assignments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.assignments.lists(), filters] as const,
    details: () => [...queryKeys.assignments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assignments.details(), id] as const,
  },
  // Schedules
  schedules: {
    all: ['schedules'] as const,
    lists: () => [...queryKeys.schedules.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.schedules.lists(), filters] as const,
    details: () => [...queryKeys.schedules.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.schedules.details(), id] as const,
  },
  // Finances
  finances: {
    all: ['finances'] as const,
    lists: () => [...queryKeys.finances.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.finances.lists(), filters] as const,
    details: () => [...queryKeys.finances.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.finances.details(), id] as const,
  },
  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },
};

