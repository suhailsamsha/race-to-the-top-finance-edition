import { User } from 'firebase/auth';
import { AlertCircle, LogOut, ShieldCheck, Trophy, Users } from 'lucide-react';
import { PortalRole } from '../types/competition';

interface LoginScreenProps {
  user: User | null;
  isAdminAuthorized: boolean;
  signingInRole: PortalRole | null;
  authError: string | null;
  adminAccessDenied: boolean;
  onSignIn: (role: PortalRole) => void;
  onContinueAsUser: () => void;
  onSignOut: () => void;
}

export function LoginScreen({
  user,
  isAdminAuthorized,
  signingInRole,
  authError,
  adminAccessDenied,
  onSignIn,
  onContinueAsUser,
  onSignOut,
}: LoginScreenProps) {
  return (
    <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 text-2xl font-black text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            $
          </div>
          <h1 className="bg-gradient-to-r from-emerald-400 via-amber-400 to-sky-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Race to the Top - Finance Edition
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Official 8-Round Competition · Live Cloud Leaderboard &amp; Admin Console
          </p>
        </div>

        {/* Access Denied / Status Alerts */}
        {adminAccessDenied && user && (
          <div className="mb-6 rounded-2xl border border-amber-500/45 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white">Admin Authorization Required</h3>
                  <p className="mt-1 text-xs text-amber-200/90">
                    Signed in as <strong>{user.email}</strong>, which does not have Admin Console
                    permissions. You can continue directly to the User Live Leaderboard, or have an
                    existing admin authorize your UID:
                  </p>
                  <code className="font-mono-num mt-1.5 inline-block rounded bg-black/50 px-2 py-1 text-[11px] text-sky-300">
                    {user.uid}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onContinueAsUser}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                >
                  Open User Leaderboard
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {authError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-500/45 bg-rose-500/15 px-4 py-3 text-xs font-medium text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Dual Login Cards: User vs Admin */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* User Login Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-400/25 bg-[#0d1426]/92 p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/15 text-emerald-300">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-emerald-400">Participant &amp; Viewer</span>
              </div>

              <h2 className="mt-4 text-xl font-extrabold text-white">User Login</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Track the live Cosmos Flight Sector, auto-sorted squadron rankings, and round trophy
                awards in real time as points are allotted.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live-synced leaderboard &amp; squadron progress</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Full-screen Projector Mode &amp; audio chimes</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={signingInRole !== null}
              onClick={() => onSignIn('user')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              <span>
                {signingInRole === 'user'
                  ? 'Signing in...'
                  : user
                  ? 'Enter User Live Leaderboard'
                  : 'Sign in with Google as User'}
              </span>
            </button>
          </div>

          {/* Admin Login Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-400/30 bg-[#0d1426]/92 p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-amber-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-amber-400">Scorekeeper &amp; Host</span>
              </div>

              <h2 className="mt-4 text-xl font-extrabold text-white">Admin Login</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Open the Admin Command Console to allot 1st &amp; 2nd place points for all 8 rounds,
                edit squadrons, and broadcast live score updates.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Persistent round-by-round point allotment ledger</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Instant live broadcast to all connected User screens</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={signingInRole !== null}
              onClick={() => onSignIn('admin')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.3)] transition hover:brightness-110 disabled:opacity-60"
            >
              <span>
                {signingInRole === 'admin'
                  ? 'Verifying Admin...'
                  : user && isAdminAuthorized
                  ? 'Enter Admin Console'
                  : 'Sign in with Google as Admin'}
              </span>
            </button>
          </div>
        </div>

        {user && (
          <div className="mt-5 flex items-center justify-center gap-3 text-xs text-slate-400">
            <span>
              Currently signed in as <strong className="text-slate-200">{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 font-semibold text-sky-400 hover:underline"
            >
              <LogOut className="h-3 w-3" />
              <span>Switch Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
