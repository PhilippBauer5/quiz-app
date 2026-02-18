import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadRoomByCode,
  loadQuestions,
  loadPlayers,
  loadSubmissions,
  evaluateSubmission,
  updateRoom,
  upsertScore,
  loadScores,
} from '../lib/supabase/api';
import { getHostToken } from '../lib/supabase/storage';

export default function HostScreen() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const hostToken = getHostToken(code);
  const currentQuestion = questions[currentIdx] || null;
  const isWaiting = room?.status === 'waiting';
  const isFinished = room?.status === 'finished';

  // Load room + questions + players
  useEffect(() => {
    (async () => {
      try {
        const roomData = await loadRoomByCode(code);
        setRoom(roomData);
        const qs = await loadQuestions(roomData.quiz_id);
        setQuestions(qs);
        const ps = await loadPlayers(roomData.id);
        setPlayers(ps);

        // Find current question index
        if (roomData.current_question_id && qs.length > 0) {
          const idx = qs.findIndex(
            (q) => q.id === roomData.current_question_id
          );
          if (idx >= 0) setCurrentIdx(idx);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  // Load submissions for current question
  const refreshSubmissions = useCallback(async () => {
    if (!room || !currentQuestion) return;
    try {
      const subs = await loadSubmissions(room.id, currentQuestion.id);
      setSubmissions(subs);
    } catch (err) {
      console.error('loadSubmissions error:', err);
    }
  }, [room, currentQuestion]);

  useEffect(() => {
    refreshSubmissions();
    const interval = setInterval(refreshSubmissions, 3000);
    return () => clearInterval(interval);
  }, [refreshSubmissions]);

  // Load scores when game finishes
  useEffect(() => {
    if (!room || !isFinished) return;
    (async () => {
      try {
        const sc = await loadScores(room.id);
        setScores(sc);
      } catch (err) {
        console.error('loadScores error:', err);
      }
    })();
  }, [room, isFinished]);

  // Refresh players periodically when waiting
  useEffect(() => {
    if (!room || !isWaiting) return;
    const interval = setInterval(async () => {
      try {
        const ps = await loadPlayers(room.id);
        setPlayers(ps);
      } catch (err) {
        console.error('loadPlayers error:', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [room, isWaiting]);

  async function startGame() {
    if (!room || questions.length === 0) return;
    try {
      const updated = await updateRoom(room.id, {
        status: 'active',
        current_question_id: questions[0].id,
      });
      setRoom(updated);
      setCurrentIdx(0);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleNextClick() {
    const allAnswered = submissions.length >= players.length;
    if (!allAnswered && players.length > 0) {
      setShowSkipWarning(true);
      return;
    }
    confirmNext();
  }

  async function confirmNext() {
    setShowSkipWarning(false);
    if (currentIdx >= questions.length - 1) {
      // Game finished
      try {
        const updated = await updateRoom(room.id, { status: 'finished' });
        setRoom(updated);
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    const nextIdx = currentIdx + 1;
    try {
      const updated = await updateRoom(room.id, {
        current_question_id: questions[nextIdx].id,
      });
      setRoom(updated);
      setCurrentIdx(nextIdx);
      setSubmissions([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function prevQuestion() {
    if (currentIdx <= 0) return;
    const prevIdx = currentIdx - 1;
    try {
      const updated = await updateRoom(room.id, {
        current_question_id: questions[prevIdx].id,
      });
      setRoom(updated);
      setCurrentIdx(prevIdx);
      setSubmissions([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEvaluate(submissionId, playerId, isCorrect) {
    try {
      await evaluateSubmission(submissionId, isCorrect);

      // Update score
      if (isCorrect) {
        // Get current score, increment
        const currentScores = await loadScores(room.id);
        const existing = currentScores.find((s) => s.player_id === playerId);
        const newScore = (existing?.score || 0) + 1;
        await upsertScore(room.id, playerId, newScore);
      }

      refreshSubmissions();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-gray-400">Raum wird geladen…</p>;
  if (error && !room) return <p className="text-red-400">Fehler: {error}</p>;
  if (!hostToken)
    return (
      <p className="text-red-400">
        Kein Host-Token gefunden. Bist du der Host?
      </p>
    );

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Room Code Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Raumcode</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-widest">
              {code}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Kopieren
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Spieler</p>
          <p className="text-2xl font-bold">{players.length}</p>
        </div>
      </div>

      {/* Waiting State */}
      {isWaiting && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
          <p className="text-lg mb-2">Warte auf Spieler…</p>
          <div className="mb-4">
            {players.length === 0 ? (
              <p className="text-gray-500">Noch keine Spieler beigetreten.</p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {players.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-gray-800 px-3 py-1 text-sm"
                  >
                    {p.nickname}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={startGame}
            disabled={players.length === 0 || questions.length === 0}
            className="rounded-lg bg-green-600 px-8 py-3 text-lg font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Spiel starten
          </button>
          <Link
            to="/"
            className="ml-3 rounded-lg border border-gray-700 px-8 py-3 text-lg font-medium text-gray-300 hover:border-gray-500 transition-colors"
          >
            Abbrechen
          </Link>
          {questions.length === 0 && (
            <p className="mt-2 text-sm text-red-400">Keine Fragen im Quiz!</p>
          )}
        </div>
      )}

      {/* Active Game */}
      {room?.status === 'active' && currentQuestion && (
        <div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-4">
            <p className="text-sm text-gray-500 mb-1">
              Frage {currentIdx + 1} / {questions.length}
            </p>
            <h2 className="text-xl font-semibold mb-2">
              {currentQuestion.question}
            </h2>
            {currentQuestion.answer && (
              <p className="text-sm text-gray-500">
                Musterantwort:{' '}
                <span className="text-gray-300">{currentQuestion.answer}</span>
              </p>
            )}
          </div>

          {/* Submissions */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">
              Antworten ({submissions.length} / {players.length})
            </h3>

            {submissions.length === 0 ? (
              <p className="text-gray-500">Warte auf Antworten…</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`rounded-xl border p-4 ${
                      sub.is_correct === true
                        ? 'border-green-700 bg-green-950/30'
                        : sub.is_correct === false
                          ? 'border-red-700 bg-red-950/30'
                          : 'border-gray-800 bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {sub.room_players?.nickname || 'Spieler'}
                        </p>
                        <p className="text-gray-300">„{sub.answer_text}"</p>
                      </div>

                      {sub.is_correct === null ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleEvaluate(sub.id, sub.player_id, true)
                            }
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium hover:bg-green-500"
                          >
                            ✓ Richtig
                          </button>
                          <button
                            onClick={() =>
                              handleEvaluate(sub.id, sub.player_id, false)
                            }
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-500"
                          >
                            ✗ Falsch
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            sub.is_correct ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {sub.is_correct ? '✓ Richtig' : '✗ Falsch'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {currentIdx > 0 && (
              <button
                onClick={prevQuestion}
                className="rounded-lg border border-gray-700 px-6 py-2.5 font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                ← Vorherige Frage
              </button>
            )}
            <button
              onClick={handleNextClick}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium hover:bg-blue-500 transition-colors"
            >
              {currentIdx < questions.length - 1
                ? 'Nächste Frage →'
                : 'Spiel beenden'}
            </button>
          </div>

          {/* Skip Warning Modal */}
          {showSkipWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 max-w-sm mx-4 text-center">
                <p className="text-lg font-semibold mb-2">
                  ⚠️ Nicht alle haben geantwortet
                </p>
                <p className="text-gray-400 mb-4">
                  Erst {submissions.length} von {players.length} Spielern haben
                  geantwortet. Trotzdem fortfahren?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowSkipWarning(false)}
                    className="rounded-lg border border-gray-700 px-5 py-2 font-medium text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={confirmNext}
                    className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-500 transition-colors"
                  >
                    {currentIdx < questions.length - 1
                      ? 'Nächste Frage!'
                      : 'Spiel beenden!'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished */}
      {isFinished && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
          <p className="text-3xl mb-4">🏆</p>
          <h2 className="text-2xl font-bold mb-4">
            {scores.length > 0
              ? `${scores[0].room_players?.nickname || 'Spieler'} hat gewonnen!`
              : 'Spiel beendet!'}
          </h2>

          {scores.length > 0 ? (
            <div className="max-w-sm mx-auto">
              {scores.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <span>
                    {idx === 0
                      ? '🥇'
                      : idx === 1
                        ? '🥈'
                        : idx === 2
                          ? '🥉'
                          : `${idx + 1}.`}{' '}
                    {s.room_players?.nickname || 'Spieler'}
                  </span>
                  <span className="font-bold">{s.score} Pkt.</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Keine Scores vorhanden.</p>
          )}

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 transition-colors"
          >
            Zurück zur Startseite
          </Link>
        </div>
      )}
    </div>
  );
}
