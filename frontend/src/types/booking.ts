/**
 * Booking & Ticket types mirroring backend/core/internal/bookings/model.go
 */

export type TicketType = 'STANDARD' | 'HALF' | 'FREE' | 'VIP';
export type TicketStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'APPLE_PAY' | 'GOOGLE_PAY';

export interface SnackItem {
  id: string;
  name: string;
  category: 'Pipocas' | 'Bebidas' | 'Doces' | 'Combos';
  price: number;
  image: string;
  description: string;
}

export interface SelectedTicket {
  type: 'Inteira' | 'Meia-Entrada' | 'VIP';
  price: number;
  seatId: string;
  seatRow: string;
  seatNumber: number;
}

export interface SelectedSnack {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface BookingTransaction {
  id: string;
  user_id: string;
  session_id: string;
  movie_id: string;
  movie_title: string;
  cinema_name: string;
  room_name: string;
  session_time: string;
  session_date: string;
  screen_format: string;
  audio_format: string;
  tickets: SelectedTicket[];
  snacks: SelectedSnack[];
  subtotal_tickets: number;
  subtotal_snacks: number;
  service_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  status: TicketStatus;
  qr_code: string;
  created_at: string;
}
