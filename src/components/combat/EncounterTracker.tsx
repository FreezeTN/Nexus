import React, { useState } from 'react';
import { CharacterData, Party, EncounterEnvironment } from '../../types';
import { UserProfile } from '../../lib/firebase';
import { getAbilityModifier, formatModifier, isCharacterDead, getActiveClassChoice, getSecondaryXp, getEffectiveMaxHp } from '../../utils/dndCalculations';
import { getLevelFromTotalXp } from '../../data/levelProgressionData';
import { Crosshair, Swords, Plus, Trash2, ChevronRight, ChevronLeft, Dices, RefreshCw, Copy, UserCheck, Zap, ScrollText, Search, FileText, Check, Clock, MessageSquarePlus, Download, X, Users, Shield, Pencil, Compass, Waves, Flame } from 'lucide-react';
import { AttackResolver } from './AttackResolver';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../data/monsterPortraits';
import { ENVIRONMENT_CONFIGS, getEnvironmentalTraitStatus } from '../../utils/environmentRules';

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hpCurrent: number;
  hpMax: number;
  type: 'player' | 'ally' | 'enemy';
  isPlayerChar?: boolean;
  conditions?: string[];
  monsterXpReward?: number;
  isDefeated?: boolean;
  portraitUrl?: string;
  partyId?: string;
  isPartyMember?: boolean;
  controlledBy?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  actor?: string;
  category: 'initiative' | 'turn' | 'attack' | 'damage' | 'heal' | 'condition' | 'ability' | 'note';
  message: string;
}

interface EncounterTrackerProps {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  currentUser?: UserProfile | null;
  onOpenPartyManager?: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
}

export interface SavedEncounterData {
  combatants: Combatant[];
  activeTurnIndex: number;
  roundNumber: number;
  combatLogs: CombatLogEntry[];
  encounterEnvironment?: EncounterEnvironment;
}

export function loadSavedEncounter(char: CharacterData): SavedEncounterData {
  const defaultPlayer: Combatant = {
    id: 'player-' + char.id,
    name: char.name,
    initiative: 0,
    armorClass: char.armorClass || 10,
    hpCurrent: char.hpCurrent || 10,
    hpMax: getEffectiveMaxHp(char),
    type: 'player',
    isPlayerChar: true,
    conditions: char.conditions || [],
    portraitUrl: char.portraitUrl || (char.isMonster ? getMonsterPortraitUrl(char.name, char.id) : undefined)
  };

  const defaultState: SavedEncounterData = {
    combatants: [defaultPlayer],
    activeTurnIndex: 0,
    roundNumber: 1,
    encounterEnvironment: 'terrestrial',
    combatLogs: [
      {
        id: 'log-init-1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: 1,
        category: 'turn',
        message: `Encounter tracker initialized for ${char.name}.`
      }
    ]
  };

  try {
    const charKey = char.id || 'default';
    const raw = localStorage.getItem(`dnd_encounter_state_v1_${charKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.combatants) && parsed.combatants.length > 0) {
        const syncedCombatants = parsed.combatants.map((c: Combatant) => {
          if (c.isPlayerChar) {
            return {
              ...c,
              name: char.name,
              hpCurrent: char.hpCurrent,
              hpMax: getEffectiveMaxHp(char),
              armorClass: char.armorClass,
              conditions: char.conditions || [],
              portraitUrl: char.portraitUrl || (char.isMonster ? getMonsterPortraitUrl(char.name, char.id) : undefined)
            };
          }
          return c;
        });

        return {
          combatants: syncedCombatants,
          activeTurnIndex: typeof parsed.activeTurnIndex === 'number' && parsed.activeTurnIndex < syncedCombatants.length ? parsed.activeTurnIndex : 0,
          roundNumber: typeof parsed.roundNumber === 'number' ? parsed.roundNumber : 1,
          encounterEnvironment: parsed.encounterEnvironment || 'terrestrial',
          combatLogs: Array.isArray(parsed.combatLogs) && parsed.combatLogs.length > 0 ? parsed.combatLogs : defaultState.combatLogs
        };
      }
    }
  } catch (err) {
    console.error("Error reading encounter state from localStorage:", err);
  }

  return defaultState;
}

export const EncounterTracker: React.FC<EncounterTrackerProps> = ({
  character,
  allCharacters = [],
  parties = [],
  currentUser,
  onOpenPartyManager,
  onRoll,
  onUpdateCharacter
}) => {
  const isDmRole = currentUser?.role === 'DM';
  const [combatants, setCombatants] = useState<Combatant[]>(() => loadSavedEncounter(character).combatants);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(() => loadSavedEncounter(character).activeTurnIndex);
  const [roundNumber, setRoundNumber] = useState<number>(() => loadSavedEncounter(character).roundNumber);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>(() => loadSavedEncounter(character).combatLogs);
  const [encounterEnvironment, setEncounterEnvironment] = useState<EncounterEnvironment>(() => loadSavedEncounter(character).encounterEnvironment || 'terrestrial');

  // Reload saved encounter if active character ID changes
  React.useEffect(() => {
    const saved = loadSavedEncounter(character);
    setCombatants(saved.combatants);
    setActiveTurnIndex(saved.activeTurnIndex);
    setRoundNumber(saved.roundNumber);
    setCombatLogs(saved.combatLogs);
    setEncounterEnvironment(saved.encounterEnvironment || 'terrestrial');
  }, [character.id]);

  // Save encounter state to localStorage whenever state updates
  React.useEffect(() => {
    const charKey = character.id || 'default';
    try {
      const dataToSave: SavedEncounterData = {
        combatants,
        activeTurnIndex,
        roundNumber,
        combatLogs,
        encounterEnvironment
      };
      localStorage.setItem(`dnd_encounter_state_v1_${charKey}`, JSON.stringify(dataToSave));
    } catch (err) {
      console.error("Error saving encounter state to localStorage:", err);
    }
  }, [combatants, activeTurnIndex, roundNumber, combatLogs, encounterEnvironment, character.id]);

  // Keep player combatant HP, AC, conditions and Name synced with global character data
  React.useEffect(() => {
    setCombatants(prev =>
      prev.map(c => {
        if (c.isPlayerChar) {
          return {
            ...c,
            name: character.name,
            hpCurrent: character.hpCurrent,
            hpMax: getEffectiveMaxHp(character),
            armorClass: character.armorClass,
            conditions: character.conditions || [],
            portraitUrl: character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined)
          };
        }
        return c;
      })
    );
  }, [
    character.hpCurrent,
    character.hpMax,
    character.feats,
    character.inventory,
    character.abilities,
    character.level,
    character.maxHpModifier,
    character.exhaustionLevel,
    character.armorClass,
    character.name,
    character.conditions,
    character.portraitUrl,
    character.isMonster
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaxHpId, setEditingMaxHpId] = useState<string | null>(null);
  const [editingMaxHpValue, setEditingMaxHpValue] = useState<number | string>('');

  // Combat Log State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logFilterCategory, setLogFilterCategory] = useState<string>('all');
  const [logSearchText, setLogSearchText] = useState('');
  const [customNoteInput, setCustomNoteInput] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);

  const activeCombatant = combatants[activeTurnIndex];

  // Determine full character data for the combatant whose turn is currently active
  const activeAttackerCharacter: CharacterData = React.useMemo(() => {
    if (!activeCombatant) return character;

    if (activeCombatant.isPlayerChar || activeCombatant.name.toLowerCase() === character.name.toLowerCase()) {
      return character;
    }

    const cleanActiveName = activeCombatant.name.toLowerCase().replace(/\s+#\d+$/, '');
    const found = allCharacters.find(ch => {
      const cleanChId = ch.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '');
      const cleanCombId = activeCombatant.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '').replace(/-\d+$/, '');
      return (
        ch.id === activeCombatant.id ||
        cleanChId === cleanCombId ||
        ch.name.toLowerCase() === cleanActiveName
      );
    });

    if (found) {
      return found;
    }

    return {
      ...character,
      id: activeCombatant.id,
      name: activeCombatant.name,
      armorClass: activeCombatant.armorClass,
      hpCurrent: activeCombatant.hpCurrent,
      hpMax: activeCombatant.hpMax,
      attacks: [],
      spells: [],
      conditions: activeCombatant.conditions || []
    };
  }, [activeCombatant, character, allCharacters]);

  const addLogEntry = (category: CombatLogEntry['category'], message: string, actor?: string) => {
    const newEntry: CombatLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round: roundNumber,
      actor: actor || activeCombatant?.name || character.name,
      category,
      message
    };
    setCombatLogs(prev => [newEntry, ...prev]);
  };

  // New Combatant Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState<number>(10);
  const [newAc, setNewAc] = useState<number>(14);
  const [newHp, setNewHp] = useState<number>(20);
  const [newType, setNewType] = useState<'ally' | 'enemy'>('enemy');
  const [newMonsterXpReward, setNewMonsterXpReward] = useState<number>(450);
  const [newPortraitUrl, setNewPortraitUrl] = useState<string>('');

  // XP Defeated Banner state
  const [xpAlert, setXpAlert] = useState<{
    monsterName: string;
    totalXp: number;
    xpPerParticipant: number;
    participantCount: number;
    participantNames: string;
  } | null>(null);

  // Helper function to distribute XP when a monster/enemy is slain
  const awardDefeatedMonsterXp = (target: Combatant) => {
    if (target.type !== 'enemy' || target.isDefeated) return;

    const totalXp = target.monsterXpReward !== undefined ? target.monsterXpReward : 450;
    if (totalXp <= 0) return;

    // Active participants: players and allies in the encounter
    const activeParticipants = combatants.filter(c => c.type === 'player' || c.type === 'ally');
    const participantCount = Math.max(1, activeParticipants.length);
    const xpPerParticipant = Math.floor(totalXp / participantCount);

    // Mark monster as defeated in state so XP isn't awarded twice
    setCombatants(prev =>
      prev.map(c => c.id === target.id ? { ...c, isDefeated: true } : c)
    );

    // Automatically update the main player character's XP if they participated
    if (onUpdateCharacter && xpPerParticipant > 0) {
      const isPlayerInParticipants = activeParticipants.some(p => p.isPlayerChar || p.name === character.name);
      if (isPlayerInParticipants) {
        const isDual = !!(character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass);
        const currentGenXp = character.experiencePoints || 0;
        const newGenXp = currentGenXp + xpPerParticipant;

        if (!isDual) {
          const newLevel = getLevelFromTotalXp(newGenXp);
          onUpdateCharacter({
            ...character,
            experiencePoints: newGenXp,
            ...(newLevel > character.level ? { level: newLevel } : {})
          });
        } else {
          // General XP for dual classing (unallocated until spent in Level Progression Modal)
          onUpdateCharacter({
            ...character,
            experiencePoints: newGenXp
          });
        }
      }
    }

    setXpAlert({
      monsterName: target.name,
      totalXp,
      xpPerParticipant,
      participantCount,
      participantNames: activeParticipants.map(p => p.name).join(', ')
    });

    addLogEntry(
      'heal',
      `💀 MONSTER DEFEATED: ${target.name}! ${totalXp.toLocaleString()} total XP distributed (${xpPerParticipant.toLocaleString()} XP to each of ${participantCount} active participant(s): ${activeParticipants.map(p => p.name).join(', ')})`,
      target.name
    );
  };

  // Correct calculation of DEX score and initiative bonus
  const dexScore = character.abilities?.DEX?.score ?? 10;
  const dexMod = getAbilityModifier(dexScore);
  const rawInitBonus = typeof character.initiativeBonus === 'number' && !isNaN(character.initiativeBonus) ? character.initiativeBonus : 0;
  const initBonus = rawInitBonus + (isNaN(dexMod) ? 0 : dexMod);

  // Roll Initiative for active Player Character
  const handleRollPlayerInitiative = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = isNaN(initBonus) ? 0 : initBonus;
    const total = roll + bonus;

    if (onRoll) {
      onRoll(`Initiative Roll (${roll} + ${bonus})`, 20, 1, bonus, 'normal');
    }

    addLogEntry('initiative', `Rolled Initiative: ${total} (Roll: ${roll} + Bonus: ${bonus})`, character.name);

    setCombatants(prev => {
      const updated = prev.map(c => {
        if (c.isPlayerChar) {
          return {
            ...c,
            initiative: total,
            hpCurrent: character.hpCurrent,
            hpMax: getEffectiveMaxHp(character),
            armorClass: character.armorClass
          };
        }
        return c;
      });
      // Sort descending by initiative
      return [...updated].sort((a, b) => b.initiative - a.initiative);
    });
  };

  const [selectedPartyIdToAdd, setSelectedPartyIdToAdd] = useState<string>('');

  const handleAddPartyToEncounter = (partyObj?: Party) => {
    const partyToUse = partyObj || parties.find(p => p.id === selectedPartyIdToAdd);
    if (!partyToUse) return;

    const allMembers = (allCharacters || []).filter(c => partyToUse.characterIds.includes(c.id));
    if (allMembers.length === 0) {
      alert(`Party "${partyToUse.name}" has no members! Add characters to the party first.`);
      return;
    }

    const deadMembers = allMembers.filter(m => !m.isMonster && isCharacterDead(m));
    const members = allMembers.filter(m => m.isMonster || !isCharacterDead(m));

    if (deadMembers.length > 0) {
      alert(`The following dead character(s) were excluded from combat: ${deadMembers.map(m => m.name).join(', ')}. Revive them before adding them to combat!`);
    }

    if (members.length === 0) {
      return;
    }

    const newCombatants: Combatant[] = [];
    const addedLogDetails: string[] = [];

    members.forEach(member => {
      const isPlayerChar = member.id === character.id;
      const memDexScore = member.abilities?.DEX?.score ?? 10;
      const memDexMod = getAbilityModifier(memDexScore);
      const memInitBonus = (member.initiativeBonus || 0) + (isNaN(memDexMod) ? 0 : memDexMod);
      const rolledInit = Math.floor(Math.random() * 20) + 1 + memInitBonus;
      const portrait = member.portraitUrl || (member.isMonster ? getMonsterPortraitUrl(member.name, member.id) : undefined);
      const effectiveMax = getEffectiveMaxHp(member);

      newCombatants.push({
        id: isPlayerChar ? 'player-' + member.id : 'party-' + member.id + '-' + Date.now(),
        name: member.name,
        initiative: rolledInit,
        armorClass: member.armorClass || 10,
        hpCurrent: member.hpCurrent || effectiveMax || 10,
        hpMax: effectiveMax || 10,
        type: isPlayerChar ? 'player' : 'ally',
        isPlayerChar,
        partyId: partyToUse.id,
        isPartyMember: true,
        conditions: member.conditions || [],
        portraitUrl: portrait
      });

      addedLogDetails.push(`${member.name} (${isPlayerChar ? 'YOU' : 'Ally'}) - Init: ${rolledInit}, AC: ${member.armorClass || 10}, HP: ${member.hpCurrent || effectiveMax || 10}/${effectiveMax}`);
    });

    setCombatants(prev => {
      const newNames = new Set(newCombatants.map(c => c.name.toLowerCase()));
      const filteredPrev = prev.filter(c => !newNames.has(c.name.toLowerCase()));
      const combined = [...filteredPrev, ...newCombatants];
      return combined.sort((a, b) => b.initiative - a.initiative);
    });

    addLogEntry(
      'turn',
      `🛡️ Party "${partyToUse.name}" (${members.length} members) joined the encounter as Allies!\n${addedLogDetails.join('\n')}`,
      'Party'
    );

    setShowAddModal(false);
    setSelectedPartyIdToAdd('');
  };

  // Filter characters & monsters by active TRPG edition
  const activeEdition = character.edition || '5e';
  const filteredCharacters = allCharacters.filter(
    c => (c.edition || '5e') === activeEdition
  );

  // Handle template selection from roster/monsters
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setNewPortraitUrl('');
      return;
    }

    const tpl = allCharacters.find(c => c.id === templateId);
    if (!tpl) return;

    setNewName(tpl.name);
    setNewAc(tpl.armorClass || 10);
    setNewHp(tpl.hpMax || 10);
    setNewMonsterXpReward(tpl.monsterXpReward !== undefined ? tpl.monsterXpReward : (tpl.isMonster ? 450 : 0));

    const portrait = tpl.portraitUrl || (tpl.isMonster ? getMonsterPortraitUrl(tpl.name, tpl.id) : '');
    setNewPortraitUrl(portrait);

    const tplDexScore = tpl.abilities?.DEX?.score ?? 10;
    const tplDexMod = getAbilityModifier(tplDexScore);
    const tplInitBonus = (tpl.initiativeBonus || 0) + (isNaN(tplDexMod) ? 0 : tplDexMod);
    const rolledInit = Math.floor(Math.random() * 20) + 1 + tplInitBonus;

    setNewInit(rolledInit);
    setNewType(tpl.isMonster ? 'enemy' : 'ally');
  };

  // Add Custom Combatant
  const handleAddCombatant = () => {
    if (!newName.trim()) return;

    if (selectedTemplateId) {
      const tpl = allCharacters.find(c => c.id === selectedTemplateId);
      if (tpl && !tpl.isMonster && isCharacterDead(tpl)) {
        alert(`"${tpl.name}" is Dead and cannot be added to combat until revived!`);
        return;
      }
    }

    const finalPortrait = newPortraitUrl.trim() || (newType === 'enemy' ? getMonsterPortraitUrl(newName.trim()) : undefined);

    const newEntry: Combatant = {
      id: 'comb-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: newName.trim(),
      initiative: isNaN(newInit) ? 10 : newInit,
      armorClass: isNaN(newAc) ? 10 : newAc,
      hpCurrent: isNaN(newHp) ? 10 : newHp,
      hpMax: isNaN(newHp) ? 10 : newHp,
      type: newType,
      monsterXpReward: newType === 'enemy' ? (isNaN(newMonsterXpReward) ? 450 : newMonsterXpReward) : 0,
      isDefeated: false,
      portraitUrl: finalPortrait
    };

    setCombatants(prev => {
      const updated = [...prev, newEntry];
      return updated.sort((a, b) => b.initiative - a.initiative);
    });

    addLogEntry('turn', `Added target ${newEntry.name} (HP: ${newEntry.hpMax}, AC: ${newEntry.armorClass}, Init: ${newEntry.initiative}${newType === 'enemy' ? `, XP: ${newEntry.monsterXpReward}` : ''})`, newEntry.name);

    setSelectedTemplateId('');
    setNewName('');
    setNewInit(10);
    setNewAc(14);
    setNewHp(20);
    setNewMonsterXpReward(450);
    setNewPortraitUrl('');
    setShowAddModal(false);
  };

  // Clone / Duplicate an existing combatant in the tracker
  const handleCloneCombatant = (c: Combatant) => {
    const baseName = c.name.replace(/\s+#\d+$/, '');
    const count = combatants.filter(item => item.name.startsWith(baseName)).length;
    const clonedName = `${baseName} #${count + 1}`;

    const clonedEntry: Combatant = {
      ...c,
      id: 'comb-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: clonedName,
      isPlayerChar: false,
      monsterXpReward: c.monsterXpReward,
      isDefeated: false
    };

    setCombatants(prev => {
      const updated = [...prev, clonedEntry];
      return updated.sort((a, b) => b.initiative - a.initiative);
    });

    addLogEntry('turn', `Cloned combatant ${c.name} -> ${clonedName}`, clonedName);
  };

  // Action handler for Cleric Turn Undead / Destroy Undead feature against a specific combatant
  const handleTurnDestroyUndead = (target: Combatant) => {
    const wisScore = character.abilities?.WIS?.score ?? 10;
    const wisMod = Math.floor((wisScore - 10) / 2);
    const profBonus = Math.floor((character.level - 1) / 4) + 2;
    const saveDc = 8 + profBonus + wisMod;

    // Determine Cleric Destroy Undead CR threshold
    let destroyMaxCr = 0; // Turn only below level 5
    let destroyCrText = 'CR 1/2 or lower';
    if (character.level >= 17) { destroyMaxCr = 4; destroyCrText = 'CR 4 or lower'; }
    else if (character.level >= 14) { destroyMaxCr = 3; destroyCrText = 'CR 3 or lower'; }
    else if (character.level >= 11) { destroyMaxCr = 2; destroyCrText = 'CR 2 or lower'; }
    else if (character.level >= 8) { destroyMaxCr = 1; destroyCrText = 'CR 1 or lower'; }
    else if (character.level >= 5) { destroyMaxCr = 0.5; destroyCrText = 'CR 1/2 or lower'; }

    // Check target CR
    const tpl = allCharacters.find(a => a.name.toLowerCase() === target.name.toLowerCase().replace(/\s+#\d+$/, ''));
    let targetCr = 0.25;
    if (tpl?.subclass) {
      const crMatch = tpl.subclass.match(/CR\s*([\d\/\.]+)/i);
      if (crMatch) {
        if (crMatch[1] === '1/2') targetCr = 0.5;
        else if (crMatch[1] === '1/4') targetCr = 0.25;
        else if (crMatch[1] === '1/8') targetCr = 0.125;
        else targetCr = parseFloat(crMatch[1]) || 0.25;
      }
    }

    const isDestroyed = character.level >= 5 && targetCr <= destroyMaxCr;

    if (isDestroyed) {
      // Destroy creature instantly!
      setCombatants(prev =>
        prev.map(c => c.id === target.id ? { ...c, hpCurrent: 0, conditions: Array.from(new Set([...(c.conditions || []), 'Destroyed'])) } : c)
      );
      if (onRoll) {
        onRoll(`✝️ DESTROY UNDEAD against ${target.name}! Divine wrath obliterates creature (CR ${targetCr} <= ${destroyCrText})!`, 20, 1, 0, 'normal');
      }
      addLogEntry('ability', `✝️ DESTROY UNDEAD: Divine wrath obliterated ${target.name} (CR ${targetCr} <= ${destroyCrText})!`, character.name);
      if (target.type === 'enemy' && !target.isDefeated) {
        awardDefeatedMonsterXp(target);
      }
    } else {
      // Turn creature (add Turned condition)
      setCombatants(prev =>
        prev.map(c => c.id === target.id ? { ...c, conditions: Array.from(new Set([...(c.conditions || []), 'Turned'])) } : c)
      );
      if (onRoll) {
        onRoll(`✝️ TURN UNDEAD against ${target.name}! Creature must make a WIS Save vs DC ${saveDc} or flee for 1 min!`, 20, 1, 0, 'normal');
      }
      addLogEntry('ability', `✝️ TURN UNDEAD: Forced ${target.name} to make WIS Save vs DC ${saveDc}`, character.name);
    }
  };

  // Switch allegiance between Ally, Enemy, and Player (e.g. for Animal Handling or Charm)
  const handleToggleAllegiance = (targetId: string, newType: 'player' | 'ally' | 'enemy') => {
    setCombatants(prev => prev.map(c => {
      if (c.id === targetId) {
        const oldType = c.type;
        const newConds = newType === 'ally' && oldType === 'enemy'
          ? Array.from(new Set([...(c.conditions || []), 'Controlled / Charmed']))
          : c.conditions;
        return {
          ...c,
          type: newType,
          conditions: newConds,
          controlledBy: newType === 'ally' ? character.name : undefined
        };
      }
      return c;
    }));
    const target = combatants.find(c => c.id === targetId);
    if (target) {
      addLogEntry('ability', `🐾 ALLEGIANCE CHANGED: ${target.name} is now an ${newType.toUpperCase()} (Controlled by ${character.name})!`, character.name);
    }
  };

  // Revive a defeated or 0 HP target as an Undead / Controlled Ally
  const handleReviveAsUndeadAlly = (target: Combatant) => {
    const revivedHp = target.hpMax || 10;
    setCombatants(prev => prev.map(c => {
      if (c.id === target.id) {
        return {
          ...c,
          hpCurrent: revivedHp,
          type: 'ally',
          isDefeated: false,
          controlledBy: character.name,
          conditions: Array.from(new Set([...(c.conditions || []).filter(cond => cond !== 'Destroyed' && cond !== 'Unconscious'), 'Undead Minion']))
        };
      }
      return c;
    }));
    addLogEntry('ability', `🧟 REVIVE UNDEAD: Reanimated ${target.name} as a loyal Undead Ally under ${character.name}'s control (${revivedHp} HP)!`, character.name);
  };

  const handleRemoveCombatant = (id: string) => {
    const target = combatants.find(c => c.id === id);
    if (target) {
      addLogEntry('turn', `Removed ${target.name} from combat`, target.name);
    }
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    let nextIdx = 0;
    let nextRound = roundNumber;
    if (activeTurnIndex >= combatants.length - 1) {
      nextIdx = 0;
      nextRound = roundNumber + 1;
      setActiveTurnIndex(0);
      setRoundNumber(nextRound);
    } else {
      nextIdx = activeTurnIndex + 1;
      setActiveTurnIndex(nextIdx);
    }
    const nextCombatant = combatants[nextIdx];
    if (nextCombatant) {
      addLogEntry('turn', `Round ${nextRound} - Turn started for ${nextCombatant.name} (Init ${nextCombatant.initiative})`, nextCombatant.name);
    }
  };

  const handlePrevTurn = () => {
    if (combatants.length === 0) return;
    let prevIdx = 0;
    let prevRound = roundNumber;
    if (activeTurnIndex <= 0) {
      prevIdx = combatants.length - 1;
      prevRound = Math.max(1, roundNumber - 1);
      setActiveTurnIndex(prevIdx);
      setRoundNumber(prevRound);
    } else {
      prevIdx = activeTurnIndex - 1;
      setActiveTurnIndex(prevIdx);
    }
    const prevCombatant = combatants[prevIdx];
    if (prevCombatant) {
      addLogEntry('turn', `Turn moved back to ${prevCombatant.name}`, prevCombatant.name);
    }
  };

  const handleAdjustHp = (id: string, delta: number) => {
    const target = combatants.find(c => c.id === id);
    if (!target) return;

    const wasAtZero = target.hpCurrent <= 0;
    const nextHp = Math.max(0, Math.min(target.hpMax, target.hpCurrent + delta));

    setCombatants(prev =>
      prev.map(c => (c.id === id ? { ...c, hpCurrent: nextHp } : c))
    );

    if (delta < 0) {
      if (wasAtZero) {
        addLogEntry('damage', `💀 ${target.name} took damage at 0 HP! Automatic Death Save Failure added.`, target.name);
      } else {
        addLogEntry('damage', `${target.name} took ${Math.abs(delta)} damage (${nextHp}/${target.hpMax} HP)`, target.name);
      }
    } else if (delta > 0) {
      addLogEntry('heal', `${target.name} healed for ${delta} HP (${nextHp}/${target.hpMax} HP)`, target.name);
    }

    // Auto-distribute XP if enemy monster is defeated (HP drops to 0)
    if (target.type === 'enemy' && target.hpCurrent > 0 && nextHp === 0 && !target.isDefeated) {
      awardDefeatedMonsterXp(target);
    }

    if (target.isPlayerChar && onUpdateCharacter) {
      let updatedFailures = character.deathSavesFailures || 0;
      let updatedSuccesses = character.deathSavesSuccesses || 0;
      let conds = character.conditions || [];

      if (delta < 0 && wasAtZero) {
        updatedFailures = Math.min(3, updatedFailures + 1);
        if (updatedFailures >= 3 && !conds.includes('Dead')) {
          conds = [...conds, 'Dead'];
        }
      } else if (delta > 0 && wasAtZero) {
        updatedFailures = 0;
        updatedSuccesses = 0;
        conds = conds.filter(c => c !== 'Unconscious');
      }

      onUpdateCharacter({
        ...character,
        hpCurrent: nextHp,
        deathSavesFailures: updatedFailures,
        deathSavesSuccesses: updatedSuccesses,
        conditions: conds
      });
    }
  };

  const handleUpdateCombatantMaxHp = (id: string, newMaxHp: number) => {
    const validMaxHp = Math.max(1, newMaxHp);
    const target = combatants.find(c => c.id === id);
    if (!target) return;

    setCombatants(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updatedHpCurrent = Math.min(c.hpCurrent, validMaxHp);
          
          if (c.isPlayerChar || c.type === 'player') {
            if (c.id === 'player-' + character.id || c.id === character.id) {
              if (onUpdateCharacter) {
                onUpdateCharacter({
                  ...character,
                  hpMax: validMaxHp,
                  hpCurrent: updatedHpCurrent
                });
              }
            } else {
              const matchedChar = allCharacters.find(ch => 'player-' + ch.id === c.id || ch.id === c.id);
              if (matchedChar && onUpdateCharacter) {
                onUpdateCharacter({
                  ...matchedChar,
                  hpMax: validMaxHp,
                  hpCurrent: Math.min(matchedChar.hpCurrent, validMaxHp)
                });
              }
            }
          }

          return {
            ...c,
            hpMax: validMaxHp,
            hpCurrent: updatedHpCurrent
          };
        }
        return c;
      })
    );

    addLogEntry('turn', `Updated ${target.name}'s Max HP to ${validMaxHp} HP`, target.name);
  };

  const handleToggleCombatantCondition = (combatantId: string, condName: string) => {
    const target = combatants.find(c => c.id === combatantId);
    if (!target) return;

    const currentConds = target.conditions || [];
    const isAdding = !currentConds.includes(condName);
    const updated = isAdding
      ? [...currentConds, condName]
      : currentConds.filter(x => x !== condName);

    setCombatants(prev =>
      prev.map(c => (c.id === combatantId ? { ...c, conditions: updated } : c))
    );

    if (isAdding) {
      addLogEntry('condition', `${target.name} gained condition: ${condName}`, target.name);
    } else {
      addLogEntry('condition', `${target.name} cleared condition: ${condName}`, target.name);
    }

    if (target.isPlayerChar && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        conditions: updated
      });
    }
  };

  const handleResetTracker = () => {
    setRoundNumber(1);
    setActiveTurnIndex(0);
    addLogEntry('turn', `Round counter reset to Round 1`);
  };

  const handleClearEncounter = () => {
    if (window.confirm("Are you sure you want to end this encounter? This will clear all added combatants and reset the encounter tracker.")) {
      const defaultPlayer: Combatant = {
        id: 'player-' + character.id,
        name: character.name,
        initiative: 0,
        armorClass: character.armorClass || 10,
        hpCurrent: character.hpCurrent || 10,
        hpMax: getEffectiveMaxHp(character),
        type: 'player',
        isPlayerChar: true,
        conditions: character.conditions || [],
        portraitUrl: character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined)
      };
      setCombatants([defaultPlayer]);
      setActiveTurnIndex(0);
      setRoundNumber(1);
      const newLogs: CombatLogEntry[] = [
        {
          id: 'log-init-' + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          round: 1,
          category: 'turn',
          message: `Encounter ended and reset for ${character.name}.`
        }
      ];
      setCombatLogs(newLogs);
    }
  };

  // Add custom user note to log
  const handleAddCustomNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNoteInput.trim()) return;
    const author = isDmRole ? 'DM' : character.name;
    addLogEntry('note', customNoteInput.trim(), author);
    setCustomNoteInput('');
  };

  // Filter logs by category and search
  const filteredLogs = combatLogs.filter(log => {
    if (logFilterCategory !== 'all' && log.category !== logFilterCategory) return false;
    if (logSearchText.trim()) {
      const term = logSearchText.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(term);
      const matchActor = log.actor?.toLowerCase().includes(term);
      if (!matchMsg && !matchActor) return false;
    }
    return true;
  });

  // Copy full log summary to clipboard
  const handleCopyLogSummary = () => {
    const text = combatLogs
      .map(l => `[Round ${l.round} | ${l.timestamp}] (${l.category.toUpperCase()}) ${l.actor ? `${l.actor}: ` : ''}${l.message}`)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // Environmental Action Triggers
  const handleTriggerAbolethMucousCloud = () => {
    if (onRoll) {
      onRoll('🦠 Aboleth Mucous Cloud DC 14 CON Save', 20, 1, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🦠 ABOLETH MUCOUS CLOUD TRIGGERED: Under water within 10 ft of Aboleth, target must succeed on DC 14 CON Save or become diseased (unable to breathe outside water for 1d4 hours).',
      'Aboleth'
    );
  };

  const handleTriggerBeholderEyeRay = () => {
    const rays = [
      { name: '1. Charm Ray', dc: 16, save: 'WIS', desc: 'Target must succeed on DC 16 WIS save or be Charmed by Beholder for 1 hour.' },
      { name: '2. Paralyzing Ray', dc: 16, save: 'CON', desc: 'Target must succeed on DC 16 CON save or be Paralyzed for 1 minute.' },
      { name: '3. Fear Ray', dc: 16, save: 'WIS', desc: 'Target must succeed on DC 16 WIS save or be Frightened for 1 minute.' },
      { name: '4. Slowing Ray', dc: 16, save: 'DEX', desc: 'Target must succeed on DC 16 DEX save or be Slowed (half speed, 1 action/turn) for 1 minute.' },
      { name: '5. Enervation Ray', dc: 16, save: 'CON', dice: [8, 8], desc: 'DC 16 CON save or take 8d8 Necrotic damage (half on save).' },
      { name: '6. Telekinetic Ray', dc: 16, save: 'STR', desc: 'Target must succeed on DC 16 STR save or be moved up to 30 feet.' },
      { name: '7. Sleep Ray', dc: 16, save: 'WIS', desc: 'Target must succeed on DC 16 WIS save or fall Asleep for 1 minute.' },
      { name: '8. Petrification Ray', dc: 16, save: 'DEX', desc: 'Target must succeed on DC 16 DEX save. Fail = turns to stone (Petrified).' },
      { name: '9. Disintegration Ray', dc: 16, save: 'DEX', dice: [10, 8], desc: 'DC 16 DEX save or take 10d8 Force damage (turned to dust at 0 HP).' },
      { name: '10. Death Ray', dc: 16, save: 'DEX', dice: [10, 10], desc: 'DC 16 DEX save or take 10d10 Necrotic damage (dies instantly at 0 HP).' }
    ];
    const rayIdx = Math.floor(Math.random() * 10);
    const chosen = rays[rayIdx];
    if (onRoll) {
      if (chosen.dice) {
        onRoll(`👁️ Beholder ${chosen.name} (${chosen.desc})`, chosen.dice[1], chosen.dice[0], 0, 'normal');
      } else {
        onRoll(`👁️ Beholder ${chosen.name} (DC 16 ${chosen.save} Save)`, 20, 1, 0, 'normal');
      }
    }
    addLogEntry(
      'ability',
      `👁️ BEHOLDER EYE RAY ROLLED [${chosen.name}]: ${chosen.desc}`,
      'Beholder'
    );
  };

  const handleTriggerMedusaGaze = () => {
    if (onRoll) {
      onRoll('🗿 Medusa Petrifying Gaze (DC 14 CON Save)', 20, 1, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🗿 MEDUSA PETRIFYING GAZE: Target starting turn within 30 ft that can see Medusa must save DC 14 CON. Fail by 5+ = instant Petrified!',
      'Medusa'
    );
  };

  const handleTriggerRemorhazHeatedBody = () => {
    if (onRoll) {
      onRoll('🔥 Remorhaz Heated Body (3d6 Fire Damage)', 6, 3, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🔥 REMORHAZ HEATED BODY: Creature touching or hitting Remorhaz within 5 ft takes 3d6 Fire damage!',
      'Remorhaz'
    );
  };

  const handleTriggerRemorhazSwallow = () => {
    if (onRoll) {
      onRoll('🕳️ Remorhaz Swallow Whole (6d6 Acid Damage)', 6, 6, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🕳️ REMORHAZ SWALLOW: Swallowed target takes 6d6 Acid damage at start of Remorhaz turn (Blinded/Restrained inside).',
      'Remorhaz'
    );
  };

  const handleTriggerRoperReel = () => {
    if (onRoll) {
      onRoll('🪢 Roper Reel & Advantage Bite Attack (+7 to hit, 4d8+4 Piercing)', 8, 4, 4, 'advantage');
    }
    addLogEntry(
      'ability',
      '🪢 ROPER REEL & BITE: Pulls grappled targets 25 ft straight toward Roper and makes a Bite attack with Advantage (+7 to hit, 4d8+4 Piercing)!',
      'Roper'
    );
  };

  const handleTriggerIronGolemPoisonBreath = () => {
    if (onRoll) {
      onRoll('🧪 Iron Golem Poison Breath (10d8 Poison, DC 19 CON Save)', 8, 10, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🧪 IRON GOLEM POISON BREATH: 15 ft cone, targets must make DC 19 CON Save or take 10d8 Poison damage (half on save).',
      'Iron Golem'
    );
  };

  const handleTriggerIronGolemFireAbsorption = () => {
    addLogEntry(
      'ability',
      '🔥 IRON GOLEM FIRE ABSORPTION: Subjected to Fire damage, takes 0 damage and instead regains HP equal to fire damage dealt!',
      'Iron Golem'
    );
  };

  const handleTriggerRustTouch = () => {
    addLogEntry(
      'ability',
      '⚙️ RUST MONSTER RUST TOUCH: Nonmagical metal armor or weapon touched takes a permanent -1 penalty to AC or damage rolls!',
      'Rust Monster'
    );
  };

  const handleTriggerMindBlast = () => {
    if (onRoll) {
      onRoll('🧠 Mind Flayer Mind Blast (4d8+4 Psychic, DC 15 INT Save)', 8, 4, 4, 'normal');
    }
    addLogEntry(
      'ability',
      '🧠 MIND BLAST: 60 ft cone, targets must make DC 15 INT Save or take 4d8+4 Psychic damage and be Stunned for 1 minute.',
      'Mind Flayer'
    );
  };

  const handleTriggerVampiricBite = () => {
    if (onRoll) {
      onRoll('🩸 Vampiric Bite (1d6+5 Piercing + 3d6 Necrotic)', 6, 3, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🩸 VAMPIRIC BITE: Deals 1d6+5 Piercing + 3d6 Necrotic. Vampire regains HP equal to necrotic damage, and target Max HP is reduced!',
      'Vampire'
    );
  };

  const handleTriggerGibberingMouther = () => {
    const roll8 = Math.floor(Math.random() * 8) + 1;
    let effect = '';
    if (roll8 <= 4) effect = 'Creature does nothing this turn.';
    else if (roll8 <= 6) effect = 'Creature takes no action/bonus action and moves in a random direction.';
    else effect = 'Creature makes one melee attack against a randomly determined creature in range.';

    if (onRoll) {
      onRoll(`🗣️ Gibbering Mouther Aura Roll (${roll8}/8: ${effect})`, 8, 1, 0, 'normal');
    }
    addLogEntry(
      'ability',
      `🗣️ GIBBERING AURA (DC 10 WIS Save): Rolled ${roll8}/8 -> ${effect}`,
      'Gibbering Mouther'
    );
  };

  const handleTriggerCloakerTransfer = () => {
    addLogEntry(
      'ability',
      '🧥 CLOAKER DAMAGE TRANSFER: Cloaker takes only half damage while attached to a target; the attached creature takes the remaining half!',
      'Cloaker'
    );
  };

  const handleTriggerShamblingMoundEngulf = () => {
    if (onRoll) {
      onRoll('🌿 Shambling Mound Engulf Damage (2d8+4 Bludgeoning)', 8, 2, 4, 'normal');
    }
    addLogEntry(
      'ability',
      '🌿 SHAMBLING MOUND ENGULF: Target is grappled, restrained, blinded, and suffocating inside the plant body!',
      'Shambling Mound'
    );
  };

  const handleTriggerShamblingMoundLightning = () => {
    addLogEntry(
      'ability',
      '⚡ SHAMBLING MOUND LIGHTNING ABSORPTION: Subjected to lightning damage, takes 0 damage and instead regains HP equal to the damage dealt!',
      'Shambling Mound'
    );
  };

  const handleTriggerPhaseSpiderJaunt = () => {
    addLogEntry(
      'ability',
      '✨ PHASE SPIDER ETHEREAL JAUNT: Shifts between the Material Plane and the Ethereal Plane as a Bonus Action!',
      'Phase Spider'
    );
  };

  const handleTriggerFlameskullFireball = () => {
    if (onRoll) {
      onRoll('🔥 Flameskull Fireball (8d6 Fire, DC 13 DEX Save)', 6, 8, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🔥 FLAMESKULL FIREBALL: 20-ft radius sphere. Targets must make DC 13 DEX Save or take 8d6 Fire damage (half on save).',
      'Flameskull'
    );
  };

  const handleTriggerShadowStrengthDrain = () => {
    const drainRoll = Math.floor(Math.random() * 4) + 1;
    if (onRoll) {
      onRoll(`👻 Shadow Strength Drain (${drainRoll} STR Loss)`, 4, 1, 0, 'normal');
    }
    addLogEntry(
      'ability',
      `👻 SHADOW STRENGTH DRAIN: Target hit takes 2d6+2 Necrotic damage and loses ${drainRoll} Strength score! (Target dies if STR reaches 0).`,
      'Shadow'
    );
  };

  const handleTriggerCockatricePetrify = () => {
    if (onRoll) {
      onRoll('🐓 Cockatrice Petrifying Touch (DC 11 CON Save)', 20, 1, 0, 'normal');
    }
    addLogEntry(
      'ability',
      '🐓 COCKATRICE PETRIFYING TOUCH: Target hit by bite must pass DC 11 CON Save or begin turning to stone (Petrified for 24 hours).',
      'Cockatrice'
    );
  };

  const handleTriggerMagmaEruption = () => {
    if (onRoll) {
      onRoll('🌋 Magma Eruption 6d6 Fire Damage (DC 15 DEX Save)', 6, 6, 0, 'normal');
    }
    addLogEntry(
      'ability',
      'DEX Save vs DC 15 or 6d6 Fire Damage from Magma Eruption',
      'Environment'
    );
  };

  const currentEnvConfig = ENVIRONMENT_CONFIGS[encounterEnvironment] || ENVIRONMENT_CONFIGS.terrestrial;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Crosshair className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold text-stone-100 text-sm">Initiative & Encounter Tracker</h3>
          <span className="bg-amber-950 text-amber-300 border border-amber-600/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
            Round {roundNumber}
          </span>

          {/* Environment Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-xl text-xs font-bold shadow">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400 font-sans hidden sm:inline">Location:</span>
            <select
              value={encounterEnvironment}
              onChange={(e) => {
                const nextEnv = e.target.value as EncounterEnvironment;
                setEncounterEnvironment(nextEnv);
                addLogEntry('note', `🌍 Location / Environment changed to: ${ENVIRONMENT_CONFIGS[nextEnv]?.name || nextEnv}`, 'DM');
              }}
              className="bg-stone-900 text-amber-200 border border-stone-700 rounded-lg px-2 py-1 text-xs font-serif font-bold cursor-pointer focus:outline-none focus:border-amber-500"
            >
              <option value="terrestrial">🏰 Standard Ground / Dungeon</option>
              <option value="underwater">🌊 Underwater / Submerged</option>
              <option value="volcanic">🌋 Volcanic / Extreme Heat</option>
              <option value="arctic">❄️ Arctic / Glacial Cold</option>
              <option value="shadowfell">🌫️ Shadowfell / Obscured Fog</option>
              <option value="aerial">🦅 High Altitude / Airborne</option>
              <option value="lair_active">👑 Boss Lair (Lair Actions Engaged)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 px-3 py-1.5 rounded-xl font-bold text-xs transition relative shadow"
            title="Open Encounter Combat Log"
          >
            <ScrollText className="w-3.5 h-3.5 text-amber-400" />
            <span>Combat Log</span>
            {combatLogs.length > 0 && (
              <span className="bg-amber-500 text-stone-950 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {combatLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={handleRollPlayerInitiative}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow"
            title="Roll Initiative d20 + DEX Mod"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Roll My Init ({formatModifier(initBonus)})</span>
          </button>

          {onOpenPartyManager && (
            <button
              onClick={onOpenPartyManager}
              className="flex items-center gap-1.5 text-xs bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/60 px-3 py-1.5 rounded-xl font-bold transition shadow"
              title="Manage adventuring parties & allies"
            >
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>Parties ({parties?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-xl font-bold transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Add Target</span>
          </button>

          <button
            onClick={handleClearEncounter}
            className="flex items-center gap-1 text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 px-2.5 py-1.5 rounded-xl font-bold transition shadow"
            title="End encounter & clear all added combatants"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>End Encounter</span>
          </button>
        </div>
      </div>

      {/* Active Encounter Location / Environment Rule Banner */}
      {encounterEnvironment !== 'terrestrial' && (
        <div className={`${currentEnvConfig.badgeBg} border ${currentEnvConfig.badgeBorder} rounded-xl p-3 shadow-xl space-y-2 animate-fadeIn`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">{currentEnvConfig.icon}</span>
              <div>
                <div className="font-serif font-bold text-sm flex items-center gap-2 flex-wrap text-amber-100">
                  <span>Location Active: {currentEnvConfig.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide bg-stone-900 border border-stone-700 ${currentEnvConfig.color}`}>
                    Special Environment
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed mt-0.5">
                  {currentEnvConfig.rulesBanner}
                </p>
              </div>
            </div>

            {/* Quick Trigger Buttons for Environment Features */}
            <div className="flex items-center gap-2 flex-wrap">
              {encounterEnvironment === 'underwater' && (
                <button
                  onClick={handleTriggerAbolethMucousCloud}
                  className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow"
                  title="Trigger Aboleth Mucous Cloud (DC 14 CON Save)"
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>🦠 Trigger Aboleth Mucous Cloud (DC 14 CON)</span>
                </button>
              )}

              {encounterEnvironment === 'volcanic' && (
                <button
                  onClick={handleTriggerMagmaEruption}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow"
                  title="Trigger Magma Eruption Hazard"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>🌋 Magma Eruption (DC 15 DEX / 6d6 Fire)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monster Special Mechanics Action Bar */}
      {(() => {
        const activeMonsterNames = combatants.map(c => c.name.toLowerCase());
        const hasMonster = (keyword: string) => activeMonsterNames.some(name => name.includes(keyword.toLowerCase()));

        const showBeholder = hasMonster('beholder');
        const showMedusa = hasMonster('medusa');
        const showRemorhaz = hasMonster('remorhaz');
        const showRoper = hasMonster('roper');
        const showIronGolem = hasMonster('iron golem') || hasMonster('golem');
        const showRustMonster = hasMonster('rust');
        const showMindFlayer = hasMonster('mind flayer') || hasMonster('illithid');
        const showVampire = hasMonster('vampire') || hasMonster('vampiric');
        const showGibbering = hasMonster('gibbering') || hasMonster('mouther');
        const showCloaker = hasMonster('cloaker');
        const showShambling = hasMonster('shambling') || hasMonster('mound');
        const showPhaseSpider = hasMonster('phase spider') || hasMonster('phase');
        const showFlameskull = hasMonster('flameskull');
        const showShadow = hasMonster('shadow');
        const showCockatrice = hasMonster('cockatrice');
        const showAboleth = hasMonster('aboleth');

        const hasAnySpecialMonster =
          showBeholder || showMedusa || showRemorhaz || showRoper || showIronGolem ||
          showRustMonster || showMindFlayer || showVampire || showGibbering || showCloaker ||
          showShambling || showPhaseSpider || showFlameskull || showShadow || showCockatrice || showAboleth;

        return (
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-200">
              <span className="flex items-center gap-1.5">
                <span>👹</span>
                <span>Monster Mechanics & Special Action Triggers</span>
              </span>
              <span className="text-[10px] text-stone-400 font-sans">
                {hasAnySpecialMonster ? 'Click to trigger mechanics in die roller & combat log' : 'Active encounter monsters trigger shortcuts'}
              </span>
            </div>

            {hasAnySpecialMonster ? (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {showBeholder && (
                  <button
                    onClick={handleTriggerBeholderEyeRay}
                    className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/50 text-purple-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Roll random Beholder Eye Ray (1d10)"
                  >
                    <span>👁️</span> Beholder Eye Ray
                  </button>
                )}

                {showMedusa && (
                  <button
                    onClick={handleTriggerMedusaGaze}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Medusa Petrifying Gaze (DC 14 CON)"
                  >
                    <span>🗿</span> Medusa Gaze (DC 14)
                  </button>
                )}

                {showRemorhaz && (
                  <>
                    <button
                      onClick={handleTriggerRemorhazHeatedBody}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Remorhaz Heated Body Counter (3d6 Fire)"
                    >
                      <span>🔥</span> Remorhaz Heated Body
                    </button>
                    <button
                      onClick={handleTriggerRemorhazSwallow}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Remorhaz Swallow Whole (6d6 Acid)"
                    >
                      <span>🕳️</span> Remorhaz Swallow
                    </button>
                  </>
                )}

                {showRoper && (
                  <button
                    onClick={handleTriggerRoperReel}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Roper Reel & Advantage Bite (+7 to hit, 4d8+4)"
                  >
                    <span>🪢</span> Roper Reel & Bite
                  </button>
                )}

                {showIronGolem && (
                  <>
                    <button
                      onClick={handleTriggerIronGolemPoisonBreath}
                      className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 border border-teal-600/50 text-teal-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Iron Golem Poison Breath (10d8 Poison, DC 19)"
                    >
                      <span>🧪</span> Iron Golem Breath
                    </button>
                    <button
                      onClick={handleTriggerIronGolemFireAbsorption}
                      className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Iron Golem Fire Absorption"
                    >
                      <span>🔥</span> Iron Golem Fire Absorption
                    </button>
                  </>
                )}

                {showRustMonster && (
                  <button
                    onClick={handleTriggerRustTouch}
                    className="px-2.5 py-1 bg-orange-950 hover:bg-orange-900 border border-orange-600/50 text-orange-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Rust Touch (-1 AC Penalty)"
                  >
                    <span>⚙️</span> Rust Touch (-1 AC)
                  </button>
                )}

                {showMindFlayer && (
                  <button
                    onClick={handleTriggerMindBlast}
                    className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Mind Flayer Mind Blast (4d8+4, DC 15 INT)"
                  >
                    <span>🧠</span> Mind Blast (DC 15)
                  </button>
                )}

                {showVampire && (
                  <button
                    onClick={handleTriggerVampiricBite}
                    className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-600/50 text-red-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Vampiric Bite & Max HP Drain"
                  >
                    <span>🩸</span> Vampiric Bite
                  </button>
                )}

                {showGibbering && (
                  <button
                    onClick={handleTriggerGibberingMouther}
                    className="px-2.5 py-1 bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-600/50 text-fuchsia-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Gibbering Mouther Confusion Aura (1d8 Confusion Roll)"
                  >
                    <span>🗣️</span> Gibbering Aura
                  </button>
                )}

                {showCloaker && (
                  <button
                    onClick={handleTriggerCloakerTransfer}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-600/50 text-slate-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Cloaker 50% Damage Transfer"
                  >
                    <span>🧥</span> Cloaker Damage Transfer
                  </button>
                )}

                {showShambling && (
                  <>
                    <button
                      onClick={handleTriggerShamblingMoundEngulf}
                      className="px-2.5 py-1 bg-lime-950 hover:bg-lime-900 border border-lime-600/50 text-lime-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Shambling Mound Engulf & Suffocate"
                    >
                      <span>🌿</span> Shambling Engulf
                    </button>
                    <button
                      onClick={handleTriggerShamblingMoundLightning}
                      className="px-2.5 py-1 bg-yellow-950 hover:bg-yellow-900 border border-yellow-600/50 text-yellow-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                      title="Trigger Shambling Mound Lightning Absorption"
                    >
                      <span>⚡</span> Shambling Lightning Heal
                    </button>
                  </>
                )}

                {showPhaseSpider && (
                  <button
                    onClick={handleTriggerPhaseSpiderJaunt}
                    className="px-2.5 py-1 bg-violet-950 hover:bg-violet-900 border border-violet-600/50 text-violet-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Phase Spider Ethereal Jaunt"
                  >
                    <span>✨</span> Phase Spider Jaunt
                  </button>
                )}

                {showFlameskull && (
                  <button
                    onClick={handleTriggerFlameskullFireball}
                    className="px-2.5 py-1 bg-orange-950 hover:bg-orange-900 border border-orange-600/50 text-orange-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Flameskull 8d6 Fireball"
                  >
                    <span>🔥</span> Flameskull Fireball
                  </button>
                )}

                {showShadow && (
                  <button
                    onClick={handleTriggerShadowStrengthDrain}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Shadow Strength Drain (1d4 STR Loss)"
                  >
                    <span>👻</span> Shadow STR Drain
                  </button>
                )}

                {showCockatrice && (
                  <button
                    onClick={handleTriggerCockatricePetrify}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-500 text-stone-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Cockatrice Petrifying Touch (DC 11 CON)"
                  >
                    <span>🐓</span> Cockatrice Petrify
                  </button>
                )}

                {showAboleth && (
                  <button
                    onClick={handleTriggerAbolethMucousCloud}
                    className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 rounded-lg transition font-bold flex items-center gap-1 shadow"
                    title="Trigger Aboleth Mucous Cloud (DC 14 CON)"
                  >
                    <span>🦠</span> Aboleth Mucous Cloud
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-stone-400 italic bg-stone-900/40 p-2.5 rounded-lg border border-stone-850">
                No monsters with special mechanic triggers in current encounter roster. Add monsters like <span className="text-amber-300 font-medium">Beholder, Mind Flayer, Cloaker, Shambling Mound, Gibbering Mouther, Flameskull, Shadow</span>, etc. to reveal quick action triggers.
              </div>
            )}
          </div>
        );
      })()}

      {/* Defeated Monster XP Banner Notification */}
      {xpAlert && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border border-amber-500/60 rounded-xl p-3 text-amber-200 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-stone-950 rounded-lg font-bold text-base shadow shrink-0">
              ⚡
            </div>
            <div>
              <div className="font-serif font-bold text-amber-100 text-sm flex items-center gap-2 flex-wrap">
                <span>Monster Defeated! {xpAlert.monsterName}</span>
                <span className="bg-amber-400 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  +{xpAlert.xpPerParticipant.toLocaleString()} XP per player
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-sans mt-0.5">
                Distributed <strong>{xpAlert.totalXp.toLocaleString()} total XP</strong> among <strong>{xpAlert.participantCount} active participant(s)</strong> ({xpAlert.participantNames}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setXpAlert(null)}
            className="p-1 hover:bg-amber-800/50 rounded-lg text-amber-400 hover:text-amber-100 transition text-xs font-bold shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Turn Navigation Bar */}
      {combatants.length > 0 && (
        <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevTurn}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-lg border border-stone-700 transition"
              title="Previous Turn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTurn}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg font-bold text-xs transition shadow"
              title="Next Turn"
            >
              <span>Next Turn</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetTracker}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-800 transition"
              title="Reset Round Counter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeCombatant && (
            <div className="text-xs text-stone-300 font-mono flex items-center gap-2">
              <span className="text-stone-400">Current Turn:</span>
              <strong className="text-amber-300 font-bold">{activeCombatant.name}</strong>
              <span className="text-stone-500">(Init {isNaN(activeCombatant.initiative) ? 0 : activeCombatant.initiative})</span>
            </div>
          )}
        </div>
      )}

      {/* Combatant List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {combatants.map((c, idx) => {
          const isActive = idx === activeTurnIndex;
          return (
            <div
              key={c.id}
              className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap ${
                isActive
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 shadow-lg'
                  : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3">
                {c.portraitUrl || c.type === 'enemy' ? (
                  <div className="relative shrink-0">
                    <img
                      src={c.portraitUrl || getMonsterPortraitUrl(c.name)}
                      alt={c.name}
                      className="w-10 h-10 rounded-xl object-cover border border-stone-700 shadow shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.onerror = null;
                        img.src = generateMonsterSvgPortrait(c?.name);
                      }}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] border shadow ${
                      c.type === 'player'
                        ? 'bg-amber-500 text-stone-950 border-amber-300'
                        : c.type === 'ally'
                        ? 'bg-emerald-600 text-stone-950 border-emerald-300'
                        : 'bg-rose-600 text-stone-950 border-rose-300'
                    }`}>
                      {isNaN(c.initiative) ? 0 : c.initiative}
                    </div>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                    c.type === 'player'
                      ? 'bg-amber-600 text-stone-950 border-amber-400'
                      : c.type === 'ally'
                      ? 'bg-emerald-700 text-emerald-100 border-emerald-500'
                      : 'bg-rose-900 text-rose-200 border-rose-600'
                  }`}>
                    {isNaN(c.initiative) ? 0 : c.initiative}
                  </div>
                )}

                <div>
                  <div className="font-serif font-bold text-stone-100 text-xs flex items-center gap-2">
                    <span>{c.name}</span>
                    {c.controlledBy && (
                      <span className="text-[10px] bg-purple-950/90 text-purple-200 border border-purple-600/70 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                        <span>🎮 Master:</span>
                        <strong className="text-purple-300">{c.controlledBy}</strong>
                      </span>
                    )}
                    {c.isPlayerChar && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        YOU
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded font-mono animate-pulse">
                        ACTIVE TURN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono flex items-center gap-3 mt-0.5 flex-wrap">
                    <span>AC: <strong className="text-stone-200">{c.armorClass}</strong></span>
                    <div className="flex items-center gap-1">
                      <span>HP: <strong className={c.hpCurrent === 0 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{c.hpCurrent}</strong> / </span>
                      {editingMaxHpId === c.id ? (
                        <input
                          type="number"
                          value={editingMaxHpValue}
                          onChange={(e) => setEditingMaxHpValue(e.target.value)}
                          onBlur={() => {
                            const val = parseInt(String(editingMaxHpValue), 10);
                            if (!isNaN(val) && val > 0) {
                              handleUpdateCombatantMaxHp(c.id, val);
                            }
                            setEditingMaxHpId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt(String(editingMaxHpValue), 10);
                              if (!isNaN(val) && val > 0) {
                                handleUpdateCombatantMaxHp(c.id, val);
                              }
                              setEditingMaxHpId(null);
                            } else if (e.key === 'Escape') {
                              setEditingMaxHpId(null);
                            }
                          }}
                          autoFocus
                          className="w-16 bg-stone-900 border border-amber-500 text-amber-200 font-mono text-xs rounded px-1 text-center font-bold focus:outline-none"
                          title="Enter new Max HP and press Enter"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMaxHpId(c.id);
                            setEditingMaxHpValue(c.hpMax);
                          }}
                          className="text-stone-200 font-bold hover:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer bg-stone-900/60 hover:bg-stone-800 px-1 py-0.5 rounded border border-stone-800 transition"
                          title="Click to edit Max HP for this combatant / player character"
                        >
                          <span>{c.hpMax}</span>
                          <Pencil className="w-2.5 h-2.5 text-amber-400 opacity-70 hover:opacity-100" />
                        </button>
                      )}
                    </div>
                    {c.type === 'enemy' && (
                      <span className="text-amber-400 font-bold">
                        XP: {(c.monsterXpReward ?? 450).toLocaleString()}
                      </span>
                    )}
                    
                    {/* Active Condition Badges */}
                    {(c.conditions || []).map(cond => (
                      <span
                        key={cond}
                        className="bg-amber-950/80 text-amber-300 border border-amber-600/40 text-[10px] px-1.5 py-0.2 rounded-md inline-flex items-center gap-1 font-bold"
                      >
                        <span>{cond}</span>
                        <button
                          onClick={() => handleToggleCombatantCondition(c.id, cond)}
                          className="hover:text-amber-100 font-bold"
                          title={`Remove ${cond}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* Quick Add Condition Dropdown */}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleToggleCombatantCondition(c.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="bg-stone-900 border border-stone-800 text-[10px] text-stone-400 font-sans rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
                      title="Add/Toggle Condition on Combatant"
                    >
                      <option value="">+ Condition</option>
                      {['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Surprised'].map(condName => (
                        <option key={condName} value={condName}>
                          {(c.conditions || []).includes(condName) ? `✓ ${condName}` : condName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right HP controls & Actions */}
              <div className="flex items-center gap-2">
                {isDmRole && (
                  <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg p-1 text-xs font-mono">
                    <button
                      onClick={() => handleAdjustHp(c.id, -5)}
                      className="px-1.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded font-bold"
                      title="-5 HP"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, -1)}
                      className="px-1.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded font-bold"
                      title="-1 HP"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, 1)}
                      className="px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded font-bold"
                      title="+1 HP"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, 5)}
                      className="px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded font-bold"
                      title="+5 HP"
                    >
                      +5
                    </button>
                  </div>
                )}

                {/* Clone Target Button */}
                <button
                  onClick={() => handleCloneCombatant(c)}
                  className="p-1.5 bg-stone-900 hover:bg-amber-950 border border-stone-700 hover:border-amber-600/50 text-stone-400 hover:text-amber-300 rounded-lg transition flex items-center gap-1 text-[11px]"
                  title="Clone / Duplicate this Target"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-sans">Clone</span>
                </button>

                {/* Allegiance / Control Switcher (Ally, Enemy, Player) */}
                <select
                  value={c.type}
                  onChange={(e) => handleToggleAllegiance(c.id, e.target.value as 'player' | 'ally' | 'enemy')}
                  className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none transition cursor-pointer ${
                    c.type === 'player'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                      : c.type === 'ally'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                      : 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                  }`}
                  title="Change Combat Allegiance (e.g. Animal Handling, Charm Person, or Dominate)"
                >
                  <option value="ally">🛡️ Ally</option>
                  <option value="enemy">⚔️ Enemy</option>
                  <option value="player">👑 Player</option>
                </select>

                {/* Revive as Undead Minion Button for 0 HP or Defeated combatants */}
                {(c.hpCurrent <= 0 || c.isDefeated) && (
                  <button
                    onClick={() => handleReviveAsUndeadAlly(c)}
                    className="p-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-200 rounded-lg transition flex items-center gap-1 text-[11px] font-bold shadow"
                    title="Animate / Revive Undead: Reanimate target as a loyal Undead Ally"
                  >
                    <span>🧟</span>
                    <span className="hidden sm:inline font-sans">Animate Undead</span>
                  </button>
                )}

                {c.type === 'enemy' && (
                  c.isDefeated ? (
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 px-2 py-1 rounded-lg font-mono font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> XP Awarded
                    </span>
                  ) : (
                    <button
                      onClick={() => awardDefeatedMonsterXp(c)}
                      className="p-1.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 text-amber-300 hover:text-amber-100 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold"
                      title={`Award ${(c.monsterXpReward ?? 450).toLocaleString()} XP to active participants`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline font-sans">Award XP</span>
                    </button>
                  )
                )}

                {!c.isPlayerChar && (
                  <button
                    onClick={() => handleTurnDestroyUndead(c)}
                    className="p-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-300 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold"
                    title="Channel Divinity: Turn / Destroy Undead on this Target"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="hidden sm:inline font-sans">Turn/Destroy</span>
                  </button>
                )}

                {!c.isPlayerChar && (
                  <button
                    onClick={() => handleRemoveCombatant(c.id)}
                    className="p-1.5 text-stone-500 hover:text-rose-400 transition"
                    title="Remove Combatant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Attack Resolver Section */}
      <AttackResolver
        key={activeAttackerCharacter.id + '-' + (activeCombatant?.id || '')}
        character={activeAttackerCharacter}
        allCharacters={allCharacters}
        combatants={combatants}
        activeCombatantId={activeCombatant?.id}
        encounterEnvironment={encounterEnvironment}
        onRoll={onRoll}
        onApplyDamageToCombatant={(combatantId, dmg) => handleAdjustHp(combatantId, -dmg)}
        onLogAction={(cat, msg, act) => addLogEntry(cat, msg, act)}
      />

      {/* COMBAT LOG MODAL POPUP */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-serif font-bold text-stone-100">Encounter Combat Log</h2>
                <span className="bg-amber-950 text-amber-300 border border-amber-600/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {combatLogs.length} Events
                </span>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="py-3 space-y-2 border-b border-stone-800">
              <div className="flex items-center gap-2 flex-wrap justify-between">
                {/* Category Pills */}
                <div className="flex items-center gap-1 flex-wrap text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'attack', label: 'Attacks' },
                    { id: 'damage', label: 'Damage' },
                    { id: 'heal', label: 'Healing' },
                    { id: 'turn', label: 'Turns' },
                    { id: 'condition', label: 'Conditions' },
                    { id: 'ability', label: 'Abilities' },
                    { id: 'note', label: 'Notes' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setLogFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                        logFilterCategory === cat.id
                          ? 'bg-amber-600 text-stone-950 shadow'
                          : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search log..."
                    value={logSearchText}
                    onChange={(e) => setLogSearchText(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Add Manual Note Form */}
              <form onSubmit={handleAddCustomNote} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={isDmRole ? "Add custom note as DM..." : `Add custom note as ${character.name}...`}
                  value={customNoteInput}
                  onChange={(e) => setCustomNoteInput(e.target.value)}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Note</span>
                </button>
              </form>
            </div>

            {/* Log Stream Timeline */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 font-sans">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs italic">
                  No combat log entries found matching filters.
                </div>
              ) : (
                filteredLogs.map(log => {
                  let badgeColor = 'bg-stone-800 text-stone-300 border-stone-700';
                  if (log.category === 'attack') badgeColor = 'bg-purple-950 text-purple-300 border-purple-700/50';
                  if (log.category === 'damage') badgeColor = 'bg-rose-950 text-rose-300 border-rose-700/50';
                  if (log.category === 'heal') badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700/50';
                  if (log.category === 'condition') badgeColor = 'bg-amber-950 text-amber-300 border-amber-700/50';
                  if (log.category === 'ability') badgeColor = 'bg-amber-900 text-amber-100 border-amber-500/50';
                  if (log.category === 'note') badgeColor = 'bg-blue-950 text-blue-300 border-blue-700/50';

                  return (
                    <div
                      key={log.id}
                      className="bg-stone-950 border border-stone-800/80 rounded-xl p-2.5 text-xs text-stone-300 flex items-start gap-2.5 hover:border-stone-700 transition"
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                        <span className="bg-stone-900 text-amber-400 border border-stone-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          R{log.round}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono">{log.timestamp}</span>
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-bold ${badgeColor}`}>
                            {log.category}
                          </span>
                          {log.actor && (
                            <span className={`font-serif font-bold ${
                              log.actor === 'DM'
                                ? 'text-purple-300 bg-purple-950/80 border border-purple-600/50 px-1.5 py-0.2 rounded text-[11px] font-mono'
                                : 'text-stone-200'
                            }`}>
                              {log.actor}
                            </span>
                          )}
                        </div>
                        <p className="text-stone-300 leading-relaxed font-sans">{log.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogSummary}
                  className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 px-3 py-1.5 rounded-xl font-bold text-xs transition"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLog ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={() => setCombatLogs([])}
                  className="text-stone-500 hover:text-rose-400 text-xs px-2 py-1.5 transition"
                  title="Clear combat log history"
                >
                  Clear Log
                </button>
              </div>

              <button
                onClick={() => setShowLogModal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-1.5 rounded-xl shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add Combatant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-serif font-bold text-stone-100">Add Target / Monster to Encounter</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-100">
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Add Adventuring Party */}
              {parties && parties.length > 0 && (
                <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-xl space-y-2">
                  <div className="text-amber-300 font-bold text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Add Adventuring Party (Allies)</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300">Group Encounter</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedPartyIdToAdd}
                      onChange={(e) => setSelectedPartyIdToAdd(e.target.value)}
                      className="flex-1 bg-stone-950 border border-purple-600/50 rounded-xl p-2 text-stone-100 font-semibold focus:outline-none focus:border-purple-400"
                    >
                      <option value="">-- Select Party to Add --</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.characterIds.length} members)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAddPartyToEncounter()}
                      disabled={!selectedPartyIdToAdd}
                      className="px-3 py-2 bg-gradient-to-r from-purple-700 to-amber-700 hover:from-purple-600 hover:to-amber-600 text-white rounded-xl font-extrabold text-xs shadow transition disabled:opacity-50 shrink-0"
                    >
                      + Add Party
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Pick Dropdown from Characters / Monsters */}
              {filteredCharacters.length > 0 && (
                <div>
                  <label className="block text-amber-300 mb-1 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select from {activeEdition} Characters / Monsters</span>
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono">[{activeEdition} Active TRPG]</span>
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full bg-stone-950 border border-amber-600/40 rounded-xl p-2.5 text-stone-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Custom Manual Entry --</option>
                    {filteredCharacters.map(char => (
                      <option key={char.id} value={char.id}>
                        {char.name} ({char.isMonster ? `Monster - CR ${char.monsterXpReward ? `${char.monsterXpReward} XP` : 'Custom'}` : `Level ${char.level} ${char.characterClass}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1 font-bold">Target Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goblin Warchief"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1 font-bold">Initiative</label>
                  <input
                    type="number"
                    value={newInit}
                    onChange={(e) => setNewInit(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-bold">Armor Class</label>
                  <input
                    type="number"
                    value={newAc}
                    onChange={(e) => setNewAc(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-bold">Max HP</label>
                  <input
                    type="number"
                    value={newHp}
                    onChange={(e) => setNewHp(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-bold">Combatant Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('enemy')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      newType === 'enemy'
                        ? 'bg-rose-900/80 text-rose-200 border-rose-500 shadow'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    Enemy / Monster
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('ally')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      newType === 'ally'
                        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500 shadow'
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    Ally / NPC
                  </button>
                </div>
              </div>

              {newType === 'enemy' && (
                <div>
                  <label className="block text-amber-300 mb-1 font-bold">Monster XP Reward</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={newMonsterXpReward}
                    onChange={(e) => setNewMonsterXpReward(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
                  />
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Automatically split among active participants ({combatants.filter(c => c.type === 'player' || c.type === 'ally').length || 1}) when slain.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1 font-bold">Portrait Artwork URL (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newPortraitUrl}
                    onChange={(e) => setNewPortraitUrl(e.target.value)}
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-sans text-xs"
                  />
                  {(newPortraitUrl || (newName && newType === 'enemy')) && (
                    <img
                      src={newPortraitUrl || getMonsterPortraitUrl(newName)}
                      alt="Portrait preview"
                      className="w-9 h-9 rounded-xl object-cover border border-amber-500/50 shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.onerror = null;
                        img.src = generateMonsterSvgPortrait(newName || 'Monster');
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCombatant}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-2 rounded-xl shadow"
              >
                Add to Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
