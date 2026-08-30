import { CharacterData } from '../../types';
import { getEffectiveAbilities, getAbilityModifier } from './abilityCalculators';

export interface Dnd35eBaseAttackBreakdown {
  bab: number;
  iterativeAttacks: number[];
  iterativeString: string;
  progressionType: 'Full' | 'Three-Quarter' | 'Half';
}

export interface Dnd35eSavesBreakdown {
  fortitude: { total: number; base: number; abilityMod: number; isGood: boolean };
  reflex: { total: number; base: number; abilityMod: number; isGood: boolean };
  will: { total: number; base: number; abilityMod: number; isGood: boolean };
}

export interface Dnd35eArmorClassBreakdown {
  totalAc: number;
  touchAc: number;
  flatFootedAc: number;
  dexBonus: number;
  armorBonus: number;
  shieldBonus: number;
  naturalArmorBonus: number;
  sizeModifier: number;
  deflectionBonus: number;
  dodgeBonus: number;
}

/**
 * Calculates 3.5e Base Attack Bonus (BAB) by class
 */
export function get35eBaseAttackBonus(char: CharacterData): Dnd35eBaseAttackBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const lvl = char.level || 1;

  let bab = 0;
  let progressionType: 'Full' | 'Three-Quarter' | 'Half' = 'Three-Quarter';

  // Full BAB: Barbarian, Fighter, Paladin, Ranger
  if (cls.includes('barbarian') || cls.includes('fighter') || cls.includes('paladin') || cls.includes('ranger') || cls.includes('knight') || cls.includes('warrior')) {
    bab = lvl;
    progressionType = 'Full';
  }
  // Half BAB: Wizard, Sorcerer
  else if (cls.includes('wizard') || cls.includes('sorcerer') || cls.includes('mage') || cls.includes('necromancer')) {
    bab = Math.floor(lvl * 0.5);
    progressionType = 'Half';
  }
  // 3/4 BAB: Cleric, Druid, Monk, Rogue, Bard
  else {
    bab = Math.floor(lvl * 0.75);
    progressionType = 'Three-Quarter';
  }

  // Iterative Attacks generation: each attack at -5 from previous once BAB reaches +6, +11, +16
  const iterativeAttacks: number[] = [];
  let currentBab = bab;
  while (currentBab > 0) {
    iterativeAttacks.push(currentBab);
    currentBab -= 5;
  }
  if (iterativeAttacks.length === 0) {
    iterativeAttacks.push(0);
  }

  const iterativeString = iterativeAttacks.map(b => (b >= 0 ? `+${b}` : `${b}`)).join(' / ');

  return {
    bab,
    iterativeAttacks,
    iterativeString,
    progressionType
  };
}

/**
 * Calculates 3.5e Good vs Poor Saves for Fortitude, Reflex, and Will
 */
export function get35eSaves(char: CharacterData): Dnd35eSavesBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const lvl = char.level || 1;
  const abilities = getEffectiveAbilities(char);

  const conMod = getAbilityModifier(abilities.CON?.score || 10);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);

  // Good save formula: 2 + floor(lvl / 2)
  // Poor save formula: floor(lvl / 3)
  const calcSave = (isGood: boolean) => isGood ? 2 + Math.floor(lvl / 2) : Math.floor(lvl / 3);

  // Class Save Profiles in 3.5e:
  // Barbarian: Fort (Good), Ref (Poor), Will (Poor)
  // Bard: Fort (Poor), Ref (Good), Will (Good)
  // Cleric: Fort (Good), Ref (Poor), Will (Good)
  // Druid: Fort (Good), Ref (Poor), Will (Good)
  // Fighter: Fort (Good), Ref (Poor), Will (Poor)
  // Monk: Fort (Good), Ref (Good), Will (Good)
  // Paladin: Fort (Good), Ref (Poor), Will (Poor)
  // Ranger: Fort (Good), Ref (Good), Will (Poor)
  // Rogue: Fort (Poor), Ref (Good), Will (Poor)
  // Sorcerer: Fort (Poor), Ref (Poor), Will (Good)
  // Wizard: Fort (Poor), Ref (Poor), Will (Good)

  let goodFort = false;
  let goodRef = false;
  let goodWill = false;

  if (cls.includes('barbarian') || cls.includes('fighter') || cls.includes('paladin')) {
    goodFort = true;
  } else if (cls.includes('bard')) {
    goodRef = true;
    goodWill = true;
  } else if (cls.includes('cleric') || cls.includes('druid')) {
    goodFort = true;
    goodWill = true;
  } else if (cls.includes('monk')) {
    goodFort = true;
    goodRef = true;
    goodWill = true;
  } else if (cls.includes('ranger')) {
    goodFort = true;
    goodRef = true;
  } else if (cls.includes('rogue')) {
    goodRef = true;
  } else if (cls.includes('sorcerer') || cls.includes('wizard')) {
    goodWill = true;
  } else {
    // Default balanced
    goodFort = true;
  }

  const baseFort = calcSave(goodFort);
  const baseRef = calcSave(goodRef);
  const baseWill = calcSave(goodWill);

  return {
    fortitude: { total: baseFort + conMod, base: baseFort, abilityMod: conMod, isGood: goodFort },
    reflex: { total: baseRef + dexMod, base: baseRef, abilityMod: dexMod, isGood: goodRef },
    will: { total: baseWill + wisMod, base: baseWill, abilityMod: wisMod, isGood: goodWill }
  };
}

/**
 * Calculates 3.5e Total AC, Touch AC, and Flat-Footed AC
 */
export function get35eArmorClass(char: CharacterData): Dnd35eArmorClassBreakdown {
  const abilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);

  // Parse inventory for armor, shields, and deflection/natural armor bonuses
  const inventory = char.inventory || [];
  let armorBonus = 0;
  let shieldBonus = 0;
  let naturalArmorBonus = 0;
  let deflectionBonus = 0;
  let dodgeBonus = 0;
  let maxDex = 99;

  inventory.forEach(item => {
    if (!item.equipped || item.stored) return;
    const bonus = item.acBonus || item.armorAc || 0;
    if (bonus > 0) {
      if (item.name?.toLowerCase().includes('shield') || item.armorType === 'Shield') {
        shieldBonus += bonus;
      } else {
        armorBonus += bonus;
      }
    }
  });

  const cappedDex = Math.min(dexMod, maxDex);
  const sizeModifier = 0; // Standard Medium

  // 3.5e AC Formulas:
  // Total AC = 10 + Armor + Shield + DEX + Size + Natural Armor + Deflection + Dodge
  // Touch AC = 10 + DEX + Size + Deflection + Dodge (No Armor, Shield, Natural Armor)
  // Flat-Footed AC = 10 + Armor + Shield + Size + Natural Armor + Deflection (No DEX, Dodge)

  const totalAc = 10 + armorBonus + shieldBonus + cappedDex + sizeModifier + naturalArmorBonus + deflectionBonus + dodgeBonus;
  const touchAc = 10 + cappedDex + sizeModifier + deflectionBonus + dodgeBonus;
  const flatFootedAc = 10 + armorBonus + shieldBonus + sizeModifier + naturalArmorBonus + deflectionBonus;

  return {
    totalAc,
    touchAc,
    flatFootedAc,
    dexBonus: cappedDex,
    armorBonus,
    shieldBonus,
    naturalArmorBonus,
    sizeModifier,
    deflectionBonus,
    dodgeBonus
  };
}
