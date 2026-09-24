import { CharacterData } from '../../types';
import { getCombinedLevel } from './levelCalculators';
import { getAbilityModifier, getEffectiveAbilities } from './abilityCalculators';

export { getCombinedLevel };

export interface PreparedSpellsDetails {
  isPreparedCaster: boolean;
  isKnownCaster?: boolean;
  maxPrepared: number;
  maxKnown?: number;
  currentPrepared: number;
  currentKnown?: number;
  cantripsCount: number;
  formula: string;
  className: string;
  isOverLimit: boolean;
  notes?: string;
}

export function getRequiredLevelForSpellSlotLevel(slotLevel: number, char: CharacterData): number {
  const cls = (char.characterClass || '').toLowerCase();
  const secCls = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isHalfCaster = cls.includes('paladin') || cls.includes('ranger') || secCls.includes('paladin') || secCls.includes('ranger');
  const isArtificer = cls.includes('artificer') || secCls.includes('artificer');
  const isThirdCaster = cls.includes('knight') || cls.includes('trickster') || secCls.includes('knight') || secCls.includes('trickster');

  if (isHalfCaster) {
    if (slotLevel === 1) return 2;
    if (slotLevel === 2) return 5;
    if (slotLevel === 3) return 9;
    if (slotLevel === 4) return 13;
    if (slotLevel === 5) return 17;
    return 20;
  }

  if (isArtificer) {
    if (slotLevel === 1) return 1;
    if (slotLevel === 2) return 5;
    if (slotLevel === 3) return 9;
    if (slotLevel === 4) return 13;
    if (slotLevel === 5) return 17;
    return 20;
  }

  if (isThirdCaster) {
    if (slotLevel === 1) return 3;
    if (slotLevel === 2) return 7;
    if (slotLevel === 3) return 13;
    if (slotLevel === 4) return 19;
    return 20;
  }

  // Full Caster / Warlock / Standard
  return Math.max(1, (slotLevel * 2) - 1);
}

export function getMaxUnlockedSpellSlotLevel(char: CharacterData): number {
  if (!char.isSpellcaster && (!char.spellSlots || char.spellSlots.length === 0)) {
    return 0;
  }

  const effectiveLevel = getCombinedLevel(char);
  let maxSlotByLevel = 0;

  for (let lvl = 1; lvl <= 9; lvl++) {
    if (effectiveLevel >= getRequiredLevelForSpellSlotLevel(lvl, char)) {
      maxSlotByLevel = lvl;
    } else {
      break;
    }
  }

  // If character has custom spell slots already granted, check the highest level slot with max > 0
  let maxExistingSlotLevel = 0;
  if (char.spellSlots && char.spellSlots.length > 0) {
    char.spellSlots.forEach(s => {
      if (s.max > 0 && s.level > maxExistingSlotLevel) {
        maxExistingSlotLevel = s.level;
      }
    });
  }

  return Math.max(maxSlotByLevel, maxExistingSlotLevel);
}

/**
 * Calculates the Prepared Spells limit according to D&D 5e or D&D 3.5e Rules
 */
export function getPreparedSpellsDetails(char: CharacterData): PreparedSpellsDetails {
  const spells = char.spells || [];
  const leveledSpells = spells.filter(s => s.level > 0);
  const cantrips = spells.filter(s => s.level === 0);
  const currentPrepared = leveledSpells.filter(s => s.prepared).length;
  const cantripsCount = cantrips.length;

  const effectiveAbilities = getEffectiveAbilities(char);
  const cls = (char.characterClass || '').toLowerCase();
  const lvl = char.level || 1;
  const is35e = char.edition === '3.5e';

  // -------------------------------------------------------------
  // D&D 3.5e RULES BRANCH (Vancian Slot Preparation vs Spontaneous)
  // -------------------------------------------------------------
  if (is35e) {
    const is35eSpontaneous = cls.includes('sorcerer') || cls.includes('bard');
    const is35ePrepared = cls.includes('wizard') || cls.includes('cleric') || cls.includes('druid') || cls.includes('paladin') || cls.includes('ranger');

    if (is35ePrepared) {
      // In 3.5e, prepared casters prepare spells directly into their daily slots
      const slots = char.spellSlots || [];
      const totalDailySlots = slots.reduce((sum, s) => sum + (s.max || 0), 0);
      const effectiveLimit = Math.max(1, totalDailySlots);

      return {
        isPreparedCaster: true,
        maxPrepared: effectiveLimit,
        currentPrepared,
        cantripsCount,
        formula: `3.5e Vancian Slots (${totalDailySlots} Daily Spell Slots Allocated)`,
        className: char.characterClass || 'Prepared Caster',
        isOverLimit: currentPrepared > effectiveLimit
      };
    }

    if (is35eSpontaneous) {
      return {
        isPreparedCaster: false,
        maxPrepared: leveledSpells.length,
        currentPrepared,
        cantripsCount,
        formula: '3.5e Spontaneous Caster (All Known Spells Ready)',
        className: char.characterClass || 'Spontaneous Caster',
        isOverLimit: false
      };
    }
  }

  // -------------------------------------------------------------
  // D&D 5e RULES BRANCH
  // -------------------------------------------------------------
  let isPreparedCaster = false;
  let maxPrepared = 0;
  let formula = '';
  let className = char.characterClass || 'Caster';

  if (cls.includes('wizard')) {
    isPreparedCaster = true;
    const intMod = getAbilityModifier(effectiveAbilities.INT?.score || 10);
    maxPrepared = Math.max(1, lvl + intMod);
    formula = `Wizard Level (${lvl}) + INT Mod (${intMod >= 0 ? '+' + intMod : intMod})`;
    className = 'Wizard';
  } else if (cls.includes('cleric')) {
    isPreparedCaster = true;
    const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
    maxPrepared = Math.max(1, lvl + wisMod);
    formula = `Cleric Level (${lvl}) + WIS Mod (${wisMod >= 0 ? '+' + wisMod : wisMod})`;
    className = 'Cleric';
  } else if (cls.includes('druid')) {
    isPreparedCaster = true;
    const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
    maxPrepared = Math.max(1, lvl + wisMod);
    formula = `Druid Level (${lvl}) + WIS Mod (${wisMod >= 0 ? '+' + wisMod : wisMod})`;
    className = 'Druid';
  } else if (cls.includes('paladin')) {
    isPreparedCaster = true;
    const chaMod = getAbilityModifier(effectiveAbilities.CHA?.score || 10);
    maxPrepared = Math.max(1, Math.floor(lvl / 2) + chaMod);
    formula = `½ Paladin Level (${Math.floor(lvl / 2)}) + CHA Mod (${chaMod >= 0 ? '+' + chaMod : chaMod})`;
    className = 'Paladin';
  } else if (cls.includes('artificer')) {
    isPreparedCaster = true;
    const intMod = getAbilityModifier(effectiveAbilities.INT?.score || 10);
    maxPrepared = Math.max(1, Math.floor(lvl / 2) + intMod);
    formula = `½ Artificer Level (${Math.floor(lvl / 2)}) + INT Mod (${intMod >= 0 ? '+' + intMod : intMod})`;
    className = 'Artificer';
  }

  // Handle multiclass secondary class if primary was not a prepared caster
  if (!isPreparedCaster && char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass) {
    const secCls = (char.optionalRules.secondaryClass || '').toLowerCase();
    const secLvl = char.optionalRules.secondaryLevel || 1;

    if (secCls.includes('wizard')) {
      isPreparedCaster = true;
      const intMod = getAbilityModifier(effectiveAbilities.INT?.score || 10);
      maxPrepared = Math.max(1, secLvl + intMod);
      formula = `Wizard Level (${secLvl}) + INT Mod (${intMod >= 0 ? '+' + intMod : intMod})`;
      className = char.optionalRules.secondaryClass;
    } else if (secCls.includes('cleric')) {
      isPreparedCaster = true;
      const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
      maxPrepared = Math.max(1, secLvl + wisMod);
      formula = `Cleric Level (${secLvl}) + WIS Mod (${wisMod >= 0 ? '+' + wisMod : wisMod})`;
      className = char.optionalRules.secondaryClass;
    } else if (secCls.includes('druid')) {
      isPreparedCaster = true;
      const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
      maxPrepared = Math.max(1, secLvl + wisMod);
      formula = `Druid Level (${secLvl}) + WIS Mod (${wisMod >= 0 ? '+' + wisMod : wisMod})`;
      className = char.optionalRules.secondaryClass;
    } else if (secCls.includes('paladin')) {
      isPreparedCaster = true;
      const chaMod = getAbilityModifier(effectiveAbilities.CHA?.score || 10);
      maxPrepared = Math.max(1, Math.floor(secLvl / 2) + chaMod);
      formula = `½ Paladin Level (${Math.floor(secLvl / 2)}) + CHA Mod (${chaMod >= 0 ? '+' + chaMod : chaMod})`;
      className = char.optionalRules.secondaryClass;
    } else if (secCls.includes('artificer')) {
      isPreparedCaster = true;
      const intMod = getAbilityModifier(effectiveAbilities.INT?.score || 10);
      maxPrepared = Math.max(1, Math.floor(secLvl / 2) + intMod);
      formula = `½ Artificer Level (${Math.floor(secLvl / 2)}) + INT Mod (${intMod >= 0 ? '+' + intMod : intMod})`;
      className = char.optionalRules.secondaryClass;
    }
  }

  // -------------------------------------------------------------
  // 5e Spells Known Casters (Sorcerer, Bard, Warlock, Ranger, etc.)
  // -------------------------------------------------------------
  let isKnownCaster = false;
  let maxKnown = 0;
  const currentKnown = leveledSpells.length;

  if (!isPreparedCaster) {
    const sub = (char.subclass || '').toLowerCase();
    const cappedLvl = Math.max(1, Math.min(20, lvl));

    if (cls.includes('bard')) {
      isKnownCaster = true;
      const bardTable = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
      let base = bardTable[cappedLvl - 1] || 4;
      if (sub.includes('lore') && cappedLvl >= 6 && cappedLvl < 10) {
        base += 2; // Additional Magical Secrets (Lore Bard)
      }
      maxKnown = base;
      formula = `5e Bard Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Bard';
    } else if (cls.includes('sorcerer')) {
      isKnownCaster = true;
      const sorcTable = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
      maxKnown = sorcTable[cappedLvl - 1] || 2;
      formula = `5e Sorcerer Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Sorcerer';
    } else if (cls.includes('warlock')) {
      isKnownCaster = true;
      const warlockTable = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
      maxKnown = warlockTable[cappedLvl - 1] || 2;
      formula = `5e Warlock Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Warlock';
    } else if (cls.includes('ranger')) {
      isKnownCaster = true;
      const rangerTable = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
      maxKnown = rangerTable[cappedLvl - 1] || 0;
      formula = `5e Ranger Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Ranger';
    } else if (sub.includes('eldritch knight') || cls.includes('eldritch knight')) {
      isKnownCaster = true;
      const ekTable = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
      maxKnown = ekTable[cappedLvl - 1] || 0;
      formula = `5e Eldritch Knight Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Eldritch Knight';
    } else if (sub.includes('arcane trickster') || cls.includes('arcane trickster')) {
      isKnownCaster = true;
      const atTable = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
      maxKnown = atTable[cappedLvl - 1] || 0;
      formula = `5e Arcane Trickster Table (Level ${cappedLvl}: ${maxKnown} Spells Known)`;
      className = 'Arcane Trickster';
    } else {
      maxPrepared = leveledSpells.length;
      formula = 'All Known Spells Ready';
    }
  }

  return {
    isPreparedCaster,
    isKnownCaster,
    maxPrepared,
    maxKnown: isKnownCaster ? maxKnown : undefined,
    currentPrepared,
    currentKnown: isKnownCaster ? currentKnown : undefined,
    cantripsCount,
    formula,
    className,
    isOverLimit: isPreparedCaster 
      ? currentPrepared > maxPrepared 
      : (isKnownCaster && maxKnown > 0 ? currentKnown > maxKnown : false)
  };
}

