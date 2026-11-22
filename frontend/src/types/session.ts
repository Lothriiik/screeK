/**
 * Session types mirroring backend/core/internal/cinema/model.go
 */
import type { RoomType } from './cinema';

export type SessionType =
  | 'REGULAR'
  | 'PREMIERE'
  | 'RESCREENING'
  | 'FESTIVAL'
  | 'UNIVERSITY'
  | 'SHOWCASE';

export type AudioType = 'DUB' | 'LEG' | 'ORIG';
export type ScreenFormat = '2D' | '3D' | 'IMAX' | 'VIP' | '4DX' | 'D-BOX' | 'Cinépic';

export interface Session {
  id: string;
  numeric_id: number;
  movie_id: string;
  cinema_id: string;
  room_id: number;
  room_name: string;
  room_type: RoomType;
  start_time: string; // "14:00", "16:15", etc.
  date: string; // "2026-08-20" or day number "20"
  price: number; // in BRL
  session_type: SessionType;
  audio: AudioType;
  format: ScreenFormat;
  is_free?: boolean;
}
