import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function DevTestPanel() {
  const [log, setLog] = useState([]);

  function addLog(label, data, error) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      label,
      data,
      error: error?.message || error || null,
    };
    console.log(`[DevTest] ${label}`, { data, error });
    setLog((prev) => [entry, ...prev]);
  }

  // ── 1. Quiz erstellen ──
  async function createQuiz() {
    const title = prompt('Quiz-Titel:', 'Mein Test-Quiz');
    if (!title) return;
    const { data, error } = await supabase
      .from('quizzes')
      .insert({ title })
      .select()
      .single();
    addLog('createQuiz', data, error);
  }

  // ── 2. Quizzes laden ──
  async function loadQuizzes() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    addLog('loadQuizzes', data, error);
  }

  // ── 3. Frage erstellen ──
  async function createQuestion() {
    const quizId = prompt('Quiz-ID (UUID):');
    if (!quizId) return;
    const question = prompt('Frage:', 'Was ist 2+2?');
    if (!question) return;
    const answer = prompt('Musterantwort (optional):', '4');
    const position = parseInt(prompt('Position:', '1'), 10) || 1;
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({ quiz_id: quizId, question, answer, position })
      .select()
      .single();
    addLog('createQuestion', data, error);
  }

  // ── 4. Raum erstellen ──
  async function createRoom() {
    const quizId = prompt('Quiz-ID (UUID):');
    if (!quizId) return;
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from('rooms')
      .insert({ quiz_id: quizId, room_code: roomCode })
      .select()
      .single();
    addLog('createRoom', data, error);
    if (data) {
      addLog('HOST-TOKEN (speichern!)', { host_token: data.host_token, room_code: data.room_code }, null);
    }
  }

  // ── 5. Räume laden ──
  async function loadRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, quizzes(title)')
      .order('created_at', { ascending: false });
    addLog('loadRooms', data, error);
  }

  // ── 6. Raum beitreten ──
  async function joinRoom() {
    const roomCode = prompt('Room-Code:');
    if (!roomCode) return;
    const nickname = prompt('Nickname:', 'Spieler1');
    if (!nickname) return;

    // Raum per room_code finden
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (roomError || !room) {
      addLog('joinRoom – Raum nicht gefunden', null, roomError || 'Kein Raum mit diesem Code');
      return;
    }

    const { data, error } = await supabase
      .from('room_players')
      .insert({ room_id: room.id, nickname })
      .select()
      .single();
    addLog('joinRoom', data, error);
    if (data) {
      addLog('PLAYER-TOKEN (speichern!)', { player_token: data.player_token, nickname: data.nickname }, null);
    }
  }

  // ── 7. Antwort senden ──
  async function submitAnswer() {
    const roomId = prompt('Room-ID (UUID):');
    const questionId = prompt('Question-ID (UUID):');
    const playerId = prompt('Player-ID (UUID):');
    const answerText = prompt('Deine Antwort:', '42');
    if (!roomId || !questionId || !playerId || !answerText) return;

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
    addLog('submitAnswer', data, error);
  }

  const btnStyle = {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #374151', paddingTop: 24 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 16 }}>
        🛠 Dev Test Panel
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <button style={btnStyle} onClick={createQuiz}>Create Quiz</button>
        <button style={btnStyle} onClick={loadQuizzes}>Load Quizzes</button>
        <button style={btnStyle} onClick={createQuestion}>Create Question</button>
        <button style={btnStyle} onClick={createRoom}>Create Room</button>
        <button style={btnStyle} onClick={loadRooms}>Load Rooms</button>
        <button style={btnStyle} onClick={joinRoom}>Join Room</button>
        <button style={btnStyle} onClick={submitAnswer}>Submit Answer</button>
      </div>

      <div
        style={{
          background: '#111827',
          borderRadius: 8,
          padding: 16,
          maxHeight: 400,
          overflowY: 'auto',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#9ca3af',
        }}
      >
        {log.length === 0 && <p style={{ color: '#6b7280' }}>Noch keine Aktionen…</p>}
        {log.map((entry, i) => (
          <div key={i} style={{ marginBottom: 8, borderBottom: '1px solid #1f2937', paddingBottom: 8 }}>
            <div style={{ color: entry.error ? '#ef4444' : '#10b981', fontWeight: 600 }}>
              [{entry.time}] {entry.label}
            </div>
            {entry.error && <div style={{ color: '#f87171' }}>ERROR: {entry.error}</div>}
            {entry.data && (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#d1d5db' }}>
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
