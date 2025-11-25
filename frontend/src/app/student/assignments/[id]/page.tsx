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
import { Clock, AlertCircle, CheckCircle, ArrowLeft, Send, Paperclip, Link as LinkIcon, X, Loader2, FileText } from 'lucide-react';

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
            <div className="flex items-center justify-center min-h-[50vh]">
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

    const scrollToQuestion = (index: number) => {
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/student/assignments')}>
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {assignment.time_limit_minutes} phút
                            </span>
                            <span>•</span>
                            <span>{questions.length} câu hỏi</span>
                            <span>•</span>
                            <span>{assignment.total_points} điểm</span>
                        </div>
                    </div>
                </div>
                {timeRemaining !== null && timeRemaining > 0 && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeRemaining < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                        }`}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeRemaining)}
                    </div>
                )}
            </div>

            {error && (
                <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content - Questions */}
                <div className="lg:col-span-3 space-y-6">
                    {questions.map((question, index) => (
                        <Card key={question.id} id={`question-${index}`} className="scroll-mt-24 border-0 shadow-md ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                            {index + 1}
                                        </span>
                                        <CardTitle className="text-lg font-medium text-gray-900">
                                            {question.question_text}
                                        </CardTitle>
                                    </div>
                                    <Badge variant="secondary" className="bg-white border border-gray-200">
                                        {question.points} điểm
                                    </Badge>
                                </div>
                                {question.image_url && (
                                    <div className="mt-4">
                                        <img src={question.image_url} alt="Question" className="max-w-full h-auto rounded-lg border" />
                                    </div>
                                )}
                                {question.attachment_link && (
                                    <div className="mt-2">
                                        <a href={question.attachment_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                            <Paperclip className="w-4 h-4" /> Xem tài liệu đính kèm
                                        </a>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="pt-6">
                                {question.question_type === 'multiple_choice' && question.options ? (
                                    <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                                        <div className="space-y-3">
                                            {question.options.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${answers[question.id] === option.id
                                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                        : 'hover:bg-gray-50 border-gray-200'
                                                        }`}
                                                    onClick={() => handleAnswerChange(question.id, option.id)}
                                                >
                                                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                                                    <Label htmlFor={`${question.id}-${option.id}`} className="flex-1 cursor-pointer font-medium text-gray-700">
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
                                        className="w-full resize-none focus:ring-blue-500"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {assignment.assignment_type === 'essay' && (
                        <Card className="border-0 shadow-md ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Paperclip className="w-5 h-5 text-blue-600" />
                                    Đính kèm bài làm
                                </CardTitle>
                                <CardDescription>
                                    Upload file Word/ZIP hoặc đính kèm link để giáo viên chấm bài.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Tệp đính kèm</Label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                        <Input
                                            type="file"
                                            multiple
                                            accept=".doc,.docx,.zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                                            onChange={handleFileUpload}
                                            disabled={uploadingFiles}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-2 pointer-events-none">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                                <Paperclip className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">Kéo thả hoặc click để upload</p>
                                            <p className="text-xs text-gray-500">Word, Excel, PDF, ZIP (Max 10MB)</p>
                                        </div>
                                    </div>

                                    {uploadingFiles && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang upload tệp...
                                        </div>
                                    )}

                                    {submissionFiles.length > 0 && (
                                        <div className="grid gap-2">
                                            {submissionFiles.map((file) => (
                                                <div
                                                    key={file.path}
                                                    className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline block"
                                                            >
                                                                {file.name || file.path}
                                                            </a>
                                                            {file.size && (
                                                                <p className="text-xs text-gray-500">
                                                                    {(file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-500"
                                                        onClick={() => handleRemoveFile(file)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Đường link</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="url"
                                            placeholder="https://drive.google.com/..."
                                            value={newLink}
                                            onChange={(e) => setNewLink(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="button" onClick={handleAddLink} disabled={!newLink.trim()} variant="secondary">
                                            Thêm
                                        </Button>
                                    </div>
                                    {submissionLinks.length > 0 && (
                                        <div className="space-y-2">
                                            {submissionLinks.map((link) => (
                                                <div
                                                    key={link}
                                                    className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm"
                                                >
                                                    <a
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                        {link}
                                                    </a>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-500"
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
                </div>

                {/* Sidebar - Tools */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6">
                        {/* Question Palette */}
                        <Card className="border-0 shadow-md ring-1 ring-gray-100">
                            <CardHeader className="pb-3 border-b border-gray-100">
                                <CardTitle className="text-base font-bold text-gray-900">Danh sách câu hỏi</CardTitle>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        <span>Đã làm</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
                                        <span>Chưa làm</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, i) => {
                                        const isAnswered = !!answers[q.id];
                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => scrollToQuestion(i)}
                                                className={`aspect-square rounded-lg text-sm font-medium transition-all duration-200 ${isAnswered
                                                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Action */}
                        <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-gradient-to-b from-white to-gray-50">
                            <CardContent className="p-4">
                                <div className="mb-4 text-sm text-gray-600 text-center">
                                    Đã hoàn thành <span className="font-bold text-gray-900">{Object.keys(answers).length}/{questions.length}</span> câu
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 shadow-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang nộp...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Nộp bài
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
