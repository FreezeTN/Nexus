import { TransformationForm, CharacterData, ActiveTransformation, Attack, ClassFeature, Feat } from '../types';

export const PRESET_TRANSFORMATION_FORMS: TransformationForm[] = [
  {
    id: 'form-brown-bear',
    name: 'Brown Bear',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 34,
    formHpCurrent: 34,
    formAc: 11,
    formSpeed: 40,
    formAbilities: { STR: 19, DEX: 10, CON: 16 },
    hasHands: false,
    specialTraits: ['Keen Smell (Advantage on Wisdom Perception checks involving smell)', 'Multiattack (Bite + Claws)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/brown-bear.jpg',
    notes: 'CR 1 Beast. Powerful physical frontline tank form with multiattack.',
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
    id: 'form-dire-wolf',
    name: 'Dire Wolf',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 37,
    formHpCurrent: 37,
    formAc: 14,
    formSpeed: 50,
    formAbilities: { STR: 17, DEX: 15, CON: 15 },
    hasHands: false,
    specialTraits: ['Keen Hearing and Smell', 'Pack Tactics (Advantage on attack rolls if an ally is within 5 ft)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/dire-wolf.jpg',
    notes: 'CR 1 Beast. High speed with trip bite mechanics.',
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
    id: 'form-giant-spider',
    name: 'Giant Spider',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 26,
    formHpCurrent: 26,
    formAc: 14,
    formSpeed: 30,
    formAbilities: { STR: 14, DEX: 16, CON: 12 },
    hasHands: false,
    specialTraits: ['Spider Climb (Climb difficult surfaces without checks)', 'Web Sense', 'Web Walker'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-spider.jpg',
    notes: 'CR 1 Beast. Poison bite & ranged Web control.',
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
    id: 'form-giant-eagle',
    name: 'Giant Eagle',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 26,
    formHpCurrent: 26,
    formAc: 13,
    formSpeed: 80,
    formAbilities: { STR: 16, DEX: 17, CON: 13 },
    hasHands: false,
    specialTraits: ['Keen Sight (Advantage on Perception checks involving sight)', 'Fly Speed 80 ft'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-eagle.jpg',
    notes: 'CR 1 Beast. Sky scout & aerial mobility predator.',
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
    id: 'form-panther',
    name: 'Panther / Tiger',
    type: 'Wild Shape',
    sizeCategory: 'Medium',
    formHpMax: 13,
    formHpCurrent: 13,
    formAc: 12,
    formSpeed: 50,
    formAbilities: { STR: 14, DEX: 15, CON: 10 },
    hasHands: false,
    specialTraits: ['Keen Smell', 'Pounce (If moving 20ft straight toward target, DC 12 STR save or knocked Prone)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/panther.jpg',
    notes: 'CR 1/4 Beast. Stealthy feline form.',
    naturalWeapons: [
      {
        id: 'nw-pan-bite',
        name: 'Bite (Panther)',
        attackBonus: 4,
        damage: '1d6 + 2',
        damageType: 'Piercing',
        range: '5 ft Melee'
      },
      {
        id: 'nw-pan-claws',
        name: 'Claws (Panther)',
        attackBonus: 4,
        damage: '1d4 + 2',
        damageType: 'Slashing',
        range: '5 ft Melee',
        notes: 'If target is Prone, panther can make a bonus action Bite attack!'
      }
    ]
  },
  {
    id: 'form-giant-constrictor',
    name: 'Giant Constrictor Snake',
    type: 'Wild Shape',
    sizeCategory: 'Huge',
    formHpMax: 60,
    formHpCurrent: 60,
    formAc: 12,
    formSpeed: 30,
    formAbilities: { STR: 19, DEX: 14, CON: 12 },
    hasHands: false,
    specialTraits: ['Blindsight 10 ft', 'Swim Speed 30 ft'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/beasts/giant-constrictor-snake.jpg',
    notes: 'CR 2 Beast. Massive grappling & crushing force.',
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
    id: 'form-earth-elemental',
    name: 'Earth Elemental',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 126,
    formHpCurrent: 126,
    formAc: 17,
    formSpeed: 30,
    formAbilities: { STR: 20, DEX: 8, CON: 20 },
    hasHands: false,
    specialTraits: ['Earth Glide (Burrow through unworked earth/stone without disturbing material)', 'Siege Monster (Double damage to objects)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/monsters/earth-elemental.jpg',
    notes: 'CR 5 Elemental Form (Moon Druid Level 10). Ultimate siege tank.',
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
    id: 'form-fire-elemental',
    name: 'Fire Elemental',
    type: 'Wild Shape',
    sizeCategory: 'Large',
    formHpMax: 102,
    formHpCurrent: 102,
    formAc: 13,
    formSpeed: 50,
    formAbilities: { STR: 10, DEX: 17, CON: 16 },
    hasHands: false,
    specialTraits: ['Fire Form (Can move through 1-inch space; entering creature takes 1d10 Fire)', 'Illumination (30ft bright light)'],
    portraitUrl: 'https://raw.githubusercontent.com/5e-bits/5e-srd-plus/master/monsters/fire-elemental.jpg',
    notes: 'CR 5 Elemental Form. Scorching area control.',
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
    id: 'form-werewolf-hybrid',
    name: 'Werewolf (Hybrid Form)',
    type: 'Lycanthropy',
    sizeCategory: 'Medium',
    formHpMax: 58,
    formHpCurrent: 58,
    formAc: 12,
    formSpeed: 30,
    formAbilities: { STR: 15, DEX: 13, CON: 14 },
    hasHands: true,
    specialTraits: ['Keen Hearing and Smell', 'Damage Immunity: Nonmagical, non-silvered weapon attacks'],
    notes: 'Lycanthropy Hybrid Form. Gains silver vulnerability/immunity & curse bite.',
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
    id: 'form-trex',
    name: 'Tyrannosaurus Rex',
    type: 'Polymorph',
    sizeCategory: 'Huge',
    formHpMax: 136,
    formHpCurrent: 136,
    formAc: 13,
    formSpeed: 50,
    formAbilities: { STR: 25, DEX: 10, CON: 19 },
    hasHands: false,
    specialTraits: ['Multiattack (Bite + Tail)', 'Huge Apex Predator'],
    notes: 'CR 8 Beast Form (Polymorph / Shapechange). Devastating single-target jaws.',
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

  return {
    ...cleanChar,
    activeTransformation,
    hpMax: form.formHpMax,
    hpCurrent: form.formHpMax,
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
