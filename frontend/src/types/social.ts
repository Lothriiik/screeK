/**
 * Social types mirroring backend/core/internal/social/model.go & notifications
 */
import type { Movie } from './movie';

export type NotificationType =
  | 'TICKET_REMINDER'
  | 'PRE_SALE_ALERT'
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'FRIEND_SESSION';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeAgo: string;
  group: 'today' | 'yesterday' | 'this_week' | 'older';
  is_read: boolean;
  avatar_url?: string;
  link_to?: string;
  action_label?: string;
}

export interface MovieList {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string;
  is_private: boolean;
  likes_count: number;
  movie_ids: string[];
  tags?: string[];
  order_type?: 'manual' | 'rating' | 'year' | 'alphabetical';
  backdrop_url?: string;
  created_at: string;
  movies?: Movie[];
}
