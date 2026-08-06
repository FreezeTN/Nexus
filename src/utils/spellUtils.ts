import { Spell } from '../types';

/**
 * Checks if a candidate spell is a duplicate of any existing spell in the spellbook.
 * A spell is considered a duplicate if either:
 * 1. Normalized name matches (case-insensitive trim)
 * 2. Normalized full description matches (case-insensitive trim, when length > 10)
 */
export function isDuplicateSpell(
  existingSpells: Spell[] = [],
  candidate: { name: string; description?: string },
  excludeSpellId?: string
): { isDuplicate: boolean; matchName?: string; reason?: 'name' | 'effect' } {
  const normName = candidate.name.trim().toLowerCase();
  const normDesc = candidate.description?.trim().toLowerCase();

  for (const s of existingSpells) {
    if (excludeSpellId && s.id === excludeSpellId) continue;

    const existingName = s.name.trim().toLowerCase();
    const existingDesc = s.description?.trim().toLowerCase();

    if (normName && existingName === normName) {
      return { isDuplicate: true, matchName: s.name, reason: 'name' };
    }

    if (
      normDesc &&
      normDesc.length > 10 &&
      existingDesc &&
      existingDesc.length > 10 &&
      existingDesc === normDesc
    ) {
      return { isDuplicate: true, matchName: s.name, reason: 'effect' };
    }
  }

  return { isDuplicate: false };
}

/**
 * Filter an array of spells to keep only unique spells by name and effect.
 */
export function deduplicateSpells(spells: Spell[] = []): Spell[] {
  const unique: Spell[] = [];
  for (const spell of spells) {
    const dupCheck = isDuplicateSpell(unique, spell);
    if (!dupCheck.isDuplicate) {
      unique.push(spell);
    }
  }
  return unique;
}
