import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createQuiz, saveQuestions } from '../lib/supabase/api';
import { GAME_MODES } from '../gameModes';
import {
  uploadQuestionImage,
  getImageUrl,
  deleteQuestionImage,
} from '../lib/supabase/imageStorage';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  ChevronDown,
  ImagePlus,
  Loader2,
} from 'lucide-react';
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
  const [uploadingKeys, setUploadingKeys] = useState(new Set());

  // We need a temp quiz ID for uploads before the quiz is created.
  // Generate one upfront so file paths are consistent.
  const [tempQuizId] = useState(() => crypto.randomUUID());

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

  async function handleImageUpload(key, file) {
    setUploadingKeys((prev) => new Set(prev).add(key));
    try {
      const path = await uploadQuestionImage(file, tempQuizId, key);
      updateQuestion(key, 'image_path', path);
      toast.success('Bild hochgeladen');
    } catch (err) {
      toast.error(err.message || 'Upload fehlgeschlagen');
    } finally {
      setUploadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleImageRemove(key, imagePath) {
    try {
      await deleteQuestionImage(imagePath);
    } catch {
      // ignore storage error – file may already be gone
    }
    updateQuestion(key, 'image_path', null);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Titel ist erforderlich.');
      return;
    }

    if (quizType === 'identify_image') {
      // For identify_image every question needs an image
      const withImage = questions.filter((q) => q.image_path);
      if (withImage.length === 0) {
        toast.error('Mindestens eine Frage mit Bild ist erforderlich.');
        return;
      }
      // save only questions that have an image
      const validQuestions = questions.filter((q) => q.image_path);

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
            <Label htmlFor="quizType">Spielmodus</Label>
            <div className="relative">
              <select
                id="quizType"
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
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
                    placeholder={
                      quizType === 'identify_image'
                        ? 'Frage (optional)'
                        : 'Frage eingeben…'
                    }
                    className="mb-2"
                  />

                  {/* Image upload for identify_image */}
                  {quizType === 'identify_image' && (
                    <div className="mb-2">
                      {q.image_path ? (
                        <div className="relative group">
                          <img
                            src={getImageUrl(q.image_path)}
                            alt="Fragebild"
                            className="rounded-lg max-h-48 w-full object-contain bg-gray-900 border border-gray-700"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              handleImageRemove(q.key, q.image_path)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Entfernen
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 px-4 py-6 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all cursor-pointer">
                          {uploadingKeys.has(q.key) ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span>Wird hochgeladen…</span>
                            </>
                          ) : (
                            <>
                              <ImagePlus className="h-6 w-6" />
                              <span>Bild hochladen (max. 3 MB)</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingKeys.has(q.key)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(q.key, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

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
