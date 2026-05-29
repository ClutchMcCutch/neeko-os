import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { initialData } from '../data/mockData';
import { mergeOrderSheetInventory } from '../data/orderSheetInventory';
import { isSupabaseConfigured, supabase, workspaceId } from '../services/supabase';
import type { AppData } from '../types';

const STORAGE_KEY = 'neeko-eventos-data-v1';
const SAVED_AT_KEY = 'neeko-eventos-saved-at-v1';
const BACKUP_APP_ID = 'neeko-eventos';
const ORDER_SHEET_IMPORT_KEY = 'neeko-eventos-order-sheet-import-2026-05-27';
const ZERO_ON_HAND_MIGRATION_KEY = 'neeko-eventos-zero-on-hand-2026-05-27';

export type SyncStatus =
  | 'local'
  | 'auth-required'
  | 'connecting'
  | 'synced'
  | 'saving'
  | 'offline'
  | 'error';

interface WorkspaceBackup {
  app: typeof BACKUP_APP_ID;
  version: 1;
  exportedAt: string;
  data: AppData;
}

interface WorkspaceRow {
  id: string;
  data: Partial<AppData>;
  updated_at: string;
  updated_by: string | null;
}

function normalizeData(data: Partial<AppData>): AppData {
  return {
    events: Array.isArray(data.events) ? data.events : initialData.events,
    drinks: Array.isArray(data.drinks) ? data.drinks : initialData.drinks,
    inventory: Array.isArray(data.inventory) ? data.inventory : initialData.inventory,
    quotes: Array.isArray(data.quotes) ? data.quotes : initialData.quotes,
    leads: Array.isArray(data.leads) ? data.leads : initialData.leads,
  };
}

function zeroOnHand(data: AppData): AppData {
  return {
    ...data,
    inventory: data.inventory.map((item) => ({
      ...item,
      currentAmount: 0,
    })),
  };
}

function loadLocalData() {
  if (typeof window === 'undefined') {
    return initialData;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return initialData;
  }

  try {
    return normalizeData(JSON.parse(stored) as Partial<AppData>);
  } catch {
    return initialData;
  }
}

function saveLocalData(data: AppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const savedAt = new Date().toISOString();
  window.localStorage.setItem(SAVED_AT_KEY, savedAt);
  return savedAt;
}

export function usePersistentStore() {
  const [data, setDataState] = useState<AppData>(loadLocalData);
  const [lastSavedAt, setLastSavedAt] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem(SAVED_AT_KEY) ?? '';
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'connecting' : 'local',
  );
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured
      ? 'Connect with email to sync this workspace.'
      : 'Supabase is not configured. Saving locally only.',
  );
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionLoadKey, setSessionLoadKey] = useState(0);

  const dataRef = useRef(data);
  const cloudLoadedRef = useRef(false);
  const applyingRemoteRef = useRef(false);
  const saveTimerRef = useRef<number | undefined>(undefined);

  const setData: Dispatch<SetStateAction<AppData>> = useCallback((action) => {
    setDataState((current) => {
      const next = typeof action === 'function' ? action(current) : action;
      return normalizeData(next);
    });
  }, []);

  useEffect(() => {
    dataRef.current = data;
    setLastSavedAt(saveLocalData(data));
  }, [data]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus('local');
      setSyncMessage('Supabase is not configured. Saving locally only.');
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!mounted) return;

      if (error) {
        setSyncStatus('error');
        setSyncMessage(error.message);
        return;
      }

      const session = sessionData.session;
      setIsAuthenticated(Boolean(session));
      setUserEmail(session?.user.email ?? '');
      setSyncStatus(session ? 'connecting' : 'auth-required');
      setSyncMessage(session ? 'Loading shared workspace...' : 'Sign in to sync with your team.');
      if (session) {
        setSessionLoadKey((current) => current + 1);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setUserEmail(session?.user.email ?? '');

      if (!session) {
        cloudLoadedRef.current = false;
        setSyncStatus('auth-required');
        setSyncMessage('Sign in to sync with your team.');
        return;
      }

      if (!cloudLoadedRef.current) {
        setSyncStatus('connecting');
        setSyncMessage('Loading shared workspace...');
        setSessionLoadKey((current) => current + 1);
        return;
      }

      setSyncStatus((current) => (current === 'saving' ? current : 'synced'));
      setSyncMessage('Synced with Supabase.');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadCloudWorkspace() {
      setSyncStatus('connecting');
      setSyncMessage('Loading shared workspace...');

      const { data: row, error } = await client!
        .from('workspace_state')
        .select('id,data,updated_at,updated_by')
        .eq('id', workspaceId)
        .maybeSingle<WorkspaceRow>();

      if (cancelled) return;

      if (error) {
        setSyncStatus('error');
        setSyncMessage(
          error.message.includes('workspace_state')
            ? 'Run the Supabase setup SQL, then sign in again.'
            : error.message,
        );
        return;
      }

      cloudLoadedRef.current = true;

      if (row?.data) {
        applyingRemoteRef.current = true;
        setDataState(normalizeData(row.data));
        setLastSavedAt(row.updated_at);
        setSyncStatus('synced');
        setSyncMessage(row.updated_by ? `Synced from ${row.updated_by}` : 'Synced with Supabase.');
        return;
      }

      const { error: insertError } = await client!.from('workspace_state').upsert({
        id: workspaceId,
        data: dataRef.current,
      });

      if (insertError) {
        setSyncStatus('error');
        setSyncMessage(insertError.message);
        return;
      }

      setSyncStatus('synced');
      setSyncMessage('Shared workspace created in Supabase.');
    }

    void loadCloudWorkspace();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sessionLoadKey]);

  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated) {
      return;
    }

    const channel = client
      .channel(`workspace-state-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_state',
          filter: `id=eq.${workspaceId}`,
        },
        (payload) => {
          const row = payload.new as WorkspaceRow | null;
          if (!row?.data) return;

          applyingRemoteRef.current = true;
          setDataState(normalizeData(row.data));
          setLastSavedAt(row.updated_at);
          setSyncStatus('synced');
          setSyncMessage(row.updated_by ? `Synced from ${row.updated_by}` : 'Synced with Supabase.');
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus((current) => (current === 'saving' ? current : 'synced'));
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated || !cloudLoadedRef.current) {
      return;
    }

    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return;
    }

    setSyncStatus('saving');
    setSyncMessage('Saving shared workspace...');

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void client
        .from('workspace_state')
        .upsert({
          id: workspaceId,
          data: dataRef.current,
        })
        .then(({ error }) => {
          if (error) {
            setSyncStatus('error');
            setSyncMessage(error.message);
            return;
          }

          setSyncStatus('synced');
          setSyncMessage('Synced with Supabase.');
        });
    }, 650);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, isAuthenticated]);

  useEffect(() => {
    if (window.localStorage.getItem(ORDER_SHEET_IMPORT_KEY)) {
      return;
    }

    setData((current) => ({
      ...current,
      inventory: mergeOrderSheetInventory(current.inventory),
    }));
    window.localStorage.setItem(ORDER_SHEET_IMPORT_KEY, 'imported');
  }, [setData]);

  useEffect(() => {
    if (window.localStorage.getItem(ZERO_ON_HAND_MIGRATION_KEY)) {
      return;
    }

    setData((current) => zeroOnHand(current));
    window.localStorage.setItem(ZERO_ON_HAND_MIGRATION_KEY, 'complete');
  }, [setData]);

  const resetData = () => {
    setData(zeroOnHand(initialData));
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SAVED_AT_KEY);
    setLastSavedAt('');
  };

  const importData = (nextData: AppData) => {
    setData(normalizeData(nextData));
  };

  const importOrderSheet = () => {
    setData((current) => ({
      ...current,
      inventory: mergeOrderSheetInventory(current.inventory),
    }));
    window.localStorage.setItem(ORDER_SHEET_IMPORT_KEY, 'imported');
  };

  const signInWithEmail = async (email: string) => {
    if (!supabase) {
      setSyncStatus('local');
      setSyncMessage('Supabase is not configured.');
      return;
    }

    setSyncStatus('connecting');
    setSyncMessage('Sending sign-in link...');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setSyncStatus('error');
      setSyncMessage(error.message);
      return;
    }

    setSyncStatus('auth-required');
    setSyncMessage('Check your email for the Supabase sign-in link.');
  };

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      setSyncStatus('local');
      setSyncMessage('Supabase is not configured.');
      return;
    }

    setSyncStatus('connecting');
    setSyncMessage('Signing in...');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSyncStatus('error');
      setSyncMessage(error.message);
      return;
    }

    setSyncStatus('connecting');
    setSyncMessage('Loading shared workspace...');
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      setSyncStatus('local');
      setSyncMessage('Supabase is not configured.');
      return;
    }

    setSyncStatus('connecting');
    setSyncMessage('Creating account...');
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setSyncStatus('error');
      setSyncMessage(error.message);
      return;
    }

    if (signUpData.session) {
      setSyncStatus('connecting');
      setSyncMessage('Loading shared workspace...');
      return;
    }

    setSyncStatus('auth-required');
    setSyncMessage('Account created. Check email if Supabase requires confirmation, then sign in.');
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setSyncStatus('auth-required');
    setSyncMessage('Signed out. Local changes will stay on this browser.');
  };

  return {
    data,
    setData,
    resetData,
    importData,
    importOrderSheet,
    lastSavedAt,
    syncStatus,
    syncMessage,
    userEmail,
    isCloudConfigured: isSupabaseConfigured,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
}

export function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
}

export function createWorkspaceBackup(data: AppData): WorkspaceBackup {
  return {
    app: BACKUP_APP_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function serializeWorkspaceBackup(data: AppData) {
  return JSON.stringify(createWorkspaceBackup(data), null, 2);
}

export function parseWorkspaceBackup(raw: string): AppData {
  const parsed = JSON.parse(raw) as WorkspaceBackup | Partial<AppData>;

  if ('app' in parsed && parsed.app === BACKUP_APP_ID && 'data' in parsed) {
    return normalizeData(parsed.data);
  }

  return normalizeData(parsed as Partial<AppData>);
}
