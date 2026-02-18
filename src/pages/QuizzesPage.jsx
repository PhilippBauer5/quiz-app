import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadQuizzes } from '../lib/supabase/api';
import { Plus, ArrowLeft, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import {
  PageTransition,
  FadeIn,
  ScaleOnHover,
} from '../components/ui/Animations';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizzes()
      .then(setQuizzes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </PageTransition>
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Meine Quizzes</h1>
        </div>
        <Link to="/quiz/create">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Neues Quiz
          </Button>
        </Link>
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
            title="Noch keine Quizzes"
            description="Erstelle dein erstes Quiz, um loszulegen."
          >
            <Link to="/quiz/create">
              <Button>
                <Plus className="h-4 w-4" />
                Erstes Quiz erstellen
              </Button>
            </Link>
          </EmptyState>
        </FadeIn>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz, i) => (
            <FadeIn key={quiz.id} delay={i * 0.05}>
              <ScaleOnHover>
                <Link to={`/quiz/${quiz.id}/edit`} className="block">
                  <Card className="hover:border-gray-600 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-semibold">
                          {quiz.title}
                        </h3>
                        <Badge variant="secondary">
                          {quiz.questionCount}{' '}
                          {quiz.questionCount === 1 ? 'Frage' : 'Fragen'}
                        </Badge>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm text-blue-400 font-medium">
                        Bearbeiten <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </ScaleOnHover>
            </FadeIn>
          ))}

          <FadeIn delay={quizzes.length * 0.05}>
            <Link to="/quiz/create" className="block h-full">
              <Card className="border-dashed border-2 border-gray-700 hover:border-blue-500 transition-colors h-full">
                <CardContent className="p-5 flex items-center justify-center gap-2 h-full text-gray-500 hover:text-blue-400 transition-colors">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Neues Quiz</span>
                </CardContent>
              </Card>
            </Link>
          </FadeIn>
        </div>
      )}
    </PageTransition>
  );
}
