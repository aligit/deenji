// src/server/trpc/routers/user.ts
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createClient } from '@supabase/supabase-js';

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
  // Get user profile
  getProfile: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const supabase = createClient(
        import.meta.env['VITE_supabaseUrl'] || '',
        import.meta.env['VITE_supabaseKey'] || ''
      );

      const { data, error } = await supabase
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

  // Update user profile
  updateProfile: publicProcedure
    .input(profileSchema)
    .mutation(async ({ input }) => {
      if (!input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        });
      }

      const supabase = createClient(
        import.meta.env['VITE_supabaseUrl'] || '',
        import.meta.env['VITE_supabaseKey'] || ''
      );

      const updateData = {
        ...input,
        updated_at: new Date(),
      };

      const { data, error } = await supabase
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

  // Get user settings
  getSettings: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createClient(
        import.meta.env['VITE_supabaseUrl'] || '',
        import.meta.env['VITE_supabaseKey'] || ''
      );

      const { data, error } = await supabase
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

  // Update user settings
  updateSettings: publicProcedure
    .input(userSettingsSchema)
    .mutation(async ({ input }) => {
      const supabase = createClient(
        import.meta.env['VITE_supabaseUrl'] || '',
        import.meta.env['VITE_supabaseKey'] || ''
      );

      const { id, ...settingsData } = input;

      const updateData = {
        ...settingsData,
        updated_at: new Date(),
      };

      const { data, error } = await supabase
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
});
