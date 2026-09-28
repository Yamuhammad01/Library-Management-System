import { QueryClient } from "@tanstack/react-query";

/**
 * Single app-wide React Query client.
 *
 * Lives in its own module (instead of next to the app root) so the auth layer
 * can wipe cached — and therefore per-user — data on logout without importing
 * App.tsx and creating a circular dependency.
 */
export const queryClient = new QueryClient();
