import { Input } from '../../components/ui/Input';

/**
 * QA QuestionEditor – Frage-Text + Musterantwort
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
      <Input
        value={question.answer || ''}
        onChange={(e) => onUpdate(question.key, 'answer', e.target.value)}
        placeholder="Musterantwort *"
        className="text-sm"
      />
    </>
  );
}
