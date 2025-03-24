// src/server/trpc/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { EventHandlerRequest } from 'h3';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Creates an authenticated tRPC context
 */
export const createContext = async (opts: any) => {
  // Create a Supabase client for the server
  const supabaseUrl = import.meta.env['VITE_supabaseUrl'] || '';
  const supabaseKey = import.meta.env['VITE_supabaseKey'] || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the request object - handle both Fetch API and H3/Nitro formats
  let req: Request | EventHandlerRequest;

  if (opts.req) {
    req = opts.req;
  } else if (opts.event && opts.event.node && opts.event.node.req) {
    req = opts.event.node.req;
  } else {
    // Fallback if we can't find the request
    return {
      supabase,
      user: null,
      isAuthenticated: false,
    };
  }

  // Get the session from the request Authorization header
  let user: User | null = null;
  let authHeader: string | undefined | null;

  // Handle different req objects (H3/Nitro vs Fetch API)
  if (typeof req.headers?.get === 'function') {
    // Fetch API style request
    authHeader = req.headers.get('authorization');
  } else if (req.headers && typeof req.headers === 'object') {
    // H3/Nitro style request
    authHeader = req.headers.authorization || req.headers.Authorization;
  }

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const accessToken = parts[1];
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) {
        user = data.user;
      }
    }
  }

  return {
    req,
    supabase,
    user,
    // Flag to check if the user is authenticated
    isAuthenticated: !!user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
