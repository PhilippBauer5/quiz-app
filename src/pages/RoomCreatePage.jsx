import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadQuizzes, createRoom } from '../lib/supabase/api';
import { saveHostToken } from '../lib/supabase/storage';
import { ArrowLeft, Plus, FileText, Play } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { toast } from 'sonner';

export default function RoomCreatePage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizzes()
      .then((data) => {
        setQuizzes(data);
        if (data.length > 0) setSelectedQuiz(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!selectedQuiz) return;

    setCreating(true);
    setError(null);

    try {
      const room = await createRoom(selectedQuiz);
      saveHostToken(room.room_code, room.host_token);
      toast.success('Raum erstellt!');
      navigate(`/room/${room.room_code}/host`);
    } catch (err) {
      setError(err.message);
      toast.error('Fehler beim Erstellen.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Raum erstellen</h1>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      {quizzes.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon={FileText}
            title="Keine Quizzes vorhanden"
            description="Erstelle zuerst ein Quiz, bevor du einen Raum starten kannst."
          >
            <Link to="/quiz/create">
              <Button>
                <Plus className="h-4 w-4" />
                Quiz erstellen
              </Button>
            </Link>
          </EmptyState>
        </FadeIn>
      ) : (
        <>
          <p className="text-gray-400 mb-4 text-sm">
            Wähle ein Quiz für den Raum:
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {quizzes.map((quiz, i) => (
              <FadeIn key={quiz.id} delay={i * 0.05}>
                <button
                  onClick={() => setSelectedQuiz(quiz.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedQuiz === quiz.id
                      ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/30'
                      : 'border-gray-800 bg-gray-900/80 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{quiz.title}</h3>
                    <Badge variant="secondary">
                      {quiz.questionCount}{' '}
                      {quiz.questionCount === 1 ? 'Frage' : 'Fragen'}
                    </Badge>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={!selectedQuiz}
              size="lg"
            >
              <Play className="h-4 w-4" />
              {creating ? 'Wird erstellt…' : 'Raum erstellen'}
            </Button>
            <Link to="/">
              <Button variant="outline" size="lg">
                Abbrechen
              </Button>
            </Link>
          </div>
        </>
      )}
    </PageTransition>
  );
}
