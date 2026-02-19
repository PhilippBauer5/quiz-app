import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FadeIn } from '../../components/ui/Animations';
import { Users, CheckCircle, Clock, Trophy, Award } from 'lucide-react';

/**
 * Blind Top 5 – HostView
 *
 * Shows:
 * - The quiz title
 * - Each player's progress (how many items placed out of 5)
 * - The correct ranking (revealed after all players finish or host decides)
 */
export default function BlindTop5HostView({ room, questions, players }) {
  const [items, setItems] = useState([]);
  const [playerProgress, setPlayerProgress] = useState({}); // { playerId: count }
  const [showResults, setShowResults] = useState(false);
  const [playerPlacements, setPlayerPlacements] = useState({}); // { playerId: { itemId: pos } }
  const [scores, setScores] = useState({}); // { playerId: score }

  // Items sorted by correct position
  useEffect(() => {
    if (questions?.length) {
      const sorted = [...questions].sort((a, b) => a.position - b.position);
      setItems(sorted);
    }
  }, [questions]);

  // Poll player progress
  const refreshProgress = useCallback(async () => {
    if (!room?.id || items.length === 0 || players.length === 0) return;
    try {
      const itemIds = items.map((i) => i.id);
      const { data: subs } = await supabase
        .from('submissions')
        .select('player_id, question_id, answer_text')
        .eq('room_id', room.id)
        .in('question_id', itemIds);

      if (!subs) return;

      // Count submissions per player
      const progress = {};
      const placements = {};
      for (const sub of subs) {
        progress[sub.player_id] = (progress[sub.player_id] || 0) + 1;

        if (!placements[sub.player_id]) placements[sub.player_id] = {};
        try {
          const parsed = JSON.parse(sub.answer_text);
          placements[sub.player_id][sub.question_id] = parsed.chosen_position;
        } catch {
          // ignore
        }
      }
      setPlayerProgress(progress);
      setPlayerPlacements(placements);
    } catch (err) {
      console.error('refreshProgress error:', err);
    }
  }, [room?.id, items, players]);

  useEffect(() => {
    refreshProgress();
    const interval = setInterval(refreshProgress, 3000);
    return () => clearInterval(interval);
  }, [refreshProgress]);

  // Calculate scores when results are shown
  useEffect(() => {
    if (!showResults) return;
    const newScores = {};
    for (const player of players) {
      let score = 0;
      const pl = playerPlacements[player.id] || {};
      for (const item of items) {
        const chosenPos = pl[item.id];
        const correctPos = item.position + 1; // position is 0-indexed in DB
        if (chosenPos === correctPos) {
          score += 2; // Exact match
        } else if (chosenPos && Math.abs(chosenPos - correctPos) === 1) {
          score += 1; // Off by one
        }
      }
      newScores[player.id] = score;
    }
    setScores(newScores);
  }, [showResults, playerPlacements, items, players]);

  const allFinished =
    players.length > 0 &&
    players.every((p) => (playerProgress[p.id] || 0) >= 5);

  return (
    <FadeIn>
      <Card className="mb-4">
        <CardContent className="pt-5 pb-4">
          <h2 className="text-lg font-bold mb-1">
            {room?.quizzes?.title || 'Blind Top 5'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Spieler ordnen Items den Plätzen 1–5 zu
          </p>

          {/* Player progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                Spieler-Fortschritt
              </span>
            </div>

            {players.map((player) => {
              const count = playerProgress[player.id] || 0;
              const done = count >= 5;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    done
                      ? 'border-green-700/50 bg-green-950/20'
                      : 'border-gray-700/50 bg-gray-900/50'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {player.nickname}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={done ? 'default' : 'secondary'}>
                      {count} / 5
                    </Badge>
                    {done && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {!done && (
                      <Clock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              );
            })}

            {players.length === 0 && (
              <p className="text-sm text-gray-500">Keine Spieler.</p>
            )}
          </div>

          {/* Show results button */}
          {!showResults && (
            <Button
              onClick={() => setShowResults(true)}
              disabled={!allFinished && players.length > 0}
              className="w-full"
              variant={allFinished ? 'success' : 'outline'}
            >
              <Trophy className="h-4 w-4 mr-2" />
              {allFinished
                ? 'Ergebnisse anzeigen'
                : 'Warte auf alle Spieler…'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && (
        <FadeIn>
          {/* Correct ranking */}
          <Card className="mb-4">
            <CardContent className="pt-5 pb-4">
              <h3 className="text-base font-semibold mb-3">
                Richtige Reihenfolge
              </h3>
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 border border-green-700/30 bg-green-950/10"
                  >
                    <Badge className="shrink-0 w-8 justify-center">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm">{item.question}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player scores */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                Ergebnis
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                2 Punkte = exakter Treffer, 1 Punkt = um eins daneben
              </p>
              <div className="space-y-2">
                {players
                  .map((p) => ({ ...p, score: scores[p.id] || 0 }))
                  .sort((a, b) => b.score - a.score)
                  .map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 border border-gray-700/50 bg-gray-900/50"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        {idx === 0 && players.length > 1 && (
                          <Award className="h-4 w-4 text-yellow-400" />
                        )}
                        {player.nickname}
                      </span>
                      <Badge>{player.score} / 10 Pkt.</Badge>
                    </div>
                  ))}
              </div>

              {/* Detailed breakdown */}
              <div className="mt-4 space-y-3">
                {players.map((player) => {
                  const pl = playerPlacements[player.id] || {};
                  return (
                    <details key={player.id} className="group">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200 transition-colors">
                        {player.nickname} – Details
                      </summary>
                      <div className="mt-2 space-y-1 pl-2">
                        {items.map((item, idx) => {
                          const chosen = pl[item.id];
                          const correct = idx + 1;
                          const isExact = chosen === correct;
                          const isClose =
                            chosen && Math.abs(chosen - correct) === 1;
                          return (
                            <div
                              key={item.id}
                              className={`text-xs rounded px-2 py-1 ${
                                isExact
                                  ? 'text-green-400 bg-green-950/30'
                                  : isClose
                                    ? 'text-yellow-400 bg-yellow-950/20'
                                    : 'text-red-400 bg-red-950/20'
                              }`}
                            >
                              {item.question}: Platz {chosen ?? '?'} (richtig:{' '}
                              {correct})
                              {isExact && ' ✓'}
                              {isClose && ' ~'}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </FadeIn>
  );
}
