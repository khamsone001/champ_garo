import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';

type Tab = 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = tab === 'login'
      ? await login(email, password)
      : await register(email, password, username);
    setBusy(false);
    if (err) setError(err);
    else if (tab === 'login') navigate('/lobby');
    else { setTab('login'); setError('Check your email to confirm'); }
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass rounded-2xl p-8 shadow-sm animate-scale-in">
        <h1 className="text-2xl font-light text-[#2d2d4a]/80 text-center mb-6">
          {tab === 'login' ? 'Welcome back' : 'Create account'}
        </h1>

        <div className="flex mb-5 bg-white/20 rounded-lg p-0.5">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                tab === t ? 'bg-white/50 text-[#2d2d4a]' : 'text-[#6b6b8d]/70'
              }`}
              onClick={() => { setTab(t); setError(null); }}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <input
              type="text" placeholder="Username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/30 border border-white/30 rounded-lg text-[#2d2d4a]/80 text-sm placeholder-[#6b6b8d]/40 outline-none focus:border-white/50 transition-colors"
              required minLength={2}
            />
          )}
          <input
            type="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/30 border border-white/30 rounded-lg text-[#2d2d4a]/80 text-sm placeholder-[#6b6b8d]/40 outline-none focus:border-white/50 transition-colors"
            required
          />
          <input
            type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/30 border border-white/30 rounded-lg text-[#2d2d4a]/80 text-sm placeholder-[#6b6b8d]/40 outline-none focus:border-white/50 transition-colors"
            required minLength={6}
          />
          {error && (
            <p className={`text-xs text-center ${error.includes('check your email') ? 'text-[#6b6b8d]/70' : 'text-red-400/80'}`}>
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? '...' : tab === 'login' ? 'Sign In' : 'Create'}
          </Button>
        </form>

        <button onClick={() => navigate('/')} className="block mx-auto mt-5 text-xs text-[#6b6b8d]/60 hover:text-[#2d2d4a]/60 transition-colors">
          Back
        </button>
      </div>
    </div>
  );
}
