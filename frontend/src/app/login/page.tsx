'use client';

import { useState } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginPage } from '@/components/LoginPage';

export default function Login() {
  const { login, loading } = useApiAuth();
  const router = useRouter();

  const handleLogin = async (role: 'admin' | 'teacher' | 'student') => {
    try {
      // Demo login - trong thực tế sẽ validate credentials
      await login({
        email: `${role}@school.com`,
        password: 'password123'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <LoginPage onLogin={handleLogin} />;
}