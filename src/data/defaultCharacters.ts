import { CharacterData } from '../types';
import { DEFAULT_SKILLS_LIST } from '../utils/dndCalculations';
import { OFFICIAL_BULK_MONSTERS } from './srdRulesLibrary';

export const SAMPLE_CHARACTERS: CharacterData[] = [
  {
    id: 'char-fighter-freeze',
    name: 'Freeze',
    race: 'Human',
    characterClass: 'Fighter',
    subclass: 'Battle Master',
    level: 5,
    background: 'Soldier',
    alignment: 'Neutral Good',
    experiencePoints: 6500,

    hpMax: 44,
    hpCurrent: 44,
    hpTemp: 0,
    hitDiceTotal: '5d10',
    hitDiceCurrent: 5,
    armorClass: 18, // Plate Armor or Chain Mail + Shield
    initiativeBonus: 1,
    speed: 30,
    inspiration: true,

    deathSavesSuccesses: 0,
    deathSavesFailures: 0,

    abilities: {
      STR: { score: 18 }, // +4
      DEX: { score: 12 }, // +1
      CON: { score: 15 }, // +2
      INT: { score: 10 }, // +0
      WIS: { score: 12 }, // +1
      CHA: { score: 10 }, // +0
    },

    savingThrowProficiencies: ['STR', 'CON'],

    skills: DEFAULT_SKILLS_LIST.map(s => {
      if (s.name === 'Athletics') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Intimidation') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Perception') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Survival') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      return { id: s.name, name: s.name, ability: s.ability, proficient: false };
    }),

    classFeatures: [
      {
        id: 'cf-1',
        name: 'Fighting Style: Defense',
        source: 'Fighter Level 1',
        description: '+1 bonus to AC while wearing armor.'
      },
      {
        id: 'cf-2',
        name: 'Second Wind',
        source: 'Fighter Level 1',
        description: 'Bonus action to regain 1d10 + Fighter Level HP.',
        usesMax: 1,
        usesRemaining: 1,
        recharge: 'Short Rest'
      },
      {
        id: 'cf-3',
        name: 'Action Surge',
        source: 'Fighter Level 2',
        description: 'Take one additional action on your turn.',
        usesMax: 1,
        usesRemaining: 1,
        recharge: 'Short Rest'
      },
      {
        id: 'cf-4',
        name: 'Combat Superiority (4d8)',
        source: 'Battle Master Level 3',
        description: 'Expend superiority dice to use battle maneuvers (Riposte, Trip Attack, Precision Attack).',
        usesMax: 4,
        usesRemaining: 4,
        recharge: 'Short Rest'
      },
      {
        id: 'cf-5',
        name: 'Extra Attack',
        source: 'Fighter Level 5',
        description: 'Attack twice whenever you take the Attack action on your turn.'
      }
    ],

    feats: [
      {
        id: 'feat-1',
        name: 'Great Weapon Master',
        source: 'Feat',
        description: 'On critical hit or killing a creature, make one melee attack as bonus action. Can take -5 penalty to hit for +10 damage.'
      }
    ],

    attacks: [
      {
        id: 'atk-1',
        name: 'Longsword +1',
        attackBonus: 8, // +3 Prof + 4 STR + 1 Magic
        damage: '1d8 + 5 Slashing (Versatile 1d10 + 5)',
        damageType: 'Slashing / Magic',
        range: '5 ft Melee',
        abilityUsed: 'STR',
        isProficient: true,
        notes: 'Versatile (1d10 when two-handed)'
      },
      {
        id: 'atk-2',
        name: 'Handaxe',
        attackBonus: 7, // +3 Prof + 4 STR
        damage: '1d6 + 4 Slashing',
        damageType: 'Slashing',
        range: '20/60 ft Thrown',
        abilityUsed: 'STR',
        isProficient: true
      },
      {
        id: 'atk-3',
        name: 'Heavy Crossbow',
        attackBonus: 4, // +3 Prof + 1 DEX
        damage: '1d10 + 1 Piercing',
        damageType: 'Piercing',
        range: '100/400 ft Ranged',
        abilityUsed: 'DEX',
        isProficient: true
      }
    ],

    wealth: {
      cp: 45,
      sp: 32,
      ep: 0,
      gp: 185,
      pp: 12
    },

    inventory: [
      { id: 'inv-1', name: 'Plate Armor', quantity: 1, weight: 65, equipped: true, isMagic: false, costGp: 1500, notes: 'AC 18, Disadvantage on Stealth' },
      { id: 'inv-2', name: 'Longsword +1', quantity: 1, weight: 3, equipped: true, isMagic: true, costGp: 500, notes: '+1 to attack & damage rolls' },
      { id: 'inv-3', name: 'Handaxe', quantity: 2, weight: 2, equipped: true, isMagic: false, costGp: 5 },
      { id: 'inv-4', name: 'Backpack & Bedroll', quantity: 1, weight: 7, equipped: false, isMagic: false, costGp: 3 },
      { id: 'inv-5', name: 'Rations (1 day)', quantity: 5, weight: 2, equipped: false, isMagic: false, costGp: 0.5 },
      { id: 'inv-6', name: 'Potion of Healing', quantity: 3, weight: 0.5, equipped: false, isMagic: true, costGp: 50, notes: 'Regains 2d4 + 2 HP' }
    ],

    isSpellcaster: false,
    spellcastingAbility: 'INT',
    spellSlots: [],
    spells: [],

    gender: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',

    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    alliesAndOrganizations: '',
    additionalNotes: ''
  },

  {
    id: 'char-wizard-chaosdwarf',
    name: 'ChaosDwarf',
    race: 'Dwarf',
    characterClass: 'Wizard',
    subclass: 'School of Evocation',
    level: 5,
    background: 'Sage',
    alignment: 'Lawful Neutral',
    experiencePoints: 6500,

    hpMax: 27,
    hpCurrent: 27,
    hpTemp: 0,
    hitDiceTotal: '5d6',
    hitDiceCurrent: 5,
    armorClass: 12, // Mage Armor 15
    initiativeBonus: 2,
    speed: 30,
    inspiration: false,

    deathSavesSuccesses: 0,
    deathSavesFailures: 0,

    abilities: {
      STR: { score: 8 },  // -1
      DEX: { score: 14 }, // +2
      CON: { score: 12 }, // +1
      INT: { score: 18 }, // +4
      WIS: { score: 13 }, // +1
      CHA: { score: 10 }, // +0
    },

    savingThrowProficiencies: ['INT', 'WIS'],

    skills: DEFAULT_SKILLS_LIST.map(s => {
      if (s.name === 'Arcana') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'History') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Investigation') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Insight') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      return { id: s.name, name: s.name, ability: s.ability, proficient: false };
    }),

    classFeatures: [
      {
        id: 'cf-wiz-1',
        name: 'Arcane Recovery',
        source: 'Wizard Level 1',
        description: 'Regain spell slots up to half wizard level (rounded up) during short rest.',
        usesMax: 1,
        usesRemaining: 1,
        recharge: 'Long Rest'
      },
      {
        id: 'cf-wiz-2',
        name: 'Evocation Savant',
        source: 'School of Evocation',
        description: 'Gold and time to copy Evocation spells into spellbook is halved.'
      },
      {
        id: 'cf-wiz-3',
        name: 'Sculpt Spells',
        source: 'School of Evocation',
        description: 'Protect allies from area evocation spells (1 + spell level creatures automatically succeed saves and take no damage).'
      }
    ],

    feats: [],

    attacks: [
      {
        id: 'atk-wiz-1',
        name: 'Fire Bolt (Cantrip)',
        attackBonus: 7, // +3 Prof + 4 INT
        damage: '2d10 Fire',
        damageType: 'Fire',
        range: '120 ft',
        abilityUsed: 'INT',
        isProficient: true,
        notes: 'Ignites flammable objects'
      },
      {
        id: 'atk-wiz-2',
        name: 'Quarterstaff',
        attackBonus: 2, // +3 Prof - 1 STR
        damage: '1d6 - 1 Bludgeoning',
        damageType: 'Bludgeoning',
        range: '5 ft Melee',
        abilityUsed: 'STR',
        isProficient: true
      }
    ],

    wealth: {
      cp: 12,
      sp: 40,
      ep: 0,
      gp: 310,
      pp: 5
    },

    inventory: [
      { id: 'inv-wiz-1', name: 'Arcane Focus (Crystal)', quantity: 1, weight: 1, equipped: true, isMagic: false, costGp: 10 },
      { id: 'inv-wiz-2', name: 'Spellbook', quantity: 1, weight: 3, equipped: true, isMagic: false, costGp: 50, notes: 'Contains all known spells' },
      { id: 'inv-wiz-3', name: 'Scholar’s Pack', quantity: 1, weight: 10, equipped: false, isMagic: false, costGp: 40 },
      { id: 'inv-wiz-4', name: 'Scroll of Misty Step', quantity: 2, weight: 0.1, equipped: false, isMagic: true, costGp: 150 }
    ],

    isSpellcaster: true,
    spellcastingAbility: 'INT',
    spellSlots: [
      { level: 1, max: 4, current: 4 },
      { level: 2, max: 3, current: 3 },
      { level: 3, max: 2, current: 2 },
      { level: 4, max: 0, current: 0 },
      { level: 5, max: 0, current: 0 },
      { level: 6, max: 0, current: 0 },
      { level: 7, max: 0, current: 0 },
      { level: 8, max: 0, current: 0 },
      { level: 9, max: 0, current: 0 },
    ],

    spells: [
      {
        id: 'sp-1',
        name: 'Fire Bolt',
        level: 0,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 ft',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'Hurl a mote of fire. Make a ranged spell attack for 2d10 fire damage.',
        prepared: true
      },
      {
        id: 'sp-2',
        name: 'Ray of Frost',
        level: 0,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '60 ft',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'Ranged spell attack for 2d8 cold damage and reduces target speed by 10 ft.',
        prepared: true
      },
      {
        id: 'sp-3',
        name: 'Mage Hand',
        level: 0,
        school: 'Transmutation',
        castingTime: '1 Action',
        range: '30 ft',
        components: 'V, S',
        duration: '1 Minute',
        description: 'A spectral, floating hand appears to manipulate objects or carry up to 10 lbs.',
        prepared: true
      },
      {
        id: 'sp-4',
        name: 'Magic Missile',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 ft',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'Create 3 darts of magical force that hit targets automatically for 1d4 + 1 force damage each.',
        prepared: true
      },
      {
        id: 'sp-5',
        name: 'Mage Armor',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 Action',
        range: 'Touch',
        components: 'V, S, M',
        duration: '8 Hours',
        description: 'Target’s base AC becomes 13 + DEX modifier.',
        prepared: true
      },
      {
        id: 'sp-6',
        name: 'Shield',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 Reaction',
        range: 'Self',
        components: 'V, S',
        duration: '1 Round',
        description: 'Gain +5 bonus to AC until start of next turn and take no damage from Magic Missile.',
        prepared: true
      },
      {
        id: 'sp-7',
        name: 'Misty Step',
        level: 2,
        school: 'Conjuration',
        castingTime: '1 Bonus Action',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        description: 'Teleport up to 30 feet to an unoccupied space you can see.',
        prepared: true
      },
      {
        id: 'sp-8',
        name: 'Scorching Ray',
        level: 2,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 ft',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'Create 3 rays of fire. Make ranged spell attacks dealing 2d6 fire damage each.',
        prepared: true
      },
      {
        id: 'sp-9',
        name: 'Fireball',
        level: 3,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '150 ft',
        components: 'V, S, M',
        duration: 'Instantaneous',
        description: 'A bright streak flashes to a point and explodes in a 20-ft radius sphere. 8d6 fire damage (DEX save for half).',
        prepared: true
      },
      {
        id: 'sp-10',
        name: 'Counterspell',
        level: 3,
        school: 'Abjuration',
        castingTime: '1 Reaction',
        range: '60 ft',
        components: 'S',
        duration: 'Instantaneous',
        description: 'Attempt to interrupt a creature in the process of casting a spell.',
        prepared: true
      }
    ],

    gender: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',

    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    alliesAndOrganizations: '',
    additionalNotes: ''
  },
  {
    id: 'char-35-dwarf-fighter',
    name: 'Tordek',
    race: 'Dwarf (Dwarven)',
    characterClass: 'Fighter',
    subclass: 'Weapon Master',
    level: 5,
    background: 'Guild Artisan',
    alignment: 'Lawful Good',
    experiencePoints: 10000,
    edition: '3.5e',

    // 3.5e stats
    bab: 5,
    fortSaveBase: 4,
    refSaveBase: 1,
    willSaveBase: 1,
    sizeCategory: 'Medium',

    hpMax: 48,
    hpCurrent: 48,
    hpTemp: 0,
    hitDiceTotal: '5d10',
    hitDiceCurrent: 5,
    armorClass: 18,
    initiativeBonus: 1,
    speed: 20,
    inspiration: false,

    deathSavesSuccesses: 0,
    deathSavesFailures: 0,

    abilities: {
      STR: { score: 16 }, // +3
      DEX: { score: 12 }, // +1
      CON: { score: 16 }, // +3
      INT: { score: 10 }, // +0
      WIS: { score: 12 }, // +1
      CHA: { score: 8 },  // -1
    },

    savingThrowProficiencies: ['STR', 'CON'],

    skills: [
      { id: 'sk-35-1', name: 'Climb', ability: 'STR', proficient: false, ranks: 5, miscMod: 0, isClassSkill: true },
      { id: 'sk-35-2', name: 'Concentration', ability: 'CON', proficient: false, ranks: 4, miscMod: 0, isClassSkill: true },
      { id: 'sk-35-3', name: 'Craft (Armor)', ability: 'INT', proficient: false, ranks: 6, miscMod: 2, isClassSkill: true },
      { id: 'sk-35-4', name: 'Handle Animal', ability: 'CHA', proficient: false, ranks: 2, miscMod: 0, isClassSkill: true },
      { id: 'sk-35-5', name: 'Intimidate', ability: 'CHA', proficient: false, ranks: 4, miscMod: 0, isClassSkill: true },
      { id: 'sk-35-6', name: 'Jump', ability: 'STR', proficient: false, ranks: 5, miscMod: -2, isClassSkill: true },
      { id: 'sk-35-7', name: 'Ride', ability: 'DEX', proficient: false, ranks: 2, miscMod: 0, isClassSkill: true },
      { id: 'sk-35-8', name: 'Spot', ability: 'WIS', proficient: false, ranks: 3, miscMod: 0, isClassSkill: false },
      { id: 'sk-35-9', name: 'Listen', ability: 'WIS', proficient: false, ranks: 3, miscMod: 0, isClassSkill: false },
    ],

    classFeatures: [
      {
        id: 'cf-35-1',
        name: 'Dwarven Traits (+2 CON, -2 CHA)',
        source: 'Dwarf Race',
        description: '+2 save bonus vs spells/poison, Darkvision 60ft, Stonecunning (+2 Search checks on stonework).'
      },
      {
        id: 'cf-35-2',
        name: 'Fighter Bonus Feat (Lv 1, 2, 4)',
        source: '3.5e Fighter',
        description: 'Gains combat feats from the Fighter bonus feats list at 1st, 2nd, and 4th level.'
      }
    ],

    feats: [
      {
        id: 'ft-35-1',
        name: 'Power Attack',
        source: 'General Feat',
        description: 'Subtract a number from your melee attack rolls and add the same number to your melee damage rolls.'
      },
      {
        id: 'ft-35-2',
        name: 'Cleave',
        source: 'Fighter Bonus Feat',
        description: 'If you deal enough damage to drop a creature, you get an immediate extra melee attack against another creature.'
      },
      {
        id: 'ft-35-3',
        name: 'Weapon Focus (Dwarven Waraxe)',
        source: 'Fighter Bonus Feat',
        description: '+1 bonus on all attack rolls made using the chosen weapon.'
      },
      {
        id: 'ft-35-4',
        name: 'Exotic Weapon Proficiency: Dwarven Waraxe',
        source: 'General Feat',
        description: 'Allows wielding the Dwarven Waraxe one-handed without penalty.'
      }
    ],

    attacks: [
      {
        id: 'atk-35-1',
        name: 'Dwarven Waraxe (+1)',
        attackBonus: 10, // BAB 5 + STR 3 + Weapon Focus 1 + Enhancement 1 = +10
        damage: '1d10 + 4',
        damageType: 'Slashing',
        range: 'Melee',
        notes: 'Critical: x3 on 20'
      },
      {
        id: 'atk-35-2',
        name: 'Heavy Crossbow',
        attackBonus: 6, // BAB 5 + DEX 1 = +6
        damage: '1d10',
        damageType: 'Piercing',
        range: '120 ft',
        notes: 'Critical: 19-20 / x2'
      }
    ],

    wealth: {
      cp: 50,
      sp: 80,
      ep: 0,
      gp: 450,
      pp: 5
    },

    inventory: [
      { id: 'inv-35-1', name: '+1 Dwarven Waraxe', quantity: 1, weight: 8, equipped: true, isMagic: true },
      { id: 'inv-35-2', 'name': '+1 Full Plate Armor', quantity: 1, weight: 50, equipped: true, isMagic: true },
      { id: 'inv-35-3', name: 'Heavy Steel Shield', quantity: 1, weight: 15, equipped: true },
      { id: 'inv-35-4', name: 'Heavy Crossbow & 20 Bolts', quantity: 1, weight: 11, equipped: false },
      { id: 'inv-35-5', name: 'Backpack & Artisan Tools', quantity: 1, weight: 12, equipped: false }
    ],

    isSpellcaster: false,
    spellcastingAbility: 'WIS',
    spellSlots: [],
    spells: [],

    gender: 'Male',
    age: '120',
    height: "4'3\"",
    weight: '165 lbs',
    eyes: 'Dark Brown',
    skin: 'Tan',
    hair: 'Deep Red',

    personalityTraits: 'Stout, honorable, and intensely loyal to his clan.',
    ideals: 'Honor: A warrior is only as good as his oath.',
    bonds: 'Will reclaim his family smithy from ancient subterranean hazards.',
    flaws: 'Distrustful of sneaky magic and prone to stubborn arguments.',
    backstory: 'A veteran defender of the Iron Citadel, Tordek now travels the surface realms seeking glory and forged metals.',
    alliesAndOrganizations: 'Ironbreaker Clan of the Deep Peaks',
    additionalNotes: 'D&D 3.5e Character Sheet sample'
  },
  {
    id: 'char-monster-goblin',
    name: 'Goblin Warchief',
    race: 'Goblin',
    characterClass: 'Fighter',
    subclass: 'Battle Master',
    level: 4,
    background: 'Outlander',
    alignment: 'Neutral Evil',
    experiencePoints: 1100,
    edition: '5e',
    isMonster: true,
    monsterXpReward: 1100,
    portraitUrl: 'https://api.open5e.com/static/img/object_illustrations/open5e-illustrations/monsters/goblin.png',
    hpCalcMode: 'Average',

    hpMax: 38,
    hpCurrent: 38,
    hpTemp: 0,
    hitDiceTotal: '4d10',
    hitDiceCurrent: 4,
    armorClass: 16, // Chain Shirt + Shield
    initiativeBonus: 3,
    speed: 30,
    inspiration: false,

    deathSavesSuccesses: 0,
    deathSavesFailures: 0,

    abilities: {
      STR: { score: 14 },
      DEX: { score: 16 },
      CON: { score: 14 },
      INT: { score: 10 },
      WIS: { score: 12 },
      CHA: { score: 12 },
    },

    savingThrowProficiencies: ['STR', 'CON'],

    skills: DEFAULT_SKILLS_LIST.map(s => {
      if (s.name === 'Stealth') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Perception') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      if (s.name === 'Intimidation') return { id: s.name, name: s.name, ability: s.ability, proficient: true };
      return { id: s.name, name: s.name, ability: s.ability, proficient: false };
    }),

    classFeatures: [
      {
        id: 'mf-1',
        name: 'Nimble Escape',
        source: 'Goblin Racial Feature',
        description: 'Take the Disengage or Hide action as a bonus action on each turn.'
      },
      {
        id: 'mf-2',
        name: 'Warchief Command',
        source: 'Monster Feature',
        description: 'Target allied goblin within 30 ft can make one weapon attack as a reaction.'
      }
    ],

    feats: [],

    attacks: [
      {
        id: 'atk-m1',
        name: 'Scimitar',
        attackBonus: 5,
        damage: '1d6 + 3',
        damageType: 'Slashing',
        range: '5 ft Melee'
      },
      {
        id: 'atk-m2',
        name: 'Shortbow',
        attackBonus: 5,
        damage: '1d6 + 3',
        damageType: 'Piercing',
        range: '80/320 ft'
      }
    ],

    wealth: {
      cp: 140,
      sp: 45,
      ep: 0,
      gp: 22,
      pp: 0
    },

    inventory: [
      { id: 'minv-1', name: 'Scimitar', quantity: 1, weight: 3, equipped: true },
      { id: 'minv-2', name: 'Chain Shirt', quantity: 1, weight: 20, equipped: true },
      { id: 'minv-3', name: 'Shortbow & 20 Arrows', quantity: 1, weight: 5, equipped: true },
      { id: 'minv-4', name: 'Troop Horn', quantity: 1, weight: 2, equipped: false }
    ],

    isSpellcaster: false,
    spellcastingAbility: 'WIS',
    spellSlots: [],
    spells: [],

    gender: 'Male',
    age: '28',
    height: "3'8\"",
    weight: '55 lbs',
    eyes: 'Yellow',
    skin: 'Greenish-Brown',
    hair: 'Black Tuft',

    personalityTraits: 'Cunning, aggressive, and fiercely protective of his horde.',
    ideals: 'Dominance: The strongest rules the warband.',
    bonds: 'Lairs in the Cragshadow Caverns.',
    flaws: 'Prone to reckless arrogance when victory seems certain.',
    backstory: 'Leader of the Cragshadow Goblins, frequently raiding trade caravans.',
    alliesAndOrganizations: 'Cragshadow Tribe',
    additionalNotes: 'Encounter Monster Creature for DM Campaign Planning'
  },
  {
    id: 'char-sr-ghost-zero',
    name: 'Ghost Zero',
    edition: 'shadowrun',
    race: 'Elf',
    characterClass: 'Street Samurai / Decker',
    subclass: 'Cyber-Ninja',
    level: 6,
    background: 'Ex-Ares Black Ops Specialist',
    alignment: 'Shadowrunner',
    experiencePoints: 120,

    hpMax: 11,
    hpCurrent: 11,
    hpTemp: 0,
    hitDiceTotal: '6d6',
    hitDiceCurrent: 6,
    armorClass: 16,
    initiativeBonus: 8,
    speed: 35,
    inspiration: true,

    deathSavesSuccesses: 0,
    deathSavesFailures: 0,

    abilities: {
      STR: { score: 14 },
      DEX: { score: 18 },
      CON: { score: 14 },
      INT: { score: 16 },
      WIS: { score: 14 },
      CHA: { score: 12 },
    },

    savingThrowProficiencies: [],
    skills: [],

    classFeatures: [],
    feats: [],
    attacks: [],

    wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    inventory: [],

    isSpellcaster: false,
    spellcastingAbility: 'INT',
    spellSlots: [],
    spells: [],

    gender: 'Non-binary',
    age: '26',
    height: "6'2\"",
    weight: '170 lbs',
    eyes: 'Glowing Cyan Cyberoptics',
    skin: 'Pale Chrome',
    hair: 'Neon Blue Buzzcut',

    personalityTraits: 'Quiet, calculating, never leaves a teammate behind.',
    ideals: 'Professionalism: The contract is sacred.',
    bonds: 'Loves the Bellevue Fixer network.',
    flaws: 'Targeted by Ares Macrotechnology corporate hit squads.',
    backstory: 'Former Ares Security operative turned shadowrunner after surviving a black site facility purge in Neo-Tokyo.',
    alliesAndOrganizations: 'Seattle Shadowrunner Union, Fixer Jackpoint',
    additionalNotes: 'High initiative combat decker equipped with Smartlink and Wired Reflexes.',

    shadowrun: {
      bod: 5, agi: 6, rea: 5, str: 4, wil: 4, log: 5, int: 5, cha: 3, edg: 4, edgCurrent: 4, ess: 3.2, mag: 0, res: 0,
      nuyen: 38500, karmaCurrent: 18, karmaTotal: 65, streetCred: 4, notoriety: 1, publicAwareness: 2,
      physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 14, impactArmor: 12,
      qualities: [
        { id: 'sr-q1', name: 'High Pain Tolerance', type: 'Positive', karmaCost: 7, description: 'Ignores first 2 boxes of wound penalties.' },
        { id: 'sr-q2', name: 'Ambidextrous', type: 'Positive', karmaCost: 4, description: 'No off-hand penalty in dual wielding.' },
        { id: 'sr-q3', name: 'Wanted (Ares Macrotechnology)', type: 'Negative', karmaCost: 10, description: 'Has a bounty placed on them by Ares Macrotechnology.' }
      ],
      cyberware: [
        { id: 'sr-cw1', name: 'Wired Reflexes', category: 'Cyberware', essenceCost: 1.6, rating: 2, grade: 'Alphaware', description: '+2 Reaction, +2d6 Initiative Dice.' },
        { id: 'sr-cw2', name: 'Smartlink System', category: 'Cyberware', essenceCost: 0.2, rating: 1, grade: 'Standard', description: '+2 dice pool bonus with Smartgun firearms.' },
        { id: 'sr-cw3', name: 'Titanium Bone Lacing', category: 'Cyberware', essenceCost: 1.0, rating: 2, grade: 'Standard', description: '+2 Body for damage resistance, Physical unarmed strikes.' }
      ],
      srSkills: [
        { id: 'srs-1', name: 'Automatics', category: 'Combat', rating: 6, linkedAttribute: 'AGI' },
        { id: 'srs-2', name: 'Pistols', category: 'Combat', rating: 5, linkedAttribute: 'AGI' },
        { id: 'srs-3', name: 'Blades', category: 'Combat', rating: 5, linkedAttribute: 'AGI' },
        { id: 'srs-4', name: 'Hacking', category: 'Matrix', rating: 5, linkedAttribute: 'LOG' },
        { id: 'srs-5', name: 'Cybercombat', category: 'Matrix', rating: 4, linkedAttribute: 'LOG' },
        { id: 'srs-6', name: 'Electronic Warfare', category: 'Matrix', rating: 4, linkedAttribute: 'LOG' },
        { id: 'srs-7', name: 'Sneaking', category: 'Physical', rating: 5, linkedAttribute: 'AGI' },
        { id: 'srs-8', name: 'Perception', category: 'Physical', rating: 4, linkedAttribute: 'INT' }
      ],
      weapons: [
        { id: 'sr-w1', name: 'Ares Alpha Assault Rifle', type: 'Firearm', damage: '11P', armorPenetration: -2, mode: 'BF/FA', ammo: '38(c)', recoilCompensation: 3 },
        { id: 'sr-w2', name: 'Ares Predator V Heavy Pistol', type: 'Firearm', damage: '8P', armorPenetration: -1, mode: 'SA', ammo: '15(c)', recoilCompensation: 1 },
        { id: 'sr-w3', name: 'Monofilament Whip', type: 'Melee', damage: '12P', armorPenetration: -8, mode: 'Melee' }
      ],
      matrixDevice: {
        name: 'Novatech Cyberdeck',
        model: 'Novatech Navigator 500',
        deviceRating: 5,
        dataProcessing: 6,
        firewall: 5,
        attack: 4,
        sleaze: 3,
        overwatchScore: 0,
        programsRunning: ['Armor', 'Baby Monitor', 'Decryption', 'Exploit', 'Fork', 'Signal Scrub']
      },
      vehicles: [
        { id: 'sr-v1', name: 'Dodge Blixen Cyberbike', type: 'Bike', handling: '5/3', speed: '6', acceleration: '3', body: 8, armor: 10, pilot: 2, sensor: 3 },
        { id: 'sr-v2', name: 'MCT Fly-Spy Recon Drone', type: 'Drone', handling: '4/3', speed: '3', acceleration: '2', body: 1, armor: 2, pilot: 3, sensor: 3, weaponMounts: 'Micro Camera' }
      ]
    }
  },
  ...OFFICIAL_BULK_MONSTERS
];
