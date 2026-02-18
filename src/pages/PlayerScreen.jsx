import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { loadRoomByCode, loadQuestions, submitAnswer } from '../lib/supabase/api';
import { getPlayerData } from '../lib/supabase/storage';
import { supabase } from '../lib/supabaseClient';

export default function PlayerScreen() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const playerData = getPlayerData(code);

  // Load room + questions
  useEffect(() => {
    (async () => {
      try {
        const roomData = await loadRoomByCode(code);
        setRoom(roomData);
        const qs = await loadQuestions(roomData.quiz_id);
        setQuestions(qs);

        if (roomData.current_question_id) {
          const cq = qs.find((q) => q.id === roomData.current_question_id);
          setCurrentQuestion(cq || null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  // Poll room status for question changes
  const refreshRoom = useCallback(async () => {
    if (!room) return;
    try {
      const updated = await loadRoomByCode(code);
      setRoom(updated);

      // Question changed?
      if (updated.current_question_id !== room.current_question_id) {
        const cq = questions.find((q) => q.id === updated.current_question_id);
        setCurrentQuestion(cq || null);
        setAnswer('');
        setSubmitted(false);
        setResult(null);
      }

      // Check own submission result
      if (submitted && playerData && updated.current_question_id) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('is_correct')
          .eq('player_id', playerData.playerId)
          .eq('question_id', updated.current_question_id)
          .single();
        if (subs && subs.is_correct !== null) {
          setResult(subs.is_correct);
        }
      }
    } catch (err) {
      console.error('refreshRoom error:', err);
    }
  }, [room, code, questions, submitted, playerData]);

  useEffect(() => {
    const interval = setInterval(refreshRoom, 2000);
    return () => clearInterval(interval);
  }, [refreshRoom]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || !room || !currentQuestion || !playerData) return;

    try {
      await submitAnswer({
        roomId: room.id,
        questionId: currentQuestion.id,
        playerId: playerData.playerId,
        answerText: answer.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-gray-400">Raum wird geladen…</p>;
  if (error && !room) return <p className="text-red-400">Fehler: {error}</p>;
  if (!playerData) return <p className="text-red-400">Keine Spielerdaten gefunden. Bitte tritt dem Raum erneut bei.</p>;

  const isWaiting = room?.status === 'waiting';
  const isFinished = room?.status === 'finished';

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Raum</p>
          <p className="text-xl font-mono font-bold">{code}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Spieler</p>
          <p className="text-lg font-semibold">{playerData.nickname}</p>
        </div>
      </div>

      {/* Waiting */}
      {isWaiting && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h2 className="text-xl font-semibold mb-2">Warte auf den Host…</h2>
          <p className="text-gray-500">Das Spiel startet gleich.</p>
        </div>
      )}

      {/* Active – show question */}
      {room?.status === 'active' && currentQuestion && !submitted && (
        <div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-4">
            <p className="text-sm text-gray-500 mb-1">Frage</p>
            <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Deine Antwort…"
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none mb-4 resize-none"
            />
            <button
              type="submit"
              disabled={!answer.trim()}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Antwort senden
            </button>
          </form>
        </div>
      )}

      {/* Submitted – waiting for evaluation */}
      {room?.status === 'active' && submitted && result === null && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-4xl mb-4">📨</p>
          <h2 className="text-xl font-semibold mb-2">Antwort gesendet!</h2>
          <p className="text-gray-500">Warte auf Bewertung…</p>
        </div>
      )}

      {/* Evaluated */}
      {room?.status === 'active' && submitted && result !== null && (
        <div
          className={`rounded-xl border p-8 text-center ${
            result ? 'border-green-700 bg-green-950/30' : 'border-red-700 bg-red-950/30'
          }`}
        >
          <p className="text-4xl mb-4">{result ? '✅' : '❌'}</p>
          <h2 className="text-xl font-semibold mb-2">
            {result ? 'Richtig!' : 'Leider falsch.'}
          </h2>
          <p className="text-gray-400">Warte auf die nächste Frage…</p>
        </div>
      )}

      {/* Active but no question yet */}
      {room?.status === 'active' && !currentQuestion && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-500">Warte auf die erste Frage…</p>
        </div>
      )}

      {/* Finished */}
      {isFinished && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <h2 className="text-xl font-semibold mb-2">Spiel beendet!</h2>
          <p className="text-gray-400">Danke fürs Mitspielen.</p>
        </div>
      )}
    </div>
  );
}
