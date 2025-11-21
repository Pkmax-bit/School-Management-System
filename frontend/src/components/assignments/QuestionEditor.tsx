import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, GripVertical, CheckCircle, Image, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { uploadImageToAssignments } from '@/lib/uploadToSupabase';

export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  title: string;
  explanation?: string;
  points: number;
  choices: Choice[];
  shuffleChoices?: boolean;
  required?: boolean;
  imageUrl?: string; // URL hình ảnh đã upload
  attachmentLink?: string; // Link đính kèm
};

interface UploadContext {
  classNames?: string[];
  assignmentType?: 'multiple_choice' | 'essay';
  assignmentId?: string;
}

interface QuestionEditorProps {
  value: Question;
  onChange: (q: Question) => void;
  onRemove?: () => void;
  index?: number;
  uploadContext?: UploadContext;
}

export function QuestionEditor({ value, onChange, onRemove, index, uploadContext }: QuestionEditorProps) {
  const [question, setQuestion] = useState<Question>(value);
  const [uploadingImage, setUploadingImage] = useState(false);

  const update = (partial: Partial<Question>) => {
    const updated = { ...question, ...partial };
    setQuestion(updated);
    onChange(updated);
  };

  const addChoice = () => {
    const newChoice: Choice = { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false };
    update({ choices: [...question.choices, newChoice] });
  };

  const updateChoice = (choiceId: string, partial: Partial<Choice>) => {
    update({
      choices: question.choices.map((c) => (c.id === choiceId ? { ...c, ...partial } : c)),
    });
  };

  const removeChoice = (choiceId: string) => {
    update({ choices: question.choices.filter((c) => c.id !== choiceId) });
  };

  const toggleCorrect = (choiceId: string) => {
    update({
      choices: question.choices.map((c) => (c.id === choiceId ? { ...c, isCorrect: !c.isCorrect } : c)),
    });
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <GripVertical className="w-4 h-4" />
            <span className="text-sm">Câu hỏi {typeof index === 'number' ? index + 1 : ''}</span>
          </div>
          {onRemove && (
            <Button variant="outline" size="sm" onClick={onRemove}>
              <X className="w-4 h-4 mr-1" /> Xóa câu hỏi
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Tiêu đề câu hỏi</Label>
          <Input
            placeholder="Nhập nội dung câu hỏi..."
            value={question.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        {/* Upload hình ảnh và link đính kèm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Image className="w-4 h-4" />
              Hình ảnh câu hỏi (tùy chọn)
            </Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadingImage(true);
                    try {
                      const result = await uploadImageToAssignments(file, {
                        classNames: uploadContext?.classNames,
                        assignmentType: uploadContext?.assignmentType,
                        assignmentId: uploadContext?.assignmentId,
                        subfolder: 'questions'
                      });

                      if (result.url && !result.error) {
                        update({ imageUrl: result.url });
                      } else {
                        console.error('Upload error:', result.error);
                        alert('Không thể upload hình ảnh: ' + (result.error || 'Lỗi không xác định'));
                      }
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      alert('Không thể upload hình ảnh');
                    } finally {
                      setUploadingImage(false);
                    }
                  }
                }}
                className="flex-1"
              />
              {question.imageUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => update({ imageUrl: undefined })}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {question.imageUrl && (
              <div className="mt-2">
                <img
                  src={question.imageUrl}
                  alt="Câu hỏi"
                  className="max-w-full h-auto rounded-lg border border-slate-200"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link đính kèm (tùy chọn)
            </Label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={question.attachmentLink || ''}
                onChange={(e) => update({ attachmentLink: e.target.value })}
                className="flex-1"
              />
              {question.attachmentLink && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => update({ attachmentLink: undefined })}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {question.attachmentLink && (
              <a
                href={question.attachmentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                Mở link
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Điểm</Label>
            <Input
              type="number"
              min={0}
              value={question.points}
              onChange={(e) => update({ points: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Bắt buộc</Label>
            <div>
              <button
                className={cn(
                  'px-3 py-2 rounded-md border',
                  question.required ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-slate-300 text-slate-700'
                )}
                onClick={() => update({ required: !question.required })}
              >
                {question.required ? 'Có' : 'Không'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Xáo trộn đáp án</Label>
            <div>
              <button
                className={cn(
                  'px-3 py-2 rounded-md border',
                  question.shuffleChoices ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700'
                )}
                onClick={() => update({ shuffleChoices: !question.shuffleChoices })}
              >
                {question.shuffleChoices ? 'Có' : 'Không'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Giải thích (tùy chọn)</Label>
          <Textarea
            placeholder="Giải thích cho đáp án đúng, hiển thị khi chấm..."
            value={question.explanation || ''}
            onChange={(e) => update({ explanation: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Đáp án (chọn ít nhất 1 đáp án đúng)</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addChoice}>
                <Plus className="w-4 h-4 mr-1" /> Thêm
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Luôn hiển thị ít nhất 4 ô input */}
            {Array.from({ length: Math.max(4, question.choices.length) }, (_, idx) => {
              const choice = question.choices[idx];
              const isEmpty = !choice;
              const displayIndex = idx;
              
              return (
                <div key={choice?.id || `empty-${displayIndex}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEmpty) {
                        // Tạo choice mới nếu chưa có
                        const newChoice: Choice = {
                          id: Math.random().toString(36).substr(2, 9),
                          text: '',
                          isCorrect: true, // Mặc định đánh dấu là đúng khi click
                        };
                        update({ choices: [...question.choices, newChoice] });
                      } else {
                        toggleCorrect(choice.id);
                      }
                    }}
                    className={cn(
                      'h-9 w-9 rounded-md border flex items-center justify-center transition-colors',
                      choice?.isCorrect
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                    )}
                    title={choice?.isCorrect ? 'Đáp án đúng' : 'Click để đánh dấu đáp án đúng'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <Input
                    placeholder={`Đáp án ${displayIndex + 1}...`}
                    value={choice?.text || ''}
                    onChange={(e) => {
                      if (isEmpty) {
                        // Tạo choice mới khi bắt đầu nhập
                        const newChoice: Choice = {
                          id: Math.random().toString(36).substr(2, 9),
                          text: e.target.value,
                          isCorrect: false,
                        };
                        update({ choices: [...question.choices, newChoice] });
                      } else {
                        updateChoice(choice.id, { text: e.target.value });
                      }
                    }}
                    className="flex-1"
                  />
                  {!isEmpty && question.choices.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeChoice(choice.id)}
                      type="button"
                      title="Xóa đáp án này"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {isEmpty && (
                    <div className="w-9" /> // Placeholder để giữ layout
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


