"use client";

import { useEffect, useMemo, useState } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import templateClassroomsApi, { TemplateClassroom } from '@/lib/template-classrooms-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Plus, Edit, Trash2, Search, FileText, Copy, Eye } from 'lucide-react';
import { PageWithBackground } from '@/components/PageWithBackground';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { Textarea } from '@/components/ui/textarea';

export default function TemplateClassroomsPage() {
  const { user, loading: authLoading } = useApiAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateClassroom[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateClassroom | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateClassroom | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [subjects, setSubjects] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [templateLessons, setTemplateLessons] = useState<any[]>([]);
  const [templateAssignments, setTemplateAssignments] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((t) =>
      t.name?.toLowerCase().includes(q) ||
      t.code?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormSubjectId('');
    setFormCapacity(30);
    setErrorMsg('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: TemplateClassroom) => {
    setEditing(template);
    setFormName(template.name);
    setFormCode(template.code || '');
    setFormDescription(template.description || '');
    setFormSubjectId(template.subject_id || '');
    setFormCapacity(template.capacity || 30);
    setErrorMsg('');
    setIsDialogOpen(true);
  };

  const handleOpenView = async (template: TemplateClassroom) => {
    setViewingTemplate(template);
    setLoadingDetails(true);
    setIsViewDialogOpen(true);
    
    try {
      // Load lessons and assignments
      const [lessons, assignments] = await Promise.all([
        templateClassroomsApi.getLessons(template.id),
        templateClassroomsApi.getAssignments(template.id),
      ]);
      setTemplateLessons(lessons || []);
      setTemplateAssignments(assignments || []);
    } catch (error) {
      console.error('Error loading template details:', error);
      setTemplateLessons([]);
      setTemplateAssignments([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await templateClassroomsApi.list();
      setTemplates(res || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      setErrorMsg(error.message || 'Không thể tải danh sách template');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/subjects/`, {
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
      loadSubjects();
    }
  }, [authLoading, user]);

  const handleSave = async () => {
    if (!formName.trim()) {
      setErrorMsg('Vui lòng nhập tên template');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDescription.trim() || undefined,
        subject_id: formSubjectId || undefined,
        capacity: formCapacity || undefined,
      };

      if (editing) {
        await templateClassroomsApi.update(editing.id, payload);
      } else {
        await templateClassroomsApi.create(payload);
      }

      setIsDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error saving template:', error);
      setErrorMsg(error.message || 'Không thể lưu template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa template này?')) {
      return;
    }

    try {
      await templateClassroomsApi.remove(id);
      await loadData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.message || 'Không thể xóa template');
    }
  };

  const handleCreateClassroom = (template: TemplateClassroom) => {
    router.push(`/admin/template-classrooms/${template.id}/create-classroom`);
  };

  if (authLoading) {
    return (
      <PageWithBackground>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageWithBackground>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <PageWithBackground>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Bạn không có quyền truy cập trang này</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWithBackground>
    );
  }

  return (
    <PageWithBackground>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold">Quản lý Template Lớp học</h1>
                  <p className="text-gray-600 mt-1">Tạo và quản lý các lớp học mẫu</p>
                </div>
                <Button onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Template
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Tìm kiếm template..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : errorMsg ? (
                    <div className="flex items-center gap-2 text-red-600 py-4">
                      <AlertCircle className="h-5 w-5" />
                      <p>{errorMsg}</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {search ? 'Không tìm thấy template nào' : 'Chưa có template nào'}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Môn học</TableHead>
                          <TableHead>Sức chứa</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((template) => {
                          const subject = subjects.find((s) => s.id === template.subject_id);
                          return (
                            <TableRow key={template.id}>
                              <TableCell>
                                <Badge variant="outline">{template.code || 'N/A'}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{template.name}</TableCell>
                              <TableCell>{subject?.name || 'N/A'}</TableCell>
                              <TableCell>{template.capacity || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenView(template)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateClassroom(template)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa Template' : 'Tạo Template mới'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Cập nhật thông tin template' : 'Tạo một template lớp học mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên Template *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: Template Toán lớp 10"
              />
            </div>
            <div>
              <Label htmlFor="code">Mã Template</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Để trống để tự động tạo"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Mô tả về template..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="subject">Môn học</Label>
              <select
                id="subject"
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Chọn môn học</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="capacity">Sức chứa</Label>
              <Input
                id="capacity"
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(parseInt(e.target.value) || 30)}
                min={1}
              />
            </div>
            {errorMsg && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Template: {viewingTemplate?.name}</DialogTitle>
            <DialogDescription>
              Xem thông tin, bài học và bài tập của template
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Thông tin Template</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mã:</Label>
                    <p>{viewingTemplate?.code || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Môn học:</Label>
                    <p>
                      {subjects.find((s) => s.id === viewingTemplate?.subject_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label>Sức chứa:</Label>
                    <p>{viewingTemplate?.capacity || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Mô tả:</Label>
                    <p>{viewingTemplate?.description || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bài học ({templateLessons.length})</h3>
                {templateLessons.length === 0 ? (
                  <p className="text-gray-500">Chưa có bài học nào</p>
                ) : (
                  <div className="space-y-2">
                    {templateLessons.map((lesson) => (
                      <Card key={lesson.id}>
                        <CardContent className="pt-4">
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-sm text-gray-600">{lesson.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bài tập ({templateAssignments.length})</h3>
                {templateAssignments.length === 0 ? (
                  <p className="text-gray-500">Chưa có bài tập nào</p>
                ) : (
                  <div className="space-y-2">
                    {templateAssignments.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="pt-4">
                          <p className="font-medium">{assignment.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{assignment.assignment_type}</Badge>
                            <span className="text-sm text-gray-600">
                              {assignment.total_points} điểm
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleCreateClassroom(viewingTemplate!)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Tạo lớp học từ Template này
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWithBackground>
  );
}

