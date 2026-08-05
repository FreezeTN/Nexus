import React, { useState, useEffect } from 'react';
import { CharacterData, DiceRollResult, RuleEdition, Party } from './types';
import { SAMPLE_CHARACTERS } from './data/defaultCharacters';
import { DEFAULT_PARTIES } from './data/defaultParties';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { DiceRoller } from './components/DiceRoller';
import { Sheet1StatsFeatures } from './components/sheets/Sheet1StatsFeatures';
import { Sheet2Combat } from './components/sheets/Sheet2Combat';
import { Sheet3GearWealth } from './components/sheets/Sheet3GearWealth';
import { Sheet4Spells } from './components/sheets/Sheet4Spells';
import { Sheet5DescriptionNotes } from './components/sheets/Sheet5DescriptionNotes';
import { Sheet6UserGuide } from './components/sheets/Sheet6UserGuide';
import { Sheet7Compendium } from './components/sheets/Sheet7Compendium';
import { MainMenu } from './components/MainMenu';
import { NewCharacterModal } from './components/modals/NewCharacterModal';
import { PartyManagerModal } from './components/modals/PartyManagerModal';
import { SessionLobbyModal } from './components/modals/SessionLobbyModal';
import { AuthModal } from './components/modals/AuthModal';
import { convertCharacterEdition, formatModifier, recalculateCharacterAC, isCharacterDead } from './utils/dndCalculations';
import { onAuthStateChanged } from 'firebase/auth';
import { Crown } from 'lucide-react';
import { 
  auth, 
  getUserProfile, 
  UserProfile, 
  saveCharacterToCloud, 
  loadUserCharactersFromCloud, 
  deleteCharacterFromCloud,
  subscribeToCharacterPresence,
  updateCharacterPresence,
  CharacterPresence,
  UserRole,
  GameSession,
  subscribeToGameSession
} from './lib/firebase';

const STORAGE_KEY_CHARACTERS = 'dnd_app_characters_v4';
const STORAGE_KEY_ACTIVE = 'dnd_app_active_id_v4';
const STORAGE_KEY_PARTIES = 'dnd_app_parties_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [characters, setCharacters] = useState<CharacterData[]>(() => {
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
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedId && characters.some(c => c.id === savedId)) return savedId;
    } catch (e) {
      console.error('Failed to load active ID from localStorage', e);
    }
    return characters[0]?.id || SAMPLE_CHARACTERS[0].id;
  });

  const [activeTab, setActiveTab] = useState<TabId>('sheet1');
  const [showNewCharacterModal, setShowNewCharacterModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [newCharCategory, setNewCharCategory] = useState<'character' | 'monster' | 'vendor'>('character');
  const [previewTheme, setPreviewTheme] = useState<RuleEdition | null>(null);

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

  const handleOpenNewCharacterModal = (category: 'character' | 'monster' | 'vendor' = 'character') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setNewCharCategory(category);
    setShowNewCharacterModal(true);
  };

  // Dice Roller State
  const [rollLogs, setRollLogs] = useState<DiceRollResult[]>([]);
  const [activeRollResult, setActiveRollResult] = useState<DiceRollResult | null>(null);

  const activeCharacter = characters.find(c => c.id === activeCharacterId) || characters[0] || SAMPLE_CHARACTERS[0];
  const currentSystemTheme: RuleEdition = previewTheme || activeCharacter.edition || '5e';

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

  // When not logged in at all, automatically force activeTab to Main Menu ('menu') if on any character sheet tab
  useEffect(() => {
    if (!currentUser && activeTab !== 'menu' && activeTab !== 'sheet6') {
      setActiveTab('menu');
    }
  }, [currentUser, activeTab]);

  const handleUpdateCharacter = (updated: CharacterData) => {
    let finalChar = updated;

    // Permanent Death Mechanics for non-monsters (Player Characters & Merchants)
    if (!finalChar.isMonster) {
      const prevChar = characters.find(c => c.id === finalChar.id);
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
    setCharacters(prev => prev.map(c => c.id === recalculated.id ? recalculated : c));
    if (recalculated.id === activeCharacterId && recalculated.edition) {
      setPreviewTheme(recalculated.edition);
    }

    // Cloud sync if authenticated
    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, recalculated);
    }
  };

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    const target = characters.find(c => c.id === id);
    if (target?.edition) {
      setPreviewTheme(target.edition);
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

    // Cloud sync if authenticated
    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, newChar);
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

  // Dice Roll Execution Handler
  const handleRoll = (
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
      rollsToMake;
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

    // Auto dismiss active toast after 4 seconds
    setTimeout(() => {
      setActiveRollResult(current => current?.id === result.id ? null : current);
    }, 4500);
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
    handleRoll(`${activeCharacter.name} Initiative`, 20, 1, activeCharacter.initiativeBonus, 'normal');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-stone-950 transition-colors duration-300" data-theme={currentSystemTheme}>
      {/* Top DM Active Banner Indicator */}
      {presenceMap[activeCharacter.id]?.dmActive && (
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
      />

      {/* 5 Sheets Navigation Tab Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSpellcaster={activeCharacter.isSpellcaster}
        edition={currentSystemTheme}
        currentUser={currentUser}
      />

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
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
          />
        )}

        {activeTab === 'sheet1' && (
          <Sheet1StatsFeatures
            character={activeCharacter}
            currentUser={currentUser}
            onUpdateCharacter={handleUpdateCharacter}
            onRoll={handleRoll}
          />
        )}

        {activeTab === 'sheet2' && (
          <Sheet2Combat
            character={activeCharacter}
            allCharacters={characters}
            parties={parties}
            currentUser={currentUser}
            onOpenPartyManager={() => setShowPartyModal(true)}
            onUpdateCharacter={handleUpdateCharacter}
            onRoll={handleRoll}
            onRollDamage={handleRollDamage}
          />
        )}

        {activeTab === 'sheet3' && (
          <Sheet3GearWealth
            character={activeCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onRollDamage={handleRollDamage}
          />
        )}

        {activeTab === 'sheet4' && (
          <Sheet4Spells
            character={activeCharacter}
            allCharacters={characters}
            currentUser={currentUser}
            onUpdateCharacter={handleUpdateCharacter}
            onRoll={handleRoll}
            onRollDamage={handleRollDamage}
          />
        )}

        {activeTab === 'sheet5' && (
          <Sheet5DescriptionNotes
            character={activeCharacter}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'sheet6' && (
          <Sheet6UserGuide edition={currentSystemTheme} />
        )}

        {activeTab === 'sheet7' && (
          <Sheet7Compendium
            activeCharacter={activeCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onAddMonsterToRoster={(monster) => {
              setCharacters(prev => [...prev, monster]);
            }}
          />
        )}
      </main>

      {/* Floating Interactive Dice Roller */}
      <DiceRoller
        rollLogs={rollLogs}
        onRoll={handleRoll}
        onClearLogs={() => setRollLogs([])}
        activeRollResult={activeRollResult}
      />

      {/* New Character Modal */}
      {showNewCharacterModal && (
        <NewCharacterModal
          onClose={() => setShowNewCharacterModal(false)}
          onCreate={handleCreateNewCharacter}
          initialEdition={currentSystemTheme}
          initialIsMonster={newCharCategory === 'monster'}
          initialIsVendor={newCharCategory === 'vendor'}
        />
      )}

      {/* Party Manager Modal */}
      <PartyManagerModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        parties={parties}
        allCharacters={characters}
        activeCharacterId={activeCharacter.id}
        onUpdateParties={setParties}
        onSelectCharacter={(charId) => {
          handleSelectCharacter(charId);
          setShowPartyModal(false);
        }}
        currentUser={currentUser}
        presenceMap={presenceMap}
        onUpdateCharacter={handleUpdateCharacter}
      />

      {/* Session Lobby & Room Code Modal */}
      <SessionLobbyModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        currentUser={currentUser}
        activeSession={activeSession}
        activeCharacter={activeCharacter}
        allCharacters={characters}
        presenceMap={presenceMap}
        onSessionChange={(code) => setActiveSessionCode(code)}
        onSelectCharacter={handleSelectCharacter}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* User Account & Role Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
}
