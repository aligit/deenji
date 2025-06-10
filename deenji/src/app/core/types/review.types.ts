// src/app/core/types/review.types.ts
export interface Review {
  id: string;
  user_id: string;
  property_id: string | number;
  rating?: number; // 1-5 for top-level reviews, null for replies
  comment?: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;

  // User information for display
  user?: {
    username?: string;
    avatar_url?: string;
  };

  // Nested replies
  replies?: Review[];
}

export interface CreateReviewInput {
  property_id: string | number;
  rating?: number;
  comment?: string;
  parent_id?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    [rating: number]: number;
  };
}
