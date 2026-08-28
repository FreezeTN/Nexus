import { CharacterData } from '../types';

export interface ConditionEvaluation {
  hasAttackDisadvantage: boolean;
  hasAttackAdvantage: boolean;
  hasCheckDisadvantage: boolean;
  hasDexSaveDisadvantage: boolean;
  autoFailStrDexSaves: boolean;
  isIncapacitated: boolean;
  speedMultiplier: number;
  speedOverrideZero: boolean;
  incomingMeleeAdvantage: boolean;
  incomingMeleeAutoCrit: boolean;
  activeConditionNames: string[];
  activeEffectsList: Array<{
    condition: string;
    effect: string;
    type: 'penalty' | 'buff' | 'danger';
  }>;
}

export function evaluateCharacterConditions(character: CharacterData): ConditionEvaluation {
  const conditions = character.conditions || [];
  const exhaustionLevel = character.exhaustionLevel || 0;

  const result: ConditionEvaluation = {
    hasAttackDisadvantage: false,
    hasAttackAdvantage: false,
    hasCheckDisadvantage: false,
    hasDexSaveDisadvantage: false,
    autoFailStrDexSaves: false,
    isIncapacitated: false,
    speedMultiplier: 1,
    speedOverrideZero: false,
    incomingMeleeAdvantage: false,
    incomingMeleeAutoCrit: false,
    activeConditionNames: [...conditions],
    activeEffectsList: []
  };

  if (exhaustionLevel > 0) {
    result.activeConditionNames.push(`Exhaustion (Level ${exhaustionLevel})`);
    
    if (exhaustionLevel >= 1) {
      result.hasCheckDisadvantage = true;
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl ${exhaustionLevel}`,
        effect: 'Disadvantage on Ability Checks',
        type: 'penalty'
      });
    }
    if (exhaustionLevel >= 2) {
      result.speedMultiplier = Math.min(result.speedMultiplier, 0.5);
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl ${exhaustionLevel}`,
        effect: 'Speed is Halved',
        type: 'penalty'
      });
    }
    if (exhaustionLevel >= 3) {
      result.hasAttackDisadvantage = true;
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl ${exhaustionLevel}`,
        effect: 'Disadvantage on Attack Rolls & Saving Throws',
        type: 'penalty'
      });
    }
    if (exhaustionLevel >= 4) {
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl ${exhaustionLevel}`,
        effect: 'Hit Point Maximum is Halved',
        type: 'danger'
      });
    }
    if (exhaustionLevel >= 5) {
      result.speedOverrideZero = true;
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl ${exhaustionLevel}`,
        effect: 'Speed Reduced to 0 ft',
        type: 'danger'
      });
    }
    if (exhaustionLevel >= 6) {
      result.activeEffectsList.push({
        condition: `Exhaustion Lvl 6`,
        effect: 'Fatal Exhaustion (Death)',
        type: 'danger'
      });
    }
  }

  conditions.forEach(c => {
    const lower = c.toLowerCase();

    if (lower.includes('poisoned')) {
      result.hasAttackDisadvantage = true;
      result.hasCheckDisadvantage = true;
      result.activeEffectsList.push({
        condition: 'Poisoned',
        effect: 'Disadvantage on Attack Rolls & Ability Checks',
        type: 'penalty'
      });
    }

    if (lower.includes('frightened')) {
      result.hasAttackDisadvantage = true;
      result.hasCheckDisadvantage = true;
      result.activeEffectsList.push({
        condition: 'Frightened',
        effect: 'Disadvantage on Ability Checks & Attacks while source is visible',
        type: 'penalty'
      });
    }

    if (lower.includes('prone')) {
      result.hasAttackDisadvantage = true;
      result.speedMultiplier = Math.min(result.speedMultiplier, 0.5);
      result.incomingMeleeAdvantage = true;
      result.activeEffectsList.push({
        condition: 'Prone',
        effect: 'Disadvantage on Attacks, crawl speed, melee hits against you have advantage',
        type: 'penalty'
      });
    }

    if (lower.includes('restrained')) {
      result.speedOverrideZero = true;
      result.hasAttackDisadvantage = true;
      result.hasDexSaveDisadvantage = true;
      result.incomingMeleeAdvantage = true;
      result.activeEffectsList.push({
        condition: 'Restrained',
        effect: 'Speed 0, Disadvantage on Attacks & DEX saves, attacks against you have advantage',
        type: 'penalty'
      });
    }

    if (lower.includes('blinded')) {
      result.hasAttackDisadvantage = true;
      result.incomingMeleeAdvantage = true;
      result.activeEffectsList.push({
        condition: 'Blinded',
        effect: 'Auto-fail sight checks, Disadvantage on Attacks, incoming attacks have advantage',
        type: 'penalty'
      });
    }

    if (lower.includes('invisible')) {
      result.hasAttackAdvantage = true;
      result.activeEffectsList.push({
        condition: 'Invisible',
        effect: 'Advantage on Attack Rolls, incoming attacks have disadvantage',
        type: 'buff'
      });
    }

    if (lower.includes('paralyzed')) {
      result.isIncapacitated = true;
      result.speedOverrideZero = true;
      result.autoFailStrDexSaves = true;
      result.incomingMeleeAdvantage = true;
      result.incomingMeleeAutoCrit = true;
      result.activeEffectsList.push({
        condition: 'Paralyzed',
        effect: 'Incapacitated, Speed 0, Auto-fail STR/DEX saves, Melee hits within 5ft are Critical Hits!',
        type: 'danger'
      });
    }

    if (lower.includes('stunned')) {
      result.isIncapacitated = true;
      result.speedOverrideZero = true;
      result.autoFailStrDexSaves = true;
      result.incomingMeleeAdvantage = true;
      result.activeEffectsList.push({
        condition: 'Stunned',
        effect: 'Incapacitated, Speed 0, Auto-fail STR/DEX saves, incoming attacks have advantage',
        type: 'danger'
      });
    }

    if (lower.includes('unconscious')) {
      result.isIncapacitated = true;
      result.speedOverrideZero = true;
      result.autoFailStrDexSaves = true;
      result.incomingMeleeAdvantage = true;
      result.incomingMeleeAutoCrit = true;
      result.activeEffectsList.push({
        condition: 'Unconscious',
        effect: 'Incapacitated, Drop held items, Auto-fail STR/DEX saves, Melee hits within 5ft are Crits',
        type: 'danger'
      });
    }

    if (lower.includes('incapacitated')) {
      result.isIncapacitated = true;
      result.activeEffectsList.push({
        condition: 'Incapacitated',
        effect: 'Cannot take Actions or Reactions',
        type: 'penalty'
      });
    }

    if (lower.includes('grappled')) {
      result.speedOverrideZero = true;
      result.activeEffectsList.push({
        condition: 'Grappled',
        effect: 'Speed becomes 0 ft',
        type: 'penalty'
      });
    }
  });

  return result;
}
