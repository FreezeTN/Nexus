import { EncounterEnvironment } from '../types';

export interface EnvironmentConfig {
  id: EncounterEnvironment;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  rulesBanner: string;
  specialFeaturesNote?: string;
}

export const ENVIRONMENT_CONFIGS: Record<EncounterEnvironment, EnvironmentConfig> = {
  terrestrial: {
    id: 'terrestrial',
    name: 'Standard Ground / Dungeon',
    shortName: 'Terrestrial',
    icon: '🏰',
    color: 'text-stone-300',
    badgeBg: 'bg-stone-800/80',
    badgeBorder: 'border-stone-700',
    badgeText: 'text-stone-300',
    description: 'Standard dry land, surface terrain, or subterranean dungeon complex.',
    rulesBanner: 'Standard combat rules apply.'
  },
  underwater: {
    id: 'underwater',
    name: 'Underwater / Submerged',
    shortName: 'Underwater',
    icon: '🌊',
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/90',
    badgeBorder: 'border-cyan-500/60',
    badgeText: 'text-cyan-300',
    description: 'Fully submerged aquatic domain (Lakes, Deep Ocean, Aboleth Lair).',
    rulesBanner: '🌊 Underwater Rules: Submerged targets automatically have Fire Damage Resistance (damage halved). Melee weapon attacks have disadvantage unless Piercing (Dagger, Spear, Trident, Shortsword) or attacker has a Swim Speed. Suffocation & Air Supply rules in effect.',
    specialFeaturesNote: 'Activates Aboleth Mucous Cloud, Water Elemental Whelm, and Kraken Aquatic Surge traits!'
  },
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic / Extreme Heat',
    icon: '🌋',
    shortName: 'Volcanic',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/90',
    badgeBorder: 'border-amber-500/60',
    badgeText: 'text-amber-300',
    description: 'Magma caverns, molten chambers, or extreme thermal environment.',
    rulesBanner: '🌋 Heat Rules: Thermal heat hazard. Heavy armor wearers face Constitution saves vs Exhaustion after prolonged exposure. Magma hazard zones deal 6d6 Fire damage.',
    specialFeaturesNote: 'Activates Red Dragon Magma Eruptions & Fire Giant Thermal Aura!'
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic / Glacial Cold',
    shortName: 'Arctic',
    icon: '❄️',
    color: 'text-blue-300',
    badgeBg: 'bg-blue-950/90',
    badgeBorder: 'border-blue-500/60',
    badgeText: 'text-blue-200',
    description: 'Sub-zero tundra, glacial ice sheets, or supernatural frost environment.',
    rulesBanner: '❄️ Cold Rules: Slippery ice difficult terrain (DC 10 Acrobatics or fall prone on dash). Extreme cold causes Constitution saves vs Exhaustion without cold weather gear.',
    specialFeaturesNote: 'Freezing hazard terrain & Frost Lair effects active!'
  },
  shadowfell: {
    id: 'shadowfell',
    name: 'Shadowfell / Obscured Fog',
    shortName: 'Shadowfell',
    icon: '🌫️',
    color: 'text-purple-300',
    badgeBg: 'bg-purple-950/90',
    badgeBorder: 'border-purple-500/60',
    badgeText: 'text-purple-300',
    description: 'Pitch darkness, heavily obscured fog, or realm of shadows.',
    rulesBanner: '🌫️ Obscured Rules: Heavily obscured environment. Vision-based Perception checks fail automatically; ranged attacks at unseen targets have disadvantage; advantage on Stealth checks.',
    specialFeaturesNote: 'Grants advantage on Stealth checks to shadowy creatures.'
  },
  aerial: {
    id: 'aerial',
    name: 'High Altitude / Airborne',
    shortName: 'Aerial',
    icon: '🦅',
    color: 'text-sky-300',
    badgeBg: 'bg-sky-950/90',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',
    description: 'Sky battle, floating island, or aerial cloud platform.',
    rulesBanner: '🦅 Air Combat: Non-flying creatures fall immediately. Knocking airborne creatures prone causes falling damage (1d6 per 10 ft) and lands them on lower ground.',
    specialFeaturesNote: 'Empowers airborne creatures like Dragons, Wyverns & Air Elementals.'
  },
  lair_active: {
    id: 'lair_active',
    name: 'Boss Lair (Lair Actions Engaged)',
    shortName: 'Boss Lair',
    icon: '👑',
    color: 'text-yellow-300',
    badgeBg: 'bg-yellow-950/90',
    badgeBorder: 'border-yellow-500/60',
    badgeText: 'text-yellow-300',
    description: 'Ancient lair of a legendary boss creature.',
    rulesBanner: '👑 Lair Rules: Boss Lair Actions trigger at Initiative Count 20 on each round!',
    specialFeaturesNote: 'Unlocks boss Lair Action triggers for Aboleth, Lich, Red Dragon, and Mummy Lord.'
  }
};

export interface EnvironmentalTraitStatus {
  isEnvironmental: boolean;
  isActive: boolean;
  requiredEnvironment?: EncounterEnvironment;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  actionText?: string;
  dc?: number;
  saveType?: string;
  effectDescription?: string;
}

/**
 * Evaluates whether a given feature or trait is tied to environment/location and if it is currently active.
 */
export function getEnvironmentalTraitStatus(
  featureName: string,
  featureDescription: string,
  currentEnv: EncounterEnvironment
): EnvironmentalTraitStatus {
  const nameLower = (featureName || '').toLowerCase();
  const descLower = (featureDescription || '').toLowerCase();

  // 1. ABOLETH MUCOUS CLOUD
  if (nameLower.includes('mucous cloud') || descLower.includes('under water, surrounded by mucous cloud')) {
    const isActive = currentEnv === 'underwater';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'underwater',
      badgeLabel: isActive ? '🌊 Active Underwater' : '❌ Inactive (Requires Underwater)',
      badgeBg: isActive ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-cyan-300' : 'text-stone-500',
      actionText: 'Trigger Mucous Cloud Disease Save',
      dc: 14,
      saveType: 'CON',
      effectDescription: 'Creature within 10 ft underwater must succeed on DC 14 CON Save or become diseased (unable to breathe outside water for 1d4 hours).'
    };
  }

  // 2. KOBOLD LIGHT SENSITIVITY
  if (nameLower.includes('light sensitivity') || descLower.includes('bright sunlight')) {
    const isActive = currentEnv === 'terrestrial';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'terrestrial',
      badgeLabel: isActive ? '☀️ Active Sunlight Disadvantage' : '🌙 Inactive (Dim/Shadows)',
      badgeBg: isActive ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-amber-300' : 'text-stone-500',
      actionText: 'Light Sensitivity Disadvantage Penalty',
      effectDescription: 'Disadvantage on attack rolls and Perception checks relying on sight in direct sunlight.'
    };
  }

  // 3. WATER ELEMENTAL / KRAKEN WHELM & WATER FORM
  if (nameLower.includes('whelm') || nameLower.includes('water form') || descLower.includes('enter a hostile creature\'s space')) {
    const isActive = currentEnv === 'underwater';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'underwater',
      badgeLabel: isActive ? '🌊 Empowered Aquatic Domain' : '⚡ Standard Form',
      badgeBg: isActive ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-stone-900 border-stone-800 text-stone-400',
      badgeText: isActive ? 'text-cyan-300' : 'text-stone-400',
      actionText: 'Trigger Aquatic Whelm Surge',
      dc: 15,
      saveType: 'STR',
      effectDescription: 'Creatures in space must succeed on DC 15 STR Save or be engulfed and grappled/restrained.'
    };
  }

  // 4. VOLCANIC LAIR / MAGMA HAZARD
  if (nameLower.includes('volcanic') || nameLower.includes('magma') || descLower.includes('magma erupts')) {
    const isActive = currentEnv === 'volcanic' || currentEnv === 'lair_active';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'volcanic',
      badgeLabel: isActive ? '🌋 Volcanic Lair Hazard Active' : '❌ Lair Inactive',
      badgeBg: isActive ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-amber-300' : 'text-stone-500',
      actionText: 'Trigger Magma Eruption (6d6 Fire)',
      dc: 15,
      saveType: 'DEX',
      effectDescription: 'Point on ground erupts in magma: DC 15 DEX save or 6d6 Fire damage (half on save).'
    };
  }

  // 5. GELATINOUS CUBE TRANSPARENT
  if (nameLower.includes('transparent') || descLower.includes('motionless cube')) {
    const isActive = currentEnv === 'terrestrial' || currentEnv === 'shadowfell';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'terrestrial',
      badgeLabel: isActive ? '🌫️ Concealed Object (DC 15 Perception)' : '👁️ Visible',
      badgeBg: 'bg-emerald-950 border-emerald-500 text-emerald-200',
      badgeText: 'text-emerald-300',
      effectDescription: 'DC 15 Wisdom (Perception) check required to spot an unmoving cube.'
    };
  }

  return {
    isEnvironmental: false,
    isActive: true,
    badgeLabel: '',
    badgeBg: '',
    badgeText: ''
  };
}

/**
 * Checks if underwater attack rolls suffer disadvantage based on D&D 5e underwater combat rules.
 */
export function isUnderwaterAttackDisadvantaged(
  damageType: string,
  rangeStr: string,
  hasSwimSpeed: boolean = false
): boolean {
  if (hasSwimSpeed) return false;

  const typeLower = (damageType || '').toLowerCase();
  const rangeLower = (rangeStr || '').toLowerCase();

  // Ranged weapon attacks automatically fail beyond normal range or have disadvantage within normal range
  if (rangeLower.includes('ranged') || rangeLower.includes('ft') && !rangeLower.includes('melee')) {
    return true;
  }

  // Melee attacks have disadvantage unless piercing (Dagger, Spear, Trident, Shortsword)
  if (!typeLower.includes('piercing')) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------------
// 1. MASSIVE DAMAGE INSTANT DEATH (3.5e PHB p. 145)
// ---------------------------------------------------------------------------------
export interface MassiveDamageCheckResult {
  damage: number;
  threshold: number; // 50
  requiresSave: boolean;
  dc: number; // 15
  saveType: 'Fortitude';
  rolledD20: number;
  fortitudeBonus: number;
  totalSave: number;
  passed: boolean;
  isInstantDeath: boolean;
  message: string;
}

export function evaluateMassiveDamage(
  damage: number,
  fortitudeBonus: number = 0,
  customD20?: number,
  threshold: number = 50,
  dc: number = 15
): MassiveDamageCheckResult {
  const requiresSave = damage >= threshold;
  if (!requiresSave) {
    return {
      damage,
      threshold,
      requiresSave: false,
      dc,
      saveType: 'Fortitude',
      rolledD20: 0,
      fortitudeBonus,
      totalSave: 0,
      passed: true,
      isInstantDeath: false,
      message: `Damage (${damage}) is below Massive Damage threshold (${threshold} HP). No Fortitude save needed.`
    };
  }

  const rolledD20 = customD20 !== undefined ? customD20 : Math.floor(Math.random() * 20) + 1;
  const isNat20 = rolledD20 === 20;
  const isNat1 = rolledD20 === 1;
  const totalSave = rolledD20 + fortitudeBonus;
  const passed = isNat20 || (!isNat1 && totalSave >= dc);
  const isInstantDeath = !passed;

  const outcomeText = passed
    ? `SURVIVED! (Rolled ${rolledD20} + ${fortitudeBonus} = ${totalSave} vs DC ${dc}) - Withstood massive trauma.`
    : `FAILED! (Rolled ${rolledD20} + ${fortitudeBonus} = ${totalSave} vs DC ${dc}) - INSTANT DEATH on the spot! (Drops to -10 HP / Dead)`;

  return {
    damage,
    threshold,
    requiresSave: true,
    dc,
    saveType: 'Fortitude',
    rolledD20,
    fortitudeBonus,
    totalSave,
    passed,
    isInstantDeath,
    message: `💀 Massive Damage (3.5e PHB p. 145): Took ${damage} HP in a single hit! DC ${dc} Fortitude Save: ${outcomeText}`
  };
}

// ---------------------------------------------------------------------------------
// 2. FALLING DAMAGE CALCULATION (1d6 per 10 ft up to 20d6, 3.5e DC 15 Tumble/Jump)
// ---------------------------------------------------------------------------------
export interface FallingDamageParams {
  distanceFeet: number;
  is35e?: boolean;
  tumbleOrJumpPassed?: boolean; // DC 15 Tumble/Jump check negates the first 10 ft
  surface?: 'hard' | 'water' | 'yielding'; // water: first 20 ft free, next 20 ft nonlethal (3.5e DMG p. 303 / 5e DMG p. 273)
}

export interface FallingDamageResult {
  originalDistanceFeet: number;
  effectiveDistanceFeet: number;
  diceCount: number; // 1d6 per 10 ft up to 20d6
  tumbleNegatedFeet: number;
  waterNegatedFeet: number;
  rolls: number[];
  totalDamage: number;
  lethalDamage: number;
  nonlethalDamage: number;
  landsProne: boolean;
  summary: string;
  ruleCitation: string;
}

export function calculateFallingDamage(params: FallingDamageParams): FallingDamageResult {
  const {
    distanceFeet,
    is35e = true,
    tumbleOrJumpPassed = false,
    surface = 'hard'
  } = params;

  let remainingFeet = Math.max(0, distanceFeet);
  let tumbleNegatedFeet = 0;
  let waterNegatedFeet = 0;

  // 3.5e DC 15 Jump or Tumble check negates first 10 feet
  if (is35e && tumbleOrJumpPassed && remainingFeet >= 10) {
    tumbleNegatedFeet = 10;
    remainingFeet -= 10;
  }

  // Water / Soft Yielding surface rules
  let lethalDice = 0;
  let nonlethalDice = 0;

  if (surface === 'water') {
    // Falling into water: first 20 ft deal no damage (if deep enough). Next 20 ft deal 1d6 nonlethal per 10 ft. Remainder deals normal lethal damage.
    const freeFeet = Math.min(remainingFeet, 20);
    waterNegatedFeet = freeFeet;
    remainingFeet -= freeFeet;

    const nonlethalFeet = Math.min(remainingFeet, 20);
    nonlethalDice = Math.floor(nonlethalFeet / 10);
    remainingFeet -= nonlethalFeet;

    lethalDice = Math.floor(remainingFeet / 10);
  } else if (surface === 'yielding') {
    // Haystack, soft mud, deep snow: first 10 ft nonlethal, remainder lethal
    const nonlethalFeet = Math.min(remainingFeet, 10);
    nonlethalDice = Math.floor(nonlethalFeet / 10);
    remainingFeet -= nonlethalFeet;

    lethalDice = Math.floor(remainingFeet / 10);
  } else {
    // Standard hard ground: all lethal
    lethalDice = Math.floor(remainingFeet / 10);
  }

  // Cap total dice at 20d6 (terminal velocity)
  const totalDiceUncapped = lethalDice + nonlethalDice;
  const totalDice = Math.min(20, totalDiceUncapped);
  if (totalDiceUncapped > 20) {
    if (nonlethalDice > 0 && lethalDice >= 20) {
      nonlethalDice = 0;
      lethalDice = 20;
    } else {
      lethalDice = Math.min(20, lethalDice);
    }
  }

  // Roll the dice
  const rolls: number[] = [];
  let lethalTotal = 0;
  let nonlethalTotal = 0;

  for (let i = 0; i < lethalDice; i++) {
    const r = Math.floor(Math.random() * 6) + 1;
    rolls.push(r);
    lethalTotal += r;
  }
  for (let i = 0; i < nonlethalDice; i++) {
    const r = Math.floor(Math.random() * 6) + 1;
    rolls.push(r);
    nonlethalTotal += r;
  }

  const totalDamage = lethalTotal + nonlethalTotal;
  const effectiveDistanceFeet = totalDice * 10;
  // If creature takes damage, it lands prone
  const landsProne = totalDamage > 0;

  const parts: string[] = [];
  if (tumbleNegatedFeet > 0) parts.push(`DC 15 Tumble/Jump negated 10 ft (-1d6)`);
  if (waterNegatedFeet > 0) parts.push(`Deep water entry negated 20 ft`);
  if (nonlethalTotal > 0) parts.push(`${nonlethalTotal} nonlethal`);
  if (lethalTotal > 0) parts.push(`${lethalTotal} lethal`);

  const summary = totalDamage === 0
    ? `Fell ${distanceFeet} ft: Negated! Took 0 damage and landed safely on feet.`
    : `Fell ${distanceFeet} ft (${totalDice}d6${totalDice === 20 ? ' Terminal Max' : ''}): [${rolls.join(', ')}] = ${totalDamage} total damage (${parts.join(', ')}). Creature lands prone.`;

  const ruleCitation = is35e
    ? '3.5e PHB p. 145 & DMG p. 303: 1d6 per 10 ft (max 20d6). DC 15 Tumble/Jump check treats fall as 10 ft shorter.'
    : '5e PHB p. 183: 1d6 bludgeoning damage for every 10 ft fallen (max 20d6). Creature lands prone unless it avoids damage.';

  return {
    originalDistanceFeet: distanceFeet,
    effectiveDistanceFeet,
    diceCount: totalDice,
    tumbleNegatedFeet,
    waterNegatedFeet,
    rolls,
    totalDamage,
    lethalDamage: lethalTotal,
    nonlethalDamage: nonlethalTotal,
    landsProne,
    summary,
    ruleCitation
  };
}

// ---------------------------------------------------------------------------------
// 3. UNDERWATER COMBAT MODIFIERS (5e PHB p. 198 / 3.5e DMG p. 92)
// ---------------------------------------------------------------------------------
export interface UnderwaterCombatEvaluation {
  isUnderwater: boolean;
  hasSwimSpeed: boolean;
  hasFreedomOfMovement: boolean;
  isPiercing: boolean;
  damageType: string;
  isMelee: boolean;
  isRanged: boolean;
  edition: '3.5e' | '5e';
  // 5e outcomes
  hasDisadvantage: boolean;
  // 3.5e outcomes
  attackModifier: number; // -2 for slashing/bludgeoning without swim speed (3.5e DMG p. 92)
  damageMultiplier: number; // 0.5 (half damage) for slashing/bludgeoning without swim speed (3.5e DMG p. 92)
  fireDamageHalved: boolean; // Fire resistance underwater (both editions)
  autoMissRangedBeyondNormal: boolean;
  summary: string;
  citation: string;
}

export function evaluateUnderwaterCombatModifiers(params: {
  damageType: string;
  rangeStr?: string;
  weaponName?: string;
  hasSwimSpeed?: boolean;
  hasFreedomOfMovement?: boolean;
  edition?: '3.5e' | '5e';
}): UnderwaterCombatEvaluation {
  const {
    damageType,
    rangeStr = 'Melee',
    weaponName = '',
    hasSwimSpeed = false,
    hasFreedomOfMovement = false,
    edition = '3.5e'
  } = params;

  const typeLower = (damageType || '').toLowerCase();
  const rangeLower = (rangeStr || '').toLowerCase();
  const nameLower = (weaponName || '').toLowerCase();

  const isRanged = rangeLower.includes('ranged') || (rangeLower.includes('ft') && !rangeLower.includes('melee'));
  const isMelee = !isRanged;

  // Specific piercing weapons that function cleanly underwater:
  // Dagger, Shortsword, Rapier, Spear, Trident, Javelin, Dart, Pick, Crossbow
  const isPiercing = typeLower.includes('piercing') ||
    nameLower.includes('dagger') ||
    nameLower.includes('shortsword') ||
    nameLower.includes('spear') ||
    nameLower.includes('trident') ||
    nameLower.includes('javelin') ||
    nameLower.includes('dart') ||
    nameLower.includes('rapier') ||
    nameLower.includes('pick') ||
    nameLower.includes('crossbow');

  const isCrossbowOrNet = nameLower.includes('crossbow') || nameLower.includes('net') || nameLower.includes('dart');

  // Submerged targets automatically resist Fire damage (halved)
  const fireDamageHalved = typeLower.includes('fire');

  // Freedom of movement completely negates all underwater penalties
  if (hasFreedomOfMovement) {
    return {
      isUnderwater: true,
      hasSwimSpeed: true,
      hasFreedomOfMovement: true,
      isPiercing,
      damageType,
      isMelee,
      isRanged,
      edition,
      hasDisadvantage: false,
      attackModifier: 0,
      damageMultiplier: 1.0,
      fireDamageHalved,
      autoMissRangedBeyondNormal: false,
      summary: 'Freedom of Movement active: All underwater penalties negated. Full attack and damage!',
      citation: 'Freedom of Movement spell / trait ignores aquatic movement and attack restrictions.'
    };
  }

  // If attacker has a natural or magical swim speed
  if (hasSwimSpeed) {
    return {
      isUnderwater: true,
      hasSwimSpeed: true,
      hasFreedomOfMovement: false,
      isPiercing,
      damageType,
      isMelee,
      isRanged,
      edition,
      hasDisadvantage: false,
      attackModifier: 0,
      damageMultiplier: 1.0,
      fireDamageHalved,
      autoMissRangedBeyondNormal: isRanged && !isCrossbowOrNet,
      summary: 'Natural Swim Speed: Melee attacks suffer no penalty. (Ranged attacks still restricted beyond normal range).',
      citation: edition === '5e' ? '5e PHB p. 198: Swim speed removes melee disadvantage.' : '3.5e DMG p. 92: Swim speed allows full melee attack and damage.'
    };
  }

  // Attacker has NO swim speed:
  if (isMelee) {
    if (isPiercing) {
      return {
        isUnderwater: true,
        hasSwimSpeed: false,
        hasFreedomOfMovement: false,
        isPiercing: true,
        damageType,
        isMelee: true,
        isRanged: false,
        edition,
        hasDisadvantage: false,
        attackModifier: 0,
        damageMultiplier: 1.0,
        fireDamageHalved,
        autoMissRangedBeyondNormal: false,
        summary: 'Piercing Weapon (Trident/Spear/Dagger): Attacks normally underwater with full damage even without swim speed.',
        citation: edition === '5e' ? '5e PHB p. 198: Dagger, javelin, shortsword, spear, or trident attacks normally.' : '3.5e DMG p. 92: Piercing weapons attack without penalty.'
      };
    } else {
      // Slashing or Bludgeoning weapon without swim speed
      const hasDisadvantage = edition === '5e';
      const attackModifier = edition === '3.5e' ? -2 : 0;
      const damageMultiplier = edition === '3.5e' ? 0.5 : 1.0;

      return {
        isUnderwater: true,
        hasSwimSpeed: false,
        hasFreedomOfMovement: false,
        isPiercing: false,
        damageType,
        isMelee: true,
        isRanged: false,
        edition,
        hasDisadvantage,
        attackModifier,
        damageMultiplier,
        fireDamageHalved,
        autoMissRangedBeyondNormal: false,
        summary: edition === '5e'
          ? 'Slashing/Bludgeoning without Swim Speed: Attack has Disadvantage!'
          : 'Slashing/Bludgeoning without Swim Speed: -2 Attack penalty AND Half Damage (50%)!',
        citation: edition === '5e'
          ? '5e PHB p. 198: Melee weapon attack has disadvantage unless piercing or swim speed.'
          : '3.5e DMG p. 92 (Table 3-22): Slashing/Bludgeoning weapons suffer -2 attack and deal half damage.'
      };
    }
  } else {
    // Ranged attack underwater
    const hasDisadvantage = true;
    const attackModifier = edition === '3.5e' ? -2 : 0;

    return {
      isUnderwater: true,
      hasSwimSpeed: false,
      hasFreedomOfMovement: false,
      isPiercing,
      damageType,
      isMelee: false,
      isRanged: true,
      edition,
      hasDisadvantage,
      attackModifier,
      damageMultiplier: 1.0,
      fireDamageHalved,
      autoMissRangedBeyondNormal: true,
      summary: isCrossbowOrNet
        ? 'Crossbow/Net/Dart: Functions normally within normal range, but automatically misses beyond normal range.'
        : 'Ranged Weapon: Disadvantage on attack rolls within normal range; automatically misses beyond normal range.',
      citation: edition === '5e'
        ? '5e PHB p. 198: Ranged weapon attack misses beyond normal range; disadvantage within normal range.'
        : '3.5e DMG p. 92: Ranged weapons take -2 attack per 5 ft and miss beyond normal range.'
    };
  }
}

// ---------------------------------------------------------------------------------
// 4. SUFFOCATION & DROWNING (3.5e DMG p. 304 / 5e PHB p. 183)
// ---------------------------------------------------------------------------------
export interface SuffocationStateParams {
  edition?: '3.5e' | '5e';
  conScore: number;
  conMod: number;
  isTakingHeavyAction?: boolean; // In 3.5e, heavy activity halves max breath duration
  roundsElapsed: number;
  failedCheckCount?: number;
}

export interface SuffocationStateResult {
  edition: '3.5e' | '5e';
  maxRoundsHoldingBreath: number;
  maxMinutesHoldingBreath: number;
  roundsElapsed: number;
  isHoldingBreath: boolean;
  requiresSaveThisRound: boolean;
  saveDC: number;
  status: 'holding' | 'checking' | 'choking' | 'unconscious' | 'dying' | 'dead';
  description: string;
  citation: string;
}

export function calculateSuffocationState(params: SuffocationStateParams): SuffocationStateResult {
  const {
    edition = '3.5e',
    conScore = 10,
    conMod = 0,
    isTakingHeavyAction = false,
    roundsElapsed = 0,
    failedCheckCount = 0
  } = params;

  if (edition === '3.5e') {
    const baseRounds = Math.max(1, conScore * 2);
    const maxHoldRounds = isTakingHeavyAction ? Math.max(1, Math.floor(baseRounds / 2)) : baseRounds;

    if (roundsElapsed <= maxHoldRounds && failedCheckCount === 0) {
      return {
        edition: '3.5e',
        maxRoundsHoldingBreath: maxHoldRounds,
        maxMinutesHoldingBreath: Number((maxHoldRounds * 6 / 60).toFixed(1)),
        roundsElapsed,
        isHoldingBreath: true,
        requiresSaveThisRound: false,
        saveDC: 10,
        status: 'holding',
        description: `Holding breath safely (${roundsElapsed}/${maxHoldRounds} rounds, ~${roundsElapsed * 6}s). No save needed yet.`,
        citation: '3.5e DMG p. 304: Can hold breath for 2x CON score rounds (halved if taking standard/move actions).'
      };
    }

    const checkRounds = Math.max(1, roundsElapsed - maxHoldRounds);
    const saveDC = 10 + Math.max(0, checkRounds - 1);

    if (failedCheckCount === 0) {
      return {
        edition: '3.5e',
        maxRoundsHoldingBreath: maxHoldRounds,
        maxMinutesHoldingBreath: Number((maxHoldRounds * 6 / 60).toFixed(1)),
        roundsElapsed,
        isHoldingBreath: false,
        requiresSaveThisRound: true,
        saveDC,
        status: 'checking',
        description: `Breath exhausted! DC ${saveDC} Constitution check required this round (+1 DC per previous round) to avoid suffocating.`,
        citation: '3.5e DMG p. 304: DC 10 Constitution check +1 per round after breath duration expires.'
      };
    } else if (failedCheckCount === 1) {
      return {
        edition: '3.5e',
        maxRoundsHoldingBreath: maxHoldRounds,
        maxMinutesHoldingBreath: Number((maxHoldRounds * 6 / 60).toFixed(1)),
        roundsElapsed,
        isHoldingBreath: false,
        requiresSaveThisRound: false,
        saveDC,
        status: 'unconscious',
        description: 'Failed Constitution check: Drops immediately to 0 HP and falls unconscious from lack of oxygen!',
        citation: '3.5e DMG p. 304: First failed check reduces creature to 0 HP and unconscious.'
      };
    } else if (failedCheckCount === 2) {
      return {
        edition: '3.5e',
        maxRoundsHoldingBreath: maxHoldRounds,
        maxMinutesHoldingBreath: Number((maxHoldRounds * 6 / 60).toFixed(1)),
        roundsElapsed,
        isHoldingBreath: false,
        requiresSaveThisRound: false,
        saveDC,
        status: 'dying',
        description: 'Second round without oxygen: Drops to -1 HP and is actively dying!',
        citation: '3.5e DMG p. 304: Second round without air reduces creature to -1 HP and dying.'
      };
    } else {
      return {
        edition: '3.5e',
        maxRoundsHoldingBreath: maxHoldRounds,
        maxMinutesHoldingBreath: Number((maxHoldRounds * 6 / 60).toFixed(1)),
        roundsElapsed,
        isHoldingBreath: false,
        requiresSaveThisRound: false,
        saveDC,
        status: 'dead',
        description: 'Third round without oxygen: Creature suffocates completely and dies (-10 HP)!',
        citation: '3.5e DMG p. 304: Third round without air results in death (-10 HP).'
      };
    }
  } else {
    // 5e
    const holdMinutes = Math.max(0.5, 1 + conMod);
    const holdRounds = Math.round(holdMinutes * 10);
    const graceRounds = Math.max(1, conMod);

    if (roundsElapsed <= holdRounds && failedCheckCount === 0) {
      return {
        edition: '5e',
        maxRoundsHoldingBreath: holdRounds,
        maxMinutesHoldingBreath: holdMinutes,
        roundsElapsed,
        isHoldingBreath: true,
        requiresSaveThisRound: false,
        saveDC: 10,
        status: 'holding',
        description: `Holding breath safely (${roundsElapsed}/${holdRounds} rounds, ~${holdMinutes} min).`,
        citation: '5e PHB p. 183: Creature can hold breath for 1 + CON modifier minutes (min 30 seconds).'
      };
    }

    const chokingRounds = roundsElapsed - holdRounds;
    if (chokingRounds <= graceRounds && failedCheckCount === 0) {
      return {
        edition: '5e',
        maxRoundsHoldingBreath: holdRounds,
        maxMinutesHoldingBreath: holdMinutes,
        roundsElapsed,
        isHoldingBreath: false,
        requiresSaveThisRound: false,
        saveDC: 10,
        status: 'choking',
        description: `Breath expired! Surviving for ${chokingRounds}/${graceRounds} rounds of grace. Next round drops to 0 HP and dying!`,
        citation: '5e PHB p. 183: When out of breath, survives for CON modifier rounds (min 1 round).'
      };
    }

    return {
      edition: '5e',
      maxRoundsHoldingBreath: holdRounds,
      maxMinutesHoldingBreath: holdMinutes,
      roundsElapsed,
      isHoldingBreath: false,
      requiresSaveThisRound: false,
      saveDC: 10,
      status: 'dying',
      description: 'Suffocating: Creature drops to 0 HP, is dying, and cannot regain HP or stabilize until it can breathe!',
      citation: '5e PHB p. 183: Drops to 0 HP and dying. Cannot regain HP or be stabilized until breathing.'
    };
  }
}

// ---------------------------------------------------------------------------------
// 5. EXTREME TEMPERATURE & EXPOSURE (3.5e DMG p. 302 / 5e DMG p. 110)
// ---------------------------------------------------------------------------------
export interface ExposureCheckParams {
  edition?: '3.5e' | '5e';
  hazardType: 'extreme_cold' | 'severe_cold' | 'extreme_heat' | 'severe_heat' | 'thirst' | 'starvation';
  checksElapsed: number; // number of checks made so far
  hasProtection?: boolean; // Cold Weather Outfit (+5 in 3.5e, immune in 5e) or Desert Robes
  wearingHeavyArmor?: boolean; // -4 penalty in 3.5e heat, disadvantage in 5e
}

export interface ExposureCheckResult {
  hazardName: string;
  dc: number;
  intervalDesc: string;
  damageOrPenalty: string;
  saveType: 'Fortitude' | 'Constitution';
  modifierAdjustment: number;
  hasDisadvantage: boolean;
  citation: string;
  summary: string;
}

export function evaluateExposureHazard(params: ExposureCheckParams): ExposureCheckResult {
  const {
    edition = '3.5e',
    hazardType,
    checksElapsed,
    hasProtection = false,
    wearingHeavyArmor = false
  } = params;

  if (hazardType === 'extreme_cold' || hazardType === 'severe_cold') {
    const isSevere = hazardType === 'severe_cold';
    if (edition === '3.5e') {
      const baseDC = 15;
      const dc = baseDC + checksElapsed;
      const modAdjustment = hasProtection ? 5 : 0;
      return {
        hazardName: isSevere ? 'Severe Cold (< 0°F)' : 'Extreme Cold (< 40°F)',
        dc,
        intervalDesc: isSevere ? 'Every 10 minutes' : 'Every 1 hour',
        damageOrPenalty: '1d6 nonlethal damage',
        saveType: 'Fortitude',
        modifierAdjustment: modAdjustment,
        hasDisadvantage: false,
        citation: '3.5e DMG p. 302: DC 15 Fort save (+1/check) or 1d6 nonlethal. Cold weather outfit gives +5 circumstance bonus.',
        summary: `Fortitude Save DC ${dc} required ${isSevere ? 'every 10 minutes' : 'every hour'}. On failure, take 1d6 nonlethal damage.`
      };
    } else {
      return {
        hazardName: 'Extreme Cold (0°F or lower)',
        dc: 10,
        intervalDesc: 'At the end of each hour',
        damageOrPenalty: hasProtection ? 'Immune (Cold Weather Gear)' : '+1 Level of Exhaustion',
        saveType: 'Constitution',
        modifierAdjustment: 0,
        hasDisadvantage: false,
        citation: '5e DMG p. 110: DC 10 Con save each hour or gain 1 level of exhaustion. Cold weather gear grants immunity.',
        summary: hasProtection
          ? 'Cold Weather Gear: Creature is immune to extreme cold exposure saves.'
          : 'DC 10 Constitution save required at the end of each hour. On failure, gain 1 level of exhaustion.'
      };
    }
  }

  if (hazardType === 'extreme_heat' || hazardType === 'severe_heat') {
    const isSevere = hazardType === 'severe_heat';
    if (edition === '3.5e') {
      const baseDC = 15;
      const dc = baseDC + checksElapsed;
      const penalty = (wearingHeavyArmor ? -4 : 0);
      return {
        hazardName: isSevere ? 'Severe Heat (> 110°F)' : 'Extreme Heat (> 90°F)',
        dc,
        intervalDesc: isSevere ? 'Every 10 minutes' : 'Every 1 hour',
        damageOrPenalty: '1d4 nonlethal damage',
        saveType: 'Fortitude',
        modifierAdjustment: penalty,
        hasDisadvantage: false,
        citation: '3.5e DMG p. 303: DC 15 Fort save (+1/check) or 1d4 nonlethal. Armor/heavy clothes gives -4 penalty.',
        summary: `Fortitude Save DC ${dc} required ${isSevere ? 'every 10 minutes' : 'every hour'}. On failure, take 1d4 nonlethal damage.`
      };
    } else {
      const dc = 10 + checksElapsed;
      return {
        hazardName: 'Extreme Heat (100°F or higher)',
        dc,
        intervalDesc: 'At the end of each hour (DC +1 per hour)',
        damageOrPenalty: '+1 Level of Exhaustion',
        saveType: 'Constitution',
        modifierAdjustment: 0,
        hasDisadvantage: wearingHeavyArmor,
        citation: '5e DMG p. 110: DC 10 Con save each hour (+1 DC per hour) or gain 1 exhaustion. Disadvantage in medium/heavy armor.',
        summary: `DC ${dc} Constitution save required at the end of each hour. On failure, gain 1 level of exhaustion.${wearingHeavyArmor ? ' (Disadvantage due to armor).' : ''}`
      };
    }
  }

  if (hazardType === 'thirst') {
    return {
      hazardName: 'Dehydration / Lack of Water',
      dc: 20 + checksElapsed,
      intervalDesc: 'Every hour after 1st day without water',
      damageOrPenalty: '1d6 nonlethal damage',
      saveType: edition === '3.5e' ? 'Fortitude' : 'Constitution',
      modifierAdjustment: 0,
      hasDisadvantage: false,
      citation: '3.5e DMG p. 304 / 5e DMG p. 111: Requires 1 gal/day. Fort save DC 20 (+1/hour) or 1d6 nonlethal damage.',
      summary: `Fortitude Save DC ${20 + checksElapsed} required every hour after 1 day without water. Failure deals 1d6 nonlethal damage.`
    };
  }

  // Starvation
  return {
    hazardName: 'Starvation / Lack of Food',
    dc: 10 + checksElapsed,
    intervalDesc: 'Every 24 hours after 3 days without food',
    damageOrPenalty: '1d6 nonlethal damage',
    saveType: edition === '3.5e' ? 'Fortitude' : 'Constitution',
    modifierAdjustment: 0,
    hasDisadvantage: false,
    citation: '3.5e DMG p. 304 / 5e DMG p. 111: Creature can go 3 days without food. Afterward, DC 10 save (+1/day) or 1d6 nonlethal.',
    summary: `Fortitude Save DC ${10 + checksElapsed} required once per day after 3 days without food. Failure deals 1d6 nonlethal damage.`
  };
}
