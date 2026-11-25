export interface GanttSession {
  id: string;
  dateNum: string;
  movieId: string;
  movieTitle: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  durationMinutes: number;
  format: string;
  audio: string;
  occupancy: number;
  capacity: number;
  price: number;
  hasConflict?: boolean;
  color: string;
  conflictDetails?: string;
}

export interface ScheduleRoom {
  id: string;
  name: string;
  type: string;
  seats: number;
  status: string;
  occupancyRate: number;
  currentSeats: number;
  isMaintenance?: boolean;
}
