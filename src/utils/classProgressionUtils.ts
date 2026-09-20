import { CharacterData } from '../types';
import { isShapeshiftAbility } from '../data/transformationData';
import { isCompanionSummonAbility } from '../data/companionData';

/**
 * Determines whether a character's class, level progression, features, spells,
 * feats, or active state allows them to use the Shapeshift engine.
 */
export function canCharacterShapeshift(character: CharacterData): boolean {
  if (!character) return false;

  // 1. Existing Active Transformation or 3.5e Wild Shape
  if (
    character.activeTransformation ||
    character.wildShapeActive ||
    Boolean(character.wildShapeForm)
  ) {
    return true;
  }

  // Combine primary class and optional secondary class / subclass / race
  const primaryClass = (character.characterClass || '').toLowerCase();
  const secondaryClass = (character.optionalRules?.secondaryClass || '').toLowerCase();
  const subclass = (character.subclass || '').toLowerCase();
  const secondarySubclass = (character.optionalRules?.secondarySubclass || '').toLowerCase();
  const race = (character.race || '').toLowerCase();

  const allClassesText = `${primaryClass} ${secondaryClass} ${subclass} ${secondarySubclass} ${race}`;

  // 2. Class / Subclass / Race direct matches
  // Druid gets Wild Shape / Shapeshift
  if (
    allClassesText.includes('druid') ||
    allClassesText.includes('shifter') ||
    allClassesText.includes('shapeshift') ||
    allClassesText.includes('changeling') ||
    allClassesText.includes('lycan') ||
    allClassesText.includes('doppelganger') ||
    allClassesText.includes('tibbit')
  ) {
    return true;
  }

  // Full/Half Casters that learn Shapeshifting/Polymorph/Alter Self through progression:
  // Wizard, Sorcerer, Warlock, Bard (level 3+ for Alter Self or level 7+ for Polymorph)
  const isPolymorphCaster = ['wizard', 'sorcerer', 'warlock', 'bard', 'transmuter', 'transmutation'].some(c => allClassesText.includes(c));
  if (isPolymorphCaster && (character.level >= 3 || (character.optionalRules?.secondaryLevel || 0) >= 3)) {
    return true;
  }

  // Subclass keywords: Moon, Stars, Spores, Ascendant Dragon, Totem, Beast, Rune Knight, Metamorph
  const shapeshiftSubclassKeywords = ['moon', 'star', 'spore', 'ascendant dragon', 'totem', 'beast', 'metamorph', 'wild shape', 'polymorph'];
  if (shapeshiftSubclassKeywords.some(k => allClassesText.includes(k))) {
    return true;
  }

  // 3. Class Features, Feats, Traits, or Skills
  if (character.classFeatures && character.classFeatures.some(f => isShapeshiftAbility(f.name, f.description))) {
    return true;
  }
  if (character.feats && character.feats.some(f => isShapeshiftAbility(f.name, f.description))) {
    return true;
  }
  const anyTraits = (character as unknown as { traits?: Array<{ name: string; description?: string }> }).traits;
  if (anyTraits && anyTraits.some(t => isShapeshiftAbility(t.name, t.description))) {
    return true;
  }
  if (character.skills && character.skills.some(s => isShapeshiftAbility(s.name))) {
    return true;
  }

  // 4. Spells
  if (character.spells && character.spells.some(s => isShapeshiftAbility(s.name, s.description))) {
    return true;
  }

  return false;
}

/**
 * Determines whether a character's class, level progression, features, spells,
 * feats, or active state allows them to use the Summon Companion engine.
 */
export function canCharacterSummonCompanion(character: CharacterData): boolean {
  if (!character) return false;

  // 0. Existing active companions or mount state
  const anyCompanions = (character as unknown as { companions?: unknown[] }).companions;
  if (anyCompanions && anyCompanions.length > 0) {
    return true;
  }
  if (character.isMounted || character.mountInfo?.name || (character.ownedMounts && character.ownedMounts.length > 0)) {
    return true;
  }

  // Combine primary class and optional secondary class / subclass / race
  const primaryClass = (character.characterClass || '').toLowerCase();
  const secondaryClass = (character.optionalRules?.secondaryClass || '').toLowerCase();
  const subclass = (character.subclass || '').toLowerCase();
  const secondarySubclass = (character.optionalRules?.secondarySubclass || '').toLowerCase();
  const race = (character.race || '').toLowerCase();

  const allClassesText = `${primaryClass} ${secondaryClass} ${subclass} ${secondarySubclass} ${race}`;

  // 1. Classes with dedicated companion/familiar/mount progression
  const isDedicatedSummoner = ['summoner', 'necromancer', 'beastmaster', 'falconer', 'conjurer', 'artificer'].some(c => allClassesText.includes(c));
  if (isDedicatedSummoner) return true;

  if (allClassesText.includes('druid')) return true; // Animal companion / Wild companion
  if (allClassesText.includes('wizard') || allClassesText.includes('sorcerer')) return true; // Summon Familiar
  if (allClassesText.includes('warlock') && (character.level >= 3 || allClassesText.includes('chain'))) return true;

  const charLevel = Math.max(character.level || 1, character.optionalRules?.secondaryLevel || 1);
  if (allClassesText.includes('paladin') && charLevel >= 5) return true; // Special Mount / Find Steed
  if (allClassesText.includes('ranger') && charLevel >= 3) return true; // Animal Companion / Beast Master

  // Sorcerer, Cleric, Bard at Level 3+ or 5+ (Summon Celestial, Animate Dead, Find Familiar via Magical Secrets/Feats)
  const secondarySummonCasters = ['cleric', 'bard'];
  if (secondarySummonCasters.some(c => allClassesText.includes(c)) && charLevel >= 3) {
    return true;
  }

  // Subclass keywords: Beast, Drake, Shepherd, Chain, Conjuration, Necromancy, Battle Smith, Swarmkeeper, Drakewarden, Pet
  const companionSubclassKeywords = [
    'beast', 'drake', 'shepherd', 'chain', 'conjuration', 'necroman', 'battle smith',
    'swarmkeeper', 'drakewarden', 'familiar', 'companion', 'mount'
  ];
  if (companionSubclassKeywords.some(k => allClassesText.includes(k))) {
    return true;
  }

  // 2. Class Features, Feats, Traits, or Skills
  if (character.classFeatures && character.classFeatures.some(f => isCompanionSummonAbility(f.name, f.description))) {
    return true;
  }
  if (character.feats && character.feats.some(f => isCompanionSummonAbility(f.name, f.description))) {
    return true;
  }
  const anyTraits = (character as unknown as { traits?: Array<{ name: string; description?: string }> }).traits;
  if (anyTraits && anyTraits.some(t => isCompanionSummonAbility(t.name, t.description))) {
    return true;
  }
  if (character.skills && character.skills.some(s => isCompanionSummonAbility(s.name))) {
    return true;
  }

  // 3. Spells
  if (character.spells && character.spells.some(s => isCompanionSummonAbility(s.name, s.description))) {
    return true;
  }

  return false;
}
