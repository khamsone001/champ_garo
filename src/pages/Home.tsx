import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center animate-slide-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-8 shadow-sm">
          <div className="flex gap-2">
            <span className="w-6 h-6 rounded bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7] flex items-center justify-center text-white text-xs font-bold">X</span>
            <span className="w-6 h-6 rounded bg-gradient-to-br from-[#8b7cf7] to-[#6c8cfa] flex items-center justify-center text-white text-xs font-bold">O</span>
          </div>
        </div>

        <h1 className="text-5xl font-light tracking-tight text-[#2d2d4a]/80 mb-3">
          Gomoku
        </h1>

        <p className="text-sm text-[#6b6b8d] mb-10">
          19×19 · five in a row
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button size="lg" onClick={() => navigate('/lobby')}>
            Play
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/leaderboard')}>
            Rankings
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {['vs AI', 'Local 2P', 'Online'].map((f) => (
            <span key={f} className="px-3 py-1.5 text-xs text-[#6b6b8d]/60 bg-white/20 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
