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
import { Plus, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to convert datetime-local to ISO string with timezone offset
// Prevents timezone conversion issues (e.g., +7 hours)
// datetime-local format: "YYYY-MM-DDTHH:mm" (local time, no timezone)
// Returns: "YYYY-MM-DDTHH:mm:ss+HH:MM" (with local timezone offset)
function formatDateTimeLocalToISO(dateTimeLocal: string): string {
  if (!dateTimeLocal) return '';
  
  // Parse the datetime-local string directly to avoid timezone conversion
  // Format: "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = dateTimeLocal.split('T');
  if (!datePart || !timePart) return dateTimeLocal;
  
  // Get current timezone offset
  // getTimezoneOffset() returns offset in minutes, negative for positive timezones
  // Example: UTC+7 returns -420 (7 hours * 60 minutes)
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  // If offsetMinutes is negative (e.g., -420 for UTC+7), we need positive sign (+)
  // If offsetMinutes is positive (e.g., 300 for UTC-5), we need negative sign (-)
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  
  // Ensure time part has seconds
  const timeWithSeconds = timePart.split(':').length === 2 ? `${timePart}:00` : timePart;
  
  // Return ISO string with timezone offset: "YYYY-MM-DDTHH:mm:ss+HH:MM"
  return `${datePart}T${timeWithSeconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
  subject?: {
    id: string;
    name: string;
  };
  studentCount?: number;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_type: 'multiple_choice' | 'essay';
  total_points: number;
  start_date?: string;
  due_date?: string;
  time_limit_minutes: number;
  attempts_allowed: number;
  shuffle_questions: boolean;
  classroom_ids: string[];
  created_at: string;
  question_count?: number; // Số lượng câu hỏi
}

interface AssignmentQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  options?: Array<{ id: string; text: string; value?: string }>;
  correct_answer?: string;
  order_index: number;
  image_url?: string;
  attachment_link?: string;
}

export default function TeacherAssignmentsPage() {
  const { user, loading: authLoading, logout } = useTeacherAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Load data từ API
  useEffect(() => {
    if (!authLoading && user) {
      loadTeacherId();
    }
  }, [authLoading, user]);

  const loadTeacherId = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      
      // Get teacher_id from user_id
      const teachersRes = await fetch(`${API_BASE_URL}/api/teachers?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        const teacher = teachersData.find((t: any) => t.user_id === user?.id);
        if (teacher) {
          setTeacherId(teacher.id);
          loadData(teacher.id);
        } else {
          setError('Không tìm thấy thông tin giáo viên. Vui lòng liên hệ quản trị viên.');
        }
      }
    } catch (err) {
      console.error('Error loading teacher ID:', err);
      setError('Không thể tải thông tin giáo viên.');
    }
  };

  const loadData = async (teacherIdParam: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      
      // Load assignments của teacher
      const assignmentsRes = await fetch(`${API_BASE_URL}/api/assignments?teacher_id=${teacherIdParam}&assignment_type=multiple_choice`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        
        // Load số lượng câu hỏi cho mỗi assignment (song song để tối ưu)
        const assignmentsWithQuestionCount = await Promise.all(
          assignmentsData.map(async (assignment: Assignment) => {
            try {
              const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/questions`, {
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
              
              if (questionsRes.ok) {
                const questionsData = await questionsRes.json();
                return {
                  ...assignment,
                  question_count: Array.isArray(questionsData) ? questionsData.length : 0,
                };
              }
              return { ...assignment, question_count: 0 };
            } catch (err) {
              console.error(`Error loading questions for assignment ${assignment.id}:`, err);
              return { ...assignment, question_count: 0 };
            }
          })
        );
        
        setAssignments(assignmentsWithQuestionCount);
      } else {
        setAssignments([]);
      }

      // Load classrooms - chỉ lấy các lớp mà giáo viên này dạy
      const classroomsRes = await fetch(`${API_BASE_URL}/api/classrooms?teacher_id=${teacherIdParam}&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json();
        
        // Load subjects để lấy tên môn học
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
          setSubjects(subjectsData);
        }

        // Load students để đếm số học sinh trong mỗi lớp
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

        // Map classrooms với subject và student count
        const classroomsWithDetails: Classroom[] = classroomsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          subject: c.subject_id ? {
            id: c.subject_id,
            name: subjectsMap[c.subject_id] || 'Chưa có môn học'
          } : undefined,
          studentCount: studentCountMap[c.id] || 0,
        }));

        setAvailableClasses(classroomsWithDetails);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Convert Assignment to Quiz format
  const assignmentToQuiz = async (assignment: Assignment): Promise<Quiz> => {
    // Format start_date to datetime-local format if it exists
    let startDateFormatted = '';
    if (assignment.start_date) {
      const date = new Date(assignment.start_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      startDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Format due_date to datetime-local format if it exists
    let dueDateFormatted = '';
    if (assignment.due_date) {
      const date = new Date(assignment.due_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      dueDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    
    // Load questions
    let questions: any[] = [];
    try {
      const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}/questions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

        if (questionsRes.ok) {
          const questionsData: AssignmentQuestion[] = await questionsRes.json();
          questions = questionsData.map((q) => ({
            id: q.id,
            title: q.question_text,
            points: q.points,
            choices:
              q.options?.map((opt) => ({
                id: opt.id,
                text: opt.text,
                isCorrect: opt.id === q.correct_answer,
              })) || [],
            correctAnswer: q.correct_answer,
            questionType: q.question_type,
            imageUrl: q.image_url,
            attachmentLink: q.attachment_link,
          }));
        }
    } catch (err) {
      console.error('Error loading questions:', err);
    }

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      timeLimitMinutes: assignment.time_limit_minutes,
      attemptsAllowed: assignment.attempts_allowed,
      shuffleQuestions: assignment.shuffle_questions,
      assignedClasses: assignment.classroom_ids || [],
      questions: questions,
      startDate: startDateFormatted,
      dueDate: dueDateFormatted,
    };
  };

  const editingQuiz = useMemo(() => {
    if (!editingId) return null;
    const assignment = assignments.find((a) => a.id === editingId);
    if (!assignment) return null;
    
    // Format start_date
    let startDateFormatted = '';
    if (assignment.start_date) {
      const date = new Date(assignment.start_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      startDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Format due_date
    let dueDateFormatted = '';
    if (assignment.due_date) {
      const date = new Date(assignment.due_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      dueDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Convert assignment to quiz format (synchronous for now, will load questions on edit)
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      timeLimitMinutes: assignment.time_limit_minutes,
      attemptsAllowed: assignment.attempts_allowed,
      shuffleQuestions: assignment.shuffle_questions,
      assignedClasses: assignment.classroom_ids || [],
      questions: [], // Will be loaded separately
      startDate: startDateFormatted,
      dueDate: dueDateFormatted,
    } as Quiz;
  }, [assignments, editingId]);

  // Load questions when editing (chỉ khi assignment đã tồn tại trong DB)
  useEffect(() => {
    if (editingId && !editingId.startsWith('new-')) {
      // Chỉ load questions nếu assignment đã được lưu (không phải temporary ID)
      const assignment = assignments.find((a) => a.id === editingId);
      if (assignment) {
        loadQuestionsForAssignment(editingId);
      }
    }
  }, [editingId, assignments]);

  const loadQuestionsForAssignment = async (assignmentId: string) => {
    // Không load questions cho temporary IDs
    if (assignmentId.startsWith('new-')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (questionsRes.ok) {
        const questionsData: AssignmentQuestion[] = await questionsRes.json();
        // Update editing quiz with questions
        // This will be handled by QuizBuilder component
      } else if (questionsRes.status !== 404) {
        // Chỉ log lỗi nếu không phải 404 (assignment chưa tồn tại)
        console.error('Error loading questions:', questionsRes.statusText);
      }
    } catch (err) {
      // Chỉ log lỗi nếu không phải do temporary ID
      if (!assignmentId.startsWith('new-')) {
        console.error('Error loading questions:', err);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
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
      id: 'new-' + Date.now(),
      title: 'Bài trắc nghiệm mới',
      description: '',
      timeLimitMinutes: 0,
      attemptsAllowed: 1,
      shuffleQuestions: false,
      assignedClasses: [],
      questions: [],
      dueDate: '',
    };
    setEditingId(newQuiz.id);
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;

    try {
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
        if (teacherId) {
          await loadData(teacherId); // Reload data
        }
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Không thể xóa bài tập');
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError('Không thể xóa bài tập. Vui lòng thử lại.');
    }
  };

  const handleDuplicate = async (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) return;

    try {
      setError(null);
      setSaving(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      
      if (!teacherId) {
        setError('Không tìm thấy thông tin giáo viên. Vui lòng thử lại.');
        setSaving(false);
        return;
      }

      // Get subject_id from first classroom
      let subjectId = '';
      if (assignment.classroom_ids && assignment.classroom_ids.length > 0) {
        const firstClass = availableClasses.find(c => assignment.classroom_ids.includes(c.id));
        subjectId = firstClass?.subject?.id || '';
      }
      
      if (!subjectId) {
        setError('Không tìm thấy môn học. Vui lòng chọn lớp học có môn học được gán trước.');
        setSaving(false);
        return;
      }

      if (!subjectId) {
        setError('Không tìm thấy môn học. Vui lòng chọn môn học cho lớp học trước.');
        setSaving(false);
        return;
      }

      // Create new assignment
      const newAssignment = {
        title: assignment.title + ' (bản sao)',
        description: assignment.description,
        subject_id: subjectId,
        teacher_id: teacherId,
        assignment_type: assignment.assignment_type,
        total_points: assignment.total_points,
        due_date: assignment.due_date,
        time_limit_minutes: assignment.time_limit_minutes,
        attempts_allowed: assignment.attempts_allowed,
        shuffle_questions: assignment.shuffle_questions,
        classroom_ids: assignment.classroom_ids,
      };

      const createRes = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newAssignment),
      });

      if (createRes.ok) {
        if (teacherId) {
          await loadData(teacherId); // Reload assignments
        }
      } else {
        const errorData = await createRes.json();
        setError(errorData.detail || 'Không thể nhân bản bài tập');
      }
    } catch (err) {
      console.error('Error duplicating assignment:', err);
      setError('Không thể nhân bản bài tập. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (quiz: Quiz) => {
    try {
      setError(null);
      setSaving(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      
      if (!teacherId) {
        setError('Không tìm thấy thông tin giáo viên. Vui lòng thử lại.');
        setSaving(false);
        return;
      }
      
      // Get subject_id from first assigned class
      let subjectId = '';
      if (quiz.assignedClasses.length > 0) {
        const firstClass = availableClasses.find(c => quiz.assignedClasses.includes(c.id));
        subjectId = firstClass?.subject?.id || '';
      }

      if (!subjectId && quiz.assignedClasses.length > 0) {
        setError('Vui lòng chọn lớp học có môn học được gán.');
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

      // If it's a new assignment (id starts with 'new-')
      if (quiz.id.startsWith('new-')) {
        // Create new assignment
        const assignmentData = {
          title: quiz.title,
          description: quiz.description,
          subject_id: subjectId,
          teacher_id: teacherId,
          assignment_type: 'multiple_choice',
          total_points: quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 100,
          start_date: quiz.startDate ? formatDateTimeLocalToISO(quiz.startDate) : null,
          due_date: formatDateTimeLocalToISO(quiz.dueDate),
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
          const formattedChoices =
            question.choices?.map((choice, idx) => {
              const fallbackId = String.fromCharCode(65 + idx);
              const optionId = choice.id?.trim() || fallbackId;
              return {
                id: optionId,
                text: choice.text,
                value: choice.id?.trim() || optionId,
              };
            }) || [];

          const correctChoiceIndex = question.choices?.findIndex((c) => c.isCorrect) ?? -1;
          const correctAnswerId =
            correctChoiceIndex >= 0
              ? formattedChoices[correctChoiceIndex]?.id
              : formattedChoices[0]?.id || null;

          const questionData = {
            question_text: question.title,
            question_type: 'multiple_choice',
            points: question.points || 1,
            options: formattedChoices,
            correct_answer: correctAnswerId,
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

        if (teacherId) {
          await loadData(teacherId);
        }
        setEditingId(null);
      } else {
        // Update existing assignment
        const assignmentData = {
          title: quiz.title,
          description: quiz.description,
          total_points: quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 100,
          start_date: quiz.startDate ? formatDateTimeLocalToISO(quiz.startDate) : null,
          due_date: formatDateTimeLocalToISO(quiz.dueDate),
          time_limit_minutes: quiz.timeLimitMinutes || 0,
          attempts_allowed: quiz.attemptsAllowed || 1,
          shuffle_questions: quiz.shuffleQuestions || false,
        };

        const updateRes = await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(assignmentData),
        });

        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          throw new Error(errorData.detail || 'Không thể cập nhật bài tập');
        }

        // Update classrooms
        await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}/classrooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(quiz.assignedClasses),
        });

        // Update questions intelligently: update existing, create new, delete removed
        const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}/questions`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const existingQuestions: any[] = [];
        if (questionsRes.ok) {
          const data = await questionsRes.json();
          existingQuestions.push(...data);
        }

        // Map existing questions by their ID
        const existingQuestionsMap = new Map(existingQuestions.map(q => [q.id, q]));
        const newQuestionIds = new Set(
          quiz.questions
            .map(q => q.id)
            .filter(id => id && typeof id === 'string' && !id.startsWith('new-') && !id.startsWith('placeholder-'))
        );

        // Delete questions that are no longer in the new list
        for (const existingQ of existingQuestions) {
          if (!newQuestionIds.has(existingQ.id)) {
            await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}/questions/${existingQ.id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
          }
        }

        // Update or create questions
        for (let idx = 0; idx < quiz.questions.length; idx++) {
          const question = quiz.questions[idx];
          const questionId = question.id;
          
          // Check if this is an existing question (has ID and exists in database)
          const isExistingQuestion = questionId && 
                                    typeof questionId === 'string' &&
                                    !questionId.startsWith('new-') && 
                                    !questionId.startsWith('placeholder-') &&
                                    existingQuestionsMap.has(questionId);

          const formattedChoices =
            question.choices?.map((choice, idx) => {
              const fallbackId = String.fromCharCode(65 + idx);
              const optionId = choice.id?.trim() || fallbackId;
              return {
                id: optionId,
                text: choice.text,
                value: choice.id?.trim() || optionId,
              };
            }) || [];

          const correctChoiceIndex = question.choices?.findIndex((c) => c.isCorrect) ?? -1;
          const correctAnswerId =
            correctChoiceIndex >= 0
              ? formattedChoices[correctChoiceIndex]?.id
              : formattedChoices[0]?.id || null;

          const questionData = {
            question_text: question.title,
            question_type: 'multiple_choice',
            points: question.points || 1,
            options: formattedChoices,
            correct_answer: correctAnswerId,
            order_index: idx,
            image_url: question.imageUrl || null,
            attachment_link: question.attachmentLink || null,
          };

          if (isExistingQuestion && questionId) {
            // Update existing question
            await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}/questions/${questionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(questionData),
            });
          } else {
            // Create new question
            await fetch(`${API_BASE_URL}/api/assignments/${quiz.id}/questions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(questionData),
            });
          }
        }

        if (teacherId) {
          await loadData(teacherId);
        }
        setEditingId(null);
      }
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      setError(err.message || 'Không thể lưu bài tập. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (quiz: Quiz) => setPreviewQuiz(quiz);

  // Convert assignments to Quiz format for display
  const quizzes: Quiz[] = assignments
    .filter(a => a.assignment_type === 'multiple_choice')
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description || '',
      timeLimitMinutes: a.time_limit_minutes,
      attemptsAllowed: a.attempts_allowed,
      shuffleQuestions: a.shuffle_questions,
      assignedClasses: a.classroom_ids || [],
      questions: Array(a.question_count || 0).fill(null).map((_, i) => ({
        id: `placeholder-${i}`,
        title: '',
        points: 0,
        choices: [],
        required: false,
      })), // Placeholder questions để hiển thị số lượng đúng
    }));

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
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">×</Button>
              </div>
            </Card>
          )}

          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 lg:p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Bài tập trắc nghiệm</h1>
                <p className="text-green-100 text-sm lg:text-lg">Tạo và quản lý các bài trắc nghiệm cho học sinh</p>
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={saving}
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
              availableClasses={availableClasses.map(c => ({
                id: c.id,
                name: c.name,
                subject: c.subject?.name || 'Chưa có môn học',
                studentCount: c.studentCount || 0,
              }))}
            />
          )}

          {editingQuiz && (
            <Card className="p-6">
              <QuizBuilder
                value={editingQuiz}
                onChange={(q) => {
                  // Update local state
                  const updatedAssignments = assignments.map(a => 
                    a.id === q.id ? { ...a, title: q.title, description: q.description } as Assignment : a
                  );
                  setAssignments(updatedAssignments);
                }}
                onSave={handleSave}
                onPreview={handlePreview}
                onDelete={() => handleDelete(editingQuiz.id)}
                availableClasses={availableClasses.map(c => ({
                  id: c.id,
                  name: c.name,
                  subject: c.subject?.name || 'Chưa có môn học',
                  studentCount: c.studentCount || 0,
                }))}
                saving={saving}
                isEditing={editingId !== null && editingQuiz && !editingQuiz.id.startsWith('new-')}
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                  Quay lại danh sách
                </Button>
                {saving && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {previewQuiz && (
        <QuizPreviewModal 
          quiz={previewQuiz} 
          onClose={() => setPreviewQuiz(null)} 
          availableClasses={availableClasses.map(c => ({
            id: c.id,
            name: c.name,
            subject: c.subject?.name || 'Chưa có môn học',
            studentCount: c.studentCount || 0,
          }))}
        />
      )}
    </div>
  );
}



