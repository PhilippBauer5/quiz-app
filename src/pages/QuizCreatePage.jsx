import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createQuiz, saveQuestions } from '../lib/supabase/api';

function emptyQuestion() {
  return { question: '', answer: '', key: crypto.randomUUID() };
}

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
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
      setError('Titel ist erforderlich.');
      return;
    }
    const validQuestions = questions.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      setError('Mindestens eine Frage ist erforderlich.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const quiz = await createQuiz(title.trim());
      await saveQuestions(quiz.id, validQuestions);
      navigate(`/quiz/${quiz.id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Neues Quiz erstellen</h1>
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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Allgemeinwissen"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Fragen</h2>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.key}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Frage {idx + 1}
                </span>
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
                onChange={(e) =>
                  updateQuestion(q.key, 'question', e.target.value)
                }
                placeholder="Frage eingeben…"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none mb-2"
              />

              <input
                type="text"
                value={q.answer}
                onChange={(e) =>
                  updateQuestion(q.key, 'answer', e.target.value)
                }
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
          {saving ? 'Wird gespeichert…' : 'Quiz speichern'}
        </button>
        <Link
          to="/"
          className="rounded-lg border border-gray-700 px-6 py-2.5 font-medium text-gray-300 hover:border-gray-500 transition-colors"
        >
          Abbrechen
        </Link>
      </div>
    </div>
  );
}
