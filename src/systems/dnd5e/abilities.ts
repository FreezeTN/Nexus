import { AbilityName, AbilityScores, CharacterData, Skill } from '../../types';
import {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSavingThrowBonus,
  getSkillBonus,
  getEffectiveAbilityDetails,
  getEffectiveAbilities,
  getItemAbilitySetter,
  getItemAbilityBonus,
  AbilityScoreDetails
} from '../../utils/calculators/abilityCalculators';
import { getCombinedLevel } from '../../utils/calculators/levelCalculators';

export {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSavingThrowBonus,
  getSkillBonus,
  getEffectiveAbilityDetails,
  getEffectiveAbilities,
  getItemAbilitySetter,
  getItemAbilityBonus,
  type AbilityScoreDetails
};

export function getPassivePerception(char: CharacterData): number {
  const effectiveLevel = getCombinedLevel(char);
  const effectiveAbilities = getEffectiveAbilities(char);
  const perceptionSkill = char.skills.find(s => s.name === 'Perception');
  if (perceptionSkill) {
    return 10 + getSkillBonus(perceptionSkill, effectiveAbilities, effectiveLevel);
  }
  const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
  return 10 + wisMod;
}

