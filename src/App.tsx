import { X } from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { CosmosArena } from './components/CosmosArena';
import { EditTeamModal } from './components/EditTeamModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeaderBar } from './components/HeaderBar';
import { LeaderboardTable } from './components/LeaderboardTable';
import { LoginScreen } from './components/LoginScreen';
import { RoleStatusBar } from './components/RoleStatusBar';
import { ScorekeeperPanel } from './components/ScorekeeperPanel';
import { SpaceCanvas } from './components/SpaceCanvas';
import { TeamLeaderPanel } from './components/TeamLeaderPanel';
import { useAuth } from './hooks/useAuth';
import { useCompetitionState } from './hooks/useCompetitionState';

function CompetitionWorkspace() {
  const {
    user,
    authLoading,
    isAdminAuthorized,
    portalRole,
    authError,
    adminAccessDenied,
    signingInRole,
    signInWithPortal,
    switchPortalRole,
    grantAdminByUid,
    signOut,
  } = useAuth();

  const {
    teams,
    sortedTeams,
    scores,
    campaignGoal,
    activeRound,
    roundHistory,
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
    syncError,
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
  } = useCompetitionState({
    user,
    portalRole,
    isAdminAuthorized,
  });

  if (authLoading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-[#030712] text-slate-200">
        <SpaceCanvas confettiSeed={0} />
        <div className="relative z-10 rounded-2xl border border-white/10 bg-[#0d1426]/90 px-6 py-4 text-sm font-semibold text-slate-300 shadow-2xl">
          Connecting to Race to the Top Cloud Sync...
        </div>
      </div>
    );
  }

  const showLoginScreen =
    !user || !portalRole || (portalRole === 'admin' && !isAdminAuthorized);

  if (showLoginScreen) {
    return (
      <div className="relative min-h-screen w-full bg-[#030712] text-slate-50">
        <SpaceCanvas confettiSeed={0} />
        <LoginScreen
          user={user}
          isAdminAuthorized={isAdminAuthorized}
          signingInRole={signingInRole}
          authError={authError}
          adminAccessDenied={adminAccessDenied}
          onSignIn={(role) => void signInWithPortal(role)}
          onContinueAsUser={() => switchPortalRole('user')}
          onSignOut={() => void signOut()}
        />
      </div>
    );
  }

  const editingTeam = canManage ? teams.find((t) => t.id === editingTeamId) || null : null;

  return (
    <div
      className={`relative min-h-screen w-full text-slate-50 ${
        projectorMode ? 'bg-[#020617] p-2.5' : 'p-4'
      }`}
    >
      <SpaceCanvas confettiSeed={confettiSeed} />

      {projectorMode && (
        <button
          type="button"
          onClick={() => toggleProjector(false)}
          className="fixed right-4 top-4 z-[10001] inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-black/85 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-black"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit Projector</span>
        </button>
      )}

      {/* Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-5 right-5 z-[10000] rounded-xl border border-emerald-400/40 bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.7)] transition-all duration-300 ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        {toastMessage || ''}
      </div>

      {canManage && (
        <>
          <EditTeamModal
            team={editingTeam}
            balance={editingTeam ? scores[editingTeam.id] || 0 : 0}
            onClose={() => setEditingTeamId(null)}
            onSave={updateTeam}
          />

          <AdminModal
            open={adminModalOpen}
            teams={teams}
            scores={scores}
            activeRound={activeRound}
            roundHistory={roundHistory}
            adminUid={user.uid}
            onClose={() => setAdminModalOpen(false)}
            onSelectRound={selectRound}
            onAwardRound={awardRoundPoints}
            onAdjustFunds={adjustFunds}
            onClearHistory={clearRoundHistory}
            onReset={resetCompetition}
            onGrantAdminByUid={grantAdminByUid}
          />
        </>
      )}

      <div className="relative z-[1] mx-auto flex w-full max-w-[1340px] flex-col gap-4">
        {!projectorMode && syncError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/50 bg-rose-500/15 px-4 py-2.5 text-xs text-rose-100">
            <span className="break-all">Sync Alert: {syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="shrink-0 rounded-md border border-rose-400/40 px-2 py-1 font-semibold hover:bg-rose-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {!projectorMode && (
          <>
            <HeaderBar
              portalRole={portalRole}
              isAdminAuthorized={isAdminAuthorized}
              userEmail={user.email}
              audioEnabled={audioEnabled}
              isDemoRunning={isDemoRunning}
              onToggleAudio={toggleAudio}
              onEnterProjector={() => toggleProjector(true)}
              onToggleDemo={toggleDemoSimulation}
              onReset={() => void resetCompetition()}
              onOpenAdmin={() => setAdminModalOpen(true)}
              onSwitchPortal={switchPortalRole}
              onSignOut={() => void signOut()}
            />

            <RoleStatusBar
              portalRole={portalRole}
              canManage={canManage}
              currentRole={currentRole}
              activeRound={activeRound}
              campaignGoal={campaignGoal}
              storageStatusText={storageStatusText}
              storageFlash={storageFlash}
              userEmail={user.email}
              onSwitchRole={switchRole}
            />

            {canManage && currentRole === 'leader' && (
              <TeamLeaderPanel
                teams={teams}
                sortedTeams={sortedTeams}
                scores={scores}
                selectedLeaderTeamId={selectedLeaderTeamId}
                onSelectLeaderTeam={setSelectedLeaderTeamId}
                onUpdateTeam={updateTeam}
              />
            )}

            {canManage && currentRole === 'scorekeeper' && (
              <ScorekeeperPanel
                teams={teams}
                scores={scores}
                activeRound={activeRound}
                roundHistory={roundHistory}
                onSelectRound={selectRound}
                onAwardRound={awardRoundPoints}
                onQuickAllot={quickAllot}
                onAdjustFunds={adjustFunds}
                onClearHistory={clearRoundHistory}
                onReset={resetCompetition}
                onEditTeam={(id) => setEditingTeamId(id)}
              />
            )}
          </>
        )}

        <CosmosArena
          sortedTeams={sortedTeams}
          scores={scores}
          campaignGoal={campaignGoal}
          activeRound={activeRound}
          lastAwardedBadgeKey={lastAwardedBadgeKey}
          canEdit={canManage}
          onSelectTeamToEdit={canManage ? (id) => setEditingTeamId(id) : undefined}
        />

        {!projectorMode && (
          <LeaderboardTable
            sortedTeams={sortedTeams}
            scores={scores}
            campaignGoal={campaignGoal}
            canEdit={canManage}
            onEditTeam={canManage ? (id) => setEditingTeamId(id) : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CompetitionWorkspace />
    </ErrorBoundary>
  );
}
