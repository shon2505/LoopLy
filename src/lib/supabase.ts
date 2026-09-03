import { createClient } from "@supabase/supabase-js";

/**
 * Returns the Supabase URL configured in the environment.
 * Checks SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL.
 */
export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || typeof url !== "string") {
    throw new Error("Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your .env");
  }
  return url.trim();
}

/**
 * Returns the Supabase Service Role Key configured in the environment.
 * CRITICAL: This is strictly server-side only.
 */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || typeof key !== "string") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in your .env");
  }
  return key.trim();
}

/**
 * Returns the Supabase Storage Bucket name.
 */
export function getSupabaseBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "bills";
}

/**
 * Creates an admin Supabase client using the Service Role Key.
 * MUST only be invoked from server-side code (API routes / server components).
 */
export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
