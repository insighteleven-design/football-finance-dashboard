import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Browser-safe client (anon key). Used in client components and API routes
// that don't need elevated permissions.
export const supabase = url ? createClient(url, anon) : null as never;

// Server-only client (service role key). Import only inside API routes /
// server actions — never expose to the browser.
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
