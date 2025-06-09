// src/server/trpc/routers/index.ts
import { router } from '../trpc';
import { noteRouter } from './notes';
import { userRouter } from './user';
import { propertyRouter } from './property';
import { reviewRouter } from './review';

/**
 * Main application router that combines all feature routers
 */
export const appRouter = router({
  // User management routes
  user: userRouter,

  // Property search and related functionality
  property: propertyRouter,

  // Note-taking functionality (if used in your app)
  note: noteRouter,

  review: reviewRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
