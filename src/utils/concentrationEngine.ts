import { CharacterData, Spell, ActiveConcentration } from '../types';

export function isSpellConcentration(spell: Spell): boolean {
  if (spell.concentration) return true;
  const durationLower = (spell.duration || '').toLowerCase();
  const descLower = (spell.description || '').toLowerCase();
  return durationLower.includes('concentration') || descLower.includes('requires concentration') || descLower.includes('(concentration)');
}

export function startConcentration(
  character: CharacterData,
  spell: Spell,
  castLevel?: number
): { updatedCharacter: CharacterData; previousSpellName?: string } {
  const previousSpellName = character.activeConcentration?.spellName;

  const newConcentration: ActiveConcentration = {
    spellId: spell.id,
    spellName: spell.name,
    castLevel: castLevel || spell.level,
    duration: spell.duration || '1 minute',
    castTimestamp: Date.now()
  };

  const updatedCharacter: CharacterData = {
    ...character,
    activeConcentration: newConcentration
  };

  return { updatedCharacter, previousSpellName };
}

export function dropConcentration(character: CharacterData): CharacterData {
  const updated = { ...character };
  delete updated.activeConcentration;
  return updated;
}

export function calculateConcentrationDc(damageAmount: number): number {
  return Math.max(10, Math.floor(damageAmount / 2));
}
