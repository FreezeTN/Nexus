import { CharacterData, GearItem, Wealth, Spell, ClassFeature, Feat, Attack } from '../types';
import { getEffectiveMaxHp } from './dndCalculations';

/**
 * Recognizes permanent anatomical modifications or lingering injuries
 * that should persist on the Base Character outside of session combat.
 */
export function isPermanentInjury(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes('lost arm') ||
    lower.includes('one-armed') ||
    lower.includes('severed arm') ||
    lower.includes('amputated arm') ||
    lower.includes('lost leg') ||
    lower.includes('severed leg') ||
    lower.includes('amputated leg') ||
    lower.includes('lost both arms') ||
    lower.includes('no arms') ||
    lower.includes('lost eye') ||
    lower.includes('blinded (permanent)') ||
    lower.includes('horrible scar') ||
    lower.includes('major scar') ||
    lower.includes('internal injury') ||
    lower.includes('mangled hand') ||
    lower.includes('severed finger') ||
    lower.includes('lost ear') ||
    lower.includes('cyberarm') ||
    lower.includes('grafted arm')
  );
}

/**
 * Filter a conditions array to retain only permanent lingering injuries,
 * stripping transient combat statuses (e.g. Poisoned, Prone, Stunned, Dead).
 */
export function extractPermanentConditions(conditions: string[] = []): string[] {
  return conditions.filter(c => isPermanentInjury(c));
}

/**
 * List of standard lingering injuries and lost limbs
 */
export interface LingeringInjuryPreset {
  id: string;
  name: string;
  category: 'limb' | 'sensory' | 'systemic';
  description: string;
  handsModifier?: number;
  speedModifier?: number;
}

export const LINGERING_INJURIES_PRESETS: LingeringInjuryPreset[] = [
  {
    id: 'lost_arm',
    name: 'Lost Arm',
    category: 'limb',
    description: 'You have lost an arm or hand. You can no longer hold anything with two hands, and you can hold only a single item at a time (-1 available hand slot).',
    handsModifier: -1
  },
  {
    id: 'lost_both_arms',
    name: 'Lost Both Arms',
    category: 'limb',
    description: 'You have lost both arms or hands. You cannot wield weapons, hold shields, or perform somatic spell components requiring hands.',
    handsModifier: -2
  },
  {
    id: 'lost_leg',
    name: 'Lost Leg',
    category: 'limb',
    description: 'Your walking speed is reduced by 10 feet. You must use a cane or peg leg to walk, and you have disadvantage on Dexterity/Athletics checks to run or jump.',
    speedModifier: -10
  },
  {
    id: 'lost_eye',
    name: 'Lost Eye',
    category: 'sensory',
    description: 'You have disadvantage on Wisdom (Perception) checks that rely on sight and on ranged attack rolls beyond 30 feet.'
  },
  {
    id: 'mangled_hand',
    name: 'Mangled Hand',
    category: 'limb',
    description: 'Severed fingers or crushed hand bones make delicate work difficult. Disadvantage on Dexterity (Sleight of Hand) checks.'
  },
  {
    id: 'internal_injury',
    name: 'Internal Injury',
    category: 'systemic',
    description: 'Whenever you attempt an action in combat, you must succeed on a DC 15 Constitution saving throw. On a failure, you lose your action and spend the turn gasping in pain.'
  },
  {
    id: 'horrible_scar',
    name: 'Horrible Scar',
    category: 'systemic',
    description: 'A disfiguring battle scar across your face or torso. You have disadvantage on Charisma (Persuasion) checks and advantage on Charisma (Intimidation) checks.'
  }
];

/**
 * Adopts and synchronizes all "permanent" progress from a session character
 * (Level, Experience, Items, Spells, Wealth, Lost Limbs, Feats, Features)
 * onto the Base Character outside of the session, while ensuring that
 * the Base Character's Current HP is ALWAYS full and transient combat conditions
 * (Poisoned, Prone, Unconscious, Dead, etc.) are stripped away.
 */
export function syncSessionChangesToBaseCharacter(
  sessionChar: CharacterData,
  baseChar: CharacterData
): CharacterData {
  const effectiveMaxHp = getEffectiveMaxHp(baseChar);

  // Preserve permanent lingering injuries and amputations from session
  const sessionPermConditions = extractPermanentConditions(sessionChar.conditions || []);
  const basePermConditions = extractPermanentConditions(baseChar.conditions || []);
  const mergedPermConditions = Array.from(new Set([...basePermConditions, ...sessionPermConditions]));

  const mergedInjuries = Array.from(
    new Set([...(baseChar.lingeringInjuries || []), ...(sessionChar.lingeringInjuries || [])])
  );

  // Sync spell slots max while refreshing current spell slots to full on the Base Character
  const refreshedSpellSlots = (sessionChar.spellSlots || []).map(slot => ({
    ...slot,
    current: slot.max
  }));

  // Sanitized Base Character with permanent updates applied
  const updatedBaseChar: CharacterData = {
    ...baseChar,

    // Core Identity (preserve base character's name/campaign tag if desired, or sync if updated)
    level: sessionChar.level,
    characterClass: sessionChar.characterClass,
    subclass: sessionChar.subclass,
    experiencePoints: sessionChar.experiencePoints,
    playerClassDetails: sessionChar.playerClassDetails,
    optionalRules: {
      ...baseChar.optionalRules,
      ...sessionChar.optionalRules
    },

    // Abilities, Saves & Skills
    abilities: sessionChar.abilities ? { ...sessionChar.abilities } : baseChar.abilities,
    savingThrowProficiencies: sessionChar.savingThrowProficiencies ? [...sessionChar.savingThrowProficiencies] : baseChar.savingThrowProficiencies,
    skills: sessionChar.skills ? [...sessionChar.skills] : baseChar.skills,

    // Inventory, Wealth & Containers (permanent acquisitions and expenditures)
    inventory: Array.isArray(sessionChar.inventory) ? [...sessionChar.inventory] : baseChar.inventory,
    wealth: sessionChar.wealth ? { ...sessionChar.wealth } : baseChar.wealth,
    containers: sessionChar.containers ? [...sessionChar.containers] : baseChar.containers,

    // Spellbook & Spells Known/Prepared
    spells: Array.isArray(sessionChar.spells) ? [...sessionChar.spells] : baseChar.spells,
    spellSlots: refreshedSpellSlots.length > 0 ? refreshedSpellSlots : baseChar.spellSlots,
    isSpellcaster: sessionChar.isSpellcaster ?? baseChar.isSpellcaster,
    spellcastingAbility: sessionChar.spellcastingAbility || baseChar.spellcastingAbility,

    // Feats, Class Features & Attacks
    feats: Array.isArray(sessionChar.feats) ? [...sessionChar.feats] : baseChar.feats,
    classFeatures: Array.isArray(sessionChar.classFeatures) ? [...sessionChar.classFeatures] : baseChar.classFeatures,
    attacks: Array.isArray(sessionChar.attacks) ? [...sessionChar.attacks] : baseChar.attacks,

    // Mounts & Stables
    ownedMounts: Array.isArray(sessionChar.ownedMounts) ? [...sessionChar.ownedMounts] : baseChar.ownedMounts,
    mountInfo: sessionChar.mountInfo ? { ...sessionChar.mountInfo } : baseChar.mountInfo,

    // Permanent bodily traits & Lost Limbs (transferred!)
    handsCountOverride: sessionChar.handsCountOverride !== undefined ? sessionChar.handsCountOverride : baseChar.handsCountOverride,
    lingeringInjuries: mergedInjuries,

    // Base Character Vitals: ALWAYS full HP and clear of temporary combat debuffs
    hpMax: sessionChar.hpMax || baseChar.hpMax,
    hpCurrent: Math.max(effectiveMaxHp, sessionChar.hpMax || baseChar.hpMax),
    hpTemp: 0,
    deathSavesSuccesses: 0,
    deathSavesFailures: 0,
    conditions: mergedPermConditions,
    conditionDurations: {},
    exhaustionLevel: 0,
    activeConcentration: undefined,

    // Hybrid / Shadowrun / Cthulhu permanent stats
    shadowrun: sessionChar.shadowrun ? { ...sessionChar.shadowrun } : baseChar.shadowrun,
    cthulhu: sessionChar.cthulhu ? { ...sessionChar.cthulhu } : baseChar.cthulhu,
    hybridHeritage: sessionChar.hybridHeritage ? { ...sessionChar.hybridHeritage } : baseChar.hybridHeritage,

    // Lore, backstory and player notes
    alliesAndOrganizations: sessionChar.alliesAndOrganizations || baseChar.alliesAndOrganizations,
    additionalNotes: sessionChar.additionalNotes || baseChar.additionalNotes,
    backstory: sessionChar.backstory || baseChar.backstory,

    // Synchronization telemetry
    lastSyncedFromSessionAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return updatedBaseChar;
}

/**
 * Sanitizes a Base Character sheet to ensure it is in a resting, healthy state:
 * - Current HP is at full (100%) max HP
 * - Temporary HP is 0
 * - Death saves are reset to 0
 * - Transient combat conditions (Poisoned, Prone, Unconscious, Dead, etc.) are cleared
 * - Only permanent bodily injuries (Lost Arm, Lost Eye, etc.) are kept
 * - Spell slots are refreshed to full capacity
 */
export function sanitizeBaseCharacterVitals(char: CharacterData): CharacterData {
  const maxHp = getEffectiveMaxHp(char);
  const permanentConds = extractPermanentConditions(char.conditions || []);

  const refreshedSpellSlots = (char.spellSlots || []).map(s => ({
    ...s,
    current: s.max
  }));

  return {
    ...char,
    hpCurrent: maxHp,
    hpTemp: 0,
    deathSavesSuccesses: 0,
    deathSavesFailures: 0,
    conditions: permanentConds,
    conditionDurations: {},
    exhaustionLevel: 0,
    activeConcentration: undefined,
    spellSlots: refreshedSpellSlots,
    updatedAt: new Date().toISOString()
  };
}

export interface DuplicateCharacterOptions {
  name?: string;
  campaignName?: string;
  versionTag?: string;
  linkToBase?: boolean;
}

/**
 * Creates a new version / duplicate copy of an existing character,
 * assigning a unique ID, custom name, and campaign/version box tag,
 * and optionally establishing a link back to the Base Character.
 */
export function createCharacterDuplicate(
  originalChar: CharacterData,
  options: DuplicateCharacterOptions = {}
): CharacterData {
  const newId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const copyName = options.name?.trim() || `${originalChar.name} (Copy)`;
  const campaign = options.campaignName?.trim() || originalChar.campaignName || '';
  const version = options.versionTag?.trim() || (campaign ? '' : 'Version 2');

  const duplicate: CharacterData = {
    ...JSON.parse(JSON.stringify(originalChar)),
    id: newId,
    name: copyName,
    campaignName: campaign,
    versionTag: version,
    baseCharacterId: options.linkToBase !== false ? originalChar.id : undefined,
    isBaseCharacter: false,
    lastSyncedFromSessionAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return duplicate;
}
