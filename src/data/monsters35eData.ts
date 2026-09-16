import { CharacterData, Skill } from '../types';
import { DEFAULT_35E_SKILLS_LIST } from './defaultSkillLists';

export function make35eMonsterSkills(trainedRanks: number = 0, specificRanks: Record<string, number> = {}): Skill[] {
  return DEFAULT_35E_SKILLS_LIST.map((s, idx) => ({
    id: `sk-35e-${idx}-${s.name.toLowerCase().replace(/[\s\(\)]+/g, '-')}`,
    name: s.name,
    ability: s.ability,
    proficient: false,
    ranks: specificRanks[s.name] !== undefined ? specificRanks[s.name] : trainedRanks,
    isClassSkill: true
  }));
}

/**
 * Official D&D 3.5e System Reference Document (SRD 3.5 / d20 SRD) Monsters
 * Complete with authentic 3.5e BAB, Touch AC, Flat-Footed AC, Fort/Ref/Will base saves,
 * Damage Reduction (DR), Spell Resistance (SR), Special Attacks, and Special Qualities.
 */
export const OFFICIAL_35E_NEW_MONSTERS: Partial<CharacterData>[] = [
  // --------------------------------------------------------------------------
  // CR 1/3 - 1/2: LOW TIER ENCOUNTERS
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-skeleton',
    name: 'Human Warrior Skeleton (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1/3',
    challengeRating: '1/3',
    level: 1,
    edition: '3.5e',
    background: 'Medium Undead',
    sizeCategory: 'Medium',
    alignment: 'Neutral Evil',
    experiencePoints: 100,
    isMonster: true,
    monsterXpReward: 100,
    hpMax: 6,
    hpCurrent: 6,
    armorClass: 15,
    touchAcOverride: 11,
    flatFootedAcOverride: 14,
    initiativeBonus: 5,
    speed: 30,
    bab: 0,
    fortSaveBase: 0,
    refSaveBase: 1,
    willSaveBase: 2,
    hitDiceTotal: '1d12',
    hitDiceCurrent: 1,
    damageReductionValue: 5,
    damageReductionBypass: 'bludgeoning',
    senses: 'Darkvision 60 ft.',
    damageImmunities: ['Cold', 'Poison', 'Disease'],
    abilities: {
      STR: { score: 13 },
      DEX: { score: 13 },
      CON: { score: 10 },
      INT: { score: 10 },
      WIS: { score: 10 },
      CHA: { score: 1 }
    },
    skills: make35eMonsterSkills(),
    attacks: [
      { id: 'atk-35skel-1', name: 'Scimitar', attackBonus: 1, damage: '1d6 + 1', damageType: 'Slashing', range: '5 ft Melee', notes: 'Crit: 18-20/x2' },
      { id: 'atk-35skel-2', name: 'Claw', attackBonus: 1, damage: '1d4 + 1', damageType: 'Slashing', range: '5 ft Melee' }
    ],
    multiattack: 'Scimitar +1 melee (1d6+1, 18-20/x2) or 2 claws +1 melee (1d4+1).',
    classFeatures: [
      { id: 'trait-35skel-1', name: 'Damage Reduction 5/Bludgeoning', source: 'Undead Trait', description: 'Skeletons lack flesh and internal organs; bludgeoning weapons deal normal damage, but piercing and slashing weapons have their damage reduced by 5.' },
      { id: 'trait-35skel-2', name: 'Immunity to Cold', source: 'Undead Trait', description: 'Immune to all cold damage effects.' },
      { id: 'trait-35skel-3', name: 'Undead Traits', source: 'Undead Trait', description: 'Immune to poison, sleep, paralysis, stunning, disease, and mind-affecting effects. Not subject to critical hits, nonlethal damage, or ability drain.' }
    ],
    feats: [{ id: 'feat-35skel-1', name: 'Improved Initiative', description: '+4 bonus on initiative checks.' }]
  },

  {
    id: 'monster-35e-zombie',
    name: 'Human Commoner Zombie (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 2,
    edition: '3.5e',
    background: 'Medium Undead',
    sizeCategory: 'Medium',
    alignment: 'Neutral Evil',
    experiencePoints: 150,
    isMonster: true,
    monsterXpReward: 150,
    hpMax: 16,
    hpCurrent: 16,
    armorClass: 11,
    touchAcOverride: 9,
    flatFootedAcOverride: 11,
    initiativeBonus: -1,
    speed: 30,
    bab: 1,
    fortSaveBase: 0,
    refSaveBase: -1,
    willSaveBase: 3,
    hitDiceTotal: '2d12+3',
    hitDiceCurrent: 2,
    damageReductionValue: 5,
    damageReductionBypass: 'slashing',
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 12 },
      DEX: { score: 8 },
      CON: { score: 10 },
      INT: { score: 10 },
      WIS: { score: 10 },
      CHA: { score: 1 }
    },
    skills: make35eMonsterSkills(),
    attacks: [
      { id: 'atk-35zomb-1', name: 'Slam', attackBonus: 2, damage: '1d6 + 1', damageType: 'Bludgeoning', range: '5 ft Melee' }
    ],
    multiattack: 'Slam +2 melee (1d6+1).',
    classFeatures: [
      { id: 'trait-35zomb-1', name: 'Single Actions Only', source: 'Special Quality', description: 'Zombies have poor reflexes and can perform only a single move action or standard action each turn (cannot take a full attack).' },
      { id: 'trait-35zomb-2', name: 'Damage Reduction 5/Slashing', source: 'Undead Trait', description: 'Slashing weapons cut through dead sinew normally, but piercing and bludgeoning attacks are reduced by 5 points.' },
      { id: 'trait-35zomb-3', name: 'Undead Traits', source: 'Undead Trait', description: 'Immune to poison, sleep, paralysis, stunning, disease, death effects, and mind-affecting effects.' }
    ],
    feats: [{ id: 'feat-35zomb-1', name: 'Toughness', description: '+3 hit points.' }]
  },

  {
    id: 'monster-35e-orc-warrior',
    name: 'Orc Warrior (3.5e)',
    race: 'Orc',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 1,
    edition: '3.5e',
    background: 'Medium Humanoid (Orc)',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 150,
    isMonster: true,
    monsterXpReward: 150,
    hpMax: 5,
    hpCurrent: 5,
    armorClass: 13,
    touchAcOverride: 10,
    flatFootedAcOverride: 13,
    initiativeBonus: 0,
    speed: 30,
    bab: 1,
    fortSaveBase: 3,
    refSaveBase: 0,
    willSaveBase: -1,
    hitDiceTotal: '1d8+1',
    hitDiceCurrent: 1,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 17 },
      DEX: { score: 11 },
      CON: { score: 12 },
      INT: { score: 8 },
      WIS: { score: 7 },
      CHA: { score: 6 }
    },
    skills: make35eMonsterSkills(0, { Listen: 2, Spot: 2 }),
    attacks: [
      { id: 'atk-35orc-1', name: 'Greataxe', attackBonus: 4, damage: '1d12 + 4', damageType: 'Slashing', range: '5 ft Melee', notes: 'Crit: x3' },
      { id: 'atk-35orc-2', name: 'Javelin', attackBonus: 1, damage: '1d6 + 3', damageType: 'Piercing', range: '30 ft Ranged' }
    ],
    multiattack: 'Greataxe +4 melee (1d12+4/x3) or Javelin +1 ranged (1d6+3).',
    classFeatures: [
      { id: 'trait-35orc-1', name: 'Ferocity', source: 'Orc Racial Trait', description: 'An orc remains conscious and can continue fighting even if its hit points are reduced to between -1 and -9 HP.' },
      { id: 'trait-35orc-2', name: 'Light Sensitivity', source: 'Orc Racial Trait', description: 'Orcs are dazzled in bright sunlight or within the radius of a daylight spell (-1 penalty on attack rolls and Spot checks).' }
    ],
    feats: [{ id: 'feat-35orc-1', name: 'Alertness', description: '+2 bonus on Listen and Spot checks.' }],
    inventory: [{ id: 'i-35orc-1', name: 'Greataxe', quantity: 1, weight: 12, equipped: true }, { id: 'i-35orc-2', name: 'Studded Leather', quantity: 1, weight: 20, equipped: true }]
  },

  // --------------------------------------------------------------------------
  // CR 1 - 2: DUNGEON PREDATORS
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-ghoul',
    name: 'Ghoul (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1',
    challengeRating: '1',
    level: 2,
    edition: '3.5e',
    background: 'Medium Undead',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 300,
    isMonster: true,
    monsterXpReward: 300,
    hpMax: 13,
    hpCurrent: 13,
    armorClass: 14,
    touchAcOverride: 12,
    flatFootedAcOverride: 12,
    initiativeBonus: 2,
    speed: 30,
    bab: 1,
    fortSaveBase: 0,
    refSaveBase: 2,
    willSaveBase: 5,
    hitDiceTotal: '2d12',
    hitDiceCurrent: 2,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 13 },
      DEX: { score: 15 },
      CON: { score: 10 },
      INT: { score: 13 },
      WIS: { score: 14 },
      CHA: { score: 12 }
    },
    skills: make35eMonsterSkills(0, { Balance: 4, Climb: 5, Hide: 6, MoveSilently: 6, Spot: 7 }),
    attacks: [
      { id: 'atk-35ghoul-1', name: 'Bite', attackBonus: 2, damage: '1d6 + 1', damageType: 'Piercing', range: '5 ft Melee', notes: 'Inflicts Ghoul Fever & Paralysis (DC 12 Fort)' },
      { id: 'atk-35ghoul-2', name: 'Claw (x2)', attackBonus: 0, damage: '1d3', damageType: 'Slashing', range: '5 ft Melee', notes: 'Inflicts Paralysis (DC 12 Fort)' }
    ],
    multiattack: 'Bite +2 melee (1d6+1 plus ghoul fever and paralysis) and 2 claws +0 melee (1d3 plus paralysis).',
    classFeatures: [
      { id: 'trait-35ghoul-1', name: 'Paralysis', source: 'Special Attack', description: 'Those hit by a bite or claw must succeed on a DC 12 Fortitude save or be paralyzed for 1d4+1 rounds. Elves are immune.' },
      { id: 'trait-35ghoul-2', name: 'Ghoul Fever', source: 'Special Attack', description: 'Disease—bite, Fortitude DC 12, incubation 1 day, damage 1d3 Con and 1d3 Dex. A humanoid who dies of ghoul fever rises as a ghoul at the next midnight.' },
      { id: 'trait-35ghoul-3', name: '+2 Turn Resistance', source: 'Undead Trait', description: 'Treated as an undead with 4 Hit Dice for the purpose of turn/rebuke checks.' }
    ],
    feats: [{ id: 'feat-35ghoul-1', name: 'Multiattack', description: 'Reduces secondary natural weapon penalties from -5 to -2.' }]
  },

  {
    id: 'monster-35e-bugbear',
    name: 'Bugbear Stalker (3.5e)',
    race: 'Goblinoid',
    characterClass: 'Monster',
    subclass: 'CR 2',
    challengeRating: '2',
    level: 3,
    edition: '3.5e',
    background: 'Medium Humanoid (Goblinoid)',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 600,
    isMonster: true,
    monsterXpReward: 600,
    hpMax: 16,
    hpCurrent: 16,
    armorClass: 17,
    touchAcOverride: 11,
    flatFootedAcOverride: 16,
    initiativeBonus: 1,
    speed: 30,
    bab: 2,
    fortSaveBase: 2,
    refSaveBase: 4,
    willSaveBase: 1,
    hitDiceTotal: '3d8+3',
    hitDiceCurrent: 3,
    senses: 'Darkvision 60 ft., Scent',
    abilities: {
      STR: { score: 15 },
      DEX: { score: 12 },
      CON: { score: 13 },
      INT: { score: 10 },
      WIS: { score: 10 },
      CHA: { score: 9 }
    },
    skills: make35eMonsterSkills(0, { Climb: 3, Hide: 4, Listen: 4, MoveSilently: 6, Spot: 4 }),
    attacks: [
      { id: 'atk-35bug-1', name: 'Morningstar', attackBonus: 5, damage: '1d8 + 2', damageType: 'Bludgeoning/Piercing', range: '5 ft Melee' },
      { id: 'atk-35bug-2', name: 'Javelin', attackBonus: 3, damage: '1d6 + 2', damageType: 'Piercing', range: '30 ft Ranged' }
    ],
    multiattack: 'Morningstar +5 melee (1d8+2) or Javelin +3 ranged (1d6+2).',
    classFeatures: [
      { id: 'trait-35bug-1', name: 'Scent', source: 'Special Quality', description: 'Can detect approaching enemies within 30 ft by scent (60 ft upwind).' },
      { id: 'trait-35bug-2', name: 'Stealth Stalker', source: 'Racial Trait', description: 'Receives a +4 racial bonus on Move Silently checks.' }
    ],
    feats: [
      { id: 'feat-35bug-1', name: 'Alertness', description: '+2 bonus on Listen and Spot checks.' },
      { id: 'feat-35bug-2', name: 'Weapon Focus (Morningstar)', description: '+1 bonus on attack rolls with morningstar.' }
    ]
  },

  // --------------------------------------------------------------------------
  // CR 3 - 4: ICONIC ABERRATIONS & MAGICAL BEASTS
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-shadow',
    name: 'Shadow (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 3,
    edition: '3.5e',
    background: 'Medium Undead (Incorporeal)',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 900,
    isMonster: true,
    monsterXpReward: 900,
    hpMax: 19,
    hpCurrent: 19,
    armorClass: 13,
    touchAcOverride: 13,
    flatFootedAcOverride: 11,
    initiativeBonus: 2,
    speed: 30,
    speedFly: 40,
    bab: 1,
    fortSaveBase: 1,
    refSaveBase: 3,
    willSaveBase: 4,
    hitDiceTotal: '3d12',
    hitDiceCurrent: 3,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 14 },
      CON: { score: 10 },
      INT: { score: 6 },
      WIS: { score: 12 },
      CHA: { score: 13 }
    },
    skills: make35eMonsterSkills(0, { Hide: 8, Listen: 7, Spot: 7, Search: 4 }),
    attacks: [
      { id: 'atk-35shad-1', name: 'Incorporeal Touch', attackBonus: 3, damage: '1d6', damageType: 'Negative', range: '5 ft Melee Touch', notes: 'Deals 1d6 Strength Damage. Ignores armor and shields!' }
    ],
    multiattack: 'Incorporeal touch +3 melee (1d6 Strength damage).',
    classFeatures: [
      { id: 'trait-35shad-1', name: 'Strength Damage', source: 'Special Attack', description: 'Touch deals 1d6 points of Strength damage. A creature reduced to Strength 0 dies.' },
      { id: 'trait-35shad-2', name: 'Create Spawn', source: 'Special Attack', description: 'Any humanoid reduced to Str 0 becomes a shadow in 1d4 rounds under the command of its killer.' },
      { id: 'trait-35shad-3', name: 'Incorporeal Traits', source: 'Special Quality', description: 'Can only be harmed by other incorporeal creatures, magic weapons, or spells. 50% chance to ignore any damage from corporeal sources.' },
      { id: 'trait-35shad-4', name: '+2 Turn Resistance', source: 'Undead Trait', description: 'Treated as a 5 HD undead against turn/rebuke checks.' }
    ],
    feats: [
      { id: 'feat-35shad-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35shad-2', name: 'Dodge', description: '+1 dodge bonus to AC against a designated opponent.' }
    ]
  },

  {
    id: 'monster-35e-rust-monster',
    name: 'Rust Monster (3.5e)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '3.5e',
    background: 'Medium Aberration',
    sizeCategory: 'Medium',
    alignment: 'Neutral',
    experiencePoints: 900,
    isMonster: true,
    monsterXpReward: 900,
    hpMax: 27,
    hpCurrent: 27,
    armorClass: 18,
    touchAcOverride: 13,
    flatFootedAcOverride: 15,
    initiativeBonus: 3,
    speed: 40,
    bab: 3,
    fortSaveBase: 2,
    refSaveBase: 4,
    willSaveBase: 5,
    hitDiceTotal: '5d8+5',
    hitDiceCurrent: 5,
    senses: 'Darkvision 60 ft., Scent (Metals)',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 17 },
      CON: { score: 13 },
      INT: { score: 2 },
      WIS: { score: 13 },
      CHA: { score: 8 }
    },
    skills: make35eMonsterSkills(0, { Listen: 7, Spot: 7 }),
    attacks: [
      { id: 'atk-35rust-1', name: 'Antennae Touch', attackBonus: 3, damage: 'Rust', damageType: 'Acid/Corrosion', range: '5 ft Melee Touch', notes: 'DC 14 Reflex; instantaneously turns ferrous metal weapon or armor to useless rust!' },
      { id: 'atk-35rust-2', name: 'Bite', attackBonus: -2, damage: '1d3', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: 'Antennae touch +3 melee touch (rust) and bite -2 melee (1d3).',
    classFeatures: [
      { id: 'trait-35rust-1', name: 'Rust', source: 'Special Attack', description: 'A rust monster that touches or is hit by a metallic weapon instantaneously corrodes it. The weapon takes a DC 14 Reflex save or dissolves into dust. Magic items get a save; nonmagic items with no enhancement bonus are destroyed instantly.' }
    ],
    feats: [
      { id: 'feat-35rust-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35rust-2', name: 'Track', description: 'Can follow tracks using the Survival skill.' }
    ]
  },

  {
    id: 'monster-35e-gelatinous-cube',
    name: 'Gelatinous Cube (3.5e)',
    race: 'Ooze',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '3.5e',
    background: 'Large Ooze',
    sizeCategory: 'Large',
    alignment: 'Neutral',
    experiencePoints: 900,
    isMonster: true,
    monsterXpReward: 900,
    hpMax: 54,
    hpCurrent: 54,
    armorClass: 3,
    touchAcOverride: 3,
    flatFootedAcOverride: 3,
    initiativeBonus: -5,
    speed: 15,
    bab: 3,
    fortSaveBase: 9,
    refSaveBase: -4,
    willSaveBase: -4,
    hitDiceTotal: '4d10+32',
    hitDiceCurrent: 4,
    senses: 'Blindsight 60 ft.',
    damageImmunities: ['Electricity', 'Poison', 'Sleep', 'Paralysis', 'Polymorph', 'Stunning'],
    abilities: {
      STR: { score: 10 },
      DEX: { score: 1 },
      CON: { score: 26 },
      INT: { score: 10 },
      WIS: { score: 1 },
      CHA: { score: 1 }
    },
    skills: make35eMonsterSkills(),
    attacks: [
      { id: 'atk-35cube-1', name: 'Slam', attackBonus: 2, damage: '1d6 + 1d6 Acid', damageType: 'Bludgeoning/Acid', range: '5 ft Melee', notes: 'Plus Paralysis (DC 16 Fortitude)' }
    ],
    multiattack: 'Slam +2 melee (1d6 plus 1d6 acid and paralysis) or Engulf.',
    classFeatures: [
      { id: 'trait-35cube-1', name: 'Engulf', source: 'Special Attack', description: 'Can simply move over Large or smaller creatures as a standard action. Targets make DC 13 Reflex save or are engulfed, taking acid and paralysis damage each round.' },
      { id: 'trait-35cube-2', name: 'Paralysis', source: 'Special Attack', description: 'Secretes an anesthetizing slime. Hit targets must succeed on a DC 16 Fortitude save or be paralyzed for 3d6 rounds.' },
      { id: 'trait-35cube-3', name: 'Transparent', source: 'Special Quality', description: 'Hard to see; requires a DC 15 Spot check to notice a stationary gelatinous cube.' },
      { id: 'trait-35cube-4', name: 'Immunity to Electricity', source: 'Special Quality', description: 'Immune to all electrical damage.' }
    ],
    feats: []
  },

  {
    id: 'monster-35e-ghast',
    name: 'Ghast (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '3.5e',
    background: 'Medium Undead',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 900,
    isMonster: true,
    monsterXpReward: 900,
    hpMax: 29,
    hpCurrent: 29,
    armorClass: 16,
    touchAcOverride: 13,
    flatFootedAcOverride: 13,
    initiativeBonus: 3,
    speed: 30,
    bab: 2,
    fortSaveBase: 1,
    refSaveBase: 4,
    willSaveBase: 6,
    hitDiceTotal: '4d12+3',
    hitDiceCurrent: 4,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 17 },
      DEX: { score: 17 },
      CON: { score: 10 },
      INT: { score: 13 },
      WIS: { score: 14 },
      CHA: { score: 16 }
    },
    skills: make35eMonsterSkills(0, { Balance: 7, Climb: 9, Hide: 8, MoveSilently: 8, Spot: 8 }),
    attacks: [
      { id: 'atk-35ghast-1', name: 'Bite', attackBonus: 5, damage: '1d8 + 3', damageType: 'Piercing', range: '5 ft Melee', notes: 'Inflicts Ghoul Fever & Paralysis (Affects Elves!)' },
      { id: 'atk-35ghast-2', name: 'Claw (x2)', attackBonus: 3, damage: '1d4 + 1', damageType: 'Slashing', range: '5 ft Melee', notes: 'Inflicts Paralysis (DC 15 Fort)' }
    ],
    multiattack: 'Bite +5 melee (1d8+3 plus paralysis & fever) and 2 claws +3 melee (1d4+1 plus paralysis).',
    classFeatures: [
      { id: 'trait-35ghast-1', name: 'Stench', source: 'Special Attack', description: 'Gives off a terrible carrion stench in a 10-ft radius. Living creatures must succeed on a DC 15 Fortitude save or become sickened for 1d6+4 minutes.' },
      { id: 'trait-35ghast-2', name: 'True Paralysis', source: 'Special Attack', description: 'DC 15 Fortitude save or paralyzed for 1d4+1 rounds. Unlike standard ghouls, ghast paralysis works against elves too!' },
      { id: 'trait-35ghast-3', name: '+2 Turn Resistance', source: 'Undead Trait', description: 'Treated as a 6 HD undead against turn/rebuke attempts.' }
    ],
    feats: [
      { id: 'feat-35ghast-1', name: 'Multiattack', description: 'Reduces secondary natural attack penalty to -2.' },
      { id: 'feat-35ghast-2', name: 'Toughness', description: '+3 hit points.' }
    ]
  },

  {
    id: 'monster-35e-gargoyle',
    name: 'Gargoyle (3.5e)',
    race: 'Monstrous Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 4,
    edition: '3.5e',
    background: 'Medium Monstrous Humanoid (Earth)',
    sizeCategory: 'Medium',
    alignment: 'Chaotic Evil',
    experiencePoints: 1200,
    isMonster: true,
    monsterXpReward: 1200,
    hpMax: 37,
    hpCurrent: 37,
    armorClass: 16,
    touchAcOverride: 12,
    flatFootedAcOverride: 14,
    initiativeBonus: 2,
    speed: 40,
    speedFly: 60,
    bab: 4,
    fortSaveBase: 5,
    refSaveBase: 6,
    willSaveBase: 4,
    hitDiceTotal: '4d8+19',
    hitDiceCurrent: 4,
    damageReductionValue: 10,
    damageReductionBypass: 'magic',
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 15 },
      DEX: { score: 14 },
      CON: { score: 18 },
      INT: { score: 6 },
      WIS: { score: 11 },
      CHA: { score: 7 }
    },
    skills: make35eMonsterSkills(0, { Hide: 7, Listen: 4, Spot: 4 }),
    attacks: [
      { id: 'atk-35garg-1', name: 'Claw (x2)', attackBonus: 6, damage: '1d4 + 2', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-35garg-2', name: 'Bite', attackBonus: 4, damage: '1d4 + 1', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-35garg-3', name: 'Gore', attackBonus: 4, damage: '1d6 + 1', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: '2 claws +6 melee (1d4+2) and bite +4 melee (1d4+1) and gore +4 melee (1d6+1).',
    classFeatures: [
      { id: 'trait-35garg-1', name: 'Damage Reduction 10/Magic', source: 'Special Quality', description: 'Ignores the first 10 points of damage from weapons that are not magical.' },
      { id: 'trait-35garg-2', name: 'Freeze', source: 'Special Quality', description: 'Can hold itself completely still, appearing identical to a carved stone statue. Spot DC 20 to notice.' }
    ],
    feats: [
      { id: 'feat-35garg-1', name: 'Multiattack', description: 'Reduces secondary natural attack penalty to -2.' },
      { id: 'feat-35garg-2', name: 'Toughness', description: '+3 hit points.' }
    ]
  },

  {
    id: 'monster-35e-displacer-beast',
    name: 'Displacer Beast (3.5e)',
    race: 'Magical Beast',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 6,
    edition: '3.5e',
    background: 'Large Magical Beast',
    sizeCategory: 'Large',
    alignment: 'Lawful Evil',
    experiencePoints: 1200,
    isMonster: true,
    monsterXpReward: 1200,
    hpMax: 51,
    hpCurrent: 51,
    armorClass: 16,
    touchAcOverride: 11,
    flatFootedAcOverride: 14,
    initiativeBonus: 2,
    speed: 40,
    bab: 6,
    fortSaveBase: 8,
    refSaveBase: 7,
    willSaveBase: 3,
    hitDiceTotal: '6d10+18',
    hitDiceCurrent: 6,
    senses: 'Darkvision 60 ft., Low-Light Vision',
    abilities: {
      STR: { score: 18 },
      DEX: { score: 15 },
      CON: { score: 16 },
      INT: { score: 5 },
      WIS: { score: 12 },
      CHA: { score: 8 }
    },
    skills: make35eMonsterSkills(0, { Hide: 7, Listen: 5, MoveSilently: 7, Spot: 5 }),
    attacks: [
      { id: 'atk-35disp-1', name: 'Tentacle (x2)', attackBonus: 9, damage: '1d6 + 4', damageType: 'Bludgeoning/Slashing', range: '10 ft Melee Reach' },
      { id: 'atk-35disp-2', name: 'Bite', attackBonus: 4, damage: '1d8 + 2', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: '2 tentacles +9 melee (1d6+4) and bite +4 melee (1d8+2).',
    classFeatures: [
      { id: 'trait-35disp-1', name: 'Displacement', source: 'Special Quality', description: 'Light bends around the displacer beast, making it appear 1 to 2 feet away from its true location. All melee and ranged attacks suffer a true 50% miss chance unless the attacker has True Seeing.' },
      { id: 'trait-35disp-2', name: 'Resistance to Ranged Attacks', source: 'Special Quality', description: 'Gains a +2 resistance bonus on saving throws against all ranged spells and effects.' }
    ],
    feats: [
      { id: 'feat-35disp-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35disp-2', name: 'Dodge', description: '+1 dodge bonus to AC.' },
      { id: 'feat-35disp-3', name: 'Stealthy', description: '+2 on Hide and Move Silently checks.' }
    ]
  },

  {
    id: 'monster-35e-owlbear',
    name: 'Owlbear (3.5e)',
    race: 'Magical Beast',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 5,
    edition: '3.5e',
    background: 'Large Magical Beast',
    sizeCategory: 'Large',
    alignment: 'Neutral',
    experiencePoints: 1200,
    isMonster: true,
    monsterXpReward: 1200,
    hpMax: 52,
    hpCurrent: 52,
    armorClass: 15,
    touchAcOverride: 10,
    flatFootedAcOverride: 14,
    initiativeBonus: 1,
    speed: 30,
    bab: 5,
    fortSaveBase: 9,
    refSaveBase: 5,
    willSaveBase: 2,
    hitDiceTotal: '5d10+25',
    hitDiceCurrent: 5,
    senses: 'Darkvision 60 ft., Low-Light Vision, Scent',
    abilities: {
      STR: { score: 21 },
      DEX: { score: 12 },
      CON: { score: 21 },
      INT: { score: 2 },
      WIS: { score: 12 },
      CHA: { score: 10 }
    },
    skills: make35eMonsterSkills(0, { Listen: 8, Spot: 8 }),
    attacks: [
      { id: 'atk-35owl-1', name: 'Claw (x2)', attackBonus: 9, damage: '1d6 + 5', damageType: 'Slashing', range: '5 ft Melee', notes: 'Triggers Improved Grab (Grapple +13)' },
      { id: 'atk-35owl-2', name: 'Bite', attackBonus: 4, damage: '1d8 + 2', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: '2 claws +9 melee (1d6+5) and bite +4 melee (1d8+2).',
    classFeatures: [
      { id: 'trait-35owl-1', name: 'Improved Grab', source: 'Special Attack', description: 'To use this ability, an owlbear must hit with a claw attack. It can then attempt to start a grapple as a free action without provoking an attack of opportunity.' }
    ],
    feats: [
      { id: 'feat-35owl-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35owl-2', name: 'Track', description: 'Can follow tracks using Survival.' }
    ]
  },

  {
    id: 'monster-35e-mimic',
    name: 'Mimic (3.5e)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 7,
    edition: '3.5e',
    background: 'Medium Aberration (Shapechanger)',
    sizeCategory: 'Medium',
    alignment: 'Neutral',
    experiencePoints: 1200,
    isMonster: true,
    monsterXpReward: 1200,
    hpMax: 52,
    hpCurrent: 52,
    armorClass: 15,
    touchAcOverride: 11,
    flatFootedAcOverride: 14,
    initiativeBonus: 1,
    speed: 10,
    bab: 5,
    fortSaveBase: 5,
    refSaveBase: 5,
    willSaveBase: 6,
    hitDiceTotal: '7d8+21',
    hitDiceCurrent: 7,
    senses: 'Darkvision 60 ft.',
    damageImmunities: ['Acid'],
    abilities: {
      STR: { score: 19 },
      DEX: { score: 12 },
      CON: { score: 17 },
      INT: { score: 10 },
      WIS: { score: 13 },
      CHA: { score: 10 }
    },
    skills: make35eMonsterSkills(0, { Climb: 9, Disguise: 13, Listen: 8, Spot: 8 }),
    attacks: [
      { id: 'atk-35mimic-1', name: 'Slam', attackBonus: 9, damage: '1d8 + 6', damageType: 'Bludgeoning', range: '5 ft Melee', notes: 'Triggers Adhesive (DC 16 Reflex or stuck fast)' }
    ],
    multiattack: 'Slam +9 melee (1d8+6).',
    classFeatures: [
      { id: 'trait-35mimic-1', name: 'Adhesive', source: 'Special Attack', description: 'A mimic exudes an extremely sticky slime. Any creature or weapon striking the mimic is stuck fast unless it makes a DC 16 Reflex save. A stuck creature is considered grappled (Grapple +9).' },
      { id: 'trait-35mimic-2', name: 'Shapechanger', source: 'Special Quality', description: 'Can assume the general shape of any wooden or stone object (chests, doors, tables). Spot check vs DC 15 to notice.' }
    ],
    feats: [
      { id: 'feat-35mimic-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35mimic-2', name: 'Lightning Reflexes', description: '+2 bonus on Reflex saves.' },
      { id: 'feat-35mimic-3', name: 'Weapon Focus (Slam)', description: '+1 on attack rolls with slam.' }
    ]
  },

  // --------------------------------------------------------------------------
  // CR 5: DEADLY PREDATORS & GAZE ATTACKS
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-basilisk',
    name: 'Basilisk (3.5e)',
    race: 'Magical Beast',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '3.5e',
    background: 'Medium Magical Beast',
    sizeCategory: 'Medium',
    alignment: 'Neutral',
    experiencePoints: 1500,
    isMonster: true,
    monsterXpReward: 1500,
    hpMax: 45,
    hpCurrent: 45,
    armorClass: 16,
    touchAcOverride: 9,
    flatFootedAcOverride: 16,
    initiativeBonus: -1,
    speed: 20,
    bab: 6,
    fortSaveBase: 7,
    refSaveBase: 4,
    willSaveBase: 3,
    hitDiceTotal: '6d10+12',
    hitDiceCurrent: 6,
    senses: 'Darkvision 60 ft., Low-Light Vision',
    abilities: {
      STR: { score: 15 },
      DEX: { score: 8 },
      CON: { score: 15 },
      INT: { score: 2 },
      WIS: { score: 12 },
      CHA: { score: 10 }
    },
    skills: make35eMonsterSkills(0, { Hide: 0, Listen: 7, Spot: 7 }),
    attacks: [
      { id: 'atk-35bas-1', name: 'Bite', attackBonus: 8, damage: '1d8 + 3', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: 'Bite +8 melee (1d8+3).',
    classFeatures: [
      { id: 'trait-35bas-1', name: 'Petrifying Gaze', source: 'Special Attack', description: 'Turn to stone permanently, range 30 feet, Fortitude save DC 13 negates. A creature meeting its gaze on the basilisk’s turn must save, or passively save if within 30 ft.' }
    ],
    feats: [
      { id: 'feat-35bas-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35bas-2', name: 'Blind-Fight', description: 'Reroll miss chance against concealed targets.' },
      { id: 'feat-35bas-3', name: 'Great Fortitude', description: '+2 bonus on Fortitude saves.' }
    ]
  },

  {
    id: 'monster-35e-manticore',
    name: 'Manticore (3.5e)',
    race: 'Magical Beast',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '3.5e',
    background: 'Large Magical Beast',
    sizeCategory: 'Large',
    alignment: 'Lawful Evil',
    experiencePoints: 1500,
    isMonster: true,
    monsterXpReward: 1500,
    hpMax: 57,
    hpCurrent: 57,
    armorClass: 17,
    touchAcOverride: 11,
    flatFootedAcOverride: 15,
    initiativeBonus: 2,
    speed: 30,
    speedFly: 50,
    bab: 6,
    fortSaveBase: 9,
    refSaveBase: 7,
    willSaveBase: 3,
    hitDiceTotal: '6d10+24',
    hitDiceCurrent: 6,
    senses: 'Darkvision 60 ft., Low-Light Vision, Scent',
    abilities: {
      STR: { score: 20 },
      DEX: { score: 15 },
      CON: { score: 19 },
      INT: { score: 7 },
      WIS: { score: 12 },
      CHA: { score: 9 }
    },
    skills: make35eMonsterSkills(0, { Listen: 6, Spot: 9, Survival: 2 }),
    attacks: [
      { id: 'atk-35mant-1', name: '6 Tail Spikes', attackBonus: 8, damage: '1d8 + 2', damageType: 'Piercing', range: '180 ft Ranged', notes: 'Crit: 19-20/x2' },
      { id: 'atk-35mant-2', name: 'Claw (x2)', attackBonus: 10, damage: '1d6 + 5', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-35mant-3', name: 'Bite', attackBonus: 8, damage: '1d8 + 2', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    multiattack: '6 spikes +8 ranged (1d8+2/19-20) or 2 claws +10 melee (1d6+5) and bite +8 melee (1d8+2).',
    classFeatures: [
      { id: 'trait-35mant-1', name: 'Tail Spikes Volley', source: 'Special Attack', description: 'With a snap of its tail, a manticore can release a volley of six spikes as a standard action (180 ft range). It can loose up to 24 spikes in one 24-hour period.' }
    ],
    feats: [
      { id: 'feat-35mant-1', name: 'Flyby Attack', description: 'Can make an attack action during a move fly action.' },
      { id: 'feat-35mant-2', name: 'Multiattack', description: 'Reduces secondary natural attack penalty to -2.' },
      { id: 'feat-35mant-3', name: 'Weapon Focus (Spikes)', description: '+1 on attack rolls with tail spikes.' }
    ]
  },

  {
    id: 'monster-35e-wraith',
    name: 'Wraith (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 5,
    edition: '3.5e',
    background: 'Medium Undead (Incorporeal)',
    sizeCategory: 'Medium',
    alignment: 'Lawful Evil',
    experiencePoints: 1500,
    isMonster: true,
    monsterXpReward: 1500,
    hpMax: 32,
    hpCurrent: 32,
    armorClass: 15,
    touchAcOverride: 15,
    flatFootedAcOverride: 12,
    initiativeBonus: 7,
    speed: 30,
    speedFly: 60,
    bab: 2,
    fortSaveBase: 1,
    refSaveBase: 4,
    willSaveBase: 6,
    hitDiceTotal: '5d12',
    hitDiceCurrent: 5,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 16 },
      CON: { score: 10 },
      INT: { score: 14 },
      WIS: { score: 14 },
      CHA: { score: 15 }
    },
    skills: make35eMonsterSkills(0, { Diplomacy: 6, Hide: 11, Intimidate: 10, Listen: 12, Search: 10, SenseMotive: 8, Spot: 12 }),
    attacks: [
      { id: 'atk-35wraith-1', name: 'Incorporeal Touch', attackBonus: 5, damage: '1d4', damageType: 'Negative', range: '5 ft Melee Touch', notes: 'Inflicts 1d6 Constitution Drain (DC 14 Fortitude)' }
    ],
    multiattack: 'Incorporeal touch +5 melee touch (1d4 plus 1d6 Constitution drain).',
    classFeatures: [
      { id: 'trait-35wraith-1', name: 'Constitution Drain', source: 'Special Attack', description: 'Living creatures hit by touch must succeed on a DC 14 Fortitude save or take 1d6 points of permanent Constitution drain. The wraith gains 5 temporary hit points.' },
      { id: 'trait-35wraith-2', name: 'Create Spawn', source: 'Special Attack', description: 'Any humanoid slain by a wraith’s Constitution drain becomes a wraith in 1d4 rounds under its control.' },
      { id: 'trait-35wraith-3', name: 'Daylight Powerlessness', source: 'Special Quality', description: 'Wraiths are utterly powerless in natural sunlight (not mere daylight spells) and flee from it.' },
      { id: 'trait-35wraith-4', name: '+2 Turn Resistance', source: 'Undead Trait', description: 'Treated as a 7 HD undead against turn attempts.' }
    ],
    feats: [
      { id: 'feat-35wraith-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35wraith-2', name: 'Blind-Fight', description: 'Reroll miss chances against invisible foes.' },
      { id: 'feat-35wraith-3', name: 'Improved Initiative', description: '+4 bonus on initiative.' }
    ]
  },

  // --------------------------------------------------------------------------
  // CR 7 - 9: MID-HIGH TIER BOSSES & CONTROLLERS
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-aboleth',
    name: 'Aboleth (3.5e)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 7',
    challengeRating: '7',
    level: 8,
    edition: '3.5e',
    background: 'Huge Aberration (Aquatic)',
    sizeCategory: 'Huge',
    alignment: 'Lawful Evil',
    experiencePoints: 2100,
    isMonster: true,
    monsterXpReward: 2100,
    hpMax: 76,
    hpCurrent: 76,
    armorClass: 16,
    touchAcOverride: 9,
    flatFootedAcOverride: 15,
    initiativeBonus: 1,
    speed: 10,
    bab: 6,
    fortSaveBase: 7,
    refSaveBase: 3,
    willSaveBase: 8,
    hitDiceTotal: '8d8+40',
    hitDiceCurrent: 8,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 26 },
      DEX: { score: 12 },
      CON: { score: 20 },
      INT: { score: 15 },
      WIS: { score: 17 },
      CHA: { score: 17 }
    },
    skills: make35eMonsterSkills(0, { Concentration: 15, KnowledgeArcana: 13, Listen: 16, Spot: 16, Swim: 16 }),
    attacks: [
      { id: 'atk-35abo-1', name: 'Tentacle (x4)', attackBonus: 12, damage: '1d6 + 8', damageType: 'Bludgeoning', range: '10 ft Melee Reach', notes: 'Inflicts Slime Transformation (DC 19 Fortitude)' }
    ],
    multiattack: '4 tentacles +12 melee (1d6+8 plus transformation).',
    classFeatures: [
      { id: 'trait-35abo-1', name: 'Enslave (3/Day)', source: 'Special Attack', description: 'Three times per day, an aboleth can attempt to enslave one living creature within 30 feet. Target must succeed on a DC 17 Will save or be dominated until the aboleth dies.' },
      { id: 'trait-35abo-2', name: 'Mucus Cloud', source: 'Special Quality', description: 'While underwater, surrounds itself with a 1-foot cloud of slime. Creatures inhaling it must succeed on a DC 19 Fort save or lose the ability to breathe air for 3 hours (can breathe water).' },
      { id: 'trait-35abo-3', name: 'Slime Transformation', source: 'Special Attack', description: 'Target struck by tentacle must make a DC 19 Fort save or their skin becomes a clear, slimy membrane over 1d4+1 minutes that must be kept moist or takes 1d12 damage every 10 minutes.' },
      { id: 'trait-35abo-4', name: 'Psionic Illusions', source: 'Special Quality', description: 'Can project visual, auditory, and olfactory illusions at will (effective caster level 16th).' }
    ],
    feats: [
      { id: 'feat-35abo-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35abo-2', name: 'Combat Casting', description: '+4 on Concentration checks while casting defensively.' },
      { id: 'feat-35abo-3', name: 'Iron Will', description: '+2 bonus on Will saves.' }
    ]
  },

  {
    id: 'monster-35e-chimera',
    name: 'Chimera (3.5e)',
    race: 'Magical Beast',
    characterClass: 'Monster',
    subclass: 'CR 7',
    challengeRating: '7',
    level: 9,
    edition: '3.5e',
    background: 'Large Magical Beast',
    sizeCategory: 'Large',
    alignment: 'Chaotic Evil',
    experiencePoints: 2100,
    isMonster: true,
    monsterXpReward: 2100,
    hpMax: 76,
    hpCurrent: 76,
    armorClass: 19,
    touchAcOverride: 10,
    flatFootedAcOverride: 18,
    initiativeBonus: 1,
    speed: 30,
    speedFly: 50,
    bab: 9,
    fortSaveBase: 9,
    refSaveBase: 7,
    willSaveBase: 6,
    hitDiceTotal: '9d10+27',
    hitDiceCurrent: 9,
    senses: 'Darkvision 60 ft., Low-Light Vision, Scent',
    abilities: {
      STR: { score: 19 },
      DEX: { score: 13 },
      CON: { score: 17 },
      INT: { score: 4 },
      WIS: { score: 13 },
      CHA: { score: 10 }
    },
    skills: make35eMonsterSkills(0, { Hide: 1, Listen: 9, Spot: 9 }),
    attacks: [
      { id: 'atk-35chim-1', name: 'Bite (Dragon)', attackBonus: 12, damage: '1d8 + 4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-35chim-2', name: 'Bite (Lion)', attackBonus: 12, damage: '2d6 + 4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-35chim-3', name: 'Butt (Goat)', attackBonus: 12, damage: '1d6 + 4', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-35chim-4', name: 'Claw (x2)', attackBonus: 10, damage: '1d6 + 2', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-35chim-5', name: 'Breath Weapon (3d8 Fire)', attackBonus: 0, damage: '3d8', damageType: 'Fire', range: '20 ft Cone / 40 ft Line', notes: 'DC 17 Reflex save for half damage (Recharge 1d4 rounds)' }
    ],
    multiattack: 'Bite (dragon) +12 melee (1d8+4), bite (lion) +12 melee (2d6+4), butt (goat) +12 melee (1d6+4), 2 claws +10 melee (1d6+2).',
    classFeatures: [
      { id: 'trait-35chim-1', name: 'Dragon Breath Weapon', source: 'Special Attack', description: 'Can exhale a 20-ft cone or 40-ft line of fire dealing 3d8 damage (DC 17 Reflex half, recharges every 1d4 rounds).' }
    ],
    feats: [
      { id: 'feat-35chim-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35chim-2', name: 'Hover', description: 'Can halt movement in mid-air and kick up dust.' },
      { id: 'feat-35chim-3', name: 'Iron Will', description: '+2 bonus on Will saves.' },
      { id: 'feat-35chim-4', name: 'Multiattack', description: 'Reduces secondary natural attack penalty to -2.' }
    ]
  },

  {
    id: 'monster-35e-medusa',
    name: 'Medusa (3.5e)',
    race: 'Monstrous Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 7',
    challengeRating: '7',
    level: 6,
    edition: '3.5e',
    background: 'Medium Monstrous Humanoid',
    sizeCategory: 'Medium',
    alignment: 'Lawful Evil',
    experiencePoints: 2100,
    isMonster: true,
    monsterXpReward: 2100,
    hpMax: 33,
    hpCurrent: 33,
    armorClass: 15,
    touchAcOverride: 12,
    flatFootedAcOverride: 13,
    initiativeBonus: 2,
    speed: 30,
    bab: 6,
    fortSaveBase: 3,
    refSaveBase: 7,
    willSaveBase: 6,
    hitDiceTotal: '6d8+6',
    hitDiceCurrent: 6,
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 15 },
      CON: { score: 12 },
      INT: { score: 12 },
      WIS: { score: 13 },
      CHA: { score: 15 }
    },
    skills: make35eMonsterSkills(0, { Bluff: 9, Disguise: 9, MoveSilently: 8, Spot: 8 }),
    attacks: [
      { id: 'atk-35med-1', name: 'Shortbow (Poison Arrows)', attackBonus: 8, damage: '1d6', damageType: 'Piercing', range: '60 ft Ranged', notes: 'Crit: x3. DC 14 Fortitude save vs Strength Poison (1d6 Str initial, 2d6 Str secondary)' },
      { id: 'atk-35med-2', name: 'Dagger', attackBonus: 8, damage: '1d4', damageType: 'Piercing', range: '5 ft Melee', notes: 'Crit: 19-20/x2' },
      { id: 'atk-35med-3', name: 'Snake Hair', attackBonus: 3, damage: '1d4', damageType: 'Piercing', range: '5 ft Melee', notes: 'DC 14 Fortitude save vs Strength Poison' }
    ],
    multiattack: 'Shortbow +8/+3 ranged (1d6/x3 plus poison) or Dagger +8/+3 melee (1d4) and snakes +3 melee (1d4 plus poison).',
    classFeatures: [
      { id: 'trait-35med-1', name: 'Petrifying Gaze', source: 'Special Attack', description: 'Turn permanently to stone, range 30 feet, Fortitude DC 15 negates. Living creatures meeting a medusa’s gaze must save each round.' },
      { id: 'trait-35med-2', name: 'Snake Venom', source: 'Special Attack', description: 'Injury, Fortitude DC 14, initial damage 1d6 Str, secondary damage 2d6 Str.' }
    ],
    feats: [
      { id: 'feat-35med-1', name: 'Point Blank Shot', description: '+1 on attack and damage within 30 ft.' },
      { id: 'feat-35med-2', name: 'Precise Shot', description: 'Shoot into melee without the standard -4 penalty.' },
      { id: 'feat-35med-3', name: 'Weapon Finesse', description: 'Use Dexterity modifier on attack rolls with light weapons.' }
    ]
  },

  {
    id: 'monster-35e-mind-flayer',
    name: 'Mind Flayer / Illithid (3.5e)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 8',
    challengeRating: '8',
    level: 8,
    edition: '3.5e',
    background: 'Medium Aberration',
    sizeCategory: 'Medium',
    alignment: 'Lawful Evil',
    experiencePoints: 2600,
    isMonster: true,
    monsterXpReward: 2600,
    hpMax: 44,
    hpCurrent: 44,
    armorClass: 15,
    touchAcOverride: 12,
    flatFootedAcOverride: 13,
    initiativeBonus: 6,
    speed: 30,
    bab: 6,
    fortSaveBase: 3,
    refSaveBase: 4,
    willSaveBase: 9,
    hitDiceTotal: '8d8+8',
    hitDiceCurrent: 8,
    spellResist: 25,
    senses: 'Darkvision 60 ft., Telepathy 100 ft.',
    abilities: {
      STR: { score: 12 },
      DEX: { score: 14 },
      CON: { score: 12 },
      INT: { score: 19 },
      WIS: { score: 17 },
      CHA: { score: 17 }
    },
    skills: make35eMonsterSkills(0, { Bluff: 11, Concentration: 15, Diplomacy: 7, Hide: 10, Intimidate: 9, KnowledgeArcana: 12, Listen: 11, MoveSilently: 10, Spot: 11 }),
    attacks: [
      { id: 'atk-35ill-1', name: 'Tentacle (x4)', attackBonus: 8, damage: '1d4 + 1', damageType: 'Bludgeoning', range: '5 ft Melee', notes: 'Triggers Improved Grab (Grapple +7)' },
      { id: 'atk-35ill-2', name: 'Mind Blast (60 ft Cone)', attackBonus: 0, damage: 'Stun 3d4 Rounds', damageType: 'Psionic', range: '60 ft Cone', notes: 'DC 17 Will save or stunned for 3d4 rounds!' }
    ],
    multiattack: '4 tentacles +8 melee (1d4+1 plus improved grab) or Mind Blast (60-ft cone).',
    classFeatures: [
      { id: 'trait-35ill-1', name: 'Mind Blast', source: 'Special Attack', description: 'Emits a 60-foot cone of mental energy. Anyone caught must succeed on a DC 17 Will save or be stunned for 3d4 rounds.' },
      { id: 'trait-35ill-2', name: 'Improved Grab & Attach', source: 'Special Attack', description: 'If it hits with a tentacle, it can attempt to start a grapple as a free action without provoking an AoO. Each success allows it to attach another tentacle.' },
      { id: 'trait-35ill-3', name: 'Extract Brain', source: 'Special Attack', description: 'A mind flayer that begins its turn with all four tentacles attached to a foe makes a successful grapple check to extract the victim’s brain, instantly slaying the creature.' },
      { id: 'trait-35ill-4', name: 'Spell Resistance 25', source: 'Special Quality', description: 'Casters must make a 1d20 + Caster Level check vs DC 25 to affect the mind flayer with spells.' },
      { id: 'trait-35ill-5', name: 'At-Will Psionics', source: 'Special Quality', description: 'Can cast Charm Monster, Detect Thoughts, Levitate, Plane Shift, and Suggestion at will (DC 14 + spell level).' }
    ],
    feats: [
      { id: 'feat-35ill-1', name: 'Combat Casting', description: '+4 on Concentration checks when casting defensively.' },
      { id: 'feat-35ill-2', name: 'Improved Initiative', description: '+4 bonus on initiative checks.' },
      { id: 'feat-35ill-3', name: 'Weapon Finesse', description: 'Uses Dexterity modifier on attack rolls with tentacles.' }
    ]
  },

  {
    id: 'monster-35e-bone-devil',
    name: 'Bone Devil / Osyluth (3.5e)',
    race: 'Baatezu Devil',
    characterClass: 'Monster',
    subclass: 'CR 9',
    challengeRating: '9',
    level: 10,
    edition: '3.5e',
    background: 'Large Outsider (Evil, Lawful)',
    sizeCategory: 'Large',
    alignment: 'Lawful Evil',
    experiencePoints: 3600,
    isMonster: true,
    monsterXpReward: 3600,
    hpMax: 95,
    hpCurrent: 95,
    armorClass: 25,
    touchAcOverride: 14,
    flatFootedAcOverride: 20,
    initiativeBonus: 9,
    speed: 40,
    bab: 10,
    fortSaveBase: 12,
    refSaveBase: 12,
    willSaveBase: 11,
    hitDiceTotal: '10d8+50',
    hitDiceCurrent: 10,
    damageReductionValue: 10,
    damageReductionBypass: 'good',
    spellResist: 21,
    senses: 'Darkvision 60 ft., See in Darkness, Telepathy 100 ft.',
    damageImmunities: ['Fire', 'Poison'],
    abilities: {
      STR: { score: 21 },
      DEX: { score: 21 },
      CON: { score: 21 },
      INT: { score: 14 },
      WIS: { score: 14 },
      CHA: { score: 14 }
    },
    skills: make35eMonsterSkills(0, { Bluff: 15, Concentration: 18, Diplomacy: 6, Hide: 14, Intimidate: 17, Listen: 17, MoveSilently: 18, Search: 15, SenseMotive: 15, Spot: 17 }),
    attacks: [
      { id: 'atk-35bone-1', name: 'Bite', attackBonus: 14, damage: '1d8 + 5', damageType: 'Piercing', range: '10 ft Melee' },
      { id: 'atk-35bone-2', name: 'Claw (x2)', attackBonus: 12, damage: '1d4 + 2', damageType: 'Slashing', range: '10 ft Melee' },
      { id: 'atk-35bone-3', name: 'Sting', attackBonus: 12, damage: '3d4 + 2', damageType: 'Piercing', range: '10 ft Melee', notes: 'Inflicts Bone Devil Poison (DC 20 Fortitude, 1d6 Str initial / 2d6 Str secondary)' }
    ],
    multiattack: 'Bite +14 melee (1d8+5), 2 claws +12 melee (1d4+2), and sting +12 melee (3d4+2 plus poison).',
    classFeatures: [
      { id: 'trait-35bone-1', name: 'Fear Aura', source: 'Special Attack', description: 'Radius 5 feet. Any creature must succeed on a DC 17 Will save or be affected as by a fear spell.' },
      { id: 'trait-35bone-2', name: 'Poison Sting', source: 'Special Attack', description: 'DC 20 Fortitude save; initial damage 1d6 Str, secondary damage 2d6 Str.' },
      { id: 'trait-35bone-3', name: 'Damage Reduction 10/Good', source: 'Devil Trait', description: 'Ignores 10 points of damage from weapons that are not Good-aligned.' },
      { id: 'trait-35bone-4', name: 'Spell Resistance 21', source: 'Devil Trait', description: 'Requires CL check vs 21 to affect with magic.' }
    ],
    feats: [
      { id: 'feat-35bone-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35bone-2', name: 'Improved Initiative', description: '+4 bonus on initiative.' },
      { id: 'feat-35bone-3', name: 'Iron Will', description: '+2 bonus on Will saves.' },
      { id: 'feat-35bone-4', name: 'Multiattack', description: 'Reduces secondary natural attack penalties to -2.' }
    ]
  },

  // --------------------------------------------------------------------------
  // CR 12 - 13: HIGH-TIER LEGENDS (LICH & BEHOLDER & ICE DEVIL)
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-lich',
    name: 'Lich 11th-Level Wizard (3.5e)',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 12',
    challengeRating: '12',
    level: 11,
    edition: '3.5e',
    background: 'Medium Undead',
    sizeCategory: 'Medium',
    alignment: 'Neutral Evil',
    experiencePoints: 8500,
    isMonster: true,
    monsterXpReward: 8500,
    hpMax: 71,
    hpCurrent: 71,
    armorClass: 21,
    touchAcOverride: 12,
    flatFootedAcOverride: 19,
    initiativeBonus: 2,
    speed: 30,
    bab: 5,
    fortSaveBase: 3,
    refSaveBase: 5,
    willSaveBase: 10,
    hitDiceTotal: '11d12',
    hitDiceCurrent: 11,
    damageReductionValue: 15,
    damageReductionBypass: 'bludgeoning and magic',
    damageImmunities: ['Cold', 'Electricity', 'Polymorph', 'Poison', 'Sleep', 'Paralysis'],
    senses: 'Darkvision 60 ft.',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 14 },
      CON: { score: 10 },
      INT: { score: 20 },
      WIS: { score: 16 },
      CHA: { score: 15 }
    },
    skills: make35eMonsterSkills(11, { Concentration: 16, DecipherScript: 14, Hide: 10, KnowledgeArcana: 19, Listen: 15, MoveSilently: 10, Search: 17, SenseMotive: 11, Spellcraft: 21, Spot: 15 }),
    attacks: [
      { id: 'atk-35lich-1', name: 'Paralyzing Touch', attackBonus: 5, damage: '1d8 + 5', damageType: 'Negative Energy', range: '5 ft Melee Touch', notes: 'DC 18 Fortitude save or permanently paralyzed!' },
      { id: 'atk-35lich-2', name: 'Cone of Cold (Spell)', attackBonus: 0, damage: '11d6', damageType: 'Cold', range: '60 ft Cone', notes: 'DC 20 Reflex save for half damage' },
      { id: 'atk-35lich-3', name: 'Fireball (Spell)', attackBonus: 0, damage: '10d6', damageType: 'Fire', range: '800 ft Ranged', notes: 'DC 18 Reflex save for half damage' }
    ],
    multiattack: 'Paralyzing Touch +5 melee touch (1d8+5 negative energy plus permanent paralysis) or Cast Spell.',
    classFeatures: [
      { id: 'trait-35lich-1', name: 'Paralyzing Touch', source: 'Special Attack', description: 'Any living creature touched takes 1d8+5 negative energy damage and must succeed on a DC 18 Fortitude save or be permanently paralyzed.' },
      { id: 'trait-35lich-2', name: 'Fear Aura', source: 'Special Attack', description: 'Creatures of less than 5 HD within a 60-ft radius must succeed on a DC 17 Will save or be panicked for 11 rounds.' },
      { id: 'trait-35lich-3', name: 'Damage Reduction 15/Bludgeoning and Magic', source: 'Special Quality', description: 'Ignores 15 points of damage from attacks unless they are both bludgeoning and magical.' },
      { id: 'trait-35lich-4', name: 'Phylactery Rejuvenation', source: 'Special Quality', description: 'When destroyed, its body reconstitutes in 1d10 days unless its phylactery is found and annihilated.' },
      { id: 'trait-35lich-5', name: '+4 Turn Resistance', source: 'Undead Trait', description: 'Treated as a 15 HD undead against turn attempts.' }
    ],
    feats: [
      { id: 'feat-35lich-1', name: 'Combat Casting', description: '+4 on Concentration checks.' },
      { id: 'feat-35lich-2', name: 'Craft Wondrous Item', description: 'Can craft wondrous magic items.' },
      { id: 'feat-35lich-3', name: 'Scribe Scroll', description: 'Can scribe magic scrolls.' },
      { id: 'feat-35lich-4', name: 'Spell Focus (Evocation)', description: '+1 DC on Evocation spells.' },
      { id: 'feat-35lich-5', name: 'Toughness', description: '+3 hit points.' }
    ]
  },

  {
    id: 'monster-35e-beholder',
    name: 'Beholder (3.5e)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 13',
    challengeRating: '13',
    level: 11,
    edition: '3.5e',
    background: 'Large Aberration',
    sizeCategory: 'Large',
    alignment: 'Lawful Evil',
    experiencePoints: 10500,
    isMonster: true,
    monsterXpReward: 10500,
    hpMax: 60,
    hpCurrent: 60,
    armorClass: 26,
    touchAcOverride: 11,
    flatFootedAcOverride: 24,
    initiativeBonus: 6,
    speed: 5,
    speedFly: 20,
    bab: 8,
    fortSaveBase: 6,
    refSaveBase: 5,
    willSaveBase: 11,
    hitDiceTotal: '11d8+11',
    hitDiceCurrent: 11,
    senses: 'All-Around Vision, Darkvision 60 ft.',
    abilities: {
      STR: { score: 10 },
      DEX: { score: 14 },
      CON: { score: 12 },
      INT: { score: 17 },
      WIS: { score: 15 },
      CHA: { score: 15 }
    },
    skills: make35eMonsterSkills(11, { Hide: 8, KnowledgeArcana: 15, Listen: 18, Search: 19, Spot: 22, Survival: 2 }),
    attacks: [
      { id: 'atk-35beh-1', name: '10 Eye Rays', attackBonus: 9, damage: 'Magical Ray', damageType: 'Varies', range: '150 ft Ranged Touch', notes: 'All rays DC 17: Disintegrate, Flesh to Stone, Finger of Death, Sleep, Charm Person, Charm Monster, Telekinesis, Fear, Slow, Inflict Moderate Wounds' },
      { id: 'atk-35beh-2', name: 'Bite', attackBonus: 2, damage: '2d4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-35beh-3', name: 'Antimagic Eye Cone', attackBonus: 0, damage: 'Suppression', damageType: 'Antimagic', range: '150 ft Cone', notes: 'Central eye suppresses all magic and spells continuously!' }
    ],
    multiattack: 'Eye rays +9 ranged touch (up to 5 rays per arc of vision) and bite +2 melee (2d4).',
    classFeatures: [
      { id: 'trait-35beh-1', name: 'Central Antimagic Cone', source: 'Special Attack', description: 'Central eye creates a 150-ft cone of continuous antimagic (as antimagic field spell). Suppresses all spells, spell-like abilities, and magic items in the cone.' },
      { id: 'trait-35beh-2', name: 'Ten Eye Rays', source: 'Special Attack', description: '10 stalk eyes produce distinct rays (DC 17, CL 13th): 1. Charm Person; 2. Charm Monster; 3. Sleep; 4. Telekinesis; 5. Flesh to Stone; 6. Disintegrate (22d6 damage); 7. Fear; 8. Slow; 9. Inflict Moderate Wounds (2d8+10); 10. Finger of Death (DC 17 or slain, 3d6+13 on save).' },
      { id: 'trait-35beh-3', name: 'All-Around Vision', source: 'Special Quality', description: 'Eyes pointing in all directions give it a +4 racial bonus on Spot and Listen checks. Cannot be flanked!' }
    ],
    feats: [
      { id: 'feat-35beh-1', name: 'Flyby Attack', description: 'Can make an attack during flight move.' },
      { id: 'feat-35beh-2', name: 'Great Fortitude', description: '+2 on Fortitude saves.' },
      { id: 'feat-35beh-3', name: 'Improved Initiative', description: '+4 on initiative checks.' },
      { id: 'feat-35beh-4', name: 'Iron Will', description: '+2 on Will saves.' }
    ]
  },

  {
    id: 'monster-35e-ice-devil',
    name: 'Ice Devil / Gelugon (3.5e)',
    race: 'Baatezu Devil',
    characterClass: 'Monster',
    subclass: 'CR 13',
    challengeRating: '13',
    level: 14,
    edition: '3.5e',
    background: 'Large Outsider (Evil, Lawful)',
    sizeCategory: 'Large',
    alignment: 'Lawful Evil',
    experiencePoints: 10500,
    isMonster: true,
    monsterXpReward: 10500,
    hpMax: 133,
    hpCurrent: 133,
    armorClass: 32,
    touchAcOverride: 10,
    flatFootedAcOverride: 31,
    initiativeBonus: 5,
    speed: 40,
    bab: 14,
    fortSaveBase: 14,
    refSaveBase: 10,
    willSaveBase: 15,
    hitDiceTotal: '14d8+70',
    hitDiceCurrent: 14,
    damageReductionValue: 10,
    damageReductionBypass: 'good',
    spellResist: 25,
    damageImmunities: ['Cold', 'Poison'],
    senses: 'Darkvision 60 ft., See in Darkness, Telepathy 100 ft.',
    abilities: {
      STR: { score: 29 },
      DEX: { score: 13 },
      CON: { score: 21 },
      INT: { score: 22 },
      WIS: { score: 22 },
      CHA: { score: 20 }
    },
    skills: make35eMonsterSkills(14, { Bluff: 22, Climb: 26, Concentration: 22, Diplomacy: 9, Disguise: 5, Intimidate: 24, Jump: 30, KnowledgeArcana: 23, Listen: 23, MoveSilently: 18, Search: 23, SenseMotive: 23, Spellcraft: 25, Spot: 23 }),
    attacks: [
      { id: 'atk-35ice-1', name: 'Spear', attackBonus: 22, damage: '2d6 + 13', damageType: 'Piercing', range: '10 ft Melee', notes: 'Crit: x3. Plus Numbing Cold (DC 22 Fortitude or slowed 1d6 rounds)' },
      { id: 'atk-35ice-2', name: 'Bite', attackBonus: 17, damage: '2d6 + 4', damageType: 'Piercing', range: '10 ft Melee' },
      { id: 'atk-35ice-3', name: 'Tail Slap', attackBonus: 17, damage: '3d6 + 4', damageType: 'Bludgeoning', range: '10 ft Melee', notes: 'Plus Numbing Cold' }
    ],
    multiattack: 'Spear +22/+17/+12 melee (2d6+13/x3 plus numbing cold), bite +17 melee (2d6+4), and tail slap +17 melee (3d6+4 plus numbing cold).',
    classFeatures: [
      { id: 'trait-35ice-1', name: 'Numbing Cold', source: 'Special Attack', description: 'Any creature hit by a spear or tail attack must make a DC 22 Fortitude save or be slowed for 1d6 rounds.' },
      { id: 'trait-35ice-2', name: 'Fear Aura', source: 'Special Attack', description: 'Radius 10 feet. Any creature must make a DC 22 Will save or be panicked for 1d6 rounds.' },
      { id: 'trait-35ice-3', name: 'Regeneration 5', source: 'Special Quality', description: 'Fire and good weapons deal normal damage; heals 5 points per round from all other damage.' },
      { id: 'trait-35ice-4', name: 'Damage Reduction 10/Good', source: 'Devil Trait', description: 'Ignores 10 points of damage from non-Good weapons.' },
      { id: 'trait-35ice-5', name: 'Spell Resistance 25', source: 'Devil Trait', description: 'Requires CL check vs 25 to affect with magic.' }
    ],
    feats: [
      { id: 'feat-35ice-1', name: 'Alertness', description: '+2 on Listen and Spot checks.' },
      { id: 'feat-35ice-2', name: 'Cleave', description: 'Gain extra melee attack upon dropping an opponent.' },
      { id: 'feat-35ice-3', name: 'Combat Reflexes', description: 'Extra attacks of opportunity equal to Dex mod.' },
      { id: 'feat-35ice-4', name: 'Improved Initiative', description: '+4 on initiative checks.' },
      { id: 'feat-35ice-5', name: 'Power Attack', description: 'Trade attack bonus for extra damage.' }
    ]
  },

  // --------------------------------------------------------------------------
  // CR 20: LEGENDARY BOSS (BALOR DEMON)
  // --------------------------------------------------------------------------
  {
    id: 'monster-35e-balor',
    name: 'Balor (3.5e)',
    race: 'Tanar\'ri Demon',
    characterClass: 'Monster',
    subclass: 'CR 20',
    challengeRating: '20',
    level: 20,
    edition: '3.5e',
    background: 'Large Outsider (Chaotic, Evil)',
    sizeCategory: 'Large',
    alignment: 'Chaotic Evil',
    experiencePoints: 38000,
    isMonster: true,
    monsterXpReward: 38000,
    hpMax: 290,
    hpCurrent: 290,
    armorClass: 35,
    touchAcOverride: 16,
    flatFootedAcOverride: 28,
    initiativeBonus: 11,
    speed: 40,
    speedFly: 90,
    bab: 20,
    fortSaveBase: 22,
    refSaveBase: 19,
    willSaveBase: 19,
    hitDiceTotal: '20d8+200',
    hitDiceCurrent: 20,
    damageReductionValue: 15,
    damageReductionBypass: 'cold iron and good',
    spellResist: 28,
    damageImmunities: ['Electricity', 'Fire', 'Poison'],
    senses: 'Darkvision 60 ft., True Seeing, Telepathy 100 ft.',
    abilities: {
      STR: { score: 35 },
      DEX: { score: 25 },
      CON: { score: 31 },
      INT: { score: 24 },
      WIS: { score: 24 },
      CHA: { score: 26 }
    },
    skills: make35eMonsterSkills(20, { Bluff: 31, Concentration: 33, Diplomacy: 35, Disguise: 8, Hide: 26, Intimidate: 33, KnowledgeArcana: 30, Listen: 38, MoveSilently: 30, Search: 30, SenseMotive: 30, Spellcraft: 32, Spot: 38, Survival: 7 }),
    attacks: [
      { id: 'atk-35bal-1', name: '+1 Vorpal Unholy Greatsword', attackBonus: 31, damage: '3d6 + 13', damageType: 'Slashing/Unholy', range: '10 ft Melee', notes: 'Crit: 19-20/x2. Vorpal: severs the target head instantly on confirmed critical hit!' },
      { id: 'atk-35bal-2', name: '+1 Flaming Whip', attackBonus: 30, damage: '1d4 + 7 plus 1d6 Fire', damageType: 'Slashing/Fire', range: '15 ft Reach', notes: 'Can entangle target on hit' }
    ],
    multiattack: '+1 vorpal unholy greatsword +31/+26/+21/+16 melee (3d6+13/19-20) and +1 flaming whip +30/+25 melee (1d4+7 plus 1d6 fire and entangle).',
    classFeatures: [
      { id: 'trait-35bal-1', name: 'Death Throes', source: 'Special Attack', description: 'When killed, a balor explodes in a blinding flash of flame that deals 100 points of damage to anything within 100 feet (DC 30 Reflex save for half damage).' },
      { id: 'trait-35bal-2', name: 'Vorpal Weaponry', source: 'Special Attack', description: 'Upon a natural 20 critical threat confirmation, the balor’s greatsword instantly beheads its victim (unless it lacks a head).' },
      { id: 'trait-35bal-3', name: 'Entangle with Whip', source: 'Special Attack', description: 'The whip can entangle a foe of Large size or smaller. The balor can pull the entangled victim into its space as a free action.' },
      { id: 'trait-35bal-4', name: 'Fear Aura', source: 'Special Attack', description: 'Radius 20 feet. Creatures within must make a DC 27 Will save or be panicked for 1d6 rounds.' },
      { id: 'trait-35bal-5', name: 'Damage Reduction 15/Cold Iron and Good', source: 'Demon Trait', description: 'Ignores 15 points of damage unless weapons are both Cold Iron and Good-aligned.' },
      { id: 'trait-35bal-6', name: 'Spell Resistance 28', source: 'Demon Trait', description: 'Requires Caster Level check vs 28 to affect with spells.' }
    ],
    feats: [
      { id: 'feat-35bal-1', name: 'Cleave', description: 'Extra melee attack on dropping an opponent.' },
      { id: 'feat-35bal-2', name: 'Improved Initiative', description: '+4 on initiative.' },
      { id: 'feat-35bal-3', name: 'Multiweapon Fighting', description: 'Penalties for fighting with multiple weapons are reduced.' },
      { id: 'feat-35bal-4', name: 'Power Attack', description: 'Trade attack bonus for damage.' },
      { id: 'feat-35bal-5', name: 'Quicken Spell-Like Ability (Telekinesis)', description: 'Can cast telekinesis as a swift action.' },
      { id: 'feat-35bal-6', name: 'Weapon Focus (Greatsword)', description: '+1 on attack rolls with greatsword.' }
    ],
    inventory: [
      { id: 'i-35bal-1', name: '+1 Vorpal Unholy Greatsword', quantity: 1, weight: 16, equipped: true },
      { id: 'i-35bal-2', name: '+1 Flaming Whip', quantity: 1, weight: 4, equipped: true }
    ],
    wealth: { cp: 0, sp: 0, ep: 0, gp: 25000, pp: 1200 }
  }
];
