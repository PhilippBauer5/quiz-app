import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FadeIn } from '../../components/ui/Animations';
import { Send, Lock, GripVertical, CheckCircle } from 'lucide-react';

/**
 * Blind Top 5 – PlayerView (Host-gesteuert)
 *
 * Der Host deckt Items nacheinander auf (via current_question_id).
 * Der Spieler ordnet jedes Item in einen freien Slot (1–5) ein.
 * Einmal platziert = für immer gelockt. Drag & Drop + Tap-to-Place.
 * Refresh-safe: bestehende Placements werden aus submissions geladen.
 */
export default function BlindTop5PlayerView({ room, question, playerData }) {
  const [items, setItems] = useState([]);
  const [placements, setPlacements] = useState({}); // { itemId: chosenPosition }
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(null);
  const [introDismissed, setIntroDismissed] = useState(false);

  // Load all items for this quiz
  useEffect(() => {
    if (!room?.quiz_id) return;
    (async () => {
      const { data } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', room.quiz_id)
        .order('position', { ascending: true });
      if (data) setItems(data);
    })();
  }, [room?.quiz_id]);

  // Load existing submissions (refresh-safe)
  const loadExisting = useCallback(async () => {
    if (!room?.id || !playerData?.playerId || items.length === 0) return;
    try {
      const { data: subs } = await supabase
        .from('submissions')
        .select('question_id, answer_text')
        .eq('room_id', room.id)
        .eq('player_id', playerData.playerId)
        .in(
          'question_id',
          items.map((i) => i.id)
        );

      if (subs && subs.length > 0) {
        const existing = {};
        for (const sub of subs) {
          try {
            const parsed = JSON.parse(sub.answer_text);
            existing[sub.question_id] = parsed.chosen_position;
          } catch {
            // ignore malformed
          }
        }
        setPlacements(existing);

        // Check if current question is already submitted
        if (question?.id && existing[question.id]) {
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error('loadExisting error:', err);
    } finally {
      setLoading(false);
    }
  }, [room?.id, playerData?.playerId, items, question?.id]);

  useEffect(() => {
    if (items.length > 0) loadExisting();
  }, [items, loadExisting]);

  // Reset submitted state when host advances to next item
  useEffect(() => {
    if (!question?.id) return;
    setSubmitted(!!placements[question.id]);
    setSelectedSlot(null);
    setDragOver(null);
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Intro management ──
  // Skip intro instantly on mid-game refresh (existing placements found)
  useEffect(() => {
    if (!loading && Object.keys(placements).length > 0) {
      setIntroDismissed(true);
    }
  }, [loading, placements]);

  // Auto-dismiss intro once the first item arrives and data is ready
  useEffect(() => {
    if (introDismissed) return;
    if (question && !loading) {
      const timer = setTimeout(() => setIntroDismissed(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [question, loading, introDismissed]);

  // Derived state
  const usedPositions = Object.values(placements);
  const freeSlots = [1, 2, 3, 4, 5].filter((p) => !usedPositions.includes(p));

  // Build ranking for display
  const ranking = [1, 2, 3, 4, 5].map((pos) => {
    const itemId = Object.keys(placements).find((id) => placements[id] === pos);
    const item = items.find((i) => i.id === itemId);
    return { position: pos, item, locked: !!item };
  });

  async function handleSubmit() {
    if (!question || !selectedSlot || isSubmitting || submitted) return;

    setIsSubmitting(true);
    try {
      await supabase.from('submissions').insert({
        room_id: room.id,
        question_id: question.id,
        player_id: playerData.playerId,
        answer_text: JSON.stringify({ chosen_position: selectedSlot }),
      });

      setPlacements((prev) => ({ ...prev, [question.id]: selectedSlot }));
      setSubmitted(true);
      setSelectedSlot(null);
    } catch (err) {
      if (err.code === '23505') {
        await loadExisting();
      } else {
        console.error('submit error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Drag & Drop (desktop) ──
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', 'item');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOverSlot(e, pos) {
    if (!freeSlots.includes(pos) || submitted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(pos);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  function handleDrop(e, pos) {
    e.preventDefault();
    setDragOver(null);
    if (!freeSlots.includes(pos) || submitted) return;
    setSelectedSlot(pos);
  }

  // ── Tap to place (mobile) ──
  function handleSlotClick(pos) {
    if (submitted) return;
    if (!freeSlots.includes(pos)) return;
    setSelectedSlot((prev) => (prev === pos ? null : pos));
  }

  // ── States ──
  // Intro splash: covers loading + waiting-for-first-item phases
  // Dismisses automatically once first item arrives (after 1.5s delay)
  // or instantly on mid-game refresh when placements are found
  if (!introDismissed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full"
        >
          <Card className="border-blue-700/50 bg-gradient-to-br from-blue-950/40 to-gray-900/60">
            <CardContent className="py-12 text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-sm uppercase tracking-widest text-blue-400 mb-3"
              >
                Blind Top 5
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-4xl font-extrabold"
              >
                {room?.quizzes?.title || 'Blind Top 5'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="text-gray-400 mt-3"
              >
                Warte auf den Host…
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!question) {
    return (
      <FadeIn>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Warte auf das nächste Item…</p>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      {/* Current item to place */}
      {!submitted && (
        <Card className="mb-4 border-blue-700/50 bg-blue-950/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-blue-400 mb-1.5 uppercase tracking-wide font-medium">
              Neues Item – wo einordnen?
            </p>
            <div
              draggable
              onDragStart={handleDragStart}
              className="flex items-center gap-3 rounded-lg px-4 py-3 bg-blue-900/30 border-2 border-dashed border-blue-500/50 cursor-grab active:cursor-grabbing select-none"
            >
              <GripVertical className="h-5 w-5 text-blue-400 shrink-0" />
              <span className="text-lg font-semibold">{question.question}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Ziehe das Item auf einen Platz oder tippe auf einen freien Slot.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ranking slots */}
      <Card className="mb-4">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            {room?.quizzes?.title || 'Top 5'}
          </h3>
          <div className="space-y-2">
            {ranking.map(({ position, item, locked }) => {
              const isSelected = selectedSlot === position;
              const isDragTarget = dragOver === position;
              const isFree = !locked && !isSelected;
              const canInteract = isFree && !submitted;

              return (
                <div
                  key={position}
                  onClick={() => handleSlotClick(position)}
                  onDragOver={(e) => handleDragOverSlot(e, position)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, position)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border-2 transition-all ${
                    locked
                      ? 'border-gray-700/40 bg-gray-800/40'
                      : isSelected
                        ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10'
                        : isDragTarget
                          ? 'border-blue-400 bg-blue-950/30 scale-[1.01]'
                          : canInteract
                            ? 'border-gray-700/50 bg-gray-900/50 hover:border-blue-500/50 hover:bg-blue-950/10 cursor-pointer'
                            : 'border-gray-700/50 bg-gray-900/50'
                  }`}
                >
                  <Badge
                    variant={locked || isSelected ? 'default' : 'secondary'}
                    className="shrink-0 w-8 justify-center"
                  >
                    {position}
                  </Badge>

                  {/* Locked item */}
                  {locked && item && (
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <Lock className="h-3.5 w-3.5 text-gray-500" />
                      {item.question}
                    </span>
                  )}

                  {/* Selected — shows new item preview */}
                  {isSelected && question && (
                    <span className="text-sm font-medium text-blue-300">
                      {question.question}
                    </span>
                  )}

                  {/* Free slot hint */}
                  {isFree && !submitted && (
                    <span className="text-sm text-gray-600 italic">
                      Tippe zum Einordnen
                    </span>
                  )}

                  {isFree && submitted && (
                    <span className="text-sm text-gray-600">— frei —</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit or waiting */}
      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedSlot || isSubmitting}
          loading={isSubmitting}
          className="w-full"
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Auf Platz {selectedSlot || '?'} einordnen
        </Button>
      ) : (
        <FadeIn>
          <Card className="text-center border-green-700/50 bg-green-950/20">
            <CardContent className="py-6">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="font-medium">Eingeordnet!</p>
              <p className="text-sm text-gray-500">
                Warte auf das nächste Item…
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </FadeIn>
  );
}
