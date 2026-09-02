import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CharacterData, RuleEdition, Party, GearItem, Spell } from '../types';
import { SAMPLE_CHARACTERS } from '../data/defaultCharacters';
import { DEFAULT_PARTIES } from '../data/defaultParties';
import { useHistoryState } from '../utils/useHistoryState';
import { recalculateCharacterAC, isCharacterDead } from '../utils/dndCalculations';
import { broadcastStateUpdate, useDetachedSyncListener } from '../utils/useDetachedSync';
import { eventBus } from '../events/eventBus';
import { saveCustomCompendiumEntry } from '../data/compendiumData';
import { UniversalImporter } from '../services/universalImporter';
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
            let item = { ...c };
            if (!item.updatedAt) {
              item.updatedAt = new Date().toISOString();
            }
            if (item.id === 'char-sr-ghost-zero' && item.shadowrun) {
              return { ...item, edition: 'shadowrun' as RuleEdition };
            }
            if (item.isMonster && !item.challengeRating) {
              const sampleMatch = SAMPLE_CHARACTERS.find(s => s.id === item.id);
              if (sampleMatch?.challengeRating) {
                return { ...item, challengeRating: sampleMatch.challengeRating };
              }
              if (item.subclass) {
                return { ...item, challengeRating: item.subclass.replace(/^CR\s*/i, '') };
              }
            }
            return item;
          });
          const existingIds = new Set(parsed.map((c: CharacterData) => c.id));
          const missingSamples = SAMPLE_CHARACTERS.filter(sc => !existingIds.has(sc.id)).map(sc => ({
            ...sc,
            updatedAt: sc.updatedAt || new Date().toISOString()
          }));
          if (missingSamples.length > 0) {
            return [...parsed, ...missingSamples];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load characters from localStorage', e);
    }
    return SAMPLE_CHARACTERS.map(c => ({
      ...c,
      updatedAt: c.updatedAt || new Date().toISOString()
    }));
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
      if (savedId && initialCharacters.some(c => c.id === savedId)) return savedId;
    } catch (e) {
      console.error('Failed to load active ID from localStorage', e);
    }
    const fallback = initialCharacters.find(c => !c.isMonster && !c.isVendor) || initialCharacters[0];
    return fallback?.id || '';
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
  const handleDetachedSync = useCallback((syncedChars: CharacterData[], syncedActiveId: string, syncedParties?: Party[]) => {
    if (syncedChars && syncedChars.length > 0) {
      setCharacters(syncedChars);
    }
    if (syncedActiveId) {
      setActiveCharacterId(syncedActiveId);
    }
    if (syncedParties) {
      setParties(syncedParties);
    }
  }, [setCharacters, setActiveCharacterId, setParties]);

  useDetachedSyncListener(handleDetachedSync);

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

    const recalculated = recalculateCharacterAC({
      ...finalChar,
      updatedAt: new Date().toISOString()
    });

    setCharacters(prev => {
      const exists = prev.some(c => c.id === recalculated.id);
      const updatedList = exists 
        ? prev.map(c => c.id === recalculated.id ? recalculated : c)
        : [recalculated, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(updatedList));
      } catch (e) {}
      broadcastStateUpdate(updatedList, activeCharacterId, parties);
      return updatedList;
    });

    if (recalculated.id === activeCharacterId && recalculated.edition && onThemeChange) {
      onThemeChange(recalculated.edition);
    }

    eventBus.emit('CharacterUpdated', { character: recalculated });

    if (currentUser?.uid && !currentUser.uid.startsWith('guest_')) {
      saveCharacterToCloud(currentUser.uid, recalculated);
    }
  };

  const handleSelectCharacter = (id: string, shouldNavigate: boolean = true) => {
    setActiveCharacterId(id);
    if (id) {
      if (shouldNavigate && onNavigateToTab) onNavigateToTab('sheet1');
      const target = characters.find(c => c.id === id);
      if (target?.edition && onThemeChange) {
        onThemeChange(target.edition);
      }
    } else {
      if (shouldNavigate && onNavigateToTab) onNavigateToTab('menu');
    }
  };

  const handleCreateNewCharacter = (newChar: CharacterData) => {
    setCharacters(prev => {
      const updatedList = [newChar, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(updatedList));
      } catch (e) {}
      broadcastStateUpdate(updatedList, newChar.id, parties);
      return updatedList;
    });
    setActiveCharacterId(newChar.id);

    eventBus.emit('CharacterCreated', { character: newChar });

    if (currentUser?.uid && !currentUser.uid.startsWith('guest_')) {
      saveCharacterToCloud(currentUser.uid, newChar);
    }
  };

  const handleDeleteCharacter = (idToDelete: string) => {
    setCharacters(prev => {
      const remaining = prev.filter(c => c.id !== idToDelete);
      const nextActive = remaining.length > 0 ? (activeCharacterId === idToDelete ? remaining[0].id : activeCharacterId) : SAMPLE_CHARACTERS[0].id;
      const finalList = remaining.length > 0 ? remaining : SAMPLE_CHARACTERS;
      try {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(finalList));
      } catch (e) {}
      setActiveCharacterId(nextActive);
      broadcastStateUpdate(finalList, nextActive, parties);
      return finalList;
    });

    if (currentUser?.uid && !currentUser.uid.startsWith('guest_')) {
      deleteCharacterFromCloud(idToDelete);
    }
  };

  const handleAddItemToActiveCharacter = (item: GearItem, targetCharacterId?: string) => {
    let resolvedTargetId = targetCharacterId || activeCharacterId || activeCharacter?.id;
    if (!resolvedTargetId && characters.length > 0) {
      resolvedTargetId = (characters.find(c => !c.isMonster && !c.isVendor) || characters[0]).id;
    }

    if (!resolvedTargetId) {
      const defaultChar = { ...SAMPLE_CHARACTERS[0], id: `char_${Date.now()}`, inventory: [item], updatedAt: new Date().toISOString() };
      handleCreateNewCharacter(defaultChar);
      return;
    }

    const itemWithId: GearItem = {
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };

    const nowIso = new Date().toISOString();
    const currentTarget = characters.find(c => c.id === resolvedTargetId) || characters[0];
    const currentInv = Array.isArray(currentTarget?.inventory) ? currentTarget.inventory : [];
    const updatedInventory = [itemWithId, ...currentInv.filter(i => i.id !== itemWithId.id)];
    const updatedChar = recalculateCharacterAC({
      ...currentTarget,
      inventory: updatedInventory,
      updatedAt: nowIso
    });

    const exists = characters.some(c => c.id === updatedChar.id);
    const updatedList = exists 
      ? characters.map(c => c.id === updatedChar.id ? updatedChar : c)
      : [updatedChar, ...characters];

    // 1. Update React history state
    setCharacters(updatedList);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save characters to localStorage', e);
    }

    // 3. Ensure active character is focused
    if (resolvedTargetId !== activeCharacterId) {
      setActiveCharacterId(resolvedTargetId);
    }

    // 4. Broadcast detached / multi-window sync
    broadcastStateUpdate(updatedList, resolvedTargetId, parties);

    // 5. Cloud Firestore backup (if signed in)
    if (currentUser?.uid && !currentUser.uid.startsWith('guest_')) {
      saveCharacterToCloud(currentUser.uid, updatedChar);
    }

    // 6. Notify domain subscribers and UI toast
    eventBus.emit('CharacterUpdated', { character: updatedChar });
    eventBus.emit('ItemAdded', {
      characterId: resolvedTargetId,
      itemName: itemWithId.name,
      quantity: itemWithId.quantity || 1
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-gear-' + itemWithId.id,
        name: itemWithId.name,
        category: 'items',
        edition: activeCharacter?.edition || '5e',
        description: `${itemWithId.itemType || 'General'} item weighing ${itemWithId.weight} lbs. ${itemWithId.notes || ''}`,
        source: 'AI Forge',
        isCustom: true,
        tags: [activeCharacter?.edition || '5e', itemWithId.itemType || 'General'],
        itemData: itemWithId
      });
    } catch (e) {
      console.warn('Failed to auto-save forged item to compendium:', e);
    }
  };

  const handleAddSpellToActiveCharacter = (spell: Spell, targetCharacterId?: string) => {
    let resolvedTargetId = targetCharacterId || activeCharacterId || activeCharacter?.id;
    if (!resolvedTargetId && characters.length > 0) {
      resolvedTargetId = (characters.find(c => !c.isMonster && !c.isVendor) || characters[0]).id;
    }

    if (!resolvedTargetId) {
      const defaultChar = { ...SAMPLE_CHARACTERS[0], id: `char_${Date.now()}`, spells: [spell], isSpellcaster: true, updatedAt: new Date().toISOString() };
      handleCreateNewCharacter(defaultChar);
      return;
    }

    const spellWithId: Spell = {
      ...spell,
      id: spell.id || `spell_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };

    const nowIso = new Date().toISOString();
    const currentTarget = characters.find(c => c.id === resolvedTargetId) || characters[0];
    const currentSpells = Array.isArray(currentTarget?.spells) ? currentTarget.spells : [];
    const updatedSpells = [spellWithId, ...currentSpells.filter(s => s.id !== spellWithId.id)];
    const updatedChar: CharacterData = {
      ...currentTarget,
      spells: updatedSpells,
      isSpellcaster: true,
      updatedAt: nowIso
    };

    const exists = characters.some(c => c.id === updatedChar.id);
    const updatedList = exists 
      ? characters.map(c => c.id === updatedChar.id ? updatedChar : c)
      : [updatedChar, ...characters];

    // 1. Update React history state
    setCharacters(updatedList);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save characters to localStorage', e);
    }

    // 3. Ensure active character is focused
    if (resolvedTargetId !== activeCharacterId) {
      setActiveCharacterId(resolvedTargetId);
    }

    // 4. Broadcast detached / multi-window sync
    broadcastStateUpdate(updatedList, resolvedTargetId, parties);

    // 5. Cloud Firestore backup (if signed in)
    if (currentUser?.uid && !currentUser.uid.startsWith('guest_')) {
      saveCharacterToCloud(currentUser.uid, updatedChar);
    }

    // 6. Domain notifications
    eventBus.emit('CharacterUpdated', { character: updatedChar });
    eventBus.emit('SpellLearned', { characterId: resolvedTargetId, spellName: spellWithId.name, level: spellWithId.level });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-spell-' + spellWithId.id,
        name: spellWithId.name,
        category: 'spells',
        edition: activeCharacter?.edition || '5e',
        description: spellWithId.description || spellWithId.shortDescription || '',
        source: 'AI Forge',
        isCustom: true,
        tags: [activeCharacter?.edition || '5e', `Level ${spellWithId.level}`, spellWithId.school || 'Magic'],
        spellData: spellWithId
      });
    } catch (e) {
      console.warn('Failed to auto-save forged spell to compendium:', e);
    }
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
        const rawContent = event.target?.result as string;
        const result = UniversalImporter.parse(rawContent, 'auto');
        if (result.success && result.characters.length > 0) {
          const newChars = result.characters.map(c => ({
            ...c,
            id: c.id || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          }));
          setCharacters(prev => [...newChars, ...prev]);
          setActiveCharacterId(newChars[0].id);
          alert(`Successfully imported ${newChars.length} character(s) via ${result.metadata.formatLabel}!`);
        } else {
          alert(`Import failed: ${result.error || 'Unrecognized schema or format'}`);
        }
      } catch (err: any) {
        alert(`Failed to parse file: ${err?.message || 'Unknown error'}`);
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
