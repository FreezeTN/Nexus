export interface PresetItem {
  id: string;
  name: string;
  category: 'Weapon' | 'Armor' | 'Misc';
  subCategory?: 'Simple Weapon' | 'Martial Weapon' | 'Magic Weapon' | 'Light Armor' | 'Medium Armor' | 'Heavy Armor' | 'Shield' | 'Potion' | 'Scroll' | 'Ring/Wondrous' | 'Adventuring Gear' | 'Tool/Focus';
  weight: number;
  costGp?: number;
  isMagic?: boolean;
  notes: string;
  armorAc?: number;
  armorType?: 'Heavy' | 'Medium' | 'Light' | 'Shield' | 'Bonus';
  stealthDisadvantage?: boolean;
  damageReduction?: number;
  resistance?: string;
  immunity?: string;
  hpMaxBonus?: number;
  weaponStats?: {
    attackBonus?: string;
    damage?: string;
    damageType?: string;
    range?: string;
    notes?: string;
  };
}

export const PRESET_DND_ITEMS: PresetItem[] = [
  // ==========================================
  // WEAPONS - SIMPLE MELEE & RANGED
  // ==========================================
  {
    id: 'preset-dagger',
    name: 'Dagger',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 1,
    costGp: 2,
    isMagic: false,
    notes: 'Simple melee weapon. Finesse, Light, Thrown (range 20/60).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d4',
      damageType: 'Piercing',
      range: '20/60 ft Thrown',
      notes: 'Finesse, Light'
    }
  },
  {
    id: 'preset-handaxe',
    name: 'Handaxe',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 2,
    costGp: 5,
    isMagic: false,
    notes: 'Simple melee weapon. Light, Thrown (range 20/60).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Slashing',
      range: '20/60 ft Thrown',
      notes: 'Light'
    }
  },
  {
    id: 'preset-javelin',
    name: 'Javelin',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 2,
    costGp: 0.5,
    isMagic: false,
    notes: 'Simple melee weapon. Thrown (range 30/120).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Piercing',
      range: '30/120 ft Thrown',
      notes: ''
    }
  },
  {
    id: 'preset-mace',
    name: 'Mace',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 4,
    costGp: 5,
    isMagic: false,
    notes: 'Simple melee weapon.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Bludgeoning',
      range: '5 ft Melee',
      notes: ''
    }
  },
  {
    id: 'preset-quarterstaff',
    name: 'Quarterstaff',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 4,
    costGp: 0.2,
    isMagic: false,
    notes: 'Simple melee weapon. Versatile (1d8). Can double as a spellcasting focus.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Bludgeoning',
      range: '5 ft Melee',
      notes: 'Versatile (1d8)'
    }
  },
  {
    id: 'preset-spear',
    name: 'Spear',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 3,
    costGp: 1,
    isMagic: false,
    notes: 'Simple melee weapon. Thrown (range 20/60), Versatile (1d8).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Piercing',
      range: '20/60 ft Thrown',
      notes: 'Versatile (1d8)'
    }
  },
  {
    id: 'preset-light-crossbow',
    name: 'Light Crossbow',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 5,
    costGp: 25,
    isMagic: false,
    notes: 'Simple ranged weapon. Ammunition (range 80/320), Loading, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Piercing',
      range: '80/320 ft Ranged',
      notes: 'Ammunition, Loading, Two-Handed'
    }
  },
  {
    id: 'preset-shortbow',
    name: 'Shortbow',
    category: 'Weapon',
    subCategory: 'Simple Weapon',
    weight: 2,
    costGp: 25,
    isMagic: false,
    notes: 'Simple ranged weapon. Ammunition (range 80/320), Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Piercing',
      range: '80/320 ft Ranged',
      notes: 'Ammunition, Two-Handed'
    }
  },

  // ==========================================
  // WEAPONS - MARTIAL MELEE & RANGED
  // ==========================================
  {
    id: 'preset-battleaxe',
    name: 'Battleaxe',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 4,
    costGp: 10,
    isMagic: false,
    notes: 'Martial melee weapon. Versatile (1d10).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Versatile (1d10)'
    }
  },
  {
    id: 'preset-flail',
    name: 'Flail',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 2,
    costGp: 10,
    isMagic: false,
    notes: 'Martial melee weapon.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Bludgeoning',
      range: '5 ft Melee',
      notes: ''
    }
  },
  {
    id: 'preset-glaive',
    name: 'Glaive',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 6,
    costGp: 20,
    isMagic: false,
    notes: 'Martial melee weapon. Heavy, Reach (10 ft), Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d10',
      damageType: 'Slashing',
      range: '10 ft Reach',
      notes: 'Heavy, Reach, Two-Handed'
    }
  },
  {
    id: 'preset-greataxe',
    name: 'Greataxe',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 7,
    costGp: 30,
    isMagic: false,
    notes: 'Martial melee weapon. Heavy, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d12',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Heavy, Two-Handed'
    }
  },
  {
    id: 'preset-greatsword',
    name: 'Greatsword',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 6,
    costGp: 50,
    isMagic: false,
    notes: 'Martial melee weapon. Heavy, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '2d6',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Heavy, Two-Handed'
    }
  },
  {
    id: 'preset-halberd',
    name: 'Halberd',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 6,
    costGp: 20,
    isMagic: false,
    notes: 'Martial melee weapon. Heavy, Reach (10 ft), Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d10',
      damageType: 'Slashing',
      range: '10 ft Reach',
      notes: 'Heavy, Reach, Two-Handed'
    }
  },
  {
    id: 'preset-longsword',
    name: 'Longsword',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 3,
    costGp: 15,
    isMagic: false,
    notes: 'Martial melee weapon. Versatile (1d10).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Versatile (1d10)'
    }
  },
  {
    id: 'preset-maul',
    name: 'Maul',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 10,
    costGp: 10,
    isMagic: false,
    notes: 'Martial melee weapon. Heavy, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '2d6',
      damageType: 'Bludgeoning',
      range: '5 ft Melee',
      notes: 'Heavy, Two-Handed'
    }
  },
  {
    id: 'preset-rapier',
    name: 'Rapier',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 2,
    costGp: 25,
    isMagic: false,
    notes: 'Martial melee weapon. Finesse.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Piercing',
      range: '5 ft Melee',
      notes: 'Finesse'
    }
  },
  {
    id: 'preset-scimitar',
    name: 'Scimitar',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 3,
    costGp: 25,
    isMagic: false,
    notes: 'Martial melee weapon. Finesse, Light.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Finesse, Light'
    }
  },
  {
    id: 'preset-shortsword',
    name: 'Shortsword',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 2,
    costGp: 10,
    isMagic: false,
    notes: 'Martial melee weapon. Finesse, Light.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d6',
      damageType: 'Piercing',
      range: '5 ft Melee',
      notes: 'Finesse, Light'
    }
  },
  {
    id: 'preset-warhammer',
    name: 'Warhammer',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 2,
    costGp: 15,
    isMagic: false,
    notes: 'Martial melee weapon. Versatile (1d10).',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Bludgeoning',
      range: '5 ft Melee',
      notes: 'Versatile (1d10)'
    }
  },
  {
    id: 'preset-heavy-crossbow',
    name: 'Heavy Crossbow',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 18,
    costGp: 50,
    isMagic: false,
    notes: 'Martial ranged weapon. Ammunition (range 100/400), Heavy, Loading, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d10',
      damageType: 'Piercing',
      range: '100/400 ft Ranged',
      notes: 'Heavy, Loading, Two-Handed'
    }
  },
  {
    id: 'preset-longbow',
    name: 'Longbow',
    category: 'Weapon',
    subCategory: 'Martial Weapon',
    weight: 2,
    costGp: 50,
    isMagic: false,
    notes: 'Martial ranged weapon. Ammunition (range 150/600), Heavy, Two-Handed.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8',
      damageType: 'Piercing',
      range: '150/600 ft Ranged',
      notes: 'Heavy, Two-Handed'
    }
  },

  // ==========================================
  // WEAPONS - MAGIC WEAPONS
  // ==========================================
  {
    id: 'preset-weapon-plus-1',
    name: '+1 Magic Weapon',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 3,
    costGp: 500,
    isMagic: true,
    notes: 'Uncommon magic weapon. Grants a +1 bonus to attack and damage rolls.',
    weaponStats: {
      attackBonus: '+1',
      damage: '1d8 + 1',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: '+1 Magic Weapon'
    }
  },
  {
    id: 'preset-weapon-plus-2',
    name: '+2 Magic Weapon',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 3,
    costGp: 2000,
    isMagic: true,
    notes: 'Rare magic weapon. Grants a +2 bonus to attack and damage rolls.',
    weaponStats: {
      attackBonus: '+2',
      damage: '1d8 + 2',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: '+2 Magic Weapon'
    }
  },
  {
    id: 'preset-weapon-plus-3',
    name: '+3 Magic Weapon',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 3,
    costGp: 10000,
    isMagic: true,
    notes: 'Very Rare magic weapon. Grants a +3 bonus to attack and damage rolls.',
    weaponStats: {
      attackBonus: '+3',
      damage: '1d8 + 3',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: '+3 Magic Weapon'
    }
  },
  {
    id: 'preset-flame-tongue-greatsword',
    name: 'Flame Tongue Greatsword',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 6,
    costGp: 5000,
    isMagic: true,
    notes: 'Rare magic weapon (requires attunement). Speaks command word to ignite blade dealing +2d6 Fire damage.',
    weaponStats: {
      attackBonus: '+0',
      damage: '2d6 Slashing + 2d6 Fire',
      damageType: 'Fire',
      range: '5 ft Melee',
      notes: 'Flaming blade lights 40ft radius. +2d6 Fire damage.'
    }
  },
  {
    id: 'preset-frost-brand-longsword',
    name: 'Frost Brand Longsword',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 3,
    costGp: 8000,
    isMagic: true,
    resistance: 'Fire',
    notes: 'Very Rare magic weapon (requires attunement). Deals +1d6 Cold damage on hit and grants Resistance to Fire damage.',
    weaponStats: {
      attackBonus: '+0',
      damage: '1d8 Slashing + 1d6 Cold',
      damageType: 'Cold',
      range: '5 ft Melee',
      notes: 'Grants Fire Resistance. +1d6 Cold damage.'
    }
  },
  {
    id: 'preset-sun-blade',
    name: 'Sun Blade',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 2,
    costGp: 7500,
    isMagic: true,
    notes: 'Rare magic weapon (requires attunement). +2 attack/damage, deals Radiant damage, deals +1d8 extra Radiant vs Undead.',
    weaponStats: {
      attackBonus: '+2',
      damage: '1d8 + 2',
      damageType: 'Radiant',
      range: '5 ft Melee',
      notes: 'Finesse. Pure radiant blade. +1d8 Radiant vs Undead.'
    }
  },
  {
    id: 'preset-dagger-of-venom',
    name: 'Dagger of Venom',
    category: 'Weapon',
    subCategory: 'Magic Weapon',
    weight: 1,
    costGp: 2500,
    isMagic: true,
    notes: 'Rare magic dagger. +1 bonus to attack/damage. Once per day coat blade in black poison (DC 15 CON save or 2d10 Poison & Poisoned for 1 min).',
    weaponStats: {
      attackBonus: '+1',
      damage: '1d4 + 1 Piercing + 2d10 Poison',
      damageType: 'Poison',
      range: '20/60 ft Thrown',
      notes: '+1 Dagger. DC 15 CON save vs Poisoned.'
    }
  },

  // ==========================================
  // ARMOR - LIGHT, MEDIUM, HEAVY & SHIELDS
  // ==========================================
  {
    id: 'preset-padded-armor',
    name: 'Padded Armor',
    category: 'Armor',
    subCategory: 'Light Armor',
    weight: 8,
    costGp: 5,
    isMagic: false,
    armorAc: 11,
    armorType: 'Light',
    stealthDisadvantage: true,
    notes: 'AC 11 + DEX Modifier. Disadvantage on Stealth checks.'
  },
  {
    id: 'preset-leather-armor',
    name: 'Leather Armor',
    category: 'Armor',
    subCategory: 'Light Armor',
    weight: 10,
    costGp: 10,
    isMagic: false,
    armorAc: 11,
    armorType: 'Light',
    stealthDisadvantage: false,
    notes: 'AC 11 + DEX Modifier.'
  },
  {
    id: 'preset-studded-leather',
    name: 'Studded Leather Armor',
    category: 'Armor',
    subCategory: 'Light Armor',
    weight: 13,
    costGp: 45,
    isMagic: false,
    armorAc: 12,
    armorType: 'Light',
    stealthDisadvantage: false,
    notes: 'AC 12 + DEX Modifier. Standard rogue/ranger armor.'
  },
  {
    id: 'preset-hide-armor',
    name: 'Hide Armor',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 12,
    costGp: 10,
    isMagic: false,
    armorAc: 12,
    armorType: 'Medium',
    stealthDisadvantage: false,
    notes: 'AC 12 + DEX Modifier (max +2).'
  },
  {
    id: 'preset-chain-shirt',
    name: 'Chain Shirt',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 20,
    costGp: 50,
    isMagic: false,
    armorAc: 13,
    armorType: 'Medium',
    stealthDisadvantage: false,
    notes: 'AC 13 + DEX Modifier (max +2).'
  },
  {
    id: 'preset-scale-mail',
    name: 'Scale Mail',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 45,
    costGp: 50,
    isMagic: false,
    armorAc: 14,
    armorType: 'Medium',
    stealthDisadvantage: true,
    notes: 'AC 14 + DEX Modifier (max +2). Disadvantage on Stealth.'
  },
  {
    id: 'preset-breastplate',
    name: 'Breastplate',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 20,
    costGp: 400,
    isMagic: false,
    armorAc: 14,
    armorType: 'Medium',
    stealthDisadvantage: false,
    notes: 'AC 14 + DEX Modifier (max +2). No Stealth disadvantage.'
  },
  {
    id: 'preset-half-plate',
    name: 'Half Plate Armor',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 40,
    costGp: 750,
    isMagic: false,
    armorAc: 15,
    armorType: 'Medium',
    stealthDisadvantage: true,
    notes: 'AC 15 + DEX Modifier (max +2). Disadvantage on Stealth.'
  },
  {
    id: 'preset-ring-mail',
    name: 'Ring Mail',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 40,
    costGp: 30,
    isMagic: false,
    armorAc: 14,
    armorType: 'Heavy',
    stealthDisadvantage: true,
    notes: 'AC 14. Disadvantage on Stealth.'
  },
  {
    id: 'preset-chain-mail',
    name: 'Chain Mail',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 55,
    costGp: 75,
    isMagic: false,
    armorAc: 16,
    armorType: 'Heavy',
    stealthDisadvantage: true,
    notes: 'AC 16. Requires STR 13. Disadvantage on Stealth.'
  },
  {
    id: 'preset-splint-armor',
    name: 'Splint Armor',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 60,
    costGp: 200,
    isMagic: false,
    armorAc: 17,
    armorType: 'Heavy',
    stealthDisadvantage: true,
    notes: 'AC 17. Requires STR 15. Disadvantage on Stealth.'
  },
  {
    id: 'preset-plate-armor',
    name: 'Plate Armor',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 65,
    costGp: 1500,
    isMagic: false,
    armorAc: 18,
    armorType: 'Heavy',
    stealthDisadvantage: true,
    notes: 'AC 18. Requires STR 15. Disadvantage on Stealth.'
  },
  {
    id: 'preset-shield',
    name: 'Shield',
    category: 'Armor',
    subCategory: 'Shield',
    weight: 6,
    costGp: 10,
    isMagic: false,
    armorAc: 2,
    armorType: 'Shield',
    stealthDisadvantage: false,
    notes: 'Grants +2 AC when held in one hand.'
  },
  {
    id: 'preset-shield-plus-1',
    name: '+1 Shield',
    category: 'Armor',
    subCategory: 'Shield',
    weight: 6,
    costGp: 500,
    isMagic: true,
    armorAc: 3,
    armorType: 'Shield',
    stealthDisadvantage: false,
    notes: 'Uncommon magic shield. Grants total +3 AC (+2 shield + 1 magic bonus).'
  },
  {
    id: 'preset-armor-plus-1',
    name: '+1 Armor (Any Base)',
    category: 'Armor',
    subCategory: 'Medium Armor',
    weight: 20,
    costGp: 1500,
    isMagic: true,
    armorAc: 1,
    armorType: 'Bonus',
    notes: 'Rare magic armor. Adds a flat +1 bonus to AC over base armor.'
  },
  {
    id: 'preset-adamantine-plate',
    name: 'Adamantine Plate Armor',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 65,
    costGp: 2500,
    isMagic: true,
    armorAc: 18,
    armorType: 'Heavy',
    stealthDisadvantage: true,
    damageReduction: 0,
    notes: 'Uncommon magical heavy armor. Any critical hit against you becomes a normal hit!'
  },
  {
    id: 'preset-mithral-plate',
    name: 'Mithral Plate Armor',
    category: 'Armor',
    subCategory: 'Heavy Armor',
    weight: 30,
    costGp: 2000,
    isMagic: true,
    armorAc: 18,
    armorType: 'Heavy',
    stealthDisadvantage: false,
    notes: 'Uncommon magical light metal plate. Has NO Strength requirement and NO Stealth disadvantage.'
  },

  // ==========================================
  // POTIONS & CONSUMABLES
  // ==========================================
  {
    id: 'preset-potion-healing',
    name: 'Potion of Healing',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 50,
    isMagic: true,
    notes: 'Common magic potion. Restores 2d4 + 2 hit points when consumed.'
  },
  {
    id: 'preset-potion-greater-healing',
    name: 'Potion of Greater Healing',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 150,
    isMagic: true,
    notes: 'Uncommon magic potion. Restores 4d4 + 4 hit points when consumed.'
  },
  {
    id: 'preset-potion-superior-healing',
    name: 'Potion of Superior Healing',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 450,
    isMagic: true,
    notes: 'Rare magic potion. Restores 8d4 + 8 hit points when consumed.'
  },
  {
    id: 'preset-potion-supreme-healing',
    name: 'Potion of Supreme Healing',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 1350,
    isMagic: true,
    notes: 'Very Rare magic potion. Restores 10d4 + 20 hit points when consumed.'
  },
  {
    id: 'preset-potion-invisibility',
    name: 'Potion of Invisibility',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 300,
    isMagic: true,
    notes: 'Very Rare potion. Drinking it makes you invisible for 1 hour (ends early if you attack or cast a spell).'
  },
  {
    id: 'preset-potion-speed',
    name: 'Potion of Speed',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 400,
    isMagic: true,
    notes: 'Very Rare potion. Gain effect of Haste spell for 1 minute (+2 AC, double speed, extra action).'
  },
  {
    id: 'preset-potion-resistance',
    name: 'Potion of Resistance',
    category: 'Misc',
    subCategory: 'Potion',
    weight: 0.5,
    costGp: 300,
    isMagic: true,
    notes: 'Uncommon potion. Grants resistance to one damage type (Fire/Cold/Lightning/Acid/etc) for 1 hour.'
  },
  {
    id: 'preset-spell-scroll-1st',
    name: 'Spell Scroll (1st Level)',
    category: 'Misc',
    subCategory: 'Scroll',
    weight: 0.1,
    costGp: 75,
    isMagic: true,
    notes: 'Common scroll containing a 1st-level spell (DC 13, +5 attack bonus).'
  },
  {
    id: 'preset-spell-scroll-2nd',
    name: 'Spell Scroll (2nd Level)',
    category: 'Misc',
    subCategory: 'Scroll',
    weight: 0.1,
    costGp: 150,
    isMagic: true,
    notes: 'Uncommon scroll containing a 2nd-level spell (DC 13, +5 attack bonus).'
  },
  {
    id: 'preset-spell-scroll-3rd',
    name: 'Spell Scroll (3rd Level)',
    category: 'Misc',
    subCategory: 'Scroll',
    weight: 0.1,
    costGp: 300,
    isMagic: true,
    notes: 'Uncommon scroll containing a 3rd-level spell (DC 15, +7 attack bonus).'
  },

  // ==========================================
  // RINGS, CLOAKS & WONDROUS ITEMS
  // ==========================================
  {
    id: 'preset-cloak-protection',
    name: 'Cloak of Protection',
    category: 'Armor',
    subCategory: 'Ring/Wondrous',
    weight: 3,
    costGp: 500,
    isMagic: true,
    armorAc: 1,
    armorType: 'Bonus',
    notes: 'Uncommon wondrous item (attunement). Grants +1 bonus to Armor Class and +1 to all Saving Throws.'
  },
  {
    id: 'preset-ring-protection',
    name: 'Ring of Protection',
    category: 'Armor',
    subCategory: 'Ring/Wondrous',
    weight: 0.1,
    costGp: 2000,
    isMagic: true,
    armorAc: 1,
    armorType: 'Bonus',
    notes: 'Rare ring (attunement). Grants +1 bonus to Armor Class and +1 to all Saving Throws.'
  },
  {
    id: 'preset-bracers-of-defense',
    name: 'Bracers of Defense',
    category: 'Armor',
    subCategory: 'Ring/Wondrous',
    weight: 2,
    costGp: 3000,
    isMagic: true,
    armorAc: 2,
    armorType: 'Bonus',
    notes: 'Rare bracers (attunement). Grants +2 bonus to AC while wearing no armor and using no shield.'
  },
  {
    id: 'preset-amulet-of-health',
    name: 'Amulet of Health',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 1,
    costGp: 4000,
    isMagic: true,
    hpMaxBonus: 10,
    notes: 'Rare wondrous item (attunement). Sets Constitution score to 19 (+4 mod), granting increased Max HP.'
  },
  {
    id: 'preset-bag-of-holding',
    name: 'Bag of Holding',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 15,
    costGp: 500,
    isMagic: true,
    notes: 'Uncommon wondrous item. Extradimensional space holding up to 500 lbs (64 cu ft) while weighing only 15 lbs.'
  },
  {
    id: 'preset-boots-of-elvenkind',
    name: 'Boots of Elvenkind',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 1,
    costGp: 400,
    isMagic: true,
    notes: 'Uncommon wondrous item. Steps make no sound. Advantage on Stealth checks to move silently.'
  },
  {
    id: 'preset-cloak-of-elvenkind',
    name: 'Cloak of Elvenkind',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 1,
    costGp: 500,
    isMagic: true,
    notes: 'Uncommon wondrous item (attunement). Advantage on Stealth checks to hide. Perception checks to see you have Disadvantage.'
  },
  {
    id: 'preset-gauntlets-ogre-power',
    name: 'Gauntlets of Ogre Power',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 2,
    costGp: 1500,
    isMagic: true,
    notes: 'Uncommon wondrous item (attunement). Sets Strength score to 19 (+4 mod) if base Strength is lower.'
  },
  {
    id: 'preset-ring-resistance-fire',
    name: 'Ring of Resistance (Fire)',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.1,
    costGp: 2500,
    isMagic: true,
    resistance: 'Fire',
    notes: 'Rare ring (attunement). You have Resistance to Fire damage.'
  },
  {
    id: 'preset-ring-resistance-cold',
    name: 'Ring of Resistance (Cold)',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.1,
    costGp: 2500,
    isMagic: true,
    resistance: 'Cold',
    notes: 'Rare ring (attunement). You have Resistance to Cold damage.'
  },
  {
    id: 'preset-wand-magic-missiles',
    name: 'Wand of Magic Missiles',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 1,
    costGp: 800,
    isMagic: true,
    notes: 'Uncommon wand. 7 charges. Cast 1st-level Magic Missile (1 charge) up to 7th level. Regains 1d6+1 charges daily at dawn.'
  },
  {
    id: 'preset-pearl-of-power',
    name: 'Pearl of Power',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.5,
    costGp: 1200,
    isMagic: true,
    notes: 'Uncommon wondrous item (attunement by spellcaster). Speak command word to recover one spent spell slot up to 3rd level once per day.'
  },
  {
    id: 'preset-stone-good-luck',
    name: 'Stone of Good Luck (Luckstone)',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.5,
    costGp: 1000,
    isMagic: true,
    notes: 'Uncommon wondrous item (attunement). Gain +1 bonus to Ability Checks and Saving Throws.'
  },

  // ==========================================
  // ADVENTURING GEAR & TOOLS
  // ==========================================
  {
    id: 'preset-backpack',
    name: 'Backpack',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 5,
    costGp: 2,
    isMagic: false,
    notes: 'Holds up to 1 cubic foot or 30 lbs of gear.'
  },
  {
    id: 'preset-explorers-pack',
    name: 'Explorer\'s Pack',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 59,
    costGp: 10,
    isMagic: false,
    notes: 'Includes Backpack, Bedroll, Mess Kit, Tinderbox, 10 Torches, 10 Rations, Waterskin, and 50ft Hempen Rope.'
  },
  {
    id: 'preset-dungeoneers-pack',
    name: 'Dungeoneer\'s Pack',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 61.5,
    costGp: 12,
    isMagic: false,
    notes: 'Includes Backpack, Crowbar, Hammer, 10 Pitons, 10 Torches, Tinderbox, 10 Rations, Waterskin, and 50ft Hempen Rope.'
  },
  {
    id: 'preset-healers-kit',
    name: 'Healer\'s Kit',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 3,
    costGp: 5,
    isMagic: false,
    notes: '10 uses. As an action, spend 1 use to stabilize a dying creature (0 HP) without needing a Wisdom (Medicine) check.'
  },
  {
    id: 'preset-thieves-tools',
    name: 'Thieves\' Tools',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 1,
    costGp: 25,
    isMagic: false,
    notes: 'Includes file, lock picks, mirror, scissors, pliers. Adds Proficiency bonus to picking locks and disarming traps.'
  },
  {
    id: 'preset-arcane-focus-crystal',
    name: 'Arcane Focus (Crystal / Wand)',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 1,
    costGp: 10,
    isMagic: false,
    notes: 'Special item for Wizards, Sorcerers, and Warlocks to channel spells without material components.'
  },
  {
    id: 'preset-holy-symbol',
    name: 'Holy Symbol (Amulet / Relic)',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 1,
    costGp: 5,
    isMagic: false,
    notes: 'Sacred symbol for Clerics and Paladins to channel divine spells and Channel Divinity.'
  },
  {
    id: 'preset-druidic-focus',
    name: 'Druidic Focus (Mistletoe / Yew Wand)',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 1,
    costGp: 1,
    isMagic: false,
    notes: 'Sacred focus for Druids to channel primal nature magic.'
  },
  {
    id: 'preset-spellbook',
    name: 'Spellbook',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 3,
    costGp: 50,
    isMagic: false,
    notes: 'Essential leather-bound book containing a Wizard\'s recorded spells.'
  },
  {
    id: 'preset-component-pouch',
    name: 'Component Pouch',
    category: 'Misc',
    subCategory: 'Tool/Focus',
    weight: 2,
    costGp: 25,
    isMagic: false,
    notes: 'Belt pouch filled with all standard non-costly material components for casting spells.'
  },
  {
    id: 'preset-rope-hempen',
    name: 'Rope, Hempen (50 feet)',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 10,
    costGp: 1,
    isMagic: false,
    notes: '50 feet of sturdy hempen rope. Has 2 HP and can be burst with a DC 17 Strength check.'
  },
  {
    id: 'preset-crowbar',
    name: 'Crowbar',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 5,
    costGp: 2,
    isMagic: false,
    notes: 'Using a crowbar grants Advantage on Strength checks where leverage can be applied.'
  },
  {
    id: 'preset-rations',
    name: 'Rations (1 day)',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 2,
    costGp: 0.5,
    isMagic: false,
    notes: 'Compact dry food for one day (jerky, dried fruit, hardtack, nuts).'
  },
  {
    id: 'preset-torch',
    name: 'Torch',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 1,
    costGp: 0.01,
    isMagic: false,
    notes: 'Burns for 1 hour, shedding bright light in 20ft radius and dim light for an additional 20ft.'
  },
  {
    id: 'preset-tinderbox',
    name: 'Tinderbox',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 1,
    costGp: 0.5,
    isMagic: false,
    notes: 'Contains flint, fire steel, and tinder used to kindle a fire.'
  },
  {
    id: 'preset-periapt-poison',
    name: 'Periapt of Proof against Poison',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.5,
    costGp: 5000,
    isMagic: true,
    immunity: 'Poison',
    notes: 'Rare wondrous item. You are immune to Poison damage and the Poisoned condition while wearing this pendant.'
  },
  {
    id: 'preset-ring-elemental-immunity-fire',
    name: 'Ring of Elemental Immunity (Fire)',
    category: 'Misc',
    subCategory: 'Ring/Wondrous',
    weight: 0.1,
    costGp: 15000,
    isMagic: true,
    immunity: 'Fire',
    notes: 'Legendary magic ring (attunement). You have complete Immunity to Fire damage.'
  },
  {
    id: 'preset-waterskin',
    name: 'Waterskin',
    category: 'Misc',
    subCategory: 'Adventuring Gear',
    weight: 5,
    costGp: 0.2,
    isMagic: false,
    notes: 'Holds 4 pints of liquid (full weight 5 lbs).'
  }
];
