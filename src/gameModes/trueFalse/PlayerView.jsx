import { useState, useEffect, useCallback } from 'react';
import { submitAnswer } from '../../lib/supabase/api';
import { supabase } from '../../lib/supabaseClient';
import { Check, X, CheckCircle, XCircle, Send } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FadeIn } from '../../components/ui/Animations';

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
      <FadeIn>
        <Card className="text-center">
          <CardContent className="py-10">
            <p className="text-gray-500">Warte auf die erste Frage…</p>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  // Show result
  if (submitted && result !== null) {
    return (
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
    );
  }

  // Show waiting after submit
  if (submitted) {
    return (
      <FadeIn>
        <Card className="text-center">
          <CardContent className="py-10">
            <Send className="h-10 w-10 text-blue-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Antwort gesendet!</h2>
            <p className="text-gray-500">Warte auf Bewertung…</p>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  // Show question with Wahr/Falsch buttons
  return (
    <FadeIn>
      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 mb-1">Frage</p>
          <h2 className="text-xl font-semibold">{question.question}</h2>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleAnswer('Wahr')}
          className="h-auto rounded-xl border-2 border-green-700 bg-green-950/30 px-6 py-6 text-xl font-bold text-green-400 hover:bg-green-900/50"
        >
          <Check className="h-6 w-6 mr-2" /> Wahr
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAnswer('Falsch')}
          className="h-auto rounded-xl border-2 border-red-700 bg-red-950/30 px-6 py-6 text-xl font-bold text-red-400 hover:bg-red-900/50"
        >
          <X className="h-6 w-6 mr-2" /> Falsch
        </Button>
      </div>
    </FadeIn>
  );
}
