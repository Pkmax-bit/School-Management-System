'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quiz, QuizBuilder } from '@/components/assignments/QuizBuilder';
import { QuizList } from '@/components/assignments/QuizList';
import { QuizPreviewModal } from '@/components/assignments/QuizPreviewModal';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { Plus } from 'lucide-react';

export default function TeacherAssignmentsPage() {
  const { user, loading, logout } = useTeacherAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string; name: string; subject: string; studentCount: number}>>([]);

  useEffect(() => {
    const initial: Quiz[] = [
      {
        id: 'sample-1',
        title: 'Trắc nghiệm Toán 10 - Chương 1',
        description: '15 phút — Đại số cơ bản',
        timeLimitMinutes: 15,
        attemptsAllowed: 1,
        shuffleQuestions: true,
        assignedClasses: ['class-1', 'class-2'],
        questions: [],
      },
    ];
    setQuizzes(initial);

    // Mock data for available classes
    const mockClasses = [
      { id: 'class-1', name: '10A1', subject: 'Toán học', studentCount: 35 },
      { id: 'class-2', name: '10A2', subject: 'Vật lý', studentCount: 32 },
      { id: 'class-3', name: '11B1', subject: 'Hóa học', studentCount: 28 },
      { id: 'class-4', name: '11B2', subject: 'Sinh học', studentCount: 30 },
      { id: 'class-5', name: '12C1', subject: 'Toán học', studentCount: 25 },
    ];
    setAvailableClasses(mockClasses);
  }, []);

  const editingQuiz = useMemo(() => quizzes.find((q) => q.id === editingId) || null, [quizzes, editingId]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/teacher/login')}>Đến trang đăng nhập giáo viên</Button>
        </div>
      </div>
    );
  }

  const handleCreate = () => {
    const newQuiz: Quiz = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Bài trắc nghiệm mới',
      description: '',
      timeLimitMinutes: 0,
      attemptsAllowed: 1,
      shuffleQuestions: false,
      assignedClasses: [],
      questions: [],
    };
    setQuizzes((prev) => [newQuiz, ...prev]);
    setEditingId(newQuiz.id);
  };

  const handleEdit = (id: string) => setEditingId(id);

  const handleDelete = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleDuplicate = (id: string) => {
    const found = quizzes.find((q) => q.id === id);
    if (!found) return;
    const copy: Quiz = { 
      ...found, 
      id: Math.random().toString(36).substr(2, 9), 
      title: found.title + ' (bản sao)',
      assignedClasses: [...found.assignedClasses] // Copy assigned classes
    };
    setQuizzes((prev) => [copy, ...prev]);
  };

  const handleSave = async (quiz: Quiz) => {
    setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? quiz : q)));
  };

  const handlePreview = (quiz: Quiz) => setPreviewQuiz(quiz);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <TeacherSidebar 
        currentPage="assignments" 
        onNavigate={(path) => router.push(path)} 
        onLogout={logout}
        user={{ name: user?.name, email: user?.email }}
      />
      <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 lg:p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Bài tập trắc nghiệm</h1>
                <p className="text-green-100 text-sm lg:text-lg">Tạo và quản lý các bài trắc nghiệm cho học sinh</p>
              </div>
              <Button 
                onClick={handleCreate} 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 font-bold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-1" /> Tạo bài mới
              </Button>
            </div>
          </div>

          {!editingQuiz && (
            <QuizList
              items={quizzes}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPreview={(id) => {
                const q = quizzes.find((x) => x.id === id);
                if (q) setPreviewQuiz(q);
              }}
              availableClasses={availableClasses}
            />
          )}

          {editingQuiz && (
            <Card className="p-6">
              <QuizBuilder
                value={editingQuiz}
                onChange={(q) => setQuizzes((prev) => prev.map((x) => (x.id === q.id ? q : x)))}
                onSave={handleSave}
                onPreview={handlePreview}
                onDelete={() => handleDelete(editingQuiz.id)}
                availableClasses={availableClasses}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setEditingId(null)}>Quay lại danh sách</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {previewQuiz && (
        <QuizPreviewModal 
          quiz={previewQuiz} 
          onClose={() => setPreviewQuiz(null)} 
          availableClasses={availableClasses}
        />
      )}
    </div>
  );
}


