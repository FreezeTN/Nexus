import { useState, useEffect } from 'react';
import { DiceRollResult, CharacterData } from '../types';
import { formatModifier } from '../utils/dndCalculations';
import { eventBus } from '../events/eventBus';
import { PhysicalRollRequest } from '../components/modals/PhysicalDiceModal';

interface UseDiceEngineProps {
  activeCharacter: CharacterData | null;
  optionalRulesUsePhysicalDice?: boolean;
}

export function useDiceEngine({ activeCharacter, optionalRulesUsePhysicalDice }: UseDiceEngineProps) {
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
    handleRollDamage,
    handleRollInitiative,
    executeRollResult
  };
}
