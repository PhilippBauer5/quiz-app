import { Input } from '../../components/ui/Input';

/**
 * Blind Top 5 – QuestionEditor
 *
 * Each "question" is a top-5 item. We show the position label (Platz 1–5)
 * and a text input. The position is determined by order in the array.
 */
export default function QuestionEditor({ question, onUpdate, index }) {
  return (
    <Input
      value={question.question}
      onChange={(e) => onUpdate(question.key, 'question', e.target.value)}
      placeholder={`Item ${(index ?? 0) + 1} eingeben…`}
      className="mb-1"
    />
  );
}
