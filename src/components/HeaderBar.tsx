import { useState } from 'react';
import {
  Lock,
  LogOut,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { PortalRole } from '../types/competition';

interface HeaderBarProps {
  portalRole: PortalRole;
  isAdminAuthorized: boolean;
  userEmail: string | null;
  audioEnabled: boolean;
  isDemoRunning: boolean;
  onToggleAudio: () => void;
  onEnterProjector: () => void;
  onToggleDemo: () => void;
  onReset: () => void;
  onOpenAdmin: () => void;
  onSwitchPortal: (role: PortalRole) => void;
  onSignOut: () => void;
}

export function HeaderBar({
  portalRole,
  isAdminAuthorized,
  userEmail,
  audioEnabled,
  isDemoRunning,
  onToggleAudio,
  onEnterProjector,
  onToggleDemo,
  onReset,
  onOpenAdmin,
  onSwitchPortal,
  onSignOut,
}: HeaderBarProps) {
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const handleReset = () => {
    onReset();
    setResetConfirmed(true);
    window.setTimeout(() => setResetConfirmed(false), 1800);
  };

  const isAdminMode = portalRole === 'admin' && isAdminAuthorized;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d1426]/92 px-5 py-3.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-lg font-extrabold text-emerald-300"
        >
          $
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-emerald-400 via-amber-400 to-sky-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-xl">
            Race to the Top - Finance Edition
          </h1>
          <p className="text-xs font-medium text-slate-400">
            {isAdminMode
              ? 'Admin Console · Real-Time Cloud Point Allotment'
              : 'Live User Leaderboard · Real-Time Broadcast Feed'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          Live Cloud Sync
        </span>

        <button
          type="button"
          onClick={onToggleAudio}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:brightness-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            audioEnabled
              ? 'border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-600 text-emerald-50 shadow-[0_0_14px_rgba(16,185,129,0.45)]'
              : 'border-white/10 bg-slate-900 text-slate-100 hover:border-white/25'
          }`}
        >
          {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{audioEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>

        <button
          type="button"
          onClick={onEnterProjector}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-white/25 hover:brightness-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Monitor className="h-3.5 w-3.5 text-slate-300" />
          <span>Projector Mode</span>
        </button>

        {isAdminMode && (
          <>
            <button
              type="button"
              onClick={onToggleDemo}
              title="Simulate live point awards and vessel movement in real time"
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:brightness-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                isDemoRunning
                  ? 'border-sky-400 bg-sky-500/25 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                  : 'border-sky-400/40 bg-sky-400/10 text-sky-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isDemoRunning ? 'Stop Demo Sim' : 'Live Demo Sim'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Reset all 5 teams back to $0, Round 1, and clear all badges"
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                resetConfirmed
                  ? 'border-emerald-400 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.55)]'
                  : 'border-red-500/55 bg-gradient-to-r from-red-500/20 to-red-700/25 text-red-200 hover:border-red-500 hover:text-white'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{resetConfirmed ? 'Reset Complete' : 'Reset to $0'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Admin Console</span>
            </button>
          </>
        )}

        {isAdminAuthorized && (
          <button
            type="button"
            onClick={() => onSwitchPortal(isAdminMode ? 'user' : 'admin')}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30"
          >
            {isAdminMode ? (
              <>
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>User View</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Console</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          title={userEmail ? `Signed in as ${userEmail}` : 'Sign out'}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
