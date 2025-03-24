// src/trpc-client.ts
import { AppRouter } from './server/trpc/routers';
import { createTrpcClient } from '@analogjs/trpc';
import { inject } from '@angular/core';
import superjson from 'superjson';
import { SupabaseService } from './app/core/services/supabase.service';

// Create the tRPC client with options
export const { provideTrpcClient, TrpcClient, TrpcHeaders } =
  createTrpcClient<AppRouter>({
    url: '/api/trpc',
    options: {
      transformer: superjson,
    },
  });

// Function to set auth headers whenever making a request
export function setupTrpcAuth() {
  const supabaseService = inject(SupabaseService);

  // Update tRPC headers with authentication token when session exists
  if (supabaseService.session) {
    TrpcHeaders.set({
      Authorization: `Bearer ${supabaseService.session.access_token}`,
    });
  }

  // Set up a listener for auth state changes
  supabaseService.onAuthStateChange((event, session) => {
    if (session) {
      TrpcHeaders.set({
        Authorization: `Bearer ${session.access_token}`,
      });
    } else {
      // Clear auth headers when logged out
      TrpcHeaders.set({});
    }
  });
}

// Function to inject the tRPC client
export function injectTrpcClient() {
  // Setup auth headers (will only run once per component)
  setupTrpcAuth();
  return inject(TrpcClient);
}
