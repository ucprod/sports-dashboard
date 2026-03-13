/**
 * Supabase client initialization
 * Uses environment variables for configuration
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to your .env.local file with your Supabase project URL."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to your .env.local file with your Supabase anonymous key."
  );
}

// Log warning if service key is missing (optional but needed for server-side operations)
if (typeof window === "undefined" && !supabaseServiceKey) {
  console.warn(
    "[Supabase] SUPABASE_SERVICE_KEY not found. Server-side admin operations will not work. Add it to your .env.local if needed."
  );
}

/**
 * Client for browser usage (with RLS)
 * Use this for frontend queries
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client for server/API route usage (with service key)
 * Use this for backend jobs that need admin access
 * Only available in Node.js environment
 */
let supabaseServiceClient: any = null;

if (typeof window === "undefined" && supabaseServiceKey) {
  // Server-side only
  supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

export const supabaseAdmin = supabaseServiceClient;

// Export a helper function to get the appropriate client
export function getSupabaseClient(isAdmin = false) {
  if (isAdmin && supabaseServiceClient) {
    return supabaseServiceClient;
  }
  return supabaseClient;
}

// Health check
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from("teams")
      .select("id")
      .limit(1);

    if (error) {
      console.error("[Supabase] Connection error:", error);
      return false;
    }

    console.log("[Supabase] ✓ Connection successful");
    return true;
  } catch (error) {
    console.error("[Supabase] Connection failed:", error);
    return false;
  }
}
