import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center animate-slide-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl glass mb-10 shadow-sm">
          <div className="flex gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-[#6c8cfa] to-[#8b7cf7] flex items-center justify-center text-white text-sm font-bold">X</span>
            <span className="w-8 h-8 rounded bg-gradient-to-br from-[#8b7cf7] to-[#6c8cfa] flex items-center justify-center text-white text-sm font-bold">O</span>
          </div>
        </div>

        <h1 className="text-7xl font-light tracking-tight text-[#2d2d4a]/80 mb-4">
          Gomoku
        </h1>

        <p className="text-base text-[#6b6b8d] mb-12">
          19×19 · five in a row
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="px-10 py-3.5 text-base" onClick={() => navigate('/lobby')}>
            Play
          </Button>
          <Button variant="secondary" size="lg" className="px-10 py-3.5 text-base" onClick={() => navigate('/leaderboard')}>
            Rankings
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {['vs AI', 'Local 2P', 'Online'].map((f) => (
            <span key={f} className="px-4 py-2 text-sm text-[#6b6b8d]/60 bg-white/20 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
