import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialize, initialized]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Layout>
  );
}
