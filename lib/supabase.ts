import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Server-only Supabase client (service_role key দিয়ে)।
 * এই key browser এ কখনো যায় না, কারণ NEXT_PUBLIC_ prefix নেই।
 * env সেট না থাকলে null দেয়, তাই build ভেঙে যায় না; পেজ ফাঁকা দেখায়।
 */
export function db(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
