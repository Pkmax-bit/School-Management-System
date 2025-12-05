'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, AlertCircle, Users, School, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CreateNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface Student {
    id: string;
    name: string;
    student_code: string;
    classroom_id?: string;
}

interface Classroom {
    id: string;
    name: string;
    code: string;
}

type SelectionMode = 'students' | 'classroom';

export function CreateNotificationModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateNotificationModalProps) {
    const { user } = useApiAuth();
    const { createNotification } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [recipientType, setRecipientType] = useState<'teacher' | 'student'>('student');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('students');
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
    const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
    const [allClassroomStudents, setAllClassroomStudents] = useState<Map<string, Student[]>>(new Map());
    const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [loadingClassroomStudents, setLoadingClassroomStudents] = useState(false);

    // Fetch teachers (only for admin)
    useEffect(() => {
        if (isOpen && user?.role === 'admin' && recipientType === 'teacher') {
            fetchTeachers();
        }
    }, [isOpen, user, recipientType]);

    // Fetch students (for student selection mode)
    useEffect(() => {
        if (isOpen && recipientType === 'student' && selectionMode === 'students') {
            fetchStudents();
        }
    }, [isOpen, recipientType, selectionMode]);

    // Fetch classrooms
    useEffect(() => {
        if (isOpen && recipientType === 'student') {
            fetchClassrooms();
        }
    }, [isOpen, recipientType]);

    // Update classroomStudents when selectedClassrooms, selectionMode, or cache changes
    useEffect(() => {
        if (selectionMode === 'classroom' && selectedClassrooms.length > 0) {
            const allStudents: Student[] = [];
            selectedClassrooms.forEach(classroomId => {
                const students = allClassroomStudents.get(classroomId) || [];
                allStudents.push(...students);
            });
            const uniqueStudents = Array.from(
                new Map(allStudents.map(s => [s.id, s])).values()
            );
            setClassroomStudents(uniqueStudents);
        } else {
            setClassroomStudents([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassrooms, selectionMode, cacheUpdateTrigger]);

    // Fetch students for newly selected classrooms
    useEffect(() => {
        if (selectionMode === 'classroom' && selectedClassrooms.length > 0) {
            const fetchAll = async () => {
                setLoadingClassroomStudents(true);
                try {
                    const toFetch = selectedClassrooms.filter(
                        classroomId => !allClassroomStudents.has(classroomId)
                    );
                    if (toFetch.length > 0) {
                        await Promise.all(toFetch.map(classroomId => fetchClassroomStudents(classroomId)));
                        // Trigger cache update
                        setCacheUpdateTrigger(prev => prev + 1);
                    }
                } finally {
                    setLoadingClassroomStudents(false);
                }
            };
            fetchAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassrooms, selectionMode]);

    const fetchTeachers = async () => {
        setLoadingRecipients(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/teachers`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            }
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const fetchStudents = async () => {
        setLoadingRecipients(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/students`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const fetchClassrooms = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            
            // Nếu là giáo viên, chỉ lấy các lớp của giáo viên đó
            let url = `${API_BASE_URL}/api/classrooms`;
            if (user?.role === 'teacher' && user?.id) {
                try {
                    // Lấy teacher_id từ user_id
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
                            url = `${API_BASE_URL}/api/classrooms?teacher_id=${teacher.id}`;
                        }
                    }
                } catch (e) {
                    console.error('Error loading teacher ID:', e);
                }
            }
            
            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (err) {
            console.error('Error fetching classrooms:', err);
        }
    };

    const fetchClassroomStudents = useCallback(async (classroomId: string): Promise<Student[]> => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/api/students?classroom_id=${classroomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setAllClassroomStudents(prev => {
                    const newMap = new Map(prev);
                    newMap.set(classroomId, data);
                    return newMap;
                });
                return data;
            }
        } catch (err) {
            console.error('Error fetching classroom students:', err);
        }
        return [];
    }, []);

    const handleStudentToggle = (studentId: string) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleClassroomToggle = (classroomId: string) => {
        setSelectedClassrooms(prev => {
            if (prev.includes(classroomId)) {
                return prev.filter(id => id !== classroomId);
            } else {
                return [...prev, classroomId];
            }
        });
    };

    const handleSelectAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const handleSelectAllClassrooms = () => {
        if (selectedClassrooms.length === classrooms.length) {
            setSelectedClassrooms([]);
        } else {
            setSelectedClassrooms(classrooms.map(c => c.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate
        if (recipientType === 'student') {
            if (selectionMode === 'students' && selectedStudents.length === 0) {
                setError('Vui lòng chọn ít nhất một học sinh');
                return;
            }
            if (selectionMode === 'classroom' && selectedClassrooms.length === 0) {
                setError('Vui lòng chọn ít nhất một lớp học');
                return;
            }
            if (selectionMode === 'classroom' && classroomStudents.length === 0) {
                setError('Các lớp học đã chọn không có học sinh nào');
                return;
            }
        } else {
        if (!selectedRecipient) {
                setError('Vui lòng chọn giáo viên');
            return;
            }
        }

        if (!title.trim()) {
            setError('Vui lòng nhập tiêu đề');
            return;
        }

        if (!message.trim()) {
            setError('Vui lòng nhập nội dung');
            return;
        }

        setIsLoading(true);

        try {
            const notificationPromises: Promise<any>[] = [];

            if (recipientType === 'teacher') {
                notificationPromises.push(
                    createNotification({
                        recipient_type: 'teacher',
                        teacher_id: selectedRecipient,
                        type: 'general',
                        title: title.trim(),
                        message: message.trim(),
                        priority,
                    })
                );
            } else {
                // Determine student IDs
                const studentIdsToNotify = selectionMode === 'classroom'
                    ? classroomStudents.map(s => s.id)
                    : selectedStudents;

                // Create notifications for all students
                for (const studentId of studentIdsToNotify) {
                    let studentClassroomId: string | undefined = undefined;
                    if (selectionMode === 'classroom') {
                        for (const [classroomId, students] of allClassroomStudents.entries()) {
                            if (students.some(s => s.id === studentId)) {
                                studentClassroomId = classroomId;
                                break;
                            }
                        }
                    }

                    notificationPromises.push(
                        createNotification({
                            recipient_type: 'student',
                            student_id: studentId,
                            classroom_id: studentClassroomId,
                            type: 'general',
                title: title.trim(),
                message: message.trim(),
                priority,
                        })
                    );
                }
            }

            await Promise.all(notificationPromises);

            // Reset form
            setTitle('');
            setMessage('');
            setSelectedRecipient('');
            setSelectedClassrooms([]);
            setSelectedStudents([]);
            setPriority('normal');
            setSelectionMode('students');
            setAllClassroomStudents(new Map());

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể tạo thông báo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setMessage('');
        setSelectedRecipient('');
        setSelectedClassrooms([]);
        setSelectedStudents([]);
        setError(null);
        setSelectionMode('students');
        setAllClassroomStudents(new Map());
        onClose();
    };

    const canSelectTeachers = user?.role === 'admin';
    const totalRecipients = recipientType === 'student'
        ? (selectionMode === 'classroom' ? classroomStudents.length : selectedStudents.length)
        : (selectedRecipient ? 1 : 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Tạo thông báo mới
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Recipient Type - Only show if admin */}
                    {canSelectTeachers && (
                    <div className="space-y-2">
                            <Label>Loại người nhận</Label>
                        <Select
                            value={recipientType}
                            onValueChange={(value) => {
                                setRecipientType(value as 'teacher' | 'student');
                                    setSelectedRecipient('');
                                    setSelectedClassrooms([]);
                                    setSelectedStudents([]);
                                    setSelectionMode('students');
                            }}
                        >
                            <SelectTrigger>
                                    <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                    <SelectItem value="teacher">Giáo viên</SelectItem>
                                <SelectItem value="student">Học sinh</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        )}

                    {/* Teacher Selection */}
                    {recipientType === 'teacher' && (
                    <div className="space-y-2">
                            <Label>Chọn giáo viên</Label>
                            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                            <SelectTrigger>
                                    <SelectValue placeholder={loadingRecipients ? 'Đang tải...' : 'Chọn giáo viên'} />
                            </SelectTrigger>
                            <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name} ({teacher.email})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        </div>
                    )}

                    {/* Student Selection Mode */}
                    {recipientType === 'student' && (
                        <div className="space-y-2">
                            <Label>Chế độ gửi</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectionMode('students');
                                        setSelectedClassrooms([]);
                                    }}
                                    className={`p-3 border-2 rounded-lg transition-all ${selectionMode === 'students'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Users className="w-5 h-5 mx-auto mb-1" />
                                    <p className="text-xs font-medium">Chọn học sinh</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectionMode('classroom');
                                        setSelectedStudents([]);
                                    }}
                                    className={`p-3 border-2 rounded-lg transition-all ${selectionMode === 'classroom'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <School className="w-5 h-5 mx-auto mb-1" />
                                    <p className="text-xs font-medium">Chọn lớp</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Students Selection */}
                    {recipientType === 'student' && selectionMode === 'students' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Chọn học sinh ({selectedStudents.length} đã chọn)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllStudents}
                                    className="text-xs h-7"
                                >
                                    {selectedStudents.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                            </div>
                            <Card className="max-h-48 overflow-y-auto">
                                <CardContent className="p-3">
                                    {loadingRecipients ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        </div>
                                    ) : students.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Không có học sinh nào</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {students.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                    onClick={() => handleStudentToggle(student.id)}
                                                >
                                                    <Checkbox
                                                        id={`student-${student.id}`}
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={() => handleStudentToggle(student.id)}
                                                    />
                                                    <label htmlFor={`student-${student.id}`} className="flex-1 text-sm cursor-pointer">
                                                        {student.name} - {student.student_code}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Classroom Selection */}
                    {recipientType === 'student' && selectionMode === 'classroom' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Chọn lớp học ({selectedClassrooms.length} đã chọn)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllClassrooms}
                                    className="text-xs h-7"
                                >
                                    {selectedClassrooms.length === classrooms.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                            </div>
                            <Card className="max-h-48 overflow-y-auto">
                                <CardContent className="p-3">
                                    {loadingClassroomStudents ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        </div>
                                    ) : classrooms.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Không có lớp học nào</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {classrooms.map((classroom) => {
                                                const studentsInClass = allClassroomStudents.get(classroom.id) || [];
                                                return (
                                                    <div
                                                        key={classroom.id}
                                                        className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                        onClick={() => handleClassroomToggle(classroom.id)}
                                                    >
                                                        <Checkbox
                                                            id={`classroom-${classroom.id}`}
                                                            checked={selectedClassrooms.includes(classroom.id)}
                                                            onCheckedChange={() => handleClassroomToggle(classroom.id)}
                                                        />
                                                        <label htmlFor={`classroom-${classroom.id}`} className="flex-1 text-sm cursor-pointer">
                                                            <div className="font-medium">{classroom.name} ({classroom.code})</div>
                                                            {selectedClassrooms.includes(classroom.id) && studentsInClass.length > 0 && (
                                                                <div className="text-xs text-gray-500 mt-0.5">{studentsInClass.length} học sinh</div>
                                                            )}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {selectedClassrooms.length > 0 && !loadingClassroomStudents && (
                                <p className="text-xs text-slate-500">
                                    Tổng: {classroomStudents.length} học sinh từ {selectedClassrooms.length} lớp
                                </p>
                        )}
                    </div>
                    )}

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Mức độ ưu tiên</Label>
                        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Thấp</SelectItem>
                                <SelectItem value="normal">Bình thường</SelectItem>
                                <SelectItem value="high">Cao</SelectItem>
                                <SelectItem value="urgent">Khẩn cấp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nhập tiêu đề thông báo"
                            maxLength={255}
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label>Nội dung</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Nhập nội dung thông báo"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                `Gửi thông báo${totalRecipients > 0 ? ` (${totalRecipients})` : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
