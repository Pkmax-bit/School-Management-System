'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { uploadFileToAssignments, deleteFileFromAssignments, type UploadResult } from '@/lib/uploadToSupabase';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, Send, Paperclip, Link as LinkIcon, X } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Question {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'essay';
    points: number;
    options?: Array<{ id: string; text: string }>;
    order_index: number;
    image_url?: string;
    attachment_link?: string;
}

interface Assignment {
    id: string;
    title: string;
    description?: string;
    assignment_type: 'multiple_choice' | 'essay';
    total_points: number;
    due_date?: string;
    time_limit_minutes: number;
    attempts_allowed: number;
}

export default function TakeAssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [studentClassId, setStudentClassId] = useState<string | null>(null);
    const [studentClassName, setStudentClassName] = useState<string>('general');
    const [submissionFiles, setSubmissionFiles] = useState<UploadResult[]>([]);
    const [submissionLinks, setSubmissionLinks] = useState<string[]>([]);
    const [newLink, setNewLink] = useState('');
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAssignment();
    }, [assignmentId]);

    useEffect(() => {
        if (assignment && assignment.time_limit_minutes > 0 && timeRemaining === null) {
            setTimeRemaining(assignment.time_limit_minutes * 60); // Convert to seconds
        }
    }, [assignment]);

    useEffect(() => {
        if (timeRemaining !== null && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(); // Auto-submit when time runs out
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [timeRemaining]);

    const loadAssignment = async () => {
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
                    if (student.classroom_id) {
                        setStudentClassId(student.classroom_id);
                        try {
                            const classroomRes = await fetch(`${API_BASE_URL}/api/classrooms/${student.classroom_id}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                            });
                            if (classroomRes.ok) {
                                const classroomData = await classroomRes.json();
                                setStudentClassName(classroomData.name || 'general');
                            } else {
                                setStudentClassName(student.classroom_id);
                            }
                        } catch (err) {
                            console.error('Error loading classroom info:', err);
                            setStudentClassName(student.classroom_id);
                        }
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

                // Load questions
                const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (questionsRes.ok) {
                    const questionsData = await questionsRes.json();
                    setQuestions(questionsData.sort((a: Question, b: Question) => a.order_index - b.order_index));
                }
            }
        } catch (error) {
            console.error('Error loading assignment:', error);
            setError('Không thể tải bài tập');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!assignment) return;
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingFiles(true);
        try {
            const results: UploadResult[] = [];
            for (const file of files) {
                const result = await uploadFileToAssignments(file, {
                    classNames: studentClassName ? [studentClassName] : undefined,
                    className: studentClassName,
                    assignmentType: assignment.assignment_type,
                    assignmentId,
                    subfolder: 'submissions'
                });
                if (result.url && !result.error) {
                    results.push(result);
                } else {
                    alert(result.error || 'Không thể upload tệp');
                }
            }
            if (results.length) {
                setSubmissionFiles((prev) => [...prev, ...results]);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Không thể upload tệp');
        } finally {
            setUploadingFiles(false);
            e.target.value = '';
        }
    };

    const handleRemoveFile = async (file: UploadResult) => {
        if (file.path) {
            await deleteFileFromAssignments(file.path);
        }
        setSubmissionFiles((prev) => prev.filter((f) => f.path !== file.path));
    };

    const handleAddLink = () => {
        if (!newLink.trim()) return;
        setSubmissionLinks((prev) => [...prev, newLink.trim()]);
        setNewLink('');
    };

    const handleRemoveLink = (link: string) => {
        setSubmissionLinks((prev) => prev.filter((l) => l !== link));
    };

    const handleSubmit = async () => {
        if (!studentId || !assignment) return;

        // Validate all questions answered
        const unanswered = questions.filter((q) => !answers[q.id]);
        if (unanswered.length > 0) {
            if (!confirm(`Bạn chưa trả lời ${unanswered.length} câu hỏi. Bạn có chắc muốn nộp bài?`)) {
                return;
            }
        }

        try {
            setSubmitting(true);
            setError(null);
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');

            const submissionData = {
                assignment_id: assignmentId,
                student_id: studentId,
                answers: answers,
                files: submissionFiles.map((file) => ({
                    name: file.name,
                    url: file.url,
                    path: file.path,
                    size: file.size,
                    type: file.type,
                })),
                links: submissionLinks,
            };

            const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                const result = await response.json();
                // Redirect to result page
                router.push(`/student/assignments/${assignmentId}/result?submission_id=${result.id}`);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Không thể nộp bài');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            setError('Đã xảy ra lỗi khi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải bài tập...</p>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-6">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Không tìm thấy bài tập</p>
                        <Button onClick={() => router.push('/student/assignments')}>Quay lại</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" onClick={() => router.push('/student/assignments')} className="text-white hover:bg-white/20">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Quay lại
                        </Button>
                        {timeRemaining !== null && timeRemaining > 0 && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-500' : 'bg-white/20'}`}>
                                <Clock className="w-5 h-5" />
                                <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                    {assignment.description && (
                        <p className="text-blue-100">{assignment.description}</p>
                    )}
                    <div className="flex gap-4 mt-4">
                        <Badge className="bg-white/20 text-white">
                            {assignment.assignment_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                        </Badge>
                        <Badge className="bg-white/20 text-white">
                            Tổng điểm: {assignment.total_points}
                        </Badge>
                        <Badge className="bg-white/20 text-white">
                            {questions.length} câu hỏi
                        </Badge>
                    </div>
                </div>

                {error && (
                    <Card className="p-4 bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    </Card>
                )}

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            Câu {index + 1}: {question.question_text}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            Điểm: {question.points}
                                        </CardDescription>
                                    </div>
                                </div>
                                {question.image_url && (
                                    <div className="mt-4">
                                        <img src={question.image_url} alt="Question" className="max-w-full h-auto rounded-lg border" />
                                    </div>
                                )}
                                {question.attachment_link && (
                                    <div className="mt-2">
                                        <a href={question.attachment_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                            📎 Xem tài liệu đính kèm
                                        </a>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {question.question_type === 'multiple_choice' && question.options ? (
                                    <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                                        <div className="space-y-3">
                                            {question.options.map((option) => (
                                                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                                                    <Label htmlFor={`${question.id}-${option.id}`} className="flex-1 cursor-pointer">
                                                        {option.text}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                ) : (
                                    <Textarea
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Nhập câu trả lời của bạn..."
                                        rows={6}
                                        className="w-full"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {assignment.assignment_type === 'essay' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Paperclip className="w-5 h-5" />
                                Đính kèm bài làm
                            </CardTitle>
                            <CardDescription>
                                Upload file Word/ZIP hoặc đính kèm link để giáo viên chấm bài.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tệp Word/ZIP</Label>
                                <Input
                                    type="file"
                                    multiple
                                    accept=".doc,.docx,.zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                                    onChange={handleFileUpload}
                                    disabled={uploadingFiles}
                                />
                                {uploadingFiles && (
                                    <p className="text-xs text-slate-500">Đang upload tệp...</p>
                                )}
                                {submissionFiles.length > 0 && (
                                    <div className="space-y-2">
                                        {submissionFiles.map((file) => (
                                            <div
                                                key={file.path}
                                                className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4 text-slate-500" />
                                                    <div>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {file.name || file.path}
                                                        </a>
                                                        {file.size && (
                                                            <p className="text-xs text-slate-500">
                                                                {(file.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleRemoveFile(file)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Đường link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={newLink}
                                        onChange={(e) => setNewLink(e.target.value)}
                                    />
                                    <Button type="button" onClick={handleAddLink} disabled={!newLink.trim()}>
                                        Thêm link
                                    </Button>
                                </div>
                                {submissionLinks.length > 0 && (
                                    <div className="space-y-2">
                                        {submissionLinks.map((link) => (
                                            <div
                                                key={link}
                                                className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
                                            >
                                                <a
                                                    href={link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    {link}
                                                </a>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleRemoveLink(link)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submit Button */}
                <Card className="sticky bottom-4 shadow-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                Đã trả lời: {Object.keys(answers).length}/{questions.length} câu
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                size="lg"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang nộp...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Nộp bài
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
