import { router } from '../trpc';
import { noteRouter } from './notes';
import { userRouter } from './user';

export const appRouter = router({
  note: noteRouter,
  user: userRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
