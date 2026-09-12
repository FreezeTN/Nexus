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
  let basePassive = 10;

  if (perceptionSkill) {
    basePassive = 10 + getSkillBonus(perceptionSkill, effectiveAbilities, effectiveLevel, char);
  } else {
    const wisMod = getAbilityModifier(effectiveAbilities.WIS?.score || 10);
    basePassive = 10 + wisMod;
  }

  // Check equipped item passive perception bonuses (e.g. Sentinel Shield, Eyes of the Eagle)
  if (char.inventory) {
    for (const item of char.inventory) {
      if (!item.equipped || item.stored) continue;
      const requiresAttunement = item.requiresAttunement ?? (item.isMagic || (item.notes || '').toLowerCase().includes('attune'));
      if (requiresAttunement && !item.attuned) continue;

      if (item.passivePerceptionBonus) {
        basePassive += item.passivePerceptionBonus;
      }
    }
  }

  return basePassive;
}

