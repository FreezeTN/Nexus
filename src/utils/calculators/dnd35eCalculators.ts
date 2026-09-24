import { CharacterData } from '../../types';
import { getEffectiveAbilities, getAbilityModifier } from './abilityCalculators';
import { get35eSizeModifier } from '../rules/sizeScaleRules35e';
import { find35eClassRule, calculateClassBab } from '../rules/dnd35eClassesRules';

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
  baseAc: number; // Always 10
  armorBonus: number;
  shieldBonus: number;
  dexBonus: number;
  rawDexMod: number;
  maxDexCap: number;
  sizeModifier: number;
  naturalArmorBonus: number;
  deflectionBonus: number;
  miscBonus: number;
  dodgeBonus: number;
  touchAc: number;
  flatFootedAc: number;
  armorName?: string;
  shieldName?: string;
  sources: {
    armor: string[];
    shield: string[];
    dex: string[];
    size: string[];
    natural: string[];
    deflection: string[];
    misc: string[];
  };
  explanation: string;
}

/**
 * Calculates 3.5e Base Attack Bonus (BAB) by class
 */
export function get35eBaseAttackBonus(char: CharacterData): Dnd35eBaseAttackBreakdown {
  const isGestalt = Boolean(char.optionalRules?.useGestaltUA72);
  const isMulticlass = Boolean(char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass);
  const lvl = Math.max(1, char.level || 1);
  const primaryClass = char.characterClass || '';
  const secondaryClass = char.optionalRules?.secondaryClass || '';
  const secondaryLevel = Math.max(1, char.optionalRules?.secondaryLevel || 1);
  const primaryLevel = isMulticlass ? Math.max(1, lvl - secondaryLevel) : lvl;

  let bab = 0;
  let progressionType: 'Full' | 'Three-Quarter' | 'Half' = 'Three-Quarter';

  // Manual override takes precedence if explicitly provided and not gestalt
  if (!isGestalt && typeof char.bab === 'number') {
    bab = char.bab;
  } else if (!isGestalt && typeof char.baseAttackBonus === 'number') {
    bab = char.baseAttackBonus;
  } else if (isMulticlass) {
    const bab1 = calculateClassBab(primaryClass, primaryLevel);
    const bab2 = calculateClassBab(secondaryClass, secondaryLevel);
    bab = bab1 + bab2;
    const rule1 = find35eClassRule(primaryClass);
    progressionType = rule1?.babProgression || 'Three-Quarter';
  } else {
    const rule = find35eClassRule(primaryClass);
    if (rule) {
      progressionType = rule.babProgression;
      bab = calculateClassBab(primaryClass, lvl);
    } else {
      bab = calculateClassBab(primaryClass, lvl);
      progressionType = bab === lvl ? 'Full' : bab === Math.floor(lvl * 0.5) ? 'Half' : 'Three-Quarter';
    }
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
  const lvl = Math.max(1, char.level || 1);
  const primaryClass = char.characterClass || '';
  const abilities = getEffectiveAbilities(char);

  const conMod = getAbilityModifier(abilities.CON?.score || 10);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);

  // Good save formula: 2 + floor(lvl / 2)
  // Poor save formula: floor(lvl / 3)
  const calcSave = (isGood: boolean, classLevel: number) =>
    isGood ? 2 + Math.floor(classLevel / 2) : Math.floor(classLevel / 3);

  const rule = find35eClassRule(primaryClass);
  let goodFort = rule ? rule.goodSaves.includes('Fortitude') : false;
  let goodRef = rule ? rule.goodSaves.includes('Reflex') : false;
  let goodWill = rule ? rule.goodSaves.includes('Will') : false;

  // Fallback heuristic if not matched in dictionary
  if (!rule) {
    const cls = primaryClass.toLowerCase();
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
    } else if (cls.includes('sorcerer') || cls.includes('wizard') || cls.includes('psion')) {
      goodWill = true;
    } else {
      goodFort = true;
    }
  }

  let baseFort = calcSave(goodFort, lvl);
  let baseRef = calcSave(goodRef, lvl);
  let baseWill = calcSave(goodWill, lvl);

  // Multiclass save stacking: add secondary class saves
  if (char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass) {
    const secClass = char.optionalRules.secondaryClass;
    const secLevel = Math.max(1, char.optionalRules.secondaryLevel || 1);
    const primLevel = Math.max(1, lvl - secLevel);

    const primRule = find35eClassRule(primaryClass);
    const secRule = find35eClassRule(secClass);

    const pFortGood = primRule ? primRule.goodSaves.includes('Fortitude') : goodFort;
    const pRefGood = primRule ? primRule.goodSaves.includes('Reflex') : goodRef;
    const pWillGood = primRule ? primRule.goodSaves.includes('Will') : goodWill;

    const sFortGood = secRule ? secRule.goodSaves.includes('Fortitude') : false;
    const sRefGood = secRule ? secRule.goodSaves.includes('Reflex') : false;
    const sWillGood = secRule ? secRule.goodSaves.includes('Will') : false;

    baseFort = calcSave(pFortGood, primLevel) + calcSave(sFortGood, secLevel);
    baseRef = calcSave(pRefGood, primLevel) + calcSave(sRefGood, secLevel);
    baseWill = calcSave(pWillGood, primLevel) + calcSave(sWillGood, secLevel);

    goodFort = pFortGood || sFortGood;
    goodRef = pRefGood || sRefGood;
    goodWill = pWillGood || sWillGood;
  }

  // 3.5e Negative Levels: -1 to all saving throws per negative level
  const negPenalty = char.negativeLevels || 0;

  // 3.5e Cover: Standard Cover (+2 Reflex), Improved Cover (+4 Reflex), Total Cover (Blocks line of effect / +4 Reflex)
  let coverReflexBonus = 0;
  if (char.activeCover === 'standard') {
    coverReflexBonus = 2;
  } else if (char.activeCover === 'improved') {
    coverReflexBonus = 4;
  } else if (char.activeCover === 'total') {
    coverReflexBonus = 4;
  }

  // 3.5e Barbarian Rage Will Save Morale Bonus (+2 normal, +3 greater, +4 mighty)
  let rageWillBonus = 0;
  if (char.isRaging35e) {
    const lvl = Math.max(1, char.level || 1);
    rageWillBonus = lvl >= 20 ? 4 : lvl >= 11 ? 3 : 2;
  }

  return {
    fortitude: { total: baseFort + conMod - negPenalty, base: baseFort, abilityMod: conMod, isGood: goodFort },
    reflex: { total: baseRef + dexMod + coverReflexBonus - negPenalty, base: baseRef, abilityMod: dexMod, isGood: goodRef },
    will: { total: baseWill + wisMod + rageWillBonus - negPenalty, base: baseWill, abilityMod: wisMod, isGood: goodWill }
  };
}

export { get35eSizeModifier };

export function get35eArmorMaxDex(itemName?: string, armorType?: string, explicitMaxDex?: number): number {
  if (explicitMaxDex !== undefined) return explicitMaxDex;
  const name = (itemName || '').toLowerCase();
  if (name.includes('full plate') || name.includes('half-plate') || name.includes('banded mail')) return 1;
  if (name.includes('splint mail') || name.includes('splint')) return 0;
  if (name.includes('chainmail')) return 2;
  if (name.includes('scale mail')) return 3;
  if (name.includes('breastplate') || name.includes('chain shirt') || name.includes('hide')) return 4;
  if (name.includes('studded leather')) return 5;
  if (name.includes('leather')) return 6;
  if (name.includes('padded')) return 8;
  if (name.includes('tower shield')) return 2;
  if (armorType === 'Heavy') return 1;
  if (armorType === 'Medium') return 3;
  return 99; // unlimited for light or unarmored
}

/**
 * Calculates 3.5e Total AC, Touch AC, and Flat-Footed AC according to classic 3.5e rules:
 * AC = 10 + Armor + Shield + DEX + Size + Natural Armor + Deflection + Misc
 */
export function get35eArmorClass(char: CharacterData): Dnd35eArmorClassBreakdown {
  const baseAc = 10;
  const abilities = getEffectiveAbilities(char);
  const rawDexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);

  const sources = {
    armor: [] as string[],
    shield: [] as string[],
    dex: [] as string[],
    size: [] as string[],
    natural: [] as string[],
    deflection: [] as string[],
    misc: [] as string[]
  };

  const inventory = char.inventory || [];
  const equipped = inventory.filter(i => {
    if (!i.equipped || i.stored) return false;
    const needsAttunement = i.requiresAttunement === true || (i.requiresAttunement !== false && (i.notes || '').toLowerCase().includes('attunement'));
    if (needsAttunement && !i.attuned) return false;
    return true;
  });

  // 1. ARMOR BONUS
  let armorBonus = 0;
  let armorName: string | undefined;
  let maxDexCap = char.maxDexBonusOverride !== undefined ? char.maxDexBonusOverride : 99;

  for (const item of equipped) {
    const isShield = item.armorType === 'Shield' || (item.name || '').toLowerCase().includes('shield');
    if (isShield) continue;

    const isArmor = item.itemType === 'Armor' || item.armorType === 'Light' || item.armorType === 'Medium' || item.armorType === 'Heavy' || item.armorAc !== undefined || (item.name || '').toLowerCase().includes('armor') || (item.name || '').toLowerCase().includes('mail') || (item.name || '').toLowerCase().includes('plate') || (item.name || '').toLowerCase().includes('robe') || (item.name || '').toLowerCase().includes('bracers of armor');

    if (isArmor) {
      let itemBaseArmor = 0;
      if (item.armorAc !== undefined) {
        itemBaseArmor = item.armorAc >= 10 ? item.armorAc - 10 : item.armorAc;
      }
      const magicMod = item.acBonus || 0;
      const totalItemArmor = itemBaseArmor + magicMod;

      // In 3.5e armor bonuses don't stack - take highest
      if (totalItemArmor > armorBonus) {
        armorBonus = totalItemArmor;
        armorName = item.name;
        sources.armor = [`${item.name} (+${totalItemArmor})`];
      }

      const itemMaxDex = get35eArmorMaxDex(item.name, item.armorType, item.maxDexBonus);
      if (itemMaxDex < maxDexCap) {
        maxDexCap = itemMaxDex;
      }
    }
  }

  // 2. SHIELD BONUS
  let shieldBonus = 0;
  let shieldName: string | undefined;

  for (const item of equipped) {
    const isShield = item.armorType === 'Shield' || (item.name || '').toLowerCase().includes('shield');
    if (isShield) {
      let baseShield = 2; // Default Heavy Shield
      const n = (item.name || '').toLowerCase();
      if (n.includes('tower')) {
        baseShield = 4;
        if (maxDexCap > 2) maxDexCap = 2; // Tower shield restricts max DEX to +2
      } else if (n.includes('light') || n.includes('buckler')) {
        baseShield = 1;
      } else if (item.armorAc !== undefined) {
        baseShield = item.armorAc >= 10 ? item.armorAc - 10 : item.armorAc;
      }

      const magicMod = item.acBonus || 0;
      const totalShield = baseShield + magicMod;

      if (totalShield > shieldBonus) {
        shieldBonus = totalShield;
        shieldName = item.name;
        sources.shield = [`${item.name} (+${totalShield})`];
      }
    }
  }

  // 3. DEX MODIFIER (capped by Armor/Shield Max Dex)
  let dexBonus = rawDexMod;
  if (rawDexMod > 0) {
    dexBonus = Math.min(rawDexMod, maxDexCap);
    if (maxDexCap < 99) {
      sources.dex.push(`DEX +${rawDexMod} (Capped at +${maxDexCap})`);
    } else {
      sources.dex.push(`DEX +${rawDexMod}`);
    }
  } else if (rawDexMod < 0) {
    sources.dex.push(`DEX ${rawDexMod}`);
  } else {
    sources.dex.push(`DEX +0`);
  }

  // 4. SIZE MODIFIER
  const sizeModifier = get35eSizeModifier(char.sizeCategory, char.race) + (char.sizeAcBonus || 0);
  if (sizeModifier !== 0) {
    sources.size.push(`${char.sizeCategory || char.race || 'Size'} (${sizeModifier > 0 ? '+' + sizeModifier : sizeModifier})`);
  }

  // 5. NATURAL ARMOR
  let naturalArmorBonus = char.naturalArmorBonus || 0;
  if (char.naturalArmorBonus) {
    sources.natural.push(`Base Natural Armor (+${char.naturalArmorBonus})`);
  }

  // Wild Shape / Polymorph Natural Armor
  if (char.wildShapeActive && char.wildShapeForm?.naturalArmorBonus) {
    naturalArmorBonus += char.wildShapeForm.naturalArmorBonus;
    sources.natural.push(`Wild Shape (${char.wildShapeForm.name}) (+${char.wildShapeForm.naturalArmorBonus} Nat Armor)`);
  }

  // Racial Natural Armor check
  const rLower = (char.race || '').toLowerCase();
  if (rLower.includes('lizardfolk')) {
    naturalArmorBonus = Math.max(naturalArmorBonus, 5);
    sources.natural.push('Lizardfolk Natural Armor (+5)');
  } else if (rLower.includes('troglodyte')) {
    naturalArmorBonus = Math.max(naturalArmorBonus, 6);
    sources.natural.push('Troglodyte Natural Armor (+6)');
  } else if (rLower.includes('gnoll') || rLower.includes('bugbear') || rLower.includes('kobold')) {
    naturalArmorBonus = Math.max(naturalArmorBonus, 1);
    sources.natural.push(`${char.race} Natural Armor (+1)`);
  }

  for (const item of equipped) {
    const notesLower = (item.notes || '').toLowerCase();
    const isNatItem = item.naturalArmorBonus !== undefined || notesLower.includes('natural armor');
    if (isNatItem) {
      const bonus = item.naturalArmorBonus || item.acBonus || 1;
      naturalArmorBonus += bonus;
      sources.natural.push(`${item.name} (+${bonus} Nat Armor)`);
    }
  }

  // 6. DEFLECTION MODIFIER
  let deflectionBonus = char.deflectionBonus || 0;
  if (char.deflectionBonus) {
    sources.deflection.push(`Base Deflection (+${char.deflectionBonus})`);
  }

  for (const item of equipped) {
    const n = (item.name || '').toLowerCase();
    const notesLower = (item.notes || '').toLowerCase();
    const isDeflection = item.deflectionBonus !== undefined || n.includes('ring of protection') || notesLower.includes('deflection');
    if (isDeflection) {
      const bonus = item.deflectionBonus || item.acBonus || 1;
      // In 3.5e deflection bonuses don't stack - take highest
      if (bonus > deflectionBonus) {
        deflectionBonus = bonus;
        sources.deflection = [`${item.name} (+${bonus} Deflection)`];
      }
    }
  }

  // 7. MISC & DODGE MODIFIERS
  let dodgeBonus = char.dodgeBonus || 0;
  let miscBonus = char.miscAcBonus || 0;

  // 3.5e Tactical Cover: Standard/Soft Cover (+4 AC), Improved Cover (+8 AC), Total Cover (Untargetable)
  if (char.activeCover === 'standard' || char.activeCover === 'soft') {
    miscBonus += 4;
    sources.misc.push(`${char.activeCover === 'soft' ? 'Soft' : 'Standard'} Cover (+4 AC)`);
  } else if (char.activeCover === 'improved') {
    miscBonus += 8;
    sources.misc.push('Improved Cover (+8 AC)');
  } else if (char.activeCover === 'total') {
    sources.misc.push('Total Cover (Untargetable / Cannot be attacked directly)');
  }

  if (char.dodgeBonus) {
    sources.misc.push(`Dodge Bonus (+${char.dodgeBonus})`);
  }
  if (char.miscAcBonus) {
    sources.misc.push(`Misc AC Bonus (+${char.miscAcBonus})`);
  }

  // 3.5e Barbarian Rage AC Penalty (-2 AC)
  if (char.isRaging35e) {
    miscBonus -= 2;
    sources.misc.push('Barbarian Rage (-2 AC)');
  }

  // Monk AC Bonus in 3.5e: Wis mod + 1 per 5 monk levels if unarmored and unshielded
  const clsLower = (char.characterClass || '').toLowerCase();
  if (clsLower.includes('monk') && armorBonus === 0 && shieldBonus === 0) {
    const monkBonus = Math.max(0, wisMod) + Math.floor((char.level || 1) / 5);
    if (monkBonus > 0) {
      miscBonus += monkBonus;
      sources.misc.push(`Monk AC Bonus (+${monkBonus} WIS/Lvl)`);
    }
  }

  // Equipped misc accessory bonuses
  for (const item of equipped) {
    const isShield = item.armorType === 'Shield' || (item.name || '').toLowerCase().includes('shield');
    const isArmor = item.itemType === 'Armor' || item.armorType === 'Light' || item.armorType === 'Medium' || item.armorType === 'Heavy';
    const isDefl = item.deflectionBonus !== undefined || (item.name || '').toLowerCase().includes('ring of protection');
    const isNat = item.naturalArmorBonus !== undefined || (item.notes || '').toLowerCase().includes('natural armor');

    if (!isShield && !isArmor && !isDefl && !isNat) {
      if (item.dodgeBonus) {
        dodgeBonus += item.dodgeBonus;
        sources.misc.push(`${item.name} (+${item.dodgeBonus} Dodge)`);
      } else if (item.acBonus) {
        miscBonus += item.acBonus;
        sources.misc.push(`${item.name} (+${item.acBonus})`);
      }
    }
  }

  const totalMisc = miscBonus + dodgeBonus;

  // 8. TOTAL, TOUCH, AND FLAT-FOOTED AC
  // AC = 10 + Armor + Shield + DEX + Size + Natural Armor + Deflection + Misc
  const totalAc = baseAc + armorBonus + shieldBonus + dexBonus + sizeModifier + naturalArmorBonus + deflectionBonus + totalMisc;

  // Touch AC = 10 + DEX + Size + Deflection + Dodge + Misc (No Armor, Shield, Natural Armor)
  const touchAc = baseAc + dexBonus + sizeModifier + deflectionBonus + dodgeBonus + miscBonus + (char.touchAcOverride || 0);

  // Flat-Footed AC = 10 + Armor + Shield + (DEX < 0 ? DEX : 0) + Size + Natural Armor + Deflection + Misc (No DEX bonus, No Dodge)
  const flatFootedDex = dexBonus < 0 ? dexBonus : 0;
  const flatFootedAc = baseAc + armorBonus + shieldBonus + flatFootedDex + sizeModifier + naturalArmorBonus + deflectionBonus + miscBonus + (char.flatFootedAcOverride || 0);

  const explanationParts = [
    'Base 10',
    armorBonus ? `Armor +${armorBonus}` : null,
    shieldBonus ? `Shield +${shieldBonus}` : null,
    `DEX ${dexBonus >= 0 ? '+' + dexBonus : dexBonus}`,
    sizeModifier ? `Size ${sizeModifier > 0 ? '+' + sizeModifier : sizeModifier}` : null,
    naturalArmorBonus ? `Natural +${naturalArmorBonus}` : null,
    deflectionBonus ? `Deflection +${deflectionBonus}` : null,
    totalMisc ? `Misc +${totalMisc}` : null
  ].filter(Boolean) as string[];

  return {
    totalAc,
    baseAc,
    armorBonus,
    shieldBonus,
    dexBonus,
    rawDexMod,
    maxDexCap,
    sizeModifier,
    naturalArmorBonus,
    deflectionBonus,
    miscBonus: totalMisc,
    dodgeBonus,
    touchAc,
    flatFootedAc,
    armorName,
    shieldName,
    sources,
    explanation: explanationParts.join(' + ')
  };
}
