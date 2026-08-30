import { AbilityName, AbilityScores, CharacterData, GearItem, RuleEdition, Skill } from '../types';
import {
  getCombinedLevel,
  getActiveClassChoice,
  getAbilityModifier,
  getSavingThrowBonus,
  getEffectiveLevel,
  getEffectiveAbilities,
  getProficiencyBonus,
  formatModifier
} from '../systems/dnd5e';
export * from '../systems/dnd5e';
export * from './calculators/dnd35eCalculators';


export {
  OFFICIAL_DAMAGE_TYPES,
  getDamageTypeMeta,
  type DamageTypeMeta
} from '../data/damageTypeData';

export function getEffectiveClassTitle(char: CharacterData): string {
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
  const equippedItems = inventory.filter(i => {
    if (!i.equipped || i.stored) return false;
    // If item requires attunement, it must be attuned to grant defense/AC benefits
    const needsAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
    if (needsAttunement && !i.attuned) return false;
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
        const bonusVal = item.armorAc ?? 2;
        otherEquippedBonusItems.push({ item, bonus: bonusVal });
      }
      continue;
    }

    // Check if item is armor
    const isArmor =
      item.itemType === 'Armor' ||
      (item.armorAc !== undefined && (item.armorType as string) !== 'Shield' && (item.armorType as string) !== 'Bonus') ||
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
      // Check for AC bonus on other equipped magic items (Ring of Protection, etc.)
      const bonusVal = item.armorAc ?? item.acBonus ?? (() => {
        const bonusMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i) ||
                           nameLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i);
        return bonusMatch ? parseInt(bonusMatch[1] || bonusMatch[2] || '0', 10) : 0;
      })();
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

    // Check magic bonus in name or notes (+1, +2, +3)
    const magicMatch = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
    if (magicMatch) {
      magicBonus = parseInt(magicMatch[1], 10);
    }

    const explicitAcMatch = notesLower.match(/ac\s*(\d+)/i) || nameLower.match(/ac\s*(\d+)/i);

    if (equippedArmor.armorAc !== undefined) {
      baseAc = equippedArmor.armorAc;
      if (equippedArmor.armorType === 'Heavy') {
        dexBonus = 0;
        explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      } else if (equippedArmor.armorType === 'Medium') {
        dexBonus = Math.min(dexMod, 2);
        explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
        if (dexBonus !== 0) explanationParts.push(`DEX (Max +2: ${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
      } else if (equippedArmor.armorType === 'Bonus') {
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
      else if (nameLower.includes('ring mail')) baseAc = 11;
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
      dexBonus = Math.min(dexMod, 2);
      explanationParts.push(`${equippedArmor.name} (AC ${baseAc})`);
      if (dexBonus !== 0) explanationParts.push(`DEX (Max +2: ${dexBonus >= 0 ? '+' + dexBonus : dexBonus})`);
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

  // Size Modifier to AC (D&D 3.5e)
  let sizeAcBonus = 0;
  if (char.edition === '3.5e' && char.sizeCategory) {
    sizeAcBonus = getSizeACModifier(char.sizeCategory);
    if (sizeAcBonus !== 0) {
      explanationParts.push(`Size (${sizeAcBonus > 0 ? '+' + sizeAcBonus : sizeAcBonus})`);
    }
  }

  const total = baseAc + dexBonus + magicBonus + shieldBonus + defenseStyleBonus + miscBonus + defenseBonusUA + sizeAcBonus;

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
    armorName,
    shieldName,
    isUnarmored,
    explanation: explanationParts.join(' + ')
  };
}

// ==========================================
// UNEARTHED ARCANA p. 72 & p. 109 HELPERS
// ==========================================

export function getHitDieValue(className: string): number {
  const c = className.toLowerCase();
  if (c.includes('barbarian')) return 12;
  if (c.includes('fighter') || c.includes('paladin') || c.includes('ranger')) return 10;
  if (c.includes('sorcerer') || c.includes('wizard')) return 6;
  return 8; // Cleric, Rogue, Bard, Druid, Monk, Warlock, Artificer
}

export function getGestaltHitDie(primaryClass: string, secondaryClass?: string): string {
  const val1 = getHitDieValue(primaryClass);
  const val2 = secondaryClass ? getHitDieValue(secondaryClass) : 0;
  const bestVal = Math.max(val1, val2);
  return `1d${bestVal}`;
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

  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 1. Explicit Item Damage Reduction fields
  for (const item of equippedItems) {
    if (item.damageReduction && item.damageReduction > 0) {
      totalDR += item.damageReduction;
      sources.push(`${item.name} (DR ${item.damageReduction})`);
    }
  }

  // 2. Unearthed Arcana p. 109/111 Armor as Damage Reduction Rule
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
  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 1. Equipped Items
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

  // 2. Base Race & Ancestry Resistances
  const raceLower = (char.race || '').toLowerCase();

  if (raceLower.includes('tiefling')) {
    if (!list.some(r => r.type.toLowerCase() === 'fire')) {
      list.push({ type: 'Fire', source: 'Hellish Resistance (Tiefling)' });
    }
  }
  if (raceLower.includes('dwarf')) {
    if (!list.some(r => r.type.toLowerCase() === 'poison')) {
      list.push({ type: 'Poison', source: 'Dwarven Resilience (Dwarf)' });
    }
  }
  if (raceLower.includes('aasimar')) {
    if (!list.some(r => r.type.toLowerCase() === 'necrotic')) {
      list.push({ type: 'Necrotic', source: 'Celestial Resistance (Aasimar)' });
    }
    if (!list.some(r => r.type.toLowerCase() === 'radiant')) {
      list.push({ type: 'Radiant', source: 'Celestial Resistance (Aasimar)' });
    }
  }
  if (raceLower.includes('warforged')) {
    if (!list.some(r => r.type.toLowerCase() === 'poison')) {
      list.push({ type: 'Poison', source: 'Constructed Resilience (Warforged)' });
    }
  }
  if (raceLower.includes('dragonborn')) {
    // Detect elemental type from feature text, defaulting to Fire
    const featStr = (char.classFeatures || []).map(f => `${f.name} ${f.description}`).join(' ').toLowerCase();
    let draconicType = 'Fire';
    if (featStr.includes('cold') || featStr.includes('white') || featStr.includes('silver')) draconicType = 'Cold';
    else if (featStr.includes('lightning') || featStr.includes('blue') || featStr.includes('bronze')) draconicType = 'Lightning';
    else if (featStr.includes('acid') || featStr.includes('black') || featStr.includes('copper')) draconicType = 'Acid';
    else if (featStr.includes('poison') || featStr.includes('green')) draconicType = 'Poison';

    if (!list.some(r => r.type.toLowerCase() === draconicType.toLowerCase())) {
      list.push({ type: draconicType, source: `Draconic Resistance (${draconicType} Dragonborn)` });
    }
  }
  if (raceLower.includes('genasi')) {
    const featStr = (char.classFeatures || []).map(f => `${f.name} ${f.description}`).join(' ').toLowerCase();
    let genasiType = 'Fire';
    if (featStr.includes('water') || featStr.includes('cold')) genasiType = 'Cold';
    else if (featStr.includes('earth') || featStr.includes('acid')) genasiType = 'Acid';
    else if (featStr.includes('air') || featStr.includes('lightning')) genasiType = 'Lightning';

    if (!list.some(r => r.type.toLowerCase() === genasiType.toLowerCase())) {
      list.push({ type: genasiType, source: `Elemental Resistance (${genasiType} Genasi)` });
    }
  }

  // 3. Half-Breed / Hybrid Heritage Ancestry (The Alpine DM System)
  if (char.hybridHeritage?.enabled) {
    const p1 = (char.hybridHeritage.primaryParent || '').toLowerCase();
    const p2 = (char.hybridHeritage.secondaryParent || '').toLowerCase();

    const applyParentResist = (pName: string) => {
      if (pName.includes('tiefling') && !list.some(r => r.type.toLowerCase() === 'fire')) {
        list.push({ type: 'Fire', source: 'Tiefling Heritage Resistance' });
      }
      if ((pName.includes('dwarf') || pName.includes('warforged')) && !list.some(r => r.type.toLowerCase() === 'poison')) {
        list.push({ type: 'Poison', source: 'Dwarven / Warforged Heritage Resilience' });
      }
      if (pName.includes('aasimar')) {
        if (!list.some(r => r.type.toLowerCase() === 'necrotic')) list.push({ type: 'Necrotic', source: 'Celestial Heritage Resistance' });
        if (!list.some(r => r.type.toLowerCase() === 'radiant')) list.push({ type: 'Radiant', source: 'Celestial Heritage Resistance' });
      }
      if (pName.includes('dragonborn') && !list.some(r => r.type.toLowerCase() === 'fire')) {
        list.push({ type: 'Fire', source: 'Draconic Heritage Resistance' });
      }
      if (pName.includes('genasi') && !list.some(r => r.type.toLowerCase() === 'fire')) {
        list.push({ type: 'Fire', source: 'Elemental Heritage Resistance' });
      }
    };

    applyParentResist(p1);
    applyParentResist(p2);
  }

  // 4. Scan Class / Racial Features for explicit "resistance to [type]"
  if (char.classFeatures) {
    for (const feat of char.classFeatures) {
      const text = `${feat.name} ${feat.description}`.toLowerCase();
      const matches = text.matchAll(/resistance to (fire|cold|lightning|acid|poison|necrotic|radiant|psychic|force|thunder|slashing|piercing|bludgeoning|physical)/gi);
      for (const match of matches) {
        const typeFound = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (!list.some(r => r.type.toLowerCase() === typeFound.toLowerCase() && r.source === feat.name)) {
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
  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  // 1. Equipped items with immunity
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

  // 2. Active condition effects
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
  const computedAC = calculateArmorClass(char);
  if (char.armorClass === computedAC) return char;
  return {
    ...char,
    armorClass: computedAC
  };
}

export interface WeightBreakdown {
  equippedWeight: number;
  carriedWeight: number;
  storedWeight: number;
  activeWeight: number;
  mode: 'equipped_only' | 'carried_only' | 'all_items';
}

export function getWeightBreakdown(char: CharacterData): WeightBreakdown {
  const mode = char.optionalRules?.weightCalculationMode || 'carried_only';

  let equippedWeight = 0;
  let carriedWeight = 0;
  let storedWeight = 0;

  for (const item of char.inventory) {
    const itemTotalWeight = (item.weight || 0) * (item.quantity || 1);
    if (item.stored) {
      storedWeight += itemTotalWeight;
    } else if (item.equipped) {
      equippedWeight += itemTotalWeight;
    } else {
      carriedWeight += itemTotalWeight;
    }
  }

  let activeWeight = 0;
  if (mode === 'equipped_only') {
    activeWeight = equippedWeight;
  } else if (mode === 'carried_only') {
    activeWeight = equippedWeight + carriedWeight;
  } else {
    activeWeight = equippedWeight + carriedWeight + storedWeight;
  }

  return {
    equippedWeight,
    carriedWeight,
    storedWeight,
    activeWeight,
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
  const { multiplier } = getSizeCarryingMultiplier(char);
  return Math.floor(strScore * 15 * multiplier);
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
}

export function getEncumbranceDetails(char: CharacterData): EncumbranceDetails {
  const totalWeight = getTotalWeight(char);
  const effectiveAbilities = getEffectiveAbilities(char);
  const strScore = effectiveAbilities.STR?.score || 10;
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

  // Calculate Feat Bonuses (e.g. Tough feat: +2 HP per level)
  if (char.feats && char.feats.length > 0) {
    char.feats.forEach(feat => {
      if (feat.hpMaxBonus) {
        featBonus += feat.hpMaxBonus;
        details.push(`Feat (${feat.name}): ${feat.hpMaxBonus > 0 ? '+' : ''}${feat.hpMaxBonus} Max HP`);
      } else if (feat.name.toLowerCase().includes('tough')) {
        const toughValue = 2 * (char.level || 1);
        featBonus += toughValue;
        details.push(`Feat (${feat.name}): +${toughValue} Max HP (+2/level)`);
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

  let subtotal = baseMaxHp + featBonus + equippedItemBonus + tempModifier;
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

  return {
    baseSpeed,
    effectiveSpeed,
    speedPenalty,
    isModified: speedPenalty > 0,
    status: effects.speedZero ? 'Speed 0 (Condition)' : encumbrance.status,
    reasons,
    armorPenalty,
    isDwarf
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

export function getTotalWealthInGold(char: CharacterData): number {
  if (!char || !char.wealth) return 0;
  const cp = Number(char.wealth.cp) || 0;
  const sp = Number(char.wealth.sp) || 0;
  const ep = Number(char.wealth.ep) || 0;
  const gp = Number(char.wealth.gp) || 0;
  const pp = Number(char.wealth.pp) || 0;
  const total = cp / 100 + sp / 10 + ep / 2 + gp + pp * 10;
  return isNaN(total) ? 0 : Number(total.toFixed(2));
}

export const DEFAULT_SKILLS_LIST: { name: string; ability: AbilityName }[] = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Animal Handling', ability: 'WIS' },
  { name: 'Arcana', ability: 'INT' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Deception', ability: 'CHA' },
  { name: 'History', ability: 'INT' },
  { name: 'Insight', ability: 'WIS' },
  { name: 'Intimidation', ability: 'CHA' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Medicine', ability: 'WIS' },
  { name: 'Nature', ability: 'INT' },
  { name: 'Perception', ability: 'WIS' },
  { name: 'Performance', ability: 'CHA' },
  { name: 'Persuasion', ability: 'CHA' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Survival', ability: 'WIS' },
];

export const DEFAULT_35E_SKILLS_LIST: { name: string; ability: AbilityName }[] = [
  { name: 'Appraise', ability: 'INT' },
  { name: 'Balance', ability: 'DEX' },
  { name: 'Bluff', ability: 'CHA' },
  { name: 'Climb', ability: 'STR' },
  { name: 'Concentration', ability: 'CON' },
  { name: 'Craft', ability: 'INT' },
  { name: 'Decipher Script', ability: 'INT' },
  { name: 'Diplomacy', ability: 'CHA' },
  { name: 'Disable Device', ability: 'INT' },
  { name: 'Disguise', ability: 'CHA' },
  { name: 'Escape Artist', ability: 'DEX' },
  { name: 'Forgery', ability: 'INT' },
  { name: 'Gather Information', ability: 'CHA' },
  { name: 'Handle Animal', ability: 'CHA' },
  { name: 'Heal', ability: 'WIS' },
  { name: 'Hide', ability: 'DEX' },
  { name: 'Intimidate', ability: 'CHA' },
  { name: 'Jump', ability: 'STR' },
  { name: 'Knowledge (Arcana)', ability: 'INT' },
  { name: 'Knowledge (Dungeoneering)', ability: 'INT' },
  { name: 'Knowledge (Local)', ability: 'INT' },
  { name: 'Knowledge (Nature)', ability: 'INT' },
  { name: 'Knowledge (Religion)', ability: 'INT' },
  { name: 'Knowledge (The Planes)', ability: 'INT' },
  { name: 'Listen', ability: 'WIS' },
  { name: 'Move Silently', ability: 'DEX' },
  { name: 'Open Lock', ability: 'DEX' },
  { name: 'Perform', ability: 'CHA' },
  { name: 'Profession', ability: 'WIS' },
  { name: 'Ride', ability: 'DEX' },
  { name: 'Search', ability: 'INT' },
  { name: 'Sense Motive', ability: 'WIS' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Spellcraft', ability: 'INT' },
  { name: 'Spot', ability: 'WIS' },
  { name: 'Survival', ability: 'WIS' },
  { name: 'Swim', ability: 'STR' },
  { name: 'Tumble', ability: 'DEX' },
  { name: 'Use Magic Device', ability: 'CHA' },
  { name: 'Use Rope', ability: 'DEX' },
];

export function get35eSkillBonus(skill: Skill, abilities: AbilityScores): number {
  const abilityMod = getAbilityModifier(abilities[skill.ability]?.score || 10);
  const ranks = skill.ranks || 0;
  const misc = skill.miscMod || 0;
  return ranks + abilityMod + misc;
}

export function get35eFortSave(char: CharacterData): number {
  const base = char.fortSaveBase ?? (Math.floor(char.level / 2) + 2);
  const conMod = getAbilityModifier(char.abilities.CON?.score || 10);
  return base + conMod;
}

export function get35eRefSave(char: CharacterData): number {
  const base = char.refSaveBase ?? Math.floor(char.level / 3);
  const dexMod = getAbilityModifier(char.abilities.DEX?.score || 10);
  return base + dexMod;
}

export function get35eWillSave(char: CharacterData): number {
  const base = char.willSaveBase ?? Math.floor(char.level / 3);
  const wisMod = getAbilityModifier(char.abilities.WIS?.score || 10);
  return base + wisMod;
}

export function get35eTouchAC(char: CharacterData): number {
  const dexMod = getAbilityModifier(char.abilities.DEX?.score || 10);
  return 10 + dexMod + (char.touchAcOverride || 0);
}

export function get35eFlatFootedAC(char: CharacterData): number {
  const dexMod = getAbilityModifier(char.abilities.DEX?.score || 10);
  const baseAc = char.armorClass;
  return Math.max(10, baseAc - Math.max(0, dexMod)) + (char.flatFootedAcOverride || 0);
}

export function get35eGrapple(char: CharacterData): number {
  const bab = char.bab ?? char.level;
  const strMod = getAbilityModifier(char.abilities.STR?.score || 10);
  return bab + strMod;
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


