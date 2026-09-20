import { CharacterData, SpellSlots, AbilityName } from '../../types';
import { getEffectiveAbilities, getAbilityModifier } from './abilityCalculators';

export interface MulticlassSpellSlotProgression {
  casterLevel: number;
  isMulticlass: boolean;
  slots: Record<number, number>; // level 1-9
  pactMagic?: {
    slotLevel: number;
    slotsCount: number;
    warlockLevel: number;
  };
  breakdown: string[];
}

/**
 * Standard D&D 5e Spell Slot Table by Caster Level (1 to 20)
 * Index is caster level (1-20). Array is slots for [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
 */
export const DND_5E_SPELL_SLOT_TABLE: Record<number, number[]> = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
};

/**
 * Standard D&D 3.5e Wizard / Cleric / Druid Spells Per Day (PHB Tables 3-6, 3-8, 3-18)
 * (Levels 1-9; 0-level orisons/cantrips omitted from 1-9 slot tracker)
 */
export const DND_35E_WIZARD_CLERIC_DRUID_TABLE: Record<number, number[]> = {
  1:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [2, 1, 0, 0, 0, 0, 0, 0, 0],
  4:  [3, 2, 0, 0, 0, 0, 0, 0, 0],
  5:  [3, 2, 1, 0, 0, 0, 0, 0, 0],
  6:  [3, 3, 2, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 2, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 4, 3, 2, 1, 0, 0, 0, 0],
  10: [4, 4, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 4, 4, 3, 2, 1, 0, 0, 0],
  12: [4, 4, 4, 3, 3, 2, 0, 0, 0],
  13: [4, 4, 4, 4, 3, 2, 1, 0, 0],
  14: [4, 4, 4, 4, 3, 3, 2, 0, 0],
  15: [4, 4, 4, 4, 4, 3, 2, 1, 0],
  16: [4, 4, 4, 4, 4, 3, 3, 2, 0],
  17: [4, 4, 4, 4, 4, 4, 3, 2, 1],
  18: [4, 4, 4, 4, 4, 4, 3, 3, 2],
  19: [4, 4, 4, 4, 4, 4, 4, 3, 3],
  20: [4, 4, 4, 4, 4, 4, 4, 4, 4]
};

/**
 * Standard D&D 3.5e Sorcerer Spells Per Day (PHB Table 3-16)
 */
export const DND_35E_SORCERER_TABLE: Record<number, number[]> = {
  1:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [4, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [5, 0, 0, 0, 0, 0, 0, 0, 0],
  4:  [6, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [6, 4, 0, 0, 0, 0, 0, 0, 0],
  6:  [6, 5, 3, 0, 0, 0, 0, 0, 0],
  7:  [6, 6, 4, 0, 0, 0, 0, 0, 0],
  8:  [6, 6, 5, 3, 0, 0, 0, 0, 0],
  9:  [6, 6, 6, 4, 0, 0, 0, 0, 0],
  10: [6, 6, 6, 5, 3, 0, 0, 0, 0],
  11: [6, 6, 6, 6, 4, 0, 0, 0, 0],
  12: [6, 6, 6, 6, 5, 3, 0, 0, 0],
  13: [6, 6, 6, 6, 6, 4, 0, 0, 0],
  14: [6, 6, 6, 6, 6, 5, 3, 0, 0],
  15: [6, 6, 6, 6, 6, 6, 4, 0, 0],
  16: [6, 6, 6, 6, 6, 6, 5, 3, 0],
  17: [6, 6, 6, 6, 6, 6, 6, 4, 0],
  18: [6, 6, 6, 6, 6, 6, 6, 5, 3],
  19: [6, 6, 6, 6, 6, 6, 6, 6, 4],
  20: [6, 6, 6, 6, 6, 6, 6, 6, 6]
};

/**
 * Standard D&D 3.5e Bard Spells Per Day (PHB Table 3-4)
 * Note: A 0 entry indicates 0 base slots, but can cast if bonus spells from high CHA apply.
 */
export const DND_35E_BARD_TABLE: Record<number, number[]> = {
  1:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  4:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  5:  [3, 1, 0, 0, 0, 0, 0, 0, 0],
  6:  [3, 2, 0, 0, 0, 0, 0, 0, 0],
  7:  [3, 2, 0, 0, 0, 0, 0, 0, 0],
  8:  [3, 3, 1, 0, 0, 0, 0, 0, 0],
  9:  [3, 3, 2, 0, 0, 0, 0, 0, 0],
  10: [3, 3, 2, 0, 0, 0, 0, 0, 0],
  11: [3, 3, 3, 1, 0, 0, 0, 0, 0],
  12: [3, 3, 3, 2, 0, 0, 0, 0, 0],
  13: [3, 3, 3, 2, 0, 0, 0, 0, 0],
  14: [3, 3, 3, 3, 1, 0, 0, 0, 0],
  15: [3, 3, 3, 3, 2, 0, 0, 0, 0],
  16: [3, 3, 3, 3, 2, 0, 0, 0, 0],
  17: [3, 3, 3, 3, 3, 1, 0, 0, 0],
  18: [3, 3, 3, 3, 3, 2, 0, 0, 0],
  19: [3, 3, 3, 3, 3, 3, 0, 0, 0],
  20: [3, 3, 3, 3, 3, 3, 0, 0, 0]
};

/**
 * Standard D&D 3.5e Paladin / Ranger Spells Per Day (PHB Tables 3-12, 3-14)
 * Spellcasting begins at class level 4.
 */
export const DND_35E_PALADIN_RANGER_TABLE: Record<number, number[]> = {
  1:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  4:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  5:  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  6:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  7:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  8:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  9:  [1, 0, 0, 0, 0, 0, 0, 0, 0],
  10: [1, 1, 0, 0, 0, 0, 0, 0, 0],
  11: [1, 1, 0, 0, 0, 0, 0, 0, 0],
  12: [1, 1, 1, 0, 0, 0, 0, 0, 0],
  13: [1, 1, 1, 0, 0, 0, 0, 0, 0],
  14: [2, 1, 1, 0, 0, 0, 0, 0, 0],
  15: [2, 1, 1, 1, 0, 0, 0, 0, 0],
  16: [2, 2, 1, 1, 0, 0, 0, 0, 0],
  17: [2, 2, 2, 1, 0, 0, 0, 0, 0],
  18: [3, 2, 2, 1, 0, 0, 0, 0, 0],
  19: [3, 3, 3, 2, 0, 0, 0, 0, 0],
  20: [3, 3, 3, 3, 0, 0, 0, 0, 0]
};

/**
 * Calculates 3.5e bonus spells per day from high ability score (PHB Table 1-1).
 * In 3.5e, an ability modifier >= spell level grants Math.floor((mod - spellLevel) / 4) + 1 bonus spells,
 * provided the character is high enough level to cast spells of that level.
 */
export function get35eBonusSpellsForMod(mod: number, maxCastableLevel: number): Record<number, number> {
  const bonus: Record<number, number> = {};
  for (let lvl = 1; lvl <= 9; lvl++) {
    if (lvl <= maxCastableLevel && mod >= lvl) {
      bonus[lvl] = Math.floor((mod - lvl) / 4) + 1;
    } else {
      bonus[lvl] = 0;
    }
  }
  return bonus;
}

/**
 * Retrieves 3.5e spellcasting configuration for a class.
 */
export function get35eClassSpellInfo(className: string): {
  table: Record<number, number[]> | null;
  keyAbility: AbilityName;
  maxSpellLevel: number;
  minCastingLevel: number;
  isSpontaneous: boolean;
} {
  const cls = (className || '').toLowerCase();
  if (cls.includes('sorcerer')) {
    return { table: DND_35E_SORCERER_TABLE, keyAbility: 'CHA', maxSpellLevel: 9, minCastingLevel: 1, isSpontaneous: true };
  }
  if (cls.includes('bard')) {
    return { table: DND_35E_BARD_TABLE, keyAbility: 'CHA', maxSpellLevel: 6, minCastingLevel: 1, isSpontaneous: true };
  }
  if (cls.includes('paladin')) {
    return { table: DND_35E_PALADIN_RANGER_TABLE, keyAbility: 'WIS', maxSpellLevel: 4, minCastingLevel: 4, isSpontaneous: false };
  }
  if (cls.includes('ranger')) {
    return { table: DND_35E_PALADIN_RANGER_TABLE, keyAbility: 'WIS', maxSpellLevel: 4, minCastingLevel: 4, isSpontaneous: false };
  }
  if (cls.includes('wizard')) {
    return { table: DND_35E_WIZARD_CLERIC_DRUID_TABLE, keyAbility: 'INT', maxSpellLevel: 9, minCastingLevel: 1, isSpontaneous: false };
  }
  if (cls.includes('cleric') || cls.includes('druid')) {
    return { table: DND_35E_WIZARD_CLERIC_DRUID_TABLE, keyAbility: 'WIS', maxSpellLevel: 9, minCastingLevel: 1, isSpontaneous: false };
  }

  // Non-caster by default
  return { table: null, keyAbility: 'INT', maxSpellLevel: 0, minCastingLevel: 99, isSpontaneous: false };
}

/**
 * Calculates Caster Contribution for a given class, subclass, and level.
 */
export function getClassCasterContribution(className: string, subclass: string, level: number): { contribution: number; isWarlock: boolean; reason: string } {
  const cls = (className || '').toLowerCase();
  const sub = (subclass || '').toLowerCase();
  const lvl = Math.max(1, level);

  // Warlock uses Pact Magic separately
  if (cls.includes('warlock')) {
    return { contribution: 0, isWarlock: true, reason: `Warlock ${lvl} (Pact Magic)` };
  }

  // Full Casters (100% level)
  if (cls.includes('wizard') || cls.includes('cleric') || cls.includes('druid') || cls.includes('sorcerer') || cls.includes('bard')) {
    return { contribution: lvl, isWarlock: false, reason: `${className} ${lvl} (Full Caster: +${lvl})` };
  }

  // Artificer (50% level rounded UP)
  if (cls.includes('artificer')) {
    const contrib = Math.ceil(lvl / 2);
    return { contribution: contrib, isWarlock: false, reason: `Artificer ${lvl} (Half Caster Round-Up: +${contrib})` };
  }

  // Half Casters (50% level rounded DOWN)
  if (cls.includes('paladin') || cls.includes('ranger')) {
    const contrib = Math.floor(lvl / 2);
    return { contribution: contrib, isWarlock: false, reason: `${className} ${lvl} (Half Caster: +${contrib})` };
  }

  // Third Casters (33% level rounded DOWN if subclass matches Eldritch Knight or Arcane Trickster)
  if (sub.includes('eldritch knight') || sub.includes('arcane trickster') || cls.includes('trickster') || cls.includes('knight')) {
    const contrib = Math.floor(lvl / 3);
    return { contribution: contrib, isWarlock: false, reason: `${subclass || className} ${lvl} (Third Caster: +${contrib})` };
  }

  return { contribution: 0, isWarlock: false, reason: `${className} (Non-Caster: +0)` };
}

/**
 * Calculates Warlock Pact Magic slot level and count.
 */
export function getWarlockPactMagic(warlockLevel: number): { slotLevel: number; slotsCount: number } {
  if (warlockLevel <= 0) return { slotLevel: 0, slotsCount: 0 };
  
  let slotLevel = 1;
  if (warlockLevel >= 9) slotLevel = 5;
  else if (warlockLevel >= 7) slotLevel = 4;
  else if (warlockLevel >= 5) slotLevel = 3;
  else if (warlockLevel >= 3) slotLevel = 2;

  let slotsCount = 1;
  if (warlockLevel >= 17) slotsCount = 4;
  else if (warlockLevel >= 11) slotsCount = 3;
  else if (warlockLevel >= 2) slotsCount = 2;

  return { slotLevel, slotsCount };
}

/**
 * Computes standard multiclass spell slots and pact magic for any character.
 * Supports D&D 3.5e (individual class progression + high ability bonus spells)
 * and D&D 5e (unified multiclass caster level progression + Pact Magic).
 */
export function calculateProgressionSpellSlots(char: CharacterData): MulticlassSpellSlotProgression {
  const breakdown: string[] = [];
  const isMulticlass = Boolean(char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass);
  const is35e = char.edition === '3.5e';

  // -------------------------------------------------------------
  // D&D 3.5e RULES BRANCH
  // -------------------------------------------------------------
  if (is35e) {
    const effectiveAbilities = getEffectiveAbilities(char);
    const slots: Record<number, number> = {};
    for (let lvl = 1; lvl <= 9; lvl++) {
      slots[lvl] = 0;
    }

    let primaryCasterLevel = 0;
    let secondaryCasterLevel = 0;

    // Primary Class
    const primaryName = char.characterClass || 'Adventurer';
    const primaryLvl = Math.max(1, char.level || 1);
    const pInfo = get35eClassSpellInfo(primaryName);

    if (pInfo.table && primaryLvl >= pInfo.minCastingLevel) {
      primaryCasterLevel = primaryLvl;
      const baseRow = pInfo.table[Math.min(20, primaryLvl)] || [];
      const score = effectiveAbilities[pInfo.keyAbility]?.score || 10;
      const mod = getAbilityModifier(score);

      // Find highest spell level this class can cast
      let maxCastable = 0;
      for (let i = 0; i < baseRow.length; i++) {
        const spellLvl = i + 1;
        // In 3.5e, can cast if base > 0, OR base === 0 and has bonus spell from ability (e.g. Bard 1 or Paladin 4)
        if (baseRow[i] > 0 || (baseRow[i] === 0 && mod >= spellLvl && spellLvl <= pInfo.maxSpellLevel)) {
          maxCastable = Math.max(maxCastable, spellLvl);
        }
      }

      const bonus = get35eBonusSpellsForMod(mod, maxCastable);
      const classSlots: number[] = [];

      for (let lvl = 1; lvl <= 9; lvl++) {
        const base = baseRow[lvl - 1] || 0;
        const b = bonus[lvl] || 0;
        const total = base + b;
        slots[lvl] += total;
        if (lvl <= (maxCastable || pInfo.maxSpellLevel)) {
          classSlots.push(total);
        }
      }

      breakdown.push(
        `${primaryName} ${primaryLvl} (CL ${primaryLvl}, ${pInfo.keyAbility} ${score} / ${mod >= 0 ? '+' + mod : mod}): Daily Spells ${classSlots.length > 0 ? `[${classSlots.join(', ')}]` : '[0]'}`
      );
    } else if (pInfo.table && primaryLvl < pInfo.minCastingLevel) {
      breakdown.push(`${primaryName} ${primaryLvl}: Spellcasting begins at Level ${pInfo.minCastingLevel}`);
    } else {
      breakdown.push(`${primaryName} ${primaryLvl}: Non-Caster (+0)`);
    }

    // Secondary Class if Multiclassing enabled in 3.5e
    if (isMulticlass && char.optionalRules?.secondaryClass) {
      const secName = char.optionalRules.secondaryClass;
      const secLvl = Math.max(1, char.optionalRules.secondaryLevel || 1);
      const sInfo = get35eClassSpellInfo(secName);

      if (sInfo.table && secLvl >= sInfo.minCastingLevel) {
        secondaryCasterLevel = secLvl;
        const baseRow = sInfo.table[Math.min(20, secLvl)] || [];
        const score = effectiveAbilities[sInfo.keyAbility]?.score || 10;
        const mod = getAbilityModifier(score);

        let maxCastable = 0;
        for (let i = 0; i < baseRow.length; i++) {
          const spellLvl = i + 1;
          if (baseRow[i] > 0 || (baseRow[i] === 0 && mod >= spellLvl && spellLvl <= sInfo.maxSpellLevel)) {
            maxCastable = Math.max(maxCastable, spellLvl);
          }
        }

        const bonus = get35eBonusSpellsForMod(mod, maxCastable);
        const classSlots: number[] = [];

        for (let lvl = 1; lvl <= 9; lvl++) {
          const base = baseRow[lvl - 1] || 0;
          const b = bonus[lvl] || 0;
          const total = base + b;
          slots[lvl] += total;
          if (lvl <= (maxCastable || sInfo.maxSpellLevel)) {
            classSlots.push(total);
          }
        }

        breakdown.push(
          `${secName} ${secLvl} (CL ${secLvl}, ${sInfo.keyAbility} ${score} / ${mod >= 0 ? '+' + mod : mod}): Daily Spells ${classSlots.length > 0 ? `[${classSlots.join(', ')}]` : '[0]'}`
        );
      } else if (sInfo.table && secLvl < sInfo.minCastingLevel) {
        breakdown.push(`${secName} ${secLvl}: Spellcasting begins at Level ${sInfo.minCastingLevel}`);
      } else {
        breakdown.push(`${secName} ${secLvl}: Non-Caster (+0)`);
      }
    }

    if (isMulticlass) {
      breakdown.unshift('D&D 3.5e Multiclassing RAW: Spell slots do not combine into a unified pool; each class provides independent spells per day and bonus slots.');
    }

    return {
      casterLevel: primaryCasterLevel || secondaryCasterLevel,
      isMulticlass,
      slots,
      breakdown
    };
  }

  // -------------------------------------------------------------
  // D&D 5e RULES BRANCH
  // -------------------------------------------------------------
  let totalCasterLevel = 0;
  let warlockLevel = 0;

  // Primary Class
  const primaryName = char.characterClass || 'Adventurer';
  const primarySub = char.subclass || '';
  const primaryLvl = char.level || 1;
  const pContrib = getClassCasterContribution(primaryName, primarySub, primaryLvl);

  if (pContrib.isWarlock) {
    warlockLevel += primaryLvl;
    breakdown.push(pContrib.reason);
  } else if (pContrib.contribution > 0) {
    totalCasterLevel += pContrib.contribution;
    breakdown.push(pContrib.reason);
  }

  // Secondary Class if Multiclassing enabled
  if (isMulticlass && char.optionalRules?.secondaryClass) {
    const secName = char.optionalRules.secondaryClass;
    const secSub = char.optionalRules.secondarySubclass || '';
    const secLvl = char.optionalRules.secondaryLevel || 1;
    const sContrib = getClassCasterContribution(secName, secSub, secLvl);

    if (sContrib.isWarlock) {
      warlockLevel += secLvl;
      breakdown.push(sContrib.reason);
    } else if (sContrib.contribution > 0) {
      totalCasterLevel += sContrib.contribution;
      breakdown.push(sContrib.reason);
    }
  }

  const effectiveCasterLevel = Math.min(20, Math.max(0, totalCasterLevel));
  const standardSlotsArray = effectiveCasterLevel > 0 ? (DND_5E_SPELL_SLOT_TABLE[effectiveCasterLevel] || []) : [];

  const slots: Record<number, number> = {};
  for (let lvl = 1; lvl <= 9; lvl++) {
    slots[lvl] = standardSlotsArray[lvl - 1] || 0;
  }

  let pactMagic: MulticlassSpellSlotProgression['pactMagic'] = undefined;
  if (warlockLevel > 0) {
    const pact = getWarlockPactMagic(warlockLevel);
    pactMagic = {
      slotLevel: pact.slotLevel,
      slotsCount: pact.slotsCount,
      warlockLevel
    };
    breakdown.push(`Pact Magic: ${pact.slotsCount} × Level ${pact.slotLevel} Slots (Short Rest Recharge)`);
  }

  return {
    casterLevel: effectiveCasterLevel,
    isMulticlass,
    slots,
    pactMagic,
    breakdown
  };
}

/**
 * Returns an updated array of SpellSlot objects corresponding to the character's calculated class progression.
 */
export function generateProgressionSpellSlots(char: CharacterData): SpellSlots[] {
  const progression = calculateProgressionSpellSlots(char);
  const existingSlots = char.spellSlots || [];

  const result: SpellSlots[] = [];

  for (let lvl = 1; lvl <= 9; lvl++) {
    const maxStandard = progression.slots[lvl] || 0;
    let maxPact = 0;
    if (progression.pactMagic && progression.pactMagic.slotLevel === lvl) {
      maxPact = progression.pactMagic.slotsCount;
    }
    const totalMax = maxStandard + maxPact;

    const existing = existingSlots.find(s => s.level === lvl);
    result.push({
      level: lvl,
      max: totalMax,
      current: existing ? Math.min(totalMax, existing.current) : totalMax
    });
  }

  return result;
}
