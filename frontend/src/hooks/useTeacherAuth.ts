import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginForm } from '@/types';
import { normalizeUser } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useTeacherAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // For teacher dashboard, we'll use a mock teacher user
      // In production, this would call the actual API
      const mockTeacherUser = {
        id: 'teacher-user-id',
        email: 'teacher@school.com',
        full_name: 'Nguyen Van Giao',
        role: 'teacher',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mappedUserData = normalizeUser(mockTeacherUser);
      console.log('useTeacherAuth - Mock teacher data:', mappedUserData);
      setUser(mappedUserData);
    } catch (error) {
      console.error('Error checking teacher user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData: LoginForm) => {
    try {
      // For development, accept any teacher login
      if (loginData.email.includes('teacher') || loginData.email === 'teacher@school.com') {
        const mockTeacherUser = {
          id: 'teacher-user-id',
          email: loginData.email,
          full_name: 'Nguyen Van Giao',
          role: 'teacher',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        localStorage.setItem('auth_token', 'mock-teacher-token');
        const userData = normalizeUser(mockTeacherUser);
        setUser(userData);
        router.push('/teacher/dashboard');
        return;
      }

      // Try real API login
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Đăng nhập thất bại');
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        const userData = normalizeUser(data.user);
        setUser(userData);
        router.push('/teacher/dashboard');
      }
    } catch (error) {
      console.error('Teacher login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);
      router.push('/teacher/login');
    } catch (error) {
      console.error('Teacher logout failed:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
  };
};
