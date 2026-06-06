import type { BoardState, Player, Position } from '../types';
import { checkWin, getValidMoves } from './gameLogic';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

const BOARD_SIZE = 19;

function evaluateDirection(board: BoardState, row: number, col: number, dr: number, dc: number, player: Player): { playerCount: number; oppCount: number; openEnds: number } {
  const opponent: Player = player === 'X' ? 'O' : 'X';
  let playerCount = 1;
  let oppCount = 0;
  let openEnds = 0;

  for (const sign of [-1, 1]) {
    let space = false;
    for (let step = 1; step < 5; step++) {
      const r = row + dr * step * sign;
      const c = col + dc * step * sign;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
      const v = board[r][c];
      if (v === player) playerCount++;
      else if (v === opponent) break;
      else {
        if (!space) openEnds++;
        break;
      }
    }
  }

  return { playerCount, oppCount, openEnds };
}

function evaluateMove(board: BoardState, row: number, col: number, player: Player): number {
  const opponent: Player = player === 'X' ? 'O' : 'X';
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    const forPlayer = evaluateDirection(board, row, col, dr, dc, player);
    const forOpp = evaluateDirection(board, row, col, dr, dc, opponent);

    if (forPlayer.playerCount >= 5) score += 100000;

    if (forPlayer.playerCount === 4 && forPlayer.openEnds >= 1) score += 10000;
    else if (forPlayer.playerCount === 4) score += 1000;
    else if (forPlayer.playerCount === 3 && forPlayer.openEnds >= 2) score += 1000;
    else if (forPlayer.playerCount === 3 && forPlayer.openEnds >= 1) score += 100;
    else if (forPlayer.playerCount === 2 && forPlayer.openEnds >= 2) score += 50;
    else if (forPlayer.playerCount === 2 && forPlayer.openEnds >= 1) score += 10;

    if (forOpp.playerCount >= 5) score += 50000;
    if (forOpp.playerCount === 4 && forOpp.openEnds >= 1) score += 5000;
    if (forOpp.playerCount === 4) score += 500;
    if (forOpp.playerCount === 3 && forOpp.openEnds >= 2) score += 500;
    if (forOpp.playerCount === 3 && forOpp.openEnds >= 1) score += 50;
  }

  const center = BOARD_SIZE / 2;
  const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
  score += Math.max(0, 10 - distFromCenter);

  return score;
}

export function getAIMove(
  board: BoardState,
  player: Player,
  difficulty: AIDifficulty,
): Position {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return { row: 0, col: 0 };

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  const opponent: Player = player === 'X' ? 'O' : 'X';

  for (const move of validMoves) {
    if (checkWin(board, move.row, move.col, player)) return move;
  }

  for (const move of validMoves) {
    if (checkWin(board, move.row, move.col, opponent)) return move;
  }

  const scored = validMoves.map(move => ({
    move,
    score: evaluateMove(board, move.row, move.col, player),
  }));

  scored.sort((a, b) => b.score - a.score);

  if (difficulty === 'medium') {
    const top = Math.min(5, scored.length - 1);
    return scored[Math.floor(Math.random() * (top + 1))].move;
  }

  return scored[0].move;
}
