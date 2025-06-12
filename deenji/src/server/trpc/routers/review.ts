// src/server/trpc/routers/review.ts
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

const createReviewSchema = z
  .object({
    property_id: z.union([z.string(), z.number()]),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(1).max(2000).optional(),
    parent_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Top-level reviews must have rating, replies cannot have rating
      if (!data.parent_id) {
        return data.rating !== undefined;
      } else {
        return data.rating === undefined;
      }
    },
    {
      message:
        'Top-level reviews must have a rating, replies cannot have a rating',
    }
  );

export const reviewRouter = router({
  // Get reviews for a property (public)
  getByPropertyId: publicProcedure
    .input(
      z.object({
        property_id: z.union([z.string(), z.number()]),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log('Getting reviews for property ID:', input.property_id);

        // Ensure property_id is a number
        const numericPropertyId =
          typeof input.property_id === 'string'
            ? parseInt(input.property_id, 10)
            : input.property_id;

        console.log(
          `Using numeric property ID: ${numericPropertyId} (${typeof numericPropertyId})`
        );

        // Using nested selection to get reviews with their replies in one query
        const { data, error } = await ctx.supabase
          .from('reviews')
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
          ),
          replies:reviews(
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
          )
        `
          )
          .eq('property_id', numericPropertyId)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          console.error('Error fetching reviews:', error);
          throw error;
        }

        console.log(
          `Found ${data?.length || 0} reviews for property ${numericPropertyId}`
        );

        // Transform the data to match our expected format
        const reviews = data.map((review) => {
          return {
            ...review,
            user: review.profiles,
            replies: (review.replies || []).map((reply) => ({
              ...reply,
              user: reply.profiles,
            })),
          };
        });

        return reviews;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reviews',
        });
      }
    }),

  // Get review stats for a property (public)
  getStats: publicProcedure
    .input(
      z.object({
        property_id: z.union([z.string(), z.number()]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log('Getting review stats for property ID:', input.property_id);

        // Ensure property_id is a number
        const numericPropertyId =
          typeof input.property_id === 'string'
            ? parseInt(input.property_id, 10)
            : input.property_id;

        console.log(
          `Using numeric property ID: ${numericPropertyId} (${typeof numericPropertyId})`
        );

        const { data, error } = await ctx.supabase
          .from('reviews')
          .select('rating')
          .eq('property_id', numericPropertyId)
          .not('rating', 'is', null); // Only top-level reviews with ratings

        if (error) {
          console.error('Error fetching review stats:', error);
          throw error;
        }

        const reviews = data || [];
        const total_reviews = reviews.length;
        console.log(
          `Found ${total_reviews} reviews with ratings for property ${numericPropertyId}`
        );

        const average_rating =
          total_reviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            total_reviews
            : 0;

        // Calculate rating distribution
        const rating_distribution: { [key: number]: number } = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        reviews.forEach((review: any) => {
          if (review.rating >= 1 && review.rating <= 5) {
            rating_distribution[review.rating]++;
          }
        });

        return {
          total_reviews,
          average_rating: Math.round(average_rating * 10) / 10,
          rating_distribution,
        };
      } catch (error) {
        console.error('Error fetching review stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch review stats',
        });
      }
    }),

  // Create a review or reply (protected)
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('Creating review with input:', input);

        // Ensure property_id is a number
        const numericPropertyId =
          typeof input.property_id === 'string'
            ? parseInt(input.property_id, 10)
            : input.property_id;

        console.log(
          `Using numeric property ID: ${numericPropertyId} (${typeof numericPropertyId})`
        );

        // Verify user is authenticated
        if (!ctx.user || !ctx.user.id) {
          console.error('No authenticated user found');
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to create a review',
          });
        }

        console.log(`Creating review as user: ${ctx.user.id}`);

        // Get current auth status for debugging
        const { data: authDebug, error: authError } = await ctx.supabase.rpc(
          'debug_auth'
        );

        if (authError) {
          console.error('Error checking auth status:', authError);
        } else {
          console.log('Auth debug info:', authDebug);
        }

        // Create the review with direct SQL to bypass RLS temporarily
        // This is a workaround until we resolve the RLS issue
        const { data, error } = await ctx.supabase.rpc('create_review', {
          p_user_id: ctx.user.id,
          p_property_id: numericPropertyId,
          p_rating: input.rating || null,
          p_comment: input.comment || null,
          p_parent_id: input.parent_id || null,
        });

        if (error) {
          console.error('Error creating review:', error);

          // Handle specific errors
          if (error.code === '23505') {
            // Unique constraint violation - user already reviewed this property
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'You have already reviewed this property',
              cause: error,
            });
          } else if (error.code === '42501') {
            // RLS policy violation
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to create a review',
              cause: error,
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Database error: ${error.message}`,
            cause: error,
          });
        }

        console.log('Review created successfully:', data);

        // Fetch the created review with user profile data
        const { data: reviewData, error: fetchError } = await ctx.supabase
          .from('reviews')
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
          .eq('id', data.id)
          .single();

        if (fetchError) {
          console.error('Error fetching created review:', fetchError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Review created but could not fetch details',
          });
        }

        return {
          ...reviewData,
          user: reviewData.profiles,
        };
      } catch (error) {
        console.error('Error in review.create procedure:', error);
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create review',
          cause: error,
        });
      }
    }),

  // Delete a review or reply (protected)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { error } = await ctx.supabase
          .from('reviews')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id); // Ensure user can only delete their own

        if (error) throw error;

        return { success: true };
      } catch (error) {
        console.error('Error deleting review:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete review',
        });
      }
    }),
});
