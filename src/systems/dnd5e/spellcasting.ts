import { CharacterData } from '../../types';
import { getAbilityModifier, getProficiencyBonus, getEffectiveAbilities } from './abilities';
import { getEffectiveLevel } from './classes';
import {
  getRequiredLevelForSpellSlotLevel,
  getMaxUnlockedSpellSlotLevel,
  getPreparedSpellsDetails,
  PreparedSpellsDetails
} from '../../utils/calculators/spellCalculators';

export {
  getRequiredLevelForSpellSlotLevel,
  getMaxUnlockedSpellSlotLevel,
  getPreparedSpellsDetails,
  type PreparedSpellsDetails
};

export function getSpellSaveDC(char: CharacterData): number {
  if (char.spellSaveDCOverride) return char.spellSaveDCOverride;
  const effectiveAbilities = getEffectiveAbilities(char);
  const abilityMod = getAbilityModifier(effectiveAbilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));

  const itemBonus = (char.inventory || [])
    .filter(i => {
      if (!i.equipped || i.stored) return false;
      const needsAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
      if (needsAttunement && !i.attuned) return false;
      return !!i.spellDcBonus;
    })
    .reduce((sum, i) => sum + (i.spellDcBonus || 0), 0);

  return 8 + profBonus + abilityMod + itemBonus;
}

export function getSpellAttackBonus(char: CharacterData): number {
  if (char.spellAttackBonusOverride !== undefined) return char.spellAttackBonusOverride;
  const effectiveAbilities = getEffectiveAbilities(char);
  const abilityMod = getAbilityModifier(effectiveAbilities[char.spellcastingAbility]?.score || 10);
  const profBonus = getProficiencyBonus(getEffectiveLevel(char));

  const itemBonus = (char.inventory || [])
    .filter(i => {
      if (!i.equipped || i.stored) return false;
      const needsAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
      if (needsAttunement && !i.attuned) return false;
      return !!i.spellDcBonus || !!i.spellAttackBonus;
    })
    .reduce((sum, i) => sum + (i.spellAttackBonus || i.spellDcBonus || 0), 0);

  return profBonus + abilityMod + itemBonus;
}

