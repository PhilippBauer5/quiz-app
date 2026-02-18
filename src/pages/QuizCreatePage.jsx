import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createQuiz, saveQuestions } from '../lib/supabase/api';
import { GAME_MODES } from '../gameModes';
import { ArrowLeft, Plus, Trash2, Save, Check, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import { ErrorState } from '../components/ui/States';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { toast } from 'sonner';

function emptyQuestion() {
  return { question: '', answer: '', key: crypto.randomUUID() };
}

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [quizType, setQuizType] = useState('qa');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
    const validQuestions = questions.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      toast.error('Mindestens eine Frage ist erforderlich.');
      return;
    }

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
            <Label>Spielmodus</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(GAME_MODES).map(([key, mode]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQuizType(key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    quizType === key
                      ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/30'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <span className="font-medium text-sm">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Fragen</h2>
          <Badge variant="secondary">{questions.length}</Badge>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <FadeIn key={q.key}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Frage {idx + 1}
                    </span>
                    {questions.length > 1 && (
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

                  <Input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(q.key, 'question', e.target.value)
                    }
                    placeholder="Frage eingeben…"
                    className="mb-2"
                  />

                  {quizType === 'true_false' ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={q.answer === 'Wahr' ? 'success' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => updateQuestion(q.key, 'answer', 'Wahr')}
                      >
                        <Check className="h-4 w-4" />
                        Wahr
                      </Button>
                      <Button
                        type="button"
                        variant={
                          q.answer === 'Falsch' ? 'destructive' : 'outline'
                        }
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          updateQuestion(q.key, 'answer', 'Falsch')
                        }
                      >
                        <X className="h-4 w-4" />
                        Falsch
                      </Button>
                    </div>
                  ) : (
                    <Input
                      value={q.answer}
                      onChange={(e) =>
                        updateQuestion(q.key, 'answer', e.target.value)
                      }
                      placeholder="Musterantwort (optional)"
                      className="text-sm"
                    />
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-700 px-4 py-3 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Frage hinzufügen
        </button>
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
