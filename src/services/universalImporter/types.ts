import { CharacterData, RuleEdition, AbilityName, GearItem, Spell, Attack, Skill } from '../../types';
import { DEFAULT_SKILLS_LIST } from '../../utils/dndCalculations';

export type ImportFormat =
  | 'auto'
  | 'nexus_character'
  | 'nexus_party'
  | '5etools_creature'
  | '5etools_character'
  | 'foundry_vtt_actor'
  | 'dndbeyond_character'
  | 'markdown_statblock'
  | 'plaintext_statblock';

export type ExportFormat =
  | 'nexus_json'
  | 'foundry_vtt'
  | '5etools'
  | 'markdown'
  | 'plaintext';

export interface DetectionResult {
  format: ImportFormat;
  confidence: number;
  label: string;
  sourcePreview?: string;
  summary?: {
    name?: string;
    entityType?: 'character' | 'monster' | 'vendor' | 'party';
    levelOrCr?: string | number;
    raceClass?: string;
    abilityPreview?: Record<string, number>;
  };
}

export interface ImportResult {
  success: boolean;
  characters: CharacterData[];
  detectedFormat: ImportFormat;
  warnings: string[];
  metadata: {
    formatLabel: string;
    entityCount: number;
    detectedFields: string[];
    sourceVersion?: string;
  };
  error?: string;
}

export function createCleanCharacterData(partial: Partial<CharacterData> & { id: string; name: string }): CharacterData {
  const level = partial.level ?? 1;
  const hpMax = partial.hpMax ?? 10;
  const defaultSkills: Skill[] = DEFAULT_SKILLS_LIST.map((s, idx) => ({
    id: `skill-${idx}-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: s.name,
    ability: s.ability,
    proficient: false,
    expertise: false
  }));

  return {
    id: partial.id,
    name: partial.name,
    race: partial.race || 'Human',
    characterClass: partial.characterClass || 'Adventurer',
    subclass: partial.subclass || '',
    level,
    background: partial.background || 'Custom',
    alignment: partial.alignment || 'True Neutral',
    experiencePoints: partial.experiencePoints ?? 0,
    edition: partial.edition || '5e',
    hpMax,
    hpCurrent: partial.hpCurrent ?? hpMax,
    hpTemp: partial.hpTemp ?? 0,
    hitDiceCurrent: partial.hitDiceCurrent ?? level,
    hitDiceTotal: partial.hitDiceTotal || `${level}d8`,
    armorClass: partial.armorClass ?? 10,
    speed: partial.speed ?? 30,
    initiativeBonus: partial.initiativeBonus ?? 0,
    inspiration: partial.inspiration ?? false,
    deathSavesSuccesses: partial.deathSavesSuccesses ?? 0,
    deathSavesFailures: partial.deathSavesFailures ?? 0,
    abilities: partial.abilities || {
      STR: { score: 10 },
      DEX: { score: 10 },
      CON: { score: 10 },
      INT: { score: 10 },
      WIS: { score: 10 },
      CHA: { score: 10 }
    },
    savingThrowProficiencies: partial.savingThrowProficiencies || [],
    skills: partial.skills && partial.skills.length > 0 ? partial.skills : defaultSkills,
    classFeatures: partial.classFeatures || [],
    feats: partial.feats || [],
    attacks: partial.attacks || [],
    wealth: partial.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    inventory: partial.inventory || [],
    isSpellcaster: partial.isSpellcaster ?? false,
    spellcastingAbility: partial.spellcastingAbility || 'INT',
    spellSlots: partial.spellSlots || [],
    spells: partial.spells || [],
    conditions: partial.conditions || [],
    isMonster: partial.isMonster ?? false,
    challengeRating: partial.challengeRating,
    personalityTraits: partial.personalityTraits || '',
    ideals: partial.ideals || '',
    bonds: partial.bonds || '',
    flaws: partial.flaws || '',
    backstory: partial.backstory || '',
    alliesAndOrganizations: partial.alliesAndOrganizations || '',
    additionalNotes: partial.additionalNotes || ''
  };
}
