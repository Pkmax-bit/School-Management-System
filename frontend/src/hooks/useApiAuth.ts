import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginForm, RegisterForm } from '@/types';
import { getRedirectPathByRole, normalizeUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useApiAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      let token = localStorage.getItem('auth_token');

      // Fallback to Supabase session token if no local app token
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
          // Persist for consistent subsequent requests
          localStorage.setItem('auth_token', token);
        }
      }

      if (!token) {
        // Fallback: use cached user info for display-only purposes
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            const mapped = normalizeUser(parsed);
            setUser(mapped);
          }
        } catch {}
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
        const userData = await response.json();
        const mappedUserData = normalizeUser(userData);
        console.log('useApiAuth - checkUser mapped data:', mappedUserData);
        setUser(mappedUserData);
      } else {
        console.warn('useApiAuth - /api/auth/me failed:', response.status, response.statusText);
        // Don't remove token immediately - might be a temporary network issue
        // Try to use cached user from localStorage as fallback
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            const mapped = normalizeUser(parsed);
            console.log('useApiAuth - Using cached user from localStorage:', mapped);
            setUser(mapped);
          } else {
            // Only remove token if no cached user available
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } catch (cacheError) {
          console.error('useApiAuth - Error reading cached user:', cacheError);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData: LoginForm) => {
    try {
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
        router.push(getRedirectPathByRole(userData.role));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (registerData: RegisterForm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Đăng ký thất bại');
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        const userData = normalizeUser(data.user);
        setUser(userData);
        router.push(getRedirectPathByRole(userData.role));
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      router.push('/login');
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
};
