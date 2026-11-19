import { formatDollars } from '../constants/competition';
import { GameRound, PortalRole, RoleView } from '../types/competition';

interface RoleStatusBarProps {
  portalRole: PortalRole;
  canManage: boolean;
  currentRole: RoleView;
  activeRound: GameRound;
  campaignGoal: number;
  storageStatusText: string;
  storageFlash: boolean;
  userEmail: string | null;
  onSwitchRole: (role: RoleView) => void;
}

export function RoleStatusBar({
  portalRole,
  canManage,
  currentRole,
  activeRound,
  campaignGoal,
  storageStatusText,
  storageFlash,
  userEmail,
  onSwitchRole,
}: RoleStatusBarProps) {
  const roles: { id: RoleView; label: string }[] = [
    { id: 'scorekeeper', label: 'Admin Console' },
    { id: 'leader', label: 'Team Leader' },
    { id: 'audience', label: 'Leaderboard Only' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/25 bg-gradient-to-r from-[#0d1426]/95 to-[#10182e]/95 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        {canManage && portalRole === 'admin' ? (
          <div
            role="tablist"
            aria-label="Admin Workspace View"
            className="inline-flex gap-1 rounded-xl border border-white/10 bg-black/45 p-1"
          >
            {roles.map((r) => {
              const active = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onSwitchRole(r.id)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs font-bold text-emerald-300">
            User Live Tracking View
            {userEmail ? <span className="ml-2 font-normal text-slate-400">({userEmail})</span> : null}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-sky-200">
            Active: Round {activeRound.id} · {activeRound.name}
          </span>
          <span aria-hidden="true" className="text-slate-600">
            /
          </span>
          <span className="font-mono-num font-bold text-emerald-400">
            Stakes: 1st +{formatDollars(activeRound.first)} · 2nd +{formatDollars(activeRound.second)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span
          className={`transition-colors duration-300 ${
            storageFlash ? 'font-semibold text-emerald-300' : 'text-slate-400'
          }`}
        >
          {storageStatusText}
        </span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span>Firestore Real-Time</span>
        </span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        <span className="font-mono-num font-semibold text-slate-300">
          Goal: {formatDollars(campaignGoal)}
        </span>
      </div>
    </div>
  );
}
