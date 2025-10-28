import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, User, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo login - in real app would validate credentials
    if (email.includes('admin')) {
      onLogin('admin');
    } else if (email.includes('teacher')) {
      onLogin('teacher');
    } else {
      onLogin('student');
    }
  };

  const quickLogin = (role: UserRole) => {
    onLogin(role);
  };

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
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Đăng nhập
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
              className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <User className="mr-2 h-4 w-4 text-blue-600" />
              Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('teacher')}
              className="w-full border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <User className="mr-2 h-4 w-4 text-green-600" />
              Giáo viên
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('student')}
              className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300"
            >
              <User className="mr-2 h-4 w-4 text-purple-600" />
              Học sinh
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Đăng ký ngay
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
