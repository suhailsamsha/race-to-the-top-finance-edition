import { FinanceTeam, GameRound } from '../types/competition';

export const CAMPAIGN_GOAL = 10000;
export const STORAGE_KEY = 'race_to_the_top_finance_state_v1';
export const CHANNEL_NAME = 'apex_race_channel';

export const INITIAL_FINANCE_TEAMS: FinanceTeam[] = [
  {
    id: 'team-1',
    name: 'Financial Planning & Analysis',
    leader: 'Chloe Bennett',
    color: '#10b981',
    secondaryColor: '#06b6d4',
    roundWins: [],
  },
  {
    id: 'team-2',
    name: 'Accounts Receivable',
    leader: 'Siddharth R.',
    color: '#3b82f6',
    secondaryColor: '#6366f1',
    roundWins: [],
  },
  {
    id: 'team-3',
    name: 'Corporate Finance & Treasury',
    leader: 'Elena Rostova',
    color: '#f43f5e',
    secondaryColor: '#e11d48',
    roundWins: [],
  },
  {
    id: 'team-4',
    name: 'Accounts Payable',
    leader: 'Maya Lin',
    color: '#f59e0b',
    secondaryColor: '#f97316',
    roundWins: [],
  },
  {
    id: 'team-5',
    name: 'Financial Reporting',
    leader: 'Marcus Cole',
    color: '#a855f7',
    secondaryColor: '#ec4899',
    roundWins: [],
  },
];

export const INITIAL_SCORES: Record<string, number> = {
  'team-1': 0,
  'team-2': 0,
  'team-3': 0,
  'team-4': 0,
  'team-5': 0,
};

export const GAME_ROUNDS: GameRound[] = [
  { id: 1, name: 'Network champion', first: 100, second: 50, type: 'Challenge' },
  { id: 2, name: 'Case Study 1 - Master the Budget', first: 1000, second: 500, type: 'Case Study' },
  { id: 3, name: 'Count Down Challenge', first: 100, second: 50, type: 'Challenge' },
  { id: 4, name: 'Case Study 2 - The Cash Flow Challenge', first: 1000, second: 500, type: 'Case Study' },
  { id: 5, name: 'The Signature Hunt', first: 100, second: 50, type: 'Challenge' },
  { id: 6, name: 'Case Study 3 - Think Like a CFO', first: 1000, second: 500, type: 'Case Study' },
  { id: 7, name: 'Decode The Corporate Language', first: 100, second: 50, type: 'Challenge' },
  { id: 8, name: 'Revenue Short Fall Review Meeting', first: 1000, second: 500, type: 'Case Study' },
];

export function formatDollars(value: number | undefined): string {
  return '$' + (value || 0).toLocaleString();
}
