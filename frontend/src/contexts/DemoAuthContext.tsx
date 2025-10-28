/**
 * Demo Auth Context
 * Context xác thực demo không cần Supabase
 */

'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface DemoAuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

interface DemoAuthProviderProps {
  children: ReactNode;
}

// Tài khoản demo
const DEMO_ACCOUNTS = [
  {
    id: 'demo-admin',
    email: 'admin@school.com',
    password: 'admin123',
    full_name: 'Quản trị viên',
    role: 'admin',
    is_active: true
  },
  {
    id: 'demo-teacher',
    email: 'teacher@school.com',
    password: 'teacher123',
    full_name: 'Giáo viên',
    role: 'teacher',
    is_active: true
  },
  {
    id: 'demo-student',
    email: 'student@school.com',
    password: 'student123',
    full_name: 'Học sinh',
    role: 'student',
    is_active: true
  }
];

export const DemoAuthProvider = ({ children }: DemoAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user từ localStorage khi khởi động
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const account = DEMO_ACCOUNTS.find(
      acc => acc.email === email && acc.password === password
    );

    if (!account) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const userData = {
      id: account.id,
      email: account.email,
      full_name: account.full_name,
      role: account.role,
      is_active: account.is_active
    };

    // Lưu vào localStorage
    localStorage.setItem('demo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('demo_user');
    setUser(null);
  };

  return (
    <DemoAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </DemoAuthContext.Provider>
  );
};

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};
