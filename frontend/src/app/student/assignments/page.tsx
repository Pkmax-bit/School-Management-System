'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';

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
        router.push('/login');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Bài tập của tôi</h1>
          <p className="text-blue-100">Xem và làm các bài tập được giao</p>
        </div>

        {classrooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Lớp học: {classrooms[0].name}
              </CardTitle>
              {classrooms[0].subject && (
                <CardDescription>Môn: {classrooms[0].subject.name}</CardDescription>
              )}
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const submission = submissions[assignment.id];
            const StatusIcon = status.icon;

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{assignment.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline">
                          {assignment.assignment_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {assignment.description && (
                    <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Hạn nộp: {formatDate(assignment.due_date)}</span>
                    </div>
                    {assignment.time_limit_minutes > 0 && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>Thời gian: {assignment.time_limit_minutes} phút</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4" />
                      <span>Điểm tối đa: {assignment.total_points}</span>
                    </div>
                  </div>

                  {submission && submission.is_graded && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800">
                        Điểm: {submission.score?.toFixed(2)}/{assignment.total_points}
                      </div>
                      {submission.feedback && (
                        <div className="text-sm text-green-700 mt-1">
                          Nhận xét: {submission.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!submission && status.status !== 'overdue' && (
                      <Button 
                        className="flex-1"
                        onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                      >
                        Làm bài
                      </Button>
                    )}
                    {submission && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/student/assignments/${assignment.id}/result`)}
                      >
                        Xem kết quả
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 text-lg font-medium mb-2">Chưa có bài tập nào</p>
              <p className="text-slate-500">Giáo viên chưa giao bài tập cho lớp của bạn</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
