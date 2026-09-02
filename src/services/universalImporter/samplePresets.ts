export interface SamplePreset {
  id: string;
  name: string;
  category: string;
  format: 'foundry_vtt' | '5etools' | 'dndbeyond' | 'markdown' | 'nexus';
  description: string;
  rawContent: string;
}

export const SAMPLE_IMPORT_PRESETS: SamplePreset[] = [
  {
    id: 'sample-5etools-dragon',
    name: 'Adult Red Dragon (5eTools)',
    category: 'Monsters & Bestiary',
    format: '5etools',
    description: 'Classic CR 17 legendary dragon statblock exported in standard 5eTools format.',
    rawContent: JSON.stringify({
      name: 'Adult Red Dragon',
      source: 'MM',
      page: 98,
      size: ['H'],
      type: 'dragon',
      alignment: ['C', 'E'],
      ac: [19],
      hp: {
        average: 256,
        formula: '19d12 + 133'
      },
      speed: {
        walk: 40,
        climb: 40,
        fly: 80
      },
      str: 27,
      dex: 10,
      con: 25,
      int: 16,
      wis: 13,
      cha: 21,
      save: {
        dex: '+6',
        con: '+13',
        wis: '+7',
        cha: '+11'
      },
      skill: {
        perception: '+13',
        stealth: '+6'
      },
      cr: '17',
      trait: [
        {
          name: 'Legendary Resistance (3/Day)',
          entries: ['If the dragon fails a saving throw, it can choose to succeed instead.']
        }
      ],
      action: [
        {
          name: 'Multiattack',
          entries: ['The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.']
        },
        {
          name: 'Bite',
          entries: ['{@atk mw} {@hit 14} to hit, reach 10 ft., one target. {@h}19 ({@damage 2d10 + 8}) piercing damage plus 7 ({@damage 2d6}) fire damage.']
        },
        {
          name: 'Claw',
          entries: ['{@atk mw} {@hit 14} to hit, reach 5 ft., one target. {@h}15 ({@damage 2d6 + 8}) slashing damage.']
        },
        {
          name: 'Fire Breath (Recharge 5-6)',
          entries: ['The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 63 (18d6) fire damage on a failed save, or half as much on a successful one.']
        }
      ]
    }, null, 2)
  },
  {
    id: 'sample-fvtt-rogue',
    name: 'Lyra Shadowstride (Foundry VTT)',
    category: 'Player Characters',
    format: 'foundry_vtt',
    description: 'Level 5 Elf Rogue Arcane Trickster exported directly from Foundry VTT actor sheet.',
    rawContent: JSON.stringify({
      name: 'Lyra Shadowstride',
      type: 'character',
      system: {
        abilities: {
          str: { value: 10, proficient: 0 },
          dex: { value: 18, proficient: 1 },
          con: { value: 14, proficient: 0 },
          int: { value: 14, proficient: 1 },
          wis: { value: 12, proficient: 0 },
          cha: { value: 10, proficient: 0 }
        },
        attributes: {
          hp: { value: 38, max: 38, temp: 0 },
          ac: { value: 16 },
          movement: { walk: 35 }
        },
        details: {
          race: 'Wood Elf',
          class: 'Rogue',
          level: 5,
          alignment: 'Chaotic Good',
          background: 'Urchin'
        },
        currency: { cp: 15, sp: 24, ep: 0, gp: 140, pp: 2 }
      },
      items: [
        {
          _id: 'rapier-1',
          name: 'Rapier of Swiftness',
          type: 'weapon',
          system: {
            attackBonus: 7,
            damage: { parts: [['1d8 + 4', 'piercing']] },
            range: { value: 5, units: 'ft' },
            equipped: true
          }
        },
        {
          _id: 'shortbow-1',
          name: 'Shortbow',
          type: 'weapon',
          system: {
            attackBonus: 7,
            damage: { parts: [['1d6 + 4', 'piercing']] },
            range: { value: 80, units: 'ft' },
            equipped: true
          }
        },
        {
          _id: 'sneak-atk',
          name: 'Sneak Attack (3d6)',
          type: 'feat',
          system: {
            description: { value: 'Deal extra 3d6 damage once per turn to one creature hit with advantage or adjacent ally.' }
          }
        },
        {
          _id: 'spell-invis',
          name: 'Invisibility',
          type: 'spell',
          system: {
            level: 2,
            school: 'Illusion',
            description: { value: 'A creature you touch becomes invisible until the spell ends.' },
            preparation: { prepared: true }
          }
        }
      ]
    }, null, 2)
  },
  {
    id: 'sample-dndbeyond-wizard',
    name: 'Eldrin the Astromancer (D&D Beyond)',
    category: 'Player Characters',
    format: 'dndbeyond',
    description: 'Level 6 High Elf Wizard exported in D&D Beyond JSON format.',
    rawContent: JSON.stringify({
      character: {
        name: 'Eldrin the Astromancer',
        baseHitPoints: 34,
        currentHitPoints: 34,
        temporaryHitPoints: 0,
        alignmentId: 2,
        race: { fullName: 'High Elf', weightSpeeds: { normal: { walk: 30 } } },
        background: { definition: { name: 'Sage' } },
        stats: [
          { id: 1, value: 8 },
          { id: 2, value: 14 },
          { id: 3, value: 14 },
          { id: 4, value: 18 },
          { id: 5, value: 12 },
          { id: 6, value: 10 }
        ],
        classes: [
          {
            definition: { name: 'Wizard', hitDice: 6 },
            subclassDefinition: { name: 'School of Evocation' },
            level: 6,
            classFeatures: [
              { definition: { name: 'Sculpt Spells', description: 'Protect allies from evocation area effects.' } }
            ]
          }
        ],
        inventory: [
          {
            definition: { name: 'Quarterstaff', filterType: 'Weapon', weight: 4, damage: { diceString: '1d6' } },
            quantity: 1,
            equipped: true
          },
          {
            definition: { name: 'Spellbook', filterType: 'Gear', weight: 3, cost: 50 },
            quantity: 1,
            equipped: true
          }
        ],
        spells: {
          class: [
            { definition: { name: 'Fireball', level: 3, school: 'Evocation', activation: { activationType: 1 } }, prepared: true },
            { definition: { name: 'Misty Step', level: 2, school: 'Conjuration', activation: { activationType: 2 } }, prepared: true },
            { definition: { name: 'Shield', level: 1, school: 'Abjuration', activation: { activationType: 3 } }, prepared: true }
          ]
        },
        currencies: { cp: 0, sp: 10, ep: 0, gp: 250, pp: 5 }
      }
    }, null, 2)
  },
  {
    id: 'sample-markdown-goblin',
    name: 'Goblin Boss (Markdown Statblock)',
    category: 'Markdown Statblocks',
    format: 'markdown',
    description: 'Formatted markdown statblock formatted with standard RPG table syntax.',
    rawContent: `# Goblin Boss
*Small humanoid (goblinoid), neutral evil*
___
**Armor Class** 17 (chain shirt, shield)
**Hit Points** 21 (6d6)
**Speed** 30 ft.
___
| STR | DEX | CON | INT | WIS | CHA |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 10 (+0) | 14 (+2) | 10 (+0) | 10 (+0) | 8 (-1) | 10 (+0) |
___
**Skills** Stealth +6
**Senses** darkvision 60 ft., passive Perception 9
**Languages** Common, Goblin
**Challenge** 1 (200 XP)
___
### Actions
**Multiattack.** The goblin makes two attacks with its scimitar. The second attack has disadvantage.
**Scimitar.** *Melee Weapon Attack:* +4 to hit, reach 5 ft., one target. *Hit:* 5 (1d6 + 2) slashing damage.
**Javelin.** *Melee or Ranged Weapon Attack:* +4 to hit, reach 5 ft. or range 30/120 ft., one target. *Hit:* 5 (1d6 + 2) piercing damage.`
  }
];
