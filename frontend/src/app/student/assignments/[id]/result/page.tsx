'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowLeft, MessageSquare } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Question {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'essay';
    points: number;
    options?: Array<{ id: string; text: string }>;
    correct_answer?: string;
}

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

interface Assignment {
    id: string;
    title: string;
    description?: string;
    assignment_type: 'multiple_choice' | 'essay';
    total_points: number;
}

export default function AssignmentResultPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const assignmentId = params.id as string;
    const submissionId = searchParams.get('submission_id');

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        loadResult();
    }, [assignmentId, submissionId]);

    const loadResult = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            // Get current user and student ID
            const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (userRes.ok) {
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
                    }
                }
            }

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
                
                // Nếu có submission_id từ query param, tìm submission đó
                if (submissionId) {
                    const sub = submissionsData.find((s: Submission) => s.id === submissionId);
                    if (sub) {
                        setSubmission(sub);
                    }
                } else if (studentId) {
                    // Nếu không có submission_id, lấy tất cả submissions của học sinh
                    const studentSubmissions = submissionsData.filter((s: Submission) => s.student_id === studentId);
                    
                    if (studentSubmissions.length > 0) {
                        // Nếu có nhiều submission, lấy submission có điểm cao nhất
                        // Nếu chưa có điểm, lấy submission mới nhất
                        const bestSubmission = studentSubmissions.reduce((best: Submission, current: Submission) => {
                            const bestScore = best.score ?? -1;
                            const currentScore = current.score ?? -1;
                            
                            // Ưu tiên submission có điểm cao hơn
                            if (currentScore > bestScore) {
                                return current;
                            }
                            // Nếu điểm bằng nhau, ưu tiên submission mới hơn
                            if (currentScore === bestScore && currentScore === -1) {
                                return new Date(current.submitted_at) > new Date(best.submitted_at) ? current : best;
                            }
                            return best;
                        });
                        
                        setSubmission(bestSubmission);
                    }
                }
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
            console.error('Error loading result:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQuestionResult = (question: Question) => {
        if (!submission) return null;

        const studentAnswer = submission.answers[question.id];
        const correctAnswer = question.correct_answer;

        if (question.question_type === 'multiple_choice' && correctAnswer) {
            const isCorrect = studentAnswer?.toUpperCase() === correctAnswer.toUpperCase();
            return {
                isCorrect,
                studentAnswer,
                correctAnswer,
            };
        }

        return {
            isCorrect: null,
            studentAnswer,
            correctAnswer: null,
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải kết quả...</p>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <Card className="p-6 max-w-md">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Không tìm thấy bài tập</p>
                        <Button onClick={() => router.push('/student/assignments')}>Quay lại danh sách</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
                <Card className="p-6 max-w-md">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa có kết quả</h2>
                            <p className="text-gray-600 mb-4">
                                Bạn chưa làm bài tập này hoặc bài làm chưa được lưu.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => router.push('/student/assignments')}>
                                Quay lại danh sách
                            </Button>
                            <Button onClick={() => router.push(`/student/assignments/${assignmentId}`)}>
                                Làm bài
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const scorePercentage = assignment.total_points > 0
        ? ((submission.score || 0) / assignment.total_points) * 100
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <Button variant="ghost" onClick={() => router.push('/student/assignments')} className="text-white hover:bg-white/20 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Kết quả: {assignment.title}</h1>
                    <p className="text-blue-100">Xem chi tiết kết quả làm bài của bạn</p>
                </div>

                {/* Score Card */}
                <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="text-2xl">Điểm số</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                {submission.is_graded ? (
                                    <>
                                        <div className="text-5xl font-bold text-blue-600 mb-2">
                                            {submission.score?.toFixed(2)}/{assignment.total_points}
                                        </div>
                                        <div className="text-2xl text-slate-600">
                                            {scorePercentage.toFixed(1)}%
                                        </div>
                                        <Badge className={`mt-2 ${scorePercentage >= 90 ? 'bg-green-500' :
                                                scorePercentage >= 80 ? 'bg-blue-500' :
                                                    scorePercentage >= 70 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                            }`}>
                                            {scorePercentage >= 90 ? 'Xuất sắc' :
                                                scorePercentage >= 80 ? 'Giỏi' :
                                                    scorePercentage >= 70 ? 'Khá' :
                                                        scorePercentage >= 60 ? 'Trung bình' : 'Yếu'}
                                        </Badge>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-12 h-12 text-yellow-500" />
                                        <div>
                                            <div className="text-xl font-semibold text-slate-700">Đang chờ chấm điểm</div>
                                            <div className="text-slate-500">Giáo viên sẽ chấm điểm sớm nhất có thể</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {submission.feedback && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <div className="font-semibold text-blue-900 mb-1">Nhận xét của giáo viên:</div>
                                        <div className="text-blue-800">{submission.feedback}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 text-sm text-slate-500">
                            Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                            {submission.graded_at && (
                                <> • Chấm lúc: {new Date(submission.graded_at).toLocaleString('vi-VN')}</>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Review */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800">Chi tiết câu trả lời</h2>
                    {questions.map((question, index) => {
                        const result = getQuestionResult(question);
                        if (!result) return null;

                        return (
                            <Card key={question.id} className={`border-2 ${result.isCorrect === true ? 'border-green-200 bg-green-50/30' :
                                    result.isCorrect === false ? 'border-red-200 bg-red-50/30' :
                                        'border-slate-200'
                                }`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CardTitle className="text-lg">
                                                    Câu {index + 1}: {question.question_text}
                                                </CardTitle>
                                                {result.isCorrect !== null && (
                                                    result.isCorrect ? (
                                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-red-600" />
                                                    )
                                                )}
                                            </div>
                                            <CardDescription>Điểm: {question.points}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {question.question_type === 'multiple_choice' && question.options ? (
                                        <div className="space-y-2">
                                            {question.options.map((option) => {
                                                const isStudentAnswer = option.id === result.studentAnswer;
                                                const isCorrectAnswer = option.id === result.correctAnswer;

                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={`p-3 border rounded-lg ${isCorrectAnswer ? 'bg-green-100 border-green-300' :
                                                                isStudentAnswer && !isCorrectAnswer ? 'bg-red-100 border-red-300' :
                                                                    'bg-white border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                            {isStudentAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                                                            <span className={isCorrectAnswer || isStudentAnswer ? 'font-semibold' : ''}>
                                                                {option.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="font-semibold text-slate-700">Câu trả lời của bạn:</div>
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap">
                                                {result.studentAnswer || '(Không có câu trả lời)'}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
