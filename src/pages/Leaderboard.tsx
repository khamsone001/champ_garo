import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'wins'>('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, rating, wins, losses, draws, games_played')
      .order('rating', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setProfiles(data as Profile[]);
        setLoading(false);
      });
  }, []);

  const sorted = [...profiles].sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating : b.wins - a.wins
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6b6b8d]/70 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6c8cfa] animate-pulse" />
          Loading
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center p-8 overflow-auto">
      <div className="max-w-lg w-full animate-slide-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-[#2d2d4a]/80 mb-2">Leaderboard</h1>
          <p className="text-sm text-[#6b6b8d]/70">Top players</p>
        </div>

        <div className="flex gap-2 mb-8 justify-center">
          {(['rating', 'wins'] as const).map((s) => (
            <button
              key={s} onClick={() => setSortBy(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                sortBy === s ? 'glass shadow-sm' : 'text-[#6b6b8d]/60 hover:text-[#2d2d4a]/60'
              }`}
            >
              By {s === 'rating' ? 'Rating' : 'Wins'}
            </button>
          ))}
        </div>

        {profiles.length === 0 ? (
          <p className="text-center text-[#6b6b8d]/60 text-sm">No players yet</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <div key={player.id} className="glass rounded-xl px-6 py-5 flex items-center gap-4 hover:bg-white/50 transition-colors">
                <span className="w-8 text-center text-base text-[#6b6b8d]/50 font-mono">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-base text-[#2d2d4a]/80 truncate mb-1">{player.username}</div>
                  <div className="text-sm text-[#6b6b8d]/60 truncate">
                    {player.wins}W / {player.losses}L · {player.games_played}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#2d2d4a]/70">{player.rating}</div>
                  <div className="text-[10px] text-[#6b6b8d]/40 uppercase tracking-wider">Elo</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
