import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { RuleEdition, CharacterData } from './types';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { QuickStatsBar } from './components/QuickStatsBar';
import { SidebarDock } from './components/SidebarDock';
import { DiceRoller } from './components/DiceRoller';
import { Sheet1StatsFeatures } from './components/sheets/Sheet1StatsFeatures';
import { Sheet2Combat } from './components/sheets/Sheet2Combat';
import { Sheet3GearWealth } from './components/sheets/Sheet3GearWealth';
import { Sheet4Spells } from './components/sheets/Sheet4Spells';
import { Sheet5DescriptionNotes } from './components/sheets/Sheet5DescriptionNotes';
import { Sheet6UserGuide } from './components/sheets/Sheet6UserGuide';
import { Sheet7Compendium } from './components/sheets/Sheet7Compendium';
import { SheetDmOverview } from './components/sheets/SheetDmOverview';
import { LevelUpWizardModal } from './components/modals/LevelUpWizardModal';
import { DetachedHeaderBanner } from './components/common/DetachedHeaderBanner';
import { getDetachedParams, openDetachedWindow } from './utils/useDetachedSync';
import { MainMenu } from './components/MainMenu';
import { NewCharacterModal } from './components/modals/NewCharacterModal';
import { AuthModal } from './components/modals/AuthModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { PartyVoiceWidget } from './components/voice/PartyVoiceWidget';
import { PersistentAmbiencePlayer } from './components/audio/PersistentAmbiencePlayer';
import { useHotkeys } from './context/HotkeyContext';
import { useUiMode } from './context/UiModeContext';
import { useAccessibility } from './context/AccessibilityContext';
import { Crown } from 'lucide-react';

// Direct Modal Component Imports
import { CampaignGraphModal } from './components/modals/CampaignGraphModal';
import { DeveloperSdkModal } from './components/modals/DeveloperSdkModal';
import { DiagnosticConsoleModal } from './components/diagnostics/DiagnosticConsoleModal';
import { UserManualModal } from './components/modals/UserManualModal';
import { ExtensionManagerModal } from './components/modals/ExtensionManagerModal';
import { AudioOptionsModal } from './components/modals/AudioOptionsModal';
import { SessionLobbyModal } from './components/modals/SessionLobbyModal';
import { PartyManagerModal } from './components/modals/PartyManagerModal';
import { TRPGSystemSelectorModal } from './components/modals/TRPGSystemSelectorModal';
import { AiAssistantModal } from './components/modals/AiAssistantModal';
import { TabletopGeneratorsModal, GeneratorTab } from './components/modals/TabletopGeneratorsModal';
import { CampaignLoreVaultModal, CampaignTabId } from './components/modals/CampaignLoreVaultModal';
import { LiveSessionCopilotDrawer } from './components/common/LiveSessionCopilotDrawer';
import { GeneratedEncounter, hydrateGeneratedMonster } from './services/geminiService';
import { Combatant, CombatLogEntry, SavedEncounterData } from './components/combat/encounter/encounterTypes';
import { loadSavedEncounter } from './components/combat/encounter/useEncounterState';
import { getMonsterPortraitUrl } from './data/monsterPortraits';
import { EncounterEnvironment } from './types';
import { PhysicalDiceModal } from './components/modals/PhysicalDiceModal';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { GlobalUpgradeModal } from './components/modals/GlobalUpgradeModal';
import { GlobalDiceOverlay } from './components/dice/GlobalDiceOverlay';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

// Modular Hooks
import {
  useAuthManager,
  useSystemManager,
  useCharacterManager,
  useSessionSync,
  useDiceEngine,
  useModalCoordinator
} from './hooks';

const normalizeTabId = (tab: string): TabId => {
  switch (tab) {
    case 'stats':
    case 'sheet1':
      return 'sheet1';
    case 'combat':
    case 'turn_order':
    case 'turnorder':
    case 'encounter':
    case 'sheet2':
      return 'sheet2';
    case 'gear':
    case 'inventory':
    case 'sheet3':
      return 'sheet3';
    case 'spells':
    case 'magic':
    case 'sheet4':
      return 'sheet4';
    case 'notes':
    case 'description':
    case 'sheet5':
      return 'sheet5';
    case 'guide':
    case 'userguide':
    case 'sheet6':
      return 'sheet6';
    case 'compendium':
    case 'sheet7':
      return 'sheet7';
    case 'dm':
    case 'sheetDm':
      return 'sheetDm';
    case 'menu':
      return 'menu';
    default:
      return 'sheet1';
  }
};

export default function App() {
  const detachedParams = useMemo(() => getDetachedParams(), []);
  const isDetachedWindow = Boolean(detachedParams.detachedTab);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (detachedParams.detachedTab) {
      return normalizeTabId(detachedParams.detachedTab);
    }
    return 'sheet1';
  });

  const { matchesHotkey } = useHotkeys();
  const { toggleUiMode, startTour } = useUiMode();
  const { announceLiveMessage } = useAccessibility();

  // 1. Authentication Manager
  const { currentUser, setCurrentUser } = useAuthManager();

  // 2. Character & Party State Manager
  const {
    characters,
    setCharacters,
    activeCharacterId,
    setActiveCharacterId,
    activeCharacter,
    parties,
    setParties,
    presenceMap,
    undoCharacters,
    redoCharacters,
    canUndoCharacters,
    canRedoCharacters,
    handleUpdateCharacter,
    handleSelectCharacter,
    handleCreateNewCharacter,
    handleDeleteCharacter,
    handleAddItemToActiveCharacter,
    handleAddSpellToActiveCharacter,
    handleExportJson,
    handleImportJson
  } = useCharacterManager({
    currentUser,
    initialCharIdFromDetached: detachedParams.initialCharId,
    onNavigateToTab: (tab) => setActiveTab(tab)
  });

  // 3. Multi-System Rules & Theme Manager
  const {
    enabledSystems,
    setEnabledSystems,
    hasConfiguredSystems,
    setPreviewTheme,
    currentSystemTheme,
    handleSaveTRPGSystems,
    handleSystemChange
  } = useSystemManager({
    characters,
    activeCharacter,
    onSelectCharacterId: (id) => setActiveCharacterId(id)
  });

  // 4. Session & Multiplayer Sync Manager
  const {
    activeSessionCode,
    setActiveSessionCode,
    activeSession,
    showSessionModal,
    setShowSessionModal,
    isDm,
    handleLoadCampaignSave
  } = useSessionSync({
    currentUser,
    setCharacters,
    onSelectCharacter: handleSelectCharacter,
    onSetPreviewTheme: setPreviewTheme
  });

  // 5. Dice Engine (Digital + Physical Tabletop Interceptor)
  const {
    rollLogs,
    setRollLogs,
    activeRollResult,
    setActiveRollResult,
    isPhysicalDiceMode,
    setIsPhysicalDiceMode,
    physicalRollRequest,
    handleRoll,
    handleRollDamage,
    handleRollInitiative
  } = useDiceEngine({
    activeCharacter,
    optionalRulesUsePhysicalDice: activeSession?.optionalRules?.usePhysicalDiceMode
  });

  // 6. Modal Coordinator
  const {
    showAuthModal,
    setShowAuthModal,
    showTRPGSelectorModal,
    setShowTRPGSelectorModal,
    showAudioModal,
    setShowAudioModal,
    showCommandPalette,
    setShowCommandPalette,
    showExtensionManager,
    setShowExtensionManager,
    showDeveloperSdk,
    setShowDeveloperSdk,
    showUserManualModal,
    setShowUserManualModal,
    showCampaignGraphModal,
    setShowCampaignGraphModal,
    showAiAssistantModal,
    setShowAiAssistantModal,
    initialGraphEntityName,
    setInitialGraphEntityName,
    showVoiceModal,
    setShowVoiceModal,
    showLevelUpWizard,
    setShowLevelUpWizard,
    showNewCharacterModal,
    setShowNewCharacterModal,
    showPartyModal,
    setShowPartyModal,
    newCharCategory,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradeModalReason,
    upgradeModalRequiredTier,
    handleOpenUpgradeModal,
    handleOpenNewCharacterModal
  } = useModalCoordinator({
    currentUser,
    characters,
    hasConfiguredSystems,
    onNavigateTab: (tab) => setActiveTab(normalizeTabId(tab))
  });

  const [showDiagnosticConsole, setShowDiagnosticConsole] = useState(false);
  const [showTabletopGenerators, setShowTabletopGenerators] = useState(false);
  const [tabletopGeneratorsTab, setTabletopGeneratorsTab] = useState<GeneratorTab>('npc');
  const [showLiveCopilotDrawer, setShowLiveCopilotDrawer] = useState(false);
  const [showCampaignLoreVaultModal, setShowCampaignLoreVaultModal] = useState(false);
  const [campaignLoreVaultInitialTab, setCampaignLoreVaultInitialTab] = useState<CampaignTabId>('atlas');

  const handleOpenCampaignLoreVault = (tab: CampaignTabId = 'atlas') => {
    setCampaignLoreVaultInitialTab(tab);
    setShowCampaignLoreVaultModal(true);
  };

  const handleOpenGenerators = (tab: GeneratorTab = 'npc') => {
    setTabletopGeneratorsTab(tab);
    setShowTabletopGenerators(true);
  };

  const handlePopulateCombatEncounter = (encounter: GeneratedEncounter) => {
    if (!encounter || !encounter.enemies) return;
    const newMonsters: CharacterData[] = [];
    const newCombatants: Combatant[] = [];

    const getCrXp = (crStr: string | number): number => {
      const cr = String(crStr).trim();
      switch (cr) {
        case '0': return 10;
        case '1/8': return 25;
        case '1/4': return 50;
        case '1/2': return 100;
        case '1': return 200;
        case '2': return 450;
        case '3': return 700;
        case '4': return 1100;
        case '5': return 1800;
        case '6': return 2300;
        case '7': return 2900;
        case '8': return 3900;
        case '9': return 5000;
        case '10': return 5900;
        case '11': return 7200;
        case '12': return 8400;
        case '13': return 10000;
        case '14': return 11500;
        case '15': return 13000;
        case '16': return 15000;
        case '17': return 18000;
        case '18': return 20000;
        case '19': return 22000;
        case '20': return 25000;
        default: {
          const num = Number(cr);
          return !isNaN(num) && num > 0 ? Math.round(num * 500) : 200;
        }
      }
    };

    encounter.enemies.forEach((enemy) => {
      const count = Math.max(1, enemy.count || 1);
      const initBonus = Number(enemy.initiativeBonus) || 0;
      const xpReward = getCrXp(enemy.cr || '1');

      for (let i = 0; i < count; i++) {
        const uniqueName = count > 1 ? `${enemy.name} #${i + 1}` : enemy.name;
        const rolledInit = Math.floor(Math.random() * 20) + 1 + initBonus;
        const monsterData = hydrateGeneratedMonster({
          name: uniqueName,
          challengeRating: enemy.cr || '1',
          monsterXpReward: xpReward,
          hpMax: enemy.hpMax || 25,
          armorClass: enemy.armorClass || 13,
          speed: 30,
          initiativeBonus: initBonus,
          abilities: enemy.abilities || { STR: { score: 14 }, DEX: { score: 12 }, CON: { score: 14 } },
          attacks: enemy.attacks || [],
          tacticalNotes: enemy.tacticalNotes,
          backstory: `Encounter: ${encounter.name}. Role: ${enemy.role}. ${enemy.tacticalNotes}`
        }, currentSystemTheme);
        newMonsters.push(monsterData);

        const combatant: Combatant = {
          id: 'enemy-' + monsterData.id,
          name: uniqueName,
          initiative: rolledInit,
          armorClass: Number(enemy.armorClass) || monsterData.armorClass || 13,
          hpCurrent: Number(enemy.hpMax) || monsterData.hpMax || 25,
          hpMax: Number(enemy.hpMax) || monsterData.hpMax || 25,
          type: 'enemy',
          monsterXpReward: xpReward,
          isDefeated: false,
          portraitUrl: monsterData.portraitUrl || getMonsterPortraitUrl(monsterData.name, monsterData.id)
        };
        newCombatants.push(combatant);
      }
    });

    if (newMonsters.length > 0) {
      setCharacters(prev => [...prev, ...newMonsters]);
    }

    if (activeCharacter && newCombatants.length > 0) {
      const charKey = activeCharacter.id || 'default';
      const currentSaved = loadSavedEncounter(activeCharacter);

      const playerAndAllies = currentSaved.combatants.filter(c => c.isPlayerChar || c.type === 'player' || c.type === 'ally');
      const updatedCombatants = [...playerAndAllies, ...newCombatants].sort((a, b) => b.initiative - a.initiative);

      const validEnvs: EncounterEnvironment[] = ['terrestrial', 'underwater', 'volcanic', 'arctic', 'shadowfell', 'aerial', 'lair_active'];
      const rawEnv = (encounter.environment || '').toLowerCase();
      let matchedEnv: EncounterEnvironment = 'terrestrial';
      if (validEnvs.includes(rawEnv as EncounterEnvironment)) {
        matchedEnv = rawEnv as EncounterEnvironment;
      } else if (rawEnv.includes('lair') || rawEnv.includes('dungeon') || rawEnv.includes('crypt') || rawEnv.includes('cave')) {
        matchedEnv = 'lair_active';
      } else if (rawEnv.includes('water') || rawEnv.includes('sea') || rawEnv.includes('ocean')) {
        matchedEnv = 'underwater';
      } else if (rawEnv.includes('lava') || rawEnv.includes('fire') || rawEnv.includes('volcan')) {
        matchedEnv = 'volcanic';
      } else if (rawEnv.includes('ice') || rawEnv.includes('snow') || rawEnv.includes('arctic') || rawEnv.includes('frost')) {
        matchedEnv = 'arctic';
      } else if (rawEnv.includes('shadow') || rawEnv.includes('dark') || rawEnv.includes('undead')) {
        matchedEnv = 'shadowfell';
      } else if (rawEnv.includes('air') || rawEnv.includes('sky') || rawEnv.includes('flight')) {
        matchedEnv = 'aerial';
      }

      const newLog: CombatLogEntry = {
        id: 'log-encounter-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: 1,
        actor: 'AI Oracle',
        category: 'turn',
        message: `⚔️ Deployed Encounter "${encounter.name}" (${encounter.difficulty} difficulty, ${matchedEnv} environment). Added ${newCombatants.length} hostile combatant(s): ${newCombatants.map(c => `${c.name} [Init ${c.initiative}, AC ${c.armorClass}, HP ${c.hpMax}]`).join(', ')}.`
      };

      const updatedState: SavedEncounterData = {
        combatants: updatedCombatants,
        activeTurnIndex: 0,
        roundNumber: 1,
        encounterEnvironment: matchedEnv,
        encounterMode: 'combat',
        activeMerchant: null,
        combatLogs: [newLog, ...(currentSaved.combatLogs || [])]
      };

      try {
        localStorage.setItem(`dnd_encounter_state_v1_${charKey}`, JSON.stringify(updatedState));
      } catch (err) {
        console.error('Error saving encounter to localStorage:', err);
      }

      window.dispatchEvent(new CustomEvent('dnd_encounter_deployed', {
        detail: {
          characterId: activeCharacter.id,
          combatants: updatedCombatants,
          environment: matchedEnv,
          logEntry: newLog
        }
      }));
    }

    // Automatically navigate to Sheet 2 (Combat & Encounter Tracker)
    setActiveTab('sheet2');
  };

  const handleAppendSessionNotes = (notes: string) => {
    if (!activeCharacter) return;
    const current = activeCharacter.additionalNotes || '';
    const updated = current ? `${current}\n\n${notes}` : notes;
    handleUpdateCharacter({
      ...activeCharacter,
      additionalNotes: updated
    });
  };

  // Tab auto-navigation guards
  useEffect(() => {
    if (!activeCharacter && ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5'].includes(activeTab)) {
      setActiveTab('menu');
    }
  }, [activeCharacter, activeTab]);

  useEffect(() => {
    if (activeTab === 'sheetDm' && (!isDm || !activeSession)) {
      setActiveTab('sheet1');
    }
  }, [activeTab, isDm, activeSession]);

  useEffect(() => {
    if (!currentUser && activeTab === 'sheetDm') {
      setActiveTab('menu');
    }
  }, [currentUser, activeTab]);

  const handleDetachTab = (tabId: TabId) => {
    openDetachedWindow(tabId, activeCharacterId, activeSessionCode);
  };

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesHotkey(e, 'commandPalette')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputActive) {
        return;
      }

      if (matchesHotkey(e, 'switchSheet1')) {
        e.preventDefault();
        setActiveTab('sheet1');
        return;
      }
      if (matchesHotkey(e, 'switchSheet2')) {
        e.preventDefault();
        setActiveTab('sheet2');
        return;
      }
      if (matchesHotkey(e, 'switchSheet3')) {
        e.preventDefault();
        setActiveTab('sheet3');
        return;
      }
      if (matchesHotkey(e, 'switchSheet4')) {
        e.preventDefault();
        setActiveTab('sheet4');
        return;
      }
      if (matchesHotkey(e, 'switchSheet5')) {
        e.preventDefault();
        setActiveTab('sheet5');
        return;
      }
      if (matchesHotkey(e, 'switchSheet6')) {
        e.preventDefault();
        setActiveTab('sheet6');
        return;
      }
      if (matchesHotkey(e, 'switchSheet7')) {
        e.preventDefault();
        setActiveTab('sheet7');
        return;
      }
      if (matchesHotkey(e, 'switchSheetDm')) {
        e.preventDefault();
        setActiveTab('sheetDm');
        return;
      }

      if (matchesHotkey(e, 'cycleSystem')) {
        e.preventDefault();
        const systems: RuleEdition[] =
          enabledSystems && enabledSystems.length > 0
            ? enabledSystems
            : ['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu'];
        const currentIndex = systems.indexOf(currentSystemTheme);
        const nextIndex = (currentIndex + 1) % systems.length;
        const nextSystem = systems[nextIndex];
        handleSystemChange(nextSystem);
        announceLiveMessage(`Switched active game system to ${nextSystem.toUpperCase()}`, 'polite');
        return;
      }

      if (matchesHotkey(e, 'toggleFocusMode')) {
        e.preventDefault();
        toggleUiMode();
        announceLiveMessage('Toggled layout mode between Focus and Master view', 'polite');
        return;
      }

      if (matchesHotkey(e, 'openTour')) {
        e.preventDefault();
        startTour();
        return;
      }

      if (matchesHotkey(e, 'openOptions')) {
        e.preventDefault();
        setShowAudioModal(prev => !prev);
        return;
      }

      // Live Session Co-Pilot HUD shortcut (Ctrl+J or Cmd+J)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setShowLiveCopilotDrawer(prev => !prev);
        return;
      }

      // Campaign World Atlas & Questline Lore Vault shortcut (Ctrl+M or Cmd+M)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowCampaignLoreVaultModal(prev => !prev);
        return;
      }

      // Observability & Diagnostic Console shortcut (Ctrl+Shift+D or Cmd+Shift+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDiagnosticConsole(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchesHotkey, enabledSystems, currentSystemTheme, handleSystemChange, setShowAudioModal, setShowCommandPalette, startTour, toggleUiMode, announceLiveMessage]);

  if (isDetachedWindow) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-stone-950" data-theme={currentSystemTheme}>
        <DetachedHeaderBanner
          detachedTab={activeTab}
          onTabChange={setActiveTab}
          activeCharacter={activeCharacter}
          characters={characters}
          onSelectCharacter={handleSelectCharacter}
          isDm={isDm}
          sessionCode={activeSessionCode}
        />

        <main className="w-full max-w-[1600px] mx-auto p-3 sm:p-6">
          {activeTab === 'sheetDm' && (
            activeSession ? (
              <SheetDmOverview
                activeSession={activeSession}
                allCharacters={characters}
                currentUser={currentUser}
                onUpdateCharacter={handleUpdateCharacter}
                onDetach={() => handleDetachTab('sheetDm')}
                onOpenUpgradeModal={handleOpenUpgradeModal}
              />
            ) : (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center space-y-3">
                <Crown className="w-8 h-8 text-amber-400 mx-auto" />
                <h2 className="text-lg font-serif font-bold text-amber-200">DM Overview Detached View</h2>
                <p className="text-sm text-stone-400 max-w-md mx-auto">
                  To view live DM Party Overrides, start or join an active game session from the Session Lobby in the main window.
                </p>
              </div>
            )
          )}

          {activeTab === 'sheet1' && activeCharacter && (
            <Sheet1StatsFeatures
              character={activeCharacter}
              currentUser={currentUser}
              activeSession={activeSession}
              onUpdateCharacter={handleUpdateCharacter}
              onAddMonsterToRoster={(monster) => {
                setCharacters(prev => [...prev, monster]);
              }}
              onRoll={handleRoll}
            />
          )}

          {activeTab === 'sheet2' && activeCharacter && (
            <Sheet2Combat
              character={activeCharacter}
              allCharacters={characters}
              parties={parties}
              currentUser={currentUser}
              onOpenPartyManager={() => setShowPartyModal(true)}
              onUpdateCharacter={handleUpdateCharacter}
              onAddMonsterToRoster={(monster) => {
                setCharacters(prev => [...prev, monster]);
              }}
              onRoll={handleRoll}
              onRollDamage={handleRollDamage}
            />
          )}

          {activeTab === 'sheet3' && activeCharacter && (
            <Sheet3GearWealth
              character={activeCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onRollDamage={handleRollDamage}
            />
          )}

          {activeTab === 'sheet4' && activeCharacter && (
            <Sheet4Spells
              character={activeCharacter}
              allCharacters={characters}
              currentUser={currentUser}
              onUpdateCharacter={handleUpdateCharacter}
              onAddMonsterToRoster={(monster) => {
                setCharacters(prev => [...prev, monster]);
              }}
              onRoll={handleRoll}
              onRollDamage={handleRollDamage}
            />
          )}

          {activeTab === 'sheet5' && activeCharacter && (
            <Sheet5DescriptionNotes
              character={activeCharacter}
              onUpdateCharacter={handleUpdateCharacter}
            />
          )}

          {activeTab === 'sheet6' && (
            <Sheet6UserGuide
              edition={currentSystemTheme}
              enabledSystems={enabledSystems}
            />
          )}

          {activeTab === 'sheet7' && (
            <Sheet7Compendium
              activeCharacter={activeCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onAddMonsterToRoster={(monster) => {
                setCharacters(prev => [...prev, monster]);
              }}
              enabledSystems={enabledSystems}
            />
          )}
        </main>

        <DiceRoller
          rollLogs={rollLogs}
          onRoll={handleRoll}
          onClearLogs={() => setRollLogs([])}
          activeRollResult={activeRollResult}
          onOpenAudioModal={() => setShowAudioModal(true)}
          isPhysicalDiceMode={isPhysicalDiceMode}
          onTogglePhysicalDiceMode={() => setIsPhysicalDiceMode(prev => !prev)}
        />

        {/* Physical Tabletop Dice Modal in Detached View */}
        {physicalRollRequest && (
          <PhysicalDiceModal request={physicalRollRequest} />
        )}
      </div>
    );
  }

  const appContent = (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-stone-950 transition-colors duration-300" data-theme={currentSystemTheme}>
      {/* Top DM Active Banner Indicator */}
      {activeCharacter && presenceMap[activeCharacter.id]?.dmActive && activeTab !== 'menu' && (
        <div className="bg-purple-950/90 border-b border-purple-600/60 text-purple-200 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
          <span>
            <strong>DM Active:</strong> A Dungeon Master ({presenceMap[activeCharacter.id]?.dmUserName || 'DM'}) is currently active on this character.
          </span>
        </div>
      )}

      {/* Top Banner Header */}
      <Header
        characters={characters}
        activeCharacter={activeCharacter}
        partiesCount={parties.length}
        onOpenPartyManager={() => setShowPartyModal(true)}
        onOpenSessionLobby={() => setShowSessionModal(true)}
        onOpenCampaignGraph={() => setShowCampaignGraphModal(true)}
        activeSession={activeSession}
        onSelectCharacter={handleSelectCharacter}
        onCreateNewCharacter={handleOpenNewCharacterModal}
        onDeleteCharacter={handleDeleteCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onRollInitiative={handleRollInitiative}
        onSystemChange={handleSystemChange}
        edition={currentSystemTheme}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        presenceMap={presenceMap}
        enabledSystems={enabledSystems}
        onOpenSystemSelector={() => setShowTRPGSelectorModal(true)}
        onOpenAudioModal={() => setShowAudioModal(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenExtensionManager={() => setShowExtensionManager(true)}
        onOpenVoiceModal={() => setShowVoiceModal(true)}
        onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
        onUndo={undoCharacters}
        onRedo={redoCharacters}
        canUndo={canUndoCharacters}
        canRedo={canRedoCharacters}
        activeTab={activeTab}
      />

      {/* Main App Workspace Layout Container with Left Sidebar Dock */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-4 flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Vertical Dock Sidebar */}
        <SidebarDock
          activeTab={activeTab}
          onTabChange={setActiveTab}
          edition={currentSystemTheme}
          onUndo={undoCharacters}
          onRedo={redoCharacters}
          canUndo={canUndoCharacters}
          canRedo={canRedoCharacters}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenCampaignGraph={() => setShowCampaignGraphModal(true)}
          onOpenAiAssistant={() => setShowAiAssistantModal(true)}
          onOpenExtensionManager={() => setShowExtensionManager(true)}
          onOpenSessionLobby={() => setShowSessionModal(true)}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
          onOpenAudioModal={() => setShowAudioModal(true)}
          onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
          onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
          currentUser={currentUser}
          activeSession={activeSession}
          isPhysicalDiceMode={isPhysicalDiceMode}
          onTogglePhysicalDiceMode={() => setIsPhysicalDiceMode(prev => !prev)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Navigation Tab Bar */}
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onDetachTab={handleDetachTab}
            isSpellcaster={activeCharacter?.isSpellcaster || false}
            edition={currentSystemTheme}
            currentUser={currentUser}
            hasActiveCharacter={!!activeCharacter}
            isDm={isDm}
            activeSession={activeSession}
          />

          {/* Quick Vitals & Combat Stats Bar */}
          {currentUser && activeCharacter && activeTab !== 'menu' && (
            <QuickStatsBar
              activeCharacter={activeCharacter}
              edition={currentSystemTheme}
              onUpdateCharacter={handleUpdateCharacter}
              onRollInitiative={handleRollInitiative}
              onOpenLevelUp={() => setShowLevelUpWizard(true)}
            />
          )}

          {/* Main Content Body */}
          <main className="w-full">
            {activeTab === 'menu' && (
              <div id="tabpanel-menu" role="tabpanel" aria-labelledby="tab-menu" tabIndex={0}>
                <MainMenu
                  characters={characters}
                  activeCharacter={activeCharacter}
                  onSelectCharacter={handleSelectCharacter}
                  onCreateNewCharacter={handleOpenNewCharacterModal}
                  onEnterGame={() => setActiveTab('sheet1')}
                  onSystemChange={handleSystemChange}
                  edition={currentSystemTheme}
                  currentUser={currentUser}
                  presenceMap={presenceMap}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  enabledSystems={enabledSystems}
                  onOpenSystemSelector={() => setShowTRPGSelectorModal(true)}
                  onOpenAudioModal={() => setShowAudioModal(true)}
                  onOpenAiAssistant={() => setShowAiAssistantModal(true)}
                  onOpenSessionLobby={() => setShowSessionModal(true)}
                  onOpenCampaignGraph={() => setShowCampaignGraphModal(true)}
                  onExploreCompendium={() => {
                    // Navigate to sheet7 (Compendium & Rules) or sheet6 (Guide)
                    setActiveTab('sheet7');
                  }}
                  onOpenDeveloperSdk={() => setShowDeveloperSdk(true)}
                />
              </div>
            )}

            {activeTab === 'sheet1' && activeCharacter && (
              <div id="tabpanel-sheet1" role="tabpanel" aria-labelledby="tab-sheet1" tabIndex={0}>
                <Sheet1StatsFeatures
                  character={activeCharacter}
                  currentUser={currentUser}
                  activeSession={activeSession}
                  onUpdateCharacter={handleUpdateCharacter}
                  onAddMonsterToRoster={(monster) => {
                    setCharacters(prev => [...prev, monster]);
                  }}
                  onRoll={handleRoll}
                />
              </div>
            )}

            {activeTab === 'sheet2' && activeCharacter && (
              <div id="tabpanel-sheet2" role="tabpanel" aria-labelledby="tab-sheet2" tabIndex={0}>
                <Sheet2Combat
                  character={activeCharacter}
                  allCharacters={characters}
                  parties={parties}
                  currentUser={currentUser}
                  onOpenPartyManager={() => setShowPartyModal(true)}
                  onUpdateCharacter={handleUpdateCharacter}
                  onAddMonsterToRoster={(monster) => {
                    setCharacters(prev => [...prev, monster]);
                  }}
                  onRoll={handleRoll}
                  onRollDamage={handleRollDamage}
                  onOpenGenerators={handleOpenGenerators}
                />
              </div>
            )}

            {activeTab === 'sheet3' && activeCharacter && (
              <div id="tabpanel-sheet3" role="tabpanel" aria-labelledby="tab-sheet3" tabIndex={0}>
                <Sheet3GearWealth
                  character={activeCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                  onRollDamage={handleRollDamage}
                  onOpenGenerators={handleOpenGenerators}
                />
              </div>
            )}

            {activeTab === 'sheet4' && activeCharacter && (
              <div id="tabpanel-sheet4" role="tabpanel" aria-labelledby="tab-sheet4" tabIndex={0}>
                <Sheet4Spells
                  character={activeCharacter}
                  allCharacters={characters}
                  currentUser={currentUser}
                  onUpdateCharacter={handleUpdateCharacter}
                  onAddMonsterToRoster={(monster) => {
                    setCharacters(prev => [...prev, monster]);
                  }}
                  onRoll={handleRoll}
                  onRollDamage={handleRollDamage}
                />
              </div>
            )}

            {activeTab === 'sheet5' && activeCharacter && (
              <div id="tabpanel-sheet5" role="tabpanel" aria-labelledby="tab-sheet5" tabIndex={0}>
                <Sheet5DescriptionNotes
                  character={activeCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                  onOpenGenerators={handleOpenGenerators}
                  onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
                />
              </div>
            )}

            {activeTab === 'sheet6' && (
              <div id="tabpanel-sheet6" role="tabpanel" aria-labelledby="tab-sheet6" tabIndex={0}>
                <Sheet6UserGuide
                  edition={currentSystemTheme}
                  enabledSystems={enabledSystems}
                />
              </div>
            )}

            {activeTab === 'sheet7' && (
              <div id="tabpanel-sheet7" role="tabpanel" aria-labelledby="tab-sheet7" tabIndex={0}>
                <Sheet7Compendium
                  activeCharacter={activeCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                  onAddMonsterToRoster={(monster) => {
                    setCharacters(prev => [...prev, monster]);
                  }}
                  enabledSystems={enabledSystems}
                />
              </div>
            )}

            {activeTab === 'sheetDm' && isDm && activeSession && (
              <div id="tabpanel-sheetDm" role="tabpanel" aria-labelledby="tab-sheetDm" tabIndex={0}>
                <SheetDmOverview
                  activeSession={activeSession}
                  allCharacters={characters}
                  currentUser={currentUser}
                  onUpdateCharacter={handleUpdateCharacter}
                  onDetach={() => handleDetachTab('sheetDm')}
                  onOpenUpgradeModal={handleOpenUpgradeModal}
                  onOpenGenerators={handleOpenGenerators}
                  onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
                  onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Interactive Dice Roller */}
      <DiceRoller
        rollLogs={rollLogs}
        onRoll={handleRoll}
        onClearLogs={() => setRollLogs([])}
        activeRollResult={activeRollResult}
        onOpenAudioModal={() => setShowAudioModal(true)}
        isPhysicalDiceMode={isPhysicalDiceMode}
        onTogglePhysicalDiceMode={() => setIsPhysicalDiceMode(prev => !prev)}
        onOpenUpgradeModal={handleOpenUpgradeModal}
      />

      {/* Level-Up Progression Wizard Modal */}
      {showLevelUpWizard && activeCharacter && (
        <LevelUpWizardModal
          isOpen={showLevelUpWizard}
          onClose={() => setShowLevelUpWizard(false)}
          character={activeCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onRoll={handleRoll}
        />
      )}

      {/* Physical Tabletop Dice Modal */}
      {physicalRollRequest && (
        <PhysicalDiceModal request={physicalRollRequest} />
      )}

      {/* New Character Modal */}
      {showNewCharacterModal && (
        <NewCharacterModal
          onClose={() => setShowNewCharacterModal(false)}
          onCreate={handleCreateNewCharacter}
          initialEdition={currentSystemTheme}
          initialIsMonster={newCharCategory === 'monster'}
          initialIsVendor={newCharCategory === 'vendor'}
          enabledSystems={enabledSystems}
        />
      )}

      {/* Guided Onboarding Tour Modal */}
      <GuidedTourModal />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        characters={characters}
        activeCharacter={activeCharacter || characters[0]}
        onSelectCharacter={(char) => handleSelectCharacter(char.id)}
        onOpenNewCharacter={() => handleOpenNewCharacterModal()}
        onOpenOptions={() => setShowAudioModal(true)}
        onOpenAudio={() => setShowAudioModal(true)}
        onOpenExtensionManager={() => setShowExtensionManager(true)}
        onOpenDeveloperSdk={() => setShowDeveloperSdk(true)}
        onOpenCampaignGraph={() => setShowCampaignGraphModal(true)}
        onOpenAiAssistant={() => setShowAiAssistantModal(true)}
        onOpenGenerators={handleOpenGenerators}
        onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
        onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
        onNavigateTab={(tab) => setActiveTab(normalizeTabId(tab))}
        onRollDice={() => handleRoll('Manual Dice Roll', 20, 1, 0, 'normal')}
      />

      <Suspense fallback={null}>
        {/* TRPG System Selector Screen Modal */}
        {showTRPGSelectorModal && (
          <TRPGSystemSelectorModal
            isOpen={showTRPGSelectorModal}
            onClose={() => setShowTRPGSelectorModal(false)}
            enabledSystems={enabledSystems}
            onSaveSystems={handleSaveTRPGSystems}
            isInitialSetup={!hasConfiguredSystems}
          />
        )}

        {/* Party Manager Modal */}
        {showPartyModal && (
          <PartyManagerModal
            isOpen={showPartyModal}
            onClose={() => setShowPartyModal(false)}
            parties={parties}
            allCharacters={characters}
            activeCharacterId={activeCharacter?.id || ''}
            onUpdateParties={setParties}
            onSelectCharacter={(charId) => {
              handleSelectCharacter(charId);
              setShowPartyModal(false);
            }}
            currentUser={currentUser}
            presenceMap={presenceMap}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {/* Session Lobby & Room Code Modal */}
        {showSessionModal && (
          <SessionLobbyModal
            isOpen={showSessionModal}
            onClose={() => setShowSessionModal(false)}
            currentUser={currentUser}
            activeSession={activeSession}
            activeSessionCode={activeSessionCode}
            activeCharacter={activeCharacter}
            allCharacters={characters}
            presenceMap={presenceMap}
            onSessionChange={(code) => setActiveSessionCode(code)}
            onSelectCharacter={handleSelectCharacter}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onLoadCampaignSave={handleLoadCampaignSave}
          />
        )}

        {/* User Account & Role Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            currentUser={currentUser}
            onUserChange={setCurrentUser}
          />
        )}

        {/* Audio & Options Modal */}
        {showAudioModal && (
          <AudioOptionsModal
            isOpen={showAudioModal}
            onClose={() => setShowAudioModal(false)}
            currentUser={currentUser}
            activeSession={activeSession}
            activeCharacter={activeCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onSystemChange={handleSystemChange}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}

        {/* Extension & Plugin Manager Modal */}
        {showExtensionManager && (
          <ExtensionManagerModal
            isOpen={showExtensionManager}
            onClose={() => setShowExtensionManager(false)}
            enabledSystems={enabledSystems}
            onToggleSystem={(sysId) => {
              const updated = enabledSystems.includes(sysId)
                ? enabledSystems.filter(s => s !== sysId)
                : [...enabledSystems, sysId];
              setEnabledSystems(updated);
              localStorage.setItem('dnd_app_enabled_systems_v2', JSON.stringify(updated));
            }}
            onOpenDeveloperSdk={() => setShowDeveloperSdk(true)}
          />
        )}

        {/* Developer SDK & Architecture Center Modal */}
        {showDeveloperSdk && (
          <DeveloperSdkModal
            isOpen={showDeveloperSdk}
            onClose={() => setShowDeveloperSdk(false)}
          />
        )}

        {/* Phase 1: Observability & Structured Tracing Console Modal */}
        {showDiagnosticConsole && (
          <DiagnosticConsoleModal
            isOpen={showDiagnosticConsole}
            onClose={() => setShowDiagnosticConsole(false)}
          />
        )}

        {/* Complete User Manual Modal */}
        {showUserManualModal && (
          <UserManualModal
            isOpen={showUserManualModal}
            onClose={() => setShowUserManualModal(false)}
          />
        )}

        {/* Obsidian-Style RPG Campaign Knowledge Graph Modal */}
        {showCampaignGraphModal && (
          <CampaignGraphModal
            isOpen={showCampaignGraphModal}
            onClose={() => {
              setShowCampaignGraphModal(false);
              setInitialGraphEntityName(undefined);
            }}
            initialEntityName={initialGraphEntityName}
            onNavigateTab={(tab) => setActiveTab(normalizeTabId(tab))}
          />
        )}

        {/* Nexus AI Oracle & Entity Forge Modal */}
        {showAiAssistantModal && (
          <AiAssistantModal
            isOpen={showAiAssistantModal}
            onClose={() => setShowAiAssistantModal(false)}
            activeCharacter={activeCharacter}
            ruleEdition={currentSystemTheme}
            onAddCharacter={(monsterOrChar) => {
              handleCreateNewCharacter(monsterOrChar);
            }}
            onAddItemToInventory={(item) => {
              handleAddItemToActiveCharacter(item);
            }}
            onAddSpellToSpellbook={(spell) => {
              handleAddSpellToActiveCharacter(spell);
            }}
            onNavigateTab={(tab) => {
              setActiveTab(normalizeTabId(tab));
            }}
          />
        )}

        {/* Phase B: In-Flow Tabletop AI Generators Modal */}
        {showTabletopGenerators && (
          <TabletopGeneratorsModal
            isOpen={showTabletopGenerators}
            onClose={() => setShowTabletopGenerators(false)}
            initialTab={tabletopGeneratorsTab}
            activeCharacter={activeCharacter}
            ruleEdition={currentSystemTheme}
            onAddCharacter={(char) => {
              handleCreateNewCharacter(char);
            }}
            onAddItemToInventory={(item) => {
              handleAddItemToActiveCharacter(item);
            }}
            onAddSpellToSpellbook={(spell) => {
              handleAddSpellToActiveCharacter(spell);
            }}
            onPopulateCombatEncounter={handlePopulateCombatEncounter}
            onAppendSessionNotes={handleAppendSessionNotes}
          />
        )}

        {/* Phase C: Live Tabletop Session Co-Pilot HUD Drawer */}
        <LiveSessionCopilotDrawer
          isOpen={showLiveCopilotDrawer}
          onClose={() => setShowLiveCopilotDrawer(false)}
          activeCharacter={activeCharacter}
          ruleEdition={currentSystemTheme}
          onRoll={handleRoll}
        />

        {/* Phase D: Campaign World Atlas & Knowledge Lore Vault */}
        <CampaignLoreVaultModal
          isOpen={showCampaignLoreVaultModal}
          onClose={() => setShowCampaignLoreVaultModal(false)}
          initialTab={campaignLoreVaultInitialTab}
          onOpenKnowledgeGraph={(entityName) => {
            setInitialGraphEntityName(entityName);
            setShowCampaignGraphModal(true);
          }}
          onOpenGenerators={handleOpenGenerators}
        />

        {/* Integrated Party WebRTC Voice Client Widget */}
        <PartyVoiceWidget
          activeSession={activeSession}
          currentUser={currentUser}
          activeCharacterName={activeCharacter?.name}
          isOpenModal={showVoiceModal}
          onCloseModal={() => setShowVoiceModal(false)}
        />

        {/* Global Persistent Campaign Ambience Player (Continues playing across sheet/tab swaps) */}
        <PersistentAmbiencePlayer
          activeSession={activeSession}
          currentUser={currentUser}
        />

        {/* Supporter Tier Upgrade & PayPal Checkout Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          defaultTier={upgradeModalRequiredTier}
          reason={upgradeModalReason}
        />
      </Suspense>
    </div>
  );

  return (
    <SubscriptionProvider currentUser={currentUser} onUserUpdate={setCurrentUser}>
      <ThemeProvider>
        {appContent}

        {/* Center-Screen 3D Animated Dice Roll Overlay for all Rolls (Combat, Spells, Skills, Weapons, etc.) */}
        <GlobalDiceOverlay
          rollResult={activeRollResult}
          onDismiss={() => setActiveRollResult(null)}
          displayDurationMs={5000}
        />

        <Suspense fallback={null}>
          <GlobalUpgradeModal onOpenAuthModal={() => setShowAuthModal(true)} />
        </Suspense>
      </ThemeProvider>
    </SubscriptionProvider>
  );
}
