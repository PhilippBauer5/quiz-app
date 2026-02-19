import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Trophy } from 'lucide-react';

/**
 * Animated score bar chart – shows player scores as rising bars.
 * Used after each question (Host & Player) in QA / non-blind_top5 modes.
 *
 * Props:
 *  - scores: [{ player_id, score, room_players: { nickname } }]
 *  - highlightPlayerId: optional – highlights a specific player (for PlayerScreen)
 *  - compact: optional – smaller version for inline use
 */
export default function ScoreBoard({
  scores = [],
  highlightPlayerId,
  compact = false,
}) {
  if (scores.length === 0) return null;

  const maxScore = Math.max(...scores.map((s) => s.score), 1);

  // Sort descending by score
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  // Fixed color per player – based on stable alphabetical order of player_id
  // so colors never change when rankings shift
  const playerColors = [
    'from-rose-500 to-rose-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-violet-500 to-violet-600',
    'from-cyan-500 to-cyan-600',
    'from-pink-500 to-pink-600',
    'from-lime-500 to-lime-600',
  ];

  const stableIds = [...scores].map((s) => s.player_id).sort();
  const colorByPlayerId = {};
  stableIds.forEach((id, i) => {
    colorByPlayerId[id] = playerColors[i % playerColors.length];
  });

  return (
    <Card className={compact ? '' : 'mt-4'}>
      <CardContent className={compact ? 'py-3' : 'py-5'}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy
            className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-yellow-400`}
          />
          <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
            Punktestand
          </h3>
        </div>

        <div className="space-y-2">
          {sorted.map((s, idx) => {
            const nickname = s.room_players?.nickname || 'Spieler';
            const pct = maxScore > 0 ? (s.score / maxScore) * 100 : 0;
            const isHighlighted = highlightPlayerId === s.player_id;
            const colorClass = colorByPlayerId[s.player_id];

            return (
              <div key={s.player_id} className="flex items-center gap-3">
                {/* Rank */}
                <span
                  className={`w-5 text-center text-sm font-bold shrink-0 ${
                    idx === 0
                      ? 'text-yellow-400'
                      : idx === 1
                        ? 'text-gray-400'
                        : idx === 2
                          ? 'text-amber-600'
                          : 'text-gray-500'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Name */}
                <span
                  className={`w-20 truncate text-sm ${
                    isHighlighted ? 'text-white font-bold' : 'text-gray-300'
                  }`}
                >
                  {nickname}
                </span>

                {/* Bar */}
                <div className="flex-1 h-7 bg-gray-800 rounded-lg overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-lg bg-gradient-to-r ${colorClass} ${
                      isHighlighted ? 'ring-2 ring-white/30' : ''
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 8)}%` }}
                    transition={{
                      duration: 0.8,
                      delay: idx * 0.1,
                      ease: 'easeOut',
                    }}
                  />
                  {/* Score label inside bar */}
                  <motion.span
                    className="absolute inset-y-0 flex items-center text-xs font-bold text-white px-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    style={{ left: 0 }}
                  >
                    {s.score} Pkt.
                  </motion.span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
