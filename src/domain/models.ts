/**
 * Rich Domain Modeling: Dice Expressions, Modifiers & Rule Evaluation
 * 
 * Formalizes:
 * - DiceExpression AST & Evaluation
 * - Typed Modifiers (Flat, Multiplier, Advantage/Disadvantage, Stacking Rules)
 * - Skill Checks & Saving Throws with context
 * - Inventory & Encumbrance domain models
 */

import { AbilityName, CharacterData } from '../types';
import { DomainModifier, ModifierCategory as ModifierType } from './modifierEngine';

export type { DomainModifier, ModifierType };

// ==========================================
// 1. DICE EXPRESSION AST & EVALUATION MODEL
// ==========================================

export type DiceDieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'custom';

export interface DiceTerm {
  readonly count: number;
  readonly dieFaces: number;
  readonly keepHighest?: number;
  readonly keepLowest?: number;
  readonly explodeOn?: number;
  readonly results?: ReadonlyArray<number>;
}

export interface ModifierTerm {
  readonly value: number;
  readonly source: string;
  readonly type: ModifierType;
}

export interface DiceExpression {
  readonly rawFormula: string;
  readonly terms: ReadonlyArray<DiceTerm>;
  readonly flatBonus: number;
  readonly rollMode: 'normal' | 'advantage' | 'disadvantage' | 'pool' | 'percentile';
}

export interface EvaluatedDiceResult {
  readonly formula: string;
  readonly total: number;
  readonly diceRolls: ReadonlyArray<{ die: number; value: number; dropped?: boolean }>;
  readonly modifierTotal: number;
  readonly isNatural20: boolean;
  readonly isNatural1: boolean;
  readonly breakdown: string;
}

// ==========================================
// 2. TYPED MODIFIER STACKING SYSTEM
// ==========================================

// ==========================================
// 3. SKILL CHECK & SAVING THROW CONTEXTS
// ==========================================

export interface DomainSkillCheck {
  readonly skillKey: string;
  readonly ability: AbilityName;
  readonly difficultyClass?: number;
  readonly isProficient: boolean;
  readonly hasExpertise: boolean;
  readonly situationalModifiers: ReadonlyArray<DomainModifier>;
  readonly rollMode?: 'normal' | 'advantage' | 'disadvantage';
}

export interface DomainSavingThrow {
  readonly ability: AbilityName;
  readonly difficultyClass?: number;
  readonly isProficient: boolean;
  readonly spellSchoolResistances?: ReadonlyArray<string>;
  readonly situationalModifiers: ReadonlyArray<DomainModifier>;
}

// ==========================================
// 4. INVENTORY & ENCUMBRANCE DOMAIN MODEL
// ==========================================

export interface DomainItemWeight {
  readonly totalWeightLbs: number;
  readonly encumbranceThresholdLbs: number;
  readonly heavyEncumbranceThresholdLbs: number;
  readonly maxCarryingCapacityLbs: number;
  readonly status: 'unencumbered' | 'encumbered' | 'heavily_encumbered' | 'overburdened';
  readonly speedPenaltyFeet: number;
}

// ==========================================
// 5. RULE EVALUATION ENGINE UTILITIES
// ==========================================

/**
 * Calculates net modifier applying stacking rules (additive, highest_only, lowest_only)
 */
export function calculateStackedModifier(modifiers: ReadonlyArray<DomainModifier>): number {
  const groupedByType = new Map<ModifierType, DomainModifier[]>();

  for (const mod of modifiers) {
    const cat = (mod.category || (mod as any).type || 'custom') as ModifierType;
    const list = groupedByType.get(cat) || [];
    list.push(mod);
    groupedByType.set(cat, list);
  }

  let total = 0;
  for (const [, mods] of groupedByType.entries()) {
    if (mods.length === 0) continue;
    const rule = mods[0].stackingRule;

    if (rule === 'highest_only') {
      const highest = Math.max(...mods.map(m => m.value));
      total += highest;
    } else if (rule === 'lowest_only') {
      const lowest = Math.min(...mods.map(m => m.value));
      total += lowest;
    } else {
      // additive
      total += mods.reduce((acc, m) => acc + m.value, 0);
    }
  }

  return total;
}

/**
 * Parses a simple dice formula string into a structured DiceExpression AST
 */
export function parseDiceExpression(formula: string): DiceExpression {
  const clean = formula.replace(/\s+/g, '').toLowerCase();
  const diceRegex = /([+-]?\d*)d(\d+)/g;
  const terms: DiceTerm[] = [];
  let flatBonus = 0;

  let match: RegExpExecArray | null;
  const replacedFormula = clean.replace(diceRegex, (_, countStr, facesStr) => {
    let count = 1;
    if (countStr === '-' || countStr === '+') {
      count = countStr === '-' ? -1 : 1;
    } else if (countStr) {
      count = parseInt(countStr, 10);
    }
    const dieFaces = parseInt(facesStr, 10);
    terms.push({ count, dieFaces });
    return '';
  });

  // Remaining string is the flat modifier (e.g. +5, -2)
  if (replacedFormula) {
    try {
      const parsedBonus = Function(`"use strict"; return (${replacedFormula || 0})`)();
      if (typeof parsedBonus === 'number' && !isNaN(parsedBonus)) {
        flatBonus = parsedBonus;
      }
    } catch {
      flatBonus = 0;
    }
  }

  return {
    rawFormula: formula,
    terms,
    flatBonus,
    rollMode: 'normal'
  };
}

/**
 * Calculates encumbrance state according to 5e rules
 */
export function calculateDomainEncumbrance(
  strengthScore: number,
  totalCarriedWeight: number
): DomainItemWeight {
  const encumbranceThresholdLbs = strengthScore * 5;
  const heavyEncumbranceThresholdLbs = strengthScore * 10;
  const maxCarryingCapacityLbs = strengthScore * 15;

  let status: DomainItemWeight['status'] = 'unencumbered';
  let speedPenaltyFeet = 0;

  if (totalCarriedWeight > maxCarryingCapacityLbs) {
    status = 'overburdened';
    speedPenaltyFeet = 20;
  } else if (totalCarriedWeight > heavyEncumbranceThresholdLbs) {
    status = 'heavily_encumbered';
    speedPenaltyFeet = 20;
  } else if (totalCarriedWeight > encumbranceThresholdLbs) {
    status = 'encumbered';
    speedPenaltyFeet = 10;
  }

  return {
    totalWeightLbs: totalCarriedWeight,
    encumbranceThresholdLbs,
    heavyEncumbranceThresholdLbs,
    maxCarryingCapacityLbs,
    status,
    speedPenaltyFeet
  };
}
