import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, User, Lock, AlertCircle, BookOpen } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function LoginPage({ onLogin, loading = false, error: externalError }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      await onLogin(email, password);
    } catch (error: any) {
      setError(error.message || 'Đăng nhập thất bại');
    }
  };

  // Quick login với tài khoản demo
  const demoAccounts: Record<UserRole, { email: string; password: string }> = {
    admin: { email: 'admin@school.com', password: 'password123' },
    teacher: { email: 'teacher@school.com', password: 'teacher123' },
    student: { email: 'student@school.com', password: 'student123' },
  };

  const quickLogin = async (role: UserRole) => {
    const account = demoAccounts[role];
    if (account && account.email) {
      setEmail(account.email);
      setPassword(account.password);
      setError('');
      try {
        await onLogin(account.email, account.password);
      } catch (error: any) {
        setError(error.message || 'Đăng nhập thất bại');
      }
    }
  };

  const displayError = externalError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl text-black">Hệ thống quản lý trường học</CardTitle>
            <CardDescription className="text-black">Đăng nhập để tiếp tục</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{displayError}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@school.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-black"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-black"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc đăng nhập nhanh</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              onClick={() => quickLogin('admin')}
              disabled={loading}
              className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 p-4 h-auto"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="font-medium">Admin</span>
                </div>
                <div className="text-left text-xs text-gray-600">
                  <div>📧 {demoAccounts.admin.email}</div>
                  <div>🔒 {demoAccounts.admin.password}</div>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('teacher')}
              disabled={loading}
              className="w-full border-2 border-green-300 hover:bg-green-50 hover:border-green-400 p-5 h-auto bg-gradient-to-r from-green-50 to-emerald-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-base text-gray-900">Giáo viên</div>
                    <div className="text-xs text-gray-500">Teacher Account</div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-700 bg-white/80 px-3 py-2 rounded-md border border-green-200">
                  <div className="font-mono font-semibold mb-1">{demoAccounts.teacher.email}</div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span className="font-mono">{demoAccounts.teacher.password}</span>
                  </div>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('student')}
              disabled={loading}
              className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 p-4 h-auto"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-purple-600" />
                  <span className="font-medium">Học sinh</span>
                </div>
                <div className="text-left text-xs text-gray-600">
                  <div>📧 {demoAccounts.student.email}</div>
                  <div>🔒 {demoAccounts.student.password}</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
