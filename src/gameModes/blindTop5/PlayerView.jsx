import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FadeIn } from '../../components/ui/Animations';
import { Send, Lock, CheckCircle, ChevronDown } from 'lucide-react';

/**
 * Blind Top 5 – PlayerView
 *
 * Game flow:
 * - Items are revealed one by one (rounds 1–3), then items 4+5 together (round 4).
 * - Player assigns each item to a free slot (position 1–5).
 * - Once assigned, the slot is locked.
 * - Refresh-safe: loads existing submissions from DB on mount.
 *
 * Data model:
 * - quiz_questions: 5 rows with position 0..4 (the correct ranking)
 * - submissions: one per player per item, answer_text = JSON string
 *   { "chosen_position": N } where N is 1..5
 */
export default function BlindTop5PlayerView({ room, question, playerData }) {
  const [items, setItems] = useState([]);
  const [placements, setPlacements] = useState({}); // { itemId: chosenPosition }
  const [currentRound, setCurrentRound] = useState(1);
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [round4Choices, setRound4Choices] = useState({ item4: '', item5: '' });
  const [singleChoice, setSingleChoice] = useState('');
  const [loading, setLoading] = useState(true);

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
  const loadExistingSubmissions = useCallback(async () => {
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

        // Determine current round
        const submittedCount = Object.keys(existing).length;
        if (submittedCount >= 5) {
          setFinished(true);
        } else if (submittedCount >= 3) {
          setCurrentRound(4);
        } else {
          setCurrentRound(submittedCount + 1);
        }
      }
    } catch (err) {
      console.error('loadExistingSubmissions error:', err);
    } finally {
      setLoading(false);
    }
  }, [room?.id, playerData?.playerId, items]);

  useEffect(() => {
    if (items.length > 0) loadExistingSubmissions();
  }, [items, loadExistingSubmissions]);

  // Derived state
  const usedPositions = Object.values(placements);
  const freePositions = [1, 2, 3, 4, 5].filter(
    (p) => !usedPositions.includes(p)
  );

  // Current item(s) for this round
  const currentItem = items[currentRound - 1] || null; // rounds 1-3
  const item4 = items[3] || null;
  const item5 = items[4] || null;

  async function submitSingle() {
    if (!currentItem || !singleChoice || isSubmitting) return;
    const pos = parseInt(singleChoice);
    if (!freePositions.includes(pos)) return;

    setIsSubmitting(true);
    try {
      await supabase.from('submissions').insert({
        room_id: room.id,
        question_id: currentItem.id,
        player_id: playerData.playerId,
        answer_text: JSON.stringify({ chosen_position: pos }),
      });

      setPlacements((prev) => ({ ...prev, [currentItem.id]: pos }));
      setSingleChoice('');

      if (currentRound < 3) {
        setCurrentRound((r) => r + 1);
      } else {
        setCurrentRound(4);
      }
    } catch (err) {
      if (err.code === '23505') {
        // Already submitted — reload
        await loadExistingSubmissions();
      } else {
        console.error('submitSingle error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitRound4() {
    if (!item4 || !item5 || isSubmitting) return;
    const pos4 = parseInt(round4Choices.item4);
    const pos5 = parseInt(round4Choices.item5);
    if (
      !pos4 ||
      !pos5 ||
      pos4 === pos5 ||
      !freePositions.includes(pos4) ||
      !freePositions.includes(pos5)
    )
      return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('submissions').insert([
        {
          room_id: room.id,
          question_id: item4.id,
          player_id: playerData.playerId,
          answer_text: JSON.stringify({ chosen_position: pos4 }),
        },
        {
          room_id: room.id,
          question_id: item5.id,
          player_id: playerData.playerId,
          answer_text: JSON.stringify({ chosen_position: pos5 }),
        },
      ]);
      if (error) throw error;

      setPlacements((prev) => ({
        ...prev,
        [item4.id]: pos4,
        [item5.id]: pos5,
      }));
      setFinished(true);
    } catch (err) {
      if (err.code === '23505') {
        await loadExistingSubmissions();
      } else {
        console.error('submitRound4 error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Round 4 validation
  const round4Valid =
    round4Choices.item4 &&
    round4Choices.item5 &&
    round4Choices.item4 !== round4Choices.item5 &&
    freePositions.includes(parseInt(round4Choices.item4)) &&
    freePositions.includes(parseInt(round4Choices.item5));

  if (loading) {
    return (
      <Card className="text-center">
        <CardContent className="py-10">
          <p className="text-gray-400">Lade Spielstand…</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length !== 5) {
    return (
      <Card className="text-center">
        <CardContent className="py-10">
          <p className="text-red-400">Dieses Quiz hat nicht genau 5 Items.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <FadeIn>
      <Card className="mb-4">
        <CardContent className="pt-5 pb-4">
          <h2 className="text-lg font-bold mb-3">
            {room?.quizzes?.title || 'Blind Top 5'}
          </h2>

          {/* Slot overview */}
          <div className="space-y-2 mb-4">
            {[1, 2, 3, 4, 5].map((pos) => {
              const itemId = Object.keys(placements).find(
                (id) => placements[id] === pos
              );
              const item = items.find((i) => i.id === itemId);
              return (
                <div
                  key={pos}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                    item
                      ? 'border-blue-700/50 bg-blue-950/30'
                      : 'border-gray-700/50 bg-gray-900/50'
                  }`}
                >
                  <Badge
                    variant={item ? 'default' : 'secondary'}
                    className="shrink-0 w-8 justify-center"
                  >
                    {pos}
                  </Badge>
                  {item ? (
                    <span className="flex items-center gap-2 text-sm">
                      <Lock className="h-3.5 w-3.5 text-blue-400" />
                      {item.question}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">— frei —</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Finished state */}
      {finished && (
        <FadeIn>
          <Card className="text-center border-green-700/50 bg-green-950/20">
            <CardContent className="py-8">
              <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-1">Fertig!</h3>
              <p className="text-gray-400 text-sm">
                Deine Platzierungen wurden abgegeben. Warte auf die Auswertung.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Rounds 1–3: single item */}
      {!finished && currentRound <= 3 && currentItem && (
        <FadeIn>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary">Runde {currentRound} / 4</Badge>
                <span className="text-xs text-gray-500">
                  Item {currentRound} von 5
                </span>
              </div>

              <p className="text-lg font-semibold mb-4">
                {currentItem.question}
              </p>

              <label className="block text-sm text-gray-400 mb-1.5">
                Auf welchen Platz?
              </label>
              <div className="relative mb-4">
                <select
                  value={singleChoice}
                  onChange={(e) => setSingleChoice(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Platz wählen…</option>
                  {freePositions.map((p) => (
                    <option key={p} value={p}>
                      Platz {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <Button
                onClick={submitSingle}
                disabled={!singleChoice || isSubmitting}
                loading={isSubmitting}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Platzierung bestätigen
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Round 4: two items at once */}
      {!finished && currentRound === 4 && item4 && item5 && (
        <FadeIn>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary">Runde 4 / 4 – Finale</Badge>
                <span className="text-xs text-gray-500">
                  2 Items gleichzeitig
                </span>
              </div>

              {/* Item 4 */}
              <div className="mb-4 rounded-lg border border-gray-700 p-3">
                <p className="font-semibold mb-2">{item4.question}</p>
                <div className="relative">
                  <select
                    value={round4Choices.item4}
                    onChange={(e) =>
                      setRound4Choices((c) => ({
                        ...c,
                        item4: e.target.value,
                      }))
                    }
                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">Platz wählen…</option>
                    {freePositions.map((p) => (
                      <option key={p} value={p}>
                        Platz {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Item 5 */}
              <div className="mb-4 rounded-lg border border-gray-700 p-3">
                <p className="font-semibold mb-2">{item5.question}</p>
                <div className="relative">
                  <select
                    value={round4Choices.item5}
                    onChange={(e) =>
                      setRound4Choices((c) => ({
                        ...c,
                        item5: e.target.value,
                      }))
                    }
                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">Platz wählen…</option>
                    {freePositions.map((p) => (
                      <option key={p} value={p}>
                        Platz {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {round4Choices.item4 &&
                round4Choices.item5 &&
                round4Choices.item4 === round4Choices.item5 && (
                  <p className="text-sm text-red-400 mb-3">
                    Beide Items müssen auf unterschiedliche Plätze.
                  </p>
                )}

              <Button
                onClick={submitRound4}
                disabled={!round4Valid || isSubmitting}
                loading={isSubmitting}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Beide Platzierungen bestätigen
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </FadeIn>
  );
}
