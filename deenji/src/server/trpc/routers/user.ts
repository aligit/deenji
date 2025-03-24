// src/server/trpc/routers/user.ts
import { z } from 'zod';
import {
  publicProcedure,
  protectedProcedure,
  userProcedure,
  router,
} from '../trpc';
import { TRPCError } from '@trpc/server';

// Define types for profile and user settings based on DB schema
const profileSchema = z.object({
  id: z.string().uuid().optional(),
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  user_type: z.enum(['buyer', 'agent']).optional(),
  email_verified: z.boolean().optional(),
});

const userSettingsSchema = z.object({
  id: z.string().uuid(),
  language: z.string().optional(),
  email_notifications: z.boolean().optional(),
  property_alerts: z.boolean().optional(),
  price_drop_alerts: z.boolean().optional(),
  dark_mode: z.boolean().optional(),
});

export const userRouter = router({
  // Get user profile - protected, but uses userProcedure to ensure users can only access their own data
  getProfile: userProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('profiles')
        .select(
          'username, website, avatar_url, phone, user_type, email_verified'
        )
        .eq('id', input.userId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
      }

      return data;
    }),

  // Update user profile - protected with userProcedure
  updateProfile: userProcedure
    .input(profileSchema)
    .mutation(async ({ input, ctx }) => {
      // Force the ID to be the authenticated user's ID to prevent updating other profiles
      const userId = ctx.user.id;

      const updateData = {
        id: userId, // Ensure we're updating the correct profile
        ...input,
        updated_at: new Date(),
      };

      const { data, error } = await ctx.supabase
        .from('profiles')
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
      }

      return data;
    }),

  // Get user settings - protected with userProcedure
  getSettings: userProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('user_settings')
        .select('*')
        .eq('id', input.userId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
      }

      return data;
    }),

  // Update user settings - protected with userProcedure
  updateSettings: userProcedure
    .input(userSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Force the ID to be the authenticated user's ID
      const userId = ctx.user.id;

      if (input.id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own settings',
        });
      }

      const { id, ...settingsData } = input;

      const updateData = {
        ...settingsData,
        updated_at: new Date(),
      };

      const { data, error } = await ctx.supabase
        .from('user_settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
      }

      return data;
    }),

  // Public endpoint to check if user is authenticated
  getAuthStatus: publicProcedure.query(({ ctx }) => {
    return {
      isAuthenticated: !!ctx.user,
      userId: ctx.user?.id,
    };
  }),
});
