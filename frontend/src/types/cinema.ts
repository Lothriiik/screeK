/**
 * Cinema & Room types mirroring backend/core/internal/cinema/model.go
 */

export type RoomType = 'STANDARD' | 'IMAX' | 'VIP' | '4DX' | 'D-BOX' | 'CINEPIC';

export type SeatStatus = 'available' | 'occupied' | 'selected' | 'reserved';
export type SeatType = 'standard' | 'vip' | 'wheelchair' | 'companion' | 'couple';

export interface Seat {
  id: string;
  numeric_id: number;
  room_id: number;
  row: string; // e.g. "A", "B", "C"
  number: number;
  pos_x: number;
  pos_y: number;
  type: SeatType;
  price_multiplier: number;
  is_occupied: boolean;
}

export interface Room {
  id: number;
  cinema_id: number;
  name: string;
  capacity: number;
  type: RoomType;
  screen_name?: string;
  seats?: Seat[];
}

export interface CinemaPricingItem {
  type: string;
  inteira: number;
  meia: number;
}

export interface Cinema {
  id: string;
  numeric_id: number;
  name: string;
  chain: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  distance?: string;
  hours: string;
  image_url: string;
  backdrop_url: string;
  amenities: string[];
  pricing: CinemaPricingItem[];
  rooms_count: number;
  rooms?: Room[];
}
