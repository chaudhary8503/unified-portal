import { createClient } from '@supabase/supabase-js';

/*
  Supabase connection. Values come from environment variables:
    - locally: a `.env.local` file in the project root (never committed)
    - on Vercel: Project Settings → Environment Variables
*/
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/*
  Session storage: same behaviour as the old prototype — stays signed in
  across refreshes, signs out when the tab is closed (safer on shared shop
  and factory computers). Wrapped because storage can be blocked.
*/
const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage unavailable — session lasts until refresh.
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Nothing to clear.
    }
  },
};

export const supabase = createClient(
  SUPABASE_URL ?? 'http://localhost:54321',
  SUPABASE_KEY ?? 'missing-key',
  {
    auth: {
      storage: safeSessionStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/** Shortcut for the `portal` schema (profiles, permissions, activity log). */
export const portal = () => supabase.schema('portal');

/** Turns any thrown/returned error into a readable sentence. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg) return msg;
  }
  return 'Something went wrong. Please try again.';
}
