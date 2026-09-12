import { CharacterData, AbilityName } from '../types';
import { getEffectiveAbilities, getAbilityModifier, formatModifier } from '../systems/dnd5e/abilities';
import { get35eArmorClass } from './calculators/dnd35eCalculators';
import { get35eSaveBreakdown } from './dndCalculations';

// ============================================================================
// 1. NEGATIVE LEVELS & ENERGY DRAIN ENGINE (D&D 3.5e RAW DMG p. 293 / SRD)
// ============================================================================

export interface NegativeLevelPenalties {
  levelCount: number;
  attackPenalty: number;
  savingThrowPenalty: number;
  skillCheckPenalty: number;
  abilityCheckPenalty: number;
  effectiveLevelPenalty: number;
  maxHpLoss: number;
  isDead: boolean;
}

export function calculate35eNegativeLevelPenalties(char: CharacterData): NegativeLevelPenalties {
  const count = Math.max(0, char.negativeLevels || 0);
  const characterLevel = Math.max(1, char.level || 1);
  return {
    levelCount: count,
    attackPenalty: -count,
    savingThrowPenalty: -count,
    skillCheckPenalty: -count,
    abilityCheckPenalty: -count,
    effectiveLevelPenalty: -count,
    maxHpLoss: count * 5,
    isDead: count >= characterLevel
  };
}

export function roll35eFortitudeRecoveryCheck(
  char: CharacterData,
  dc: number
): {
  d20: number;
  fortBonus: number;
  total: number;
  dc: number;
  passed: boolean;
  message: string;
} {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const fortBonus = get35eSaveBreakdown(char, 'fort').total;
  const total = d20 + fortBonus;
  const passed = total >= dc;

  return {
    d20,
    fortBonus,
    total,
    dc,
    passed,
    message: passed
      ? `24-Hour Recovery Success! Rolled ${d20} + ${fortBonus} = ${total} vs DC ${dc}. Negative level safely expelled!`
      : `24-Hour Recovery Failed! Rolled ${d20} + ${fortBonus} = ${total} vs DC ${dc}. Energy drain becomes permanent (1 level lost)!`
  };
}

// ============================================================================
// 2. CONCENTRATION & DEFENSIVE CASTING ENGINE (PHB p. 170-171 / SRD)
// ============================================================================

export type ConcentrationDistractionType =
  | 'defensive_casting'
  | 'damaged_during'
  | 'continuous_damage'
  | 'vigorous_motion'
  | 'violent_motion'
  | 'entangled'
  | 'grappled_pinned'
  | 'weather_wind'
  | 'weather_storm';

export interface ConcentrationDCParams {
  type: ConcentrationDistractionType;
  spellLevel: number; // 0 to 9
  damageTaken?: number; // for damage during casting or continuous damage
}

export function calculate35eConcentrationDC(params: ConcentrationDCParams): {
  dc: number;
  formula: string;
  description: string;
} {
  const lvl = Math.max(0, params.spellLevel);
  const dmg = Math.max(0, params.damageTaken || 0);

  switch (params.type) {
    case 'defensive_casting':
      return {
        dc: 15 + lvl,
        formula: `15 + Spell Level (${lvl})`,
        description: 'Cast defensively to avoid provoking Attacks of Opportunity.'
      };
    case 'damaged_during':
      return {
        dc: 10 + dmg + lvl,
        formula: `10 + Damage (${dmg}) + Spell Level (${lvl})`,
        description: 'Struck by damage during the action of casting (e.g. readied action or AoO).'
      };
    case 'continuous_damage':
      const halfDmg = Math.floor(dmg / 2);
      return {
        dc: 10 + halfDmg + lvl,
        formula: `10 + 1/2 Continuous Damage (${halfDmg}) + Spell Level (${lvl})`,
        description: 'Taking ongoing continuous damage (e.g. acid, burning oil, Melf\'s Acid Arrow).'
      };
    case 'vigorous_motion':
      return {
        dc: 10 + lvl,
        formula: `10 + Spell Level (${lvl})`,
        description: 'On a moving mount, rough carriage ride, or small boat in rough water.'
      };
    case 'violent_motion':
      return {
        dc: 15 + lvl,
        formula: `15 + Spell Level (${lvl})`,
        description: 'On a galloping horse, violently pitching ship in a storm, or severe earthquake.'
      };
    case 'entangled':
      return {
        dc: 15 + lvl,
        formula: `15 + Spell Level (${lvl})`,
        description: 'Caught in a net, tanglefoot bag, or Entangle spell.'
      };
    case 'grappled_pinned':
      return {
        dc: 20 + lvl,
        formula: `20 + Spell Level (${lvl})`,
        description: 'Grappling or pinned. Can ONLY cast verbal-only spells without material components.'
      };
    case 'weather_wind':
      return {
        dc: 5 + lvl,
        formula: `5 + Spell Level (${lvl})`,
        description: 'Strong wind blowing or driving sand/sleet.'
      };
    case 'weather_storm':
      return {
        dc: 10 + lvl,
        formula: `10 + Spell Level (${lvl})`,
        description: 'Severe weather with hail, blinding gale, or thunderstorm.'
      };
  }
}

export function get35eConcentrationBonus(char: CharacterData, isCombatCasting = false): {
  total: number;
  conMod: number;
  ranks: number;
  featBonus: number;
  negativeLevelsPenalty: number;
  breakdown: string[];
} {
  const abilities = getEffectiveAbilities(char);
  const conMod = getAbilityModifier(abilities.CON?.score || 10);
  const skill = (char.skills || []).find(s => s.name.toLowerCase() === 'concentration');
  const ranks = skill?.ranks || 0;

  let featBonus = 0;
  const breakdown: string[] = [`CON (${formatModifier(conMod)})`, `Ranks (${ranks})`];

  // Combat Casting feat gives +4 on concentration checks made to cast defensively or while grappled/pinned
  const hasCombatCasting = (char.feats || []).some(f => f.name.toLowerCase().includes('combat casting')) || isCombatCasting;
  if (hasCombatCasting) {
    featBonus += 4;
    breakdown.push('Combat Casting (+4)');
  }

  const negPenalty = char.negativeLevels || 0;
  if (negPenalty > 0) {
    breakdown.push(`Negative Levels (-${negPenalty})`);
  }

  const total = conMod + ranks + featBonus - negPenalty;
  return {
    total,
    conMod,
    ranks,
    featBonus,
    negativeLevelsPenalty: negPenalty,
    breakdown
  };
}

export function roll35eConcentrationCheck(
  char: CharacterData,
  params: ConcentrationDCParams,
  useCombatCasting = false
): {
  d20: number;
  bonus: number;
  total: number;
  dc: number;
  passed: boolean;
  message: string;
} {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const appliesCombatCasting = useCombatCasting || params.type === 'defensive_casting' || params.type === 'grappled_pinned';
  const { total: bonus } = get35eConcentrationBonus(char, appliesCombatCasting);
  const { dc } = calculate35eConcentrationDC(params);
  const total = d20 + bonus;
  const passed = total >= dc;

  return {
    d20,
    bonus,
    total,
    dc,
    passed,
    message: passed
      ? `Concentration Check Passed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Spell maintained & successfully cast!`
      : `Concentration Check Failed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Spell disrupted and spell slot lost!`
  };
}

// ============================================================================
// 3. TUMBLE & ACROBATICS MOVEMENT (D&D 3.5e RAW PHB p. 84 / SRD)
// ============================================================================

export type TumbleTargetObjective = 'threatened_square' | 'through_enemy_space' | 'free_fall';

export function calculate35eTumbleDC(
  objective: TumbleTargetObjective,
  options: { additionalOpponents?: number; acceleratedSpeed?: boolean }
): {
  dc: number;
  formula: string;
  description: string;
} {
  const extra = Math.max(0, options.additionalOpponents || 0);
  const accel = Boolean(options.acceleratedSpeed);

  if (objective === 'free_fall') {
    return {
      dc: 15,
      formula: 'Base DC 15',
      description: 'Treat the fall as 10 feet shorter for purpose of calculating falling damage.'
    };
  }

  const base = objective === 'threatened_square' ? 15 : 25;
  const oppMod = extra * 2;
  const speedMod = accel ? 5 : 0;
  const total = base + oppMod + speedMod;

  const parts = [`Base ${base}`];
  if (oppMod > 0) parts.push(`+${oppMod} (${extra} extra enemies)`);
  if (speedMod > 0) parts.push('+5 (Full Movement Speed)');

  return {
    dc: total,
    formula: parts.join(' '),
    description: objective === 'threatened_square'
      ? 'Tumble through threatened squares without provoking Attacks of Opportunity.'
      : 'Tumble directly through an enemy creature\'s occupied space without provoking.'
  };
}

export function get35eTumbleBonus(char: CharacterData): {
  total: number;
  dexMod: number;
  ranks: number;
  synergyBonus: number;
  acp: number;
  breakdown: string[];
} {
  const abilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const skill = (char.skills || []).find(s => s.name.toLowerCase() === 'tumble');
  const ranks = skill?.ranks || 0;

  // Synergies: Jump (5 ranks) -> +2 Tumble; Balance (5 ranks) -> +2 Tumble
  const jumpRanks = (char.skills || []).find(s => s.name.toLowerCase() === 'jump')?.ranks || 0;
  const balanceRanks = (char.skills || []).find(s => s.name.toLowerCase() === 'balance')?.ranks || 0;

  let synergyBonus = 0;
  const breakdown: string[] = [`DEX (${formatModifier(dexMod)})`, `Ranks (${ranks})`];

  if (jumpRanks >= 5) {
    synergyBonus += 2;
    breakdown.push('Jump Synergy (+2)');
  }
  if (balanceRanks >= 5) {
    synergyBonus += 2;
    breakdown.push('Balance Synergy (+2)');
  }

  // Armor Check Penalty (ACP) applies to Tumble
  let acp = 0;
  const equipped = (char.inventory || []).filter(i => i.equipped && !i.stored);
  for (const item of equipped) {
    if (item.armorCheckPenalty) {
      acp += Math.abs(item.armorCheckPenalty);
    }
  }
  if (acp > 0) {
    breakdown.push(`Armor Check Penalty (-${acp})`);
  }

  const negPenalty = char.negativeLevels || 0;
  if (negPenalty > 0) {
    breakdown.push(`Negative Levels (-${negPenalty})`);
  }

  const total = dexMod + ranks + synergyBonus - acp - negPenalty;
  return {
    total,
    dexMod,
    ranks,
    synergyBonus,
    acp,
    breakdown
  };
}

export function roll35eTumbleCheck(
  char: CharacterData,
  objective: TumbleTargetObjective,
  options: { additionalOpponents?: number; acceleratedSpeed?: boolean }
): {
  d20: number;
  bonus: number;
  total: number;
  dc: number;
  passed: boolean;
  message: string;
} {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const { total: bonus } = get35eTumbleBonus(char);
  const { dc } = calculate35eTumbleDC(objective, options);
  const total = d20 + bonus;
  const passed = total >= dc;

  return {
    d20,
    bonus,
    total,
    dc,
    passed,
    message: passed
      ? `Tumble Check Succeeded! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Safely moved without provoking AoO!`
      : `Tumble Check Failed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Provokes Attacks of Opportunity from threatening foes!`
  };
}

// ============================================================================
// 4. MOUNTED COMBAT & RIDE MANEUVERS (D&D 3.5e RAW PHB p. 80, 98 / SRD)
// ============================================================================

export interface RideManeuverDefinition {
  id: string;
  name: string;
  dc: number;
  action: 'Free' | 'Move' | 'Immediate' | 'None';
  description: string;
}

export const OFFICIAL_35E_RIDE_MANEUVERS: RideManeuverDefinition[] = [
  {
    id: 'guide_knees',
    name: 'Guide with Knees',
    dc: 5,
    action: 'Free',
    description: 'Use both hands in combat (weapons, spells, shield) while controlling the mount.'
  },
  {
    id: 'stay_saddle',
    name: 'Stay in Saddle',
    dc: 5,
    action: 'None',
    description: 'Avoid falling out of the saddle when taking damage or when the mount rears/bucks.'
  },
  {
    id: 'fight_warhorse',
    name: 'Fight with Warhorse',
    dc: 10,
    action: 'Free',
    description: 'Direct your war-trained mount to attack in battle while you also attack.'
  },
  {
    id: 'cover',
    name: 'Cover Behind Mount',
    dc: 15,
    action: 'Immediate',
    description: 'Drop down behind your mount for Cover (+4 AC, +2 Reflex saves). Cannot attack while covering.'
  },
  {
    id: 'leap',
    name: 'Leap Obstacle',
    dc: 15,
    action: 'Move',
    description: 'Urge mount over obstacles (fences, pits, debris) using mount\'s Jump modifier.'
  },
  {
    id: 'fast_mount',
    name: 'Fast Mount or Dismount',
    dc: 20,
    action: 'Free',
    description: 'Mount or dismount as a Free Action instead of a standard Move Action (Armor Check Penalty applies).'
  }
];

export function get35eRideBonus(char: CharacterData): {
  total: number;
  dexMod: number;
  ranks: number;
  animalHandlingSynergy: number;
  acp: number;
  breakdown: string[];
} {
  const abilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(abilities.DEX?.score || 10);
  const skill = (char.skills || []).find(s => s.name.toLowerCase() === 'ride');
  const ranks = skill?.ranks || 0;

  // Synergy: Handle Animal (5 ranks) -> +2 Ride
  const handleAnimalRanks = (char.skills || []).find(s => s.name.toLowerCase() === 'handle animal')?.ranks || 0;
  const animalHandlingSynergy = handleAnimalRanks >= 5 ? 2 : 0;

  const breakdown: string[] = [`DEX (${formatModifier(dexMod)})`, `Ranks (${ranks})`];
  if (animalHandlingSynergy > 0) {
    breakdown.push('Handle Animal Synergy (+2)');
  }

  let acp = 0;
  const equipped = (char.inventory || []).filter(i => i.equipped && !i.stored);
  for (const item of equipped) {
    if (item.armorCheckPenalty) {
      acp += Math.abs(item.armorCheckPenalty);
    }
  }
  if (acp > 0) {
    breakdown.push(`Armor Check Penalty (-${acp})`);
  }

  const negPenalty = char.negativeLevels || 0;
  if (negPenalty > 0) {
    breakdown.push(`Negative Levels (-${negPenalty})`);
  }

  const total = dexMod + ranks + animalHandlingSynergy - acp - negPenalty;
  return {
    total,
    dexMod,
    ranks,
    animalHandlingSynergy,
    acp,
    breakdown
  };
}

export function roll35eMountedCombatHitNegation(
  char: CharacterData,
  incomingAttackRoll: number
): {
  d20: number;
  rideBonus: number;
  total: number;
  incomingAttackRoll: number;
  negated: boolean;
  message: string;
} {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const { total: rideBonus } = get35eRideBonus(char);
  const total = d20 + rideBonus;
  const negated = total >= incomingAttackRoll;

  return {
    d20,
    rideBonus,
    total,
    incomingAttackRoll,
    negated,
    message: negated
      ? `Mounted Combat Success! Rolled ${d20} + ${rideBonus} = ${total} vs Attack Roll ${incomingAttackRoll}. Hit on mount completely negated!`
      : `Mounted Combat Failed! Rolled ${d20} + ${rideBonus} = ${total} vs Attack Roll ${incomingAttackRoll}. Attack strikes mount normally.`
  };
}

// ============================================================================
// 5. WILD SHAPE & POLYMORPH PRESETS (D&D 3.5e RAW MM p. 270-280 / PHB p. 37)
// ============================================================================

export interface WildShapePreset {
  id: string;
  name: string;
  size: 'Small' | 'Medium' | 'Large' | 'Huge';
  druidLevelRequired: number;
  str: number;
  dex: number;
  con: number;
  naturalArmorBonus: number;
  speed: string;
  naturalAttacks: Array<{ name: string; damage: string; attackBonus: number; type: string }>;
  specialAbilities: string[];
}

export const OFFICIAL_35E_WILD_SHAPE_PRESETS: WildShapePreset[] = [
  {
    id: 'wolf',
    name: 'Wolf',
    size: 'Medium',
    druidLevelRequired: 5,
    str: 13,
    dex: 15,
    con: 15,
    naturalArmorBonus: 2,
    speed: '50 ft.',
    naturalAttacks: [{ name: 'Bite', damage: '1d6 + 1', attackBonus: 3, type: 'Piercing' }],
    specialAbilities: ['Trip (Free trip attempt on hit)', 'Scent', 'Low-Light Vision']
  },
  {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    size: 'Large',
    druidLevelRequired: 8,
    str: 25,
    dex: 15,
    con: 17,
    naturalArmorBonus: 3,
    speed: '50 ft.',
    naturalAttacks: [{ name: 'Bite', damage: '1d8 + 10', attackBonus: 10, type: 'Piercing' }],
    specialAbilities: ['Trip (Free trip on bite with +11 bonus)', 'Scent', 'Low-Light Vision']
  },
  {
    id: 'black_bear',
    name: 'Black Bear',
    size: 'Medium',
    druidLevelRequired: 5,
    str: 19,
    dex: 13,
    con: 15,
    naturalArmorBonus: 2,
    speed: '40 ft.',
    naturalAttacks: [
      { name: 'Claw (x2)', damage: '1d4 + 4', attackBonus: 6, type: 'Slashing' },
      { name: 'Bite', damage: '1d6 + 2', attackBonus: 1, type: 'Piercing' }
    ],
    specialAbilities: ['Low-Light Vision', 'Scent']
  },
  {
    id: 'brown_bear',
    name: 'Brown Bear',
    size: 'Large',
    druidLevelRequired: 8,
    str: 27,
    dex: 13,
    con: 19,
    naturalArmorBonus: 5,
    speed: '40 ft.',
    naturalAttacks: [
      { name: 'Claw (x2)', damage: '1d8 + 8', attackBonus: 11, type: 'Slashing' },
      { name: 'Bite', damage: '2d6 + 4', attackBonus: 6, type: 'Piercing' }
    ],
    specialAbilities: ['Improved Grab (Start grapple on hit)', 'Low-Light Vision', 'Scent']
  },
  {
    id: 'dire_bear',
    name: 'Dire Bear',
    size: 'Large',
    druidLevelRequired: 12,
    str: 31,
    dex: 13,
    con: 23,
    naturalArmorBonus: 7,
    speed: '40 ft.',
    naturalAttacks: [
      { name: 'Claw (x2)', damage: '2d4 + 10', attackBonus: 18, type: 'Slashing' },
      { name: 'Bite', damage: '2d8 + 5', attackBonus: 13, type: 'Piercing' }
    ],
    specialAbilities: ['Improved Grab', 'Scent', 'Low-Light Vision']
  },
  {
    id: 'eagle',
    name: 'Eagle',
    size: 'Small',
    druidLevelRequired: 8,
    str: 10,
    dex: 15,
    con: 12,
    naturalArmorBonus: 1,
    speed: '10 ft., fly 80 ft. (average)',
    naturalAttacks: [
      { name: 'Talons (x2)', damage: '1d4', attackBonus: 3, type: 'Slashing' },
      { name: 'Bite', damage: '1d4', attackBonus: -2, type: 'Piercing' }
    ],
    specialAbilities: ['Flight 80 ft. (Average)', 'Low-Light Vision']
  },
  {
    id: 'giant_crocodile',
    name: 'Giant Crocodile',
    size: 'Huge',
    druidLevelRequired: 15,
    str: 27,
    dex: 12,
    con: 19,
    naturalArmorBonus: 7,
    speed: '20 ft., swim 30 ft.',
    naturalAttacks: [
      { name: 'Bite', damage: '2d8 + 12', attackBonus: 11, type: 'Piercing' },
      { name: 'Tail Slap', damage: '1d12 + 12', attackBonus: 6, type: 'Bludgeoning' }
    ],
    specialAbilities: ['Improved Grab', 'Hold Breath', 'Low-Light Vision']
  },
  {
    id: 'fleshraker',
    name: 'Fleshraker Dinosaur (MM3)',
    size: 'Medium',
    druidLevelRequired: 5,
    str: 17,
    dex: 19,
    con: 15,
    naturalArmorBonus: 3,
    speed: '50 ft.',
    naturalAttacks: [
      { name: 'Claw (x2)', damage: '1d6 + 3', attackBonus: 6, type: 'Slashing' },
      { name: 'Bite', damage: '1d6 + 1', attackBonus: 1, type: 'Piercing' },
      { name: 'Tail', damage: '1d6 + 1 + Poison', attackBonus: 1, type: 'Piercing' }
    ],
    specialAbilities: ['Pounce (Full attack on charge)', 'Poison (1d6 Dex / 1d6 Dex)', 'Rake', 'Leaping Pounce']
  },
  {
    id: 'air_elemental_large',
    name: 'Air Elemental (Large)',
    size: 'Large',
    druidLevelRequired: 16,
    str: 14,
    dex: 25,
    con: 14,
    naturalArmorBonus: 4,
    speed: 'Fly 100 ft. (perfect)',
    naturalAttacks: [{ name: 'Slam (x2)', damage: '2d6 + 3', attackBonus: 12, type: 'Bludgeoning' }],
    specialAbilities: ['Elemental Traits', 'Air Mastery', 'Whirlwind', 'Darkvision 60 ft.']
  },
  {
    id: 'fire_elemental_large',
    name: 'Fire Elemental (Large)',
    size: 'Large',
    druidLevelRequired: 16,
    str: 14,
    dex: 21,
    con: 16,
    naturalArmorBonus: 4,
    speed: '50 ft.',
    naturalAttacks: [{ name: 'Slam (x2)', damage: '2d6 + 3 + 2d6 Fire', attackBonus: 12, type: 'Fire' }],
    specialAbilities: ['Elemental Traits', 'Burn (DC 17 Reflex or ignite)', 'Fire Immunity', 'Cold Vulnerability']
  }
];

// ============================================================================
// 6. ENVIRONMENTAL HAZARDS & SURVIVAL (D&D 3.5e RAW DMG p. 302-304 / SRD)
// ============================================================================

export interface EnvironmentalRollResult {
  d20: number;
  bonus: number;
  total: number;
  dc: number;
  passed: boolean;
  nonLethalDamage: number;
  inflictsCondition?: string;
  message: string;
}

export function roll35eForcedMarchCheck(char: CharacterData, extraHours: number): EnvironmentalRollResult {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const abilities = getEffectiveAbilities(char);
  const conMod = getAbilityModifier(abilities.CON?.score || 10);

  // Endurance feat gives +4 bonus to checks made to avoid nonlethal damage from forced march
  const hasEndurance = (char.feats || []).some(f => f.name.toLowerCase().includes('endurance'));
  const featBonus = hasEndurance ? 4 : 0;
  const negPenalty = char.negativeLevels || 0;

  const bonus = conMod + featBonus - negPenalty;
  const dc = 10 + 2 * Math.max(1, extraHours);
  const total = d20 + bonus;
  const passed = total >= dc;

  const dmg = passed ? 0 : Math.floor(Math.random() * 6) + 1;

  return {
    d20,
    bonus,
    total,
    dc,
    passed,
    nonLethalDamage: dmg,
    inflictsCondition: passed ? undefined : 'Fatigued',
    message: passed
      ? `Forced March Check Passed! (Hour ${8 + extraHours}): Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Continued marching cleanly!`
      : `Forced March Check Failed! (Hour ${8 + extraHours}): Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Took ${dmg} nonlethal damage and became Fatigued!`
  };
}

export function roll35eExtremeColdCheck(char: CharacterData, checkIndex: number, severe = false): EnvironmentalRollResult {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const fortBonus = get35eSaveBreakdown(char, 'fort').total;
  const hasEndurance = (char.feats || []).some(f => f.name.toLowerCase().includes('endurance'));
  const enduranceBonus = hasEndurance ? 4 : 0;

  const bonus = fortBonus + enduranceBonus;
  const dc = 15 + Math.max(0, checkIndex);
  const total = d20 + bonus;
  const passed = total >= dc;

  const dmg = passed ? 0 : (severe ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 6) + 1);

  return {
    d20,
    bonus,
    total,
    dc,
    passed,
    nonLethalDamage: dmg,
    inflictsCondition: passed ? undefined : 'Fatigued',
    message: passed
      ? `Extreme Cold Save Passed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Protected from hypothermia.`
      : `Extreme Cold Save Failed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Took ${dmg} nonlethal cold damage and became Fatigued!`
  };
}

export function roll35eExtremeHeatCheck(char: CharacterData, checkIndex: number, severe = false): EnvironmentalRollResult {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const fortBonus = get35eSaveBreakdown(char, 'fort').total;
  const hasEndurance = (char.feats || []).some(f => f.name.toLowerCase().includes('endurance'));
  const enduranceBonus = hasEndurance ? 4 : 0;

  const bonus = fortBonus + enduranceBonus;
  const dc = 15 + Math.max(0, checkIndex);
  const total = d20 + bonus;
  const passed = total >= dc;

  const dmg = passed ? 0 : (severe ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 4) + 1);

  return {
    d20,
    bonus,
    total,
    dc,
    passed,
    nonLethalDamage: dmg,
    inflictsCondition: passed ? undefined : 'Fatigued',
    message: passed
      ? `Extreme Heat Save Passed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Resisted heat exhaustion.`
      : `Extreme Heat Save Failed! Rolled ${d20} + ${bonus} = ${total} vs DC ${dc}. Took ${dmg} nonlethal heat damage and became Fatigued!`
  };
}

export function roll35eSuffocationCheck(char: CharacterData, roundsHoldingBreath: number): EnvironmentalRollResult {
  const abilities = getEffectiveAbilities(char);
  const conScore = abilities.CON?.score || 10;
  const conMod = getAbilityModifier(conScore);

  // Can hold breath for 2x CON score rounds (or 1x CON score if exerting/fighting)
  const maxRounds = conScore * 2;
  const extraRounds = Math.max(0, roundsHoldingBreath - maxRounds);

  if (extraRounds === 0) {
    return {
      d20: 20,
      bonus: conMod,
      total: 20,
      dc: 0,
      passed: true,
      nonLethalDamage: 0,
      message: `Holding breath safely (${roundsHoldingBreath} of ${maxRounds} rounds allowed).`
    };
  }

  const d20 = Math.floor(Math.random() * 20) + 1;
  const dc = 10 + extraRounds;
  const total = d20 + conMod;
  const passed = total >= dc;

  return {
    d20,
    bonus: conMod,
    total,
    dc,
    passed,
    nonLethalDamage: 0,
    inflictsCondition: passed ? undefined : 'Unconscious',
    message: passed
      ? `Suffocation Check Passed! Rolled ${d20} + ${conMod} = ${total} vs DC ${dc}. Breath held for another round!`
      : `Suffocation Check Failed! Rolled ${d20} + ${conMod} = ${total} vs DC ${dc}. Lungs give out! Fell Unconscious at 0 HP; next round drops to -1 HP dying!`
  };
}

// ============================================================================
// 7. PRESTIGE CLASS PREREQUISITES VALIDATOR (D&D 3.5e RAW DMG p. 176-200)
// ============================================================================

export interface PrestigeClassPrerequisite {
  name: string;
  source: string;
  requirements: {
    minBab?: number;
    minLevel?: number;
    requiredFeats?: string[];
    requiredSkills?: Array<{ skillName: string; minRanks: number }>;
    requiredSpellsOrCasterLevel?: string;
    alignment?: string[];
    special?: string;
  };
}

export const OFFICIAL_35E_PRESTIGE_CLASSES: PrestigeClassPrerequisite[] = [
  {
    name: 'Arcane Archer',
    source: 'DMG p. 176',
    requirements: {
      minBab: 6,
      requiredFeats: ['Point Blank Shot', 'Precise Shot', 'Weapon Focus'],
      requiredSpellsOrCasterLevel: 'Ability to cast 1st-level arcane spells',
      special: 'Race: Elf or Half-Elf'
    }
  },
  {
    name: 'Assassin',
    source: 'DMG p. 180',
    requirements: {
      alignment: ['Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
      requiredSkills: [
        { skillName: 'Disguise', minRanks: 4 },
        { skillName: 'Hide', minRanks: 8 },
        { skillName: 'Move Silently', minRanks: 8 }
      ],
      special: 'Must kill someone for no other reason than to join the Assassins'
    }
  },
  {
    name: 'Blackguard',
    source: 'DMG p. 182',
    requirements: {
      minBab: 6,
      alignment: ['Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
      requiredSkills: [
        { skillName: 'Hide', minRanks: 5 },
        { skillName: 'Knowledge (Religion)', minRanks: 2 }
      ],
      requiredFeats: ['Cleave', 'Improved Sunder', 'Power Attack'],
      special: 'Peaceful contact with an evil summoned outsider'
    }
  },
  {
    name: 'Dragon Disciple',
    source: 'DMG p. 183',
    requirements: {
      requiredSkills: [{ skillName: 'Knowledge (Arcana)', minRanks: 8 }],
      requiredSpellsOrCasterLevel: 'Ability to cast arcane spells without preparation (Sorcerer or Bard)',
      special: 'Must speak Draconic'
    }
  },
  {
    name: 'Duelist',
    source: 'DMG p. 185',
    requirements: {
      minBab: 6,
      requiredSkills: [
        { skillName: 'Perform', minRanks: 3 },
        { skillName: 'Tumble', minRanks: 5 }
      ],
      requiredFeats: ['Dodge', 'Mobility', 'Weapon Finesse']
    }
  },
  {
    name: 'Eldritch Knight',
    source: 'DMG p. 187',
    requirements: {
      requiredSpellsOrCasterLevel: 'Ability to cast 3rd-level arcane spells',
      special: 'Proficient with all martial weapons'
    }
  },
  {
    name: 'Horizon Walker',
    source: 'DMG p. 189',
    requirements: {
      requiredSkills: [
        { skillName: 'Knowledge (Geography)', minRanks: 8 }
      ],
      requiredFeats: ['Endurance']
    }
  },
  {
    name: 'Loremaster',
    source: 'DMG p. 191',
    requirements: {
      requiredSkills: [
        { skillName: 'Knowledge (any two)', minRanks: 10 }
      ],
      requiredFeats: ['Skill Focus', 'Any three Metamagic or Item Creation feats'],
      requiredSpellsOrCasterLevel: 'Ability to cast seven different divination spells, one must be 3rd-level or higher'
    }
  },
  {
    name: 'Mystic Theurge',
    source: 'DMG p. 192',
    requirements: {
      requiredSkills: [
        { skillName: 'Knowledge (Arcana)', minRanks: 6 },
        { skillName: 'Knowledge (Religion)', minRanks: 6 }
      ],
      requiredSpellsOrCasterLevel: 'Ability to cast 2nd-level arcane spells and 2nd-level divine spells'
    }
  },
  {
    name: 'Shadowdancer',
    source: 'DMG p. 194',
    requirements: {
      requiredSkills: [
        { skillName: 'Hide', minRanks: 10 },
        { skillName: 'Move Silently', minRanks: 8 },
        { skillName: 'Perform (Dance)', minRanks: 5 }
      ],
      requiredFeats: ['Combat Reflexes', 'Dodge', 'Mobility']
    }
  }
];

export interface ValidationResult {
  prereq: PrestigeClassPrerequisite;
  isQualified: boolean;
  babMet: boolean;
  featsMet: boolean;
  skillsMet: boolean;
  alignmentMet: boolean;
  details: string[];
}

export function validateCharacterForPrestigeClass(
  char: CharacterData,
  prereq: PrestigeClassPrerequisite
): ValidationResult {
  const details: string[] = [];
  let isQualified = true;

  // 1. BAB
  let babMet = true;
  if (prereq.requirements.minBab) {
    const bab = char.bab || char.baseAttackBonus || 0;
    if (bab < prereq.requirements.minBab) {
      babMet = false;
      isQualified = false;
      details.push(`❌ BAB +${bab} (Requires +${prereq.requirements.minBab})`);
    } else {
      details.push(`✅ BAB +${bab} (Meets +${prereq.requirements.minBab})`);
    }
  }

  // 2. Alignment
  let alignmentMet = true;
  if (prereq.requirements.alignment && prereq.requirements.alignment.length > 0) {
    const charAlign = (char.alignment || '').trim();
    if (!prereq.requirements.alignment.some(a => a.toLowerCase() === charAlign.toLowerCase())) {
      alignmentMet = false;
      isQualified = false;
      details.push(`❌ Alignment: ${charAlign || 'Undeclared'} (Requires: ${prereq.requirements.alignment.join(' or ')})`);
    } else {
      details.push(`✅ Alignment: ${charAlign}`);
    }
  }

  // 3. Feats
  let featsMet = true;
  if (prereq.requirements.requiredFeats && prereq.requirements.requiredFeats.length > 0) {
    const charFeatNames = (char.feats || []).map(f => f.name.toLowerCase());
    for (const reqFeat of prereq.requirements.requiredFeats) {
      const hasFeat = charFeatNames.some(f => f.includes(reqFeat.toLowerCase()));
      if (!hasFeat) {
        featsMet = false;
        isQualified = false;
        details.push(`❌ Missing Feat: "${reqFeat}"`);
      } else {
        details.push(`✅ Has Feat: "${reqFeat}"`);
      }
    }
  }

  // 4. Skills
  let skillsMet = true;
  if (prereq.requirements.requiredSkills && prereq.requirements.requiredSkills.length > 0) {
    for (const reqSkill of prereq.requirements.requiredSkills) {
      const match = (char.skills || []).find(s => s.name.toLowerCase().includes(reqSkill.skillName.toLowerCase()));
      const ranks = match?.ranks || 0;
      if (ranks < reqSkill.minRanks) {
        skillsMet = false;
        isQualified = false;
        details.push(`❌ ${reqSkill.skillName}: ${ranks} Ranks (Requires ${reqSkill.minRanks})`);
      } else {
        details.push(`✅ ${reqSkill.skillName}: ${ranks} Ranks (Meets ${reqSkill.minRanks})`);
      }
    }
  }

  // Spellcasting or Special notes
  if (prereq.requirements.requiredSpellsOrCasterLevel) {
    details.push(`ℹ️ Spellcasting Requirement: ${prereq.requirements.requiredSpellsOrCasterLevel}`);
  }
  if (prereq.requirements.special) {
    details.push(`ℹ️ Special Requirement: ${prereq.requirements.special}`);
  }

  return {
    prereq,
    isQualified,
    babMet,
    featsMet,
    skillsMet,
    alignmentMet,
    details
  };
}

// ============================================================================
// 8. ACTION ECONOMY ENGINE (D&D 3.5e RAW PHB p. 138-144, Rules Compendium p. 7-10)
// ============================================================================

export function reset35eRoundActionEconomy(char: CharacterData): CharacterData {
  return {
    ...char,
    actionEconomy: {
      standardActionUsed: false,
      moveActionUsed: false,
      // If immediate action was used, swift action on this next turn is consumed
      swiftActionUsed: Boolean(char.actionEconomy?.immediateActionUsed),
      immediateActionUsed: false,
      fiveFootStepTaken: false
    }
  };
}

export function spendSwiftAction(char: CharacterData): { updatedChar: CharacterData; success: boolean; message: string } {
  if (char.actionEconomy?.swiftActionUsed) {
    return {
      updatedChar: char,
      success: false,
      message: "❌ Swift action already consumed for this round (or lost due to using an Immediate action)."
    };
  }
  const updatedChar: CharacterData = {
    ...char,
    actionEconomy: {
      ...char.actionEconomy,
      swiftActionUsed: true
    }
  };
  return {
    updatedChar,
    success: true,
    message: "⚡ Swift action expended (1 per turn)."
  };
}

export function spendImmediateAction(char: CharacterData): { updatedChar: CharacterData; success: boolean; message: string } {
  if (char.actionEconomy?.immediateActionUsed) {
    return {
      updatedChar: char,
      success: false,
      message: "❌ Already used an Immediate action this round."
    };
  }
  const updatedChar: CharacterData = {
    ...char,
    actionEconomy: {
      ...char.actionEconomy,
      immediateActionUsed: true,
      swiftActionUsed: true // Immediately consumes the swift action of the upcoming turn
    }
  };
  return {
    updatedChar,
    success: true,
    message: "⚡ Immediate action triggered! Expends your swift action for your next turn."
  };
}

export function perform5FootStep(char: CharacterData): { updatedChar: CharacterData; success: boolean; message: string } {
  if (char.actionEconomy?.moveActionUsed) {
    return {
      updatedChar: char,
      success: false,
      message: "❌ Cannot take a 5-foot step if you have already taken a move action this round (PHB p. 144)."
    };
  }
  if (char.actionEconomy?.fiveFootStepTaken) {
    return {
      updatedChar: char,
      success: false,
      message: "❌ 5-foot step already taken this round."
    };
  }
  const updatedChar: CharacterData = {
    ...char,
    actionEconomy: {
      ...char.actionEconomy,
      fiveFootStepTaken: true
    }
  };
  return {
    updatedChar,
    success: true,
    message: "👣 5-foot step taken without provoking Attacks of Opportunity. No other movement allowed this turn."
  };
}

export function validate35eActionAvailability(
  char: CharacterData,
  action: 'standard' | 'move' | 'fullRound' | 'swift' | 'immediate' | 'fiveFootStep'
): { allowed: boolean; reason: string } {
  const econ = char.actionEconomy || {};

  switch (action) {
    case 'standard':
      if (econ.standardActionUsed) {
        return { allowed: false, reason: "Standard action already used this turn." };
      }
      return { allowed: true, reason: "Standard action available." };

    case 'move':
      if (econ.fiveFootStepTaken) {
        return { allowed: false, reason: "Cannot move after taking a 5-foot step in the same round (PHB p. 144)." };
      }
      if (econ.moveActionUsed) {
        if (!econ.standardActionUsed) {
          return { allowed: true, reason: "Move action available by trading Standard action." };
        }
        return { allowed: false, reason: "Both Standard and Move actions already used." };
      }
      return { allowed: true, reason: "Move action available." };

    case 'fullRound':
      if (econ.standardActionUsed || econ.moveActionUsed) {
        return { allowed: false, reason: "Full-round action requires both Standard and Move actions." };
      }
      return { allowed: true, reason: "Full-round action available (Standard + Move)." };

    case 'swift':
      if (econ.swiftActionUsed) {
        return { allowed: false, reason: "Swift action already used this round (or spent by prior Immediate action)." };
      }
      return { allowed: true, reason: "Swift action available (1 per turn)." };

    case 'immediate':
      if (econ.immediateActionUsed) {
        return { allowed: false, reason: "Immediate action already used this round." };
      }
      return { allowed: true, reason: "Immediate action available (will consume next turn's Swift action)." };

    case 'fiveFootStep':
      if (econ.moveActionUsed) {
        return { allowed: false, reason: "Cannot take a 5-foot step if you used a Move action this turn." };
      }
      if (econ.fiveFootStepTaken) {
        return { allowed: false, reason: "5-foot step already taken." };
      }
      return { allowed: true, reason: "5-foot step available (no AoO provoked)." };
  }
}

