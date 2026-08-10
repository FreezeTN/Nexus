import { TransformationForm, CharacterData, ActiveTransformation, Attack, ClassFeature, Feat } from '../types';

export function isShapeshiftAbility(name: string, description?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  const d = (description || '').toLowerCase();

  const keywords = [
    'wild shape', 'polymorph', 'shapechange', 'animal shapes', 'alter self',
    'disguise self', 'gaseous form', 'draconic transformation', 'tenser\'s transformation',
    'lycanthropy', 'beast form', 'hybrid form', 'shapeshift', 'metamorphosis',
    'starry form', 'symbiotic entity', 'form of dread', 'change shape', 'vampire form',
    'primal companion', 'werewolf', 'weretiger', 'werebear'
  ];

  if (keywords.some(k => n.includes(k))) return true;
  if (
    d.includes('transform into') ||
    d.includes('shapeshift') ||
    d.includes('wild shape') ||
    d.includes('polymorph') ||
    d.includes('beast form') ||
    d.includes('shapechange') ||
    d.includes('hybrid form') ||
    d.includes('assume the shape') ||
    d.includes('change your appearance') ||
    d.includes('assume a beast')
  ) {
    return true;
  }

  return false;
}

export const PRESET_TRANSFORMATION_FORMS: TransformationForm[] = [
  // --- 5E TRANSFORMATION FORMS ---
  {
    id: 'form-brown-bear-5e',
    name: 'Brown Bear (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 34,
    formHpCurrent: 34,
    formAc: 11,
    formSpeed: 40,
    formAbilities: { STR: 19, DEX: 10, CON: 16 },
    hasHands: false,
    specialTraits: ['Keen Smell (Advantage on Wisdom Perception checks involving smell)', 'Multiattack (Bite + Claws)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/brown-bear.jpg',
    notes: 'CR 1 Beast (5e). Powerful physical frontline tank form with 5e multiattack & HP buffer.',
    naturalWeapons: [
      {
        id: 'nw-bb-bite',
        name: 'Bite (Bear)',
        attackBonus: 5,
        damage: '1d8 + 4',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'Powerful bear bite'
      },
      {
        id: 'nw-bb-claws',
        name: 'Claws (Bear)',
        attackBonus: 5,
        damage: '2d6 + 4',
        damageType: 'Slashing',
        range: '5 ft Melee',
        notes: 'Crushing bear paw slash'
      }
    ]
  },
  {
    id: 'form-dire-wolf-5e',
    name: 'Dire Wolf (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 37,
    formHpCurrent: 37,
    formAc: 14,
    formSpeed: 50,
    formAbilities: { STR: 17, DEX: 15, CON: 15 },
    hasHands: false,
    specialTraits: ['Keen Hearing and Smell', 'Pack Tactics (Advantage on attack rolls if an ally is within 5 ft)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/dire-wolf.jpg',
    notes: 'CR 1 Beast (5e). High speed with DC 13 STR trip bite.',
    naturalWeapons: [
      {
        id: 'nw-dw-bite',
        name: 'Bite (Dire Wolf)',
        attackBonus: 5,
        damage: '2d6 + 3',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'DC 13 STR saving throw or target is knocked Prone!'
      }
    ]
  },
  {
    id: 'form-giant-spider-5e',
    name: 'Giant Spider (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 26,
    formHpCurrent: 26,
    formAc: 14,
    formSpeed: 30,
    formAbilities: { STR: 14, DEX: 16, CON: 12 },
    hasHands: false,
    specialTraits: ['Spider Climb (Climb difficult surfaces without checks)', 'Web Sense', 'Web Walker'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-spider.jpg',
    notes: 'CR 1 Beast (5e). Poison bite & ranged Web control.',
    naturalWeapons: [
      {
        id: 'nw-gs-bite',
        name: 'Poison Bite (Spider)',
        attackBonus: 5,
        damage: '1d8 + 3',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'Target takes additional 2d8 Poison damage (DC 11 CON save for half).'
      },
      {
        id: 'nw-gs-web',
        name: 'Web Shot (Spider)',
        attackBonus: 5,
        damage: '0',
        damageType: 'Utility',
        range: '30/60 ft Ranged',
        notes: 'Recharge 5-6. Target is Restrained by webbing (DC 12 STR check to escape).'
      }
    ]
  },
  {
    id: 'form-giant-eagle-5e',
    name: 'Giant Eagle (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 26,
    formHpCurrent: 26,
    formAc: 13,
    formSpeed: 80,
    formAbilities: { STR: 16, DEX: 17, CON: 13 },
    hasHands: false,
    specialTraits: ['Keen Sight (Advantage on Perception checks involving sight)', 'Fly Speed 80 ft'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-eagle.jpg',
    notes: 'CR 1 Beast (5e). Sky scout & aerial mobility predator.',
    naturalWeapons: [
      {
        id: 'nw-ge-beak',
        name: 'Beak (Eagle)',
        attackBonus: 5,
        damage: '1d6 + 3',
        damageType: 'Piercing',
        range: '5 ft Melee'
      },
      {
        id: 'nw-ge-talons',
        name: 'Talons (Eagle)',
        attackBonus: 5,
        damage: '2d6 + 3',
        damageType: 'Slashing',
        range: '5 ft Melee',
        notes: 'Grasping sharp eagle talons'
      }
    ]
  },
  {
    id: 'form-giant-constrictor-5e',
    name: 'Giant Constrictor Snake (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Huge',
    formHpMax: 60,
    formHpCurrent: 60,
    formAc: 12,
    formSpeed: 30,
    formAbilities: { STR: 19, DEX: 14, CON: 12 },
    hasHands: false,
    specialTraits: ['Blindsight 10 ft', 'Swim Speed 30 ft'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-constrictor-snake.jpg',
    notes: 'CR 2 Beast (5e). Massive grappling & crushing force.',
    naturalWeapons: [
      {
        id: 'nw-gcs-bite',
        name: 'Bite (Snake)',
        attackBonus: 6,
        damage: '2d6 + 4',
        damageType: 'Piercing',
        range: '10 ft Melee'
      },
      {
        id: 'nw-gcs-constrict',
        name: 'Constrict (Snake)',
        attackBonus: 6,
        damage: '2d8 + 4',
        damageType: 'Bludgeoning',
        range: '10 ft Melee',
        notes: 'Target is Grappled (escape DC 14) and Restrained until grapple ends.'
      }
    ]
  },
  {
    id: 'form-earth-elemental-5e',
    name: 'Earth Elemental (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 126,
    formHpCurrent: 126,
    formAc: 17,
    formSpeed: 30,
    formAbilities: { STR: 20, DEX: 8, CON: 20 },
    hasHands: false,
    specialTraits: ['Earth Glide (Burrow through unworked earth/stone without disturbing material)', 'Siege Monster (Double damage to objects)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/monsters/earth-elemental.jpg',
    notes: 'CR 5 Elemental Form (Moon Druid Lv 10). Ultimate siege tank.',
    naturalWeapons: [
      {
        id: 'nw-ee-slam1',
        name: 'Slam (Earth Fist)',
        attackBonus: 8,
        damage: '2d8 + 5',
        damageType: 'Bludgeoning',
        range: '10 ft Melee',
        notes: 'Heavy stone fist impact'
      }
    ]
  },
  {
    id: 'form-fire-elemental-5e',
    name: 'Fire Elemental (5e)',
    type: 'Wild Shape',
    edition: '5e',
    sizeCategory: 'Large',
    formHpMax: 102,
    formHpCurrent: 102,
    formAc: 13,
    formSpeed: 50,
    formAbilities: { STR: 10, DEX: 17, CON: 16 },
    hasHands: false,
    specialTraits: ['Fire Form (Can move through 1-inch space; entering creature takes 1d10 Fire)', 'Illumination (30ft bright light)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/monsters/fire-elemental.jpg',
    notes: 'CR 5 Elemental Form (5e). Scorching area control.',
    naturalWeapons: [
      {
        id: 'nw-fe-touch',
        name: 'Touch (Flame Blast)',
        attackBonus: 6,
        damage: '2d6 + 3',
        damageType: 'Fire',
        range: '5 ft Melee',
        notes: 'Target catches fire, taking 1d10 Fire damage at start of its turn until action used to extinguish.'
      }
    ]
  },
  {
    id: 'form-werewolf-hybrid-5e',
    name: 'Werewolf (Hybrid Form 5e)',
    type: 'Lycanthropy',
    edition: '5e',
    sizeCategory: 'Medium',
    formHpMax: 58,
    formHpCurrent: 58,
    formAc: 12,
    formSpeed: 30,
    formAbilities: { STR: 15, DEX: 13, CON: 14 },
    hasHands: true,
    specialTraits: ['Keen Hearing and Smell', 'Damage Immunity: Nonmagical, non-silvered weapon attacks'],
    notes: 'Lycanthropy Hybrid Form (5e). Gains nonmagical weapon immunity & curse bite.',
    naturalWeapons: [
      {
        id: 'nw-ww-bite',
        name: 'Curse Bite (Wolf)',
        attackBonus: 4,
        damage: '1d8 + 2',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'If target is humanoid, must pass DC 12 CON save or be cursed with werewolf lycanthropy!'
      },
      {
        id: 'nw-ww-claws',
        name: 'Claws (Werewolf)',
        attackBonus: 4,
        damage: '2d4 + 2',
        damageType: 'Slashing',
        range: '5 ft Melee'
      }
    ]
  },
  {
    id: 'form-trex-5e',
    name: 'Tyrannosaurus Rex (5e)',
    type: 'Polymorph',
    edition: '5e',
    sizeCategory: 'Huge',
    formHpMax: 136,
    formHpCurrent: 136,
    formAc: 13,
    formSpeed: 50,
    formAbilities: { STR: 25, DEX: 10, CON: 19 },
    hasHands: false,
    specialTraits: ['Multiattack (Bite + Tail)', 'Huge Apex Predator'],
    notes: 'CR 8 Beast Form (5e Polymorph / Shapechange). Devastating single-target jaws.',
    naturalWeapons: [
      {
        id: 'nw-trex-bite',
        name: 'Bite (T-Rex Jaws)',
        attackBonus: 10,
        damage: '4d12 + 7',
        damageType: 'Piercing',
        range: '10 ft Melee',
        notes: 'Target is Grappled (escape DC 17). Until grapple ends, target is Restrained!'
      },
      {
        id: 'nw-trex-tail',
        name: 'Tail Swipe (T-Rex)',
        attackBonus: 10,
        damage: '3d8 + 7',
        damageType: 'Bludgeoning',
        range: '10 ft Melee'
      }
    ]
  },

  // --- 3.5E TRANSFORMATION FORMS (Replaces/Duplicates with 3.5e Mechanics) ---
  {
    id: 'form-brown-bear-35e',
    name: 'Brown Bear (3.5e)',
    type: 'Wild Shape',
    edition: '3.5e',
    sizeCategory: 'Large',
    formHpMax: 51,
    formHpCurrent: 51,
    formAc: 15, // 10 + 1 DEX - 1 Size + 5 Natural Armor
    formSpeed: 40,
    formAbilities: { STR: 27, DEX: 13, CON: 19 },
    hasHands: false,
    specialTraits: [
      '3.5e Wild Shape: Retains Master HP & HD (heals 1 HP/level on transform)',
      'Improved Grab: If claw hits, free grapple check without provoking attack of opportunity',
      'Natural Armor +5',
      'Scent & Low-Light Vision'
    ],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/brown-bear.jpg',
    notes: 'Large Animal (3.5e). STR 27 (+8), DEX 13 (+1), CON 19 (+4). Claws +8, Bite +3. Retains character HP!',
    naturalWeapons: [
      {
        id: 'nw-bb35-claw1',
        name: 'Primary Claw (Bear)',
        attackBonus: 8,
        damage: '1d8 + 8',
        damageType: 'Slashing',
        range: '5 ft Melee',
        notes: 'Primary natural weapon (+STR mod). Triggers Improved Grab!'
      },
      {
        id: 'nw-bb35-bite',
        name: 'Secondary Bite (Bear)',
        attackBonus: 3,
        damage: '2d6 + 4',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'Secondary natural weapon (-5 attack penalty, +1/2 STR mod)'
      }
    ]
  },
  {
    id: 'form-dire-wolf-35e',
    name: 'Dire Wolf (3.5e)',
    type: 'Wild Shape',
    edition: '3.5e',
    sizeCategory: 'Large',
    formHpMax: 45,
    formHpCurrent: 45,
    formAc: 14, // 10 + 2 DEX - 1 Size + 3 Natural Armor
    formSpeed: 50,
    formAbilities: { STR: 25, DEX: 15, CON: 17 },
    hasHands: false,
    specialTraits: [
      '3.5e Wild Shape: Retains Master HP & HD',
      'Trip: Successful bite triggers free trip check (+11 modifier) without provoking attack of opportunity',
      'Scent & Low-Light Vision'
    ],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/dire-wolf.jpg',
    notes: 'Large Animal (3.5e). STR 25 (+7), DEX 15 (+2), CON 17 (+3). Primary Bite +11 melee (1d8+10).',
    naturalWeapons: [
      {
        id: 'nw-dw35-bite',
        name: 'Bite (3.5e Dire Wolf)',
        attackBonus: 11,
        damage: '1d8 + 10',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'Triggers free Trip check (+11 check modifier)!'
      }
    ]
  },
  {
    id: 'form-giant-eagle-35e',
    name: 'Giant Eagle (3.5e)',
    type: 'Wild Shape',
    edition: '3.5e',
    sizeCategory: 'Large',
    formHpMax: 26,
    formHpCurrent: 26,
    formAc: 15, // 10 + 3 DEX - 1 Size + 3 Natural Armor
    formSpeed: 80,
    formAbilities: { STR: 18, DEX: 17, CON: 14 },
    hasHands: false,
    specialTraits: ['Fly 80 ft (average)', 'Evasion (30ft range)', 'Low-Light Vision'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-eagle.jpg',
    notes: 'Large Magical Beast (3.5e). STR 18 (+4), DEX 17 (+3), CON 14 (+2). 2 Talons +7, Bite +2.',
    naturalWeapons: [
      {
        id: 'nw-ge35-talons',
        name: '2 Talons (Eagle)',
        attackBonus: 7,
        damage: '1d6 + 4',
        damageType: 'Slashing',
        range: '5 ft Melee'
      },
      {
        id: 'nw-ge35-beak',
        name: 'Bite (Eagle)',
        attackBonus: 2,
        damage: '1d8 + 2',
        damageType: 'Piercing',
        range: '5 ft Melee'
      }
    ]
  },
  {
    id: 'form-fleshraker-35e',
    name: 'Fleshraker Dinosaur (3.5e MM3)',
    type: 'Wild Shape',
    edition: '3.5e',
    sizeCategory: 'Medium',
    formHpMax: 30,
    formHpCurrent: 30,
    formAc: 20, // 10 + 4 DEX + 6 Natural Armor - 3.5e Druid favorite!
    formSpeed: 50,
    formAbilities: { STR: 17, DEX: 19, CON: 15 },
    hasHands: false,
    specialTraits: [
      'Pounce: Full attack on charge',
      'Leaping Pounce: Free trip check if charging',
      'Venomous Tail Spike (DC 14 Fort save or 1d6 DEX damage)',
      'Rake (2 Claw attacks 1d6+3 on grapple)'
    ],
    notes: 'Medium Animal (3.5e MM3). Famous optimal 3.5e Druid Wild Shape form! AC 20, STR 17, DEX 19.',
    naturalWeapons: [
      {
        id: 'nw-fr35-claw',
        name: 'Claws (Fleshraker)',
        attackBonus: 6,
        damage: '1d6 + 3',
        damageType: 'Slashing',
        range: '5 ft Melee',
        notes: 'Primary attack. Applies dexterity-draining poison!'
      },
      {
        id: 'nw-fr35-tail',
        name: 'Tail Spike (Fleshraker)',
        attackBonus: 1,
        damage: '1d8 + 1',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'DC 14 Fort save or 1d6 DEX initial & secondary damage.'
      }
    ]
  },
  {
    id: 'form-cryohydra-35e',
    name: '5-Headed Cryohydra (3.5e Polymorph)',
    type: 'Polymorph',
    edition: '3.5e',
    sizeCategory: 'Huge',
    formHpMax: 52,
    formHpCurrent: 52,
    formAc: 20, // 10 + 1 DEX - 2 Size + 11 Natural Armor
    formSpeed: 20,
    formAbilities: { STR: 21, DEX: 12, CON: 20 },
    hasHands: false,
    specialTraits: [
      '5 Cold Breath Weapons (3d6 Cold each, DC 17 Reflex half)',
      'Fast Healing 15',
      'Immune to Cold',
      'Natural Armor +11'
    ],
    notes: 'Huge Magical Beast (3.5e Polymorph). 5 Heads strike simultaneously with cold breath weapons.',
    naturalWeapons: [
      {
        id: 'nw-ch35-bites',
        name: '5 Head Bites (Cryohydra)',
        attackBonus: 9,
        damage: '1d10 + 5',
        damageType: 'Piercing',
        range: '10 ft Melee',
        notes: 'Can attack with all 5 heads at full attack bonus simultaneously!'
      },
      {
        id: 'nw-ch35-breath',
        name: '5 Cold Breath Streams',
        attackBonus: 0,
        damage: '3d6 per head',
        damageType: 'Cold',
        range: '20 ft Cone',
        notes: '5 separate 3d6 Cold cones (DC 17 Reflex half).'
      }
    ]
  },
  {
    id: 'form-earth-elemental-35e',
    name: 'Earth Elemental (3.5e)',
    type: 'Wild Shape',
    edition: '3.5e',
    sizeCategory: 'Large',
    formHpMax: 68,
    formHpCurrent: 68,
    formAc: 18, // 10 - 1 DEX - 1 Size + 10 Natural Armor
    formSpeed: 30,
    formAbilities: { STR: 25, DEX: 8, CON: 19 },
    hasHands: false,
    specialTraits: [
      'Damage Reduction 5/— (Reduces all weapon damage by 5)',
      'Earth Glide (Burrow through stone/earth)',
      'Elemental Immunities (Immune to critical hits, poison, sleep, paralysis, stunning, flanking)'
    ],
    notes: 'Large Elemental (3.5e Druid Lv 16). DR 5/—, STR 25, 2 Slams +12 (2d8+7).',
    naturalWeapons: [
      {
        id: 'nw-ee35-slam',
        name: '2 Slams (3.5e Earth Fist)',
        attackBonus: 12,
        damage: '2d8 + 7',
        damageType: 'Bludgeoning',
        range: '10 ft Melee'
      }
    ]
  },
  {
    id: 'form-werewolf-hybrid-35e',
    name: 'Werewolf Hybrid (3.5e)',
    type: 'Lycanthropy',
    edition: '3.5e',
    sizeCategory: 'Medium',
    formHpMax: 48,
    formHpCurrent: 48,
    formAc: 16, // 10 + 2 DEX + 2 Natural Armor + Armor
    formSpeed: 30,
    formAbilities: { STR: 15, DEX: 15, CON: 19 },
    hasHands: true,
    specialTraits: [
      'Damage Reduction 10/silver (Ignores 10 damage unless weapon is pure silver)',
      'Curse of Lycanthropy (DC 15 Fort save on bite)',
      'Scent & Low-Light Vision'
    ],
    notes: 'Hybrid Form (3.5e Lycanthropy). DR 10/silver, STR +2, DEX +2, CON +4.',
    naturalWeapons: [
      {
        id: 'nw-ww35-bite',
        name: 'Curse Bite (3.5e Wolf)',
        attackBonus: 4,
        damage: '1d6 + 2',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'DC 15 Fortitude save or contracted with lycanthropy.'
      },
      {
        id: 'nw-ww35-claws',
        name: '2 Claws (Werewolf)',
        attackBonus: 4,
        damage: '1d4 + 2',
        damageType: 'Slashing',
        range: '5 ft Melee'
      }
    ]
  }
];

export function applyTransformation(char: CharacterData, form: TransformationForm): CharacterData {
  // If already transformed, revert first to maintain clean base stats
  const cleanChar = char.activeTransformation ? revertTransformation(char) : char;

  const currentlyEquippedItemIds = (cleanChar.inventory || [])
    .filter(item => item.equipped)
    .map(item => item.id);

  const originalStats = {
    hpMax: cleanChar.hpMax,
    hpCurrent: cleanChar.hpCurrent,
    hpTemp: cleanChar.hpTemp,
    armorClass: cleanChar.armorClass,
    speed: cleanChar.speed,
    sizeCategory: cleanChar.sizeCategory,
    abilities: JSON.parse(JSON.stringify(cleanChar.abilities)),
    attacks: JSON.parse(JSON.stringify(cleanChar.attacks || [])),
    portraitUrl: cleanChar.portraitUrl,
    equippedItemIds: currentlyEquippedItemIds,
  };

  const activeTransformation: ActiveTransformation = {
    form: { ...form, formHpCurrent: form.formHpMax },
    transformedAt: new Date().toISOString(),
    originalStats,
  };

  // Attach form natural weapons to character attack list
  const formNaturalWeapons: Attack[] = form.naturalWeapons.map((nw, idx) => ({
    ...nw,
    id: `nw-${form.id}-${idx}-${Date.now()}`,
    notes: nw.notes ? `${nw.notes} [Natural Weapon]` : '[Natural Weapon]',
  }));

  // Update physical abilities (STR, DEX, CON)
  const updatedAbilities = JSON.parse(JSON.stringify(cleanChar.abilities));
  if (form.formAbilities) {
    if (form.formAbilities.STR !== undefined) updatedAbilities.STR.score = form.formAbilities.STR;
    if (form.formAbilities.DEX !== undefined) updatedAbilities.DEX.score = form.formAbilities.DEX;
    if (form.formAbilities.CON !== undefined) updatedAbilities.CON.score = form.formAbilities.CON;
  }

  // Handle equipment un-equipping if form lacks hands
  let updatedInventory = cleanChar.inventory || [];
  if (form.hasHands === false) {
    updatedInventory = updatedInventory.map(item => ({
      ...item,
      equipped: false,
    }));
  }

  // Add Transformed status condition badge
  const currentConds = cleanChar.conditions || [];
  const transformCondName = `Transformed: ${form.name}`;
  const updatedConds = Array.from(
    new Set([...currentConds.filter(c => !c.startsWith('Transformed:')), transformCondName])
  );

  // Construct form features and feats from specialTraits
  const formClassFeatures: ClassFeature[] = (form.specialTraits || []).map((traitStr, idx) => {
    const splitIndex = traitStr.indexOf('(');
    const traitName = splitIndex > 0 ? traitStr.substring(0, splitIndex).trim() : traitStr;
    const traitDesc = splitIndex > 0 ? traitStr.substring(splitIndex + 1, traitStr.length - (traitStr.endsWith(')') ? 1 : 0)).trim() : traitStr;
    return {
      id: `form-cf-${form.id}-${idx}`,
      name: `${traitName} (${form.name})`,
      source: `Form: ${form.name}`,
      description: traitDesc || traitStr,
    };
  });

  const formFeats: Feat[] = (form.specialTraits || []).map((traitStr, idx) => {
    const splitIndex = traitStr.indexOf('(');
    const traitName = splitIndex > 0 ? traitStr.substring(0, splitIndex).trim() : traitStr;
    const traitDesc = splitIndex > 0 ? traitStr.substring(splitIndex + 1, traitStr.length - (traitStr.endsWith(')') ? 1 : 0)).trim() : traitStr;
    return {
      id: `form-feat-${form.id}-${idx}`,
      name: `${traitName} (${form.name})`,
      source: `Form: ${form.name}`,
      description: traitDesc || traitStr,
    };
  });

  // Filter existing form features/feats
  const baseClassFeatures = (cleanChar.classFeatures || []).filter(
    f => !f.source || (!f.source.startsWith('Form:') && !f.source.startsWith('Wild Shape:') && !f.source.startsWith('Transformation:'))
  );
  const baseFeats = (cleanChar.feats || []).filter(
    f => !f.source || (!f.source.startsWith('Form:') && !f.source.startsWith('Wild Shape:') && !f.source.startsWith('Transformation:'))
  );

  const is35e = cleanChar.edition === '3.5e';
  const finalHpMax = is35e ? originalStats.hpMax : form.formHpMax;
  const finalHpCurrent = is35e
    ? Math.min(originalStats.hpMax, originalStats.hpCurrent + Math.max(1, cleanChar.level || 1))
    : form.formHpMax;

  return {
    ...cleanChar,
    activeTransformation,
    hpMax: finalHpMax,
    hpCurrent: finalHpCurrent,
    armorClass: form.formAc,
    speed: form.formSpeed,
    sizeCategory: form.sizeCategory || cleanChar.sizeCategory,
    abilities: updatedAbilities,
    inventory: updatedInventory,
    attacks: [...formNaturalWeapons, ...(cleanChar.attacks || [])],
    classFeatures: [...baseClassFeatures, ...formClassFeatures],
    feats: [...baseFeats, ...formFeats],
    conditions: updatedConds,
    portraitUrl: form.portraitUrl || cleanChar.portraitUrl,
  };
}

export function updateActiveTransformation(char: CharacterData, updatedForm: TransformationForm): CharacterData {
  if (!char.activeTransformation) {
    return applyTransformation(char, updatedForm);
  }

  const activeTransformation: ActiveTransformation = {
    ...char.activeTransformation,
    form: updatedForm,
  };

  // Keep non-natural weapon attacks
  const nonNaturalAttacks = (char.attacks || []).filter(
    atk => !(atk.notes && atk.notes.includes('[Natural Weapon]'))
  );

  // Attach updated form natural weapons
  const formNaturalWeapons: Attack[] = updatedForm.naturalWeapons.map((nw, idx) => ({
    ...nw,
    id: nw.id || `nw-${updatedForm.id}-${idx}-${Date.now()}`,
    notes: nw.notes ? (nw.notes.includes('[Natural Weapon]') ? nw.notes : `${nw.notes} [Natural Weapon]`) : '[Natural Weapon]',
  }));

  // Update physical abilities (STR, DEX, CON)
  const updatedAbilities = JSON.parse(JSON.stringify(char.abilities));
  if (updatedForm.formAbilities) {
    if (updatedForm.formAbilities.STR !== undefined) updatedAbilities.STR.score = updatedForm.formAbilities.STR;
    if (updatedForm.formAbilities.DEX !== undefined) updatedAbilities.DEX.score = updatedForm.formAbilities.DEX;
    if (updatedForm.formAbilities.CON !== undefined) updatedAbilities.CON.score = updatedForm.formAbilities.CON;
  }

  // Handle inventory equipment un-equipping/re-equipping
  let updatedInventory = char.inventory || [];
  if (updatedForm.hasHands === false) {
    updatedInventory = updatedInventory.map(item => ({
      ...item,
      equipped: false,
    }));
  } else if (updatedForm.hasHands === true && char.activeTransformation.originalStats.equippedItemIds) {
    const savedEquippedIds = new Set(char.activeTransformation.originalStats.equippedItemIds);
    updatedInventory = updatedInventory.map(item => ({
      ...item,
      equipped: savedEquippedIds.has(item.id),
    }));
  }

  return {
    ...char,
    activeTransformation,
    hpMax: updatedForm.formHpMax,
    hpCurrent: Math.min(char.hpCurrent, updatedForm.formHpMax),
    armorClass: updatedForm.formAc,
    speed: updatedForm.formSpeed,
    sizeCategory: updatedForm.sizeCategory || char.sizeCategory,
    abilities: updatedAbilities,
    inventory: updatedInventory,
    attacks: [...formNaturalWeapons, ...nonNaturalAttacks],
  };
}

export function revertTransformation(char: CharacterData): CharacterData {
  if (!char.activeTransformation) return char;

  const { originalStats } = char.activeTransformation;

  // Carryover damage calculation if form HP dropped below 0
  const excessDamage = char.hpCurrent < 0 ? Math.abs(char.hpCurrent) : 0;
  let restoredHpCurrent = originalStats.hpCurrent;
  if (char.hpCurrent <= 0) {
    restoredHpCurrent = Math.max(0, originalStats.hpCurrent - excessDamage);
  }

  // Restore inventory equipment status
  let restoredInventory = char.inventory || [];
  if (originalStats.equippedItemIds && originalStats.equippedItemIds.length > 0) {
    const savedIds = new Set(originalStats.equippedItemIds);
    restoredInventory = restoredInventory.map(item => ({
      ...item,
      equipped: savedIds.has(item.id),
    }));
  }

  // Remove natural weapons
  const cleanedAttacks = (char.attacks || []).filter(
    atk => !(atk.notes && atk.notes.includes('[Natural Weapon]'))
  );

  // Remove form features and feats
  const cleanedClassFeatures = (char.classFeatures || []).filter(
    f => !f.source || (!f.source.startsWith('Form:') && !f.source.startsWith('Wild Shape:') && !f.source.startsWith('Transformation:'))
  );
  const cleanedFeats = (char.feats || []).filter(
    f => !f.source || (!f.source.startsWith('Form:') && !f.source.startsWith('Wild Shape:') && !f.source.startsWith('Transformation:'))
  );

  // Remove transformation condition
  const cleanedConds = (char.conditions || []).filter(c => !c.startsWith('Transformed:'));

  return {
    ...char,
    activeTransformation: undefined,
    hpMax: originalStats.hpMax,
    hpCurrent: restoredHpCurrent,
    hpTemp: originalStats.hpTemp,
    armorClass: originalStats.armorClass,
    speed: originalStats.speed,
    sizeCategory: originalStats.sizeCategory,
    abilities: originalStats.abilities,
    inventory: restoredInventory,
    attacks: originalStats.attacks.length > 0 ? originalStats.attacks : cleanedAttacks,
    classFeatures: cleanedClassFeatures,
    feats: cleanedFeats,
    conditions: cleanedConds,
    portraitUrl: originalStats.portraitUrl,
  };
}
