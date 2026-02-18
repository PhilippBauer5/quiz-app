import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadRoomByCode,
  loadQuestions,
  submitAnswer,
  loadScores,
} from '../lib/supabase/api';
import { getPlayerData } from '../lib/supabase/storage';
import { supabase } from '../lib/supabaseClient';
import { GAME_MODES } from '../gameModes';

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
  const [scores, setScores] = useState([]);

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

  // Load scores when game finishes
  useEffect(() => {
    if (!room || room.status !== 'finished') return;
    (async () => {
      try {
        const sc = await loadScores(room.id);
        setScores(sc);
      } catch (err) {
        console.error('loadScores error:', err);
      }
    })();
  }, [room]);

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
  if (!playerData)
    return (
      <p className="text-red-400">
        Keine Spielerdaten gefunden. Bitte tritt dem Raum erneut bei.
      </p>
    );

  const isWaiting = room?.status === 'waiting';
  const isFinished = room?.status === 'finished';
  const quizType = room?.quizzes?.quiz_type || 'qa';
  const ModePlayerView = GAME_MODES[quizType]?.playerView;

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

      {/* Active Game */}
      {room?.status === 'active' && quizType !== 'qa' && ModePlayerView ? (
        <ModePlayerView
          room={room}
          question={currentQuestion}
          playerData={playerData}
        />
      ) : (
        <>
          {/* Active – show question */}
          {room?.status === 'active' && currentQuestion && !submitted && (
            <div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-4">
                <p className="text-sm text-gray-500 mb-1">Frage</p>
                <h2 className="text-xl font-semibold">
                  {currentQuestion.question}
                </h2>
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
                result
                  ? 'border-green-700 bg-green-950/30'
                  : 'border-red-700 bg-red-950/30'
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
        </>
      )}

      {/* Finished */}
      {isFinished && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-4xl mb-4">🏆</p>
          <h2 className="text-xl font-semibold mb-2">
            {scores.length > 0
              ? `${scores[0].room_players?.nickname || 'Spieler'} hat gewonnen!`
              : 'Spiel beendet!'}
          </h2>

          {/* Player placement */}
          {scores.length > 0 &&
            playerData &&
            (() => {
              const myIdx = scores.findIndex(
                (s) => s.player_id === playerData.playerId
              );
              if (myIdx === -1)
                return (
                  <p className="text-gray-400 mb-4">Kein Score vorhanden.</p>
                );
              const place = myIdx + 1;
              const medal =
                place === 1
                  ? '🥇'
                  : place === 2
                    ? '🥈'
                    : place === 3
                      ? '🥉'
                      : `${place}.`;
              return (
                <p className="text-lg text-gray-300 mb-4">
                  {medal} Du bist{' '}
                  <span className="font-bold text-white">Platz {place}</span>{' '}
                  mit{' '}
                  <span className="font-bold text-white">
                    {scores[myIdx].score} Pkt.
                  </span>
                </p>
              );
            })()}

          {/* Scoreboard */}
          {scores.length > 0 && (
            <div className="max-w-sm mx-auto mb-6">
              {scores.map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between py-2 border-b border-gray-800 last:border-0 ${
                    s.player_id === playerData?.playerId
                      ? 'text-white font-bold'
                      : 'text-gray-400'
                  }`}
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
          )}

          <Link
            to="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 transition-colors"
          >
            Zurück zur Startseite
          </Link>
        </div>
      )}
    </div>
  );
}
