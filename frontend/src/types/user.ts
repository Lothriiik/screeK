/**
 * User types mirroring backend/core/internal/users/model.go
 */

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  watched_count: number;
  reviews_count: number;
  lists_count: number;
  followers_count: number;
  following_count: number;
  favorite_movie_ids?: string[];
  is_following?: boolean;
}
