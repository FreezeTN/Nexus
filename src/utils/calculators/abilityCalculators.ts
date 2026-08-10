import { AbilityName, AbilityScores, Skill } from '../../types';

export function getAbilityModifier(score: number): number {
  const num = Number(score);
  const safeScore = isNaN(num) ? 10 : num;
  return Math.floor((safeScore - 10) / 2);
}

export function formatModifier(mod: number): string {
  const num = Number(mod);
  const safeMod = isNaN(num) ? 0 : num;
  return safeMod >= 0 ? `+${safeMod}` : `${safeMod}`;
}

export function getProficiencyBonus(level: number): number {
  const num = Number(level);
  const safeLvl = isNaN(num) || num < 1 ? 1 : num;
  return Math.ceil(1 + safeLvl / 4);
}

export function getSavingThrowBonus(
  abilityName: AbilityName,
  abilities: AbilityScores,
  savingThrowProficiencies: AbilityName[],
  level: number
): number {
  const mod = getAbilityModifier(abilities[abilityName]?.score || 10);
  const isProf = savingThrowProficiencies.includes(abilityName);
  const profBonus = isProf ? getProficiencyBonus(level) : 0;
  return mod + profBonus;
}

export function getSkillBonus(
  skill: Skill,
  abilities: AbilityScores,
  level: number
): number {
  const abilityScore = abilities[skill.ability]?.score || 10;
  const mod = getAbilityModifier(abilityScore);
  const prof = getProficiencyBonus(level);

  if (skill.expertise) {
    return mod + prof * 2;
  }
  if (skill.proficient) {
    return mod + prof;
  }
  return mod;
}
