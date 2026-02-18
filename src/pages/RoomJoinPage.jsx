import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { savePlayerData } from '../lib/supabase/storage';
import { joinRoom } from '../lib/supabase/api';
import { ArrowLeft, LogIn } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { ErrorState } from '../components/ui/States';
import { PageTransition } from '../components/ui/Animations';
import { toast } from 'sonner';

export default function RoomJoinPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) {
      toast.error('Raumcode und Nickname sind erforderlich.');
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
      toast.error('Beitritt fehlgeschlagen.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Raum beitreten</h1>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Spiel beitreten</CardTitle>
          <CardDescription>
            Gib den Raumcode und deinen Namen ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4">
              <ErrorState message={error} />
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Raumcode</Label>
              <Input
                id="code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="z. B. ABC123"
                maxLength={6}
                className="h-14 text-2xl text-center font-mono tracking-widest uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nick">Dein Nickname</Label>
              <Input
                id="nick"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="z. B. MaxPower"
                maxLength={20}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                loading={joining}
                size="lg"
                className="w-full"
              >
                <LogIn className="h-4 w-4" />
                {joining ? 'Beitritt läuft…' : 'Beitreten'}
              </Button>
              <Link to="/">
                <Button variant="outline" size="lg" className="w-full">
                  Abbrechen
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
