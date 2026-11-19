import { useEffect, useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam, GameRound } from '../types/competition';

interface CosmosArenaProps {
  sortedTeams: FinanceTeam[];
  scores: Record<string, number>;
  campaignGoal: number;
  activeRound: GameRound;
  lastAwardedBadgeKey: string | null;
  canEdit?: boolean;
  onSelectTeamToEdit?: (teamId: string) => void;
}

export function CosmosArena({
  sortedTeams,
  scores,
  campaignGoal,
  activeRound,
  lastAwardedBadgeKey,
  canEdit = false,
  onSelectTeamToEdit,
}: CosmosArenaProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 980, height: 420 });

  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        setStageSize({
          width: stageRef.current.clientWidth || 980,
          height: stageRef.current.clientHeight || 420,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const maxTrackSpan = Math.max(220, stageSize.width - 370);
  const laneHeight = stageSize.height / Math.max(sortedTeams.length, 1);

  return (
    <main className="relative flex min-h-[560px] flex-col gap-3.5 overflow-hidden rounded-3xl border border-emerald-400/25 bg-[radial-gradient(circle_at_50%_10%,#11222e_0%,#091322_45%,#030712_95%)] p-5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(16,185,129,0.08)]">
      {/* Celestial Emerald Planet */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 z-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle_at_45%_30%,#34d399_0%,#059669_35%,#0f172a_80%)] opacity-45 shadow-[0_-20px_80px_rgba(16,185,129,0.3)]"
      />

      {/* Finish Stargate Line */}
      <div
        aria-hidden="true"
        className="absolute bottom-5 right-7 top-5 z-[2] w-1.5 rounded-full bg-gradient-to-b from-pink-500 via-amber-500 to-emerald-400 shadow-[0_0_25px_rgba(245,158,11,0.8),0_0_45px_rgba(52,211,153,0.6)]"
      />
      <div className="absolute right-10 top-6 z-[3] rounded-md border border-amber-500/35 bg-black/65 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
        {formatDollars(campaignGoal)} Orbit
      </div>

      {/* Arena Top Bar & Standings Summary */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="bg-gradient-to-r from-white via-emerald-200 to-amber-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Race to the Top - Finance Edition
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-emerald-400">
              {sortedTeams.length} Finance Vessels in Flight
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-semibold text-sky-300">
              Round {activeRound.id}: {activeRound.name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pr-28 sm:pr-32">
          {sortedTeams.map((team, idx) => {
            const val = scores[team.id] || 0;
            const isLead = idx === 0 && val > 0;
            return (
              <div
                key={team.id}
                onClick={canEdit && onSelectTeamToEdit ? () => onSelectTeamToEdit(team.id) : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg border bg-slate-900/85 px-2.5 py-1 text-xs font-bold transition ${
                  canEdit ? 'cursor-pointer hover:border-white/30' : ''
                }`}
                style={{
                  borderColor: isLead ? '#f59e0b' : `${team.color}44`,
                }}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold"
                  style={{
                    backgroundColor: isLead ? '#f59e0b' : team.color,
                    color: isLead ? '#000' : '#fff',
                  }}
                >
                  {idx + 1}
                </span>
                <span className="max-w-[130px] truncate text-slate-100">{team.name}</span>
                <span className="font-mono-num text-emerald-400">{formatDollars(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle Orbit Grid Guidelines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 bottom-6 top-20 z-[1] flex justify-between opacity-20"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
          <div
            key={mark}
            className="flex h-full flex-col justify-end border-l border-dashed border-slate-500/50 pl-1.5"
          >
            <span className="font-mono-num text-[10px] text-slate-400">
              {formatDollars(Math.round(campaignGoal * mark))}
            </span>
          </div>
        ))}
      </div>

      {/* Free-Flight Space Stage */}
      <div ref={stageRef} className="relative z-[5] min-h-[420px] w-full flex-1">
        {sortedTeams.map((team, idx) => {
          const score = scores[team.id] || 0;
          const progress = Math.min(1, Math.max(0, score / campaignGoal));
          const xPos = 18 + progress * maxTrackSpan;
          const yPos = 14 + idx * laneHeight;
          const isLeader = idx === 0 && score > 0;
          const winsList = team.roundWins || [];

          return (
            <div
              key={team.id}
              onClick={canEdit && onSelectTeamToEdit ? () => onSelectTeamToEdit(team.id) : undefined}
              title={`${team.name} (Commander: ${team.leader})${canEdit ? ' · Click to edit' : ''}`}
              className={`group absolute z-10 flex items-center transition-[left,top] duration-700 ease-out ${
                canEdit ? 'cursor-pointer' : ''
              }`}
              style={{
                left: `${xPos}px`,
                top: `${yPos}px`,
              }}
            >
              {/* Winged Cash Vessel Hull */}
              <div className="relative flex h-[38px] w-[48px] shrink-0 items-center justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                <span
                  aria-hidden="true"
                  className="thruster-glow pointer-events-none absolute -left-2.5 top-1/2 h-2.5 w-3.5 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.92)_0%,rgba(56,189,248,0)_80%)]"
                />
                <svg width="48" height="36" viewBox="0 0 48 36" fill="none" aria-hidden="true">
                  <path d="M2 18L14 6V30L2 18Z" fill={team.secondaryColor} opacity="0.88" />
                  <path d="M46 18L34 6V30L46 18Z" fill={team.secondaryColor} opacity="0.88" />
                  <rect
                    x="10"
                    y="7"
                    width="28"
                    height="22"
                    rx="3.5"
                    fill="#0f172a"
                    stroke={team.color}
                    strokeWidth="2"
                  />
                  <circle
                    cx="24"
                    cy="18"
                    r="6"
                    fill="rgba(0,0,0,0.6)"
                    stroke={team.secondaryColor}
                    strokeWidth="1.2"
                  />
                  <text
                    x="24"
                    y="22.5"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    fill={isLeader ? '#f59e0b' : '#34d399'}
                    fontFamily="JetBrains Mono, system-ui, sans-serif"
                  >
                    $
                  </text>
                </svg>
              </div>

              {/* Vessel Telemetry HUD */}
              <div
                className={`ml-1.5 flex items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 py-1.5 backdrop-blur-md transition duration-200 ${
                  canEdit ? 'group-hover:scale-[1.03] group-hover:border-white/40' : ''
                } ${
                  isLeader
                    ? 'border-amber-500/75 bg-gradient-to-br from-amber-500/20 to-slate-900/95 shadow-[0_0_22px_rgba(245,158,11,0.4)]'
                    : 'border-white/15 bg-slate-900/92 shadow-[0_8px_24px_rgba(0,0,0,0.6)]'
                }`}
              >
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${
                    isLeader ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  #{idx + 1}
                </span>

                <div>
                  <div className="text-xs font-bold text-white sm:text-[13px]">{team.name}</div>
                  <div className="text-[11px] text-slate-400">Commander: {team.leader}</div>
                </div>

                <div className="border-l border-white/10 pl-2.5">
                  <div className="font-mono-num text-base font-extrabold text-emerald-400">
                    {formatDollars(score)}
                  </div>
                </div>

                {winsList.length > 0 && (
                  <div className="ml-0.5 flex items-center gap-1 border-l border-white/10 pl-2">
                    {winsList.map((w) => {
                      const isGold = w.place === 1;
                      const badgeKey = `${team.id}-r${w.roundId}`;
                      const shouldPop = lastAwardedBadgeKey === badgeKey;
                      return (
                        <span
                          key={w.roundId}
                          title={`Round ${w.roundId}: ${w.roundName} - ${
                            isGold ? '1st Place' : '2nd Place'
                          } (+${formatDollars(w.amount)})`}
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-extrabold transition hover:scale-105 ${
                            shouldPop ? 'badge-pop-animate' : ''
                          } ${
                            isGold
                              ? 'border-amber-500 bg-amber-500/25 text-amber-200'
                              : 'border-slate-300/60 bg-slate-400/20 text-slate-100'
                          }`}
                        >
                          <Award className="h-3 w-3" />
                          <span>R{w.roundId}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
