import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GameBoard from '../components/game/GameBoard';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getValidMoves, checkWin, isBoardFull, makeMove } from '../lib/gameLogic';
import {
  submitMove, fetchGameState, subscribeToGameEvents, broadcastGameEvent, createRematchGame,
} from '../lib/onlineGame';
import type { PlayAgainRequestPayload, GameResetPayload } from '../lib/onlineGame';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import type { Player, CellState, GameStatus } from '../types';

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { game, difficulty, mode, initGame, placePiece, resetGame, setGameState } = useGameStore();
  const unsubRef = useRef<(() => void) | null>(null);
  const onlinePlayerRef = useRef<Player | null>(null);
  const roomCodeRef = useRef<string>('');
  const [playAgainOpponent, setPlayAgainOpponent] = useState<PlayAgainRequestPayload | null>(null);
  const [sentPlayAgain, setSentPlayAgain] = useState(false);

  const myPlayer: Player | null = (() => {
    if (mode !== 'online' || !user) return null;
    if (game.playerX === user.id) return 'X';
    if (game.playerO === user.id) return 'O';
    return onlinePlayerRef.current;
  })();

  // Init game from URL params
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const diffParam = searchParams.get('diff') as typeof difficulty | null;

    if (modeParam === 'online') {
      const gameId = searchParams.get('game');
      const room = searchParams.get('room') || '';
      roomCodeRef.current = room;
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
          roomCode: room,
        });
        if (user) onlinePlayerRef.current = user.id === data.player_x_id ? 'X' : 'O';
      });
    } else if (modeParam === 'ai' || modeParam === 'local') {
      initGame(modeParam, diffParam || 'medium');
    } else if (game.status === 'waiting') {
      initGame('local');
    }
  }, []);

  // Subscribe to game events (move, play_again_*)
  useEffect(() => {
    if (mode !== 'online' || !game.id) return;

    setPlayAgainOpponent(null);
    setSentPlayAgain(false);
    if (user) {
      onlinePlayerRef.current = game.playerX === user.id ? 'X' : game.playerO === user.id ? 'O' : onlinePlayerRef.current;
    }

    unsubRef.current = subscribeToGameEvents(game.id, {
      onMove(payload) {
        setGameState({
          board: payload.board, currentTurn: payload.currentTurn,
          status: payload.winner ? 'finished' : 'playing', winner: payload.winner, moves: [],
        });
      },
      onPlayAgainRequest(data) {
        if (data.userId !== user?.id) {
          setPlayAgainOpponent(data);
          setSentPlayAgain(false);
        }
      },
      onPlayAgainAccept(data) {
        const { gameId, board, currentTurn } = data as GameResetPayload;
        setGameState({
          id: gameId, board, currentTurn, status: 'playing', winner: null, moves: [],
        });
        setPlayAgainOpponent(null);
        setSentPlayAgain(false);
      },
      onPlayAgainDecline() {
        setSentPlayAgain(false);
      },
    });

    return () => { unsubRef.current?.(); };
  }, [mode, game.id]);

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
    if (mode === 'online') {
      if (!game.id || !user) return;
      setSentPlayAgain(true);
      broadcastGameEvent(game.id, 'play_again_request', {
        userId: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Player',
      });
    } else if (mode === 'ai') {
      unsubRef.current?.();
      navigate(`/game?mode=ai&diff=${difficulty}`);
    } else {
      unsubRef.current?.();
      resetGame();
    }
  };

  const handleAcceptPlayAgain = async () => {
    if (!playAgainOpponent || !user || !game.playerX || !game.playerO || !roomCodeRef.current) return;

    const rematch = await createRematchGame(roomCodeRef.current, game.playerX, game.playerO);
    if (!rematch) return;

    await broadcastGameEvent(game.id, 'play_again_accept', rematch);

    setGameState({
      id: rematch.id, board: rematch.board, currentTurn: rematch.currentTurn,
      status: 'playing', winner: null, moves: [],
    });
    setPlayAgainOpponent(null);
    setSentPlayAgain(false);
  };

  const handleDeclinePlayAgain = () => {
    if (!playAgainOpponent || !game.id) return;
    broadcastGameEvent(game.id, 'play_again_decline', { userId: user?.id });
    setPlayAgainOpponent(null);
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
      <div className="glass rounded-none px-5 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="text-[#6b6b8d] hover:text-[#2d2d4a] transition-colors">←</button>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${game.currentTurn === 'X' ? 'bg-[#6c8cfa]' : 'bg-[#6b6b8d]/20'}`} />
            <span className={game.currentTurn === 'X' ? 'text-[#6c8cfa] font-semibold' : 'text-[#6b6b8d]/50'}>X</span>
            <span className="text-[#6b6b8d]/30">·</span>
            <span className={`w-2.5 h-2.5 rounded-full ${game.currentTurn === 'O' ? 'bg-[#8b7cf7]' : 'bg-[#6b6b8d]/20'}`} />
            <span className={game.currentTurn === 'O' ? 'text-[#8b7cf7] font-semibold' : 'text-[#6b6b8d]/50'}>O</span>
          </div>
          <span className="text-[#2d2d4a]/60 font-medium">{turnText}</span>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'ai' && <span className="text-[#6b6b8d]/50 capitalize">{difficulty}</span>}
          <span className="text-[#6b6b8d]/30 text-xs font-mono">#{game.moves.length}</span>
        </div>
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
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-slide-in">
            <div className="flex gap-4">
              {mode === 'online' && sentPlayAgain ? (
                <span className="text-xs text-[#6b6b8d]/70">Waiting for opponent...</span>
              ) : (
                <Button size="lg" onClick={handlePlayAgain}>Play Again</Button>
              )}
              <Button variant="secondary" size="lg" onClick={handleLeave}>
                {mode === 'online' ? 'Leave' : 'Home'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Play-again request modal */}
      <Modal
        isOpen={playAgainOpponent !== null}
        onClose={handleDeclinePlayAgain}
        title="Play Again?"
      >
        <p className="text-sm text-[#6b6b8d]/70 text-center mb-6">
          {playAgainOpponent?.username ?? 'Your opponent'} wants to play again
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleDeclinePlayAgain}>
            Decline
          </Button>
          <Button className="flex-1" onClick={handleAcceptPlayAgain}>
            Accept
          </Button>
        </div>
      </Modal>
    </div>
  );
}
