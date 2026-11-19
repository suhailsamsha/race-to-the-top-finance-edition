export interface RoundWin {
  roundId: number;
  roundName: string;
  place: 1 | 2;
  amount: number;
  timestamp: number;
}

export interface FinanceTeam {
  id: string;
  name: string;
  leader: string;
  color: string;
  secondaryColor: string;
  roundWins: RoundWin[];
}

export interface GameRound {
  id: number;
  name: string;
  first: number;
  second: number;
  type: 'Challenge' | 'Case Study';
}

export interface RoundHistoryEntry {
  id?: string;
  roundId: number;
  roundName: string;
  teamId?: string;
  teamName: string;
  place: '1st' | '2nd' | 'adjust';
  amount: number;
  time: string;
}

export type PortalRole = 'user' | 'admin';
export type RoleView = 'audience' | 'scorekeeper' | 'leader';
