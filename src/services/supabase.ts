import { createClient } from '@supabase/supabase-js';

function readEnvValue(name: string) {
  const raw = (import.meta.env[name] as string | undefined)?.trim();
  if (!raw) return undefined;

  const withoutKey = raw.startsWith(`${name}=`) ? raw.slice(name.length + 1).trim() : raw;
  return withoutKey.replace(/^["']|["']$/g, '').trim();
}

const supabaseUrl = readEnvValue('VITE_SUPABASE_URL');
const supabaseAnonKey = readEnvValue('VITE_SUPABASE_ANON_KEY');

let configError = '';

function getValidSupabaseUrl(value: string | undefined) {
  if (!value) return null;
  const urlValue = value.includes('supabase.co') && !value.startsWith('http') ? `https://${value}` : value;

  try {
    const parsed = new URL(urlValue);
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
