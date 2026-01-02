"use client";

import { useEffect, useMemo, useState } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import templateClassroomsApi, { TemplateClassroom } from '@/lib/template-classrooms-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FileText, 
  Copy, 
  Eye, 
  BookOpen,
  GraduationCap,
  Users,
  Sparkles,
  FolderOpen,
  MoreVertical,
  Calendar,
  Award
} from 'lucide-react';
import { PageWithBackground } from '@/components/PageWithBackground';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { Textarea } from '@/components/ui/textarea';

export default function DocumentsPage() {
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

  const stats = useMemo(() => {
    return {
      total: templates.length,
    };
  }, [templates]);

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

  const handleViewTemplate = (template: TemplateClassroom) => {
    router.push(`/classrooms/${template.id}`);
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

  const userRole = user?.role?.toLowerCase() || '';
  const canEdit = userRole === 'admin' || userRole === 'teacher';
  const canDelete = userRole === 'admin';

  if (!user || !canEdit) {
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
        {userRole === 'admin' ? (
          <AdminSidebar
            currentPage="documents"
            onNavigate={(page) => router.push(`/admin/${page}`)}
            onLogout={() => router.push('/login')}
            userName={user?.name}
            userEmail={user?.email}
            userRole={user?.role}
          />
        ) : userRole === 'teacher' ? (
          <TeacherSidebar
            currentPage="documents"
            onNavigate={(page) => router.push(`/teacher/${page}`)}
            onLogout={() => router.push('/login')}
            user={user}
          />
        ) : null}
        <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header với Gradient */}
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold">Tài liệu Mẫu</h1>
                      </div>
                      <p className="text-purple-100 text-sm lg:text-base mt-2">
                        Tạo và quản lý các lớp học mẫu với bài học và bài tập
                      </p>
                    </div>
                    {canEdit && (
                      <Button 
                        onClick={handleOpenCreate}
                        className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Tạo Template Mới
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium mb-1">Tổng Template</p>
                        <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                        <p className="text-xs text-blue-500 mt-1">Template đã tạo</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium mb-1">Đang hoạt động</p>
                        <p className="text-3xl font-bold text-purple-700">{stats.total}</p>
                        <p className="text-xs text-purple-500 mt-1">Sẵn sàng sử dụng</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-full shadow-lg">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-600 text-sm font-medium mb-1">Tổng số</p>
                        <p className="text-3xl font-bold text-pink-700">{stats.total}</p>
                        <p className="text-xs text-pink-500 mt-1">Template trong hệ thống</p>
                      </div>
                      <div className="p-3 bg-pink-500 rounded-full shadow-lg">
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search Bar */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Tìm kiếm template theo tên, mã hoặc mô tả..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-12 text-base border-2 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Templates Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-600 text-lg">Đang tải template...</p>
                </div>
              ) : errorMsg ? (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-red-600">
                      <AlertCircle className="h-6 w-6" />
                      <p className="font-medium">{errorMsg}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FolderOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {search ? 'Không tìm thấy template nào' : 'Chưa có template nào'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {search 
                        ? 'Thử tìm kiếm với từ khóa khác' 
                        : canEdit 
                          ? 'Bắt đầu bằng cách tạo template đầu tiên của bạn'
                          : 'Chưa có template nào được tạo'}
                    </p>
                    {canEdit && !search && (
                      <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Plus className="h-5 w-5 mr-2" />
                        Tạo Template Đầu Tiên
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((template) => {
                    const subject = subjects.find((s) => s.id === template.subject_id);
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-green-500 to-emerald-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-blue-500',
                      'from-pink-500 to-rose-500',
                    ];
                    const colorIndex = filtered.indexOf(template) % colors.length;
                    const gradient = colors[colorIndex];

                    return (
                      <Card 
                        key={template.id}
                        className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative"
                      >
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradient}`}></div>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-purple-700 font-semibold"
                                >
                                  {template.code || 'N/A'}
                                </Badge>
                              </div>
                              <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {template.name}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="h-4 w-4 text-purple-500" />
                              <span className="font-medium">Môn học:</span>
                              <span>{subject?.name || 'Chưa gán'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">Sức chứa:</span>
                              <span>{template.capacity || 'N/A'} học sinh</span>
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                                {template.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenView(template)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Xem</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewTemplate(template)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Mở template"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Mở</span>
                                </Button>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateClassroom(template)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Tạo lớp học"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(template)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(template.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Xóa"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {canEdit && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  {editing ? (
                    <Edit className="h-5 w-5 text-white" />
                  ) : (
                    <Plus className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    {editing ? 'Chỉnh sửa Template' : 'Tạo Template mới'}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    {editing ? 'Cập nhật thông tin template' : 'Tạo một template lớp học mới với bài học và bài tập'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div>
                <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                  Tên Template <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Template Toán lớp 10"
                  className="h-11 text-base border-2 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="code" className="text-base font-semibold mb-2 block">
                  Mã Template
                </Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Để trống để tự động tạo (Template0001, Template0002...)"
                  className="h-11 text-base border-2 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-base font-semibold mb-2 block">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả về template, mục đích sử dụng..."
                  rows={4}
                  className="text-base border-2 focus:border-purple-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject" className="text-base font-semibold mb-2 block">
                    Môn học
                  </Label>
                  <select
                    id="subject"
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full h-11 px-3 py-2 border-2 rounded-md focus:border-purple-500 focus:outline-none text-base"
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
                  <Label htmlFor="capacity" className="text-base font-semibold mb-2 block">
                    Sức chứa
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 30)}
                    min={1}
                    className="h-11 text-base border-2 focus:border-purple-500"
                  />
                </div>
              </div>
              {errorMsg && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      {editing ? 'Cập nhật' : 'Tạo Template'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Chi tiết Template</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {viewingTemplate?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Template Info Card */}
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    Thông tin Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <Label className="text-sm text-gray-500">Mã Template</Label>
                      <p className="font-semibold text-lg mt-1">{viewingTemplate?.code || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <Label className="text-sm text-gray-500">Môn học</Label>
                      <p className="font-semibold text-lg mt-1">
                        {subjects.find((s) => s.id === viewingTemplate?.subject_id)?.name || 'Chưa gán'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <Label className="text-sm text-gray-500">Sức chứa</Label>
                      <p className="font-semibold text-lg mt-1">{viewingTemplate?.capacity || 'N/A'} học sinh</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg col-span-2">
                      <Label className="text-sm text-gray-500">Mô tả</Label>
                      <p className="font-medium mt-1">{viewingTemplate?.description || 'Chưa có mô tả'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lessons Section */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Bài học
                    <Badge className="ml-2 bg-blue-600 text-white">{templateLessons.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {templateLessons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Chưa có bài học nào trong template này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templateLessons.map((lesson) => (
                        <Card key={lesson.id} className="border border-blue-200 hover:border-blue-400 transition-colors">
                          <CardContent className="p-4">
                            <p className="font-semibold text-gray-800 mb-1">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignments Section */}
              <Card className="border-2 border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    Bài tập
                    <Badge className="ml-2 bg-orange-600 text-white">{templateAssignments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {templateAssignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Chưa có bài tập nào trong template này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templateAssignments.map((assignment) => (
                        <Card key={assignment.id} className="border border-orange-200 hover:border-orange-400 transition-colors">
                          <CardContent className="p-4">
                            <p className="font-semibold text-gray-800 mb-2">{assignment.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                {assignment.assignment_type}
                              </Badge>
                              <span className="text-sm font-medium text-gray-600">
                                {assignment.total_points} điểm
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {canEdit && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewTemplate(viewingTemplate!)}
                    className="h-11"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Mở để quản lý
                  </Button>
                  <Button 
                    onClick={() => handleCreateClassroom(viewingTemplate!)}
                    className="h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Tạo lớp học từ Template
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWithBackground>
  );
}

