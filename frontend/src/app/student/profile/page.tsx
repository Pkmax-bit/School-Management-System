'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { StudentSidebar } from '@/components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    School,
    Save,
    Loader2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface StudentProfile {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    avatar_url?: string;
    classroom?: {
        name: string;
        grade: string;
    };
}

export default function StudentProfilePage() {
    const { user, loading: authLoading, logout } = useApiAuth();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (!authLoading && user && user.role === 'student') {
            loadProfile();
        }
    }, [user, authLoading]);

    const loadProfile = async () => {
        try {
            if (!user) return;

            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const studentRes = await fetch(`${API_BASE_URL}/api/students?user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (studentRes.ok) {
                const studentsData = await studentRes.json();
                if (studentsData.length > 0) {
                    const studentData = studentsData[0];

                    // Get classroom info if available
                    let classroomInfo = undefined;
                    if (studentData.classroom_id) {
                        const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${studentData.classroom_id}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });
                        if (classroomRes.ok) {
                            classroomInfo = await classroomRes.json();
                        }
                    }

                    const profileData = {
                        ...studentData,
                        classroom: classroomInfo
                    };

                    setProfile(profileData);
                    setFormData({
                        phone: profileData.phone || '',
                        address: profileData.address || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const res = await fetch(`${API_BASE_URL}/api/students/${profile.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('Cập nhật thông tin thành công!');
                loadProfile(); // Reload to ensure sync
            } else {
                alert('Có lỗi xảy ra khi cập nhật thông tin.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
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
                currentPage="profile"
                onNavigate={(path) => router.push(path)}
                onLogout={logout}
                user={{ name: user?.name, email: user?.email }}
            />

            <div
                className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                    }`}
            >
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <Avatar className="w-24 h-24 border-4 border-white/30 shadow-lg">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="text-2xl bg-white/20 text-white">
                                    {profile?.last_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-bold mb-1">
                                    {profile?.last_name} {profile?.first_name}
                                </h1>
                                <p className="text-cyan-100 flex items-center justify-center md:justify-start gap-2">
                                    <School className="w-4 h-4" />
                                    {profile?.classroom ? `Lớp ${profile.classroom.name}` : 'Chưa phân lớp'}
                                    <span className="mx-2">•</span>
                                    <span>MSHS: {profile?.student_code}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Personal Info - Read Only */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Họ và tên</Label>
                                        <p className="font-medium text-slate-800 mt-1">
                                            {profile?.last_name} {profile?.first_name}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Ngày sinh</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="font-medium text-slate-800">
                                                {profile?.date_of_birth
                                                    ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN')
                                                    : 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Giới tính</Label>
                                        <p className="font-medium text-slate-800 mt-1">
                                            {profile?.gender === 'male' ? 'Nam' : profile?.gender === 'female' ? 'Nữ' : 'Khác'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Email</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <p className="font-medium text-slate-800 break-all">
                                                {profile?.email}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Info - Editable */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
                                    <CardDescription>
                                        Bạn có thể cập nhật số điện thoại và địa chỉ liên hệ
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Số điện thoại</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="pl-10"
                                                placeholder="Nhập số điện thoại..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Địa chỉ</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                className="pl-10"
                                                placeholder="Nhập địa chỉ..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="min-w-[120px]"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Lưu thay đổi
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
