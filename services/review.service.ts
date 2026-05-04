import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  reviewer: { _id: string; name: string };
  targetModel: 'Product' | 'User';
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  targetModel: 'Product' | 'User';
  targetId: string;
  rating: number;
  comment: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const reviewService = {
  /**
   * Create a new review
   * Backend validates that the user has a completed order for this product/provider
   */
  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await api.post('/reviews', payload);
    return data.data.review;
  },

  /**
   * Get reviews for a product or user
   */
  getForTarget: async (targetId: string, targetModel: 'Product' | 'User'): Promise<Review[]> => {
    const { data } = await api.get('/reviews', {
      params: { targetId, targetModel },
    });
    return data.data.reviews;
  },
};

export default reviewService;
