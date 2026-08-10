import { CharacterData, RuleEdition } from '../types';

export interface CompanionPreset {
  id: string;
  name: string;
  category: 'Familiar' | 'Animal Companion' | 'Steed / Mount' | 'Summoned Spirit' | 'Fiend / Undead';
  edition: '5e' | '3.5e' | 'both';
  crOrLevelReq: string;
  size: 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge';
  hp: number;
  ac: number;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  passivePerception?: number;
  senses?: string;
  specialTraits: { name: string; description: string }[];
  attacks: { name: string; attackBonus: number; damage: string; damageType: string; description?: string }[];
  masterBonuses35e?: string; // e.g., "+3 to Spot checks in shadows" or "+3 hit points to master"
}

export function isCompanionSummonAbility(name: string, description?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  const d = (description || '').toLowerCase();

  const keywords = [
    'find familiar', 'find steed', 'find greater steed', 'summon beast',
    'summon celestial', 'summon draconic spirit', 'summon elemental', 'summon fey',
    'summon fiend', 'summon shadowspawn', 'summon undead', 'summon construct',
    'summon aberration', 'conjure animals', 'conjure minor elementals', 'conjure woodland beings',
    'conjure celestial', 'conjure elemental', 'animate dead', 'create undead',
    'animal companion', 'primal companion', 'drake companion', 'steel defender',
    'summon familiar', 'pact of the chain', 'special mount', 'wild companion',
    'summon monster', 'summon nature\'s ally', 'homunculus'
  ];

  if (keywords.some(k => n.includes(k))) return true;

  if (
    d.includes('find familiar') ||
    d.includes('animal companion') ||
    d.includes('primal companion') ||
    d.includes('summon a familiar') ||
    d.includes('summon a beast') ||
    d.includes('summon an elemental') ||
    d.includes('summon a spirit') ||
    d.includes('obtain an animal companion') ||
    d.includes('obtain a familiar') ||
    d.includes('special mount')
  ) {
    return true;
  }

  return false;
}

export const PRESET_COMPANIONS: CompanionPreset[] = [
  // --- 5E FAMILIARS ---
  {
    id: 'familiar-owl-5e',
    name: 'Owl (5e Familiar)',
    category: 'Familiar',
    edition: '5e',
    crOrLevelReq: '1st Level Spell (Find Familiar)',
    size: 'Tiny',
    hp: 1,
    ac: 11,
    speed: '5 ft., fly 60 ft.',
    str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7,
    passivePerception: 13,
    senses: 'Darkvision 120 ft.',
    specialTraits: [
      { name: 'Flyby', description: 'The owl doesn\'t provoke opportunity attacks when it flies out of an enemy\'s reach.' },
      { name: 'Keen Hearing and Sight', description: 'The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight.' }
    ],
    attacks: [
      { name: 'Talons', attackBonus: 3, damage: '1d1', damageType: 'Slashing' }
    ]
  },
  {
    id: 'familiar-cat-5e',
    name: 'Cat (5e Familiar)',
    category: 'Familiar',
    edition: '5e',
    crOrLevelReq: '1st Level Spell (Find Familiar)',
    size: 'Tiny',
    hp: 2,
    ac: 12,
    speed: '40 ft., climb 30 ft.',
    str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
    passivePerception: 13,
    senses: 'Darkvision 60 ft.',
    specialTraits: [
      { name: 'Keen Smell', description: 'The cat has advantage on Wisdom (Perception) checks that rely on smell.' }
    ],
    attacks: [
      { name: 'Claws', attackBonus: 0, damage: '1d1', damageType: 'Slashing' }
    ]
  },
  {
    id: 'familiar-imp-5e',
    name: 'Imp (5e Pact of the Chain)',
    category: 'Familiar',
    edition: '5e',
    crOrLevelReq: '3rd Level Warlock (Pact of the Chain)',
    size: 'Tiny',
    hp: 10,
    ac: 13,
    speed: '20 ft., fly 40 ft.',
    str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14,
    passivePerception: 11,
    senses: 'Darkvision 120 ft., Devil\'s Sight',
    specialTraits: [
      { name: 'Shapechanger', description: 'Can turn into a rat, raven, or spider or back into imp form.' },
      { name: 'Invisibility', description: 'Action to turn invisible along with equipment until it attacks or concentrates.' },
      { name: 'Magic Resistance', description: 'Advantage on saving throws against spells and magical effects.' }
    ],
    attacks: [
      { name: 'Sting', attackBonus: 5, damage: '1d4+3 Piercing + 3d6 Poison', damageType: 'Poison' }
    ]
  },
  {
    id: 'familiar-pseudodragon-5e',
    name: 'Pseudodragon (5e Pact of the Chain)',
    category: 'Familiar',
    edition: '5e',
    crOrLevelReq: '3rd Level Warlock (Pact of the Chain)',
    size: 'Tiny',
    hp: 7,
    ac: 13,
    speed: '15 ft., fly 60 ft.',
    str: 6, dex: 15, con: 13, int: 10, wis: 12, cha: 10,
    passivePerception: 13,
    senses: 'Blindsight 10 ft., Darkvision 60 ft.',
    specialTraits: [
      { name: 'Limited Telepathy', description: 'Can communicate simple ideas, emotions, and images telepathically with any creature within 100 ft.' },
      { name: 'Magic Resistance', description: 'Advantage on saving throws against spells and magical effects.' }
    ],
    attacks: [
      { name: 'Sting (Poison Unconsciousness)', attackBonus: 4, damage: '1d4+2 Piercing', damageType: 'Piercing', description: 'Target must pass DC 11 CON save or be Poisoned for 1 hour. If failed by 5+, target falls Unconscious!' }
    ]
  },

  // --- 3.5E FAMILIARS (With Passive Master Stat/Skill Bonuses!) ---
  {
    id: 'familiar-toad-35e',
    name: 'Toad (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Diminutive',
    hp: 2, // Master's Half HP in 3.5e
    ac: 16, // Base 12 + 4 Size
    speed: '5 ft., swim 10 ft.',
    str: 1, dex: 12, con: 11, int: 6, wis: 14, cha: 4,
    passivePerception: 12,
    senses: 'Low-light vision',
    specialTraits: [
      { name: 'Amphibious', description: 'Can breathe air and water.' },
      { name: '3.5e Master Passive Bonus', description: 'Grants +3 BONUS TO MASTER\'S MAXIMUM HIT POINTS while within 1 mile!' }
    ],
    attacks: [],
    masterBonuses35e: '+3 bonus to Master\'s maximum Hit Points!'
  },
  {
    id: 'familiar-owl-35e',
    name: 'Owl (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Tiny',
    hp: 2,
    ac: 17, // 12 + 2 DEX + 2 Size + 1 Natural Armor
    speed: '10 ft., fly 40 ft.',
    str: 4, dex: 17, con: 10, int: 6, wis: 14, cha: 4,
    passivePerception: 16,
    senses: 'Low-light vision (8x human night vision)',
    specialTraits: [
      { name: '3.5e Master Passive Bonus', description: 'Grants +3 BONUS ON SPOT CHECKS IN SHADOWS/TWILIGHT to Master!' }
    ],
    attacks: [
      { name: 'Talons', attackBonus: 5, damage: '1d2-3', damageType: 'Slashing' }
    ],
    masterBonuses35e: '+3 bonus on Spot checks in shadows/twilight'
  },
  {
    id: 'familiar-cat-35e',
    name: 'Cat (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Tiny',
    hp: 2,
    ac: 14, // 10 + 2 DEX + 2 Size
    speed: '30 ft.',
    str: 3, dex: 15, con: 10, int: 6, wis: 12, cha: 7,
    passivePerception: 13,
    senses: 'Low-light vision & Scent',
    specialTraits: [
      { name: '3.5e Master Passive Bonus', description: 'Grants +3 BONUS ON MOVE SILENTLY CHECKS to Master!' }
    ],
    attacks: [
      { name: '2 Claws', attackBonus: 4, damage: '1d2-4', damageType: 'Slashing' }
    ],
    masterBonuses35e: '+3 bonus on Move Silently checks'
  },
  {
    id: 'familiar-bat-35e',
    name: 'Bat (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Diminutive',
    hp: 2,
    ac: 16,
    speed: '5 ft., fly 40 ft.',
    str: 1, dex: 15, con: 10, int: 6, wis: 14, cha: 4,
    passivePerception: 18,
    senses: 'Blindsight 20 ft.',
    specialTraits: [
      { name: '3.5e Master Passive Bonus', description: 'Grants +3 BONUS ON LISTEN CHECKS to Master!' }
    ],
    attacks: [],
    masterBonuses35e: '+3 bonus on Listen checks'
  },
  {
    id: 'familiar-rat-35e',
    name: 'Rat (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Tiny',
    hp: 2,
    ac: 14,
    speed: '15 ft., climb 15 ft., swim 15 ft.',
    str: 2, dex: 15, con: 10, int: 6, wis: 12, cha: 2,
    passivePerception: 12,
    senses: 'Low-light vision & Scent',
    specialTraits: [
      { name: '3.5e Master Passive Bonus', description: 'Grants +2 BONUS ON FORTITUDE SAVES to Master!' }
    ],
    attacks: [
      { name: 'Bite', attackBonus: 4, damage: '1d3-4', damageType: 'Piercing' }
    ],
    masterBonuses35e: '+2 bonus to Fortitude saves'
  },
  {
    id: 'familiar-raven-35e',
    name: 'Raven (3.5e Familiar)',
    category: 'Familiar',
    edition: '3.5e',
    crOrLevelReq: '1st Level Wizard / Sorcerer Feature',
    size: 'Tiny',
    hp: 2,
    ac: 14,
    speed: '10 ft., fly 40 ft.',
    str: 2, dex: 15, con: 10, int: 6, wis: 14, cha: 6,
    passivePerception: 15,
    senses: 'Low-light vision',
    specialTraits: [
      { name: 'Speaks Language', description: 'Speaks one language of choice fluently.' },
      { name: '3.5e Master Passive Bonus', description: 'Grants +3 BONUS ON APPRAISE CHECKS to Master!' }
    ],
    attacks: [
      { name: 'Claws', attackBonus: 4, damage: '1d2-4', damageType: 'Slashing' }
    ],
    masterBonuses35e: '+3 bonus on Appraise checks & Speaks 1 language'
  },

  // --- 5E PRIMAL & ANIMAL COMPANIONS ---
  {
    id: 'companion-primal-land-5e',
    name: 'Beast of the Land (5e Primal Companion)',
    category: 'Animal Companion',
    edition: '5e',
    crOrLevelReq: 'Ranger Level 3 (Primal Companion)',
    size: 'Medium',
    hp: 20, // 5 + 5x Ranger Level
    ac: 15, // 13 + PB
    speed: '40 ft., climb 40 ft.',
    str: 14, dex: 14, con: 15, int: 8, wis: 14, cha: 11,
    passivePerception: 12,
    senses: 'Darkvision 60 ft.',
    specialTraits: [
      { name: 'Primal Bond', description: 'Add your Proficiency Bonus to any check, saving throw, and damage roll the beast makes.' },
      { name: 'Charge', description: 'If moving 20 ft. straight toward target, deal +1d6 slashing damage and DC spell save STR check or fall prone.' }
    ],
    attacks: [
      { name: 'Maul', attackBonus: 5, damage: '1d8+2+PB', damageType: 'Slashing' }
    ]
  },
  {
    id: 'companion-wolf-5e',
    name: 'Wolf (5e Animal Companion)',
    category: 'Animal Companion',
    edition: '5e',
    crOrLevelReq: 'CR 1/4 / Ranger Companion',
    size: 'Medium',
    hp: 11,
    ac: 13,
    speed: '40 ft.',
    str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6,
    passivePerception: 13,
    senses: 'Darkvision 60 ft., Keen Hearing & Smell',
    specialTraits: [
      { name: 'Pack Tactics', description: 'Advantage on attack rolls if at least one ally is within 5 ft. of target.' }
    ],
    attacks: [
      { name: 'Bite', attackBonus: 4, damage: '2d4+2', damageType: 'Piercing', description: 'DC 11 STR save or knocked prone.' }
    ]
  },

  // --- 3.5E ANIMAL COMPANIONS (With Bonus HD, Natural Armor, Link & Tricks!) ---
  {
    id: 'companion-wolf-35e',
    name: 'Wolf (3.5e Animal Companion)',
    category: 'Animal Companion',
    edition: '3.5e',
    crOrLevelReq: '1st Level Druid / 4th Level Ranger',
    size: 'Medium',
    hp: 13,
    ac: 14, // 10 + 2 DEX + 2 Natural Armor
    speed: '50 ft.',
    str: 13, dex: 15, con: 15, int: 2, wis: 12, cha: 6,
    passivePerception: 15,
    senses: 'Scent & Low-Light Vision',
    specialTraits: [
      { name: 'Trip', description: 'If bite hits, free trip check (+1 check modifier) without provoking attack of opportunity.' },
      { name: '3.5e Companion Scaling', description: 'Gains +2 to +12 Bonus HD, +2 to +12 Natural Armor, +1 to +6 STR/DEX, and bonus trick slots with Master Level!' }
    ],
    attacks: [
      { name: 'Bite', attackBonus: 3, damage: '1d6+1', damageType: 'Piercing', description: 'Triggers free Trip check!' }
    ]
  },
  {
    id: 'companion-riding-dog-35e',
    name: 'Riding Dog (3.5e Animal Companion)',
    category: 'Animal Companion',
    edition: '3.5e',
    crOrLevelReq: '1st Level Druid / 4th Level Ranger',
    size: 'Medium',
    hp: 17,
    ac: 16, // 10 + 2 DEX + 4 Natural Armor
    speed: '40 ft.',
    str: 15, dex: 15, con: 15, int: 2, wis: 12, cha: 6,
    passivePerception: 15,
    senses: 'Scent & Low-Light Vision',
    specialTraits: [
      { name: 'Trip', description: 'If bite hits, free trip check (+2 check modifier).' }
    ],
    attacks: [
      { name: 'Bite', attackBonus: 3, damage: '1d6+3', damageType: 'Piercing' }
    ]
  },

  // --- STEEDS & MOUNTS ---
  {
    id: 'steed-warhorse-5e',
    name: 'Warhorse (5e Find Steed)',
    category: 'Steed / Mount',
    edition: '5e',
    crOrLevelReq: '2nd Level Spell (Find Steed)',
    size: 'Large',
    hp: 19,
    ac: 11,
    speed: '60 ft.',
    str: 18, dex: 12, con: 13, int: 6, wis: 12, cha: 7,
    passivePerception: 11,
    specialTraits: [
      { name: 'Trampling Charge', description: 'If moving 20 ft. straight toward target, DC 14 STR save or prone + bonus Hooves attack.' },
      { name: 'Telepathic Bond', description: 'While mounted, spells targeting self can also target steed.' }
    ],
    attacks: [
      { name: 'Hooves', attackBonus: 6, damage: '2d6+4', damageType: 'Bludgeoning' }
    ]
  },
  {
    id: 'steed-griffon-5e',
    name: 'Griffon (5e Find Greater Steed)',
    category: 'Steed / Mount',
    edition: '5e',
    crOrLevelReq: '4th Level Spell (Find Greater Steed)',
    size: 'Large',
    hp: 59,
    ac: 12,
    speed: '30 ft., fly 80 ft.',
    str: 18, dex: 15, con: 16, int: 7, wis: 13, cha: 8,
    passivePerception: 15,
    senses: 'Darkvision 60 ft., Keen Sight',
    specialTraits: [
      { name: 'Multiattack', description: 'Makes two attacks: Beak and Claws.' }
    ],
    attacks: [
      { name: 'Beak', attackBonus: 6, damage: '1d8+4', damageType: 'Piercing' },
      { name: 'Claws', attackBonus: 6, damage: '2d6+4', damageType: 'Slashing' }
    ]
  },
  {
    id: 'steed-heavy-warhorse-35e',
    name: 'Heavy Warhorse (3.5e Paladin Special Mount)',
    category: 'Steed / Mount',
    edition: '3.5e',
    crOrLevelReq: '5th Level Paladin Feature',
    size: 'Large',
    hp: 30, // Base 30 + Paladin Level Bonus HD
    ac: 18, // 10 + 1 DEX - 1 Size + 4 Natural Armor + barding
    speed: '50 ft.',
    str: 18, dex: 13, con: 17, int: 6, wis: 12, cha: 6,
    passivePerception: 14,
    senses: 'Low-light vision & Scent',
    specialTraits: [
      { name: 'Empathic Link', description: 'Paladin has empathic link up to 1 mile.' },
      { name: 'Share Spells & Saving Throws', description: 'Spells cast on Paladin affect mount; mount uses Paladin\'s saving throws if better.' }
    ],
    attacks: [
      { name: '2 Hooves', attackBonus: 4, damage: '1d6+4', damageType: 'Bludgeoning' },
      { name: 'Bite', attackBonus: -1, damage: '1d4+2', damageType: 'Piercing' }
    ]
  },

  // --- SUMMONED SPIRITS (5e) ---
  {
    id: 'summon-beast-spirit-5e',
    name: 'Bestial Spirit (5e Summon Beast)',
    category: 'Summoned Spirit',
    edition: '5e',
    crOrLevelReq: '2nd Level Spell (Summon Beast)',
    size: 'Small',
    hp: 30,
    ac: 13,
    speed: '30 ft., climb 30 ft. (or fly/swim 60 ft.)',
    str: 18, dex: 11, con: 16, int: 4, wis: 14, cha: 5,
    passivePerception: 12,
    senses: 'Darkvision 60 ft.',
    specialTraits: [
      { name: 'Pack Tactics / Flyby', description: 'Advantage on attack rolls when ally is near, or flyby without opportunity attacks.' }
    ],
    attacks: [
      { name: 'Maul / Beak', attackBonus: 6, damage: '1d8+4+SL', damageType: 'Piercing' }
    ]
  },
  {
    id: 'summon-fey-spirit-5e',
    name: 'Fey Spirit (5e Summon Fey)',
    category: 'Summoned Spirit',
    edition: '5e',
    crOrLevelReq: '3rd Level Spell (Summon Fey)',
    size: 'Small',
    hp: 30,
    ac: 15,
    speed: '40 ft.',
    str: 13, dex: 16, con: 14, int: 14, wis: 11, cha: 16,
    passivePerception: 10,
    senses: 'Darkvision 60 ft.',
    specialTraits: [
      { name: 'Fey Step', description: 'Bonus action to teleport up to 30 ft.' }
    ],
    attacks: [
      { name: 'Fey Blade', attackBonus: 7, damage: '1d6+3+SL', damageType: 'Force' }
    ]
  }
];

// Calculation helpers for 3.5e vs 5e Familiar / Companion Scaling
export function calculate35eFamiliarBonusStats(masterLevel: number, baseHpMax: number) {
  const masterHalfHp = Math.max(1, Math.floor(baseHpMax / 2));
  let naturalArmorBonus = 1;
  let intScore = 6;
  let specialAbilities: string[] = ['Alertness', 'Improved Evasion', 'Share Spells', 'Empathic Link'];

  if (masterLevel >= 3) { naturalArmorBonus = 2; intScore = 7; specialAbilities.push('Deliver Touch Spells'); }
  if (masterLevel >= 5) { naturalArmorBonus = 3; intScore = 8; specialAbilities.push('Speak with Master'); }
  if (masterLevel >= 7) { naturalArmorBonus = 4; intScore = 9; specialAbilities.push('Speak with Animals of Its Kind'); }
  if (masterLevel >= 9) { naturalArmorBonus = 5; intScore = 10; }
  if (masterLevel >= 11) { naturalArmorBonus = 6; intScore = 11; specialAbilities.push('Spell Resistance'); }
  if (masterLevel >= 13) { naturalArmorBonus = 7; intScore = 12; }
  if (masterLevel >= 15) { naturalArmorBonus = 8; intScore = 13; specialAbilities.push('Scry on Familiar'); }
  if (masterLevel >= 17) { naturalArmorBonus = 9; intScore = 14; }
  if (masterLevel >= 19) { naturalArmorBonus = 10; intScore = 15; }

  return {
    familiarHp: masterHalfHp,
    naturalArmorBonus,
    intScore,
    specialAbilities
  };
}
