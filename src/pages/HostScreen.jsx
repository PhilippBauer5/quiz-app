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
import { GAME_MODES } from '../gameModes';
import {
  Copy,
  Users,
  Play,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trophy,
  Award,
  AlertTriangle,
  Home,
  Square,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button, buttonVariants } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageTransition, FadeIn } from '../components/ui/Animations';
import { LoadingState, ErrorState } from '../components/ui/States';

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
  const quizType = room?.quizzes?.quiz_type || 'qa';
  const modeConfig = GAME_MODES[quizType];
  const ModeHostView = modeConfig?.hostView;
  const ModeQuestionDisplay = modeConfig?.questionDisplay;

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
      let subs = await loadSubmissions(room.id, currentQuestion.id);

      // Auto-evaluate true_false submissions
      if (quizType === 'true_false' && currentQuestion.answer) {
        const unevaluated = subs.filter((s) => s.is_correct === null);
        for (const sub of unevaluated) {
          const isCorrect =
            sub.answer_text.toLowerCase().trim() ===
            currentQuestion.answer.toLowerCase().trim();
          await evaluateSubmission(sub.id, isCorrect);
          if (isCorrect) {
            const sc = await loadScores(room.id);
            const existing = sc.find((s) => s.player_id === sub.player_id);
            const newScore = (existing?.score || 0) + 1;
            await upsertScore(room.id, sub.player_id, newScore);
          }
        }
        if (unevaluated.length > 0) {
          subs = await loadSubmissions(room.id, currentQuestion.id);
        }
      }

      setSubmissions(subs);
    } catch (err) {
      console.error('loadSubmissions error:', err);
    }
  }, [room, currentQuestion, quizType]);

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

  if (loading) return <LoadingState text="Raum wird geladen…" />;
  if (error && !room) return <ErrorState title="Fehler" description={error} />;
  if (!hostToken)
    return (
      <ErrorState
        title="Kein Zugriff"
        description="Kein Host-Token gefunden. Bist du der Host?"
      />
    );

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

      {/* Room Code Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Raumcode</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-widest">
              {code}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast('Code kopiert');
              }}
            >
              <Copy className="h-4 w-4 mr-1.5" /> Kopieren
            </Button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Spieler</p>
          <div className="flex items-center justify-end gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-2xl font-bold">{players.length}</span>
          </div>
        </div>
      </div>

      {/* Waiting State */}
      {isWaiting && (
        <FadeIn>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-10 w-10 text-blue-400 mx-auto mb-3" />
              <p className="text-lg mb-4">Warte auf Spieler…</p>
              <div className="mb-6">
                {players.length === 0 ? (
                  <p className="text-gray-500">
                    Noch keine Spieler beigetreten.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {players.map((p) => (
                      <Badge key={p.id} variant="secondary">
                        {p.nickname}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="success"
                  size="lg"
                  onClick={startGame}
                  disabled={players.length === 0 || questions.length === 0}
                >
                  <Play className="h-5 w-5 mr-2" /> Spiel starten
                </Button>
                <Link
                  to="/"
                  className={buttonVariants({ variant: 'outline', size: 'lg' })}
                >
                  Abbrechen
                </Link>
              </div>
              {questions.length === 0 && (
                <p className="mt-3 text-sm text-red-400 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Keine Fragen im Quiz!
                </p>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Active Game */}
      {room?.status === 'active' && quizType !== 'qa' && ModeHostView ? (
        <ModeHostView room={room} questions={questions} players={players} />
      ) : (
        room?.status === 'active' &&
        currentQuestion && (
          <FadeIn>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary">
                    Frage {currentIdx + 1} / {questions.length}
                  </Badge>
                </div>
                {ModeQuestionDisplay ? (
                  <ModeQuestionDisplay question={currentQuestion} />
                ) : (
                  currentQuestion.question && (
                    <h2 className="text-xl font-semibold mt-2 mb-2">
                      {currentQuestion.question}
                    </h2>
                  )
                )}
                {currentQuestion.answer && (
                  <p className="text-sm text-gray-500">
                    Musterantwort:{' '}
                    <span className="text-gray-300">
                      {currentQuestion.answer}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submissions */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Antworten
                <Badge>
                  {submissions.length} / {players.length}
                </Badge>
              </h3>

              {submissions.length === 0 ? (
                <p className="text-gray-500">Warte auf Antworten…</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <Card
                      key={sub.id}
                      className={
                        sub.is_correct === true
                          ? 'border-green-700 bg-green-950/30'
                          : sub.is_correct === false
                            ? 'border-red-700 bg-red-950/30'
                            : ''
                      }
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {sub.room_players?.nickname || 'Spieler'}
                            </p>
                            <p className="text-gray-300">„{sub.answer_text}"</p>
                          </div>

                          {sub.is_correct === null ? (
                            <div className="flex gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() =>
                                  handleEvaluate(sub.id, sub.player_id, true)
                                }
                              >
                                <Check className="h-4 w-4 mr-1" /> Richtig
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleEvaluate(sub.id, sub.player_id, false)
                                }
                              >
                                <X className="h-4 w-4 mr-1" /> Falsch
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={`flex items-center gap-1.5 text-sm font-medium ${
                                sub.is_correct
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {sub.is_correct ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              {sub.is_correct ? 'Richtig' : 'Falsch'}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {currentIdx > 0 && (
                <Button variant="outline" onClick={prevQuestion}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Vorherige Frage
                </Button>
              )}
              <Button onClick={handleNextClick}>
                {currentIdx < questions.length - 1 ? (
                  <>
                    Nächste Frage <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Spiel beenden <Square className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Warning Modal */}
            {showSkipWarning && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <Card className="max-w-sm mx-4 border-gray-700">
                  <CardContent className="pt-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold mb-2">
                      Nicht alle haben geantwortet
                    </p>
                    <p className="text-gray-400 mb-5">
                      Erst {submissions.length} von {players.length} Spielern
                      haben geantwortet. Trotzdem fortfahren?
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowSkipWarning(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button onClick={confirmNext}>
                        {currentIdx < questions.length - 1
                          ? 'Nächste Frage!'
                          : 'Spiel beenden!'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </FadeIn>
        )
      )}

      {/* Finished */}
      {isFinished && (
        <FadeIn>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
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
                      <span className="flex items-center gap-2">
                        {placeIcon(idx)}
                        {s.room_players?.nickname || 'Spieler'}
                      </span>
                      <Badge>{s.score} Pkt.</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Keine Scores vorhanden.</p>
              )}

              <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
                <Home className="h-4 w-4 mr-2" /> Zurück zur Startseite
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </PageTransition>
  );
}
