import { useState } from 'react';
import { Award, Check, Trophy } from 'lucide-react';
import { GAME_ROUNDS, formatDollars } from '../constants/competition';
import { FinanceTeam, GameRound, RoundHistoryEntry } from '../types/competition';

interface RoundWorkbenchProps {
  teams: FinanceTeam[];
  scores: Record<string, number>;
  activeRound: GameRound;
  roundHistory: RoundHistoryEntry[];
  onSelectRound: (id: number) => void | Promise<void>;
  onAwardRound: (firstTeamId: string, secondTeamId: string) => boolean | Promise<boolean>;
  onClearHistory: () => void | Promise<void>;
}

export function RoundWorkbench({
  teams,
  scores,
  activeRound,
  roundHistory,
  onSelectRound,
  onAwardRound,
  onClearHistory,
}: RoundWorkbenchProps) {
  const [firstTeamId, setFirstTeamId] = useState<string>('');
  const [secondTeamId, setSecondTeamId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleAward = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const ok = await onAwardRound(firstTeamId, secondTeamId);
      if (ok) {
        setFirstTeamId('');
        setSecondTeamId('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GAME_ROUNDS.map((round) => {
          const isActive = round.id === activeRound.id;
          const isCase = round.type === 'Case Study';
          const hasWon = teams.some((t) =>
            (t.roundWins || []).some((w) => w.roundId === round.id)
          );

          return (
            <button
              key={round.id}
              type="button"
              onClick={() => void onSelectRound(round.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                isActive
                  ? 'border-sky-400 bg-gradient-to-br from-emerald-500/20 to-sky-500/20 shadow-[0_0_14px_rgba(56,189,248,0.22)]'
                  : hasWon
                  ? 'border-amber-500/55 bg-white/[0.03] hover:border-sky-400/60 hover:bg-sky-400/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-sky-400/50 hover:bg-sky-400/10'
              }`}
            >
              <span className="flex w-full items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
                <span>
                  Round {round.id} · {round.type}
                </span>
                {hasWon && <Check className="h-3.5 w-3.5 text-amber-400" />}
              </span>
              <span className="w-full truncate text-xs font-bold text-white" title={round.name}>
                {round.name}
              </span>
              <span
                className={`font-mono-num text-[11px] font-bold ${
                  isCase ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                1st: +{formatDollars(round.first)} | 2nd: +{formatDollars(round.second)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-black/40 p-4 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
              Award Winners For
            </span>
            <h3 className="text-base font-extrabold text-white">
              Round {activeRound.id}: {activeRound.name}
            </h3>
            <p className="font-mono-num text-xs text-slate-400">
              {activeRound.type} · 1st: +{formatDollars(activeRound.first)} | 2nd: +
              {formatDollars(activeRound.second)}
            </p>
          </div>

          <div className="mb-2 grid grid-cols-[96px_1fr_auto] items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-1 text-xs font-extrabold text-amber-400">
              <Award className="h-3.5 w-3.5" />
              <span>1st Place</span>
            </span>
            <select
              aria-label="Select 1st place squadron"
              value={firstTeamId}
              onChange={(e) => setFirstTeamId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#090d16] px-2.5 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">-- Choose Squadron --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({formatDollars(scores[t.id])})
                </option>
              ))}
            </select>
            <span className="font-mono-num min-w-[72px] text-right text-sm font-extrabold text-emerald-400">
              +{formatDollars(activeRound.first)}
            </span>
          </div>

          <div className="grid grid-cols-[96px_1fr_auto] items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-400/40 bg-slate-400/20 px-2 py-1 text-xs font-extrabold text-slate-200">
              <Award className="h-3.5 w-3.5" />
              <span>2nd Place</span>
            </span>
            <select
              aria-label="Select 2nd place squadron"
              value={secondTeamId}
              onChange={(e) => setSecondTeamId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#090d16] px-2.5 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">-- Choose Squadron --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({formatDollars(scores[t.id])})
                </option>
              ))}
            </select>
            <span className="font-mono-num min-w-[72px] text-right text-sm font-extrabold text-emerald-400">
              +{formatDollars(activeRound.second)}
            </span>
          </div>

          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleAward()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>
                {submitting ? 'Saving to Cloud...' : 'Award Round Victory Points & Badges'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFirstTeamId('');
                setSecondTeamId('');
              }}
              className="rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Round Award Log */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Round Award Log (Persisted)</span>
            <button
              type="button"
              onClick={() => void onClearHistory()}
              className="rounded-md border border-white/10 bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-300 transition hover:border-white/25"
            >
              Clear Log
            </button>
          </div>
          <div className="flex max-h-[205px] flex-col gap-1.5 overflow-y-auto pr-1">
            {roundHistory.length === 0 ? (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5 text-center text-xs text-slate-500">
                No round points awarded yet.
              </div>
            ) : (
              roundHistory.map((h, idx) => (
                <div
                  key={h.id || `${h.roundId}-${h.teamName}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
                >
                  <div>
                    <strong
                      className={
                        h.place === '1st'
                          ? 'text-amber-400'
                          : h.place === '2nd'
                          ? 'text-slate-300'
                          : 'text-sky-400'
                      }
                    >
                      {h.place === 'adjust' ? 'ADJ' : h.place} · R{h.roundId}
                    </strong>
                    <span className="ml-1.5 font-bold text-white">{h.teamName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-num font-extrabold ${
                        h.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {h.amount >= 0 ? `+${formatDollars(h.amount)}` : formatDollars(h.amount)}
                    </span>
                    <span className="font-mono-num text-[11px] text-slate-500">{h.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
