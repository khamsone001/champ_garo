import { useRef, useEffect, useCallback, useState, type MouseEvent } from 'react';
import type { BoardState, Player, Position } from '../../types';

interface GameBoardProps {
  board: BoardState;
  currentTurn: Player;
  status: string;
  winner: string | null;
  onCellClick: (position: Position) => void;
  validMoves: Position[];
  lastMove: Position | null;
}

const PAD = 28;
const BOARD_SIZE = 19;
const STAR_POINTS = [3, 9, 15];

export default function GameBoard({
  board, currentTurn, status, winner,
  onCellClick, validMoves, lastMove,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const [canvasSize, setCanvasSize] = useState(600);
  const animRef = useRef(0);

  const cellSize = (canvasSize - PAD * 2) / (BOARD_SIZE - 1);

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCanvasSize(Math.min(rect.width, rect.height));
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  const posFromXY = useCallback((cx: number, cy: number): Position | null => {
    const cvs = canvasRef.current;
    if (!cvs) return null;
    const r = cvs.getBoundingClientRect();
    const x = cx - r.left - PAD;
    const y = cy - r.top - PAD;

    const col = Math.round(x / cellSize);
    const row = Math.round(y / cellSize);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;

    const dx = Math.abs(x - col * cellSize);
    const dy = Math.abs(y - row * cellSize);
    if (dx > cellSize * 0.45 || dy > cellSize * 0.45) return null;

    return { row, col };
  }, [cellSize]);

  const cPixel = useCallback((i: number) => PAD + i * cellSize, [cellSize]);

  // Draw static bg canvas
  useEffect(() => {
    const S = canvasSize;
    if (S <= 0) return;

    if (!bgCanvasRef.current) bgCanvasRef.current = document.createElement('canvas');
    const bg = bgCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    bg.width = S * dpr;
    bg.height = S * dpr;
    const ctx = bg.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Board background
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    const r = 16;
    const w = S - PAD * 2 + 32;
    const h = S - PAD * 2 + 32;
    ctx.beginPath();
    ctx.roundRect(PAD - 16, PAD - 16, w, h, r);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = 'rgba(45,45,74,0.08)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = cPixel(i);
      ctx.beginPath();
      ctx.moveTo(cPixel(0), pos);
      ctx.lineTo(cPixel(BOARD_SIZE - 1), pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, cPixel(0));
      ctx.lineTo(pos, cPixel(BOARD_SIZE - 1));
      ctx.stroke();
    }

    // Star points
    ctx.fillStyle = 'rgba(45,45,74,0.15)';
    for (const r of STAR_POINTS) {
      for (const c of STAR_POINTS) {
        ctx.beginPath();
        ctx.arc(cPixel(c), cPixel(r), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Labels
    ctx.fillStyle = 'rgba(45,45,74,0.12)';
    ctx.font = `${Math.max(7, cellSize * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < BOARD_SIZE; i++) {
      const col = String.fromCharCode(65 + (i < 8 ? i : i + 1));
      ctx.fillText(col, cPixel(i), PAD - cellSize * 0.5);
      ctx.fillText(`${BOARD_SIZE - i}`, PAD - cellSize * 0.6, cPixel(i));
    }
  }, [canvasSize, cellSize, cPixel]);

  const draw = useCallback((time: number) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasSize * dpr;
    cvs.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const S = canvasSize;

    if (bgCanvasRef.current) {
      ctx.drawImage(bgCanvasRef.current, 0, 0, S, S);
    }

    // Stones
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = board[r][c];
        if (!v) continue;

        const x = cPixel(c);
        const y = cPixel(r);

        ctx.save();
        ctx.lineCap = 'round';

        if (v === 'X') {
          ctx.strokeStyle = '#6c8cfa';
          ctx.lineWidth = 2;
          const p = cellSize * 0.2;
          ctx.beginPath();
          ctx.moveTo(x - p, y - p);
          ctx.lineTo(x + p, y + p);
          ctx.moveTo(x + p, y - p);
          ctx.lineTo(x - p, y + p);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#8b7cf7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.34, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Last move dot
    if (lastMove) {
      ctx.save();
      ctx.fillStyle = '#2d2d4a';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(cPixel(lastMove.col), cPixel(lastMove.row), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hover preview
    if (hoverPos && status === 'playing' && board[hoverPos.row][hoverPos.col] === null) {
      const x = cPixel(hoverPos.col);
      const y = cPixel(hoverPos.row);
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time / 350) * 0.1;

      if (currentTurn === 'X') {
        ctx.strokeStyle = '#6c8cfa';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        const p = cellSize * 0.18;
        ctx.beginPath();
        ctx.moveTo(x - p, y - p);
        ctx.lineTo(x + p, y + p);
        ctx.moveTo(x + p, y - p);
        ctx.lineTo(x - p, y + p);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#8b7cf7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hover ring
    if (hoverPos && status === 'playing' && board[hoverPos.row][hoverPos.col] === null) {
      ctx.save();
      ctx.strokeStyle = 'rgba(45,45,74,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cPixel(hoverPos.col), cPixel(hoverPos.row), cellSize * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Game over overlay
    if (status === 'finished') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 0, S, S);

      const text = winner === 'draw' ? 'Draw' : `${winner} wins`;
      ctx.fillStyle = 'rgba(45,45,74,0.6)';
      ctx.font = `bold ${S * 0.055}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, S / 2, S / 2);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [canvasSize, board, currentTurn, status, winner, validMoves, hoverPos, lastMove, cellSize, cPixel]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const onClick = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const pos = posFromXY(e.clientX, e.clientY);
    if (pos) onCellClick(pos);
  }, [posFromXY, onCellClick]);

  const onMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    setHoverPos(posFromXY(e.clientX, e.clientY));
  }, [posFromXY]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize,
          height: canvasSize,
          cursor: status === 'playing' ? 'crosshair' : 'default',
        }}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverPos(null)}
      />
    </div>
  );
}
