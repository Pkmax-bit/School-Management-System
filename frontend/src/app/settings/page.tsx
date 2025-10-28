'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, User, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-black mb-4">Truy cập bị từ chối</h1>
        <p className="text-black">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        currentPage="settings" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 lg:ml-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-black">Cài đặt hệ thống</h1>
            <p className="text-black">Quản lý cài đặt và cấu hình hệ thống</p>
          </div>

          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Cài đặt chung
                </CardTitle>
                <CardDescription>Cấu hình thông tin cơ bản của hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="schoolName">Tên trường</Label>
                  <Input id="schoolName" defaultValue="Trường THPT ABC" />
                </div>
                <div>
                  <Label htmlFor="schoolAddress">Địa chỉ</Label>
                  <Input id="schoolAddress" defaultValue="123 Đường ABC, Quận XYZ, TP.HCM" />
                </div>
                <div>
                  <Label htmlFor="schoolPhone">Số điện thoại</Label>
                  <Input id="schoolPhone" defaultValue="0123456789" />
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>

            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Cài đặt người dùng
                </CardTitle>
                <CardDescription>Quản lý thông tin cá nhân</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userName">Tên người dùng</Label>
                  <Input id="userName" defaultValue="Admin User" />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" defaultValue="admin@school.com" />
                </div>
                <div>
                  <Label htmlFor="userPhone">Số điện thoại</Label>
                  <Input id="userPhone" defaultValue="0123456789" />
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>Quản lý thông báo hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Thông báo email</p>
                    <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Thông báo SMS</p>
                    <p className="text-sm text-gray-600">Nhận thông báo qua SMS</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Thông báo hệ thống</p>
                    <p className="text-sm text-gray-600">Hiển thị thông báo trong hệ thống</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Bảo mật
                </CardTitle>
                <CardDescription>Cài đặt bảo mật hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div>
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Thông tin hệ thống
              </CardTitle>
              <CardDescription>Thông tin về hệ thống và cơ sở dữ liệu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Phiên bản</p>
                  <p className="text-2xl font-bold">v1.0.0</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cơ sở dữ liệu</p>
                  <p className="text-2xl font-bold">PostgreSQL</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="text-2xl font-bold text-green-600">Hoạt động</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
