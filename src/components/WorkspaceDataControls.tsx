import { CheckCircle2, Cloud, Download, LogIn, LogOut, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import type { AppData } from '../types';
import { parseWorkspaceBackup, serializeWorkspaceBackup, type SyncStatus } from '../utils/storage';

interface WorkspaceDataControlsProps {
  data: AppData;
  lastSavedAt: string;
  syncStatus: SyncStatus;
  syncMessage: string;
  userEmail: string;
  isCloudConfigured: boolean;
  onImport: (data: AppData) => void;
  onReset: () => void;
  onSignIn: (email: string) => Promise<void>;
  onPasswordSignIn: (email: string, password: string) => Promise<void>;
  onPasswordSignUp: (email: string, password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export default function WorkspaceDataControls({
  data,
  lastSavedAt,
  syncStatus,
  syncMessage,
  userEmail,
  isCloudConfigured,
  onImport,
  onReset,
  onSignIn,
  onPasswordSignIn,
  onPasswordSignUp,
  onSignOut,
}: WorkspaceDataControlsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [password, setPassword] = useState('');
  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not saved yet';

  const exportWorkspace = () => {
    const blob = new Blob([serializeWorkspaceBackup(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `neeko-eventos-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Workspace exported');
  };

  const importWorkspace = async (file: File | undefined) => {
    if (!file) return;

    try {
      const imported = parseWorkspaceBackup(await file.text());
      onImport(imported);
      setMessage('Workspace imported');
    } catch {
      setMessage('Import failed. Use a Neeko EventOS JSON backup.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    if (password) {
      await onPasswordSignIn(email.trim(), password);
      return;
    }

    await onSignIn(email.trim());
  };

  const createAccount = async () => {
    if (!email.trim() || !password) {
      setMessage('Enter email and password first.');
      return;
    }

    await onPasswordSignUp(email.trim(), password);
  };

  const cloudTone =
    syncStatus === 'synced'
      ? 'text-neeko-mint'
      : syncStatus === 'saving' || syncStatus === 'connecting'
        ? 'text-neeko-gold'
        : syncStatus === 'error'
          ? 'text-neeko-rose'
          : 'text-stone-400';

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-3 text-sm text-stone-400 shadow-premium lg:mt-6">
      <div className="accent-rule -mx-3 -mt-3 mb-3" />
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-neeko-mint/25 bg-neeko-mint/10 text-neeko-mint">
          <Cloud size={16} />
        </span>
        <div>
          <p className="font-semibold text-stone-200">Workspace Memory</p>
          <p className="mt-1 leading-5">Sync with Supabase, plus local backup/export.</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-ink-950/45 p-2">
        <div className={`flex items-center gap-2 text-xs ${cloudTone}`}>
          <CheckCircle2 size={14} />
          {syncStatus === 'synced'
            ? 'Cloud synced'
            : syncStatus === 'saving'
              ? 'Saving cloud'
              : syncStatus === 'connecting'
                ? 'Connecting'
                : syncStatus === 'auth-required'
                  ? 'Sign in required'
                  : syncStatus === 'error'
                    ? 'Sync needs setup'
                    : 'Saved locally'}
        </div>
        <p className="mt-1 text-xs text-stone-500">{syncMessage}</p>
        <p className="mt-1 text-xs text-stone-500">Local backup: {lastSavedLabel}</p>
      </div>

      {isCloudConfigured && !userEmail ? (
        <form className="mt-3 space-y-2" onSubmit={submitSignIn}>
          <input
            className="field min-h-9 px-2 py-1.5 text-xs"
            type="email"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="field min-h-9 px-2 py-1.5 text-xs"
            type="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn-primary min-h-9 w-full justify-start px-2" type="submit">
            <LogIn size={16} />
            Sign in
          </button>
          <button className="btn-secondary min-h-9 w-full justify-start px-2" type="button" onClick={() => void createAccount()}>
            <LogIn size={16} />
            Create account
          </button>
          <button className="btn-ghost min-h-8 w-full justify-start px-2 text-xs" type="button" onClick={() => void onSignIn(email.trim())}>
            Send email link instead
          </button>
        </form>
      ) : null}

      {userEmail ? (
        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.035] p-2">
          <p className="truncate text-xs font-semibold text-stone-200">{userEmail}</p>
          <button className="btn-ghost mt-2 min-h-8 w-full justify-start px-2 text-xs" type="button" onClick={() => void onSignOut()}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void importWorkspace(event.target.files?.[0])}
      />
      <div className="mt-3 grid gap-2">
        <button className="btn-secondary min-h-9 justify-start px-2" type="button" onClick={exportWorkspace}>
          <Download size={16} />
          Export backup
        </button>
        <button className="btn-secondary min-h-9 justify-start px-2" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={16} />
          Import backup
        </button>
        <button className="btn-ghost min-h-9 justify-start px-2" type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset demo data
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-stone-500">{message}</p> : null}
    </section>
  );
}
