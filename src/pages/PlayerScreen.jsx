import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadRoomByCode,
  loadQuestions,
  submitAnswer,
  loadScores,
} from '../lib/supabase/api';
import { getPlayerData } from '../lib/supabase/storage';
import { supabase } from '../lib/supabaseClient';
import { getImageUrl } from '../lib/supabase/imageStorage';
import { GAME_MODES } from '../gameModes';
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Trophy,
  Award,
  Home,
  User,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button, buttonVariants } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { LoadingState, ErrorState } from '../components/ui/States';

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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedKey = useRef(null);

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
        setAlreadySubmitted(false);
        setIsChecking(false);
        lastCheckedKey.current = null;
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
    const interval = setInterval(refreshRoom, 4000);
    return () => clearInterval(interval);
  }, [refreshRoom]);

  // Check for existing submission when question changes
  useEffect(() => {
    const playerId = playerData?.playerId;
    const questionId = currentQuestion?.id;
    if (!playerId || !questionId) return;

    const checkKey = `${playerId}:${questionId}`;
    if (lastCheckedKey.current === checkKey) return;
    lastCheckedKey.current = checkKey;

    let cancelled = false;
    setIsChecking(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('submissions')
          .select('answer_text, is_correct')
          .eq('player_id', playerId)
          .eq('question_id', questionId)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setAnswer(data.answer_text || '');
          setSubmitted(true);
          setAlreadySubmitted(true);
          if (data.is_correct !== null) setResult(data.is_correct);
        }
      } catch (err) {
        console.error('checkExisting error:', err);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentQuestion?.id, playerData?.playerId]);

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
    if (isSubmitting || alreadySubmitted) return;

    setIsSubmitting(true);
    try {
      await submitAnswer({
        roomId: room.id,
        questionId: currentQuestion.id,
        playerId: playerData.playerId,
        answerText: answer.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      if (err.code === '23505') {
        setSubmitted(true);
        setAlreadySubmitted(true);
        const { data } = await supabase
          .from('submissions')
          .select('answer_text, is_correct')
          .eq('player_id', playerData.playerId)
          .eq('question_id', currentQuestion.id)
          .maybeSingle();
        if (data) {
          setAnswer(data.answer_text || '');
          if (data.is_correct !== null) setResult(data.is_correct);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <LoadingState text="Raum wird geladen…" />;
  if (error && !room) return <ErrorState title="Fehler" description={error} />;
  if (!playerData)
    return (
      <ErrorState
        title="Keine Spielerdaten"
        description="Keine Spielerdaten gefunden. Bitte tritt dem Raum erneut bei."
      />
    );

  const isWaiting = room?.status === 'waiting';
  const isFinished = room?.status === 'finished';
  const quizType = room?.quizzes?.quiz_type || 'qa';
  const modeConfig = GAME_MODES[quizType];
  const ModePlayerView = modeConfig?.playerView;
  const ModeQuestionDisplay = modeConfig?.questionDisplay;

  const placeIcon = (idx) => {
    const colors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];
    if (idx < 3) return <Award className={`h-5 w-5 ${colors[idx]}`} />;
    return (
      <span className="text-sm text-gray-500 w-5 text-center">{idx + 1}.</span>
    );
  };

  return (
    <PageTransition>
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
          <p className="text-lg font-semibold flex items-center justify-end gap-1.5">
            <User className="h-4 w-4 text-gray-400" />
            {playerData.nickname}
          </p>
        </div>
      </div>

      {/* Waiting */}
      {isWaiting && (
        <FadeIn>
          <Card className="text-center">
            <CardContent className="py-10">
              <Clock className="h-10 w-10 text-blue-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-2">
                Warte auf den Host…
              </h2>
              <p className="text-gray-500">Das Spiel startet gleich.</p>
            </CardContent>
          </Card>
        </FadeIn>
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
            <FadeIn>
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 mb-1">Frage</p>
                  {ModeQuestionDisplay ? (
                    <ModeQuestionDisplay question={currentQuestion} />
                  ) : (
                    <>
                      {currentQuestion.image_path && (
                        <img
                          src={getImageUrl(currentQuestion.image_path)}
                          alt="Fragebild"
                          className="rounded-xl max-h-64 w-full object-contain bg-gray-900 border border-gray-700 mb-3"
                        />
                      )}
                      {currentQuestion.question && (
                        <h2 className="text-xl font-semibold">
                          {currentQuestion.question}
                        </h2>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {isChecking ? (
                <LoadingState text="Wird geprüft…" />
              ) : (
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Deine Antwort…"
                    rows={3}
                    disabled={alreadySubmitted}
                    className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none mb-4 resize-none disabled:opacity-60"
                  />
                  {alreadySubmitted && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
                      <Info className="h-4 w-4" /> Antwort bereits abgegeben
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={
                      !answer.trim() ||
                      isSubmitting ||
                      alreadySubmitted ||
                      isChecking
                    }
                    loading={isSubmitting}
                    className="w-full"
                  >
                    <Send className="h-5 w-5 mr-2" /> Antwort senden
                  </Button>
                </form>
              )}
            </FadeIn>
          )}

          {/* Submitted – waiting for evaluation */}
          {room?.status === 'active' && submitted && result === null && (
            <FadeIn>
              <Card className="text-center">
                <CardContent className="py-10">
                  <Send className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <h2 className="text-xl font-semibold mb-2">
                    Antwort gesendet!
                  </h2>
                  <p className="text-gray-500">Warte auf Bewertung…</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Evaluated */}
          {room?.status === 'active' && submitted && result !== null && (
            <FadeIn>
              <Card
                className={
                  result
                    ? 'border-green-700 bg-green-950/30'
                    : 'border-red-700 bg-red-950/30'
                }
              >
                <CardContent className="py-10 text-center">
                  {result ? (
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  )}
                  <h2 className="text-xl font-semibold mb-2">
                    {result ? 'Richtig!' : 'Leider falsch.'}
                  </h2>
                  <p className="text-gray-400">Warte auf die nächste Frage…</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Active but no question yet */}
          {room?.status === 'active' && !currentQuestion && (
            <FadeIn>
              <Card className="text-center">
                <CardContent className="py-10">
                  <p className="text-gray-500">Warte auf die erste Frage…</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </>
      )}

      {/* Finished */}
      {isFinished && (
        <FadeIn>
          <Card className="text-center">
            <CardContent className="pt-6 pb-8">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
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
                      <p className="text-gray-400 mb-4">
                        Kein Score vorhanden.
                      </p>
                    );
                  const place = myIdx + 1;
                  return (
                    <p className="text-lg text-gray-300 mb-4 flex items-center justify-center gap-2">
                      {placeIcon(myIdx)} Du bist{' '}
                      <span className="font-bold text-white">
                        Platz {place}
                      </span>{' '}
                      mit <Badge>{scores[myIdx].score} Pkt.</Badge>
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
                      <span className="flex items-center gap-2">
                        {placeIcon(idx)}
                        {s.room_players?.nickname || 'Spieler'}
                      </span>
                      <Badge>{s.score} Pkt.</Badge>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/" className={buttonVariants()}>
                <Home className="h-4 w-4 mr-2" /> Zurück zur Startseite
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </PageTransition>
  );
}
