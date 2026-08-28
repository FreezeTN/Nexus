import { CharacterData } from '../../types';
import { getAbilityModifier, getEffectiveAbilities } from './abilities';

export function calculateArmorClass(char: CharacterData): number {
  if (char.acOverride) return char.acOverride;
  let baseAc = 10;
  const effectiveAbilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(effectiveAbilities.DEX?.score || 10);
  baseAc += dexMod;

  const equippedItems = (char.inventory || []).filter(i => {
    if (!i.equipped || i.stored) return false;
    const needsAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
    if (needsAttunement && !i.attuned) return false;
    return true;
  });

  for (const item of equippedItems) {
    if (item.acBonus) {
      baseAc += item.acBonus;
    }
  }

  return baseAc;
}

export function calculateInitiativeBonus(char: CharacterData): number {
  if (char.initiativeOverride !== undefined) return char.initiativeOverride;
  const effectiveAbilities = getEffectiveAbilities(char);
  const dexMod = getAbilityModifier(effectiveAbilities.DEX?.score || 10);
  const itemBonus = (char.inventory || [])
    .filter(i => {
      if (!i.equipped || i.stored) return false;
      const needsAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
      if (needsAttunement && !i.attuned) return false;
      return !!i.initiativeBonus;
    })
    .reduce((sum, i) => sum + (i.initiativeBonus || 0), 0);
  return dexMod + itemBonus;
}

