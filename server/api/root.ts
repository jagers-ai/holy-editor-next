/**
 * This file contains the root router of your server's API
 */
import { createTRPCRouter } from '@/server/api/trpc';
import { documentRouter } from '@/server/api/routers/document';
import { authRouter } from '@/server/api/routers/auth';
import { folderRouter } from '@/server/api/routers/folder';

/**
 * This is the primary router for your server.
 * 
 * All routers added in /server/api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  document: documentRouter,
  auth: authRouter,
  folder: folderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;