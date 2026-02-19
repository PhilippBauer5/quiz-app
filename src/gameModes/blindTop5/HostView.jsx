import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { updateRoom, loadSubmissions } from '../../lib/supabase/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FadeIn } from '../../components/ui/Animations';
import {
  ChevronRight,
  Square,
  Users,
  CheckCircle,
  Clock,
  List,
} from 'lucide-react';

/**
 * Blind Top 5 – HostView (host-gesteuert, kein Scoring)
 *
 * Der Host deckt Items nacheinander auf (Next-Button).
 * Zeigt den Einreichungsstatus der Spieler pro Item.
 * Nach dem letzten Item: Zusammenfassung aller Rankings (ohne Punkte).
 * "Spiel beenden" setzt status → finished.
 */
export default function BlindTop5HostView({ room, questions, players }) {
  const [submissions, setSubmissions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [allPlacements, setAllPlacements] = useState({}); // { playerId: { itemId: pos } }

  // Sync currentIdx from room state
  useEffect(() => {
    if (!room?.current_question_id || !questions.length) return;
    const idx = questions.findIndex((q) => q.id === room.current_question_id);
    if (idx >= 0) setCurrentIdx(idx);
  }, [room?.current_question_id, questions]);

  const currentQuestion = questions[currentIdx] || null;

  // Poll submissions for the current item
  const refreshSubmissions = useCallback(async () => {
    if (!room?.id || !currentQuestion?.id) return;
    try {
      const subs = await loadSubmissions(room.id, currentQuestion.id);
      setSubmissions(subs || []);
    } catch (err) {
      console.error('refreshSubmissions error:', err);
    }
  }, [room?.id, currentQuestion?.id]);

  useEffect(() => {
    refreshSubmissions();
    const interval = setInterval(refreshSubmissions, 3000);
    return () => clearInterval(interval);
  }, [refreshSubmissions]);

  // Load all placements for summary view
  const loadAllPlacements = useCallback(async () => {
    if (!room?.id || !questions.length) return;
    const itemIds = questions.map((q) => q.id);
    const { data: subs } = await supabase
      .from('submissions')
      .select('player_id, question_id, answer_text')
      .eq('room_id', room.id)
      .in('question_id', itemIds);

    if (!subs) return;
    const placements = {};
    for (const sub of subs) {
      if (!placements[sub.player_id]) placements[sub.player_id] = {};
      try {
        const parsed = JSON.parse(sub.answer_text);
        placements[sub.player_id][sub.question_id] = parsed.chosen_position;
      } catch {
        // ignore
      }
    }
    setAllPlacements(placements);
  }, [room?.id, questions]);

  // ── Navigation ──
  async function nextQuestion() {
    if (currentIdx >= questions.length - 1) {
      // Last item → show summary
      await loadAllPlacements();
      setShowSummary(true);
      return;
    }

    const nextIdx = currentIdx + 1;
    try {
      await updateRoom(room.id, {
        current_question_id: questions[nextIdx].id,
      });
      setCurrentIdx(nextIdx);
      setSubmissions([]);
    } catch (err) {
      console.error('nextQuestion error:', err);
    }
  }

  async function finishGame() {
    try {
      await updateRoom(room.id, { status: 'finished' });
    } catch (err) {
      console.error('finishGame error:', err);
    }
  }

  // ── Summary view ──
  if (showSummary) {
    return (
      <FadeIn>
        <Card className="mb-4">
          <CardContent className="pt-5 pb-4">
            <h2 className="text-lg font-bold mb-1">
              {room?.quizzes?.title || 'Blind Top 5'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Alle Platzierungen im Überblick
            </p>

            {players.map((player) => {
              const pl = allPlacements[player.id] || {};
              const ranking = [1, 2, 3, 4, 5].map((pos) => {
                const itemId = Object.keys(pl).find((id) => pl[id] === pos);
                const item = questions.find((q) => q.id === itemId);
                return { position: pos, item };
              });

              return (
                <div key={player.id} className="mb-5 last:mb-0">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    {player.nickname}
                  </h3>
                  <div className="space-y-1">
                    {ranking.map(({ position, item }) => (
                      <div
                        key={position}
                        className="flex items-center gap-2 text-sm rounded-lg px-3 py-1.5 bg-gray-800/50"
                      >
                        <Badge className="shrink-0 w-7 justify-center text-xs">
                          {position}
                        </Badge>
                        <span className={item ? '' : 'text-gray-600'}>
                          {item?.question || '— nicht eingeordnet —'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button onClick={finishGame} className="w-full" size="lg">
          <Square className="h-4 w-4 mr-2" />
          Spiel beenden
        </Button>
      </FadeIn>
    );
  }

  // ── Active game view ──
  return (
    <FadeIn>
      <Card className="mb-4">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              {room?.quizzes?.title || 'Blind Top 5'}
            </h2>
            <Badge variant="secondary">
              Item {currentIdx + 1} / {questions.length}
            </Badge>
          </div>

          <div className="rounded-lg border border-blue-700/50 bg-blue-950/20 px-4 py-3 mb-4">
            <p className="text-xl font-semibold">
              {currentQuestion?.question || '…'}
            </p>
          </div>

          {/* Player submission status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                Antworten: {submissions.length} / {players.length}
              </span>
            </div>
            {players.map((player) => {
              const hasSub = submissions.some((s) => s.player_id === player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    hasSub
                      ? 'border-green-700/50 bg-green-950/20'
                      : 'border-gray-700/50 bg-gray-900/50'
                  }`}
                >
                  <span className="text-sm">{player.nickname}</span>
                  {hasSub ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              );
            })}

            {players.length === 0 && (
              <p className="text-sm text-gray-500">Keine Spieler.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={nextQuestion} className="w-full" size="lg">
        {currentIdx < questions.length - 1 ? (
          <>
            Nächstes Item <ChevronRight className="h-4 w-4 ml-1" />
          </>
        ) : (
          <>
            <List className="h-4 w-4 mr-2" />
            Ergebnisse anzeigen
          </>
        )}
      </Button>
    </FadeIn>
  );
}
