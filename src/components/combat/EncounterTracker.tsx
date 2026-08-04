import React, { useState } from 'react';
import { CharacterData, Party } from '../../types';
import { getAbilityModifier, formatModifier, isCharacterDead } from '../../utils/dndCalculations';
import { Crosshair, Swords, Plus, Trash2, ChevronRight, ChevronLeft, Dices, RefreshCw, Copy, UserCheck, Zap, ScrollText, Search, FileText, Check, Clock, MessageSquarePlus, Download, X, Users, Shield } from 'lucide-react';
import { AttackResolver } from './AttackResolver';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';

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
  onOpenPartyManager?: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
}

export const EncounterTracker: React.FC<EncounterTrackerProps> = ({
  character,
  allCharacters = [],
  parties = [],
  onOpenPartyManager,
  onRoll,
  onUpdateCharacter
}) => {
  const [combatants, setCombatants] = useState<Combatant[]>([
    {
      id: 'player-' + character.id,
      name: character.name,
      initiative: 0,
      armorClass: character.armorClass || 10,
      hpCurrent: character.hpCurrent || 10,
      hpMax: character.hpMax || 10,
      type: 'player',
      isPlayerChar: true,
      conditions: character.conditions || [],
      portraitUrl: character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined)
    }
  ]);

  // Keep player combatant HP, AC, conditions and Name synced with global character data
  React.useEffect(() => {
    setCombatants(prev =>
      prev.map(c => {
        if (c.isPlayerChar) {
          return {
            ...c,
            name: character.name,
            hpCurrent: character.hpCurrent,
            hpMax: character.hpMax,
            armorClass: character.armorClass,
            conditions: character.conditions || [],
            portraitUrl: character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined)
          };
        }
        return c;
      })
    );
  }, [character.hpCurrent, character.hpMax, character.armorClass, character.name, character.conditions, character.portraitUrl, character.isMonster]);

  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Combat Log State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logFilterCategory, setLogFilterCategory] = useState<string>('all');
  const [logSearchText, setLogSearchText] = useState('');
  const [customNoteInput, setCustomNoteInput] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);

  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round: 1,
      category: 'turn',
      message: `Encounter tracker initialized for ${character.name}.`
    }
  ]);

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
        const currentXp = character.experiencePoints || 0;
        onUpdateCharacter({
          ...character,
          experiencePoints: currentXp + xpPerParticipant
        });
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
            hpMax: character.hpMax,
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

      newCombatants.push({
        id: isPlayerChar ? 'player-' + member.id : 'party-' + member.id + '-' + Date.now(),
        name: member.name,
        initiative: rolledInit,
        armorClass: member.armorClass || 10,
        hpCurrent: member.hpCurrent || member.hpMax || 10,
        hpMax: member.hpMax || 10,
        type: isPlayerChar ? 'player' : 'ally',
        isPlayerChar,
        partyId: partyToUse.id,
        isPartyMember: true,
        conditions: member.conditions || [],
        portraitUrl: portrait
      });

      addedLogDetails.push(`${member.name} (${isPlayerChar ? 'YOU' : 'Ally'}) - Init: ${rolledInit}, AC: ${member.armorClass || 10}, HP: ${member.hpCurrent || member.hpMax || 10}`);
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
    const profBonus = character.proficiencyBonus ?? (Math.floor((character.level - 1) / 4) + 2);
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

    const nextHp = Math.max(0, Math.min(target.hpMax, target.hpCurrent + delta));

    setCombatants(prev =>
      prev.map(c => (c.id === id ? { ...c, hpCurrent: nextHp } : c))
    );

    if (delta < 0) {
      addLogEntry('damage', `${target.name} took ${Math.abs(delta)} damage (${nextHp}/${target.hpMax} HP)`, target.name);
    } else if (delta > 0) {
      addLogEntry('heal', `${target.name} healed for ${delta} HP (${nextHp}/${target.hpMax} HP)`, target.name);
    }

    // Auto-distribute XP if enemy monster is defeated (HP drops to 0)
    if (target.type === 'enemy' && target.hpCurrent > 0 && nextHp === 0 && !target.isDefeated) {
      awardDefeatedMonsterXp(target);
    }

    if (target.isPlayerChar && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        hpCurrent: nextHp
      });
    }
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

  // Add custom user note to log
  const handleAddCustomNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNoteInput.trim()) return;
    addLogEntry('note', customNoteInput.trim(), character.name);
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

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold text-stone-100 text-sm">Initiative & Encounter Tracker</h3>
          <span className="bg-amber-950 text-amber-300 border border-amber-600/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
            Round {roundNumber}
          </span>
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
        </div>
      </div>

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
                        (e.target as HTMLElement).style.display = 'none';
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
                    <span>HP: <strong className={c.hpCurrent === 0 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{c.hpCurrent}/{c.hpMax}</strong></span>
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
                      {['Poisoned', 'Prone', 'Restrained', 'Blinded', 'Frightened', 'Invisible', 'Stunned', 'Paralyzed', 'Unconscious'].map(condName => (
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

                {/* Clone Target Button */}
                <button
                  onClick={() => handleCloneCombatant(c)}
                  className="p-1.5 bg-stone-900 hover:bg-amber-950 border border-stone-700 hover:border-amber-600/50 text-stone-400 hover:text-amber-300 rounded-lg transition flex items-center gap-1 text-[11px]"
                  title="Clone / Duplicate this Target"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-sans">Clone</span>
                </button>

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
        combatants={combatants}
        activeCombatantId={activeCombatant?.id}
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
                  placeholder="Add custom DM or player note to log..."
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
                            <span className="font-serif font-bold text-stone-200">
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
                        (e.target as HTMLElement).style.display = 'none';
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
