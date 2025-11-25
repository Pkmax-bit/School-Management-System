'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, Users, Loader2, ArrowRight } from 'lucide-react';
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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
              for (const assignment of assignmentsData) {
                const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/submissions`, {
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });

                if (submissionsRes.ok) {
                  const submissionsData = await submissionsRes.json();
                  const studentSubmission = submissionsData.find((s: Submission) => s.student_id === student.id);
                  if (studentSubmission) {
                    submissionsMap[assignment.id] = studentSubmission;
                  }
                }
              }
              setSubmissions(submissionsMap);
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
                  {!submission && status.status !== 'overdue' && (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                    >
                      Làm bài <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  {submission && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/student/assignments/${assignment.id}/result`)}
                    >
                      Xem kết quả
                    </Button>
                  )}
                  {!submission && status.status === 'overdue' && (
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
    </div>
  );
}
