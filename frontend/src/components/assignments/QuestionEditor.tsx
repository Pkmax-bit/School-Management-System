import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, GripVertical, CheckCircle } from 'lucide-react';
import { cn } from '@/components/ui/utils';

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
};

interface QuestionEditorProps {
  value: Question;
  onChange: (q: Question) => void;
  onRemove?: () => void;
  index?: number;
}

export function QuestionEditor({ value, onChange, onRemove, index }: QuestionEditorProps) {
  const [question, setQuestion] = useState<Question>(value);

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
            <Label className="text-sm">Đáp án</Label>
            <Button size="sm" onClick={addChoice}>
              <Plus className="w-4 h-4 mr-1" /> Thêm đáp án
            </Button>
          </div>

          <div className="space-y-2">
            {question.choices.map((choice) => (
              <div key={choice.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(choice.id)}
                  className={cn(
                    'h-9 w-9 rounded-md border flex items-center justify-center',
                    choice.isCorrect ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-slate-300 text-slate-500'
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <Input
                  placeholder="Nội dung đáp án..."
                  value={choice.text}
                  onChange={(e) => updateChoice(choice.id, { text: e.target.value })}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => removeChoice(choice.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


