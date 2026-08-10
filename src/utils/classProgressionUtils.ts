import { CharacterData } from '../types';
import { isShapeshiftAbility } from '../data/transformationData';
import { isCompanionSummonAbility } from '../data/companionData';

/**
 * Determines whether a character's class, level progression, features, spells,
 * feats, or active state allows them to use the Shapeshift engine.
 */
export function canCharacterShapeshift(character: CharacterData): boolean {
  if (!character) return false;

  // 1. Existing Active Transformation
  if (character.activeTransformation) {
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
    allClassesText.includes('lycan')
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

  // 3. Class Features or Feats
  if (character.classFeatures && character.classFeatures.some(f => isShapeshiftAbility(f.name, f.description))) {
    return true;
  }
  if (character.feats && character.feats.some(f => isShapeshiftAbility(f.name, f.description))) {
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

  // Combine primary class and optional secondary class / subclass
  const primaryClass = (character.characterClass || '').toLowerCase();
  const secondaryClass = (character.optionalRules?.secondaryClass || '').toLowerCase();
  const subclass = (character.subclass || '').toLowerCase();
  const secondarySubclass = (character.optionalRules?.secondarySubclass || '').toLowerCase();

  const allClassesText = `${primaryClass} ${secondaryClass} ${subclass} ${secondarySubclass}`;

  // 1. Classes with dedicated companion/familiar/mount progression
  // Ranger (Beast Master, Drakewarden, Swarmkeeper)
  // Druid (Wild Companion, Nature's Ally)
  // Wizard (Find Familiar, Homunculus)
  // Warlock (Pact of the Chain, Find Familiar)
  // Artificer (Steel Defender, Homunculus Servant)
  // Paladin (Find Steed, Special Mount)
  const companionClasses = [
    'ranger', 'druid', 'wizard', 'warlock', 'artificer', 'paladin',
    'summoner', 'necromancer', 'beastmaster', 'falconer', 'conjurer'
  ];

  if (companionClasses.some(c => allClassesText.includes(c))) {
    return true;
  }

  // Sorcerer, Cleric, Bard at Level 3+ or 5+ (Summon Celestial, Animate Dead, Find Familiar via Magical Secrets/Feats)
  const secondarySummonCasters = ['sorcerer', 'cleric', 'bard'];
  if (secondarySummonCasters.some(c => allClassesText.includes(c)) && (character.level >= 3 || (character.optionalRules?.secondaryLevel || 0) >= 3)) {
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

  // 2. Class Features or Feats
  if (character.classFeatures && character.classFeatures.some(f => isCompanionSummonAbility(f.name, f.description))) {
    return true;
  }
  if (character.feats && character.feats.some(f => isCompanionSummonAbility(f.name, f.description))) {
    return true;
  }

  // 3. Spells
  if (character.spells && character.spells.some(s => isCompanionSummonAbility(s.name, s.description))) {
    return true;
  }

  return false;
}
