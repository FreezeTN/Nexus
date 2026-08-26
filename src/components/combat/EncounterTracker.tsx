import React, { useState } from 'react';
import { CharacterData, Party, EncounterEnvironment } from '../../types';
import { UserProfile } from '../../lib/firebase';
import { getAbilityModifier, formatModifier, isCharacterDead, getEffectiveMaxHp } from '../../utils/dndCalculations';
import { getLevelFromTotalXp } from '../../data/levelProgressionData';
import {
  Crosshair,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Dices,
  RefreshCw,
  ScrollText,
  Users,
  Compass,
  X,
  Mic,
  Volume2,
  Shield,
  Swords,
  Skull,
  Heart,
  ArrowRightLeft,
  LayoutGrid,
  ListFilter,
  UserPlus,
  Sparkles,
  Flame
} from 'lucide-react';
import { AttackResolver } from './AttackResolver';
import { voiceManager, VoicePeerState } from '../../lib/voiceChatService';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../data/monsterPortraits';
import { ENVIRONMENT_CONFIGS } from '../../utils/environmentRules';
import { playInitiativeTurnSound, playDamageAppliedSound, playHealSound, playDeathSound } from '../../utils/diceAudio';

import { Combatant, CombatLogEntry, EncounterTrackerProps, SavedEncounterData } from './encounter/encounterTypes';
import { EncounterLogModal } from './encounter/EncounterLogModal';
import { AddCombatantModal } from './encounter/AddCombatantModal';
import { MonsterMechanicsBar } from './encounter/MonsterMechanicsBar';
import { eventBus } from '../../events/eventBus';

export type { Combatant, CombatLogEntry, EncounterTrackerProps, SavedEncounterData };

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
  const [combatants, setCombatants] = useState<Combatant[]>(() => loadSavedEncounter(character).combatants);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(() => loadSavedEncounter(character).activeTurnIndex);
  const [roundNumber, setRoundNumber] = useState<number>(() => loadSavedEncounter(character).roundNumber);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>(() => loadSavedEncounter(character).combatLogs);
  const [encounterEnvironment, setEncounterEnvironment] = useState<EncounterEnvironment>(() => loadSavedEncounter(character).encounterEnvironment || 'terrestrial');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Reload saved encounter if active character ID changes
  React.useEffect(() => {
    const saved = loadSavedEncounter(character);
    setCombatants(saved.combatants);
    setActiveTurnIndex(saved.activeTurnIndex);
    setRoundNumber(saved.roundNumber);
    setCombatLogs(saved.combatLogs);
    setEncounterEnvironment(saved.encounterEnvironment || 'terrestrial');
  }, [character.id]);

  // Save encounter state to localStorage
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

  // Keep player combatant synced with character
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
  const [addModalInitialType, setAddModalInitialType] = useState<'ally' | 'enemy'>('enemy');
  const [viewMode, setViewMode] = useState<'teams' | 'timeline'>('teams');
  const [editingMaxHpId, setEditingMaxHpId] = useState<string | null>(null);
  const [editingMaxHpValue, setEditingMaxHpValue] = useState<number | string>('');

  const [showLogModal, setShowLogModal] = useState(false);
  const [activeSpeakerNames, setActiveSpeakerNames] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const unsub = voiceManager.onPeersChange((peers) => {
      const speakingNames = new Set<string>();
      peers.forEach((p) => {
        if (p.isSpeaking) {
          if (p.characterName) speakingNames.add(p.characterName.toLowerCase().trim());
          if (p.displayName) speakingNames.add(p.displayName.toLowerCase().trim());
        }
      });
      setActiveSpeakerNames(speakingNames);
    });
    return unsub;
  }, []);

  const [xpAlert, setXpAlert] = useState<{
    monsterName: string;
    totalXp: number;
    xpPerParticipant: number;
    participantCount: number;
    participantNames: string;
  } | null>(null);

  const activeCombatant = combatants[activeTurnIndex];

  // Allies (Team 1) and Enemies (Team 2) from active character's perspective
  const allies = React.useMemo(() => {
    return combatants.filter(c => c.isPlayerChar || c.type === 'player' || c.type === 'ally');
  }, [combatants]);

  const enemies = React.useMemo(() => {
    return combatants.filter(c => !c.isPlayerChar && c.type === 'enemy');
  }, [combatants]);

  const isAllyTurn = activeCombatant ? (activeCombatant.isPlayerChar || activeCombatant.type === 'player' || activeCombatant.type === 'ally') : false;
  const isEnemyTurn = activeCombatant ? (!activeCombatant.isPlayerChar && activeCombatant.type === 'enemy') : false;

  const alliesTotalHp = allies.reduce((sum, c) => sum + (c.hpMax || 1), 0);
  const alliesCurrentHp = allies.reduce((sum, c) => sum + Math.max(0, c.hpCurrent || 0), 0);
  const alliesAliveCount = allies.filter(c => c.hpCurrent > 0).length;

  const enemiesTotalHp = enemies.reduce((sum, c) => sum + (c.hpMax || 1), 0);
  const enemiesCurrentHp = enemies.reduce((sum, c) => sum + Math.max(0, c.hpCurrent || 0), 0);
  const enemiesAliveCount = enemies.filter(c => c.hpCurrent > 0 && !c.isDefeated).length;
  const enemiesTotalXp = enemies.reduce((sum, c) => sum + (c.monsterXpReward || 0), 0);

  const handleOpenAddModal = (type: 'ally' | 'enemy' = 'enemy') => {
    setAddModalInitialType(type);
    setShowAddModal(true);
  };

  const handleToggleCombatantType = (id: string) => {
    setCombatants(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextType: 'ally' | 'enemy' = c.type === 'enemy' ? 'ally' : 'enemy';
          addLogEntry('turn', `Switched allegiance for ${c.name} to ${nextType === 'enemy' ? 'Enemy (Team 2)' : 'Ally (Team 1)'}`, c.name);
          return { ...c, type: nextType };
        }
        return c;
      })
    );
  };

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

    if (found) return found;

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

  const awardDefeatedMonsterXp = (target: Combatant) => {
    if (target.type !== 'enemy' || target.isDefeated) return;

    const totalXp = target.monsterXpReward !== undefined ? target.monsterXpReward : 450;
    if (totalXp <= 0) return;

    const activeParticipants = combatants.filter(c => c.type === 'player' || c.type === 'ally');
    const participantCount = Math.max(1, activeParticipants.length);
    const xpPerParticipant = Math.floor(totalXp / participantCount);

    setCombatants(prev =>
      prev.map(c => c.id === target.id ? { ...c, isDefeated: true } : c)
    );

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

  const dexScore = character.abilities?.DEX?.score ?? 10;
  const dexMod = getAbilityModifier(dexScore);
  const hasAlertFeat = (character.feats || []).some(f => f.name.toLowerCase().includes('alert')) ||
                       (character.classFeatures || []).some(f => f.name.toLowerCase().includes('alert'));
  const featInitBonus = hasAlertFeat ? 5 : 0;
  const rawInitBonus = typeof character.initiativeBonus === 'number' && !isNaN(character.initiativeBonus) ? character.initiativeBonus : 0;
  const initBonus = rawInitBonus + (isNaN(dexMod) ? 0 : dexMod) + featInitBonus;

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
      return [...updated].sort((a, b) => b.initiative - a.initiative);
    });
  };

  const handleAddPartyToEncounter = (partyObj: Party) => {
    const allMembers = (allCharacters || []).filter(c => partyObj.characterIds.includes(c.id));
    if (allMembers.length === 0) {
      alert(`Party "${partyObj.name}" has no members! Add characters to the party first.`);
      return;
    }

    const deadMembers = allMembers.filter(m => !m.isMonster && isCharacterDead(m));
    const members = allMembers.filter(m => m.isMonster || !isCharacterDead(m));

    if (deadMembers.length > 0) {
      alert(`The following dead character(s) were excluded from combat: ${deadMembers.map(m => m.name).join(', ')}. Revive them before adding them to combat!`);
    }

    if (members.length === 0) return;

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
        partyId: partyObj.id,
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
      `🛡️ Party "${partyObj.name}" (${members.length} members) joined the encounter as Allies!\n${addedLogDetails.join('\n')}`,
      'Party'
    );

    eventBus.emit('CombatStarted', {
      encounterName: `Tactical Combat - ${partyObj.name}`,
      participantsCount: members.length
    });

    setShowAddModal(false);
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    playInitiativeTurnSound();
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
      if (nextHp === 0) playDeathSound();
      else playDamageAppliedSound();

      if (wasAtZero) {
        addLogEntry('damage', `💀 ${target.name} took damage at 0 HP! Automatic Death Save Failure added.`, target.name);
      } else {
        addLogEntry('damage', `${target.name} took ${Math.abs(delta)} damage (${nextHp}/${target.hpMax} HP)`, target.name);
      }
    } else if (delta > 0) {
      playHealSound();
      addLogEntry('heal', `${target.name} healed for ${delta} HP (${nextHp}/${target.hpMax} HP)`, target.name);
    }

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
            }
          }
          return { ...c, hpMax: validMaxHp, hpCurrent: updatedHpCurrent };
        }
        return c;
      })
    );

    addLogEntry('turn', `Updated ${target.name}'s Max HP to ${validMaxHp} HP`, target.name);
  };

  const handleRemoveCombatant = (id: string) => {
    const target = combatants.find(c => c.id === id);
    if (target) {
      addLogEntry('turn', `Removed ${target.name} from combat`, target.name);
    }
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const handleClearEncounter = () => {
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
    setCombatLogs([
      {
        id: 'log-init-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: 1,
        category: 'turn',
        message: `Encounter reset. All added targets cleared.`
      }
    ]);
    setShowEndConfirm(false);
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

          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('teams')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                viewMode === 'teams'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Team 1 (Allies) vs Team 2 (Enemies) Layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Teams (VS)</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                viewMode === 'timeline'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Unified Turn Timeline"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            onClick={handleRollPlayerInitiative}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow"
            title="Roll Initiative d20 + DEX Mod"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Roll Init ({formatModifier(initBonus)})</span>
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

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenAddModal('ally')}
              className="flex items-center gap-1 text-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-2.5 py-1.5 rounded-xl font-bold transition shadow"
              title="Add Ally / Companion to Team 1"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Ally</span>
            </button>

            <button
              onClick={() => handleOpenAddModal('enemy')}
              className="flex items-center gap-1 text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 px-2.5 py-1.5 rounded-xl font-bold transition shadow"
              title="Add Enemy / Monster to Team 2"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Enemy</span>
            </button>
          </div>

          {showEndConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-800 p-1 rounded-xl animate-fadeIn">
              <span className="text-[11px] text-rose-200 font-bold px-1.5">End encounter?</span>
              <button
                onClick={handleClearEncounter}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded-lg font-bold transition shadow"
              >
                Yes, End
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-2 py-1 rounded-lg font-bold transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-1 text-xs bg-stone-950 hover:bg-rose-950/70 text-stone-400 hover:text-rose-300 border border-stone-800 px-2.5 py-1.5 rounded-xl font-bold transition"
              title="End encounter & reset combatants"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </div>

      {/* Environment Rule Banner */}
      {encounterEnvironment !== 'terrestrial' && (
        <div className={`${currentEnvConfig.badgeBg} border ${currentEnvConfig.badgeBorder} rounded-xl p-3 shadow-xl space-y-2 animate-fadeIn`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">{currentEnvConfig.icon}</span>
              <div>
                <div className="font-serif font-bold text-sm flex items-center gap-2 flex-wrap text-amber-100">
                  <span>{currentEnvConfig.name}</span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5">{currentEnvConfig.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monster Mechanics Actions Bar */}
      <MonsterMechanicsBar
        combatants={combatants}
        onTriggerBeholderEyeRay={() => addLogEntry('ability', '👁️ BEHOLDER EYE RAY triggered', 'Beholder')}
        onTriggerMedusaGaze={() => addLogEntry('ability', '🗿 MEDUSA GAZE triggered (DC 14 CON)', 'Medusa')}
        onTriggerRemorhazHeatedBody={() => addLogEntry('ability', '🔥 REMORHAZ HEATED BODY triggered (3d6 Fire)', 'Remorhaz')}
        onTriggerRemorhazSwallow={() => addLogEntry('ability', '🕳️ REMORHAZ SWALLOW triggered (6d6 Acid)', 'Remorhaz')}
        onTriggerRoperReel={() => addLogEntry('ability', '🪢 ROPER REEL & BITE triggered', 'Roper')}
        onTriggerIronGolemPoisonBreath={() => addLogEntry('ability', '🧪 IRON GOLEM POISON BREATH triggered (10d8 Poison, DC 19)', 'Iron Golem')}
        onTriggerIronGolemFireAbsorption={() => addLogEntry('ability', '🔥 IRON GOLEM FIRE ABSORPTION triggered', 'Iron Golem')}
        onTriggerRustTouch={() => addLogEntry('ability', '⚙️ RUST TOUCH triggered (-1 AC Penalty)', 'Rust Monster')}
        onTriggerMindBlast={() => addLogEntry('ability', '🧠 MIND BLAST triggered (4d8+4 Psychic, DC 15 INT)', 'Mind Flayer')}
        onTriggerVampiricBite={() => addLogEntry('ability', '🩸 VAMPIRIC BITE triggered', 'Vampire')}
        onTriggerGibberingMouther={() => addLogEntry('ability', '🗣️ GIBBERING AURA triggered', 'Gibbering Mouther')}
        onTriggerCloakerTransfer={() => addLogEntry('ability', '🧥 CLOAKER DAMAGE TRANSFER triggered', 'Cloaker')}
        onTriggerShamblingMoundEngulf={() => addLogEntry('ability', '🌿 SHAMBLING ENGULF triggered', 'Shambling Mound')}
        onTriggerShamblingMoundLightning={() => addLogEntry('ability', '⚡ SHAMBLING LIGHTNING HEAL triggered', 'Shambling Mound')}
        onTriggerPhaseSpiderJaunt={() => addLogEntry('ability', '🌌 PHASE SPIDER JAUNT triggered', 'Phase Spider')}
        onTriggerGhostEtherealness={() => addLogEntry('ability', '🌌 GHOST ETHEREALNESS triggered', 'Ghost')}
        onTriggerGhostPossession={() => addLogEntry('ability', '👻 GHOST POSSESSION triggered (DC 13 CHA)', 'Ghost')}
        onTriggerNightmareStride={() => addLogEntry('ability', '🌌 NIGHTMARE STRIDE triggered', 'Nightmare')}
        onTriggerSuccubusEtherealness={() => addLogEntry('ability', '🌌 SUCCUBUS ETHEREALNESS triggered', 'Succubus')}
        onTriggerNightHagEtherealness={() => addLogEntry('ability', '🌌 NIGHT HAG ETHEREALNESS triggered', 'Night Hag')}
        onTriggerNightHagNightmareHaunting={() => addLogEntry('ability', '💤 NIGHTMARE HAUNTING triggered', 'Night Hag')}
        onTriggerEtherealFilcherJaunt={() => addLogEntry('ability', '🌌 FILCHER SNATCH triggered', 'Ethereal Filcher')}
        onTriggerBlinkDogTeleport={() => addLogEntry('ability', '✨ BLINK DOG TELEPORT triggered', 'Blink Dog')}
        onTriggerFlameskullFireball={() => addLogEntry('ability', '🔥 FLAMESKULL FIREBALL triggered (8d6 Fire, DC 13)', 'Flameskull')}
        onTriggerShadowStrengthDrain={() => addLogEntry('ability', '👻 SHADOW STRENGTH DRAIN triggered (1d4 STR Loss)', 'Shadow')}
        onTriggerCockatricePetrify={() => addLogEntry('ability', '🐓 COCKATRICE PETRIFYING TOUCH triggered (DC 11 CON)', 'Cockatrice')}
        onTriggerAbolethMucousCloud={() => addLogEntry('ability', '🦠 ABOLETH MUCOUS CLOUD triggered (DC 14 CON)', 'Aboleth')}
      />

      {/* Defeated Monster XP Banner */}
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

      {/* Turn Navigation & Battle Stage Bar */}
      {combatants.length > 0 && (
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between flex-wrap gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevTurn}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-lg border border-stone-700 transition shadow"
              title="Previous Turn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTurn}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg font-bold text-xs transition shadow-md"
              title="Advance to Next Turn"
            >
              <span>Next Turn</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRoundNumber(1);
                setActiveTurnIndex(0);
                addLogEntry('turn', 'Round counter reset to Round 1');
              }}
              className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-800 transition"
              title="Reset Round Counter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeCombatant && (
            <div className="flex items-center gap-2.5 bg-stone-900/90 border border-stone-700/80 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-stone-400">Current Turn:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 ${
                isAllyTurn
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/50'
              }`}>
                {isAllyTurn ? <Shield className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                <span>{isAllyTurn ? 'Team 1 (Ally)' : 'Team 2 (Enemy)'}</span>
              </span>
              <strong className="text-amber-300 font-bold text-sm">{activeCombatant.name}</strong>
              <span className="text-stone-500 font-bold">(Init {isNaN(activeCombatant.initiative) ? 0 : activeCombatant.initiative})</span>
            </div>
          )}
        </div>
      )}

      {/* Attack Resolver Component */}
      <AttackResolver
        character={activeAttackerCharacter}
        combatants={combatants}
        activeCombatantId={activeCombatant?.id}
        onApplyDamageToCombatant={(targetId, damageAmount) => {
          handleAdjustHp(targetId, -damageAmount);
        }}
        onRoll={onRoll}
        onLogAction={(category, message, actor) => addLogEntry(category, message, actor)}
      />

      {/* Combatant Roster: Team 1 (Allies) vs Team 2 (Enemies) Layout */}
      {viewMode === 'teams' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* ================= TEAM 1: ALLIES & PARTY (LEFT) ================= */}
          <div className="bg-stone-950/80 border border-emerald-900/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
            {/* Team 1 Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-stone-100 text-sm flex items-center gap-2">
                    <span>Team 1: Allies & Party</span>
                    {isAllyTurn && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-mono font-bold animate-pulse">
                        Active Turn
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {alliesAliveCount}/{allies.length} Standing • Total HP: {alliesCurrentHp}/{alliesTotalHp}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddModal('ally')}
                className="flex items-center gap-1 text-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-xl font-bold transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ally</span>
              </button>
            </div>

            {/* Allies Cards List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {allies.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-stone-800 rounded-xl text-stone-500 space-y-2">
                  <Shield className="w-8 h-8 mx-auto text-stone-600 opacity-60" />
                  <p className="text-xs">No allies in this encounter yet.</p>
                  <button
                    onClick={() => handleOpenAddModal('ally')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline"
                  >
                    + Add Ally or Party Member
                  </button>
                </div>
              ) : (
                allies.map((c) => {
                  const isActive = combatants[activeTurnIndex]?.id === c.id;
                  const isSpeaking = activeSpeakerNames.has(c.name.toLowerCase().trim());
                  const globalRank = combatants.findIndex(item => item.id === c.id) + 1;
                  const hpPercent = Math.max(0, Math.min(100, Math.round((c.hpCurrent / Math.max(1, c.hpMax)) * 100)));

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border transition space-y-2 ${
                        isSpeaking
                          ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
                          : isActive
                          ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 shadow-lg'
                          : c.hpCurrent === 0
                          ? 'bg-stone-950/60 border-rose-900/60 opacity-80'
                          : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-emerald-700/50'
                      }`}
                    >
                      {/* Top Row: Avatar, Info, Badges */}
                      <div className="flex items-center justify-between gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={c.portraitUrl || (c.type === 'enemy' ? getMonsterPortraitUrl(c.name) : '/default-avatar.png')}
                              alt={c.name}
                              className={`w-10 h-10 rounded-xl object-cover border shadow shrink-0 ${
                                isSpeaking
                                  ? 'border-emerald-400 ring-2 ring-emerald-400/60 animate-pulse'
                                  : isActive
                                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                                  : 'border-emerald-600/40'
                              }`}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.onerror = null;
                                img.src = generateMonsterSvgPortrait(c?.name);
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-4 rounded bg-emerald-600 text-stone-950 font-mono font-bold text-[9px] border border-emerald-300 shadow flex items-center justify-center" title={`Initiative Roll: ${c.initiative}`}>
                              {isNaN(c.initiative) ? 0 : c.initiative}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="font-serif font-bold text-stone-100 text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="truncate max-w-[150px]">{c.name}</span>
                              <span className="text-[10px] text-stone-400 font-mono" title="Global Turn Order">
                                #{globalRank}
                              </span>
                              {c.isPlayerChar && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                                  YOU
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded font-mono animate-pulse">
                                  ACTIVE TURN
                                </span>
                              )}
                              {isSpeaking && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                                  <Mic className="w-2.5 h-2.5 text-emerald-400" /> SPEAKING
                                </span>
                              )}
                              {c.hpCurrent === 0 && (
                                <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-600 px-1.5 py-0.2 rounded font-mono font-bold">
                                  UNCONSCIOUS
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>AC: <strong className="text-stone-200">{c.armorClass}</strong></span>
                              <span>HP: <strong className={c.hpCurrent === 0 ? 'text-rose-500 font-bold' : c.hpCurrent <= (c.hpMax / 4) ? 'text-rose-400' : 'text-emerald-400'}>{c.hpCurrent}</strong> / {c.hpMax}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions (HP controls, Allegiance switch, remove) */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 bg-stone-950 border border-stone-800 p-0.5 rounded-lg">
                            <button
                              onClick={() => handleAdjustHp(c.id, -5)}
                              className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded font-mono font-bold text-[11px]"
                              title="-5 HP"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, -1)}
                              className="px-1.5 py-0.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 rounded font-mono font-bold text-[11px]"
                              title="-1 HP"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, 1)}
                              className="px-1.5 py-0.5 bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 rounded font-mono font-bold text-[11px]"
                              title="+1 HP"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, 5)}
                              className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded font-mono font-bold text-[11px]"
                              title="+5 HP"
                            >
                              +5
                            </button>
                          </div>

                          {!c.isPlayerChar && (
                            <button
                              onClick={() => handleToggleCombatantType(c.id)}
                              className="p-1 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-rose-400 border border-stone-800 rounded-lg transition"
                              title="Switch to Team 2 (Enemy)"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!c.isPlayerChar && (
                            <button
                              onClick={() => handleRemoveCombatant(c.id)}
                              className="p-1 text-stone-500 hover:text-rose-400 transition"
                              title="Remove from encounter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Health Progress Bar */}
                      <div className="w-full bg-stone-950 rounded-full h-1.5 border border-stone-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= TEAM 2: ENEMIES & HOSTILES (RIGHT) ================= */}
          <div className="bg-stone-950/80 border border-rose-900/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
            {/* Team 2 Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-600/50 flex items-center justify-center text-rose-400 shadow-sm">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-stone-100 text-sm flex items-center gap-2">
                    <span>Team 2: Enemies & Hostiles</span>
                    {isEnemyTurn && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded-full font-mono font-bold animate-pulse">
                        Active Turn
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {enemiesAliveCount}/{enemies.length} Alive • Pool: <strong className="text-amber-300">+{enemiesTotalXp.toLocaleString()} XP</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddModal('enemy')}
                className="flex items-center gap-1 text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 px-2.5 py-1 rounded-xl font-bold transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Enemy</span>
              </button>
            </div>

            {/* Enemies Cards List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {enemies.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-stone-800 rounded-xl text-stone-500 space-y-2">
                  <Swords className="w-8 h-8 mx-auto text-stone-600 opacity-60" />
                  <p className="text-xs">No enemies or monsters in this encounter.</p>
                  <button
                    onClick={() => handleOpenAddModal('enemy')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold underline"
                  >
                    + Add Enemy / Monster Target
                  </button>
                </div>
              ) : (
                enemies.map((c) => {
                  const isActive = combatants[activeTurnIndex]?.id === c.id;
                  const isSpeaking = activeSpeakerNames.has(c.name.toLowerCase().trim());
                  const globalRank = combatants.findIndex(item => item.id === c.id) + 1;
                  const isDefeated = c.isDefeated || c.hpCurrent === 0;
                  const hpPercent = Math.max(0, Math.min(100, Math.round((c.hpCurrent / Math.max(1, c.hpMax)) * 100)));

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border transition space-y-2 ${
                        isSpeaking
                          ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
                          : isActive
                          ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 shadow-lg'
                          : isDefeated
                          ? 'bg-stone-950/50 border-stone-800/80 opacity-60'
                          : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-rose-700/50'
                      }`}
                    >
                      {/* Top Row: Avatar, Info, Badges */}
                      <div className="flex items-center justify-between gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={c.portraitUrl || getMonsterPortraitUrl(c.name)}
                              alt={c.name}
                              className={`w-10 h-10 rounded-xl object-cover border shadow shrink-0 ${
                                isSpeaking
                                  ? 'border-emerald-400 ring-2 ring-emerald-400/60 animate-pulse'
                                  : isActive
                                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                                  : isDefeated
                                  ? 'border-stone-800 grayscale'
                                  : 'border-rose-700/50'
                              }`}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.onerror = null;
                                img.src = generateMonsterSvgPortrait(c?.name);
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-4 rounded bg-rose-600 text-stone-950 font-mono font-bold text-[9px] border border-rose-300 shadow flex items-center justify-center" title={`Initiative Roll: ${c.initiative}`}>
                              {isNaN(c.initiative) ? 0 : c.initiative}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="font-serif font-bold text-stone-100 text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="truncate max-w-[150px]">{c.name}</span>
                              <span className="text-[10px] text-stone-400 font-mono" title="Global Turn Order">
                                #{globalRank}
                              </span>
                              {isActive && (
                                <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded font-mono animate-pulse">
                                  ACTIVE TURN
                                </span>
                              )}
                              {isSpeaking && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                                  <Mic className="w-2.5 h-2.5 text-emerald-400" /> SPEAKING
                                </span>
                              )}
                              {isDefeated && (
                                <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-600/80 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                                  <Skull className="w-2.5 h-2.5" /> DEFEATED
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>AC: <strong className="text-stone-200">{c.armorClass}</strong></span>
                              <span>HP: <strong className={isDefeated ? 'text-rose-500 font-bold' : c.hpCurrent <= (c.hpMax / 4) ? 'text-rose-400' : 'text-emerald-400'}>{c.hpCurrent}</strong> / {c.hpMax}</span>
                              {c.monsterXpReward ? (
                                <span className="text-amber-300 text-[10px] font-bold">+{c.monsterXpReward} XP</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Actions (HP controls, Allegiance switch, remove) */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 bg-stone-950 border border-stone-800 p-0.5 rounded-lg">
                            <button
                              onClick={() => handleAdjustHp(c.id, -5)}
                              className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded font-mono font-bold text-[11px]"
                              title="-5 HP"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, -1)}
                              className="px-1.5 py-0.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 rounded font-mono font-bold text-[11px]"
                              title="-1 HP"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, 1)}
                              className="px-1.5 py-0.5 bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 rounded font-mono font-bold text-[11px]"
                              title="+1 HP"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleAdjustHp(c.id, 5)}
                              className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded font-mono font-bold text-[11px]"
                              title="+5 HP"
                            >
                              +5
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleCombatantType(c.id)}
                            className="p-1 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-emerald-400 border border-stone-800 rounded-lg transition"
                            title="Switch to Team 1 (Ally)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveCombatant(c.id)}
                            className="p-1 text-stone-500 hover:text-rose-400 transition"
                            title="Remove from encounter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Health Progress Bar */}
                      <div className="w-full bg-stone-950 rounded-full h-1.5 border border-stone-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDefeated ? 'bg-rose-900' : hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Unified Timeline View (Optional Switcher) */
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {combatants.map((c, idx) => {
            const isActive = idx === activeTurnIndex;
            const isSpeaking = activeSpeakerNames.has(c.name.toLowerCase().trim());
            const isEnemy = c.type === 'enemy' && !c.isPlayerChar;

            return (
              <div
                key={c.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap ${
                  isSpeaking
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
                    : isActive
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 shadow-lg'
                    : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={c.portraitUrl || getMonsterPortraitUrl(c.name)}
                      alt={c.name}
                      className={`w-10 h-10 rounded-xl object-cover border shadow shrink-0 ${
                        isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/60 animate-pulse' : 'border-stone-700'
                      }`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.onerror = null;
                        img.src = generateMonsterSvgPortrait(c?.name);
                      }}
                    />
                    <div className={`absolute -bottom-1 -right-1 px-1 h-4 rounded flex items-center justify-center font-mono font-bold text-[9px] border shadow ${
                      c.type === 'player'
                        ? 'bg-amber-500 text-stone-950 border-amber-300'
                        : c.type === 'ally'
                        ? 'bg-emerald-600 text-stone-950 border-emerald-300'
                        : 'bg-rose-600 text-stone-950 border-rose-300'
                    }`}>
                      {isNaN(c.initiative) ? 0 : c.initiative}
                    </div>
                  </div>

                  <div>
                    <div className="font-serif font-bold text-stone-100 text-xs flex items-center gap-2">
                      <span>{c.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        isEnemy ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {isEnemy ? 'Team 2 (Enemy)' : 'Team 1 (Ally)'}
                      </span>
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
                      <span>HP: <strong className={c.hpCurrent === 0 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{c.hpCurrent}</strong> / {c.hpMax}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-1 rounded-lg">
                    <button
                      onClick={() => handleAdjustHp(c.id, -5)}
                      className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded font-mono font-bold text-xs"
                      title="-5 HP"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, -1)}
                      className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded font-mono font-bold text-xs"
                      title="-1 HP"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, 1)}
                      className="px-2 py-0.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 rounded font-mono font-bold text-xs"
                      title="+1 HP"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustHp(c.id, 5)}
                      className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded font-mono font-bold text-xs"
                      title="+5 HP"
                    >
                      +5
                    </button>
                  </div>

                  {!c.isPlayerChar && (
                    <button
                      onClick={() => handleToggleCombatantType(c.id)}
                      className="p-1 bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 rounded-lg transition"
                      title="Switch Team"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!c.isPlayerChar && (
                    <button
                      onClick={() => handleRemoveCombatant(c.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition"
                      title="Remove Combatant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showLogModal && (
        <EncounterLogModal
          combatLogs={combatLogs}
          roundNumber={roundNumber}
          activeCombatantName={activeCombatant?.name}
          characterName={character.name}
          onClose={() => setShowLogModal(false)}
          onAddLogEntry={addLogEntry}
          onClearLogs={() => setCombatLogs([])}
        />
      )}

      {showAddModal && (
        <AddCombatantModal
          character={character}
          allCharacters={allCharacters}
          parties={parties}
          activeEdition={character.edition || '5e'}
          initialType={addModalInitialType}
          onClose={() => setShowAddModal(false)}
          onAddCombatant={(newComb) => {
            setCombatants(prev => [...prev, newComb].sort((a, b) => b.initiative - a.initiative));
            addLogEntry('turn', `Added target ${newComb.name}`, newComb.name);
            setShowAddModal(false);
          }}
          onAddPartyToEncounter={handleAddPartyToEncounter}
        />
      )}
    </div>
  );
};
