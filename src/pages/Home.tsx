import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-10 animate-slide-in">

        {/* Icon */}
        <div className="w-24 h-24 rounded-[24px] bg-white/40 backdrop-blur-xl shadow-sm flex items-center justify-center">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c8cfa] to-[#9b7cf7] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              X
            </span>
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9b7cf7] to-[#7c8cfa] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              O
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-6xl md:text-7xl font-light tracking-tight text-[#2d2d4a]/85">
            Gomoku
          </h1>
          <p className="text-base text-[#6b6b8d]/60">
            19×19 · five in a row
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/20 rounded-2xl p-2 shadow-sm w-80">
          <button
            onClick={() => navigate('/lobby')}
            className="flex-1 py-6 rounded-xl text-base font-medium bg-white/85 text-[#2d2d4a] shadow-sm transition-all"
          >
            Play
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 py-6 rounded-xl text-base font-medium text-[#6b6b8d]/70 hover:bg-white/30 hover:text-[#2d2d4a] transition-all"
          >
            Rankings
          </button>
        </div>

        {/* Game modes */}
        <div className="flex items-center gap-3">
          {[
            { label: 'vs AI', to: '/lobby' },
            { label: 'Local 2P', to: '/game?mode=local' },
            { label: 'Online', to: '/lobby' },
          ].map(({ label, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="px-5 py-2.5 rounded-xl bg-white/30 text-[#6b6b8d]/70 text-sm font-medium hover:bg-white/50 hover:text-[#2d2d4a]/80 transition-all"
            >
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
