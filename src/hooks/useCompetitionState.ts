import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  CAMPAIGN_GOAL,
  GAME_ROUNDS,
  INITIAL_FINANCE_TEAMS,
  formatDollars,
} from '../constants/competition';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  FinanceTeam,
  GameRound,
  PortalRole,
  RoleView,
  RoundHistoryEntry,
  RoundWin,
} from '../types/competition';
import { soundEngine } from '../utils/audio';

interface UseCompetitionStateParams {
  user: User | null;
  portalRole: PortalRole | null;
  isAdminAuthorized: boolean;
}

interface FirestoreAwardDoc {
  roundId: number;
  roundName: string;
  teamId: string;
  teamName: string;
  place: '1st' | '2nd' | 'adjust';
  amount: number;
  awardedBy: string;
  createdAt?: Timestamp | null;
}

function buildBaselineTeams(): FinanceTeam[] {
  return INITIAL_FINANCE_TEAMS.map((t) => ({ ...t, roundWins: [] }));
}

function buildBaselineScores(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of INITIAL_FINANCE_TEAMS) {
    map[t.id] = 0;
  }
  return map;
}

export function useCompetitionState({
  user,
  portalRole,
  isAdminAuthorized,
}: UseCompetitionStateParams) {
  const [rawTeams, setRawTeams] = useState<FinanceTeam[]>(buildBaselineTeams);
  const [scores, setScores] = useState<Record<string, number>>(buildBaselineScores);
  const [activeRoundId, setActiveRoundId] = useState<number>(1);
  const [campaignGoal, setCampaignGoal] = useState<number>(CAMPAIGN_GOAL);
  const [awardDocs, setAwardDocs] = useState<(FirestoreAwardDoc & { id: string })[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<RoleView>(
    portalRole === 'admin' ? 'scorekeeper' : 'audience'
  );
  const [selectedLeaderTeamId, setSelectedLeaderTeamId] = useState<string>('team-1');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [projectorMode, setProjectorMode] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [lastAwardedBadgeKey, setLastAwardedBadgeKey] = useState<string | null>(null);
  const [confettiSeed, setConfettiSeed] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageStatusText, setStorageStatusText] = useState<string>('Firestore Live Sync');
  const [storageFlash, setStorageFlash] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  const toastTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const prevScoresRef = useRef<Record<string, number> | null>(null);
  const seededAttemptedRef = useRef<boolean>(false);

  const canManage = Boolean(user && isAdminAuthorized && portalRole === 'admin');

  // Keep workspace role synced when switching between User and Admin portals
  useEffect(() => {
    if (portalRole === 'admin' && isAdminAuthorized) {
      setCurrentRole('scorekeeper');
    } else {
      setCurrentRole('audience');
      setAdminModalOpen(false);
      setEditingTeamId(null);
    }
  }, [portalRole, isAdminAuthorized]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const flashSavedIndicator = useCallback((customText?: string) => {
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setStorageStatusText(customText || `Cloud Synced (${now})`);
    setStorageFlash(true);
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setStorageFlash(false);
    }, 1200);
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfettiSeed((s) => s + 1);
  }, []);

  const reportOperationError = useCallback(
    (error: unknown, op: OperationType, path: string, friendlyFallback: string) => {
      try {
        handleFirestoreError(error, op, path);
      } catch (wrapped) {
        const msg = wrapped instanceof Error ? wrapped.message : friendlyFallback;
        setSyncError(msg);
        showToast(friendlyFallback);
      }
    },
    [showToast]
  );

  // Idempotent first-time initialization ONLY for missing documents (never overwrites existing data)
  const ensureInitialFirestoreData = useCallback(async () => {
    if (!user || !isAdminAuthorized || seededAttemptedRef.current) return;
    seededAttemptedRef.current = true;

    try {
      const compRef = doc(db, 'competition', 'main');
      const compSnap = await getDoc(compRef);
      const teamsQuery = query(collection(db, 'teams'), where('score', '>=', 0));
      const teamsSnap = await getDocs(teamsQuery);

      const existingIds = new Set<string>();
      teamsSnap.forEach((d) => existingIds.add(d.id));

      const needsComp = !compSnap.exists();
      const missingTeams = INITIAL_FINANCE_TEAMS.filter((t) => !existingIds.has(t.id));

      if (needsComp || missingTeams.length > 0) {
        const batch = writeBatch(db);
        if (needsComp) {
          batch.set(compRef, {
            activeRoundId: 1,
            campaignGoal: CAMPAIGN_GOAL,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          });
        }
        for (const t of missingTeams) {
          batch.set(doc(db, 'teams', t.id), {
            id: t.id,
            name: t.name,
            leader: t.leader,
            color: t.color,
            secondaryColor: t.secondaryColor,
            score: 0,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
        flashSavedIndicator('Cloud Database Ready');
      }
    } catch (error) {
      seededAttemptedRef.current = false;
      reportOperationError(
        error,
        OperationType.WRITE,
        'competition/main',
        'Could not initialize Firestore competition state.'
      );
    }
  }, [user, isAdminAuthorized, flashSavedIndicator, reportOperationError]);

  useEffect(() => {
    if (canManage) {
      void ensureInitialFirestoreData();
    }
  }, [canManage, ensureInitialFirestoreData]);

  // Attach real-time Firestore listeners ONLY when authenticated
  useEffect(() => {
    if (!user) {
      setDataLoaded(false);
      prevScoresRef.current = null;
      seededAttemptedRef.current = false;
      return;
    }

    setSyncError(null);

    const unsubComp = onSnapshot(
      doc(db, 'competition', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.activeRoundId === 'number') {
            setActiveRoundId(data.activeRoundId);
          }
          if (typeof data.campaignGoal === 'number') {
            setCampaignGoal(data.campaignGoal);
          }
          flashSavedIndicator();
        }
      },
      (error) => {
        reportOperationError(
          error,
          OperationType.GET,
          'competition/main',
          'Lost live sync on competition configuration.'
        );
      }
    );

    // Must include where('score', '>=', 0) to satisfy Firestore allow list security rule
    const teamsQuery = query(collection(db, 'teams'), where('score', '>=', 0));
    const unsubTeams = onSnapshot(
      teamsQuery,
      (snap) => {
        if (snap.empty) {
          setRawTeams(buildBaselineTeams());
          setScores(buildBaselineScores());
          setDataLoaded(true);
          return;
        }

        const loadedTeams: FinanceTeam[] = [];
        const loadedScores: Record<string, number> = {};
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const teamId = (d.id as string) || docSnap.id;
          loadedTeams.push({
            id: teamId,
            name: (d.name as string) || 'Squadron',
            leader: (d.leader as string) || 'Commander',
            color: (d.color as string) || '#10b981',
            secondaryColor: (d.secondaryColor as string) || '#06b6d4',
            roundWins: [],
          });
          loadedScores[teamId] = typeof d.score === 'number' ? d.score : 0;
        });

        loadedTeams.sort((a, b) => a.id.localeCompare(b.id));

        // Detect live score increases for audio chime & confetti on User & Admin screens
        if (prevScoresRef.current !== null) {
          let increased = false;
          let crossedGoal = false;
          for (const id of Object.keys(loadedScores)) {
            const prevVal = prevScoresRef.current[id] ?? 0;
            const nextVal = loadedScores[id] ?? 0;
            if (nextVal > prevVal) {
              increased = true;
              if (nextVal >= CAMPAIGN_GOAL && prevVal < CAMPAIGN_GOAL) {
                crossedGoal = true;
              }
            }
          }
          if (crossedGoal) {
            triggerConfetti();
            soundEngine.playFanfare();
          } else if (increased) {
            soundEngine.playCashChime();
          }
        }
        prevScoresRef.current = loadedScores;

        setRawTeams(loadedTeams);
        setScores(loadedScores);
        setDataLoaded(true);
        flashSavedIndicator();
      },
      (error) => {
        reportOperationError(
          error,
          OperationType.LIST,
          'teams',
          'Lost live sync on teams leaderboard.'
        );
      }
    );

    // Must include where('roundId', '>=', 1) to satisfy Firestore allow list security rule (sorted client-side to avoid composite index requirement)
    const awardsQuery = query(collection(db, 'roundAwards'), where('roundId', '>=', 1));
    const unsubAwards = onSnapshot(
      awardsQuery,
      (snap) => {
        const list: (FirestoreAwardDoc & { id: string })[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as FirestoreAwardDoc;
          list.push({ id: docSnap.id, ...d });
        });

        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
          return tB - tA;
        });

        const bounded = list.slice(0, 100);
        setAwardDocs(bounded);
        if (bounded.length > 0) {
          const latest = bounded[0];
          if (latest.place === '1st' || latest.place === '2nd') {
            setLastAwardedBadgeKey(`${latest.teamId}-r${latest.roundId}`);
          }
        }
        flashSavedIndicator();
      },
      (error) => {
        reportOperationError(
          error,
          OperationType.LIST,
          'roundAwards',
          'Lost live sync on round awards ledger.'
        );
      }
    );

    return () => {
      unsubComp();
      unsubTeams();
      unsubAwards();
    };
  }, [user, flashSavedIndicator, triggerConfetti, reportOperationError]);

  // Listen to fullscreen exit so projector state stays in sync
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && projectorMode) {
        setProjectorMode(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [projectorMode]);

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        window.clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  // Derive roundWins per team from persisted Firestore roundAwards ledger
  const teams: FinanceTeam[] = useMemo(() => {
    const winsByTeam: Record<string, Map<number, RoundWin>> = {};
    for (const award of awardDocs) {
      if (award.place !== '1st' && award.place !== '2nd') continue;
      if (!winsByTeam[award.teamId]) {
        winsByTeam[award.teamId] = new Map();
      }
      if (!winsByTeam[award.teamId].has(award.roundId)) {
        winsByTeam[award.teamId].set(award.roundId, {
          roundId: award.roundId,
          roundName: award.roundName,
          place: award.place === '1st' ? 1 : 2,
          amount: award.amount,
          timestamp: award.createdAt?.toMillis ? award.createdAt.toMillis() : Date.now(),
        });
      }
    }

    return rawTeams.map((t) => ({
      ...t,
      roundWins: Array.from(winsByTeam[t.id]?.values() || []),
    }));
  }, [rawTeams, awardDocs]);

  const roundHistory: RoundHistoryEntry[] = useMemo(() => {
    return awardDocs.slice(0, 40).map((a) => ({
      id: a.id,
      roundId: a.roundId,
      roundName: a.roundName,
      teamId: a.teamId,
      teamName: a.teamName,
      place: a.place,
      amount: a.amount,
      time: a.createdAt?.toDate
        ? a.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Saved',
    }));
  }, [awardDocs]);

  const activeRound: GameRound = useMemo(
    () => GAME_ROUNDS.find((r) => r.id === activeRoundId) || GAME_ROUNDS[0],
    [activeRoundId]
  );

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)),
    [teams, scores]
  );

  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    soundEngine.setEnabled(next);
    setAudioEnabled(next);
    if (next) {
      soundEngine.playCashChime();
      showToast('Real-time Web Audio Synthesizer Active');
    } else {
      showToast('Sound Muted');
    }
  }, [audioEnabled, showToast]);

  const toggleProjector = useCallback((on: boolean) => {
    setProjectorMode(on);
    if (on && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!on && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const switchRole = useCallback(
    (role: RoleView) => {
      if (!canManage && role !== 'audience') {
        showToast('Admin authorization required for Scorekeeper or Team Leader controls.');
        return;
      }
      setCurrentRole(role);
      const label =
        role === 'leader'
          ? 'Team Leader'
          : role === 'scorekeeper'
          ? 'Admin Console'
          : 'Leaderboard Only';
      showToast(`Switched to ${label}`);
    },
    [canManage, showToast]
  );

  // Admin: Switch active round in Firestore
  const selectRound = useCallback(
    async (id: number) => {
      if (!user || !canManage) return;
      const safeRoundId = Math.min(8, Math.max(1, Math.trunc(id)));
      try {
        await runTransaction(db, async (tx) => {
          const compRef = doc(db, 'competition', 'main');
          const compSnap = await tx.get(compRef);
          if (!compSnap.exists()) {
            tx.set(compRef, {
              activeRoundId: safeRoundId,
              campaignGoal: Math.trunc(campaignGoal),
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          } else {
            tx.update(compRef, {
              activeRoundId: safeRoundId,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          }
        });
        const round = GAME_ROUNDS.find((r) => r.id === safeRoundId) || GAME_ROUNDS[0];
        showToast(`Active Round saved: Round ${round.id}: ${round.name}`);
        soundEngine.playCoinDrop();
      } catch (error) {
        reportOperationError(
          error,
          OperationType.WRITE,
          'competition/main',
          'Failed to switch active round in Firestore.'
        );
      }
    },
    [user, canManage, campaignGoal, showToast, reportOperationError]
  );

  // Admin: Atomic transaction to allot 1st & 2nd round points and save round awards
  const awardRoundPoints = useCallback(
    async (firstTeamId: string, secondTeamId: string): Promise<boolean> => {
      if (!user || !canManage) {
        showToast('Only authorized Admins can allot points.');
        return false;
      }
      if (!firstTeamId && !secondTeamId) {
        showToast('Please select at least 1st or 2nd place squadron.');
        return false;
      }
      if (firstTeamId && secondTeamId && firstTeamId === secondTeamId) {
        showToast('One squadron cannot take both 1st and 2nd in the same round.');
        return false;
      }

      const round = activeRound;
      const summary: string[] = [];

      try {
        await runTransaction(db, async (tx) => {
          const compRef = doc(db, 'competition', 'main');
          const compSnap = await tx.get(compRef);

          const teamIdsToUpdate = [firstTeamId, secondTeamId].filter(Boolean);
          const teamSnaps: Record<string, { exists: boolean; data: Record<string, unknown> }> = {};

          for (const tid of teamIdsToUpdate) {
            const snap = await tx.get(doc(db, 'teams', tid));
            teamSnaps[tid] = {
              exists: snap.exists(),
              data: snap.exists() ? snap.data() : {},
            };
          }

          if (firstTeamId) {
            const base = INITIAL_FINANCE_TEAMS.find((t) => t.id === firstTeamId);
            const curData = teamSnaps[firstTeamId];
            const curScore =
              typeof curData.data.score === 'number' ? Math.trunc(curData.data.score) : 0;
            const tName = (curData.data.name as string) || base?.name || 'Squadron';
            const nextScore = Math.max(0, curScore + Math.trunc(round.first));

            if (!curData.exists && base) {
              tx.set(doc(db, 'teams', firstTeamId), {
                id: base.id,
                name: base.name,
                leader: base.leader,
                color: base.color,
                secondaryColor: base.secondaryColor,
                score: nextScore,
                updatedAt: serverTimestamp(),
              });
            } else {
              tx.update(doc(db, 'teams', firstTeamId), {
                score: nextScore,
                updatedAt: serverTimestamp(),
              });
            }

            const awardRef = doc(collection(db, 'roundAwards'));
            tx.set(awardRef, {
              roundId: Math.trunc(round.id),
              roundName: round.name,
              teamId: firstTeamId,
              teamName: tName,
              place: '1st',
              amount: Math.trunc(round.first),
              awardedBy: user.uid,
              createdAt: serverTimestamp(),
            });
            summary.push(`1st: ${tName} (+${formatDollars(round.first)})`);
          }

          if (secondTeamId) {
            const base = INITIAL_FINANCE_TEAMS.find((t) => t.id === secondTeamId);
            const curData = teamSnaps[secondTeamId];
            const curScore =
              typeof curData.data.score === 'number' ? Math.trunc(curData.data.score) : 0;
            const tName = (curData.data.name as string) || base?.name || 'Squadron';
            const nextScore = Math.max(0, curScore + Math.trunc(round.second));

            if (!curData.exists && base) {
              tx.set(doc(db, 'teams', secondTeamId), {
                id: base.id,
                name: base.name,
                leader: base.leader,
                color: base.color,
                secondaryColor: base.secondaryColor,
                score: nextScore,
                updatedAt: serverTimestamp(),
              });
            } else {
              tx.update(doc(db, 'teams', secondTeamId), {
                score: nextScore,
                updatedAt: serverTimestamp(),
              });
            }

            const awardRef = doc(collection(db, 'roundAwards'));
            tx.set(awardRef, {
              roundId: Math.trunc(round.id),
              roundName: round.name,
              teamId: secondTeamId,
              teamName: tName,
              place: '2nd',
              amount: Math.trunc(round.second),
              awardedBy: user.uid,
              createdAt: serverTimestamp(),
            });
            summary.push(`2nd: ${tName} (+${formatDollars(round.second)})`);
          }

          const nextRoundId = round.id < GAME_ROUNDS.length ? round.id + 1 : round.id;
          if (!compSnap.exists()) {
            tx.set(compRef, {
              activeRoundId: nextRoundId,
              campaignGoal: Math.trunc(campaignGoal),
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          } else {
            tx.update(compRef, {
              activeRoundId: nextRoundId,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          }
        });

        setSyncError(null);
        showToast(`Saved Round ${round.id}: ${summary.join(' & ')}`);
        return true;
      } catch (error) {
        reportOperationError(
          error,
          OperationType.WRITE,
          'roundAwards',
          'Failed to save round allotment to Firestore.'
        );
        return false;
      }
    },
    [user, canManage, activeRound, campaignGoal, showToast, reportOperationError]
  );

  // Admin: Quick-allot 1st or 2nd place for a single team
  const quickAllot = useCallback(
    async (teamId: string, place: 1 | 2) => {
      if (!user || !canManage) return;
      const round = activeRound;
      const pts = Math.trunc(place === 1 ? round.first : round.second);

      try {
        let teamDisplayName = 'Squadron';
        await runTransaction(db, async (tx) => {
          const teamRef = doc(db, 'teams', teamId);
          const snap = await tx.get(teamRef);
          const base = INITIAL_FINANCE_TEAMS.find((t) => t.id === teamId);
          const curScore =
            snap.exists() && typeof snap.data().score === 'number'
              ? Math.trunc(snap.data().score)
              : 0;
          teamDisplayName = (snap.exists() ? (snap.data().name as string) : base?.name) || 'Squadron';

          if (!snap.exists() && base) {
            tx.set(teamRef, {
              id: base.id,
              name: base.name,
              leader: base.leader,
              color: base.color,
              secondaryColor: base.secondaryColor,
              score: Math.max(0, curScore + pts),
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(teamRef, {
              score: Math.max(0, curScore + pts),
              updatedAt: serverTimestamp(),
            });
          }

          tx.set(doc(collection(db, 'roundAwards')), {
            roundId: Math.trunc(round.id),
            roundName: round.name,
            teamId,
            teamName: teamDisplayName,
            place: place === 1 ? '1st' : '2nd',
            amount: pts,
            awardedBy: user.uid,
            createdAt: serverTimestamp(),
          });
        });

        setSyncError(null);
        showToast(
          `Saved Round ${round.id} ${place === 1 ? '1st' : '2nd'} (+${formatDollars(pts)}) to ${teamDisplayName}`
        );
      } catch (error) {
        reportOperationError(
          error,
          OperationType.WRITE,
          `teams/${teamId}`,
          'Failed to allot points to team.'
        );
      }
    },
    [user, canManage, activeRound, showToast, reportOperationError]
  );

  // Admin: Adjust funds manually (+1000, +500, +100, -100, custom) and persist in ledger
  const adjustFunds = useCallback(
    async (teamId: string, delta: number) => {
      const safeDelta = Math.trunc(delta);
      if (!user || !canManage || safeDelta === 0) return;
      const round = activeRound;

      try {
        let teamDisplayName = 'Squadron';
        await runTransaction(db, async (tx) => {
          const teamRef = doc(db, 'teams', teamId);
          const snap = await tx.get(teamRef);
          const base = INITIAL_FINANCE_TEAMS.find((t) => t.id === teamId);
          const curScore =
            snap.exists() && typeof snap.data().score === 'number'
              ? Math.trunc(snap.data().score)
              : 0;
          const nextScore = Math.max(0, curScore + safeDelta);
          teamDisplayName = (snap.exists() ? (snap.data().name as string) : base?.name) || 'Squadron';

          if (!snap.exists() && base) {
            tx.set(teamRef, {
              id: base.id,
              name: base.name,
              leader: base.leader,
              color: base.color,
              secondaryColor: base.secondaryColor,
              score: nextScore,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(teamRef, {
              score: nextScore,
              updatedAt: serverTimestamp(),
            });
          }

          tx.set(doc(collection(db, 'roundAwards')), {
            roundId: Math.trunc(round.id),
            roundName: round.name,
            teamId,
            teamName: teamDisplayName,
            place: 'adjust',
            amount: safeDelta,
            awardedBy: user.uid,
            createdAt: serverTimestamp(),
          });
        });

        setSyncError(null);
        showToast(
          `${safeDelta > 0 ? '+' : ''}${formatDollars(safeDelta)} saved for ${teamDisplayName}`
        );
      } catch (error) {
        reportOperationError(
          error,
          OperationType.WRITE,
          `teams/${teamId}`,
          'Failed to adjust team funds.'
        );
      }
    },
    [user, canManage, activeRound, showToast, reportOperationError]
  );

  // Admin: Update Squadron Name, Commander, Hull Color in Firestore
  const updateTeam = useCallback(
    async (
      teamId: string,
      updates: { name: string; leader: string; color?: string }
    ): Promise<boolean> => {
      if (!user || !canManage) return false;
      try {
        await runTransaction(db, async (tx) => {
          const teamRef = doc(db, 'teams', teamId);
          const snap = await tx.get(teamRef);
          const base = INITIAL_FINANCE_TEAMS.find((t) => t.id === teamId);
          if (!snap.exists() && base) {
            tx.set(teamRef, {
              id: base.id,
              name: updates.name,
              leader: updates.leader,
              color: updates.color || base.color,
              secondaryColor: base.secondaryColor,
              score: 0,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(teamRef, {
              name: updates.name,
              leader: updates.leader,
              color: updates.color || (snap.data()?.color as string) || '#10b981',
              updatedAt: serverTimestamp(),
            });
          }
        });
        setSyncError(null);
        soundEngine.playCashChime();
        showToast('Squadron updated & saved to cloud');
        return true;
      } catch (error) {
        reportOperationError(
          error,
          OperationType.UPDATE,
          `teams/${teamId}`,
          'Failed to update squadron.'
        );
        return false;
      }
    },
    [user, canManage, showToast, reportOperationError]
  );

  // Admin: Explicit Clear Award Log
  const clearRoundHistory = useCallback(async () => {
    if (!user || !canManage) return;
    try {
      const awardsSnap = await getDocs(
        query(collection(db, 'roundAwards'), where('roundId', '>=', 1))
      );
      const batch = writeBatch(db);
      awardsSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setSyncError(null);
      showToast('Round award log cleared');
    } catch (error) {
      reportOperationError(
        error,
        OperationType.DELETE,
        'roundAwards',
        'Failed to clear round award log.'
      );
    }
  }, [user, canManage, showToast, reportOperationError]);

  // Admin: Explicit Reset to $0
  const resetCompetition = useCallback(async () => {
    if (!user || !canManage) return;
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
      setIsDemoRunning(false);
    }

    try {
      const awardsSnap = await getDocs(
        query(collection(db, 'roundAwards'), where('roundId', '>=', 1))
      );
      const batch = writeBatch(db);

      batch.set(doc(db, 'competition', 'main'), {
        activeRoundId: 1,
        campaignGoal: CAMPAIGN_GOAL,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      for (const base of INITIAL_FINANCE_TEAMS) {
        batch.set(doc(db, 'teams', base.id), {
          id: base.id,
          name: base.name,
          leader: base.leader,
          color: base.color,
          secondaryColor: base.secondaryColor,
          score: 0,
          updatedAt: serverTimestamp(),
        });
      }

      awardsSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      setSyncError(null);
      setLastAwardedBadgeKey(null);
      setSelectedLeaderTeamId('team-1');
      soundEngine.playResetSound();
      showToast('Competition explicitly reset to $0 across all connected screens.');
    } catch (error) {
      reportOperationError(
        error,
        OperationType.WRITE,
        'competition/main',
        'Failed to reset competition.'
      );
    }
  }, [user, canManage, showToast, reportOperationError]);

  // Admin: Live Demo Simulation pushing real Firestore updates
  const toggleDemoSimulation = useCallback(() => {
    if (!user || !canManage) return;
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
      setIsDemoRunning(false);
      showToast('Demo Simulation Stopped');
      return;
    }

    setIsDemoRunning(true);
    showToast('Running Live Firestore Demo Simulation...');
    soundEngine.playFanfare();

    let step = 0;
    let simRoundId = activeRoundId;
    demoIntervalRef.current = window.setInterval(async () => {
      step += 1;
      const randomTeam = teams[Math.floor(Math.random() * teams.length)] || INITIAL_FINANCE_TEAMS[0];
      const round = GAME_ROUNDS.find((r) => r.id === simRoundId) || GAME_ROUNDS[0];
      const isFirst = Math.random() > 0.5;
      const pts = Math.trunc(isFirst ? round.first : round.second);

      try {
        await runTransaction(db, async (tx) => {
          const teamRef = doc(db, 'teams', randomTeam.id);
          const snap = await tx.get(teamRef);
          const curScore =
            snap.exists() && typeof snap.data().score === 'number'
              ? Math.trunc(snap.data().score)
              : 0;
          if (!snap.exists()) {
            tx.set(teamRef, {
              id: randomTeam.id,
              name: randomTeam.name,
              leader: randomTeam.leader,
              color: randomTeam.color,
              secondaryColor: randomTeam.secondaryColor,
              score: curScore + pts,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(teamRef, {
              score: curScore + pts,
              updatedAt: serverTimestamp(),
            });
          }

          tx.set(doc(collection(db, 'roundAwards')), {
            roundId: Math.trunc(round.id),
            roundName: round.name,
            teamId: randomTeam.id,
            teamName: randomTeam.name,
            place: isFirst ? '1st' : '2nd',
            amount: pts,
            awardedBy: user.uid,
            createdAt: serverTimestamp(),
          });

          if (step % 2 === 0 && simRoundId < GAME_ROUNDS.length) {
            simRoundId += 1;
            tx.set(doc(db, 'competition', 'main'), {
              activeRoundId: simRoundId,
              campaignGoal: Math.trunc(campaignGoal),
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
          }
        });
      } catch (error) {
        if (demoIntervalRef.current) {
          window.clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
        setIsDemoRunning(false);
        reportOperationError(
          error,
          OperationType.WRITE,
          'roundAwards',
          'Demo simulation stopped due to write error.'
        );
        return;
      }

      if (step >= 8) {
        if (demoIntervalRef.current) {
          window.clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
        setIsDemoRunning(false);
        showToast('Live Demo Simulation Completed');
        triggerConfetti();
      }
    }, 1400);
  }, [
    user,
    canManage,
    activeRoundId,
    teams,
    campaignGoal,
    showToast,
    triggerConfetti,
    reportOperationError,
  ]);

  return {
    teams,
    sortedTeams,
    scores,
    campaignGoal,
    activeRoundId,
    activeRound,
    roundHistory,
    dataLoaded,
    syncError,
    currentRole,
    selectedLeaderTeamId,
    audioEnabled,
    projectorMode,
    adminModalOpen,
    editingTeamId,
    lastAwardedBadgeKey,
    confettiSeed,
    toastMessage,
    storageStatusText,
    storageFlash,
    isDemoRunning,
    canManage,
    setSyncError,
    setSelectedLeaderTeamId,
    setAdminModalOpen,
    setEditingTeamId,
    switchRole,
    selectRound,
    awardRoundPoints,
    quickAllot,
    adjustFunds,
    updateTeam,
    clearRoundHistory,
    resetCompetition,
    toggleAudio,
    toggleProjector,
    toggleDemoSimulation,
    showToast,
  };
}
