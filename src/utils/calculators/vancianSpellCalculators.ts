/**
 * D&D 3.5e Vancian Spell Preparation & Domain Slot Calculator Engine
 * Handles exact slot allocation, bonus ability slots, domain slots, specialist slots,
 * and spontaneous conversions (Cure/Inflict and Summon Nature's Ally).
 */

import { CharacterData, Spell } from '../../types';
import { getEffectiveAbilities, getAbilityModifier } from './abilityCalculators';
import { find35eClassRule } from '../rules/dnd35eClassesRules';

export interface VancianSlotAllocation {
  id: string;
  level: number; // 0 for Cantrips/Orisons, 1-9 for spell levels
  slotIndex: number;
  slotType: 'standard' | 'domain' | 'specialist';
  spellId?: string;
  spellName?: string;
  isExpended: boolean;
  notes?: string;
}

export interface VancianLevelSummary {
  level: number;
  levelLabel: string;
  baseSlots: number;
  bonusSlots: number;
  domainSlots: number;
  specialistSlots: number;
  totalSlots: number;
  slots: VancianSlotAllocation[];
  preparedCount: number;
  expendedCount: number;
}

export interface VancianPreparationBreakdown {
  isVancianPreparedCaster: boolean;
  className: string;
  keyAbility: 'INT' | 'WIS' | 'CHA';
  keyAbilityScore: number;
  keyAbilityMod: number;
  totalDailySlots: number;
  totalPrepared: number;
  totalExpended: number;
  levels: VancianLevelSummary[];
  hasDomainSlots: boolean;
  hasSpecialistSlots: boolean;
  spontaneousConversion: 'cure_or_inflict' | 'summon_nature' | 'none';
}

/**
 * Calculates 3.5e bonus spell slots per day from a high ability score (PHB Table 1-1)
 */
export function get35eAbilityBonusSlots(abilityScore: number, spellLevel: number): number {
  if (spellLevel <= 0 || spellLevel > 9) return 0;
  const mod = getAbilityModifier(abilityScore);
  if (mod < spellLevel) return 0;
  return Math.floor((mod - spellLevel) / 4) + 1;
}

/**
 * Base spell slots per day by class and level in D&D 3.5e
 */
const CLERIC_BASE_SLOTS: number[][] = [
  // Lvl: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  [3, 1],                         // 1
  [4, 2],                         // 2
  [4, 2, 1],                      // 3
  [5, 3, 2],                      // 4
  [5, 3, 2, 1],                   // 5
  [5, 3, 3, 2],                   // 6
  [6, 4, 3, 2, 1],                // 7
  [6, 4, 3, 3, 2],                // 8
  [6, 4, 4, 3, 2, 1],             // 9
  [6, 4, 4, 3, 3, 2],             // 10
  [6, 5, 4, 4, 3, 2, 1],          // 11
  [6, 5, 4, 4, 3, 3, 2],          // 12
  [6, 5, 5, 4, 4, 3, 2, 1],       // 13
  [6, 5, 5, 4, 4, 3, 3, 2],       // 14
  [6, 5, 5, 5, 4, 4, 3, 2, 1],    // 15
  [6, 5, 5, 5, 4, 4, 3, 3, 2],    // 16
  [6, 5, 5, 5, 5, 4, 4, 3, 2, 1], // 17
  [6, 5, 5, 5, 5, 4, 4, 3, 3, 2], // 18
  [6, 5, 5, 5, 5, 5, 4, 4, 3, 3], // 19
  [6, 5, 5, 5, 5, 5, 4, 4, 4, 4], // 20
];

const WIZARD_BASE_SLOTS: number[][] = [
  [3, 1],
  [4, 2],
  [4, 2, 1],
  [4, 3, 2],
  [4, 3, 2, 1],
  [4, 3, 3, 2],
  [4, 4, 3, 2, 1],
  [4, 4, 3, 3, 2],
  [4, 4, 4, 3, 2, 1],
  [4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 3, 2, 1],
  [4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 3, 2, 1],
  [4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 3, 2, 1],
  [4, 4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
  [4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 4, 4, 3, 3],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
];

const DRUID_BASE_SLOTS = CLERIC_BASE_SLOTS;

const PALADIN_RANGER_BASE_SLOTS: number[][] = [
  [], [], [],                     // Levels 1-3: no casting
  [0, 0],                         // 4: 0 1st (requires bonus slot to cast)
  [0, 0],                         // 5
  [0, 1],                         // 6
  [0, 1],                         // 7
  [0, 1, 0],                      // 8
  [0, 1, 0],                      // 9
  [0, 1, 1],                      // 10
  [0, 1, 1, 0],                   // 11
  [0, 1, 1, 1],                   // 12
  [0, 1, 1, 1],                   // 13
  [0, 2, 1, 1, 0],                // 14
  [0, 2, 1, 1, 1],                // 15
  [0, 2, 2, 1, 1],                // 16
  [0, 2, 2, 2, 1],                // 17
  [0, 3, 2, 2, 1],                // 18
  [0, 3, 3, 3, 2],                // 19
  [0, 3, 3, 3, 3],                // 20
];

/**
 * Returns raw base slots array for a class and level
 */
export function get35eBaseSlotsTable(className: string, level: number): number[] {
  const lvl = Math.min(20, Math.max(1, level || 1));
  const lower = className.toLowerCase();

  if (lower.includes('wizard')) return WIZARD_BASE_SLOTS[lvl - 1] || [];
  if (lower.includes('cleric')) return CLERIC_BASE_SLOTS[lvl - 1] || [];
  if (lower.includes('druid')) return DRUID_BASE_SLOTS[lvl - 1] || [];
  if (lower.includes('paladin') || lower.includes('ranger')) return PALADIN_RANGER_BASE_SLOTS[lvl - 1] || [];

  return WIZARD_BASE_SLOTS[lvl - 1] || [];
}

/**
 * Generates the full Vancian slot breakdown for a character
 */
export function calculateVancianBreakdown(character: CharacterData): VancianPreparationBreakdown {
  const clsName = character.characterClass || '';
  const rule = find35eClassRule(clsName);
  const is35e = character.edition === '3.5e';

  const isPrepared =
    is35e &&
    (rule?.castingType === 'vancian_divine' ||
      rule?.castingType === 'vancian_arcane' ||
      clsName.toLowerCase().includes('wizard') ||
      clsName.toLowerCase().includes('cleric') ||
      clsName.toLowerCase().includes('druid') ||
      clsName.toLowerCase().includes('paladin') ||
      clsName.toLowerCase().includes('ranger'));

  const keyAbility: 'INT' | 'WIS' | 'CHA' =
    rule?.spellAbility ||
    (clsName.toLowerCase().includes('wizard') ? 'INT' : 'WIS');

  const abilities = getEffectiveAbilities(character);
  const keyScore = abilities[keyAbility]?.score || 10;
  const keyMod = getAbilityModifier(keyScore);

  if (!isPrepared) {
    return {
      isVancianPreparedCaster: false,
      className: clsName,
      keyAbility,
      keyAbilityScore: keyScore,
      keyAbilityMod: keyMod,
      totalDailySlots: 0,
      totalPrepared: 0,
      totalExpended: 0,
      levels: [],
      hasDomainSlots: false,
      hasSpecialistSlots: false,
      spontaneousConversion: 'none'
    };
  }

  const level = character.level || 1;
  const baseTable = get35eBaseSlotsTable(clsName, level);

  const hasDomain = Boolean(
    rule?.hasDomainSlots || clsName.toLowerCase().includes('cleric')
  );
  const isSpecialist = Boolean(
    (character.wizardSchool35e?.specialization && character.wizardSchool35e.specialization !== 'Universal') ||
    character.characterClass?.toLowerCase().includes('specialist') ||
    character.characterClass?.toLowerCase().includes('evoker') ||
    character.characterClass?.toLowerCase().includes('conjurer') ||
    character.characterClass?.toLowerCase().includes('transmuter')
  );

  const spontaneousType: 'cure_or_inflict' | 'summon_nature' | 'none' =
    clsName.toLowerCase().includes('cleric')
      ? 'cure_or_inflict'
      : clsName.toLowerCase().includes('druid')
      ? 'summon_nature'
      : 'none';

  // Read saved allocated slots from character or initialize
  const existingAllocations: VancianSlotAllocation[] = (character as any).vancianSlots || [];

  const levels: VancianLevelSummary[] = [];
  let totalDailySlots = 0;
  let totalPrepared = 0;
  let totalExpended = 0;

  for (let lvlIndex = 0; lvlIndex < baseTable.length; lvlIndex++) {
    const rawBase = baseTable[lvlIndex];
    if (rawBase === undefined) continue;

    const bonusSlots = lvlIndex > 0 ? get35eAbilityBonusSlots(keyScore, lvlIndex) : 0;
    const canCastLevel = rawBase > 0 || (rawBase === 0 && bonusSlots > 0);

    if (!canCastLevel) continue;

    const baseSlots = rawBase;
    const domainSlots = hasDomain && lvlIndex > 0 ? 1 : 0;
    const specialistSlots = isSpecialist && lvlIndex > 0 ? 1 : 0;

    const levelTotal = baseSlots + bonusSlots + domainSlots + specialistSlots;
    totalDailySlots += levelTotal;

    // Collect or generate individual slot allocations for this level
    const levelSlots: VancianSlotAllocation[] = [];

    // 1. Standard slots
    const standardCount = baseSlots + bonusSlots;
    for (let i = 0; i < standardCount; i++) {
      const slotId = `vancian-lvl${lvlIndex}-std-${i}`;
      const found = existingAllocations.find((a) => a.id === slotId);
      const slotItem: VancianSlotAllocation = found || {
        id: slotId,
        level: lvlIndex,
        slotIndex: i,
        slotType: 'standard',
        isExpended: false
      };
      if (slotItem.spellName) totalPrepared++;
      if (slotItem.isExpended) totalExpended++;
      levelSlots.push(slotItem);
    }

    // 2. Domain slot
    if (domainSlots > 0) {
      const slotId = `vancian-lvl${lvlIndex}-domain-0`;
      const found = existingAllocations.find((a) => a.id === slotId);
      const slotItem: VancianSlotAllocation = found || {
        id: slotId,
        level: lvlIndex,
        slotIndex: 0,
        slotType: 'domain',
        isExpended: false
      };
      if (slotItem.spellName) totalPrepared++;
      if (slotItem.isExpended) totalExpended++;
      levelSlots.push(slotItem);
    }

    // 3. Specialist slot
    if (specialistSlots > 0) {
      const slotId = `vancian-lvl${lvlIndex}-specialist-0`;
      const found = existingAllocations.find((a) => a.id === slotId);
      const slotItem: VancianSlotAllocation = found || {
        id: slotId,
        level: lvlIndex,
        slotIndex: 0,
        slotType: 'specialist',
        isExpended: false
      };
      if (slotItem.spellName) totalPrepared++;
      if (slotItem.isExpended) totalExpended++;
      levelSlots.push(slotItem);
    }

    levels.push({
      level: lvlIndex,
      levelLabel: lvlIndex === 0 ? 'Orisons / Cantrips' : `Level ${lvlIndex}`,
      baseSlots,
      bonusSlots,
      domainSlots,
      specialistSlots,
      totalSlots: levelTotal,
      slots: levelSlots,
      preparedCount: levelSlots.filter((s) => Boolean(s.spellName)).length,
      expendedCount: levelSlots.filter((s) => s.isExpended).length
    });
  }

  return {
    isVancianPreparedCaster: true,
    className: clsName,
    keyAbility,
    keyAbilityScore: keyScore,
    keyAbilityMod: keyMod,
    totalDailySlots,
    totalPrepared,
    totalExpended,
    levels,
    hasDomainSlots: hasDomain,
    hasSpecialistSlots: isSpecialist,
    spontaneousConversion: spontaneousType
  };
}

/**
 * Spontaneous spells available for Cleric conversion (Cure / Inflict)
 */
export const CLERIC_CURE_SPELLS: Record<number, string> = {
  0: 'Cure Minor Wounds',
  1: 'Cure Light Wounds',
  2: 'Cure Moderate Wounds',
  3: 'Cure Serious Wounds',
  4: 'Cure Critical Wounds',
  5: 'Mass Cure Light Wounds',
  6: 'Heal',
  7: 'Mass Cure Moderate Wounds',
  8: 'Mass Cure Serious Wounds',
  9: 'Mass Cure Critical Wounds'
};

export const CLERIC_INFLICT_SPELLS: Record<number, string> = {
  0: 'Inflict Minor Wounds',
  1: 'Inflict Light Wounds',
  2: 'Inflict Moderate Wounds',
  3: 'Inflict Serious Wounds',
  4: 'Inflict Critical Wounds',
  5: 'Mass Inflict Light Wounds',
  6: 'Harm',
  7: 'Mass Inflict Moderate Wounds',
  8: 'Mass Inflict Serious Wounds',
  9: 'Mass Inflict Critical Wounds'
};

/**
 * Spontaneous spells available for Druid conversion (Summon Nature's Ally I - IX)
 */
export const DRUID_SUMMON_SPELLS: Record<number, string> = {
  1: "Summon Nature's Ally I",
  2: "Summon Nature's Ally II",
  3: "Summon Nature's Ally III",
  4: "Summon Nature's Ally IV",
  5: "Summon Nature's Ally V",
  6: "Summon Nature's Ally VI",
  7: "Summon Nature's Ally VII",
  8: "Summon Nature's Ally VIII",
  9: "Summon Nature's Ally IX"
};

/**
 * Restores all expended Vancian slots during a long rest
 */
export function restAndRestoreVancianSlots(slots: VancianSlotAllocation[]): VancianSlotAllocation[] {
  return slots.map((s) => ({
    ...s,
    isExpended: false
  }));
}
