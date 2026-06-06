import { create } from 'zustand';
import type { GameState, Move, Position } from '../types';
import { createEmptyBoard, checkWin, isBoardFull, makeMove } from '../lib/gameLogic';
import { getAIMove, type AIDifficulty } from '../lib/ai';

interface GameStore {
  game: GameState;
  difficulty: AIDifficulty;
  mode: 'local' | 'ai' | 'online' | 'matchmaking' | null;
  isLoading: boolean;
  error: string | null;

  initGame: (mode: GameStore['mode'], difficulty?: AIDifficulty) => void;
  placePiece: (position: Position) => void;
  setGameState: (state: Partial<GameState>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setDifficulty: (difficulty: AIDifficulty) => void;
  setMode: (mode: GameStore['mode']) => void;
  resetGame: () => void;
}

function createInitialGameState(): GameState {
  return {
    id: crypto.randomUUID(),
    board: createEmptyBoard(),
    currentTurn: 'X',
    moves: [],
    status: 'playing',
    winner: null,
    playerX: null,
    playerO: null,
    isAI: false,
    roomCode: null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createInitialGameState(),
  difficulty: 'medium',
  mode: null,
  isLoading: false,
  error: null,

  initGame: (mode, difficulty = 'medium') => {
    set({
      game: {
        ...createInitialGameState(),
        isAI: mode === 'ai',
      },
      mode,
      difficulty,
      error: null,
    });
  },

  placePiece: (position: Position) => {
    const { game } = get();
    if (game.status !== 'playing') return;

    const player = game.currentTurn;

    if (game.board[position.row][position.col] !== null) return;

    const newBoard = makeMove(game.board, position, player);

    const won = checkWin(newBoard, position.row, position.col, player);
    const full = isBoardFull(newBoard);

    const move: Move = {
      player,
      position,
      moveNumber: game.moves.length + 1,
      timestamp: Date.now(),
    };

    const newGame: GameState = {
      ...game,
      board: newBoard,
      currentTurn: player === 'X' ? 'O' : 'X',
      moves: [...game.moves, move],
      status: won ? 'finished' : full ? 'finished' : 'playing',
      winner: won ? player : full ? 'draw' : null,
    };

    set({ game: newGame });

    if (game.isAI && newGame.status === 'playing' && newGame.currentTurn === 'O') {
      setTimeout(() => {
        const { game: g } = get();
        if (g.status !== 'playing') return;

        const aiMove = getAIMove(g.board, 'O', get().difficulty);

        get().placePiece(aiMove);
      }, 300);
    }
  },

  setGameState: (state) => set((s) => ({ game: { ...s.game, ...state } })),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setMode: (mode) => set({ mode }),
  resetGame: () => {
    const { mode } = get();
    set({
      game: {
        ...createInitialGameState(),
        isAI: mode === 'ai',
      },
      error: null,
    });
  },
}));
