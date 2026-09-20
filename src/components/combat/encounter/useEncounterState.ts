import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CharacterData, Party, EncounterEnvironment, AbilityName } from '../../../types';
import { getAbilityModifier, isCharacterDead, getEffectiveMaxHp, getEffectiveSaves } from '../../../utils/dndCalculations';
import { getLevelFromTotalXp } from '../../../data/levelProgressionData';
import { getMonsterPortraitUrl } from '../../../data/monsterPortraits';
import { ENVIRONMENT_CONFIGS } from '../../../utils/environmentRules';
import { playInitiativeTurnSound, playDamageAppliedSound, playHealSound, playDeathSound, playHitSound, playMissSound, playDiceSound } from '../../../utils/diceAudio';
import { Combatant, CombatLogEntry, SavedEncounterData, EncounterMode, MerchantEncounterState, ConcentrationPrompt, MassiveDamagePrompt } from './encounterTypes';
import { TerrainType, DoorState, AoETemplate, BattlemapLayout, BattlemapConfig, ActiveTeleportState, ActiveSpellTargetingState, isCellImpassable } from '../../battlemap/battlemapTypes';
import { eventBus } from '../../../events/eventBus';
import { 
  UserProfile, 
  GameSession, 
  updateSessionEncounter, 
  advanceSessionTurn, 
  submitInitiativeToSession, 
  clearSessionEncounter,
  SyncedEncounterState,
  SyncedCombatant
} from '../../../lib/firebase';

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
          battlemapTerrain: parsed.battlemapTerrain || {},
          battlemapDoors: parsed.battlemapDoors || {},
          battlemapFogOfWar: parsed.battlemapFogOfWar || {},
          battlemapUseFogOfWar: Boolean(parsed.battlemapUseFogOfWar),
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
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  activeSessionCode?: string | null;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export function useEncounterState({
  character,
  allCharacters = [],
  parties = [],
  currentUser,
  activeSession,
  activeSessionCode,
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
  const [concentrationPrompt, setConcentrationPrompt] = useState<ConcentrationPrompt | null>(null);
  const [massiveDamagePrompt, setMassiveDamagePrompt] = useState<MassiveDamagePrompt | null>(null);
  const [terrainMap, setTerrainMap] = useState<Record<string, TerrainType>>(() => (loadSavedEncounter(character).battlemapTerrain as Record<string, TerrainType>) || {});
  const [doors, setDoors] = useState<Record<string, DoorState>>(() => (loadSavedEncounter(character).battlemapDoors as Record<string, DoorState>) || {});
  const [fogOfWar, setFogOfWar] = useState<Record<string, boolean>>(() => (loadSavedEncounter(character).battlemapFogOfWar as Record<string, boolean>) || {});
  const [useFogOfWar, setUseFogOfWar] = useState<boolean>(() => Boolean(loadSavedEncounter(character).battlemapUseFogOfWar));
  const [activeAoETemplate, setActiveAoETemplate] = useState<AoETemplate | null>(null);

  const isDm = Boolean(currentUser && activeSession && activeSession.dmUid === currentUser.uid);

  // Sync state from remote Firestore Session Encounter
  useEffect(() => {
    if (!activeSession || !activeSession.activeEncounter) return;
    const remoteEnc = activeSession.activeEncounter;
    if (!remoteEnc.isActive) return;

    if (remoteEnc.combatants && Array.isArray(remoteEnc.combatants) && remoteEnc.combatants.length > 0) {
      const mappedCombatants: Combatant[] = remoteEnc.combatants.map((sc) => {
        let combatantType: 'player' | 'enemy' | 'ally' = 'player';
        if (sc.type === 'enemy' || sc.type === 'monster') combatantType = 'enemy';
        else if (sc.type === 'ally' || sc.type === 'companion' || sc.type === 'npc') combatantType = 'ally';
        else combatantType = 'player';

        return {
          id: sc.id,
          name: sc.name,
          initiative: sc.initiative || 0,
          armorClass: sc.armorClass || 10,
          hpCurrent: sc.hpCurrent ?? 10,
          hpMax: sc.hpMax ?? 10,
          tempHp: sc.tempHp || sc.hpTemp || 0,
          type: combatantType,
          isPlayerChar: sc.isPlayerChar,
          conditions: sc.conditions || [],
          isConcentrating: sc.isConcentrating,
          concentratingSpell: sc.concentratingSpell ? { spellName: sc.concentratingSpell, castRound: 1 } : undefined,
          isDefeated: sc.isDefeated,
          portraitUrl: sc.portraitUrl,
          controlledBy: sc.controlledBy,
          mapX: sc.mapX,
          mapY: sc.mapY,
          tokenSize: sc.tokenSize,
          reachFeet: sc.reachFeet,
          elevationFeet: sc.elevationFeet,
          speed: sc.speed || 30,
          movementRemaining: typeof sc.movementRemaining === 'number' ? sc.movementRemaining : (sc.speed || 30),
          hasDashed: sc.hasDashed
        };
      });

      setCombatants(mappedCombatants);
      setActiveTurnIndex(remoteEnc.activeTurnIndex || 0);
      setRoundNumber(remoteEnc.roundNumber || 1);
      if (remoteEnc.environment) {
        setEncounterEnvironment(remoteEnc.environment);
      }
      if (remoteEnc.battlemapTerrain) {
        setTerrainMap(remoteEnc.battlemapTerrain as Record<string, TerrainType>);
      }
      if (remoteEnc.battlemapDoors) {
        setDoors(remoteEnc.battlemapDoors as Record<string, DoorState>);
      }
      if (remoteEnc.battlemapFogOfWar) {
        setFogOfWar(remoteEnc.battlemapFogOfWar);
      }
      if (typeof remoteEnc.battlemapUseFogOfWar === 'boolean') {
        setUseFogOfWar(remoteEnc.battlemapUseFogOfWar);
      }
      if (remoteEnc.battlemapActiveAoE !== undefined) {
        setActiveAoETemplate(remoteEnc.battlemapActiveAoE);
      }

      // Check if current active turn belongs to current player's character
      const currentActiveCombatant = mappedCombatants[remoteEnc.activeTurnIndex || 0];
      if (currentActiveCombatant && (currentActiveCombatant.name === character.name || currentActiveCombatant.controlledBy === currentUser?.uid)) {
        playInitiativeTurnSound();
      }
    }
  }, [
    activeSession?.activeEncounter?.updatedAt, 
    activeSession?.activeEncounter?.activeTurnIndex, 
    activeSession?.activeEncounter?.roundNumber,
    activeSession?.activeEncounter?.isActive,
    character.name,
    currentUser?.uid
  ]);

  // Helper to push encounter updates to active session
  const syncEncounterToSession = useCallback((
    updatedCombatants: Combatant[], 
    turnIdx: number, 
    roundNum: number, 
    env?: EncounterEnvironment,
    customTerrain?: Record<string, string>,
    customDoors?: Record<string, DoorState>,
    customFogOfWar?: Record<string, boolean>,
    customUseFogOfWar?: boolean,
    customAoE?: AoETemplate | null,
    customConfig?: Partial<BattlemapConfig>
  ) => {
    if (!activeSessionCode || !isDm) return;

    const syncedCombatants: SyncedCombatant[] = updatedCombatants.map((c) => ({
      id: c.id,
      name: c.name,
      initiative: c.initiative,
      armorClass: c.armorClass,
      hpCurrent: c.hpCurrent,
      hpMax: c.hpMax,
      tempHp: c.tempHp,
      type: c.type,
      isPlayerChar: c.isPlayerChar,
      conditions: c.conditions || [],
      isConcentrating: c.isConcentrating,
      concentratingSpell: c.concentratingSpell?.spellName,
      isDefeated: c.isDefeated,
      portraitUrl: c.portraitUrl,
      controlledBy: c.controlledBy,
      mapX: c.mapX,
      mapY: c.mapY,
      tokenSize: c.tokenSize,
      reachFeet: c.reachFeet,
      elevationFeet: c.elevationFeet,
      speed: c.speed,
      movementRemaining: c.movementRemaining,
      hasDashed: c.hasDashed
    }));

    const encounterPayload: SyncedEncounterState = {
      isActive: true,
      roundNumber: roundNum,
      activeTurnIndex: turnIdx,
      environment: env || encounterEnvironment,
      combatants: syncedCombatants,
      battlemapTerrain: customTerrain !== undefined ? customTerrain : (terrainMap as Record<string, string>),
      battlemapDoors: customDoors !== undefined ? customDoors : doors,
      battlemapFogOfWar: customFogOfWar !== undefined ? customFogOfWar : fogOfWar,
      battlemapUseFogOfWar: customUseFogOfWar !== undefined ? customUseFogOfWar : useFogOfWar,
      battlemapActiveAoE: customAoE !== undefined ? customAoE : activeAoETemplate,
      battlemapColumns: customConfig?.gridColumns,
      battlemapRows: customConfig?.gridRows,
      battlemapFeetPerSquare: customConfig?.feetPerSquare,
      battlemapDiagonalRule: customConfig?.diagonalRule,
      battlemapTheme: customConfig?.theme as any,
      updatedAt: new Date().toISOString()
    };

    updateSessionEncounter(activeSessionCode, encounterPayload).catch((err) => {
      console.warn('Failed to sync encounter to session:', err);
    });
  }, [activeSessionCode, isDm, encounterEnvironment, terrainMap, doors, fogOfWar, useFogOfWar, activeAoETemplate]);

  // Player helper to submit their own initiative to the session
  const handlePlayerSubmitInitiative = useCallback((initRoll: number) => {
    if (!activeSessionCode) return;
    const myCombatantId = 'player-' + character.id;
    submitInitiativeToSession(activeSessionCode, {
      id: myCombatantId,
      name: character.name,
      initiative: initRoll,
      type: 'player',
      portraitUrl: character.portraitUrl,
      armorClass: character.armorClass || 10,
      hpCurrent: character.hpCurrent || 10,
      hpMax: getEffectiveMaxHp(character),
      controlledBy: currentUser?.uid
    }).catch((err) => {
      console.warn('Failed to submit initiative to session:', err);
    });
  }, [activeSessionCode, character, currentUser?.uid]);

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
        activeMerchant,
        battlemapTerrain: terrainMap,
        battlemapDoors: doors,
        battlemapFogOfWar: fogOfWar,
        battlemapUseFogOfWar: useFogOfWar
      };
      localStorage.setItem(`dnd_encounter_state_v1_${charKey}`, JSON.stringify(dataToSave));
    } catch (err) {
      console.error("Error saving encounter state to localStorage:", err);
    }
  }, [combatants, activeTurnIndex, roundNumber, combatLogs, encounterEnvironment, encounterMode, activeMerchant, terrainMap, doors, fogOfWar, useFogOfWar, character.id]);


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
      const damageTaken = Math.abs(delta);
      if (nextHp === 0) playDeathSound();
      else playDamageAppliedSound();

      if (wasAtZero) {
        addLogEntry('damage', `💀 ${target.name} took damage at 0 HP! Automatic Death Save Failure added.`, target.name);
      } else {
        addLogEntry('damage', `${target.name} took ${damageTaken} damage (${nextHp}/${target.hpMax} HP)`, target.name);
      }

      // Concentration Watchdog: Check if target is actively concentrating
      const isTargetConcentrating = Boolean(
        target.isConcentrating ||
        target.concentratingSpell ||
        target.conditions?.some(c => c.toLowerCase().includes('concentrat'))
      );

      if (isTargetConcentrating && nextHp > 0) {
        const conSaveDc = Math.max(10, Math.floor(damageTaken / 2));

        // Calculate CON saving throw modifier
        let conMod = 0;
        if (target.isPlayerChar) {
          conMod = Math.floor(((character.abilities?.CON?.score ?? 10) - 10) / 2);
          const prof = Math.floor(((character.level || 1) - 1) / 4) + 2;
          const isProficient = (character.savingThrowProficiencies?.includes('CON')) ||
            ['sorcerer', 'fighter', 'barbarian', 'artificer'].some(cls => (character.characterClass || '').toLowerCase().includes(cls));
          if (isProficient) conMod += prof;
        } else {
          const targetChar = allCharacters.find(ch => ch.id === target.id || ch.name.toLowerCase() === target.name.toLowerCase());
          if (targetChar?.abilities?.CON?.score) {
            conMod = Math.floor((targetChar.abilities.CON.score - 10) / 2);
          } else {
            conMod = 1;
          }
        }

        const spellName = target.concentratingSpell?.spellName ||
          (target.conditions?.find(c => c.toLowerCase().includes('concentrat'))?.replace(/^Concentrating:\s*/i, '')) ||
          'Concentration Spell';

        setConcentrationPrompt({
          combatantId: target.id,
          combatantName: target.name,
          damageTaken,
          conSaveDc,
          spellName,
          conMod
        });

        eventBus.emit('ConcentrationCheckRequested', {
          combatantId: target.id,
          combatantName: target.name,
          damageTaken,
          conSaveDc,
          spellName
        });

        addLogEntry('condition', `⚠️ ${target.name} must make a DC ${conSaveDc} CON saving throw to maintain concentration on ${spellName}!`, target.name);
      } else if (isTargetConcentrating && nextHp === 0) {
        // Dropping to 0 HP automatically breaks concentration
        const spellName = target.concentratingSpell?.spellName || 'Concentration';
        setCombatants(prev => prev.map(c => c.id === target.id ? {
          ...c,
          isConcentrating: false,
          concentratingSpell: undefined,
          conditions: (c.conditions || []).filter(cond => !cond.toLowerCase().includes('concentrat'))
        } : c));

        if (target.isPlayerChar && onUpdateCharacter) {
          onUpdateCharacter({
            ...character,
            conditions: (character.conditions || []).filter(cond => !cond.toLowerCase().includes('concentrat'))
          });
        }
        addLogEntry('condition', `💥 ${target.name} dropped to 0 HP and lost concentration on ${spellName}!`, target.name);
      }

      // 3.5e Massive Damage Instant Death Rule (3.5e PHB p. 145):
      // Taking 50+ damage in a single hit prompts a DC 15 Fortitude save to avoid dying on the spot.
      if (damageTaken >= 50 && nextHp > -10 && !target.isDefeated) {
        let fortMod = 0;
        if (target.isPlayerChar) {
          const saves = getEffectiveSaves(character);
          fortMod = saves?.FORT?.total ?? getAbilityModifier(character.abilities?.CON?.score || 10);
        } else {
          const targetChar = allCharacters.find(ch => ch.id === target.id || ch.name.toLowerCase() === target.name.toLowerCase());
          if (targetChar) {
            const saves = getEffectiveSaves(targetChar);
            fortMod = saves?.FORT?.total ?? getAbilityModifier(targetChar.abilities?.CON?.score || 10);
          } else {
            fortMod = Math.max(0, Math.floor((target.armorClass - 10) / 2));
          }
        }

        setMassiveDamagePrompt({
          combatantId: target.id,
          combatantName: target.name,
          damageTaken,
          fortSaveDc: 15,
          fortMod
        });

        eventBus.emit('MassiveDamageCheckRequested', {
          combatantId: target.id,
          combatantName: target.name,
          damageTaken,
          fortSaveDc: 15,
          fortMod
        });

        addLogEntry('condition', `💀 ${target.name} suffered MASSIVE DAMAGE (${damageTaken} HP in a single hit)! DC 15 Fortitude save required to avoid Instant Death (3.5e PHB p. 145)!`, target.name);
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
  }, [combatants, character, allCharacters, onUpdateCharacter, addLogEntry, awardDefeatedMonsterXp]);

  const handleResolveConcentration = useCallback((passed: boolean, customRollTotal?: number) => {
    if (!concentrationPrompt) return;
    const { combatantId, combatantName, spellName = 'Spell', conSaveDc } = concentrationPrompt;

    if (passed) {
      playHitSound(false);
      const rollStr = customRollTotal !== undefined ? ` (Rolled ${customRollTotal} vs DC ${conSaveDc})` : '';
      addLogEntry('condition', `✨ ${combatantName} PASSED Concentration Check${rollStr} — Maintained ${spellName}!`, combatantName);
    } else {
      playMissSound();
      const rollStr = customRollTotal !== undefined ? ` (Rolled ${customRollTotal} vs DC ${conSaveDc})` : '';
      addLogEntry('condition', `💥 ${combatantName} FAILED Concentration Check${rollStr} — Concentration on ${spellName} was BROKEN!`, combatantName);

      // Break concentration on combatant
      setCombatants(prev => prev.map(c => c.id === combatantId ? {
        ...c,
        isConcentrating: false,
        concentratingSpell: undefined,
        conditions: (c.conditions || []).filter(cond => !cond.toLowerCase().includes('concentrat') && !cond.toLowerCase().includes(spellName.toLowerCase()))
      } : c));

      // If player character, update character conditions
      const promptTarget = combatants.find(c => c.id === combatantId);
      if (promptTarget?.isPlayerChar && onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          conditions: (character.conditions || []).filter(cond => !cond.toLowerCase().includes('concentrat') && !cond.toLowerCase().includes(spellName.toLowerCase()))
        });
      }
    }

    setConcentrationPrompt(null);
  }, [concentrationPrompt, combatants, character, onUpdateCharacter, addLogEntry]);

  const handleRollConcentrationCheck = useCallback(() => {
    if (!concentrationPrompt) return;
    const { conSaveDc, conMod } = concentrationPrompt;
    playDiceSound();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + conMod;
    const passed = (d20 === 20) || (d20 !== 1 && total >= conSaveDc);

    if (onRoll) {
      onRoll(`CON Save (Concentration vs DC ${conSaveDc})`, 20, 1, conMod, 'normal');
    }

    handleResolveConcentration(passed, total);
  }, [concentrationPrompt, onRoll, handleResolveConcentration]);

  const handleResolveMassiveDamage = useCallback((passed: boolean, customRollTotal?: number) => {
    if (!massiveDamagePrompt) return;
    const { combatantId, combatantName, damageTaken, fortSaveDc } = massiveDamagePrompt;

    if (passed) {
      playHitSound(false);
      const rollStr = customRollTotal !== undefined ? ` (Rolled ${customRollTotal} vs DC ${fortSaveDc})` : '';
      addLogEntry('condition', `🛡️ ${combatantName} PASSED Massive Damage Fortitude Save${rollStr} — Withstood trauma from ${damageTaken} damage! (3.5e PHB p. 145)`, combatantName);
    } else {
      playDeathSound();
      const rollStr = customRollTotal !== undefined ? ` (Rolled ${customRollTotal} vs DC ${fortSaveDc})` : '';
      addLogEntry('damage', `💀 ${combatantName} FAILED Massive Damage Fortitude Save${rollStr} — SUFFERED INSTANT DEATH on the spot! (Drops to -10 HP / Dead) (3.5e PHB p. 145)`, combatantName);

      setCombatants(prev => prev.map(c => c.id === combatantId ? {
        ...c,
        hpCurrent: -10,
        isDefeated: true,
        conditions: Array.from(new Set([...(c.conditions || []), 'Dead']))
      } : c));

      const promptTarget = combatants.find(c => c.id === combatantId);
      if (promptTarget?.isPlayerChar && onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          hpCurrent: -10,
          deathSavesFailures: 3,
          conditions: Array.from(new Set([...(character.conditions || []), 'Dead']))
        });
      }
    }

    setMassiveDamagePrompt(null);
  }, [massiveDamagePrompt, combatants, character, onUpdateCharacter, addLogEntry]);

  const handleRollMassiveDamageSave = useCallback(() => {
    if (!massiveDamagePrompt) return;
    const { fortSaveDc, fortMod } = massiveDamagePrompt;
    playDiceSound();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + fortMod;
    const passed = (d20 === 20) || (d20 !== 1 && total >= fortSaveDc);

    if (onRoll) {
      onRoll(`Fortitude Save (Massive Damage vs DC ${fortSaveDc})`, 20, 1, fortMod, 'normal');
    }

    handleResolveMassiveDamage(passed, total);
  }, [massiveDamagePrompt, onRoll, handleResolveMassiveDamage]);

  const handleNextTurn = useCallback(() => {
    if (combatants.length === 0) return;
    let nextIndex = activeTurnIndex + 1;
    let nextRound = roundNumber;
    let isNewRound = false;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      isNewRound = true;
      setRoundNumber(nextRound);
      addLogEntry('turn', `⚔️ Round ${nextRound} began!`);
    }

    // Condition Expiry Watchdog: decrement durations on round transition
    if (isNewRound) {
      setCombatants(prev => {
        return prev.map(c => {
          if (!c.conditionDurations || Object.keys(c.conditionDurations).length === 0) {
            return c;
          }

          const newDurations: Record<string, number> = {};
          const activeConditions = [...(c.conditions || [])];
          const expiredConditions: string[] = [];

          for (const [cond, roundsLeft] of Object.entries(c.conditionDurations)) {
            const nextRoundsLeft = roundsLeft - 1;
            if (nextRoundsLeft <= 0) {
              expiredConditions.push(cond);
            } else {
              newDurations[cond] = nextRoundsLeft;
            }
          }

          if (expiredConditions.length > 0) {
            const remainingConditions = activeConditions.filter(cond => !expiredConditions.includes(cond));
            expiredConditions.forEach(cond => {
              addLogEntry('condition', `⏳ Condition Expired: "${cond}" on ${c.name} has ended (Round ${nextRound})!`, c.name);
            });

            if (c.isPlayerChar && onUpdateCharacter) {
              onUpdateCharacter({
                ...character,
                conditions: (character.conditions || []).filter(cond => !expiredConditions.includes(cond))
              });
            }

            return {
              ...c,
              conditions: remainingConditions,
              conditionDurations: newDurations
            };
          }

          return {
            ...c,
            conditionDurations: newDurations
          };
        });
      });
    }

    setActiveTurnIndex(nextIndex);
    const updatedCombatants = combatants.map((c, idx) => {
      if (idx === nextIndex) {
        return {
          ...c,
          movementRemaining: c.speed || 30,
          hasDashed: false
        };
      }
      return c;
    });
    setCombatants(updatedCombatants);

    const nextCombatant = updatedCombatants[nextIndex];
    if (nextCombatant) {
      playInitiativeTurnSound();
      addLogEntry('turn', `Turn started for ${nextCombatant.name} (Round ${nextRound}) — Movement: ${nextCombatant.movementRemaining} ft`, nextCombatant.name);
    }

    if (activeSessionCode && isDm) {
      syncEncounterToSession(updatedCombatants, nextIndex, nextRound);
    }
  }, [combatants, activeTurnIndex, roundNumber, character, onUpdateCharacter, addLogEntry, activeSessionCode, isDm, syncEncounterToSession]);

  // Condition Management Helpers
  const handleApplyCondition = useCallback((combatantId: string, conditionName: string, durationRounds?: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== combatantId) return c;
      const currentConds = c.conditions || [];
      const newConds = currentConds.includes(conditionName) ? currentConds : [...currentConds, conditionName];
      const newDurations = { ...(c.conditionDurations || {}) };
      if (durationRounds && durationRounds > 0) {
        newDurations[conditionName] = durationRounds;
      } else {
        delete newDurations[conditionName];
      }
      return {
        ...c,
        conditions: newConds,
        conditionDurations: Object.keys(newDurations).length > 0 ? newDurations : undefined
      };
    }));

    const target = combatants.find(c => c.id === combatantId);
    const targetName = target ? target.name : combatantId;
    const durStr = durationRounds ? ` (${durationRounds} round${durationRounds > 1 ? 's' : ''})` : '';
    addLogEntry('condition', `Applied condition "${conditionName}"${durStr} to ${targetName}`, targetName);

    if (target?.isPlayerChar && onUpdateCharacter) {
      const cur = character.conditions || [];
      if (!cur.includes(conditionName)) {
        onUpdateCharacter({
          ...character,
          conditions: [...cur, conditionName]
        });
      }
    }
  }, [combatants, character, onUpdateCharacter, addLogEntry]);

  const handleRemoveCondition = useCallback((combatantId: string, conditionName: string) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== combatantId) return c;
      const newConds = (c.conditions || []).filter(cond => cond !== conditionName);
      const newDurations = { ...(c.conditionDurations || {}) };
      delete newDurations[conditionName];
      return {
        ...c,
        conditions: newConds,
        conditionDurations: Object.keys(newDurations).length > 0 ? newDurations : undefined
      };
    }));

    const target = combatants.find(c => c.id === combatantId);
    const targetName = target ? target.name : combatantId;
    addLogEntry('condition', `Removed condition "${conditionName}" from ${targetName}`, targetName);

    if (target?.isPlayerChar && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        conditions: (character.conditions || []).filter(cond => cond !== conditionName)
      });
    }
  }, [combatants, character, onUpdateCharacter, addLogEntry]);

  const handleToggleConcentration = useCallback((combatantId: string, spellName: string = 'Concentration Spell') => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== combatantId) return c;
      const nextConc = !c.isConcentrating;
      const condName = `Concentrating: ${spellName}`;
      let nextConds = c.conditions || [];

      if (nextConc) {
        if (!nextConds.includes(condName)) nextConds = [...nextConds, condName];
      } else {
        nextConds = nextConds.filter(cond => !cond.toLowerCase().includes('concentrat'));
      }

      return {
        ...c,
        isConcentrating: nextConc,
        concentratingSpell: nextConc ? { spellName, castRound: roundNumber } : undefined,
        conditions: nextConds
      };
    }));

    const target = combatants.find(c => c.id === combatantId);
    const targetName = target ? target.name : combatantId;
    const isNow = !target?.isConcentrating;
    addLogEntry('condition', `${isNow ? '✨ Started' : '💥 Stopped'} concentrating on ${spellName} (${targetName})`, targetName);

    if (target?.isPlayerChar && onUpdateCharacter) {
      let nextConds = character.conditions || [];
      const condName = `Concentrating: ${spellName}`;
      if (isNow) {
        if (!nextConds.includes(condName)) nextConds = [...nextConds, condName];
      } else {
        nextConds = nextConds.filter(cond => !cond.toLowerCase().includes('concentrat'));
      }
      onUpdateCharacter({
        ...character,
        conditions: nextConds
      });
    }
  }, [combatants, roundNumber, character, onUpdateCharacter, addLogEntry]);

  // EventBus Subscription for Direct Damage / Healing Application
  useEffect(() => {
    const unsub = eventBus.on('ApplyDamageOrHeal', (payload) => {
      const { targetCombatantId, targetName, amount, sourceLabel } = payload;
      let targetId = targetCombatantId;
      if (!targetId && targetName) {
        const found = combatants.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (found) targetId = found.id;
      }
      if (!targetId) {
        const enemy = combatants.find(c => c.type === 'enemy' && c.hpCurrent > 0);
        if (enemy) targetId = enemy.id;
        else if (combatants[activeTurnIndex]) targetId = combatants[activeTurnIndex].id;
      }

      if (targetId) {
        handleAdjustHp(targetId, amount);
        if (sourceLabel) {
          addLogEntry(amount < 0 ? 'damage' : 'heal', `${amount < 0 ? '💥' : '💚'} ${sourceLabel}: ${amount < 0 ? `Dealt ${Math.abs(amount)} damage` : `Restored ${amount} HP`}`);
        }
      }
    });

    return () => unsub();
  }, [combatants, activeTurnIndex, handleAdjustHp, addLogEntry]);

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

  const handleUpdateCombatantPosition = useCallback((id: string, x?: number, y?: number) => {
    setCombatants(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          if (typeof x !== 'number' || typeof y !== 'number') {
            return { ...c, mapX: undefined, mapY: undefined, isOnMap: false };
          }
          return { ...c, mapX: x, mapY: y, isOnMap: true };
        }
        return c;
      });
      // Sync immediately to session if DM or controller
      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber]);

  const handleRemoveCombatantFromMap = useCallback((id: string) => {
    setCombatants(prev => {
      const target = prev.find(c => c.id === id);
      if (target) {
        addLogEntry('turn', `Removed ${target.name}'s token from battlemap (placed in reserve)`, target.name);
      }
      const next = prev.map(c => {
        if (c.id === id) {
          return { ...c, mapX: undefined, mapY: undefined, isOnMap: false };
        }
        return c;
      });
      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber, addLogEntry]);

  const handleResetMapTokens = useCallback((mode: 'spawn_points' | 'recall_all' = 'spawn_points') => {
    setCombatants(prev => {
      let allyIdx = 0;
      let enemyIdx = 0;
      const next = prev.map(c => {
        if (mode === 'recall_all') {
          return { ...c, mapX: undefined, mapY: undefined, isOnMap: false };
        }
        const isEnemy = c.type === 'enemy';
        const x = isEnemy ? (24 - 3 - (enemyIdx % 4)) : (2 + (allyIdx % 4));
        const y = isEnemy ? (2 + Math.floor(enemyIdx / 4) * 2) : (2 + Math.floor(allyIdx / 4) * 2);
        if (isEnemy) enemyIdx++; else allyIdx++;
        return {
          ...c,
          mapX: x,
          mapY: y,
          isOnMap: true,
          movementRemaining: c.speed || 30,
          hasDashed: false
        };
      });
      addLogEntry('turn', mode === 'recall_all' ? 'All combatant tokens recalled to reserve' : 'All combatant tokens reset to spawn points');
      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber, addLogEntry]);

  const handleResetBattlemap = useCallback((options: {
    clearTerrain?: boolean;
    clearDoors?: boolean;
    resetFog?: 'shroud' | 'reveal' | 'none';
    resetTokens?: 'spawn_points' | 'recall_all' | 'none';
    clearAoE?: boolean;
  }) => {
    if (options.clearTerrain) {
      setTerrainMap({});
    }
    if (options.clearDoors) {
      setDoors({});
    }
    if (options.resetFog === 'shroud') {
      setFogOfWar({});
      setUseFogOfWar(true);
    } else if (options.resetFog === 'reveal') {
      setUseFogOfWar(false);
    }
    if (options.clearAoE) {
      setActiveAoETemplate(null);
    }
    if (options.resetTokens && options.resetTokens !== 'none') {
      handleResetMapTokens(options.resetTokens);
    }
    addLogEntry('turn', 'Tactical battlemap was reset.');
  }, [handleResetMapTokens, addLogEntry]);

  const handleMoveCombatant = useCallback((
    id: string,
    x: number,
    y: number,
    distanceFeet: number,
    options?: { isTeleport?: boolean; isDmFreeMove?: boolean; abilityName?: string }
  ) => {
    setCombatants(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;

      const isTeleport = Boolean(options?.isTeleport);
      const isDmFree = Boolean(options?.isDmFreeMove && isDm);

      const currentRemaining = typeof target.movementRemaining === 'number'
        ? target.movementRemaining
        : (target.speed || 30);

      // Teleportation and DM adjustments do not consume ground walk speed
      const newRemaining = (isTeleport || isDmFree)
        ? currentRemaining
        : Math.max(0, currentRemaining - distanceFeet);

      const next = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            mapX: x,
            mapY: y,
            movementRemaining: newRemaining
          };
        }
        return c;
      });

      playInitiativeTurnSound();
      const colLetter = String.fromCharCode(65 + (x % 26));
      const coordStr = `${colLetter}${y + 1}`;

      if (isTeleport) {
        addLogEntry(
          'ability',
          `✨ ${target.name} teleported ${distanceFeet} ft to ${coordStr} using ${options?.abilityName || 'Teleport'}!`,
          target.name
        );
      } else if (isDmFree) {
        addLogEntry(
          'turn',
          `👑 [DM] Repositioned ${target.name} to ${coordStr}.`,
          'DM'
        );
      } else {
        addLogEntry(
          'turn',
          `🏃 ${target.name} moved ${distanceFeet} ft to ${coordStr} (${newRemaining} ft remaining)`,
          target.name
        );
      }

      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber, addLogEntry, isDm]);

  const handleApplyBattlemapLayout = useCallback((
    layout: BattlemapLayout,
    options: {
      includeTokens: boolean;
      includeFog: boolean;
      replaceTerrain: boolean;
    },
    onConfigChange?: (config: BattlemapConfig) => void
  ) => {
    const finalTerrain = options.replaceTerrain
      ? { ...(layout.terrainMap || {}) }
      : { ...terrainMap, ...(layout.terrainMap || {}) };

    const finalDoors = options.replaceTerrain
      ? { ...(layout.doors || {}) }
      : { ...doors, ...(layout.doors || {}) };

    const finalFog = options.includeFog
      ? { ...(layout.fogOfWar || {}) }
      : fogOfWar;

    const finalUseFog = options.includeFog
      ? Boolean(layout.useFogOfWar)
      : useFogOfWar;

    const finalAoE = layout.activeAoE !== undefined ? layout.activeAoE : activeAoETemplate;

    let finalCombatants = combatants;
    if (options.includeTokens && layout.tokens && layout.tokens.length > 0) {
      const updated = [...combatants];
      const toAdd: Combatant[] = [];
      layout.tokens.forEach(token => {
        const existingIdx = updated.findIndex(c => c.name.toLowerCase() === token.name.toLowerCase() || c.id === token.id);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            mapX: token.x,
            mapY: token.y,
            tokenSize: token.tokenSize || updated[existingIdx].tokenSize || 1,
            reachFeet: token.reachFeet || updated[existingIdx].reachFeet || 5,
            elevationFeet: token.elevationFeet ?? updated[existingIdx].elevationFeet ?? 0,
            isOnMap: true
          };
        } else {
          toAdd.push({
            id: token.id || `combatant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: token.name,
            initiative: Math.floor(Math.random() * 20) + 1,
            armorClass: token.armorClass || 13,
            hpCurrent: token.hpCurrent ?? token.hpMax ?? 15,
            hpMax: token.hpMax || 15,
            tempHp: 0,
            type: token.type,
            isPlayerChar: token.type === 'player',
            conditions: [],
            mapX: token.x,
            mapY: token.y,
            tokenSize: token.tokenSize || 1,
            reachFeet: token.reachFeet || 5,
            elevationFeet: token.elevationFeet ?? 0,
            speed: token.speed || 30,
            movementRemaining: token.speed || 30,
            hasDashed: false,
            portraitUrl: token.portraitUrl,
            isOnMap: true
          });
        }
      });
      finalCombatants = [...updated, ...toAdd];
    }

    setTerrainMap(finalTerrain);
    setDoors(finalDoors);
    setFogOfWar(finalFog);
    setUseFogOfWar(finalUseFog);
    setActiveAoETemplate(finalAoE);
    setCombatants(finalCombatants);

    if (onConfigChange && layout.config) {
      onConfigChange(layout.config);
    }

    try {
      const charKey = character.id || 'default';
      const dataToSave: SavedEncounterData = {
        combatants: finalCombatants,
        activeTurnIndex,
        roundNumber,
        combatLogs,
        encounterEnvironment,
        encounterMode,
        activeMerchant,
        battlemapTerrain: finalTerrain,
        battlemapDoors: finalDoors,
        battlemapFogOfWar: finalFog,
        battlemapUseFogOfWar: finalUseFog
      };
      localStorage.setItem(`dnd_encounter_state_v1_${charKey}`, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('Failed to save encounter to localStorage:', err);
    }

    addLogEntry(
      'turn',
      `🗺️ Loaded battlemap layout: "${layout.name}" (${layout.config.gridColumns}×${layout.config.gridRows} sq, ${layout.config.theme}).`,
      'DM'
    );

    if (activeSessionCode && isDm) {
      syncEncounterToSession(
        finalCombatants,
        activeTurnIndex,
        roundNumber,
        undefined,
        finalTerrain as Record<string, string>,
        finalDoors,
        finalFog,
        finalUseFog,
        finalAoE,
        layout.config
      );
    }
  }, [
    terrainMap,
    doors,
    fogOfWar,
    useFogOfWar,
    activeAoETemplate,
    combatants,
    character.id,
    activeTurnIndex,
    roundNumber,
    combatLogs,
    encounterEnvironment,
    encounterMode,
    activeMerchant,
    activeSessionCode,
    isDm,
    syncEncounterToSession,
    addLogEntry
  ]);

  const handleDashCombatant = useCallback((id: string) => {
    setCombatants(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;

      const baseSpeed = target.speed || 30;
      const currentRemaining = typeof target.movementRemaining === 'number'
        ? target.movementRemaining
        : baseSpeed;
      const newRemaining = currentRemaining + baseSpeed;

      const next = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            movementRemaining: newRemaining,
            hasDashed: true
          };
        }
        return c;
      });

      addLogEntry(
        'ability',
        `⚡ ${target.name} took the Dash action! (+${baseSpeed} ft speed, now ${newRemaining} ft remaining)`,
        target.name
      );

      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber, addLogEntry]);

  const handleResetCombatantMovement = useCallback((id: string) => {
    setCombatants(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;

      const baseSpeed = target.speed || 30;
      const next = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            movementRemaining: baseSpeed,
            hasDashed: false
          };
        }
        return c;
      });

      addLogEntry(
        'turn',
        `🔄 Reset movement for ${target.name} to ${baseSpeed} ft`,
        target.name
      );

      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber, addLogEntry]);

  const handleUpdateCombatantSpeed = useCallback((id: string, newSpeed: number) => {
    setCombatants(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            speed: newSpeed,
            movementRemaining: newSpeed
          };
        }
        return c;
      });

      if (activeSessionCode) {
        syncEncounterToSession(next, activeTurnIndex, roundNumber);
      }
      return next;
    });
  }, [activeSessionCode, syncEncounterToSession, activeTurnIndex, roundNumber]);

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

  // Phase 3: Terrain and Door Handlers
  const handleUpdateTerrain = useCallback((updatedTerrain: Record<string, TerrainType>) => {
    setTerrainMap(updatedTerrain);
    if (isDm && activeSessionCode) {
      syncEncounterToSession(combatants, activeTurnIndex, roundNumber, undefined, updatedTerrain, doors);
    }
  }, [isDm, activeSessionCode, combatants, activeTurnIndex, roundNumber, doors, syncEncounterToSession]);

  const handleToggleDoor = useCallback((x: number, y: number) => {
    const key = `${x},${y}`;
    const current = doors[key] || { isOpen: false };
    const updatedDoors = {
      ...doors,
      [key]: {
        ...current,
        isOpen: !current.isOpen
      }
    };
    setDoors(updatedDoors);
    const statusStr = !current.isOpen ? 'opened' : 'closed';
    addLogEntry('turn', `🚪 Door at (${String.fromCharCode(65 + (x % 26))}${y + 1}) was ${statusStr}.`, 'Tactics');
    if (activeSessionCode) {
      syncEncounterToSession(combatants, activeTurnIndex, roundNumber, undefined, terrainMap, updatedDoors);
    }
  }, [doors, addLogEntry, activeSessionCode, combatants, activeTurnIndex, roundNumber, terrainMap, syncEncounterToSession]);

  const handleClearAllTerrain = useCallback(() => {
    setTerrainMap({});
    setDoors({});
    addLogEntry('turn', '🧹 Battlemap terrain and doors were cleared by DM.', 'DM');
    if (isDm && activeSessionCode) {
      syncEncounterToSession(combatants, activeTurnIndex, roundNumber, undefined, {}, {});
    }
  }, [isDm, activeSessionCode, combatants, activeTurnIndex, roundNumber, addLogEntry, syncEncounterToSession]);

  // Phase 4: Fog of War and AoE Handlers
  const handleUpdateFogOfWar = useCallback((newFog: Record<string, boolean>, enabled?: boolean) => {
    setFogOfWar(newFog);
    const nextEnabled = enabled !== undefined ? enabled : useFogOfWar;
    if (enabled !== undefined) {
      setUseFogOfWar(enabled);
    }
    if (isDm && activeSessionCode) {
      syncEncounterToSession(
        combatants,
        activeTurnIndex,
        roundNumber,
        undefined,
        terrainMap as Record<string, string>,
        doors,
        newFog,
        nextEnabled
      );
    }
  }, [isDm, activeSessionCode, combatants, activeTurnIndex, roundNumber, terrainMap, doors, useFogOfWar, syncEncounterToSession]);

  const handleUpdateAoETemplate = useCallback((template: AoETemplate | null) => {
    setActiveAoETemplate(template);
    if (activeSessionCode) {
      syncEncounterToSession(
        combatants,
        activeTurnIndex,
        roundNumber,
        undefined,
        terrainMap as Record<string, string>,
        doors,
        fogOfWar,
        useFogOfWar,
        template
      );
    }
  }, [activeSessionCode, combatants, activeTurnIndex, roundNumber, terrainMap, doors, fogOfWar, useFogOfWar, syncEncounterToSession]);

  const handleRollSavesForTargets = useCallback((saveType: string, dc: number, targets: Combatant[]) => {
    if (!targets || targets.length === 0) return;
    const lines: string[] = [];
    const abilityKeyMap: Record<string, AbilityName> = {
      str: 'STR',
      dex: 'DEX',
      con: 'CON',
      int: 'INT',
      wis: 'WIS',
      cha: 'CHA',
      strength: 'STR',
      dexterity: 'DEX',
      constitution: 'CON',
      intelligence: 'INT',
      wisdom: 'WIS',
      charisma: 'CHA'
    };
    const mappedAbility: AbilityName = abilityKeyMap[saveType.toLowerCase()] || 'DEX';

    targets.forEach((t) => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      let mod = 0;
      if (t.isPlayerChar && character.name === t.name) {
        const score = character.abilities?.[mappedAbility]?.score ?? 10;
        mod = Math.floor((score - 10) / 2);
        if (character.savingThrowProficiencies?.includes(mappedAbility)) {
          mod += Math.floor((character.level - 1) / 4) + 2;
        }
      } else {
        // Monster/NPC estimation
        mod = Math.floor(Math.max(0, Math.min(8, (t.armorClass - 10) / 2)));
      }
      const total = d20 + mod;
      const passed = total >= dc;
      lines.push(`${t.name}: d20(${d20})${mod >= 0 ? `+${mod}` : mod} = ${total} (vs DC ${dc}) -> ${passed ? '✅ SUCCESS' : '❌ FAILED'}`);
    });

    addLogEntry('ability', `🎲 [AoE Spell Save] DC ${dc} ${saveType} Saving Throw:\n${lines.join('\n')}`, 'AoE Tactics');
  }, [character, addLogEntry]);

  const handleApplyAoEDamage = useCallback((diceStr: string, damageType: string, targets: Combatant[]) => {
    if (!targets || targets.length === 0) return;
    const match = diceStr.match(/(\d+)d(\d+)/i);
    let totalDmg = 0;
    const rolls: number[] = [];
    if (match) {
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        totalDmg += r;
      }
    } else {
      totalDmg = parseInt(diceStr, 10) || 28;
    }

    addLogEntry(
      'damage',
      `🔥 [AoE Damage Roll] ${diceStr} ${damageType}: [${rolls.join(', ')}] = ${totalDmg} damage to ${targets.length} target${targets.length > 1 ? 's' : ''}!`,
      'AoE Tactics'
    );
  }, [addLogEntry]);

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
    concentrationPrompt,
    setConcentrationPrompt,
    handleResolveConcentration,
    handleRollConcentrationCheck,
    massiveDamagePrompt,
    setMassiveDamagePrompt,
    handleResolveMassiveDamage,
    handleRollMassiveDamageSave,
    handleApplyCondition,
    handleRemoveCondition,
    handleToggleConcentration,
    handleAdjustHp,
    handleNextTurn,
    handlePrevTurn,
    handleRollAllInitiatives,
    handleToggleCombatantType,
    handleUpdateCombatantMaxHp,
    handleRemoveCombatant,
    handleRemoveCombatantFromMap,
    handleResetMapTokens,
    handleResetBattlemap,
    handleUpdateCombatantPosition,
    handleMoveCombatant,
    handleApplyBattlemapLayout,
    handleDashCombatant,
    handleResetCombatantMovement,
    handleUpdateCombatantSpeed,
    handleClearEncounter,
    handleAddPartyToEncounter,
    terrainMap,
    setTerrainMap,
    doors,
    setDoors,
    handleUpdateTerrain,
    handleToggleDoor,
    handleClearAllTerrain,
    fogOfWar,
    setFogOfWar,
    useFogOfWar,
    setUseFogOfWar,
    activeAoETemplate,
    setActiveAoETemplate,
    handleUpdateFogOfWar,
    handleUpdateAoETemplate,
    handleRollSavesForTargets,
    handleApplyAoEDamage,
    addLogEntry,
    awardDefeatedMonsterXp,
    applyManualXp,
    toggleAutoXpGain,
    handlePlayerSubmitInitiative,
    syncEncounterToSession,
    isDm,
    hasActiveSession: Boolean(activeSessionCode)
  };
}


export type EncounterManagerReturn = ReturnType<typeof useEncounterState>;
