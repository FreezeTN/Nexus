import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { RuleEdition, CharacterData } from './types';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { QuickStatsBar } from './components/QuickStatsBar';
import { SidebarDock } from './components/SidebarDock';
import { DiceRoller } from './components/DiceRoller';
import { Sheet1StatsFeatures } from './components/sheets/Sheet1StatsFeatures';
import { Sheet2Combat } from './components/sheets/Sheet2Combat';

// Code-split heavy sub-sheets for fast initial paint and reduced bundle size
const Sheet3GearWealth = React.lazy(() => import('./components/sheets/Sheet3GearWealth').then(m => ({ default: m.Sheet3GearWealth })));
const Sheet4Spells = React.lazy(() => import('./components/sheets/Sheet4Spells').then(m => ({ default: m.Sheet4Spells })));
const Sheet5DescriptionNotes = React.lazy(() => import('./components/sheets/Sheet5DescriptionNotes').then(m => ({ default: m.Sheet5DescriptionNotes })));
const Sheet6UserGuide = React.lazy(() => import('./components/sheets/Sheet6UserGuide').then(m => ({ default: m.Sheet6UserGuide })));
const Sheet7Compendium = React.lazy(() => import('./components/sheets/Sheet7Compendium').then(m => ({ default: m.Sheet7Compendium })));
const SheetDmOverview = React.lazy(() => import('./components/sheets/SheetDmOverview').then(m => ({ default: m.SheetDmOverview })));
const EncounterTracker = React.lazy(() => import('./components/combat/EncounterTracker').then(m => ({ default: m.EncounterTracker })));
const CommandPaletteModal = React.lazy(() => import('./components/common/CommandPaletteModal').then(m => ({ default: m.CommandPaletteModal })));
const GuidedTourModal = React.lazy(() => import('./components/common/GuidedTourModal').then(m => ({ default: m.GuidedTourModal })));
const LiveSessionCopilotDrawer = React.lazy(() => import('./components/common/LiveSessionCopilotDrawer').then(m => ({ default: m.LiveSessionCopilotDrawer })));
const PhysicalDiceModal = React.lazy(() => import('./components/modals/PhysicalDiceModal').then(m => ({ default: m.PhysicalDiceModal })));
const GlobalUpgradeModal = React.lazy(() => import('./components/modals/GlobalUpgradeModal').then(m => ({ default: m.GlobalUpgradeModal })));
const DuplicateCharacterModal = React.lazy(() => import('./components/modals/DuplicateCharacterModal').then(m => ({ default: m.DuplicateCharacterModal })));

import { DetachedHeaderBanner } from './components/common/DetachedHeaderBanner';
import { getDetachedParams } from './utils/useDetachedSync';
import { MainMenu } from './components/MainMenu';
import { PartyVoiceWidget } from './components/voice/PartyVoiceWidget';
import { PersistentAmbiencePlayer } from './components/audio/PersistentAmbiencePlayer';
import { useHotkeys } from './context/HotkeyContext';
import { useUiMode } from './context/UiModeContext';
import { useAccessibility } from './context/AccessibilityContext';
import { Crown } from 'lucide-react';

import { GeneratedEncounter, hydrateGeneratedMonster } from './services/geminiService';
import { Combatant, CombatLogEntry, SavedEncounterData } from './components/combat/encounter/encounterTypes';
import { loadSavedEncounter } from './components/combat/encounter/useEncounterState';
import { getMonsterPortraitUrl } from './data/monsterPortraits';
import { EncounterEnvironment } from './types';
import { GlobalDiceOverlay } from './components/dice/GlobalDiceOverlay';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TableModeHud } from './components/tableMode/TableModeHud';
import { FloatingQuickPlayDock } from './components/common/FloatingQuickPlayDock';
import { ModalProvider, ModalContainer } from './modals';
import { useLayoutCustomization } from './utils/layoutCustomization';

// Modular Manager Hooks
import {
  useAuthManager,
  useSystemManager,
  useCharacterManager,
  useSessionSync,
  useDiceEngine,
  useModalCoordinator
} from './hooks';
import { isCharacterSpellcaster } from './utils/dndCalculations';

const normalizeTabId = (tab: string): TabId => {
  switch (tab) {
    case '1':
    case 'stats':
    case 'sheet1':
      return 'sheet1';
    case '2':
    case 'combat':
    case 'turn_order':
    case 'turnorder':
    case 'encounter':
    case 'sheet2':
      return 'sheet2';
    case '3':
    case 'gear':
    case 'inventory':
    case 'sheet3':
      return 'sheet3';
    case '4':
    case 'spells':
    case 'magic':
    case 'sheet4':
      return 'sheet4';
    case '5':
    case 'notes':
    case 'description':
    case 'sheet5':
      return 'sheet5';
    case '6':
    case 'guide':
    case 'userguide':
    case 'sheet6':
      return 'sheet6';
    case '7':
    case 'compendium':
    case 'sheet7':
      return 'sheet7';
    case 'dm':
    case 'sheetDm':
      return 'sheetDm';
    case 'battlemap':
    case 'map':
      return 'battlemap';
    case 'menu':
      return 'menu';
    default:
      return 'sheet1';
  }
};

const SheetLoadingFallback = () => (
  <div className="flex items-center justify-center py-24 text-stone-400">
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-stone-900/90 border border-amber-600/30 text-xs font-mono shadow-xl">
      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-amber-200 font-semibold">Loading workspace view...</span>
    </div>
  </div>
);

function AppWorkspace() {
  const detachedParams = useMemo(() => getDetachedParams(), []);
  const isDetachedWindow = Boolean(detachedParams.detachedTab);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (detachedParams.detachedTab) {
      return normalizeTabId(detachedParams.detachedTab);
    }
    return 'sheet1';
  });

  const { matchesHotkey } = useHotkeys();
  const { toggleUiMode, startTour, isTableMode, toggleTableMode, setIsTableMode } = useUiMode();
  const { announceLiveMessage } = useAccessibility();
  const { isVisible } = useLayoutCustomization();

  // 1. Authentication Manager
  const { currentUser, setCurrentUser } = useAuthManager();

  // Session Code State
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionFromUrl = urlParams.get('session');
      if (sessionFromUrl) return sessionFromUrl.toUpperCase();
      return localStorage.getItem('dnd_app_session_code_v1') || null;
    } catch {
      return null;
    }
  });

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
    handleImportJson,
    handleSyncToBaseCharacter,
    handleDuplicateCharacter
  } = useCharacterManager({
    currentUser,
    activeSessionCode,
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
    activeSession,
    isDm,
    handleLoadCampaignSave
  } = useSessionSync({
    currentUser,
    activeSessionCode,
    setActiveSessionCode,
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
    optionalRulesUsePhysicalDice: activeSession?.optionalRules?.usePhysicalDiceMode,
    currentUser,
    activeSessionCode,
    activeSession
  });

  // UI Drawer & Modal State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLiveCopilotDrawer, setShowLiveCopilotDrawer] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [characterToDuplicate, setCharacterToDuplicate] = useState<CharacterData | null>(null);

  // Encounter populator helper
  const handlePopulateCombatEncounter = (encounter: GeneratedEncounter) => {
    if (!encounter || !encounter.enemies) return;
    const newMonsters: CharacterData[] = [];
    const newCombatants: Combatant[] = [];

    encounter.enemies.forEach((enemy, idx) => {
      const monsterChar = hydrateGeneratedMonster(enemy, currentSystemTheme);
      newMonsters.push(monsterChar);

      const combatant: Combatant = {
        id: `enc-mob-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: monsterChar.name,
        type: 'enemy',
        hpCurrent: monsterChar.hpCurrent ?? monsterChar.hpMax ?? 20,
        hpMax: monsterChar.hpMax ?? 20,
        tempHp: monsterChar.hpTemp ?? 0,
        armorClass: monsterChar.armorClass ?? 10,
        initiative: 0,
        conditions: [],
        portraitUrl: getMonsterPortraitUrl(monsterChar.name, currentSystemTheme)
      };
      newCombatants.push(combatant);
    });

    if (newMonsters.length > 0) {
      setCharacters(prev => [...prev, ...newMonsters]);
    }

    const baseChar = activeCharacter || characters[0];
    if (baseChar) {
      const currentSaved = loadSavedEncounter(baseChar);
      const newLog: CombatLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        round: currentSaved.roundNumber || 1,
        category: 'note',
        message: `Encounter generated by Nexus AI: "${encounter.name || 'Combat Encounter'}" with ${newCombatants.length} adversaries.`
      };

      const updatedEncounter: SavedEncounterData = {
        ...currentSaved,
        combatants: [...currentSaved.combatants, ...newCombatants],
        combatLogs: [newLog, ...currentSaved.combatLogs],
        roundNumber: currentSaved.roundNumber || 1
      };

      localStorage.setItem('dnd_encounter_state_v1', JSON.stringify(updatedEncounter));
    }
    setActiveTab('sheet2');
  };

  const handleAppendSessionNotes = (notes: string) => {
    if (!activeCharacter) return;
    const currentNotes = activeCharacter.additionalNotes || '';
    const updatedNotes = currentNotes ? `${currentNotes}\n\n${notes}` : notes;
    handleUpdateCharacter({ ...activeCharacter, additionalNotes: updatedNotes });
  };

  // Active Campaign Party selection
  const [activePartyId, setActivePartyId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('penpaper_active_party_id');
      if (saved && parties.some(p => p.id === saved)) return saved;
    } catch (e) {}
    const match = parties.find(p => p.characterIds.includes(activeCharacterId));
    return match?.id || parties[0]?.id || '';
  });

  const handleSelectPartyId = (partyId: string) => {
    setActivePartyId(partyId);
    try {
      localStorage.setItem('penpaper_active_party_id', partyId);
    } catch (e) {}
  };

  const currentEdition = currentSystemTheme || '5e';
  const activeParty = parties.find(p => p.id === activePartyId) || parties.find(p => p.characterIds.includes(activeCharacterId)) || parties[0];
  const activePartyCharIds = useMemo(() => new Set(activeParty?.characterIds || []), [activeParty]);

  const activeCampaignPlayerCharacters = useMemo(() => {
    return characters.filter(c => 
      !c.isMonster && 
      !c.isVendor && 
      c.characterClass?.toLowerCase() !== 'monster' &&
      (c.edition || '5e') === currentEdition &&
      (activePartyCharIds.size === 0 || activePartyCharIds.has(c.id))
    );
  }, [characters, currentEdition, activePartyCharIds]);

  const localCampaignSession = useMemo(() => ({
    id: 'local-campaign-session',
    code: 'LOCAL',
    name: activeParty?.name || 'Campaign Party Dashboard',
    dmUid: currentUser?.uid || 'local-gm',
    dmName: currentUser?.displayName || 'Game Master',
    status: 'active' as const,
    members: activeCampaignPlayerCharacters.map(c => ({
      uid: `local-${c.id}`,
      displayName: '',
      characterId: c.id,
      characterName: c.name,
      role: 'Player' as const,
      joinedAt: new Date().toISOString()
    })),
    activeCharacterIds: activeCampaignPlayerCharacters.map(c => c.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }), [activeParty, currentUser, activeCampaignPlayerCharacters]);

  // 6. Centralized Modal Coordinator
  const {
    handleOpenUpgradeModal,
    handleOpenAuthModal,
    handleOpenNewCharacterModal,
    handleOpenTRPGSelector,
    handleOpenPartyModal,
    handleOpenSessionModal,
    handleOpenUniversalImporter,
    handleOpenAudioModal,
    handleOpenExtensionManager,
    handleOpenDeveloperSdk,
    handleOpenDiagnosticConsole,
    handleOpenUserManual,
    handleOpenCampaignGraph,
    handleOpenAiAssistant,
    handleOpenGenerators,
    handleOpenCampaignLoreVault,
    handleOpenLevelUpWizard
  } = useModalCoordinator({
    currentUser,
    characters,
    hasConfiguredSystems,
    activeCharacter,
    currentSystemTheme,
    enabledSystems,
    parties,
    activeSession,
    activeSessionCode: activeSessionCode || undefined,
    presenceMap,
    onNavigateTab: (tab) => setActiveTab(normalizeTabId(tab)),
    onUpdateCharacter: handleUpdateCharacter,
    onCreateCharacter: handleCreateNewCharacter,
    onSelectCharacter: handleSelectCharacter,
    onSetParties: setParties,
    onSetSessionCode: (code) => setActiveSessionCode(code),
    onSaveTRPGSystems: handleSaveTRPGSystems,
    onToggleSystem: (sysId) => {
      const updated = enabledSystems.includes(sysId)
        ? enabledSystems.filter(s => s !== sysId)
        : [...enabledSystems, sysId];
      setEnabledSystems(updated);
      localStorage.setItem('dnd_app_enabled_systems_v2', JSON.stringify(updated));
    },
    onExportJson: handleExportJson,
    onImportJson: handleImportJson,
    onLoadCampaignSave: handleLoadCampaignSave,
    onAddItemToInventory: handleAddItemToActiveCharacter,
    onAddSpellToSpellbook: handleAddSpellToActiveCharacter,
    onPopulateCombatEncounter: handlePopulateCombatEncounter,
    onAppendSessionNotes: handleAppendSessionNotes,
    onLoadBattlemapLayout: (layout: any) => {
      sessionStorage.setItem('dnd_pending_battlemap_layout', JSON.stringify(layout));
      window.dispatchEvent(new CustomEvent('dnd_battlemap_layout_deployed', { detail: { layout } }));
    },
    onRoll: handleRoll,
    onUserChange: setCurrentUser,
    onUndo: undoCharacters,
    onRedo: redoCharacters,
    canUndo: canUndoCharacters,
    canRedo: canRedoCharacters
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (matchesHotkey(e, 'quickSearch') || matchesHotkey(e, 'commandPalette') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
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

      // Table / Focused Play Mode shortcut (Alt+T)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTableMode();
        announceLiveMessage('Toggled Tabletop Play Mode HUD', 'polite');
        return;
      }

      if (matchesHotkey(e, 'openTour')) {
        e.preventDefault();
        startTour();
        return;
      }

      if (matchesHotkey(e, 'openOptions')) {
        e.preventDefault();
        handleOpenAudioModal();
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
        handleOpenCampaignLoreVault('atlas');
        return;
      }

      // Observability & Diagnostic Console shortcut (Ctrl+Shift+D or Cmd+Shift+D)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleOpenDiagnosticConsole();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchesHotkey, enabledSystems, currentSystemTheme, handleSystemChange, handleOpenAudioModal, handleOpenCampaignLoreVault, handleOpenDiagnosticConsole, startTour, toggleUiMode, toggleTableMode, announceLiveMessage]);

  const handleDetachTab = (tab: TabId) => {
    const url = `${window.location.origin}${window.location.pathname}?detachedTab=${tab}${activeCharacterId ? `&initialCharId=${activeCharacterId}` : ''}`;
    try {
      const win = window.open(url, `_blank_${tab}`, 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
      if (!win) {
        announceLiveMessage('Pop-up window was blocked. Please allow pop-ups to detach windows.');
      }
    } catch {
      announceLiveMessage('Unable to open detached window due to browser or frame security settings.');
    }
  };

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
          sessionCode={activeSessionCode || undefined}
        />

        <main className="w-full max-w-[1600px] mx-auto p-3 sm:p-6">
          {activeTab === 'sheetDm' && (
            <SheetDmOverview
              activeSession={activeSession || localCampaignSession}
              allCharacters={characters}
              currentUser={currentUser}
              onUpdateCharacter={handleUpdateCharacter}
              onDetach={() => handleDetachTab('sheetDm')}
              onOpenUpgradeModal={handleOpenUpgradeModal}
              ruleEdition={currentSystemTheme}
              parties={parties}
              activePartyId={activePartyId}
              onSelectPartyId={handleSelectPartyId}
            />
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
              onOpenPartyManager={handleOpenPartyModal}
              onUpdateCharacter={handleUpdateCharacter}
              onAddMonsterToRoster={(monster) => {
                setCharacters(prev => [...prev, monster]);
              }}
              onRoll={handleRoll}
              onRollDamage={handleRollDamage}
            />
          )}

          {activeTab === 'battlemap' && activeCharacter && (
            <EncounterTracker
              character={activeCharacter}
              allCharacters={characters}
              parties={parties}
              currentUser={currentUser}
              activeSession={activeSession}
              activeSessionCode={activeSessionCode}
              onOpenPartyManager={handleOpenPartyModal}
              onUpdateCharacter={handleUpdateCharacter}
              onRoll={handleRoll}
              initialViewMode="battlemap"
              isStandaloneBattlemap={true}
            />
          )}

          {activeTab === 'sheet3' && activeCharacter && (
            <Sheet3GearWealth
              character={activeCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onAddItemToInventory={handleAddItemToActiveCharacter}
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
              onAddItemToInventory={handleAddItemToActiveCharacter}
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
          onOpenAudioModal={handleOpenAudioModal}
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

  return (
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
        onOpenPartyManager={handleOpenPartyModal}
        onOpenSessionLobby={handleOpenSessionModal}
        onOpenCampaignGraph={() => handleOpenCampaignGraph()}
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
        onOpenAuthModal={handleOpenAuthModal}
        presenceMap={presenceMap}
        enabledSystems={enabledSystems}
        onOpenSystemSelector={() => handleOpenTRPGSelector(false)}
        onOpenAudioModal={handleOpenAudioModal}
        onOpenUniversalImporterStudio={handleOpenUniversalImporter}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenExtensionManager={handleOpenExtensionManager}
        onOpenVoiceModal={() => setShowVoiceModal(true)}
        onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
        onUndo={undoCharacters}
        onRedo={redoCharacters}
        canUndo={canUndoCharacters}
        canRedo={canRedoCharacters}
        activeTab={activeTab}
      />

      {/* Main App Workspace Layout Container */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-4">
        {isTableMode && activeCharacter && activeTab !== 'menu' ? (
          <TableModeHud
            character={activeCharacter}
            edition={currentSystemTheme}
            onUpdateCharacter={handleUpdateCharacter}
            onRoll={handleRoll}
            onRollDamage={handleRollDamage}
            onRollInitiative={handleRollInitiative}
            onExitTableMode={() => setIsTableMode(false)}
            onOpenCombatTracker={() => {
              setIsTableMode(false);
              setActiveTab('sheet2');
            }}
            onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
            onOpenCampaignAtlas={() => handleOpenCampaignLoreVault('atlas')}
            onOpenAudioSettings={handleOpenAudioModal}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
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
              onOpenCampaignGraph={() => handleOpenCampaignGraph()}
              onOpenAiAssistant={handleOpenAiAssistant}
              onOpenExtensionManager={handleOpenExtensionManager}
              onOpenSessionLobby={handleOpenSessionModal}
              onOpenVoiceModal={() => setShowVoiceModal(true)}
              onOpenAudioModal={handleOpenAudioModal}
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
                isSpellcaster={activeCharacter ? isCharacterSpellcaster(activeCharacter) : false}
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
                  activeTab={activeTab}
                  onUpdateCharacter={handleUpdateCharacter}
                  onRollInitiative={handleRollInitiative}
                />
              )}

              {/* Main Content Body */}
              <main className="w-full">
                <Suspense fallback={<SheetLoadingFallback />}>
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
                        onOpenAuthModal={handleOpenAuthModal}
                        enabledSystems={enabledSystems}
                        onOpenSystemSelector={() => handleOpenTRPGSelector(false)}
                        onOpenAudioModal={handleOpenAudioModal}
                        onOpenAiAssistant={handleOpenAiAssistant}
                        onOpenSessionLobby={handleOpenSessionModal}
                        onOpenCampaignGraph={() => handleOpenCampaignGraph()}
                        onExploreCompendium={() => {
                          setActiveTab('sheet7');
                        }}
                        onOpenDeveloperSdk={handleOpenDeveloperSdk}
                        onDuplicateCharacter={(char) => setCharacterToDuplicate(char)}
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
                        onDuplicateCharacter={(char) => setCharacterToDuplicate(char)}
                        onSyncToBaseCharacter={handleSyncToBaseCharacter}
                      />
                    </div>
                  )}

                  {activeTab === 'sheet2' && activeCharacter && (
                    <div id="tabpanel-sheet2" role="tabpanel" aria-labelledby="tab-sheet2" tabIndex={0}>
                      <Sheet2Combat
                        character={activeCharacter}
                        edition={currentSystemTheme}
                        allCharacters={characters}
                        parties={parties}
                        currentUser={currentUser}
                        activeSession={activeSession}
                        activeSessionCode={activeSessionCode}
                        onOpenPartyManager={handleOpenPartyModal}
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

                  {activeTab === 'battlemap' && activeCharacter && (
                    <div id="tabpanel-battlemap" role="tabpanel" aria-labelledby="tab-battlemap" tabIndex={0}>
                      <EncounterTracker
                        character={activeCharacter}
                        allCharacters={characters}
                        parties={parties}
                        currentUser={currentUser}
                        activeSession={activeSession}
                        activeSessionCode={activeSessionCode}
                        onOpenPartyManager={handleOpenPartyModal}
                        onUpdateCharacter={handleUpdateCharacter}
                        onRoll={handleRoll}
                        initialViewMode="battlemap"
                        isStandaloneBattlemap={true}
                      />
                    </div>
                  )}

                  {activeTab === 'sheet3' && activeCharacter && (
                    <div id="tabpanel-sheet3" role="tabpanel" aria-labelledby="tab-sheet3" tabIndex={0}>
                      <Sheet3GearWealth
                        character={activeCharacter}
                        onUpdateCharacter={handleUpdateCharacter}
                        onAddItemToInventory={handleAddItemToActiveCharacter}
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
                        allCharacters={characters}
                        onUpdateCharacter={handleUpdateCharacter}
                        onUpdateAllCharacters={setCharacters}
                        onAddItemToInventory={handleAddItemToActiveCharacter}
                        onAddMonsterToRoster={(monster) => {
                          setCharacters(prev => [...prev, monster]);
                        }}
                        enabledSystems={enabledSystems}
                      />
                    </div>
                  )}

                  {activeTab === 'sheetDm' && (
                    <div id="tabpanel-sheetDm" role="tabpanel" aria-labelledby="tab-sheetDm" tabIndex={0}>
                      <SheetDmOverview
                        activeSession={activeSession || localCampaignSession}
                        allCharacters={characters}
                        currentUser={currentUser}
                        onUpdateCharacter={handleUpdateCharacter}
                        onDetach={() => handleDetachTab('sheetDm')}
                        onOpenUpgradeModal={handleOpenUpgradeModal}
                        onOpenGenerators={handleOpenGenerators}
                        onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
                        onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
                        ruleEdition={currentSystemTheme}
                        parties={parties}
                        activePartyId={activePartyId}
                        onSelectPartyId={handleSelectPartyId}
                      />
                    </div>
                  )}
                </Suspense>
              </main>
            </div>
          </div>
        )}
      </div>

      {/* Floating Interactive Dice Roller */}
      {isVisible('ui_diceTray') && (
        <DiceRoller
          rollLogs={rollLogs}
          onRoll={handleRoll}
          onClearLogs={() => setRollLogs([])}
          activeRollResult={activeRollResult}
          onOpenAudioModal={handleOpenAudioModal}
          isPhysicalDiceMode={isPhysicalDiceMode}
          onTogglePhysicalDiceMode={() => setIsPhysicalDiceMode(prev => !prev)}
          onOpenUpgradeModal={handleOpenUpgradeModal}
          activeCharacter={activeCharacter}
          onUpdateCharacter={handleUpdateCharacter}
        />
      )}

      {/* Floating Quick-Action Play Dock (Active Table HUD) */}
      {isVisible('ui_floatingQuickDock') && activeCharacter && activeTab !== 'menu' && !isTableMode && (
        <FloatingQuickPlayDock
          character={activeCharacter}
          edition={currentSystemTheme}
          onUpdateCharacter={handleUpdateCharacter}
          onRollDice={(formula) => handleRoll('Quick Dock Roll', 20, 1, 0, 'normal')}
          onRollInitiative={handleRollInitiative}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onNavigateTab={(tab) => setActiveTab(normalizeTabId(tab))}
        />
      )}

      {/* Lazy-loaded Tabletop Modals */}
      <Suspense fallback={null}>
        {physicalRollRequest && (
          <PhysicalDiceModal request={physicalRollRequest} />
        )}

        <GuidedTourModal />

        <CommandPaletteModal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          characters={characters}
          activeCharacter={activeCharacter || characters[0]}
          onSelectCharacter={(char) => handleSelectCharacter(char.id)}
          onOpenNewCharacter={() => handleOpenNewCharacterModal('character', activeTab === 'menu' ? currentSystemTheme : (activeCharacter?.edition || currentSystemTheme))}
          onOpenOptions={handleOpenAudioModal}
          onOpenAudio={handleOpenAudioModal}
          onOpenExtensionManager={handleOpenExtensionManager}
          onOpenDeveloperSdk={handleOpenDeveloperSdk}
          onOpenCampaignGraph={() => handleOpenCampaignGraph()}
          onOpenAiAssistant={handleOpenAiAssistant}
          onOpenGenerators={handleOpenGenerators}
          onOpenCopilot={() => setShowLiveCopilotDrawer(true)}
          onOpenCampaignLoreVault={handleOpenCampaignLoreVault}
          onOpenUniversalImporterStudio={handleOpenUniversalImporter}
          onNavigateTab={(tab) => setActiveTab(normalizeTabId(tab))}
          onRollDice={() => handleRoll('Manual Dice Roll', 20, 1, 0, 'normal')}
        />

        <LiveSessionCopilotDrawer
          isOpen={showLiveCopilotDrawer}
          onClose={() => setShowLiveCopilotDrawer(false)}
          activeCharacter={activeCharacter}
          ruleEdition={currentSystemTheme}
          onRoll={handleRoll}
        />

        {characterToDuplicate && (
          <DuplicateCharacterModal
            character={characterToDuplicate}
            onClose={() => setCharacterToDuplicate(null)}
            onDuplicate={(charId, options) => {
              handleDuplicateCharacter(charId, options);
              setCharacterToDuplicate(null);
            }}
          />
        )}
      </Suspense>

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

      {/* Centralized Dynamic Modal Container (Lazy-loads all registered modals) */}
      <ModalContainer />

      {/* Center-Screen 3D Animated Dice Roll Overlay for all Rolls (Combat, Spells, Skills, Weapons, etc.) */}
      <GlobalDiceOverlay
        rollResult={activeRollResult}
        onDismiss={() => setActiveRollResult(null)}
        displayDurationMs={5000}
      />
    </div>
  );
}

export default function App() {
  const { currentUser, setCurrentUser } = useAuthManager();

  return (
    <SubscriptionProvider currentUser={currentUser} onUserUpdate={setCurrentUser}>
      <ThemeProvider>
        <ModalProvider>
          <AppWorkspace />
          <Suspense fallback={null}>
            <GlobalUpgradeModal />
          </Suspense>
        </ModalProvider>
      </ThemeProvider>
    </SubscriptionProvider>
  );
}
