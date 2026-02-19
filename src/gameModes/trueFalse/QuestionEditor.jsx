import { Check, X } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

/**
 * TrueFalse QuestionEditor – Frage-Text + Wahr/Falsch Buttons
 */
export default function QuestionEditor({ question, onUpdate }) {
  return (
    <>
      <Input
        value={question.question}
        onChange={(e) => onUpdate(question.key, 'question', e.target.value)}
        placeholder="Frage eingeben…"
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant={question.answer === 'Wahr' ? 'success' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => onUpdate(question.key, 'answer', 'Wahr')}
        >
          <Check className="h-4 w-4" />
          Wahr
        </Button>
        <Button
          type="button"
          variant={question.answer === 'Falsch' ? 'destructive' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => onUpdate(question.key, 'answer', 'Falsch')}
        >
          <X className="h-4 w-4" />
          Falsch
        </Button>
      </div>
    </>
  );
}
