// src/server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Public procedure - available to all users
 */
export const publicProcedure = t.procedure;

/**
 * Middleware to check if the user is authenticated
 */
const enforceUserIsAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      // Infers the `user` as non-nullable
      user: ctx.user,
    },
  });
});

/**
 * Protected procedure - only available to authenticated users
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated);

/**
 * Middleware to check if the user is accessing their own data
 * This checks if the provided userId matches the authenticated user's ID
 */
const enforceUserIsAuthorized = t.middleware(
  async ({ ctx, next, rawInput }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    // Check if the input contains userId and if it matches the current user
    const input = rawInput as { userId?: string };
    if (input.userId && input.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only access your own data',
      });
    }

    return next({
      ctx: {
        // Inferred as non-nullable user
        user: ctx.user,
      },
    });
  }
);

/**
 * User-specific procedure - only allows accessing your own data
 */
export const userProcedure = t.procedure.use(enforceUserIsAuthorized);

export const router = t.router;
export const middleware = t.middleware;
