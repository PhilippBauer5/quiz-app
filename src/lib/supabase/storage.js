// Persist host/player tokens in localStorage for the session

const STORAGE_KEY_HOST = 'quiz_host_tokens';
const STORAGE_KEY_PLAYER = 'quiz_player_data';

// ── Host Tokens ──
export function saveHostToken(roomCode, hostToken) {
  const tokens = JSON.parse(localStorage.getItem(STORAGE_KEY_HOST) || '{}');
  tokens[roomCode] = hostToken;
  localStorage.setItem(STORAGE_KEY_HOST, JSON.stringify(tokens));
}

export function getHostToken(roomCode) {
  const tokens = JSON.parse(localStorage.getItem(STORAGE_KEY_HOST) || '{}');
  return tokens[roomCode] || null;
}

// ── Player Data ──
export function savePlayerData(roomCode, { playerId, playerToken, nickname }) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYER) || '{}');
  data[roomCode] = { playerId, playerToken, nickname };
  localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(data));
}

export function getPlayerData(roomCode) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYER) || '{}');
  return data[roomCode] || null;
}
