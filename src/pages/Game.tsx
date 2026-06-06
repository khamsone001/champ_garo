import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GameBoard from '../components/game/GameBoard';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getValidMoves, checkWin, isBoardFull, makeMove } from '../lib/gameLogic';
import { submitMove, subscribeToGame, fetchGameState } from '../lib/onlineGame';
import type { OnlineMovePayload } from '../lib/onlineGame';
import Button from '../components/ui/Button';
import type { Player, CellState, GameStatus } from '../types';

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { game, difficulty, mode, initGame, placePiece, resetGame, setGameState } = useGameStore();
  const unsubRef = useRef<(() => void) | null>(null);
  const onlinePlayerRef = useRef<Player | null>(null);

  const myPlayer: Player | null = (() => {
    if (mode !== 'online' || !user) return null;
    if (game.playerX === user.id) return 'X';
    if (game.playerO === user.id) return 'O';
    return onlinePlayerRef.current;
  })();

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const diffParam = searchParams.get('diff') as typeof difficulty | null;

    if (modeParam === 'online') {
      const gameId = searchParams.get('game');
      if (!gameId) { navigate('/lobby'); return; }
      initGame('online');
      fetchGameState(gameId).then((data) => {
        if (!data) { navigate('/lobby'); return; }
        const rawBoard = data.game_data?.board ?? Array.from({ length: 19 }, () => Array(19).fill(null));
        const board: CellState[][] = JSON.parse(JSON.stringify(rawBoard));
        setGameState({
          id: gameId, playerX: data.player_x_id, playerO: data.player_o_id,
          currentTurn: data.current_turn as Player, board,
          status: data.status as GameStatus, winner: data.winner as Player | 'draw' | null, moves: [],
        });
        if (user) onlinePlayerRef.current = user.id === data.player_x_id ? 'X' : 'O';
      });
      unsubRef.current = subscribeToGame(gameId, (payload: OnlineMovePayload) => {
        setGameState({
          board: payload.board, currentTurn: payload.currentTurn,
          status: payload.winner ? 'finished' : 'playing', winner: payload.winner, moves: [],
        });
      }, () => {});
      return () => { unsubRef.current?.(); };
    } else if (modeParam === 'ai' || modeParam === 'local') {
      initGame(modeParam, diffParam || 'medium');
    } else if (game.status === 'waiting') {
      initGame('local');
    }
  }, []);

  const validMoves = game.status === 'playing' ? getValidMoves(game.board) : [];

  const handleCellClick = useCallback((position: { row: number; col: number }) => {
    if (game.status !== 'playing') return;
    const isValid = validMoves.some(m => m.row === position.row && m.col === position.col);
    if (!isValid) return;

    if (mode === 'online') {
      if (!myPlayer || game.currentTurn !== myPlayer) return;
      if (!game.id || !user) return;
      const player = game.currentTurn;
      const moveNumber = game.moves.length + 1;
      const newBoard = makeMove(game.board, position, player);
      const won = checkWin(newBoard, position.row, position.col, player);
      const full = isBoardFull(newBoard);
      const winner = won ? player : full ? 'draw' : null;
      setGameState({
        board: newBoard, currentTurn: player === 'X' ? 'O' : 'X',
        moves: [...game.moves, { player, position, moveNumber, timestamp: Date.now() }],
        status: winner ? 'finished' : 'playing', winner,
      });
      submitMove(game.id, user.id, position, player, newBoard, moveNumber, winner);
    } else {
      if (mode === 'ai' && game.currentTurn !== 'X') return;
      placePiece(position);
    }
  }, [game, mode, myPlayer, user, validMoves, placePiece, setGameState]);

  const handlePlayAgain = () => {
    unsubRef.current?.();
    if (mode === 'ai') navigate(`/game?mode=ai&diff=${difficulty}`);
    else resetGame();
  };

  const handleLeave = () => {
    unsubRef.current?.();
    navigate(mode === 'online' ? '/lobby' : '/');
  };

  const isMyTurn = mode !== 'online' || (myPlayer !== null && game.currentTurn === myPlayer);
  const turnText = game.status === 'finished'
    ? game.winner === 'draw' ? 'Draw' : `${game.winner} wins`
    : mode === 'online' ? (isMyTurn ? 'Your turn' : 'Waiting') : `${game.currentTurn}'s turn`;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="glass rounded-none px-4 py-3 flex items-center gap-3 text-xs">
        <button onClick={handleLeave} className="text-[#6b6b8d] hover:text-[#2d2d4a] transition-colors">←</button>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${game.currentTurn === 'X' ? 'bg-[#6c8cfa]' : 'bg-[#6b6b8d]/20'}`} />
          <span className={game.currentTurn === 'X' ? 'text-[#6c8cfa] font-semibold' : 'text-[#6b6b8d]/50'}>X</span>
          <span className="text-[#6b6b8d]/30">·</span>
          <span className={`w-2 h-2 rounded-full ${game.currentTurn === 'O' ? 'bg-[#8b7cf7]' : 'bg-[#6b6b8d]/20'}`} />
          <span className={game.currentTurn === 'O' ? 'text-[#8b7cf7] font-semibold' : 'text-[#6b6b8d]/50'}>O</span>
        </div>
        <span className="text-[#2d2d4a]/60 font-medium">{turnText}</span>
        {mode === 'ai' && <span className="text-[#6b6b8d]/50 ml-auto">{difficulty}</span>}
        <span className="text-[#6b6b8d]/30 text-[10px] font-mono ml-auto">#{game.moves.length}</span>
        {game.status === 'playing' && (
          <button onClick={handlePlayAgain} className="px-3 py-1 rounded-lg bg-white/30 text-[#2d2d4a]/70 text-[10px] hover:bg-white/50 transition-colors">
            Restart
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {mode === 'online' && !myPlayer ? (
          <p className="text-[#6b6b8d]/70 text-xs">Connecting...</p>
        ) : (
          <GameBoard
            board={game.board} currentTurn={game.currentTurn}
            status={game.status} winner={game.winner}
            onCellClick={handleCellClick}
            validMoves={isMyTurn ? validMoves : []}
            lastMove={game.moves.length > 0 ? game.moves[game.moves.length - 1].position : null}
          />
        )}

        {/* Game over overlay buttons */}
        {game.status === 'finished' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 animate-slide-in">
            <Button onClick={handlePlayAgain}>
              Play Again
            </Button>
            <Button variant="secondary" onClick={handleLeave}>
              {mode === 'online' ? 'Leave' : 'Home'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
