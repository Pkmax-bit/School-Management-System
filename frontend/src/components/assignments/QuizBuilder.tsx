import { useMemo, useState } from 'react';
import { Question, QuestionEditor } from './QuestionEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, Eye, Trash2, Users, CheckCircle } from 'lucide-react';

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  attemptsAllowed?: number;
  assignedClasses: string[]; // Array of class IDs
  questions: Question[];
};

interface Class {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
}

interface QuizBuilderProps {
  value: Quiz;
  onChange: (quiz: Quiz) => void;
  onPreview?: (quiz: Quiz) => void;
  onSave?: (quiz: Quiz) => Promise<void> | void;
  onDelete?: () => void;
  availableClasses?: Class[];
}

export function QuizBuilder({ value, onChange, onPreview, onSave, onDelete, availableClasses = [] }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<Quiz>(value);
  const [classSearch, setClassSearch] = useState('');

  const update = (partial: Partial<Quiz>) => {
    const updated = { ...quiz, ...partial };
    setQuiz(updated);
    onChange(updated);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      points: 1,
      choices: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
      ],
      required: true,
      shuffleChoices: false,
    };
    update({ questions: [...quiz.questions, newQuestion] });
  };

  const toggleClassAssignment = (classId: string) => {
    const isAssigned = quiz.assignedClasses.includes(classId);
    if (isAssigned) {
      update({ assignedClasses: quiz.assignedClasses.filter(id => id !== classId) });
    } else {
      update({ assignedClasses: [...quiz.assignedClasses, classId] });
    }
  };

  const removeQuestion = (id: string) => {
    update({ questions: quiz.questions.filter((q) => q.id !== id) });
  };

  const updateQuestion = (id: string, q: Question) => {
    update({ questions: quiz.questions.map((question) => (question.id === id ? q : question)) });
  };

  const disableSave = !quiz.title || quiz.title.trim().length === 0 || quiz.questions.length === 0;

  const filteredClasses = useMemo(() => {
    const term = classSearch.toLowerCase().trim();
    if (!term) return availableClasses;
    return availableClasses.filter((c) =>
      c.name.toLowerCase().includes(term) || c.subject.toLowerCase().includes(term)
    );
  }, [availableClasses, classSearch]);

  const handleSelectAllClasses = () => {
    update({ assignedClasses: availableClasses.map((c) => c.id) });
  };

  const handleClearClasses = () => {
    update({ assignedClasses: [] });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tạo bài tập trắc nghiệm</CardTitle>
          <CardDescription>Cấu hình chung cho bài tập</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={quiz.title} onChange={(e) => update({ title: e.target.value })} placeholder="VD: Kiểm tra 15 phút - Toán" />
              <p className="text-xs text-slate-500">Tên bài sẽ hiển thị cho học sinh.</p>
            </div>
            <div className="space-y-2">
              <Label>Thời gian (phút)</Label>
              <Input type="number" min={0} value={quiz.timeLimitMinutes || 0} onChange={(e) => update({ timeLimitMinutes: parseInt(e.target.value) || 0 })} />
              <p className="text-xs text-slate-500">0 phút nghĩa là không giới hạn thời gian.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số lần làm</Label>
              <Input type="number" min={1} value={quiz.attemptsAllowed || 1} onChange={(e) => update({ attemptsAllowed: parseInt(e.target.value) || 1 })} />
              <p className="text-xs text-slate-500">Số lần học sinh được phép làm bài.</p>
            </div>
            <div className="space-y-2">
              <Label>Xáo trộn câu hỏi</Label>
              <button
                className={`px-3 py-2 rounded-md border ${quiz.shuffleQuestions ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700'}`}
                onClick={() => update({ shuffleQuestions: !quiz.shuffleQuestions })}
              >
                {quiz.shuffleQuestions ? 'Có' : 'Không'}
              </button>
              <p className="text-xs text-slate-500">Mỗi học sinh sẽ thấy thứ tự câu hỏi khác nhau.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea value={quiz.description || ''} onChange={(e) => update({ description: e.target.value })} rows={3} placeholder="Hướng dẫn làm bài, yêu cầu..." />
            <p className="text-xs text-slate-500">Thông tin hướng dẫn cho học sinh trước khi làm bài.</p>
          </div>

          {/* Class Assignment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Gán cho lớp học</Label>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <Input placeholder="Tìm lớp theo tên hoặc môn học..." value={classSearch} onChange={(e) => setClassSearch(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleSelectAllClasses} disabled={availableClasses.length === 0}>
                  Chọn tất cả
                </Button>
                <Button type="button" variant="outline" onClick={handleClearClasses} disabled={quiz.assignedClasses.length === 0}>
                  Bỏ chọn
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {availableClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredClasses.map((classItem) => {
                    const isAssigned = quiz.assignedClasses.includes(classItem.id);
                    return (
                      <div
                        key={classItem.id}
                        onClick={() => toggleClassAssignment(classItem.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isAssigned
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isAssigned ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                            }`}>
                              {isAssigned && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{classItem.name}</div>
                              <div className="text-sm text-slate-600">{classItem.subject}</div>
                              <div className="text-xs text-slate-500">{classItem.studentCount} học sinh</div>
                            </div>
                          </div>
                          <Users className={`w-5 h-5 ${isAssigned ? 'text-blue-500' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Không có lớp học nào</p>
                  <p className="text-sm">Tạo lớp học trước khi gán bài tập</p>
                </div>
              )}
            </div>
            {quiz.assignedClasses.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Đã gán cho {quiz.assignedClasses.length} lớp học
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Danh sách câu hỏi</h3>
          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-1" /> Thêm câu hỏi
          </Button>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => (
            <QuestionEditor key={q.id} value={q} index={idx} onChange={(v) => updateQuestion(q.id, v)} onRemove={() => removeQuestion(q.id)} />
          ))}
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white to-white/70 backdrop-blur border-t border-slate-200 py-3 px-2 flex items-center justify-end gap-2 rounded-b-xl">
        {onDelete && (
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Xóa bài
          </Button>
        )}
        {onPreview && (
          <Button variant="outline" onClick={() => onPreview(quiz)}>
            <Eye className="w-4 h-4 mr-1" /> Xem trước
          </Button>
        )}
        <Button disabled={disableSave} onClick={() => onSave && onSave(quiz)} className={disableSave ? 'opacity-60 cursor-not-allowed' : ''}>
          <Save className="w-4 h-4 mr-1" /> Lưu bài tập
        </Button>
      </div>
    </div>
  );
}


