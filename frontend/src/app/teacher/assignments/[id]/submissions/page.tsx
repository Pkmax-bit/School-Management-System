'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Clock, Edit, Save, BarChart3 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Submission {
    id: string;
    assignment_id: string;
    student_id: string;
    answers: Record<string, string>;
    score?: number;
    is_graded: boolean;
    submitted_at: string;
    graded_at?: string;
    feedback?: string;
}

interface Student {
    id: string;
    name: string;
    email?: string;
}

interface Assignment {
    id: string;
    title: string;
    assignment_type: 'multiple_choice' | 'essay';
    total_points: number;
}

interface Question {
    id: string;
    question_text: string;
    points: number;
}

export default function SubmissionsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useTeacherAuth();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [students, setStudents] = useState<Record<string, Student>>({});
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [gradeScore, setGradeScore] = useState<string>('');
    const [gradeFeedback, setGradeFeedback] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        loadData();
    }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Load assignment
            const assignmentRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (assignmentRes.ok) {
                const assignmentData = await assignmentRes.json();
                setAssignment(assignmentData);
            }

            // Load submissions
            const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/submissions`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (submissionsRes.ok) {
                const submissionsData = await submissionsRes.json();
                setSubmissions(submissionsData);

                // Load student info for each submission
                const studentsMap: Record<string, Student> = {};
                for (const submission of submissionsData) {
                    const studentRes = await fetch(`${API_BASE_URL}/api/students/${submission.student_id}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });

                    if (studentRes.ok) {
                        const studentData = await studentRes.json();
                        studentsMap[submission.student_id] = studentData;
                    }
                }
                setStudents(studentsMap);
            }

            // Load questions
            const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (questionsRes.ok) {
                const questionsData = await questionsRes.json();
                setQuestions(questionsData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmission = async () => {
        if (!selectedSubmission || !gradeScore) return;

        try {
            setGrading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const response = await fetch(
                `${API_BASE_URL}/api/assignments/${assignmentId}/submissions/${selectedSubmission.id}/grade`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        score: parseFloat(gradeScore),
                        feedback: gradeFeedback || null,
                    }),
                }
            );

            if (response.ok) {
                // Reload submissions
                await loadData();
                setSelectedSubmission(null);
                setGradeScore('');
                setGradeFeedback('');
            }
        } catch (error) {
            console.error('Error grading submission:', error);
        } finally {
            setGrading(false);
        }
    };

    const gradedCount = submissions.filter((s) => s.is_graded).length;
    const pendingCount = submissions.length - gradedCount;
    const averageScore = submissions.filter((s) => s.is_graded && s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0) / (gradedCount || 1);

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
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/teacher/assignments')}
                        className="text-white hover:bg-white/20 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Chấm bài: {assignment?.title}</h1>
                    <p className="text-green-100">Xem và chấm điểm các bài nộp của học sinh</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-sm text-slate-600 mb-1">Tổng bài nộp</div>
                            <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-sm text-slate-600 mb-1">Đã chấm</div>
                            <div className="text-3xl font-bold text-green-600">{gradedCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-sm text-slate-600 mb-1">Chờ chấm</div>
                            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-sm text-slate-600 mb-1">Điểm TB</div>
                            <div className="text-3xl font-bold text-purple-600">
                                {gradedCount > 0 ? averageScore.toFixed(1) : '-'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Submissions List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách bài nộp</CardTitle>
                            <CardDescription>Click vào bài nộp để chấm điểm</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                            {submissions.map((submission) => {
                                const student = students[submission.student_id];
                                return (
                                    <Card
                                        key={submission.id}
                                        className={`cursor-pointer hover:shadow-md transition-shadow ${selectedSubmission?.id === submission.id ? 'border-2 border-blue-500' : ''
                                            }`}
                                        onClick={() => {
                                            setSelectedSubmission(submission);
                                            setGradeScore(submission.score?.toString() || '');
                                            setGradeFeedback(submission.feedback || '');
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-slate-800">
                                                        {student?.name || 'Học sinh'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {submission.is_graded ? (
                                                        <>
                                                            <Badge className="bg-green-100 text-green-700">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                {submission.score?.toFixed(1)}
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-700">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Chờ chấm
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {submissions.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <p>Chưa có bài nộp nào</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Grading Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chấm điểm</CardTitle>
                            <CardDescription>
                                {selectedSubmission
                                    ? `Chấm bài của ${students[selectedSubmission.student_id]?.name || 'học sinh'}`
                                    : 'Chọn bài nộp để chấm điểm'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedSubmission ? (
                                <>
                                    {/* Answers */}
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {questions.map((question, index) => {
                                            const answer = selectedSubmission.answers[question.id];
                                            return (
                                                <Card key={question.id} className="bg-slate-50">
                                                    <CardContent className="p-4">
                                                        <div className="font-semibold text-slate-700 mb-2">
                                                            Câu {index + 1}: {question.question_text}
                                                        </div>
                                                        <div className="text-sm text-slate-600 mb-2">Điểm: {question.points}</div>
                                                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                                            <div className="text-sm font-medium text-slate-600 mb-1">Câu trả lời:</div>
                                                            <div className="whitespace-pre-wrap">{answer || '(Không có câu trả lời)'}</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    {/* Grading Form */}
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="space-y-2">
                                            <Label>Điểm (tối đa {assignment?.total_points})</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={assignment?.total_points}
                                                step={0.1}
                                                value={gradeScore}
                                                onChange={(e) => setGradeScore(e.target.value)}
                                                placeholder="Nhập điểm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nhận xét (tùy chọn)</Label>
                                            <Textarea
                                                value={gradeFeedback}
                                                onChange={(e) => setGradeFeedback(e.target.value)}
                                                placeholder="Nhận xét cho học sinh..."
                                                rows={4}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleGradeSubmission}
                                            disabled={!gradeScore || grading}
                                            className="w-full"
                                        >
                                            {grading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Lưu điểm
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <Edit className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Chọn một bài nộp bên trái để bắt đầu chấm điểm</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
