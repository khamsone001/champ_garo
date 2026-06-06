-- Champgaro - Gomoku 19x19 Database Schema

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished', 'draw')) DEFAULT 'waiting',
  player_x_id UUID REFERENCES auth.users(id),
  player_o_id UUID REFERENCES auth.users(id),
  winner TEXT CHECK (winner IS NULL OR winner IN ('X', 'O', 'draw')),
  current_turn TEXT DEFAULT 'X',
  game_data JSONB NOT NULL DEFAULT '{}',
  move_history JSONB NOT NULL DEFAULT '[]',
  is_ai BOOLEAN DEFAULT FALSE,
  ai_difficulty TEXT CHECK (ai_difficulty IS NULL OR ai_difficulty IN ('easy', 'medium', 'hard'))
);

-- Moves table for replay
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES auth.users(id),
  move_number INT NOT NULL,
  row_pos INT NOT NULL,
  col_pos INT NOT NULL,
  symbol TEXT CHECK (symbol IN ('X', 'O')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms for playing with friends
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  game_id UUID REFERENCES games(id),
  player_x_id UUID REFERENCES auth.users(id),
  player_o_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting'
);

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player_x ON games(player_x_id);
CREATE INDEX idx_games_player_o ON games(player_o_id);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_moves_game ON moves(game_id);
CREATE INDEX idx_profiles_rating ON profiles(rating DESC);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Games: read if participant, insert own, update if participant
CREATE POLICY "games_select" ON games FOR SELECT USING (
  auth.uid() = player_x_id OR auth.uid() = player_o_id
);
CREATE POLICY "games_insert" ON games FOR INSERT WITH CHECK (
  auth.uid() = player_x_id OR auth.uid() = player_o_id
);
CREATE POLICY "games_update" ON games FOR UPDATE USING (
  auth.uid() = player_x_id OR auth.uid() = player_o_id
);

-- Moves: read if game participant
CREATE POLICY "moves_select" ON moves FOR SELECT USING (
  EXISTS (SELECT 1 FROM games WHERE games.id = moves.game_id AND (games.player_x_id = auth.uid() OR games.player_o_id = auth.uid()))
);
CREATE POLICY "moves_insert" ON moves FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM games WHERE games.id = moves.game_id AND (games.player_x_id = auth.uid() OR games.player_o_id = auth.uid()))
);

-- Rooms: read all, insert own, update if participant
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (auth.uid() = player_x_id);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (auth.uid() = player_x_id OR auth.uid() = player_o_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_games_played()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET games_played = games_played + 1 WHERE id = NEW.player_x_id;
  IF NEW.player_o_id IS NOT NULL THEN
    UPDATE profiles SET games_played = games_played + 1 WHERE id = NEW.player_o_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_game_finished
  AFTER UPDATE OF status ON games
  FOR EACH ROW
  WHEN (NEW.status IN ('finished', 'draw'))
  EXECUTE FUNCTION increment_games_played();
