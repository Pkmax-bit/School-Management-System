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
      // Try multiple token sources (like Phuc Dat pattern)
      let token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('token');

      // Fallback to Supabase session token if no local app token
      if (!token) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            token = session.access_token;
            // Persist for consistent subsequent requests
            localStorage.setItem('auth_token', token);
            localStorage.setItem('access_token', token);
          }
        } catch (supabaseError) {
          console.warn('useApiAuth - Supabase session check failed:', supabaseError);
        }
      }

      // If still no token, try to use cached user from localStorage
      if (!token) {
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            const mapped = normalizeUser(parsed);
            console.log('useApiAuth - No token, using cached user:', mapped);
            setUser(mapped);
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.warn('useApiAuth - Error reading cached user:', cacheError);
        }
        setLoading(false);
        return;
      }

      // Try to fetch user from API with retry logic (like Phuc Dat pattern)
      let response;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          // Create AbortController for timeout (compatible with older browsers)
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 5000);
          
          response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          if (timeoutId) clearTimeout(timeoutId);

          if (response.ok) {
            const userData = await response.json();
            const mappedUserData = normalizeUser(userData);
            console.log('useApiAuth - checkUser mapped data:', mappedUserData);
            // Save user to localStorage for persistence
            localStorage.setItem('user', JSON.stringify(mappedUserData));
            setUser(mappedUserData);
            setLoading(false);
            return;
          } else if (response.status === 401 && retryCount < maxRetries) {
            // Token might be expired, try to refresh from Supabase
            console.warn(`useApiAuth - 401 Unauthorized (attempt ${retryCount + 1}/${maxRetries + 1}), trying Supabase refresh...`);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token && session.access_token !== token) {
                token = session.access_token;
                localStorage.setItem('auth_token', token);
                localStorage.setItem('access_token', token);
                retryCount++;
                continue;
              }
            } catch (refreshError) {
              console.warn('useApiAuth - Supabase refresh failed:', refreshError);
            }
            retryCount++;
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          } else {
            // Final failure or non-401 error
            break;
          }
        } catch (fetchError: any) {
          if (timeoutId) clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.warn('useApiAuth - Request timeout');
          } else {
            console.error('useApiAuth - Fetch error:', fetchError);
          }
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          break;
        }
      }

      // If API call failed, use cached user as fallback (like Phuc Dat pattern)
      console.warn('useApiAuth - /api/auth/me failed after retries:', response?.status, response?.statusText);
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          const mapped = normalizeUser(parsed);
          console.log('useApiAuth - Using cached user from localStorage as fallback:', mapped);
          setUser(mapped);
          // Don't remove token - might be a temporary network issue
          // Token will be validated on next API call
        } else {
          // Only clear if no cached user available
          console.warn('useApiAuth - No cached user available, clearing token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (cacheError) {
        console.error('useApiAuth - Error reading cached user:', cacheError);
        // Only clear tokens if we can't use cached user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      console.error('useApiAuth - Error checking user:', error);
      // On unexpected errors, try to use cached user
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          const mapped = normalizeUser(parsed);
          console.log('useApiAuth - Using cached user after error:', mapped);
          setUser(mapped);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (cacheError) {
        console.error('useApiAuth - Error reading cached user after error:', cacheError);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
        setUser(null);
      }
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
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
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
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
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
      localStorage.removeItem('user');
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
