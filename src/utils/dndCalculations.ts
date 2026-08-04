import { AbilityName, AbilityScores, CharacterData, GearItem, RuleEdition, Skill } from '../types';

export function getAbilityModifier(score: number): number {
  const num = Number(score);
  const safeScore = isNaN(num) ? 10 : num;
  return Math.floor((safeScore - 10) / 2);
}

export function formatModifier(mod: number): string {
  const num = Number(mod);
  const safeMod = isNaN(num) ? 0 : num;
  return safeMod >= 0 ? `+${safeMod}` : `${safeMod}`;
}

export function getProficiencyBonus(level: number): number {
  const num = Number(level);
  const safeLvl = isNaN(num) || num < 1 ? 1 : num;
  return Math.ceil(1 + safeLvl / 4);
}

export interface DamageTypeMeta {
  name: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const OFFICIAL_DAMAGE_TYPES: DamageTypeMeta[] = [
  { name: 'Acid', icon: '🧪', badgeBg: 'bg-lime-950', badgeText: 'text-lime-300', badgeBorder: 'border-lime-600/50', description: 'Corrosive enzymes, dragon breath, or black pudding' },
  { name: 'Bludgeoning', icon: '🔨', badgeBg: 'bg-stone-800', badgeText: 'text-stone-200', badgeBorder: 'border-stone-600/50', description: 'Blunt force attacks—hammers, falling, or constriction' },
  { name: 'Cold', icon: '❄️', badgeBg: 'bg-cyan-950', badgeText: 'text-cyan-300', badgeBorder: 'border-cyan-600/50', description: 'Infernal frost, ice storms, or cone of cold' },
  { name: 'Fire', icon: '🔥', badgeBg: 'bg-orange-950', badgeText: 'text-orange-300', badgeBorder: 'border-orange-600/50', description: 'Flame, intense heat, or dragon breath' },
  { name: 'Force', icon: '🌀', badgeBg: 'bg-indigo-950', badgeText: 'text-indigo-300', badgeBorder: 'border-indigo-600/50', description: 'Pure magic focused into damaging pressure (e.g. Eldritch Blast)' },
  { name: 'Lightning', icon: '⚡', badgeBg: 'bg-amber-950', badgeText: 'text-amber-300', badgeBorder: 'border-amber-600/50', description: 'Electrical energy bolts or lightning bolts' },
  { name: 'Necrotic', icon: '💀', badgeBg: 'bg-purple-950', badgeText: 'text-purple-300', badgeBorder: 'border-purple-600/50', description: 'Withered vitality, shadow energy, or undead decay' },
  { name: 'Piercing', icon: '🗡️', badgeBg: 'bg-zinc-800', badgeText: 'text-zinc-200', badgeBorder: 'border-zinc-500/50', description: 'Puncturing attacks—arrows, spears, or monster fangs' },
  { name: 'Poison', icon: '☣️', badgeBg: 'bg-emerald-950', badgeText: 'text-emerald-300', badgeBorder: 'border-emerald-600/50', description: 'Venoms, toxic gases, or poisonous stings' },
  { name: 'Psychic', icon: '🧠', badgeBg: 'bg-fuchsia-950', badgeText: 'text-fuchsia-300', badgeBorder: 'border-fuchsia-600/50', description: 'Psionic strikes or mental anguish' },
  { name: 'Radiant', icon: '✨', badgeBg: 'bg-yellow-950', badgeText: 'text-yellow-300', badgeBorder: 'border-yellow-600/50', description: 'Searing holy light, celestial radiance, or divine smites' },
  { name: 'Slashing', icon: '⚔️', badgeBg: 'bg-rose-950', badgeText: 'text-rose-300', badgeBorder: 'border-rose-600/50', description: 'Cutting weapons—swords, axes, or claws' },
  { name: 'Thunder', icon: '💥', badgeBg: 'bg-sky-950', badgeText: 'text-sky-300', badgeBorder: 'border-sky-600/50', description: 'Concussive burst of sound, shockwaves, or thunderwave' }
];

export function getDamageTypeMeta(typeName?: string): DamageTypeMeta {
  if (!typeName) {
    return { name: 'Untyped', icon: '⚔️', badgeBg: 'bg-stone-800', badgeText: 'text-stone-300', badgeBorder: 'border-stone-700', description: 'Standard damage' };
  }
  const found = OFFICIAL_DAMAGE_TYPES.find(d => d.name.toLowerCase() === typeName.toLowerCase());
  if (found) return found;
  return { name: typeName, icon: '✨', badgeBg: 'bg-stone-800', badgeText: 'text-amber-200', badgeBorder: 'border-stone-700', description: `${typeName} damage` };
}

export function getSavingThrowBonus(
  abilityName: AbilityName,
  abilities: AbilityScores,
  savingThrowProficiencies: AbilityName[],
  level: number
): number {
  const mod = getAbilityModifier(abilities[abilityName]?.score || 10);
  const isProf = savingThrowProficiencies.includes(abilityName);
  const profBonus = isProf ? getProficiencyBonus(level) : 0;
  return mod + profBonus;
}

export function getSkillBonus(
  skill: Skill,
  abilities: AbilityScores,
  level: number
): number {
  const abilityScore = abilities[skill.ability]?.score || 10;
  const mod = getAbilityModifier(abilityScore);
  const prof = getProficiencyBonus(level);

  if (skill.expertise) {
    return mod + prof * 2;
  }
  if (skill.proficient) {
    return mod + prof;
  }
  return mod;
}

export function getPassivePerception(char: CharacterData): number {
  const effectiveLevel = getEffectiveLevel(char);
  const perceptionSkill = char.skills.find(s => s.name === 'Perception');
  if (perceptionSkill) {
    return 10 + getSkillBonus(perceptionSkill, char.abilities, effectiveLevel);
  }
  const wisMod = getAbilityModifier(char.abilities.WIS?.score || 10);
  return 10 + wisMod;
}

export function getSpellSaveDC(char: CharacterData): number {
  if (char.spellSaveDCOverride) return char.spellSaveDCOverride;
  const abilityMod = getAbilityModifier(char.abilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));
  return 8 + profBonus + abilityMod;
}

export function getSpellAttackBonus(char: CharacterData): number {
  if (char.spellAttackBonusOverride !== undefined) return char.spellAttackBonusOverride;
  const abilityMod = getAbilityModifier(char.abilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));
  return profBonus + abilityMod;
}

export function getEffectiveLevel(char: CharacterData): number {
  if (char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryLevel) {
    return char.level + Math.max(1, char.optionalRules.secondaryLevel);
  }
  return char.level;
}

export function getEffectiveClassTitle(char: CharacterData): string {
  if (char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass) {
    const secLvl = char.optionalRules.secondaryLevel || 1;
    const secSub = char.optionalRules.secondarySubclass ? ` (${char.optionalRules.secondarySubclass})` : '';
    return `${char.characterClass} ${char.level} / ${char.optionalRules.secondaryClass}${secSub} ${secLvl}`;
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

  const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
  const conMod = getAbilityModifier(char.abilities?.CON?.score || 10);
  const wisMod = getAbilityModifier(char.abilities?.WIS?.score || 10);

  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

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
      const bonusVal = item.armorAc ?? (() => {
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

  // Add race/feature implied resistances
  const raceLower = (char.race || '').toLowerCase();
  if (raceLower.includes('tiefling')) list.push({ type: 'Fire', source: 'Tiefling Racial Resistance' });
  if (raceLower.includes('dwarf')) list.push({ type: 'Poison', source: 'Dwarven Resilience' });
  if (raceLower.includes('dragonborn')) list.push({ type: 'Draconic', source: 'Dragonborn Resistance' });

  return list;
}

export interface AppliedDamageResult {
  originalTotal: number;
  finalTotal: number;
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

  let resistanceHalvedAmount = 0;
  let drAbsorbedAmount = 0;

  if (!targetChar || totalDamage <= 0) {
    return { originalTotal: totalDamage, finalTotal: totalDamage, resistanceHalvedAmount: 0, drAbsorbedAmount: 0, breakdownLogs: [] };
  }

  // 1. Check Resistance
  const resistances = getCharacterResistances(targetChar);
  const dmgTypeLower = (damageType || '').toLowerCase();

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

  // 2. Check Damage Reduction (DR)
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
  const strScore = char.abilities.STR?.score || 10;
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
  const strScore = char.abilities.STR?.score || 10;
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

export interface SpeedDetails {
  baseSpeed: number;
  effectiveSpeed: number;
  speedPenalty: number;
  isModified: boolean;
  status: string;
  reasons: string[];
}

export function getEffectiveSpeed(char: CharacterData): SpeedDetails {
  const baseSpeed = char.speed ?? 30;
  const encumbrance = getEncumbranceDetails(char);
  const speedPenalty = encumbrance.speedPenalty;
  const reasons: string[] = [];

  if (encumbrance.speedPenalty > 0) {
    reasons.push(`${encumbrance.status} (-${encumbrance.speedPenalty} ft)`);
  }

  const effectiveSpeed = Math.max(0, baseSpeed - speedPenalty);

  return {
    baseSpeed,
    effectiveSpeed,
    speedPenalty,
    isModified: speedPenalty > 0,
    status: encumbrance.status,
    reasons,
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

  // Normalize expression (remove extra spaces)
  const normalized = damageExpr.trim();
  // Split on '+' or '-' keeping track of terms
  const terms = normalized.split(/(?=[+-])/).map(t => t.trim()).filter(Boolean);

  const effectiveCrit = isCrit && canCrit;
  const rolledParts: RolledDamagePart[] = [];
  let totalDamage = 0;

  for (const rawTerm of terms) {
    const isNegative = rawTerm.startsWith('-');
    const termClean = rawTerm.replace(/^[+-]\s*/, '').trim();

    // Check if term is a dice expression, e.g., "1d8 slashing" or "2d6 fire" or "1d8"
    const diceMatch = termClean.match(/^(\d+)d(\d+)(?:\s+([a-zA-Z]+))?/i);
    // Check if term is a flat modifier, e.g., "3 slashing" or "3"
    const flatMatch = termClean.match(/^(\d+)(?:\s+([a-zA-Z]+))?$/i);

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

export function convertCharacterEdition(char: CharacterData, targetEdition: RuleEdition): CharacterData {
  if (targetEdition === '3.5e') {
    // Generate 3.5e skills if not already present or converting from 5e
    const currentSkillsByName = new Map(char.skills.map(s => [s.name, s]));
    const new35eSkills: Skill[] = DEFAULT_35E_SKILLS_LIST.map(s => {
      const existing = currentSkillsByName.get(s.name);
      return {
        id: 'sk-35-' + s.name.replace(/\s+/g, '-'),
        name: s.name,
        ability: s.ability,
        proficient: false,
        ranks: existing?.ranks ?? (existing?.proficient ? Math.min(char.level + 3, 4) : 0),
        miscMod: existing?.miscMod ?? 0,
        isClassSkill: existing?.isClassSkill ?? true,
      };
    });

    return {
      ...char,
      edition: '3.5e',
      bab: char.bab ?? char.level,
      fortSaveBase: char.fortSaveBase ?? (Math.floor(char.level / 2) + 2),
      refSaveBase: char.refSaveBase ?? Math.floor(char.level / 3),
      willSaveBase: char.willSaveBase ?? Math.floor(char.level / 3),
      skills: new35eSkills,
    };
  } else {
    // Convert back to 5e, shadowrun, pathfinder, or cthulhu
    const currentSkillsByName = new Map(char.skills.map(s => [s.name, s]));
    const new5eSkills: Skill[] = DEFAULT_SKILLS_LIST.map(s => {
      const existing = currentSkillsByName.get(s.name);
      return {
        id: 'sk-5e-' + s.name.replace(/\s+/g, '-'),
        name: s.name,
        ability: s.ability,
        proficient: existing ? (existing.proficient || (existing.ranks !== undefined && existing.ranks > 0)) : false,
        expertise: existing?.expertise || false,
      };
    });

    const shadowrunData = targetEdition === 'shadowrun' ? (char.shadowrun || {
      bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 4, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 0, res: 0,
      nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 1, notoriety: 0, publicAwareness: 0,
      physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
      qualities: [{ id: 'q-1', name: 'High Pain Tolerance', type: 'Positive', karmaCost: 7, description: 'Ignores first 1 wound penalty.' }],
      cyberware: [],
      srSkills: [],
      vehicles: []
    }) : char.shadowrun;

    return {
      ...char,
      edition: targetEdition,
      skills: new5eSkills,
      shadowrun: shadowrunData
    };
  }
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

