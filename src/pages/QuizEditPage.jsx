import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadQuiz, loadQuestions, saveQuestions, updateQuiz } from '../lib/supabase/api';

function questionWithKey(q) {
  return { ...q, key: q.id || crypto.randomUUID() };
}

function emptyQuestion() {
  return { question: '', answer: '', key: crypto.randomUUID() };
}

export default function QuizEditPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

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
      setError('Titel ist erforderlich.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateQuiz(id, { title: title.trim() });
      const validQuestions = questions.filter((q) => q.question.trim());
      const savedQuestions = await saveQuestions(id, validQuestions);
      setQuestions(savedQuestions.map(questionWithKey));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400">Quiz wird geladen…</p>;
  }

  if (error && !quiz) {
    return <p className="text-red-400">Fehler: {error}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quiz bearbeiten</h1>
        <Link to="/quizzes" className="text-sm text-gray-500 hover:text-gray-300">
          ← Zurück
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 rounded-lg bg-green-900/50 border border-green-700 px-4 py-3 text-sm text-green-300">
          Gespeichert!
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-1">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Fragen ({questions.length})</h2>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.key} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Frage {idx + 1}</span>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(q.key)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(q.key, 'question', e.target.value)}
                placeholder="Frage eingeben…"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none mb-2"
              />

              <input
                type="text"
                value={q.answer || ''}
                onChange={(e) => updateQuestion(q.key, 'answer', e.target.value)}
                placeholder="Musterantwort (optional)"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-3 rounded-lg border border-dashed border-gray-700 px-4 py-2 text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all w-full"
        >
          + Frage hinzufügen
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </button>

        <Link
          to="/room/create"
          className="rounded-lg border border-gray-700 px-6 py-2.5 font-medium text-gray-300 hover:border-gray-500 transition-colors"
        >
          Raum erstellen →
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-600">Quiz-ID: {id}</p>
    </div>
  );
}
