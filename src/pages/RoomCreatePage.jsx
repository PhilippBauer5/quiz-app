import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadQuizzes, createRoom } from '../lib/supabase/api';
import { saveHostToken } from '../lib/supabase/storage';

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
      navigate(`/room/${room.room_code}/host`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400">Quizzes werden geladen…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raum erstellen</h1>
        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Zurück
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-400 mb-4">Du hast noch kein Quiz erstellt.</p>
          <Link
            to="/quiz/create"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 transition-colors"
          >
            Quiz erstellen
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">Wähle ein Quiz für den Raum:</p>

          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => setSelectedQuiz(quiz.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedQuiz === quiz.id
                    ? 'border-blue-500 bg-blue-950/50'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <h3 className="font-semibold">{quiz.title}</h3>
                <p className="text-sm text-gray-500">
                  {quiz.questionCount} Frage
                  {quiz.questionCount !== 1 ? 'n' : ''}
                </p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !selectedQuiz}
              className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Wird erstellt…' : 'Raum erstellen'}
            </button>
            <Link
              to="/"
              className="rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-300 hover:border-gray-500 transition-colors"
            >
              Abbrechen
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
