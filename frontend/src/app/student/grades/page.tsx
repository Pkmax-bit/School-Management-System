'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, BookOpen, Calendar, ArrowRight, Eye, Loader2, ArrowLeft, School, CheckCircle2 } from 'lucide-react';
import { useApiAuth } from '@/hooks/useApiAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AssignmentResult {
  submission_id: string;
  assignment_id: string;
  assignment_title: string;
  assignment_type: 'multiple_choice' | 'essay';
  subject_id: string;
  subject_name: string | null;
  score: number;
  total_points: number;
  percentage: number;
  submitted_at: string;
  graded_at: string | null;
}

interface GradeSummary {
  student_id: string;
  classroom_id: string | null;
  subject_id: string | null;
  total_assignments: number;
  graded_assignments: number;
  total_score: number;
  average_score: number;
  classification: string;
  assignments: AssignmentResult[];
}

interface ClassroomInfo {
  id: string;
  name: string;
  code?: string;
  subject?: {
    id: string;
    name: string;
  };
}

export default function StudentGradesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApiAuth();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([]);
  const [classroomGrades, setClassroomGrades] = useState<Record<string, GradeSummary>>({});
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

      // Get current user
      const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!userRes.ok) {
        throw new Error('Không thể lấy thông tin người dùng');
      }

      const userData = await userRes.json();

      // Get student profile
      const studentsRes = await fetch(`${API_BASE_URL}/api/students?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!studentsRes.ok) {
        throw new Error('Không thể lấy thông tin học sinh');
      }

      const studentsData = await studentsRes.json();
      const student = studentsData.find((s: any) => s.user_id === userData.id);

      if (!student) {
        throw new Error('Không tìm thấy thông tin học sinh');
      }

      setStudentId(student.id);

      // Get student's classroom
      if (student.classroom_id) {
        const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${student.classroom_id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (classroomRes.ok) {
          const classroomData = await classroomRes.json();
          setClassrooms([classroomData]);

          // Load grade summary for this classroom
          const gradeRes = await fetch(
            `${API_BASE_URL}/api/assignments/students/${student.id}/grade-summary?classroom_id=${student.classroom_id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );

          if (gradeRes.ok) {
            const gradeData = await gradeRes.json();
            setClassroomGrades({
              [student.classroom_id]: gradeData,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading grades:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomClick = async (classroomId: string) => {
    if (classroomGrades[classroomId]) {
      setSelectedClassroomId(classroomId);
      return;
    }

    if (!studentId) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const gradeRes = await fetch(
        `${API_BASE_URL}/api/assignments/students/${studentId}/grade-summary?classroom_id=${classroomId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (gradeRes.ok) {
        const gradeData = await gradeRes.json();
        setClassroomGrades((prev) => ({
          ...prev,
          [classroomId]: gradeData,
        }));
        setSelectedClassroomId(classroomId);
      }
    } catch (err: any) {
      console.error('Error loading classroom grades:', err);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Xuất sắc') || classification.includes('Giỏi')) {
      return 'bg-gradient-to-r from-green-500 to-emerald-600';
    }
    if (classification.includes('Khá')) {
      return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    }
    if (classification.includes('Trung bình')) {
      return 'bg-gradient-to-r from-yellow-500 to-orange-600';
    }
    return 'bg-gradient-to-r from-orange-500 to-red-600';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải kết quả bài tập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-red-600 font-medium">{error}</p>
                <Button onClick={loadData} variant="outline">
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If a classroom is selected, show assignments
  if (selectedClassroomId && classroomGrades[selectedClassroomId]) {
    const gradeSummary = classroomGrades[selectedClassroomId];
    const multipleChoiceAssignments = gradeSummary.assignments.filter(
      (a) => a.assignment_type === 'multiple_choice'
    );
    const essayAssignments = gradeSummary.assignments.filter((a) => a.assignment_type === 'essay');
    const selectedClassroom = classrooms.find((c) => c.id === selectedClassroomId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedClassroomId(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Kết quả bài tập - {selectedClassroom?.name || 'Lớp học'}
              </h1>
              <p className="text-slate-600">Chi tiết điểm số và kết quả các bài tập đã nộp</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Điểm trung bình</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {gradeSummary.average_score.toFixed(1)}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getClassificationColor(gradeSummary.classification)}`}>
                    <Award className="w-7 h-7 text-white" />
                  </div>
                </div>
                <Badge className={`mt-3 ${getClassificationColor(gradeSummary.classification)} text-white border-0`}>
                  {gradeSummary.classification}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Tổng bài tập</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {gradeSummary.total_assignments}
                    </h3>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Đã chấm: <span className="font-semibold text-green-600">{gradeSummary.graded_assignments}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Tổng điểm</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {gradeSummary.total_score.toFixed(1)}
                    </h3>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Từ {gradeSummary.graded_assignments} bài tập
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Tỷ lệ hoàn thành</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {gradeSummary.total_assignments > 0
                        ? Math.round((gradeSummary.graded_assignments / gradeSummary.total_assignments) * 100)
                        : 0}%
                    </h3>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {gradeSummary.graded_assignments}/{gradeSummary.total_assignments} bài đã chấm
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assignments by Type */}
          <div className="space-y-6">
            {/* Lý thuyết (Multiple Choice) */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  Bài tập Lý thuyết (Trắc nghiệm)
                  <Badge variant="outline" className="ml-2">
                    {multipleChoiceAssignments.length} bài
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Các bài tập trắc nghiệm đã được chấm
                </CardDescription>
              </CardHeader>
              <CardContent>
                {multipleChoiceAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Chưa có bài tập lý thuyết nào được chấm</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {multipleChoiceAssignments.map((assignment) => {
                      const percentage = assignment.percentage;
                      const gradeColor = getGradeColor(percentage);

                      return (
                        <Card
                          key={assignment.assignment_id}
                          className={`border-2 ${gradeColor} hover:shadow-lg transition-all duration-300`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-slate-800">
                                    {assignment.assignment_title}
                                  </h3>
                                  {assignment.subject_name && (
                                    <Badge variant="outline" className="bg-white">
                                      {assignment.subject_name}
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Điểm số</p>
                                    <p className="text-lg font-semibold text-slate-800">
                                      {assignment.score.toFixed(1)} / {assignment.total_points.toFixed(1)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Phần trăm</p>
                                    <p className="text-lg font-semibold text-slate-800">
                                      {percentage.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Nộp bài</p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {formatDate(assignment.submitted_at)}
                                    </p>
                                  </div>
                                </div>

                                {assignment.graded_at && (
                                  <p className="text-xs text-gray-500">
                                    Đã chấm: {formatDate(assignment.graded_at)}
                                  </p>
                                )}
                              </div>

                              <div className="ml-4">
                                <Button
                                  onClick={() =>
                                    router.push(
                                      `/student/assignments/${assignment.assignment_id}/result?submission_id=${assignment.submission_id}`
                                    )
                                  }
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Xem chi tiết
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tự luận (Essay) */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  Bài tập Tự luận
                  <Badge variant="outline" className="ml-2">
                    {essayAssignments.length} bài
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Các bài tập tự luận đã được chấm
                </CardDescription>
              </CardHeader>
              <CardContent>
                {essayAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Chưa có bài tập tự luận nào được chấm</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {essayAssignments.map((assignment) => {
                      const percentage = assignment.percentage;
                      const gradeColor = getGradeColor(percentage);

                      return (
                        <Card
                          key={assignment.assignment_id}
                          className={`border-2 ${gradeColor} hover:shadow-lg transition-all duration-300`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-slate-800">
                                    {assignment.assignment_title}
                                  </h3>
                                  {assignment.subject_name && (
                                    <Badge variant="outline" className="bg-white">
                                      {assignment.subject_name}
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Điểm số</p>
                                    <p className="text-lg font-semibold text-slate-800">
                                      {assignment.score.toFixed(1)} / {assignment.total_points.toFixed(1)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Phần trăm</p>
                                    <p className="text-lg font-semibold text-slate-800">
                                      {percentage.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Nộp bài</p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {formatDate(assignment.submitted_at)}
                                    </p>
                                  </div>
                                </div>

                                {assignment.graded_at && (
                                  <p className="text-xs text-gray-500">
                                    Đã chấm: {formatDate(assignment.graded_at)}
                                  </p>
                                )}
                              </div>

                              <div className="ml-4">
                                <Button
                                  onClick={() =>
                                    router.push(
                                      `/student/assignments/${assignment.assignment_id}/result?submission_id=${assignment.submission_id}`
                                    )
                                  }
                                  variant="outline"
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Xem chi tiết
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show classroom list
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Kết quả bài tập</h1>
            <p className="text-slate-600">Chọn lớp học để xem kết quả bài tập</p>
          </div>
        </div>

        {/* Classroom Cards */}
        {classrooms.length === 0 ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-600">Bạn chưa được gán vào lớp học nào</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => {
              const gradeSummary = classroomGrades[classroom.id];
              const averageScore = gradeSummary?.average_score || 0;
              const gradedCount = gradeSummary?.graded_assignments || 0;
              const totalCount = gradeSummary?.total_assignments || 0;

              return (
                <Card
                  key={classroom.id}
                  className="border-0 shadow-md bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleClassroomClick(classroom.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <School className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {classroom.name}
                            </h3>
                            {classroom.code && (
                              <p className="text-sm text-gray-500">{classroom.code}</p>
                            )}
                          </div>
                        </div>
                        {classroom.subject && (
                          <p className="text-sm text-gray-600 ml-16">{classroom.subject.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      {/* Average Score */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Điểm trung bình</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {averageScore > 0 ? averageScore.toFixed(1) : 'N/A'}
                        </span>
                      </div>

                      {/* Assignments Count */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Bài tập đã làm</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {gradedCount}/{totalCount}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <Button variant="outline" className="group-hover:bg-blue-50 group-hover:border-blue-300">
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
