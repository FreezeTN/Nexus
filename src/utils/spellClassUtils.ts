import { CharacterData, Spell } from '../types';

export interface SpellEligibilityResult {
  isClassMatch: boolean;
  reqSpellLevel: number;
  minClassLevelRequired: number;
  isLevelMet: boolean;
  matchedClassKey?: string;
  statusText: string;
  badgeStyle: 'green' | 'amber' | 'stone' | 'red';
}

/**
 * Calculates the minimum class level required in 3.5e to cast a spell of a given spell level.
 */
export function getMinClassLevelForSpellLevel(className: string, spellLevel: number): number {
  if (spellLevel <= 0) return 1;

  const lower = className.toLowerCase();
  
  // Paladin / Ranger: 1st at Lvl 4, 2nd at Lvl 8, 3rd at Lvl 11, 4th at Lvl 14
  if (lower.includes('paladin') || lower.includes('pal') || lower.includes('ranger') || lower.includes('rgr')) {
    if (spellLevel === 1) return 4;
    if (spellLevel === 2) return 8;
    if (spellLevel === 3) return 11;
    if (spellLevel === 4) return 14;
    return 15;
  }

  // Bard: 1st at Lvl 1, 2nd at Lvl 4, 3rd at Lvl 7, 4th at Lvl 10, 5th at Lvl 13, 6th at Lvl 16
  if (lower.includes('bard') || lower.includes('brd')) {
    if (spellLevel === 1) return 1;
    if (spellLevel === 2) return 4;
    if (spellLevel === 3) return 7;
    if (spellLevel === 4) return 10;
    if (spellLevel === 5) return 13;
    if (spellLevel === 6) return 16;
    return 17;
  }

  // Sorcerer: 1st at Lvl 1, 2nd at Lvl 4, 3rd at Lvl 6, 4th at Lvl 8, 5th at Lvl 10, 6th at Lvl 12, 7th at Lvl 14, 8th at Lvl 16, 9th at Lvl 18
  if (lower.includes('sorcerer') || lower.includes('sor')) {
    if (spellLevel === 1) return 1;
    return (spellLevel - 1) * 2 + 2; // Lvl 4, 6, 8, 10, 12, 14, 16, 18
  }

  // Standard full casters: Wizard, Cleric, Druid
  // 1st: Lvl 1, 2nd: Lvl 3, 3rd: Lvl 5, 4th: Lvl 7, 5th: Lvl 9, 6th: Lvl 11, 7th: Lvl 13, 8th: Lvl 15, 9th: Lvl 17
  return (spellLevel - 1) * 2 + 1;
}

/**
 * Checks whether a character meets the class and level requirements to learn/cast a spell.
 */
export function checkSpellEligibility(character: CharacterData, spell: Partial<Spell>): SpellEligibilityResult {
  const charClass = (character.characterClass || 'Adventurer').trim();
  const charLevel = character.level || 1;
  const spellLvl = spell.level ?? 0;

  // If no classLevels object is defined on the spell, fallback to spell.level vs character level
  if (!spell.classLevels || Object.keys(spell.classLevels).length === 0) {
    const minLvl = getMinClassLevelForSpellLevel(charClass, spellLvl);
    const isMet = charLevel >= minLvl;
    return {
      isClassMatch: true,
      reqSpellLevel: spellLvl,
      minClassLevelRequired: minLvl,
      isLevelMet: isMet,
      statusText: isMet ? `Available (Spell Level ${spellLvl})` : `Requires Level ${minLvl}+ for Level ${spellLvl} spells`,
      badgeStyle: isMet ? 'green' : 'amber'
    };
  }

  // Map user character class string to potential keys in spell.classLevels
  const lowerCharClass = charClass.toLowerCase();
  let matchedKey: string | undefined;
  let reqSpellLvlForCharClass: number | undefined;

  for (const [key, sl] of Object.entries(spell.classLevels)) {
    const k = key.toLowerCase();
    if (
      (lowerCharClass.includes('wizard') || lowerCharClass.includes('wiz')) && (k.includes('wiz') || k.includes('sor/wiz')) ||
      (lowerCharClass.includes('sorcerer') || lowerCharClass.includes('sor')) && (k.includes('sor') || k.includes('sor/wiz')) ||
      (lowerCharClass.includes('cleric') || lowerCharClass.includes('clr')) && (k.includes('cleric') || k.includes('clr')) ||
      (lowerCharClass.includes('druid') || lowerCharClass.includes('drd')) && (k.includes('druid') || k.includes('drd')) ||
      (lowerCharClass.includes('bard') || lowerCharClass.includes('brd')) && (k.includes('bard') || k.includes('brd')) ||
      (lowerCharClass.includes('paladin') || lowerCharClass.includes('pal')) && (k.includes('paladin') || k.includes('pal')) ||
      (lowerCharClass.includes('ranger') || lowerCharClass.includes('rgr')) && (k.includes('ranger') || k.includes('rgr'))
    ) {
      matchedKey = key;
      reqSpellLvlForCharClass = sl;
      break;
    }
  }

  // If character class does not match any required class for this spell:
  if (!matchedKey || reqSpellLvlForCharClass === undefined) {
    return {
      isClassMatch: false,
      reqSpellLevel: spellLvl,
      minClassLevelRequired: getMinClassLevelForSpellLevel(charClass, spellLvl),
      isLevelMet: false,
      statusText: `Cross-class spell (${spell.classLevelsStr || 'Other classes'})`,
      badgeStyle: 'stone'
    };
  }

  // Class matched! Calculate required minimum character level
  const minClassLvl = getMinClassLevelForSpellLevel(charClass, reqSpellLvlForCharClass);
  const isLevelMet = charLevel >= minClassLvl;

  return {
    isClassMatch: true,
    reqSpellLevel: reqSpellLvlForCharClass,
    minClassLevelRequired: minClassLvl,
    isLevelMet,
    matchedClassKey: matchedKey,
    statusText: isLevelMet
      ? `Available for ${charClass} (Spell Level ${reqSpellLvlForCharClass})`
      : `Requires ${charClass} Level ${minClassLvl}+ (Spell Level ${reqSpellLvlForCharClass})`,
    badgeStyle: isLevelMet ? 'green' : 'amber'
  };
}
