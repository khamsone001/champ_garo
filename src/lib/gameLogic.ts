import type { BoardState, Player, Position } from '../types';

const BOARD_SIZE = 19;
const WIN_LENGTH = 5;

export function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function checkWin(board: BoardState, row: number, col: number, player: Player): boolean {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    for (const sign of [-1, 1]) {
      for (let step = 1; step < WIN_LENGTH; step++) {
        const r = row + dr * step * sign;
        const c = col + dc * step * sign;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
        if (board[r][c] === player) count++;
        else break;
      }
    }

    if (count >= WIN_LENGTH) return true;
  }

  return false;
}

export function isBoardFull(board: BoardState): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

export function getValidMoves(board: BoardState): Position[] {
  const moves: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

export function makeMove(board: BoardState, position: Position, player: Player): BoardState {
  const newBoard = board.map(row => [...row]);
  newBoard[position.row][position.col] = player;
  return newBoard;
}
