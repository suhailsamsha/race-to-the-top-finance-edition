import { FormEvent, useEffect, useState } from 'react';
import { Award, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam } from '../types/competition';

interface TeamLeaderPanelProps {
  teams: FinanceTeam[];
  sortedTeams: FinanceTeam[];
  scores: Record<string, number>;
  selectedLeaderTeamId: string;
  onSelectLeaderTeam: (id: string) => void;
  onUpdateTeam: (
    teamId: string,
    updates: { name: string; leader: string; color?: string }
  ) => boolean | Promise<boolean>;
}

export function TeamLeaderPanel({
  teams,
  sortedTeams,
  scores,
  selectedLeaderTeamId,
  onSelectLeaderTeam,
  onUpdateTeam,
}: TeamLeaderPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const selectedTeam = teams.find((t) => t.id === selectedLeaderTeamId) || teams[0];

  const [nameInput, setNameInput] = useState(selectedTeam?.name || '');
  const [leaderInput, setLeaderInput] = useState(selectedTeam?.leader || '');
  const [colorInput, setColorInput] = useState(selectedTeam?.color || '#10b981');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (selectedTeam) {
      setNameInput(selectedTeam.name);
      setLeaderInput(selectedTeam.leader);
      setColorInput(selectedTeam.color || '#10b981');
    }
  }, [selectedTeam]);

  if (!selectedTeam) return null;

  const rank = sortedTeams.findIndex((t) => t.id === selectedTeam.id) + 1;
  const teamScore = scores[selectedTeam.id] || 0;
  const leadScore = scores[sortedTeams[0]?.id] || 0;
  const gap = leadScore - teamScore;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    const trimmedLeader = leaderInput.trim();
    if (!trimmedName || !trimmedLeader) return;
    const ok = await onUpdateTeam(selectedTeam.id, {
      name: trimmedName,
      leader: trimmedLeader,
      color: colorInput,
    });
    if (ok) {
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 1500);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1426]/92 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.7)]">
      <div
        onClick={() => setCollapsed((c) => !c)}
        className="flex cursor-pointer items-center justify-between border-b border-white/10 px-5 py-3.5 select-none"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white sm:text-base">
            Team Leader Telemetry &amp; Registration Portal
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <span>{collapsed ? 'Show' : 'Hide'}</span>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {/* Squadron Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {teams.map((t) => {
              const isSelected = t.id === selectedTeam.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectLeaderTeam(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'border-white/10 bg-black/35 text-slate-300 hover:border-white/25'
                  }`}
                  style={{
                    borderColor: isSelected ? t.color : undefined,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.name}</span>
                  <span className="font-mono-num font-extrabold text-emerald-400">
                    {formatDollars(scores[t.id])}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4-Column Telemetry Summary */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Squadron Name
                </div>
                <div className="mt-1 text-base font-extrabold text-white">{selectedTeam.name}</div>
              </div>
              <div className="mt-1.5 text-xs text-sky-300">
                Commander: <strong className="text-white">{selectedTeam.leader}</strong>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Rank
              </div>
              <div
                className={`font-mono-num mt-1 text-2xl font-black ${
                  rank === 1 && teamScore > 0 ? 'text-amber-400' : 'text-white'
                }`}
              >
                #{rank}{' '}
                <span className="text-xs font-semibold text-slate-400">of {teams.length}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Funds &amp; Round Wins
              </div>
              <div className="font-mono-num mt-1 text-2xl font-black text-emerald-400">
                {formatDollars(teamScore)}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(selectedTeam.roundWins || []).length > 0 ? (
                  selectedTeam.roundWins.map((w) => (
                    <span
                      key={w.roundId}
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-extrabold ${
                        w.place === 1
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-slate-300/60 bg-slate-400/20 text-slate-100'
                      }`}
                    >
                      <Award className="h-3 w-3" />
                      <span>
                        R{w.roundId} {w.place === 1 ? '1st' : '2nd'}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No round wins yet</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gap to 1st Place
              </div>
              <div
                className={`font-mono-num mt-1 text-xl font-extrabold ${
                  gap === 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {gap === 0
                  ? teamScore > 0
                    ? 'P1 Leader'
                    : 'Tied ($0)'
                  : `-${formatDollars(gap)}`}
              </div>
            </div>
          </div>

          {/* Update Squadron Form */}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_96px_auto]"
          >
            <div>
              <label
                htmlFor="leader-squadron-name"
                className="mb-1 block text-xs font-bold text-slate-400"
              >
                Squadron Name
              </label>
              <input
                id="leader-squadron-name"
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="leader-commander-name"
                className="mb-1 block text-xs font-bold text-slate-400"
              >
                Commander Name
              </label>
              <input
                id="leader-commander-name"
                type="text"
                required
                autoComplete="off"
                value={leaderInput}
                onChange={(e) => setLeaderInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="leader-hull-color"
                className="mb-1 block text-xs font-bold text-slate-400"
              >
                Hull Color
              </label>
              <input
                id="leader-hull-color"
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="h-9.5 w-full cursor-pointer rounded-lg border border-white/10 bg-black/50 p-0.5"
              />
            </div>

            <button
              type="submit"
              className={`rounded-lg px-5 py-2.5 text-xs font-bold text-white transition ${
                savedFeedback
                  ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.35)] hover:brightness-110'
              }`}
            >
              {savedFeedback ? 'Updated' : 'Update Squadron'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
