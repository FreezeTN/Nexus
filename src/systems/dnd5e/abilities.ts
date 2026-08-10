import { AbilityName, AbilityScores, CharacterData, Skill } from '../../types';
import {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSavingThrowBonus,
  getSkillBonus
} from '../../utils/calculators/abilityCalculators';
import { getCombinedLevel } from '../../utils/calculators/levelCalculators';

export {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSavingThrowBonus,
  getSkillBonus
};

export function getPassivePerception(char: CharacterData): number {
  const effectiveLevel = getCombinedLevel(char);
  const perceptionSkill = char.skills.find(s => s.name === 'Perception');
  if (perceptionSkill) {
    return 10 + getSkillBonus(perceptionSkill, char.abilities, effectiveLevel);
  }
  const wisMod = getAbilityModifier(char.abilities.WIS?.score || 10);
  return 10 + wisMod;
}
