'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Lock,
    Bell,
    Moon,
    Globe,
    Shield,
    Loader2,
    LogOut
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudentSettingsPage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [saving, setSaving] = useState(false);

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Preferences State
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: false,
        darkMode: false,
        language: 'vi'
    });

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            alert('Mật khẩu mới không khớp!');
            return;
        }

        if (passwords.new.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // This is a mock endpoint call - replace with actual API endpoint
            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    current_password: passwords.current,
                    new_password: passwords.new
                }),
            });

            if (res.ok) {
                alert('Đổi mật khẩu thành công!');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const data = await res.json();
                alert(data.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Có lỗi xảy ra khi đổi mật khẩu.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
                    <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
            <StudentSidebar
                currentPage="settings"
                onNavigate={(path) => router.push(path)}
                onLogout={() => { }}
                user={{ name: user?.name, email: user?.email }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2">Cài đặt</h1>
                        <p className="text-slate-300">Quản lý tài khoản và tùy chọn ứng dụng</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Security Settings */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        Bảo mật
                                    </CardTitle>
                                    <CardDescription>Đổi mật khẩu và bảo mật tài khoản</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={passwords.current}
                                                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                                className="pl-10"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Mật khẩu mới</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                                className="pl-10"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                                className="pl-10"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                                        className="w-full"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            'Đổi mật khẩu'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preferences */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-orange-500" />
                                        Thông báo
                                    </CardTitle>
                                    <CardDescription>Tùy chỉnh cách bạn nhận thông báo</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Email thông báo</Label>
                                            <p className="text-sm text-slate-500">Nhận thông báo qua email đăng ký</p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications}
                                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Thông báo đẩy</Label>
                                            <p className="text-sm text-slate-500">Nhận thông báo trên trình duyệt</p>
                                        </div>
                                        <Switch
                                            checked={preferences.pushNotifications}
                                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-green-600" />
                                        Giao diện & Ngôn ngữ
                                    </CardTitle>
                                    <CardDescription>Tùy chỉnh trải nghiệm người dùng</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Chế độ tối</Label>
                                            <p className="text-sm text-slate-500">Giao diện nền tối bảo vệ mắt</p>
                                        </div>
                                        <Switch
                                            checked={preferences.darkMode}
                                            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ngôn ngữ</Label>
                                        <select
                                            className="w-full p-2 border border-slate-300 rounded-md"
                                            value={preferences.language}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                                        >
                                            <option value="vi">Tiếng Việt</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={logout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
