'use client';

import { useApiAuth } from '@/hooks/useApiAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, User, Bell, Shield, Database, Palette, Plus, Trash2, Edit } from 'lucide-react';
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

export default function SettingsPage() {
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
    <PageWithBackground>
      <div className="flex h-screen">
        <AdminSidebar 
          currentPage="settings" 
          onNavigate={(page) => router.push(`/${page}`)} 
          onLogout={logout} 
        />
        <div className={`flex-1 min-h-screen flex flex-col overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
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

            {/* Background Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Cài đặt Nền
                    </CardTitle>
                    <CardDescription>Tùy chỉnh nền cho các trang trong hệ thống</CardDescription>
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
                        Tạo nền tùy chỉnh
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
                            placeholder="Ví dụ: Nền xanh lá"
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
                        {customFormData.type === 'radial' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Vị trí (position)</Label>
                                <Input
                                  value={customFormData.position}
                                  onChange={(e) => setCustomFormData({ ...customFormData, position: e.target.value })}
                                  placeholder="50% 90%"
                                />
                              </div>
                              <div>
                                <Label>Kích thước (size)</Label>
                                <Input
                                  value={customFormData.size}
                                  onChange={(e) => setCustomFormData({ ...customFormData, size: e.target.value })}
                                  placeholder="125% 125%"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {customFormData.type === 'gradient' && (
                          <div>
                            <Label>Hướng (direction)</Label>
                            <Select
                              value={customFormData.direction}
                              onValueChange={(value) => setCustomFormData({ ...customFormData, direction: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="to bottom">Xuống dưới</SelectItem>
                                <SelectItem value="to top">Lên trên</SelectItem>
                                <SelectItem value="to right">Sang phải</SelectItem>
                                <SelectItem value="to left">Sang trái</SelectItem>
                                <SelectItem value="to bottom right">Xuống góc phải</SelectItem>
                                <SelectItem value="to bottom left">Xuống góc trái</SelectItem>
                                <SelectItem value="to top right">Lên góc phải</SelectItem>
                                <SelectItem value="to top left">Lên góc trái</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {customFormData.type === 'grid' && (
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>Kích thước lưới (grid size)</Label>
                              <Input
                                value={customFormData.gridSize}
                                onChange={(e) => setCustomFormData({ ...customFormData, gridSize: e.target.value })}
                                placeholder="20px"
                              />
                            </div>
                            <div>
                              <Label>Độ dày đường (line width)</Label>
                              <Input
                                value={customFormData.gridLineWidth}
                                onChange={(e) => setCustomFormData({ ...customFormData, gridLineWidth: e.target.value })}
                                placeholder="1px"
                              />
                            </div>
                            <div>
                              <Label>Độ trong suốt (opacity)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={customFormData.gridOpacity}
                                onChange={(e) => setCustomFormData({ ...customFormData, gridOpacity: e.target.value })}
                                placeholder="0.15"
                              />
                            </div>
                          </div>
                        )}
                        {customFormData.type === 'pattern' && (
                          <div>
                            <Label>Loại Pattern *</Label>
                            <Select
                              value={customFormData.patternType}
                              onValueChange={(value) => setCustomFormData({ ...customFormData, patternType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="diagonal-grid-spotlight">Diagonal Grid Spotlight</SelectItem>
                                <SelectItem value="circuit-board">Circuit Board</SelectItem>
                                <SelectItem value="noise-texture">Noise Texture</SelectItem>
                                <SelectItem value="crosshatch-art">Crosshatch Art</SelectItem>
                                <SelectItem value="diagonal-stripes">Diagonal Stripes</SelectItem>
                                <SelectItem value="diagonal-cross-center">Diagonal Cross Center</SelectItem>
                                <SelectItem value="diagonal-cross-bottom-right">Diagonal Cross Bottom Right</SelectItem>
                                <SelectItem value="diagonal-cross-grid">Diagonal Cross Grid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div 
                          className="p-4 rounded-lg border-2"
                          style={(() => {
                            // Create a temporary preset for preview
                            const previewPreset: BackgroundPreset = {
                              id: 'preview',
                              name: 'Preview',
                              type: customFormData.type,
                              config: customFormData.type === 'solid'
                                ? { colors: [customFormData.color1] }
                                : customFormData.type === 'radial'
                                ? {
                                    colors: [customFormData.color1, customFormData.color2],
                                    position: customFormData.position,
                                    size: customFormData.size,
                                  }
                                : customFormData.type === 'grid'
                                ? {
                                    colors: [customFormData.color1, customFormData.color2],
                                    gridSize: customFormData.gridSize,
                                    gridLineWidth: customFormData.gridLineWidth,
                                    gridOpacity: customFormData.gridOpacity,
                                  }
                                : customFormData.type === 'pattern'
                                ? {
                                    colors: [customFormData.color1, customFormData.color2],
                                    patternType: customFormData.patternType,
                                  }
                                : {
                                    colors: [customFormData.color1, customFormData.color2],
                                    direction: customFormData.direction,
                                  },
                            };
                            return { ...getBackgroundStyle(previewPreset), minHeight: '100px' };
                          })()}
                        >
                          <p className="text-sm text-gray-600 text-center">Xem trước</p>
                        </div>
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
                                  : customFormData.type === 'radial'
                                  ? {
                                      colors: [customFormData.color1, customFormData.color2],
                                      position: customFormData.position,
                                      size: customFormData.size,
                                    }
                                  : customFormData.type === 'grid'
                                  ? {
                                      colors: [customFormData.color1, customFormData.color2],
                                      gridSize: customFormData.gridSize,
                                      gridLineWidth: customFormData.gridLineWidth,
                                      gridOpacity: customFormData.gridOpacity,
                                    }
                                  : customFormData.type === 'pattern'
                                  ? {
                                      colors: [customFormData.color1, customFormData.color2],
                                      patternType: customFormData.patternType,
                                    }
                                  : {
                                      colors: [customFormData.color1, customFormData.color2],
                                      direction: customFormData.direction,
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
                            className={`relative p-4 rounded-lg border-2 transition-all ${
                              settings.selectedPresetId === preset.id
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
                            className={`relative p-4 rounded-lg border-2 transition-all ${
                              settings.selectedPresetId === preset.id
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
                                  setCustomFormData({
                                    name: preset.name,
                                    type: preset.type,
                                    color1: preset.config.colors[0],
                                    color2: preset.config.colors[1] || '#10b981',
                                    position: preset.config.position || '50% 90%',
                                    size: preset.config.size || '125% 125%',
                                    direction: preset.config.direction || 'to bottom',
                                    gridSize: preset.config.gridSize || '20px',
                                    gridLineWidth: preset.config.gridLineWidth || '1px',
                                    gridOpacity: preset.config.gridOpacity || '0.15',
                                    patternType: preset.config.patternType || 'diagonal-grid-spotlight',
                                  });
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
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <Label className="mb-2 block">Nền hiện tại</Label>
                    <div
                      className="p-8 rounded-lg border-2 border-gray-300"
                      style={getBackgroundStyle(currentConfig)}
                    >
                      <p className="text-center text-gray-600">
                        {currentConfig?.name || 'White'}
                      </p>
                    </div>
                  </div>
                </div>
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
    </PageWithBackground>
  );
}
