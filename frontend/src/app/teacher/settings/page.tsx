'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, User, Bell, Shield, Palette, Plus, Trash2, Edit } from 'lucide-react';
import { useBackgroundSettings, BackgroundPreset } from '@/hooks/useBackgroundSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWithBackground } from '@/components/PageWithBackground';

type BackgroundType = 'radial' | 'solid' | 'gradient' | 'grid' | 'pattern';

interface CustomBackgroundForm {
    name: string;
    type: BackgroundType;
    color1: string;
    color2: string;
    position: string;
    size: string;
    direction: string;
    gridSize: string;
    gridLineWidth: string;
    gridOpacity: string;
    patternType: string;
}

export default function TeacherSettingsPage() {
    const { isCollapsed } = useSidebar();
    const { user, loading, logout } = useApiAuth();
    const router = useRouter();
    const {
        settings,
        selectPreset,
        addCustomPreset,
        updateCustomPreset,
        deleteCustomPreset,
        getAllPresets,
        currentConfig,
        getBackgroundStyle,
    } = useBackgroundSettings();

    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<BackgroundPreset | null>(null);
    const [customFormData, setCustomFormData] = useState<CustomBackgroundForm>({
        name: '',
        type: 'radial',
        color1: '#ffffff',
        color2: '#10b981',
        position: '50% 90%',
        size: '125% 125%',
        direction: 'to bottom',
        gridSize: '20px',
        gridLineWidth: '1px',
        gridOpacity: '0.15',
        patternType: 'diagonal-grid-spotlight',
    });

    useEffect(() => {
        if (!loading && (!user || user.role !== 'teacher')) {
            router.push('/login');
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

    if (!user || user.role !== 'teacher') {
        return null;
    }

    return (
        <PageWithBackground>
            <div className="flex h-screen">
                <TeacherSidebar
                    currentPage="settings"
                    onNavigate={(page) => router.push(page)}
                    onLogout={logout}
                    user={user}
                />
                <div className={`flex-1 min-h-screen flex flex-col overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl mb-2 text-black">Cài đặt</h1>
                            <p className="text-black">Quản lý cài đặt cá nhân và giao diện</p>
                        </div>

                        {/* Settings Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* User Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-600" />
                                        Thông tin cá nhân
                                    </CardTitle>
                                    <CardDescription>Quản lý thông tin tài khoản của bạn</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="userName">Họ và tên</Label>
                                        <Input id="userName" defaultValue={user.name || ''} />
                                    </div>
                                    <div>
                                        <Label htmlFor="userEmail">Email</Label>
                                        <Input id="userEmail" defaultValue={user.email || ''} disabled />
                                    </div>
                                    <div>
                                        <Label htmlFor="userPhone">Số điện thoại</Label>
                                        <Input id="userPhone" defaultValue={(user as any).phone || ''} />
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
                                    <CardDescription>Tùy chỉnh cách bạn nhận thông báo</CardDescription>
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
                                    <CardDescription>Đổi mật khẩu và bảo mật tài khoản</CardDescription>
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

                            {/* Background Settings */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Palette className="w-5 h-5 text-purple-600" />
                                                Giao diện & Nền
                                            </CardTitle>
                                            <CardDescription>Tùy chỉnh hình nền cho trang web</CardDescription>
                                        </div>
                                        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingPreset(null);
                                                        setCustomFormData({
                                                            name: '',
                                                            type: 'radial',
                                                            color1: '#ffffff',
                                                            color2: '#10b981',
                                                            position: '50% 90%',
                                                            size: '125% 125%',
                                                            direction: 'to bottom',
                                                            gridSize: '20px',
                                                            gridLineWidth: '1px',
                                                            gridOpacity: '0.15',
                                                            patternType: 'diagonal-grid-spotlight',
                                                        });
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Tạo nền mới
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {editingPreset ? 'Sửa nền tùy chỉnh' : 'Tạo nền tùy chỉnh'}
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>Tên nền *</Label>
                                                        <Input
                                                            value={customFormData.name}
                                                            onChange={(e) => setCustomFormData({ ...customFormData, name: e.target.value })}
                                                            placeholder="Ví dụ: Nền yêu thích"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Loại nền *</Label>
                                                        <Select
                                                            value={customFormData.type}
                                                            onValueChange={(value: string) =>
                                                                setCustomFormData({ ...customFormData, type: value as BackgroundType })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="radial">Radial Gradient</SelectItem>
                                                                <SelectItem value="solid">Solid Color</SelectItem>
                                                                <SelectItem value="gradient">Linear Gradient</SelectItem>
                                                                <SelectItem value="grid">Grid Pattern</SelectItem>
                                                                <SelectItem value="pattern">Advanced Pattern</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Màu 1 *</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="color"
                                                                    value={customFormData.color1}
                                                                    onChange={(e) => setCustomFormData({ ...customFormData, color1: e.target.value })}
                                                                    className="w-16 h-10"
                                                                />
                                                                <Input
                                                                    value={customFormData.color1}
                                                                    onChange={(e) => setCustomFormData({ ...customFormData, color1: e.target.value })}
                                                                    placeholder="#ffffff"
                                                                />
                                                            </div>
                                                        </div>
                                                        {customFormData.type !== 'solid' && (
                                                            <div>
                                                                <Label>Màu 2 *</Label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="color"
                                                                        value={customFormData.color2}
                                                                        onChange={(e) => setCustomFormData({ ...customFormData, color2: e.target.value })}
                                                                        className="w-16 h-10"
                                                                    />
                                                                    <Input
                                                                        value={customFormData.color2}
                                                                        onChange={(e) => setCustomFormData({ ...customFormData, color2: e.target.value })}
                                                                        placeholder="#10b981"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Additional fields based on type would go here - simplified for brevity */}

                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsCustomDialogOpen(false)}
                                                        >
                                                            Hủy
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                const preset: BackgroundPreset = {
                                                                    id: editingPreset?.id || `custom-${Date.now()}`,
                                                                    name: customFormData.name,
                                                                    type: customFormData.type,
                                                                    config: customFormData.type === 'solid'
                                                                        ? { colors: [customFormData.color1] }
                                                                        : {
                                                                            colors: [customFormData.color1, customFormData.color2],
                                                                            // Default values for other properties
                                                                            position: customFormData.position,
                                                                            size: customFormData.size,
                                                                            direction: customFormData.direction,
                                                                            gridSize: customFormData.gridSize,
                                                                            gridLineWidth: customFormData.gridLineWidth,
                                                                            gridOpacity: customFormData.gridOpacity,
                                                                            patternType: customFormData.patternType,
                                                                        },
                                                                };

                                                                if (editingPreset) {
                                                                    updateCustomPreset(editingPreset.id, preset);
                                                                } else {
                                                                    addCustomPreset(preset);
                                                                }
                                                                setIsCustomDialogOpen(false);
                                                            }}
                                                        >
                                                            <Save className="w-4 h-4 mr-2" />
                                                            Lưu
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="mb-2 block">Nền mặc định</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                                {getAllPresets()
                                                    .filter(p => !p.id.startsWith('custom-'))
                                                    .map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => selectPreset(preset.id)}
                                                            className={`relative p-4 rounded-lg border-2 transition-all ${settings.selectedPresetId === preset.id
                                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            style={getBackgroundStyle(preset)}
                                                        >
                                                            <div className="text-xs font-medium text-gray-700 mt-2 text-center">
                                                                {preset.name}
                                                            </div>
                                                            {settings.selectedPresetId === preset.id && (
                                                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                                                    <Save className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        {settings.customPresets.length > 0 && (
                                            <div>
                                                <Label className="mb-2 block">Nền tùy chỉnh</Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                                    {settings.customPresets.map((preset) => (
                                                        <div
                                                            key={preset.id}
                                                            className={`relative p-4 rounded-lg border-2 transition-all ${settings.selectedPresetId === preset.id
                                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            style={getBackgroundStyle(preset)}
                                                        >
                                                            <div className="text-xs font-medium text-gray-700 mt-2 text-center mb-2">
                                                                {preset.name}
                                                            </div>
                                                            <div className="flex gap-1 justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectPreset(preset.id)}
                                                                    className="p-1 bg-white rounded hover:bg-gray-100 text-xs"
                                                                >
                                                                    Chọn
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingPreset(preset);
                                                                        // Populate form data...
                                                                        setIsCustomDialogOpen(true);
                                                                    }}
                                                                    className="p-1 bg-white rounded hover:bg-gray-100 text-xs"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteCustomPreset(preset.id)}
                                                                    className="p-1 bg-white rounded hover:bg-red-100 text-xs text-red-600"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            {settings.selectedPresetId === preset.id && (
                                                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                                                    <Save className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PageWithBackground>
    );
}
