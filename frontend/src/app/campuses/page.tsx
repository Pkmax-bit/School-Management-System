"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';
import campusesApi, { Campus, CampusCreate } from '../../lib/campuses-api';

export default function CampusesPage() {
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

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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

  // Load data once
  useEffect(() => {
    if (user && user.role === 'admin' && !hasLoaded) {
      loadCampuses();
      setHasLoaded(true);
    }
  }, [user, hasLoaded, loadCampuses]);

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
      await campusesApi.create(formData);
      await loadCampuses();
      setIsDialogOpen(false);
      resetForm();
      alert(`Tạo cơ sở "${formData.name}" thành công!`);
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
  };

  const handleAdd = () => {
    setEditingCampus(null);
    resetForm();
    setIsDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        currentPage="campuses" 
        onNavigate={(page) => router.push(`/${page}`)} 
        onLogout={logout} 
      />
      <div className="flex-1 lg:ml-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl mb-2 text-gray-900">Quản lý Cơ sở</h1>
            <p className="text-gray-600">Quản lý danh sách cơ sở trong hệ thống</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
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
            <Card>
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
            <Card>
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
          <Card>
            <CardHeader>
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
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCampus ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCampus ? 'Cập nhật thông tin cơ sở' : 'Thêm cơ sở mới vào hệ thống'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
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
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
  );
}
