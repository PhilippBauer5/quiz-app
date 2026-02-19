import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadQuiz,
  loadQuestions,
  saveQuestions,
  updateQuiz,
} from '../lib/supabase/api';
import { GAME_MODES } from '../gameModes';
import { ArrowLeft, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState, LoadingState } from '../components/ui/States';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { toast } from 'sonner';

function questionWithKey(q) {
  return { ...q, key: q.id || crypto.randomUUID() };
}

function emptyQuestion() {
  return {
    question: '',
    answer: '',
    key: crypto.randomUUID(),
    image_path: null,
  };
}

export default function QuizEditPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const mode = GAME_MODES[quiz?.quiz_type] || GAME_MODES.qa;
  const ModeEditor = mode.questionEditor;
  const fixedCount = mode.fixedQuestionCount || 0;

  useEffect(() => {
    Promise.all([loadQuiz(id), loadQuestions(id)])
      .then(([quizData, questionsData]) => {
        setQuiz(quizData);
        setTitle(quizData.title);
        setQuestions(
          questionsData.length > 0
            ? questionsData.map(questionWithKey)
            : [emptyQuestion()]
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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

    const validationError = mode.getValidationError(questions);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateQuiz(id, { title: title.trim() });
      const validQuestions = mode.validateQuestions(questions);
      const savedQuestions = await saveQuestions(id, validQuestions);
      setQuestions(savedQuestions.map(questionWithKey));
      toast.success('Gespeichert!');
    } catch (err) {
      setError(err.message);
      toast.error('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-20 rounded-xl mb-6" />
        <Skeleton className="h-32 rounded-xl mb-3" />
        <Skeleton className="h-32 rounded-xl" />
      </PageTransition>
    );
  }

  if (error && !quiz) {
    return (
      <PageTransition>
        <ErrorState message={error} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/quizzes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Quiz bearbeiten</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
            />
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
                      quizId={id}
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
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </Button>
        <Link to="/room/create">
          <Button variant="outline" size="lg">
            Raum erstellen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-600">Quiz-ID: {id}</p>
    </PageTransition>
  );
}
