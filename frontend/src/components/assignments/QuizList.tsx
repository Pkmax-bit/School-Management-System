import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Copy, Search, Eye, Users, FileText } from 'lucide-react';
import { Quiz } from './QuizBuilder';
import { cn } from '@/components/ui/utils';

interface Class {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
}

interface QuizListProps {
  items: Quiz[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (id: string) => void;
  availableClasses?: Class[];
}

export function QuizList({ items, onCreate, onEdit, onDelete, onDuplicate, onPreview, availableClasses = [] }: QuizListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const filtered = items.filter((q) => {
    const matches = q.title.toLowerCase().includes(search.toLowerCase());
    const status: 'draft' | 'published' = q.questions.length > 0 ? 'published' : 'draft';
    const matchesFilter = filter === 'all' || filter === status;
    return matches && matchesFilter;
  });

  const getStatus = (q: Quiz): 'draft' | 'published' => (q.questions.length > 0 ? 'published' : 'draft');

  const getClassName = (classId: string) => {
    const classItem = availableClasses.find(c => c.id === classId);
    return classItem ? classItem.name : 'Lớp không xác định';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Danh sách bài tập</CardTitle>
            <CardDescription>Quản lý các bài trắc nghiệm đã tạo</CardDescription>
          </div>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-1" /> Tạo bài mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Tìm theo tiêu đề..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <Label className="text-sm text-slate-600">Lọc:</Label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{q.title || 'Chưa đặt tiêu đề'}</CardTitle>
                    <CardDescription>{q.description || 'Không có mô tả'}</CardDescription>
                  </div>
                  <Badge className={cn('text-xs', getStatus(q) === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {getStatus(q) === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-slate-600">Số câu hỏi: {q.questions.length}</div>
                {q.assignedClasses && q.assignedClasses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>Gán cho lớp:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {q.assignedClasses.map((classId) => (
                        <Badge key={classId} variant="outline" className="text-xs">
                          {getClassName(classId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onPreview(q.id)}>
                    <Eye className="w-4 h-4 mr-1" /> Xem
                  </Button>
                  <Button size="sm" onClick={() => onEdit(q.id)}>
                    <Edit className="w-4 h-4 mr-1" /> Sửa
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDuplicate(q.id)}>
                    <Copy className="w-4 h-4 mr-1" /> Nhân bản
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(q.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && items.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <div className="mb-4">
              <FileText className="w-16 h-16 mx-auto text-slate-300" />
            </div>
            <p className="text-lg font-medium mb-2">Chưa có bài tập nào</p>
            <p className="text-sm mb-4">Bắt đầu bằng cách tạo bài tập trắc nghiệm mới</p>
            <Button onClick={onCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Tạo bài tập đầu tiên
            </Button>
          </div>
        )}

        {filtered.length === 0 && items.length > 0 && (
          <div className="text-center text-slate-500 py-8">
            <p>Không có bài tập nào phù hợp với bộ lọc</p>
            <p className="text-sm mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


