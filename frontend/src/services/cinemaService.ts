import { api } from './api';
import { MOCK_CINEMAS } from '../mocks/cinemas';
import type { Cinema, Room } from '../types/cinema';

export interface CreateCinemaPayload {
  name: string;
  chain: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  hours?: string;
  amenities?: string[];
}

export interface CreateRoomPayload {
  cinema_id: number;
  name: string;
  capacity: number;
  type: string;
  screen_name?: string;
}

export interface SessionItem {
  id: number;
  cinema_id: number;
  movie_id: number;
  room_id: number;
  start_time: string;
  end_time: string;
  audio_type: 'DUB' | 'LEG' | 'ORIGINAL';
  format_type: '2D' | '3D' | 'IMAX' | 'VIP';
  price_base: number;
}

export const cinemaService = {
  // List all cinemas (with fallback to MOCK_CINEMAS)
  async getCinemas(): Promise<Cinema[]> {
    try {
      const response = await api.get<Cinema[]>('/admin/management/cinemas');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_CINEMAS;
    } catch {
      return MOCK_CINEMAS;
    }
  },

  // Get cinema by ID
  async getCinemaById(id: string | number): Promise<Cinema | null> {
    try {
      const response = await api.get<Cinema>(`/admin/management/cinemas/${id}`);
      return response.data;
    } catch {
      const found = MOCK_CINEMAS.find((c) => c.id === id || c.numeric_id === Number(id));
      return found || null;
    }
  },

  // Create new cinema
  async createCinema(data: CreateCinemaPayload): Promise<Cinema> {
    try {
      const response = await api.post<Cinema>('/admin/management/cinemas', data);
      return response.data;
    } catch {
      // Offline fallback
      const newCinema: Cinema = {
        id: `cinema-${Date.now()}`,
        numeric_id: Date.now(),
        name: data.name,
        chain: data.chain,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        phone: data.phone || '(11) 3000-0000',
        email: data.email,
        hours: data.hours || 'Segunda a Domingo: 13h às 22h',
        amenities: data.amenities || ['Estacionamento', 'Acessibilidade'],
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
        rooms_count: 0,
        rooms: [],
        pricing: [],
      };
      MOCK_CINEMAS.unshift(newCinema);
      return newCinema;
    }
  },

  // Update cinema
  async updateCinema(id: string | number, data: Partial<CreateCinemaPayload>): Promise<Cinema> {
    try {
      const response = await api.put<Cinema>(`/admin/management/cinemas/${id}`, data);
      return response.data;
    } catch {
      const idx = MOCK_CINEMAS.findIndex((c) => c.id === id || c.numeric_id === Number(id));
      if (idx !== -1) {
        MOCK_CINEMAS[idx] = { ...MOCK_CINEMAS[idx], ...data } as Cinema;
        return MOCK_CINEMAS[idx];
      }
      throw new Error('Cinema não encontrado');
    }
  },

  // Delete cinema
  async deleteCinema(id: string | number): Promise<void> {
    try {
      await api.delete(`/admin/management/cinemas/${id}`);
    } catch {
      const idx = MOCK_CINEMAS.findIndex((c) => c.id === id || c.numeric_id === Number(id));
      if (idx !== -1) {
        MOCK_CINEMAS.splice(idx, 1);
      }
    }
  },

  // Create room
  async createRoom(cinemaId: number, data: CreateRoomPayload): Promise<Room> {
    try {
      const response = await api.post<Room>(`/admin/management/cinemas/${cinemaId}/rooms`, data);
      return response.data;
    } catch {
      const newRoom: Room = {
        id: Date.now(),
        cinema_id: cinemaId,
        name: data.name,
        capacity: data.capacity,
        type: data.type as any,
        screen_name: data.screen_name,
      };
      return newRoom;
    }
  },

  // Get sessions
  async getSessions(cinemaId?: number): Promise<SessionItem[]> {
    try {
      const response = await api.get<SessionItem[]>('/admin/management/sessions', {
        params: cinemaId ? { cinema_id: cinemaId } : undefined,
      });
      return response.data;
    } catch {
      return [];
    }
  },
};
