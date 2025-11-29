'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, Users, Loader2, ArrowRight, Info } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_type: 'multiple_choice' | 'essay';
  total_points: number;
  due_date?: string;
  time_limit_minutes: number;
  attempts_allowed: number;
  classroom_ids: string[];
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  score?: number;
  is_graded: boolean;
  submitted_at: string;
  feedback?: string;
  files?: Array<{ name: string; url: string; path?: string; size?: number; type?: string }>;
  links?: string[];
}

interface Classroom {
  id: string;
  name: string;
  subject?: { name: string };
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApiAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({}); // Số lượng submissions cho mỗi assignment
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; assignment: Assignment | null }>({
    open: false,
    assignment: null,
  });
  const [isLoadingData, setIsLoadingData] = useState(false); // Flag để tránh load đồng thời

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data khi quay lại từ trang khác (chỉ khi không đang load)
  useEffect(() => {
    let lastFocusTime = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleFocus = () => {
      const now = Date.now();
      // Chỉ refresh nếu đã qua ít nhất 3 giây từ lần focus trước
      if (now - lastFocusTime > 3000) {
        lastFocusTime = now;
        // Debounce: đợi 500ms trước khi load và check lại state
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          // Check lại state trước khi load
          if (!isLoadingData && !loading) {
            loadData();
          }
        }, 500);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount, không phụ thuộc vào state

  const loadData = async () => {
    // Tránh load đồng thời
    if (isLoadingData) {
      return;
    }

    try {
      setIsLoadingData(true);
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      // Get current user
      const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!userRes.ok) {
        // Handled by layout
        return;
      }

      const user = await userRes.json();

      // Get student profile
      const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        const student = studentsData.find((s: any) => s.user_id === user.id);

        if (student) {
          setStudentId(student.id);

          // Load assignments for student's classroom
          if (student.classroom_id) {
            const assignmentsRes = await fetch(`${API_BASE_URL}/api/assignments?classroom_id=${student.classroom_id}`, {
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            if (assignmentsRes.ok) {
              const assignmentsData = await assignmentsRes.json();
              setAssignments(assignmentsData);

              // Load submissions for each assignment
              const submissionsMap: Record<string, Submission> = {};
              const countsMap: Record<string, number> = {};
              for (const assignment of assignmentsData) {
                const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/submissions`, {
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });

                if (submissionsRes.ok) {
                  const submissionsData = await submissionsRes.json();
                  // Lấy tất cả submissions của học sinh
                  const studentSubmissions = submissionsData.filter((s: Submission) => s.student_id === student.id);

                  // Lưu số lượng submissions
                  countsMap[assignment.id] = studentSubmissions.length;

                  if (studentSubmissions.length > 0) {
                    // Nếu có nhiều submissions, lấy submission có điểm cao nhất
                    // Nếu chưa có điểm, lấy submission mới nhất
                    const bestSubmission = studentSubmissions.reduce((best: Submission, current: Submission) => {
                      const bestScore = best.score ?? -1;
                      const currentScore = current.score ?? -1;

                      // Ưu tiên submission có điểm cao hơn
                      if (currentScore > bestScore) {
                        return current;
                      }
                      // Nếu điểm bằng nhau hoặc chưa có điểm, ưu tiên submission mới hơn
                      if (currentScore === bestScore) {
                        return new Date(current.submitted_at) > new Date(best.submitted_at) ? current : best;
                      }
                      return best;
                    });

                    submissionsMap[assignment.id] = bestSubmission;
                  }
                }
              }
              setSubmissions(submissionsMap);
              setSubmissionCounts(countsMap);
            }

            // Load classroom info
            const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${student.classroom_id}`, {
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            if (classroomRes.ok) {
              const classroomData = await classroomRes.json();
              setClassrooms([classroomData]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions[assignment.id];

    if (submission) {
      if (submission.is_graded) {
        return { status: 'graded', label: 'Đã chấm điểm', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      }
      return { status: 'submitted', label: 'Đã nộp', color: 'bg-blue-100 text-blue-700', icon: CheckCircle };
    }

    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      if (now > dueDate) {
        return { status: 'overdue', label: 'Quá hạn', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      }
    }

    return { status: 'pending', label: 'Chưa làm', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  };

  const getAttemptsInfo = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    // Số lượt đã dùng = số lượng submissions từ countsMap (chính xác hơn)
    const attemptsUsed = submissionCounts[assignment.id] || (submission ? 1 : 0);
    const attemptsRemaining = assignment.attempts_allowed - attemptsUsed;
    return {
      attemptsUsed,
      attemptsRemaining,
      hasAttemptsLeft: attemptsRemaining > 0,
      isFullyUsed: attemptsUsed >= assignment.attempts_allowed,
      hasSubmission: !!submission // Đã làm bài hay chưa
    };
  };

  const handleStartAssignment = async (assignment: Assignment) => {
    const submission = submissions[assignment.id];

    // Kiểm tra lại từ API để đếm chính xác số lượng submissions
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (studentId) {
        const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/submissions`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          const studentSubmissions = submissionsData.filter((s: Submission) => s.student_id === studentId);
          const attemptsUsed = studentSubmissions.length;
          const attemptsRemaining = assignment.attempts_allowed - attemptsUsed;

          // Nếu đã hết lượt, hiển thị thông báo ngay và không cho vào
          if (attemptsRemaining <= 0) {
            const message = studentSubmissions.length > 0
              ? `⚠️ BẠN ĐÃ HẾT LƯỢT LÀM BÀI!\n\n` +
              `📝 Bài tập: ${assignment.title}\n` +
              `📊 Số lượt đã dùng: ${attemptsUsed}/${assignment.attempts_allowed}\n` +
              `❌ Số lượt còn lại: 0/${assignment.attempts_allowed}\n\n` +
              `✅ Bạn đã hoàn thành bài tập này.\n` +
              `Vui lòng xem kết quả bài làm của bạn.`
              : `⚠️ BẠN ĐÃ HẾT LƯỢT LÀM BÀI!\n\n` +
              `📝 Bài tập: ${assignment.title}\n` +
              `📊 Số lượt tối đa: ${assignment.attempts_allowed} lần\n` +
              `❌ Số lượt còn lại: 0/${assignment.attempts_allowed}\n\n` +
              `Bạn không thể làm bài này nữa.`;

            alert(message);
            return; // Không cho vào trang làm bài
          }
        }
      }
    } catch (error) {
      console.error('Error checking attempts:', error);
      // Fallback về kiểm tra local nếu API lỗi
      const { hasAttemptsLeft, hasSubmission } = getAttemptsInfo(assignment);
      if (!hasAttemptsLeft || hasSubmission) {
        const message = submission
          ? `⚠️ BẠN ĐÃ HẾT LƯỢT LÀM BÀI!\n\n` +
          `📝 Bài tập: ${assignment.title}\n` +
          `📊 Số lượt đã dùng: 1/${assignment.attempts_allowed}\n` +
          `❌ Số lượt còn lại: 0/${assignment.attempts_allowed}\n\n` +
          `✅ Bạn đã hoàn thành bài tập này.\n` +
          `Vui lòng xem kết quả bài làm của bạn.`
          : `⚠️ BẠN ĐÃ HẾT LƯỢT LÀM BÀI!\n\n` +
          `📝 Bài tập: ${assignment.title}\n` +
          `📊 Số lượt tối đa: ${assignment.attempts_allowed} lần\n` +
          `❌ Số lượt còn lại: 0/${assignment.attempts_allowed}\n\n` +
          `Bạn không thể làm bài này nữa.`;

        alert(message);
        return;
      }
    }

    // Nếu còn lượt, hiển thị dialog xác nhận
    setConfirmDialog({ open: true, assignment });
  };

  const handleConfirmStart = async () => {
    if (!confirmDialog.assignment) return;

    const assignment = confirmDialog.assignment;

    // Kiểm tra lại từ state local trước
    const { hasSubmission, hasAttemptsLeft, isFullyUsed } = getAttemptsInfo(assignment);
    if (hasSubmission || !hasAttemptsLeft || isFullyUsed) {
      setConfirmDialog({ open: false, assignment: null });
      alert('Bạn đã hết lượt làm bài này. Vui lòng xem kết quả.');
      return;
    }

    // Kiểm tra lại số lượt trước khi vào làm bài (kiểm tra real-time từ API)
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      if (studentId) {
        const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/submissions`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          const studentSubmission = submissionsData.find((s: Submission) => s.student_id === studentId);

          // Nếu có submission từ API, chặn ngay
          if (studentSubmission) {
            setConfirmDialog({ open: false, assignment: null });
            alert('Bạn đã hết lượt làm bài này. Vui lòng xem kết quả.');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking attempts:', error);
      // Nếu API lỗi, vẫn kiểm tra từ state local
      if (hasSubmission) {
        setConfirmDialog({ open: false, assignment: null });
        alert('Không thể kiểm tra số lượt. Vui lòng thử lại sau.');
        return;
      }
    }

    // Nếu còn lượt, cho phép vào làm bài
    router.push(`/student/assignments/${assignment.id}`);
    setConfirmDialog({ open: false, assignment: null });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không có hạn';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bài tập của tôi</h1>
            <p className="text-blue-100 mt-1">Xem và hoàn thành các bài tập được giao</p>
          </div>
        </div>
      </div>

      {classrooms.length > 0 && (
        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg shadow-sm w-fit">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-medium">Lớp: {classrooms[0].name}</span>
          {classrooms[0].subject && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Môn: {classrooms[0].subject.name}</span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const status = getAssignmentStatus(assignment);
          const submission = submissions[assignment.id];
          const StatusIcon = status.icon;

          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={status.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    {assignment.assignment_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {assignment.title}
                </CardTitle>
                {assignment.description && (
                  <CardDescription className="line-clamp-2 mt-1">{assignment.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Hạn nộp: {formatDate(assignment.due_date)}</span>
                  </div>
                  {assignment.time_limit_minutes > 0 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Thời gian: {assignment.time_limit_minutes} phút</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span>Điểm tối đa: {assignment.total_points}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info className="w-4 h-4 text-indigo-500" />
                    <span>
                      Số lượt: {getAttemptsInfo(assignment).attemptsUsed}/{assignment.attempts_allowed}
                    </span>
                  </div>
                </div>

                {submission && submission.is_graded && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-semibold text-green-800 flex justify-between items-center">
                      <span>Điểm số</span>
                      <span className="text-lg">{submission.score?.toFixed(2)}/{assignment.total_points}</span>
                    </div>
                    {submission.feedback && (
                      <div className="text-sm text-green-700 mt-1 pt-1 border-t border-green-200">
                        Nhận xét: {submission.feedback}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  {status.status !== 'overdue' && (
                    <>
                      {getAttemptsInfo(assignment).isFullyUsed ? (
                        // Nếu đã hết lượt, chỉ hiển thị nút "Xem kết quả"
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/student/assignments/${assignment.id}/result`)}
                        >
                          Xem kết quả
                        </Button>
                      ) : (
                        // Nếu còn lượt, hiển thị nút "Làm bài"
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleStartAssignment(assignment)}
                        >
                          Làm bài <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </>
                  )}
                  {status.status === 'overdue' && (
                    <Button variant="secondary" disabled className="w-full">
                      Đã quá hạn
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-900 text-lg font-medium mb-2">Chưa có bài tập nào</p>
            <p className="text-gray-500">Giáo viên chưa giao bài tập cho lớp của bạn</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, assignment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.assignment && (confirmDialog.assignment as any)._isNoAttemptsLeft ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Không thể làm bài
                </>
              ) : (
                <>
                  <Info className="w-5 h-5 text-blue-600" />
                  Xác nhận làm bài
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.assignment && (
                (confirmDialog.assignment as any)._isNoAttemptsLeft
                  ? 'Bạn đã hết lượt làm bài này.'
                  : 'Bạn có chắc chắn muốn bắt đầu làm bài này?'
              )}
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.assignment && (
            <div className="space-y-3 mt-4">
              {((confirmDialog.assignment as any)._isNoAttemptsLeft) ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">{confirmDialog.assignment.title}</h3>
                  <div className="space-y-2 text-sm text-red-800">
                    <div className="flex items-center justify-between">
                      <span>Số lượt đã dùng:</span>
                      <span className="font-bold">
                        {confirmDialog.assignment.attempts_allowed}/{confirmDialog.assignment.attempts_allowed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Số lượt còn lại:</span>
                      <span className="font-bold text-red-600">0</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm font-medium text-red-900">
                      ⚠️ Bạn đã hết lượt làm bài. Bài tập này cho phép tối đa {confirmDialog.assignment.attempts_allowed} lần.
                    </p>
                    {submissions[confirmDialog.assignment.id] && (
                      <p className="text-sm text-red-700 mt-2">
                        Vui lòng xem kết quả bài làm của bạn.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">{confirmDialog.assignment.title}</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>Số lượt đã dùng:</span>
                        <span className="font-bold">
                          {getAttemptsInfo(confirmDialog.assignment).attemptsUsed}/{confirmDialog.assignment.attempts_allowed}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Số lượt còn lại:</span>
                        <span className="font-bold text-blue-600">
                          {getAttemptsInfo(confirmDialog.assignment).attemptsRemaining} lượt
                        </span>
                      </div>
                      {confirmDialog.assignment.time_limit_minutes > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Thời gian làm bài:</span>
                          <span className="font-bold">{confirmDialog.assignment.time_limit_minutes} phút</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Điểm tối đa:</span>
                        <span className="font-bold">{confirmDialog.assignment.total_points} điểm</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Số lượt làm bài sẽ bị trừ sau khi bạn bắt đầu.
                  </p>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, assignment: null })}>
              {confirmDialog.assignment && (confirmDialog.assignment as any)._isNoAttemptsLeft ? 'Đóng' : 'Hủy'}
            </Button>
            {confirmDialog.assignment && !(confirmDialog.assignment as any)._isNoAttemptsLeft && (
              <Button onClick={handleConfirmStart} className="bg-blue-600 hover:bg-blue-700">
                Bắt đầu làm bài
              </Button>
            )}
            {confirmDialog.assignment && (confirmDialog.assignment as any)._isNoAttemptsLeft && submissions[confirmDialog.assignment.id] && (
              <Button
                onClick={() => {
                  router.push(`/student/assignments/${confirmDialog.assignment!.id}/result`);
                  setConfirmDialog({ open: false, assignment: null });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Xem kết quả
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
