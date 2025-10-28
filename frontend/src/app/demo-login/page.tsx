/**
 * Demo Login Page
 * Trang đăng nhập demo không cần Supabase
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Tài khoản demo
const DEMO_ACCOUNTS = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
    name: 'Quản trị viên'
  },
  {
    email: 'teacher@school.com', 
    password: 'teacher123',
    role: 'teacher',
    name: 'Giáo viên'
  },
  {
    email: 'student@school.com',
    password: 'student123', 
    role: 'student',
    name: 'Học sinh'
  }
];

export default function DemoLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Tìm tài khoản phù hợp
    const account = DEMO_ACCOUNTS.find(
      acc => acc.email === formData.email && acc.password === formData.password
    );

    if (account) {
      // Lưu thông tin user vào localStorage
      localStorage.setItem('demo_user', JSON.stringify({
        id: 'demo-' + account.role,
        email: account.email,
        full_name: account.name,
        role: account.role,
        is_active: true
      }));
      
      // Chuyển đến dashboard
      router.push('/dashboard');
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }
    
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Demo Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đăng nhập với tài khoản demo
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tài khoản demo:</h3>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email} className="bg-gray-100 p-3 rounded-md">
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-gray-600">Email: {account.email}</p>
                <p className="text-sm text-gray-600">Mật khẩu: {account.password}</p>
                <button
                  type="button"
                  onClick={() => setFormData({
                    email: account.email,
                    password: account.password
                  })}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Sử dụng tài khoản này
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
