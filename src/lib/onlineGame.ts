import { supabase } from './supabase';
import type { Position, Player, CellState } from '../types';

export interface OnlineMovePayload {
  position: Position;
  player: Player;
  moveNumber: number;
  winner: Player | 'draw' | null;
  board: CellState[][];
  currentTurn: Player;
}

export interface RoomData {
  id: string;
  code: string;
  player_x_id: string | null;
  player_o_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  game_id: string | null;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(userId: string) {
  const code = generateCode();
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ code, player_x_id: userId, status: 'waiting' })
    .select()
    .single();

  if (error) return { room: null, error: error.message };

  const chan = supabase.channel(`room:${room.id}`);
  chan.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      chan.send({ type: 'broadcast', event: 'ping', payload: {} });
    }
  });
  supabase.removeChannel(chan);

  return { room: room as RoomData, error: null };
}

export async function joinRoom(code: string, userId: string) {
  const { data: room, error: findError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (findError || !room) return { room: null, error: 'Room not found or already full' };
  if (room.player_x_id === userId) return { room: null, error: 'Cannot join your own room' };

  const emptyBoard: CellState[][] = Array.from({ length: 19 }, () => Array(19).fill(null));

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      player_x_id: room.player_x_id,
      player_o_id: userId,
      status: 'playing',
      current_turn: 'X',
      game_data: { board: emptyBoard },
      move_history: [],
    })
    .select()
    .single();

  if (gameError || !game) return { room: null, error: 'Failed to create game' };

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ player_o_id: userId, status: 'playing', game_id: game.id })
    .eq('id', room.id);

  if (updateError) return { room: null, error: 'Failed to update room' };

  return {
    room: { ...room, player_o_id: userId, status: 'playing', game_id: game.id } as RoomData,
    error: null,
  };
}

export async function submitMove(
  gameId: string,
  userId: string,
  position: Position,
  player: Player,
  board: CellState[][],
  moveNumber: number,
  winner: Player | 'draw' | null,
) {
  const newBoard = board.map((r) => [...r]);
  newBoard[position.row][position.col] = player;
  const nextTurn: Player = player === 'X' ? 'O' : 'X';

  const { error } = await supabase
    .from('games')
    .update({
      game_data: { board: newBoard },
      current_turn: nextTurn,
      status: winner ? 'finished' : 'playing',
      winner,
    })
    .eq('id', gameId);

  if (error) return error.message;

  const { error: moveError } = await supabase
    .from('moves')
    .insert({
      game_id: gameId,
      player_id: userId,
      move_number: moveNumber,
      row_pos: position.row,
      col_pos: position.col,
      symbol: player,
    });

  if (moveError) return moveError.message;

  const chan = supabase.channel(`game:${gameId}`);
  await chan.send({
    type: 'broadcast',
    event: 'move',
    payload: { position, player, moveNumber, winner, board: newBoard, currentTurn: nextTurn },
  });
  supabase.removeChannel(chan);

  return null;
}

export function subscribeToGame(
  gameId: string,
  onMove: (data: OnlineMovePayload) => void,
  onError?: (err: string) => void,
) {
  const channel = supabase.channel(`game:${gameId}`);

  channel
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      onMove(payload as OnlineMovePayload);
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && onError) onError('Connection error');
    });

  return () => supabase.removeChannel(channel);
}

export async function fetchGameState(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error) return null;
  return data;
}
