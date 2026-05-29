import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

let configError = '';

function getValidSupabaseUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!parsed.hostname.includes('supabase.co')) {
      configError = 'VITE_SUPABASE_URL should be your Supabase project URL.';
      return null;
    }

    return parsed.origin;
  } catch {
    configError = 'VITE_SUPABASE_URL is not a valid URL.';
    return null;
  }
}

const validSupabaseUrl = getValidSupabaseUrl(supabaseUrl);

export const workspaceId = (import.meta.env.VITE_NEEKO_WORKSPACE_ID as string | undefined) ?? 'neeko';
export const supabaseConfigError = configError;
export const isSupabaseConfigured = Boolean(validSupabaseUrl && supabaseAnonKey);

export const supabase =
  isSupabaseConfigured && validSupabaseUrl
    ? createClient(validSupabaseUrl, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
