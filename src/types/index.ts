export type Player = 'X' | 'O';
export type CellState = Player | null;
export type BoardState = CellState[][]; // 19x19

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  player: Player;
  position: Position;
  moveNumber: number;
  timestamp: number;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameState {
  id: string;
  board: BoardState;
  currentTurn: Player;
  moves: Move[];
  status: GameStatus;
  winner: Player | 'draw' | null;
  playerX: string | null;
  playerO: string | null;
  isAI: boolean;
  roomCode: string | null;
}

export type GameMode = 'local' | 'ai' | 'online' | 'matchmaking';

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Room {
  id: string;
  code: string;
  playerX: string | null;
  playerO: string | null;
  status: 'waiting' | 'playing' | 'finished';
  gameId: string | null;
}
