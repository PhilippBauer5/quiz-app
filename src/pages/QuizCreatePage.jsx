import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createQuiz, saveQuestions } from '../lib/supabase/api';
import { GAME_MODES } from '../gameModes';
import { ArrowLeft, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import { ErrorState } from '../components/ui/States';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { toast } from 'sonner';

function emptyQuestion() {
  return {
    question: '',
    answer: '',
    key: crypto.randomUUID(),
    image_path: null,
  };
}

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [quizType, setQuizType] = useState('qa');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Temp quiz ID for uploads before the quiz is created
  const [tempQuizId] = useState(() => crypto.randomUUID());

  const mode = GAME_MODES[quizType];
  const ModeEditor = mode?.questionEditor;
  const fixedCount = mode?.fixedQuestionCount || 0;

  // When quiz type changes, reset questions to match fixedQuestionCount
  function handleQuizTypeChange(newType) {
    setQuizType(newType);
    const newMode = GAME_MODES[newType];
    const count = newMode?.fixedQuestionCount;
    if (count) {
      setQuestions(Array.from({ length: count }, () => emptyQuestion()));
    } else {
      setQuestions([emptyQuestion()]);
    }
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(key) {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  }

  function updateQuestion(key, field, value) {
    setQuestions((prev) =>
      prev.map((q) => (q.key === key ? { ...q, [field]: value } : q))
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Titel ist erforderlich.');
      return;
    }

    // Use mode-specific validation from the registry
    const validationError = mode.getValidationError(questions);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const validQuestions = mode.validateQuestions(questions);

    setSaving(true);
    setError(null);

    try {
      const quiz = await createQuiz(title.trim(), quizType);
      await saveQuestions(quiz.id, validQuestions);
      toast.success('Quiz erstellt!');
      navigate(`/quiz/${quiz.id}/edit`);
    } catch (err) {
      setError(err.message);
      toast.error('Fehler beim Erstellen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Neues Quiz erstellen
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Allgemeinwissen"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quizType">Spielmodus</Label>
            <div className="relative">
              <select
                id="quizType"
                value={quizType}
                onChange={(e) => handleQuizTypeChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
              >
                {Object.entries(GAME_MODES).map(([key, mode]) => (
                  <option key={key} value={key}>
                    {mode.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {fixedCount ? 'Items' : 'Fragen'}
          </h2>
          <Badge variant="secondary">{questions.length}</Badge>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <FadeIn key={q.key}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      {fixedCount ? `Platz ${idx + 1}` : `Frage ${idx + 1}`}
                    </span>
                    {!fixedCount && questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(q.key)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Entfernen
                      </Button>
                    )}
                  </div>

                  {ModeEditor && (
                    <ModeEditor
                      question={q}
                      onUpdate={updateQuestion}
                      quizId={tempQuizId}
                      index={idx}
                    />
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        {!fixedCount && (
          <button
            onClick={addQuestion}
            className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-700 px-4 py-3 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Frage hinzufügen
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving} size="lg">
          <Save className="h-4 w-4" />
          {saving ? 'Wird gespeichert…' : 'Quiz speichern'}
        </Button>
        <Link to="/">
          <Button variant="outline" size="lg">
            Abbrechen
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
}
