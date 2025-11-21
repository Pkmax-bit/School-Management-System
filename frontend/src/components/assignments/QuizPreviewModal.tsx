import { Quiz } from './QuizBuilder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, RotateCcw, Calendar } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
}

interface QuizPreviewModalProps {
  quiz: Quiz;
  onClose: () => void;
  availableClasses?: Class[];
}

export function QuizPreviewModal({ quiz, onClose, availableClasses = [] }: QuizPreviewModalProps) {
  const getClassName = (classId: string) => {
    const classItem = availableClasses.find(c => c.id === classId);
    return classItem ? classItem.name : 'Lớp không xác định';
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Xem trước bài trắc nghiệm</h2>
              <p className="text-slate-600">{quiz.title}</p>
            </div>
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>

          {/* Quiz Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Thời gian</p>
                <p className="font-semibold">{quiz.timeLimitMinutes || 0} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <RotateCcw className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Số lần làm</p>
                <p className="font-semibold">{quiz.attemptsAllowed || 1} lần</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Số câu hỏi</p>
                <p className="font-semibold">{quiz.questions.length} câu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Hạn nộp</p>
                <p className="font-semibold">
                  {quiz.dueDate ? (
                    new Date(quiz.dueDate).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  ) : (
                    <span className="text-slate-400">Chưa đặt</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Classes */}
          {quiz.assignedClasses && quiz.assignedClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lớp được gán bài
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quiz.assignedClasses.map((classId) => (
                    <Badge key={classId} variant="outline" className="text-sm">
                      {getClassName(classId)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {quiz.description && (
            <Card>
              <CardHeader>
                <CardTitle>Hướng dẫn</CardTitle>
                <CardDescription>{quiz.description}</CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="space-y-4">
            {quiz.questions.map((q, idx) => (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Câu {idx + 1}: {q.title || '(Chưa có nội dung)'}
                  </CardTitle>
                  <CardDescription>Điểm: {q.points}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {q.imageUrl && (
                    <div>
                      <img
                        src={q.imageUrl}
                        alt={`Hình minh họa câu ${idx + 1}`}
                        className="w-full rounded-lg border border-slate-200 object-cover max-h-72"
                      />
                    </div>
                  )}

                  {q.choices.length > 0 ? (
                    q.choices.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <input type="radio" disabled />
                        <span>{c.text || '(Trống)'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      Câu hỏi tự luận
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


