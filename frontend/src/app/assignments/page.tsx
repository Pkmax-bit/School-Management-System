'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/AdminSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { PageWithBackground } from '@/components/PageWithBackground';
import { School, Search, FileText, Edit3, ArrowLeft, Plus, Loader2, X, Save, Eye } from 'lucide-react';
import { Quiz, QuizBuilder } from '@/components/assignments/QuizBuilder';
import { QuizPreviewModal } from '@/components/assignments/QuizPreviewModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Classroom {
  id: string;
  name: string;
  code: string;
  description?: string;
  subject?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  assignmentCount?: number; // Số lượng bài tập trong lớp
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_type: 'multiple_choice' | 'essay';
  total_points: number;
  due_date?: string;
  created_at: string;
  classroom_ids: string[];
  time_limit_minutes: number;
  attempts_allowed: number;
  shuffle_questions: boolean;
  question_count?: number;
}

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useApiAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [view, setView] = useState<'classrooms' | 'assignments'>('classrooms');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createType, setCreateType] = useState<'multiple_choice' | 'essay' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; name: string; subject: string; studentCount: number }>>([]);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  // Form state cho bài tập tự luận
  const [essayForm, setEssayForm] = useState<{
    title: string;
    description: string;
    total_points: number;
    due_date: string;
    selectedClassrooms: string[];
    questions: { id: string; text: string; points: number; imageUrl?: string }[];
  }>({
    title: '',
    description: '',
    total_points: 100,
    due_date: '',
    selectedClassrooms: [] as string[],
    questions: [{ id: '1', text: '', points: 10, imageUrl: '' }],
  });

  // Form state cho bài tập trắc nghiệm
  const [quizForm, setQuizForm] = useState<Quiz>({
    id: 'new-' + Date.now(),
    title: '',
    description: '',
    timeLimitMinutes: 0,
    attemptsAllowed: 1,
    shuffleQuestions: false,
    assignedClasses: [],
    questions: [],
  });

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user) {
      loadTeacherId();
      loadClassrooms();
    }
  }, [authLoading, user]);

  const loadTeacherId = async () => {
    if (!isTeacher || !user?.id) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const teachersRes = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        const teacher = teachersData.find((t: any) => t.user_id === user.id);
        if (teacher) {
          setTeacherId(teacher.id);
          loadAvailableClasses(teacher.id);
        }
      }
    } catch (e) {
      console.error('Error loading teacher ID:', e);
    }
  };

  const loadAvailableClasses = async (teacherIdParam: string) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const classroomsRes = await fetch(`${API_BASE_URL}/api/classrooms?teacher_id=${teacherIdParam}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();

        // Load subjects
        const subjectsRes = await fetch(`${API_BASE_URL}/api/subjects?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const subjectsMap: Record<string, string> = {};
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          subjectsData.forEach((s: any) => {
            subjectsMap[s.id] = s.name;
          });
        }

        // Load students để đếm
        const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=10000`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const studentCountMap: Record<string, number> = {};
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          studentsData.forEach((student: any) => {
            if (student.classroom_id) {
              studentCountMap[student.classroom_id] = (studentCountMap[student.classroom_id] || 0) + 1;
            }
          });
        }

        const classesWithDetails = classroomsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          subject: subjectsMap[c.subject_id] || 'Chưa có môn học',
          studentCount: studentCountMap[c.id] || 0,
        }));

        setAvailableClasses(classesWithDetails);
      }
    } catch (err) {
      console.error('Error loading available classes:', err);
    }
  };

  useEffect(() => {
    if (selectedClassroom) {
      loadAssignments(selectedClassroom.id);
    }
  }, [selectedClassroom]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      // Nếu là giáo viên, chỉ load các lớp mà giáo viên đó dạy
      let teacherId: string | null = null;
      if (isTeacher && user?.id) {
        // Lấy teacher_id từ user_id
        try {
          const teachersRes = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (teachersRes.ok) {
            const teachersData = await teachersRes.json();
            const teacher = teachersData.find((t: any) => t.user_id === user.id);
            if (teacher) {
              teacherId = teacher.id;
            }
          }
        } catch (e) {
          console.error('Error loading teacher ID:', e);
        }
      }

      // Load classrooms
      const url = teacherId
        ? `${API_BASE_URL}/api/classrooms?teacher_id=${teacherId}&limit=1000`
        : `${API_BASE_URL}/api/classrooms?limit=1000`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Fetch subject and teacher info for each classroom
        const classroomsWithDetails = await Promise.all(
          data.map(async (classroom: any) => {
            const details: Classroom = {
              id: classroom.id,
              name: classroom.name,
              code: classroom.code,
              description: classroom.description,
            };

            if (classroom.subject_id) {
              try {
                const subjectRes = await fetch(`${API_BASE_URL}/api/subjects/${classroom.subject_id}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });
                if (subjectRes.ok) {
                  const subject = await subjectRes.json();
                  details.subject = { id: subject.id, name: subject.name };
                }
              } catch (e) {
                console.error('Error fetching subject:', e);
              }
            }

            // Đếm số lượng bài tập trong lớp này
            try {
              const assignmentsRes = await fetch(`${API_BASE_URL}/api/assignments?classroom_id=${classroom.id}`, {
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
              if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json();
                details.assignmentCount = assignmentsData.length;
              }
            } catch (e) {
              console.error('Error counting assignments:', e);
              details.assignmentCount = 0;
            }

            return details;
          })
        );
        setClassrooms(classroomsWithDetails);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (classroomId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/assignments?classroom_id=${classroomId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else {
        console.error('Failed to load assignments:', response.statusText);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomClick = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setView('assignments');
  };

  const handleBackToClassrooms = () => {
    setView('classrooms');
    setSelectedClassroom(null);
    setAssignments([]);
    setCreateType(null);
  };

  const handleCreateMultipleChoice = () => {
    setCreateType('multiple_choice');
    // Reset form và tự động chọn lớp đang xem
    setQuizForm({
      id: 'new-' + Date.now(),
      title: '',
      description: '',
      timeLimitMinutes: 0,
      attemptsAllowed: 1,
      shuffleQuestions: false,
      assignedClasses: selectedClassroom ? [selectedClassroom.id] : [],
      questions: [],
      dueDate: '',
    });
  };

  const handleCreateEssay = () => {
    setCreateType('essay');
    // Reset form và tự động chọn lớp đang xem
    setEssayForm({
      title: '',
      description: '',
      total_points: 100,
      due_date: '',
      selectedClassrooms: selectedClassroom ? [selectedClassroom.id] : [],
      questions: [{ id: '1', text: '', points: 10 }],
    });
  };

  const handlePreviewAssignment = async (assignment: Assignment) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      // Load questions
      const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/questions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let questions: any[] = [];
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        if (assignment.assignment_type === 'multiple_choice') {
          questions = questionsData.map((q: any) => ({
            id: q.id,
            title: q.question_text,
            points: q.points,
            choices: q.options?.map((opt: any, idx: number) => ({
              id: opt.id || String.fromCharCode(65 + idx),
              text: opt.text || '',
              isCorrect: opt.id === q.correct_answer || String.fromCharCode(65 + idx) === q.correct_answer,
            })) || [],
            required: true,
            shuffleChoices: false,
          }));
        } else {
          questions = questionsData.map((q: any) => ({
            id: q.id,
            title: q.question_text,
            points: q.points,
            choices: [],
            required: true,
            shuffleChoices: false,
          }));
        }
      }

      const quiz: Quiz = {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        timeLimitMinutes: assignment.time_limit_minutes || 0,
        attemptsAllowed: assignment.attempts_allowed || 1,
        shuffleQuestions: assignment.shuffle_questions || false,
        assignedClasses: assignment.classroom_ids || [],
        questions: questions,
        dueDate: assignment.due_date || '',
      };

      setPreviewQuiz(quiz);
    } catch (err) {
      console.error('Error loading assignment for preview:', err);
      setError('Không thể tải bài tập để xem trước');
    }
  };

  const handleCancelCreate = () => {
    setCreateType(null);
    setError(null);
  };

  const handleSaveMultipleChoice = async (quiz: Quiz) => {
    if (!teacherId || !selectedClassroom) {
      setError('Thiếu thông tin cần thiết');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      const subjectId = selectedClassroom.subject?.id;
      if (!subjectId) {
        setError('Lớp học chưa có môn học được gán');
        setSaving(false);
        return;
      }

      if (quiz.assignedClasses.length === 0) {
        setError('Vui lòng chọn ít nhất một lớp học');
        setSaving(false);
        return;
      }

      if (!quiz.dueDate) {
        setError('Vui lòng chọn hạn nộp');
        setSaving(false);
        return;
      }

      const assignmentData = {
        title: quiz.title,
        description: quiz.description,
        subject_id: subjectId,
        teacher_id: teacherId,
        assignment_type: 'multiple_choice',
        total_points: quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 100,
        due_date: quiz.dueDate,
        time_limit_minutes: quiz.timeLimitMinutes || 0,
        attempts_allowed: quiz.attemptsAllowed || 1,
        shuffle_questions: quiz.shuffleQuestions || false,
        classroom_ids: quiz.assignedClasses,
      };

      const createRes = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(assignmentData),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.detail || 'Không thể tạo bài tập');
      }

      const newAssignment = await createRes.json();
      const assignmentId = newAssignment.id;

      // Create questions
      for (const question of quiz.questions) {
        const questionData = {
          question_text: question.title,
          question_type: 'multiple_choice',
          points: question.points || 1,
          options: question.choices?.map((choice, idx) => ({
            id: String.fromCharCode(65 + idx),
            text: choice.text,
          })),
          correct_answer: question.choices?.find(c => c.isCorrect)?.id ||
            String.fromCharCode(65 + question.choices?.findIndex(c => c.isCorrect) || 0),
          order_index: quiz.questions.indexOf(question),
          image_url: question.imageUrl || null,
          attachment_link: question.attachmentLink || null,
        };

        await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(questionData),
        });
      }

      // Reload assignments
      await loadAssignments(selectedClassroom.id);
      setCreateType(null);
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      setError(err.message || 'Không thể lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEssay = async () => {
    if (!teacherId || !selectedClassroom) {
      setError('Thiếu thông tin cần thiết');
      return;
    }

    if (!essayForm.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    if (essayForm.questions.length === 0 || !essayForm.questions[0].text.trim()) {
      setError('Vui lòng nhập ít nhất một câu hỏi');
      return;
    }

    if (essayForm.selectedClassrooms.length === 0) {
      setError('Vui lòng chọn ít nhất một lớp học');
      return;
    }

    if (!essayForm.due_date) {
      setError('Vui lòng chọn hạn nộp');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      const subjectId = selectedClassroom.subject?.id;
      if (!subjectId) {
        setError('Lớp học chưa có môn học được gán');
        setSaving(false);
        return;
      }

      const assignmentData = {
        title: essayForm.title,
        description: essayForm.description,
        subject_id: subjectId,
        teacher_id: teacherId,
        assignment_type: 'essay',
        total_points: essayForm.total_points,
        due_date: essayForm.due_date || null,
        time_limit_minutes: 0,
        attempts_allowed: 1,
        shuffle_questions: false,
        classroom_ids: essayForm.selectedClassrooms,
      };

      const createRes = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(assignmentData),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.detail || 'Không thể tạo bài tập');
      }

      const newAssignment = await createRes.json();
      const assignmentId = newAssignment.id;

      // Create questions
      for (const question of essayForm.questions) {
        const questionData = {
          question_text: question.text,
          question_type: 'essay',
          points: question.points,
          order_index: essayForm.questions.indexOf(question),
        };

        await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(questionData),
        });
      }

      // Reload assignments
      await loadAssignments(selectedClassroom.id);
      setCreateType(null);
      setEssayForm({
        title: '',
        description: '',
        total_points: 100,
        due_date: '',
        selectedClassrooms: [],
        questions: [{ id: '1', text: '', points: 10, imageUrl: '' }],
      });
    } catch (err: any) {
      console.error('Error saving essay assignment:', err);
      setError(err.message || 'Không thể lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  const filteredClassrooms = classrooms.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const multipleChoiceAssignments = assignments.filter((a) => a.assignment_type === 'multiple_choice');
  const essayAssignments = assignments.filter((a) => a.assignment_type === 'essay');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (!isTeacher && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/login')}>Đến trang đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {isTeacher ? (
        <TeacherSidebar
          currentPage="assignments"
          onNavigate={(path) => router.push(path)}
          onLogout={() => { }}
          user={{ name: user?.name, email: user?.email }}
        />
      ) : (
        <AdminSidebar
          currentPage="assignments"
          onNavigate={(path) => router.push(path)}
          onLogout={() => { }}
          userName={user?.name}
          userEmail={user?.email}
        />
      )}

      <div
        className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {view === 'classrooms' ? (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl lg:text-4xl font-bold mb-2">Quản lý Bài tập</h1>
                    <p className="text-blue-100 text-sm lg:text-lg">
                      {isTeacher
                        ? 'Chọn lớp học của bạn để xem và quản lý bài tập'
                        : 'Chọn lớp học để xem và quản lý bài tập'}
                    </p>
                  </div>
                  {isTeacher && (
                    <Button
                      onClick={() => router.push('/teacher/assignments')}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 font-bold shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tạo bài tập mới
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Tìm lớp học theo tên, mã lớp hoặc môn học..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <CardTitle>Danh sách Lớp học</CardTitle>
                  <CardDescription>
                    {isTeacher
                      ? `Bạn đang dạy ${filteredClassrooms.length} lớp học. Click vào lớp để xem bài tập.`
                      : 'Click vào lớp học để xem danh sách bài tập'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredClassrooms.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <School className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p>Không tìm thấy lớp học nào</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredClassrooms.map((classroom) => (
                        <Card
                          key={classroom.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                          onClick={() => handleClassroomClick(classroom)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{classroom.name}</CardTitle>
                              <Badge variant="outline">{classroom.code}</Badge>
                            </div>
                            {classroom.subject && (
                              <CardDescription className="mt-2">
                                Môn: {classroom.subject.name}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FileText className="w-4 h-4" />
                                <span>Click để xem bài tập</span>
                              </div>
                              {classroom.assignmentCount !== undefined && (
                                <Badge variant="secondary" className="ml-auto">
                                  {classroom.assignmentCount} bài tập
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={handleBackToClassrooms}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                    {selectedClassroom?.name}
                  </h1>
                  {selectedClassroom?.subject && (
                    <p className="text-slate-600">Môn: {selectedClassroom.subject.name}</p>
                  )}
                </div>
                {isTeacher && (
                  <Button
                    onClick={() => router.push('/teacher/assignments')}
                    className="ml-auto"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Tạo bài tập mới
                  </Button>
                )}
              </div>

              {error && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <p>{error}</p>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">×</Button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bài tập Trắc nghiệm */}
                <Card>
                  <CardHeader className="bg-blue-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-blue-600" />
                          Bài tập Trắc nghiệm
                        </CardTitle>
                        <CardDescription>
                          {multipleChoiceAssignments.length} bài tập
                        </CardDescription>
                      </div>
                      {isTeacher && !createType && (
                        <Button size="sm" onClick={handleCreateMultipleChoice}>
                          <Plus className="w-4 h-4 mr-1" /> Tạo
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {createType === 'multiple_choice' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Tạo bài tập trắc nghiệm</h3>
                          <Button variant="ghost" size="sm" onClick={handleCancelCreate}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <QuizBuilder
                          value={quizForm}
                          onChange={(updated) => setQuizForm(updated)}
                          onPreview={(quiz) => setPreviewQuiz(quiz)}
                          onSave={handleSaveMultipleChoice}
                          availableClasses={availableClasses}
                        />
                      </div>
                    ) : multipleChoiceAssignments.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Chưa có bài tập trắc nghiệm</p>
                        {isTeacher && (
                          <Button size="sm" variant="outline" onClick={handleCreateMultipleChoice} className="mt-4">
                            <Plus className="w-4 h-4 mr-1" /> Tạo bài tập đầu tiên
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {multipleChoiceAssignments.map((assignment) => (
                          <Card
                            key={assignment.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/assignments/${assignment.id}`)}>
                                  <h3 className="font-semibold text-slate-800 mb-1">
                                    {assignment.title}
                                  </h3>
                                  {assignment.description && (
                                    <p className="text-sm text-slate-600 mb-2">
                                      {assignment.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>Điểm: {assignment.total_points}</span>
                                    {assignment.due_date && (
                                      <span>
                                        Hạn nộp: {new Date(assignment.due_date).toLocaleString('vi-VN', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-100 text-blue-700">Trắc nghiệm</Badge>
                                  {isTeacher && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewAssignment(assignment);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bài tập Tự luận */}
                <Card>
                  <CardHeader className="bg-green-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          Bài tập Tự luận
                        </CardTitle>
                        <CardDescription>
                          {essayAssignments.length} bài tập
                        </CardDescription>
                      </div>
                      {isTeacher && !createType && (
                        <Button size="sm" onClick={handleCreateEssay}>
                          <Plus className="w-4 h-4 mr-1" /> Tạo
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {createType === 'essay' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Tạo bài tập tự luận</h3>
                          <Button variant="ghost" size="sm" onClick={handleCancelCreate}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tiêu đề bài tập *</Label>
                            <Input
                              value={essayForm.title}
                              onChange={(e) => setEssayForm({ ...essayForm, title: e.target.value })}
                              placeholder="VD: Bài tập lớn - Dự án cuối kỳ"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea
                              value={essayForm.description}
                              onChange={(e) => setEssayForm({ ...essayForm, description: e.target.value })}
                              placeholder="Hướng dẫn làm bài, yêu cầu..."
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Tổng điểm</Label>
                              <Input
                                type="number"
                                min={0}
                                value={essayForm.total_points}
                                onChange={(e) => setEssayForm({ ...essayForm, total_points: parseInt(e.target.value) || 100 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Hạn nộp (Ngày, giờ) *</Label>
                              <Input
                                type="datetime-local"
                                value={essayForm.due_date}
                                onChange={(e) => setEssayForm({ ...essayForm, due_date: e.target.value })}
                                required
                              />
                              <p className="text-xs text-slate-500">Chọn ngày, tháng, năm và giờ hạn nộp</p>
                            </div>
                          </div>

                          {/* Chọn lớp học */}
                          <div className="space-y-3">
                            <Label>Gán cho lớp học *</Label>
                            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                              {availableClasses.length === 0 ? (
                                <p className="text-sm text-slate-500">Không có lớp học nào</p>
                              ) : (
                                <div className="space-y-2">
                                  {availableClasses.map((classItem) => (
                                    <div key={classItem.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`class-${classItem.id}`}
                                        checked={essayForm.selectedClassrooms.includes(classItem.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setEssayForm({
                                              ...essayForm,
                                              selectedClassrooms: [...essayForm.selectedClassrooms, classItem.id],
                                            });
                                          } else {
                                            setEssayForm({
                                              ...essayForm,
                                              selectedClassrooms: essayForm.selectedClassrooms.filter(id => id !== classItem.id),
                                            });
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`class-${classItem.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex flex-col">
                                            <span className="font-medium">{classItem.name}</span>
                                            <span className="text-xs text-slate-500">{classItem.subject}</span>
                                          </div>
                                        </div>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {essayForm.selectedClassrooms.length > 0 && (
                              <p className="text-xs text-slate-600">
                                Đã chọn {essayForm.selectedClassrooms.length} lớp học
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Câu hỏi *</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEssayForm({
                                    ...essayForm,
                                    questions: [...essayForm.questions, { id: Date.now().toString(), text: '', points: 10, imageUrl: '' }],
                                  });
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" /> Thêm câu hỏi
                              </Button>
                            </div>

                            {essayForm.questions.map((q, idx) => (
                              <Card key={q.id} className="bg-slate-50">
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="font-semibold">Câu hỏi {idx + 1}</Label>
                                    {essayForm.questions.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEssayForm({
                                            ...essayForm,
                                            questions: essayForm.questions.filter((_, i) => i !== idx),
                                          });
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <Textarea
                                    value={q.text}
                                    onChange={(e) => {
                                      const newQuestions = [...essayForm.questions];
                                      newQuestions[idx].text = e.target.value;
                                      setEssayForm({ ...essayForm, questions: newQuestions });
                                    }}
                                    placeholder="Nhập nội dung câu hỏi..."
                                    rows={3}
                                  />

                                  {/* Image Upload */}
                                  <div className="space-y-2">
                                    <Label className="text-sm flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      Hình ảnh câu hỏi (tùy chọn)
                                    </Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              const newQuestions = [...essayForm.questions];
                                              newQuestions[idx] = {
                                                ...newQuestions[idx],
                                                imageUrl: reader.result as string,
                                              };
                                              setEssayForm({ ...essayForm, questions: newQuestions });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="flex-1"
                                      />
                                      {q.imageUrl && (
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => {
                                            const newQuestions = [...essayForm.questions];
                                            newQuestions[idx].imageUrl = undefined;
                                            setEssayForm({ ...essayForm, questions: newQuestions });
                                          }}
                                          type="button"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                    {q.imageUrl && (
                                      <div className="mt-2">
                                        <img
                                          src={q.imageUrl}
                                          alt="Câu hỏi"
                                          className="max-w-full h-auto rounded-lg border border-slate-200"
                                          style={{ maxHeight: '200px' }}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm">Điểm:</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={q.points}
                                      onChange={(e) => {
                                        const newQuestions = [...essayForm.questions];
                                        newQuestions[idx].points = parseInt(e.target.value) || 0;
                                        setEssayForm({ ...essayForm, questions: newQuestions });
                                      }}
                                      className="w-20"
                                    />
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" onClick={handleCancelCreate} disabled={saving}>
                              Hủy
                            </Button>
                            {/* Save Button */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  // Create preview data for essay
                                  const essayPreview = {
                                    id: 'preview-' + Date.now(),
                                    title: essayForm.title || 'Bài tập tự luận mới',
                                    description: essayForm.description || '',
                                    timeLimitMinutes: 0,
                                    attemptsAllowed: 1,
                                    shuffleQuestions: false,
                                    assignedClasses: essayForm.selectedClassrooms,
                                    questions: essayForm.questions.map((q, idx) => ({
                                      id: q.id,
                                      title: q.text || `Câu hỏi ${idx + 1}`,
                                      points: q.points,
                                      choices: [],
                                      required: true,
                                      shuffleChoices: false,
                                    })),
                                    dueDate: essayForm.due_date,
                                  };
                                  setPreviewQuiz(essayPreview);
                                }}
                                disabled={!essayForm.title || essayForm.questions.length === 0}
                              >
                                <Eye className="w-4 h-4 mr-1" /> Xem trước
                              </Button>
                              <Button
                                onClick={handleSaveEssay}
                                disabled={saving || !essayForm.title || essayForm.questions.length === 0}
                              >
                                {saving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-1" /> Lưu bài tập
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : essayAssignments.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Chưa có bài tập tự luận</p>
                        {isTeacher && (
                          <Button size="sm" variant="outline" onClick={handleCreateEssay} className="mt-4">
                            <Plus className="w-4 h-4 mr-1" /> Tạo bài tập đầu tiên
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {essayAssignments.map((assignment) => (
                          <Card
                            key={assignment.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/assignments/${assignment.id}`)}>
                                  <h3 className="font-semibold text-slate-800 mb-1">
                                    {assignment.title}
                                  </h3>
                                  {assignment.description && (
                                    <p className="text-sm text-slate-600 mb-2">
                                      {assignment.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>Điểm: {assignment.total_points}</span>
                                    {assignment.due_date && (
                                      <span>
                                        Hạn nộp: {new Date(assignment.due_date).toLocaleString('vi-VN', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-700">Tự luận</Badge>
                                  {isTeacher && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewAssignment(assignment);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
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
