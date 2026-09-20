/**
 * Official D&D 3.5e Creature Size and Scale Rules & Data
 * Based on Player's Handbook and Dungeon Master's Guide Table: Creature Size and Scale
 */

export type SizeCategory35e =
  | 'Fine'
  | 'Diminutive'
  | 'Tiny'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'Huge'
  | 'Gargantuan'
  | 'Colossal';

export type ReachType35e = 'Tall' | 'Long';

export interface SizeScaleEntry35e {
  sizeCategory: SizeCategory35e;
  /** Size modifier applied to Attack rolls and Armor Class (AC, Touch AC, Flat-Footed AC) */
  sizeModifier: number;
  /** Special size modifier applied to Grapple checks and combat maneuver checks */
  grappleModifier: number;
  /** Size modifier applied to the Hide skill */
  hideModifier: number;
  /** Biped's height, quadruped's body length (nose to base of tail) */
  heightOrLength: string;
  /** Assumes creature is roughly as dense as a regular animal */
  weight: string;
  /** Floor space occupied in combat (e.g. 5 ft., 10 ft.) */
  spaceFt: number;
  spaceDisplay: string;
  /** Natural reach for tall (bipedal) creatures */
  naturalReachTallFt: number;
  /** Natural reach for long (quadrupedal / serpentine) creatures */
  naturalReachLongFt: number;
  /** Typical carrying capacity multiplier for bipeds in 3.5e */
  bipedCarryingMultiplier: number;
  /** Typical carrying capacity multiplier for quadrupeds in 3.5e */
  quadrupedCarryingMultiplier: number;
  /** Representative examples of creatures in this size category */
  examples: string[];
}

export const DND_35E_SIZE_SCALE_TABLE: Record<SizeCategory35e, SizeScaleEntry35e> = {
  Fine: {
    sizeCategory: 'Fine',
    sizeModifier: 8,
    grappleModifier: -16,
    hideModifier: 16,
    heightOrLength: '6 in. or less',
    weight: '1/8 lb. or less',
    spaceFt: 0.5,
    spaceDisplay: '½ ft.',
    naturalReachTallFt: 0,
    naturalReachLongFt: 0,
    bipedCarryingMultiplier: 0.125,
    quadrupedCarryingMultiplier: 0.25,
    examples: ['Housefly', 'Mosquito', 'Scorpion (Tiny)', 'Crawling Beetle']
  },
  Diminutive: {
    sizeCategory: 'Diminutive',
    sizeModifier: 4,
    grappleModifier: -12,
    hideModifier: 12,
    heightOrLength: '6 in. - 1 ft.',
    weight: '1/8 lb. - 1 lb.',
    spaceFt: 1,
    spaceDisplay: '1 ft.',
    naturalReachTallFt: 0,
    naturalReachLongFt: 0,
    bipedCarryingMultiplier: 0.25,
    quadrupedCarryingMultiplier: 0.5,
    examples: ['Toad', 'Bat', 'Viper', 'Raven', 'Mouse']
  },
  Tiny: {
    sizeCategory: 'Tiny',
    sizeModifier: 2,
    grappleModifier: -8,
    hideModifier: 8,
    heightOrLength: '1 ft. - 2 ft.',
    weight: '1 lb. - 8 lb.',
    spaceFt: 2.5,
    spaceDisplay: '2½ ft.',
    naturalReachTallFt: 0,
    naturalReachLongFt: 0,
    bipedCarryingMultiplier: 0.5,
    quadrupedCarryingMultiplier: 0.75,
    examples: ['Cat', 'Hawk', 'Rat', 'Owl', 'Pseudodragon']
  },
  Small: {
    sizeCategory: 'Small',
    sizeModifier: 1,
    grappleModifier: -4,
    hideModifier: 4,
    heightOrLength: '2 ft. - 4 ft.',
    weight: '8 lb. - 60 lb.',
    spaceFt: 5,
    spaceDisplay: '5 ft.',
    naturalReachTallFt: 5,
    naturalReachLongFt: 5,
    bipedCarryingMultiplier: 0.75,
    quadrupedCarryingMultiplier: 1.0,
    examples: ['Halfling', 'Gnome', 'Goblin', 'Kobold', 'Eagle']
  },
  Medium: {
    sizeCategory: 'Medium',
    sizeModifier: 0,
    grappleModifier: 0,
    hideModifier: 0,
    heightOrLength: '4 ft. - 8 ft.',
    weight: '60 lb. - 500 lb.',
    spaceFt: 5,
    spaceDisplay: '5 ft.',
    naturalReachTallFt: 5,
    naturalReachLongFt: 5,
    bipedCarryingMultiplier: 1.0,
    quadrupedCarryingMultiplier: 1.5,
    examples: ['Human', 'Elf', 'Dwarf', 'Orc', 'Lizardfolk', 'Wolf']
  },
  Large: {
    sizeCategory: 'Large',
    sizeModifier: -1,
    grappleModifier: 4,
    hideModifier: -4,
    heightOrLength: '8 ft. - 16 ft.',
    weight: '500 lb. - 2 tons',
    spaceFt: 10,
    spaceDisplay: '10 ft.',
    naturalReachTallFt: 10,
    naturalReachLongFt: 5,
    bipedCarryingMultiplier: 2.0,
    quadrupedCarryingMultiplier: 3.0,
    examples: ['Ogre (Tall)', 'Troll (Tall)', 'Horse (Long)', 'Centaur (Long)', 'Lion (Long)']
  },
  Huge: {
    sizeCategory: 'Huge',
    sizeModifier: -2,
    grappleModifier: 8,
    hideModifier: -8,
    heightOrLength: '16 ft. - 32 ft.',
    weight: '2 tons - 16 tons',
    spaceFt: 15,
    spaceDisplay: '15 ft.',
    naturalReachTallFt: 15,
    naturalReachLongFt: 10,
    bipedCarryingMultiplier: 4.0,
    quadrupedCarryingMultiplier: 6.0,
    examples: ['Hill Giant (Tall)', 'Fire Giant (Tall)', 'Elephant (Long)', 'Triceratops (Long)']
  },
  Gargantuan: {
    sizeCategory: 'Gargantuan',
    sizeModifier: -4,
    grappleModifier: 12,
    hideModifier: -12,
    heightOrLength: '32 ft. - 64 ft.',
    weight: '16 tons - 125 tons',
    spaceFt: 20,
    spaceDisplay: '20 ft.',
    naturalReachTallFt: 20,
    naturalReachLongFt: 15,
    bipedCarryingMultiplier: 8.0,
    quadrupedCarryingMultiplier: 12.0,
    examples: ['Kraken (Tall/Long)', 'Purple Worm (Long)', 'Ancient Dragon (Long/Tall)']
  },
  Colossal: {
    sizeCategory: 'Colossal',
    sizeModifier: -8,
    grappleModifier: 16,
    hideModifier: -16,
    heightOrLength: '64 ft. or more',
    weight: '125 tons or more',
    spaceFt: 30,
    spaceDisplay: '30 ft.',
    naturalReachTallFt: 30,
    naturalReachLongFt: 20,
    bipedCarryingMultiplier: 16.0,
    quadrupedCarryingMultiplier: 24.0,
    examples: ['Tarrasque', 'Great Wyrm Dragon', 'Colossus', 'Titan (Great)']
  }
};

export const SIZE_ORDER_35E: SizeCategory35e[] = [
  'Fine',
  'Diminutive',
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
  'Colossal'
];

/**
 * Normalizes any string or size input into a validated 3.5e size category.
 */
export function normalize35eSize(sizeCategory?: string): SizeCategory35e {
  if (!sizeCategory) return 'Medium';
  const clean = sizeCategory.trim().toLowerCase();
  switch (clean) {
    case 'fine': return 'Fine';
    case 'diminutive': return 'Diminutive';
    case 'tiny': return 'Tiny';
    case 'small': return 'Small';
    case 'medium': return 'Medium';
    case 'large': return 'Large';
    case 'huge': return 'Huge';
    case 'gargantuan': return 'Gargantuan';
    case 'colossal': return 'Colossal';
    default: return 'Medium';
  }
}

/**
 * Gets the complete size and scale entry for a size category.
 */
export function getSizeScaleEntry(sizeCategory?: string): SizeScaleEntry35e {
  const norm = normalize35eSize(sizeCategory);
  return DND_35E_SIZE_SCALE_TABLE[norm];
}

export const get35eSizeScaleEntry = getSizeScaleEntry;

/**
 * Footnote 1: A creature's size modifier is applied to its attack bonus and Armor Class.
 */
export function get35eSizeModifier(sizeCategory?: string, race?: string): number {
  if (sizeCategory) {
    return getSizeScaleEntry(sizeCategory).sizeModifier;
  }
  const r = (race || '').toLowerCase();
  if (r.includes('halfling') || r.includes('gnome') || r.includes('goblin') || r.includes('kobold')) return 1;
  if (r.includes('giant') || r.includes('ogre') || r.includes('troll') || r.includes('minotaur') || r.includes('centaur')) return -1;
  return 0;
}

/**
 * Footnote 2: See the Grapple special attack.
 */
export function get35eGrappleModifier(sizeCategory?: string): number {
  return getSizeScaleEntry(sizeCategory).grappleModifier;
}

/**
 * Footnote 3: See the Hide skill.
 */
export function get35eHideModifier(sizeCategory?: string): number {
  return getSizeScaleEntry(sizeCategory).hideModifier;
}

/**
 * Footnote 4 & 6: Space and Natural Reach for Tall vs. Long creatures.
 */
export function get35eSpaceAndReach(
  sizeCategory?: string,
  reachTypeOrQuadruped?: ReachType35e | boolean
): {
  spaceFt: number;
  spaceDisplay: string;
  naturalReachFt: number;
  reachDisplay: string;
  reachType: ReachType35e;
  isZeroReach: boolean;
  threatRule: string;
} {
  const entry = getSizeScaleEntry(sizeCategory);
  
  // Determine if creature is Tall or Long
  let reachType: ReachType35e = 'Tall';
  if (reachTypeOrQuadruped === 'Long' || reachTypeOrQuadruped === true) {
    reachType = 'Long';
  } else if (reachTypeOrQuadruped === 'Tall' || reachTypeOrQuadruped === false) {
    reachType = 'Tall';
  } else {
    // Default: Small and Medium are standard 5 ft. Large+ default to Tall unless quadruped
    reachType = 'Tall';
  }

  const naturalReachFt = reachType === 'Long' ? entry.naturalReachLongFt : entry.naturalReachTallFt;
  const isZeroReach = naturalReachFt === 0;

  const threatRule = isZeroReach
    ? '0 ft. Natural Reach: Does not threaten adjacent squares; cannot make standard Attacks of Opportunity and must enter an opponent\'s square to attack (provoking AoO).'
    : `Threatens squares within ${naturalReachFt} ft. (${reachType} reach).`;

  return {
    spaceFt: entry.spaceFt,
    spaceDisplay: entry.spaceDisplay,
    naturalReachFt,
    reachDisplay: `${naturalReachFt} ft.`,
    reachType,
    isZeroReach,
    threatRule
  };
}

export const SIZE_SCALE_FOOTNOTES_35E = [
  {
    number: 1,
    title: "Size Modifier to Attack & AC",
    description: "A creature's size modifier is applied to its attack bonus and Armor Class (including Normal AC, Touch AC, and Flat-Footed AC)."
  },
  {
    number: 2,
    title: "Grapple Special Attack Modifier",
    description: "A creature gains a special size modifier on grapple checks (+4 for each size category above Medium, -4 for each size category below Medium)."
  },
  {
    number: 3,
    title: "Hide Skill Modifier",
    description: "A creature gains a size modifier on Hide checks (+4 for each size category below Medium, -4 for each size category above Medium)."
  },
  {
    number: 4,
    title: "Height or Length Measurement",
    description: "Biped's height (from ground to crown), quadruped's body length (from nose to base of tail)."
  },
  {
    number: 5,
    title: "Density & Weight Assumptions",
    description: "Assumes that the creature is roughly as dense as a regular animal. A creature made of stone will weigh considerably more. A gaseous creature will weigh much less."
  },
  {
    number: 6,
    title: "Typical Values & Exceptions",
    description: "These values are typical for creatures of the indicated size. Some exceptions exist based on anatomical reach, weapon type, or natural weapons."
  }
];
