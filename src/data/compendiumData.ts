import { CharacterData, Spell, Feat, ClassFeature } from '../types';
import { OFFICIAL_BULK_MONSTERS, OFFICIAL_5E_FEATS, OFFICIAL_35E_FEATS, OFFICIAL_5E_CLASS_FEATURES, OFFICIAL_35E_CLASS_FEATURES } from './srdRulesLibrary';
import { PRESET_5E_SPELLS, PRESET_35E_SPELLS } from './presetSpells';

export type CompendiumCategory = 'monsters' | 'spells' | 'items' | 'classes' | 'races' | 'feats' | 'features' | 'skills';

export interface CompendiumItem {
  id: string;
  name: string;
  category: CompendiumCategory;
  edition?: '5e' | '3.5e' | 'pathfinder' | 'shadowrun' | 'cthulhu';
  description: string;
  source: string; // e.g. "SRD 5e", "3.5e Core", "Custom DM Entry"
  isCustom?: boolean;
  tags?: string[];
  
  // Specific payload fields based on category
  monsterData?: Partial<CharacterData>;
  spellData?: Partial<Spell>;
  featData?: Partial<Feat>;
  featureData?: Partial<ClassFeature>;
  itemData?: {
    type?: 'weapon' | 'armor' | 'shield' | 'potion' | 'ring' | 'scroll' | 'wand' | 'gear' | 'treasure';
    cost?: string;
    weight?: number;
    damage?: string;
    damageType?: string;
    armorClass?: number;
    rarity?: string;
    attunement?: boolean;
    properties?: string[];
  };
  classData?: {
    hitDie?: string;
    primaryAbility?: string;
    savingThrows?: string[];
    subclasses?: string[];
    subclassDetails?: Array<{ name: string; description: string; features?: string[] }>;
    role?: string;
    proficiencies?: {
      armor?: string[];
      weapons?: string[];
      tools?: string[];
      savingThrows?: string[];
      skills?: string;
    };
    spellcasting?: {
      type?: 'None' | 'Full' | 'Half' | 'Third' | 'Pact';
      ability?: string;
      notes?: string;
    };
    featuresByLevel?: Array<{
      level: number;
      name: string;
      description: string;
      actionType?: string;
      uses?: string;
    }>;
  };
  raceData?: {
    size?: string;
    speed?: number;
    speedNotes?: string;
    creatureType?: string;
    abilityBonuses?: Array<{ ability: string; bonus: number }>;
    abilityBonusesStr?: string;
    traits?: Array<{ name: string; description: string; actionType?: string; recharge?: string }>;
    subraces?: Array<{ name: string; description: string; traitBonus?: string }> | string[];
    languages?: string[];
    darkvision?: boolean;
    senses?: string;
    ageAndLifespan?: string;
    alignmentTendencies?: string;
  };
  skillData?: {
    ability?: string;
    system?: string;
    exampleUses?: string[];
  };
}

export const STORAGE_KEY_CUSTOM_COMPENDIUM = 'dnd_app_custom_compendium_v1';

// Base SRD Skills
export const BASE_COMPENDIUM_SKILLS: CompendiumItem[] = [
  {
    id: 'skill-acrobatics',
    name: 'Acrobatics',
    category: 'skills',
    edition: '5e',
    description: 'Covers your attempt to stay on your feet in a tricky situation, such as when you’re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship deck.',
    source: 'SRD 5e',
    skillData: {
      ability: 'DEX',
      system: 'D&D 5e',
      exampleUses: ['Balancing on thin ledges', 'Performing flips and tumbles', 'Escaping grapples using dexterity']
    }
  },
  {
    id: 'skill-animal-handling',
    name: 'Animal Handling',
    category: 'skills',
    edition: '5e',
    description: 'Determines your ability to calm down a domesticated animal, keep a mount from getting frightened, or intuit an animal’s intentions.',
    source: 'SRD 5e',
    skillData: {
      ability: 'WIS',
      system: 'D&D 5e',
      exampleUses: ['Calming a wild beast', 'Controlling a mount in combat', 'Understanding animal behavior']
    }
  },
  {
    id: 'skill-arcana',
    name: 'Arcana',
    category: 'skills',
    edition: '5e',
    description: 'Measures your recall of lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.',
    source: 'SRD 5e',
    skillData: {
      ability: 'INT',
      system: 'D&D 5e',
      exampleUses: ['Identifying magical runes and glyphs', 'Recognizing spell casting', 'Knowledge of planar portals']
    }
  },
  {
    id: 'skill-athletics',
    name: 'Athletics',
    category: 'skills',
    edition: '5e',
    description: 'Covers difficult situations you encounter while climbing, jumping, or swimming. Also used for grappling and shoving opponents.',
    source: 'SRD 5e',
    skillData: {
      ability: 'STR',
      system: 'D&D 5e',
      exampleUses: ['Climbing sheer cliffs', 'Long jumping over chasms', 'Grappling or shoving foes in melee']
    }
  },
  {
    id: 'skill-deception',
    name: 'Deception',
    category: 'skills',
    edition: '5e',
    description: 'Determines whether you can convincingly hide the truth, either verbally or through your actions (bluffing, disguises, fast-talking).',
    source: 'SRD 5e',
    skillData: {
      ability: 'CHA',
      system: 'D&D 5e',
      exampleUses: ['Passing off a disguise', 'Lying to guards', 'Bluffing in gambling games']
    }
  },
  {
    id: 'skill-history',
    name: 'History',
    category: 'skills',
    edition: '5e',
    description: 'Measures your recall about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.',
    source: 'SRD 5e',
    skillData: {
      ability: 'INT',
      system: 'D&D 5e',
      exampleUses: ['Identifying heraldry and crests', 'Recalling ancient lore', 'Recognizing historical landmarks']
    }
  },
  {
    id: 'skill-insight',
    name: 'Insight',
    category: 'skills',
    edition: '5e',
    description: 'Determines whether you can determine the true intentions of a creature, such as searching out a lie or predicting someone’s next move.',
    source: 'SRD 5e',
    skillData: {
      ability: 'WIS',
      system: 'D&D 5e',
      exampleUses: ['Detecting lies during interrogation', 'Reading body language', 'Sensing hidden motives']
    }
  },
  {
    id: 'skill-intimidation',
    name: 'Intimidation',
    category: 'skills',
    edition: '5e',
    description: 'When you attempt to influence someone through overt threats, hostile actions, and physical violence.',
    source: 'SRD 5e',
    skillData: {
      ability: 'CHA',
      system: 'D&D 5e',
      exampleUses: ['Prying information from prisoners', 'Coercing thugs to back down', 'Demonstrating terrifying force']
    }
  },
  {
    id: 'skill-investigation',
    name: 'Investigation',
    category: 'skills',
    edition: '5e',
    description: 'When you look around for clues and make deductions based on those clues (deducing secret doors, examining crime scenes, research).',
    source: 'SRD 5e',
    skillData: {
      ability: 'INT',
      system: 'D&D 5e',
      exampleUses: ['Searching for hidden compartment or traps', 'Analyzing crime scenes', 'Deciphering coded ciphers']
    }
  },
  {
    id: 'skill-medicine',
    name: 'Medicine',
    category: 'skills',
    edition: '5e',
    description: 'Allows you to stabilize a dying companion or diagnose an illness, poison, or cause of death.',
    source: 'SRD 5e',
    skillData: {
      ability: 'WIS',
      system: 'D&D 5e',
      exampleUses: ['Stabilizing 0 HP allies', 'Diagnosing poisons and diseases', 'Determining cause of death']
    }
  },
  {
    id: 'skill-nature',
    name: 'Nature',
    category: 'skills',
    edition: '5e',
    description: 'Measures your recall of lore about terrain, plants and animals, weather, and natural cycles.',
    source: 'SRD 5e',
    skillData: {
      ability: 'INT',
      system: 'D&D 5e',
      exampleUses: ['Identifying edible plants & berries', 'Predicting weather changes', 'Knowledge of beast habitats']
    }
  },
  {
    id: 'skill-perception',
    name: 'Perception',
    category: 'skills',
    edition: '5e',
    description: 'Lets you spot, hear, or otherwise detect the presence of something. Measures your general awareness of your surroundings and keenness of senses.',
    source: 'SRD 5e',
    skillData: {
      ability: 'WIS',
      system: 'D&D 5e',
      exampleUses: ['Spotting hidden ambushes or stealthy foes', 'Overhearing whispered conversations', 'Noticing faint scents']
    }
  },
  {
    id: 'skill-performance',
    name: 'Performance',
    category: 'skills',
    edition: '5e',
    description: 'Determines how well you can delight an audience with music, dance, acting, storytelling, or another form of entertainment.',
    source: 'SRD 5e',
    skillData: {
      ability: 'CHA',
      system: 'D&D 5e',
      exampleUses: ['Playing musical instruments in taverns', 'Delivering heroic speeches', 'Entertaining nobles']
    }
  },
  {
    id: 'skill-persuasion',
    name: 'Persuasion',
    category: 'skills',
    edition: '5e',
    description: 'Used when you attempt to influence someone or a group of people with tact, social graces, or good nature.',
    source: 'SRD 5e',
    skillData: {
      ability: 'CHA',
      system: 'D&D 5e',
      exampleUses: ['Negotiating peace treaties or prices', 'Convincing NPCs to offer aid', 'Charming guards']
    }
  },
  {
    id: 'skill-religion',
    name: 'Religion',
    category: 'skills',
    edition: '5e',
    description: 'Measures your recall of lore about deities, rites and prayers, religious hierarchies, holy symbols, and secret cults.',
    source: 'SRD 5e',
    skillData: {
      ability: 'INT',
      system: 'D&D 5e',
      exampleUses: ['Recognizing holy symbols', 'Knowledge of divine pantheons', 'Identifying unholy rituals']
    }
  },
  {
    id: 'skill-sleight-of-hand',
    name: 'Sleight of Hand',
    category: 'skills',
    edition: '5e',
    description: 'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object.',
    source: 'SRD 5e',
    skillData: {
      ability: 'DEX',
      system: 'D&D 5e',
      exampleUses: ['Pickpocketing coins or keys', 'Concealing weapons', 'Palming small items unnoticed']
    }
  },
  {
    id: 'skill-stealth',
    name: 'Stealth',
    category: 'skills',
    edition: '5e',
    description: 'Used when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone.',
    source: 'SRD 5e',
    skillData: {
      ability: 'DEX',
      system: 'D&D 5e',
      exampleUses: ['Moving silently', 'Hiding in shadows', 'Sneaking past sentries']
    }
  },
  {
    id: 'skill-survival',
    name: 'Survival',
    category: 'skills',
    edition: '5e',
    description: 'Used when following tracks, hunting wild game, guiding your group through frozen wastelands, or identifying signs of nearby monsters.',
    source: 'SRD 5e',
    skillData: {
      ability: 'WIS',
      system: 'D&D 5e',
      exampleUses: ['Tracking prey or enemies through the wilderness', 'Navigating unmapped terrain', 'Foraging for food & water']
    }
  }
];

// Base SRD Core Classes
export const BASE_COMPENDIUM_CLASSES: CompendiumItem[] = [
  {
    id: 'class-barbarian',
    name: 'Barbarian',
    category: 'classes',
    edition: '5e',
    description: 'A fierce warrior of primitive background who can enter a battle rage to gain phenomenal strength and resistance.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd12',
      primaryAbility: 'Strength',
      savingThrows: ['Strength', 'Constitution'],
      subclasses: ['Path of the Berserker', 'Path of the Totem Warrior'],
      role: 'Melee Frontliner, Tank, Damage Dealer'
    }
  },
  {
    id: 'class-bard',
    name: 'Bard',
    category: 'classes',
    edition: '5e',
    description: 'An inspiring magician whose power echoes the music of creation, weaving spells and song to bolster allies and manipulate foes.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Charisma',
      savingThrows: ['Dexterity', 'Charisma'],
      subclasses: ['College of Lore', 'College of Valor'],
      role: 'Support, Full Spellcaster, Skill Specialist'
    }
  },
  {
    id: 'class-cleric',
    name: 'Cleric',
    category: 'classes',
    edition: '5e',
    description: 'A priestly champion who wields divine magic in service of a higher power, granting healing, protection, and holy wrath.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Wisdom',
      savingThrows: ['Wisdom', 'Charisma'],
      subclasses: ['Life Domain', 'Light Domain', 'War Domain', 'Trickery Domain', 'Knowledge Domain', 'Nature Domain', 'Tempest Domain'],
      role: 'Healer, Divine Spellcaster, Support'
    }
  },
  {
    id: 'class-druid',
    name: 'Druid',
    category: 'classes',
    edition: '5e',
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms through Wild Shape.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Wisdom',
      savingThrows: ['Intelligence', 'Wisdom'],
      subclasses: ['Circle of the Land', 'Circle of the Moon'],
      role: 'Nature Spellcaster, Shapeshifter, Utility'
    }
  },
  {
    id: 'class-fighter',
    name: 'Fighter',
    category: 'classes',
    edition: '5e',
    description: 'A master of martial combat, skilled with a variety of weapons and armor types.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd10',
      primaryAbility: 'Strength or Dexterity',
      savingThrows: ['Strength', 'Constitution'],
      subclasses: ['Champion', 'Battle Master', 'Eldritch Knight'],
      role: 'Martial Combatant, Weapon Specialist, Tank'
    }
  },
  {
    id: 'class-monk',
    name: 'Monk',
    category: 'classes',
    edition: '5e',
    description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection through Ki.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Dexterity & Wisdom',
      savingThrows: ['Strength', 'Dexterity'],
      subclasses: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'],
      role: 'Unarmed Skirmisher, Mobility Master, Flurry Damage'
    }
  },
  {
    id: 'class-paladin',
    name: 'Paladin',
    category: 'classes',
    edition: '5e',
    description: 'A holy warrior bound to a sacred oath, combining martial prowess with divine smite and protective aura magic.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd10',
      primaryAbility: 'Strength & Charisma',
      savingThrows: ['Wisdom', 'Charisma'],
      subclasses: ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance'],
      role: 'Holy Tank, Burst Damage, Party Aura Support'
    }
  },
  {
    id: 'class-ranger',
    name: 'Ranger',
    category: 'classes',
    edition: '5e',
    description: 'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd10',
      primaryAbility: 'Dexterity & Wisdom',
      savingThrows: ['Strength', 'Dexterity'],
      subclasses: ['Hunter', 'Beast Master'],
      role: 'Ranged/Dual-Wield Striker, Wilderness Scout'
    }
  },
  {
    id: 'class-rogue',
    name: 'Rogue',
    category: 'classes',
    edition: '5e',
    description: 'A scoundrel who uses stealth, agility, and trickery to overcome obstacles and strike enemies where it hurts most with Sneak Attack.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Dexterity',
      savingThrows: ['Dexterity', 'Intelligence'],
      subclasses: ['Thief', 'Assassin', 'Arcane Trickster'],
      role: 'Skill Expert, Stealth Striker, Lockpicker'
    }
  },
  {
    id: 'class-sorcerer',
    name: 'Sorcerer',
    category: 'classes',
    edition: '5e',
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline, shaping spells using Metamagic.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd6',
      primaryAbility: 'Charisma',
      savingThrows: ['Constitution', 'Charisma'],
      subclasses: ['Draconic Bloodline', 'Wild Magic'],
      role: 'Arcane Blaster, Metamagic Specialist'
    }
  },
  {
    id: 'class-warlock',
    name: 'Warlock',
    category: 'classes',
    edition: '5e',
    description: 'A wielder of magic that is derived from a bargain with an otherworldly patron.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd8',
      primaryAbility: 'Charisma',
      savingThrows: ['Wisdom', 'Charisma'],
      subclasses: ['The Fiend', 'The Archfey', 'The Great Old One'],
      role: 'Pact Magic Blaster (Eldritch Blast), Invocations Utility'
    }
  },
  {
    id: 'class-wizard',
    name: 'Wizard',
    category: 'classes',
    edition: '5e',
    description: 'A scholarly magic-user capable of manipulating the structures of reality through learned spellcraft and spellbook research.',
    source: 'SRD 5e',
    classData: {
      hitDie: 'd6',
      primaryAbility: 'Intelligence',
      savingThrows: ['Intelligence', 'Wisdom'],
      subclasses: ['School of Evocation', 'School of Abjuration', 'School of Conjuration', 'School of Divination', 'School of Enchantment', 'School of Illusion', 'School of Necromancy', 'School of Transmutation'],
      role: 'Versatile Arcane Controller, Utility Master'
    }
  }
];

// Base SRD Races / Lineages
export const BASE_COMPENDIUM_RACES: CompendiumItem[] = [
  {
    id: 'race-human',
    name: 'Human',
    category: 'races',
    edition: '5e',
    description: 'Versatile and adaptable, humans are among the most numerous and driven peoples in the realms, capable of excelling in any pursuit.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Medium', 'Versatile'],
    raceData: {
      size: 'Medium',
      speed: 30,
      creatureType: 'Humanoid',
      abilityBonuses: [
        { ability: 'STR', bonus: 1 }, { ability: 'DEX', bonus: 1 }, { ability: 'CON', bonus: 1 },
        { ability: 'INT', bonus: 1 }, { ability: 'WIS', bonus: 1 }, { ability: 'CHA', bonus: 1 }
      ],
      abilityBonusesStr: '+1 to all Ability Scores (or Variant +1/+1 with Feat)',
      languages: ['Common', 'One extra language of choice'],
      traits: [
        { name: 'Versatility', description: 'Gains proficiency in one extra skill of your choice, or standard +1 to all ability scores.' }
      ]
    }
  },
  {
    id: 'race-elf',
    name: 'Elf',
    category: 'races',
    edition: '5e',
    description: 'A magical people of otherworldly grace, living in the world but not entirely part of it. Elves love nature and magic, art and artistry.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Medium', 'Fey Ancestry', 'Darkvision'],
    raceData: {
      size: 'Medium',
      speed: 30,
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'DEX', bonus: 2 }],
      abilityBonusesStr: '+2 Dexterity (+1 INT for High Elf, +1 WIS for Wood Elf, +1 CHA for Drow)',
      darkvision: true,
      senses: 'Darkvision 60 ft.',
      languages: ['Common', 'Elvish'],
      subraces: ['High Elf', 'Wood Elf', 'Dark Elf (Drow)'],
      traits: [
        { name: 'Darkvision', description: 'Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions out to 60 ft.' },
        { name: 'Keen Senses', description: 'You have proficiency in the Perception skill.' },
        { name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic cannot put you to sleep.' },
        { name: 'Trance', description: 'Elves do not sleep. Instead they meditate deeply for 4 hours a day, gaining the same benefit as 8 hours of human sleep.' }
      ]
    }
  },
  {
    id: 'race-dwarf',
    name: 'Dwarf',
    category: 'races',
    edition: '5e',
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. They value tradition and ancestral honor.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Medium', 'Poison Resilience', 'Darkvision'],
    raceData: {
      size: 'Medium',
      speed: 25,
      speedNotes: '25 ft. (Speed not reduced by wearing heavy armor)',
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'CON', bonus: 2 }],
      abilityBonusesStr: '+2 Constitution (+1 WIS for Hill Dwarf, +2 STR for Mountain Dwarf)',
      darkvision: true,
      senses: 'Darkvision 60 ft.',
      languages: ['Common', 'Dwarvish'],
      subraces: ['Hill Dwarf', 'Mountain Dwarf'],
      traits: [
        { name: 'Darkvision', description: 'Accustomed to life underground, you have superior vision in dark and dim conditions out to 60 ft.' },
        { name: 'Dwarven Resilience', description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' },
        { name: 'Dwarven Combat Training', description: 'Proficiency with battleaxe, handaxe, light hammer, and warhammer.' },
        { name: 'Stonecunning', description: 'Double proficiency bonus on History checks related to the origin of stonework.' }
      ]
    }
  },
  {
    id: 'race-halfling',
    name: 'Halfling',
    category: 'races',
    edition: '5e',
    description: 'The diminutive halflings survive in a world full of larger creatures by avoiding notice or, barring that, avoiding offense.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Small', 'Lucky', 'Brave'],
    raceData: {
      size: 'Small',
      speed: 25,
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'DEX', bonus: 2 }],
      abilityBonusesStr: '+2 Dexterity (+1 CHA for Lightfoot, +1 CON for Stout)',
      languages: ['Common', 'Halfling'],
      subraces: ['Lightfoot Halfling', 'Stout Halfling'],
      traits: [
        { name: 'Lucky', description: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' },
        { name: 'Brave', description: 'You have advantage on saving throws against being frightened.' },
        { name: 'Halfling Nimbleness', description: 'You can move through the space of any creature that is of a size larger than yours.' }
      ]
    }
  },
  {
    id: 'race-dragonborn',
    name: 'Dragonborn',
    category: 'races',
    edition: '5e',
    description: 'Born of dragons, as their name proclaims, the dragonborn walk proudly through a world that greets them with fearful incomprehension.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Medium', 'Breath Weapon', 'Draconic Resistance'],
    raceData: {
      size: 'Medium',
      speed: 30,
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'STR', bonus: 2 }, { ability: 'CHA', bonus: 1 }],
      abilityBonusesStr: '+2 Strength, +1 Charisma',
      languages: ['Common', 'Draconic'],
      traits: [
        { name: 'Draconic Ancestry', description: 'You have draconic ancestry (Black, Blue, Brass, Bronze, Copper, Gold, Green, Red, Silver, or White).' },
        { name: 'Breath Weapon', description: 'Exhale destructive elemental energy (2d6 damage, scaling at levels 6, 11, 16) in a 15ft cone or 30ft line once per short/long rest.' },
        { name: 'Damage Resistance', description: 'You have resistance to the damage type associated with your draconic ancestry.' }
      ]
    }
  },
  {
    id: 'race-gnome',
    name: 'Gnome',
    category: 'races',
    edition: '5e',
    description: 'A constant hum of busy activity pervades the warrens and neighborhoods where gnomes form their close-knit communities.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Small', 'Gnome Cunning', 'Darkvision'],
    raceData: {
      size: 'Small',
      speed: 25,
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'INT', bonus: 2 }],
      abilityBonusesStr: '+2 Intelligence (+1 DEX for Forest Gnome, +1 CON for Rock Gnome)',
      darkvision: true,
      senses: 'Darkvision 60 ft.',
      languages: ['Common', 'Gnomish'],
      subraces: ['Forest Gnome', 'Rock Gnome'],
      traits: [
        { name: 'Darkvision', description: 'Superior vision in dark and dim conditions out to 60 ft.' },
        { name: 'Gnome Cunning', description: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' }
      ]
    }
  },
  {
    id: 'race-tiefling',
    name: 'Tiefling',
    category: 'races',
    edition: '5e',
    description: 'To be greeted with stares and whispers, to suffer violence and insult on the street: this is the lot of the tiefling.',
    source: 'SRD 5e',
    tags: ['Humanoid', 'Medium', 'Hellish Resistance', 'Infernal Legacy', 'Darkvision'],
    raceData: {
      size: 'Medium',
      speed: 30,
      creatureType: 'Humanoid',
      abilityBonuses: [{ ability: 'CHA', bonus: 2 }, { ability: 'INT', bonus: 1 }],
      abilityBonusesStr: '+2 Charisma, +1 Intelligence',
      darkvision: true,
      senses: 'Darkvision 60 ft.',
      languages: ['Common', 'Infernal'],
      traits: [
        { name: 'Darkvision', description: 'Superior vision in dark and dim conditions out to 60 ft.' },
        { name: 'Hellish Resistance', description: 'You have resistance to fire damage.' },
        { name: 'Infernal Legacy', description: 'Thaumaturgy cantrip (Level 1), Hellish Rebuke 2nd-level (Level 3), Darkness (Level 5) once per long rest using CHA.' }
      ]
    }
  }
];

// Base Equipment / Items
export const BASE_COMPENDIUM_ITEMS: CompendiumItem[] = [
  {
    id: 'item-longsword',
    name: 'Longsword',
    category: 'items',
    edition: '5e',
    description: 'A classic versatile blade used by knights and soldiers.',
    source: 'SRD 5e',
    itemData: {
      type: 'weapon',
      cost: '15 gp',
      weight: 3,
      damage: '1d8',
      damageType: 'Slashing',
      properties: ['Versatile (1d10)', 'Martial Weapon']
    }
  },
  {
    id: 'item-dagger',
    name: 'Dagger',
    category: 'items',
    edition: '5e',
    description: 'A small, easily concealed blade favored by rogues and travelers.',
    source: 'SRD 5e',
    itemData: {
      type: 'weapon',
      cost: '2 gp',
      weight: 1,
      damage: '1d4',
      damageType: 'Piercing',
      properties: ['Finesse', 'Light', 'Thrown (20/60)']
    }
  },
  {
    id: 'item-greatsword',
    name: 'Greatsword',
    category: 'items',
    edition: '5e',
    description: 'A massive two-handed sword capable of cleaving through armored foes.',
    source: 'SRD 5e',
    itemData: {
      type: 'weapon',
      cost: '50 gp',
      weight: 6,
      damage: '2d6',
      damageType: 'Slashing',
      properties: ['Heavy', 'Two-Handed', 'Martial Weapon']
    }
  },
  {
    id: 'item-shortbow',
    name: 'Shortbow',
    category: 'items',
    edition: '5e',
    description: 'A standard curved wooden bow for ranged attacks.',
    source: 'SRD 5e',
    itemData: {
      type: 'weapon',
      cost: '25 gp',
      weight: 2,
      damage: '1d6',
      damageType: 'Piercing',
      properties: ['Ammunition (80/320)', 'Two-Handed']
    }
  },
  {
    id: 'item-longbow',
    name: 'Longbow',
    category: 'items',
    edition: '5e',
    description: 'A tall bow capable of sending arrows across immense distances.',
    source: 'SRD 5e',
    itemData: {
      type: 'weapon',
      cost: '50 gp',
      weight: 2,
      damage: '1d8',
      damageType: 'Piercing',
      properties: ['Ammunition (150/600)', 'Heavy', 'Two-Handed']
    }
  },
  {
    id: 'item-chain-shirt',
    name: 'Chain Shirt',
    category: 'items',
    edition: '5e',
    description: 'Made of interlocking metal rings worn between layers of clothing or leather.',
    source: 'SRD 5e',
    itemData: {
      type: 'armor',
      cost: '50 gp',
      weight: 20,
      armorClass: 13,
      properties: ['Medium Armor', 'Max Dex Bonus +2']
    }
  },
  {
    id: 'item-plate-armor',
    name: 'Plate Armor',
    category: 'items',
    edition: '5e',
    description: 'Shaped, interlocking metal plates covering the entire body.',
    source: 'SRD 5e',
    itemData: {
      type: 'armor',
      cost: '1,500 gp',
      weight: 65,
      armorClass: 18,
      properties: ['Heavy Armor', 'Requires Strength 15', 'Disadvantage on Stealth']
    }
  },
  {
    id: 'item-shield',
    name: 'Shield',
    category: 'items',
    edition: '5e',
    description: 'A wooden or metal guard carried in one hand.',
    source: 'SRD 5e',
    itemData: {
      type: 'shield',
      cost: '10 gp',
      weight: 6,
      armorClass: 2,
      properties: ['Grants +2 AC']
    }
  },
  {
    id: 'item-potion-healing',
    name: 'Potion of Healing',
    category: 'items',
    edition: '5e',
    description: 'A character who drinks the magical red fluid in this vial regains 2d4 + 2 hit points.',
    source: 'SRD 5e',
    itemData: {
      type: 'potion',
      cost: '50 gp',
      weight: 0.5,
      rarity: 'Common',
      damage: '2d4+2',
      damageType: 'Healing',
      properties: ['Restores 2d4+2 HP as an action']
    }
  },
  {
    id: 'item-bag-holding',
    name: 'Bag of Holding',
    category: 'items',
    edition: '5e',
    description: 'This bag has an interior space considerably larger than its outside dimensions, holding up to 500 lbs.',
    source: 'SRD 5e',
    itemData: {
      type: 'gear',
      cost: '500 gp',
      weight: 15,
      rarity: 'Uncommon',
      properties: ['Dimensional Pocket', 'Holds up to 500 lbs']
    }
  }
];

// Combine all base entries into one initial array
export function getInitialBaseCompendium(): CompendiumItem[] {
  const items: CompendiumItem[] = [];

  // 1. Monsters
  OFFICIAL_BULK_MONSTERS.forEach((m) => {
    const monsterCr = m.challengeRating || m.subclass?.replace(/^CR\s*/i, '') || '1';
    items.push({
      id: 'comp-mon-' + m.id,
      name: m.name,
      category: 'monsters',
      edition: m.edition || '5e',
      description: `${m.race} • ${m.characterClass || 'Monster'} (CR ${monsterCr}) - ${m.alignment || 'Neutral'}. HP: ${m.hpMax}, AC: ${m.armorClass}. ${m.backstory || ''}`,
      source: `SRD ${m.edition || '5e'}`,
      tags: [m.race, m.characterClass, `CR ${monsterCr}`, m.edition || '5e'].filter(Boolean) as string[],
      monsterData: {
        ...m,
        challengeRating: monsterCr
      }
    });
  });

  // 2. Spells
  PRESET_5E_SPELLS.forEach((s) => {
    items.push({
      id: 'comp-spl-' + s.id,
      name: s.name,
      category: 'spells',
      edition: '5e',
      description: `Level ${s.level === 0 ? 'Cantrip' : s.level} ${s.school || 'Magic'} • Casting Time: ${s.castingTime || '1 action'}. Range: ${s.range || 'Touch'}. ${s.description}`,
      source: 'SRD 5e',
      tags: [`Level ${s.level}`, s.school, '5e'].filter(Boolean) as string[],
      spellData: s
    });
  });

  PRESET_35E_SPELLS.forEach((s) => {
    const classInfo = s.classLevelsStr ? ` • Classes: [ ${s.classLevelsStr} ]` : '';
    items.push({
      id: 'comp-spl-35-' + s.id,
      name: s.name,
      category: 'spells',
      edition: '3.5e',
      description: `Level ${s.level} ${s.school || 'Magic'}${classInfo} • Casting Time: ${s.castingTime || '1 standard action'}. Range: ${s.range || 'Touch'}. ${s.description}`,
      source: 'd20SRD (3.5e)',
      tags: [`Level ${s.level}`, s.school, s.classLevelsStr || '', '3.5e'].filter(Boolean) as string[],
      spellData: s
    });
  });

  // 3. Feats
  OFFICIAL_5E_FEATS.forEach((f) => {
    items.push({
      id: 'comp-ft5-' + f.id,
      name: f.name,
      category: 'feats',
      edition: '5e',
      description: `${f.prerequisite ? `Prerequisite: ${f.prerequisite}. ` : ''}${f.description}`,
      source: 'SRD 5e',
      tags: ['Feat', '5e'],
      featData: f
    });
  });

  OFFICIAL_35E_FEATS.forEach((f) => {
    items.push({
      id: 'comp-ft35-' + f.id,
      name: f.name,
      category: 'feats',
      edition: '3.5e',
      description: `${f.prerequisite ? `Prerequisite: ${f.prerequisite}. ` : ''}${f.description}`,
      source: '3.5e Core',
      tags: ['Feat', '3.5e'],
      featData: f
    });
  });

  // 4. Class Features
  OFFICIAL_5E_CLASS_FEATURES.forEach((cf) => {
    items.push({
      id: 'comp-cf5-' + cf.id,
      name: cf.name,
      category: 'features',
      edition: '5e',
      description: `Class: ${cf.className} (Level ${cf.reqLevel}) • ${cf.description}`,
      source: `5e ${cf.className}`,
      tags: [cf.className, `Level ${cf.reqLevel}`, '5e'],
      featureData: cf
    });
  });

  OFFICIAL_35E_CLASS_FEATURES.forEach((cf) => {
    items.push({
      id: 'comp-cf35-' + cf.id,
      name: cf.name,
      category: 'features',
      edition: '3.5e',
      description: `Class: ${cf.className} (Level ${cf.reqLevel}) • ${cf.description}`,
      source: `3.5e ${cf.className}`,
      tags: [cf.className, `Level ${cf.reqLevel}`, '3.5e'],
      featureData: cf
    });
  });

  // 5. Classes
  items.push(...BASE_COMPENDIUM_CLASSES);

  // 6. Races / Lineages
  items.push(...BASE_COMPENDIUM_RACES);

  // 7. Skills
  items.push(...BASE_COMPENDIUM_SKILLS);

  // 8. Equipment / Items
  items.push(...BASE_COMPENDIUM_ITEMS);

  return items;
}

// LocalStorage Persistence Helpers for Custom Compendium Entries
export function loadCustomCompendiumEntries(): CompendiumItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPENDIUM);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const baseMonsterNames = ['ogre', 'the tarrasque', 'tarrasque', 'minotaur', 'adult red dragon', 'orc', 'kobold spear hunter'];
        const clean = parsed.filter(item => {
          if (!item || !item.id || !item.name || !item.category) return false;
          // Prevent official base monster names from being saved under non-monster categories
          if (baseMonsterNames.includes(item.name.trim().toLowerCase()) && item.category !== 'monsters') {
            return false;
          }
          return true;
        });
        if (clean.length !== parsed.length) {
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOM_COMPENDIUM, JSON.stringify(clean));
          } catch (e) {
            // ignore
          }
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Failed to load custom compendium from localStorage', e);
  }
  return [];
}

export function saveCustomCompendiumEntry(newItem: CompendiumItem): CompendiumItem[] {
  if (!newItem || !newItem.name || !newItem.category) return loadCustomCompendiumEntries();

  const baseMonsterNames = ['ogre', 'the tarrasque', 'tarrasque', 'minotaur', 'adult red dragon', 'orc', 'kobold spear hunter'];
  if (baseMonsterNames.includes(newItem.name.trim().toLowerCase()) && newItem.category !== 'monsters') {
    return loadCustomCompendiumEntries();
  }

  const current = loadCustomCompendiumEntries();
  const existingIdx = current.findIndex(i => i.id === newItem.id || (i.name.toLowerCase() === newItem.name.toLowerCase() && i.category === newItem.category));
  
  let updated: CompendiumItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...newItem, isCustom: true };
  } else {
    updated = [ { ...newItem, isCustom: true }, ...current ];
  }

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPENDIUM, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom compendium entry', e);
  }
  return updated;
}

export function deleteCustomCompendiumEntry(id: string): CompendiumItem[] {
  const current = loadCustomCompendiumEntries();
  const updated = current.filter(i => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPENDIUM, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete custom compendium entry', e);
  }
  return updated;
}
