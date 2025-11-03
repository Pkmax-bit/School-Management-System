'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isValidSupabaseConfig } from '@/lib/supabase';
import { getRedirectPathByRole, normalizeUser } from '@/lib/auth';
import { LoginPage } from '@/components/LoginPage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    // Validate form data
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      // Try Supabase auth first (only if config is valid)
      if (isValidSupabaseConfig) {
        try {
          const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (supabaseError) {
            console.log('Supabase auth error:', supabaseError);
            // Continue to backend API fallback
          } else if (data?.user) {
            // Supabase auth successful
            console.log('Supabase auth success:', data);
            
            // Get user data from database
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (userData && !userError) {
                const normalizedUser = normalizeUser(userData);
                localStorage.setItem('user', JSON.stringify(normalizedUser));
                if (data.session?.access_token) {
                  localStorage.setItem('auth_token', data.session.access_token);
                }
                router.push(getRedirectPathByRole(normalizedUser.role));
                setLoading(false);
                return;
              } else {
                // If user not found in database, still redirect to dashboard
                if (data.session?.access_token) {
                  localStorage.setItem('auth_token', data.session.access_token);
                }
                router.push('/dashboard');
                setLoading(false);
                return;
              }
            } catch (userLoadError) {
              console.log('Error loading user data:', userLoadError);
              // Still redirect even if user data load fails
              if (data.session?.access_token) {
                localStorage.setItem('auth_token', data.session.access_token);
              }
              router.push('/dashboard');
              setLoading(false);
              return;
            }
          }
        } catch (supabaseErr: any) {
          // Supabase failed (network error, etc.), try backend API
          console.log('Supabase auth failed, trying backend API:', supabaseErr);
        }
      }

      // Fallback to backend API if Supabase config is invalid or auth failed
      console.log('Trying backend API with:', { email: email.trim(), password });
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend auth success:', result);
        
        // Store token and user info
        if (result.access_token) {
          localStorage.setItem('auth_token', result.access_token);
          if (result.user) {
            const normalizedUser = normalizeUser(result.user);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            router.push(getRedirectPathByRole(normalizedUser.role));
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        console.log('Backend API error:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: 'Đăng nhập thất bại' };
        }
        console.log('Backend API error details:', errorData);
        setError(errorData.detail || `Đăng nhập thất bại: ${response.status}`);
      }
    } catch (err: any) {
      console.log('General error:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return <LoginPage onLogin={handleLogin} loading={loading} error={error} />;
}