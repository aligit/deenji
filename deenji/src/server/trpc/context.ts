// src/server/trpc/context.ts
import { H3Event } from 'h3';
import { createClient } from '@supabase/supabase-js';

// Create a helper to safely get authorization header from H3Event
const getAuthorizationHeader = (event: H3Event): string | undefined | null => {
  // Access headers through event.node.req.headers for H3
  if (event.node?.req?.headers) {
    return event.node.req.headers.authorization;
  }

  // If the event has headers with a get method (standard Request)
  if (event.headers && typeof event.headers.get === 'function') {
    return event.headers.get('authorization'); // Returns string | null
  }

  return undefined;
};

// Initialize Supabase client
const supabase = createClient(
  import.meta.env['VITE_supabaseUrl'] || '',
  import.meta.env['VITE_supabaseKey'] || ''
);

export async function createContext(event: H3Event) {
  // Get the authorization header
  const authorization = getAuthorizationHeader(event);

  // If there's no authorization header, return a context with no user
  if (!authorization) {
    return { user: null };
  }

  try {
    // Extract the JWT token (assuming Bearer token format)
    const token = authorization.replace('Bearer ', '');

    // Verify the token and get the user with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { user: null };
    }

    // Return the user in the context
    return { user: data.user };
  } catch (error) {
    console.error('Error verifying authentication token:', error);
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
