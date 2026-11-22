import { api } from './api';
import { MOCK_FEED_ACTIVITIES, type FeedPostDetail } from '../mocks/feed';

export interface CreatePostPayload {
  type: string;
  movie_id?: number;
  rating?: number;
  content: string;
  is_spoiler?: boolean;
}

export const socialService = {
  // Get social feed
  async getFeed(page = 1, limit = 20): Promise<FeedPostDetail[]> {
    try {
      const response = await api.get<FeedPostDetail[]>('/social/feed', {
        params: { page, limit },
      });
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return MOCK_FEED_ACTIVITIES;
    } catch {
      return MOCK_FEED_ACTIVITIES;
    }
  },

  // Get single post by ID
  async getPostById(id: string | number): Promise<FeedPostDetail | null> {
    try {
      const response = await api.get<FeedPostDetail>(`/social/posts/${id}`);
      return response.data;
    } catch {
      const found = MOCK_FEED_ACTIVITIES.find((p: FeedPostDetail) => p.id === id || p.id === String(id));
      return found || MOCK_FEED_ACTIVITIES[0] || null;
    }
  },

  // Create post
  async createPost(payload: CreatePostPayload): Promise<FeedPostDetail> {
    const response = await api.post<FeedPostDetail>('/social/posts', payload);
    return response.data;
  },

  // Like post
  async likePost(postId: number | string): Promise<void> {
    await api.post(`/social/posts/${postId}/like`);
  },

  // Unlike post
  async unlikePost(postId: number | string): Promise<void> {
    await api.delete(`/social/posts/${postId}/like`);
  },

  // Add comment to post
  async addComment(postId: number | string, content: string): Promise<any> {
    const response = await api.post(`/social/posts/${postId}/comments`, { content });
    return response.data;
  },

  // Follow a user
  async followUser(userId: string): Promise<void> {
    await api.post(`/social/users/${userId}/follow`);
  },

  // Unfollow a user
  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/social/users/${userId}/follow`);
  },
};
