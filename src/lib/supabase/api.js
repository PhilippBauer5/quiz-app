import { supabase } from '../supabaseClient';

// ── Room Code Generator ──
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Quizzes ──
export async function loadQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((q) => ({
    ...q,
    questionCount: q.quiz_questions?.length ?? 0,
  }));
}

export async function loadQuiz(id) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createQuiz(title, quizType = 'qa') {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ title, quiz_type: quizType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuiz(id, updates) {
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Questions ──
export async function loadQuestions(quizId) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function saveQuestions(quizId, questions) {
  // Clear current_question_id in any rooms that reference this quiz's questions
  const { error: clearError } = await supabase
    .from('rooms')
    .update({ current_question_id: null })
    .eq('quiz_id', quizId);
  if (clearError) throw clearError;

  // Delete existing, then insert fresh (simple & robust)
  const { error: delError } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', quizId);
  if (delError) throw delError;

  if (questions.length === 0) return [];

  const rows = questions.map((q, i) => ({
    quiz_id: quizId,
    question: q.question,
    answer: q.answer || null,
    position: i,
  }));

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

// ── Rooms ──
export async function createRoom(quizId) {
  const roomCode = generateRoomCode();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ quiz_id: quizId, room_code: roomCode })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadRoomByCode(code) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, quizzes(title, quiz_type)')
    .eq('room_code', code.toUpperCase())
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoom(roomId, updates) {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Players ──
export async function joinRoom(roomCode, nickname) {
  const room = await loadRoomByCode(roomCode);
  const { data, error } = await supabase
    .from('room_players')
    .insert({ room_id: room.id, nickname })
    .select()
    .single();
  if (error) throw error;
  return { player: data, room };
}

export async function loadPlayers(roomId) {
  const { data, error } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// ── Submissions ──
export async function submitAnswer({
  roomId,
  questionId,
  playerId,
  answerText,
}) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      room_id: roomId,
      question_id: questionId,
      player_id: playerId,
      answer_text: answerText,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadSubmissions(roomId, questionId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, room_players(nickname)')
    .eq('room_id', roomId)
    .eq('question_id', questionId);
  if (error) throw error;
  return data;
}

export async function evaluateSubmission(submissionId, isCorrect) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ is_correct: isCorrect })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Scores ──
export async function upsertScore(roomId, playerId, score) {
  const { data, error } = await supabase
    .from('room_scores')
    .upsert(
      {
        room_id: roomId,
        player_id: playerId,
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,player_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loadScores(roomId) {
  const { data, error } = await supabase
    .from('room_scores')
    .select('*, room_players(nickname)')
    .eq('room_id', roomId)
    .order('score', { ascending: false });
  if (error) throw error;
  return data;
}
