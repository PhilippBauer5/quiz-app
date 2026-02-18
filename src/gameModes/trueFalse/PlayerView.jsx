import { useState, useEffect, useCallback } from 'react';
import { submitAnswer } from '../../lib/supabase/api';
import { supabase } from '../../lib/supabaseClient';

export default function TrueFalsePlayerView({ room, question, playerData }) {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Reset when question changes
  useEffect(() => {
    setSubmitted(false);
    setResult(null);
  }, [question?.id]);

  // Poll for evaluation result
  const checkResult = useCallback(async () => {
    if (!submitted || !playerData || !question) return;
    try {
      const { data } = await supabase
        .from('submissions')
        .select('is_correct')
        .eq('player_id', playerData.playerId)
        .eq('question_id', question.id)
        .single();
      if (data && data.is_correct !== null) {
        setResult(data.is_correct);
      }
    } catch (err) {
      console.error('checkResult error:', err);
    }
  }, [submitted, playerData, question]);

  useEffect(() => {
    if (!submitted) return;
    checkResult();
    const interval = setInterval(checkResult, 2000);
    return () => clearInterval(interval);
  }, [checkResult, submitted]);

  async function handleAnswer(answerText) {
    if (!room || !question || !playerData || submitted) return;
    try {
      await submitAnswer({
        roomId: room.id,
        questionId: question.id,
        playerId: playerData.playerId,
        answerText,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('submitAnswer error:', err);
    }
  }

  if (!question) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-gray-500">Warte auf die erste Frage…</p>
      </div>
    );
  }

  // Show result
  if (submitted && result !== null) {
    return (
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
    );
  }

  // Show waiting after submit
  if (submitted) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-4xl mb-4">📨</p>
        <h2 className="text-xl font-semibold mb-2">Antwort gesendet!</h2>
        <p className="text-gray-500">Warte auf Bewertung…</p>
      </div>
    );
  }

  // Show question with Wahr/Falsch buttons
  return (
    <div>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-4">
        <p className="text-sm text-gray-500 mb-1">Frage</p>
        <h2 className="text-xl font-semibold">{question.question}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer('Wahr')}
          className="rounded-xl border-2 border-green-700 bg-green-950/30 px-6 py-6 text-xl font-bold text-green-400 hover:bg-green-900/50 transition-colors"
        >
          ✓ Wahr
        </button>
        <button
          onClick={() => handleAnswer('Falsch')}
          className="rounded-xl border-2 border-red-700 bg-red-950/30 px-6 py-6 text-xl font-bold text-red-400 hover:bg-red-900/50 transition-colors"
        >
          ✗ Falsch
        </button>
      </div>
    </div>
  );
}
