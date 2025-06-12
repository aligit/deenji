// src/app/core/services/review.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { map, catchError, of, Observable, from, switchMap } from 'rxjs';
import { injectTrpcClient } from '../../../trpc-client';
import { Review, CreateReviewInput, ReviewStats } from '../types/review.types';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private trpc = injectTrpcClient();
  private supabase = inject(SupabaseService);

  // Signals for state management
  reviews = signal<Review[]>([]);
  stats = signal<ReviewStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  /**
   * Load reviews for a property
   * @param propertyId Numeric property ID
   */
  loadReviews(propertyId: string | number, limit = 20, offset = 0) {
    this.loading.set(true);
    this.error.set(null);

    // Ensure propertyId is a number
    const numericPropertyId =
      typeof propertyId === 'string' ? Number(propertyId) : propertyId;

    console.log(`Loading reviews for property ID: ${numericPropertyId}`);

    // Log authentication state for debugging
    console.log(
      'Auth state when loading reviews:',
      this.supabase.session ? 'Authenticated' : 'Not authenticated'
    );

    // Using trpc approach
    return this.trpc.review.getByPropertyId
      .query({
        property_id: numericPropertyId,
        limit,
        offset,
      })
      .pipe(
        map((data) => {
          const reviews = data as unknown as Review[];
          this.reviews.set(reviews);
          this.loading.set(false);
          return reviews;
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

  /**
   * Load review statistics for a property
   */
  loadStats(propertyId: string | number) {
    // Ensure propertyId is a number
    const numericPropertyId =
      typeof propertyId === 'string' ? Number(propertyId) : propertyId;

    console.log(`Loading review stats for property ID: ${numericPropertyId}`);

    return this.trpc.review.getStats
      .query({
        property_id: numericPropertyId,
      })
      .pipe(
        map((data) => {
          const stats = data as unknown as ReviewStats;
          this.stats.set(stats);
          return stats;
        }),
        catchError((err) => {
          console.error('Error loading review stats:', err);
          return of(null);
        })
      );
  }

  /**
   * Create a new review or reply
   * Uses direct Supabase client to ensure authentication context is properly passed
   */
  createReview(input: CreateReviewInput): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);

    // Ensure property_id is a number
    const numericPropertyId =
      typeof input.property_id === 'string'
        ? Number(input.property_id)
        : input.property_id;

    const reviewData = {
      ...input,
      property_id: numericPropertyId,
    };

    console.log('Creating review with data:', reviewData);

    // Check if we have a session directly
    if (!this.supabase.session) {
      console.error('No active session found in SupabaseService');
      this.error.set('You must be logged in to create a review');
      this.loading.set(false);
      return of(null as unknown as Review);
    }

    console.log('User is authenticated as:', this.supabase.session.user.id);

    // Insert the review directly using the Supabase client
    return from(
      this.supabase.client
        .from('reviews')
        .insert({
          user_id: this.supabase.session.user.id,
          property_id: numericPropertyId,
          rating: input.rating || null,
          comment: input.comment || null,
          parent_id: input.parent_id || null,
        })
        .select(
          `
          id,
          user_id,
          property_id,
          rating,
          comment,
          parent_id,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          )
        `
        )
        .single()
    ).pipe(
      map(({ data, error }) => {
        this.loading.set(false);

        if (error) {
          console.error('Error creating review:', error);

          // Handle specific error cases
          let errorMessage = 'Failed to create review';

          if (error.code === '23505') {
            errorMessage = 'You have already reviewed this property';
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.error.set(errorMessage);
          throw error;
        }

        console.log('Review created successfully:', data);

        // Format the response to match our Review type
        return {
          ...data,
          user: data.profiles,
        } as unknown as Review;
      }),
      catchError((err) => {
        console.error('Error in createReview:', err);
        this.loading.set(false);

        let errorMessage = 'Failed to create review';

        if (err.code === '23505') {
          errorMessage = 'You have already reviewed this property';
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.error.set(errorMessage);
        throw err;
      })
    );
  }

  /**
   * Delete a review
   * Uses direct Supabase client to ensure authentication context is properly passed
   */
  deleteReview(reviewId: string): Observable<boolean> {
    console.log(`Deleting review with ID: ${reviewId}`);

    // Check if we have a session directly
    if (!this.supabase.session) {
      console.error('No active session found in SupabaseService');
      this.error.set('You must be logged in to delete a review');
      return of(false);
    }

    console.log('User is authenticated as:', this.supabase.session.user.id);

    // Delete the review directly using the Supabase client
    return from(
      this.supabase.client
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', this.supabase.session.user.id) // Ensure only the author can delete
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('Error deleting review:', error);
          throw error;
        }

        // Remove from local state
        this.reviews.update((reviews) =>
          reviews.filter((review) => {
            // Filter out the deleted review and any replies to it
            if (review.id === reviewId) return false;
            // Check for replies to this review
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
        console.error('Error in deleteReview:', err);
        this.error.set('Failed to delete review');
        throw err;
      })
    );
  }

  /**
   * Reset the review state
   */
  reset() {
    this.reviews.set([]);
    this.stats.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
