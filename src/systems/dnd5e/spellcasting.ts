import { CharacterData } from '../../types';
import { getAbilityModifier, getProficiencyBonus } from './abilities';
import { getEffectiveLevel } from './classes';
import {
  getRequiredLevelForSpellSlotLevel,
  getMaxUnlockedSpellSlotLevel
} from '../../utils/calculators/spellCalculators';

export {
  getRequiredLevelForSpellSlotLevel,
  getMaxUnlockedSpellSlotLevel
};

export function getSpellSaveDC(char: CharacterData): number {
  if (char.spellSaveDCOverride) return char.spellSaveDCOverride;
  const abilityMod = getAbilityModifier(char.abilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));
  const itemBonus = (char.inventory || [])
    .filter(i => i.equipped && i.attuned && i.spellDcBonus)
    .reduce((sum, i) => sum + (i.spellDcBonus || 0), 0);
  return 8 + profBonus + abilityMod + itemBonus;
}

export function getSpellAttackBonus(char: CharacterData): number {
  if (char.spellAttackBonusOverride !== undefined) return char.spellAttackBonusOverride;
  const abilityMod = getAbilityModifier(char.abilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));
  const itemBonus = (char.inventory || [])
    .filter(i => i.equipped && i.attuned && i.spellDcBonus)
    .reduce((sum, i) => sum + (i.spellDcBonus || 0), 0);
  return profBonus + abilityMod + itemBonus;
}
