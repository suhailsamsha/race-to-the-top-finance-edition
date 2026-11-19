import { FormEvent, useState } from 'react';
import { Lock, RotateCcw, ShieldPlus, X } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam, GameRound, RoundHistoryEntry } from '../types/competition';
import { RoundWorkbench } from './RoundWorkbench';

interface AdminModalProps {
  open: boolean;
  teams: FinanceTeam[];
  scores: Record<string, number>;
  activeRound: GameRound;
  roundHistory: RoundHistoryEntry[];
  adminUid: string | null;
  onClose: () => void;
  onSelectRound: (id: number) => void | Promise<void>;
  onAwardRound: (firstTeamId: string, secondTeamId: string) => boolean | Promise<boolean>;
  onAdjustFunds: (teamId: string, delta: number) => void | Promise<void>;
  onClearHistory: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
  onGrantAdminByUid: (uid: string) => Promise<boolean>;
}

export function AdminModal({
  open,
  teams,
  scores,
  activeRound,
  roundHistory,
  adminUid,
  onClose,
  onSelectRound,
  onAwardRound,
  onAdjustFunds,
  onClearHistory,
  onReset,
  onGrantAdminByUid,
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'rounds' | 'points' | 'access'>('rounds');
  const [uidInput, setUidInput] = useState('');
  const [grantStatus, setGrantStatus] = useState<string | null>(null);

  if (!open) return null;

  const handleGrant = async (e: FormEvent) => {
    e.preventDefault();
    setGrantStatus(null);
    const cleaned = uidInput.trim();
    if (!cleaned) return;
    const ok = await onGrantAdminByUid(cleaned);
    if (ok) {
      setGrantStatus(`Admin access granted to UID: ${cleaned}`);
      setUidInput('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Command Console"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="flex max-h-[90vh] w-full max-w-[840px] flex-col gap-4 overflow-y-auto rounded-2xl border border-sky-400/35 bg-[#0f172a] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-300">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Admin Command Console</h2>
              <p className="text-xs text-slate-400">
                Manage official 8 rounds, points allotment &amp; admin access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Console"
            className="rounded-lg border border-white/10 bg-slate-900 p-1.5 text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-black/45 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('rounds')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'rounds'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Official 8 Rounds
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'points'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team Scores &amp; Adjust
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'access'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Access
            </button>
          </div>

          <button
            type="button"
            onClick={() => void onReset()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/45 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to $0 (Clean Start)</span>
          </button>
        </div>

        {activeTab === 'rounds' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Round to Allot Points
            </div>
            <RoundWorkbench
              teams={teams}
              scores={scores}
              activeRound={activeRound}
              roundHistory={roundHistory}
              onSelectRound={onSelectRound}
              onAwardRound={onAwardRound}
              onClearHistory={onClearHistory}
            />
          </div>
        )}

        {activeTab === 'points' && (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                  <th className="px-3.5 py-2.5 font-semibold">Squadron</th>
                  <th className="px-3.5 py-2.5 font-semibold">Leader</th>
                  <th className="px-3.5 py-2.5 font-semibold">Current Balance</th>
                  <th className="px-3.5 py-2.5 font-semibold">Quick Add</th>
                  <th className="px-3.5 py-2.5 font-semibold">Deduct</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id} className="border-b border-white/10 last:border-b-0">
                    <td className="px-3.5 py-2.5 font-bold text-white">{t.name}</td>
                    <td className="px-3.5 py-2.5 text-slate-300">{t.leader}</td>
                    <td className="px-3.5 py-2.5">
                      <strong className="font-mono-num text-emerald-400">
                        {formatDollars(scores[t.id])}
                      </strong>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1.5">
                        {[1000, 500, 100].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => void onAdjustFunds(t.id, amt)}
                            className="font-mono-num rounded-md border border-white/10 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-100 transition hover:border-white/30"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        type="button"
                        onClick={() => void onAdjustFunds(t.id, -100)}
                        className="font-mono-num rounded-md border border-red-500/45 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
                      >
                        -100
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <div>
              <div className="text-xs font-bold text-slate-400">Your Admin UID</div>
              <code className="font-mono-num mt-1 inline-block rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-sky-300">
                {adminUid || 'Unavailable'}
              </code>
            </div>

            <form onSubmit={(e) => void handleGrant(e)} className="flex flex-col gap-2.5">
              <label htmlFor="grant-admin-uid" className="text-xs font-bold text-slate-300">
                Grant Admin Console Access to Another User (by Firebase UID)
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="grant-admin-uid"
                  type="text"
                  required
                  placeholder="Paste user UID shown on their Access Denied banner"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  className="font-mono-num flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                >
                  <ShieldPlus className="h-3.5 w-3.5" />
                  <span>Grant Admin</span>
                </button>
              </div>
              {grantStatus && <p className="text-xs font-semibold text-emerald-400">{grantStatus}</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
