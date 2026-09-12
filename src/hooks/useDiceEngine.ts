import { useState, useEffect } from 'react';
import { DiceRollResult, CharacterData, DiePoolItem, DieRollDetail } from '../types';
import { formatModifier } from '../utils/dndCalculations';
import { eventBus } from '../events/eventBus';
import { PhysicalRollRequest } from '../components/modals/PhysicalDiceModal';
import { structuredLogger } from '../utils/structuredLogger';
import { userTelemetry } from '../utils/userTelemetry';
import { UserProfile, GameSession, broadcastSessionRoll, SyncedDiceRoll } from '../lib/firebase';

export interface RollExtraOptions {
  isSecret?: boolean;
  isWhisperToDm?: boolean;
  targetUid?: string;
}

interface UseDiceEngineProps {
  activeCharacter: CharacterData | null;
  optionalRulesUsePhysicalDice?: boolean;
  currentUser?: UserProfile | null;
  activeSessionCode?: string | null;
  activeSession?: GameSession | null;
}

export function parseDiceExpression(expression: string): { pool: DiePoolItem[]; modifier: number } {
  const clean = expression.replace(/\s+/g, '');
  const diceRegex = /([+-]?\d*)d(\d+)/gi;
  const pool: DiePoolItem[] = [];
  let match;

  while ((match = diceRegex.exec(clean)) !== null) {
    const rawCount = match[1];
    let count = 1;
    if (rawCount === '' || rawCount === '+') {
      count = 1;
    } else if (rawCount === '-') {
      count = -1;
    } else {
      count = parseInt(rawCount, 10) || 1;
    }
    const die = parseInt(match[2], 10) || 6;
    if (count > 0 && die > 0) {
      pool.push({ die, count });
    }
  }

  const noDice = clean.replace(/([+-]?\d*)d\d+/gi, '');
  const modRegex = /([+-]?\d+)/g;
  let modSum = 0;
  let modMatch;
  while ((modMatch = modRegex.exec(noDice)) !== null) {
    modSum += parseInt(modMatch[1], 10) || 0;
  }

  return { pool, modifier: modSum };
}

export function useDiceEngine({
  activeCharacter,
  optionalRulesUsePhysicalDice,
  currentUser,
  activeSessionCode,
  activeSession
}: UseDiceEngineProps) {
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

  // Sync physical dice mode from active campaign optional rules if present
  useEffect(() => {
    if (optionalRulesUsePhysicalDice !== undefined) {
      setIsPhysicalDiceModeState(Boolean(optionalRulesUsePhysicalDice));
    }
  }, [optionalRulesUsePhysicalDice]);

  // Sync incoming rolls from active multiplayer session
  useEffect(() => {
    if (!activeSession || !activeSession.recentRolls || activeSession.recentRolls.length === 0) return;

    const isDm = Boolean(currentUser && activeSession.dmUid === currentUser.uid);
    const myUid = currentUser?.uid || '';

    const syncedResults: DiceRollResult[] = activeSession.recentRolls.map((sr) => {
      const isMine = sr.rollerUid === myUid;
      const canSeeFullResult = isDm || isMine || (!sr.isSecret && !sr.isWhisperToDm);

      let displayLabel = sr.label;
      if (sr.isWhisperToDm) {
        displayLabel = isMine
          ? `[Whisper to DM] ${sr.label}`
          : isDm
          ? `[Whisper from ${sr.rollerName || 'Player'}] ${sr.label}`
          : `[Whisper to DM by ${sr.rollerName || 'Player'}] ${sr.label}`;
      } else if (sr.isSecret) {
        displayLabel = isDm
          ? `[DM Secret Roll] ${sr.label}`
          : `[Secret Roll by ${sr.rollerName || 'DM'}] ${sr.label}`;
      } else if (sr.characterName || sr.rollerName) {
        displayLabel = `${sr.characterName || sr.rollerName}: ${sr.label}`;
      }

      return {
        id: sr.id,
        timestamp: sr.timestamp,
        label: displayLabel,
        expression: canSeeFullResult ? sr.expression : '??? (Hidden)',
        diceRolls: canSeeFullResult ? sr.diceRolls : [],
        modifier: canSeeFullResult ? sr.modifier : 0,
        total: canSeeFullResult ? sr.total : 0,
        mode: sr.mode || 'normal',
        isNat20: canSeeFullResult ? sr.isNat20 : false,
        isNat1: canSeeFullResult ? sr.isNat1 : false,
        isSecret: sr.isSecret,
        isWhisperToDm: sr.isWhisperToDm,
        rollerUid: sr.rollerUid,
        rollerName: sr.rollerName,
        characterName: sr.characterName
      };
    });

    setRollLogs((prev) => {
      const mergedMap = new Map<string, DiceRollResult>();
      // First put incoming synced rolls
      syncedResults.forEach((r) => mergedMap.set(r.id, r));
      // Then retain any local non-synced rolls
      prev.forEach((r) => {
        if (!mergedMap.has(r.id)) {
          mergedMap.set(r.id, r);
        }
      });
      return Array.from(mergedMap.values()).slice(0, 50);
    });
  }, [activeSession?.recentRolls, activeSession?.dmUid, currentUser?.uid]);

  // Execute and record a completed roll result (shared by digital and physical workflows)
  const executeRollResult = (
    label: string,
    expression: string,
    diceRolls: number[],
    modifier: number,
    total: number,
    isNat20: boolean,
    isNat1: boolean,
    mode?: 'normal' | 'advantage' | 'disadvantage',
    diceDetails?: DieRollDetail[],
    options?: RollExtraOptions
  ) => {
    const spanId = structuredLogger.startSpan(`DiceRoll: ${expression}`, {
      tier: 'domain',
      attributes: { label, expression, modifier, mode, total, isNat20, isNat1 }
    });

    const isSecret = options?.isSecret || false;
    const isWhisperToDm = options?.isWhisperToDm || false;
    const rollerUid = currentUser?.uid || 'guest_roller';
    const rollerName = currentUser?.displayName || activeCharacter?.name || 'Player';
    const characterName = activeCharacter?.name;

    const result: DiceRollResult = {
      id: 'roll-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString(),
      label,
      expression,
      diceRolls,
      diceDetails,
      modifier,
      total,
      mode: mode || 'normal',
      isNat20,
      isNat1,
      isSecret,
      isWhisperToDm,
      rollerUid,
      rollerName,
      characterName,
      targetUid: options?.targetUid
    };

    setRollLogs((prev) => [result, ...prev]);
    setActiveRollResult(result);

    // Record user telemetry
    const primaryD20 = diceDetails?.find((d) => d.die === 20 && !d.discarded);
    const naturalRoll = primaryD20 ? primaryD20.value : undefined;
    userTelemetry.recordDiceRoll(expression, total, naturalRoll);

    // Broadcast event bus DiceRolled
    eventBus.emit('DiceRolled', {
      formula: expression,
      total,
      isNat20,
      isNat1,
      rollerName: activeCharacter?.name || label || 'Adventurer'
    });

    // Broadcast to active multiplayer session lobby if connected
    if (activeSessionCode) {
      const syncedRoll: SyncedDiceRoll = {
        id: result.id,
        sessionCode: activeSessionCode,
        rollerUid,
        rollerName,
        characterName,
        label,
        expression,
        total,
        diceRolls,
        modifier,
        mode: mode || 'normal',
        isNat20,
        isNat1,
        isSecret,
        isWhisperToDm,
        targetUid: options?.targetUid,
        timestamp: result.timestamp
      };
      broadcastSessionRoll(activeSessionCode, syncedRoll).catch((err) => {
        console.warn('Failed to broadcast roll to session:', err);
      });
    }

    structuredLogger.endSpan(spanId, { status: 'ok' });

    // Auto dismiss active toast after 4.5 seconds
    setTimeout(() => {
      setActiveRollResult((current) => (current?.id === result.id ? null : current));
    }, 4500);
  };

  // Digital Multi-Dice Pool Roll Generator (e.g. 2x D20 + 1x D6)
  const handleDigitalPoolRoll = (
    label: string,
    pool: DiePoolItem[],
    modifier: number = 0,
    mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
    options?: RollExtraOptions
  ) => {
    if (!pool || pool.length === 0) {
      pool = [{ die: 20, count: 1 }];
    }

    const diceDetails: DieRollDetail[] = [];
    const activeDiceRolls: number[] = [];

    // Format expression string: e.g. "2d20 + 1d6 + 3"
    const poolParts = pool.map((p) => `${p.count}d${p.die}`).join(' + ');
    const modStr = modifier !== 0 ? formatModifier(modifier) : '';
    const expression = `${poolParts}${modStr}`;

    let isNat20 = false;
    let isNat1 = false;

    pool.forEach((item) => {
      const { die, count } = item;

      // Special handling for D20 under Advantage/Disadvantage when single D20 in item
      if (die === 20 && count === 1 && (mode === 'advantage' || mode === 'disadvantage')) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const keepRoll1 = mode === 'advantage' ? roll1 >= roll2 : roll1 <= roll2;

        diceDetails.push({ die: 20, value: roll1, discarded: !keepRoll1 });
        diceDetails.push({ die: 20, value: roll2, discarded: keepRoll1 });

        const chosen = keepRoll1 ? roll1 : roll2;
        activeDiceRolls.push(chosen);

        if (chosen === 20) isNat20 = true;
        if (chosen === 1) isNat1 = true;
      } else {
        for (let i = 0; i < count; i++) {
          const val = Math.floor(Math.random() * die) + 1;
          diceDetails.push({ die, value: val });
          activeDiceRolls.push(val);

          if (die === 20 && val === 20) isNat20 = true;
          if (die === 20 && val === 1) isNat1 = true;
        }
      }
    });

    const diceSum = activeDiceRolls.reduce((sum, n) => sum + n, 0);
    const total = diceSum + modifier;

    executeRollResult(
      label,
      expression,
      activeDiceRolls,
      modifier,
      total,
      isNat20,
      isNat1,
      mode,
      diceDetails,
      options
    );
  };

  // Main Dice Roll Execution Handler (supports both single die call signature and pool/expression)
  const handleRoll = (
    label: string,
    diceTypeOrPool: number | DiePoolItem[],
    diceCount: number = 1,
    modifier: number = 0,
    mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
    options?: RollExtraOptions
  ) => {
    let pool: DiePoolItem[];
    if (Array.isArray(diceTypeOrPool)) {
      pool = diceTypeOrPool;
    } else {
      pool = [{ die: diceTypeOrPool, count: diceCount }];
    }

    if (isPhysicalDiceMode) {
      // Primary die for physical request modal
      const primaryDie = pool[0]?.die || 20;
      const primaryCount = pool[0]?.count || 1;

      setPhysicalRollRequest({
        label,
        diceType: primaryDie,
        diceCount: primaryCount,
        modifier,
        mode,
        onConfirm: (rolls, total, nat20, nat1) => {
          const expression = `${pool.map((p) => `${p.count}d${p.die}`).join(' + ')}${modifier !== 0 ? formatModifier(modifier) : ''}`;
          executeRollResult(label, expression, rolls, modifier, total, nat20, nat1, mode, undefined, options);
          setPhysicalRollRequest(null);
        },
        onDigitalFallback: () => {
          setPhysicalRollRequest(null);
          handleDigitalPoolRoll(label, pool, modifier, mode, options);
        },
        onCancel: () => {
          setPhysicalRollRequest(null);
        }
      });
      return;
    }

    handleDigitalPoolRoll(label, pool, modifier, mode, options);
  };

  // Multi-Dice Pool Roll explicit method
  const handleRollPool = (
    label: string,
    pool: DiePoolItem[],
    modifier: number = 0,
    mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
    options?: RollExtraOptions
  ) => {
    handleRoll(label, pool, 1, modifier, mode, options);
  };

  // Custom Expression Roller (e.g., "2d20 + 1d6 + 4" or "2d6 + 1d8 + 3")
  const handleRollDamage = (label: string, expression: string, options?: RollExtraOptions) => {
    const { pool, modifier } = parseDiceExpression(expression);
    if (pool.length === 0) {
      handleRoll(label, 6, 1, 0, 'normal', options);
      return;
    }

    handleDigitalPoolRoll(label, pool, modifier, 'normal', options);
  };

  const handleRollInitiative = (options?: RollExtraOptions) => {
    if (!activeCharacter) return;
    handleRoll(`${activeCharacter.name} Initiative`, 20, 1, activeCharacter.initiativeBonus, 'normal', options);
  };

  return {
    rollLogs,
    setRollLogs,
    activeRollResult,
    setActiveRollResult,
    isPhysicalDiceMode,
    setIsPhysicalDiceMode,
    physicalRollRequest,
    setPhysicalRollRequest,
    handleRoll,
    handleRollPool,
    handleRollDamage,
    handleRollInitiative,
    executeRollResult
  };
}

