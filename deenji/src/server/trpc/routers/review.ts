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
            )
          `
          )
          .eq('property_id', input.property_id)
          .is('parent_id', null) // Only top-level reviews
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) throw error;

        // Get replies for each review
        const reviewsWithReplies = await Promise.all(
          (data || []).map(async (review: any) => {
            const { data: replies, error: repliesError } = await ctx.supabase
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
              .eq('parent_id', review.id)
              .order('created_at', { ascending: true });

            if (repliesError) throw repliesError;

            return {
              ...review,
              user: review.profiles,
              replies:
                replies?.map((reply: any) => ({
                  ...reply,
                  user: reply.profiles,
                })) || [],
            };
          })
        );

        return reviewsWithReplies;
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
        const { data, error } = await ctx.supabase
          .from('reviews')
          .select('rating')
          .eq('property_id', input.property_id)
          .not('rating', 'is', null); // Only top-level reviews with ratings

        if (error) throw error;

        const reviews = data || [];
        const total_reviews = reviews.length;
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
        const { data, error } = await ctx.supabase
          .from('reviews')
          .insert({
            user_id: ctx.user.id,
            property_id: input.property_id,
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
          .single();

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'You have already reviewed this property',
            });
          }
          throw error;
        }

        return {
          ...data,
          user: data.profiles,
        };
      } catch (error) {
        console.error('Error creating review:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create review',
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
