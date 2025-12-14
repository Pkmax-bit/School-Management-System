/**
 * Custom hook for Students data with React Query
 * Optimized with pagination and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { studentsApi, CreateStudentData, UpdateStudentData } from '@/lib/students-api';
import { Student } from '@/types';

const PAGE_SIZE = 20;

interface UseStudentsParams {
  page?: number;
  search?: string;
  classroom_id?: string;
  enabled?: boolean;
}

export function useStudents({ 
  page = 1, 
  search = '', 
  classroom_id,
  enabled = true 
}: UseStudentsParams = {}) {
  const queryClient = useQueryClient();
  
  const skip = (page - 1) * PAGE_SIZE;
  
  const query = useQuery({
    queryKey: queryKeys.students.list({ page, search, classroom_id }),
    queryFn: async () => {
      const result = await studentsApi.getStudents({
        skip,
        limit: PAGE_SIZE,
        search: search || undefined,
        classroom_id: classroom_id || undefined
      });
      return result;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStudentData) => studentsApi.createStudent(data),
    onSuccess: () => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentData }) => 
      studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });

  return {
    students: query.data?.data || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    
    // Pagination
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((query.data?.total || 0) / PAGE_SIZE),
    
    // Mutations
    createStudent: createMutation.mutate,
    updateStudent: updateMutation.mutate,
    deleteStudent: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

