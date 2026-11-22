import { api } from './api';

export interface SeatItem {
  id: string;
  row: string;
  number: number;
  type: 'STANDARD' | 'VIP' | 'PCD';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  price: number;
}

export interface TicketItem {
  id: string;
  session_id: number;
  movie_title: string;
  cinema_name: string;
  room_name: string;
  seat_label: string;
  start_time: string;
  qr_code: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
}

export const bookingService = {
  // Get seatmap for a session
  async getSessionSeats(sessionId: number | string): Promise<SeatItem[]> {
    try {
      const response = await api.get<SeatItem[]>(`/bookings/sessions/${sessionId}/seats`);
      return response.data;
    } catch {
      return [];
    }
  },

  // Reserve seats
  async reserveSeats(sessionId: number | string, seatIds: string[]): Promise<{ reservation_id: string; expires_at: string }> {
    const response = await api.post<{ reservation_id: string; expires_at: string }>('/bookings/reserve', {
      session_id: sessionId,
      seat_ids: seatIds,
    });
    return response.data;
  },

  // Checkout payment
  async checkoutPayment(reservationId: string, paymentMethod: 'CREDIT_CARD' | 'PIX'): Promise<{ success: boolean; ticket_ids: string[] }> {
    const response = await api.post<{ success: boolean; ticket_ids: string[] }>('/bookings/pay', {
      reservation_id: reservationId,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  // Get current user tickets
  async getMyTickets(): Promise<TicketItem[]> {
    try {
      const response = await api.get<TicketItem[]>('/users/me/tickets');
      return response.data;
    } catch {
      return [];
    }
  },
};
