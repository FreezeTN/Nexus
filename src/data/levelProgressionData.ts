import { RuleEdition } from '../types';

export interface LevelProgressionEntry {
  level: number;
  totalXp: number;
  xpToNextLevel: number | null;
  relativePercentageIncrease: number | null;
  proficiencyBonus?: number;
  maxClassSkillRanks?: number;
  maxCrossClassSkillRanks?: number;
  hasAbilityIncrease?: boolean;
  hasFeat?: boolean;
  asiOrFeat?: boolean;
  notes: string;
}

export const DND_5E_LEVEL_TABLE: LevelProgressionEntry[] = [
  { level: 1,  totalXp: 0,      xpToNextLevel: 300,   relativePercentageIncrease: null,   proficiencyBonus: 2, asiOrFeat: false, notes: "1st-Level Features & Subclass/Domain" },
  { level: 2,  totalXp: 300,    xpToNextLevel: 600,   relativePercentageIncrease: 200.0,  proficiencyBonus: 2, asiOrFeat: false, notes: "Class Feature Unlocks (Action Surge, Cunning Action, etc.)" },
  { level: 3,  totalXp: 900,    xpToNextLevel: 1800,  relativePercentageIncrease: 300.0,  proficiencyBonus: 2, asiOrFeat: false, notes: "2nd-Level Spell Slots / Archetype Choice" },
  { level: 4,  totalXp: 2700,   xpToNextLevel: 3800,  relativePercentageIncrease: 211.1,  proficiencyBonus: 2, asiOrFeat: true,  notes: "Ability Score Improvement (+2 / +1+1) or Feat" },
  { level: 5,  totalXp: 6500,   xpToNextLevel: 7500,  relativePercentageIncrease: 197.4,  proficiencyBonus: 3, asiOrFeat: false, notes: "Proficiency Bonus +3, 3rd-Level Spells, Extra Attack" },
  { level: 6,  totalXp: 14000,  xpToNextLevel: 9000,  relativePercentageIncrease: 120.0,  proficiencyBonus: 3, asiOrFeat: false, notes: "Subclass Feature / Expertise (Rogue/Bard)" },
  { level: 7,  totalXp: 23000,  xpToNextLevel: 11000, relativePercentageIncrease: 122.2,  proficiencyBonus: 3, asiOrFeat: false, notes: "4th-Level Spell Slots / Evasion / Aura Improvements" },
  { level: 8,  totalXp: 34000,  xpToNextLevel: 14000, relativePercentageIncrease: 127.3,  proficiencyBonus: 3, asiOrFeat: true,  notes: "Ability Score Improvement (+2 / +1+1) or Feat" },
  { level: 9,  totalXp: 48000,  xpToNextLevel: 16000, relativePercentageIncrease: 114.3,  proficiencyBonus: 4, asiOrFeat: false, notes: "Proficiency Bonus +4, 5th-Level Spells" },
  { level: 10, totalXp: 64000,  xpToNextLevel: 21000, relativePercentageIncrease: 131.3,  proficiencyBonus: 4, asiOrFeat: false, notes: "Class/Subclass Capstone Feature / Magical Secrets" },
  { level: 11, totalXp: 85000,  xpToNextLevel: 15000, relativePercentageIncrease: 71.4,   proficiencyBonus: 4, asiOrFeat: false, notes: "Tier 3 Milestone, 6th-Level Spells, Extra Attack (2)" },
  { level: 12, totalXp: 100000, xpToNextLevel: 20000, relativePercentageIncrease: 133.3,  proficiencyBonus: 4, asiOrFeat: true,  notes: "Ability Score Improvement (+2 / +1+1) or Feat" },
  { level: 13, totalXp: 120000, xpToNextLevel: 20000, relativePercentageIncrease: 100.0,  proficiencyBonus: 5, asiOrFeat: false, notes: "Proficiency Bonus +5, 7th-Level Spells" },
  { level: 14, totalXp: 140000, xpToNextLevel: 25000, relativePercentageIncrease: 125.0,  proficiencyBonus: 5, asiOrFeat: false, notes: "Subclass Capstone Feature / Cleansing Touch" },
  { level: 15, totalXp: 165000, xpToNextLevel: 30000, relativePercentageIncrease: 120.0,  proficiencyBonus: 5, asiOrFeat: false, notes: "8th-Level Spells / Mind Blank" },
  { level: 16, totalXp: 195000, xpToNextLevel: 30000, relativePercentageIncrease: 100.0,  proficiencyBonus: 5, asiOrFeat: true,  notes: "Ability Score Improvement (+2 / +1+1) or Feat" },
  { level: 17, totalXp: 225000, xpToNextLevel: 40000, relativePercentageIncrease: 133.3,  proficiencyBonus: 6, asiOrFeat: false, notes: "Proficiency Bonus +6, 9th-Level Spells (Wish, Time Stop)" },
  { level: 18, totalXp: 265000, xpToNextLevel: 40000, relativePercentageIncrease: 100.0,  proficiencyBonus: 6, asiOrFeat: false, notes: "Class Capstone Aura / Elusive / Spell Mastery" },
  { level: 19, totalXp: 305000, xpToNextLevel: 50000, relativePercentageIncrease: 125.0,  proficiencyBonus: 6, asiOrFeat: true,  notes: "Ability Score Improvement (+2 / +1+1) or Feat" },
  { level: 20, totalXp: 355000, xpToNextLevel: null,  relativePercentageIncrease: null,   proficiencyBonus: 6, asiOrFeat: false, notes: "Level 20 Capstone / Epic Boon / Archdruid / Primal Champion" }
];

export const DND_35E_LEVEL_TABLE: LevelProgressionEntry[] = [
  { level: 1,  totalXp: 0,      xpToNextLevel: 1000,  relativePercentageIncrease: null,  maxClassSkillRanks: 4,  maxCrossClassSkillRanks: 2.0, hasFeat: true,  hasAbilityIncrease: false, notes: "1st-Level Feat, Class Features, Max Skill Ranks 4 (Cross-Class 2)" },
  { level: 2,  totalXp: 1000,   xpToNextLevel: 2000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 5,  maxCrossClassSkillRanks: 2.5, hasFeat: false, hasAbilityIncrease: false, notes: "Class Feature Unlocks (Evasion, Divine Grace, Uncanny Dodge, etc.)" },
  { level: 3,  totalXp: 3000,   xpToNextLevel: 3000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 6,  maxCrossClassSkillRanks: 3.0, hasFeat: true,  hasAbilityIncrease: false, notes: "3rd-Level Feat, 2nd-Level Spells / Class Features" },
  { level: 4,  totalXp: 6000,   xpToNextLevel: 4000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 7,  maxCrossClassSkillRanks: 3.5, hasFeat: false, hasAbilityIncrease: true,  notes: "+1 Ability Score Increase (Any 1 stat, no cap)" },
  { level: 5,  totalXp: 10000,  xpToNextLevel: 5000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 8,  maxCrossClassSkillRanks: 4.0, hasFeat: false, hasAbilityIncrease: false, notes: "3rd-Level Spells, Class Features (Wild Shape, Smite upgrade)" },
  { level: 6,  totalXp: 15000,  xpToNextLevel: 6000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 9,  maxCrossClassSkillRanks: 4.5, hasFeat: true,  hasAbilityIncrease: false, notes: "6th-Level Feat, First Iterative Attack (+6/+1 BAB for Full-BAB classes)" },
  { level: 7,  totalXp: 21000,  xpToNextLevel: 7000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 10, maxCrossClassSkillRanks: 5.0, hasFeat: false, hasAbilityIncrease: false, notes: "4th-Level Spells, Damage Reduction improvements" },
  { level: 8,  totalXp: 28000,  xpToNextLevel: 8000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 11, maxCrossClassSkillRanks: 5.5, hasFeat: false, hasAbilityIncrease: true,  notes: "+1 Ability Score Increase (Any 1 stat, no cap)" },
  { level: 9,  totalXp: 36000,  xpToNextLevel: 9000,  relativePercentageIncrease: 100.0, maxClassSkillRanks: 12, maxCrossClassSkillRanks: 6.0, hasFeat: true,  hasAbilityIncrease: false, notes: "9th-Level Feat, 5th-Level Spells" },
  { level: 10, totalXp: 45000,  xpToNextLevel: 10000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 13, maxCrossClassSkillRanks: 6.5, hasFeat: false, hasAbilityIncrease: false, notes: "Prestige Class Milestone / Energy Resistance upgrades" },
  { level: 11, totalXp: 55000,  xpToNextLevel: 11000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 14, maxCrossClassSkillRanks: 7.0, hasFeat: false, hasAbilityIncrease: false, notes: "6th-Level Spells, Second Iterative Attack (+11/+6/+1 for Full-BAB)" },
  { level: 12, totalXp: 66000,  xpToNextLevel: 12000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 15, maxCrossClassSkillRanks: 7.5, hasFeat: true,  hasAbilityIncrease: true,  notes: "12th-Level Feat AND +1 Ability Score Increase" },
  { level: 13, totalXp: 78000,  xpToNextLevel: 13000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 16, maxCrossClassSkillRanks: 8.0, hasFeat: false, hasAbilityIncrease: false, notes: "7th-Level Spells, High Tier Class Features" },
  { level: 14, totalXp: 91000,  xpToNextLevel: 14000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 17, maxCrossClassSkillRanks: 8.5, hasFeat: false, hasAbilityIncrease: false, notes: "Spell Resistance upgrades, Class Capstones" },
  { level: 15, totalXp: 105000, xpToNextLevel: 15000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 18, maxCrossClassSkillRanks: 9.0, hasFeat: true,  hasAbilityIncrease: false, notes: "15th-Level Feat, 8th-Level Spells" },
  { level: 16, totalXp: 120000, xpToNextLevel: 16000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 19, maxCrossClassSkillRanks: 9.5, hasFeat: false, hasAbilityIncrease: true,  notes: "+1 Ability Score Increase, Third Iterative Attack (+16/+11/+6/+1 for Full-BAB)" },
  { level: 17, totalXp: 136000, xpToNextLevel: 17000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 20, maxCrossClassSkillRanks: 10.0, hasFeat: false, hasAbilityIncrease: false, notes: "9th-Level Spells (Wish, Miracle, Gate, Time Stop)" },
  { level: 18, totalXp: 153000, xpToNextLevel: 18000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 21, maxCrossClassSkillRanks: 10.5, hasFeat: true,  hasAbilityIncrease: false, notes: "18th-Level Feat, Tier 4 Mastery" },
  { level: 19, totalXp: 171000, xpToNextLevel: 19000, relativePercentageIncrease: 100.0, maxClassSkillRanks: 22, maxCrossClassSkillRanks: 11.0, hasFeat: false, hasAbilityIncrease: false, notes: "Penultimate Milestone" },
  { level: 20, totalXp: 190000, xpToNextLevel: null,  relativePercentageIncrease: null,  maxClassSkillRanks: 23, maxCrossClassSkillRanks: 11.5, hasFeat: false, hasAbilityIncrease: true,  notes: "+1 Ability Score Increase, Level 20 Capstone / Epic Advancement Prerequisite" }
];

export function getProgressionTable(edition: RuleEdition = '5e'): LevelProgressionEntry[] {
  return edition === '3.5e' ? DND_35E_LEVEL_TABLE : DND_5E_LEVEL_TABLE;
}

export function getMinXpForLevel(level: number, edition: RuleEdition = '5e'): number {
  const table = getProgressionTable(edition);
  const entry = table.find(e => e.level === level);
  return entry ? entry.totalXp : 0;
}

export function getNextLevelXpThreshold(currentLevel: number, edition: RuleEdition = '5e'): number | null {
  if (currentLevel >= 20) return null;
  const table = getProgressionTable(edition);
  const nextEntry = table.find(e => e.level === currentLevel + 1);
  return nextEntry ? nextEntry.totalXp : null;
}

export function getLevelFromTotalXp(xp: number, edition: RuleEdition = '5e'): number {
  if (xp < 0) return 1;
  const table = getProgressionTable(edition);
  let calculatedLevel = 1;
  for (const entry of table) {
    if (xp >= entry.totalXp) {
      calculatedLevel = entry.level;
    } else {
      break;
    }
  }
  return calculatedLevel;
}

export function getXpProgressDetails(xp: number, level: number, edition: RuleEdition = '5e') {
  const currentMin = getMinXpForLevel(level, edition);
  const nextMin = getNextLevelXpThreshold(level, edition);

  if (!nextMin) {
    return {
      currentMinXp: currentMin,
      nextLevelXp: currentMin,
      neededForNext: 0,
      progressInTier: xp - currentMin,
      tierSpan: 0,
      percentage: 100,
      canLevelUp: false
    };
  }

  const tierSpan = nextMin - currentMin;
  const progressInTier = Math.max(0, xp - currentMin);
  const percentage = Math.min(100, Math.max(0, Math.floor((progressInTier / tierSpan) * 100)));
  const neededForNext = Math.max(0, nextMin - xp);
  const canLevelUp = xp >= nextMin && level < 20;

  return {
    currentMinXp: currentMin,
    nextLevelXp: nextMin,
    neededForNext,
    progressInTier,
    tierSpan,
    percentage,
    canLevelUp
  };
}

export interface ClassHitDieMeta {
  dieType: number;
  averageHp: number; // e.g., 6 for d10
}

export const CLASS_HIT_DICE_MAP: Record<string, ClassHitDieMeta> = {
  barbarian: { dieType: 12, averageHp: 7 },
  fighter: { dieType: 10, averageHp: 6 },
  paladin: { dieType: 10, averageHp: 6 },
  ranger: { dieType: 10, averageHp: 6 },
  bard: { dieType: 8, averageHp: 5 },
  cleric: { dieType: 8, averageHp: 5 },
  druid: { dieType: 8, averageHp: 5 },
  monk: { dieType: 8, averageHp: 5 },
  rogue: { dieType: 8, averageHp: 5 },
  warlock: { dieType: 8, averageHp: 5 },
  sorcerer: { dieType: 6, averageHp: 4 },
  wizard: { dieType: 6, averageHp: 4 },
  artificer: { dieType: 8, averageHp: 5 },
};

export function getClassHitDie(className: string): ClassHitDieMeta {
  const normalized = (className || '').toLowerCase().trim();
  for (const key of Object.keys(CLASS_HIT_DICE_MAP)) {
    if (normalized.includes(key)) {
      return CLASS_HIT_DICE_MAP[key];
    }
  }
  return { dieType: 8, averageHp: 5 }; // default d8
}
