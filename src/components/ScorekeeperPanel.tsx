import { useState } from 'react';
import { Award, ChevronDown, ChevronUp, Pencil, RotateCcw, Zap } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam, GameRound, RoundHistoryEntry } from '../types/competition';
import { RoundWorkbench } from './RoundWorkbench';

interface ScorekeeperPanelProps {
  teams: FinanceTeam[];
  scores: Record<string, number>;
  activeRound: GameRound;
  roundHistory: RoundHistoryEntry[];
  onSelectRound: (id: number) => void | Promise<void>;
  onAwardRound: (firstTeamId: string, secondTeamId: string) => boolean | Promise<boolean>;
  onQuickAllot: (teamId: string, place: 1 | 2) => void | Promise<void>;
  onAdjustFunds: (teamId: string, delta: number) => void | Promise<void>;
  onClearHistory: () => void | Promise<void>;
  onReset: () => void | Promise<void>;
  onEditTeam: (teamId: string) => void;
}

export function ScorekeeperPanel({
  teams,
  scores,
  activeRound,
  roundHistory,
  onSelectRound,
  onAwardRound,
  onQuickAllot,
  onAdjustFunds,
  onClearHistory,
  onReset,
  onEditTeam,
}: ScorekeeperPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const handleApplyCustom = (teamId: string) => {
    const raw = customAmounts[teamId];
    const parsed = parseInt(raw || '', 10);
    if (Number.isNaN(parsed) || parsed === 0) return;
    void onAdjustFunds(teamId, parsed);
    setCustomAmounts((prev) => ({ ...prev, [teamId]: '' }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1426]/92 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7)]">
      <div
        onClick={() => setCollapsed((c) => !c)}
        className="flex cursor-pointer items-center justify-between border-b border-white/10 px-5 py-3.5 select-none"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white sm:text-base">
            Admin Console · Scorekeeper &amp; Round Point Allotment
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void onReset();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/45 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:border-red-500 hover:bg-red-500/30"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset to $0</span>
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <span>{collapsed ? 'Show' : 'Hide'}</span>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="rounded-2xl border border-sky-400/35 bg-gradient-to-br from-slate-900/95 to-[#0a0f1e]/98 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-sky-400">
                Active: Round {activeRound.id} · {activeRound.name}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400">Click any round to switch &amp; award</span>
                <button
                  type="button"
                  onClick={() => void onReset()}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/45 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/30"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Competition</span>
                </button>
              </div>
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

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
            <table className="w-full min-w-[920px] border-collapse text-left text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                  <th className="px-3.5 py-2.5 font-semibold">Finance Squadron</th>
                  <th className="px-3.5 py-2.5 font-semibold">Commander</th>
                  <th className="px-3.5 py-2.5 font-semibold">Total Funds</th>
                  <th className="px-3.5 py-2.5 font-semibold">Round Win Badges</th>
                  <th className="px-3.5 py-2.5 font-semibold">Quick Allot (Active Rnd)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Adjust Funds</th>
                  <th className="px-3.5 py-2.5 font-semibold">Custom Amount</th>
                  <th className="px-3.5 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const score = scores[team.id] || 0;
                  const wins = team.roundWins || [];
                  return (
                    <tr
                      key={team.id}
                      className="border-b border-white/10 last:border-b-0 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: team.color,
                              boxShadow: `0 0 6px ${team.color}`,
                            }}
                          />
                          <strong className="font-bold text-white">{team.name}</strong>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-200">{team.leader}</td>
                      <td className="px-3.5 py-2.5">
                        <strong className="font-mono-num text-sm font-extrabold text-emerald-400">
                          {formatDollars(score)}
                        </strong>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {wins.length > 0 ? (
                            wins.map((w) => {
                              const isGold = w.place === 1;
                              return (
                                <span
                                  key={w.roundId}
                                  title={`R${w.roundId}: ${w.roundName}`}
                                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-extrabold ${
                                    isGold
                                      ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                      : 'border-slate-300/60 bg-slate-400/20 text-slate-100'
                                  }`}
                                >
                                  <Award className="h-3 w-3" />
                                  <span>
                                    R{w.roundId} {isGold ? '1st' : '2nd'}
                                  </span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-500">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => void onQuickAllot(team.id, 1)}
                            className="font-mono-num rounded-md border border-amber-500 bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/35"
                          >
                            1st (+{formatDollars(activeRound.first)})
                          </button>
                          <button
                            type="button"
                            onClick={() => void onQuickAllot(team.id, 2)}
                            className="font-mono-num rounded-md border border-slate-400 bg-slate-400/20 px-2 py-1 text-[11px] font-bold text-slate-200 transition hover:bg-slate-400/35"
                          >
                            2nd (+{formatDollars(activeRound.second)})
                          </button>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {[1000, 500, 100, -100].map((delta) => (
                            <button
                              key={delta}
                              type="button"
                              onClick={() => void onAdjustFunds(team.id, delta)}
                              className="font-mono-num rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-white/25"
                            >
                              {delta === 1000 ? '+1K' : delta > 0 ? `+${delta}` : delta}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="50"
                            placeholder="±Amt"
                            value={customAmounts[team.id] || ''}
                            onChange={(e) =>
                              setCustomAmounts((prev) => ({ ...prev, [team.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCustom(team.id);
                              }
                            }}
                            className="font-mono-num w-20 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-xs text-white focus:border-emerald-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCustom(team.id)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-500"
                          >
                            Apply
                          </button>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => onEditTeam(team.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-sky-300 transition hover:border-sky-400 hover:bg-sky-400/10"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
