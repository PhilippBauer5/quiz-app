import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadQuizzes } from '../lib/supabase/api';

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
    return <p className="text-gray-400">Quizzes werden geladen…</p>;
  }

  if (error) {
    return <p className="text-red-400">Fehler: {error}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Zurück
          </Link>
          <h1 className="text-2xl font-bold">Meine Quizzes</h1>
        </div>
        <Link
          to="/quiz/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          + Neues Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-400 mb-4">Noch keine Quizzes vorhanden.</p>
          <Link
            to="/quiz/create"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 transition-colors"
          >
            Erstes Quiz erstellen
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5"
            >
              <h3 className="text-lg font-semibold mb-1">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {quiz.questionCount} Frage{quiz.questionCount !== 1 ? 'n' : ''}
              </p>
              <Link
                to={`/quiz/${quiz.id}/edit`}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Bearbeiten →
              </Link>
            </div>
          ))}

          <Link
            to="/quiz/create"
            className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-5 text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all"
          >
            <span className="text-2xl mr-2">+</span> Neues Quiz
          </Link>
        </div>
      )}
    </div>
  );
}
