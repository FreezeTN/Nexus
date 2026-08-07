import { ClassFeature, RuleEdition } from '../types';

export interface ClassicSRDHalfBreed {
  id: string;
  name: string;
  edition: '5e' | '3.5e';
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  flySpeed?: number;
  hasDarkvision: boolean;
  hasLowLightVision?: boolean;
  statBonusText: string;
  source: string;
  description: string;
  traits: {
    name: string;
    description: string;
  }[];
}

export const CLASSIC_SRD_HALF_BREEDS: ClassicSRDHalfBreed[] = [
  // ---------------- D&D 5E SRD HALF-BREEDS ----------------
  {
    id: 'srd-5e-half-elf',
    name: 'Half-Elf (5e SRD)',
    edition: '5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    statBonusText: '+2 Charisma, +1 to two other ability scores of your choice',
    source: '5e System Reference Document (SRD)',
    description: 'Half-elves combine what some say are the best qualities of their elf and human parents: human curiosity, inventiveness, and ambition tempered by the refined senses, love of nature, and artistic tastes of the elves.',
    traits: [
      {
        name: 'Darkvision (60 ft)',
        description: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.'
      },
      {
        name: 'Fey Ancestry',
        description: 'You have advantage on saving throws against being charmed, and magic cannot put you to sleep.'
      },
      {
        name: 'Skill Versatility',
        description: 'You gain proficiency in two skills of your choice.'
      },
      {
        name: 'Languages',
        description: 'You can speak, read, and write Common, Elvish, and one extra language of your choice.'
      }
    ]
  },
  {
    id: 'srd-5e-half-orc',
    name: 'Half-Orc (5e SRD)',
    edition: '5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    statBonusText: '+2 Strength, +1 Constitution',
    source: '5e System Reference Document (SRD)',
    description: 'Half-orcs’ greyish pigmentation, sloping foreheads, jutting jaws, prominent teeth, and towering builds make their orcish heritage plain for all to see. Half-orcs combine human adaptability with savage tenacity.',
    traits: [
      {
        name: 'Darkvision (60 ft)',
        description: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.'
      },
      {
        name: 'Menacing',
        description: 'You gain proficiency in the Intimidation skill.'
      },
      {
        name: 'Relentless Endurance',
        description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead (once per long rest).'
      },
      {
        name: 'Savage Attacks',
        description: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon’s damage dice one additional time and add it to the extra damage.'
      },
      {
        name: 'Languages',
        description: 'You can speak, read, and write Common and Orc.'
      }
    ]
  },
  {
    id: 'srd-5e-half-dragon',
    name: 'Half-Dragon (5e SRD)',
    edition: '5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    statBonusText: 'Inherits draconic resistances and elemental breath weapon from dragon lineage',
    source: '5e System Reference Document (SRD)',
    description: 'A creature created when a dragon in humanoid form mates with another creature, or through magical ritual. Possesses dragon scales, slitted eyes, and elemental breath weapon.',
    traits: [
      {
        name: 'Blindsight (10 ft) & Darkvision (60 ft)',
        description: 'You have blindsight out to a distance of 10 feet and darkvision out to a distance of 60 feet.'
      },
      {
        name: 'Draconic Damage Resistance',
        description: 'You have resistance to the damage type associated with your dragon ancestor (Acid, Cold, Fire, Lightning, or Poison).'
      },
      {
        name: 'Draconic Breath Weapon',
        description: 'Exhale destructive elemental energy (15 ft cone or 30 ft line, DC 8 + CON mod + prof bonus, 2d6 damage at level 1, scaling with level).'
      },
      {
        name: 'Languages',
        description: 'You can speak, read, and write Common and Draconic.'
      }
    ]
  },
  {
    id: 'srd-5e-half-red-dragon-veteran',
    name: 'Half-Red Dragon Veteran (5e SRD)',
    edition: '5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    statBonusText: '+2 Strength, +1 Constitution (Red Dragon Martial Lineage)',
    source: '5e System Reference Document (SRD)',
    description: 'A battle-hardened warrior infused with the terrifying flame of a red dragon, wielding martial superiority and incendiary breath.',
    traits: [
      {
        name: 'Fire Resistance',
        description: 'You take half damage from fire.'
      },
      {
        name: 'Fire Breath Weapon (15 ft Cone)',
        description: 'Exhale fire in a 15-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 7d6 fire damage on a failed save, or half as much damage on a successful one (Recharge 5–6).'
      },
      {
        name: 'Blindsight & Darkvision',
        description: 'Blindsight 10 ft, Darkvision 60 ft.'
      }
    ]
  },
  {
    id: 'srd-5e-halfling',
    name: 'Halfling (5e SRD)',
    edition: '5e',
    size: 'Small',
    speed: 25,
    hasDarkvision: false,
    statBonusText: '+2 Dexterity',
    source: '5e System Reference Document (SRD)',
    description: 'The diminutive halflings survive in a world full of larger creatures by avoiding notice or, barring that, avoiding offense.',
    traits: [
      {
        name: 'Lucky',
        description: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.'
      },
      {
        name: 'Brave',
        description: 'You have advantage on saving throws against being frightened.'
      },
      {
        name: 'Halfling Nimbleness',
        description: 'You can move through the space of any creature that is of a size larger than yours.'
      },
      {
        name: 'Languages',
        description: 'You can speak, read, and write Common and Halfling.'
      }
    ]
  },

  // ---------------- D&D 3.5E SRD HALF-BREEDS ----------------
  {
    id: 'srd-35e-half-elf',
    name: 'Half-Elf (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    hasLowLightVision: true,
    statBonusText: 'No net ability score adjustments (Human/Elf balanced)',
    source: '3.5e System Reference Document (SRD)',
    description: 'To humans, half-elves look like elves. To elves, they look like humans. Half-elves combine curiosity and ambition with elven grace and senses.',
    traits: [
      {
        name: 'Low-Light Vision',
        description: 'A half-elf can see twice as far as a human in starlight, moonlight, torchlight, and similar conditions of poor illumination.'
      },
      {
        name: 'Elven Immunities',
        description: 'Immunity to sleep spells and similar magical effects, and a +2 racial bonus on saving throws against enchantment spells or effects.'
      },
      {
        name: 'Keen Senses & Diplomacy',
        description: '+1 racial bonus on Listen, Search, and Spot checks. +2 racial bonus on Diplomacy and Gather Information checks.'
      },
      {
        name: 'Elven Blood',
        description: 'For all effects related to race, a half-elf is considered an elf.'
      }
    ]
  },
  {
    id: 'srd-35e-half-orc',
    name: 'Half-Orc (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    statBonusText: '+2 Strength, -2 Intelligence, -2 Charisma',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-orcs are as tall as humans and heavier. Their skin is greyish and they possess prominent lower canine tusk teeth.',
    traits: [
      {
        name: 'Darkvision (60 ft)',
        description: 'A half-orc can see in the dark up to 60 feet in black and white.'
      },
      {
        name: 'Orc Blood',
        description: 'For all effects related to race, a half-orc is considered an orc.'
      }
    ]
  },
  {
    id: 'srd-35e-half-ogre',
    name: 'Half-Ogre (3.5e SRD)',
    edition: '3.5e',
    size: 'Large',
    speed: 30,
    hasDarkvision: true,
    statBonusText: '+6 Strength, -2 Dexterity, +2 Constitution, -2 Intelligence, -2 Charisma',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-ogres inherit towering strength and brutal durability from their ogre progenitors alongside human versatility.',
    traits: [
      {
        name: 'Large Size',
        description: 'Large size category (-1 penalty to Armor Class, -1 penalty on attack rolls, +4 bonus on grapple checks, 10 ft space / 10 ft reach).'
      },
      {
        name: 'Natural Armor (+4 AC)',
        description: 'A half-ogre gains a +4 natural armor bonus to Armor Class.'
      },
      {
        name: 'Darkvision (60 ft) & Giant Blood',
        description: 'Darkvision 60 ft. Considered a Giant for all race-related special effects and magic.'
      }
    ]
  },
  {
    id: 'srd-35e-half-giant',
    name: 'Half-Giant (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    hasLowLightVision: true,
    statBonusText: '+2 Strength, +2 Constitution, -2 Dexterity',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-giants are imposing humanoid figures standing over 7 to 8 feet tall, possessing immense physical stamina and giant ancestry.',
    traits: [
      {
        name: 'Powerful Build',
        description: 'The physical stature of half-giants lets them function as if they were one size larger (Large) whenever advantageous (e.g. wielding Large weapons without penalty, +4 grapple/bull rush).'
      },
      {
        name: 'Fire Resistance 5',
        description: 'Half-giants possess a natural resistance to fire damage, absorbing 5 points of fire damage from any attack.'
      },
      {
        name: 'Low-Light Vision & Giant Blood',
        description: 'Low-light vision. Counted as Giant type for racial magic and effects.'
      }
    ]
  },
  {
    id: 'srd-35e-half-dragon',
    name: 'Half-Dragon (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    hasLowLightVision: true,
    statBonusText: '+8 Strength, +2 Constitution, +2 Intelligence, +2 Charisma',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-dragons always have scales, elongated features, and eyes matching their draconic parent, wielding terrifying elemental breath.',
    traits: [
      {
        name: 'Draconic Breath Weapon (6d8)',
        description: 'Once per day, exhale a line or cone of elemental energy (Fire, Cold, Lightning, Acid, or Poison) dealing 6d8 damage (Reflex save DC 10 + 1/2 HD + CON mod for half).'
      },
      {
        name: 'Draconic Immunities & Natural Armor',
        description: 'Immune to sleep, paralysis, and energy damage matching dragon ancestor. +4 Natural Armor bonus to AC.'
      },
      {
        name: 'Darkvision (60 ft) & Low-Light Vision',
        description: 'Possesses both 60 ft Darkvision and Low-Light vision.'
      }
    ]
  },
  {
    id: 'srd-35e-half-celestial',
    name: 'Half-Celestial (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    flySpeed: 60,
    hasDarkvision: true,
    statBonusText: '+4 Strength, +2 Dexterity, +4 Constitution, +2 Intelligence, +4 Wisdom, +4 Charisma',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-celestials always inherit radiant, beautiful features and feathered angel wings from their celestial lineage.',
    traits: [
      {
        name: 'Celestial Wings & Flight (60 ft)',
        description: 'Feathered celestial wings grant a fly speed of 60 feet with good maneuverability.'
      },
      {
        name: 'Holy Defenses & Resistances',
        description: '+1 Natural Armor bonus. Resistance 10 against Acid, Cold, and Electricity damage. Spell Resistance equal to HD + 10.'
      },
      {
        name: 'Smite Evil & Daylight',
        description: 'Once per day, add Charisma modifier to attack and deal +1 damage per character level against evil targets. Cast Daylight spell at will.'
      }
    ]
  },
  {
    id: 'srd-35e-half-fiend',
    name: 'Half-Fiend (3.5e SRD)',
    edition: '3.5e',
    size: 'Medium',
    speed: 30,
    flySpeed: 30,
    hasDarkvision: true,
    statBonusText: '+4 Strength, +4 Dexterity, +2 Constitution, +4 Intelligence, +2 Charisma',
    source: '3.5e System Reference Document (SRD)',
    description: 'Half-fiends inherit menacing features such as bat wings, fangs, claws, and smoldering infernal energy from their fiendish heritage.',
    traits: [
      {
        name: 'Bat Wings & Natural Weapons',
        description: 'Bat-like wings grant fly speed 30 ft (average). Possess 2 Natural Claw attacks (1d4 damage) and 1 Bite attack (1d6 damage).'
      },
      {
        name: 'Infernal Immunities & Resistances',
        description: 'Immunity to Poison. Resistance 10 against Acid, Cold, Electricity, and Fire damage. Spell Resistance equal to HD + 10. +1 Natural Armor.'
      },
      {
        name: 'Smite Good',
        description: 'Once per day, add Charisma modifier to attack roll and deal +1 damage per character level against good targets.'
      }
    ]
  },
  {
    id: 'srd-35e-halfling-lightfoot',
    name: 'Halfling - Lightfoot (3.5e SRD)',
    edition: '3.5e',
    size: 'Small',
    speed: 20,
    hasDarkvision: false,
    statBonusText: '+2 Dexterity, -2 Strength',
    source: '3.5e System Reference Document (SRD)',
    description: 'Lightfoot halflings are quick and athletic, favoring agility over brute force.',
    traits: [
      {
        name: 'Halfling Luck & Bravery',
        description: '+1 racial bonus on all saving throws. +2 morale bonus on saving throws against fear.'
      },
      {
        name: 'Thrown Weapon & Sling Master',
        description: '+1 racial bonus on attack rolls with thrown weapons and slings.'
      },
      {
        name: 'Keen Senses',
        description: '+2 racial bonus on Climb, Jump, Listen, and Move Silently checks.'
      }
    ]
  },
  {
    id: 'srd-35e-halfling-deep',
    name: 'Halfling - Deep (3.5e SRD)',
    edition: '3.5e',
    size: 'Small',
    speed: 20,
    hasDarkvision: true,
    statBonusText: '+2 Dexterity, -2 Strength',
    source: '3.5e System Reference Document (SRD)',
    description: 'Deep halflings live underground and share bloodlines with dwarves, possessing darkvision and keen instincts for stonework.',
    traits: [
      {
        name: 'Darkvision (60 ft)',
        description: 'Can see in dark up to 60 feet in black and white.'
      },
      {
        name: 'Stonecunning',
        description: '+2 racial bonus on notice checks for unusual stonework, sliding walls, stone traps, and dangerous masonry.'
      },
      {
        name: 'Appraise & Craft (Stone/Metal)',
        description: '+2 racial bonus on Appraise and Craft checks related to stone or metal items.'
      }
    ]
  },
  {
    id: 'srd-35e-halfling-tallfellow',
    name: 'Halfling - Tallfellow (3.5e SRD)',
    edition: '3.5e',
    size: 'Small',
    speed: 20,
    hasDarkvision: false,
    hasLowLightVision: true,
    statBonusText: '+2 Dexterity, -2 Strength',
    source: '3.5e System Reference Document (SRD)',
    description: 'Tallfellow halflings are somewhat taller and slimmer than lightfoots, tracing elven blood in their ancestry.',
    traits: [
      {
        name: 'Low-Light Vision',
        description: 'Can see twice as far as a human in starlight, moonlight, or torchlight.'
      },
      {
        name: 'Elven Heritage Senses',
        description: '+2 racial bonus on Search, Spot, and Listen checks. Passing within 5 feet of a secret or concealed door entitles a Search check as if actively searching.'
      }
    ]
  }
];

export interface DragonVarietyDetails {
  variety: string;
  breathWeapon: string;
  immunityOrResistance: string;
}

export const DRAGON_VARIETIES_35E: DragonVarietyDetails[] = [
  { variety: 'Black', breathWeapon: '60-foot line of acid', immunityOrResistance: 'Acid Immunity' },
  { variety: 'Blue', breathWeapon: '60-foot line of lightning', immunityOrResistance: 'Electricity Immunity' },
  { variety: 'Green', breathWeapon: '30-foot cone of corrosive acid gas', immunityOrResistance: 'Acid Immunity' },
  { variety: 'Red', breathWeapon: '30-foot cone of fire', immunityOrResistance: 'Fire Immunity' },
  { variety: 'White', breathWeapon: '30-foot cone of cold', immunityOrResistance: 'Cold Immunity' },
  { variety: 'Brass', breathWeapon: '60-foot line of fire', immunityOrResistance: 'Fire Immunity' },
  { variety: 'Bronze', breathWeapon: '60-foot line of lightning', immunityOrResistance: 'Electricity Immunity' },
  { variety: 'Copper', breathWeapon: '60-foot line of acid', immunityOrResistance: 'Acid Immunity' },
  { variety: 'Gold', breathWeapon: '30-foot cone of fire', immunityOrResistance: 'Fire Immunity' },
  { variety: 'Silver', breathWeapon: '30-foot cone of cold', immunityOrResistance: 'Cold Immunity' },
];

export const DRAGON_VARIETIES_5E: DragonVarietyDetails[] = [
  { variety: 'Black', breathWeapon: '5 x 30 ft. line of acid (DEX save)', immunityOrResistance: 'Acid Resistance' },
  { variety: 'Blue', breathWeapon: '5 x 30 ft. line of lightning (DEX save)', immunityOrResistance: 'Lightning Resistance' },
  { variety: 'Brass', breathWeapon: '5 x 30 ft. line of fire (DEX save)', immunityOrResistance: 'Fire Resistance' },
  { variety: 'Bronze', breathWeapon: '5 x 30 ft. line of lightning (DEX save)', immunityOrResistance: 'Lightning Resistance' },
  { variety: 'Copper', breathWeapon: '5 x 30 ft. line of acid (DEX save)', immunityOrResistance: 'Acid Resistance' },
  { variety: 'Gold', breathWeapon: '15 ft. cone of fire (DEX save)', immunityOrResistance: 'Fire Resistance' },
  { variety: 'Green', breathWeapon: '15 ft. cone of poison gas (CON save)', immunityOrResistance: 'Poison Resistance' },
  { variety: 'Red', breathWeapon: '15 ft. cone of fire (DEX save)', immunityOrResistance: 'Fire Resistance' },
  { variety: 'Silver', breathWeapon: '15 ft. cone of cold (CON save)', immunityOrResistance: 'Cold Resistance' },
  { variety: 'White', breathWeapon: '15 ft. cone of cold (CON save)', immunityOrResistance: 'Cold Resistance' },
];

export function getClassicSRDHalfBreedsForEdition(edition: RuleEdition): ClassicSRDHalfBreed[] {
  if (edition === '3.5e') {
    return CLASSIC_SRD_HALF_BREEDS.filter(hb => hb.edition === '3.5e');
  }
  // Default to 5e for 5e and other systems
  return CLASSIC_SRD_HALF_BREEDS.filter(hb => hb.edition === '5e');
}

export function buildClassicSRDFeature(srdHB: ClassicSRDHalfBreed, dragonVariety?: string): ClassFeature {
  let displayName = srdHB.name;
  let traits = [...srdHB.traits];

  if (srdHB.id.includes('half-dragon')) {
    const dv = dragonVariety || 'Red';
    if (srdHB.edition === '3.5e') {
      displayName = `Half-${dv} Dragon (3.5e SRD)`;
      const varData = DRAGON_VARIETIES_35E.find(v => v.variety.toLowerCase() === dv.toLowerCase()) || DRAGON_VARIETIES_35E[3];
      traits = [
        {
          name: `Breath Weapon (6d8 - ${dv} Dragon)`,
          description: `Once per day, exhale a ${varData.breathWeapon} dealing 6d8 damage (Reflex save DC 10 + 1/2 HD + CON mod for half).`
        },
        {
          name: `Draconic Immunities (${varData.immunityOrResistance}) & Natural Armor`,
          description: `Immune to sleep, paralysis, and ${varData.immunityOrResistance}. +4 Natural Armor bonus to AC.`
        },
        {
          name: 'Natural Weapons (Bite & Claws)',
          description: 'Gains natural attacks: Bite (1d6 damage) and 2 Claws (1d4 damage) for Medium size.'
        },
        {
          name: 'Darkvision (60 ft) & Low-Light Vision',
          description: 'Possesses both 60 ft Darkvision and Low-Light vision.'
        }
      ];
    } else {
      displayName = `Half-${dv} Dragon (5e SRD)`;
      const varData = DRAGON_VARIETIES_5E.find(v => v.variety.toLowerCase() === dv.toLowerCase()) || DRAGON_VARIETIES_5E[7];
      traits = [
        {
          name: `Draconic Damage Resistance (${varData.immunityOrResistance})`,
          description: `You have ${varData.immunityOrResistance}.`
        },
        {
          name: `Draconic Breath Weapon (${dv} Dragon)`,
          description: `Exhale destructive energy in a ${varData.breathWeapon}.`
        },
        {
          name: 'Blindsight (10 ft) & Darkvision (60 ft)',
          description: 'You have blindsight out to 10 feet and darkvision out to 60 feet.'
        }
      ];
    }
  }

  const traitListStr = traits.map(t => `• ${t.name}: ${t.description}`).join('\n');
  return {
    id: `feat-srd-halfbreed-${srdHB.id}`,
    name: `SRD Half-Breed Traits: ${displayName}`,
    source: srdHB.source,
    description: `[SRD Race: ${displayName} | Size: ${srdHB.size} | Speed: ${srdHB.speed}ft ${srdHB.flySpeed ? `(Fly ${srdHB.flySpeed}ft)` : ''} | Vision: ${srdHB.hasDarkvision ? 'Darkvision 60ft' : srdHB.hasLowLightVision ? 'Low-Light Vision' : 'Normal'}]\nStat Adjustments: ${srdHB.statBonusText}\n\nRacial Traits:\n${traitListStr}`
  };
}

export interface ParentRaceData {
  id: string;
  name: string;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  hasDarkvision: boolean;
  primaryTraitName: string;
  primaryTraitDesc: string;
  secondaryTraitName: string;
  secondaryTraitDesc: string;
  skillBonus?: string;
  statBonusHint?: string;
}

export const PARENT_RACE_CATALOG: ParentRaceData[] = [
  {
    id: 'human',
    name: 'Human',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    primaryTraitName: 'Versatile Determination',
    primaryTraitDesc: 'When you make an attack roll, ability check, or saving throw, you can add +1 to the roll after seeing the d20 result (once per short rest).',
    secondaryTraitName: 'Human Adaptability',
    secondaryTraitDesc: 'You gain proficiency in one skill of your choice.',
    skillBonus: 'Choice of 1 Skill Proficiency',
    statBonusHint: '+1 to any Ability Score'
  },
  {
    id: 'elf',
    name: 'Elf',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Fey Ancestry & Trance',
    primaryTraitDesc: 'You have advantage on saving throws against being charmed, and magic can’t put you to sleep. You don’t need to sleep; you meditate deeply for 4 hours instead.',
    secondaryTraitName: 'Keen Senses',
    secondaryTraitDesc: 'You gain proficiency in the Perception skill and gain Darkvision 60ft.',
    skillBonus: 'Perception Skill Proficiency',
    statBonusHint: '+2 Dexterity or +1 Wisdom'
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    size: 'Medium',
    speed: 25,
    hasDarkvision: true,
    primaryTraitName: 'Dwarven Resilience & Stonecunning',
    primaryTraitDesc: 'You have advantage on saving throws against poison and resistance against poison damage. You add double proficiency to History checks related to stonework.',
    secondaryTraitName: 'Dwarven Toughness',
    secondaryTraitDesc: 'Your HP maximum increases by 1, and it increases by 1 every time you gain a level.',
    skillBonus: 'History (Stonework) Double Proficiency',
    statBonusHint: '+2 Constitution'
  },
  {
    id: 'halfling',
    name: 'Halfling',
    size: 'Small',
    speed: 25,
    hasDarkvision: false,
    primaryTraitName: 'Lucky & Halfling Nimbleness',
    primaryTraitDesc: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll. You can move through the space of any creature larger than you.',
    secondaryTraitName: 'Brave Heritage',
    secondaryTraitDesc: 'You have advantage on saving throws against being frightened.',
    skillBonus: 'Nimble Evasion',
    statBonusHint: '+2 Dexterity'
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    primaryTraitName: 'Draconic Breath Weapon',
    primaryTraitDesc: 'You can use your action to exhale destructive energy (15ft cone or 30ft line) dealing 2d6 elemental damage (Fire, Cold, Lightning, Acid, or Poison; DC = 8 + CON + Prof).',
    secondaryTraitName: 'Draconic Damage Resistance',
    secondaryTraitDesc: 'You have resistance to the damage type associated with your draconic ancestry.',
    skillBonus: 'Draconic Intimidation',
    statBonusHint: '+2 Strength, +1 Charisma'
  },
  {
    id: 'gnome',
    name: 'Gnome',
    size: 'Small',
    speed: 25,
    hasDarkvision: true,
    primaryTraitName: 'Gnome Cunning',
    primaryTraitDesc: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
    secondaryTraitName: 'Tinker & Darkvision',
    secondaryTraitDesc: 'You gain Darkvision 60ft and proficiency with Tinker’s Tools or Artisan Tools.',
    skillBonus: 'Tinker’s Tools Proficiency',
    statBonusHint: '+2 Intelligence'
  },
  {
    id: 'orc',
    name: 'Orc / Half-Orc',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Relentless Endurance',
    primaryTraitDesc: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead (once per long rest).',
    secondaryTraitName: 'Savage Attacks',
    secondaryTraitDesc: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon’s damage dice one additional time and add it to the extra damage.',
    skillBonus: 'Intimidation Skill Proficiency',
    statBonusHint: '+2 Strength, +1 Constitution'
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Infernal Legacy & Thaumaturgy',
    primaryTraitDesc: 'You know the Thaumaturgy cantrip. At 3rd level, you can cast Hellish Rebuke once per long rest.',
    secondaryTraitName: 'Hellish Resistance',
    secondaryTraitDesc: 'You have resistance to Fire damage and gain Darkvision 60ft.',
    skillBonus: 'Thaumaturgy Cantrip',
    statBonusHint: '+2 Charisma, +1 Intelligence'
  },
  {
    id: 'goliath',
    name: 'Goliath',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    primaryTraitName: 'Stone’s Endurance',
    primaryTraitDesc: 'You can focus yourself to occasionally shrug off injury. When you take damage, you can use your reaction to roll a d12 + CON modifier and reduce the damage by that amount (once per short rest).',
    secondaryTraitName: 'Powerful Build',
    secondaryTraitDesc: 'You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.',
    skillBonus: 'Athletics Skill Proficiency',
    statBonusHint: '+2 Strength, +1 Constitution'
  },
  {
    id: 'tabaxi',
    name: 'Tabaxi',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Feline Agility',
    primaryTraitDesc: 'Your reflexes allow you to move with sudden bursts of speed. When you move on your turn, you can double your speed until the end of the turn (recharges when you move 0ft on a turn).',
    secondaryTraitName: 'Cat’s Claws & Instincts',
    secondaryTraitDesc: 'You have a climbing speed of 20ft and natural slashing claws (1d4 + STR). Gain Darkvision 60ft and Perception proficiency.',
    skillBonus: 'Perception & Stealth Proficiency',
    statBonusHint: '+2 Dexterity, +1 Charisma'
  },
  {
    id: 'aasimar',
    name: 'Aasimar',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Celestial Healing & Light',
    primaryTraitDesc: 'As an action, you can touch a creature and restore HP equal to your character level (once per long rest). You also know the Light cantrip.',
    secondaryTraitName: 'Celestial Resistance',
    secondaryTraitDesc: 'You have resistance to Necrotic and Radiant damage, plus Darkvision 60ft.',
    skillBonus: 'Light Cantrip',
    statBonusHint: '+2 Charisma, +1 Wisdom'
  },
  {
    id: 'genasi',
    name: 'Genasi',
    size: 'Medium',
    speed: 30,
    hasDarkvision: true,
    primaryTraitName: 'Elemental Genesis',
    primaryTraitDesc: 'You channel elemental power from your planar ancestry (Air, Earth, Fire, or Water), granting you specialized elemental spellcasting (such as Mold Earth or Produce Flame).',
    secondaryTraitName: 'Elemental Resistance',
    secondaryTraitDesc: 'You have resistance to damage matching your elemental line (Acid, Fire, Cold, or Lightning).',
    skillBonus: 'Elemental Affinity',
    statBonusHint: '+2 Constitution'
  },
  {
    id: 'warforged',
    name: 'Warforged',
    size: 'Medium',
    speed: 30,
    hasDarkvision: false,
    primaryTraitName: 'Constructed Resilience',
    primaryTraitDesc: 'You have advantage on saving throws against poison and resistance to poison damage. You don’t need to eat, drink, or breathe, and magic cannot put you to sleep.',
    secondaryTraitName: 'Integrated Protection',
    secondaryTraitDesc: 'Your body has built-in protective plating, granting you a permanent +1 bonus to Armor Class.',
    skillBonus: '+1 Armor Class Bonus',
    statBonusHint: '+2 Constitution, +1 to any'
  }
];

/**
 * Smart hybrid name generator based on two parent ancestries.
 * Follows classic TRPG conventions and Alpine DM style hybrid naming.
 */
export function getHybridName(primaryName: string, secondaryName: string, customInput?: string): string {
  if (customInput && customInput.trim().length > 0) {
    return customInput.trim();
  }

  const p = primaryName.trim();
  const s = secondaryName.trim();

  if (p === s) {
    return p;
  }

  // Known special hybrid titles
  const comboKey = `${p.toLowerCase()}-${s.toLowerCase()}`;
  const reverseKey = `${s.toLowerCase()}-${p.toLowerCase()}`;

  const SPECIAL_TITLES: Record<string, string> = {
    'elf-dwarf': 'Dwelf (Half-Elf / Half-Dwarf)',
    'dwarf-elf': 'Dwelf (Half-Dwarf / Half-Elf)',
    'human-elf': 'Half-Elf (Human / Elf)',
    'elf-human': 'Half-Elf (Elf / Human)',
    'human-orc': 'Half-Orc (Human / Orc)',
    'orc-human': 'Half-Orc (Orc / Human)',
    'human-dwarf': 'Half-Dwarf / Mul (Human / Dwarf)',
    'dwarf-human': 'Half-Dwarf / Mul (Dwarf / Human)',
    'halfling-dwarf': 'Stoutling (Halfling / Dwarf)',
    'dwarf-halfling': 'Stoutling (Dwarf / Halfling)',
    'dragonborn-halfling': 'Draconic Halfling',
    'halfling-dragonborn': 'Draconic Halfling',
    'tiefling-gnome': 'Hellion Gnome',
    'gnome-tiefling': 'Hellion Gnome',
    'goliath-dwarf': 'Stone-Kin Goliath',
    'dwarf-goliath': 'Stone-Kin Goliath',
    'dragonborn-human': 'Dragon-Blooded Human',
    'human-dragonborn': 'Dragon-Blooded Human',
    'orc-gnome': 'Gnomish Orc',
    'gnome-orc': 'Gnomish Orc',
    'tiefling-elf': 'Fey-Fiend (Elven Tiefling)',
    'elf-tiefling': 'Fey-Fiend (Elven Tiefling)',
    'aasimar-tiefling': 'Nephilim (Celestial-Fiend Hybrid)',
    'tiefling-aasimar': 'Nephilim (Fiend-Celestial Hybrid)',
    'tabaxi-elf': 'Feline High-Elf',
    'elf-tabaxi': 'Feline High-Elf',
    'warforged-human': 'Cyborg / Mech-Human',
    'human-warforged': 'Cyborg / Mech-Human'
  };

  if (SPECIAL_TITLES[comboKey]) return SPECIAL_TITLES[comboKey];
  if (SPECIAL_TITLES[reverseKey]) return SPECIAL_TITLES[reverseKey];

  return `Half-${p} / Half-${s}`;
}

/**
 * Creates a complete ClassFeature object representing the character's Half-Breed Heritage.
 */
export function buildHybridFeature(
  hybridName: string,
  primaryParent: ParentRaceData,
  secondaryParent: ParentRaceData,
  sizeCategory: string,
  speedFeet: number,
  hasDarkvision: boolean
): ClassFeature {
  return {
    id: `feat-hybrid-heritage-${Date.now()}`,
    name: `Hybrid Heritage: ${hybridName}`,
    source: 'Half-Breed System (The Alpine DM / Homebrew Rules)',
    description: `[Dual Ancestry: ${primaryParent.name} (Primary) & ${secondaryParent.name} (Secondary)]
• Primary Heritage (${primaryParent.name}): ${primaryParent.primaryTraitName} — ${primaryParent.primaryTraitDesc}
• Secondary Heritage (${secondaryParent.name}): ${secondaryParent.secondaryTraitName} — ${secondaryParent.secondaryTraitDesc}
• Physical Traits: Size (${sizeCategory}), Base Speed (${speedFeet} ft), Darkvision (${hasDarkvision ? '60 ft' : 'None'}).`
  };
}
