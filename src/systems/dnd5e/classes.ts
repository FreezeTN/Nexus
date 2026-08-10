import { CharacterData } from '../../types';
import { getCombinedLevel } from '../../utils/calculators/levelCalculators';

export { getCombinedLevel };

export function getEffectiveLevel(char: CharacterData): number {
  return getCombinedLevel(char);
}

export function getActiveClassChoice(char: CharacterData): 'primary' | 'secondary' {
  return char.optionalRules?.activeClassChoice || 'primary';
}

export function getPrimaryXp(char: CharacterData): number {
  if (!char.optionalRules?.useMulticlassing || !char.optionalRules?.secondaryClass) {
    return char.experiencePoints || 0;
  }
  if (char.optionalRules?.primaryXp !== undefined) {
    return char.optionalRules.primaryXp;
  }
  const secXp = char.optionalRules?.secondaryXp ?? 0;
  return Math.max(0, (char.experiencePoints || 0) - secXp);
}

export function getSecondaryXp(char: CharacterData): number {
  if (char.optionalRules?.secondaryXp !== undefined) {
    return char.optionalRules.secondaryXp;
  }
  const secLevel = char.optionalRules?.secondaryLevel || 1;
  const thresholds = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  return thresholds[secLevel] || 0;
}

export function getUnallocatedXp(char: CharacterData): number {
  if (!char.optionalRules?.useMulticlassing || !char.optionalRules?.secondaryClass) {
    return 0;
  }
  const totalGenXp = char.experiencePoints || 0;
  const pXp = getPrimaryXp(char);
  const sXp = getSecondaryXp(char);
  return Math.max(0, totalGenXp - (pXp + sXp));
}
