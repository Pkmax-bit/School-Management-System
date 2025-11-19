"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, Search, AlertCircle, Loader2, DoorOpen } from 'lucide-react';
import campusesApi, { Campus, CampusCreate } from '../../lib/campuses-api';
import roomsApi, { Room, RoomCreate } from '../../lib/rooms-api';

export default function CampusesPage() {
  const { isCollapsed } = useSidebar();
  const { user, loading, logout } = useApiAuth();
  const router = useRouter();

  // State management
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState<CampusCreate>({
    code: '',
    name: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomFormData, setRoomFormData] = useState<RoomCreate>({
    campus_id: '',
    name: '',
    code: '',
    capacity: 30,
    description: ''
  });
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const normalizedRole = (user?.role || '').toLowerCase().trim();

    const loadCampuses = useCallback(async () => {
    try {
      setLoadingCampuses(true);
      const data = await campusesApi.list(searchQuery);
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      setCampuses(list);
    } catch (error: any) {
      console.error('Error loading campuses:', error);
      setCampuses([]);
    } finally {
      setLoadingCampuses(false);
    }
  }, [searchQuery]);

  // Load campuses once admin session is confirmed
  useEffect(() => {
    if (loading) {
      return;
    }

    if (user?.role === 'admin' && !hasLoaded) {
      loadCampuses();
      setHasLoaded(true);
    }
  }, [user, loading, hasLoaded, loadCampuses]);

// Reload when search changes
  useEffect(() => {
    if (hasLoaded) {
      const timeoutId = setTimeout(() => {
        loadCampuses();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, hasLoaded, loadCampuses]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = 'Mã cơ sở là bắt buộc';
    if (!formData.name.trim()) newErrors.name = 'Tên cơ sở là bắt buộc';
    if (formData.code && formData.code.length > 50) newErrors.code = 'Mã cơ sở không được quá 50 ký tự';
    if (formData.name && formData.name.length > 255) newErrors.name = 'Tên cơ sở không được quá 255 ký tự';
    if (formData.phone && formData.phone.length > 30) newErrors.phone = 'Số điện thoại không được quá 30 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setErrors({});
      const newCampus = await campusesApi.create(formData);
      await loadCampuses();
      // Set as editing to allow adding rooms
      setEditingCampus(newCampus);
      setRoomFormData({
        campus_id: newCampus.id,
        name: '',
        code: '',
        capacity: 30,
        description: ''
      });
      await loadRooms(newCampus.id);
      alert(`Tạo cơ sở "${formData.name}" thành công! Bạn có thể thêm phòng học ngay bây giờ.`);
    } catch (error: any) {
      console.error('Error creating campus:', error);
      alert(error?.message || 'Có lỗi khi tạo cơ sở');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCampus || !validateForm()) return;
    try {
      setIsSubmitting(true);
      await campusesApi.update(editingCampus.id, formData);
      await loadCampuses();
      setIsDialogOpen(false);
      setEditingCampus(null);
      resetForm();
      alert('Cập nhật cơ sở thành công!');
    } catch (error: any) {
      console.error('Error updating campus:', error);
      alert(error?.message || 'Có lỗi khi cập nhật cơ sở');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cơ sở này?')) return;
    try {
      await campusesApi.delete(id);
      await loadCampuses();
      alert('Xóa cơ sở thành công!');
    } catch (error: any) {
      console.error('Error deleting campus:', error);
      alert(error?.message || 'Có lỗi khi xóa cơ sở');
    }
  };

  const loadRooms = useCallback(async (campusId: string) => {
    if (!campusId) {
      setRooms([]);
      return;
    }
    try {
      setLoadingRooms(true);
      const data = await roomsApi.list(campusId);
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const handleEdit = (campus: Campus) => {
    setEditingCampus(campus);
    setFormData({
      code: campus.code || '',
      name: campus.name || '',
      address: campus.address || '',
      phone: campus.phone || ''
    });
    setErrors({});
    setIsDialogOpen(true);
    loadRooms(campus.id);
    setRoomFormData({
      campus_id: campus.id,
      name: '',
      code: '',
      capacity: 30,
      description: ''
    });
  };

  const handleAdd = () => {
    setEditingCampus(null);
    resetForm();
    setIsDialogOpen(true);
    setRooms([]);
    setRoomFormData({
      campus_id: '',
      name: '',
      code: '',
      capacity: 30,
      description: ''
    });
  };

  const handleCreateRoom = async () => {
    if (!editingCampus) {
      alert('Vui lòng tạo cơ sở trước khi thêm phòng học');
      return;
    }
    if (!roomFormData.name.trim() || !roomFormData.code.trim()) {
      alert('Vui lòng điền đầy đủ tên và mã phòng học');
      return;
    }
    try {
      setIsAddingRoom(true);
      await roomsApi.create({
        ...roomFormData,
        campus_id: editingCampus.id
      });
      await loadRooms(editingCampus.id);
      setRoomFormData({
        campus_id: editingCampus.id,
        name: '',
        code: '',
        capacity: 30,
        description: ''
      });
      alert('Thêm phòng học thành công!');
    } catch (error: any) {
      console.error('Error creating room:', error);
      alert(error?.message || 'Có lỗi khi thêm phòng học');
    } finally {
      setIsAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng học này?')) return;
    try {
      await roomsApi.delete(roomId);
      if (editingCampus) {
        await loadRooms(editingCampus.id);
      }
      alert('Xóa phòng học thành công!');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      alert(error?.message || 'Có lỗi khi xóa phòng học');
    }
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', address: '', phone: '' });
    setErrors({});
  };

  const filteredCampuses = campuses.filter((campus) =>
    (campus.name && campus.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (campus.code && campus.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (campus.address && campus.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || normalizedRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full mx-4 text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang Cơ sở.</p>
          <p className="text-sm text-gray-500">
            Vai trò hiện tại: <span className="font-semibold">{normalizedRole || 'Chưa đăng nhập'}</span>
          </p>
          <div className="space-y-2 pt-2">
            <Button className="w-full" onClick={() => router.push('/admin/login')}>
              Đăng nhập Admin
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Đăng nhập chung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithBackground>
      <div className="min-h-screen">
        <AdminSidebar
          currentPage="campuses"
          onNavigate={(page) => router.push(`/${page}`)}
          onLogout={logout}
        />
        <div
          className={`flex-1 h-screen flex flex-col overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-gray-900">Quản lý Cơ sở</h1>
            <p className="text-gray-600">Quản lý danh sách cơ sở trong hệ thống</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng cơ sở</p>
                    <p className="text-3xl font-bold">{campuses.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có địa chỉ</p>
                    <p className="text-3xl font-bold">{campuses.filter(c => c.address && c.address.trim()).length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Có số điện thoại</p>
                    <p className="text-3xl font-bold">{campuses.filter(c => c.phone && c.phone.trim()).length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campuses List */}
          <Card className="card-transparent flex-1 flex flex-col min-h-0">
            <CardHeader className="card-transparent-header flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách Cơ sở</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Quản lý tất cả cơ sở trong hệ thống</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm cơ sở..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm cơ sở
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCampus ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCampus ? 'Cập nhật thông tin cơ sở' : 'Thêm cơ sở mới vào hệ thống'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">Mã cơ sở *</Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className={errors.code ? 'border-red-500' : ''}
                            placeholder="VD: CS001, CS002..."
                          />
                          {errors.code && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.code}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Tên cơ sở *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? 'border-red-500' : ''}
                            placeholder="VD: Cơ sở 1, Cơ sở 2..."
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Địa chỉ</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Địa chỉ cơ sở..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={errors.phone ? 'border-red-500' : ''}
                            placeholder="Số điện thoại liên hệ..."
                          />
                          {errors.phone && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1" onClick={editingCampus ? handleUpdate : handleCreate} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Đang xử lý...' : (editingCampus ? 'Cập nhật' : 'Thêm mới')}
                          </Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
                        </div>

                        {/* Quản lý phòng học - chỉ hiển thị khi đã có cơ sở */}
                        {editingCampus && (
                          <div className="border-t pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <DoorOpen className="w-5 h-5" />
                                Quản lý Phòng học ({rooms.length} phòng)
                              </h3>
                            </div>

                            {/* Form thêm phòng học */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor="room_name">Tên phòng *</Label>
                                  <Input
                                    id="room_name"
                                    value={roomFormData.name}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                                    placeholder="VD: Phòng A101"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="room_code">Mã phòng *</Label>
                                  <Input
                                    id="room_code"
                                    value={roomFormData.code}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, code: e.target.value.toUpperCase() })}
                                    placeholder="VD: A101"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="room_capacity">Sức chứa</Label>
                                  <Input
                                    id="room_capacity"
                                    type="number"
                                    value={roomFormData.capacity}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) || 30 })}
                                    placeholder="30"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="room_description">Mô tả</Label>
                                <Input
                                  id="room_description"
                                  value={roomFormData.description}
                                  onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                                  placeholder="Mô tả phòng học..."
                                />
                              </div>
                              <Button 
                                onClick={handleCreateRoom} 
                                disabled={isAddingRoom || !roomFormData.name.trim() || !roomFormData.code.trim()}
                                className="w-full"
                              >
                                {isAddingRoom && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm phòng học
                              </Button>
                            </div>

                            {/* Danh sách phòng học */}
                            {loadingRooms ? (
                              <div className="text-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                <p className="text-sm text-gray-600 mt-2">Đang tải phòng học...</p>
                              </div>
                            ) : rooms.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <DoorOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Chưa có phòng học nào</p>
                                <p className="text-sm text-gray-400 mt-1">Thêm phòng học đầu tiên cho cơ sở này</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {rooms.map((room) => (
                                  <div key={room.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <DoorOpen className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <div className="font-semibold">{room.name}</div>
                                        <div className="text-sm text-gray-600">Mã: {room.code} | Sức chứa: {room.capacity || 'N/A'}</div>
                                        {room.description && (
                                          <div className="text-xs text-gray-500 mt-1">{room.description}</div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteRoom(room.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {loadingCampuses ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải cơ sở...</p>
                </div>
              ) : filteredCampuses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? 'Không tìm thấy cơ sở nào' : 'Chưa có cơ sở nào'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Thêm cơ sở đầu tiên để bắt đầu'}
                  </p>
                </div>
              ) : (
                filteredCampuses.map((campus) => (
                  <div key={campus.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{campus.name}</h3>
                        <p className="text-sm text-gray-600">Mã: {campus.code}</p>
                        {campus.address && (
                          <p className="text-sm text-gray-500 mt-1">Địa chỉ: {campus.address}</p>
                        )}
                        {campus.phone && (
                          <p className="text-xs text-gray-400">SĐT: {campus.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(campus)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(campus.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </PageWithBackground>
  );
}
