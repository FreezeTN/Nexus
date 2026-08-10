import { CharacterData } from '../../types';

/**
 * Calculates total effective character level considering optional multiclassing rules.
 */
export function getCombinedLevel(char: CharacterData): number {
  if (!char) return 1;
  if (char.optionalRules?.useMulticlassing) {
    const secLvl = char.optionalRules.secondaryLevel || 1;
    return (char.level || 1) + Math.max(1, secLvl);
  }
  return char.level || 1;
}
