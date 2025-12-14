import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginForm } from '@/types';
import { normalizeUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
      let token = localStorage.getItem('auth_token');
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
          localStorage.setItem('auth_token', token);
        }
      }

      if (!token) {
        // fallback: try cached user just for display
        const cached = localStorage.getItem('user');
        if (cached && cached !== 'undefined') {
          try { setUser(normalizeUser(JSON.parse(cached))); } catch { }
        }
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const me = await response.json();
        const mapped = normalizeUser(me);
        setUser(mapped);
        localStorage.setItem('user', JSON.stringify(mapped));
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
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
      // Real API login
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
        localStorage.setItem('user', JSON.stringify(userData));
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
