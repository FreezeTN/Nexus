import { AbilityName, AbilityScores, Attack, CharacterData, Feat, GearItem, GestaltTrack, GestaltTrackClass, OptionalRulesConfig, RuleEdition, Skill, Spell, Wealth } from '../types';
import { parseAbilityScoreBonuses } from './homebrewValidator';
import {
  getCombinedLevel,
  getActiveClassChoice,
  getAbilityModifier,
  getSavingThrowBonus,
  getEffectiveLevel,
  getEffectiveAbilities,
  getEffectiveAbilityDetails,
  getProficiencyBonus,
  formatModifier
} from '../systems/dnd5e';
import { get35eArmorClass } from './calculators/dnd35eCalculators';
import { reconcileEquippedHands } from './handSlotCalculations';
export * from '../systems/dnd5e';
export * from './calculators/dnd35eCalculators';
export * from './handSlotCalculations';
export * from './dnd35eAdvancedMechanics';
export * from './environmentRules';
export * from './racialSkillBonusEngine';
export * from './rules/sizeScaleRules35e';
export { get35eSizeModifier } from './rules/sizeScaleRules35e';
import { getRacialSkillBonusForSkill } from './racialSkillBonusEngine';
import { get35eSizeModifier, get35eSpaceAndReach } from './rules/sizeScaleRules35e';
import { calculate35eWeaponSizePenalty } from './dnd35eAdvancedMechanics';


export {
  OFFICIAL_DAMAGE_TYPES,
  getDamageTypeMeta,
  type DamageTypeMeta
} from '../data/damageTypeData';

export function getEffectiveClassTitle(char: CharacterData): string {
  if (char.optionalRules?.useGestaltUA72) {
    const tracks = getCharacterGestaltTracks(char);
    const trackLabels = tracks.map(track => {
      const activeClass = track.classes.find(c => !c.isPaused) || track.classes[track.classes.length - 1];
      const pausedClasses = track.classes.filter(c => c.isPaused);
      if (pausedClasses.length > 0) {
        const pausedStr = pausedClasses.map(c => `${c.className} ${c.level} (p)`).join(', ');
        return `${activeClass.className} ${activeClass.level} [${pausedStr}]`;
      }
      return `${activeClass.className} ${activeClass.level}`;
    });
    return `${trackLabels.join(' // ')} (Gestalt Lv. ${char.level || 1})`;
  }

  if (char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass) {
    const secLvl = char.optionalRules.secondaryLevel || 1;
    const secSub = char.optionalRules.secondarySubclass ? ` (${char.optionalRules.secondarySubclass})` : '';
    const combLvl = getCombinedLevel(char);
    const activeChoice = getActiveClassChoice(char);
    
    const priTag = activeChoice === 'primary' ? 'Active' : 'Paused';
    const secTag = activeChoice === 'secondary' ? 'Active' : 'Paused';
    
    return `${char.characterClass} ${char.level} [${priTag}] / ${char.optionalRules.secondaryClass}${secSub} ${secLvl} [${secTag}] (Total Lvl ${combLvl})`;
  }
  return `${char.characterClass} ${char.level}`;
}

export interface ACBreakdown {
  total: number;
  baseAc: number;
  dexBonus: number;
  shieldBonus: number;
  magicBonus: number;
  defenseStyleBonus: number;
  miscBonus: number;
  defenseBonusUA?: number;
  sizeAcBonus?: number;
  coverBonus?: number;
  naturalArmorBonus?: number;
  deflectionBonus?: number;
  dodgeBonus?: number;
  touchAc?: number;
  flatFootedAc?: number;
  armorName?: string;
  shieldName?: string;
  isUnarmored: boolean;
  explanation: string;
}

export function getArmorClassBreakdown(char: CharacterData): ACBreakdown {
  if (!char) {
    return {
      total: 10,
      baseAc: 10,
      dexBonus: 0,
      shieldBonus: 0,
      magicBonus: 0,
      defenseStyleBonus: 0,
      miscBonus: 0,
      isUnarmored: true,
      explanation: 'Unarmored Base (10)'
    };
  }

  if (char.edition === '3.5e') {
    const ac35 = get35eArmorClass(char);
    return {
      total: ac35.totalAc,
      baseAc: ac35.baseAc,
      dexBonus: ac35.dexBonus,
      shieldBonus: ac35.shieldBonus,
      magicBonus: 0,
      defenseStyleBonus: 0,
      miscBonus: ac35.miscBonus,
      sizeAcBonus: ac35.sizeModifier,
      naturalArmorBonus: ac35.naturalArmorBonus,
      deflectionBonus: ac35.deflectionBonus,
      dodgeBonus: ac35.dodgeBonus,
      touchAc: ac35.touchAc,
      flatFootedAc: ac35.flatFootedAc,
      armorName: ac35.armorName,
      shieldName: ac35.shieldName,
      isUnarmored: ac35.armorBonus === 0,
      explanation: ac35.explanation
    };
  }

  if (char.edition === 'shadowrun') {
    const total = (char.shadowrun?.ballisticArmor || 0) + (char.shadowrun?.impactArmor || 0) || char.armorClass || 10;
    return {
      total,
      baseAc: total,
      dexBonus: 0,
      shieldBonus: 0,
      magicBonus: 0,
      defenseStyleBonus: 0,
      miscBonus: 0,
      isUnarmored: false,
      explanation: `Shadowrun Total Armor: ${total}`
    };
  }

  const effectiveAbilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(effectiveAbilities?.DEX?.score || 10);
  const conMod = getAbilityModifier(effectiveAbilities?.CON?.score || 10);
  const wisMod = getAbilityModifier(effectiveAbilities?.WIS?.score || 10);

  const inventory = char.inventory || [];
  const is5e = (char.edition || '5e') === '5e';
  const equippedItems = inventory.filter(i => {
    if (!i.equipped || i.stored) return false;
    // If item requires attunement, it must be attuned to grant defense/AC benefits (5e only)
    if (is5e) {
      const needsAttunement = i.requiresAttunement === true || (i.requiresAttunement !== false && (i.notes || '').toLowerCase().includes('attunement'));
      if (needsAttunement && !i.attuned) return false;
    }
    return true;
  });

  let equippedArmor: GearItem | null = null;
  let equippedShield: GearItem | null = null;
  const otherEquippedBonusItems: { item: GearItem; bonus: number }[] = [];

  for (const item of equippedItems) {
    const nameLower = item.name.toLowerCase();
    const notesLower = (item.notes || '').toLowerCase();

    // Check if item is a shield
    if (item.armorType === 'Shield' || nameLower.includes('shield') || notesLower.includes('shield')) {
      if (!equippedShield) {
        equippedShield = item;
      } else {
        const bonusVal = (item.armorAc ?? 2) + (item.acBonus ?? 0);
        otherEquippedBonusItems.push({ item, bonus: bonusVal });
      }
      continue;
    }

    // Check if item is a pure bonus/accessory item (Ring of Protection, Cloak of Protection, Bracers of Defense, etc.)
    const isBonusAccessory =
      item.armorType === 'Bonus' ||
      nameLower.includes('ring of') ||
      nameLower.includes('cloak of') ||
      nameLower.includes('bracers of') ||
      nameLower.includes('amulet of') ||
      (item.itemType === 'Misc' && ((item.acBonus ?? 0) > 0 || (item.armorAc ?? 0) > 0));

    if (isBonusAccessory) {
      let bonusVal = item.acBonus ?? item.armorAc ?? 0;
      if (bonusVal === 0) {
        const bonusMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i) ||
                           nameLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i);
        if (bonusMatch) bonusVal = parseInt(bonusMatch[1] || bonusMatch[2] || '0', 10);
      }
      if (bonusVal > 0) {
        otherEquippedBonusItems.push({ item, bonus: bonusVal });
      }
      continue;
    }

    // Check if item is body armor
    const isArmor =
      item.armorType === 'Light' ||
      item.armorType === 'Medium' ||
      item.armorType === 'Heavy' ||
      item.itemType === 'Armor' ||
      item.armorAc !== undefined ||
      nameLower.includes('armor') ||
      nameLower.includes('mail') ||
      nameLower.includes('plate') ||
      nameLower.includes('breastplate') ||
      nameLower.includes('shirt') ||
      nameLower.includes('leather') ||
      nameLower.includes('padded') ||
      nameLower.includes('hide') ||
      /\bac\s*\d+/i.test(notesLower);

    if (isArmor && !equippedArmor) {
      equippedArmor = item;
    } else {
      // Check for AC bonus on other equipped magic items
      let bonusVal = item.acBonus ?? item.armorAc ?? 0;
      if (bonusVal === 0) {
        const bonusMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i) ||
                           nameLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i);
        if (bonusMatch) bonusVal = parseInt(bonusMatch[1] || bonusMatch[2] || '0', 10);
      }
      if (bonusVal > 0) {
        otherEquippedBonusItems.push({ item, bonus: bonusVal });
      }
    }
  }

  let baseAc = 10;
  let dexBonus = dexMod;
  let magicBonus = 0;
  let armorName: string | undefined = undefined;
  let isUnarmored = true;
  let explanationParts: string[] = [];

  if (equippedArmor) {
    isUnarmored = false;
    armorName = equippedArmor.name;
    const nameLower = equippedArmor.name.toLowerCase();
    const notesLower = (equippedArmor.notes || '').toLowerCase();

    // Check magic bonus in item properties (acBonus) OR regex in name/notes (+1, +2, +3)
    if (equippedArmor.acBonus !== undefined && equippedArmor.acBonus > 0) {
      magicBonus = equippedArmor.acBonus;
    } else {
      const magicMatch = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
      if (magicMatch) {
        magicBonus = parseInt(magicMatch[1], 10);
      }
    }

    const explicitAcMatch = notesLower.match(/ac\s*(\d+)/i) || nameLower.match(/ac\s*(\d+)/i);

    if (equippedArmor.armorAc !== undefined) {
      baseAc = equippedArmor.armorAc;
      const computedArmorType = equippedArmor.armorType || (
        nameLower.includes('plate') || nameLower.includes('splint') || nameLower.includes('chain mail') || nameLower.includes('ring mail') ? 'Heavy' :
        nameLower.includes('half plate') || nameLower.includes('scale') || nameLower.includes('breastplate') || nameLower.includes('chain shirt') || nameLower.includes('hide') ? 'Medium' :
        'Light'
      );

      if (computedArmorType === 'Heavy') {
        dexBonus = equippedArmor.maxDexBonus !== undefined ? Math.min(dexMod, equippedArmor.maxDexBonus) : 0;
        explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
        if (dexBonus !== 0) explanationParts.push(`DEX (${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
      } else if (computedArmorType === 'Medium') {
        const featMaxDex = (char.feats || []).some(f => f.name.toLowerCase().includes('medium armor master')) ? 3 : 2;
        const maxDex = equippedArmor.maxDexBonus !== undefined ? equippedArmor.maxDexBonus : featMaxDex;
        dexBonus = Math.min(dexMod, maxDex);
        explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
        if (dexBonus !== 0) explanationParts.push(`DEX (Max +${maxDex}: ${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
      } else if (computedArmorType === 'Bonus') {
        baseAc = 10;
        dexBonus = dexMod;
        magicBonus += equippedArmor.armorAc;
        explanationParts.push(`${equippedArmor.name} (+${equippedArmor.armorAc} AC)`);
      } else {
        // Light or default
        dexBonus = dexMod;
        explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
        if (dexBonus !== 0) explanationParts.push(`DEX (${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
      }
    } else if (nameLower.includes('plate') || nameLower.includes('splint') || nameLower.includes('chain mail') || nameLower.includes('ring mail')) {
      // Heavy Armor
      if (nameLower.includes('plate')) baseAc = 18;
      else if (nameLower.includes('splint')) baseAc = 17;
      else if (nameLower.includes('chain mail')) baseAc = 16;
      else if (nameLower.includes('ring mail')) baseAc = 14;
      else if (explicitAcMatch) baseAc = parseInt(explicitAcMatch[1], 10);
      else baseAc = 16;
      dexBonus = 0;
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
    } else if (nameLower.includes('half plate') || nameLower.includes('half-plate') || nameLower.includes('scale mail') || nameLower.includes('breastplate') || nameLower.includes('chain shirt') || nameLower.includes('hide')) {
      // Medium Armor
      if (nameLower.includes('half plate') || nameLower.includes('half-plate')) baseAc = 15;
      else if (nameLower.includes('scale mail') || nameLower.includes('breastplate')) baseAc = 14;
      else if (nameLower.includes('chain shirt')) baseAc = 13;
      else if (nameLower.includes('hide')) baseAc = 12;
      else if (explicitAcMatch) baseAc = parseInt(explicitAcMatch[1], 10);
      else baseAc = 14;
      const maxDex = (char.feats || []).some(f => f.name.toLowerCase().includes('medium armor master')) ? 3 : 2;
      dexBonus = Math.min(dexMod, maxDex);
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      if (dexBonus !== 0) explanationParts.push(`DEX (Max +${maxDex}: ${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
    } else if (nameLower.includes('studded') || nameLower.includes('leather') || nameLower.includes('padded')) {
      // Light Armor
      if (nameLower.includes('studded')) baseAc = 12;
      else if (nameLower.includes('leather')) baseAc = 11;
      else if (nameLower.includes('padded')) baseAc = 11;
      else if (explicitAcMatch) baseAc = parseInt(explicitAcMatch[1], 10);
      else baseAc = 11;
      dexBonus = dexMod;
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      if (dexBonus !== 0) explanationParts.push(`DEX (${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
    } else if (explicitAcMatch) {
      baseAc = parseInt(explicitAcMatch[1], 10);
      if (notesLower.includes('no dex') || notesLower.includes('heavy')) {
        dexBonus = 0;
      } else if (notesLower.includes('max 2') || notesLower.includes('medium')) {
        dexBonus = Math.min(dexMod, 2);
      } else {
        dexBonus = dexMod;
      }
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      if (dexBonus !== 0) explanationParts.push(`DEX (${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
    } else {
      baseAc = 12;
      dexBonus = dexMod;
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      if (dexBonus !== 0) explanationParts.push(`DEX (${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
    }

    if (magicBonus > 0) {
      explanationParts.push(`Armor Magic (+${magicBonus})`);
    }
  } else {
    // Unarmored
    const classNameLower = (char.characterClass || '').toLowerCase();
    const featuresStr = (char.classFeatures || []).map(f => f.name + ' ' + f.description).join(' ').toLowerCase();

    const isBarbarian = classNameLower.includes('barbarian') || featuresStr.includes('unarmored defense');
    const isMonk = classNameLower.includes('monk');

    baseAc = 10;
    dexBonus = dexMod;
    explanationParts.push('Base (10)');
    if (dexMod !== 0) explanationParts.push(`DEX (${dexMod >= 0 ? '+' + dexMod : dexMod})`);

    if (isBarbarian && conMod > 0) {
      explanationParts.push(`CON Unarmored (+${conMod})`);
      baseAc += conMod;
    } else if (isMonk && wisMod > 0) {
      explanationParts.push(`WIS Unarmored (+${wisMod})`);
      baseAc += wisMod;
    } else {
      const subclassLower = (char.subclass || '').toLowerCase();
      const isDraconicSorcerer = subclassLower.includes('draconic') || featuresStr.includes('draconic resilience');
      const hasMageArmor = (char.conditions || []).some(c => c.toLowerCase().includes('mage armor'));

      if (isDraconicSorcerer) {
        baseAc = 13;
        explanationParts = ['Draconic Resilience Base (13)'];
        if (dexMod !== 0) explanationParts.push(`DEX (${dexMod >= 0 ? '+' + dexMod : dexMod})`);
      } else if (hasMageArmor) {
        baseAc = 13;
        explanationParts = ['Mage Armor Base (13)'];
        if (dexMod !== 0) explanationParts.push(`DEX (${dexMod >= 0 ? '+' + dexMod : dexMod})`);
      }
    }
  }

  // Shield Bonus
  let shieldBonus = 0;
  let shieldName: string | undefined = undefined;
  if (equippedShield) {
    shieldName = equippedShield.name;
    shieldBonus = 2;
    const shieldNameLower = equippedShield.name.toLowerCase();
    const shieldNotesLower = (equippedShield.notes || '').toLowerCase();
    const magicMatch = shieldNameLower.match(/\+(\d+)/) || shieldNotesLower.match(/\+(\d+)/);
    if (magicMatch) {
      const extraMagic = parseInt(magicMatch[1], 10);
      shieldBonus += extraMagic;
    }
    explanationParts.push(`${equippedShield.name} (+${shieldBonus})`);
  }

  // Fighting Style: Defense (+1 AC while wearing armor)
  let defenseStyleBonus = 0;
  if (equippedArmor) {
    const hasDefenseStyle = (char.classFeatures || []).some(f =>
      f.name.toLowerCase().includes('defense') ||
      f.description.toLowerCase().includes('+1 bonus to ac while wearing armor')
    );
    if (hasDefenseStyle) {
      defenseStyleBonus = 1;
      explanationParts.push('Defense Style (+1)');
    }
  }

  // Misc bonuses from other magic items
  let miscBonus = 0;
  for (const extra of otherEquippedBonusItems) {
    miscBonus += extra.bonus;
    explanationParts.push(`${extra.item.name} (+${extra.bonus})`);
  }

  // Unearthed Arcana p. 109: Class Defense Bonus
  let defenseBonusUA = 0;
  if (char.optionalRules?.useDefenseBonusUA109) {
    const mainClass = char.characterClass || 'Fighter';
    const secClass = char.optionalRules?.useGestaltUA72 || char.optionalRules?.useMulticlassing ? char.optionalRules?.secondaryClass : undefined;
    defenseBonusUA = getGestaltClassDefenseBonus(char.level || 1, mainClass, secClass);
    if (defenseBonusUA > 0) {
      explanationParts.push(`UA p.109 Class Defense (+${defenseBonusUA})`);
    }
  }

  // Size Modifier to AC
  let sizeAcBonus = 0;
  if (char.sizeCategory) {
    sizeAcBonus = getSizeACModifier(char.sizeCategory);
    if (sizeAcBonus !== 0) {
      explanationParts.push(`Size (${sizeAcBonus > 0 ? '+' + sizeAcBonus : sizeAcBonus})`);
    }
  }

  // Tactical Cover bonus for 5e (PHB p. 196: Half Cover = +2 AC, Three-Quarters Cover = +5 AC, Total Cover = Untargetable)
  let coverBonus = 0;
  if (is5e) {
    if (char.activeCover === 'standard' || char.activeCover === 'soft') {
      coverBonus = 2;
      explanationParts.push('Half Cover (+2)');
    } else if (char.activeCover === 'improved') {
      coverBonus = 5;
      explanationParts.push('3/4 Cover (+5)');
    } else if (char.activeCover === 'total') {
      explanationParts.push('Total Cover (Untargetable)');
    }
  }

  // Natural Armor Bonus (5e or generic)
  const naturalArmorBonus = char.naturalArmorBonus || 0;
  if (naturalArmorBonus > 0) {
    miscBonus += naturalArmorBonus;
    explanationParts.push(`Natural Armor (+${naturalArmorBonus})`);
  }

  const total = baseAc + dexBonus + magicBonus + shieldBonus + defenseStyleBonus + miscBonus + defenseBonusUA + sizeAcBonus + coverBonus;

  return {
    total,
    baseAc,
    dexBonus,
    shieldBonus,
    magicBonus,
    defenseStyleBonus,
    miscBonus,
    defenseBonusUA,
    sizeAcBonus,
    coverBonus,
    armorName,
    shieldName,
    isUnarmored,
    explanation: explanationParts.join(' + ')
  };
}

// ==========================================
// UNEARTHED ARCANA p. 72 & p. 109 HELPERS
// ==========================================

export function getHitDieValue(className: string, edition?: RuleEdition): number {
  const c = className.toLowerCase();
  const is35e = edition === '3.5e';
  if (c.includes('barbarian')) return 12;
  if (c.includes('fighter') || c.includes('paladin')) return 10;
  if (c.includes('ranger')) return is35e ? 8 : 10;
  if (c.includes('sorcerer') || c.includes('wizard')) return is35e ? 4 : 6;
  if (is35e && (c.includes('rogue') || c.includes('bard'))) return 6;
  return 8; // Cleric, Rogue (5e), Bard (5e), Druid, Monk, Warlock, Artificer
}

/**
 * Normalizes Gestalt tracks for a character.
 * Gestalt characters can start with up to 4 simultaneous classes (Unearthed Arcana p. 72).
 * Each track can independently advance or pause classes to multiclass.
 */
export function getCharacterGestaltTracks(char: CharacterData): GestaltTrack[] {
  if (char.optionalRules?.gestaltTracks && char.optionalRules.gestaltTracks.length > 0) {
    return char.optionalRules.gestaltTracks;
  }

  // Synthesize from secondaryClass if present, or default 2 tracks
  const trackCount = char.optionalRules?.gestaltTrackCount || (char.optionalRules?.secondaryClass ? 2 : 2);
  const tracks: GestaltTrack[] = [
    {
      id: 'track-1',
      name: 'Track 1',
      classes: [
        {
          id: 't1-c1',
          className: char.characterClass || 'Fighter',
          subclass: char.subclass || '',
          level: char.level || 1,
          isPaused: false
        }
      ]
    },
    {
      id: 'track-2',
      name: 'Track 2',
      classes: [
        {
          id: 't2-c1',
          className: char.optionalRules?.secondaryClass || 'Wizard',
          subclass: char.optionalRules?.secondarySubclass || '',
          level: char.optionalRules?.secondaryLevel || char.level || 1,
          isPaused: false
        }
      ]
    }
  ];

  if (trackCount >= 3) {
    tracks.push({
      id: 'track-3',
      name: 'Track 3',
      classes: [
        {
          id: 't3-c1',
          className: 'Rogue',
          subclass: '',
          level: char.level || 1,
          isPaused: false
        }
      ]
    });
  }

  if (trackCount >= 4) {
    tracks.push({
      id: 'track-4',
      name: 'Track 4',
      classes: [
        {
          id: 't4-c1',
          className: 'Cleric',
          subclass: '',
          level: char.level || 1,
          isPaused: false
        }
      ]
    });
  }

  return tracks.slice(0, trackCount);
}

/**
 * Returns all classes across all Gestalt tracks for the character.
 */
export function getGestaltAllClasses(char: CharacterData): GestaltTrackClass[] {
  if (!char.optionalRules?.useGestaltUA72) {
    return [];
  }
  const tracks = getCharacterGestaltTracks(char);
  return tracks.flatMap(t => t.classes);
}

/**
 * Returns active (unpaused) class on each Gestalt track.
 */
export function getGestaltActiveClasses(char: CharacterData): GestaltTrackClass[] {
  if (!char.optionalRules?.useGestaltUA72) {
    return [];
  }
  const tracks = getCharacterGestaltTracks(char);
  return tracks.map(t => {
    const active = t.classes.find(c => !c.isPaused) || t.classes[t.classes.length - 1];
    return active || { id: `${t.id}-def`, className: 'Fighter', level: 1 };
  });
}

export function getGestaltHitDie(
  primaryOrChar: string | CharacterData,
  secondaryClass?: string,
  edition?: RuleEdition,
  additionalClasses?: string[]
): string {
  if (typeof primaryOrChar === 'object') {
    const char = primaryOrChar;
    const activeClasses = getGestaltActiveClasses(char);
    if (activeClasses.length > 0) {
      const bestVal = Math.max(...activeClasses.map(c => getHitDieValue(c.className, char.edition)));
      return `1d${bestVal}`;
    }
    return `1d${getHitDieValue(char.characterClass, char.edition)}`;
  }

  const val1 = getHitDieValue(primaryOrChar, edition);
  const val2 = secondaryClass ? getHitDieValue(secondaryClass, edition) : 0;
  const moreVals = (additionalClasses || []).map(c => getHitDieValue(c, edition));
  const bestVal = Math.max(val1, val2, ...moreVals);
  return `1d${bestVal}`;
}

export function get35eClassBaseSkillPoints(className: string): number {
  const c = (className || '').toLowerCase();
  if (c.includes('rogue')) return 8;
  if (c.includes('bard') || c.includes('ranger') || c.includes('scout')) return 6;
  if (c.includes('barbarian') || c.includes('druid') || c.includes('monk')) return 4;
  return 2; // Fighter, Paladin, Cleric, Sorcerer, Wizard, etc.
}

export function getGestaltBaseSkillPoints(
  primaryOrChar: string | CharacterData,
  secondaryClass?: string,
  additionalClasses?: string[]
): number {
  if (typeof primaryOrChar === 'object') {
    const char = primaryOrChar;
    const activeClasses = getGestaltActiveClasses(char);
    if (activeClasses.length > 0) {
      return Math.max(...activeClasses.map(c => get35eClassBaseSkillPoints(c.className)));
    }
    return get35eClassBaseSkillPoints(char.characterClass);
  }

  const p = get35eClassBaseSkillPoints(primaryOrChar);
  const s = secondaryClass ? get35eClassBaseSkillPoints(secondaryClass) : 0;
  const more = (additionalClasses || []).map(c => get35eClassBaseSkillPoints(c));
  return Math.max(p, s, ...more);
}

export function getClassDefenseTier(className: string): 'good' | 'average' | 'poor' {
  const c = className.toLowerCase();
  if (c.includes('monk') || c.includes('rogue') || c.includes('fighter') || c.includes('ranger') || c.includes('paladin') || c.includes('barbarian') || c.includes('swashbuckler')) {
    return 'good';
  }
  if (c.includes('cleric') || c.includes('druid') || c.includes('bard') || c.includes('artificer') || c.includes('warlock')) {
    return 'average';
  }
  return 'poor'; // Wizard, Sorcerer
}

export function getSingleClassDefenseBonus(level: number, className: string): number {
  const tier = getClassDefenseTier(className);
  const lvl = Math.max(1, level);
  if (tier === 'good') {
    return Math.floor(2 + (lvl - 1) * 0.526); // +2 at lvl 1 to +12 at lvl 20
  }
  if (tier === 'average') {
    return Math.floor(2 + (lvl - 1) * 0.368); // +2 at lvl 1 to +9 at lvl 20
  }
  return Math.floor(1 + (lvl - 1) * 0.263); // +1 at lvl 1 to +6 at lvl 20
}

export function getGestaltClassDefenseBonus(level: number, primaryClass: string, secondaryClass?: string): number {
  const b1 = getSingleClassDefenseBonus(level, primaryClass);
  const b2 = secondaryClass ? getSingleClassDefenseBonus(level, secondaryClass) : 0;
  return Math.max(b1, b2);
}

// ==========================================
// ITEM DAMAGE REDUCTION (DR) & RESISTANCES
// ==========================================

export interface TotalDRResult {
  totalDR: number;
  sources: string[];
}

export function calculateCharacterTotalDR(char: CharacterData): TotalDRResult {
  if (!char) return { totalDR: 0, sources: [] };

  let totalDR = 0;
  const sources: string[] = [];

  // 1. Innate / Racial Damage Reduction
  if (char.damageReductionValue && char.damageReductionValue > 0) {
    totalDR += char.damageReductionValue;
    const bypassStr = char.damageReductionBypass || '-';
    sources.push(`Innate/Racial DR (${char.damageReductionValue}/${bypassStr})`);
  }

  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 2. Explicit Item Damage Reduction fields
  for (const item of equippedItems) {
    if (item.damageReduction && item.damageReduction !== 0) {
      const val = Math.abs(item.damageReduction);
      totalDR += val;
      sources.push(`${item.name} (DR ${val})`);
    }
  }

  // 3. Unearthed Arcana p. 109/111 Armor as Damage Reduction Rule
  if (char.optionalRules?.useArmorAsDRUA109) {
    for (const item of equippedItems) {
      const type = item.armorType;
      const nameLower = item.name.toLowerCase();
      let uaArmorDR = 0;

      if (type === 'Heavy' || nameLower.includes('plate') || nameLower.includes('splint') || nameLower.includes('chain mail')) {
        uaArmorDR = 4;
      } else if (type === 'Medium' || nameLower.includes('breastplate') || nameLower.includes('scale') || nameLower.includes('hide')) {
        uaArmorDR = 2;
      } else if (type === 'Light' || nameLower.includes('leather') || nameLower.includes('padded')) {
        uaArmorDR = 1;
      } else if (type === 'Shield' || nameLower.includes('shield')) {
        uaArmorDR = 1;
      }

      if (uaArmorDR > 0) {
        totalDR += uaArmorDR;
        sources.push(`${item.name} [UA p.111 Armor DR ${uaArmorDR}]`);
      }
    }
  }

  return { totalDR, sources };
}

export interface ResistanceEntry {
  type: string;
  source: string;
}

export function getCharacterResistances(char: CharacterData): ResistanceEntry[] {
  if (!char) return [];

  const list: ResistanceEntry[] = [];

  // 1. Explicit Damage Resistances array (e.g. 5e / generic)
  if (Array.isArray(char.damageResistances)) {
    for (const dr of char.damageResistances) {
      if (dr && typeof dr === 'string') {
        const cap = dr.charAt(0).toUpperCase() + dr.slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase() === cap.toLowerCase())) {
          list.push({ type: cap, source: 'Racial / Innate Resistance' });
        }
      }
    }
  }

  // 2. Explicit Energy Resistances dictionary (e.g. 3.5e energy resistances: { fire: 6, cold: 6, acid: 6, electricity: 6 })
  if (char.energyResistances && typeof char.energyResistances === 'object') {
    for (const [eType, eVal] of Object.entries(char.energyResistances)) {
      if (typeof eVal === 'number' && eVal > 0) {
        const cap = eType.charAt(0).toUpperCase() + eType.slice(1).toLowerCase();
        const displayLabel = `${cap} (${eVal})`;
        if (!list.some(r => r.type.toLowerCase().startsWith(eType.toLowerCase()))) {
          list.push({ type: displayLabel, source: 'Energy Resistance' });
        }
      }
    }
  }

  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 3. Equipped Items
  for (const item of equippedItems) {
    if (item.resistance && item.resistance.trim()) {
      const parts = item.resistance.split(/[,/]/).map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (!list.some(r => r.type.toLowerCase() === p.toLowerCase() && r.source === item.name)) {
          list.push({ type: p, source: item.name });
        }
      }
    }
  }

  // 4. Base Race & Ancestry Resistances
  const raceLower = (char.race || '').toLowerCase();

  if (raceLower.includes('tiefling')) {
    if (!list.some(r => r.type.toLowerCase().startsWith('fire'))) {
      list.push({ type: 'Fire', source: 'Hellish Resistance (Tiefling)' });
    }
  }
  if (raceLower.includes('dwarf')) {
    if (!list.some(r => r.type.toLowerCase().startsWith('poison'))) {
      list.push({ type: 'Poison', source: 'Dwarven Resilience (Dwarf)' });
    }
  }
  if (raceLower.includes('aasimar')) {
    if (!list.some(r => r.type.toLowerCase().startsWith('necrotic'))) {
      list.push({ type: 'Necrotic', source: 'Celestial Resistance (Aasimar)' });
    }
    if (!list.some(r => r.type.toLowerCase().startsWith('radiant'))) {
      list.push({ type: 'Radiant', source: 'Celestial Resistance (Aasimar)' });
    }
  }
  if (raceLower.includes('warforged')) {
    if (!list.some(r => r.type.toLowerCase().startsWith('poison'))) {
      list.push({ type: 'Poison', source: 'Constructed Resilience (Warforged)' });
    }
  }
  if (raceLower.includes('dragonborn')) {
    const featStr = (char.classFeatures || []).map(f => `${f.name} ${f.description}`).join(' ').toLowerCase();
    let draconicType = 'Fire';
    if (featStr.includes('cold') || featStr.includes('white') || featStr.includes('silver')) draconicType = 'Cold';
    else if (featStr.includes('lightning') || featStr.includes('blue') || featStr.includes('bronze')) draconicType = 'Lightning';
    else if (featStr.includes('acid') || featStr.includes('black') || featStr.includes('copper')) draconicType = 'Acid';
    else if (featStr.includes('poison') || featStr.includes('green')) draconicType = 'Poison';

    if (!list.some(r => r.type.toLowerCase().startsWith(draconicType.toLowerCase()))) {
      list.push({ type: draconicType, source: `Draconic Resistance (${draconicType} Dragonborn)` });
    }
  }
  if (raceLower.includes('genasi')) {
    const featStr = (char.classFeatures || []).map(f => `${f.name} ${f.description}`).join(' ').toLowerCase();
    let genasiType = 'Fire';
    if (featStr.includes('water') || featStr.includes('cold')) genasiType = 'Cold';
    else if (featStr.includes('earth') || featStr.includes('acid')) genasiType = 'Acid';
    else if (featStr.includes('air') || featStr.includes('lightning')) genasiType = 'Lightning';

    if (!list.some(r => r.type.toLowerCase().startsWith(genasiType.toLowerCase()))) {
      list.push({ type: genasiType, source: `Elemental Resistance (${genasiType} Genasi)` });
    }
  }

  // 5. Half-Breed / Hybrid Heritage Ancestry (The Alpine DM System)
  if (char.hybridHeritage?.enabled) {
    const p1 = (char.hybridHeritage.primaryParent || '').toLowerCase();
    const p2 = (char.hybridHeritage.secondaryParent || '').toLowerCase();

    const applyParentResist = (pName: string) => {
      if (pName.includes('tiefling') && !list.some(r => r.type.toLowerCase().startsWith('fire'))) {
        list.push({ type: 'Fire', source: 'Tiefling Heritage Resistance' });
      }
      if ((pName.includes('dwarf') || pName.includes('warforged')) && !list.some(r => r.type.toLowerCase().startsWith('poison'))) {
        list.push({ type: 'Poison', source: 'Dwarven / Warforged Heritage Resilience' });
      }
      if (pName.includes('aasimar')) {
        if (!list.some(r => r.type.toLowerCase().startsWith('necrotic'))) list.push({ type: 'Necrotic', source: 'Celestial Heritage Resistance' });
        if (!list.some(r => r.type.toLowerCase().startsWith('radiant'))) list.push({ type: 'Radiant', source: 'Celestial Heritage Resistance' });
      }
      if (pName.includes('dragonborn') && !list.some(r => r.type.toLowerCase().startsWith('fire'))) {
        list.push({ type: 'Fire', source: 'Draconic Heritage Resistance' });
      }
      if (pName.includes('genasi') && !list.some(r => r.type.toLowerCase().startsWith('fire'))) {
        list.push({ type: 'Fire', source: 'Elemental Heritage Resistance' });
      }
    };

    applyParentResist(p1);
    applyParentResist(p2);
  }

  // 6. Scan Class / Racial Features for explicit "resistance to [type]"
  if (char.classFeatures) {
    for (const feat of char.classFeatures) {
      const text = `${feat.name} ${feat.description}`.toLowerCase();
      const matches = text.matchAll(/resistance to (fire|cold|lightning|acid|poison|necrotic|radiant|psychic|force|thunder|slashing|piercing|bludgeoning|physical)/gi);
      for (const match of matches) {
        const typeFound = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase().startsWith(typeFound.toLowerCase()) && r.source === feat.name)) {
          list.push({ type: typeFound, source: feat.name });
        }
      }
    }
  }

  return list;
}

export function getCharacterImmunities(char: CharacterData): ResistanceEntry[] {
  if (!char) return [];

  const list: ResistanceEntry[] = [];

  // 1. Explicit damage immunities
  if (Array.isArray(char.damageImmunities)) {
    for (const di of char.damageImmunities) {
      if (di && typeof di === 'string') {
        const cap = di.charAt(0).toUpperCase() + di.slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase() === cap.toLowerCase())) {
          list.push({ type: cap, source: 'Damage Immunity' });
        }
      }
    }
  }

  // 2. Explicit condition immunities
  if (Array.isArray(char.conditionImmunities)) {
    for (const ci of char.conditionImmunities) {
      if (ci && typeof ci === 'string') {
        const cap = ci.charAt(0).toUpperCase() + ci.slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase() === cap.toLowerCase())) {
          list.push({ type: cap, source: 'Condition Immunity' });
        }
      }
    }
  }

  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 3. Equipped items with immunity
  for (const item of equippedItems) {
    if (item.immunity && item.immunity.trim()) {
      const parts = item.immunity.split(/[,/]/).map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (!list.some(r => r.type.toLowerCase() === p.toLowerCase() && r.source === item.name)) {
          list.push({ type: p, source: item.name });
        }
      }
    }
  }

  // 4. Scan class/racial features for immunities
  if (char.classFeatures) {
    for (const feat of char.classFeatures) {
      const text = `${feat.name} ${feat.description}`.toLowerCase();
      const matches = text.matchAll(/immun(?:e|ity)\s+(?:to\s+)?(poison|sleep|paralysis|disease|charm|charmed|petrified|exhaustion|frightened|fear|fire|cold|lightning|acid|necrotic|radiant|psychic|force|thunder)/gi);
      for (const match of matches) {
        const typeFound = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase() === typeFound.toLowerCase())) {
          list.push({ type: typeFound, source: feat.name });
        }
      }
    }
  }

  // 5. Active condition effects
  if (char.conditions && char.conditions.length > 0) {
    const effects = getConditionEffects(char.conditions);
    if (effects.immuneToPoison) {
      if (!list.some(r => r.type.toLowerCase() === 'poison' && r.source === 'Petrified Condition')) {
        list.push({ type: 'Poison', source: 'Petrified Condition' });
      }
    }
  }

  return list;
}

export interface AppliedDamageResult {
  originalTotal: number;
  finalTotal: number;
  immunityNegatedAmount: number;
  resistanceHalvedAmount: number;
  drAbsorbedAmount: number;
  breakdownLogs: string[];
}

export function applyResistanceAndDRToDamage(
  totalDamage: number,
  damageType: string | undefined,
  targetChar: CharacterData
): AppliedDamageResult {
  let currentDamage = totalDamage;
  const breakdownLogs: string[] = [];

  let immunityNegatedAmount = 0;
  let resistanceHalvedAmount = 0;
  let drAbsorbedAmount = 0;

  if (!targetChar || totalDamage <= 0) {
    return { originalTotal: totalDamage, finalTotal: totalDamage, immunityNegatedAmount: 0, resistanceHalvedAmount: 0, drAbsorbedAmount: 0, breakdownLogs: [] };
  }

  const dmgTypeLower = (damageType || '').toLowerCase();

  // 1. Check Immunity FIRST (D&D 5e: Immunity reduces damage to 0)
  const immunities = getCharacterImmunities(targetChar);
  const matchedImmunity = immunities.find(im => {
    const imLower = im.type.toLowerCase();
    if (imLower === 'all') return true;
    if (dmgTypeLower && imLower.includes(dmgTypeLower)) return true;
    if (imLower.includes('physical') && ['slashing', 'piercing', 'bludgeoning'].some(p => dmgTypeLower.includes(p))) return true;
    return false;
  });

  if (matchedImmunity) {
    immunityNegatedAmount = currentDamage;
    currentDamage = 0;
    breakdownLogs.push(`🚫 Immunity (${matchedImmunity.source}) completely negated all ${totalDamage} ${damageType || ''} damage (0 HP taken).`);

    return {
      originalTotal: totalDamage,
      finalTotal: 0,
      immunityNegatedAmount,
      resistanceHalvedAmount: 0,
      drAbsorbedAmount: 0,
      breakdownLogs
    };
  }

  // 2. Check Resistance (Halves damage)
  const resistances = getCharacterResistances(targetChar);
  const hasResistance = resistances.some(r => {
    const resLower = r.type.toLowerCase();
    if (resLower === 'all') return true;
    if (dmgTypeLower && resLower.includes(dmgTypeLower)) return true;
    if (resLower.includes('physical') && ['slashing', 'piercing', 'bludgeoning'].some(p => dmgTypeLower.includes(p))) return true;
    return false;
  });

  if (hasResistance && currentDamage > 0) {
    const halved = Math.floor(currentDamage / 2);
    resistanceHalvedAmount = currentDamage - halved;
    currentDamage = halved;
    const matchedSource = resistances.find(r => r.type.toLowerCase() === 'all' || (dmgTypeLower && r.type.toLowerCase().includes(dmgTypeLower)))?.source || 'Resistance';
    breakdownLogs.push(`🔥 Resistance (${matchedSource}) halved damage from ${totalDamage} to ${currentDamage} HP.`);
  }

  // 3. Check Damage Reduction (DR)
  const drInfo = calculateCharacterTotalDR(targetChar);
  if (drInfo.totalDR > 0 && currentDamage > 0) {
    const absorbed = Math.min(currentDamage, drInfo.totalDR);
    drAbsorbedAmount = absorbed;
    currentDamage = Math.max(0, currentDamage - absorbed);
    breakdownLogs.push(`🛡️ Damage Reduction (DR ${drInfo.totalDR} from ${drInfo.sources.join(', ')}) absorbed ${absorbed} damage.`);
  }

  return {
    originalTotal: totalDamage,
    finalTotal: currentDamage,
    immunityNegatedAmount,
    resistanceHalvedAmount,
    drAbsorbedAmount,
    breakdownLogs
  };
}

export function calculateArmorClass(char: CharacterData): number {
  return getArmorClassBreakdown(char).total;
}

export function recalculateCharacterAC(char: CharacterData): CharacterData {
  if (!char) return char;
  // Reconcile hand capacity limits (e.g. if spells, arms, or conditions changed/ended)
  const { character: reconciledChar } = reconcileEquippedHands(char);
  const computedAC = calculateArmorClass(reconciledChar);
  if (char.armorClass === computedAC && reconciledChar.inventory === char.inventory) return char;
  return {
    ...reconciledChar,
    armorClass: computedAC
  };
}

export interface WeightBreakdown {
  equippedWeight: number;
  carriedWeight: number;
  storedWeight: number;
  extradimensionalWeight: number;
  coinWeight: number;
  activeWeight: number;
  mode: 'equipped_only' | 'carried_only' | 'all_items';
}

export function getWeightBreakdown(char: CharacterData): WeightBreakdown {
  const mode = char.optionalRules?.weightCalculationMode || 'carried_only';

  let equippedWeight = 0;
  let carriedWeight = 0;
  let storedWeight = 0;
  let extradimensionalWeight = 0;

  const containers = char.containers || [];
  const extradimensionalContainerIds = new Set<string>();
  containers.forEach(c => {
    if (c.isExtradimensional || c.type === 'bag_of_holding' || c.type === 'handy_haversack' || c.type === 'portable_hole') {
      extradimensionalContainerIds.add(c.id);
    }
  });

  // Also check items in inventory that are extradimensional containers
  for (const item of (char.inventory || [])) {
    if (item.isContainer || item.isExtradimensional || (item.name || '').toLowerCase().includes('bag of holding') || (item.name || '').toLowerCase().includes('handy haversack') || (item.name || '').toLowerCase().includes('portable hole')) {
      extradimensionalContainerIds.add(`item-${item.id}`);
      if (item.containerId) extradimensionalContainerIds.add(item.containerId);
    }
  }

  for (const item of (char.inventory || [])) {
    const itemTotalWeight = (item.weight || 0) * (item.quantity || 1);
    
    // Check if item is held inside an extradimensional container (Bag of Holding, etc.)
    const isInsideExtradimensional = item.containerId && extradimensionalContainerIds.has(item.containerId);

    if (item.stored) {
      storedWeight += itemTotalWeight;
    } else if (item.equipped) {
      equippedWeight += itemTotalWeight;
    } else if (isInsideExtradimensional) {
      // Weight inside extradimensional space does NOT weigh down the bearer!
      extradimensionalWeight += itemTotalWeight;
    } else {
      carriedWeight += itemTotalWeight;
    }
  }

  // Coin Weight calculation: 50 coins = 1 lb standard D&D 5e rule
  const coinCount = ((char.wealth?.cp || 0) + (char.wealth?.sp || 0) + (char.wealth?.ep || 0) + (char.wealth?.gp || 0) + (char.wealth?.pp || 0));
  const isCoinWeightActive = char.optionalRules?.includeCoinWeight ?? true;
  const coinWeight = isCoinWeightActive ? (coinCount * 0.02) : 0;

  let activeWeight = 0;
  if (mode === 'equipped_only') {
    activeWeight = equippedWeight;
  } else if (mode === 'carried_only') {
    activeWeight = equippedWeight + carriedWeight + coinWeight;
  } else {
    activeWeight = equippedWeight + carriedWeight + storedWeight + coinWeight;
  }

  return {
    equippedWeight: Number(equippedWeight.toFixed(1)),
    carriedWeight: Number(carriedWeight.toFixed(1)),
    storedWeight: Number(storedWeight.toFixed(1)),
    extradimensionalWeight: Number(extradimensionalWeight.toFixed(1)),
    coinWeight: Number(coinWeight.toFixed(1)),
    activeWeight: Number(activeWeight.toFixed(1)),
    mode
  };
}

export function getSizeACModifier(sizeCategory?: string): number {
  switch (sizeCategory) {
    case 'Fine': return 8;
    case 'Diminutive': return 4;
    case 'Tiny': return 2;
    case 'Small': return 1;
    case 'Medium': return 0;
    case 'Large': return -1;
    case 'Huge': return -2;
    case 'Gargantuan': return -4;
    case 'Colossal': return -8;
    default: return 0;
  }
}

export function hasPowerfulBuild(char: CharacterData): boolean {
  if (char.optionalRules?.hasPowerfulBuild) return true;
  const featuresStr = (char.classFeatures || []).map(f => f.name + ' ' + f.description).join(' ').toLowerCase();
  const featsStr = (char.feats || []).map(f => f.name + ' ' + f.description).join(' ').toLowerCase();
  const raceStr = (char.race || '').toLowerCase();

  if (featuresStr.includes('powerful build') || featuresStr.includes('little giant') || featuresStr.includes('hippo build') || featuresStr.includes('equine build') || featuresStr.includes('counts as one size larger')) return true;
  if (featsStr.includes('powerful build') || featsStr.includes('little giant')) return true;
  if (raceStr.includes('goliath') || raceStr.includes('firbolg') || raceStr.includes('bugbear') || raceStr.includes('half-giant') || raceStr.includes('loxodon') || raceStr.includes('centaur') || raceStr.includes('minotaur')) return true;
  return false;
}

export function getSizeCarryingMultiplier(char: CharacterData): {
  multiplier: number;
  effectiveSize: string;
  hasPowerfulBuild: boolean;
  baseSize: string;
} {
  const baseSize = char.sizeCategory || 'Medium';
  const pb = hasPowerfulBuild(char);

  const sizeTiers = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'] as const;
  let idx = sizeTiers.indexOf(baseSize as any);
  if (idx === -1) idx = 4; // Default Medium

  if (pb) {
    idx = Math.min(sizeTiers.length - 1, idx + 1);
  }

  const effectiveSize = sizeTiers[idx];
  const is35 = char.edition === '3.5e';

  let multiplier = 1;
  switch (effectiveSize) {
    case 'Fine': multiplier = 0.125; break;
    case 'Diminutive': multiplier = 0.25; break;
    case 'Tiny': multiplier = 0.5; break;
    case 'Small': multiplier = is35 ? 0.75 : 1; break;
    case 'Medium': multiplier = 1; break;
    case 'Large': multiplier = 2; break;
    case 'Huge': multiplier = 4; break;
    case 'Gargantuan': multiplier = 8; break;
    case 'Colossal': multiplier = 16; break;
  }

  return { multiplier, effectiveSize, hasPowerfulBuild: pb, baseSize };
}

export function getTotalWeight(char: CharacterData): number {
  return getWeightBreakdown(char).activeWeight;
}

export function getCarryingCapacity(char: CharacterData): number {
  const effectiveAbilities = getEffectiveAbilities(char);
  const strScore = effectiveAbilities.STR?.score || 10;
  if (char.edition === '3.5e') {
    const isQuad = Boolean((char as any).isQuadruped || char.race?.toLowerCase().includes('centaur'));
    const cap35 = calculate35eCarryingCapacity(strScore, char.sizeCategory || 'Medium', isQuad);
    return cap35.heavyMax;
  }
  const { multiplier } = getSizeCarryingMultiplier(char);
  return Math.floor(strScore * 15 * multiplier);
}

/**
 * Determines whether carrying capacity and encumbrance rules are active for a character,
 * respecting DM campaign/session overrides first, then character-level optional rules.
 * When this rule is disabled or unselected, all weight calculations, carrying capacity bars,
 * and encumbrance speed penalties are deactivated.
 */
export function isEncumbranceRuleActive(
  char: CharacterData,
  activeSession?: { optionalRules?: OptionalRulesConfig } | null
): boolean {
  if (!char) return false;

  // 1. DM Session Overwrite takes absolute precedence if defined in campaign/session
  if (activeSession?.optionalRules) {
    const sessionRules = activeSession.optionalRules;
    if (typeof sessionRules.trackEncumbrance === 'boolean') {
      return sessionRules.trackEncumbrance;
    }
    if (typeof sessionRules.useVariantEncumbrance === 'boolean') {
      return sessionRules.useVariantEncumbrance;
    }
  }

  // 2. Character-level optional rules
  const rules = char.optionalRules;
  if (!rules) return false;

  if (typeof rules.trackEncumbrance === 'boolean') {
    return rules.trackEncumbrance;
  }

  return !!rules.useVariantEncumbrance;
}

export interface EncumbranceDetails {
  totalWeight: number;
  standardCapacity: number;
  isVariant: boolean;
  encumberedThreshold: number;
  heavilyEncumberedThreshold: number;
  maxCapacity: number;
  pushDragLift: number;
  status: 'Normal' | 'Encumbered' | 'Heavily Encumbered' | 'Over Capacity';
  speedPenalty: number;
  hasDisadvantage: boolean;
  sizeCategory: string;
  effectiveSize: string;
  hasPowerfulBuild: boolean;
  sizeMultiplier: number;
  is35e?: boolean;
  load35e?: 'light' | 'medium' | 'heavy' | 'overburdened';
  load35eLabel?: string;
  maxDexBonus35e?: number | null;
  loadAcp35e?: number;
  runMultiplier35e?: number;
  liftOverhead35e?: number;
  liftOffGround35e?: number;
}

export function getEncumbranceDetails(
  char: CharacterData,
  activeSession?: { optionalRules?: OptionalRulesConfig } | null
): EncumbranceDetails {
  const isRuleActive = isEncumbranceRuleActive(char, activeSession);
  if (!isRuleActive) {
    const sizeInfo = getSizeCarryingMultiplier(char);
    return {
      totalWeight: 0,
      standardCapacity: 9999,
      isVariant: false,
      encumberedThreshold: 9999,
      heavilyEncumberedThreshold: 9999,
      maxCapacity: 9999,
      pushDragLift: 9999,
      status: 'Normal',
      speedPenalty: 0,
      hasDisadvantage: false,
      sizeCategory: char.sizeCategory || 'Medium',
      effectiveSize: char.sizeCategory || 'Medium',
      hasPowerfulBuild: false,
      sizeMultiplier: sizeInfo.multiplier,
      is35e: char.edition === '3.5e',
      load35e: 'light',
      load35eLabel: 'Light Load',
      maxDexBonus35e: null,
      loadAcp35e: 0,
      runMultiplier35e: 4,
      liftOverhead35e: 9999,
      liftOffGround35e: 9999
    };
  }

  const totalWeight = getTotalWeight(char);
  const effectiveAbilities = getEffectiveAbilities(char);
  const strScore = effectiveAbilities.STR?.score || 10;

  if (char.edition === '3.5e') {
    const isQuad = Boolean((char as any).isQuadruped || char.race?.toLowerCase().includes('centaur'));
    const cap35 = calculate35eCarryingCapacity(strScore, char.sizeCategory || 'Medium', isQuad);
    const load35 = calculate35eEncumbranceLoad(totalWeight, cap35);
    let status: 'Normal' | 'Encumbered' | 'Heavily Encumbered' | 'Over Capacity' = 'Normal';
    let speedPenalty = 0;
    let hasDisadvantage = false;

    if (load35.load === 'medium') {
      status = 'Encumbered';
      speedPenalty = 10;
    } else if (load35.load === 'heavy') {
      status = 'Heavily Encumbered';
      speedPenalty = 10;
      hasDisadvantage = true;
    } else if (load35.load === 'overburdened') {
      status = 'Over Capacity';
      speedPenalty = 25;
      hasDisadvantage = true;
    }

    return {
      totalWeight,
      standardCapacity: cap35.heavyMax,
      isVariant: false,
      encumberedThreshold: cap35.lightMax,
      heavilyEncumberedThreshold: cap35.mediumMax,
      maxCapacity: cap35.heavyMax,
      pushDragLift: cap35.pushOrDrag,
      status,
      speedPenalty,
      hasDisadvantage,
      sizeCategory: char.sizeCategory || 'Medium',
      effectiveSize: char.sizeCategory || 'Medium',
      hasPowerfulBuild: false,
      sizeMultiplier: cap35.multiplier,
      is35e: true,
      load35e: load35.load,
      load35eLabel: load35.label,
      maxDexBonus35e: load35.maxDexBonus,
      loadAcp35e: load35.loadAcp,
      runMultiplier35e: load35.runMultiplier,
      liftOverhead35e: cap35.liftOverhead,
      liftOffGround35e: cap35.liftOffGround
    };
  }

  const isVariant = !!char.optionalRules?.useVariantEncumbrance;
  const sizeInfo = getSizeCarryingMultiplier(char);
  const mult = sizeInfo.multiplier;

  const standardCapacity = Math.floor(strScore * 15 * mult);
  const encumberedThreshold = Math.floor(strScore * 5 * mult);
  const heavilyEncumberedThreshold = Math.floor(strScore * 10 * mult);
  const maxCapacity = Math.floor(strScore * 15 * mult);
  const pushDragLift = Math.floor(strScore * 30 * mult);

  let status: 'Normal' | 'Encumbered' | 'Heavily Encumbered' | 'Over Capacity' = 'Normal';
  let speedPenalty = 0;
  let hasDisadvantage = false;

  if (isVariant) {
    if (totalWeight > maxCapacity) {
      status = 'Over Capacity';
      speedPenalty = 20;
      hasDisadvantage = true;
    } else if (totalWeight > heavilyEncumberedThreshold) {
      status = 'Heavily Encumbered';
      speedPenalty = 20;
      hasDisadvantage = true;
    } else if (totalWeight > encumberedThreshold) {
      status = 'Encumbered';
      speedPenalty = 10;
      hasDisadvantage = false;
    }
  } else {
    if (totalWeight > maxCapacity) {
      status = 'Over Capacity';
      speedPenalty = 10;
      hasDisadvantage = true;
    }
  }

  return {
    totalWeight,
    standardCapacity,
    isVariant,
    encumberedThreshold,
    heavilyEncumberedThreshold,
    maxCapacity,
    pushDragLift,
    status,
    speedPenalty,
    hasDisadvantage,
    sizeCategory: sizeInfo.baseSize,
    effectiveSize: sizeInfo.effectiveSize,
    hasPowerfulBuild: sizeInfo.hasPowerfulBuild,
    sizeMultiplier: sizeInfo.multiplier
  };
}

export interface ConditionEffects {
  speedZero: boolean;
  speedMultiplier: number;
  incapacitated: boolean;
  autoFailStrDexSaves: boolean;
  disadvantageDexSaves: boolean;
  disadvantageAllSaves: boolean;
  disadvantageAbilityChecks: boolean;
  disadvantageAttackRolls: boolean;
  advantageAttackRolls: boolean;
  grantAdvantageToAttacker: boolean;
  grantDisadvantageToAttacker: boolean;
  meleeAutoCrit: boolean;
  damageResistanceAll: boolean;
  immuneToPoison: boolean;
  halfMaxHp: boolean;
  dead: boolean;
  ethereal: boolean;
  etherealSight: boolean;
  extraAttackBonus: number;
  extraAttackBonusItems: string[];
  acBonus: number;
  acBonusItems: string[];
  mechanicalSummary: string[];
}

export function getConditionEffects(conditions: string[] = [], exhaustion: number = 0, isRanged: boolean = false): ConditionEffects {
  const cSet = new Set(conditions.map(c => c.toLowerCase()));

  const effects: ConditionEffects = {
    speedZero: false,
    speedMultiplier: 1,
    incapacitated: false,
    autoFailStrDexSaves: false,
    disadvantageDexSaves: false,
    disadvantageAllSaves: false,
    disadvantageAbilityChecks: false,
    disadvantageAttackRolls: false,
    advantageAttackRolls: false,
    grantAdvantageToAttacker: false,
    grantDisadvantageToAttacker: false,
    meleeAutoCrit: false,
    damageResistanceAll: false,
    immuneToPoison: false,
    halfMaxHp: false,
    dead: false,
    ethereal: false,
    etherealSight: false,
    extraAttackBonus: 0,
    extraAttackBonusItems: [],
    acBonus: 0,
    acBonusItems: [],
    mechanicalSummary: []
  };

  if (exhaustion >= 1) effects.disadvantageAbilityChecks = true;
  if (exhaustion >= 2) effects.speedMultiplier = 0.5;
  if (exhaustion >= 3) {
    effects.disadvantageAttackRolls = true;
    effects.disadvantageAllSaves = true;
  }
  if (exhaustion >= 4) effects.halfMaxHp = true;
  if (exhaustion >= 5) effects.speedZero = true;
  if (exhaustion >= 6) effects.dead = true;

  // --- STANDARD D&D 5E CONDITIONS ---
  if (cSet.has('blinded')) {
    effects.disadvantageAttackRolls = true;
    effects.grantAdvantageToAttacker = true;
    effects.disadvantageAbilityChecks = true;
    effects.mechanicalSummary.push("Blinded: Auto-fail sight checks, disadvantage on attack rolls, enemy attacks have advantage");
  }

  if (cSet.has('charmed')) {
    effects.mechanicalSummary.push("Charmed: Cannot attack charmer, charmer has advantage on social ability checks against you");
  }

  if (cSet.has('deafened')) {
    effects.mechanicalSummary.push("Deafened: Auto-fail hearing checks");
  }

  if (cSet.has('frightened')) {
    effects.disadvantageAttackRolls = true;
    effects.disadvantageAbilityChecks = true;
    effects.mechanicalSummary.push("Frightened: Disadvantage on attack rolls & ability checks while source of fear is in sight; cannot move closer");
  }

  if (cSet.has('grappled')) {
    effects.speedZero = true;
    effects.mechanicalSummary.push("Grappled: Speed reduced to 0");
  }

  if (cSet.has('incapacitated')) {
    effects.incapacitated = true;
    effects.mechanicalSummary.push("Incapacitated: Cannot take actions or reactions");
  }

  if (cSet.has('invisible')) {
    effects.advantageAttackRolls = true;
    effects.grantDisadvantageToAttacker = true;
    effects.mechanicalSummary.push("Invisible: Advantage on your attacks, enemy attacks against you have disadvantage");
  }

  if (cSet.has('paralyzed')) {
    effects.incapacitated = true;
    effects.speedZero = true;
    effects.autoFailStrDexSaves = true;
    effects.grantAdvantageToAttacker = true;
    effects.meleeAutoCrit = true;
    effects.mechanicalSummary.push("Paralyzed: Incapacitated, speed 0, auto-fail STR/DEX saves, enemy attacks have advantage & hits within 5ft auto-crit");
  }

  if (cSet.has('petrified')) {
    effects.incapacitated = true;
    effects.speedZero = true;
    effects.autoFailStrDexSaves = true;
    effects.grantAdvantageToAttacker = true;
    effects.damageResistanceAll = true;
    effects.immuneToPoison = true;
    effects.mechanicalSummary.push("Petrified: Transformed to stone (weight x10), incapacitated, speed 0, auto-fail STR/DEX saves, resistance to all damage, immune to poison/disease");
  }

  if (cSet.has('poisoned')) {
    effects.disadvantageAttackRolls = true;
    effects.disadvantageAbilityChecks = true;
    effects.mechanicalSummary.push("Poisoned: Disadvantage on attack rolls and ability checks");
  }

  if (cSet.has('prone')) {
    effects.disadvantageAttackRolls = true;
    effects.mechanicalSummary.push("Prone: Disadvantage on your attacks; incoming melee attacks (5ft) have advantage, incoming ranged attacks have disadvantage");
  }

  if (cSet.has('restrained')) {
    effects.speedZero = true;
    effects.disadvantageAttackRolls = true;
    effects.grantAdvantageToAttacker = true;
    effects.disadvantageDexSaves = true;
    effects.mechanicalSummary.push("Restrained: Speed 0, disadvantage on your attacks & DEX saves, enemy attacks have advantage");
  }

  if (cSet.has('stunned')) {
    effects.incapacitated = true;
    effects.speedZero = true;
    effects.autoFailStrDexSaves = true;
    effects.grantAdvantageToAttacker = true;
    effects.mechanicalSummary.push("Stunned: Incapacitated, speed 0, auto-fail STR/DEX saves, enemy attacks have advantage");
  }

  if (cSet.has('unconscious')) {
    effects.incapacitated = true;
    effects.speedZero = true;
    effects.autoFailStrDexSaves = true;
    effects.grantAdvantageToAttacker = true;
    effects.meleeAutoCrit = true;
    effects.mechanicalSummary.push("Unconscious: Incapacitated, drops held items, falls prone, speed 0, auto-fail STR/DEX saves, enemy attacks have advantage & hits within 5ft auto-crit");
  }

  if (cSet.has('ethereal')) {
    effects.ethereal = true;
    effects.mechanicalSummary.push("Ethereal: Phased into Border Ethereal; untargetable/immune to Material attacks (except Force damage or Ethereal Sight); can pass through solid material.");
  }

  if (cSet.has('ethereal sight') || cSet.has('ethereal-sight')) {
    effects.etherealSight = true;
    effects.mechanicalSummary.push("Ethereal Sight: Sees 60ft into Ethereal Plane from Material Plane (and vice versa).");
  }

  // --- SPELL BUFFS & TACTICAL EFFECTS ---
  if (cSet.has('bless')) {
    effects.extraAttackBonus += 2;
    effects.extraAttackBonusItems.push('Bless (+1d4 / ~+2)');
    effects.mechanicalSummary.push("Bless: +1d4 to attack rolls & saving throws");
  }

  if (cSet.has('bane')) {
    effects.extraAttackBonus -= 2;
    effects.extraAttackBonusItems.push('Bane (-1d4 / ~-2)');
    effects.mechanicalSummary.push("Bane: -1d4 to attack rolls & saving throws");
  }

  if (cSet.has('guidance')) {
    effects.extraAttackBonus += 2;
    effects.extraAttackBonusItems.push('Guidance (+1d4 / ~+2)');
    effects.mechanicalSummary.push("Guidance: +1d4 bonus to check / attack roll");
  }

  if (cSet.has('bardic inspiration')) {
    effects.extraAttackBonus += 3;
    effects.extraAttackBonusItems.push('Bardic Inspiration (+1d6 / ~+3)');
    effects.mechanicalSummary.push("Bardic Inspiration: +1d6 to attack roll, ability check, or save");
  }

  if (cSet.has('guided strike') || cSet.has("war god's blessing") || cSet.has('guided strike (+10)')) {
    effects.extraAttackBonus += 10;
    effects.extraAttackBonusItems.push('Guided Strike (+10)');
    effects.mechanicalSummary.push("Guided Strike: +10 bonus to attack roll");
  }

  if (cSet.has('archery') || cSet.has('archery style') || cSet.has('archery fighting style')) {
    effects.extraAttackBonus += 2;
    effects.extraAttackBonusItems.push('Archery Style (+2)');
    effects.mechanicalSummary.push("Archery Style: +2 to ranged attack rolls");
  }

  if (cSet.has('precision attack')) {
    effects.extraAttackBonus += 4;
    effects.extraAttackBonusItems.push('Precision Attack (+1d8 / ~+4)');
    effects.mechanicalSummary.push("Precision Attack: +1d8 to attack roll");
  }

  if (cSet.has('magic weapon') || cSet.has('magic weapon (+1)')) {
    effects.extraAttackBonus += 1;
    effects.extraAttackBonusItems.push('Magic Weapon (+1)');
  }
  if (cSet.has('magic weapon (+2)')) {
    effects.extraAttackBonus += 2;
    effects.extraAttackBonusItems.push('Magic Weapon (+2)');
  }
  if (cSet.has('magic weapon (+3)')) {
    effects.extraAttackBonus += 3;
    effects.extraAttackBonusItems.push('Magic Weapon (+3)');
  }

  if (cSet.has('shield')) {
    effects.acBonus += 5;
    effects.acBonusItems.push('Shield (+5 AC)');
    effects.mechanicalSummary.push("Shield Spell: +5 bonus to AC");
  }

  if (cSet.has('haste')) {
    effects.acBonus += 2;
    effects.speedMultiplier *= 2;
    effects.acBonusItems.push('Haste (+2 AC)');
    effects.advantageAttackRolls = true;
    effects.mechanicalSummary.push("Haste: +2 AC, double speed, advantage on DEX saves & attack rolls");
  }

  if (cSet.has('shield of faith')) {
    effects.acBonus += 2;
    effects.acBonusItems.push('Shield of Faith (+2 AC)');
    effects.mechanicalSummary.push("Shield of Faith: +2 bonus to AC");
  }

  if (cSet.has('cover: half') || cSet.has('half cover')) {
    effects.acBonus += 2;
    effects.acBonusItems.push('Half Cover (+2 AC)');
    effects.mechanicalSummary.push("Half Cover: +2 AC & DEX saving throws");
  }

  if (cSet.has('cover: 3/4') || cSet.has('cover: three-quarters') || cSet.has('three-quarters cover') || cSet.has('3/4 cover')) {
    effects.acBonus += 5;
    effects.acBonusItems.push('3/4 Cover (+5 AC)');
    effects.mechanicalSummary.push("3/4 Cover: +5 AC & DEX saving throws");
  }

  if (cSet.has('faerie fire')) {
    effects.grantAdvantageToAttacker = true;
    effects.mechanicalSummary.push("Faerie Fire: Attacks against target have Advantage");
  }

  if (cSet.has('reckless attack')) {
    effects.advantageAttackRolls = true;
    effects.grantAdvantageToAttacker = true;
    effects.mechanicalSummary.push("Reckless Attack: Advantage on your attacks; incoming attacks against you have Advantage");
  }

  if (cSet.has('true strike') || cSet.has('vow of enmity') || cSet.has('guiding bolt')) {
    effects.grantAdvantageToAttacker = true;
    effects.advantageAttackRolls = true;
  }

  if (exhaustion > 0) {
    effects.mechanicalSummary.push(`Exhaustion Lvl ${exhaustion}: ${
      exhaustion === 1 ? 'Disadvantage on ability checks' :
      exhaustion === 2 ? 'Speed halved' :
      exhaustion === 3 ? 'Disadvantage on attack rolls & saving throws' :
      exhaustion === 4 ? 'Hit point maximum halved' :
      exhaustion === 5 ? 'Speed reduced to 0' :
      'Dead'
    }`);
  }

  return effects;
}

export interface MaxHpBreakdown {
  baseMaxHp: number;
  featBonus: number;
  equippedItemBonus: number;
  tempModifier: number;
  exhaustionHalved: boolean;
  effectiveMaxHp: number;
  details: string[];
}

export function getMaxHpBreakdown(char: CharacterData): MaxHpBreakdown {
  const baseMaxHp = char.hpMax || 10;
  let featBonus = 0;
  let equippedItemBonus = 0;
  const tempModifier = char.maxHpModifier || 0;
  const details: string[] = [`Base Max HP: ${baseMaxHp}`];

  // Calculate Feat Bonuses (e.g. Tough feat: +2 HP per level, homebrew Toughness: +3 HP per level, or flat Max HP)
  if (char.feats && char.feats.length > 0) {
    const charLevel = Math.max(1, char.level || 1);
    char.feats.forEach(feat => {
      let featHpGranted = 0;
      const breakdownNotes: string[] = [];
      const text = `${feat.name || ''} ${feat.description || ''}`;

      // 1. Explicit hpPerLevel property (scaling)
      let perLevelRate: number | undefined = feat.hpPerLevel;

      // 2. If no explicit hpPerLevel, auto-detect per-level rate from description or name:
      // Supports phrases like "+3 HP per level", "+3/level", "+3/lvl", "3 hp per level", "+3 hit points each level",
      // parenthetical "(+3/level)", "(+3)", "Toughness +3", "Toughness +3 HP", etc.
      if (perLevelRate === undefined) {
        const perLevelMatch = 
          // e.g. "+3 HP per level", "+3 hit points per level", "3 hp per level", "+3 per level", "+3/level", "+3/lvl", "+3 each level", "3 for each level"
          text.match(/(?:grant[s]?|gain[s]?|increase[s]?|add[s]?)?\s*(?:[+]|\b)(\d+)\s*(?:additional\s*)?(?:max\s*)?(?:hp|hit\s*points?)?\s*(?:\/|\bper\s*|\bfor\s*each\s*|\bfor\s*every\s*|\beach\s*)(?:character\s*)?(?:level|lvl)/i) ||
          // e.g. "+3/level hp", "+3 per level max hp"
          text.match(/(?:[+]|\b)(\d+)\s*(?:\/|\bper\s*)(?:character\s*)?(?:level|lvl)\s*(?:max\s*)?(?:hp|hit\s*points?)/i) ||
          // e.g. "increases hit point maximum by 3 x your level"
          text.match(/(?:hit\s*point\s*maximum|max\s*hp|hp)\s*(?:increases?|grants?|gains?)\s*by\s*(?:an\s*amount\s*equal\s*to\s*)?(\d+)\s*[x×*]\s*(?:your\s*)?level/i) ||
          // e.g. parenthetical: "(+3/level)", "(+3/lvl)", "(+3)", "(3/level)", "(+3 HP/level)"
          text.match(/\(\s*[+]?(\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)?(?:\/|\bper\s*)?(?:level|lvl)?\s*\)/i) ||
          // e.g. "3 max hp per level", "3 hp/level", "3 hp/lvl"
          text.match(/(\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)\s*(?:per|\/)\s*level/i) ||
          text.match(/(\d+)\s*hp\/(?:level|lvl)/i) ||
          text.match(/(\d+)\s*(?:max\s*)?hp\s*each\s*level/i) ||
          // e.g. "Toughness +3", "Toughness +3 HP", "Custom Toughness +3" in the title or text
          (feat.name || '').match(/(?:tough|toughness|health|vitality|stout|resilient|durable|vigor|life).*?[+](\d+)(?:\s*hp)?/i) ||
          (feat.name || '').match(/[+](\d+)\s*(?:hp)?.*?(?:tough|toughness|health|vitality|stout|resilient|durable|vigor|life)/i) ||
          text.match(/(?:tough|toughness|health|vitality|constitution|hit\s*point|hp).*?(?:[+]|\b)(\d+)\s*(?:hp\s*)?per\s*level/i) ||
          text.match(/(?:[+]|\b)(\d+)\s*per\s*level.*?(?:tough|toughness|health|vitality|hit\s*point|hp)/i);

        if (perLevelMatch) {
          const parsed = parseInt(perLevelMatch[1], 10);
          if (!isNaN(parsed) && parsed > 0) {
            perLevelRate = parsed;
          }
        }
      }

      // If still not detected, check if the feat has 'tough' / 'toughness' / 'vitality' in its name
      // and has a +X in its description (e.g. "+3 hit points" or "+3 HP") or hpMaxBonus was set to 3.
      // In 5e (where Toughness is +2/lvl), user homebrew "+3 HP" or hpMaxBonus: 3 on a Toughness feat
      // was entered in the HP bonus field with the intention of +3 HP per level.
      const lowerName = (feat.name || '').toLowerCase().trim();
      const isToughFeat = lowerName.includes('tough') || lowerName.includes('toughness');
      if (perLevelRate === undefined && isToughFeat && char.edition !== '3.5e') {
        if (typeof feat.hpMaxBonus === 'number' && feat.hpMaxBonus > 0 && feat.hpMaxBonus <= 10) {
          perLevelRate = feat.hpMaxBonus;
        } else {
          const hpInDesc = (feat.description || '').match(/(?:[+]|\b)(\d+)\s*(?:additional\s*)?(?:max\s*)?(?:hp|hit\s*points?)/i);
          if (hpInDesc) {
            const parsed = parseInt(hpInDesc[1], 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
              perLevelRate = parsed;
            }
          }
        }
      }

      if (typeof perLevelRate === 'number' && perLevelRate !== 0) {
        const total = perLevelRate * charLevel;
        featHpGranted += total;
        breakdownNotes.push(`${total > 0 ? '+' : ''}${total} Max HP (${perLevelRate > 0 ? '+' : ''}${perLevelRate}/level)`);
      }

      // 3. Flat Max HP Bonus (explicit hpMaxBonus or parsed flat HP bonus)
      // Note: If feat.hpMaxBonus equals perLevelRate (e.g. user entered 3 into an ambiguous input intending 3/level),
      // we avoid double counting it as both flat and per-level.
      if (typeof feat.hpMaxBonus === 'number' && feat.hpMaxBonus !== 0 && feat.hpMaxBonus !== perLevelRate) {
        featHpGranted += feat.hpMaxBonus;
        breakdownNotes.push(`${feat.hpMaxBonus > 0 ? '+' : ''}${feat.hpMaxBonus} Max HP`);
      } else if (featHpGranted === 0) {
        // If neither perLevel nor hpMaxBonus was set, check for flat bonus in description:
        const flatMatch = text.match(/(?:grant[s]?|gain[s]?|increase[s]?)\s*[+](\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)(?!\s*(?:per|\/|\bfor\s*each|\bfor\s*every|\beach|[x×*]))/i);
        if (flatMatch) {
          const flatVal = parseInt(flatMatch[1], 10);
          if (!isNaN(flatVal) && flatVal > 0) {
            featHpGranted += flatVal;
            breakdownNotes.push(`+${flatVal} Max HP`);
          }
        }
      }

      // 4. Canonical fallback for official Tough / Toughness feats if no custom rate was detected
      if (featHpGranted === 0) {
        if (lowerName === 'tough' || lowerName === 'tough feat') {
          const toughVal = 2 * charLevel;
          featHpGranted += toughVal;
          breakdownNotes.push(`+${toughVal} Max HP (+2/level)`);
        } else if (lowerName === 'toughness' && char.edition === '3.5e') {
          featHpGranted += 3;
          breakdownNotes.push(`+3 Max HP (3.5e SRD)`);
        } else if (lowerName === 'toughness' || lowerName.includes('tough')) {
          // Standard default fallback (+2/level)
          const toughVal = 2 * charLevel;
          featHpGranted += toughVal;
          breakdownNotes.push(`+${toughVal} Max HP (+2/level default)`);
        }
      }

      if (featHpGranted !== 0) {
        featBonus += featHpGranted;
        details.push(`Feat (${feat.name}): ${breakdownNotes.join(', ')}`);
      }
    });
  }

  // Calculate Equipped Item Bonuses / Penalties
  if (char.inventory && char.inventory.length > 0) {
    char.inventory.forEach(item => {
      if (item.equipped && !item.stored) {
        let itemBonus = item.hpMaxBonus || 0;
        
        // Auto-detect from item name or notes if explicit hpMaxBonus not set
        if (itemBonus === 0 && (item.notes || item.name)) {
          const text = `${item.name} ${item.notes || ''}`;
          const match = text.match(/(?:max\s*hp|hit\s*point\s*maximum)\s*([+-]\d+)|([+-]\d+)\s*(?:max\s*hp|hit\s*point\s*maximum)/i);
          if (match) {
            const parsed = parseInt(match[1] || match[2], 10);
            if (!isNaN(parsed)) {
              itemBonus = parsed;
            }
          }
        }

        if (itemBonus !== 0) {
          const totalItemBonus = itemBonus * (item.quantity || 1);
          equippedItemBonus += totalItemBonus;
          details.push(`Equipped Item (${item.name}): ${totalItemBonus > 0 ? '+' : ''}${totalItemBonus} Max HP`);
        }
      }
    });
  }

  // Active Spell / Drain / Curse Modifier
  if (tempModifier !== 0) {
    details.push(`Active Max HP Modifier (Spell/Drain/Curse): ${tempModifier > 0 ? '+' : ''}${tempModifier} Max HP`);
  }

  // 3.5e Negative Levels: -5 Hit Points per negative level
  let negativeLevelHpPenalty = 0;
  if (char.negativeLevels && char.negativeLevels > 0) {
    negativeLevelHpPenalty = char.negativeLevels * 5;
    details.push(`Negative Levels (${char.negativeLevels}): -${negativeLevelHpPenalty} Max HP (-5 per level)`);
  }

  // Constitution Adjustment (D&D 5e & 3.5e: Changes to CON modifier retroactively adjust HP per level)
  const baseConScore = Number(char?.abilities?.CON?.score) || 10;
  const baseConMod = Math.floor((baseConScore - 10) / 2);
  const conDetails = getEffectiveAbilityDetails(char, 'CON');
  const effectiveConMod = conDetails.modifier;
  const conModDelta = effectiveConMod - baseConMod;
  let conHpBonus = 0;
  if (conModDelta !== 0) {
    const charLevel = Math.max(1, char.level || 1);
    conHpBonus = conModDelta * charLevel;
    details.push(`Constitution Adjustment (${conModDelta > 0 ? '+' : ''}${conModDelta} mod × ${charLevel} lvl): ${conHpBonus > 0 ? '+' : ''}${conHpBonus} Max HP`);
  }

  let subtotal = baseMaxHp + featBonus + equippedItemBonus + conHpBonus + tempModifier - negativeLevelHpPenalty;
  subtotal = Math.max(1, subtotal);

  const exhaustion = char.exhaustionLevel || 0;
  let exhaustionHalved = false;
  if (exhaustion >= 4) {
    exhaustionHalved = true;
    details.push(`Exhaustion Lvl ${exhaustion}: Hit Point Maximum Halved`);
  }

  const effectiveMaxHp = exhaustionHalved ? Math.max(1, Math.floor(subtotal / 2)) : subtotal;

  return {
    baseMaxHp,
    featBonus,
    equippedItemBonus,
    tempModifier,
    exhaustionHalved,
    effectiveMaxHp,
    details
  };
}

export interface FeatEffectiveStats {
  hpPerLevel?: number;
  hpMaxBonus?: number;
  statBonus?: string;
  parsedStatBonuses: Array<{ stat: string; value: number }>;
}

/**
 * Universal helper that returns all mechanical benefits (HP scaling, flat HP, and stat bonuses)
 * of a feat, checking both explicit fields and natural language phrasing.
 */
export function getFeatEffectiveStats(feat: Feat): FeatEffectiveStats {
  const text = `${feat.name || ''} ${feat.description || ''} ${feat.statBonus || ''}`;

  // 1. HP per level
  let hpPerLevel = feat.hpPerLevel;
  if (hpPerLevel === undefined || hpPerLevel === 0) {
    const perLevelMatch = 
      text.match(/(?:grant[s]?|gain[s]?|increase[s]?|add[s]?)?\s*(?:[+]|\b)(\d+)\s*(?:additional\s*)?(?:max\s*)?(?:hp|hit\s*points?)?\s*(?:\/|\bper\s*|\bfor\s*each\s*|\bfor\s*every\s*|\beach\s*)(?:character\s*)?(?:level|lvl)/i) ||
      text.match(/(?:[+]|\b)(\d+)\s*(?:\/|\bper\s*)(?:character\s*)?(?:level|lvl)\s*(?:max\s*)?(?:hp|hit\s*points?)/i) ||
      text.match(/(?:hit\s*point\s*maximum|max\s*hp|hp)\s*(?:increases?|grants?|gains?)\s*by\s*(?:an\s*amount\s*equal\s*to\s*)?(\d+)\s*[x×*]\s*(?:your\s*)?level/i) ||
      text.match(/\(\s*[+]?(\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)?(?:\/|\bper\s*)?(?:level|lvl)?\s*\)/i) ||
      text.match(/(\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)\s*(?:per|\/)\s*level/i) ||
      text.match(/(\d+)\s*hp\/(?:level|lvl)/i) ||
      text.match(/(\d+)\s*(?:max\s*)?hp\s*each\s*level/i) ||
      (feat.name || '').match(/(?:tough|toughness|health|vitality|stout|resilient|durable|vigor|life).*?[+](\d+)(?:\s*hp)?/i) ||
      (feat.name || '').match(/[+](\d+)\s*(?:hp)?.*?(?:tough|toughness|health|vitality|stout|resilient|durable|vigor|life)/i) ||
      text.match(/(?:tough|toughness|health|vitality|constitution|hit\s*point|hp).*?(?:[+]|\b)(\d+)\s*(?:hp\s*)?per\s*level/i) ||
      text.match(/(?:[+]|\b)(\d+)\s*per\s*level.*?(?:tough|toughness|health|vitality|hit\s*point|hp)/i);

    if (perLevelMatch) {
      const parsed = parseInt(perLevelMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        hpPerLevel = parsed;
      }
    }
  }

  // 2. Flat Max HP
  let hpMaxBonus = feat.hpMaxBonus;
  if ((hpMaxBonus === undefined || hpMaxBonus === 0) && !hpPerLevel) {
    const flatMatch = text.match(/(?:grant[s]?|gain[s]?|increase[s]?)\s*[+](\d+)\s*(?:max\s*)?(?:hp|hit\s*points?)(?!\s*(?:per|\/|\bfor\s*each|\bfor\s*every|\beach|[x×*]))/i);
    if (flatMatch) {
      const flatVal = parseInt(flatMatch[1], 10);
      if (!isNaN(flatVal) && flatVal > 0) {
        hpMaxBonus = flatVal;
      }
    }
  }

  // 3. Stat bonuses
  const parsedStatBonuses: Array<{ stat: string; value: number }> = [];
  if (feat.statBonus) {
    parsedStatBonuses.push(...parseAbilityScoreBonuses(feat.statBonus));
  }
  if (parsedStatBonuses.length === 0 && text) {
    parsedStatBonuses.push(...parseAbilityScoreBonuses(text));
  }

  return {
    hpPerLevel: hpPerLevel !== 0 ? hpPerLevel : undefined,
    hpMaxBonus: hpMaxBonus !== 0 ? hpMaxBonus : undefined,
    statBonus: feat.statBonus || (parsedStatBonuses.length > 0 ? parsedStatBonuses.map(p => `${p.value > 0 ? '+' : ''}${p.value} ${p.stat}`).join(', ') : undefined),
    parsedStatBonuses
  };
}

export function getEffectiveMaxHp(char: CharacterData): number {
  return getMaxHpBreakdown(char).effectiveMaxHp;
}

export interface SavingThrowDetails {
  bonus: number;
  autoFail: boolean;
  disadvantage: boolean;
  reason?: string;
}

export function getSavingThrowDetails(
  abilityName: AbilityName,
  char: CharacterData
): SavingThrowDetails {
  const bonus = getSavingThrowBonus(abilityName, char.abilities, char.savingThrowProficiencies || [], getEffectiveLevel(char));
  const exhaustion = char.exhaustionLevel || 0;
  const effects = getConditionEffects(char.conditions || [], exhaustion);

  let autoFail = false;
  let disadvantage = false;
  const reasons: string[] = [];

  if (effects.autoFailStrDexSaves && (abilityName === 'STR' || abilityName === 'DEX')) {
    autoFail = true;
    reasons.push(`Auto-Fail STR/DEX saves due to active condition`);
  }
  if (effects.disadvantageAllSaves) {
    disadvantage = true;
    reasons.push(`Disadvantage on saving throws from Exhaustion Lvl ${exhaustion}`);
  }
  if (effects.disadvantageDexSaves && abilityName === 'DEX') {
    disadvantage = true;
    reasons.push(`Disadvantage on DEX saves due to Restrained`);
  }

  return {
    bonus,
    autoFail,
    disadvantage,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined
  };
}

export function getArmorStrengthRequirement(armor: GearItem): number {
  if (armor.strengthRequirement !== undefined) {
    return armor.strengthRequirement;
  }
  const name = (armor.name || '').toLowerCase();
  const notes = (armor.notes || '').toLowerCase();

  const reqMatch = notes.match(/str\s*(?:req|requirement|min)?\s*(\d+)/i) || name.match(/str\s*(\d+)/i);
  if (reqMatch) {
    return parseInt(reqMatch[1], 10);
  }

  if (armor.armorType === 'Heavy' || name.includes('heavy')) {
    if (name.includes('plate') || name.includes('splint')) return 15;
    if (name.includes('chain mail')) return 13;
  } else if (name.includes('plate') && !name.includes('half')) {
    return 15;
  } else if (name.includes('splint')) {
    return 15;
  } else if (name.includes('chain mail')) {
    return 13;
  }

  return 0;
}

export interface SpeedDetails {
  baseSpeed: number;
  effectiveSpeed: number;
  speedPenalty: number;
  isModified: boolean;
  status: string;
  reasons: string[];
  armorPenalty: number;
  isDwarf: boolean;
  speedFly?: number;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
}

export function getEffectiveSpeed(char: CharacterData): SpeedDetails {
  let baseSpeed = char.speed ?? 30;
  const hasMobileFeat = (char.feats || []).some(f => f.name.toLowerCase().includes('mobile')) ||
                        (char.classFeatures || []).some(f => f.name.toLowerCase().includes('mobile'));
  if (hasMobileFeat) {
    baseSpeed += 10;
  }

  const conditions = char.conditions || [];
  const exhaustion = char.exhaustionLevel || 0;
  const effects = getConditionEffects(conditions, exhaustion);

  const encumbrance = getEncumbranceDetails(char);
  const reasons: string[] = [];

  let effectiveSpeed = baseSpeed;

  if (effects.speedZero) {
    effectiveSpeed = 0;
    reasons.push('Speed reduced to 0 by active condition(s) / exhaustion');
  } else if (effects.speedMultiplier < 1) {
    effectiveSpeed = Math.floor(effectiveSpeed * effects.speedMultiplier);
    reasons.push(`Speed halved (${effects.speedMultiplier}x) by Exhaustion Lvl ${exhaustion}`);
  }

  if (effectiveSpeed > 0 && encumbrance.speedPenalty > 0) {
    effectiveSpeed = Math.max(0, effectiveSpeed - encumbrance.speedPenalty);
    reasons.push(`${encumbrance.status} (-${encumbrance.speedPenalty} ft)`);
  }

  // Heavy Armor Strength Requirement Check
  const effectiveAbilities = getEffectiveAbilities(char);
  const strScore = effectiveAbilities.STR?.score || 10;
  const raceLower = (char.race || '').toLowerCase();
  const isDwarf = raceLower.includes('dwarf') ||
    (char.classFeatures || []).some(t => (t.name || '').toLowerCase().includes('speed') && (t.description || '').toLowerCase().includes('armor')) ||
    (char.feats || []).some(t => (t.name || '').toLowerCase().includes('speed') && (t.description || '').toLowerCase().includes('armor'));

  let armorPenalty = 0;
  const equippedArmor = (char.inventory || []).find(i => i.equipped && !i.stored && (i.itemType === 'Armor' || i.armorType === 'Heavy' || (i.armorAc !== undefined && i.armorType !== 'Shield')));
  if (equippedArmor) {
    const strReq = getArmorStrengthRequirement(equippedArmor);
    if (strReq > 0 && strScore < strReq) {
      if (isDwarf) {
        reasons.push(`Heavy Armor STR unmet (${strScore}/${strReq}), but negated by Dwarven Resilience`);
      } else {
        armorPenalty = 10;
        effectiveSpeed = Math.max(0, effectiveSpeed - 10);
        reasons.push(`Heavy Armor STR Unmet: ${equippedArmor.name} requires ${strReq} STR (Current: ${strScore}) (-10 ft)`);
      }
    }
  }

  const speedPenalty = baseSpeed - effectiveSpeed;

  const equippedFly = (char.inventory || []).filter(i => i.equipped && !i.stored).reduce((max, i) => Math.max(max, i.flySpeed || 0), 0);
  const equippedSwim = (char.inventory || []).filter(i => i.equipped && !i.stored).reduce((max, i) => Math.max(max, i.swimSpeed || 0), 0);
  const equippedClimb = (char.inventory || []).filter(i => i.equipped && !i.stored).reduce((max, i) => Math.max(max, i.climbSpeed || 0), 0);

  const speedFly = char.speedFly || (equippedFly > 0 ? equippedFly : undefined);
  const speedSwim = char.speedSwim || (equippedSwim > 0 ? equippedSwim : undefined);
  const speedClimb = char.speedClimb || (equippedClimb > 0 ? equippedClimb : undefined);
  const speedBurrow = char.speedBurrow;

  return {
    baseSpeed,
    effectiveSpeed,
    speedPenalty,
    isModified: speedPenalty > 0,
    status: effects.speedZero ? 'Speed 0 (Condition)' : encumbrance.status,
    reasons,
    armorPenalty,
    isDwarf,
    speedFly,
    speedSwim,
    speedClimb,
    speedBurrow
  };
}

export interface AttunementSlotsBreakdown {
  maxSlots: number;
  isArtificer: boolean;
  artificerLevel: number;
  featureName?: string;
  grantedByItems: number;
  reason: string;
}

export function getMaxAttunementSlots(char: CharacterData): AttunementSlotsBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const secCls = (char.optionalRules?.secondaryClass || '').toLowerCase();
  
  let isArtificer = false;
  let artificerLevel = 0;

  if (cls.includes('artificer')) {
    isArtificer = true;
    artificerLevel = char.level || 1;
  } else if (char.optionalRules?.useMulticlassing && secCls.includes('artificer')) {
    isArtificer = true;
    artificerLevel = char.optionalRules.secondaryLevel || 1;
  }

  let baseSlots = 3;
  let featureName: string | undefined = undefined;

  if (isArtificer) {
    if (artificerLevel >= 18) {
      baseSlots = 6;
      featureName = 'Magic Item Master (Level 18)';
    } else if (artificerLevel >= 14) {
      baseSlots = 5;
      featureName = 'Magic Item Savant (Level 14)';
    } else if (artificerLevel >= 10) {
      baseSlots = 4;
      featureName = 'Magic Item Adept (Level 10)';
    }
  }

  // Check items granting attunement slots
  let grantedByItems = 0;
  const inventory = char.inventory || [];
  for (const item of inventory) {
    if (item.equipped && !item.stored && item.attunementSlotsGranted) {
      grantedByItems += item.attunementSlotsGranted;
    }
  }

  const customOverride = (char as any).customMaxAttunementSlots;
  const maxSlots = customOverride !== undefined ? customOverride : (baseSlots + grantedByItems);

  let reason = `Standard 5e (3 slots)`;
  if (featureName) {
    reason = `Artificer: ${featureName} (${baseSlots} slots)`;
  }
  if (grantedByItems > 0) {
    reason += ` + ${grantedByItems} from Magic Items`;
  }

  return {
    maxSlots,
    isArtificer,
    artificerLevel,
    featureName,
    grantedByItems,
    reason
  };
}

export function getAttunedItemsCount(char: CharacterData): number {
  return (char.inventory || []).filter(item => item.attuned).length;
}

export interface WeaponAttackBreakdown {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: string;
  abilityUsed: AbilityName;
  abilityMod: number;
  profBonus: number;
  isProficient: boolean;
  magicBonus: number;
  isVersatile: boolean;
  isFinesse: boolean;
  isRanged: boolean;
  isThrown: boolean;
  isTwoHanded: boolean;
  explanation: string;
}

export function calculateWeaponAttackDetails(
  char: CharacterData,
  itemOrAttack: GearItem | any,
  options?: {
    useVersatile?: boolean;
    abilityOverride?: AbilityName;
    isProficient?: boolean;
  }
): WeaponAttackBreakdown {
  const effectiveAbilities = getEffectiveAbilities(char);
  const effectiveLevel = getCombinedLevel(char);
  const profBonus = getProficiencyBonus(effectiveLevel);

  const name = itemOrAttack.name || 'Weapon';
  const nameLower = name.toLowerCase();
  const notes = (itemOrAttack.notes || '') as string;
  const notesLower = notes.toLowerCase();

  const weaponStats = itemOrAttack.weaponStats;
  
  const isFinesse = weaponStats?.isFinesse ?? (
    notesLower.includes('finesse') || 
    nameLower.includes('rapier') || 
    nameLower.includes('scimitar') || 
    nameLower.includes('shortsword') || 
    nameLower.includes('dagger') || 
    nameLower.includes('whip')
  );

  const isRanged = weaponStats?.isRanged ?? (
    notesLower.includes('ranged') || 
    notesLower.includes('range') ||
    nameLower.includes('bow') || 
    nameLower.includes('crossbow') || 
    nameLower.includes('dart') || 
    nameLower.includes('sling') || 
    nameLower.includes('blowgun')
  );

  const isThrown = weaponStats?.isThrown ?? (
    notesLower.includes('thrown') || 
    nameLower.includes('javelin') || 
    nameLower.includes('spear') || 
    nameLower.includes('handaxe') || 
    nameLower.includes('dagger') || 
    nameLower.includes('light hammer') || 
    nameLower.includes('trident')
  );

  const isVersatile = weaponStats?.isVersatile ?? (
    notesLower.includes('versatile') || 
    nameLower.includes('longsword') || 
    nameLower.includes('warhammer') || 
    nameLower.includes('battleaxe') || 
    nameLower.includes('trident') || 
    nameLower.includes('spear') || 
    nameLower.includes('quarterstaff')
  );

  const isTwoHanded = weaponStats?.isTwoHanded ?? (
    notesLower.includes('two-handed') || 
    nameLower.includes('greatsword') || 
    nameLower.includes('greataxe') || 
    nameLower.includes('maul') || 
    nameLower.includes('glaive') || 
    nameLower.includes('halberd') || 
    nameLower.includes('pike') || 
    nameLower.includes('heavy crossbow') || 
    nameLower.includes('longbow')
  );

  let magicBonus = 0;
  if (weaponStats?.attackBonusModifier !== undefined) {
    magicBonus = Number(weaponStats.attackBonusModifier) || 0;
  } else {
    const magicMatch = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
    if (magicMatch) {
      magicBonus = parseInt(magicMatch[1], 10);
    }
  }

  const strMod = getAbilityModifier(effectiveAbilities.STR?.score || 10);
  const dexMod = getAbilityModifier(effectiveAbilities.DEX?.score || 10);

  let abilityUsed: AbilityName = 'STR';
  if (options?.abilityOverride) {
    abilityUsed = options.abilityOverride;
  } else if (weaponStats?.abilityOverride) {
    abilityUsed = weaponStats.abilityOverride;
  } else if (isFinesse) {
    abilityUsed = dexMod > strMod ? 'DEX' : 'STR';
  } else if (isRanged && !isThrown) {
    abilityUsed = 'DEX';
  } else {
    abilityUsed = 'STR';
  }

  const abilityMod = getAbilityModifier(effectiveAbilities[abilityUsed]?.score || 10);
  const isProficient = options?.isProficient ?? (itemOrAttack.isProficient !== undefined ? itemOrAttack.isProficient : true);
  const attackBonus = (isProficient ? profBonus : 0) + abilityMod + magicBonus;

  let baseDamageDie = '1d8';
  if (weaponStats?.damage) {
    baseDamageDie = weaponStats.damage;
  } else if (itemOrAttack.damage) {
    const match = String(itemOrAttack.damage).match(/^(\d+d\d+)/i);
    if (match) baseDamageDie = match[1];
    else baseDamageDie = String(itemOrAttack.damage);
  } else {
    if (nameLower.includes('greatsword') || nameLower.includes('maul')) baseDamageDie = '2d6';
    else if (nameLower.includes('greataxe')) baseDamageDie = '1d12';
    else if (nameLower.includes('heavy crossbow') || nameLower.includes('halberd') || nameLower.includes('glaive') || nameLower.includes('pike')) baseDamageDie = '1d10';
    else if (nameLower.includes('longsword') || nameLower.includes('battleaxe') || nameLower.includes('warhammer') || nameLower.includes('rapier') || nameLower.includes('longbow')) baseDamageDie = '1d8';
    else if (nameLower.includes('shortsword') || nameLower.includes('scimitar') || nameLower.includes('handaxe') || nameLower.includes('shortbow') || nameLower.includes('mace') || nameLower.includes('spear') || nameLower.includes('javelin') || nameLower.includes('trident')) baseDamageDie = '1d6';
    else if (nameLower.includes('dagger') || nameLower.includes('sickle') || nameLower.includes('light hammer') || nameLower.includes('dart') || nameLower.includes('sling') || nameLower.includes('quarterstaff') || nameLower.includes('club')) baseDamageDie = '1d4';
    else if (nameLower.includes('blowgun') || nameLower.includes('unarmed')) baseDamageDie = '1';
  }

  if (isVersatile && options?.useVersatile) {
    if (weaponStats?.versatileDamage) {
      baseDamageDie = weaponStats.versatileDamage;
    } else {
      if (baseDamageDie === '1d6') baseDamageDie = '1d8';
      else if (baseDamageDie === '1d8') baseDamageDie = '1d10';
    }
  }

  const damageModTotal = abilityMod + magicBonus + (weaponStats?.damageBonusModifier || 0);
  const damageStr = damageModTotal !== 0 
    ? `${baseDamageDie} ${damageModTotal >= 0 ? '+' : '-'} ${Math.abs(damageModTotal)}`
    : baseDamageDie;

  let damageType = weaponStats?.damageType || itemOrAttack.damageType || 'Slashing';
  if (!weaponStats?.damageType && !itemOrAttack.damageType) {
    if (nameLower.includes('rapier') || nameLower.includes('dagger') || nameLower.includes('shortsword') || nameLower.includes('bow') || nameLower.includes('crossbow') || nameLower.includes('spear') || nameLower.includes('javelin') || nameLower.includes('pike') || nameLower.includes('trident') || nameLower.includes('dart')) {
      damageType = 'Piercing';
    } else if (nameLower.includes('warhammer') || nameLower.includes('maul') || nameLower.includes('club') || nameLower.includes('mace') || nameLower.includes('sling') || nameLower.includes('quarterstaff') || nameLower.includes('flail') || nameLower.includes('unarmed')) {
      damageType = 'Bludgeoning';
    } else {
      damageType = 'Slashing';
    }
  }

  let range = weaponStats?.range || itemOrAttack.range || (isRanged ? '150/600 ft' : '5 ft Melee');

  const explanation = `${abilityUsed} Mod (${formatModifier(abilityMod)})${isProficient ? ` + Prof (${formatModifier(profBonus)})` : ''}${magicBonus ? ` + Magic (${formatModifier(magicBonus)})` : ''}`;

  return {
    name,
    attackBonus,
    damage: damageStr,
    damageType,
    range,
    abilityUsed,
    abilityMod,
    profBonus,
    isProficient,
    magicBonus,
    isVersatile,
    isFinesse,
    isRanged,
    isThrown,
    isTwoHanded,
    explanation
  };
}

export function getTotalWealthInGoldFromWealth(wealth?: Wealth): number {
  if (!wealth) return 0;
  const cp = Number(wealth.cp) || 0;
  const sp = Number(wealth.sp) || 0;
  const ep = Number(wealth.ep) || 0;
  const gp = Number(wealth.gp) || 0;
  const pp = Number(wealth.pp) || 0;
  const total = cp / 100 + sp / 10 + ep / 2 + gp + pp * 10;
  return isNaN(total) ? 0 : Number(total.toFixed(2));
}

export function getTotalWealthInGold(char: CharacterData): number {
  if (!char) return 0;
  return getTotalWealthInGoldFromWealth(char.wealth);
}

/**
 * Deducts gold value from character wealth across denominations (GP -> PP with change -> EP -> SP -> CP).
 * Returns the updated wealth and whether the player had sufficient funds.
 */
export function deductGoldFromWealth(amountGp: number, currentWealth?: Wealth): { updatedWealth: Wealth; success: boolean } {
  const safeWealth: Wealth = {
    cp: Number(currentWealth?.cp) || 0,
    sp: Number(currentWealth?.sp) || 0,
    ep: Number(currentWealth?.ep) || 0,
    gp: Number(currentWealth?.gp) || 0,
    pp: Number(currentWealth?.pp) || 0,
  };

  const totalAvailable = getTotalWealthInGoldFromWealth(safeWealth);
  if (totalAvailable < amountGp - 0.001) {
    return { updatedWealth: safeWealth, success: false };
  }

  let remainingToPay = amountGp;
  let gp = safeWealth.gp;
  let pp = safeWealth.pp;
  let ep = safeWealth.ep;
  let sp = safeWealth.sp;
  let cp = safeWealth.cp;

  // 1. Prefer paying from GP
  if (gp >= remainingToPay) {
    gp -= remainingToPay;
    remainingToPay = 0;
  } else {
    remainingToPay -= gp;
    gp = 0;
  }

  // 2. Pay from Platinum (1 PP = 10 GP), giving change in GP/SP/CP
  if (remainingToPay > 0 && pp > 0) {
    if (pp * 10 >= remainingToPay) {
      const ppNeeded = Math.ceil(remainingToPay / 10);
      pp -= ppNeeded;
      const changeGp = ppNeeded * 10 - remainingToPay;
      const wholeGp = Math.floor(changeGp);
      gp += wholeGp;
      const decimalChange = changeGp - wholeGp;
      if (decimalChange > 0) {
        const spAdd = Math.floor(decimalChange * 10);
        sp += spAdd;
        const cpAdd = Math.round((decimalChange * 10 - spAdd) * 10);
        cp += cpAdd;
      }
      remainingToPay = 0;
    } else {
      remainingToPay -= pp * 10;
      pp = 0;
    }
  }

  // 3. Pay from Electrum (1 EP = 0.5 GP, 2 EP = 1 GP)
  if (remainingToPay > 0 && ep > 0) {
    if (ep * 0.5 >= remainingToPay) {
      const epNeeded = Math.ceil(remainingToPay / 0.5);
      ep -= epNeeded;
      const changeGp = epNeeded * 0.5 - remainingToPay;
      if (changeGp > 0) {
        sp += Math.round(changeGp * 10);
      }
      remainingToPay = 0;
    } else {
      remainingToPay -= ep * 0.5;
      ep = 0;
    }
  }

  // 4. Pay from Silver (10 SP = 1 GP)
  if (remainingToPay > 0 && sp > 0) {
    const spNeeded = remainingToPay * 10;
    if (sp >= spNeeded) {
      const wholeSpNeeded = Math.ceil(spNeeded);
      sp -= wholeSpNeeded;
      const changeCp = Math.round((wholeSpNeeded - spNeeded) * 10);
      cp += changeCp;
      remainingToPay = 0;
    } else {
      remainingToPay -= sp / 10;
      sp = 0;
    }
  }

  // 5. Pay from Copper (100 CP = 1 GP)
  if (remainingToPay > 0 && cp > 0) {
    const cpNeeded = Math.round(remainingToPay * 100);
    cp = Math.max(0, cp - cpNeeded);
    remainingToPay = 0;
  }

  return {
    updatedWealth: {
      cp: Math.max(0, Math.round(cp)),
      sp: Math.max(0, Math.round(sp)),
      ep: Math.max(0, Math.round(ep)),
      gp: Math.max(0, Math.round(gp)),
      pp: Math.max(0, Math.round(pp))
    },
    success: true
  };
}

export function formatWealthDetailed(wealth?: Wealth): {
  totalGp: number;
  displayText: string;
  breakdown: string;
} {
  const totalGp = getTotalWealthInGoldFromWealth(wealth);
  const cp = Number(wealth?.cp) || 0;
  const sp = Number(wealth?.sp) || 0;
  const ep = Number(wealth?.ep) || 0;
  const gp = Number(wealth?.gp) || 0;
  const pp = Number(wealth?.pp) || 0;

  const parts: string[] = [];
  if (pp > 0) parts.push(`${pp} PP`);
  if (gp > 0 || (pp === 0 && sp === 0 && cp === 0 && ep === 0)) parts.push(`${gp} GP`);
  if (ep > 0) parts.push(`${ep} EP`);
  if (sp > 0) parts.push(`${sp} SP`);
  if (cp > 0) parts.push(`${cp} CP`);

  return {
    totalGp,
    displayText: `~${totalGp.toLocaleString(undefined, { minimumFractionDigits: totalGp % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })} GP`,
    breakdown: parts.join(', ') || '0 GP'
  };
}

export { DEFAULT_SKILLS_LIST, DEFAULT_35E_SKILLS_LIST } from '../data/defaultSkillLists';

export function get35eSkillSynergyBonus(
  skillName: string,
  allSkills?: Skill[]
): { totalBonus: number; sources: string[] } {
  if (!allSkills || allSkills.length === 0) {
    return { totalBonus: 0, sources: [] };
  }

  const cleanName = skillName.trim().toLowerCase();
  let totalBonus = 0;
  const sources: string[] = [];

  for (const rule of DND35E_SKILL_SYNERGIES) {
    if (rule.targetSkill.toLowerCase() === cleanName) {
      // Find source skill
      const source = allSkills.find(
        (s) => s.name.trim().toLowerCase() === rule.sourceSkill.toLowerCase()
      );
      if (source && (source.ranks || 0) >= rule.requiredRanks) {
        totalBonus += rule.bonus;
        sources.push(`${rule.sourceSkill} (${source.ranks} ranks): +${rule.bonus}`);
      }
    }
  }

  return { totalBonus, sources };
}

export const DND35E_ACP_SKILLS = [
  'Balance',
  'Climb',
  'Escape Artist',
  'Hide',
  'Jump',
  'Move Silently',
  'Sleight of Hand',
  'Swim',
  'Tumble'
];

export function is35eAcpSkill(skillName: string): boolean {
  const clean = (skillName || '').trim().toLowerCase();
  return DND35E_ACP_SKILLS.some((s) => s.toLowerCase() === clean);
}

export function getSizeHideModifier(sizeCategory?: string): number {
  switch (sizeCategory) {
    case 'Fine': return 16;
    case 'Diminutive': return 12;
    case 'Tiny': return 8;
    case 'Small': return 4;
    case 'Medium': return 0;
    case 'Large': return -4;
    case 'Huge': return -8;
    case 'Gargantuan': return -12;
    case 'Colossal': return -16;
    default: return 0;
  }
}

export function get35eSkillBonus(
  skill: Skill,
  abilities: AbilityScores,
  allSkills?: Skill[],
  totalAcp: number = 0,
  sizeCategory?: string,
  character?: CharacterData,
  activeConditionIds?: string[]
): number {
  const abilityMod = getAbilityModifier(abilities[skill.ability]?.score || 10);
  const ranks = skill.ranks || 0;
  const misc = skill.miscMod || 0;
  const synergy = get35eSkillSynergyBonus(skill.name, allSkills).totalBonus;

  let acpPenalty = 0;
  if (totalAcp !== 0 && is35eAcpSkill(skill.name)) {
    const isSwim = (skill.name || '').trim().toLowerCase() === 'swim';
    // Swim suffers double ACP in 3.5e (-2 per point of ACP)
    // totalAcp is typically negative (e.g. -4), so isSwim ? totalAcp * 2 : totalAcp
    acpPenalty = isSwim ? totalAcp * 2 : totalAcp;
  }

  let sizeBonus = 0;
  if (sizeCategory && (skill.name || '').trim().toLowerCase() === 'hide') {
    sizeBonus = getSizeHideModifier(sizeCategory);
  }

  // D&D Racial Skill Bonus (Non-stacking, highest bonus applies)
  const racialBonus = character ? getRacialSkillBonusForSkill(skill, character, activeConditionIds) : 0;

  return ranks + abilityMod + misc + synergy + acpPenalty + sizeBonus + racialBonus;
}

export interface Save35eBreakdown {
  saveType: 'fort' | 'ref' | 'will';
  label: string;
  total: number;
  base: number;
  abilityName: 'CON' | 'DEX' | 'WIS';
  abilityMod: number;
  magicMod: number;
  miscMod: number;
  divineGraceMod: number;
  halflingMod: number;
  conditionalNotes?: string;
}

/**
 * Derives official 3.5e Good/Poor base saving throws based on core class.
 * Good Save = 2 + floor(level / 2)
 * Poor Save = floor(level / 3)
 */
export function calculate35eBaseSaves(
  primaryOrChar: string | CharacterData,
  level?: number,
  secondaryClass?: string,
  additionalClasses?: string[]
): {
  fort: number;
  ref: number;
  will: number;
  isGoodFort: boolean;
  isGoodRef: boolean;
  isGoodWill: boolean;
} {
  let charLvl = 1;
  let primaryClass = 'Fighter';
  let secondaries: string[] = [];

  const getSingleSaves = (clsName: string, classLevel?: number) => {
    const lvl = Math.max(1, classLevel !== undefined ? classLevel : charLvl);
    const cls = (clsName || '').toLowerCase();

    const good = 2 + Math.floor(lvl / 2);
    const poor = Math.floor(lvl / 3);

    let isGoodFort = false;
    let isGoodRef = false;
    let isGoodWill = false;

    if (cls.includes('fighter') || cls.includes('barbarian')) {
      isGoodFort = true;
    } else if (cls.includes('paladin')) {
      isGoodFort = true;
    } else if (cls.includes('cleric') || cls.includes('druid')) {
      isGoodFort = true;
      isGoodWill = true;
    } else if (cls.includes('monk')) {
      isGoodFort = true;
      isGoodRef = true;
      isGoodWill = true;
    } else if (cls.includes('ranger')) {
      isGoodFort = true;
      isGoodRef = true;
    } else if (cls.includes('rogue')) {
      isGoodRef = true;
    } else if (cls.includes('bard')) {
      isGoodRef = true;
      isGoodWill = true;
    } else if (cls.includes('sorcerer') || cls.includes('wizard')) {
      isGoodWill = true;
    } else {
      // Default fallback: medium progression
      isGoodFort = true;
    }

    return {
      fort: isGoodFort ? good : poor,
      ref: isGoodRef ? good : poor,
      will: isGoodWill ? good : poor,
      isGoodFort,
      isGoodRef,
      isGoodWill
    };
  };

  if (typeof primaryOrChar === 'object') {
    const char = primaryOrChar;
    charLvl = char.level || 1;
    if (char.optionalRules?.useGestaltUA72) {
      const tracks = getCharacterGestaltTracks(char);
      if (tracks.length > 0) {
        // Gestalt UA p. 72: A gestalt character takes the best base save bonus in each category from his two classes/tracks
        const trackSaves = tracks.map(t => {
          let fort = 0;
          let ref = 0;
          let will = 0;
          let isGoodFort = false;
          let isGoodRef = false;
          let isGoodWill = false;
          for (const c of t.classes) {
            const s = getSingleSaves(c.className, c.level || charLvl);
            fort += s.fort;
            ref += s.ref;
            will += s.will;
            if (s.isGoodFort) isGoodFort = true;
            if (s.isGoodRef) isGoodRef = true;
            if (s.isGoodWill) isGoodWill = true;
          }
          return { fort, ref, will, isGoodFort, isGoodRef, isGoodWill };
        });
        return {
          fort: Math.max(...trackSaves.map(s => s.fort)),
          ref: Math.max(...trackSaves.map(s => s.ref)),
          will: Math.max(...trackSaves.map(s => s.will)),
          isGoodFort: trackSaves.some(s => s.isGoodFort),
          isGoodRef: trackSaves.some(s => s.isGoodRef),
          isGoodWill: trackSaves.some(s => s.isGoodWill)
        };
      }
      const active = getGestaltActiveClasses(char);
      if (active.length > 0) {
        primaryClass = active[0].className;
        secondaries = active.slice(1).map(c => c.className);
      } else {
        primaryClass = char.characterClass || 'Fighter';
      }
    } else {
      primaryClass = char.characterClass || 'Fighter';
      if (char.optionalRules?.secondaryClass) {
        secondaries = [char.optionalRules.secondaryClass];
      }
    }
  } else {
    primaryClass = primaryOrChar;
    charLvl = level || 1;
    secondaries = [secondaryClass, ...(additionalClasses || [])].filter((c): c is string => Boolean(c));
  }

  const primary = getSingleSaves(primaryClass);
  if (secondaries.length === 0) return primary;

  // Gestalt UA 72: Character gains the best saving throw progression across all classes
  const secSaves = secondaries.map(c => getSingleSaves(c));
  return {
    fort: Math.max(primary.fort, ...secSaves.map(s => s.fort)),
    ref: Math.max(primary.ref, ...secSaves.map(s => s.ref)),
    will: Math.max(primary.will, ...secSaves.map(s => s.will)),
    isGoodFort: primary.isGoodFort || secSaves.some(s => s.isGoodFort),
    isGoodRef: primary.isGoodRef || secSaves.some(s => s.isGoodRef),
    isGoodWill: primary.isGoodWill || secSaves.some(s => s.isGoodWill)
  };
}

export function get35eSaveBreakdown(
  char: CharacterData,
  saveType: 'fort' | 'ref' | 'will'
): Save35eBreakdown {
  const baseCalculated = calculate35eBaseSaves(char);
  const chaMod = getAbilityModifier(char.abilities.CHA?.score || 10);
  const isPaladin2Plus =
    (char.characterClass || '').toLowerCase().includes('paladin') &&
    (char.level || 1) >= 2;
  const hasDivineGrace = Boolean(char.divineGraceActive || isPaladin2Plus);
  const divineGraceMod = hasDivineGrace ? Math.max(0, chaMod) : 0;

  const isHalfling = (char.race || '').toLowerCase().includes('halfling');
  const halflingMod = isHalfling ? 1 : 0;

  // 3.5e Negative Levels penalty (-1 to all saving throws per negative level)
  const negLevelPenalty = char.negativeLevels || 0;

  // 3.5e Cover Reflex Save Bonus
  let coverReflexBonus = 0;
  if (char.activeCover === 'standard') {
    coverReflexBonus = 2;
  } else if (char.activeCover === 'improved') {
    coverReflexBonus = 4;
  } else if (char.activeCover === 'total') {
    coverReflexBonus = 4;
  }

  if (saveType === 'fort') {
    const base = char.optionalRules?.useGestaltUA72
      ? Math.max(char.fortSaveBase ?? 0, baseCalculated.fort)
      : (char.fortSaveBase ?? baseCalculated.fort);
    const abilityMod = getAbilityModifier(char.abilities.CON?.score || 10);
    const magicMod = char.fortSaveMagic || 0;
    const miscMod = char.fortSaveMisc || 0;
    const total = base + abilityMod + magicMod + miscMod + divineGraceMod + halflingMod - negLevelPenalty;
    return {
      saveType: 'fort',
      label: 'Fortitude',
      total,
      base,
      abilityName: 'CON',
      abilityMod,
      magicMod,
      miscMod,
      divineGraceMod,
      halflingMod,
      conditionalNotes: char.saveConditionalModifiers
    };
  }

  if (saveType === 'ref') {
    const base = char.optionalRules?.useGestaltUA72
      ? Math.max(char.refSaveBase ?? 0, baseCalculated.ref)
      : (char.refSaveBase ?? baseCalculated.ref);
    const abilityMod = getAbilityModifier(char.abilities.DEX?.score || 10);
    const magicMod = char.refSaveMagic || 0;
    const miscMod = char.refSaveMisc || 0;
    const total = base + abilityMod + magicMod + miscMod + divineGraceMod + halflingMod + coverReflexBonus - negLevelPenalty;
    return {
      saveType: 'ref',
      label: 'Reflex',
      total,
      base,
      abilityName: 'DEX',
      abilityMod,
      magicMod,
      miscMod: miscMod + coverReflexBonus,
      divineGraceMod,
      halflingMod,
      conditionalNotes: char.saveConditionalModifiers
    };
  }

  // Will
  const base = char.optionalRules?.useGestaltUA72
    ? Math.max(char.willSaveBase ?? 0, baseCalculated.will)
    : (char.willSaveBase ?? baseCalculated.will);
  const abilityMod = getAbilityModifier(char.abilities.WIS?.score || 10);
  const magicMod = char.willSaveMagic || 0;
  const miscMod = char.willSaveMisc || 0;
  const total = base + abilityMod + magicMod + miscMod + divineGraceMod + halflingMod - negLevelPenalty;
  return {
    saveType: 'will',
    label: 'Will',
    total,
    base,
    abilityName: 'WIS',
    abilityMod,
    magicMod,
    miscMod,
    divineGraceMod,
    halflingMod,
    conditionalNotes: char.saveConditionalModifiers
  };
}

export function get35eFortSave(char: CharacterData): number {
  return get35eSaveBreakdown(char, 'fort').total;
}

export function get35eRefSave(char: CharacterData): number {
  return get35eSaveBreakdown(char, 'ref').total;
}

export function get35eWillSave(char: CharacterData): number {
  return get35eSaveBreakdown(char, 'will').total;
}

export function getEffectiveSaves(char: CharacterData) {
  if (!char) {
    return {
      FORT: { total: 0, base: 0 },
      REF: { total: 0, base: 0 },
      WILL: { total: 0, base: 0 }
    };
  }
  if (char.edition === '3.5e') {
    const fort = get35eSaveBreakdown(char, 'fort');
    const ref = get35eSaveBreakdown(char, 'ref');
    const will = get35eSaveBreakdown(char, 'will');
    return {
      FORT: fort,
      REF: ref,
      WILL: will
    };
  }
  const abilities = getEffectiveAbilities(char);
  const profs = char.savingThrowProficiencies || [];
  const lvl = char.level || 1;
  const con = getSavingThrowBonus('CON', abilities, profs, lvl, char);
  const dex = getSavingThrowBonus('DEX', abilities, profs, lvl, char);
  const wis = getSavingThrowBonus('WIS', abilities, profs, lvl, char);
  return {
    FORT: { total: con, base: con },
    REF: { total: dex, base: dex },
    WILL: { total: wis, base: wis }
  };
}

// ----------------------------------------------------
// D&D 3.5e SKILL SYNERGIES & CLASS SKILLS DATA
// ----------------------------------------------------

export interface SkillSynergyRule {
  sourceSkill: string;
  requiredRanks: number;
  targetSkill: string;
  bonus: number;
  conditionDesc?: string;
}

export const DND35E_SKILL_SYNERGIES: SkillSynergyRule[] = [
  { sourceSkill: 'Tumble', requiredRanks: 5, targetSkill: 'Balance', bonus: 2 },
  { sourceSkill: 'Tumble', requiredRanks: 5, targetSkill: 'Jump', bonus: 2 },
  { sourceSkill: 'Balance', requiredRanks: 5, targetSkill: 'Tumble', bonus: 2 },
  { sourceSkill: 'Jump', requiredRanks: 5, targetSkill: 'Tumble', bonus: 2 },
  { sourceSkill: 'Bluff', requiredRanks: 5, targetSkill: 'Diplomacy', bonus: 2 },
  { sourceSkill: 'Bluff', requiredRanks: 5, targetSkill: 'Intimidate', bonus: 2 },
  { sourceSkill: 'Bluff', requiredRanks: 5, targetSkill: 'Sleight of Hand', bonus: 2 },
  { sourceSkill: 'Bluff', requiredRanks: 5, targetSkill: 'Disguise', bonus: 2, conditionDesc: 'when acting in character' },
  { sourceSkill: 'Sense Motive', requiredRanks: 5, targetSkill: 'Diplomacy', bonus: 2 },
  { sourceSkill: 'Knowledge (Arcana)', requiredRanks: 5, targetSkill: 'Spellcraft', bonus: 2 },
  { sourceSkill: 'Spellcraft', requiredRanks: 5, targetSkill: 'Use Magic Device', bonus: 2, conditionDesc: 'scrolls' },
  { sourceSkill: 'Use Magic Device', requiredRanks: 5, targetSkill: 'Spellcraft', bonus: 2, conditionDesc: 'decipher scrolls' },
  { sourceSkill: 'Handle Animal', requiredRanks: 5, targetSkill: 'Ride', bonus: 2 },
  { sourceSkill: 'Handle Animal', requiredRanks: 5, targetSkill: 'Wild Empathy', bonus: 2, conditionDesc: 'wild empathy checks' },
  { sourceSkill: 'Survival', requiredRanks: 5, targetSkill: 'Knowledge (Nature)', bonus: 2 },
  { sourceSkill: 'Knowledge (Nature)', requiredRanks: 5, targetSkill: 'Survival', bonus: 2, conditionDesc: 'in aboveground natural terrain' },
  { sourceSkill: 'Knowledge (Dungeoneering)', requiredRanks: 5, targetSkill: 'Survival', bonus: 2, conditionDesc: 'underground' },
  { sourceSkill: 'Knowledge (Geography)', requiredRanks: 5, targetSkill: 'Survival', bonus: 2, conditionDesc: 'avoid getting lost' },
  { sourceSkill: 'Knowledge (Local)', requiredRanks: 5, targetSkill: 'Gather Information', bonus: 2 },
  { sourceSkill: 'Knowledge (Nobility and Royalty)', requiredRanks: 5, targetSkill: 'Diplomacy', bonus: 2 },
  { sourceSkill: 'Search', requiredRanks: 5, targetSkill: 'Survival', bonus: 2, conditionDesc: 'tracking' },
  { sourceSkill: 'Escape Artist', requiredRanks: 5, targetSkill: 'Use Rope', bonus: 2, conditionDesc: 'bindings' },
  { sourceSkill: 'Sleight of Hand', requiredRanks: 5, targetSkill: 'Use Rope', bonus: 2, conditionDesc: 'bindings' },
  { sourceSkill: 'Use Rope', requiredRanks: 5, targetSkill: 'Climb', bonus: 2, conditionDesc: 'with ropes' },
  { sourceSkill: 'Use Rope', requiredRanks: 5, targetSkill: 'Escape Artist', bonus: 2, conditionDesc: 'bound with rope' },
  { sourceSkill: 'Knowledge (Religion)', requiredRanks: 5, targetSkill: 'Turn Undead', bonus: 2, conditionDesc: 'turning check' },
  { sourceSkill: 'Decipher Script', requiredRanks: 5, targetSkill: 'Use Magic Device', bonus: 2, conditionDesc: 'involving scrolls' },
  { sourceSkill: 'Knowledge (Architecture and Engineering)', requiredRanks: 5, targetSkill: 'Search', bonus: 2, conditionDesc: 'secret doors and compartments' },
  { sourceSkill: 'Knowledge (The Planes)', requiredRanks: 5, targetSkill: 'Survival', bonus: 2, conditionDesc: 'on other planes' },
  { sourceSkill: 'Knowledge (History)', requiredRanks: 5, targetSkill: 'Bardic Knowledge', bonus: 2, conditionDesc: 'bardic knowledge checks' },
  { sourceSkill: 'Autohypnosis', requiredRanks: 5, targetSkill: 'Concentration', bonus: 2, conditionDesc: 'resisting distractions' },
  { sourceSkill: 'Knowledge (Psionics)', requiredRanks: 5, targetSkill: 'Psicraft', bonus: 2 }
];

/**
 * Returns all synergy rules where the given skill is the source (i.e. grants a bonus to another skill or check).
 */
export function getSynergiesGrantedBySkill(
  skillName: string,
  ranks?: number
): SkillSynergyRule[] {
  const clean = (skillName || '').trim().toLowerCase();
  return DND35E_SKILL_SYNERGIES.filter((rule) => {
    if (rule.sourceSkill.toLowerCase() !== clean) return false;
    if (ranks !== undefined && ranks < rule.requiredRanks) return false;
    return true;
  });
}

/**
 * Checks if a skill grants any synergy to any other skill/check.
 * If ranks is provided, checks if ranks >= requiredRanks.
 */
export function isSkillGrantingSynergy(
  skillName: string,
  ranks?: number
): boolean {
  return getSynergiesGrantedBySkill(skillName, ranks).length > 0;
}

/**
 * Returns the list of character skills that actively grant at least one synergy to another skill,
 * along with detailed descriptions of what they grant.
 */
export function getActiveGrantingSynergySkills(skills?: Skill[]): Array<{
  skill: Skill;
  synergies: SkillSynergyRule[];
  description: string;
}> {
  if (!skills || skills.length === 0) return [];
  const results: Array<{
    skill: Skill;
    synergies: SkillSynergyRule[];
    description: string;
  }> = [];

  for (const s of skills) {
    const ranks = s.ranks || 0;
    const granted = getSynergiesGrantedBySkill(s.name, ranks);
    if (granted.length > 0) {
      const targets = granted
        .map((g) => `+${g.bonus} to ${g.targetSkill}${g.conditionDesc ? ` (${g.conditionDesc})` : ''}`)
        .join(', ');
      results.push({
        skill: s,
        synergies: granted,
        description: `${s.name} (${ranks} ranks) grants: ${targets}`
      });
    }
  }

  return results;
}

export const DND35E_CORE_CLASS_SKILLS: Record<string, string[]> = {
  Barbarian: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Listen', 'Ride', 'Survival', 'Swim'],
  Bard: [
    'Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disguise',
    'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (all)', 'Listen', 'Move Silently', 'Perform',
    'Profession', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Swim', 'Tumble', 'Use Magic Device'
  ],
  Cleric: [
    'Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (Arcana)', 'Knowledge (History)',
    'Knowledge (Religion)', 'Knowledge (The Planes)', 'Profession', 'Spellcraft'
  ],
  Druid: [
    'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (Nature)',
    'Listen', 'Profession', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim'
  ],
  Fighter: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim'],
  Monk: [
    'Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Hide',
    'Jump', 'Knowledge (Arcana)', 'Knowledge (Religion)', 'Listen', 'Move Silently',
    'Perform', 'Profession', 'Sense Motive', 'Spot', 'Swim', 'Tumble'
  ],
  Paladin: [
    'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal',
    'Knowledge (Nobility and Royalty)', 'Knowledge (Religion)', 'Profession', 'Ride'
  ],
  Ranger: [
    'Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Hide', 'Jump',
    'Knowledge (Dungeoneering)', 'Knowledge (Geography)', 'Knowledge (Nature)',
    'Listen', 'Move Silently', 'Profession', 'Ride', 'Search', 'Spot', 'Survival', 'Swim', 'Use Rope'
  ],
  Rogue: [
    'Appraise', 'Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy',
    'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide',
    'Intimidate', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession',
    'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'
  ],
  Sorcerer: ['Bluff', 'Concentration', 'Craft', 'Knowledge (Arcana)', 'Profession', 'Spellcraft'],
  Wizard: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge (all)', 'Profession', 'Spellcraft']
};

export function is35eClassSkill(characterClass: string, skillName: string, secondaryClass?: string, additionalClasses?: string[]): boolean {
  const checkSingle = (clsName: string): boolean => {
    const cls = clsName?.trim() || '';
    const list = DND35E_CORE_CLASS_SKILLS[cls];
    if (!list) return false;

    const lower = skillName.trim().toLowerCase();
    if (list.includes('Knowledge (all)') && lower.startsWith('knowledge')) {
      return true;
    }
    return list.some((item) => item.toLowerCase() === lower);
  };

  if (!characterClass) return true;
  if (checkSingle(characterClass)) return true;
  if (secondaryClass && checkSingle(secondaryClass)) return true;
  if (additionalClasses) {
    for (const c of additionalClasses) {
      if (checkSingle(c)) return true;
    }
  }

  // Fallback for custom or homebrew classes not in core SRD dictionary
  const allClasses = [characterClass, secondaryClass, ...(additionalClasses || [])].filter(Boolean);
  if (allClasses.every(c => !DND35E_CORE_CLASS_SKILLS[(c || '').trim()])) {
    return true;
  }
  return false;
}

export function apply35eDefaultClassSkills(char: CharacterData): CharacterData {
  let secClass: string | undefined;
  let addClasses: string[] | undefined;

  if (char.optionalRules?.useGestaltUA72) {
    const allClasses = getGestaltAllClasses(char);
    if (allClasses.length > 0) {
      const classNames = Array.from(new Set(allClasses.map(c => c.className)));
      secClass = classNames[1];
      addClasses = classNames.slice(2);
    }
  } else if (char.optionalRules?.useMulticlassing) {
    secClass = char.optionalRules?.secondaryClass;
  }

  const updatedSkills = char.skills.map((skill) => ({
    ...skill,
    isClassSkill: is35eClassSkill(char.characterClass, skill.name, secClass, addClasses)
  }));
  return {
    ...char,
    skills: updatedSkills
  };
}

export function check35eSkillRankCap(
  skill: Skill,
  level: number
): { isCapped: boolean; maxRanks: number; currentRanks: number; isExceeded: boolean } {
  const isClass = skill.isClassSkill !== false;
  const lvl = Math.max(1, level || 1);
  const maxRanks = isClass ? lvl + 3 : (lvl + 3) / 2;
  const currentRanks = skill.ranks || 0;
  return {
    isCapped: currentRanks >= maxRanks,
    maxRanks,
    currentRanks,
    isExceeded: currentRanks > maxRanks
  };
}

// ----------------------------------------------------
// D&D 3.5e CASTER LEVEL, SPELL RESISTANCE & ARCANE SPELL FAILURE (ASF)
// ----------------------------------------------------

export function getCharacterCasterLevel(char: CharacterData): number {
  let baseCl = 0;
  if (typeof char.casterLevelOverride === 'number') {
    baseCl = char.casterLevelOverride;
  } else {
    const lvl = Math.max(1, char.level || 1);
    const cls = (char.characterClass || '').toLowerCase();

    // Full Casters (Wizard, Sorcerer, Cleric, Druid, Bard)
    if (
      cls.includes('wizard') ||
      cls.includes('sorcerer') ||
      cls.includes('cleric') ||
      cls.includes('druid') ||
      cls.includes('bard')
    ) {
      baseCl = lvl;
    } else if (cls.includes('paladin') || cls.includes('ranger')) {
      // Paladins and Rangers cast spells starting at level 4 with CL = floor(level / 2)
      baseCl = lvl >= 4 ? Math.floor(lvl / 2) : 0;
    } else {
      baseCl = lvl;
    }
  }

  // 3.5e Negative Levels: -1 effective caster level per negative level
  const negLevels = char.negativeLevels || 0;
  return Math.max(0, baseCl - negLevels);
}

export function getSpellPenetrationBonus(char: CharacterData): number {
  if (char.spellPenetration === 'greater') return 4;
  if (char.spellPenetration === 'spell_penetration') return 2;
  return 0;
}

export function calculate35eTotalArcaneSpellFailure(char: CharacterData): {
  totalAsf: number;
  breakdown: Array<{ name: string; asf: number }>;
  isIgnored: boolean;
  note?: string;
} {
  if (typeof char.arcaneSpellFailureOverride === 'number') {
    return {
      totalAsf: char.arcaneSpellFailureOverride,
      breakdown: [{ name: 'Manual Override', asf: char.arcaneSpellFailureOverride }],
      isIgnored: false
    };
  }

  const items = char.inventory || [];
  const equippedArmors = items.filter(
    (it) => it.equipped && typeof it.arcaneSpellFailure === 'number' && it.arcaneSpellFailure > 0
  );

  const isBard = (char.characterClass || '').toLowerCase().includes('bard');

  let totalAsf = 0;
  const breakdown: Array<{ name: string; asf: number }> = [];

  for (const item of equippedArmors) {
    const asf = item.arcaneSpellFailure || 0;
    // Bards ignore light armor ASF in 3.5e
    const isLightArmor =
      item.armorType === 'Light' ||
      (item.notes || '').toLowerCase().includes('light') ||
      item.name.toLowerCase().includes('leather') ||
      item.name.toLowerCase().includes('padded');

    if (isBard && isLightArmor) {
      breakdown.push({ name: `${item.name} (Bard Light Armor Ignore)`, asf: 0 });
    } else {
      totalAsf += asf;
      breakdown.push({ name: item.name, asf });
    }
  }

  return {
    totalAsf,
    breakdown,
    isIgnored: isBard && totalAsf === 0 && equippedArmors.length > 0,
    note: isBard ? 'Bards ignore ASF from light armor for bardic spells' : undefined
  };
}

export function roll35eArcaneSpellFailure(char: CharacterData): {
  passed: boolean;
  roll: number;
  asf: number;
  message: string;
} {
  const { totalAsf } = calculate35eTotalArcaneSpellFailure(char);
  if (totalAsf <= 0) {
    return {
      passed: true,
      roll: 100,
      asf: 0,
      message: 'No Arcane Spell Failure (0% ASF) — spell cast cleanly!'
    };
  }

  // Roll d100 (1-100)
  const roll = Math.floor(Math.random() * 100) + 1;
  const passed = roll > totalAsf;

  return {
    passed,
    roll,
    asf: totalAsf,
    message: passed
      ? `ASF Check Passed! Rolled ${roll}% (needed > ${totalAsf}% ASF). Spell casts normally!`
      : `ASF Check Failed! Rolled ${roll}% (fell within ${totalAsf}% ASF). Spell is lost in somatic interference!`
  };
}

export function roll35eCasterLevelCheck(
  char: CharacterData,
  targetSr?: number
): {
  d20: number;
  cl: number;
  spellPenBonus: number;
  total: number;
  targetSr?: number;
  passed?: boolean;
} {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const cl = getCharacterCasterLevel(char);
  const spellPenBonus = getSpellPenetrationBonus(char);
  const total = d20 + cl + spellPenBonus;

  return {
    d20,
    cl,
    spellPenBonus,
    total,
    targetSr,
    passed: typeof targetSr === 'number' ? total >= targetSr : undefined
  };
}

// ----------------------------------------------------
// D&D 3.5e TURN / REBUKE UNDEAD SYSTEM
// ----------------------------------------------------

export interface TurningStats35e {
  effectiveLevel: number;
  chaMod: number;
  religionSynergy: number;
  turningCheckBonus: number;
  maxUses: number;
  remainingUses: number;
  variant: 'turn' | 'rebuke';
  hasExtraTurning: boolean;
}

export function get35eTurningStats(char: CharacterData): TurningStats35e {
  const chaMod = getAbilityModifier(char.abilities.CHA?.score || 10);
  const cls = (char.characterClass || '').toLowerCase();
  const lvl = Math.max(1, char.level || 1);

  // Paladins turn undead at effective level = Paladin level - 3
  let effectiveLevel = lvl;
  if (typeof char.turnUndeadLevelOverride === 'number') {
    effectiveLevel = char.turnUndeadLevelOverride;
  } else if (cls.includes('paladin')) {
    effectiveLevel = Math.max(0, lvl - 3);
  }

  // Check Knowledge (Religion) synergy for Turn Undead (+2 if 5+ ranks)
  const religionSkill = char.skills.find((s) => s.name.toLowerCase().includes('religion'));
  const religionSynergy = (religionSkill?.ranks || 0) >= 5 ? 2 : 0;
  const turningCheckBonus = chaMod + religionSynergy;

  const hasExtraTurning = Boolean(char.hasExtraTurning);
  const extraUses = hasExtraTurning ? 4 : 0;
  const defaultMaxUses = Math.max(1, 3 + chaMod + extraUses);
  const maxUses = typeof char.turnUndeadUsesMax === 'number' ? char.turnUndeadUsesMax : defaultMaxUses;
  const remainingUses = typeof char.turnUndeadUsesRemaining === 'number' ? char.turnUndeadUsesRemaining : maxUses;

  const isEvil = (char.alignment || '').toLowerCase().includes('evil');
  const variant = char.turnUndeadVariant || (isEvil ? 'rebuke' : 'turn');

  return {
    effectiveLevel,
    chaMod,
    religionSynergy,
    turningCheckBonus,
    maxUses,
    remainingUses,
    variant,
    hasExtraTurning
  };
}

/**
 * 3.5e Turning Check Table (PHB p. 159):
 * Compares 1d20 + Cha mod (and +2 Religion synergy) to determine maximum HD of undead affected.
 */
export function get35eTurningCheckMaxHd(turningLevel: number, checkRollTotal: number): number {
  let relativeOffset = 0;
  if (checkRollTotal <= 0) relativeOffset = -4;
  else if (checkRollTotal <= 3) relativeOffset = -3;
  else if (checkRollTotal <= 6) relativeOffset = -2;
  else if (checkRollTotal <= 9) relativeOffset = -1;
  else if (checkRollTotal <= 12) relativeOffset = 0;
  else if (checkRollTotal <= 15) relativeOffset = 1;
  else if (checkRollTotal <= 18) relativeOffset = 2;
  else if (checkRollTotal <= 21) relativeOffset = 3;
  else relativeOffset = 4;

  return Math.max(0, turningLevel + relativeOffset);
}

export interface TurningRollResult35e {
  d20: number;
  checkBonus: number;
  checkTotal: number;
  maxHdCreatureAffected: number;
  damageDice: [number, number];
  damageBonus: number;
  totalDamageHd: number; // Total HD of undead turned/rebuked
  effectiveLevel: number;
  variant: 'turn' | 'rebuke';
  destroyThresholdHd: number; // If creature HD <= destroyThresholdHd, it is destroyed / commanded
}

export function roll35eTurningSequence(char: CharacterData): TurningRollResult35e {
  const stats = get35eTurningStats(char);
  const d20 = Math.floor(Math.random() * 20) + 1;
  const checkTotal = d20 + stats.turningCheckBonus;
  const maxHdCreatureAffected = get35eTurningCheckMaxHd(stats.effectiveLevel, checkTotal);

  // 2d6 + Cleric level + Cha modifier
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const damageBonus = stats.effectiveLevel + stats.chaMod;
  const totalDamageHd = Math.max(1, d1 + d2 + damageBonus);
  const destroyThresholdHd = Math.floor(stats.effectiveLevel / 2);

  return {
    d20,
    checkBonus: stats.turningCheckBonus,
    checkTotal,
    maxHdCreatureAffected,
    damageDice: [d1, d2],
    damageBonus,
    totalDamageHd,
    effectiveLevel: stats.effectiveLevel,
    variant: stats.variant,
    destroyThresholdHd
  };
}

export function get35eTouchAC(char: CharacterData): number {
  return get35eArmorClass(char).touchAc;
}

export function get35eFlatFootedAC(char: CharacterData): number {
  return get35eArmorClass(char).flatFootedAc;
}

export function getCharacterBab(char: CharacterData): number {
  const isGestalt = Boolean(char.optionalRules?.useGestaltUA72);

  if (!isGestalt) {
    if (typeof char.bab === 'number') return char.bab;
    if (typeof char.baseAttackBonus === 'number') return char.baseAttackBonus;
  }

  const level = Math.max(1, char.level || 1);

  const getBabForClass = (clsName: string, clsLevel: number = level): number => {
    const className = (clsName || '').toLowerCase();
    // Full BAB (1.0x Level): Fighter, Paladin, Ranger, Barbarian
    if (
      className.includes('fighter') ||
      className.includes('paladin') ||
      className.includes('ranger') ||
      className.includes('barbarian')
    ) {
      return clsLevel;
    }

    // Poor BAB (0.5x Level): Wizard, Sorcerer
    if (className.includes('wizard') || className.includes('sorcerer')) {
      return Math.floor(clsLevel * 0.5);
    }

    // Medium BAB (0.75x Level): Cleric, Druid, Monk, Rogue, Bard
    return Math.floor(clsLevel * 0.75);
  };

  const primaryBab = getBabForClass(char.characterClass, level);

  // Gestalt UA 72: Characters use the better base attack bonus across their tracks
  if (isGestalt) {
    const tracks = getCharacterGestaltTracks(char);
    const trackBabs = tracks.map(t => {
      // Calculate BAB for this track
      // If a track has multiclassed, sum the BAB of each class on that track
      return t.classes.reduce((sum, c) => {
        const clsLevel = Math.max(1, c.level || level);
        return sum + getBabForClass(c.className, clsLevel);
      }, 0);
    });
    const calculatedGestaltBab = Math.max(primaryBab, ...trackBabs);
    return Math.max(typeof char.bab === 'number' ? char.bab : 0, calculatedGestaltBab);
  }
  return primaryBab;
}

export function get35eGrappleSizeModifier(size?: string): number {
  switch ((size || 'Medium').toLowerCase()) {
    case 'colossal': return 16;
    case 'gargantuan': return 12;
    case 'huge': return 8;
    case 'large': return 4;
    case 'medium': return 0;
    case 'small': return -4;
    case 'tiny': return -8;
    case 'diminutive': return -12;
    case 'fine': return -16;
    default: return 0;
  }
}

export function get35eGrapple(char: CharacterData): number {
  const bab = getCharacterBab(char);
  const strMod = getAbilityModifier(char.abilities.STR?.score || 10);
  const sizeMod = get35eGrappleSizeModifier(char.sizeCategory);
  return bab + strMod + sizeMod;
}

export interface IterativeAttackEntry {
  attackIndex: number; // 0-based: 0, 1, 2, 3
  attackNumber: number; // 1-based: 1, 2, 3, 4
  penalty: number; // 0, -5, -10, -15
  bonus: number; // baseBonus + penalty
  label: string; // "1st Attack", "2nd Attack", etc.
  display: string; // e.g. "+11", "+6"
}

/**
 * Calculates 3.5e iterative attacks for a given primary attack bonus and BAB.
 * At BAB +1 to +5: 1 attack (+0)
 * At BAB +6 to +10: 2 attacks (+0, -5)
 * At BAB +11 to +15: 3 attacks (+0, -5, -10)
 * At BAB +16+: 4 attacks (+0, -5, -10, -15)
 */
export function get35eIterativeAttacks(
  primaryAttackBonus: number,
  bab: number
): IterativeAttackEntry[] {
  const attacks: IterativeAttackEntry[] = [
    {
      attackIndex: 0,
      attackNumber: 1,
      penalty: 0,
      bonus: primaryAttackBonus,
      label: '1st Attack',
      display: formatModifier(primaryAttackBonus)
    }
  ];

  if (bab >= 6) {
    attacks.push({
      attackIndex: 1,
      attackNumber: 2,
      penalty: -5,
      bonus: primaryAttackBonus - 5,
      label: '2nd Attack',
      display: formatModifier(primaryAttackBonus - 5)
    });
  }
  if (bab >= 11) {
    attacks.push({
      attackIndex: 2,
      attackNumber: 3,
      penalty: -10,
      bonus: primaryAttackBonus - 10,
      label: '3rd Attack',
      display: formatModifier(primaryAttackBonus - 10)
    });
  }
  if (bab >= 16) {
    attacks.push({
      attackIndex: 3,
      attackNumber: 4,
      penalty: -15,
      bonus: primaryAttackBonus - 15,
      label: '4th Attack',
      display: formatModifier(primaryAttackBonus - 15)
    });
  }

  return attacks;
}

export function format35eIterativeString(primaryBonus: number, bab: number): string {
  const entries = get35eIterativeAttacks(primaryBonus, bab);
  return entries.map(e => e.display).join(' / ');
}

export function format35eBabProgression(bab: number): string {
  return format35eIterativeString(bab, bab);
}

export interface Calculated35eAttackBonus {
  totalAttackBonus: number;
  bab: number;
  abilityUsed: AbilityName;
  abilityMod: number;
  sizeMod: number;
  weaponSizePenalty: number;
  enhancementBonus: number;
  miscBonus: number;
  profPenalty: number;
  iterativeAttacks: IterativeAttackEntry[];
  fullAttackDisplay: string;
  breakdown: string;
}

export function calculate35eAttackBonus(
  char: CharacterData,
  attack: Attack
): Calculated35eAttackBonus {
  const bab = getCharacterBab(char);
  const abilities = getEffectiveAbilities(char);
  const strMod = getAbilityModifier(abilities.STR?.score ?? 10);
  const dexMod = getAbilityModifier(abilities.DEX?.score ?? 10);

  // If manual override is explicitly requested
  if (attack.useManualBonus) {
    const total = attack.attackBonus ?? 0;
    const iteratives = get35eIterativeAttacks(total, bab);
    return {
      totalAttackBonus: total,
      bab,
      abilityUsed: attack.abilityUsed || 'STR',
      abilityMod: 0,
      sizeMod: 0,
      weaponSizePenalty: 0,
      enhancementBonus: 0,
      miscBonus: 0,
      profPenalty: 0,
      iterativeAttacks: iteratives,
      fullAttackDisplay: iteratives.map(i => i.display).join(' / ') || formatModifier(total),
      breakdown: `Manual Override (${formatModifier(total)})`
    };
  }

  // If monster with pre-baked stat block attack
  if (char.isMonster || char.characterClass === 'Monster') {
    const total = attack.attackBonus ?? 0;
    const iteratives = get35eIterativeAttacks(total, bab);
    return {
      totalAttackBonus: total,
      bab,
      abilityUsed: attack.abilityUsed || 'STR',
      abilityMod: 0,
      sizeMod: 0,
      weaponSizePenalty: 0,
      enhancementBonus: 0,
      miscBonus: 0,
      profPenalty: 0,
      iterativeAttacks: iteratives,
      fullAttackDisplay: iteratives.map(i => i.display).join(' / ') || formatModifier(total),
      breakdown: `Monster Stat Block (${formatModifier(total)})`
    };
  }

  // Determine ability to use
  let abilityUsed: AbilityName = 'STR';
  const nameLower = (attack.name || '').toLowerCase();
  const rangeLower = (attack.range || '').toLowerCase();
  const notesLower = (attack.notes || '').toLowerCase();

  const isRanged = rangeLower.includes('ranged') || rangeLower.includes('range') ||
                   nameLower.includes('bow') || nameLower.includes('crossbow') ||
                   nameLower.includes('sling') || nameLower.includes('dart') ||
                   nameLower.includes('shuriken') || nameLower.includes('blowgun');

  const isLightOrFinesse = nameLower.includes('rapier') || nameLower.includes('dagger') ||
                           nameLower.includes('shortsword') || nameLower.includes('whip') ||
                           notesLower.includes('finesse') || notesLower.includes('light');

  const hasWeaponFinesse = Boolean(
    char.feats?.some(f => f.name.toLowerCase().includes('weapon finesse') || f.name.toLowerCase().includes('finesse'))
  );

  if (attack.abilityUsed) {
    abilityUsed = attack.abilityUsed;
  } else if (isRanged && !rangeLower.includes('thrown')) {
    abilityUsed = 'DEX';
  } else if (hasWeaponFinesse && isLightOrFinesse && dexMod > strMod) {
    abilityUsed = 'DEX';
  } else {
    abilityUsed = 'STR';
  }

  const abilityMod = getAbilityModifier(abilities[abilityUsed]?.score ?? 10);
  const sizeMod = get35eSizeModifier(char.sizeCategory, char.race);
  const weaponSizePenalty = attack.weaponSize
    ? calculate35eWeaponSizePenalty(char.sizeCategory || 'Medium', attack.weaponSize).penalty
    : 0;

  // Enhancement bonus:
  let enhancementBonus = attack.enhancementBonus ?? 0;
  if (attack.enhancementBonus === undefined) {
    const match = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
    if (match) {
      enhancementBonus = parseInt(match[1], 10);
    }
  }

  // Misc bonus (e.g. Weapon Focus):
  let miscBonus = attack.miscBonus ?? 0;
  const hasWeaponFocus = Boolean(
    char.feats?.some(f => {
      const fn = f.name.toLowerCase();
      return fn.includes('weapon focus') && (fn.includes(nameLower) || nameLower.includes(fn.replace('weapon focus', '').replace(/[\(\)]/g, '').trim()));
    })
  );
  if (hasWeaponFocus && attack.miscBonus === undefined) {
    miscBonus += 1;
  }

  const profPenalty = attack.isProficient === false ? -4 : 0;
  const hasMultiattack = Boolean(
    char.feats?.some(f => (f.name || '').toLowerCase().includes('multiattack'))
  );
  const naturalPenalty = attack.isSecondaryNatural ? (hasMultiattack ? -2 : -5) : 0;

  const totalAttackBonus = bab + abilityMod + sizeMod + weaponSizePenalty + enhancementBonus + miscBonus + profPenalty + naturalPenalty;
  
  // 3.5e Monster Manual p. 312: Natural attacks do not gain iterative attacks from high BAB
  const iterativeAttacks: IterativeAttackEntry[] = attack.isNatural
    ? [{ attackIndex: 0, attackNumber: 1, penalty: 0, bonus: totalAttackBonus, label: '1st Attack', display: formatModifier(totalAttackBonus) }]
    : get35eIterativeAttacks(totalAttackBonus, bab);
  const fullAttackDisplay = iterativeAttacks.map(i => i.display).join(' / ') || formatModifier(totalAttackBonus);

  const parts = [
    `BAB ${formatModifier(bab)}`,
    `${abilityUsed} ${formatModifier(abilityMod)}`
  ];
  if (sizeMod !== 0) parts.push(`Size ${formatModifier(sizeMod)}`);
  if (weaponSizePenalty !== 0) parts.push(`Size Penalty ${weaponSizePenalty}`);
  if (enhancementBonus !== 0) parts.push(`Magic +${enhancementBonus}`);
  if (miscBonus !== 0) parts.push(`Misc ${formatModifier(miscBonus)}`);
  if (profPenalty !== 0) parts.push(`Non-Proficient ${profPenalty}`);
  if (naturalPenalty !== 0) parts.push(`Secondary Natural ${naturalPenalty}`);

  const breakdown = parts.join(' + ') + ` = ${formatModifier(totalAttackBonus)}`;

  return {
    totalAttackBonus,
    bab,
    abilityUsed,
    abilityMod,
    sizeMod,
    weaponSizePenalty,
    enhancementBonus,
    miscBonus,
    profPenalty,
    iterativeAttacks,
    fullAttackDisplay,
    breakdown
  };
}

export interface Calculated35eDamageFormula {
  damageFormula: string;
  baseDice: string;
  effectiveStrBonus: number;
  enhancementBonus: number;
  miscBonus: number;
  breakdown: string;
}

export function calculate35eDamageFormula(
  char: CharacterData,
  attack: Attack
): Calculated35eDamageFormula {
  // If manual override or monster stat block, use attack.damage directly
  if (attack.useManualBonus || char.isMonster || char.characterClass === 'Monster') {
    return {
      damageFormula: attack.damage || '1d6',
      baseDice: attack.damage || '1d6',
      effectiveStrBonus: 0,
      enhancementBonus: 0,
      miscBonus: 0,
      breakdown: attack.damage || '1d6'
    };
  }

  const abilities = getEffectiveAbilities(char);
  const strMod = getAbilityModifier(abilities.STR?.score ?? 10);

  // Extract base dice from attack.baseDamageDice or attack.damage (e.g. "1d6" from "1d6 + 0" or "1d6" or "1d8 + 3")
  let baseDice = attack.baseDamageDice || '';
  if (!baseDice && attack.damage) {
    const diceMatch = String(attack.damage).match(/^([0-9]+d[0-9]+)/i);
    if (diceMatch) {
      baseDice = diceMatch[1];
    } else {
      baseDice = attack.damage.split(' ')[0] || '1d6';
    }
  }
  if (!baseDice) baseDice = '1d6';

  const nameLower = (attack.name || '').toLowerCase();
  const rangeLower = (attack.range || '').toLowerCase();
  const notesLower = (attack.notes || '').toLowerCase();

  const isCrossbow = nameLower.includes('crossbow') || notesLower.includes('crossbow');
  const isSling = nameLower.includes('sling');
  const isBow = (nameLower.includes('bow') && !isCrossbow) || rangeLower.includes('bow');
  const isComposite = nameLower.includes('composite') || notesLower.includes('composite');
  const isThrown = rangeLower.includes('thrown') || notesLower.includes('thrown');
  const isRanged = rangeLower.includes('ranged') || isCrossbow || isBow || isSling;

  let effectiveStrBonus = strMod;

  const twoHandedMult = attack.twoHandedMultiplier ?? 1.5;
  const offhandMult = attack.offhandMultiplier ?? 0.5;

  if (attack.isSecondaryNatural) {
    // Secondary natural attack adds 0.5x STR bonus (rounded down). Negative STR applies in full.
    effectiveStrBonus = strMod > 0 ? Math.floor(strMod * 0.5) : strMod;
  } else if (attack.isNatural && (attack.isSoleNaturalAttack || (attack.twoHandedMultiplier && attack.twoHandedMultiplier > 1))) {
    // Sole primary natural attack adds 1.5x STR bonus
    const mult = attack.twoHandedMultiplier ?? 1.5;
    effectiveStrBonus = strMod > 0 ? Math.floor(strMod * mult) : strMod;
  } else if (attack.isOffhand || attack.wieldGrip === 'OH') {
    // Off-hand adds offhandMult x STR bonus (rounded down). Negative STR applies in full.
    effectiveStrBonus = strMod > 0 ? Math.floor(strMod * offhandMult) : strMod;
  } else if (attack.isTwoHanded || attack.wieldGrip === '2H') {
    // Two-handed adds twoHandedMult x STR bonus (rounded down). Negative STR applies in full.
    effectiveStrBonus = strMod > 0 ? Math.floor(strMod * twoHandedMult) : strMod;
  } else if (isRanged && !isThrown) {
    if (isCrossbow) {
      effectiveStrBonus = 0; // Crossbows add no STR
    } else if (isSling) {
      effectiveStrBonus = strMod; // Slings add STR mod in 3.5e
    } else if (isBow) {
      if (isComposite) {
        effectiveStrBonus = strMod; // Composite bows add STR bonus (up to bow rating)
      } else {
        effectiveStrBonus = strMod < 0 ? strMod : 0; // Standard bows only take penalties for low STR
      }
    } else {
      effectiveStrBonus = 0;
    }
  }

  // Enhancement bonus to damage:
  let enhancementBonus = attack.enhancementBonus ?? 0;
  if (attack.enhancementBonus === undefined) {
    const match = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
    if (match) {
      enhancementBonus = parseInt(match[1], 10);
    }
  }

  // Misc damage bonus (e.g. Weapon Specialization):
  let miscBonus = attack.miscBonusDamage ?? 0;
  const hasWeaponSpec = Boolean(
    char.feats?.some(f => {
      const fn = f.name.toLowerCase();
      return fn.includes('weapon specialization') && (fn.includes(nameLower) || nameLower.includes(fn.replace('weapon specialization', '').replace(/[\(\)]/g, '').trim()));
    })
  );
  if (hasWeaponSpec && attack.miscBonusDamage === undefined) {
    miscBonus += 2;
  }

  const totalFlatMod = effectiveStrBonus + enhancementBonus + miscBonus;
  const damageFormula = totalFlatMod !== 0
    ? `${baseDice} ${totalFlatMod >= 0 ? '+' : '-'} ${Math.abs(totalFlatMod)}`
    : baseDice;

  const parts = [baseDice];
  if (effectiveStrBonus !== 0) {
    const label = attack.isOffhand ? '½ STR' : attack.isTwoHanded ? '1.5× STR' : 'STR';
    parts.push(`${formatModifier(effectiveStrBonus)} (${label})`);
  }
  if (enhancementBonus !== 0) parts.push(`+${enhancementBonus} Magic`);
  if (miscBonus !== 0) parts.push(`${formatModifier(miscBonus)} Misc`);

  const breakdown = parts.join(' ');

  return {
    damageFormula,
    baseDice,
    effectiveStrBonus,
    enhancementBonus,
    miscBonus,
    breakdown
  };
}

export interface DamagePart {
  diceCount: number;
  diceSides: number;
  flatMod: number;
  damageType?: string;
  rawText: string;
}

export interface RolledDamagePart {
  damageType?: string;
  rolls: number[];
  sumDice: number;
  flatMod: number;
  totalPart: number;
  formatted: string;
}

export interface CompoundDamageResult {
  parts: RolledDamagePart[];
  totalDamage: number;
  breakdown: string;
  isCrit: boolean;
  canCrit: boolean;
}

/**
 * Parses and rolls complex damage expressions like "1d8 slashing + 1d6 fire + 3"
 * Handles D&D 5e critical hit rules:
 * - Only attack rolls can crit (canCrit = true).
 * - On a crit, only dice count is doubled (1d8 -> 2d8), flat modifiers remain unchanged.
 */
export function rollCompoundDamage(
  damageExpr: string,
  isCrit: boolean = false,
  canCrit: boolean = true
): CompoundDamageResult {
  if (!damageExpr || !damageExpr.trim()) {
    damageExpr = '1d8';
  }

  // Remove parenthetical notes like (Versatile 1d10 + 5) or (2d6 on crit) before splitting terms
  const cleanedExpr = damageExpr.replace(/\(.*?\)/g, '').trim();

  // Normalize expression and split on '+' or '-' keeping track of terms
  const terms = cleanedExpr.split(/(?=[+-])/).map(t => t.trim()).filter(Boolean);

  const effectiveCrit = isCrit && canCrit;
  const rolledParts: RolledDamagePart[] = [];
  let totalDamage = 0;

  for (const rawTerm of terms) {
    const isNegative = rawTerm.startsWith('-');
    const termClean = rawTerm.replace(/^[+-]\s*/, '').trim();

    // Check if term is a dice expression, e.g., "1d8 slashing" or "2d6 fire" or "1d8 slashing / fire"
    const diceMatch = termClean.match(/^(\d+)d(\d+)(?:\s+(.+))?/i);
    // Check if term is a flat modifier, e.g., "5 slashing" or "5" or "5 Slashing / Magic"
    const flatMatch = termClean.match(/^(\d+)(?:\s+(.+))?/i);

    if (diceMatch) {
      let diceCount = parseInt(diceMatch[1], 10) || 1;
      const diceSides = parseInt(diceMatch[2], 10) || 8;
      const damageType = diceMatch[3] ? diceMatch[3].toLowerCase() : undefined;

      if (effectiveCrit) {
        diceCount *= 2; // D&D 5e rule: double all damage dice on critical hit
      }

      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < diceCount; i++) {
        const r = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(r);
        sum += r;
      }

      if (isNegative) sum = -sum;

      const typeLabel = damageType ? ` ${damageType}` : '';
      const formatted = `[${rolls.join(' + ')}]${typeLabel}`;

      rolledParts.push({
        damageType,
        rolls,
        sumDice: sum,
        flatMod: 0,
        totalPart: sum,
        formatted
      });

      totalDamage += sum;
    } else if (flatMatch) {
      let mod = parseInt(flatMatch[1], 10) || 0;
      const damageType = flatMatch[2] ? flatMatch[2].toLowerCase() : undefined;

      if (isNegative) mod = -mod;

      const typeLabel = damageType ? ` ${damageType}` : '';
      const signStr = mod >= 0 ? `+${mod}` : `${mod}`;
      const formatted = `${signStr}${typeLabel}`;

      rolledParts.push({
        damageType,
        rolls: [],
        sumDice: 0,
        flatMod: mod,
        totalPart: mod,
        formatted
      });

      totalDamage += mod;
    }
  }

  // Fallback if parsing returned nothing valid
  if (rolledParts.length === 0) {
    const r = Math.floor(Math.random() * 8) + 1;
    const finalR = effectiveCrit ? r + (Math.floor(Math.random() * 8) + 1) : r;
    return {
      parts: [{
        rolls: [finalR],
        sumDice: finalR,
        flatMod: 0,
        totalPart: finalR,
        formatted: `[${finalR}]`
      }],
      totalDamage: finalR,
      breakdown: `${effectiveCrit ? '[CRIT 2x DICE] ' : ''}[${finalR}] = ${finalR}`,
      isCrit: effectiveCrit,
      canCrit
    };
  }

  totalDamage = Math.max(0, totalDamage);

  const partsFormatted = rolledParts.map(p => p.formatted).join(' ');
  const critPrefix = effectiveCrit ? '🔥 [CRIT 2x DICE] ' : '';
  const breakdown = `${critPrefix}${partsFormatted} = ${totalDamage}`;

  return {
    parts: rolledParts,
    totalDamage,
    breakdown,
    isCrit: effectiveCrit,
    canCrit
  };
}

export function isHealingSpell(spell: { name: string; description?: string; damageType?: string }): boolean {
  if (spell.damageType === 'Healing') return true;
  const nameLower = spell.name.toLowerCase();
  const descLower = (spell.description || '').toLowerCase();
  return nameLower.includes('cure') || nameLower.includes('heal') || nameLower.includes('goodberry') ||
         nameLower.includes('revivify') || descLower.includes('regain') || descLower.includes('hit point') || descLower.includes('heals');
}

export function isHealingItem(item: { name: string; notes?: string }): boolean {
  const nameLower = item.name.toLowerCase();
  const notesLower = (item.notes || '').toLowerCase();
  return nameLower.includes('potion of healing') || nameLower.includes('healing potion') || nameLower.includes('elixir of heal') ||
         notesLower.includes('regain') || notesLower.includes('heal') || notesLower.includes('restores hp') || notesLower.includes('hit points');
}

export function getHealingExpression(itemOrSpell: { name: string; notes?: string; description?: string; damageType?: string }): string {
  if (itemOrSpell.damageType === 'Healing') {
    const desc = itemOrSpell.description || '';
    const match = desc.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
    if (match) return match[1];
  }
  const strToSearch = `${itemOrSpell.notes || ''} ${itemOrSpell.description || ''} ${itemOrSpell.name}`.toLowerCase();
  const diceMatch = strToSearch.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
  if (diceMatch) return diceMatch[1];

  const nameLower = itemOrSpell.name.toLowerCase();
  if (nameLower.includes('supreme potion')) return '10d4 + 20';
  if (nameLower.includes('superior potion')) return '8d4 + 8';
  if (nameLower.includes('greater potion')) return '4d4 + 4';
  if (nameLower.includes('potion of healing') || nameLower.includes('healing potion')) return '2d4 + 2';

  return '2d4 + 2';
}

export function isCharacterDead(char?: { isMonster?: boolean; deathSavesFailures?: number; conditions?: string[] } | null): boolean {
  if (!char) return false;
  // If monster, standard monsters don't use 3 PC death saves unless condition Dead is added
  if (char.isMonster) {
    return (char.conditions || []).includes('Dead');
  }
  return (
    (char.deathSavesFailures ?? 0) >= 3 ||
    (char.conditions || []).includes('Dead')
  );
}

export function isReviveSpell(spellNameOrObj?: string | { name?: string; description?: string } | null): boolean {
  if (!spellNameOrObj) return false;
  const text = typeof spellNameOrObj === 'string'
    ? spellNameOrObj.toLowerCase()
    : `${spellNameOrObj.name || ''} ${spellNameOrObj.description || ''}`.toLowerCase();

  return (
    text.includes('revivify') ||
    text.includes('raise dead') ||
    text.includes('resurrection') ||
    text.includes('true resurrection') ||
    text.includes('reincarnate') ||
    text.includes('return to life') ||
    text.includes('returns to life') ||
    text.includes('restored to life')
  );
}

export function rollHealing(expression: string): { totalHeal: number; breakdown: string } {
  const clean = expression.replace(/\s+/g, '');
  const match = clean.match(/^(\d+)d(\d+)([\+\-]\d+)?$/i);
  if (match) {
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const mod = match[3] ? parseInt(match[3], 10) : 0;
    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    const total = Math.max(1, sum + mod);
    const modStr = mod !== 0 ? (mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`) : '';
    return {
      totalHeal: total,
      breakdown: `[${rolls.join(', ')}]${modStr} = ${total}`
    };
  }

  const flatNum = parseInt(clean, 10);
  if (!isNaN(flatNum)) {
    return { totalHeal: flatNum, breakdown: `${flatNum}` };
  }

  return { totalHeal: 5, breakdown: `[5] = 5` };
}

export function getEffectiveSpellSaveDC(char: CharacterData): number {
  if (char.spellSaveDCOverride !== undefined && char.spellSaveDCOverride > 0) {
    return char.spellSaveDCOverride;
  }
  const prof = getProficiencyBonus(char.level || 1);
  const castingAbility = char.spellcastingAbility || 'INT';
  const abilities = getEffectiveAbilities(char);
  const mod = getAbilityModifier(abilities[castingAbility]?.score || 10);
  return 8 + prof + mod;
}

export function getEffectiveSpellAttackBonus(char: CharacterData): number {
  if (char.spellAttackBonusOverride !== undefined && char.spellAttackBonusOverride !== 0) {
    return char.spellAttackBonusOverride;
  }
  const prof = getProficiencyBonus(char.level || 1);
  const castingAbility = char.spellcastingAbility || 'INT';
  const abilities = getEffectiveAbilities(char);
  const mod = getAbilityModifier(abilities[castingAbility]?.score || 10);
  return prof + mod;
}

export const getSpellSaveDC = getEffectiveSpellSaveDC;
export const getSpellAttackBonus = getEffectiveSpellAttackBonus;

// ----------------------------------------------------
// D&D 3.5e CRITICAL THREATS, MULTIPLIERS & CONFIRMATION
// ----------------------------------------------------

export function get35eEffectiveThreatRange(attack: Attack): { minRoll: number; minThreat: number; label: string; display: string } {
  let baseThreat = attack.threatRange && attack.threatRange >= 15 && attack.threatRange <= 20
    ? attack.threatRange
    : 20;

  if (attack.isKeen) {
    // Keen or Improved Critical doubles the threat range:
    // 20 (span 1: 20) -> 19 (span 2: 19-20)
    // 19 (span 2: 19-20) -> 17 (span 4: 17-20)
    // 18 (span 3: 18-20) -> 15 (span 6: 15-20)
    const span = 21 - baseThreat;
    baseThreat = Math.max(12, 21 - (span * 2));
  }

  const label = baseThreat === 20 ? '20' : `${baseThreat}–20`;
  return { minRoll: baseThreat, minThreat: baseThreat, label, display: label };
}

export function get35eCriticalMultiplier(attack: Attack): { multiplier: number; display: string } {
  const mult = attack.critMultiplier && attack.critMultiplier >= 2 && attack.critMultiplier <= 5
    ? attack.critMultiplier
    : 2;
  return { multiplier: mult, display: `×${mult}` };
}

export function is35eCriticalThreat(naturalD20: number, attack: Attack): boolean {
  const { minRoll } = get35eEffectiveThreatRange(attack);
  return naturalD20 >= minRoll;
}

export function calculate35eCriticalDamage(
  damageExpr: string,
  critMultiplier: number = 2
): {
  multipliedExpr: string;
  diceMultiplied: string;
  staticBonusMultiplied: number;
} {
  const clean = (damageExpr || '1d8').trim();
  const match = clean.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
  const multiplier = Math.max(2, Math.min(6, critMultiplier || 2));

  if (match) {
    const diceCount = parseInt(match[1], 10);
    const diceSides = parseInt(match[2], 10);
    const sign = match[3] || '+';
    const staticMod = match[4] ? parseInt(match[4], 10) : 0;
    const signedMod = sign === '-' ? -staticMod : staticMod;

    const totalDice = diceCount * multiplier;
    const totalStatic = signedMod * multiplier;

    const staticStr = totalStatic !== 0
      ? (totalStatic > 0 ? ` + ${totalStatic}` : ` - ${Math.abs(totalStatic)}`)
      : '';

    return {
      multipliedExpr: `${totalDice}d${diceSides}${staticStr}`,
      diceMultiplied: `${totalDice}d${diceSides}`,
      staticBonusMultiplied: totalStatic
    };
  }

  return {
    multipliedExpr: `(${clean}) × ${multiplier}`,
    diceMultiplied: clean,
    staticBonusMultiplied: 0
  };
}

// ----------------------------------------------------
// D&D 3.5e CARRYING CAPACITY & ARMOR CHECK PENALTY (ACP)
// ----------------------------------------------------

export const DND35E_STR_CARRYING_CAPACITY: Record<number, { light: number; medium: number; heavy: number }> = {
  1: { light: 3, medium: 6, heavy: 10 },
  2: { light: 6, medium: 13, heavy: 20 },
  3: { light: 10, medium: 20, heavy: 30 },
  4: { light: 13, medium: 26, heavy: 40 },
  5: { light: 16, medium: 33, heavy: 50 },
  6: { light: 20, medium: 40, heavy: 60 },
  7: { light: 23, medium: 46, heavy: 70 },
  8: { light: 26, medium: 53, heavy: 80 },
  9: { light: 30, medium: 60, heavy: 90 },
  10: { light: 33, medium: 66, heavy: 100 },
  11: { light: 38, medium: 76, heavy: 115 },
  12: { light: 43, medium: 86, heavy: 130 },
  13: { light: 50, medium: 100, heavy: 150 },
  14: { light: 58, medium: 116, heavy: 175 },
  15: { light: 66, medium: 133, heavy: 200 },
  16: { light: 76, medium: 153, heavy: 230 },
  17: { light: 86, medium: 173, heavy: 260 },
  18: { light: 100, medium: 200, heavy: 300 },
  19: { light: 116, medium: 233, heavy: 350 },
  20: { light: 133, medium: 266, heavy: 400 },
  21: { light: 153, medium: 306, heavy: 460 },
  22: { light: 173, medium: 346, heavy: 520 },
  23: { light: 200, medium: 400, heavy: 600 },
  24: { light: 233, medium: 466, heavy: 700 },
  25: { light: 266, medium: 533, heavy: 800 },
  26: { light: 306, medium: 613, heavy: 920 },
  27: { light: 346, medium: 693, heavy: 1040 },
  28: { light: 400, medium: 800, heavy: 1200 },
  29: { light: 466, medium: 933, heavy: 1400 }
};

export function get35eSizeCarryingMultiplier(sizeCategory?: string, isQuadruped?: boolean): number {
  const size = (sizeCategory || 'Medium').toLowerCase();
  if (isQuadruped) {
    if (size.includes('fine')) return 0.25;
    if (size.includes('diminutive')) return 0.5;
    if (size.includes('tiny')) return 0.75;
    if (size.includes('small')) return 1.0;
    if (size.includes('medium')) return 1.5;
    if (size.includes('large')) return 3.0;
    if (size.includes('huge')) return 6.0;
    if (size.includes('gargantuan')) return 12.0;
    if (size.includes('colossal')) return 24.0;
    return 1.5;
  }

  if (size.includes('fine')) return 0.125;
  if (size.includes('diminutive')) return 0.25;
  if (size.includes('tiny')) return 0.5;
  if (size.includes('small')) return 0.75;
  if (size.includes('medium')) return 1.0;
  if (size.includes('large')) return 2.0;
  if (size.includes('huge')) return 4.0;
  if (size.includes('gargantuan')) return 8.0;
  if (size.includes('colossal')) return 16.0;
  return 1.0;
}

export function calculate35eCarryingCapacity(
  strScore: number,
  sizeCategory?: string,
  isQuadruped?: boolean
): {
  lightMax: number;
  mediumMax: number;
  heavyMax: number;
  liftOverhead: number;
  liftOffGround: number;
  pushOrDrag: number;
  multiplier: number;
} {
  const clampedStr = Math.max(1, strScore || 10);
  let baseHeavy = 100;
  let baseLight = 33;
  let baseMedium = 66;

  if (clampedStr <= 29) {
    const row = DND35E_STR_CARRYING_CAPACITY[clampedStr] || DND35E_STR_CARRYING_CAPACITY[10];
    baseLight = row.light;
    baseMedium = row.medium;
    baseHeavy = row.heavy;
  } else {
    const diff = clampedStr - 20;
    const baseDiff = (diff % 10) + 10;
    const multiple = Math.pow(4, Math.floor(diff / 10));
    const row = DND35E_STR_CARRYING_CAPACITY[baseDiff] || DND35E_STR_CARRYING_CAPACITY[20];
    baseLight = row.light * multiple;
    baseMedium = row.medium * multiple;
    baseHeavy = row.heavy * multiple;
  }

  const mult = get35eSizeCarryingMultiplier(sizeCategory, isQuadruped);
  const lightMax = Math.round(baseLight * mult);
  const mediumMax = Math.round(baseMedium * mult);
  const heavyMax = Math.round(baseHeavy * mult);

  return {
    lightMax,
    mediumMax,
    heavyMax,
    liftOverhead: heavyMax,
    liftOffGround: heavyMax * 2,
    pushOrDrag: heavyMax * 5,
    multiplier: mult
  };
}

export function calculate35eEncumbranceLoad(
  totalWeightLbs: number,
  capacity: { lightMax: number; mediumMax: number; heavyMax: number }
): {
  load: 'light' | 'medium' | 'heavy' | 'overburdened';
  label: string;
  maxDexBonus: number | null;
  loadAcp: number;
  speedMultiplier: number;
  runMultiplier: number;
} {
  const wt = Math.max(0, totalWeightLbs || 0);

  if (wt <= capacity.lightMax) {
    return {
      load: 'light',
      label: 'Light Load',
      maxDexBonus: null,
      loadAcp: 0,
      speedMultiplier: 1.0,
      runMultiplier: 4
    };
  }
  if (wt <= capacity.mediumMax) {
    return {
      load: 'medium',
      label: 'Medium Load',
      maxDexBonus: 3,
      loadAcp: -3,
      speedMultiplier: 0.67,
      runMultiplier: 4
    };
  }
  if (wt <= capacity.heavyMax) {
    return {
      load: 'heavy',
      label: 'Heavy Load',
      maxDexBonus: 1,
      loadAcp: -6,
      speedMultiplier: 0.67,
      runMultiplier: 3
    };
  }

  return {
    load: 'overburdened',
    label: 'Overburdened',
    maxDexBonus: 0,
    loadAcp: -10,
    speedMultiplier: 0,
    runMultiplier: 0
  };
}

export function calculate35eTotalArmorCheckPenalty(char: CharacterData): {
  totalAcp: number;
  armorAcp: number;
  shieldAcp: number;
  loadAcp: number;
  effectiveBodyAcp: number;
  breakdown: string[];
} {
  if (typeof char.armorCheckPenaltyOverride === 'number') {
    return {
      totalAcp: char.armorCheckPenaltyOverride,
      armorAcp: char.armorCheckPenaltyOverride,
      shieldAcp: 0,
      loadAcp: 0,
      effectiveBodyAcp: char.armorCheckPenaltyOverride,
      breakdown: [`Manual Override: ${char.armorCheckPenaltyOverride}`]
    };
  }

  let armorAcp = 0;
  let shieldAcp = 0;
  const breakdown: string[] = [];

  const equippedItems = (char.inventory || []).filter((i) => i.equipped && !i.stored);
  for (const it of equippedItems) {
    let penalty = 0;
    if (typeof it.armorCheckPenalty === 'number') {
      penalty = Math.abs(it.armorCheckPenalty);
    } else {
      const name = (it.name || '').toLowerCase();
      if (name.includes('full plate')) penalty = 6;
      else if (name.includes('half-plate')) penalty = 7;
      else if (name.includes('banded')) penalty = 6;
      else if (name.includes('splint')) penalty = 7;
      else if (name.includes('chainmail')) penalty = 5;
      else if (name.includes('breastplate')) penalty = 4;
      else if (name.includes('scale')) penalty = 4;
      else if (name.includes('chain shirt')) penalty = 2;
      else if (name.includes('studded leather')) penalty = 1;
      else if (name.includes('tower shield')) penalty = 10;
      else if (name.includes('heavy shield') || name.includes('large shield')) penalty = 2;
      else if (name.includes('light shield') || name.includes('small shield')) penalty = 1;
      else if (name.includes('buckler')) penalty = 1;
    }

    if (penalty > 0) {
      if (it.armorType === 'Shield' || (it.name || '').toLowerCase().includes('shield')) {
        shieldAcp += penalty;
        breakdown.push(`${it.name}: -${penalty} ACP (Shield)`);
      } else {
        armorAcp = Math.max(armorAcp, penalty);
        breakdown.push(`${it.name}: -${penalty} ACP (Armor)`);
      }
    }
  }

  const abilities = getEffectiveAbilities(char);
  const str = abilities.STR?.score || 10;
  const capacity = calculate35eCarryingCapacity(str, char.sizeCategory, char.isQuadruped);
  const totalWeight = getTotalWeight(char);
  const loadInfo = calculate35eEncumbranceLoad(totalWeight, capacity);
  const loadAcp = Math.abs(loadInfo.loadAcp);

  if (loadAcp > 0) {
    breakdown.push(`${loadInfo.label}: -${loadAcp} ACP`);
  }

  // In 3.5e: Apply worse of armor ACP or load ACP for body, + shield ACP
  const effectiveBodyAcp = Math.max(armorAcp, loadAcp);
  const totalAcp = -(effectiveBodyAcp + shieldAcp);

  return {
    totalAcp,
    armorAcp: -armorAcp,
    shieldAcp: -shieldAcp,
    loadAcp: -loadAcp,
    effectiveBodyAcp: -effectiveBodyAcp,
    breakdown
  };
}

// ----------------------------------------------------
// D&D 3.5e SPECIAL COMBAT MANEUVERS
// ----------------------------------------------------

export function get35eSizeManeuverModifier(sizeCategory?: string): number {
  const size = (sizeCategory || 'Medium').toLowerCase();
  if (size.includes('fine')) return -16;
  if (size.includes('diminutive')) return -12;
  if (size.includes('tiny')) return -8;
  if (size.includes('small')) return -4;
  if (size.includes('medium')) return 0;
  if (size.includes('large')) return 4;
  if (size.includes('huge')) return 8;
  if (size.includes('gargantuan')) return 12;
  if (size.includes('colossal')) return 16;
  return 0;
}

export interface Maneuver35eResult {
  name: string;
  checkBonus: number;
  formula: string;
  provokesAoO: boolean;
  improvedFeatActive: boolean;
  description: string;
  notes?: string;
}

export function calculate35eCombatManeuvers(char: CharacterData): {
  grapple: Maneuver35eResult;
  trip: Maneuver35eResult & { touchAttackBonus: number };
  disarm: Maneuver35eResult;
  bullRush: Maneuver35eResult;
  sunder: Maneuver35eResult;
  overrun: Maneuver35eResult;
  sizeModifier: number;
  stabilityBonus: number;
} {
  const bab = getCharacterBab(char);
  const abilities = getEffectiveAbilities(char);
  const strMod = getAbilityModifier(abilities.STR?.score || 10);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const sizeMod = get35eSizeManeuverModifier(char.sizeCategory);

  const improved = char.improvedManeuvers || {};
  const isDwarf = (char.race || '').toLowerCase().includes('dwarf');
  const stabilityBonus = (char.isQuadruped ? 4 : 0) + (isDwarf ? 4 : 0) + (char.stabilityBonus || 0);

  // 1. GRAPPLE: BAB + STR + Size + 4 (Improved Grapple)
  const hasImpGrapple = Boolean(improved.improvedGrapple);
  const grappleBonus = bab + strMod + sizeMod + (hasImpGrapple ? 4 : 0);
  const grapple: Maneuver35eResult = {
    name: 'Grapple Check',
    checkBonus: grappleBonus,
    formula: `BAB (${formatModifier(bab)}) + STR (${formatModifier(strMod)}) + Size (${formatModifier(sizeMod)})${hasImpGrapple ? ' + Imp Grapple (+4)' : ''}`,
    provokesAoO: !hasImpGrapple,
    improvedFeatActive: hasImpGrapple,
    description: 'Opposed check to establish hold, pin foe, deal unarmed damage, or escape grapple.'
  };

  // 2. TRIP: Touch Attack: BAB + STR/DEX -> Trip Check: STR + Size + 4 (Improved Trip)
  const hasImpTrip = Boolean(improved.improvedTrip);
  const tripTouchAtk = bab + Math.max(strMod, dexMod);
  const tripBonus = strMod + sizeMod + (hasImpTrip ? 4 : 0);
  const trip = {
    name: 'Trip Check',
    touchAttackBonus: tripTouchAtk,
    checkBonus: tripBonus,
    formula: `STR (${formatModifier(strMod)}) + Size (${formatModifier(sizeMod)})${hasImpTrip ? ' + Imp Trip (+4)' : ''}`,
    provokesAoO: !hasImpTrip,
    improvedFeatActive: hasImpTrip,
    description: 'Make unarmed melee touch attack; if hits, make opposed STR check to knock defender prone.' + (hasImpTrip ? ' (Improved Trip grants immediate free melee attack on success!)' : '')
  };

  // 3. DISARM: Opposed attack roll: BAB + STR + 4 (Improved Disarm)
  const hasImpDisarm = Boolean(improved.improvedDisarm);
  const disarmBonus = bab + strMod + (hasImpDisarm ? 4 : 0);
  const disarm: Maneuver35eResult = {
    name: 'Disarm Check',
    checkBonus: disarmBonus,
    formula: `Melee Atk (${formatModifier(bab + strMod)})${hasImpDisarm ? ' + Imp Disarm (+4)' : ''} (add +4 if two-handed, -4 if light)`,
    provokesAoO: !hasImpDisarm,
    improvedFeatActive: hasImpDisarm,
    description: 'Opposed melee attack roll to disarm defender of their weapon or shield.'
  };

  // 4. BULL RUSH: STR + Size + 4 (Improved Bull Rush)
  const hasImpBullRush = Boolean(improved.improvedBullRush);
  const bullRushBonus = strMod + sizeMod + (hasImpBullRush ? 4 : 0);
  const bullRush: Maneuver35eResult = {
    name: 'Bull Rush Check',
    checkBonus: bullRushBonus,
    formula: `STR (${formatModifier(strMod)}) + Size (${formatModifier(sizeMod)})${hasImpBullRush ? ' + Imp Bull Rush (+4)' : ''} (+2 if charging)`,
    provokesAoO: !hasImpBullRush,
    improvedFeatActive: hasImpBullRush,
    description: 'Opposed STR check to push defender back 5 ft, +5 ft per 5 points you exceed their check.'
  };

  // 5. SUNDER: Opposed attack roll: Melee Atk + 4 (Improved Sunder)
  const hasImpSunder = Boolean(improved.improvedSunder);
  const sunderBonus = bab + strMod + (hasImpSunder ? 4 : 0);
  const sunder: Maneuver35eResult = {
    name: 'Sunder Check',
    checkBonus: sunderBonus,
    formula: `Melee Atk (${formatModifier(bab + strMod)})${hasImpSunder ? ' + Imp Sunder (+4)' : ''} (add +4 if two-handed, -4 if light)`,
    provokesAoO: !hasImpSunder,
    improvedFeatActive: hasImpSunder,
    description: 'Opposed attack roll to strike held weapon or shield directly; deals damage to item Hardness & HP.'
  };

  // 6. OVERRUN: STR + Size + 4 (Improved Overrun)
  const hasImpOverrun = Boolean(improved.improvedOverrun);
  const overrunBonus = strMod + sizeMod + (hasImpOverrun ? 4 : 0);
  const overrun: Maneuver35eResult = {
    name: 'Overrun Check',
    checkBonus: overrunBonus,
    formula: `STR (${formatModifier(strMod)}) + Size (${formatModifier(sizeMod)})${hasImpOverrun ? ' + Imp Overrun (+4)' : ''}`,
    provokesAoO: !hasImpOverrun,
    improvedFeatActive: hasImpOverrun,
    description: 'Opposed STR check as standard action while moving to knock target prone.'
  };

  return {
    grapple,
    trip,
    disarm,
    bullRush,
    sunder,
    overrun,
    sizeModifier: sizeMod,
    stabilityBonus
  };
}

// ----------------------------------------------------
// D&D 3.5e DAMAGE REDUCTION (DR) & ENERGY RESISTANCE
// ----------------------------------------------------

export function calculate35eDamageReduction(char: CharacterData): {
  value: number;
  bypass: string;
  displayString: string;
} {
  const val = char.damageReductionValue || 0;
  const bypass = (char.damageReductionBypass || '-').trim();
  const displayString = val > 0 ? `DR ${val}/${bypass}` : 'DR 0/-';
  return { value: val, bypass, displayString };
}

export function calculate35eIncomingDamage(
  char: CharacterData,
  rawDamage: number,
  damageType: string = 'Slashing',
  attackProperties: {
    isMagic?: boolean;
    material?: 'normal' | 'magic' | 'silver' | 'cold_iron' | 'adamantine' | string;
    alignment?: 'none' | 'good' | 'evil' | 'lawful' | 'chaotic' | string;
  } = {}
): {
  finalDamage: number;
  drMitigated: number;
  energyMitigated: number;
  bypassed: boolean;
  explanation: string;
} {
  const dmg = Math.max(0, rawDamage);
  const cleanType = (damageType || 'Slashing').toLowerCase();

  // 1. Energy Damage Check
  const energyResistances = char.energyResistances || {};
  let energyMitigated = 0;
  if (['fire', 'cold', 'electricity', 'acid', 'sonic'].includes(cleanType)) {
    const resValue = energyResistances[cleanType as 'fire'] || 0;
    energyMitigated = Math.min(dmg, resValue);
    const finalDamage = Math.max(0, dmg - energyMitigated);
    return {
      finalDamage,
      drMitigated: 0,
      energyMitigated,
      bypassed: false,
      explanation: energyMitigated > 0
        ? `Energy Resistance (${cleanType} ${resValue}) absorbed ${energyMitigated} damage (taking ${finalDamage})`
        : `Full damage taken (${finalDamage} ${damageType})`
    };
  }

  // 2. Physical Damage & DR Check (Bludgeoning, Piercing, Slashing)
  const dr = calculate35eDamageReduction(char);
  if (dr.value <= 0) {
    return {
      finalDamage: dmg,
      drMitigated: 0,
      energyMitigated: 0,
      bypassed: true,
      explanation: `No DR active (${dmg} damage taken)`
    };
  }

  const bypassReq = dr.bypass.toLowerCase();
  let bypassed = false;

  if (bypassReq === '-' || bypassReq === 'none') {
    bypassed = false;
  } else if (bypassReq.includes('magic') && (attackProperties.isMagic || attackProperties.material === 'magic')) {
    bypassed = true;
  } else if (bypassReq.includes('silver') && attackProperties.material === 'silver') {
    bypassed = true;
  } else if (bypassReq.includes('cold iron') && attackProperties.material === 'cold_iron') {
    bypassed = true;
  } else if (bypassReq.includes('adamantine') && attackProperties.material === 'adamantine') {
    bypassed = true;
  } else if (bypassReq.includes('bludgeoning') && cleanType.includes('bludgeon')) {
    bypassed = true;
  } else if (bypassReq.includes('piercing') && cleanType.includes('pierc')) {
    bypassed = true;
  } else if (bypassReq.includes('slashing') && cleanType.includes('slash')) {
    bypassed = true;
  } else if (bypassReq.includes('good') && attackProperties.alignment === 'good') {
    bypassed = true;
  } else if (bypassReq.includes('evil') && attackProperties.alignment === 'evil') {
    bypassed = true;
  } else if (bypassReq.includes('lawful') && attackProperties.alignment === 'lawful') {
    bypassed = true;
  } else if (bypassReq.includes('chaotic') && attackProperties.alignment === 'chaotic') {
    bypassed = true;
  }

  if (bypassed) {
    return {
      finalDamage: dmg,
      drMitigated: 0,
      energyMitigated: 0,
      bypassed: true,
      explanation: `Bypassed ${dr.displayString}! Full damage taken (${dmg})`
    };
  }

  const drMitigated = Math.min(dmg, dr.value);
  const finalDamage = Math.max(0, dmg - drMitigated);
  return {
    finalDamage,
    drMitigated,
    energyMitigated: 0,
    bypassed: false,
    explanation: `${dr.displayString} absorbed ${drMitigated} damage (taking ${finalDamage})`
  };
}

// ----------------------------------------------------
// D&D 3.5e METAMAGIC SPELL ENGINE
// ----------------------------------------------------

export interface MetamagicFeatDefinition {
  id: string;
  name: string;
  slotAdjustment: number;
  description: string;
  effectType: 'damage' | 'duration' | 'range' | 'area' | 'action' | 'component';
}

export const DND35E_METAMAGIC_FEATS: MetamagicFeatDefinition[] = [
  {
    id: 'empower',
    name: 'Empower Spell',
    slotAdjustment: 2,
    description: 'Increases all variable, numeric effects by 50% (+50% roll damage/healing).',
    effectType: 'damage'
  },
  {
    id: 'maximize',
    name: 'Maximize Spell',
    slotAdjustment: 3,
    description: 'All variable, numeric effects are maximized (e.g. 8d6 becomes 48).',
    effectType: 'damage'
  },
  {
    id: 'quicken',
    name: 'Quicken Spell',
    slotAdjustment: 4,
    description: 'Casting time becomes a Swift Action (1 per turn).',
    effectType: 'action'
  },
  {
    id: 'extend',
    name: 'Extend Spell',
    slotAdjustment: 1,
    description: 'Doubles duration of spells with duration longer than instantaneous.',
    effectType: 'duration'
  },
  {
    id: 'enlarge',
    name: 'Enlarge Spell',
    slotAdjustment: 1,
    description: 'Doubles the range of close, medium, or long range spells.',
    effectType: 'range'
  },
  {
    id: 'widen',
    name: 'Widen Spell',
    slotAdjustment: 3,
    description: 'Increases area (radius, cone, burst, emanation) by 100%.',
    effectType: 'area'
  },
  {
    id: 'silent',
    name: 'Silent Spell',
    slotAdjustment: 1,
    description: 'Casts without verbal (V) component. Can cast while silenced.',
    effectType: 'component'
  },
  {
    id: 'still',
    name: 'Still Spell',
    slotAdjustment: 1,
    description: 'Casts without somatic (S) component. Completely eliminates Arcane Spell Failure (0% ASF)!',
    effectType: 'component'
  }
];

export function calculate35eMetamagicSpell(
  spell: Spell,
  activeFeats: Record<string, boolean>
): {
  adjustedLevel: number;
  levelDifference: number;
  components: string;
  castingTime: string;
  range: string;
  duration: string;
  ignoresAsf: boolean;
  damageFormula: string;
  appliedFeats: string[];
} {
  const baseLvl = spell.originalLevel !== undefined ? spell.originalLevel : spell.level;
  let levelDiff = 0;
  const appliedFeats: string[] = [];

  for (const feat of DND35E_METAMAGIC_FEATS) {
    if (activeFeats[feat.id]) {
      levelDiff += feat.slotAdjustment;
      appliedFeats.push(feat.name);
    }
  }

  const adjustedLevel = Math.min(9, Math.max(baseLvl, baseLvl + levelDiff));

  let components = spell.components || 'V, S, M';
  if (activeFeats.silent) {
    components = components.replace(/V\s*,?\s*/i, '').trim().replace(/,\s*$/, '');
  }
  if (activeFeats.still) {
    components = components.replace(/S\s*,?\s*/i, '').trim().replace(/,\s*$/, '');
  }
  if (!components) components = 'None';

  let castingTime = spell.castingTime;
  if (activeFeats.quicken) {
    castingTime = 'Swift Action (1/turn)';
  }

  let range = spell.range;
  if (activeFeats.enlarge) {
    range = `${spell.range} (Enlarged: 2× Range)`;
  }

  let duration = spell.duration;
  if (activeFeats.extend) {
    duration = `${spell.duration} (Extended: 2× Duration)`;
  }

  let damageFormula = spell.damage || '';
  if (damageFormula) {
    if (activeFeats.maximize && activeFeats.empower) {
      damageFormula = `(${damageFormula} Maximized) + 50%`;
    } else if (activeFeats.maximize) {
      damageFormula = `${damageFormula} (Maximized)`;
    } else if (activeFeats.empower) {
      damageFormula = `(${damageFormula}) × 1.5 (+50%)`;
    }
  }

  return {
    adjustedLevel,
    levelDifference: levelDiff,
    components,
    castingTime,
    range,
    duration,
    ignoresAsf: Boolean(activeFeats.still),
    damageFormula,
    appliedFeats
  };
}

// ----------------------------------------------------
// D&D 3.5e ATTACKS OF OPPORTUNITY & COMBAT REFLEXES
// ----------------------------------------------------

export interface AoOPoolInfo {
  maxAoO: number;
  currentAoO: number;
  dexBonus: number;
  hasCombatReflexes: boolean;
  canAoOFlatFooted: boolean;
  threatReachFt: number;
  explanation: string;
}

export function calculate35eAoOPool(character: CharacterData): AoOPoolInfo {
  const abilities = getEffectiveAbilities(character);
  const dexMod = getAbilityModifier(abilities?.DEX?.score || 10);
  const hasCombatReflexes = Boolean(
    character.hasCombatReflexes ||
    character.feats?.some((f) => f.name.toLowerCase().includes('combat reflexes'))
  );

  let maxAoO = 1;
  if (hasCombatReflexes) {
    maxAoO = Math.max(1, 1 + dexMod);
  }
  if (character.aooMaxOverride !== undefined && character.aooMaxOverride >= 0) {
    maxAoO = character.aooMaxOverride;
  }

  const currentAoO = character.aooRemaining !== undefined ? Math.min(maxAoO, character.aooRemaining) : maxAoO;

  let threatReachFt = character.threatReachFt || 5;
  if (!character.threatReachFt) {
    if (character.edition === '3.5e') {
      const reachInfo = get35eSpaceAndReach(character.sizeCategory, character.reachType || character.isQuadruped);
      threatReachFt = reachInfo.naturalReachFt;
    } else {
      if (character.sizeCategory === 'Large') threatReachFt = 10;
      if (character.sizeCategory === 'Huge') threatReachFt = 15;
      if (character.sizeCategory === 'Gargantuan') threatReachFt = 20;
      if (character.sizeCategory === 'Colossal') threatReachFt = 30;
    }
  }

  return {
    maxAoO,
    currentAoO,
    dexBonus: dexMod,
    hasCombatReflexes,
    canAoOFlatFooted: hasCombatReflexes,
    threatReachFt,
    explanation: hasCombatReflexes
      ? `1 base + ${dexMod >= 0 ? '+' : ''}${dexMod} (Dex mod from Combat Reflexes) = ${maxAoO} AoOs/round`
      : `1 base AoO per round (Standard rule without Combat Reflexes)`
  };
}

export interface AoOActionTrigger {
  id: string;
  name: string;
  category: 'Movement' | 'Spells' | 'Combat Actions' | 'Item Use';
  provokes: boolean;
  description: string;
  exceptionOrAvoidance?: string;
}

export const DND35E_AOO_TRIGGERS: AoOActionTrigger[] = [
  {
    id: 'move_threatened',
    name: 'Moving Out of / Through a Threatened Square',
    category: 'Movement',
    provokes: true,
    description: 'Moving through or out of an enemy’s threatened space provokes an Attack of Opportunity before you leave the square.',
    exceptionOrAvoidance: 'A 5-foot step or the Withdraw full-round action avoids this.'
  },
  {
    id: 'cast_spell',
    name: 'Casting a Spell or Spell-like Ability',
    category: 'Spells',
    provokes: true,
    description: 'Casting a spell while threatened provokes an AoO. If hit and dealt damage, you must make a Concentration check (DC 10 + damage dealt + spell level) or lose the spell.',
    exceptionOrAvoidance: 'Cast defensively (Concentration DC 15 + spell level) to avoid provoking.'
  },
  {
    id: 'ranged_attack',
    name: 'Making a Ranged Attack in Melee',
    category: 'Combat Actions',
    provokes: true,
    description: 'Firing a bow, crossbow, throwing weapon, or sling while threatened provokes an AoO.',
    exceptionOrAvoidance: 'Step away with a 5-foot step first, or take the Close Quarters feat.'
  },
  {
    id: 'stand_prone',
    name: 'Standing Up from Prone',
    category: 'Movement',
    provokes: true,
    description: 'Standing up from the ground is a move action that provokes an AoO.',
    exceptionOrAvoidance: 'Remain prone or use magic/tumbling to reposition.'
  },
  {
    id: 'unarmed_attack',
    name: 'Unarmed Strike / Maneuver without Feat',
    category: 'Combat Actions',
    provokes: true,
    description: 'Striking unarmed (without Improved Unarmed Strike) or initiating a Grapple, Trip, Disarm, Sunder, or Bull Rush without their Improved feat provokes an AoO.',
    exceptionOrAvoidance: 'Acquire Improved Unarmed Strike, Improved Grapple, Improved Trip, etc.'
  },
  {
    id: 'drink_potion',
    name: 'Drinking a Potion or Retrieving Stored Item',
    category: 'Item Use',
    provokes: true,
    description: 'Drinking a potion, oils, or retrieving an item from a backpack or pouch provokes an AoO.',
    exceptionOrAvoidance: 'Have item in a Handy Haversack (move action) or prepare beforehand.'
  },
  {
    id: 'turn_undead',
    name: 'Turn / Rebuke Undead',
    category: 'Combat Actions',
    provokes: false,
    description: 'Channeling divine energy to Turn or Rebuke Undead does NOT provoke an Attack of Opportunity.',
    exceptionOrAvoidance: 'Standard action that is completely safe from AoOs.'
  },
  {
    id: 'total_defense',
    name: 'Total Defense (+4 Dodge AC)',
    category: 'Combat Actions',
    provokes: false,
    description: 'Taking the Total Defense standard action grants a +4 dodge bonus to AC and does NOT provoke an AoO.',
    exceptionOrAvoidance: 'Standard action.'
  }
];

// ----------------------------------------------------
// D&D 3.5e TWO-WEAPON FIGHTING (TWF) PENALTIES & DAMAGE
// ----------------------------------------------------

export interface TwoWeaponPenalties {
  mainHandPenalty: number;
  offhandPenalty: number;
  hasTWF: boolean;
  hasITWF: boolean;
  hasGTWF: boolean;
  hasTwoWeaponDefense: boolean;
  maxOffhandAttacks: number;
  description: string;
}

export function calculate35eTwoWeaponPenalties(character: CharacterData, isOffhandLight: boolean): TwoWeaponPenalties {
  const feats = character.feats || [];
  const featNames = feats.map((f) => f.name.toLowerCase());
  const hasTWF = Boolean(character.hasTwoWeaponFighting || featNames.some((n) => n.includes('two-weapon fighting') && !n.includes('improved') && !n.includes('greater')));
  const hasITWF = Boolean(character.hasImprovedTwoWeaponFighting || featNames.some((n) => n.includes('improved two-weapon fighting')));
  const hasGTWF = Boolean(character.hasGreaterTwoWeaponFighting || featNames.some((n) => n.includes('greater two-weapon fighting')));
  const hasTwoWeaponDefense = Boolean(character.hasTwoWeaponDefense || featNames.some((n) => n.includes('two-weapon defense')));

  let mainHandPenalty = -6;
  let offhandPenalty = -10;

  if (isOffhandLight) {
    mainHandPenalty = -4;
    offhandPenalty = -8;
  }

  if (hasTWF) {
    if (isOffhandLight) {
      mainHandPenalty = -2;
      offhandPenalty = -2;
    } else {
      mainHandPenalty = -4;
      offhandPenalty = -4;
    }
  }

  const bab = getCharacterBab(character);
  let maxOffhandAttacks = 1;
  if (hasITWF && bab >= 6) maxOffhandAttacks = 2;
  if (hasGTWF && bab >= 11) maxOffhandAttacks = 3;

  return {
    mainHandPenalty,
    offhandPenalty,
    hasTWF,
    hasITWF,
    hasGTWF,
    hasTwoWeaponDefense,
    maxOffhandAttacks,
    description: hasTWF
      ? isOffhandLight
        ? 'Two-Weapon Fighting with Light off-hand: -2 Main / -2 Off-hand penalty'
        : 'Two-Weapon Fighting with Normal off-hand: -4 Main / -4 Off-hand penalty'
      : isOffhandLight
        ? 'Dual-wielding without TWF feat (Light off-hand): -4 Main / -8 Off-hand penalty'
        : 'Dual-wielding without TWF feat (Normal off-hand): -6 Main / -10 Off-hand penalty'
  };
}

export function adjust35eOffhandDamageFormula(baseDamage: string, strModifier: number): string {
  // In 3.5e, off-hand adds only 1/2 STR bonus (rounded down). Negative STR applies in full.
  const offhandStrMod = strModifier > 0 ? Math.floor(strModifier / 2) : strModifier;
  // If base formula has an existing flat bonus, replace or append
  const match = baseDamage.match(/^([0-9]+d[0-9]+)\s*([+-]\s*[0-9]+)?(.*)$/i);
  if (match) {
    const dice = match[1];
    const rest = match[3] || '';
    const sign = offhandStrMod >= 0 ? '+' : '-';
    return `${dice} ${sign} ${Math.abs(offhandStrMod)} (½ STR)${rest}`.trim();
  }
  const sign = offhandStrMod >= 0 ? '+' : '-';
  return `${baseDamage} ${sign} ${Math.abs(offhandStrMod)} (½ STR)`.trim();
}

/**
 * Adjusts damage formula for 5e Two-Weapon Fighting (PHB p. 195).
 * Suppresses positive ability modifier from damage unless character has Two-Weapon Fighting style.
 * Negative modifiers are preserved according to 5e rules.
 */
export function adjust5eOffhandDamageFormula(baseDamage: string, hasFightingStyle: boolean = false): string {
  if (hasFightingStyle) return baseDamage;
  // If base damage has a positive flat bonus (e.g. "+ 3", "+3", "+ 4 slashing"), strip the positive ability modifier
  const match = baseDamage.match(/^([0-9]+d[0-9]+)\s*(?:\+\s*([0-9]+))?(.*)$/i);
  if (match) {
    const dice = match[1];
    const rest = (match[3] || '').trim();
    // Only dice and rest of string (like damage type) without the positive modifier
    return rest ? `${dice} ${rest}` : dice;
  }
  return baseDamage.replace(/\+\s*\d+/, '').trim();
}

// ----------------------------------------------------
// D&D 3.5e CONCEALMENT, MISS CHANCE & BLIND-FIGHT
// ----------------------------------------------------

export type MissChanceType = 'none' | 'concealment_20' | 'total_concealment_50' | 'blink_50' | 'blink_20' | 'incorporeal_50' | 'custom';

export interface MissChancePreset {
  id: MissChanceType;
  label: string;
  percentage: number;
  description: string;
}

export const DND35E_MISS_CHANCE_PRESETS: MissChancePreset[] = [
  {
    id: 'none',
    label: 'None (0%)',
    percentage: 0,
    description: 'Clear line of sight with no concealment or miss chance.'
  },
  {
    id: 'concealment_20',
    label: 'Concealment (20%)',
    percentage: 20,
    description: 'Target has partial concealment (fog, dim light, dense foliage, blur spell).'
  },
  {
    id: 'total_concealment_50',
    label: 'Total Concealment (50%)',
    percentage: 50,
    description: 'Target has total concealment (darkness, invisibility, smoke, blindness). Defender also loses Dex to AC.'
  },
  {
    id: 'blink_50',
    label: 'Blink Spell (50%)',
    percentage: 50,
    description: 'Target is actively blinking into the Ethereal Plane. Physical and magical attacks have a 50% miss chance.'
  },
  {
    id: 'blink_20',
    label: 'Attacking While Blinking (20%)',
    percentage: 20,
    description: 'The attacker is blinking and making an attack against a corporeal target.'
  },
  {
    id: 'incorporeal_50',
    label: 'Incorporeal Target (50%)',
    percentage: 50,
    description: 'Target is incorporeal (wraith, ghost, shadow). Magic weapons and spells have a 50% miss chance; non-magical attacks deal 0 damage. Force effects have 0% miss chance.'
  }
];

export interface MissChanceResult {
  missChancePercent: number;
  d100Roll: number;
  secondRoll?: number;
  isOvercome: boolean;
  usedBlindFight: boolean;
  log: string;
}

export function evaluate35eMissChance(missChancePercent: number, hasBlindFight: boolean = false): MissChanceResult {
  if (missChancePercent <= 0) {
    return {
      missChancePercent: 0,
      d100Roll: 100,
      isOvercome: true,
      usedBlindFight: false,
      log: 'No miss chance active.'
    };
  }

  // In 3.5e: d100 roll. A roll from 1 to missChancePercent is a MISS. A roll above missChancePercent HITS.
  const firstRoll = Math.floor(Math.random() * 100) + 1;
  const firstOvercome = firstRoll > missChancePercent;

  if (firstOvercome || !hasBlindFight) {
    return {
      missChancePercent,
      d100Roll: firstRoll,
      isOvercome: firstOvercome,
      usedBlindFight: false,
      log: firstOvercome
        ? `d100 = ${firstRoll} vs ${missChancePercent}% miss chance: Overcome! (Hit)`
        : `d100 = ${firstRoll} vs ${missChancePercent}% miss chance: Missed due to concealment!`
    };
  }

  // Blind-Fight feat allows 1 reroll on concealment miss chance
  const secondRoll = Math.floor(Math.random() * 100) + 1;
  const secondOvercome = secondRoll > missChancePercent;

  return {
    missChancePercent,
    d100Roll: firstRoll,
    secondRoll,
    isOvercome: secondOvercome,
    usedBlindFight: true,
    log: secondOvercome
      ? `First roll d100 = ${firstRoll} (Miss). Blind-Fight Reroll: d100 = ${secondRoll} vs ${missChancePercent}%: Success! (Hit)`
      : `First roll d100 = ${firstRoll}. Blind-Fight Reroll: d100 = ${secondRoll} vs ${missChancePercent}%: Missed due to concealment!`
  };
}

// ----------------------------------------------------
// D&D 3.5e ABILITY DAMAGE VS. DRAIN & POISON INCUBATION
// ----------------------------------------------------

export interface AbilityDamageDrainSummary {
  totalDamage: number;
  totalDrain: number;
  affectedAbilities: AbilityName[];
  conHpPenalty: number;
}

export function calculate35eAbilityDamageDrainSummary(character: CharacterData): AbilityDamageDrainSummary {
  const abilities: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  let totalDamage = 0;
  let totalDrain = 0;
  const affectedAbilities: AbilityName[] = [];

  for (const ab of abilities) {
    const dmg = character.abilityDamage?.[ab] || 0;
    const drn = character.abilityDrain?.[ab] || 0;
    if (dmg > 0 || drn > 0) {
      affectedAbilities.push(ab);
      totalDamage += dmg;
      totalDrain += drn;
    }
  }

  // In 3.5e: Every 2 points of CON loss reduces HP by 1 point per character level
  const conLoss = (character.abilityDamage?.CON || 0) + (character.abilityDrain?.CON || 0);
  const conPenaltyMod = Math.floor(conLoss / 2);
  const conHpPenalty = conPenaltyMod * Math.max(1, character.level);

  return {
    totalDamage,
    totalDrain,
    affectedAbilities,
    conHpPenalty
  };
}

export interface PresetPoison {
  id: string;
  name: string;
  source: string;
  dc: number;
  saveType: 'Fortitude';
  primaryEffect: string;
  secondaryEffect: string;
  priceGp: number;
  description: string;
}

export const DND35E_COMMON_POISONS: PresetPoison[] = [
  {
    id: 'greenblood_oil',
    name: 'Greenblood Oil',
    source: 'Injury',
    dc: 13,
    saveType: 'Fortitude',
    primaryEffect: '1 CON damage',
    secondaryEffect: '1d2 CON damage',
    priceGp: 100,
    description: 'A viscous dark-green plant distillation favored by assassins.'
  },
  {
    id: 'black_adder_venom',
    name: 'Black Adder Venom',
    source: 'Injury',
    dc: 11,
    saveType: 'Fortitude',
    primaryEffect: '1d6 CON damage',
    secondaryEffect: '1d6 CON damage',
    priceGp: 120,
    description: 'Extracted from the deadly black adder serpent.'
  },
  {
    id: 'shadow_essence',
    name: 'Shadow Essence',
    source: 'Injury',
    dc: 17,
    saveType: 'Fortitude',
    primaryEffect: '1 STR drain',
    secondaryEffect: '2d6 STR damage',
    priceGp: 250,
    description: 'Tainted vapor from the Plane of Shadow that leeches muscular vigor.'
  },
  {
    id: 'arsenic',
    name: 'Arsenic',
    source: 'Ingested',
    dc: 13,
    saveType: 'Fortitude',
    primaryEffect: '1 CON damage',
    secondaryEffect: '1d8 CON damage',
    priceGp: 120,
    description: 'Classic mineral toxin dissolved into food or wine.'
  },
  {
    id: 'medium_spider_venom',
    name: 'Medium Spider Venom',
    source: 'Injury',
    dc: 14,
    saveType: 'Fortitude',
    primaryEffect: '1d4 STR damage',
    secondaryEffect: '1d4 STR damage',
    priceGp: 150,
    description: 'Neurotoxic venom extracted from giant monstrous arachnids.'
  },
  {
    id: 'wyvern_poison',
    name: 'Wyvern Poison',
    source: 'Injury',
    dc: 17,
    saveType: 'Fortitude',
    primaryEffect: '2d6 CON damage',
    secondaryEffect: '2d6 CON damage',
    priceGp: 3000,
    description: 'Devastating stinger secretion capable of slaying a knight in seconds.'
  },
  {
    id: 'purple_worm_poison',
    name: 'Purple Worm Poison',
    source: 'Injury',
    dc: 24,
    saveType: 'Fortitude',
    primaryEffect: '1d6 STR damage',
    secondaryEffect: '2d6 STR damage',
    priceGp: 700,
    description: 'Potent subterranean poison that atrophies muscles.'
  }
];

// ----------------------------------------------------
// D&D 3.5e XP-TO-CRAFT & SPELL XP LEDGER
// ----------------------------------------------------

export interface ItemCraftingCalculation {
  basePriceGp: number;
  rawMaterialsGp: number;
  xpCost: number;
  craftingDays: number;
  minCasterLevel: number;
}

export function calculate35eItemCraftingCost(
  itemType: 'scroll' | 'potion' | 'wand' | 'wondrous' | 'arms_armor',
  spellLevel: number = 1,
  casterLevel: number = 1,
  basePriceInput?: number
): ItemCraftingCalculation {
  let basePriceGp = 0;
  let minCasterLevel = casterLevel;

  if (itemType === 'scroll') {
    // Scroll base price: Spell Level x Caster Level x 25 gp (Cantrip = 0.5 x CL x 25 = 12.5 gp)
    const effLevel = spellLevel === 0 ? 0.5 : spellLevel;
    basePriceGp = basePriceInput || Math.max(12.5, effLevel * casterLevel * 25);
    minCasterLevel = spellLevel === 0 ? 1 : Math.max(1, spellLevel * 2 - 1);
  } else if (itemType === 'potion') {
    // Potion base price: Spell Level x Caster Level x 50 gp (Max 3rd level)
    const effLevel = spellLevel === 0 ? 0.5 : Math.min(3, spellLevel);
    basePriceGp = basePriceInput || Math.max(25, effLevel * casterLevel * 50);
    minCasterLevel = spellLevel === 0 ? 1 : Math.max(1, spellLevel * 2 - 1);
  } else if (itemType === 'wand') {
    // Wand base price: Spell Level x Caster Level x 750 gp (50 charges, Max 4th level)
    const effLevel = spellLevel === 0 ? 0.5 : Math.min(4, spellLevel);
    basePriceGp = basePriceInput || Math.max(375, effLevel * casterLevel * 750);
    minCasterLevel = spellLevel === 0 ? 1 : Math.max(1, spellLevel * 2 - 1);
  } else {
    // Wondrous item or Arms & Armor: uses basePriceInput
    basePriceGp = basePriceInput || 1000;
  }

  // 3.5e Rule: Raw materials cost = 1/2 base price
  const rawMaterialsGp = Math.round((basePriceGp / 2) * 100) / 100;

  // 3.5e Rule: XP cost = 1/25th (4%) of base price
  const xpCost = Math.ceil(basePriceGp / 25);

  // 3.5e Rule: 1 day per 1,000 gp base price (minimum 1 day)
  const craftingDays = Math.max(1, Math.ceil(basePriceGp / 1000));

  return {
    basePriceGp,
    rawMaterialsGp,
    xpCost,
    craftingDays,
    minCasterLevel
  };
}

export interface PresetXpSpell {
  name: string;
  level: number;
  school: string;
  xpCost: number;
  materialCostGp?: number;
  description: string;
}

export const DND35E_XP_SPELLS: PresetXpSpell[] = [
  {
    name: 'Wish',
    level: 9,
    school: 'Universal',
    xpCost: 5000,
    description: 'Reshape reality or duplicate spells. Minimum 5,000 XP cost (more if duplicating spells with XP costs or creating magic items).'
  },
  {
    name: 'Limited Wish',
    level: 7,
    school: 'Universal',
    xpCost: 300,
    description: 'Alters reality within bounded limits or duplicates lower level spells.'
  },
  {
    name: 'Permanency',
    level: 5,
    school: 'Transmutation',
    xpCost: 500, // 500 to 4500 XP depending on spell
    description: 'Makes certain spells permanent on yourself, an object, or another creature. Minimum 500 XP (up to 4,500 XP).'
  },
  {
    name: 'Restoration',
    level: 4,
    school: 'Conjuration',
    xpCost: 100,
    materialCostGp: 100,
    description: 'Restores all permanent ability drain and dispels negative levels.'
  },
  {
    name: 'Commune',
    level: 5,
    school: 'Divination',
    xpCost: 100,
    description: 'Contact a deity or divine proxy for yes/no answers.'
  },
  {
    name: 'Atonement',
    level: 5,
    school: 'Abjuration',
    xpCost: 500,
    description: 'Restores paladins or clerics who have lost their divine favor through minor infractions.'
  },
  {
    name: 'Simulacrum',
    level: 7,
    school: 'Illusion',
    xpCost: 1000, // 100 XP per HD of the created creature
    materialCostGp: 1000,
    description: 'Creates a duplicate illusion/construct of a living creature. 100 XP per HD of creature.'
  },
  {
    name: 'Gate',
    level: 9,
    school: 'Conjuration',
    xpCost: 1000,
    description: 'Opens a portal across planes or summons a planar entity to perform a service.'
  },
  {
    name: 'Miracle',
    level: 9,
    school: 'Evocation',
    xpCost: 5000,
    description: 'Calls upon divine intercession for grand, impossible effects (free if standard clerical request; 5,000 XP for grand requests).'
  }
];

export function calculate35eMinLevelXpBuffer(character: CharacterData): {
  currentXp: number;
  levelMinXp: number;
  nextLevelXp: number;
  expendableXp: number;
  canAfford: (xpCost: number) => boolean;
} {
  const currentLevel = Math.max(1, character.level);
  // 3.5e XP thresholds: Level N requires N*(N-1)/2 * 1,000 XP
  const levelMinXp = ((currentLevel * (currentLevel - 1)) / 2) * 1000;
  const nextLevelXp = (((currentLevel + 1) * currentLevel) / 2) * 1000;
  const currentXp = character.experiencePoints || 0;

  // In 3.5e, a character cannot spend XP that would reduce their total below the minimum for their current level.
  const expendableXp = Math.max(0, currentXp - levelMinXp);

  return {
    currentXp,
    levelMinXp,
    nextLevelXp,
    expendableXp,
    canAfford: (xpCost: number) => expendableXp >= xpCost
  };
}

export {
  validate35eClassAlignment,
  calculate35eMulticlassXpPenalty,
  calculate35eWeaponSizePenalty,
  SIZE_CATEGORY_ORDER
} from './dnd35eAdvancedMechanics';
export type { WeaponSizePenaltyResult } from './dnd35eAdvancedMechanics';



