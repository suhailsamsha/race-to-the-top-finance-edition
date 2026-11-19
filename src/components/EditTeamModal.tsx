import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { formatDollars } from '../constants/competition';
import { FinanceTeam } from '../types/competition';

interface EditTeamModalProps {
  team: FinanceTeam | null;
  balance: number;
  onClose: () => void;
  onSave: (
    teamId: string,
    updates: { name: string; leader: string; color?: string }
  ) => boolean | Promise<boolean>;
}

export function EditTeamModal({ team, balance, onClose, onSave }: EditTeamModalProps) {
  const [name, setName] = useState('');
  const [leader, setLeader] = useState('');
  const [color, setColor] = useState('#10b981');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setLeader(team.leader);
      setColor(team.color || '#10b981');
    }
  }, [team]);

  if (!team) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    const trimmedLeader = leader.trim();
    if (!trimmedName || !trimmedLeader) return;
    setSaving(true);
    try {
      const ok = await onSave(team.id, {
        name: trimmedName,
        leader: trimmedLeader,
        color,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Squadron & Commander"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-2xl border border-sky-400/40 bg-[#0b1120] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/40 bg-sky-500/15 text-sky-300">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Edit Squadron &amp; Commander</h2>
              <p className="text-xs text-slate-400">Change squadron title and commander name</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg border border-white/10 bg-slate-900 p-1.5 text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="modal-edit-team-name"
              className="mb-1.5 block text-xs font-bold text-sky-400"
            >
              Squadron Name
            </label>
            <input
              id="modal-edit-team-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="modal-edit-leader-name"
              className="mb-1.5 block text-xs font-bold text-emerald-400"
            >
              Commander / Team Leader Name
            </label>
            <input
              id="modal-edit-leader-name"
              type="text"
              required
              autoComplete="off"
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label
                htmlFor="modal-edit-team-color"
                className="mb-1.5 block text-xs font-bold text-slate-400"
              >
                Hull Accent Color
              </label>
              <input
                id="modal-edit-team-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-black/50 p-0.5"
              />
            </div>

            <div className="flex-1">
              <div className="mb-1.5 text-xs font-bold text-slate-400">Current Balance</div>
              <div className="font-mono-num pt-1 text-lg font-black text-emerald-400">
                {formatDollars(balance)}
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2.5 border-t border-white/10 pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
