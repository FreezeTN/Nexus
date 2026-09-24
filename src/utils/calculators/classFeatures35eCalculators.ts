import { CharacterData, GearItem } from '../../types';
import { getAbilityModifier, getEffectiveAbilities } from './abilityCalculators';
import { get35eSaveBreakdown } from '../dndCalculations';

// ============================================================================
// 1. BARBARIAN RAGE ENGINE (PHB p. 25 / SRD)
// ============================================================================

export interface Dnd35eRageBreakdown {
  isEligible: boolean;
  barbarianLevel: number;
  rageType: 'normal' | 'greater' | 'mighty';
  strBonus: number;
  conBonus: number;
  willBonus: number;
  acPenalty: number;
  hpPerLevel: number;
  totalTempHp: number;
  durationRounds: number;
  dailyUsesMax: number;
  dailyUsesRemaining: number;
  hasIndomitableWill: boolean;
  isTireless: boolean;
  isCurrentlyRaging: boolean;
}

export function calculate35eRageStats(char: CharacterData): Dnd35eRageBreakdown {
  const isBarb = (char.characterClass || '').toLowerCase().includes('barbarian');
  const secIsBarb = (char.optionalRules?.secondaryClass || '').toLowerCase().includes('barbarian');
  
  const barbLevel = isBarb 
    ? (char.level || 1)
    : secIsBarb 
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = barbLevel > 0;
  const rageType: 'normal' | 'greater' | 'mighty' = 
    barbLevel >= 20 ? 'mighty' : barbLevel >= 11 ? 'greater' : 'normal';

  const strBonus = rageType === 'mighty' ? 8 : rageType === 'greater' ? 6 : 4;
  const conBonus = rageType === 'mighty' ? 8 : rageType === 'greater' ? 6 : 4;
  const willBonus = rageType === 'mighty' ? 4 : rageType === 'greater' ? 3 : 2;
  const acPenalty = -2;
  const hpPerLevel = rageType === 'mighty' ? 4 : rageType === 'greater' ? 3 : 2;
  const totalTempHp = hpPerLevel * Math.max(1, char.level || 1);

  // Raw Con Mod without rage
  const baseConMod = getAbilityModifier(char.abilities.CON?.score || 10);
  const rageConMod = baseConMod + Math.floor(conBonus / 2);
  const durationRounds = Math.max(1, 3 + rageConMod);

  // Daily uses: 1/day at 1st, 2 at 4th, 3 at 8th, 4 at 12th, 5 at 16th, 6 at 20th
  let dailyUsesMax = 1;
  if (barbLevel >= 20) dailyUsesMax = 6;
  else if (barbLevel >= 16) dailyUsesMax = 5;
  else if (barbLevel >= 12) dailyUsesMax = 4;
  else if (barbLevel >= 8) dailyUsesMax = 3;
  else if (barbLevel >= 4) dailyUsesMax = 2;

  // Read from character class feature if tracked or character state
  const rageFeat = char.classFeatures?.find(f => f.name.toLowerCase().includes('barbarian rage'));
  const dailyUsesRemaining = rageFeat?.usesRemaining !== undefined 
    ? rageFeat.usesRemaining 
    : dailyUsesMax;

  return {
    isEligible,
    barbarianLevel: barbLevel,
    rageType,
    strBonus,
    conBonus,
    willBonus,
    acPenalty,
    hpPerLevel,
    totalTempHp,
    durationRounds,
    dailyUsesMax,
    dailyUsesRemaining,
    hasIndomitableWill: barbLevel >= 14,
    isTireless: barbLevel >= 17,
    isCurrentlyRaging: Boolean(char.isRaging35e)
  };
}

// ============================================================================
// 2. PALADIN SMITE EVIL & LAY ON HANDS ENGINE (PHB p. 44 / SRD)
// ============================================================================

export interface Dnd35ePaladinBreakdown {
  isEligible: boolean;
  paladinLevel: number;
  chaMod: number;
  smiteEvilUsesMax: number;
  smiteEvilUsesRemaining: number;
  smiteAttackBonus: number;
  smiteDamageBonus: number;
  layOnHandsPoolMax: number;
  layOnHandsPoolRemaining: number;
  removeDiseaseWeeklyMax: number;
  divineGraceBonus: number;
  hasAuraOfCourage: boolean;
  hasSpecialMount: boolean;
}

export function calculate35ePaladinStats(char: CharacterData): Dnd35ePaladinBreakdown {
  const isPal = (char.characterClass || '').toLowerCase().includes('paladin');
  const secIsPal = (char.optionalRules?.secondaryClass || '').toLowerCase().includes('paladin');

  const palLevel = isPal
    ? (char.level || 1)
    : secIsPal
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = palLevel > 0;
  const abilities = getEffectiveAbilities(char);
  const chaMod = getAbilityModifier(abilities.CHA?.score || 10);

  // Smite Evil uses: 1 at 1st, 2 at 5th, 3 at 10th, 4 at 15th, 5 at 20th
  const smiteUsesMax = isEligible ? 1 + Math.floor((palLevel - 1) / 5) : 0;
  const smiteUsesRemaining = char.smiteEvilUsesRemaining !== undefined
    ? char.smiteEvilUsesRemaining
    : smiteUsesMax;

  // Lay on Hands healing pool = Paladin Level * max(1, Charisma Modifier)
  const layOnHandsPoolMax = isEligible ? palLevel * Math.max(1, chaMod) : 0;
  const layOnHandsPoolRemaining = char.layOnHandsPoolRemaining !== undefined
    ? char.layOnHandsPoolRemaining
    : layOnHandsPoolMax;

  // Remove Disease: 1/week at 6th, +1 every 3 levels thereafter (9th, 12th, 15th, 18th)
  const removeDiseaseWeeklyMax = palLevel >= 6 ? 1 + Math.floor((palLevel - 6) / 3) : 0;

  return {
    isEligible,
    paladinLevel: palLevel,
    chaMod,
    smiteEvilUsesMax: smiteUsesMax,
    smiteEvilUsesRemaining: smiteUsesRemaining,
    smiteAttackBonus: Math.max(0, chaMod),
    smiteDamageBonus: palLevel,
    layOnHandsPoolMax,
    layOnHandsPoolRemaining,
    removeDiseaseWeeklyMax,
    divineGraceBonus: Math.max(0, chaMod),
    hasAuraOfCourage: palLevel >= 3,
    hasSpecialMount: palLevel >= 5
  };
}

// ============================================================================
// 3. ROGUE SNEAK ATTACK & PRECISION ENGINE (PHB p. 50 / SRD)
// ============================================================================

export interface Dnd35eRogueBreakdown {
  isEligible: boolean;
  rogueLevel: number;
  sneakAttackDiceCount: number;
  sneakAttackDiceString: string;
  hasEvasion: boolean;
  hasUncannyDodge: boolean;
  hasImprovedUncannyDodge: boolean;
  hasTrapSense: boolean;
  trapSenseBonus: number;
  hasCripplingStrike: boolean;
  hasOpportunist: boolean;
  hasSlipperyMind: boolean;
  immuneCreatureTypes: string[];
}

export function calculate35eRogueStats(char: CharacterData): Dnd35eRogueBreakdown {
  const primary = (char.characterClass || '').toLowerCase();
  const secondary = (char.optionalRules?.secondaryClass || '').toLowerCase();

  let rogueLevel = 0;
  if (primary.includes('rogue')) rogueLevel += (char.level || 1);
  if (secondary.includes('rogue')) rogueLevel += (char.optionalRules?.secondaryLevel || 1);

  // Assassin prestige class also grants sneak attack
  if (primary.includes('assassin')) rogueLevel += (char.level || 1);
  if (secondary.includes('assassin')) rogueLevel += (char.optionalRules?.secondaryLevel || 1);

  const isEligible = rogueLevel > 0;
  // Sneak attack: +1d6 at 1st, 3rd, 5th, 7th, 9th, 11th, etc.
  const diceCount = isEligible ? Math.floor((rogueLevel + 1) / 2) : 0;

  return {
    isEligible,
    rogueLevel,
    sneakAttackDiceCount: diceCount,
    sneakAttackDiceString: `${diceCount}d6`,
    hasEvasion: rogueLevel >= 2,
    hasUncannyDodge: rogueLevel >= 4,
    hasImprovedUncannyDodge: rogueLevel >= 8,
    hasTrapSense: rogueLevel >= 3,
    trapSenseBonus: rogueLevel >= 3 ? Math.floor(rogueLevel / 3) : 0,
    hasCripplingStrike: rogueLevel >= 10,
    hasOpportunist: rogueLevel >= 10,
    hasSlipperyMind: rogueLevel >= 10,
    immuneCreatureTypes: [
      'Undead (no discernable anatomy / vital organs)',
      'Constructs (inanimate matter)',
      'Plants (no nervous system)',
      'Oozes (amorphous structure)',
      'Elementals (primordial energy)',
      'Incorporeal Creatures (unless using Ghost Touch weapon)'
    ]
  };
}

// ============================================================================
// 4. BARD BARDIC MUSIC ENGINE (PHB p. 29 / SRD)
// ============================================================================

export interface BardicPerformanceOption {
  id: string;
  name: string;
  minLevel: number;
  reqPerformRanks: number;
  summary: string;
  effectDescription: string;
}

export const DND35E_BARDIC_MUSIC_SONGS: BardicPerformanceOption[] = [
  {
    id: 'inspire_courage',
    name: 'Inspire Courage',
    minLevel: 1,
    reqPerformRanks: 3,
    summary: 'Morale bonus to attack, weapon damage, and saves vs charm/fear.',
    effectDescription: 'Allies gain a +1 morale bonus on saving throws against charm and fear effects and a +1 morale bonus on attack and weapon damage rolls. Increases to +2 at 8th level, +3 at 14th level, and +4 at 20th level.'
  },
  {
    id: 'countersong',
    name: 'Countersong',
    minLevel: 1,
    reqPerformRanks: 3,
    summary: 'Oppose sonic or language-dependent magical attacks with a Perform check.',
    effectDescription: 'Any creature within 30 feet may use the bard’s Perform check result in place of its saving throw against magical sonic or language-dependent attacks.'
  },
  {
    id: 'fascinate',
    name: 'Fascinate',
    minLevel: 1,
    reqPerformRanks: 3,
    summary: 'Entrall up to Bard Level creatures within 90 feet.',
    effectDescription: 'Causes one or more creatures to become fascinated with the performance. Will save DC equals the bard’s Perform check result.'
  },
  {
    id: 'inspire_competence',
    name: 'Inspire Competence',
    minLevel: 3,
    reqPerformRanks: 6,
    summary: '+2 competence bonus on skill checks for an ally.',
    effectDescription: 'Help an ally succeed at a task. The ally gets a +2 competence bonus on skill checks with a particular skill as long as they hear the bard.'
  },
  {
    id: 'suggestion',
    name: 'Suggestion',
    minLevel: 6,
    reqPerformRanks: 9,
    summary: 'Plant a hypnotic suggestion into a fascinated creature.',
    effectDescription: 'Make a suggestion (as the spell) to a creature that is currently fascinated. Will save DC = 10 + 1/2 bard level + Charisma modifier.'
  },
  {
    id: 'inspire_greatness',
    name: 'Inspire Greatness',
    minLevel: 9,
    reqPerformRanks: 12,
    summary: 'Grant +2 Bonus HD (bonus HP), +2 competence attack, +1 Fort save.',
    effectDescription: 'Grants +2 bonus Hit Dice (d10s + Con mod bonus HP), +2 competence bonus on attack rolls, and +1 competence bonus on Fortitude saves.'
  },
  {
    id: 'song_of_freedom',
    name: 'Song of Freedom',
    minLevel: 12,
    reqPerformRanks: 15,
    summary: 'Break enchantment on an ally through 1 minute of uninterrupted song.',
    effectDescription: 'Cast the equivalent of a Break Enchantment spell (caster level equals bard level). Requires 1 minute of uninterrupted music.'
  },
  {
    id: 'inspire_heroics',
    name: 'Inspire Heroics',
    minLevel: 15,
    reqPerformRanks: 18,
    summary: '+4 morale bonus on saves, +4 dodge bonus to AC.',
    effectDescription: 'Grants an ally a +4 morale bonus on saving throws and a +4 dodge bonus to AC against attacks.'
  },
  {
    id: 'mass_suggestion',
    name: 'Mass Suggestion',
    minLevel: 18,
    reqPerformRanks: 21,
    summary: 'Make a suggestion simultaneously to any number of fascinated creatures.',
    effectDescription: 'Functions like suggestion, but can affect any number of fascinated creatures simultaneously.'
  }
];

export interface Dnd35eBardicMusicBreakdown {
  isEligible: boolean;
  bardLevel: number;
  dailyUsesMax: number;
  dailyUsesRemaining: number;
  inspireCourageBonus: number;
  performRanks: number;
  unlockedSongs: BardicPerformanceOption[];
  activePerformance?: string;
}

export function calculate35eBardicMusicStats(char: CharacterData): Dnd35eBardicMusicBreakdown {
  const isBard = (char.characterClass || '').toLowerCase().includes('bard');
  const secIsBard = (char.optionalRules?.secondaryClass || '').toLowerCase().includes('bard');

  const bardLevel = isBard
    ? (char.level || 1)
    : secIsBard
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = bardLevel > 0;
  const dailyUsesMax = bardLevel;
  const dailyUsesRemaining = char.bardicMusicUsesRemaining !== undefined
    ? char.bardicMusicUsesRemaining
    : dailyUsesMax;

  // Inspire courage bonus: +1 at 1st, +2 at 8th, +3 at 14th, +4 at 20th
  let inspireCourageBonus = 1;
  if (bardLevel >= 20) inspireCourageBonus = 4;
  else if (bardLevel >= 14) inspireCourageBonus = 3;
  else if (bardLevel >= 8) inspireCourageBonus = 2;

  // Find Perform skill ranks
  const performSkill = char.skills?.find(s => s.name.toLowerCase().startsWith('perform'));
  const performRanks = performSkill?.ranks || 0;

  const unlockedSongs = DND35E_BARDIC_MUSIC_SONGS.filter(
    s => bardLevel >= s.minLevel && performRanks >= s.reqPerformRanks
  );

  return {
    isEligible,
    bardLevel,
    dailyUsesMax,
    dailyUsesRemaining,
    inspireCourageBonus,
    performRanks,
    unlockedSongs,
    activePerformance: char.activeBardicPerformance
  };
}

// ============================================================================
// 5. RANGER FAVORED ENEMY & COMBAT STYLE ENGINE (PHB p. 47 / SRD)
// ============================================================================

export const DND35E_OFFICIAL_FAVORED_ENEMIES = [
  'Aberration',
  'Animal',
  'Construct',
  'Dragon',
  'Elemental',
  'Fey',
  'Giant',
  'Humanoid (aquatic)',
  'Humanoid (dwarf)',
  'Humanoid (elf)',
  'Humanoid (goblinoid)',
  'Humanoid (gnoll)',
  'Humanoid (gnome)',
  'Humanoid (halfling)',
  'Humanoid (human)',
  'Humanoid (orc)',
  'Humanoid (reptilian)',
  'Magical Beast',
  'Monstrous Humanoid',
  'Ooze',
  'Outsider (air)',
  'Outsider (chaotic)',
  'Outsider (earth)',
  'Outsider (evil)',
  'Outsider (fire)',
  'Outsider (good)',
  'Outsider (lawful)',
  'Outsider (native)',
  'Outsider (water)',
  'Plant',
  'Undead',
  'Vermin'
];

export interface Dnd35eRangerBreakdown {
  isEligible: boolean;
  rangerLevel: number;
  totalFavoredEnemiesAllowed: number;
  favoredEnemies: Array<{ category: string; bonus: number }>;
  combatStyle: 'archery' | 'two_weapon';
  grantedFeats: string[];
  hasWildEmpathy: boolean;
  hasWoodlandStride: boolean;
  hasSwiftTracker: boolean;
  hasCamouflage: boolean;
  hasHideInPlainSight: boolean;
}

export function calculate35eRangerStats(char: CharacterData): Dnd35eRangerBreakdown {
  const isRanger = (char.characterClass || '').toLowerCase().includes('ranger');
  const secIsRanger = (char.optionalRules?.secondaryClass || '').toLowerCase().includes('ranger');

  const rangerLevel = isRanger
    ? (char.level || 1)
    : secIsRanger
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = rangerLevel > 0;
  // 1 at 1st, 2 at 5th, 3 at 10th, 4 at 15th, 5 at 20th
  const totalFavoredEnemiesAllowed = isEligible ? 1 + Math.floor(rangerLevel / 5) : 0;

  const favoredEnemies = char.favoredEnemies35e || [
    { category: 'Undead', bonus: 2 }
  ];

  const combatStyle = char.rangerCombatStyle || 'archery';
  const grantedFeats: string[] = ['Track'];
  if (rangerLevel >= 2) {
    grantedFeats.push(combatStyle === 'archery' ? 'Rapid Shot' : 'Two-Weapon Fighting');
  }
  if (rangerLevel >= 6) {
    grantedFeats.push(combatStyle === 'archery' ? 'Manyshot' : 'Improved Two-Weapon Fighting');
  }
  if (rangerLevel >= 11) {
    grantedFeats.push(combatStyle === 'archery' ? 'Improved Precise Shot' : 'Greater Two-Weapon Fighting');
  }

  return {
    isEligible,
    rangerLevel,
    totalFavoredEnemiesAllowed,
    favoredEnemies,
    combatStyle,
    grantedFeats,
    hasWildEmpathy: rangerLevel >= 1,
    hasWoodlandStride: rangerLevel >= 7,
    hasSwiftTracker: rangerLevel >= 8,
    hasCamouflage: rangerLevel >= 13,
    hasHideInPlainSight: rangerLevel >= 17
  };
}

// ============================================================================
// 6. MONK MARTIAL ARTS & KI ENGINE (PHB p. 40 / SRD)
// ============================================================================

export interface Dnd35eMonkBreakdown {
  isEligible: boolean;
  monkLevel: number;
  unarmedDamage: string;
  monkAcWisBonus: number;
  monkAcClassBonus: number;
  totalMonkAcBonus: number;
  stunningFistDc: number;
  stunningFistDailyUsesMax: number;
  stunningFistDailyUsesRemaining: number;
  wholenessOfBodyMax: number;
  wholenessOfBodyRemaining: number;
  fastMovementFt: number;
  kiStrike: 'None' | 'Magic' | 'Lawful' | 'Adamantine';
  hasDiamondBody: boolean;
  hasDiamondSoul: boolean;
  diamondSoulSr: number;
  hasAbundantStep: boolean;
  hasEmptyBody: boolean;
}

export function calculate35eMonkStats(char: CharacterData): Dnd35eMonkBreakdown {
  const isMonk = (char.characterClass || '').toLowerCase().includes('monk');
  const secIsMonk = (char.optionalRules?.secondaryClass || '').toLowerCase().includes('monk');

  const monkLevel = isMonk
    ? (char.level || 1)
    : secIsMonk
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = monkLevel > 0;
  const abilities = getEffectiveAbilities(char);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);

  // Unarmed strike damage progression (Medium creature)
  let unarmedDamage = '1d6';
  if (monkLevel >= 20) unarmedDamage = '2d10';
  else if (monkLevel >= 16) unarmedDamage = '2d8';
  else if (monkLevel >= 12) unarmedDamage = '2d6';
  else if (monkLevel >= 8) unarmedDamage = '1d10';
  else if (monkLevel >= 4) unarmedDamage = '1d8';

  // Monk AC bonus applies when unarmored and unencumbered
  const monkAcWisBonus = Math.max(0, wisMod);
  const monkAcClassBonus = Math.floor(monkLevel / 5); // +1 at 5th, 10th, 15th, 20th
  const totalMonkAcBonus = isEligible ? monkAcWisBonus + monkAcClassBonus : 0;

  // Stunning Fist: DC 10 + 1/2 Monk Level + WIS mod. Uses: monk level per day.
  const stunningFistDc = 10 + Math.floor(monkLevel / 2) + Math.max(0, wisMod);
  const stunningFistDailyUsesMax = monkLevel;
  const stunningFistDailyUsesRemaining = char.stunningFistUsesRemaining !== undefined
    ? char.stunningFistUsesRemaining
    : stunningFistDailyUsesMax;

  // Wholeness of Body: Heal self 2x monk level per day
  const wholenessOfBodyMax = monkLevel * 2;
  const wholenessOfBodyRemaining = char.wholenessOfBodyRemaining !== undefined
    ? char.wholenessOfBodyRemaining
    : wholenessOfBodyMax;

  // Fast movement: +10 ft every 3 levels
  let fastMovementFt = 0;
  if (monkLevel >= 18) fastMovementFt = 60;
  else if (monkLevel >= 15) fastMovementFt = 50;
  else if (monkLevel >= 12) fastMovementFt = 40;
  else if (monkLevel >= 9) fastMovementFt = 30;
  else if (monkLevel >= 6) fastMovementFt = 20;
  else if (monkLevel >= 3) fastMovementFt = 10;

  // Ki Strike: Magic at 4th, Lawful at 10th, Adamantine at 16th
  let kiStrike: 'None' | 'Magic' | 'Lawful' | 'Adamantine' = 'None';
  if (monkLevel >= 16) kiStrike = 'Adamantine';
  else if (monkLevel >= 10) kiStrike = 'Lawful';
  else if (monkLevel >= 4) kiStrike = 'Magic';

  return {
    isEligible,
    monkLevel,
    unarmedDamage,
    monkAcWisBonus,
    monkAcClassBonus,
    totalMonkAcBonus,
    stunningFistDc,
    stunningFistDailyUsesMax,
    stunningFistDailyUsesRemaining,
    wholenessOfBodyMax,
    wholenessOfBodyRemaining,
    fastMovementFt,
    kiStrike,
    hasDiamondBody: monkLevel >= 11,
    hasDiamondSoul: monkLevel >= 13,
    diamondSoulSr: monkLevel >= 13 ? monkLevel + 10 : 0,
    hasAbundantStep: monkLevel >= 12,
    hasEmptyBody: monkLevel >= 19
  };
}

// ============================================================================
// 7. EXPANDED PSIONICS ENGINE (XPH / SRD)
// ============================================================================

export interface Dnd35ePsionicBreakdown {
  isEligible: boolean;
  psionicClass: string;
  manifesterLevel: number;
  keyAbility: 'INT' | 'WIS' | 'CHA';
  keyAbilityMod: number;
  basePowerPoints: number;
  bonusPowerPoints: number;
  totalPowerPointsMax: number;
  powerPointsRemaining: number;
  isPsionicFocused: boolean;
  autohypnosisFocusDc: number;
  discipline?: string;
  wildSurgeBonus?: number;
}

// Table 2-1: Base Power Points per Day (Psion / Wilder)
const PSION_BASE_PP = [
  0, 2, 6, 11, 17, 25, 35, 46, 58, 72, 88, 106, 126, 147, 170, 195, 221, 250, 280, 311, 343
];

// Table 2-2: Psychic Warrior Base Power Points per Day
const PSYWAR_BASE_PP = [
  0, 0, 1, 3, 5, 7, 9, 12, 15, 18, 21, 24, 28, 32, 36, 40, 45, 50, 55, 60, 65
];

export function calculate35ePsionicStats(char: CharacterData): Dnd35ePsionicBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isPsion = cls.includes('psion') && !cls.includes('psychic warrior');
  const isPsyWar = cls.includes('psychic warrior');
  const isSoulknife = cls.includes('soulknife');
  const isWilder = cls.includes('wilder');

  const isEligible = isPsion || isPsyWar || isSoulknife || isWilder;
  const manifesterLevel = Math.max(1, char.level || 1);

  let keyAbility: 'INT' | 'WIS' | 'CHA' = 'INT';
  if (isPsyWar) keyAbility = 'WIS';
  if (isWilder) keyAbility = 'CHA';

  const abilities = getEffectiveAbilities(char);
  const keyAbilityMod = Math.max(0, getAbilityModifier(abilities[keyAbility]?.score || 10));

  const table = isPsyWar ? PSYWAR_BASE_PP : PSION_BASE_PP;
  const basePowerPoints = isSoulknife ? 0 : (table[Math.min(20, manifesterLevel)] || 0);

  // Bonus PP = (Key Ability Mod * Manifester Level) / 2 (approximate XPH formula)
  const bonusPowerPoints = isSoulknife ? 0 : Math.floor((keyAbilityMod * manifesterLevel) / 2);
  const totalPowerPointsMax = basePowerPoints + bonusPowerPoints;

  const powerPointsRemaining = char.psionicData?.powerPointsRemaining !== undefined
    ? char.psionicData.powerPointsRemaining
    : totalPowerPointsMax;

  const isPsionicFocused = Boolean(char.psionicData?.isPsionicFocused);

  return {
    isEligible,
    psionicClass: isPsion ? 'Psion' : isPsyWar ? 'Psychic Warrior' : isSoulknife ? 'Soulknife' : isWilder ? 'Wilder' : '',
    manifesterLevel,
    keyAbility,
    keyAbilityMod,
    basePowerPoints,
    bonusPowerPoints,
    totalPowerPointsMax,
    powerPointsRemaining,
    isPsionicFocused,
    autohypnosisFocusDc: 20,
    discipline: char.psionicData?.discipline,
    wildSurgeBonus: char.psionicData?.wildSurgeBonus || 0
  };
}

// ============================================================================
// 8. DRUID NATURE'S BOND & WILD EMPATHY ENGINE (PHB p. 35 / SRD)
// ============================================================================

export interface Dnd35eDruidBreakdown {
  isEligible: boolean;
  druidLevel: number;
  wildEmpathyBonus: number; // Druid Level + Charisma modifier
  woodlandStride: boolean; // Level 2: Move through nonmagical undergrowth without penalty
  tracklessStep: boolean; // Level 3: Leaves no trail in natural surroundings, cannot be tracked
  resistNaturesLure: boolean; // Level 4: +4 bonus on saves vs spell-like abilities of fey
  venomImmunity: boolean; // Level 9: Immunity to all poisons
  thousandFaces: boolean; // Level 13: Alter self at will
  timelessBody: boolean; // Level 15: No aging penalties to physical ability scores
  wildShapeUsesMax: number;
  wildShapeTypes: string[];
}

export function calculate35eDruidStats(char: CharacterData): Dnd35eDruidBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isDruid = cls.includes('druid');
  const secIsDruid = sec.includes('druid');

  const druidLevel = isDruid
    ? (char.level || 1)
    : secIsDruid
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = druidLevel > 0;
  const abilities = getEffectiveAbilities(char);
  const chaMod = getAbilityModifier(abilities.CHA?.score || 10);

  const wildEmpathyBonus = druidLevel + chaMod;

  let wildShapeUsesMax = 0;
  const wildShapeTypes: string[] = [];

  if (druidLevel >= 5) {
    if (druidLevel >= 20) wildShapeUsesMax = 6;
    else if (druidLevel >= 18) wildShapeUsesMax = 6;
    else if (druidLevel >= 14) wildShapeUsesMax = 5;
    else if (druidLevel >= 10) wildShapeUsesMax = 4;
    else if (druidLevel >= 8) wildShapeUsesMax = 3;
    else if (druidLevel >= 6) wildShapeUsesMax = 2;
    else wildShapeUsesMax = 1;

    wildShapeTypes.push('Small / Medium Animal');
    if (druidLevel >= 8) wildShapeTypes.push('Large Animal');
    if (druidLevel >= 11) wildShapeTypes.push('Tiny Animal');
    if (druidLevel >= 12) wildShapeTypes.push('Plant');
    if (druidLevel >= 15) wildShapeTypes.push('Huge Animal');
    if (druidLevel >= 16) wildShapeTypes.push('Huge / Large / Med / Small Elemental');
  }

  return {
    isEligible,
    druidLevel,
    wildEmpathyBonus,
    woodlandStride: druidLevel >= 2,
    tracklessStep: druidLevel >= 3,
    resistNaturesLure: druidLevel >= 4,
    venomImmunity: druidLevel >= 9,
    thousandFaces: druidLevel >= 13,
    timelessBody: druidLevel >= 15,
    wildShapeUsesMax,
    wildShapeTypes
  };
}

// ============================================================================
// 9. CLERIC DOMAIN & DIVINE SUITE ENGINE (PHB p. 30 / SRD)
// ============================================================================

export interface Dnd35eClericDomainInfo {
  name: string;
  grantedPower: string;
  domainSpells: string[];
}

export const OFFICIAL_35E_CLERIC_DOMAINS: Record<string, Dnd35eClericDomainInfo> = {
  Air: {
    name: 'Air',
    grantedPower: 'Turn or destroy earth creatures as a good cleric turns undead. Rebuke or command air creatures. 3 + Cha mod uses/day.',
    domainSpells: ['Obscuring Mist', 'Wind Wall', 'Gaseous Form', 'Air Walk', 'Control Winds', 'Chain Lightning', 'Control Weather', 'Whirlwind', 'Elemental Swarm (Air only)']
  },
  Animal: {
    name: 'Animal',
    grantedPower: 'You gain the knowledge (nature) skill as a class skill. Cast speak with animals 1/day as a spell-like ability.',
    domainSpells: ['Calm Animals', 'Hold Animal', 'Dominate Animal', 'Summon Nature\'s Ally IV', 'Commune with Nature', 'Antilife Shell', 'Animal Shapes', 'Summon Nature\'s Ally VIII', 'Shapechange']
  },
  Chaos: {
    name: 'Chaos',
    grantedPower: 'Cast chaos spells at +1 caster level.',
    domainSpells: ['Protection from Law', 'Shatter', 'Magic Circle against Law', 'Chaos Hammer', 'Dispel Law', 'Animate Objects', 'Word of Chaos', 'Cloak of Chaos', 'Summon Monster IX (Chaos only)']
  },
  Death: {
    name: 'Death',
    grantedPower: 'You may use a death touch once per day (melee touch attack; roll 1d6/cleric level vs subject\'s current HP).',
    domainSpells: ['Cause Fear', 'Death Knell', 'Animate Dead', 'Death Ward', 'Slay Living', 'Create Undead', 'Destruction', 'Create Greater Undead', 'Wail of the Banshee']
  },
  Destruction: {
    name: 'Destruction',
    grantedPower: 'You gain the smite power (1/day; +4 on attack roll and +1 damage/cleric level).',
    domainSpells: ['Inflict Light Wounds', 'Shatter', 'Contagion', 'Inflict Critical Wounds', 'Flame Strike', 'Harm', 'Disintegrate', 'Earthquake', 'Implosion']
  },
  Earth: {
    name: 'Earth',
    grantedPower: 'Turn or destroy air creatures as a good cleric turns undead. Rebuke or command earth creatures. 3 + Cha mod uses/day.',
    domainSpells: ['Magic Stone', 'Soften Earth and Stone', 'Stone Shape', 'Spike Stones', 'Wall of Stone', 'Stoneskin', 'Earthquake', 'Iron Body', 'Elemental Swarm (Earth only)']
  },
  Evil: {
    name: 'Evil',
    grantedPower: 'Cast evil spells at +1 caster level.',
    domainSpells: ['Protection from Good', 'Desecrate', 'Magic Circle against Good', 'Unholy Blight', 'Dispel Good', 'Create Undead', 'Blasphemy', 'Unholy Aura', 'Summon Monster IX (Evil only)']
  },
  Fire: {
    name: 'Fire',
    grantedPower: 'Turn or destroy water creatures as a good cleric turns undead. Rebuke or command fire creatures. 3 + Cha mod uses/day.',
    domainSpells: ['Burning Hands', 'Produce Flame', 'Resist Energy (Fire only)', 'Wall of Fire', 'Fire Shield', 'Fire Seeds', 'Fire Storm', 'Incendiary Cloud', 'Elemental Swarm (Fire only)']
  },
  Good: {
    name: 'Good',
    grantedPower: 'Cast good spells at +1 caster level.',
    domainSpells: ['Protection from Evil', 'Aid', 'Magic Circle against Evil', 'Holy Smite', 'Dispel Evil', 'Blade Barrier', 'Holy Word', 'Holy Aura', 'Summon Monster IX (Good only)']
  },
  Healing: {
    name: 'Healing',
    grantedPower: 'Cast healing spells at +1 caster level.',
    domainSpells: ['Cure Light Wounds', 'Cure Moderate Wounds', 'Cure Serious Wounds', 'Cure Critical Wounds', 'Mass Cure Light Wounds', 'Heal', 'Regenerate', 'Mass Cure Critical Wounds', 'Mass Heal']
  },
  Knowledge: {
    name: 'Knowledge',
    grantedPower: 'All Knowledge skills are class skills. Cast divinations at +1 caster level.',
    domainSpells: ['Detect Secret Doors', 'Detect Thoughts', 'Clairaudience/Clairvoyance', 'Divination', 'True Seeing', 'Find the Path', 'Legend Lore', 'Discern Location', 'Foresight']
  },
  Law: {
    name: 'Law',
    grantedPower: 'Cast law spells at +1 caster level.',
    domainSpells: ['Protection from Chaos', 'Calm Emotions', 'Magic Circle against Chaos', 'Order\'s Wrath', 'Dispel Chaos', 'Hold Monster', 'Dictum', 'Shield of Law', 'Summon Monster IX (Law only)']
  },
  Luck: {
    name: 'Luck',
    grantedPower: 'You gain the power of good fortune (reroll one roll you have made 1/day before success/failure declared).',
    domainSpells: ['Entropic Shield', 'Aid', 'Protection from Energy', 'Freedom of Movement', 'Break Enchantment', 'Mislead', 'Spell Turning', 'Moment of Prescience', 'Miracle']
  },
  Magic: {
    name: 'Magic',
    grantedPower: 'Use scrolls, wands, and other devices with spell completion or spell trigger activation as a wizard of 1/2 your cleric level.',
    domainSpells: ['Nystul\'s Magic Aura', 'Identify', 'Dispel Magic', 'Imbue with Spell Ability', 'Spell Resistance', 'Antimagic Field', 'Spell Turning', 'Protection from Spells', 'Mage\'s Disjunction']
  },
  Protection: {
    name: 'Protection',
    grantedPower: 'Generate a protective ward (grant someone touched a resistance bonus on next save equal to cleric level, 1/day).',
    domainSpells: ['Sanctuary', 'Shield Other', 'Protection from Energy', 'Spell Immunity', 'Spell Resistance', 'Antimagic Field', 'Repulsion', 'Mind Blank', 'Prismatic Sphere']
  },
  Strength: {
    name: 'Strength',
    grantedPower: 'Perform a feat of strength (grant yourself an enhancement bonus to Strength equal to cleric level for 1 round, 1/day).',
    domainSpells: ['Enlarge Person', 'Bull\'s Strength', 'Magic Vestment', 'Spell Immunity', 'Righteous Might', 'Stoneskin', 'Grasping Hand', 'Clenched Fist', 'Crushing Hand']
  },
  Sun: {
    name: 'Sun',
    grantedPower: 'Perform a greater turning once per day in place of a regular turning. Undead that would be turned are destroyed.',
    domainSpells: ['Endure Elements', 'Heat Metal', 'Searing Light', 'Fire Shield', 'Flame Strike', 'Fire Seeds', 'Sunbeam', 'Sunburst', 'Prismatic Sphere']
  },
  Travel: {
    name: 'Travel',
    grantedPower: 'Survival is a class skill. Freedom of movement for a number of rounds per day equal to your cleric level.',
    domainSpells: ['Longstrider', 'Locate Object', 'Fly', 'Dimension Door', 'Teleport', 'Find the Path', 'Greater Teleport', 'Phase Door', 'Astral Projection']
  },
  Trickery: {
    name: 'Trickery',
    grantedPower: 'Bluff, Disguise, and Hide are class skills.',
    domainSpells: ['Disguise Self', 'Invisibility', 'Nondetection', 'Confusion', 'False Vision', 'Mislead', 'Screen', 'Polymorph Any Object', 'Time Stop']
  },
  War: {
    name: 'War',
    grantedPower: 'Free Martial Weapon Proficiency and Weapon Focus with your deity\'s favored weapon.',
    domainSpells: ['Magic Weapon', 'Spiritual Weapon', 'Magic Vestment', 'Divine Power', 'Flame Strike', 'Blade Barrier', 'Power Word Blind', 'Power Word Stun', 'Power Word Kill']
  },
  Water: {
    name: 'Water',
    grantedPower: 'Turn or destroy fire creatures as a good cleric turns undead. Rebuke or command water creatures. 3 + Cha mod uses/day.',
    domainSpells: ['Obscuring Mist', 'Fog Cloud', 'Water Breathing', 'Control Water', 'Ice Storm', 'Cone of Cold', 'Acid Fog', 'Horrid Wilting', 'Elemental Swarm (Water only)']
  }
};

export interface Dnd35eClericBreakdown {
  isEligible: boolean;
  clericLevel: number;
  domain1?: string;
  domain2?: string;
  domain1Info?: Dnd35eClericDomainInfo;
  domain2Info?: Dnd35eClericDomainInfo;
  spontaneousCastingMode: 'cure' | 'inflict';
  turnUndeadUsesMax: number;
  alignmentAura: string;
}

export function calculate35eClericStats(char: CharacterData): Dnd35eClericBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isCleric = cls.includes('cleric');
  const secIsCleric = sec.includes('cleric');

  const clericLevel = isCleric
    ? (char.level || 1)
    : secIsCleric
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = clericLevel > 0;
  const abilities = getEffectiveAbilities(char);
  const chaMod = getAbilityModifier(abilities.CHA?.score || 10);

  const domain1 = char.clericData35e?.domain1;
  const domain2 = char.clericData35e?.domain2;

  const spontaneousCastingMode = char.clericData35e?.spontaneousCastingMode || 'cure';
  const turnUndeadUsesMax = Math.max(0, 3 + chaMod);
  const alignmentAura = char.clericData35e?.alignmentAura || char.alignment || 'Neutral';

  return {
    isEligible,
    clericLevel,
    domain1,
    domain2,
    domain1Info: domain1 ? OFFICIAL_35E_CLERIC_DOMAINS[domain1] : undefined,
    domain2Info: domain2 ? OFFICIAL_35E_CLERIC_DOMAINS[domain2] : undefined,
    spontaneousCastingMode,
    turnUndeadUsesMax,
    alignmentAura
  };
}

// ============================================================================
// 10. OFFICIAL 3.5e MAGIC ITEM BODY SLOTS ENGINE (DMG p. 214)
// ============================================================================

export interface Dnd35eBodySlotDefinition {
  key: string;
  name: string;
  description: string;
  examples: string[];
}

export const OFFICIAL_35E_BODY_SLOTS: Dnd35eBodySlotDefinition[] = [
  { key: 'head', name: 'Head', description: 'Headband, hat, helmet, or phylactery', examples: ['Headband of Intellect', 'Helm of Telepathy', 'Phylactery of Faithfulness'] },
  { key: 'eyes', name: 'Eyes', description: 'Eye lenses, goggles, or spectacles', examples: ['Goggles of Night', 'Eyes of Charming', 'Eyes of the Eagle'] },
  { key: 'neck', name: 'Neck', description: 'Amulet, brooch, medallion, necklace, periapt, or scarab', examples: ['Amulet of Natural Armor', 'Periapt of Wisdom', 'Brooch of Shielding'] },
  { key: 'vest', name: 'Vest / Vestment', description: 'Vest, vestment, or shirt', examples: ['Vest of Escape', 'Shirt of Demon Armor'] },
  { key: 'armor', name: 'Robe / Armor', description: 'Robe or suit of armor', examples: ['Robe of the Archmagi', 'Full Plate +1', 'Chain Shirt'] },
  { key: 'shoulders', name: 'Shoulders', description: 'Cloak, cape, or mantle', examples: ['Cloak of Resistance', 'Cloak of Charisma', 'Mantle of Faith'] },
  { key: 'wrists', name: 'Wrists', description: 'Bracers or bracelets', examples: ['Bracers of Armor', 'Bracers of Archery'] },
  { key: 'hands', name: 'Hands', description: 'Gloves or gauntlets', examples: ['Gauntlets of Ogre Power', 'Gloves of Dexterity'] },
  { key: 'ring1', name: 'Ring 1', description: 'First finger ring', examples: ['Ring of Protection', 'Ring of Sustenance'] },
  { key: 'ring2', name: 'Ring 2', description: 'Second finger ring', examples: ['Ring of Feather Falling', 'Ring of Invisibility'] },
  { key: 'waist', name: 'Waist', description: 'Girdle, belt, or sash', examples: ['Belt of Giant Strength', 'Monk\'s Belt'] },
  { key: 'feet', name: 'Feet', description: 'Boots, shoes, or slippers', examples: ['Boots of Speed', 'Boots of Striding and Springing', 'Winged Boots'] },
  { key: 'shield', name: 'Shield / Off-Hand', description: 'Shield or carried off-hand item', examples: ['Heavy Steel Shield', 'Buckler'] }
];

export interface Dnd35eBodySlotOccupant {
  slot: Dnd35eBodySlotDefinition;
  equippedItem?: GearItem;
  conflictingItems: GearItem[];
}

export function calculate35eBodySlotUsage(char: CharacterData): {
  slots: Dnd35eBodySlotOccupant[];
  totalEquippedCount: number;
  hasConflicts: boolean;
} {
  const inventory = char.inventory || [];
  const equippedItems = inventory.filter(i => i.equipped && !i.stored);

  const mapItemToSlotKey = (item: GearItem): string => {
    const rawSlot = (item.slot || item.itemType || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (rawSlot.includes('head') || rawSlot.includes('helm') || name.includes('helm') || name.includes('headband') || name.includes('hat') || name.includes('circlet')) {
      return 'head';
    }
    if (rawSlot.includes('eye') || name.includes('goggle') || name.includes('lens') || name.includes('eyes of')) {
      return 'eyes';
    }
    if (rawSlot.includes('neck') || rawSlot.includes('amulet') || name.includes('amulet') || name.includes('necklace') || name.includes('periapt') || name.includes('brooch')) {
      return 'neck';
    }
    if (rawSlot.includes('vest') || rawSlot.includes('shirt') || name.includes('vest') || name.includes('shirt')) {
      return 'vest';
    }
    if (rawSlot.includes('armor') || rawSlot.includes('robe') || name.includes('robe') || item.armorAc !== undefined || item.armorType) {
      if (item.armorType === 'Shield' || rawSlot.includes('shield') || name.includes('shield')) {
        return 'shield';
      }
      return 'armor';
    }
    if (rawSlot.includes('cloak') || rawSlot.includes('cape') || rawSlot.includes('shoulder') || name.includes('cloak') || name.includes('cape') || name.includes('mantle')) {
      return 'shoulders';
    }
    if (rawSlot.includes('wrist') || rawSlot.includes('bracer') || name.includes('bracer') || name.includes('bracelet')) {
      return 'wrists';
    }
    if (rawSlot.includes('glove') || rawSlot.includes('hand') || name.includes('glove') || name.includes('gauntlet')) {
      if (rawSlot === 'main hand' || rawSlot === 'two-handed') return 'main hand';
      return 'hands';
    }
    if (rawSlot.includes('ring') || name.includes('ring of')) {
      return 'ring';
    }
    if (rawSlot.includes('belt') || rawSlot.includes('waist') || name.includes('belt') || name.includes('girdle') || name.includes('sash')) {
      return 'waist';
    }
    if (rawSlot.includes('boot') || rawSlot.includes('foot') || rawSlot.includes('feet') || name.includes('boot') || name.includes('shoe') || name.includes('slipper')) {
      return 'feet';
    }
    if (rawSlot.includes('shield') || name.includes('shield')) {
      return 'shield';
    }
    return 'misc';
  };

  const slotItemsMap: Record<string, GearItem[]> = {};
  for (const s of OFFICIAL_35E_BODY_SLOTS) {
    slotItemsMap[s.key] = [];
  }
  slotItemsMap['ring'] = [];

  for (const item of equippedItems) {
    const key = mapItemToSlotKey(item);
    if (key === 'ring') {
      slotItemsMap['ring'].push(item);
    } else if (slotItemsMap[key]) {
      slotItemsMap[key].push(item);
    }
  }

  // Handle ring1 and ring2 distribution
  const rings = slotItemsMap['ring'] || [];
  if (rings.length > 0) slotItemsMap['ring1'] = [rings[0]];
  if (rings.length > 1) slotItemsMap['ring2'] = [rings[1]];
  if (rings.length > 2) {
    // Conflict on ring2
    slotItemsMap['ring2'] = rings.slice(1);
  }

  let hasConflicts = false;
  const slots: Dnd35eBodySlotOccupant[] = OFFICIAL_35E_BODY_SLOTS.map(def => {
    const items = slotItemsMap[def.key] || [];
    const isConflict = items.length > 1;
    if (isConflict) hasConflicts = true;

    return {
      slot: def,
      equippedItem: items[0],
      conflictingItems: items.slice(1)
    };
  });

  return {
    slots,
    totalEquippedCount: equippedItems.length,
    hasConflicts
  };
}

// ============================================================================
// 11. FIGHTER MARTIAL PROGRESSION & BONUS FEAT ENGINE (PHB p. 37-39)
// ============================================================================

export interface Dnd35eFighterBreakdown {
  isEligible: boolean;
  fighterLevel: number;
  bonusFeatsMax: number;
  bonusFeatsChosen: string[];
  canTakeWeaponSpecialization: boolean; // Level 4+
  canTakeGreaterWeaponFocus: boolean; // Level 8+
  canTakeGreaterWeaponSpecialization: boolean; // Level 12+
  weaponSpecializations: Array<{
    weaponName: string;
    hasWeaponFocus?: boolean;
    hasWeaponSpecialization?: boolean;
    hasGreaterWeaponFocus?: boolean;
    hasGreaterWeaponSpecialization?: boolean;
    totalAttackBonus: number;
    totalDamageBonus: number;
  }>;
}

export const OFFICIAL_35E_FIGHTER_BONUS_FEATS: Array<{
  name: string;
  prereq: string;
  benefit: string;
  levelReq?: number;
}> = [
  { name: 'Blind-Fight', prereq: 'None', benefit: 'Reroll miss chance for concealment in melee; invisible attackers get no bonus.' },
  { name: 'Combat Expertise', prereq: 'Int 13', benefit: 'Trade attack bonus for AC bonus (up to -5 attack for +5 dodge AC).' },
  { name: 'Improved Disarm', prereq: 'Int 13, Combat Expertise', benefit: '+4 bonus on disarm attempts; do not provoke attack of opportunity.' },
  { name: 'Improved Feint', prereq: 'Int 13, Combat Expertise', benefit: 'Feint in combat as a move action rather than a standard action.' },
  { name: 'Improved Trip', prereq: 'Int 13, Combat Expertise', benefit: '+4 bonus on trip attempts; free melee attack immediately upon successful trip.' },
  { name: 'Whirlwind Attack', prereq: 'Dex 13, Int 13, Combat Expertise, Dodge, Mobility, Spring Attack, BAB +4', benefit: 'Make one melee attack against each opponent within reach as a full attack action.' },
  { name: 'Combat Reflexes', prereq: 'None', benefit: 'Make additional attacks of opportunity equal to Dex modifier; make AoOs while flat-footed.' },
  { name: 'Dodge', prereq: 'Dex 13', benefit: '+1 dodge bonus to AC against designated opponent during your action.' },
  { name: 'Mobility', prereq: 'Dex 13, Dodge', benefit: '+4 dodge bonus to AC against attacks of opportunity provoked by moving.' },
  { name: 'Spring Attack', prereq: 'Dex 13, Dodge, Mobility, BAB +4', benefit: 'Move before and after a single melee attack without provoking AoO from target.' },
  { name: 'Exotic Weapon Proficiency', prereq: 'BAB +1', benefit: 'Use one exotic weapon without -4 non-proficiency penalty.' },
  { name: 'Improved Critical', prereq: 'Proficient with weapon, BAB +8', benefit: 'Double the threat range of selected weapon (e.g. 19-20 becomes 17-20).' },
  { name: 'Improved Initiative', prereq: 'None', benefit: '+4 bonus on initiative checks.' },
  { name: 'Improved Shield Bash', prereq: 'Shield Proficiency', benefit: 'Retain shield AC bonus when making a shield bash attack.' },
  { name: 'Improved Unarmed Strike', prereq: 'None', benefit: 'Unarmed strikes deal lethal damage and provoke no attacks of opportunity.' },
  { name: 'Deflect Arrows', prereq: 'Dex 13, Improved Unarmed Strike', benefit: 'Deflect one ranged weapon attack per round with a free hand.' },
  { name: 'Improved Grapple', prereq: 'Dex 13, Improved Unarmed Strike', benefit: '+4 bonus on grapple checks; provoke no attack of opportunity when starting grapple.' },
  { name: 'Mounted Combat', prereq: 'Ride 1 rank', benefit: 'Once per round, negate hit on mount with opposed Ride check.' },
  { name: 'Mounted Archery', prereq: 'Ride 1 rank, Mounted Combat', benefit: 'Halve penalty for using ranged weapons while mounted.' },
  { name: 'Ride-By Attack', prereq: 'Ride 1 rank, Mounted Combat', benefit: 'Move before and after a charge attack while mounted.' },
  { name: 'Spirited Charge', prereq: 'Ride 1 rank, Mounted Combat, Ride-By Attack', benefit: 'Deal double damage with melee weapon on mounted charge (triple with lance).' },
  { name: 'Trample', prereq: 'Ride 1 rank, Mounted Combat', benefit: 'Mount can overrun opponents, dealing hoof damage if opponent is knocked prone.' },
  { name: 'Point Blank Shot', prereq: 'None', benefit: '+1 bonus on attack and damage rolls with ranged weapons up to 30 feet.' },
  { name: 'Far Shot', prereq: 'Point Blank Shot', benefit: 'Increase range increments by 50% for projectile weapons, 100% for thrown weapons.' },
  { name: 'Precise Shot', prereq: 'Point Blank Shot', benefit: 'No -4 penalty for shooting or throwing ranged weapons at opponents engaged in melee.' },
  { name: 'Rapid Shot', prereq: 'Dex 13, Point Blank Shot', benefit: 'One extra ranged attack per round during full attack; all attacks at -2 penalty.' },
  { name: 'Manyshot', prereq: 'Dex 17, Point Blank Shot, Rapid Shot, BAB +6', benefit: 'Fire two or more arrows simultaneously at single target within 30 ft as standard action.' },
  { name: 'Shot on the Run', prereq: 'Dex 13, Point Blank Shot, Dodge, Mobility, BAB +4', benefit: 'Move before and after making a single ranged attack.' },
  { name: 'Improved Precise Shot', prereq: 'Dex 19, Point Blank Shot, Precise Shot, BAB +11', benefit: 'Ignore less than total cover and less than total concealment on ranged attacks.' },
  { name: 'Power Attack', prereq: 'Str 13', benefit: 'Trade attack bonus for melee damage (+1 damage per -1 attack, or +2 with two-handed weapon).' },
  { name: 'Cleave', prereq: 'Str 13, Power Attack', benefit: 'Immediate extra melee attack against adjacent foe when dropping an opponent to 0 HP.' },
  { name: 'Great Cleave', prereq: 'Str 13, Power Attack, Cleave, BAB +4', benefit: 'No limit to number of Cleave attacks per round.' },
  { name: 'Improved Bull Rush', prereq: 'Str 13, Power Attack', benefit: '+4 bonus on bull rush checks; provoke no attack of opportunity.' },
  { name: 'Improved Overrun', prereq: 'Str 13, Power Attack', benefit: '+4 bonus on overrun checks; opponent cannot choose to avoid you; free trip if knocked down.' },
  { name: 'Improved Sunder', prereq: 'Str 13, Power Attack', benefit: '+4 bonus on strike against an object; provoke no attack of opportunity.' },
  { name: 'Quick Draw', prereq: 'BAB +1', benefit: 'Draw a weapon as a free action instead of a move action.' },
  { name: 'Rapid Reload', prereq: 'Weapon Proficiency (crossbow)', benefit: 'Reload light crossbow as free action, heavy crossbow as move action.' },
  { name: 'Two-Weapon Fighting', prereq: 'Dex 15', benefit: 'Reduce dual-wielding penalties to -2/-2 (with light offhand weapon).' },
  { name: 'Two-Weapon Defense', prereq: 'Dex 15, Two-Weapon Fighting', benefit: '+1 shield bonus to AC when wielding two weapons or double weapon.' },
  { name: 'Improved Two-Weapon Fighting', prereq: 'Dex 17, Two-Weapon Fighting, BAB +6', benefit: 'Gain a second off-hand attack at a -5 penalty during full attack.' },
  { name: 'Greater Two-Weapon Fighting', prereq: 'Dex 19, Improved TWF, BAB +11', benefit: 'Gain a third off-hand attack at a -10 penalty during full attack.' },
  { name: 'Weapon Finesse', prereq: 'BAB +1', benefit: 'Use Dex modifier instead of Str modifier on attack rolls with light weapons, rapier, whip, or spiked chain.' },
  { name: 'Weapon Focus', prereq: 'Proficiency with weapon, BAB +1', benefit: '+1 bonus on all attack rolls with the selected weapon.' },
  { name: 'Weapon Specialization', prereq: 'Fighter level 4th, Weapon Focus', benefit: '+2 bonus on all damage rolls with the selected weapon (Fighter exclusive).', levelReq: 4 },
  { name: 'Greater Weapon Focus', prereq: 'Fighter level 8th, Weapon Focus', benefit: '+1 bonus on all attack rolls with selected weapon (+2 total with Weapon Focus).', levelReq: 8 },
  { name: 'Greater Weapon Specialization', prereq: 'Fighter level 12th, Greater Weapon Focus, Weapon Specialization', benefit: '+2 bonus on damage rolls with selected weapon (+4 total with Weapon Specialization).', levelReq: 12 }
];

export function calculate35eFighterStats(char: CharacterData): Dnd35eFighterBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isFtr = cls.includes('fighter');
  const secIsFtr = sec.includes('fighter');

  const fighterLevel = isFtr
    ? (char.level || 1)
    : secIsFtr
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = fighterLevel > 0;

  // Bonus feat progression: 1 at 1st, 2 at 2nd, 3 at 4th, 4 at 6th, etc.
  let bonusFeatsMax = 0;
  if (fighterLevel >= 1) {
    bonusFeatsMax = 1 + Math.floor(fighterLevel / 2);
  }

  const bonusFeatsChosen = char.fighterData35e?.bonusFeatsChosen || [];
  const rawSpecs = char.fighterData35e?.weaponSpecializations || [];

  const weaponSpecializations = rawSpecs.map(ws => {
    let totalAttackBonus = 0;
    let totalDamageBonus = 0;
    if (ws.hasWeaponFocus) totalAttackBonus += 1;
    if (ws.hasGreaterWeaponFocus) totalAttackBonus += 1;
    if (ws.hasWeaponSpecialization) totalDamageBonus += 2;
    if (ws.hasGreaterWeaponSpecialization) totalDamageBonus += 2;

    return {
      ...ws,
      totalAttackBonus,
      totalDamageBonus
    };
  });

  return {
    isEligible,
    fighterLevel,
    bonusFeatsMax,
    bonusFeatsChosen,
    canTakeWeaponSpecialization: fighterLevel >= 4,
    canTakeGreaterWeaponFocus: fighterLevel >= 8,
    canTakeGreaterWeaponSpecialization: fighterLevel >= 12,
    weaponSpecializations
  };
}

// ============================================================================
// 12. WIZARD ARCANE SPECIALIZATION & PROHIBITED SCHOOLS (PHB p. 57-58)
// ============================================================================

export interface Dnd35eWizardSpecializationInfo {
  school: string;
  name: string;
  description: string;
  prohibitedCountRequired: number; // 2 for standard schools, 1 for Divination, 0 for Universal
  allowedProhibitedSchools: string[];
}

export const OFFICIAL_35E_WIZARD_SCHOOLS: Record<string, Dnd35eWizardSpecializationInfo> = {
  Universal: {
    school: 'Universal',
    name: 'Universalist (Generalist)',
    description: 'No school specialization. Universal wizards study all schools equally, receive no bonus specialty slots, and have no prohibited schools.',
    prohibitedCountRequired: 0,
    allowedProhibitedSchools: []
  },
  Abjuration: {
    school: 'Abjuration',
    name: 'Abjuration (Abjurer)',
    description: 'Specialists in protective spells, magical wards, armor, dispelling, and banishment.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Conjuration', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
  },
  Conjuration: {
    school: 'Conjuration',
    name: 'Conjuration (Conjurer)',
    description: 'Specialists in summoning monsters and elementals, teleportation, calling extraplanar entities, and creating matter.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
  },
  Divination: {
    school: 'Divination',
    name: 'Divination (Diviner)',
    description: 'Specialists in foresight, detection, revealing secrets, and scrying. Requires only ONE prohibited school.',
    prohibitedCountRequired: 1,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
  },
  Enchantment: {
    school: 'Enchantment',
    name: 'Enchantment (Enchanter)',
    description: 'Specialists in charm, compulsion, mind manipulation, sleep, and emotional domination.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
  },
  Evocation: {
    school: 'Evocation',
    name: 'Evocation (Evoker)',
    description: 'Specialists in channeling raw elemental energy, fiery blasts, lightning, and force effects.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Enchantment', 'Illusion', 'Necromancy', 'Transmutation']
  },
  Illusion: {
    school: 'Illusion',
    name: 'Illusion (Illusionist)',
    description: 'Specialists in phantasms, glamers, shadow magic, and deceptive sensorial sensory manipulation.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Enchantment', 'Evocation', 'Necromancy', 'Transmutation']
  },
  Necromancy: {
    school: 'Necromancy',
    name: 'Necromancy (Necromancer)',
    description: 'Specialists in life energy, death magic, negative levels, curses, and commanding undead.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Enchantment', 'Evocation', 'Illusion', 'Transmutation']
  },
  Transmutation: {
    school: 'Transmutation',
    name: 'Transmutation (Transmuter)',
    description: 'Specialists in physical alteration, polymorph, buffs, levitation, and matter restructuring.',
    prohibitedCountRequired: 2,
    allowedProhibitedSchools: ['Abjuration', 'Conjuration', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy']
  }
};

export interface Dnd35eWizardBreakdown {
  isEligible: boolean;
  wizardLevel: number;
  specialization: string;
  isSpecialist: boolean;
  prohibitedSchools: string[];
  bonusSpellSlotPerLevel: number; // +1 slot for levels 1-9
  hasValidProhibitedSelection: boolean;
  specializationInfo: Dnd35eWizardSpecializationInfo;
}

export function calculate35eWizardSpecializationStats(char: CharacterData): Dnd35eWizardBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isWiz = cls.includes('wizard');
  const secIsWiz = sec.includes('wizard');

  const wizardLevel = isWiz
    ? (char.level || 1)
    : secIsWiz
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = wizardLevel > 0;
  const specKey = char.wizardSchool35e?.specialization || 'Universal';
  const specializationInfo = OFFICIAL_35E_WIZARD_SCHOOLS[specKey] || OFFICIAL_35E_WIZARD_SCHOOLS['Universal'];

  const isSpecialist = specKey !== 'Universal';
  const prohibitedSchools = char.wizardSchool35e?.prohibitedSchools || [];

  const hasValidProhibitedSelection =
    !isSpecialist || prohibitedSchools.length === specializationInfo.prohibitedCountRequired;

  return {
    isEligible,
    wizardLevel,
    specialization: specKey,
    isSpecialist,
    prohibitedSchools,
    bonusSpellSlotPerLevel: isSpecialist ? 1 : 0,
    hasValidProhibitedSelection,
    specializationInfo
  };
}

// ============================================================================
// 13. SORCERER & WIZARD ARCANE FAMILIAR ENGINE (PHB p. 52-53)
// ============================================================================

export interface Dnd35eFamiliarPreset {
  type: string;
  name: string;
  size: string;
  masterPerk: string;
  specialQualities: string;
  baseHp: number;
  baseAc: number;
  baseAttack: string;
  baseSaves: string;
}

export const OFFICIAL_35E_FAMILIARS: Record<string, Dnd35eFamiliarPreset> = {
  bat: {
    type: 'bat',
    name: 'Bat',
    size: 'Diminutive',
    masterPerk: '+3 bonus on Listen checks',
    specialQualities: 'Blindsight 20 ft., low-light vision, fly 40 ft. (good)',
    baseHp: 1,
    baseAc: 16,
    baseAttack: 'None',
    baseSaves: 'Fort +2, Ref +4, Will +2'
  },
  cat: {
    type: 'cat',
    name: 'Cat',
    size: 'Tiny',
    masterPerk: '+3 bonus on Move Silently checks',
    specialQualities: 'Low-light vision, scent, +4 Hide/Move Silently, +8 Balance/Climb',
    baseHp: 2,
    baseAc: 14,
    baseAttack: '2 Claws +4 melee (1d2-4), Bite -1 melee (1d3-4)',
    baseSaves: 'Fort +2, Ref +4, Will +1'
  },
  hawk: {
    type: 'hawk',
    name: 'Hawk',
    size: 'Tiny',
    masterPerk: '+3 bonus on Spot checks in bright light',
    specialQualities: 'Low-light vision, fly 60 ft. (average), +8 Spot in daylight',
    baseHp: 3,
    baseAc: 17,
    baseAttack: 'Talons +5 melee (1d4-2)',
    baseSaves: 'Fort +2, Ref +5, Will +2'
  },
  lizard: {
    type: 'lizard',
    name: 'Lizard',
    size: 'Tiny',
    masterPerk: '+3 bonus on Climb checks',
    specialQualities: 'Low-light vision, climb 15 ft., +8 Climb checks',
    baseHp: 2,
    baseAc: 15,
    baseAttack: 'Bite +4 melee (1d4-4)',
    baseSaves: 'Fort +2, Ref +4, Will +1'
  },
  owl: {
    type: 'owl',
    name: 'Owl',
    size: 'Tiny',
    masterPerk: '+3 bonus on Spot checks in shadowy/dim light',
    specialQualities: 'Low-light vision, fly 40 ft. (average), +8 Spot in shadows, +8 Move Silently in flight',
    baseHp: 3,
    baseAc: 17,
    baseAttack: 'Talons +5 melee (1d4-2)',
    baseSaves: 'Fort +2, Ref +5, Will +2'
  },
  rat: {
    type: 'rat',
    name: 'Rat',
    size: 'Tiny',
    masterPerk: '+2 bonus on Fortitude saves',
    specialQualities: 'Low-light vision, scent, climb 15 ft., swim 15 ft., +8 Climb/Swim',
    baseHp: 2,
    baseAc: 14,
    baseAttack: 'Bite +4 melee (1d3-4)',
    baseSaves: 'Fort +2, Ref +4, Will +1'
  },
  raven: {
    type: 'raven',
    name: 'Raven',
    size: 'Tiny',
    masterPerk: '+3 bonus on Appraise checks; Speaks one language of master\'s choice',
    specialQualities: 'Low-light vision, fly 40 ft. (poor), speech capability',
    baseHp: 3,
    baseAc: 14,
    baseAttack: 'Claws +4 melee (1d2-5)',
    baseSaves: 'Fort +2, Ref +4, Will +2'
  },
  snake: {
    type: 'snake',
    name: 'Snake (Tiny Viper)',
    size: 'Tiny',
    masterPerk: '+3 bonus on Bluff checks',
    specialQualities: 'Scent, climb 15 ft., swim 15 ft., poison bite (DC 10, 1d6 Con / 1d6 Con)',
    baseHp: 1,
    baseAc: 17,
    baseAttack: 'Bite +5 melee (1 plus poison)',
    baseSaves: 'Fort +2, Ref +5, Will +1'
  },
  toad: {
    type: 'toad',
    name: 'Toad',
    size: 'Diminutive',
    masterPerk: '+3 bonus to Master\'s Maximum Hit Points',
    specialQualities: 'Low-light vision, +4 Hide checks',
    baseHp: 1,
    baseAc: 15,
    baseAttack: 'None',
    baseSaves: 'Fort +2, Ref +4, Will +1'
  },
  weasel: {
    type: 'weasel',
    name: 'Weasel',
    size: 'Tiny',
    masterPerk: '+2 bonus on Reflex saves',
    specialQualities: 'Low-light vision, scent, attach, blood drain',
    baseHp: 2,
    baseAc: 14,
    baseAttack: 'Bite +4 melee (1d3-4)',
    baseSaves: 'Fort +2, Ref +4, Will +1'
  }
};

export interface Dnd35eFamiliarBreakdown {
  isEligible: boolean;
  masterLevel: number;
  familiarType?: string;
  familiarInfo?: Dnd35eFamiliarPreset;
  isSummoned: boolean;
  isWithinArmReach: boolean;
  familiarHpMax: number;
  currentHp: number;
  naturalArmorBonus: number;
  intScore: number;
  alertnessActive: boolean;
  specialAbilities: string[];
}

export function calculate35eFamiliarMasterStats(char: CharacterData): Dnd35eFamiliarBreakdown {
  const cls = (char.characterClass || '').toLowerCase();
  const sec = (char.optionalRules?.secondaryClass || '').toLowerCase();

  const isWizOrSorc = cls.includes('wizard') || cls.includes('sorcerer');
  const secIsWizOrSorc = sec.includes('wizard') || sec.includes('sorcerer');

  const masterLevel = isWizOrSorc
    ? (char.level || 1)
    : secIsWizOrSorc
    ? (char.optionalRules?.secondaryLevel || 1)
    : 0;

  const isEligible = masterLevel > 0;
  const famData = char.familiarData35e;
  const familiarType = famData?.familiarType || 'cat';
  const familiarInfo = OFFICIAL_35E_FAMILIARS[familiarType] || OFFICIAL_35E_FAMILIARS['cat'];

  const isSummoned = famData?.isSummoned ?? false;
  const isWithinArmReach = famData?.isWithinArmReach ?? true;

  // Master max HP / 2
  const masterBaseHp = char.hpMax || 10;
  const familiarHpMax = Math.max(1, Math.floor(masterBaseHp / 2));
  const currentHp = famData?.currentHp !== undefined ? famData.currentHp : familiarHpMax;

  // Familiar level scaling (PHB Table 3-19)
  let naturalArmorBonus = 1;
  let intScore = 6;
  const specialAbilities: string[] = ['Alertness', 'Improved Evasion', 'Share Spells', 'Empathic Link'];

  if (masterLevel >= 3) { naturalArmorBonus = 2; intScore = 7; specialAbilities.push('Deliver Touch Spells'); }
  if (masterLevel >= 5) { naturalArmorBonus = 3; intScore = 8; specialAbilities.push('Speak with Master'); }
  if (masterLevel >= 7) { naturalArmorBonus = 4; intScore = 9; specialAbilities.push('Speak with Animals of Its Kind'); }
  if (masterLevel >= 9) { naturalArmorBonus = 5; intScore = 10; }
  if (masterLevel >= 11) { naturalArmorBonus = 6; intScore = 11; specialAbilities.push(`Spell Resistance (SR ${masterLevel + 5})`); }
  if (masterLevel >= 13) { naturalArmorBonus = 7; intScore = 12; specialAbilities.push('Scry on Familiar (1/day)'); }
  if (masterLevel >= 15) { naturalArmorBonus = 8; intScore = 13; }
  if (masterLevel >= 17) { naturalArmorBonus = 9; intScore = 14; }
  if (masterLevel >= 19) { naturalArmorBonus = 10; intScore = 15; }

  const alertnessActive = isSummoned && isWithinArmReach;

  return {
    isEligible,
    masterLevel,
    familiarType,
    familiarInfo,
    isSummoned,
    isWithinArmReach,
    familiarHpMax,
    currentHp,
    naturalArmorBonus,
    intScore,
    alertnessActive,
    specialAbilities
  };
}

