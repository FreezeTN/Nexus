import { CharacterData, SpellSlots } from '../../types';

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
 */
export function calculateProgressionSpellSlots(char: CharacterData): MulticlassSpellSlotProgression {
  const breakdown: string[] = [];
  let totalCasterLevel = 0;
  let warlockLevel = 0;

  const isMulticlass = Boolean(char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass);

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
