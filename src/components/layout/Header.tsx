import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/lobby', label: 'Play' },
  { to: '/leaderboard', label: 'Rank' },
];

export default function Header() {
  const location = useLocation();
  const { user, username, logout } = useAuthStore();
  const isGame = location.pathname === '/game';

  return (
    <header className={`${isGame ? 'hidden' : 'bg-white/20 backdrop-blur-md border-b border-white/30'} px-5 py-3`}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7] flex items-center justify-center text-white text-[10px] font-bold">G</span>
          <span className="font-semibold text-sm text-[#2d2d4a]/70 tracking-tight">gomoku</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-white/50 text-[#2d2d4a]'
                    : 'text-[#6b6b8d] hover:text-[#2d2d4a] hover:bg-white/20'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/30">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7]/60 flex items-center justify-center text-white/90 font-semibold text-[10px]">
                {(username ?? 'U')[0].toUpperCase()}
              </div>
              <button onClick={logout} className="text-[10px] text-[#6b6b8d] hover:text-[#2d2d4a] transition-colors">exit</button>
            </div>
          ) : (
            <Link to="/auth" className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/30 text-[#2d2d4a]/70 hover:bg-white/50 transition-all">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
