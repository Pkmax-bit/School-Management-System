'use client';

import { useState } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, User, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function TeacherLoginPage() {
  const { login, loading } = useTeacherAuth();
  const router = useRouter();
  const [email, setEmail] = useState('teacher@school.com');
  const [password, setPassword] = useState('teacher123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login({ email, password });
      // Redirect will be handled by useApiAuth hook
    } catch (error: any) {
      setError(error.message || 'Đăng nhập thất bại');
    }
  };

  const quickLogin = () => {
    setEmail('teacher@school.com');
    setPassword('teacher123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang đăng nhập chung
          </Link>
        </div>

        <Card className="card-transparent shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">Đăng nhập Giáo viên</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Truy cập Teacher Dashboard</CardDescription>
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
                    placeholder="teacher@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-black"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập Teacher'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Hoặc</span>
              </div>
            </div>

            <Button
              onClick={quickLogin}
              variant="outline"
              className="w-full border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              ⚡ Điền thông tin mẫu
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">Thông tin đăng nhập mẫu:</p>
              <div className="bg-gray-50 p-3 rounded-md text-xs">
                <p><strong>Email:</strong> teacher@school.com</p>
                <p><strong>Password:</strong> teacher123</p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-green-600 hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
