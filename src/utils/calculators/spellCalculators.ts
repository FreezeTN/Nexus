import { CharacterData } from '../../types';

export function getCombinedLevel(char: CharacterData): number {
  if (char.optionalRules?.useMulticlassing) {
    const secLvl = char.optionalRules.secondaryLevel || 1;
    return char.level + Math.max(1, secLvl);
  }
  return char.level;
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
