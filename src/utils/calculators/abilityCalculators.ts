import { AbilityName, AbilityScores, CharacterData, GearItem, Skill } from '../../types';
import { parseAbilityScoreBonuses } from '../homebrewValidator';
import { getRacialSkillBonusForSkill } from '../racialSkillBonusEngine';

export interface AbilityScoreDetails {
  baseScore: number;
  effectiveScore: number;
  modifier: number;
  isOverridden: boolean;
  overrideSource?: string;
  bonusAmount: number;
  bonusSources: string[];
}

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

/**
 * Checks if an item provides a fixed ability score setter (e.g. Gauntlets of Ogre Power sets STR to 19)
 */
export function getItemAbilitySetter(item: GearItem, ability: AbilityName): number | null {
  if (item.abilitySetters && item.abilitySetters[ability] !== undefined) {
    return item.abilitySetters[ability]!;
  }

  const name = (item.name || '').toLowerCase();
  const notes = (item.notes || '').toLowerCase();

  if (ability === 'STR') {
    if (name.includes('gauntlets of ogre power') || notes.includes('strength is 19') || notes.includes('strength to 19')) return 19;
    if (name.includes('belt of hill giant strength') || notes.includes('strength is 21') || notes.includes('strength to 21')) return 21;
    if (name.includes('belt of frost giant strength') || name.includes('belt of stone giant strength') || notes.includes('strength is 23') || notes.includes('strength to 23')) return 23;
    if (name.includes('belt of fire giant strength') || notes.includes('strength is 25') || notes.includes('strength to 25')) return 25;
    if (name.includes('belt of cloud giant strength') || notes.includes('strength is 27') || notes.includes('strength to 27')) return 27;
    if (name.includes('belt of storm giant strength') || notes.includes('strength is 29') || notes.includes('strength to 29')) return 29;
    if (name.includes('belt of giant strength')) return 21;
  }

  if (ability === 'INT') {
    if (name.includes('headband of intellect') || notes.includes('intelligence is 19') || notes.includes('intelligence to 19')) return 19;
  }

  if (ability === 'CON') {
    if (name.includes('amulet of health') || notes.includes('constitution is 19') || notes.includes('constitution to 19')) return 19;
    if (name.includes('gloves of soul catching') || notes.includes('constitution is 20') || notes.includes('constitution to 20')) return 20;
  }

  if (ability === 'CHA') {
    if (notes.includes('charisma is 19') || notes.includes('charisma to 19')) return 19;
  }

  if (ability === 'WIS') {
    if (notes.includes('wisdom is 19') || notes.includes('wisdom to 19')) return 19;
  }

  if (ability === 'DEX') {
    if (notes.includes('dexterity is 19') || notes.includes('dexterity to 19')) return 19;
  }

  return null;
}

/**
 * Checks if an item provides a flat bonus to an ability score (e.g. Tome of Understanding +2 WIS)
 */
export function getItemAbilityBonus(item: GearItem, ability: AbilityName): number {
  let bonus = 0;
  if (item.abilityBonuses && item.abilityBonuses[ability] !== undefined) {
    bonus += item.abilityBonuses[ability]!;
  }
  return bonus;
}

/**
 * Calculates the full effective ability score breakdown taking into account base score, manual overrides,
 * magic item stat setters (Gauntlets of Ogre Power, Headband of Intellect, etc.), and bonuses.
 */
export function getEffectiveAbilityDetails(char: CharacterData, ability: AbilityName): AbilityScoreDetails {
  const baseEntry = char?.abilities?.[ability];
  let baseScore = Number(baseEntry?.score) || 10;

  // 3.5e Wild Shape & Polymorph: Physical scores (STR, DEX, CON) replaced by beast base scores
  if (char?.wildShapeActive && char?.wildShapeForm && (ability === 'STR' || ability === 'DEX' || ability === 'CON')) {
    const beastVal = char.wildShapeForm[ability.toLowerCase() as 'str' | 'dex' | 'con'];
    if (typeof beastVal === 'number' && beastVal > 0) {
      baseScore = beastVal;
    }
  }

  const manualOverride = baseEntry?.overrideBonus || 0;

  let bonusAmount = manualOverride;
  const bonusSources: string[] = [];
  if (manualOverride !== 0) {
    bonusSources.push(`Manual Modifier (${formatModifier(manualOverride)})`);
  }

  let highestSetterValue: number | null = null;
  let setterSourceName: string | undefined = undefined;

  const inventory = char?.inventory || [];
  for (const item of inventory) {
    if (!item.equipped || item.stored) continue;
    // If item requires attunement, it must be attuned to grant ability benefits
    const requiresAttunement = item.requiresAttunement ?? (item.isMagic || (item.notes || '').toLowerCase().includes('attune'));
    if (requiresAttunement && !item.attuned) continue;

    // Check fixed ability setters
    const setter = getItemAbilitySetter(item, ability);
    if (setter !== null && (highestSetterValue === null || setter > highestSetterValue)) {
      highestSetterValue = setter;
      setterSourceName = item.name;
    }

    // Check ability bonuses
    const itemBonus = getItemAbilityBonus(item, ability);
    if (itemBonus !== 0) {
      bonusAmount += itemBonus;
      bonusSources.push(`${item.name} (${formatModifier(itemBonus)})`);
    }
  }

  // Check feats for ability bonuses (half-feats, ASI feats, homebrew stat bonuses)
  const feats = char?.feats || [];
  for (const feat of feats) {
    let featStatBonus = 0;

    // 1. Structured abilityBonuses object if present
    if (feat.abilityBonuses && typeof feat.abilityBonuses[ability] === 'number') {
      featStatBonus += feat.abilityBonuses[ability]!;
    }

    // 2. Explicit statBonus string (e.g. "+2 Constitution", "+1 Strength")
    if (feat.statBonus) {
      const parsed = parseAbilityScoreBonuses(feat.statBonus);
      for (const p of parsed) {
        if (p.stat === ability || p.stat === 'ALL') {
          featStatBonus += p.value;
        }
      }
    }

    // 3. Fallback: Parse from feat description / title if statBonus wasn't explicitly populated
    if (featStatBonus === 0 && (feat.description || feat.name)) {
      const parsed = parseAbilityScoreBonuses(`${feat.name || ''}: ${feat.description || ''}`);
      for (const p of parsed) {
        if (p.stat === ability || p.stat === 'ALL') {
          featStatBonus += p.value;
        }
      }
    }

    if (featStatBonus !== 0) {
      bonusAmount += featStatBonus;
      bonusSources.push(`Feat: ${feat.name} (${formatModifier(featStatBonus)})`);
    }
  }

  const naturalWithBonus = baseScore + bonusAmount;
  let effectiveScore = naturalWithBonus;
  let isOverridden = false;
  let overrideSource = undefined;

  // D&D 5e Rule: Fixed score setters only apply if they exceed your natural score
  if (highestSetterValue !== null && highestSetterValue > naturalWithBonus) {
    effectiveScore = highestSetterValue;
    isOverridden = true;
    overrideSource = `${setterSourceName} (Sets ${ability} to ${highestSetterValue})`;
  }

  // D&D 3.5e Ability Damage vs. Ability Drain & Barbarian Rage
  if (char?.edition === '3.5e') {
    if (char.isRaging35e && (ability === 'STR' || ability === 'CON')) {
      const lvl = Math.max(1, char.level || 1);
      const rageBonus = lvl >= 20 ? 8 : lvl >= 11 ? 6 : 4;
      const rageType = lvl >= 20 ? 'Mighty Rage' : lvl >= 11 ? 'Greater Rage' : 'Barbarian Rage';
      effectiveScore += rageBonus;
      bonusSources.push(`${rageType} (+${rageBonus})`);
    }

    const damage = char?.abilityDamage?.[ability] || 0;
    const drain = char?.abilityDrain?.[ability] || 0;
    if (damage > 0) {
      effectiveScore = Math.max(0, effectiveScore - damage);
      bonusSources.push(`Ability Damage (-${damage})`);
    }
    if (drain > 0) {
      effectiveScore = Math.max(0, effectiveScore - drain);
      bonusSources.push(`Ability Drain (-${drain})`);
    }
  }

  return {
    baseScore,
    effectiveScore,
    modifier: getAbilityModifier(effectiveScore),
    isOverridden,
    overrideSource,
    bonusAmount,
    bonusSources
  };
}

/**
 * Returns an AbilityScores object populated with effective values for all 6 abilities
 */
export function getEffectiveAbilities(char: CharacterData): AbilityScores {
  const abilities: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const result: Partial<AbilityScores> = {};

  for (const ab of abilities) {
    const details = getEffectiveAbilityDetails(char, ab);
    result[ab] = {
      score: details.effectiveScore,
      overrideBonus: char?.abilities?.[ab]?.overrideBonus
    };
  }

  return result as AbilityScores;
}

export function getSavingThrowBonus(
  abilityName: AbilityName,
  abilities: AbilityScores,
  savingThrowProficiencies: AbilityName[],
  level: number,
  character?: CharacterData
): number {
  const mod = getAbilityModifier(abilities[abilityName]?.score || 10);
  const isProf = savingThrowProficiencies.includes(abilityName);
  const profBonus = isProf ? getProficiencyBonus(level) : 0;

  let itemBonus = 0;
  if (character?.inventory) {
    for (const item of character.inventory) {
      if (!item.equipped || item.stored) continue;
      const requiresAttunement = item.requiresAttunement ?? (item.isMagic || (item.notes || '').toLowerCase().includes('attune'));
      if (requiresAttunement && !item.attuned) continue;

      // General saving throw bonus (e.g. Ring of Protection +1)
      if (item.savingThrowBonus) {
        itemBonus += item.savingThrowBonus;
      }
      // Specific ability saving throw bonus
      if (item.savingThrowSpecificBonuses && item.savingThrowSpecificBonuses[abilityName]) {
        itemBonus += item.savingThrowSpecificBonuses[abilityName]!;
      }
      // Auto-detect from notes if not explicitly set
      if (!item.savingThrowBonus && item.notes) {
        const notesLower = item.notes.toLowerCase();
        const saveMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?(?:all\s*)?saving\s*throws/i);
        if (saveMatch) {
          itemBonus += parseInt(saveMatch[1], 10);
        }
      }
    }
  }

  const negPenalty = character?.negativeLevels || 0;
  return mod + profBonus + itemBonus - negPenalty;
}

export function getSkillBonus(
  skill: Skill,
  abilities: AbilityScores,
  level: number,
  character?: CharacterData,
  activeConditionIds?: string[]
): number {
  const abilityScore = abilities[skill.ability]?.score || 10;
  const mod = getAbilityModifier(abilityScore);
  const prof = getProficiencyBonus(level);

  let bonus = mod;
  if (skill.expertise) {
    bonus += prof * 2;
  } else if (skill.proficient) {
    bonus += prof;
  }

  // D&D Racial Skill Bonus (Non-stacking, highest bonus applies)
  if (character) {
    bonus += getRacialSkillBonusForSkill(skill, character, activeConditionIds);
  }

  if (character?.inventory) {
    for (const item of character.inventory) {
      if (!item.equipped || item.stored) continue;
      const requiresAttunement = item.requiresAttunement ?? (item.isMagic || (item.notes || '').toLowerCase().includes('attune'));
      if (requiresAttunement && !item.attuned) continue;

      // All ability checks / skills bonus (e.g. Luckstone +1)
      if (item.checkBonus) {
        bonus += item.checkBonus;
      }
      // Specific skill bonus (e.g. Boots of Elvenkind Stealth +5)
      if (item.skillBonuses && item.skillBonuses[skill.name] !== undefined) {
        bonus += item.skillBonuses[skill.name]!;
      }
    }
  }

  // 3.5e Negative Levels penalty (-1 to all skill and ability checks per negative level)
  if (character?.negativeLevels && character.negativeLevels > 0) {
    bonus -= character.negativeLevels;
  }

  return bonus;
}

