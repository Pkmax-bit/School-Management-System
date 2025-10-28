/**
 * Classrooms Page
 * Trang quản lý lớp học
 */

'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { classroomsHybridApi } from '@/lib/classrooms-api-hybrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Plus, Edit, Trash2, Search } from 'lucide-react';

export default function ClassroomsPage() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleOpenCreate = () => {
    console.log('[Classrooms] Clicked add button');
    setEditing(null);
    setFormName('');
    setFormCode('');
    setFormCapacity(30);
    setFormTeacherId('');
    setFormDescription('');
    setErrorMsg('');
    setIsDialogOpen(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await classroomsHybridApi.list();
      const data = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      setItems(data);
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  if (!user || !['admin', 'teacher'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Không có quyền truy cập
        </h1>
        <p className="text-gray-600">
          Chỉ quản trị viên và giáo viên mới có thể truy cập trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
          <p className="text-gray-600">Quản lý thông tin lớp học trong hệ thống</p>
        </div>
        {user.role === 'admin' && (
          <div className="flex gap-2">
            <Button onClick={handleOpenCreate} data-testid="open-create-classroom">
              <Plus className="w-4 h-4 mr-2" /> Thêm lớp học
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const ts = Date.now();
                  await classroomsHybridApi.create({
                    name: `Lớp mẫu ${ts}`,
                    code: `SAMPLE-${ts}`,
                    description: 'Lớp học mẫu (dev) tạo tự động',
                    capacity: 30,
                    teacher_id: null,
                  });
                  await loadData();
                } catch (e) {
                  console.error('Create sample classroom failed:', e);
                }
              }}
            >Tạo lớp học mẫu</Button>
          </div>
        )}
      </div>

      {/* Debug user info to verify logged-in user is received */}
      {user && (
        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
          <span className="font-semibold">User hiện tại:</span>
          <span className="ml-2">{user.name || 'N/A'}</span>
          <span className="ml-2 text-gray-500">({user.email || 'no-email'})</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700">{user.role}</span>
          <span className="ml-4 text-xs text-gray-500">Dialog open: {String(isDialogOpen)}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách lớp học</span>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Tìm theo tên, mã, mô tả" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Sĩ số</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    {user.role === 'admin' && <TableHead className="w-[140px]">Hành động</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.code}</TableCell>
                      <TableCell>{c.capacity ?? 30}</TableCell>
                      <TableCell>{c.teacher_id ? c.teacher_id : 'N/A'}</TableCell>
                      <TableCell>{c.description || '—'}</TableCell>
                      {user.role === 'admin' && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditing(c);
                              setFormName(c.name || '');
                              setFormCode(c.code || '');
                              setFormCapacity(typeof c.capacity === 'number' ? c.capacity : 30);
                              setFormTeacherId(c.teacher_id || '');
                              setFormDescription(c.description || '');
                              setErrorMsg('');
                              setIsDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={async () => {
                              if (confirm('Xóa lớp học này?')) {
                                await classroomsHybridApi.remove(c.id);
                                loadData();
                              }
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-2 text-gray-600 py-6">
                          <AlertCircle className="w-4 h-4" /> Không có dữ liệu
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setSaving(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Cập nhật lớp học' : 'Thêm lớp học'}</DialogTitle>
            <DialogDescription>Nhập thông tin lớp học</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errorMsg && (
              <div className="text-sm text-red-600">{errorMsg}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp</Label>
              <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Mã lớp</Label>
              <Input id="code" value={formCode} onChange={(e) => setFormCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Sĩ số</Label>
              <Input id="capacity" type="number" min={1} value={formCapacity} onChange={(e) => setFormCapacity(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Giáo viên (ID)</Label>
              <Input id="teacher_id" value={formTeacherId} onChange={(e) => setFormTeacherId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Hủy</Button>
              <Button
                onClick={async () => {
                  try {
                    setErrorMsg('');
                    if (!formName.trim() || !formCode.trim()) {
                      setErrorMsg('Tên lớp và Mã lớp là bắt buộc.');
                      return;
                    }
                    setSaving(true);
                    const payload: any = {
                      name: formName.trim(),
                      code: formCode.trim(),
                      capacity: formCapacity && formCapacity > 0 ? formCapacity : 30,
                      teacher_id: formTeacherId.trim() || null,
                      description: formDescription.trim() || null,
                    };
                    if (editing) {
                      await classroomsHybridApi.update(editing.id, payload);
                    } else {
                      await classroomsHybridApi.create(payload);
                    }
                    setIsDialogOpen(false);
                    loadData();
                  } catch (err: any) {
                    const apiMsg = err?.response?.data?.detail || 'Thao tác thất bại. Vui lòng thử lại.';
                    setErrorMsg(apiMsg);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >{saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm mới')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
