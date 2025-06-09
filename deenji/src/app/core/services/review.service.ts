// Alternative: Observable-based version
import { Injectable, signal } from '@angular/core';
import { map, catchError, of } from 'rxjs';
import { injectTrpcClient } from '../../../trpc-client';
import { Review, CreateReviewInput, ReviewStats } from '../types/review.types';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private trpc = injectTrpcClient();

  // Signals for state management
  reviews = signal<Review[]>([]);
  stats = signal<ReviewStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  loadReviews(propertyId: string | number, limit = 20, offset = 0) {
    this.loading.set(true);
    this.error.set(null);

    return this.trpc.review.getByPropertyId
      .query({
        property_id: propertyId,
        limit,
        offset,
      })
      .pipe(
        map((data) => {
          this.reviews.set(data as Review[]);
          this.loading.set(false);
          return data;
        }),
        catchError((err) => {
          console.error('Error loading reviews:', err);
          this.error.set('Failed to load reviews');
          this.loading.set(false);
          return of([]);
        })
      )
      .subscribe();
  }

  loadStats(propertyId: string | number) {
    return this.trpc.review.getStats
      .query({
        property_id: propertyId,
      })
      .pipe(
        map((data) => {
          this.stats.set(data as ReviewStats);
          return data;
        }),
        catchError((err) => {
          console.error('Error loading review stats:', err);
          return of(null);
        })
      );
  }

  createReview(input: CreateReviewInput) {
    this.loading.set(true);
    this.error.set(null);

    return this.trpc.review.create.mutate(input).pipe(
      map((newReview) => {
        this.loading.set(false);
        return newReview as Review;
      }),
      catchError((err) => {
        console.error('Error creating review:', err);
        const errorMessage = err.message || 'Failed to create review';
        this.error.set(errorMessage);
        this.loading.set(false);
        throw err;
      })
    );
  }

  deleteReview(reviewId: string) {
    return this.trpc.review.delete.mutate({ id: reviewId }).pipe(
      map(() => {
        // Remove from local state
        this.reviews.update((reviews) =>
          reviews.filter((review) => {
            if (review.id === reviewId) return false;
            // Also remove from replies
            if (review.replies) {
              review.replies = review.replies.filter(
                (reply) => reply.id !== reviewId
              );
            }
            return true;
          })
        );
        return true;
      }),
      catchError((err) => {
        console.error('Error deleting review:', err);
        this.error.set('Failed to delete review');
        return of(false);
      })
    );
  }

  reset() {
    this.reviews.set([]);
    this.stats.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
