import React, { useState, useEffect } from 'react';
import { X, Copy, Loader2, Check } from 'lucide-react';

interface Classroom {
    id: string;
    name: string;
    code: string;
}

interface CopyLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCopy: (targetClassroomId: string) => Promise<void>;
    currentClassroomId: string;
    selectedCount: number;
}

export const CopyLessonModal: React.FC<CopyLessonModalProps> = ({
    isOpen,
    onClose,
    onCopy,
    currentClassroomId,
    selectedCount
}) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchClassrooms();
        }
    }, [isOpen]);

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/classrooms`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out current classroom
                setClassrooms(data.filter((c: Classroom) => c.id !== currentClassroomId));
            }
        } catch (err) {
            setError('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!selectedTargetId) return;

        setCopying(true);
        setError(null);
        try {
            await onCopy(selectedTargetId);
            onClose();
        } catch (err) {
            setError('Có lỗi xảy ra khi sao chép bài học');
        } finally {
            setCopying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Copy className="w-5 h-5 text-blue-600" />
                        Sao chép bài học
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Bạn đang chọn <span className="font-bold text-blue-600">{selectedCount}</span> bài học.
                        Vui lòng chọn lớp học bạn muốn sao chép đến:
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : classrooms.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Không có lớp học nào khác để sao chép.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {classrooms.map((cls) => (
                                <label
                                    key={cls.id}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedTargetId === cls.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="targetClassroom"
                                        value={cls.id}
                                        checked={selectedTargetId === cls.id}
                                        onChange={(e) => setSelectedTargetId(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                                        <p className="text-xs text-gray-500">{cls.code}</p>
                                    </div>
                                    {selectedTargetId === cls.id && (
                                        <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                        disabled={copying}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!selectedTargetId || copying}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        {copying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang sao chép...
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Sao chép ngay
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
