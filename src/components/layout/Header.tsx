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
    <header className={`${isGame ? 'hidden' : 'bg-white/20 backdrop-blur-md border-b border-white/30'} px-8 py-5`}>
      <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
        <Link to="/" className="flex items-center gap-3 justify-self-start">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7] flex items-center justify-center text-white text-lg font-bold">G</span>
          <span className="font-semibold text-xl text-[#2d2d4a]/70 tracking-tight">gomoku</span>
        </Link>

        <nav className="flex items-center gap-3 justify-self-center">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-6 py-3 rounded-xl text-lg font-medium transition-all ${
                location.pathname === to
                  ? 'bg-white/50 text-[#2d2d4a]'
                  : 'text-[#6b6b8d] hover:text-[#2d2d4a] hover:bg-white/20'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7]/60 flex items-center justify-center text-white/90 font-semibold text-sm">
                {(username ?? 'U')[0].toUpperCase()}
              </div>
              <button onClick={logout} className="text-sm text-[#6b6b8d] hover:text-[#2d2d4a] transition-colors">exit</button>
            </div>
          ) : (
            <Link to="/auth" className="px-6 py-3 rounded-xl text-lg font-medium bg-white/30 text-[#2d2d4a]/70 hover:bg-white/50 transition-all">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
