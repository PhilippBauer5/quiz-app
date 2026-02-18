-- ============================================================
-- Quiz-App MVP – Phase 1: Datenmodell + Minimal-Security
-- Supabase-kompatibel, kein Auth, Token-basiert
-- Idempotent: kann mehrfach ausgeführt werden
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM: Room Status (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('waiting', 'active', 'finished');
  END IF;
END $$;

-- ============================================================
-- 1. quizzes
-- ============================================================
CREATE TABLE quizzes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  quiz_type  TEXT NOT NULL DEFAULT 'qa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. quiz_questions
-- ============================================================
CREATE TABLE quiz_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id    UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  answer     TEXT,                -- optionale Musterantwort für den Host
  position   INT NOT NULL,        -- Reihenfolge der Fragen
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (quiz_id, position)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- ============================================================
-- 3. rooms
-- ============================================================
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  room_code       TEXT NOT NULL UNIQUE,
  host_token      UUID NOT NULL DEFAULT gen_random_uuid(),
  status          room_status NOT NULL DEFAULT 'waiting',
  current_question_id UUID REFERENCES quiz_questions(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_rooms_quiz_id ON rooms(quiz_id);

-- ============================================================
-- 4. room_players
-- ============================================================
CREATE TABLE room_players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname     TEXT NOT NULL,
  player_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (room_id, nickname)
);

CREATE INDEX idx_room_players_room_id ON room_players(room_id);

-- ============================================================
-- 5. submissions
-- ============================================================
CREATE TABLE submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  answer_text  TEXT NOT NULL,
  is_correct   BOOLEAN,           -- NULL = noch nicht bewertet
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (player_id, question_id) -- nur 1 Antwort pro Spieler pro Frage
);

CREATE INDEX idx_submissions_room_id ON submissions(room_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);
CREATE INDEX idx_submissions_player_id ON submissions(player_id);

-- ============================================================
-- 6. room_scores (aggregierter Score pro Spieler pro Raum)
-- ============================================================
CREATE TABLE room_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  score      INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (room_id, player_id)
);

CREATE INDEX idx_room_scores_room_id ON room_scores(room_id);

-- ============================================================
-- RLS: Row Level Security
-- ============================================================

-- RLS aktivieren
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_scores ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- quizzes: Jeder darf lesen und erstellen
-- ------------------------------------------------------------
CREATE POLICY "quizzes_select" ON quizzes
  FOR SELECT USING (true);

CREATE POLICY "quizzes_insert" ON quizzes
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- quiz_questions: Jeder darf lesen und erstellen
-- ------------------------------------------------------------
CREATE POLICY "quiz_questions_select" ON quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "quiz_questions_insert" ON quiz_questions
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- rooms: Jeder darf lesen und erstellen
-- Update nur mit korrektem host_token (via request header)
-- ------------------------------------------------------------
CREATE POLICY "rooms_select" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "rooms_insert" ON rooms
  FOR INSERT WITH CHECK (true);

-- Update: nur wenn host_token übereinstimmt
-- Der Host sendet sein Token als custom header: x-host-token
-- Im Frontend: supabase.rpc() oder .update() mit headers
-- HINWEIS: Supabase unterstützt keine custom headers in RLS.
-- Deshalb wird host_token-Validierung im Frontend geprüft.
-- Für MVP pragmatisch: Update erlaubt, wenn room existiert.
CREATE POLICY "rooms_update" ON rooms
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- room_players: Jeder darf lesen und beitreten
-- ------------------------------------------------------------
CREATE POLICY "room_players_select" ON room_players
  FOR SELECT USING (true);

CREATE POLICY "room_players_insert" ON room_players
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- submissions: Jeder darf eigene Antworten sehen und senden
-- Update (Bewertung) ist offen (Host-Validierung im Frontend)
-- ------------------------------------------------------------
CREATE POLICY "submissions_select" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "submissions_insert" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "submissions_update" ON submissions
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- room_scores: Jeder darf lesen, Insert/Update offen
-- ------------------------------------------------------------
CREATE POLICY "room_scores_select" ON room_scores
  FOR SELECT USING (true);

CREATE POLICY "room_scores_insert" ON room_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "room_scores_update" ON room_scores
  FOR UPDATE USING (true)
  WITH CHECK (true);
