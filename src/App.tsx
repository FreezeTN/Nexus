import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { CharacterData, DiceRollResult, RuleEdition, Party, CampaignSaveFile, GearItem, Spell } from './types';
import { SAMPLE_CHARACTERS } from './data/defaultCharacters';
import { DEFAULT_PARTIES } from './data/defaultParties';
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
import {
  getDetachedParams,
  openDetachedWindow,
  broadcastStateUpdate,
  useDetachedSyncListener
} from './utils/useDetachedSync';
import { MainMenu } from './components/MainMenu';
import { NewCharacterModal } from './components/modals/NewCharacterModal';
import { AuthModal } from './components/modals/AuthModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { PartyVoiceWidget } from './components/voice/PartyVoiceWidget';
import { PersistentAmbiencePlayer } from './components/audio/PersistentAmbiencePlayer';
import { eventBus } from './events/eventBus';
import { useHistoryState } from './utils/useHistoryState';
import { formatModifier, recalculateCharacterAC, isCharacterDead } from './utils/dndCalculations';
import { useHotkeys } from './context/HotkeyContext';
import { useUiMode } from './context/UiModeContext';
import { Crown } from 'lucide-react';

// Direct Modal Component Imports
import { CampaignGraphModal } from './components/modals/CampaignGraphModal';
import { DeveloperSdkModal } from './components/modals/DeveloperSdkModal';
import { UserManualModal } from './components/modals/UserManualModal';
import { ExtensionManagerModal } from './components/modals/ExtensionManagerModal';
import { AudioOptionsModal } from './components/modals/AudioOptionsModal';
import { SessionLobbyModal } from './components/modals/SessionLobbyModal';
import { PartyManagerModal } from './components/modals/PartyManagerModal';
import { TRPGSystemSelectorModal } from './components/modals/TRPGSystemSelectorModal';
import { AiAssistantModal } from './components/modals/AiAssistantModal';
import { PhysicalDiceModal, PhysicalRollRequest } from './components/modals/PhysicalDiceModal';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { GlobalUpgradeModal } from './components/modals/GlobalUpgradeModal';
import { GlobalDiceOverlay } from './components/dice/GlobalDiceOverlay';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { isDeveloperUser, getEffectiveUserTier, TIER_CONFIGS, SubscriptionTier } from './lib/subscription';
import { 
  auth, 
  onAuthStateChanged,
  getUserProfile, 
  UserProfile, 
  saveCharacterToCloud, 
  loadUserCharactersFromCloud, 
  deleteCharacterFromCloud,
  subscribeToCharacterPresence,
  updateCharacterPresence,
  subscribeToCharacterDoc,
  CharacterPresence,
  UserRole,
  GameSession,
  subscribeToGameSession,
  restoreGameSessionFromSave
} from './lib/firebase';

const STORAGE_KEY_CHARACTERS = 'dnd_app_characters_v5';
const STORAGE_KEY_ACTIVE = 'dnd_app_active_id_v4';
const STORAGE_KEY_PARTIES = 'dnd_app_parties_v1';
const STORAGE_KEY_ENABLED_SYSTEMS = 'dnd_app_enabled_systems_v2';

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [enabledSystems, setEnabledSystems] = useState<RuleEdition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENABLED_SYSTEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load enabled TRPG systems from localStorage', e);
    }
    return ['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu'];
  });

  const [hasConfiguredSystems, setHasConfiguredSystems] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ENABLED_SYSTEMS) !== null;
    } catch (e) {
      return false;
    }
  });

  const [showTRPGSelectorModal, setShowTRPGSelectorModal] = useState<boolean>(!hasConfiguredSystems);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showExtensionManager, setShowExtensionManager] = useState<boolean>(false);
  const [showDeveloperSdk, setShowDeveloperSdk] = useState<boolean>(false);
  const [showUserManualModal, setShowUserManualModal] = useState<boolean>(false);
  const [showCampaignGraphModal, setShowCampaignGraphModal] = useState<boolean>(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState<boolean>(false);
  const [initialGraphEntityName, setInitialGraphEntityName] = useState<string | undefined>(undefined);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showLevelUpWizard, setShowLevelUpWizard] = useState<boolean>(false);

  const { matchesHotkey } = useHotkeys();
  const { toggleUiMode, startTour } = useUiMode();

  // Global listener for opening AI Assistant
  useEffect(() => {
    const handleOpenAi = () => {
      setShowAiAssistantModal(true);
    };
    window.addEventListener('penpaper_open_ai_assistant', handleOpenAi);
    return () => window.removeEventListener('penpaper_open_ai_assistant', handleOpenAi);
  }, []);

  // Global listener for custom campaign graph view events
  useEffect(() => {
    const handleOpenGraph = (e: Event) => {
      const customEvent = e as CustomEvent;
      const entityName = customEvent.detail?.entityName || customEvent.detail;
      setInitialGraphEntityName(typeof entityName === 'string' ? entityName : undefined);
      setShowCampaignGraphModal(true);
    };
    window.addEventListener('penpaper_open_campaign_graph', handleOpenGraph);
    return () => window.removeEventListener('penpaper_open_campaign_graph', handleOpenGraph);
  }, []);

  // Global listener for custom navigation events (e.g. WorkspaceCustomizer dashboard widgets)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetTab = customEvent.detail;
      if (targetTab) {
        setActiveTab(normalizeTabId(targetTab));
      }
    };
    window.addEventListener('penpaper_navigate_tab', handleNavigate);
    return () => window.removeEventListener('penpaper_navigate_tab', handleNavigate);
  }, []);

  const initialCharacters = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHARACTERS);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure default sample characters retain their intended editions if modified in prior sessions
          parsed = parsed.map((c: CharacterData) => {
            if (c.id === 'char-sr-ghost-zero' && c.shadowrun) {
              return { ...c, edition: 'shadowrun' as RuleEdition };
            }
            if (c.isMonster && !c.challengeRating) {
              const sampleMatch = SAMPLE_CHARACTERS.find(s => s.id === c.id);
              if (sampleMatch?.challengeRating) {
                return { ...c, challengeRating: sampleMatch.challengeRating };
              }
              if (c.subclass) {
                return { ...c, challengeRating: c.subclass.replace(/^CR\s*/i, '') };
              }
            }
            return c;
          });
          const existingIds = new Set(parsed.map((c: CharacterData) => c.id));
          const missingSamples = SAMPLE_CHARACTERS.filter(sc => !existingIds.has(sc.id));
          if (missingSamples.length > 0) {
            return [...parsed, ...missingSamples];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load characters from localStorage', e);
    }
    return SAMPLE_CHARACTERS;
  })();

  const {
    state: characters,
    setPresent: setCharacters,
    undo: undoCharacters,
    redo: redoCharacters,
    canUndo: canUndoCharacters,
    canRedo: canRedoCharacters
  } = useHistoryState<CharacterData[]>(initialCharacters);

  const detachedParams = useMemo(() => getDetachedParams(), []);
  const isDetachedWindow = Boolean(detachedParams.detachedTab);

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    if (detachedParams.initialCharId && characters.some(c => c.id === detachedParams.initialCharId)) {
      return detachedParams.initialCharId;
    }
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedId && characters.some(c => c.id === savedId)) return savedId;
    } catch (e) {
      console.error('Failed to load active ID from localStorage', e);
    }
    return '';
  });

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (detachedParams.detachedTab) {
      return normalizeTabId(detachedParams.detachedTab);
    }
    return 'sheet1';
  });
  const [showNewCharacterModal, setShowNewCharacterModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [newCharCategory, setNewCharCategory] = useState<'character' | 'monster' | 'vendor'>('character');
  const [previewTheme, setPreviewTheme] = useState<RuleEdition | null>(null);

  // Upgrade / Supporter Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string | undefined>(undefined);
  const [upgradeModalRequiredTier, setUpgradeModalRequiredTier] = useState<SubscriptionTier | undefined>(undefined);

  const handleOpenUpgradeModal = (reason?: string, requiredTier?: SubscriptionTier) => {
    setUpgradeModalReason(reason);
    setUpgradeModalRequiredTier(requiredTier);
    setShowUpgradeModal(true);
  };

  // Session Lobby & Room Code State
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionFromUrl = urlParams.get('session');
      if (sessionFromUrl) return sessionFromUrl.toUpperCase();
      return localStorage.getItem('dnd_app_session_code_v1') || null;
    } catch (e) {
      return null;
    }
  });
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('session');
    } catch (e) {
      return false;
    }
  });

  // Subscribe to real-time session changes
  useEffect(() => {
    if (!activeSessionCode) {
      setActiveSession(null);
      localStorage.removeItem('dnd_app_session_code_v1');
      return;
    }

    localStorage.setItem('dnd_app_session_code_v1', activeSessionCode);
    const unsubscribe = subscribeToGameSession(activeSessionCode, (session) => {
      if (!session || session.status === 'closed') {
        setActiveSession(null);
        setActiveSessionCode(null);
        localStorage.removeItem('dnd_app_session_code_v1');
      } else {
        setActiveSession(session);
      }
    });

    return () => unsubscribe();
  }, [activeSessionCode]);

  // Party Management State
  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARTIES);
      if (saved) {
        const parsed: Party[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clean up any stale or invalid character IDs from saved parties
          const charIds = new Set(SAMPLE_CHARACTERS.map(c => c.id));
          const sanitized = parsed.map(p => ({
            ...p,
            characterIds: p.characterIds.filter(id => charIds.has(id))
          }));
          // If a party has no valid members left, fall back to default party setup with active characters
          if (sanitized.some(p => p.characterIds.length > 0)) {
            return sanitized;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load parties from localStorage', e);
    }
    return DEFAULT_PARTIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PARTIES, JSON.stringify(parties));
    } catch (e) {
      console.error('Failed to save parties to localStorage', e);
    }
  }, [parties]);

  // Set browser tab title
  useEffect(() => {
    document.title = 'Nexus';
  }, []);

  // Real-time cross-window / secondary monitor synchronization
  useDetachedSyncListener((syncedChars, syncedActiveId, syncedParties) => {
    if (syncedChars && syncedChars.length > 0) {
      setCharacters(syncedChars);
    }
    if (syncedActiveId) {
      setActiveCharacterId(syncedActiveId);
    }
    if (syncedParties) {
      setParties(syncedParties);
    }
  });

  const handleDetachTab = (tabId: TabId) => {
    openDetachedWindow(tabId, activeCharacterId, activeSessionCode);
  };

  const handleOpenNewCharacterModal = (category: 'character' | 'monster' | 'vendor' = 'character') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Check tier character limit (Developer bypasses all limits)
    const isDev = isDeveloperUser(currentUser);
    const tier = isDev ? 'developer' : getEffectiveUserTier(currentUser);
    const tierConfig = TIER_CONFIGS[tier] || TIER_CONFIGS.free;

    if (!isDev && tierConfig.characterLimit !== -1 && characters.length >= tierConfig.characterLimit) {
      handleOpenUpgradeModal(
        `You have reached the maximum character limit (${tierConfig.characterLimit} slots) for your current ${tierConfig.name} tier. Upgrade to Hero for Unlimited Character Slots!`,
        'hero'
      );
      return;
    }

    setNewCharCategory(category);
    setShowNewCharacterModal(true);
  };

  // Dice Roller State
  const [rollLogs, setRollLogs] = useState<DiceRollResult[]>([]);
  const [activeRollResult, setActiveRollResult] = useState<DiceRollResult | null>(null);

  // Physical Dice Mode State (Workspace-wide)
  const [isPhysicalDiceMode, setIsPhysicalDiceModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('trpg_physical_dice_mode') === 'true';
    } catch {
      return false;
    }
  });

  const setIsPhysicalDiceMode = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsPhysicalDiceModeState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('trpg_physical_dice_mode', String(next));
      } catch {}
      return next;
    });
  };

  const [physicalRollRequest, setPhysicalRollRequest] = useState<PhysicalRollRequest | null>(null);

  const rawActiveCharacter = characters.find(c => c.id === activeCharacterId) || null;
  const activeCharacter = useMemo(() => {
    if (!rawActiveCharacter) return null;
    if (!activeSession?.optionalRules || Object.keys(activeSession.optionalRules).length === 0) {
      return rawActiveCharacter;
    }
    return {
      ...rawActiveCharacter,
      optionalRules: {
        ...rawActiveCharacter.optionalRules,
        ...activeSession.optionalRules
      }
    };
  }, [rawActiveCharacter, activeSession?.optionalRules]);
  const currentSystemTheme: RuleEdition = previewTheme || activeCharacter?.edition || '5e';

  const isDm = Boolean(currentUser && activeSession && activeSession.dmUid === currentUser.uid);

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

  // Realtime Firestore character subscription for active session characters
  useEffect(() => {
    if (!activeSession || !activeSession.members || activeSession.members.length === 0) return;

    const charIds = Array.from(
      new Set(activeSession.members.map(m => m.characterId).filter(Boolean) as string[])
    );

    if (charIds.length === 0) return;

    const unsubs = charIds.map(id => {
      return subscribeToCharacterDoc(id, (updatedCloudChar) => {
        setCharacters(prev => {
          const index = prev.findIndex(c => c.id === updatedCloudChar.id);
          if (index >= 0) {
            const existing = prev[index];
            if (JSON.stringify(existing) === JSON.stringify(updatedCloudChar)) {
              return prev;
            }
            const copy = [...prev];
            copy[index] = updatedCloudChar;
            return copy;
          } else {
            return [updatedCloudChar, ...prev];
          }
        });
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [activeSession]);

  const handleSaveTRPGSystems = (selected: RuleEdition[]) => {
    setEnabledSystems(selected);
    setHasConfiguredSystems(true);
    setShowTRPGSelectorModal(false);

    selected.forEach(sysId => {
      eventBus.emit('SystemPluginToggled', { pluginId: sysId, enabled: true });
    });

    try {
      localStorage.setItem(STORAGE_KEY_ENABLED_SYSTEMS, JSON.stringify(selected));
    } catch (e) {
      console.error('Failed to save enabled systems to localStorage', e);
    }

    if (!selected.includes(currentSystemTheme)) {
      setPreviewTheme(selected[0]);
    }
    if (activeCharacter && !selected.includes(activeCharacter.edition || '5e')) {
      const firstMatchingChar = characters.find(c => selected.includes(c.edition || '5e'));
      if (firstMatchingChar) {
        setActiveCharacterId(firstMatchingChar.id);
      }
    }
  };

  // Firebase Auth & Cloud Sync Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setCurrentUser(profile);

        // Fetch user characters from cloud
        try {
          const cloudChars = await loadUserCharactersFromCloud(firebaseUser.uid);
          if (cloudChars && cloudChars.length > 0) {
            setCharacters(prev => {
              const cloudIds = new Set(cloudChars.map(c => c.id));
              return [...cloudChars, ...prev.filter(c => !cloudIds.has(c.id))];
            });
          }
        } catch (err) {
          console.error('Failed to load user cloud characters:', err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentSystemTheme);
  }, [currentSystemTheme]);

  // Character Presence & Role Sync
  const [presenceMap, setPresenceMap] = useState<Record<string, CharacterPresence>>({});
  const prevActiveCharIdRef = React.useRef<string | null>(null);

  // Subscribe to real-time character presence (Firestore + local tab broadcast)
  useEffect(() => {
    const unsub = subscribeToCharacterPresence((updatedMap) => {
      setPresenceMap(updatedMap);
    });
    return () => unsub();
  }, []);

  // Sync active presence whenever activeCharacterId or currentUser changes, with periodic heartbeat
  useEffect(() => {
    if (!activeCharacterId) return;

    const currentInfo = {
      uid: currentUser?.uid || 'guest_player',
      displayName: currentUser?.displayName || 'Guest Adventurer',
      role: (currentUser?.role || 'Player') as UserRole
    };

    const prevId = prevActiveCharIdRef.current || undefined;
    updateCharacterPresence(activeCharacterId, currentInfo, prevId);
    prevActiveCharIdRef.current = activeCharacterId;

    // Send heartbeat every 45 seconds to keep presence fresh
    const heartbeatInterval = setInterval(() => {
      updateCharacterPresence(activeCharacterId, {
        uid: currentUser?.uid || 'guest_player',
        displayName: currentUser?.displayName || 'Guest Adventurer',
        role: (currentUser?.role || 'Player') as UserRole
      });
    }, 45000);

    return () => clearInterval(heartbeatInterval);
  }, [activeCharacterId, currentUser]);

  // Ensure Player role users are not active on monsters or merchants
  useEffect(() => {
    const isPlayer = !currentUser || currentUser.role === 'Player';
    if (isPlayer && activeCharacter && (activeCharacter.isMonster || activeCharacter.isVendor)) {
      const firstPlayerChar = characters.find(c => !c.isMonster && !c.isVendor);
      if (firstPlayerChar) {
        setActiveCharacterId(firstPlayerChar.id);
      }
    }
  }, [currentUser, activeCharacter, characters]);

  // Save to LocalStorage whenever characters state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
    } catch (e) {
      console.error('Failed to save characters', e);
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeCharacterId);
    } catch (e) {
      console.error('Failed to save active character ID', e);
    }
  }, [activeCharacterId]);

  // Guest mode allows navigating character sheets without locking out unauthenticated users
  useEffect(() => {
    if (!currentUser && activeTab === 'sheetDm') {
      setActiveTab('menu');
    }
  }, [currentUser, activeTab]);

  const handleUpdateCharacter = (updated: CharacterData) => {
    let finalChar = updated;
    const prevChar = characters.find(c => c.id === finalChar.id);

    // Check level up event
    if (prevChar && finalChar.level && prevChar.level && finalChar.level > prevChar.level) {
      eventBus.emit('CharacterLevelUp', {
        characterId: finalChar.id,
        characterName: finalChar.name,
        oldLevel: prevChar.level,
        newLevel: finalChar.level
      });
    }

    // Permanent Death Mechanics for non-monsters (Player Characters & Merchants)
    if (!finalChar.isMonster) {
      const wasDead = prevChar ? (isCharacterDead(prevChar)) : false;

      if (finalChar.hpCurrent > 0) {
        // Character has positive HP (> 0 HP via revive or manual HP edit/heal).
        // If they were dead or had death save failures / Dead / Unconscious conditions, bring them back to life!
        if (wasDead || finalChar.deathSavesFailures >= 3 || (finalChar.conditions || []).includes('Dead')) {
          const cleanedConds = (finalChar.conditions || []).filter(c => c !== 'Dead' && c !== 'Unconscious');
          finalChar = {
            ...finalChar,
            deathSavesFailures: 0,
            deathSavesSuccesses: 0,
            conditions: cleanedConds
          };
        }
      } else if (finalChar.deathSavesFailures >= 3 || (finalChar.conditions || []).includes('Dead') || wasDead) {
        // Failed 3 death saves or marked dead with 0 HP: Set HP to 0 and add "Dead" condition
        const conds = finalChar.conditions || [];
        const hasDeadCond = conds.includes('Dead');
        finalChar = {
          ...finalChar,
          hpCurrent: 0,
          deathSavesFailures: 3,
          conditions: hasDeadCond ? conds : [...conds, 'Dead']
        };
      }
    } else {
      if (finalChar.hpCurrent > 0 && (finalChar.conditions || []).some(c => c === 'Dead' || c === 'Destroyed' || c === 'Unconscious')) {
        const cleanedConds = (finalChar.conditions || []).filter(c => c !== 'Dead' && c !== 'Destroyed' && c !== 'Unconscious');
        finalChar = {
          ...finalChar,
          conditions: cleanedConds
        };
      }
    }

    const recalculated = recalculateCharacterAC(finalChar);
    setCharacters(prev => {
      const updatedList = prev.map(c => c.id === recalculated.id ? recalculated : c);
      broadcastStateUpdate(updatedList, activeCharacterId, parties);
      return updatedList;
    });
    if (recalculated.id === activeCharacterId && recalculated.edition) {
      setPreviewTheme(recalculated.edition);
    }

    // Broadcast domain update event
    eventBus.emit('CharacterUpdated', { character: recalculated });

    // Cloud sync if authenticated
    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, recalculated);
    }
  };

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    if (id) {
      setActiveTab('sheet1');
      const target = characters.find(c => c.id === id);
      if (target?.edition) {
        setPreviewTheme(target.edition);
      }
    } else {
      setActiveTab('menu');
    }
  };

  const handleSystemChange = (newSystem: RuleEdition) => {
    setPreviewTheme(newSystem);
    // Find an existing character matching this system
    const matching = characters.find(c => (c.edition || '5e') === newSystem);
    if (matching) {
      setActiveCharacterId(matching.id);
    }
  };

  const handleCreateNewCharacter = (newChar: CharacterData) => {
    setCharacters(prev => [newChar, ...prev]);
    setActiveCharacterId(newChar.id);
    setShowNewCharacterModal(false);

    // Emit event bus event
    eventBus.emit('CharacterCreated', { character: newChar });

    // Cloud sync if authenticated
    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, newChar);
    }
  };

  const handleAddItemToActiveCharacter = (item: GearItem) => {
    if (!activeCharacter) return;
    const updatedInventory = [...(activeCharacter.inventory || []), item];
    handleUpdateCharacter({
      ...activeCharacter,
      inventory: updatedInventory
    });
  };

  const handleAddSpellToActiveCharacter = (spell: Spell) => {
    if (!activeCharacter) return;
    const updatedSpells = [...(activeCharacter.spells || []), spell];
    handleUpdateCharacter({
      ...activeCharacter,
      spells: updatedSpells,
      isSpellcaster: true
    });
  };

  const handleLoadCampaignSave = async (save: CampaignSaveFile) => {
    if (!save || !save.characters) return;

    setCharacters((prev: CharacterData[]) => {
      const charMap = new Map<string, CharacterData>();
      prev.forEach(c => charMap.set(c.id, c));
      save.characters.forEach(sc => charMap.set(sc.id, sc));
      const updated = Array.from(charMap.values());
      try {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (save.edition) {
      setPreviewTheme(save.edition);
    }

    if (save.characters.length > 0) {
      handleSelectCharacter(save.characters[0].id);
    }

    // Restore multiplayer session state
    try {
      const restored = await restoreGameSessionFromSave(
        save,
        currentUser ? { uid: currentUser.uid, displayName: currentUser.displayName } : null
      );
      setActiveSession(restored);
      setActiveSessionCode(restored.code);
    } catch (e) {
      console.warn('Could not restore session to Firestore, setting code:', e);
      if (save.sessionCode) {
        setActiveSessionCode(save.sessionCode);
      }
    }
  };

  const handleDeleteCharacter = (idToDelete: string) => {
    setCharacters(prev => {
      const remaining = prev.filter(c => c.id !== idToDelete);
      if (remaining.length === 0) {
        setActiveCharacterId(SAMPLE_CHARACTERS[0].id);
        return SAMPLE_CHARACTERS;
      }
      if (activeCharacterId === idToDelete) {
        setActiveCharacterId(remaining[0].id);
      }
      return remaining;
    });

    // Cloud sync deletion if authenticated
    if (currentUser?.uid) {
      deleteCharacterFromCloud(idToDelete);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeCharacter, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeCharacter.name.toLowerCase().replace(/\s+/g, '_')}_sheet.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedChar = JSON.parse(event.target?.result as string) as CharacterData;
        if (importedChar && importedChar.name && importedChar.abilities) {
          importedChar.id = 'imported-' + Date.now();
          setCharacters(prev => [importedChar, ...prev]);
          setActiveCharacterId(importedChar.id);
          alert(`Successfully imported "${importedChar.name}"!`);
        } else {
          alert('Invalid character sheet JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Sync physical dice mode from active campaign optional rules if present
  useEffect(() => {
    if (activeSession?.optionalRules?.usePhysicalDiceMode !== undefined) {
      setIsPhysicalDiceModeState(Boolean(activeSession.optionalRules.usePhysicalDiceMode));
    }
  }, [activeSession?.optionalRules?.usePhysicalDiceMode]);

  // Global hotkeys (customizable via Options > Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (works even if in input if Ctrl/Cmd modifier is bound)
      if (matchesHotkey(e, 'commandPalette')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // If user is currently typing in an input, textarea, or contentEditable element, ignore single key shortcuts
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

      // Sheet tab switches
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

      // Cycle TRPG systems
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
        return;
      }

      // Toggle Focus vs Master Mode
      if (matchesHotkey(e, 'toggleFocusMode')) {
        e.preventDefault();
        toggleUiMode();
        return;
      }

      // Open Guided Tour
      if (matchesHotkey(e, 'openTour')) {
        e.preventDefault();
        startTour();
        return;
      }

      // Open Options Modal
      if (matchesHotkey(e, 'openOptions')) {
        e.preventDefault();
        setShowAudioModal(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchesHotkey, enabledSystems, currentSystemTheme, characters, toggleUiMode, startTour]);

  // Execute and record a completed roll result (shared by digital and physical workflows)
  const executeRollResult = (
    label: string,
    diceType: number,
    diceCount: number,
    modifier: number,
    mode: 'normal' | 'advantage' | 'disadvantage',
    diceRolls: number[],
    total: number,
    isNat20: boolean,
    isNat1: boolean
  ) => {
    const result: DiceRollResult = {
      id: 'roll-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      label,
      expression: `${diceCount}d${diceType}${formatModifier(modifier)}`,
      diceRolls,
      modifier,
      total,
      mode,
      isNat20,
      isNat1
    };

    setRollLogs(prev => [result, ...prev]);
    setActiveRollResult(result);

    // Broadcast event bus DiceRolled
    eventBus.emit('DiceRolled', {
      formula: `${diceCount}d${diceType}${formatModifier(modifier)}`,
      total,
      isNat20,
      isNat1,
      rollerName: activeCharacter?.name || label || 'Adventurer'
    });

    // Auto dismiss active toast after 4.5 seconds
    setTimeout(() => {
      setActiveRollResult(current => current?.id === result.id ? null : current);
    }, 4500);
  };

  // Digital Random Dice Roll Generator
  const handleDigitalRoll = (
    label: string,
    diceType: number,
    diceCount: number,
    modifier: number,
    mode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ) => {
    const diceRolls: number[] = [];
    let rollsToMake = diceCount;

    if (diceType === 20 && (mode === 'advantage' || mode === 'disadvantage')) {
      rollsToMake = 2;
    }

    for (let i = 0; i < rollsToMake; i++) {
      diceRolls.push(Math.floor(Math.random() * diceType) + 1);
    }

    let chosenRoll = diceRolls[0];
    if (diceType === 20 && mode === 'advantage') {
      chosenRoll = Math.max(...diceRolls);
    } else if (diceType === 20 && mode === 'disadvantage') {
      chosenRoll = Math.min(...diceRolls);
    } else if (diceCount > 1) {
      chosenRoll = diceRolls.reduce((sum, n) => sum + n, 0);
    }

    const total = chosenRoll + modifier;
    const isNat20 = diceType === 20 && chosenRoll === 20;
    const isNat1 = diceType === 20 && chosenRoll === 1;

    executeRollResult(label, diceType, diceCount, modifier, mode, diceRolls, total, isNat20, isNat1);
  };

  // Main Dice Roll Execution Handler (Intercepts for Physical Dice Mode)
  const handleRoll = (
    label: string,
    diceType: number,
    diceCount: number,
    modifier: number,
    mode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ) => {
    if (isPhysicalDiceMode) {
      setPhysicalRollRequest({
        label,
        diceType,
        diceCount,
        modifier,
        mode,
        onConfirm: (rolls, total, isNat20, isNat1) => {
          executeRollResult(label, diceType, diceCount, modifier, mode, rolls, total, isNat20, isNat1);
          setPhysicalRollRequest(null);
        },
        onDigitalFallback: () => {
          setPhysicalRollRequest(null);
          handleDigitalRoll(label, diceType, diceCount, modifier, mode);
        },
        onCancel: () => {
          setPhysicalRollRequest(null);
        }
      });
      return;
    }

    handleDigitalRoll(label, diceType, diceCount, modifier, mode);
  };

  // Custom Damage Expression Roller (e.g., "2d6 + 4")
  const handleRollDamage = (label: string, expression: string) => {
    const match = expression.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!match) {
      // Fallback simple roll
      handleRoll(label, 6, 1, 0, 'normal');
      return;
    }

    const count = parseInt(match[1]) || 1;
    const die = parseInt(match[2]) || 6;
    const sign = match[3] === '-' ? -1 : 1;
    const mod = match[4] ? parseInt(match[4]) * sign : 0;

    handleRoll(label, die, count, mod, 'normal');
  };

  const handleRollInitiative = () => {
    if (!activeCharacter) return;
    handleRoll(`${activeCharacter.name} Initiative`, 20, 1, activeCharacter.initiativeBonus, 'normal');
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

        {activeTab === 'sheetDm' && isDm && activeSession && (
          <SheetDmOverview
            activeSession={activeSession}
            allCharacters={characters}
            currentUser={currentUser}
            onUpdateCharacter={handleUpdateCharacter}
            onDetach={() => handleDetachTab('sheetDm')}
            onOpenUpgradeModal={handleOpenUpgradeModal}
          />
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
              localStorage.setItem(STORAGE_KEY_ENABLED_SYSTEMS, JSON.stringify(updated));
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
