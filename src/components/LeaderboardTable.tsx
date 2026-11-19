import { Award, Pencil, Trophy } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam } from '../types/competition';

interface LeaderboardTableProps {
  sortedTeams: FinanceTeam[];
  scores: Record<string, number>;
  campaignGoal: number;
  canEdit?: boolean;
  onEditTeam?: (teamId: string) => void;
}

export function LeaderboardTable({
  sortedTeams,
  scores,
  campaignGoal,
  canEdit = false,
  onEditTeam,
}: LeaderboardTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1426]/92 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.015] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h2 className="text-base font-extrabold tracking-tight text-white">
            Official Leaderboard Standings &amp; Round Badges
          </h2>
          <span className="text-xs font-medium text-emerald-400">· Live Auto-Sorted</span>
        </div>
        <div className="text-xs text-slate-400">
          Target Orbit:{' '}
          <strong className="font-mono-num text-emerald-400">{formatDollars(campaignGoal)}</strong>{' '}
          Finish Stargate
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs sm:text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                <th className="w-16 px-3.5 py-2.5 text-center font-semibold">Rank</th>
                <th className="px-3.5 py-2.5 font-semibold">Finance Squadron</th>
                <th className="px-3.5 py-2.5 font-semibold">Commander</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Total Cash Raised</th>
                <th className="px-3.5 py-2.5 font-semibold">Flight Progress</th>
                <th className="px-3.5 py-2.5 font-semibold">Round Win Trophies</th>
                {canEdit && <th className="px-3.5 py-2.5 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => {
                const score = scores[team.id] || 0;
                const pct = Math.min(100, Math.round((score / campaignGoal) * 100));
                const isLead = idx === 0 && score > 0;
                const wins = team.roundWins || [];

                return (
                  <tr
                    key={team.id}
                    className="border-b border-white/10 last:border-b-0 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-3.5 py-2.5 text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                          isLead ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
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
                    <td className="px-3.5 py-2.5 text-right">
                      <strong className="font-mono-num text-sm font-extrabold text-emerald-400">
                        {formatDollars(score)}
                      </strong>
                    </td>
                    <td className="w-52 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${team.color}, #34d399)`,
                            }}
                          />
                        </div>
                        <span className="font-mono-num min-w-[34px] text-right text-xs font-bold text-slate-400">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {wins.length > 0 ? (
                          wins.map((w) => {
                            const isGold = w.place === 1;
                            return (
                              <span
                                key={w.roundId}
                                title={`Round ${w.roundId}: ${w.roundName} (+${formatDollars(w.amount)})`}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${
                                  isGold
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                    : 'border-slate-300/60 bg-slate-400/20 text-slate-100'
                                }`}
                              >
                                <Award className="h-3 w-3" />
                                <span>
                                  {isGold ? '1st' : '2nd'} · R{w.roundId}
                                </span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-500">No trophies yet</span>
                        )}
                      </div>
                    </td>
                    {canEdit && onEditTeam && (
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
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
