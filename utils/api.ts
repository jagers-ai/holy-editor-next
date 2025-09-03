/**
 * This is the client-side entrypoint for your tRPC API.
 * It's used to create the `api` object which contains the Next.js App-specific
 * helpers for tRPC.
 *
 * - `api`: React Query hooks for the tRPC API
 * - `api.useUtils()`: access tRPC utilities like invalidation and refetching
 * - `api.useContext()`: access the tRPC React Context for lower-level operations
 */
import { createTRPCReact } from '@trpc/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/server/api/root';

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;