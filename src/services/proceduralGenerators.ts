import { RuleEdition } from '../types';
import {
  GeneratedEncounter,
  GeneratedTreasure,
  GeneratedSessionSummary,
  GeneratedRulesAdjudication,
  GeneratedDungeonHazard,
  EntityType
} from './geminiService';

// Random helper
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = (count: number, sides: number): number => {
  let total = 0;
  for (let i = 0; i < count; i++) total += randInt(1, sides);
  return total;
};

// ==========================================
// 1. TREASURE & LOOT PROCEDURAL GENERATOR
// ==========================================
export function generateProceduralTreasure(
  tier: string = 'CR 5-10 (Tier 2)',
  containerType: string = 'Dungeon Boss Iron Chest',
  customKeywords: string = '',
  edition: RuleEdition = '5e'
): GeneratedTreasure {
  const isTier1 = tier.includes('0-4') || tier.includes('Tier 1');
  const isTier2 = tier.includes('5-10') || tier.includes('Tier 2');
  const isTier3 = tier.includes('11-16') || tier.includes('Tier 3');
  const isTier4 = tier.includes('17+') || tier.includes('Tier 4');

  // Coins by Tier (DMG p.137 hoard tables)
  let cp = 0;
  let sp = 0;
  let ep = 0;
  let gp = 0;
  let pp = 0;

  if (isTier1) {
    cp = rollDice(6, 6) * 100;
    sp = rollDice(3, 6) * 100;
    gp = rollDice(2, 6) * 10;
  } else if (isTier2) {
    cp = rollDice(2, 6) * 100;
    sp = rollDice(2, 6) * 1000;
    gp = rollDice(6, 6) * 100;
    pp = rollDice(3, 6) * 10;
  } else if (isTier3) {
    gp = rollDice(4, 6) * 1000;
    pp = rollDice(5, 6) * 100;
  } else {
    gp = rollDice(12, 6) * 1000;
    pp = rollDice(8, 6) * 1000;
  }

  const totalGpEquivalent = Math.round(cp * 0.01 + sp * 0.1 + ep * 0.5 + gp + pp * 10);

  // Gemstones & Art Objects
  const gemPoolTier1 = [
    { name: 'Polished Azurite (10 GP)', valueGp: 10, description: 'Opaque deep blue mottled with azure veins.' },
    { name: 'Banded Agate (10 GP)', valueGp: 10, description: 'Translucent stone striped with brown and cream bands.' },
    { name: 'Tiger Eye (10 GP)', valueGp: 10, description: 'Rich brown stone with golden chatoyant sheen.' },
    { name: 'Silver Ewer with Filigree (25 GP)', valueGp: 25, description: 'Finely engraved silver drinking vessel depicting woodland stags.' },
    { name: 'Carved Bone Statuette (25 GP)', valueGp: 25, description: 'Intricately etched ivory figurine of an ancient guardian.' }
  ];

  const gemPoolTier2 = [
    { name: 'Bloodstone Gem (50 GP)', valueGp: 50, description: 'Dark green chalcedony flecked with crimson jasper spots.' },
    { name: 'Star Rose Quartz (50 GP)', valueGp: 50, description: 'Translucent rosy pink stone with asterism light reflection.' },
    { name: 'Gilded Moonstone (50 GP)', valueGp: 50, description: 'Glowing opalescent gem reflecting soft lunar hues.' },
    { name: 'Golden Chalice with Inlaid Emeralds (250 GP)', valueGp: 250, description: 'Royal ceremonial goblet fashioned from pure dwarven gold.' },
    { name: 'Embroidered Silk Tapestry (250 GP)', valueGp: 250, description: 'Vibrant silk hanging depicting an eclipse over an ancient fortress.' }
  ];

  const gemPoolTier3 = [
    { name: 'Flawless Black Pearl (500 GP)', valueGp: 500, description: 'Lustrous midnight-hued sphere harvested from abyssal ocean trenches.' },
    { name: 'Deep Blue Sapphire (1,000 GP)', valueGp: 1000, description: 'Brilliant facet-cut royal blue gem radiating cold elemental energy.' },
    { name: 'Platinum Ring with Fiery Ruby (1,000 GP)', valueGp: 1000, description: 'Archmage focus ring engraved with ancient Draconic ward runes.' },
    { name: 'Jeweled Dragon Mask (750 GP)', valueGp: 750, description: 'Ceremonial brass and gold visor with faceted garnet dragon eyes.' }
  ];

  const gemPoolTier4 = [
    { name: 'Astral Diamond (5,000 GP)', valueGp: 5000, description: 'Crystalline shard condensed from raw Astral plane weave.' },
    { name: 'Flawless Jacinth (5,000 GP)', valueGp: 5000, description: 'Translucent fiery orange gemstone warm to the touch.' },
    { name: 'Crown of the Sun Emperor (7,500 GP)', valueGp: 7500, description: 'Solid platinum diadem adorned with 12 radiant star sapphires.' }
  ];

  let selectedGemPool = isTier1 ? gemPoolTier1 : isTier2 ? gemPoolTier2 : isTier3 ? gemPoolTier3 : gemPoolTier4;
  const gemCount = randInt(2, 4);
  const gemstonesAndArt: Array<{ name: string; valueGp: number; description: string }> = [];
  for (let i = 0; i < gemCount; i++) {
    gemstonesAndArt.push(pick(selectedGemPool));
  }

  // Magic Items Pool by Tier
  const magicItemsTier1 = [
    {
      name: 'Potion of Healing (Greater)',
      itemType: 'Potion' as const,
      rarity: 'Uncommon' as const,
      attunement: false,
      costGp: 150,
      notes: 'A character who drinks this crimson, effervescent potion regains 4d4 + 4 hit points.'
    },
    {
      name: 'Spell Scroll (2nd Level: Misty Step)',
      itemType: 'Scroll' as const,
      rarity: 'Uncommon' as const,
      attunement: false,
      costGp: 100,
      notes: 'A spell scroll bears the words of a single spell, written in a mystical cipher. Casts Misty Step as a bonus action (30ft teleport).'
    },
    {
      name: '+1 Moon-Touched Longsword',
      itemType: 'Weapon' as const,
      rarity: 'Common' as const,
      attunement: false,
      costGp: 200,
      notes: 'In darkness, the unsheathed blade sheds moonlight creating bright light in a 15-foot radius and dim light for an additional 15 feet.',
      weaponStats: { attackBonus: 1, damage: '1d8+1', damageType: 'Slashing (Magical)', notes: 'Versatile (1d10+1)' }
    },
    {
      name: 'Cloak of Elvenkind',
      itemType: 'Wondrous Item' as const,
      rarity: 'Uncommon' as const,
      attunement: true,
      costGp: 300,
      notes: 'While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks made to hide.'
    }
  ];

  const magicItemsTier2 = [
    {
      name: '+1 Dragon Slayer Battleaxe',
      itemType: 'Weapon' as const,
      rarity: 'Rare' as const,
      attunement: true,
      costGp: 1200,
      notes: 'You gain a +1 bonus to attack and damage rolls made with this magic weapon. When you hit a dragon with this weapon, the dragon takes an extra 3d6 slashing damage.',
      weaponStats: { attackBonus: 1, damage: '1d8+1 (3d6 vs Dragons)', damageType: 'Slashing', notes: 'Versatile (1d10+1)' }
    },
    {
      name: 'Ring of Protection (+1 AC & Saves)',
      itemType: 'Ring' as const,
      rarity: 'Rare' as const,
      attunement: true,
      costGp: 1500,
      notes: 'You gain a +1 bonus to Armor Class and saving throws while wearing this ring.'
    },
    {
      name: 'Wand of Fireballs (7 Charges)',
      itemType: 'Wondrous Item' as const,
      rarity: 'Rare' as const,
      attunement: true,
      costGp: 1800,
      notes: 'This wand has 7 charges. While holding it, you can use an action to expend 1 or more of its charges to cast the Fireball spell (save DC 15) from it. Regains 1d6 + 1 expended charges daily at dawn.'
    },
    {
      name: 'Elixir of Health & Superior Healing',
      itemType: 'Potion' as const,
      rarity: 'Rare' as const,
      attunement: false,
      costGp: 500,
      notes: 'Drinking this potion cures any disease and removes the blinded, deafened, paralyzed, and poisoned conditions, while restoring 8d4 + 8 hit points.'
    },
    {
      name: 'Boots of Speed',
      itemType: 'Wondrous Item' as const,
      rarity: 'Rare' as const,
      attunement: true,
      costGp: 1400,
      notes: 'While you wear these boots, you can use a bonus action and click the boot heels together. If you do, the boots double your walking speed, and any creature that makes an opportunity attack against you has disadvantage.'
    }
  ];

  const magicItemsTier3 = [
    {
      name: '+2 Sun Blade',
      itemType: 'Weapon' as const,
      rarity: 'Rare' as const,
      attunement: true,
      costGp: 4500,
      notes: 'This item appears to be a longsword hilt. While grasping the hilt, you can use a bonus action to cause a blade of pure radiance to spring into existence. Deals radiant damage (+1d8 vs Undead).',
      weaponStats: { attackBonus: 2, damage: '1d8+2 Radiant', damageType: 'Radiant', notes: 'Finesse, Versatile' }
    },
    {
      name: 'Armor of Invulnerability (+2 Plate)',
      itemType: 'Armor' as const,
      rarity: 'Very Rare' as const,
      attunement: true,
      costGp: 6000,
      notes: 'You have resistance to nonmagical damage while you wear this armor. Additionally, you can use an action to make yourself immune to nonmagical damage for 10 minutes (1/dawn).',
      armorAc: 20
    },
    {
      name: 'Staff of Power (+2 AC/Saves & 20 Spells)',
      itemType: 'Wondrous Item' as const,
      rarity: 'Very Rare' as const,
      attunement: true,
      costGp: 9500,
      notes: 'Grants +2 bonus to AC, saving throws, and spell attack rolls. Holds 20 charges to cast Cone of Cold, Fireball, Hold Monster, Invisibility, Lightning Bolt, Wall of Force, and Globe of Invulnerability.'
    }
  ];

  const magicItemsTier4 = [
    {
      name: 'Holy Avenger Greatsword (+3)',
      itemType: 'Weapon' as const,
      rarity: 'Legendary' as const,
      attunement: true,
      costGp: 25000,
      notes: 'You gain a +3 bonus to attack and damage rolls. Deals extra 2d10 radiant damage against fiends and undead. Emits a 30-foot aura granting advantage on all saving throws against spells to you and allies.',
      weaponStats: { attackBonus: 3, damage: '2d6+3 (+2d10 vs Fiends/Undead)', damageType: 'Slashing / Radiant', notes: 'Heavy, Two-Handed' }
    },
    {
      name: 'Ring of Three Wishes',
      itemType: 'Ring' as const,
      rarity: 'Legendary' as const,
      attunement: false,
      costGp: 50000,
      notes: 'While wearing this ring, you can use an action to expend 1 of its 3 charges to cast the Wish spell. Inactive when 0 charges remain.'
    }
  ];

  let magicItemPool = isTier1 ? magicItemsTier1 : isTier2 ? magicItemsTier2 : isTier3 ? magicItemsTier3 : magicItemsTier4;
  const itemCount = isTier1 ? randInt(1, 2) : isTier2 ? randInt(2, 3) : randInt(2, 4);
  const shuffled = [...magicItemPool].sort(() => Math.random() - 0.5);
  const magicItems = shuffled.slice(0, itemCount);

  const flavorTitles = [
    `${containerType} of the Arcane Wardens`,
    `Sanctum Reliquary: ${customKeywords || 'Gilded Spoils'}`,
    `Hoard of the Sunken Sovereign`,
    `Forgotten Vault Spoils (${tier})`
  ];

  const loreOrigins = [
    `Accumulated across centuries of tactical conquest by high-ranking commanders, sealed with dwarven locking wards.`,
    `Recovered from the inner sanctum of a fallen archmage, containing unspent reagents, imperial tithes, and enchanted weaponry.`,
    `The gathered tribute of a ferocious beast warlord, hidden beneath runic floor slabs and preserved in oilcloth.`
  ];

  return {
    title: pick(flavorTitles),
    crTier: tier,
    wealth: { cp, sp, ep, gp, pp },
    totalGpEquivalent,
    gemstonesAndArt,
    magicItems,
    loreOrigin: pick(loreOrigins)
  };
}

// ==========================================
// 2. QUICK NPC PROCEDURAL GENERATOR
// ==========================================
export function generateProceduralNpc(
  archetype: string = 'Tavern Bartender & Information Broker',
  tone: string = 'Mysterious & Suspicious',
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  level: number = 3
): any {
  const firstNames = ['Bram', 'Vesper', 'Cassian', 'Mireille', 'Elowen', 'Corvus', 'Thorne', 'Zephyr', 'Orla', 'Gideon'];
  const lastNames = ['Nightwhisper', 'Ironwood', 'Silverleaf', 'Ashford', 'Duskbane', 'Grimm', 'Vane', 'Ravencrest', 'Blackstone'];
  const races = ['Human', 'Half-Elf', 'Dwarf', 'Tiefling', 'Elf', 'Gnome', 'Halfling', 'Dragonborn'];

  const name = `${pick(firstNames)} ${pick(lastNames)}`;
  const race = pick(races);
  const hpMax = Math.max(12, level * 7 + randInt(2, 10));

  return {
    id: `npc_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    race,
    characterClass: archetype.split('&')[0].trim(),
    subclass: archetype,
    level,
    background: 'Local Guild Specialist',
    alignment: pick(['Neutral Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Neutral Evil']),
    experiencePoints: level * 1000,
    edition,
    isMonster: false,
    hpMax,
    hpCurrent: hpMax,
    hpTemp: 0,
    hitDiceTotal: `${level}d8 + ${level * 2}`,
    hitDiceCurrent: level,
    armorClass: 12 + randInt(0, 4),
    initiativeBonus: randInt(0, 3),
    speed: 30,
    inspiration: false,
    deathSavesSuccesses: 0,
    deathSavesFailures: 0,
    abilities: {
      STR: { score: 10 + randInt(0, 4) },
      DEX: { score: 12 + randInt(0, 4) },
      CON: { score: 12 + randInt(0, 3) },
      INT: { score: 13 + randInt(0, 3) },
      WIS: { score: 12 + randInt(0, 4) },
      CHA: { score: 13 + randInt(0, 4) }
    },
    savingThrowProficiencies: ['WIS', 'CHA'],
    skills: ['Insight', 'Perception', 'Deception', 'Persuasion'],
    attacks: [
      {
        id: 'atk_1',
        name: 'Hidden Dagger / Cane Sword',
        attackBonus: 4,
        damage: '1d4 + 2',
        damageType: 'Piercing',
        range: '5 ft. / (20/60 ft.)',
        notes: 'Finesse, Light, Concealable'
      },
      {
        id: 'atk_2',
        name: 'Light Crossbow',
        attackBonus: 4,
        damage: '1d8 + 2',
        damageType: 'Piercing',
        range: '80/320 ft.',
        notes: 'Ammunition, Loading, Two-Handed'
      }
    ],
    classFeatures: [
      {
        id: 'feat_1',
        name: 'Ear to the Ground',
        source: 'Archetype Trait',
        description: 'Advantage on Insight checks made to detect lies during commercial negotiation or tavern whispers.'
      },
      {
        id: 'feat_2',
        name: 'Clandestine Contacts',
        source: 'Background',
        description: 'Can secure black-market trade conduits, safehouse access, or smuggling passages within 24 hours.'
      }
    ],
    wealth: {
      cp: randInt(10, 50),
      sp: randInt(20, 80),
      ep: 0,
      gp: randInt(15, 65),
      pp: randInt(0, 2)
    },
    inventory: [
      { name: 'Finely Tailored Cloak', quantity: 1, weight: 3, isMagic: false, costGp: 15, notes: 'Contains hidden interior pockets.', itemType: 'Gear' },
      { name: 'Ledger with Cyphered Names', quantity: 1, weight: 1, isMagic: false, costGp: 25, notes: 'Requires DC 15 Investigation to decode.', itemType: 'Misc' },
      { name: 'Potion of Healing', quantity: 2, weight: 1, isMagic: true, costGp: 50, notes: 'Restores 2d4+2 HP.', itemType: 'Potion' }
    ],
    personalityTraits: `Speaks with a deliberate, calm cadence. ${tone}. Observes hands and eye movements closely.`,
    ideals: 'Information is the only true currency that never loses its purchasing power.',
    bonds: 'Loyal to the tavern or network that sheltered them when their home province fell.',
    flaws: 'Keeps dark secrets even from trusted allies; always prepares an emergency escape hatch.',
    backstory: customPrompt || `A seasoned operative who established deep roots in the settlement. Operates as ${archetype}, maintaining an extensive network of scouts and informants.`
  };
}

// ==========================================
// 3. ENCOUNTER PROCEDURAL BUILDER
// ==========================================
export function generateProceduralEncounter(
  partySize: number = 4,
  partyLevel: number = 3,
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly' = 'Medium',
  environment: string = 'Dungeon Crypt / Ancient Ruins',
  customPrompt: string = '',
  edition: RuleEdition = '5e'
): GeneratedEncounter {
  const isDeadly = difficulty === 'Deadly';
  const enemyCount = isDeadly ? 2 : randInt(3, 5);

  const cryptEnemies = [
    {
      name: 'Crypt Wight Champion',
      count: 1,
      cr: String(Math.max(2, partyLevel)),
      role: 'Frontline Reaver & Commander',
      tacticalNotes: 'Uses Life Drain on bloodied PCs; commands skeleton archers from half-cover.',
      hpMax: 45 + partyLevel * 5,
      armorClass: 15,
      initiativeBonus: 2,
      attacks: [
        { id: 'a1', name: 'Life Drain Longsword', attackBonus: 5, damage: '1d8+3 slashing + 1d6 necrotic', damageType: 'Slashing / Necrotic', range: '5 ft.', notes: 'Target DC 13 CON or Max HP reduced' }
      ],
      abilities: { STR: { score: 16 }, DEX: { score: 14 }, CON: { score: 16 }, INT: { score: 10 }, WIS: { score: 13 }, CHA: { score: 15 } }
    },
    {
      name: 'Skeletal Deadeye Scouts',
      count: Math.max(2, partySize - 1),
      cr: '1/2',
      role: 'Ranged Harassers',
      tacticalNotes: 'Positioned on elevated 10ft stone ledges with 3/4 cover (+5 AC bonus).',
      hpMax: 16,
      armorClass: 14,
      initiativeBonus: 3,
      attacks: [
        { id: 'a2', name: 'Shortbow', attackBonus: 4, damage: '1d6+2 piercing', damageType: 'Piercing', range: '80/320 ft.', notes: 'Fires from elevated battlement' }
      ],
      abilities: { STR: { score: 10 }, DEX: { score: 16 }, CON: { score: 12 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 5 } }
    }
  ];

  return {
    name: `The Tomb of the Blackened Sun (${difficulty})`,
    difficulty,
    environment,
    description: `A grand sepulcher lined with decaying sarcophagi. The center chamber holds a raised dais where unholy green flame illuminates ancient glyphs. The air smells of ozone and petrified bone.`,
    enemies: cryptEnemies,
    lootAndRewards: {
      xpTotal: partyLevel * partySize * (isDeadly ? 300 : 150),
      goldGp: partyLevel * 45 + randInt(20, 80),
      items: [
        { name: 'Potion of Greater Healing', costGp: 150, isMagic: true, itemType: 'Potion', notes: 'Restores 4d4+4 HP' },
        { name: 'Ancient Obsidian Signet Ring', costGp: 75, isMagic: false, itemType: 'Misc', notes: 'Engraved with forgotten dynasty coat of arms' }
      ]
    },
    tacticsAndPhases: `Phase 1: Skeletal archers rain arrows from balconies while Wight advances. Phase 2 (Wight at 50% HP): Sarcophagi doors burst open creating difficult terrain rubble and unleashing grasping skeletal hands (DC 13 STR save or Restrained for 1 turn).`
  };
}

// ==========================================
// 4. DUNGEON HAZARD PROCEDURAL GENERATOR
// ==========================================
export function generateProceduralDungeon(
  archetype: string = 'Trapped Arcane Vault',
  threatLevel: string = 'Moderate',
  customPrompt: string = '',
  edition: RuleEdition = '5e'
): GeneratedDungeonHazard {
  return {
    roomName: 'The Chamber of Resonant Runes',
    sensoryDescription: 'The chamber is shrouded in deep gloom, broken only by pulsating violet glyphs carved into floor tiles. A rhythmic hum vibrates in your chest, and the air tastes of sulfur and raw static electricity.',
    dimensionsAndLighting: '50ft x 40ft rectangular hall, 25ft vaulted ceiling. Dim light within 10ft of each glowing rune pillar; darkness elsewhere.',
    dynamicHazards: [
      {
        name: 'Pressure-Triggered Lightning Arc',
        trigger: 'Stepping on any tile adjacent to the central rune pillar without speaking the command word.',
        dcCheck: 'DC 14 Dexterity saving throw or DC 15 Thieves\' Tools check to disarm the conductive floor plates.',
        damageOrEffect: 'Takes 3d10 Lightning damage on a failed save, or half as much on a successful one.',
        countermeasure: 'Grounding the central copper rod using a metal chain or casting Dispel Magic (DC 13).'
      },
      {
        name: 'Crushing Gravity Field',
        trigger: 'Pulling the iron lever on the north wall without deactivating the counter-weight.',
        dcCheck: 'DC 14 Strength saving throw.',
        damageOrEffect: 'Movement speed reduced to 0 and takes 2d8 Force damage per round until the lever is reset.',
        countermeasure: 'DC 13 Athletics check to wedge an iron crowbar under the fulcrum gear.'
      }
    ],
    tacticalFeatures: [
      {
        feature: 'Heavy Stone Sarcophagi & Pillars',
        combatBenefit: 'Provides Three-Quarters Cover (+5 AC and DEX saves) against ranged spells and arrows.'
      },
      {
        feature: 'Elevated Altar Dais (5ft height)',
        combatBenefit: 'Melee attacks made from the high ground gain +1 bonus to attack rolls against targets below.'
      }
    ],
    secretOrHiddenFeature: {
      description: 'A hollow flagstone behind the west gargoyle concealing a velvet pouch with a bronze key and a gemstone.',
      perceptionDc: 14,
      rewardOrShortcut: 'Contains a Star Ruby (250 GP) and the vault bypass key that disarms all lightning floor runes.'
    }
  };
}

// ==========================================
// 5. SESSION CHRONICLE PROCEDURAL RECAP
// ==========================================
export function generateProceduralSessionSummary(
  notes: string = '',
  focus: string = 'Balanced Recap',
  edition: RuleEdition = '5e'
): GeneratedSessionSummary {
  return {
    title: 'Episode: Shadows Across the Frontier',
    previouslyOn: `When we last left our intrepid heroes, they ventured into the heart of the contested borderlands. Through cunning strategy and raw resolve, the party braved ambushes and unlocked secrets that could alter the fate of the realm.`,
    keyEvents: [
      {
        title: 'The Breach at the Sunken Gate',
        description: 'The party dismantled guardian defenses, deciphered ancient gate glyphs, and successfully crossed the threshold into the lost complex.',
        participants: ['The Adventuring Party', 'Guardian Automatons']
      },
      {
        title: 'Clash in the Flooded Crypt',
        description: 'A fierce battle against elite sentinels where tactical positioning and crowd control turned the tide of combat.',
        participants: ['Frontline Heroes', 'Crypt Sentinels']
      }
    ],
    keyVictoriesAndCasualties: 'The party secured the ancient relic without permanent casualties, though spell slots and healing draughts were heavily taxed.',
    xpAndLootDistributed: {
      xpPerPlayer: 650,
      goldDistributedGp: 250,
      notableItems: ['Runic Key of the Sunken Arch', '2x Potions of Healing', 'Ancient Map Fragment']
    },
    npcRelationsChanged: [
      {
        npcName: 'Guildmaster Drake',
        faction: 'Merchants League',
        newStanding: 'Friendly',
        notes: 'Impressed by the recovery of the stolen ledger and shipment manifests.'
      }
    ],
    unresolvedHooksAndCliffhangers: [
      'The sealed black iron door on the lowest level remains locked, requiring three gemstone keystones.',
      'A mysterious raven was seen watching the party camp, bearing a wax seal from an unknown patron.'
    ],
    dmNotesNextSession: 'Prep the encounter with the rival mercenary company currently tracking the party’s trail. Introduce the local magistrate’s ultimatum.'
  };
}

// ==========================================
// 6. RULES ARBITER PROCEDURAL
// ==========================================
export function generateProceduralRules(
  query: string = '',
  edition: RuleEdition = '5e'
): GeneratedRulesAdjudication {
  const lower = query.toLowerCase();

  if (lower.includes('stealth') || lower.includes('hide') || lower.includes('invisibility')) {
    return {
      query,
      verdict: 'Situational GM Call: Hiding requires heavy obscurement or total cover; attacking reveals your position immediately after the attack.',
      rulesAsWritten: 'PHB p.177 & p.194: You cannot hide from a creature that can see you clearly. When you make an attack, you give away your location whether the attack hits or misses.',
      rulesAsIntended: 'Stealth gives advantage on the initial attack roll while unseen. Once you strike, combatants know your space unless you take the Hide action again from cover.',
      recommendedTableRuling: 'Grant advantage on the first attack from unseen stealth. Allow a Bonus Action Hide if Rogue Cunning Action is available.',
      commonTrapOrMisconception: 'Invisibility does not make you automatically hidden; creatures still hear footsteps and know your general space unless you take the Hide action.'
    };
  }

  if (lower.includes('bonus action') && (lower.includes('spell') || lower.includes('cast'))) {
    return {
      query,
      verdict: 'Disallowed (Strict Limit): If you cast a spell as a Bonus Action, the only other spell you can cast this turn is a Cantrip with a casting time of 1 Action.',
      rulesAsWritten: 'PHB p.202 (Casting Time - Bonus Action): "You can’t cast another spell during the same turn, except for a cantrip with a casting time of 1 action."',
      rulesAsIntended: 'Prevents stacking two high-level spell slots (e.g. Quickened Fireball + Fireball) in the same turn. Action Surge does not bypass this rule if a Bonus Action spell was cast.',
      recommendedTableRuling: 'Enforce the rule strictly: If Misty Step (Bonus Action) is cast, the main Action can only cast Fire Bolt or a mundane action, not Fireball.',
      commonTrapOrMisconception: 'Thinking Action Surge allows two leveled spells after a Bonus Action spell. If a BA spell is used, the cantrip limit locks the entire turn.'
    };
  }

  return {
    query,
    verdict: 'GM Adjudication Recommended (Fast Table Ruling applied).',
    rulesAsWritten: `According to standard ${edition} rules, characters can attempt any heroic action within reason by resolving an ability check (DC 10 Easy, DC 15 Moderate, DC 20 Hard) or appropriate saving throw.`,
    rulesAsIntended: 'Rules serve the narrative flow and tactical fairness. When a specific edge case is not explicitly covered in the core rulebook, the GM makes a quick ruling and moves on.',
    recommendedTableRuling: 'Call for a primary ability check with Advantage if prepared, or set DC 15 for a standard heroic maneuver to keep combat moving.',
    commonTrapOrMisconception: 'Pausing the game for 10 minutes to search forums. Rule quickly at the table, write a note, and review after the session.'
  };
}

// ==========================================
// CENTRAL PROCEDURAL DISPATCHER
// ==========================================
export function generateProceduralEntity(
  entityType: EntityType,
  prompt: string,
  edition: RuleEdition = '5e',
  context?: any
): { entity: any; entityType: EntityType } {
  if (entityType === 'treasure' || entityType === 'loot') {
    const tier = context?.tier || 'CR 5-10 (Tier 2)';
    return {
      entity: generateProceduralTreasure(tier, 'Dungeon Boss Chest', prompt, edition),
      entityType
    };
  }

  if (entityType === 'character' || entityType === 'npc') {
    return {
      entity: generateProceduralNpc('Tavern Bartender & Info Broker', 'Mysterious', prompt, edition, context?.activeLevel || 3),
      entityType
    };
  }

  if (entityType === 'encounter') {
    return {
      entity: generateProceduralEncounter(context?.partySize || 4, context?.level || 3, 'Medium', 'Dungeon Crypt', prompt, edition),
      entityType
    };
  }

  if (entityType === 'dungeon_hazard' || entityType === 'tactical_room') {
    return {
      entity: generateProceduralDungeon('Trapped Vault', 'Moderate', prompt, edition),
      entityType
    };
  }

  if (entityType === 'session_summary' || entityType === 'campaign_recap') {
    return {
      entity: generateProceduralSessionSummary(prompt, 'Balanced', edition),
      entityType
    };
  }

  if (entityType === 'rules_adjudication') {
    return {
      entity: generateProceduralRules(prompt, edition),
      entityType
    };
  }

  // Generic fallback
  return {
    entity: generateProceduralTreasure('CR 5-10 (Tier 2)', 'Treasure Chest', prompt, edition),
    entityType
  };
}
