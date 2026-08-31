import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CharacterData, RuleEdition, Party, GearItem, Spell } from '../types';
import { SAMPLE_CHARACTERS } from '../data/defaultCharacters';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { useHistoryState } from '../utils/useHistoryState';
import { recalculateCharacterAC, isCharacterDead } from '../utils/dndCalculations';
import { broadcastStateUpdate, useDetachedSyncListener } from '../utils/useDetachedSync';
import { eventBus } from '../events/eventBus';
import {
  UserProfile,
  CharacterPresence,
  UserRole,
  saveCharacterToCloud,
  deleteCharacterFromCloud,
  subscribeToCharacterPresence,
  updateCharacterPresence
} from '../lib/firebase';

const STORAGE_KEY_CHARACTERS = 'dnd_app_characters_v5';
const STORAGE_KEY_ACTIVE = 'dnd_app_active_id_v4';
const STORAGE_KEY_PARTIES = 'dnd_app_parties_v1';

interface UseCharacterManagerProps {
  currentUser: UserProfile | null;
  activeSessionCode?: string | null;
  initialCharIdFromDetached?: string | null;
  optionalRules?: Record<string, any>;
  onThemeChange?: (theme: RuleEdition) => void;
  onNavigateToTab?: (tab: any) => void;
}

export function useCharacterManager({
  currentUser,
  activeSessionCode,
  initialCharIdFromDetached,
  optionalRules,
  onThemeChange,
  onNavigateToTab
}: UseCharacterManagerProps) {
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

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    if (initialCharIdFromDetached && characters.some(c => c.id === initialCharIdFromDetached)) {
      return initialCharIdFromDetached;
    }
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedId && characters.some(c => c.id === savedId)) return savedId;
    } catch (e) {
      console.error('Failed to load active ID from localStorage', e);
    }
    return '';
  });

  // Party Management State
  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARTIES);
      if (saved) {
        const parsed: Party[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const charIds = new Set(SAMPLE_CHARACTERS.map(c => c.id));
          const sanitized = parsed.map(p => ({
            ...p,
            characterIds: p.characterIds.filter(id => charIds.has(id))
          }));
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

  // Character Presence & Role Sync
  const [presenceMap, setPresenceMap] = useState<Record<string, CharacterPresence>>({});
  const prevActiveCharIdRef = useRef<string | null>(null);

  // Subscribe to real-time character presence (Firestore + local tab broadcast), strictly scoped to the active session lobby
  useEffect(() => {
    if (!activeSessionCode) {
      setPresenceMap({});
      return;
    }
    const unsub = subscribeToCharacterPresence((updatedMap) => {
      setPresenceMap(updatedMap);
    }, activeSessionCode);
    return () => unsub();
  }, [activeSessionCode]);

  // Sync active presence whenever activeCharacterId, currentUser, or activeSessionCode changes, with periodic heartbeat
  useEffect(() => {
    if (!activeCharacterId || !activeSessionCode) return;

    const currentInfo = {
      uid: currentUser?.uid || 'guest_player',
      displayName: currentUser?.displayName || 'Guest Adventurer',
      role: (currentUser?.role || 'Player') as UserRole
    };

    const prevId = prevActiveCharIdRef.current || undefined;
    updateCharacterPresence(activeCharacterId, currentInfo, prevId, activeSessionCode);
    prevActiveCharIdRef.current = activeCharacterId;

    const heartbeatInterval = setInterval(() => {
      updateCharacterPresence(activeCharacterId, {
        uid: currentUser?.uid || 'guest_player',
        displayName: currentUser?.displayName || 'Guest Adventurer',
        role: (currentUser?.role || 'Player') as UserRole
      }, undefined, activeSessionCode);
    }, 45000);

    return () => clearInterval(heartbeatInterval);
  }, [activeCharacterId, currentUser, activeSessionCode]);

  const rawActiveCharacter = characters.find(c => c.id === activeCharacterId) || null;
  const activeCharacter = useMemo(() => {
    if (!rawActiveCharacter) return null;
    if (!optionalRules || Object.keys(optionalRules).length === 0) {
      return rawActiveCharacter;
    }
    return {
      ...rawActiveCharacter,
      optionalRules: {
        ...rawActiveCharacter.optionalRules,
        ...optionalRules
      }
    };
  }, [rawActiveCharacter, optionalRules]);

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
      const wasDead = prevChar ? isCharacterDead(prevChar) : false;

      if (finalChar.hpCurrent > 0) {
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
    if (recalculated.id === activeCharacterId && recalculated.edition && onThemeChange) {
      onThemeChange(recalculated.edition);
    }

    eventBus.emit('CharacterUpdated', { character: recalculated });

    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, recalculated);
    }
  };

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    if (id) {
      if (onNavigateToTab) onNavigateToTab('sheet1');
      const target = characters.find(c => c.id === id);
      if (target?.edition && onThemeChange) {
        onThemeChange(target.edition);
      }
    } else {
      if (onNavigateToTab) onNavigateToTab('menu');
    }
  };

  const handleCreateNewCharacter = (newChar: CharacterData) => {
    setCharacters(prev => [newChar, ...prev]);
    setActiveCharacterId(newChar.id);

    eventBus.emit('CharacterCreated', { character: newChar });

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

    if (currentUser?.uid) {
      deleteCharacterFromCloud(idToDelete);
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

  const handleExportJson = () => {
    if (!activeCharacter) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeCharacter, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeCharacter.name.toLowerCase().replace(/\s+/g, '_')}_sheet.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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

  return {
    characters,
    setCharacters,
    activeCharacterId,
    setActiveCharacterId,
    activeCharacter,
    rawActiveCharacter,
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
  };
}
