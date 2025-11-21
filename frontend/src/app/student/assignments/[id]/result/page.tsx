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

    useEffect(() => {
        loadResult();
    }, [assignmentId, submissionId]);

    const loadResult = async () => {
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

            // Load submission
            if (submissionId) {
                const submissionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/submissions`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (submissionsRes.ok) {
                    const submissionsData = await submissionsRes.json();
                    const sub = submissionsData.find((s: Submission) => s.id === submissionId);
                    if (sub) {
                        setSubmission(sub);
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

    if (!assignment || !submission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-6">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Không tìm thấy kết quả</p>
                        <Button onClick={() => router.push('/student/assignments')}>Quay lại</Button>
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
