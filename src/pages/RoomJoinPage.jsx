import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { savePlayerData } from '../lib/supabase/storage';
import { joinRoom } from '../lib/supabase/api';

export default function RoomJoinPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) {
      setError('Raumcode und Nickname sind erforderlich.');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const { player, room } = await joinRoom(roomCode.trim(), nickname.trim());
      savePlayerData(room.room_code, {
        playerId: player.id,
        playerToken: player.player_token,
        nickname: player.nickname,
      });
      navigate(`/room/${room.room_code}/play`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raum beitreten</h1>
        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Zurück
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Raumcode
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="z. B. ABC123"
            maxLength={6}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-2xl text-center font-mono tracking-widest text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Dein Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="z. B. MaxPower"
            maxLength={20}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={joining}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {joining ? 'Beitritt läuft…' : 'Beitreten'}
        </button>

        <Link
          to="/"
          className="block w-full text-center rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-300 hover:border-gray-500 transition-colors"
        >
          Abbrechen
        </Link>
      </form>
    </div>
  );
}
