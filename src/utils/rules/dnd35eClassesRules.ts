/**
 * D&D 3.5e Ultimate SRD Class Rules & Metadata Engine
 * Complete specifications for all 11 Core PC Classes, 4 Expanded Psionics Classes,
 * 5 Standard NPC Classes, and iconic Prestige Classes.
 */

export type Dnd35eBabProgression = 'Full' | 'Three-Quarter' | 'Half';
export type Dnd35eSaveType = 'Fortitude' | 'Reflex' | 'Will';
export type Dnd35eCastingType =
  | 'none'
  | 'vancian_divine'
  | 'vancian_arcane'
  | 'spontaneous_arcane'
  | 'spontaneous_divine'
  | 'psionic'
  | 'invocations'
  | 'maneuvers'
  | 'incarnum'
  | 'vestiges'
  | 'mysteries'
  | 'truenames'
  | 'infusions';

export interface Dnd35eClassRuleDefinition {
  name: string;
  category: 'Core' | 'Psionic' | 'Supplement' | 'NPC' | 'Prestige';
  sourceBook?: string;
  hitDie: number; // 4, 6, 8, 10, 12
  babProgression: Dnd35eBabProgression;
  goodSaves: Dnd35eSaveType[];
  baseSkillPoints: number; // 2, 4, 6, 8
  classSkills: string[];
  allowsCustomClassSkills?: boolean; // True for Expert (select any 10)
  maxCustomClassSkills?: number;
  castingType: Dnd35eCastingType;
  spellAbility?: 'INT' | 'WIS' | 'CHA';
  casterLevelMultiplier?: number; // 1.0 for full casters, 0.5 for Paladin/Ranger (starting at level 4)
  hasDomainSlots?: boolean; // Cleric
  hasSpecialistSlots?: boolean; // Specialist Wizard
  spontaneousConversion?: 'cure_or_inflict' | 'summon_nature' | 'none';
  alignmentRestriction?: string;
  description: string;
}

export const DND35E_ALL_CLASS_RULES: Record<string, Dnd35eClassRuleDefinition> = {
  // =========================================================================
  // 11 CORE BASE CLASSES (Player's Handbook SRD)
  // =========================================================================
  Barbarian: {
    name: 'Barbarian',
    category: 'Core',
    hitDie: 12,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 4,
    classSkills: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Listen', 'Ride', 'Survival', 'Swim'],
    castingType: 'none',
    alignmentRestriction: 'Any nonlawful',
    description: 'A fierce warrior of primitive background who can enter a battle rage to increase strength, constitution, and durability.'
  },
  Bard: {
    name: 'Bard',
    category: 'Core',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 6,
    classSkills: [
      'Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disguise',
      'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (all)', 'Listen', 'Move Silently', 'Perform',
      'Profession', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Swim', 'Tumble', 'Use Magic Device'
    ],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any nonlawful',
    description: 'A performer and scholar whose music produces magical effects and who casts spontaneous arcane spells.'
  },
  Cleric: {
    name: 'Cleric',
    category: 'Core',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: [
      'Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (Arcana)', 'Knowledge (History)',
      'Knowledge (Religion)', 'Knowledge (The Planes)', 'Profession', 'Spellcraft'
    ],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    hasDomainSlots: true,
    spontaneousConversion: 'cure_or_inflict',
    alignmentRestriction: 'Within one step of chosen deity',
    description: 'A master of divine magic who channels deity power, commands or turns undead, and prepares daily domain spells.'
  },
  Druid: {
    name: 'Druid',
    category: 'Core',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: [
      'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (Nature)',
      'Listen', 'Profession', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim'
    ],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    spontaneousConversion: 'summon_nature',
    alignmentRestriction: 'Neutral Good, Lawful Neutral, Neutral, Chaotic Neutral, or Neutral Evil',
    description: 'A guardian of nature wielding primal divine magic, animal companions, and the power to Wild Shape into beasts and elementals.'
  },
  Fighter: {
    name: 'Fighter',
    category: 'Core',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim'],
    castingType: 'none',
    description: 'A disciplined martial warrior mastering weapons, armor, and combat feats at an unmatched pace.'
  },
  Monk: {
    name: 'Monk',
    category: 'Core',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Reflex', 'Will'],
    baseSkillPoints: 4,
    classSkills: [
      'Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Hide',
      'Jump', 'Knowledge (Arcana)', 'Knowledge (Religion)', 'Listen', 'Move Silently',
      'Perform', 'Profession', 'Sense Motive', 'Spot', 'Swim', 'Tumble'
    ],
    castingType: 'none',
    alignmentRestriction: 'Any lawful',
    description: 'An ascetic martial artist fighting unarmed and unarmored, using Flurry of Blows and ki power.'
  },
  Paladin: {
    name: 'Paladin',
    category: 'Core',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: [
      'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal',
      'Knowledge (Nobility and Royalty)', 'Knowledge (Religion)', 'Profession', 'Ride'
    ],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 0.5,
    alignmentRestriction: 'Lawful Good only',
    description: 'A holy crusader of justice blessed with Divine Grace, Smite Evil, Lay on Hands, and a celestial mount.'
  },
  Ranger: {
    name: 'Ranger',
    category: 'Core',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Reflex'],
    baseSkillPoints: 6,
    classSkills: [
      'Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Hide', 'Jump',
      'Knowledge (Dungeoneering)', 'Knowledge (Geography)', 'Knowledge (Nature)',
      'Listen', 'Move Silently', 'Profession', 'Ride', 'Search', 'Spot', 'Survival', 'Swim', 'Use Rope'
    ],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 0.5,
    description: 'A wilderness tracker and warrior skilled in favored enemies, combat styles (archery or two-weapon fighting), and nature magic.'
  },
  Rogue: {
    name: 'Rogue',
    category: 'Core',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 8,
    classSkills: [
      'Appraise', 'Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy',
      'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide',
      'Intimidate', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession',
      'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'
    ],
    castingType: 'none',
    description: 'A versatile skill specialist capable of finding and disabling magical traps, dodging deadly effects, and striking with Sneak Attack.'
  },
  Sorcerer: {
    name: 'Sorcerer',
    category: 'Core',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Knowledge (Arcana)', 'Profession', 'Spellcraft'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'An innate arcane spellcaster whose magic comes from dragon blood or internal power, casting spontaneously without books.'
  },
  Wizard: {
    name: 'Wizard',
    category: 'Core',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge (all)', 'Profession', 'Spellcraft'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    hasSpecialistSlots: true,
    description: 'A scholarly master of arcane magic who transcribes spells into a spellbook and prepares exact daily spell slots.'
  },

  // =========================================================================
  // 4 EXPANDED PSIONICS BASE CLASSES (Ultimate SRD XPH)
  // =========================================================================
  Psion: {
    name: 'Psion',
    category: 'Psionic',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Autohypnosis', 'Concentration', 'Craft', 'Knowledge (all)', 'Profession', 'Psicraft'],
    castingType: 'psionic',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A master of the mind who manifests psionic powers through six disciplines (Seer, Shaper, Kineticist, Egoist, Nomad, Telepath).'
  },
  'Psychic Warrior': {
    name: 'Psychic Warrior',
    category: 'Psionic',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Autohypnosis', 'Climb', 'Concentration', 'Craft', 'Jump', 'Ride', 'Search', 'Swim'],
    castingType: 'psionic',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A psionic warrior who channels mental energy to augment physical strength, speed, and combat prowess.'
  },
  Soulknife: {
    name: 'Soulknife',
    category: 'Psionic',
    hitDie: 10,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 4,
    classSkills: [
      'Autohypnosis', 'Climb', 'Concentration', 'Craft', 'Hide', 'Jump',
      'Knowledge (psionics)', 'Listen', 'Move Silently', 'Profession', 'Spot', 'Tumble'
    ],
    castingType: 'none',
    description: 'A warrior who manifests a semi-solid blade of pure psychic energy (Mind Blade) and charges it with psychic strikes.'
  },
  Wilder: {
    name: 'Wilder',
    category: 'Psionic',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 4,
    classSkills: [
      'Autohypnosis', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Escape Artist',
      'Intimidate', 'Jump', 'Listen', 'Profession', 'Psicraft', 'Sense Motive', 'Spot', 'Swim', 'Tumble'
    ],
    castingType: 'psionic',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A passionate manifester whose raw emotions fuel powerful Wild Surges at the risk of psychic enervation.'
  },

  // =========================================================================
  // 5 CORE NPC BASE CLASSES (DMG SRD)
  // =========================================================================
  Adept: {
    name: 'Adept',
    category: 'NPC',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Handle Animal', 'Heal', 'Knowledge (all)', 'Profession', 'Spellcraft', 'Survival'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A minor spellcaster of a tribe or small community who prepares a blend of divine and arcane spells.'
  },
  Aristocrat: {
    name: 'Aristocrat',
    category: 'NPC',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 6,
    classSkills: [
      'Appraise', 'Bluff', 'Diplomacy', 'Disguise', 'Forgery', 'Gather Information', 'Handle Animal',
      'Intimidate', 'Knowledge (all)', 'Listen', 'Perform', 'Profession', 'Ride', 'Sense Motive',
      'Speak Language', 'Spot', 'Survival', 'Swim'
    ],
    castingType: 'none',
    description: 'A member of the nobility or wealthy elite trained in martial arms, social interaction, and high education.'
  },
  Commoner: {
    name: 'Commoner',
    category: 'NPC',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: [],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Craft', 'Handle Animal', 'Jump', 'Listen', 'Profession', 'Ride', 'Spot', 'Swim', 'Use Rope'],
    castingType: 'none',
    description: 'An everyday laborer, farmer, or peasant with basic civilian tool proficiencies.'
  },
  Expert: {
    name: 'Expert',
    category: 'NPC',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 6,
    classSkills: [],
    allowsCustomClassSkills: true,
    maxCustomClassSkills: 10,
    castingType: 'none',
    description: 'A master artisan, scholar, or specialist who selects any 10 chosen skills as permanent class skills.'
  },
  Warrior: {
    name: 'Warrior',
    category: 'NPC',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim'],
    castingType: 'none',
    description: 'A standard military soldier, town guard, or mercenary with full martial weapon proficiencies and full BAB.'
  },

  // =========================================================================
  // ICONIC PRESTIGE CLASSES (Core SRD)
  // =========================================================================
  'Arcane Archer': {
    name: 'Arcane Archer',
    category: 'Prestige',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Reflex'],
    baseSkillPoints: 4,
    classSkills: ['Craft', 'Hide', 'Listen', 'Move Silently', 'Ride', 'Spot', 'Survival', 'Use Rope'],
    castingType: 'none',
    description: 'An elven archer who infuses arrows with magical energy and spells.'
  },
  Archmage: {
    name: 'Archmage',
    category: 'Prestige',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Knowledge (all)', 'Profession', 'Search', 'Spellcraft'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A supreme master of arcane magic capable of High Sorcery and altering spell geometry.'
  },
  Assassin: {
    name: 'Assassin',
    category: 'Prestige',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 4,
    classSkills: [
      'Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device',
      'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump',
      'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot',
      'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'
    ],
    castingType: 'spontaneous_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any evil',
    description: 'A stealthy killer specializing in poison use, sneak attacks, and the deadly Death Attack.'
  },
  Blackguard: {
    name: 'Blackguard',
    category: 'Prestige',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Knowledge (religion)', 'Profession', 'Ride'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any evil',
    description: 'An unholy warrior championing darkness with Smite Good, fiendish servants, and sneak attacks.'
  },
  'Dragon Disciple': {
    name: 'Dragon Disciple',
    category: 'Prestige',
    hitDie: 12,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Gather Information', 'Knowledge (all)', 'Listen', 'Profession', 'Search', 'Speak Language', 'Spellcraft', 'Spot'],
    castingType: 'none',
    description: 'A character who embraces draconic heritage, gaining natural armor, breath weapons, ability boosts, and dragon apotheosis.'
  },
  Duelist: {
    name: 'Duelist',
    category: 'Prestige',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Reflex'],
    baseSkillPoints: 4,
    classSkills: ['Balance', 'Bluff', 'Escape Artist', 'Jump', 'Listen', 'Perform', 'Sense Motive', 'Spot', 'Tumble'],
    castingType: 'none',
    description: 'A nimble swashbuckler who relies on speed, precise strikes, and Canny Defense.'
  },
  'Dwarven Defender': {
    name: 'Dwarven Defender',
    category: 'Prestige',
    hitDie: 12,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Craft', 'Listen', 'Sense Motive', 'Spot'],
    castingType: 'none',
    alignmentRestriction: 'Any lawful',
    description: 'A resolute dwarven warrior who assumes a defensive stance to become an immovable wall.'
  },
  'Eldritch Knight': {
    name: 'Eldritch Knight',
    category: 'Prestige',
    hitDie: 6,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Jump', 'Knowledge (arcana)', 'Knowledge (nobility)', 'Ride', 'Sense Motive', 'Spellcraft', 'Swim'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A warrior-mage blending martial prowess with full arcane spellcasting advancement.'
  },
  'Horizon Walker': {
    name: 'Horizon Walker',
    category: 'Prestige',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 4,
    classSkills: ['Climb', 'Handle Animal', 'Hide', 'Knowledge (geography)', 'Listen', 'Move Silently', 'Profession', 'Ride', 'Spot', 'Survival'],
    castingType: 'none',
    description: 'A planar wanderer possessing terrain masteries and planar travel abilities.'
  },
  Loremaster: {
    name: 'Loremaster',
    category: 'Prestige',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 4,
    classSkills: ['Appraise', 'Concentration', 'Craft', 'Decipher Script', 'Gather Information', 'Handle Animal', 'Heal', 'Knowledge (all)', 'Perform', 'Profession', 'Speak Language', 'Spellcraft', 'Use Magic Device'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A seeker of secrets and lore capable of discovering universal truths and bonus metamagic secrets.'
  },
  'Mystic Theurge': {
    name: 'Mystic Theurge',
    category: 'Prestige',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Sense Motive', 'Spellcraft'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A hybrid caster who advances both arcane and divine spellcasting progressions simultaneously.'
  },
  Shadowdancer: {
    name: 'Shadowdancer',
    category: 'Prestige',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Bluff', 'Decipher Script', 'Diplomacy', 'Disguise', 'Escape Artist', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Perform', 'Profession', 'Search', 'Sleight of Hand', 'Spot', 'Tumble', 'Use Rope'],
    castingType: 'none',
    description: 'A master of darkness with Hide in Plain Sight, shadow illusions, shadow jumps, and summoning a shadow companion.'
  },

  // =========================================================================
  // COMPLETE ADVENTURER
  // =========================================================================
  Ninja: {
    name: 'Ninja',
    category: 'Supplement',
    sourceBook: 'Complete Adventurer',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Disable Device', 'Disguise', 'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble'],
    castingType: 'none',
    description: 'A master of stealth, espionage, and sudden assassination utilizing ki power, ghost step invisibility, and unarmored defense.'
  },
  Scout: {
    name: 'Scout',
    category: 'Supplement',
    sourceBook: 'Complete Adventurer',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Reflex'],
    baseSkillPoints: 8,
    classSkills: ['Balance', 'Climb', 'Craft', 'Disable Device', 'Escape Artist', 'Hide', 'Jump', 'Knowledge (dungeoneering)', 'Knowledge (geography)', 'Knowledge (nature)', 'Listen', 'Move Silently', 'Ride', 'Search', 'Sense Motive', 'Spot', 'Survival', 'Swim', 'Tumble', 'Use Rope'],
    castingType: 'none',
    description: 'A skirmishing wilderness operative who deals bonus damage and gains AC boosts by moving 10+ feet in combat, paired with fast movement and trapfinding.'
  },
  Spellthief: {
    name: 'Spellthief',
    category: 'Supplement',
    sourceBook: 'Complete Adventurer',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 6,
    classSkills: ['Appraise', 'Bluff', 'Concentration', 'Craft', 'Decipher Script', 'Disable Device', 'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (arcana)', 'Knowledge (local)', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Swim', 'Tumble', 'Use Magic Device'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 0.5,
    description: 'A roguish combatant who siphons spells, spell energy, resistance, and spell-like abilities directly from opponents and allies in combat.'
  },

  // =========================================================================
  // COMPLETE ARCANE
  // =========================================================================
  Warlock: {
    name: 'Warlock',
    category: 'Supplement',
    sourceBook: 'Complete Arcane',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Disguise', 'Intimidate', 'Jump', 'Knowledge (arcana)', 'Knowledge (the planes)', 'Knowledge (religion)', 'Profession', 'Sense Motive', 'Spellcraft', 'Use Magic Device'],
    castingType: 'invocations',
    spellAbility: 'CHA',
    description: 'A supernatural wielder of dark eldritch power who unleashes devastating Eldritch Blasts and at-will arcane invocations granted by an otherworldly pact.'
  },
  'Wu Jen': {
    name: 'Wu Jen',
    category: 'Supplement',
    sourceBook: 'Complete Arcane',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Knowledge (all)', 'Profession', 'Spellcraft'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'An Eastern hermetic arcane spellcaster who commands elemental masteries (Earth, Fire, Metal, Water, Wood) and spell secrets bound by personal taboos.'
  },

  // =========================================================================
  // COMPLETE DIVINE
  // =========================================================================
  Shugenja: {
    name: 'Shugenja',
    category: 'Supplement',
    sourceBook: 'Complete Divine',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Spellcraft'],
    castingType: 'spontaneous_divine',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A divine spontaneous caster attuned to the spirits and one of the four elemental orders (Air, Earth, Fire, or Water).'
  },
  'Spirit Shaman': {
    name: 'Spirit Shaman',
    category: 'Supplement',
    sourceBook: 'Complete Divine',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (geography)', 'Knowledge (history)', 'Knowledge (local)', 'Knowledge (nature)', 'Knowledge (religion)', 'Listen', 'Profession', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A shamanistic mystic guided by a personal spirit guide, capable of retrieving druidic spells daily and chastising spirits.'
  },

  // =========================================================================
  // COMPLETE PSIONIC
  // =========================================================================
  Ardent: {
    name: 'Ardent',
    category: 'Supplement',
    sourceBook: 'Complete Psionic',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Autohypnosis', 'Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (all)', 'Profession', 'Psicraft'],
    castingType: 'psionic',
    spellAbility: 'WIS',
    description: 'A passionate manifester of fundamental cosmic concepts who channels psionic mantles and philosophic power.'
  },
  'Divine Mind': {
    name: 'Divine Mind',
    category: 'Supplement',
    sourceBook: 'Complete Psionic',
    hitDie: 10,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Autohypnosis', 'Climb', 'Concentration', 'Craft', 'Jump', 'Knowledge (psionics)', 'Knowledge (religion)', 'Profession', 'Psicraft', 'Ride', 'Swim'],
    castingType: 'psionic',
    spellAbility: 'WIS',
    description: 'A devout psionic warrior who manifests divine mantles and projects continuous psychic auras to bolster companions.'
  },
  Erudite: {
    name: 'Erudite',
    category: 'Supplement',
    sourceBook: 'Complete Psionic',
    hitDie: 4,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Gather Information', 'Knowledge (all)', 'Profession', 'Psicraft'],
    castingType: 'psionic',
    spellAbility: 'INT',
    description: 'A psionic scholar who studies mental disciplines like a wizard studies magic, possessing an unlimited power repertoire with unique daily manifestation limits.'
  },
  Lurk: {
    name: 'Lurk',
    category: 'Supplement',
    sourceBook: 'Complete Psionic',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Autohypnosis', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Disguise', 'Escape Artist', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Profession', 'Psicraft', 'Search', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Psionic Device', 'Use Rope'],
    castingType: 'psionic',
    spellAbility: 'INT',
    description: 'A psionic assassin and shadow agent who enhances sneak attacks and martial strikes using versatile psionic augments.'
  },

  // =========================================================================
  // COMPLETE WARRIOR
  // =========================================================================
  Hexblade: {
    name: 'Hexblade',
    category: 'Supplement',
    sourceBook: 'Complete Warrior',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Knowledge (arcana)', 'Profession', 'Ride', 'Spellcraft'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 0.5,
    description: 'A dark martial combatant wielding debilitating curses, arcane resistance, mettle, a dark familiar, and limited arcane magic.'
  },
  Samurai: {
    name: 'Samurai',
    category: 'Supplement',
    sourceBook: 'Complete Warrior',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Sense Motive', 'Swim'],
    castingType: 'none',
    alignmentRestriction: 'Any lawful',
    description: 'An honorable warrior trained in the daisho (katana and wakizashi), two-sword fighting, and terrifying group staredowns.'
  },
  Swashbuckler: {
    name: 'Swashbuckler',
    category: 'Supplement',
    sourceBook: 'Complete Warrior',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 4,
    classSkills: ['Balance', 'Bluff', 'Climb', 'Craft', 'Diplomacy', 'Escape Artist', 'Jump', 'Profession', 'Sense Motive', 'Swim', 'Tumble', 'Use Rope'],
    castingType: 'none',
    description: 'An agile, witty fencer who combines Weapon Finesse, Grace, and Insightful Strike (adding Intelligence bonus to damage with finessable weapons).'
  },

  // =========================================================================
  // DRAGON COMPENDIUM
  // =========================================================================
  'Battle Dancer': {
    name: 'Battle Dancer',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Reflex'],
    baseSkillPoints: 4,
    classSkills: ['Balance', 'Climb', 'Escape Artist', 'Jump', 'Perform', 'Swim', 'Tumble'],
    castingType: 'none',
    description: 'An agile warrior who weaves acrobatics and dance with lethal unarmed strikes and Charisma-fueled unarmored AC defense.'
  },
  'Death Master': {
    name: 'Death Master',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 8,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Heal', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Spellcraft'],
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any evil',
    description: 'A dark devotee of Orcus who animates an undead minion, channels charnel touch, and prepares necromantic arcane spells.'
  },
  Jester: {
    name: 'Jester',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Bluff', 'Climb', 'Disguise', 'Escape Artist', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Move Silently', 'Perform', 'Search', 'Sleight of Hand', 'Tumble'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A comedic arcane performer whose scathing mockery, inspiring quips, and buffoonery confound enemies and rally comrades.'
  },
  Mountebank: {
    name: 'Mountebank',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 6,
    classSkills: ['Appraise', 'Balance', 'Bluff', 'Decipher Script', 'Diplomacy', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Tumble', 'Use Magic Device'],
    castingType: 'none',
    description: 'A devilish swindler bound to an infernal patron, capable of beguiling stares, deceptive attacks, and sudden teleporting hops.'
  },
  Savant: {
    name: 'Savant',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 8,
    classSkills: ['Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Jump', 'Knowledge (all)', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession', 'Ride', 'Search', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Survival', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'],
    allowsCustomClassSkills: true,
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    description: 'A master scholar and renaissance adventurer with universal skill mastery, academic lore, sneak attacks, and arcane/divine dabbling.'
  },
  "Sha'ir": {
    name: "Sha'ir",
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 8,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Diplomacy', 'Knowledge (arcana)', 'Knowledge (the planes)', 'Listen', 'Profession', 'Sense Motive', 'Spellcraft', 'Spot'],
    castingType: 'vancian_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A mystic arcane summoner accompanied by a gen familiar who journeys to the Elemental Planes to retrieve prepared spells.'
  },
  'Urban Druid': {
    name: 'Urban Druid',
    category: 'Supplement',
    sourceBook: 'Dragon Compendium',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 8,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Diplomacy', 'Gather Information', 'Handle Animal', 'Heal', 'Intimidate', 'Knowledge (architecture)', 'Knowledge (history)', 'Knowledge (local)', 'Listen', 'Profession', 'Sense Motive', 'Speak Language', 'Spellcraft', 'Spot', 'Survival'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A divine protector of city ecosystems who commands an urban companion, crowd-walks, and wild shapes into city animals and objects.'
  },

  // =========================================================================
  // DRAGON MAGIC
  // =========================================================================
  'Dragonfire Adept': {
    name: 'Dragonfire Adept',
    category: 'Supplement',
    sourceBook: 'Dragon Magic',
    hitDie: 8,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Appraise', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Intimidate', 'Jump', 'Knowledge (all)', 'Search', 'Sense Motive', 'Speak Language', 'Spellcraft', 'Use Magic Device'],
    castingType: 'invocations',
    spellAbility: 'CHA',
    description: 'A draconic adept who unleashes an at-will breath weapon (cone or line) and wields draconic invocations, scales, and senses.'
  },

  // =========================================================================
  // DRAGONLANCE CAMPAIGN SETTING
  // =========================================================================
  Mariner: {
    name: 'Mariner',
    category: 'Supplement',
    sourceBook: 'Dragonlance Campaign Setting',
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Reflex'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Climb', 'Craft', 'Escape Artist', 'Intimidate', 'Jump', 'Knowledge (geography)', 'Knowledge (nature)', 'Listen', 'Profession', 'Search', 'Spot', 'Survival', 'Swim', 'Tumble', 'Use Rope'],
    castingType: 'none',
    description: 'A seafaring combatant adept in dirty strikes, sea legs, waterborne acrobatics, and naval survival.'
  },
  Master: {
    name: 'Master',
    category: 'Supplement',
    sourceBook: 'Dragonlance Campaign Setting',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 8,
    classSkills: ['Appraise', 'Craft', 'Diplomacy', 'Knowledge (all)', 'Profession', 'Sense Motive'],
    castingType: 'none',
    description: 'A non-adventuring prodigy who reaches pinnacle mastery in Crafts, Performance, Academia, or Trades.'
  },
  Mystic: {
    name: 'Mystic',
    category: 'Supplement',
    sourceBook: 'Dragonlance Campaign Setting',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (religion)', 'Profession', 'Spellcraft'],
    castingType: 'spontaneous_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'A spontaneous divine caster of Krynn who channels the ambient divine energies of the heart through a chosen Domain.'
  },
  Nightstalker: {
    name: 'Nightstalker',
    category: 'Supplement',
    sourceBook: 'Dragonlance Campaign Setting',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Bluff', 'Climb', 'Concentration', 'Decipher Script', 'Disable Device', 'Escape Artist', 'Hide', 'Jump', 'Listen', 'Move Silently', 'Open Lock', 'Search', 'Sleight of Hand', 'Spot', 'Tumble'],
    castingType: 'spontaneous_divine',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A shadow operative bound to a ghost companion who wields darkling divine spirit magic and lethal death strikes.'
  },
  Noble: {
    name: 'Noble',
    category: 'Supplement',
    sourceBook: 'Dragonlance Campaign Setting',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 4,
    classSkills: ['Appraise', 'Bluff', 'Diplomacy', 'Disguise', 'Forgery', 'Gather Information', 'Handle Animal', 'Intimidate', 'Knowledge (all)', 'Listen', 'Perform', 'Profession', 'Ride', 'Sense Motive', 'Speak Language'],
    castingType: 'none',
    description: 'A charismatic aristocrat of Krynn who commands allies, calls in political favors, and coordinates tactical maneuvers.'
  },

  // =========================================================================
  // DUNGEONSCAPE
  // =========================================================================
  Factotum: {
    name: 'Factotum',
    category: 'Supplement',
    sourceBook: 'Dungeonscape',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 6,
    classSkills: ['Appraise', 'Autohypnosis', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Jump', 'Knowledge (all)', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession', 'Ride', 'Search', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Survival', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'],
    allowsCustomClassSkills: true,
    castingType: 'vancian_arcane',
    spellAbility: 'INT',
    description: 'A brilliant polymath who spends Inspiration Points each encounter to add Intelligence to attack, damage, saves, spellcasting dilettante, and extra standard actions.'
  },

  // =========================================================================
  // EBERRON CAMPAIGN SETTING
  // =========================================================================
  Artificer: {
    name: 'Artificer',
    category: 'Supplement',
    sourceBook: 'Eberron Campaign Setting',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Appraise', 'Concentration', 'Craft', 'Disable Device', 'Knowledge (arcana)', 'Knowledge (architecture)', 'Knowledge (the planes)', 'Open Lock', 'Profession', 'Search', 'Spellcraft', 'Use Magic Device'],
    castingType: 'infusions',
    spellAbility: 'INT',
    description: 'A master magical artisan who crafts magic items using a Craft Reserve, earns bonus item creation feats, and channels item-altering infusions.'
  },

  // =========================================================================
  // HEROES OF HORROR
  // =========================================================================
  Archivist: {
    name: 'Archivist',
    category: 'Supplement',
    sourceBook: 'Heroes of Horror',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Decipher Script', 'Heal', 'Knowledge (all)', 'Profession', 'Spellcraft'],
    castingType: 'vancian_divine',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A scholarly divine caster with a prayerbook that can learn any divine spell in existence, utilizing Dark Knowledge to give allies combat edges against aberrations, undead, and fiends.'
  },
  'Dread Necromancer': {
    name: 'Dread Necromancer',
    category: 'Supplement',
    sourceBook: 'Heroes of Horror',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Disguise', 'Hide', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (religion)', 'Profession', 'Spellcraft'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any nongood',
    description: 'A morbid arcane specialist wielding Charnel Touch, Rebuke Undead, massive undead command pools, and ultimate lich transformation at 20th level.'
  },

  // =========================================================================
  // MAGIC OF INCARNUM
  // =========================================================================
  Incarnate: {
    name: 'Incarnate',
    category: 'Supplement',
    sourceBook: 'Magic of Incarnum',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Knowledge (arcana)', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Spellcraft'],
    castingType: 'incarnum',
    spellAbility: 'WIS',
    description: 'A champion of pure alignment who shapes raw soul energy into soulmelds, investing essentia and binding chakras to manifest planar powers.'
  },
  Soulborn: {
    name: 'Soulborn',
    category: 'Supplement',
    sourceBook: 'Magic of Incarnum',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Jump', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Ride', 'Spellcraft', 'Swim'],
    castingType: 'incarnum',
    spellAbility: 'WIS',
    description: 'An extreme alignment knight who wields smites against opposing alignments, incarnum defenses, and martial soulmelds.'
  },
  Totemist: {
    name: 'Totemist',
    category: 'Supplement',
    sourceBook: 'Magic of Incarnum',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Reflex'],
    baseSkillPoints: 4,
    classSkills: ['Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Jump', 'Knowledge (nature)', 'Knowledge (the planes)', 'Listen', 'Profession', 'Ride', 'Spot', 'Survival', 'Swim'],
    castingType: 'incarnum',
    spellAbility: 'WIS',
    description: 'A wild channeler of magical beast spirits who binds soulmelds to form claws, fangs, wings, and natural armor.'
  },

  // =========================================================================
  // MINIATURES HANDBOOK
  // =========================================================================
  'Favored Soul': {
    name: 'Favored Soul',
    category: 'Supplement',
    sourceBook: 'Miniatures Handbook',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Reflex', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Jump', 'Knowledge (religion)', 'Profession', 'Sense Motive', 'Spellcraft'],
    castingType: 'spontaneous_divine',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A naturally chosen divine conduit possessing all three good saving throws, spontaneous divine casting, deity weapon perks, energy resistance, and angelic or batlike wings.'
  },
  Healer: {
    name: 'Healer',
    category: 'Supplement',
    sourceBook: 'Miniatures Handbook',
    hitDie: 8,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (nature)', 'Knowledge (religion)', 'Profession', 'Sense Motive', 'Spellcraft', 'Survival'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    alignmentRestriction: 'Any good',
    description: 'A dedicated miracle-worker who adds Charisma to healing spells, cleanses status afflictions, and rides a celestial unicorn companion.'
  },
  Marshal: {
    name: 'Marshal',
    category: 'Supplement',
    sourceBook: 'Miniatures Handbook',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Bluff', 'Diplomacy', 'Handle Animal', 'Intimidate', 'Knowledge (history)', 'Listen', 'Perform', 'Ride', 'Sense Motive', 'Spot', 'Survival', 'Swim'],
    castingType: 'none',
    description: 'A commanding battlefield officer whose Minor and Major Auras project Charisma-based bonuses to allies’ attacks, damage, checks, and saves.'
  },
  Warmage: {
    name: 'Warmage',
    category: 'Supplement',
    sourceBook: 'Miniatures Handbook',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (history)', 'Profession', 'Spellcraft'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'CHA',
    casterLevelMultiplier: 1.0,
    description: 'A military combat mage who casts spontaneous destructive evocation spells in armor without ASF and adds Intelligence to damage with Warmage Edge.'
  },

  // =========================================================================
  // ORIENTAL ADVENTURES
  // =========================================================================
  Shaman: {
    name: 'Shaman',
    category: 'Supplement',
    sourceBook: 'Oriental Adventures',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 4,
    classSkills: ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (religion)', 'Knowledge (spirits)', 'Profession', 'Spellcraft'],
    castingType: 'vancian_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 1.0,
    description: 'An East-Asian divine channeler who commands spirits, turns undead, communes with animal guides, and wields martial unarmed strikes.'
  },
  Sohei: {
    name: 'Sohei',
    category: 'Supplement',
    sourceBook: 'Oriental Adventures',
    hitDie: 10,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Iaijutsu Focus', 'Jump', 'Knowledge (religion)', 'Profession', 'Ride', 'Swim'],
    castingType: 'spontaneous_divine',
    spellAbility: 'WIS',
    casterLevelMultiplier: 0.5,
    alignmentRestriction: 'Any lawful',
    description: 'A monastic temple warrior who enters a focused Ki Frenzy, performs defensive strikes, and possesses mettle.'
  },

  // =========================================================================
  // PLAYER'S HANDBOOK II
  // =========================================================================
  Beguiler: {
    name: 'Beguiler',
    category: 'Supplement',
    sourceBook: "Player's Handbook II",
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Will'],
    baseSkillPoints: 6,
    classSkills: ['Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Jump', 'Knowledge (arcana)', 'Knowledge (local)', 'Listen', 'Move Silently', 'Open Lock', 'Profession', 'Search', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Spot', 'Swim', 'Tumble', 'Use Magic Device'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'A clever arcane manipulator who casts illusion and enchantment spells in light armor, utilizing cloaked casting and surprise casting.'
  },
  'Dragon Shaman': {
    name: 'Dragon Shaman',
    category: 'Supplement',
    sourceBook: "Player's Handbook II",
    hitDie: 10,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Craft', 'Intimidate', 'Knowledge (nature)', 'Search'],
    castingType: 'none',
    description: 'A warrior bonded to a draconic totem who projects draconic auras (vigor, presence, resistance), breathes elemental energy, and heals with Touch of Vitality.'
  },
  Duskblade: {
    name: 'Duskblade',
    category: 'Supplement',
    sourceBook: "Player's Handbook II",
    hitDie: 8,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Concentration', 'Craft', 'Decipher Script', 'Jump', 'Knowledge (all)', 'Ride', 'Spellcraft', 'Swim'],
    castingType: 'spontaneous_arcane',
    spellAbility: 'INT',
    casterLevelMultiplier: 1.0,
    description: 'The quintessential gish warrior who channels touch spells through melee weapon strikes, wears heavy armor without ASF, and quick-casts spells.'
  },
  Knight: {
    name: 'Knight',
    category: 'Supplement',
    sourceBook: "Player's Handbook II",
    hitDie: 12,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 2,
    classSkills: ['Climb', 'Handle Animal', 'Intimidate', 'Jump', 'Knowledge (nobility)', 'Ride', 'Swim'],
    castingType: 'none',
    alignmentRestriction: 'Any lawful',
    description: 'A chivalric champion of the battlefield whose Knight’s Challenge forces foes to attack him (Test of Mettle) while commanding high AC through shield blocks.'
  },

  // =========================================================================
  // TOME OF BATTLE: THE BOOK OF NINE SWORDS
  // =========================================================================
  Crusader: {
    name: 'Crusader',
    category: 'Supplement',
    sourceBook: 'Tome of Battle',
    hitDie: 10,
    babProgression: 'Full',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Jump', 'Knowledge (history)', 'Knowledge (religion)', 'Martial Lore', 'Ride', 'Swim'],
    castingType: 'maneuvers',
    spellAbility: 'CHA',
    description: 'A devoted martial holy warrior using a delayed damage pool (Steely Resolve), Furious Counterstrike, and Devoted Spirit/White Raven maneuvers.'
  },
  Swordsage: {
    name: 'Swordsage',
    category: 'Supplement',
    sourceBook: 'Tome of Battle',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex', 'Will'],
    baseSkillPoints: 6,
    classSkills: ['Balance', 'Climb', 'Concentration', 'Craft', 'Escape Artist', 'Heal', 'Hide', 'Intimidate', 'Jump', 'Knowledge (history)', 'Knowledge (local)', 'Knowledge (nobility)', 'Listen', 'Martial Lore', 'Move Silently', 'Profession', 'Ride', 'Sense Motive', 'Swim', 'Tumble'],
    castingType: 'maneuvers',
    spellAbility: 'WIS',
    description: 'A versatile master of martial arts wielding the widest variety of disciplines, adding Wisdom to AC and quick initiative.'
  },
  Warblade: {
    name: 'Warblade',
    category: 'Supplement',
    sourceBook: 'Tome of Battle',
    hitDie: 12,
    babProgression: 'Full',
    goodSaves: ['Fortitude'],
    baseSkillPoints: 4,
    classSkills: ['Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Intimidate', 'Jump', 'Knowledge (history)', 'Knowledge (local)', 'Martial Lore', 'Swim', 'Tumble'],
    castingType: 'maneuvers',
    spellAbility: 'INT',
    description: 'A tactical master of arms who adds Intelligence to Reflex, critical confirmations, and damage, able to swap weapon focus feats on the fly.'
  },

  // =========================================================================
  // TOME OF MAGIC
  // =========================================================================
  Binder: {
    name: 'Binder',
    category: 'Supplement',
    sourceBook: 'Tome of Magic',
    hitDie: 8,
    babProgression: 'Three-Quarter',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Bluff', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Gather Information', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (history)', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Sense Motive'],
    castingType: 'vestiges',
    spellAbility: 'CHA',
    description: 'An occult summoner who summons and binds the vestiges of forgotten entities to gain their supernatural powers, abilities, and personalities.'
  },
  Shadowcaster: {
    name: 'Shadowcaster',
    category: 'Supplement',
    sourceBook: 'Tome of Magic',
    hitDie: 6,
    babProgression: 'Half',
    goodSaves: ['Fortitude', 'Will'],
    baseSkillPoints: 2,
    classSkills: ['Concentration', 'Craft', 'Hide', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (the planes)', 'Move Silently', 'Profession', 'Spellcraft', 'Spot'],
    castingType: 'mysteries',
    spellAbility: 'INT',
    description: 'A practitioner of Shadow Magic who casts mysteries that evolve from spells to spell-like abilities and supernatural powers.'
  },
  Truenamer: {
    name: 'Truenamer',
    category: 'Supplement',
    sourceBook: 'Tome of Magic',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Will'],
    baseSkillPoints: 4,
    classSkills: ['Concentration', 'Craft', 'Knowledge (all)', 'Perform', 'Truespeak', 'Use Magic Device'],
    castingType: 'truenames',
    spellAbility: 'INT',
    description: 'A scholar who commands the fundamental syllables of the universe through Truespeak, altering reality by uttering true names.'
  },

  // =========================================================================
  // WOTC ARCHIVE / WEB ENHANCEMENT
  // =========================================================================
  'Psychic Rogue': {
    name: 'Psychic Rogue',
    category: 'Supplement',
    sourceBook: 'WotC Website',
    hitDie: 6,
    babProgression: 'Three-Quarter',
    goodSaves: ['Reflex'],
    baseSkillPoints: 6,
    classSkills: ['Appraise', 'Autohypnosis', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Knowledge (psionics)', 'Knowledge (local)', 'Listen', 'Move Silently', 'Open Lock', 'Profession', 'Psicraft', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Psionic Device', 'Use Rope'],
    castingType: 'psionic',
    spellAbility: 'INT',
    description: 'A stealth operative who blends psionic manifestations with sneak attacks, trapfinding, and mental infiltration.'
  }
};

/**
 * Finds the class rule definition by name (case-insensitive fuzzy match)
 */
export function find35eClassRule(className: string): Dnd35eClassRuleDefinition | null {
  if (!className) return null;
  const clean = className.trim().toLowerCase();

  // Exact match
  for (const [key, def] of Object.entries(DND35E_ALL_CLASS_RULES)) {
    if (key.toLowerCase() === clean) return def;
  }

  // Substring match
  for (const [key, def] of Object.entries(DND35E_ALL_CLASS_RULES)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return def;
    }
  }

  return null;
}

/**
 * Calculates BAB for a specific class and level using official 3.5e progression tables
 */
export function calculateClassBab(className: string, classLevel: number): number {
  const lvl = Math.max(1, classLevel || 1);
  const rule = find35eClassRule(className);

  if (rule) {
    if (rule.babProgression === 'Full') return lvl;
    if (rule.babProgression === 'Three-Quarter') return Math.floor(lvl * 0.75);
    return Math.floor(lvl * 0.5);
  }

  // Fallback heuristic
  const lower = className.toLowerCase();
  if (lower.includes('fighter') || lower.includes('paladin') || lower.includes('ranger') || lower.includes('barbarian') || lower.includes('warrior')) {
    return lvl;
  }
  if (lower.includes('wizard') || lower.includes('sorcerer') || lower.includes('psion') || lower.includes('adept') || lower.includes('commoner')) {
    return Math.floor(lvl * 0.5);
  }
  return Math.floor(lvl * 0.75);
}

/**
 * Monk Flurry of Blows attack progression matrix (D&D 3.5e PHB p. 40)
 * Returns the exact flurry attack bonuses relative to primary attack bonus
 */
export interface MonkFlurryStep {
  attackIndex: number;
  label: string;
  penalty: number;
  bonus: number;
  isExtraAttack: boolean;
}

export function get35eMonkFlurryAttacks(monkLevel: number, primaryAttackBonus: number): MonkFlurryStep[] {
  const lvl = Math.max(1, monkLevel || 1);

  // Table 3-10: The Monk
  // Levels 1-4: -2/-2
  // Levels 5-7: -1/-1
  // Levels 8-10: +0/+0
  // Level 11+ (Greater Flurry): +0/+0/+0
  const penalty = lvl >= 9 ? 0 : lvl >= 5 ? -1 : -2;
  const isGreaterFlurry = lvl >= 11;

  // Base attacks from Monk BAB:
  // Monk is 3/4 BAB:
  // Lvl 1-7: 1 base attack (+ 1 flurry extra = 2 attacks)
  // Lvl 8-14: 2 base attacks (+ 1 flurry extra = 3 attacks, or +2 greater flurry = 4 attacks)
  // Lvl 15-20: 3 base attacks (+ 2 greater flurry = 5 attacks)
  const baseAttackCount = lvl >= 15 ? 3 : lvl >= 8 ? 2 : 1;
  const extraFlurryCount = isGreaterFlurry ? 2 : 1;

  const steps: MonkFlurryStep[] = [];
  let currentIndex = 0;

  // Primary flurry attack
  steps.push({
    attackIndex: currentIndex++,
    label: `Flurry 1st (${penalty >= 0 ? '+' : ''}${penalty})`,
    penalty,
    bonus: primaryAttackBonus + penalty,
    isExtraAttack: false
  });

  // Extra flurry attack(s) at highest BAB
  for (let i = 0; i < extraFlurryCount; i++) {
    steps.push({
      attackIndex: currentIndex++,
      label: isGreaterFlurry ? `Greater Flurry #${i + 1} (${penalty >= 0 ? '+' : ''}${penalty})` : `Flurry Extra (${penalty >= 0 ? '+' : ''}${penalty})`,
      penalty,
      bonus: primaryAttackBonus + penalty,
      isExtraAttack: true
    });
  }

  // Iterative attacks from BAB (each at -5 from base)
  for (let i = 1; i < baseAttackCount; i++) {
    const iterPenalty = penalty - (i * 5);
    steps.push({
      attackIndex: currentIndex++,
      label: `Flurry Iterative #${i} (${iterPenalty >= 0 ? '+' : ''}${iterPenalty})`,
      penalty: iterPenalty,
      bonus: primaryAttackBonus + iterPenalty,
      isExtraAttack: false
    });
  }

  return steps;
}
