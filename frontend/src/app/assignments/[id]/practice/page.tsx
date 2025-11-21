'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle, XCircle, Download } from 'lucide-react';

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
  shuffle_questions: boolean;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  options?: Array<{ id: string; text: string; value?: string }>;
  correct_answer?: string;
  imageUrl?: string;
  attachmentLink?: string;
}

export default function AssignmentPracticePage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params?.id;
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ total: number; earned: number; correct: number }>({
    total: 0,
    earned: 0,
    correct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      loadPracticeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const loadPracticeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('access_token')
        : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const assignmentRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, {
        headers,
      });

      if (!assignmentRes.ok) {
        throw new Error('Không thể tải bài tập');
      }

      const assignmentData = await assignmentRes.json();

      if (assignmentData.assignment_type !== 'multiple_choice') {
        setError('Chỉ hỗ trợ làm thử cho bài trắc nghiệm');
        setAssignment(assignmentData);
        setQuestions([]);
        setLoading(false);
        return;
      }

      setAssignment(assignmentData);

      const questionsRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/questions`, {
        headers,
      });

      if (!questionsRes.ok) {
        throw new Error('Không thể tải câu hỏi');
      }

      const questionsData = await questionsRes.json();
      const mapped = questionsData
        .filter((q: any) => q.question_type === 'multiple_choice')
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((q: any) => {
          const rawOptions = Array.isArray(q.options) ? q.options : [];
          const normalizedOptions: Array<{ id: string; text: string; value?: string }> = rawOptions.map((opt: any, idx: number) => {
            const fallbackId = String.fromCharCode(65 + idx);
            const optionId =
              typeof opt?.id === 'string' && opt.id.trim().length > 0
                ? opt.id.trim()
                : fallbackId;
            const originalValue =
              typeof opt?.value === 'string' && opt.value.trim().length > 0
                ? opt.value.trim()
                : optionId;
            return {
              id: optionId,
              text: opt?.text ?? '',
              value: originalValue,
            };
          });

          const trimmedCorrect =
            typeof q.correct_answer === 'string' ? q.correct_answer.trim() : '';
          const matchById = normalizedOptions.find((opt) => opt.id === trimmedCorrect);
          const matchByValue = normalizedOptions.find((opt) => opt.value === trimmedCorrect);
          const matchByText = normalizedOptions.find(
            (opt) => opt.text?.trim() && opt.text.trim() === trimmedCorrect
          );
          const normalizedCorrect =
            matchById?.id ||
            matchByValue?.id ||
            matchByText?.id ||
            trimmedCorrect ||
            normalizedOptions[0]?.id ||
            '';

          return {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points || 1,
            options: normalizedOptions,
            correct_answer: normalizedCorrect,
            imageUrl: q.image_url,
            attachmentLink: q.attachment_link,
          };
        }) as Question[];

      setQuestions(mapped);
      setAnswers({});
      setSubmitted(false);
      setScore({ total: 0, earned: 0, correct: 0 });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [questions]);

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;
    let earned = 0;
    let correctCount = 0;

    console.log('=== Practice Mode Answer Checking ===');
    questions.forEach((q) => {
      const answer = answers[q.id]?.trim();
      const correct = q.correct_answer?.trim();
      const isCorrect = correct && answer && answer === correct;

      console.log(`Question: ${q.question_text}`);
      console.log(`  Student answer: "${answer}"`);
      console.log(`  Correct answer: "${correct}"`);
      console.log(`  Is correct: ${isCorrect}`);
      console.log(`  Options:`, q.options?.map(opt => ({ id: opt.id, text: opt.text, value: opt.value })));

      if (isCorrect) {
        earned += q.points || 0;
        correctCount += 1;
      }
    });
    console.log(`Total earned: ${earned} / ${totalPoints}`);
    console.log('=====================================');

    setScore({
      total: totalPoints,
      earned,
      correct: correctCount,
    });
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore({ total: 0, earned: 0, correct: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600">Đang tải bài làm thử...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-slate-700">{error}</p>
            <Button onClick={() => router.back()}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <Badge className="bg-blue-100 text-blue-700">Làm thử</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">{assignment.title}</CardTitle>
            <CardDescription>
              Đây là chế độ làm thử. Kết quả chỉ mang tính tham khảo và không được lưu lại.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>Loại bài: Trắc nghiệm</span>
              <span>Tổng điểm: {assignment.total_points}</span>
              <span>Số câu hỏi: {questions.length}</span>
              {assignment.time_limit_minutes > 0 && (
                <span>Thời gian gợi ý: {assignment.time_limit_minutes} phút</span>
              )}
            </div>
            {assignment.description && (
              <p className="text-slate-700">{assignment.description}</p>
            )}
          </CardContent>
        </Card>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              Bài tập này chưa có câu hỏi trắc nghiệm.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const normalizedSelected = selectedAnswer?.trim();
              const normalizedCorrect = question.correct_answer?.trim();
              const isCorrect = submitted && normalizedCorrect && normalizedSelected === normalizedCorrect;
              return (
                <Card key={question.id} className={submitted ? (isCorrect ? 'border-green-300' : 'border-red-200') : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          Câu {index + 1}: {question.question_text}
                        </CardTitle>
                        <CardDescription>Điểm: {question.points}</CardDescription>
                      </div>
                      {submitted && (
                        <Badge variant={isCorrect ? 'default' : 'destructive'} className="flex items-center gap-1">
                          {isCorrect ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Đúng
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Sai
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    {question.imageUrl && (
                      <div className="mt-4">
                        <img
                          src={question.imageUrl}
                          alt={`Hình minh họa câu ${index + 1}`}
                          className="w-full max-h-80 object-cover rounded-lg border border-slate-100"
                        />
                      </div>
                    )}
                    {question.attachmentLink && (
                      <div className="mt-2">
                        <a
                          href={question.attachmentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Download className="w-4 h-4" />
                          Tải file đính kèm
                        </a>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedAnswer || ''}
                      onValueChange={(value) => handleSelect(question.id, value)}
                    >
                      <div className="space-y-3">
                        {question.options?.map((option) => {
                          const isSelected = normalizedSelected === option.id;
                          const isAnswer = submitted && normalizedCorrect === option.id;
                          const optionClass =
                            submitted && isAnswer
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : submitted && isSelected && !isAnswer
                                ? 'border-red-200 bg-red-50 text-red-600'
                                : 'border-slate-200 hover:bg-slate-50';
                          return (
                            <label
                              key={option.id}
                              htmlFor={`${question.id}-${option.id}`}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${optionClass}`}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={`${question.id}-${option.id}`}
                                disabled={submitted}
                              />
                              <span className="flex-1">{option.text || '(Trống)'}</span>
                            </label>
                          );
                        })}
                      </div>
                    </RadioGroup>
                    {submitted && question.correct_answer && (
                      <p className="text-xs text-slate-500 mt-2">
                        Đáp án đúng: {question.options?.find((opt) => opt.id === question.correct_answer)?.text || question.correct_answer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {submitted && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex flex-col gap-2 text-green-800">
                <h3 className="font-semibold text-lg">Kết quả làm thử</h3>
                <p>
                  Điểm: <span className="font-bold">{score.earned}</span> / {score.total}
                </p>
                <p>
                  Số câu đúng: <span className="font-bold">{score.correct}</span> / {questions.length}
                </p>
                {score.total > 0 && (
                  <p>
                    Tỉ lệ đúng: <span className="font-bold">{((score.earned / score.total) * 100).toFixed(1)}%</span>
                  </p>
                )}
                <p className="text-xs mt-2">* Kết quả chỉ mang tính tham khảo và không được lưu vào hệ thống.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleRetry} disabled={questions.length === 0}>
              Làm lại
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitted || questions.length === 0 || Object.keys(answers).length === 0}
            >
              {submitted ? 'Đã nộp thử' : 'Nộp thử'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
