import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CharacterData, Party, EncounterEnvironment } from '../../../types';
import { getAbilityModifier, isCharacterDead, getEffectiveMaxHp } from '../../../utils/dndCalculations';
import { getLevelFromTotalXp } from '../../../data/levelProgressionData';
import { getMonsterPortraitUrl } from '../../../data/monsterPortraits';
import { ENVIRONMENT_CONFIGS } from '../../../utils/environmentRules';
import { playInitiativeTurnSound, playDamageAppliedSound, playHealSound, playDeathSound } from '../../../utils/diceAudio';
import { Combatant, CombatLogEntry, SavedEncounterData, EncounterMode, MerchantEncounterState } from './encounterTypes';

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
    encounterMode: 'combat',
    activeMerchant: null,
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
          encounterMode: parsed.encounterMode || 'combat',
          activeMerchant: parsed.activeMerchant || null,
          combatLogs: Array.isArray(parsed.combatLogs) && parsed.combatLogs.length > 0 ? parsed.combatLogs : defaultState.combatLogs
        };
      }
    }
  } catch (err) {
    console.error("Error reading encounter state from localStorage:", err);
  }

  return defaultState;
}

export interface UseEncounterStateProps {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export function useEncounterState({
  character,
  allCharacters = [],
  parties = [],
  onUpdateCharacter,
  onRoll
}: UseEncounterStateProps) {
  const [combatants, setCombatants] = useState<Combatant[]>(() => loadSavedEncounter(character).combatants);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(() => loadSavedEncounter(character).activeTurnIndex);
  const [roundNumber, setRoundNumber] = useState<number>(() => loadSavedEncounter(character).roundNumber);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>(() => loadSavedEncounter(character).combatLogs);
  const [encounterEnvironment, setEncounterEnvironment] = useState<EncounterEnvironment>(() => loadSavedEncounter(character).encounterEnvironment || 'terrestrial');
  const [encounterMode, setEncounterMode] = useState<EncounterMode>(() => loadSavedEncounter(character).encounterMode || 'combat');
  const [activeMerchant, setActiveMerchant] = useState<MerchantEncounterState | null>(() => loadSavedEncounter(character).activeMerchant || null);

  const [xpAlert, setXpAlert] = useState<{
    monsterName: string;
    totalXp: number;
    xpPerParticipant: number;
    participantCount: number;
    participantNames: string;
    isManualMode?: boolean;
  } | null>(null);

  // Reload saved encounter if active character ID changes
  useEffect(() => {
    const saved = loadSavedEncounter(character);
    setCombatants(saved.combatants);
    setActiveTurnIndex(saved.activeTurnIndex);
    setRoundNumber(saved.roundNumber);
    setCombatLogs(saved.combatLogs);
    setEncounterEnvironment(saved.encounterEnvironment || 'terrestrial');
    setEncounterMode(saved.encounterMode || 'combat');
    setActiveMerchant(saved.activeMerchant || null);
  }, [character.id]);

  // Listen for externally injected / AI-deployed encounters
  useEffect(() => {
    const handleEncounterDeployed = (event: Event) => {
      const customEvent = event as CustomEvent<{
        characterId?: string;
        combatants?: Combatant[];
        environment?: EncounterEnvironment;
        logEntry?: CombatLogEntry;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;
      if (detail.characterId && detail.characterId !== character.id) return;

      if (detail.combatants && Array.isArray(detail.combatants)) {
        setCombatants(detail.combatants);
      }
      if (detail.environment) {
        setEncounterEnvironment(detail.environment);
      }
      if (detail.logEntry) {
        setCombatLogs(prev => [detail.logEntry!, ...prev]);
      }
      setEncounterMode('combat');
      setActiveMerchant(null);
      setActiveTurnIndex(0);
      setRoundNumber(1);
    };

    window.addEventListener('dnd_encounter_deployed', handleEncounterDeployed);
    return () => {
      window.removeEventListener('dnd_encounter_deployed', handleEncounterDeployed);
    };
  }, [character.id]);

  // Save encounter state to localStorage
  useEffect(() => {
    const charKey = character.id || 'default';
    try {
      const dataToSave: SavedEncounterData = {
        combatants,
        activeTurnIndex,
        roundNumber,
        combatLogs,
        encounterEnvironment,
        encounterMode,
        activeMerchant
      };
      localStorage.setItem(`dnd_encounter_state_v1_${charKey}`, JSON.stringify(dataToSave));
    } catch (err) {
      console.error("Error saving encounter state to localStorage:", err);
    }
  }, [combatants, activeTurnIndex, roundNumber, combatLogs, encounterEnvironment, encounterMode, activeMerchant, character.id]);


  // Keep player combatant synced with character
  useEffect(() => {
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
            portraitUrl: character.portraitUrl || (charPortrait(character))
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

  function charPortrait(char: CharacterData) {
    return char.portraitUrl || (char.isMonster ? getMonsterPortraitUrl(char.name, char.id) : undefined);
  }

  const activeCombatant = combatants[activeTurnIndex] || combatants[0];

  const allies = useMemo(() => {
    return combatants.filter(c => c.isPlayerChar || c.type === 'player' || c.type === 'ally');
  }, [combatants]);

  const enemies = useMemo(() => {
    return combatants.filter(c => !c.isPlayerChar && c.type === 'enemy');
  }, [combatants]);

  const activeAttackerCharacter: CharacterData = useMemo(() => {
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

  const addLogEntry = useCallback((category: CombatLogEntry['category'], message: string, actor?: string) => {
    const newEntry: CombatLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round: roundNumber,
      actor: actor || activeCombatant?.name || character.name,
      category,
      message
    };
    setCombatLogs(prev => [newEntry, ...prev]);
  }, [roundNumber, activeCombatant?.name, character.name]);

  const awardDefeatedMonsterXp = useCallback((target: Combatant) => {
    if (target.type !== 'enemy' || target.isDefeated) return;

    const totalXp = target.monsterXpReward !== undefined ? target.monsterXpReward : 450;
    if (totalXp <= 0) return;

    const activeParticipants = combatants.filter(c => c.type === 'player' || c.type === 'ally');
    const participantCount = Math.max(1, activeParticipants.length);
    const xpPerParticipant = Math.floor(totalXp / participantCount);

    setCombatants(prev =>
      prev.map(c => c.id === target.id ? { ...c, isDefeated: true } : c)
    );

    const isAutoXpDisabled = Boolean(
      character.optionalRules?.disableAutoXpGain ||
      character.optionalRules?.useManualXpMode ||
      character.optionalRules?.useMilestoneXp
    );

    if (onUpdateCharacter && xpPerParticipant > 0 && !isAutoXpDisabled) {
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
      participantNames: activeParticipants.map(p => p.name).join(', '),
      isManualMode: isAutoXpDisabled
    });

    if (isAutoXpDisabled) {
      addLogEntry(
        'turn',
        `💀 Defeated ${target.name}! (${totalXp.toLocaleString()} XP value — Manual/Milestone EXP active, character sheet XP was not modified).`,
        'DM'
      );
    } else {
      addLogEntry(
        'turn',
        `🏆 Defeated ${target.name}! Awarded ${totalXp.toLocaleString()} XP (${xpPerParticipant.toLocaleString()} XP each to ${participantCount} party member${participantCount > 1 ? 's' : ''}).`,
        'DM'
      );
    }
  }, [combatants, character, onUpdateCharacter, addLogEntry]);

  const applyManualXp = useCallback((xpAmount: number) => {
    if (!onUpdateCharacter || xpAmount <= 0) return;
    const isDual = !!(character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass);
    const currentGenXp = character.experiencePoints || 0;
    const newGenXp = currentGenXp + xpAmount;

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
    addLogEntry('turn', `✨ Manually awarded ${xpAmount.toLocaleString()} XP to ${character.name}`, 'Manual XP');
    setXpAlert(null);
  }, [character, onUpdateCharacter, addLogEntry]);

  const toggleAutoXpGain = useCallback(() => {
    if (!onUpdateCharacter) return;
    const currentDisabled = Boolean(
      character.optionalRules?.disableAutoXpGain ||
      character.optionalRules?.useManualXpMode
    );
    const nextDisabled = !currentDisabled;
    onUpdateCharacter({
      ...character,
      optionalRules: {
        ...character.optionalRules,
        disableAutoXpGain: nextDisabled,
        useManualXpMode: nextDisabled
      }
    });
    addLogEntry(
      'turn',
      nextDisabled
        ? '📖 Switched to Manual / Tabletop EXP Mode (Auto-XP Gain Disabled)'
        : '⚡ Switched to Automatic XP Tracking (Auto-XP Gain Enabled)',
      'Settings'
    );
  }, [character, onUpdateCharacter, addLogEntry]);

  const handleAdjustHp = useCallback((id: string, delta: number) => {
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
  }, [combatants, character, onUpdateCharacter, addLogEntry, awardDefeatedMonsterXp]);

  const handleNextTurn = useCallback(() => {
    if (combatants.length === 0) return;
    let nextIndex = activeTurnIndex + 1;
    let nextRound = roundNumber;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      setRoundNumber(nextRound);
      addLogEntry('turn', `⚔️ Round ${nextRound} began!`);
    }

    setActiveTurnIndex(nextIndex);
    const nextCombatant = combatants[nextIndex];
    if (nextCombatant) {
      playInitiativeTurnSound();
      addLogEntry('turn', `Turn started for ${nextCombatant.name} (Round ${nextRound})`, nextCombatant.name);
    }
  }, [combatants, activeTurnIndex, roundNumber, addLogEntry]);

  const handlePrevTurn = useCallback(() => {
    if (combatants.length === 0) return;
    let prevIndex = activeTurnIndex - 1;
    let prevRound = roundNumber;

    if (prevIndex < 0) {
      prevIndex = Math.max(0, combatants.length - 1);
      prevRound = Math.max(1, prevRound - 1);
      setRoundNumber(prevRound);
    }

    setActiveTurnIndex(prevIndex);
    const prevCombatant = combatants[prevIndex];
    if (prevCombatant) {
      addLogEntry('turn', `Returned to ${prevCombatant.name}'s turn`, prevCombatant.name);
    }
  }, [combatants, activeTurnIndex, roundNumber, addLogEntry]);

  const handleRollAllInitiatives = useCallback(() => {
    const rolled = combatants.map(c => {
      let dexBonus = 0;
      if (c.isPlayerChar) {
        const dex = character.abilities?.DEX?.score ?? 10;
        dexBonus = (character.initiativeBonus || 0) + getAbilityModifier(dex);
      } else {
        const matched = allCharacters.find(ch => ch.name.toLowerCase() === c.name.toLowerCase() || ch.id === c.id);
        if (matched) {
          const dex = matched.abilities?.DEX?.score ?? 10;
          dexBonus = (matched.initiativeBonus || 0) + getAbilityModifier(dex);
        }
      }

      const roll = Math.floor(Math.random() * 20) + 1 + dexBonus;
      return { ...c, initiative: roll };
    });

    const sorted = [...rolled].sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    setActiveTurnIndex(0);
    addLogEntry('turn', '🎲 Rolled initiative for all combatants and sorted turn order!');
  }, [combatants, character, allCharacters, addLogEntry]);

  const handleToggleCombatantType = useCallback((id: string) => {
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
  }, [addLogEntry]);

  const handleUpdateCombatantMaxHp = useCallback((id: string, newMaxHp: number) => {
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
  }, [combatants, character, onUpdateCharacter, addLogEntry]);

  const handleRemoveCombatant = useCallback((id: string) => {
    const target = combatants.find(c => c.id === id);
    if (target) {
      addLogEntry('turn', `Removed ${target.name} from combat`, target.name);
    }
    setCombatants(prev => prev.filter(c => c.id !== id));
  }, [combatants, addLogEntry]);

  const handleSetMerchantEncounter = useCallback((merchantData: MerchantEncounterState) => {
    setActiveMerchant(merchantData);
    setEncounterMode('merchant');
    addLogEntry(
      'trade',
      `🏪 Merchant Encounter Started: "${merchantData.merchantName}" (${merchantData.archetype || 'Trader'}) has opened shop! Starting gold till: ${merchantData.goldGp} GP, ${merchantData.inventory.length} wares available.`,
      merchantData.merchantName
    );
  }, [addLogEntry]);

  const handlePivotMerchantToCombat = useCallback(() => {
    if (!activeMerchant) return;

    const merchantInitBonus = activeMerchant.statblock?.initiativeBonus || 2;
    const rolledInit = Math.floor(Math.random() * 20) + 1 + merchantInitBonus;
    const ac = activeMerchant.statblock?.armorClass || 14;
    const hp = activeMerchant.statblock?.hp || 45;

    const merchantCombatant: Combatant = {
      id: 'enemy-merchant-' + activeMerchant.merchantId + '-' + Date.now(),
      name: activeMerchant.merchantName + ' (Merchant)',
      initiative: rolledInit,
      armorClass: ac,
      hpCurrent: hp,
      hpMax: hp,
      type: 'enemy',
      monsterXpReward: 700,
      isDefeated: false,
      portraitUrl: activeMerchant.portraitUrl
    };

    setCombatants(prev => {
      const defaultPlayer = prev.find(c => c.isPlayerChar) || {
        id: 'player-' + character.id,
        name: character.name,
        initiative: 10,
        armorClass: character.armorClass || 10,
        hpCurrent: character.hpCurrent || 10,
        hpMax: getEffectiveMaxHp(character),
        type: 'player',
        isPlayerChar: true,
        conditions: character.conditions || [],
        portraitUrl: character.portraitUrl
      };

      const others = prev.filter(c => c.isPlayerChar || c.type === 'ally');
      const roster = [defaultPlayer, ...others.filter(c => c.id !== defaultPlayer.id), merchantCombatant];
      return roster.sort((a, b) => b.initiative - a.initiative);
    });

    setEncounterMode('combat');
    setRoundNumber(1);
    setActiveTurnIndex(0);

    addLogEntry(
      'ability',
      `⚔️ COMBAT TRIGGERED! ${activeMerchant.merchantName} drew weapons! (AC ${ac}, HP ${hp}, Initiative: ${rolledInit}). Attacks: ${activeMerchant.statblock?.attacks || 'Mundane weapons'}`,
      activeMerchant.merchantName
    );
  }, [activeMerchant, character, addLogEntry]);

  const handleClearEncounter = useCallback(() => {
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
    setEncounterMode('combat');
    setActiveMerchant(null);
    setCombatLogs([
      {
        id: 'log-init-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: 1,
        category: 'turn',
        message: `Encounter reset. All added targets cleared.`
      }
    ]);
  }, [character]);

  const handleAddPartyToEncounter = useCallback((partyObj: Party) => {
    const allMembers = allCharacters.filter(c => partyObj.characterIds.includes(c.id));
    if (allMembers.length === 0) return;

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
  }, [allCharacters, character, addLogEntry]);

  return {
    combatants,
    setCombatants,
    activeTurnIndex,
    setActiveTurnIndex,
    roundNumber,
    setRoundNumber,
    combatLogs,
    setCombatLogs,
    encounterEnvironment,
    setEncounterEnvironment,
    encounterMode,
    setEncounterMode,
    activeMerchant,
    setActiveMerchant,
    handleSetMerchantEncounter,
    handlePivotMerchantToCombat,
    activeCombatant,
    activeAttackerCharacter,
    allies,
    enemies,
    xpAlert,
    setXpAlert,
    handleAdjustHp,
    handleNextTurn,
    handlePrevTurn,
    handleRollAllInitiatives,
    handleToggleCombatantType,
    handleUpdateCombatantMaxHp,
    handleRemoveCombatant,
    handleClearEncounter,
    handleAddPartyToEncounter,
    addLogEntry,
    awardDefeatedMonsterXp,
    applyManualXp,
    toggleAutoXpGain
  };
}


export type EncounterManagerReturn = ReturnType<typeof useEncounterState>;
