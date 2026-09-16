import { ClassFeature, RuleEdition, RacialSkillBonus } from '../types';

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

// ============================================================================
// D&D 3.5E HALF-BREED TEMPLATES SYSTEM (Base Creature + Inherited Template)
// Rule hierarchy:
// 1. Specific rule stated by Half-Breed Template
// 2. Specific rule stated by Base Creature
// 3. General Half-Breed rules (cumulative bonuses, duplicate higher-value wins, racial SP waived with class levels)
// 4. General rules of D&D 3.5e
// ============================================================================

export interface BaseCreature35e {
  id: string;
  name: string;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  speedNotes?: string;
  abilities: {
    STR?: number;
    DEX?: number;
    CON?: number;
    INT?: number;
    WIS?: number;
    CHA?: number;
  };
  naturalArmor: number;
  darkvisionFeet?: number;
  hasLowLightVision?: boolean;
  traits: Array<{
    name: string;
    description: string;
    conflictKey?: string; // e.g. "size_build"
  }>;
  racialSkillBonuses?: RacialSkillBonus[];
  source: string;
  description: string;
}

export interface HalfBreedTemplate35e {
  id: string;
  name: string;
  edition: '3.5e';
  source: string;
  levelAdjustment: number;
  typeChange: string;
  abilityModifiers: {
    STR?: number;
    DEX?: number;
    CON?: number;
    INT?: number;
    WIS?: number;
    CHA?: number;
  };
  naturalArmorBonus: number;
  sizeChange?: 'increase_1' | 'decrease_1' | 'same';
  speedModifier?: number; // Added to base land speed
  flySpeedMultiplier?: number; // e.g. 2 for 2x land speed
  fixedFlySpeed?: number; // e.g. 30 ft
  flyManeuverability?: 'poor' | 'average' | 'good' | 'perfect';
  darkvisionFeet?: number;
  hasLowLightVision?: boolean;
  hasBlindsight?: boolean;
  blindsightFeet?: number;
  damageImmunities?: string[];
  conditionImmunities?: string[];
  energyResistances?: Record<string, number>;
  damageReduction?: { value: number; bypass: string; minHD?: number };
  spellResistanceFormula?: string;
  savingThrowBonuses?: Array<{ save: string; bonus: number; condition: string }>;
  naturalAttacks?: Array<{
    name: string;
    damageDice: string; // for medium size
    damageType: string;
    notes?: string;
  }>;
  traits: Array<{
    name: string;
    description: string;
    conflictKey?: string;
  }>;
  racialSkillBonuses?: RacialSkillBonus[];
  racialSkillPointsText: string;
  hasDragonVarieties?: boolean;
  description: string;
}

export const BASE_CREATURES_35E: BaseCreature35e[] = [
  {
    id: 'dwarf',
    name: 'Dwarf',
    size: 'Medium',
    speed: 20,
    speedNotes: '20 ft. (Speed never reduced by wearing medium or heavy armor or carrying a medium or heavy load)',
    abilities: { CON: 2, CHA: -2 },
    naturalArmor: 0,
    darkvisionFeet: 60,
    hasLowLightVision: false,
    source: '3.5e Player’s Handbook I, pp. 14–15',
    description: 'Dwarves are known for their skill in warfare, ability to withstand physical punishment, and knowledge of stone and mineral crafts.',
    traits: [
      { name: 'Darkvision (60 ft)', description: 'Can see up to 60 feet in the dark in black and white.' },
      { name: 'Stonecunning', description: '+2 racial bonus on Search checks to notice unusual stonework (sliding walls, stonework traps, new construction, unsafe stone surfaces). Automatically gets a Search check if passing within 10 ft.' },
      { name: 'Weapon Familiarity', description: 'Treat Dwarven Waraxes and Dwarven Urgroshes as martial weapons rather than exotic weapons.' },
      { name: 'Stability', description: '+4 bonus on ability checks made to resist being bull rushed or tripped when standing firmly on the ground.' },
      { name: 'Hardiness vs. Poison', description: '+2 racial bonus on saving throws against poison.' },
      { name: 'Hardiness vs. Spells', description: '+2 racial bonus on saving throws against spells and spell-like effects.' },
      { name: 'Combat Training vs. Orcs & Goblins', description: '+1 racial bonus on attack rolls against orcs and goblinoids.' },
      { name: 'Dodge vs. Giants', description: '+4 dodge bonus to Armor Class against monsters of the giant type.' },
      { name: 'Appraise & Craft (Stone/Metal)', description: '+2 racial bonus on Appraise and Craft checks related to stone or metal items.' }
    ]
  },
  {
    id: 'elf',
    name: 'Elf',
    size: 'Medium',
    speed: 30,
    abilities: { DEX: 2, CON: -2 },
    naturalArmor: 0,
    darkvisionFeet: 0,
    hasLowLightVision: true,
    source: '3.5e Player’s Handbook I, pp. 15–16',
    description: 'Elves are graceful, keen-eyed, and intrinsically connected to magic, nature, and the fine arts of archery and bladecraft.',
    traits: [
      { name: 'Low-Light Vision', description: 'Can see twice as far as a human in starlight, moonlight, torchlight, and similar poor illumination.' },
      { name: 'Immunity to Sleep', description: 'Immune to magic sleep spells and effects.' },
      { name: 'Enchantment Resistance', description: '+2 racial bonus on saving throws against enchantment spells or effects.' },
      { name: 'Martial Weapon Proficiency', description: 'Proficient with longsword, rapier, longbow, and shortbow.' },
      { name: 'Keen Senses', description: '+2 racial bonus on Listen, Search, and Spot checks. Merely passing within 5 feet of a secret or concealed door entitles an elf to a Search check.' }
    ]
  },
  {
    id: 'human',
    name: 'Human',
    size: 'Medium',
    speed: 30,
    abilities: {},
    naturalArmor: 0,
    darkvisionFeet: 0,
    hasLowLightVision: false,
    source: '3.5e Player’s Handbook I, pp. 12–14',
    description: 'Humans are the most adaptable, flexible, and ambitious of the common races, excelling in any chosen discipline.',
    traits: [
      { name: 'Bonus Feat (1st Level)', description: 'Gains 1 extra feat at 1st level.' },
      { name: 'Skilled Versatility', description: '4 extra skill points at 1st level and 1 extra skill point at each additional level.' }
    ]
  },
  {
    id: 'halfling',
    name: 'Halfling',
    size: 'Small',
    speed: 20,
    abilities: { DEX: 2, STR: -2 },
    naturalArmor: 0,
    darkvisionFeet: 0,
    hasLowLightVision: false,
    source: '3.5e Player’s Handbook I, pp. 19–20',
    description: 'Halflings are clever, capable opportunists who rely on stealth, nimbleness, and unerring hand-eye coordination.',
    traits: [
      { name: 'Small Size', description: '+1 bonus to Armor Class, +1 bonus on attack rolls, +4 bonus on Hide checks, -4 on grapple checks.' },
      { name: 'Athletic & Stealthy', description: '+2 racial bonus on Climb, Jump, Listen, and Move Silently checks.' },
      { name: 'Halfling Luck', description: '+1 racial bonus on all saving throws.' },
      { name: 'Fearless', description: '+2 morale bonus on saving throws against fear.' },
      { name: 'Thrown Weapon Master', description: '+1 racial bonus on attack rolls with thrown weapons and slings.' }
    ]
  },
  {
    id: 'gnome',
    name: 'Gnome',
    size: 'Small',
    speed: 20,
    abilities: { CON: 2, STR: -2 },
    naturalArmor: 0,
    darkvisionFeet: 0,
    hasLowLightVision: true,
    source: '3.5e Player’s Handbook I, pp. 16–18',
    description: 'Gnomes are inquisitive, jovial, and cunning inventors and illusionists who thrive underground and in wooded burrows.',
    traits: [
      { name: 'Small Size', description: '+1 bonus to Armor Class, +1 bonus on attack rolls, +4 bonus on Hide checks, -4 on grapple checks.' },
      { name: 'Low-Light Vision', description: 'Can see twice as far as a human in starlight, moonlight, torchlight, and similar illumination.' },
      { name: 'Illusion Mastery', description: '+2 racial bonus on saving throws against illusions; +1 to difficulty class for all illusion spells cast.' },
      { name: 'Combat Training vs. Kobolds & Goblins', description: '+1 racial bonus on attack rolls against kobolds and goblinoids.' },
      { name: 'Dodge vs. Giants', description: '+4 dodge bonus to Armor Class against monsters of the giant type.' },
      { name: 'Keen Hearing & Alchemy', description: '+2 racial bonus on Listen checks and Craft (alchemy) checks.' },
      { name: 'Speak with Animals (SLA)', description: 'Once per day speak with burrowing mammals (badger, fox, rabbit, etc.) for 1 minute.' }
    ]
  },
  {
    id: 'half-elf',
    name: 'Half-Elf',
    size: 'Medium',
    speed: 30,
    abilities: {},
    naturalArmor: 0,
    darkvisionFeet: 0,
    hasLowLightVision: true,
    source: '3.5e Player’s Handbook I, pp. 18–19',
    description: 'Half-elves combine human curiosity and ambition with elven grace, keen senses, and a natural affinity for diplomacy.',
    traits: [
      { name: 'Low-Light Vision', description: 'Can see twice as far as a human in starlight and poor illumination.' },
      { name: 'Immunity to Sleep', description: 'Immune to magic sleep spells and effects.' },
      { name: 'Enchantment Resistance', description: '+2 racial bonus on saving throws against enchantment spells or effects.' },
      { name: 'Perceptive', description: '+1 racial bonus on Listen, Search, and Spot checks.' },
      { name: 'Diplomatic', description: '+2 racial bonus on Diplomacy and Gather Information checks.' },
      { name: 'Elven Blood', description: 'For all effects related to race, a half-elf is considered an elf.' }
    ]
  },
  {
    id: 'half-orc',
    name: 'Half-Orc',
    size: 'Medium',
    speed: 30,
    abilities: { STR: 2, INT: -2, CHA: -2 },
    naturalArmor: 0,
    darkvisionFeet: 60,
    hasLowLightVision: false,
    source: '3.5e Player’s Handbook I, pp. 22–23',
    description: 'Half-orcs inherit formidable strength, stubborn endurance, and darkvision from their orc ancestors.',
    traits: [
      { name: 'Darkvision (60 ft)', description: 'Can see up to 60 feet in total darkness in black and white.' },
      { name: 'Orc Blood', description: 'For all effects related to race, a half-orc is considered an orc.' }
    ]
  },
  {
    id: 'orc',
    name: 'Orc',
    size: 'Medium',
    speed: 30,
    abilities: { STR: 4, DEX: -2, INT: -2, WIS: -2, CHA: -2 },
    naturalArmor: 0,
    darkvisionFeet: 60,
    hasLowLightVision: false,
    source: '3.5e Monster Manual I, p. 203',
    description: 'Savage and muscular humanoids driven by predatory instinct and relentless brute combat superiority.',
    traits: [
      { name: 'Darkvision (60 ft)', description: 'Can see up to 60 feet in total darkness in black and white.' },
      { name: 'Light Sensitivity', description: 'Dazzled (-1 penalty on attack rolls, Search checks, and Spot checks) in bright sunlight or within daylight spell.' }
    ]
  },
  {
    id: 'goblin',
    name: 'Goblin',
    size: 'Small',
    speed: 30,
    abilities: { STR: -2, DEX: 2, CHA: -2 },
    naturalArmor: 0,
    darkvisionFeet: 60,
    hasLowLightVision: false,
    source: '3.5e Monster Manual I, p. 133',
    description: 'Small, wily humanoids known for uncanny stealth, pack tactics, and expert riding skills.',
    traits: [
      { name: 'Small Size', description: '+1 bonus to Armor Class, +1 bonus on attack rolls, +4 bonus on Hide checks, -4 on grapple checks.' },
      { name: 'Darkvision (60 ft)', description: 'Can see up to 60 feet in total darkness in black and white.' },
      { name: 'Rider & Stalker', description: '+4 racial bonus on Move Silently and Ride checks.' }
    ]
  },
  {
    id: 'kobold',
    name: 'Kobold',
    size: 'Small',
    speed: 30,
    abilities: { STR: -4, DEX: 2, CON: -2 },
    naturalArmor: 1,
    darkvisionFeet: 60,
    hasLowLightVision: false,
    source: '3.5e Monster Manual I, p. 161',
    description: 'Reptilian humanoids with draconic reverence, natural armor, and expert trapmaking ability.',
    traits: [
      { name: 'Small Size', description: '+1 bonus to Armor Class, +1 bonus on attack rolls, +4 bonus on Hide checks, -4 on grapple checks.' },
      { name: 'Natural Armor (+1 AC)', description: '+1 natural armor bonus to Armor Class.' },
      { name: 'Darkvision (60 ft)', description: 'Can see up to 60 feet in total darkness in black and white.' },
      { name: 'Light Sensitivity', description: 'Dazzled in bright sunlight or daylight spell.' },
      { name: 'Crafty Miner', description: '+2 racial bonus on Craft (trapmaking), Profession (miner), and Search checks.' },
      { name: 'Slight Build', description: 'Can squeeze through spaces as if one size smaller (Tiny) whenever advantageous.', conflictKey: 'size_build' }
    ]
  },
  {
    id: 'ogre',
    name: 'Ogre',
    size: 'Large',
    speed: 40,
    abilities: { STR: 10, DEX: -2, CON: 4, INT: -4, CHA: -4 },
    naturalArmor: 5,
    darkvisionFeet: 60,
    hasLowLightVision: true,
    source: '3.5e Monster Manual I, p. 199',
    description: 'Towering brutes possessing colossal strength, thick hide, and massive reach.',
    traits: [
      { name: 'Large Size', description: '-1 penalty to Armor Class, -1 penalty on attack rolls, +4 bonus on grapple checks, 10 ft space and 10 ft reach.' },
      { name: 'Natural Armor (+5 AC)', description: '+5 natural armor bonus to Armor Class.' },
      { name: 'Darkvision (60 ft) & Low-Light', description: 'Possesses 60 ft Darkvision and Low-Light vision.' }
    ]
  },
  {
    id: 'lizardfolk',
    name: 'Lizardfolk',
    size: 'Medium',
    speed: 30,
    abilities: { STR: 2, CON: 2, INT: -2 },
    naturalArmor: 5,
    darkvisionFeet: 0,
    hasLowLightVision: false,
    source: '3.5e Monster Manual I, p. 169',
    description: 'Semi-aquatic reptilian humanoids protected by dense scaly hide with deadly natural claws and bite.',
    traits: [
      { name: 'Natural Armor (+5 AC)', description: '+5 natural armor bonus to Armor Class.' },
      { name: 'Natural Weapons (Claws & Bite)', description: '2 Claws (1d4 damage) and 1 Bite (1d4 damage).' },
      { name: 'Hold Breath', description: 'Can hold breath for a number of rounds equal to 4 × Constitution score before risking drowning.' },
      { name: 'Acrobatic Swimmer', description: '+4 racial bonus on Jump, Swim, and Balance checks.' }
    ]
  }
];

export const HALF_BREED_TEMPLATES_35E: HalfBreedTemplate35e[] = [
  {
    id: 'half-dragon',
    name: 'Half-Dragon',
    edition: '3.5e',
    source: 'Monster Manual I, pp. 146–147',
    levelAdjustment: 3,
    typeChange: 'Dragon (Augmented Humanoid)',
    abilityModifiers: { STR: 8, CON: 2, INT: 2, CHA: 2 },
    naturalArmorBonus: 4,
    sizeChange: 'same',
    darkvisionFeet: 60,
    hasLowLightVision: true,
    damageImmunities: ['Sleep', 'Paralysis'],
    conditionImmunities: ['Sleep', 'Paralyzed'],
    naturalAttacks: [
      { name: 'Claw (Primary)', damageDice: '1d4', damageType: 'Slashing', notes: '2 natural claw attacks (1d4 for Medium, 1d6 for Large)' },
      { name: 'Bite (Secondary)', damageDice: '1d6', damageType: 'Piercing/Slashing', notes: 'Natural bite attack (1d6 for Medium, 1d8 for Large)' }
    ],
    traits: [
      {
        name: 'Draconic Breath Weapon (6d8)',
        description: 'Once per day, exhale destructive elemental energy dealing 6d8 damage (Reflex save DC 10 + 1/2 HD + CON modifier for half). Shape and energy type depend on dragon ancestor.'
      },
      {
        name: 'Dragon Ancestor Immunity',
        description: 'Completely immune to energy damage of the type associated with the dragon ancestor (e.g. Fire for Red/Gold, Cold for White/Silver, Acid for Black/Copper/Green, Electricity for Blue/Bronze).'
      },
      {
        name: 'Draconic Immunities',
        description: 'Immune to all sleep spells and effects, as well as all paralysis effects.'
      },
      {
        name: 'Wings & Flight (Large+ only)',
        description: 'If the base creature is Large or larger, it grows wings and gains a fly speed equal to its base land speed (maximum 30 ft, average maneuverability).'
      }
    ],
    racialSkillPointsText: 'Gains (6 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. If character has 1+ class levels, racial skill points are ignored in favor of class progression.',
    hasDragonVarieties: true,
    description: 'Created through magical rituals or draconic crossbreeding, half-dragons inherit scaly hides, deadly breath weapons, formidable natural weapons, and immense physical strength.'
  },
  {
    id: 'half-celestial',
    name: 'Half-Celestial',
    edition: '3.5e',
    source: 'Monster Manual I, pp. 144–146',
    levelAdjustment: 4,
    typeChange: 'Outsider (Native)',
    abilityModifiers: { STR: 4, DEX: 2, CON: 4, INT: 2, WIS: 4, CHA: 4 },
    naturalArmorBonus: 1,
    sizeChange: 'same',
    flySpeedMultiplier: 2, // Double base land speed, max 60 ft
    flyManeuverability: 'good',
    darkvisionFeet: 60,
    hasLowLightVision: false,
    damageImmunities: ['Disease'],
    conditionImmunities: ['Diseased'],
    energyResistances: { Acid: 10, Cold: 10, Electricity: 10 },
    damageReduction: { value: 5, bypass: 'Magic', minHD: 8 },
    spellResistanceFormula: 'HD + 10 (max 35)',
    savingThrowBonuses: [
      { save: 'Fortitude', bonus: 4, condition: 'against poison' }
    ],
    traits: [
      {
        name: 'Feathered Wings & Flight',
        description: 'Magnificent feathered wings grant a fly speed equal to double the base creature’s land speed (up to a maximum of 60 ft) with good maneuverability.'
      },
      {
        name: 'Smite Evil (1/day)',
        description: 'Once per day, the half-celestial can make a normal melee attack to deal extra damage equal to its HD (or character level) against an evil foe, adding its Charisma bonus to the attack roll.'
      },
      {
        name: 'Daylight (SLA)',
        description: 'Can cast Daylight at will as a spell-like ability (caster level equal to character level).'
      },
      {
        name: 'Holy Defenses & Resistances',
        description: 'Immunity to disease. +4 on Fortitude saves against poison. Resistance to Acid 10, Cold 10, Electricity 10. Spell Resistance equal to HD + 10 (max 35). DR 5/magic (HD 8-11) or DR 10/magic (HD 12+).'
      }
    ],
    racialSkillPointsText: 'Gains (8 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. Waived if the character has class levels.',
    description: 'Blessed mortals bearing celestial lineage, marked by radiant beauty, feathered angel wings, shining metallic hair, and divine protective wards.'
  },
  {
    id: 'half-fiend',
    name: 'Half-Fiend',
    edition: '3.5e',
    source: 'Monster Manual I, pp. 147–149',
    levelAdjustment: 4,
    typeChange: 'Outsider (Native)',
    abilityModifiers: { STR: 4, DEX: 4, CON: 2, INT: 4, CHA: 2 },
    naturalArmorBonus: 1,
    sizeChange: 'same',
    fixedFlySpeed: 30,
    flyManeuverability: 'average',
    darkvisionFeet: 60,
    hasLowLightVision: false,
    damageImmunities: ['Poison'],
    conditionImmunities: ['Poisoned'],
    energyResistances: { Acid: 10, Cold: 10, Electricity: 10, Fire: 10 },
    damageReduction: { value: 5, bypass: 'Magic', minHD: 8 },
    spellResistanceFormula: 'HD + 10 (max 35)',
    naturalAttacks: [
      { name: 'Claw (Primary)', damageDice: '1d4', damageType: 'Slashing', notes: '2 natural claw attacks (1d4 for Medium)' },
      { name: 'Bite (Secondary)', damageDice: '1d6', damageType: 'Piercing', notes: 'Natural bite attack (1d6 for Medium)' }
    ],
    traits: [
      {
        name: 'Bat Wings & Flight',
        description: 'Leathery bat-like wings grant a fly speed equal to the base creature’s land speed (standard 30 ft) with average maneuverability.'
      },
      {
        name: 'Smite Good (1/day)',
        description: 'Once per day, make a melee attack against a good creature to add Charisma modifier to attack roll and +1 damage per HD.'
      },
      {
        name: 'Infernal Immunities & Resistances',
        description: 'Immunity to poison. Resistance to Acid 10, Cold 10, Electricity 10, Fire 10. Spell Resistance equal to HD + 10 (max 35). DR 5/magic (HD 8-11) or DR 10/magic (HD 12+).'
      },
      {
        name: 'Darkness (3/day SLA)',
        description: 'Can cast Darkness 3 times per day as a spell-like ability (caster level equal to character level).'
      }
    ],
    racialSkillPointsText: 'Gains (8 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. Waived if character has class levels.',
    description: 'Offspring of mortals and demonic or devilish fiends, bearing bat wings, horns, cloven hooves or fangs, and dark magical resistances.'
  },
  {
    id: 'half-ogre',
    name: 'Half-Ogre',
    edition: '3.5e',
    source: 'Savage Species, pp. 217–218 / Dragon Magazine #313',
    levelAdjustment: 2,
    typeChange: 'Giant (Augmented Humanoid)',
    abilityModifiers: { STR: 6, DEX: -2, CON: 2, INT: -2, CHA: -2 },
    naturalArmorBonus: 4,
    sizeChange: 'increase_1', // Medium becomes Large!
    darkvisionFeet: 60,
    hasLowLightVision: false,
    traits: [
      {
        name: 'Large Size Growth',
        description: 'Size increases by one category (Medium becomes Large). Gains 10 ft space and 10 ft natural reach, -1 penalty to AC and attack rolls, and +4 bonus on grapple checks.',
        conflictKey: 'size_build'
      },
      {
        name: 'Giant Blood',
        description: 'Considered a creature of the Giant type for all spells, magic items, and racial effects.'
      }
    ],
    racialSkillPointsText: 'Gains (2 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. Waived if character has class levels.',
    description: 'Towering crossbreeds standing 8 to 9 feet tall with bulging musculature, dense bones, and devastating reach.'
  },
  {
    id: 'half-troll',
    name: 'Half-Troll',
    edition: '3.5e',
    source: 'Fiend Folio, pp. 92–94',
    levelAdjustment: 4,
    typeChange: 'Giant (Augmented Humanoid)',
    abilityModifiers: { STR: 6, DEX: 2, CON: 6, INT: -4, CHA: -2 },
    naturalArmorBonus: 4,
    sizeChange: 'same',
    darkvisionFeet: 60,
    hasLowLightVision: false,
    naturalAttacks: [
      { name: 'Claw (Primary)', damageDice: '1d4', damageType: 'Slashing', notes: '2 natural claw attacks (1d4 for Medium)' },
      { name: 'Bite (Secondary)', damageDice: '1d6', damageType: 'Piercing', notes: 'Natural bite attack (1d6 for Medium)' }
    ],
    traits: [
      {
        name: 'Fast Healing 5',
        description: 'Regains 5 hit points at the start of each of its turns. Fire and acid deal normal damage that cannot be regenerated.'
      },
      {
        name: 'Scent',
        description: 'Can detect approaching enemies, sniff out hidden foes, and track by sense of smell within 30 ft (60 ft upwind).'
      }
    ],
    racialSkillPointsText: 'Gains (2 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. Waived if character has class levels.',
    description: 'Horrific hybrid bearing mottled green hide, long claws, and astonishing rapid tissue regeneration.'
  },
  {
    id: 'half-fey',
    name: 'Half-Fey',
    edition: '3.5e',
    source: 'Fiend Folio, pp. 89–91',
    levelAdjustment: 2,
    typeChange: 'Fey (Augmented Humanoid)',
    abilityModifiers: { STR: -2, DEX: 2, CON: 2, INT: 2, WIS: 4, CHA: 4 },
    naturalArmorBonus: 0,
    sizeChange: 'same',
    flySpeedMultiplier: 2, // Double base land speed, up to 60 ft
    flyManeuverability: 'good',
    darkvisionFeet: 0,
    hasLowLightVision: true,
    damageImmunities: ['Sleep'],
    conditionImmunities: ['Sleep'],
    damageReduction: { value: 5, bypass: 'Cold Iron', minHD: 12 },
    savingThrowBonuses: [
      { save: 'Will', bonus: 2, condition: 'against enchantment spells and effects' }
    ],
    traits: [
      {
        name: 'Insect or Butterfly Wings & Flight',
        description: 'Shimmering gossamer wings grant a fly speed equal to double the base creature’s land speed (max 60 ft) with good maneuverability.'
      },
      {
        name: 'Fey Immunities & Senses',
        description: 'Immune to magic sleep effects. +2 racial bonus on saving throws against enchantment spells or effects. Low-Light Vision.'
      },
      {
        name: 'Charm Person (SLA)',
        description: 'Can cast Charm Person at will (DC 11 + CHA modifier).'
      }
    ],
    racialSkillPointsText: 'Gains (6 + INT mod) × (Racial HD + 3) racial skill points ONLY if the character has 0 class levels. Waived if character has class levels.',
    description: 'Enchanting woodland beings with luminous gossamer wings, mercurial emotions, and alluring nature magic.'
  },
  {
    id: 'half-golem',
    name: 'Half-Golem (Iron)',
    edition: '3.5e',
    source: 'Monster Manual II, pp. 209–213',
    levelAdjustment: 3,
    typeChange: 'Construct (Augmented Humanoid)',
    abilityModifiers: { STR: 12, DEX: -2, CON: 0, INT: -4, CHA: -4 },
    naturalArmorBonus: 11,
    sizeChange: 'same',
    darkvisionFeet: 60,
    hasLowLightVision: true,
    damageImmunities: ['Poison', 'Sleep', 'Paralysis', 'Stunning', 'Disease'],
    conditionImmunities: ['Poisoned', 'Sleep', 'Paralyzed', 'Stunned', 'Diseased'],
    damageReduction: { value: 15, bypass: 'Adamantine' },
    traits: [
      {
        name: 'Construct Resilience',
        description: 'Immunity to all mind-affecting effects (charms, compulsions, phantasms, patterns, and morale effects). Immune to poison, sleep effects, paralysis, stunning, disease, death effects, and necromancy effects. Not subject to critical hits, nonlethal damage, ability damage, ability drain, or energy drain.'
      },
      {
        name: 'Iron Slam Attack',
        description: 'Gains a powerful slam attack dealing 1d10 bludgeoning damage (for Medium size).'
      }
    ],
    racialSkillPointsText: 'Gains 0 racial skill points. Skill points are determined exclusively by class levels.',
    description: 'A tragic cyborg-like graft of living flesh and relentless enchanted iron plating, trading agility and intellect for immense physical resistance.'
  }
];

/**
 * Merges a 3.5e Base Creature and a Half-Breed Template according to the exact rules:
 * - Numerical bonuses stack additively
 * - Duplicate traits take the higher value
 * - Core stats (size and speed) are anchored to base creature unless template modifies them
 * - Template racial skill points waived if character has 1+ class levels
 * - Returns composite attributes, trait lists, and precedence breakdown log.
 */
export function resolve35eHalfBreedTemplate(
  base: BaseCreature35e,
  template: HalfBreedTemplate35e,
  characterLevel: number = 1,
  hasClassLevels: boolean = true,
  dragonVariety?: string,
  conflictChoices?: Record<string, 'base' | 'template' | 'suppress'>
): {
  compositeName: string;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  speedNotes: string;
  flySpeed?: number;
  flyManeuverability?: string;
  abilities: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
  abilityBreakdowns: Record<string, { base: number; template: number; net: number }>;
  naturalArmor: number;
  naturalArmorBreakdown: { base: number; template: number; total: number };
  darkvisionFeet: number;
  hasLowLightVision: boolean;
  hasBlindsight: boolean;
  blindsightFeet?: number;
  damageImmunities: string[];
  conditionImmunities: string[];
  energyResistances: Record<string, number>;
  damageReduction?: { value: number; bypass: string };
  spellResistanceText?: string;
  retainedBaseTraits: Array<{ name: string; description: string }>;
  gainedTemplateTraits: Array<{ name: string; description: string }>;
  conflicts: Array<{ key: string; baseName: string; templateName: string; resolution: string }>;
  skillPointsNotice: string;
  precedenceLog: string[];
  levelAdjustment: number;
  racialSkillBonuses: RacialSkillBonus[];
} {
  const precedenceLog: string[] = [];

  // 1. Composite Race Title
  let templateNameClean = template.name;
  if (template.hasDragonVarieties && dragonVariety) {
    templateNameClean = `Half-${dragonVariety} Dragon`;
  }
  const compositeName = `${templateNameClean} ${base.name}`;
  precedenceLog.push(`[Rule 1 - Template Title]: Created composite designation "${compositeName}".`);

  // 2. Core Stats (Size & Speed)
  let resolvedSize = base.size;
  if (template.sizeChange === 'increase_1') {
    resolvedSize = base.size === 'Small' ? 'Medium' : 'Large';
    precedenceLog.push(`[Rule 1 - Template Override]: Template specifies size increase: ${base.size} -> ${resolvedSize}.`);
  } else if (template.sizeChange === 'decrease_1') {
    resolvedSize = base.size === 'Large' ? 'Medium' : 'Small';
    precedenceLog.push(`[Rule 1 - Template Override]: Template specifies size decrease: ${base.size} -> ${resolvedSize}.`);
  } else {
    precedenceLog.push(`[Rule 2 - Base Creature]: Size inherited from ${base.name} (${base.size}).`);
  }

  const baseSpeed = base.speed;
  const speedBonus = template.speedModifier || 0;
  const netSpeed = baseSpeed + speedBonus;
  let speedNotes = base.speedNotes || `${netSpeed} ft. land speed`;
  if (speedBonus !== 0) {
    precedenceLog.push(`[Rule 1 - Template Override]: Land speed modified by ${speedBonus > 0 ? `+${speedBonus}` : speedBonus} ft (${netSpeed} ft total).`);
  } else {
    precedenceLog.push(`[Rule 2 - Base Creature]: Base land speed inherited from ${base.name} (${baseSpeed} ft).`);
  }

  // Fly speed
  let flySpeed: number | undefined;
  let flyManeuverability: string | undefined;
  if (template.fixedFlySpeed) {
    flySpeed = template.fixedFlySpeed;
    flyManeuverability = template.flyManeuverability || 'average';
    precedenceLog.push(`[Rule 1 - Template]: Gains fixed fly speed of ${flySpeed} ft (${flyManeuverability}).`);
  } else if (template.flySpeedMultiplier) {
    flySpeed = Math.min(60, netSpeed * template.flySpeedMultiplier);
    flyManeuverability = template.flyManeuverability || 'good';
    precedenceLog.push(`[Rule 1 - Template]: Gains fly speed (${template.flySpeedMultiplier}× base speed = ${flySpeed} ft, ${flyManeuverability}).`);
  } else if (template.id === 'half-dragon' && resolvedSize === 'Large') {
    flySpeed = Math.min(30, netSpeed);
    flyManeuverability = 'average';
    precedenceLog.push(`[Rule 1 - Template]: Large half-dragon grows wings (Fly speed ${flySpeed} ft, average).`);
  }

  // 3. Ability Modifiers (Cumulative)
  const stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
  const abilities: Record<string, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
  const abilityBreakdowns: Record<string, { base: number; template: number; net: number }> = {};

  for (const s of stats) {
    const baseMod = base.abilities[s] || 0;
    const tplMod = template.abilityModifiers[s] || 0;
    const net = baseMod + tplMod;
    abilities[s] = net;
    abilityBreakdowns[s] = { base: baseMod, template: tplMod, net };
  }
  precedenceLog.push(`[Rule 3 - General Half-Breed]: Cumulative ability adjustments: STR ${abilities.STR >= 0 ? `+${abilities.STR}` : abilities.STR}, DEX ${abilities.DEX >= 0 ? `+${abilities.DEX}` : abilities.DEX}, CON ${abilities.CON >= 0 ? `+${abilities.CON}` : abilities.CON}, INT ${abilities.INT >= 0 ? `+${abilities.INT}` : abilities.INT}, WIS ${abilities.WIS >= 0 ? `+${abilities.WIS}` : abilities.WIS}, CHA ${abilities.CHA >= 0 ? `+${abilities.CHA}` : abilities.CHA}.`);

  // 4. Natural Armor (Cumulative)
  const baseNat = base.naturalArmor || 0;
  const tplNat = template.naturalArmorBonus || 0;
  const totalNat = baseNat + tplNat;
  const naturalArmorBreakdown = { base: baseNat, template: tplNat, total: totalNat };
  precedenceLog.push(`[Rule 3 - General Half-Breed]: Natural armor is cumulative: Base (${baseNat}) + Template (+${tplNat}) = +${totalNat} Natural Armor bonus to AC.`);

  // 5. Duplicate Senses (Higher Value Wins)
  const baseDV = base.darkvisionFeet || 0;
  const tplDV = template.darkvisionFeet || 0;
  const resolvedDV = Math.max(baseDV, tplDV);
  if (baseDV > 0 && tplDV > 0) {
    precedenceLog.push(`[Rule 3 - Duplicate Higher Wins]: Darkvision: Base ${baseDV} ft vs Template ${tplDV} ft -> ${resolvedDV} ft.`);
  } else if (resolvedDV > 0) {
    precedenceLog.push(`[Rule 3]: Darkvision out to ${resolvedDV} ft.`);
  }

  const resolvedLowLight = Boolean(base.hasLowLightVision || template.hasLowLightVision);
  if (resolvedLowLight) {
    precedenceLog.push(`[Rule 3]: Retains / gains Low-Light Vision.`);
  }

  const hasBlindsight = Boolean(template.hasBlindsight);
  const blindsightFeet = template.blindsightFeet;

  // 6. Immunities & Resistances
  const damageImmunities = Array.from(new Set([...(template.damageImmunities || [])]));
  const conditionImmunities = Array.from(new Set([...(template.conditionImmunities || [])]));
  const energyResistances: Record<string, number> = { ...(template.energyResistances || {}) };

  if (template.id === 'half-dragon' && dragonVariety) {
    const dragonElementMap: Record<string, string> = {
      Black: 'Acid', Copper: 'Acid', Green: 'Acid',
      Blue: 'Electricity', Bronze: 'Electricity',
      Brass: 'Fire', Gold: 'Fire', Red: 'Fire',
      Silver: 'Cold', White: 'Cold'
    };
    const elem = dragonElementMap[dragonVariety] || 'Fire';
    if (!damageImmunities.includes(elem)) {
      damageImmunities.push(elem);
    }
    precedenceLog.push(`[Rule 1 - Template]: Immunity to ${elem} from ${dragonVariety} dragon ancestor.`);
  }

  // 7. Damage Reduction & Spell Resistance
  let damageReduction = template.damageReduction;
  if (damageReduction && damageReduction.minHD && characterLevel < damageReduction.minHD) {
    damageReduction = undefined; // Not high enough level yet
  }
  const spellResistanceText = template.spellResistanceFormula
    ? `${characterLevel + 10} (Formula: HD + 10)`
    : undefined;

  // 8. Conflicting Abilities Resolution (e.g. Slight Build vs Large / Powerful Build)
  const conflicts: Array<{ key: string; baseName: string; templateName: string; resolution: string }> = [];
  const baseConflictTraits = base.traits.filter(t => t.conflictKey);
  const tplConflictTraits = template.traits.filter(t => t.conflictKey);

  for (const bt of baseConflictTraits) {
    const matchingTpl = tplConflictTraits.find(t => t.conflictKey === bt.conflictKey);
    if (matchingTpl) {
      const choice = conflictChoices?.[bt.conflictKey!] || 'suppress';
      let resolutionText = '';
      if (choice === 'base') {
        resolutionText = `Player selected ${bt.name} from Base Creature; ${matchingTpl.name} ignored.`;
      } else if (choice === 'template') {
        resolutionText = `Player selected ${matchingTpl.name} from Template; ${bt.name} ignored.`;
      } else {
        resolutionText = `Mutually exclusive traits (${bt.name} vs. ${matchingTpl.name}) both suppressed per general rule.`;
      }
      conflicts.push({
        key: bt.conflictKey!,
        baseName: bt.name,
        templateName: matchingTpl.name,
        resolution: resolutionText
      });
      precedenceLog.push(`[Rule 3 - Conflicting Abilities]: ${resolutionText}`);
    }
  }

  // Filter base traits
  const retainedBaseTraits = base.traits.filter(t => {
    const conflict = conflicts.find(c => c.baseName === t.name);
    if (conflict && (conflictChoices?.[conflict.key] === 'suppress' || conflictChoices?.[conflict.key] === 'template')) {
      return false;
    }
    return true;
  });

  // Filter template traits
  const gainedTemplateTraits = template.traits.filter(t => {
    const conflict = conflicts.find(c => c.templateName === t.name);
    if (conflict && (conflictChoices?.[conflict.key] === 'suppress' || conflictChoices?.[conflict.key] === 'base')) {
      return false;
    }
    return true;
  });

  // 9. Racial Skill Points Rule
  let skillPointsNotice = '';
  if (hasClassLevels) {
    skillPointsNotice = `Character has 1+ class levels (Level ${characterLevel}). Per 3.5e Half-Breed rules, all template racial skill points are ignored; skill points are determined solely by class progression.`;
    precedenceLog.push(`[Rule 3 - Racial Skill Points]: Character has class levels; template racial skill points suppressed.`);
  } else {
    skillPointsNotice = `Character has 0 class levels: Template racial skill points apply: ${template.racialSkillPointsText}`;
    precedenceLog.push(`[Rule 3 - Racial Skill Points]: Character has 0 class levels; template racial skill points granted.`);
  }

  const combinedSkillBonuses: RacialSkillBonus[] = [
    ...(base.racialSkillBonuses || []),
    ...(template.racialSkillBonuses || [])
  ];
  if (combinedSkillBonuses.length > 0) {
    precedenceLog.push(`[Rule 3 - Racial Skill Bonuses]: Inherited ${combinedSkillBonuses.length} racial skill bonus definition(s). Non-stacking rule applies.`);
  }

  return {
    compositeName,
    size: resolvedSize,
    speed: netSpeed,
    speedNotes,
    flySpeed,
    flyManeuverability,
    abilities: abilities as any,
    abilityBreakdowns,
    naturalArmor: totalNat,
    naturalArmorBreakdown,
    darkvisionFeet: resolvedDV,
    hasLowLightVision: resolvedLowLight,
    hasBlindsight,
    blindsightFeet,
    damageImmunities,
    conditionImmunities,
    energyResistances,
    damageReduction,
    spellResistanceText,
    retainedBaseTraits,
    gainedTemplateTraits,
    conflicts,
    skillPointsNotice,
    precedenceLog,
    levelAdjustment: template.levelAdjustment,
    racialSkillBonuses: combinedSkillBonuses
  };
}

