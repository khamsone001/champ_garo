import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { createRoom, joinRoom } from '../lib/onlineGame';
import { supabase } from '../lib/supabase';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', desc: 'Random placements' },
  { value: 'medium', label: 'Medium', desc: 'Blocks and builds' },
  { value: 'hard', label: 'Hard', desc: 'Strong heuristic' },
] as const;

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<string>('medium');
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!roomId || !waiting) return;

    const channel = supabase.channel(`room:${roomId}`);
    channel.on('broadcast', { event: 'ping' }, () => {}).subscribe();

    const sub = supabase
      .channel('room-db-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const r = payload.new as any;
          if (r.status === 'playing' && r.player_o_id) {
            setWaiting(false);
            unsubRef.current?.();
            navigate(`/game?mode=online&room=${r.code}&game=${r.game_id}`);
          }
        },
      )
      .subscribe();

    unsubRef.current = () => supabase.removeChannel(sub);
    return () => { supabase.removeChannel(sub); supabase.removeChannel(channel); };
  }, [roomId, waiting, navigate]);

  const handleCreateRoom = async () => {
    if (!user) { navigate('/auth'); return; }
    setError(null);
    const { room, error: err } = await createRoom(user.id);
    if (err || !room) { setError(err); return; }
    setCreatedCode(room.code);
    setRoomId(room.id);
    setWaiting(true);
    setShowCreateModal(true);
  };

  const handleJoinRoom = async () => {
    if (!user) { navigate('/auth'); return; }
    if (roomCode.length < 4) return;
    setError(null);
    const { room, error: err } = await joinRoom(roomCode, user.id);
    if (err || !room) { setError(err); return; }
    setShowJoinModal(false);
    navigate(`/game?mode=online&room=${room.code}&game=${room.game_id}`);
  };

  const handleCancelRoom = () => { setWaiting(false); setShowCreateModal(false); unsubRef.current?.(); };
  const handleStartAI = () => navigate(`/game?mode=ai&diff=${selectedDiff}`);

  const ModeCard = ({ icon, label, desc, onClick }: { icon: string; label: string; desc: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full glass rounded-xl p-5 flex items-center gap-4 hover:bg-white/50 transition-all duration-150 text-left">
      <span className="text-xl w-8 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#2d2d4a]/80 mb-0.5">{label}</div>
        <div className="text-xs text-[#6b6b8d]/70">{desc}</div>
      </div>
      <svg className="w-4 h-4 text-[#6b6b8d]/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full animate-slide-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-[#2d2d4a]/80 mb-1">Lobby</h1>
          <p className="text-xs text-[#6b6b8d]/70">Choose a mode to play</p>
        </div>

        <div className="space-y-3">
          <ModeCard icon="🤖" label="vs Computer" desc="Play against AI" onClick={() => setShowAIModal(true)} />
          <ModeCard icon="👥" label="Local 2 Players" desc="Same device" onClick={() => navigate('/game?mode=local')} />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-[10px] text-[#6b6b8d]/50 tracking-widest uppercase">Online</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          <ModeCard icon="🏠" label="Create Room" desc="Invite a friend" onClick={handleCreateRoom} />
          <ModeCard icon="🔑" label="Join Room" desc="Enter room code" onClick={() => { if (!user) { navigate('/auth'); return; } setShowJoinModal(true); }} />
        </div>

        {!user && (
          <p className="text-center text-xs text-[#6b6b8d]/60 mt-5">
            <button onClick={() => navigate('/auth')} className="text-[#6c8cfa] hover:text-[#5b7bff]">Sign in</button> to play online
          </p>
        )}
      </div>

      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Difficulty">
        <div className="space-y-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDiff(d.value)}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedDiff === d.value
                  ? 'bg-white/50 shadow-sm'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <div className={`text-sm font-medium mb-0.5 ${selectedDiff === d.value ? 'text-[#2d2d4a]' : 'text-[#2d2d4a]/60'}`}>{d.label}</div>
              <div className="text-xs text-[#6b6b8d]/70">{d.desc}</div>
            </button>
          ))}
          <Button className="w-full mt-4" onClick={handleStartAI}>Start</Button>
        </div>
      </Modal>

      <Modal isOpen={showCreateModal} onClose={handleCancelRoom} title="Room Created">
        <div className="text-center">
          <p className="text-[#6b6b8d]/70 text-sm mb-4">Share this code:</p>
          <div className="text-3xl font-mono tracking-[0.25em] text-[#2d2d4a]/80 bg-white/30 rounded-xl py-4 px-4 mb-4">{createdCode}</div>
          {error && <p className="text-xs text-red-400/70 mb-3">{error}</p>}
          {waiting ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#6c8cfa] animate-pulse" />
                <span className="text-xs text-[#6b6b8d]/70">Waiting for opponent...</span>
              </div>
              <Button variant="secondary" className="w-full" onClick={handleCancelRoom}>Cancel</Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => { setShowCreateModal(false); navigate(`/game?mode=online&room=${createdCode}`); }}>Play</Button>
          )}
        </div>
      </Modal>

      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setError(null); }} title="Join Room">
        <div>
          <input
            type="text" placeholder="Enter code"
            value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full bg-white/30 text-[#2d2d4a]/80 text-center text-lg font-mono tracking-[0.25em] rounded-xl px-4 py-3 border border-white/30 outline-none focus:border-white/50 transition-colors mb-4 placeholder:text-[#6b6b8d]/40"
          />
          {error && <p className="text-xs text-red-400/70 mb-3 text-center">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowJoinModal(false); setError(null); }}>Cancel</Button>
            <Button className="flex-1" onClick={handleJoinRoom} disabled={roomCode.length < 4}>Join</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
