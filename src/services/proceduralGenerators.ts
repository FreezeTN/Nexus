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
// 2. SMART CHARACTER & NPC PROCEDURAL GENERATOR
// ==========================================
function parseLevelFromPrompt(prompt: string, fallback: number = 1): number {
  const match1 = prompt.match(/(?:level|lvl)\s*(\d+)/i);
  if (match1) return Math.min(20, Math.max(1, parseInt(match1[1], 10)));
  const match2 = prompt.match(/(\d+)(?:st|nd|rd|th)?\s*(?:level|lvl)/i);
  if (match2) return Math.min(20, Math.max(1, parseInt(match2[1], 10)));
  const match3 = prompt.match(/at\s*(\d+)(?:st|nd|rd|th)?/i);
  if (match3) return Math.min(20, Math.max(1, parseInt(match3[1], 10)));
  return Math.min(20, Math.max(1, fallback));
}

function parseRaceFromPrompt(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/\bwood\s*elf\b/.test(p)) return 'Wood Elf';
  if (/\bhigh\s*elf\b/.test(p)) return 'High Elf';
  if (/\b(?:drow|dark\s*elf)\b/.test(p)) return 'Drow';
  if (/\b(?:elf|elven|elves)\b/.test(p)) return 'Elf';
  if (/\bmountain\s*dwarf\b/.test(p)) return 'Mountain Dwarf';
  if (/\bhill\s*dwarf\b/.test(p)) return 'Hill Dwarf';
  if (/\b(?:dwarf|dwarven|dwarves)\b/.test(p)) return 'Dwarf';
  if (/\b(?:halfling|hobbit)\b/.test(p)) return 'Halfling';
  if (/\b(?:gnome|gnomish)\b/.test(p)) return 'Gnome';
  if (/\bhalf[- ]?elf\b/.test(p)) return 'Half-Elf';
  if (/\bhalf[- ]?orc\b/.test(p)) return 'Half-Orc';
  if (/\btiefling\b/.test(p)) return 'Tiefling';
  if (/\bdragonborn\b/.test(p)) return 'Dragonborn';
  if (/\b(?:orc|orcish)\b/.test(p)) return 'Orc';
  if (/\bgoblin\b/.test(p)) return 'Goblin';
  if (/\baasimar\b/.test(p)) return 'Aasimar';
  if (/\bhuman\b/.test(p)) return 'Human';
  return pick(['Human', 'Elf', 'Dwarf', 'Half-Elf', 'Halfling', 'Tiefling']);
}

function parseClassFromPrompt(prompt: string, isNpc: boolean): string {
  const p = prompt.toLowerCase();
  if (/\bdruid(?:ic)?\b/.test(p)) return 'Druid';
  if (/\b(?:fighter|warrior|soldier|knight|mercenary|gladiator)\b/.test(p)) return 'Fighter';
  if (/\b(?:wizard|mage|archmage|evoker|abjurer|illusionist|necromancer)\b/.test(p)) return 'Wizard';
  if (/\b(?:rogue|thief|assassin|infiltrator|scout|cutpurse)\b/.test(p)) return 'Rogue';
  if (/\b(?:cleric|priest(?:ess)?|healer|curate|templar)\b/.test(p)) return 'Cleric';
  if (/\b(?:paladin|crusader|holy knight)\b/.test(p)) return 'Paladin';
  if (/\b(?:ranger|hunter|tracker|strider|archer)\b/.test(p)) return 'Ranger';
  if (/\b(?:barbarian|berserker|reaver|wildling)\b/.test(p)) return 'Barbarian';
  if (/\b(?:monk|martial artist)\b/.test(p)) return 'Monk';
  if (/\b(?:bard|skald|minstrel|troubadour|performer)\b/.test(p)) return 'Bard';
  if (/\b(?:sorcerer|sorceress|wild mage|bloodline)\b/.test(p)) return 'Sorcerer';
  if (/\b(?:warlock|witch|hexblade|eldritch)\b/.test(p)) return 'Warlock';
  if (/\b(?:artificer|tinkerer|alchemical engineer)\b/.test(p)) return 'Artificer';
  if (isNpc) {
    if (/\b(?:bartender|innkeeper|tavern)\b/.test(p)) return 'Tavern Bartender';
    if (/\b(?:merchant|shopkeeper|vendor|trader)\b/.test(p)) return 'Merchant';
    if (/\b(?:guard|captain|watch)\b/.test(p)) return 'Fighter';
  }
  return isNpc ? 'Local Specialist' : 'Fighter';
}

function generateThematicName(race: string, charClass: string): string {
  const r = race.toLowerCase();
  if (r.includes('elf') || r.includes('elven') || r.includes('drow')) {
    const first = pick(['Faelyn', 'Sylas', 'Elowen', 'Theron', 'Lyra', 'Aelrindel', 'Caelynn', 'Erevan', 'Keyleth', 'Faelar']);
    const last = charClass === 'Druid' || charClass === 'Ranger'
      ? pick(['Whisperleaf', 'Verdantstride', 'Brambleheart', 'Nightbreeze', 'Greenbough', 'Swiftbrook'])
      : pick(['Starweaver', 'Silverleaf', 'Moonshadow', 'Sunstrider', 'Oakenshield']);
    return `${first} ${last}`;
  }
  if (r.includes('dwarf')) {
    const first = pick(['Torvald', 'Balin', 'Dwalin', 'Krag', 'Hilda', 'Brunhild', 'Dagmar', 'Thorin']);
    const last = pick(['Ironbreaker', 'Bronzebeard', 'Stonehammer', 'Deepdelver', 'Forgeguard']);
    return `${first} ${last}`;
  }
  if (r.includes('halfling')) {
    const first = pick(['Finnegan', 'Milo', 'Rosie', 'Tobias', 'Merry', 'Pippa']);
    const last = pick(['Quickfoot', 'Underhill', 'Bramble', 'Greenbottle', 'Tealeaf']);
    return `${first} ${last}`;
  }
  if (r.includes('gnome')) {
    const first = pick(['Fizzwick', 'Bimble', 'Zanna', 'Tinkertop', 'Dimble']);
    const last = pick(['Cogspinner', 'Sparksprocket', 'Nackle', 'Copperkettle']);
    return `${first} ${last}`;
  }
  if (r.includes('tiefling')) {
    const first = pick(['Malakor', 'Vesper', 'Kallista', 'Dante', 'Akmenos', 'Lilith']);
    const last = pick(['Torment', 'Malice', 'Ash', 'Void', 'Brimstone']);
    return `${first} ${last}`;
  }
  if (r.includes('dragonborn')) {
    const first = pick(['Balthazar', 'Drakon', 'Kavash', 'Rhogar', 'Heskan']);
    const last = pick(['Flametongue', 'Scalebreaker', 'Ironsnout', 'Drachendusk']);
    return `${first} ${last}`;
  }
  if (r.includes('orc')) {
    const first = pick(['Grognar', 'Thokk', 'Morgat', 'Durg', 'Krag']);
    const last = pick(['Skullcrusher', 'Bonegrinder', 'Bloodfang', 'Ironjaw']);
    return `${first} ${last}`;
  }
  const first = pick(['Cedric', 'Alden', 'Rowan', 'Kaelen', 'Elena', 'Bram', 'Mireille', 'Cassian']);
  const last = pick(['Sterling', 'Vance', 'Blackwood', 'Thorne', 'Drake', 'Ashford', 'Grimm', 'Ravencrest']);
  return `${first} ${last}`;
}

export function generateProceduralCharacter(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any,
  isNpc: boolean = false
): any {
  const level = parseLevelFromPrompt(customPrompt, context?.activeLevel || context?.activeCharacterLevel || 3);
  const race = parseRaceFromPrompt(customPrompt);
  const charClass = parseClassFromPrompt(customPrompt, isNpc);
  const name = generateThematicName(race, charClass);
  const is35e = edition === '3.5e' || edition === 'pathfinder';

  // Proficiency / BAB calculation
  const profBonus = Math.ceil(level / 4) + 1;
  const bab = is35e
    ? (['Fighter', 'Paladin', 'Barbarian', 'Ranger'].includes(charClass)
        ? level
        : ['Druid', 'Cleric', 'Rogue', 'Monk', 'Bard'].includes(charClass)
        ? Math.floor(level * 0.75)
        : Math.floor(level * 0.5))
    : profBonus;

  // Class Archetypes, Stats & Equipment definitions
  if (charClass === 'Druid') {
    const subclass = is35e ? 'Druid of the Green Circle' : (customPrompt.toLowerCase().includes('moon') ? 'Circle of the Moon' : 'Circle of the Land (Forest)');
    const abilities = {
      STR: { score: 10 },
      DEX: { score: 14 },
      CON: { score: 14 },
      INT: { score: 12 },
      WIS: { score: 16 + (level >= 4 ? 2 : 0) },
      CHA: { score: 10 }
    };
    const conMod = Math.floor((abilities.CON.score - 10) / 2);
    const wisMod = Math.floor((abilities.WIS.score - 10) / 2);
    const dexMod = Math.floor((abilities.DEX.score - 10) / 2);
    const hpMax = 8 + (level - 1) * 5 + conMod * level;
    const ac = 15; // Cured Hide (12 + 2) + Wooden Shield (+2) - nonmetallic lore
    const atkBonus = is35e ? bab + dexMod : profBonus + dexMod;
    const spellAtkBonus = is35e ? bab + wisMod : profBonus + wisMod;

    return {
      id: `pc_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      race,
      characterClass: 'Druid',
      subclass,
      level,
      background: 'Hermit / Grove Warden',
      alignment: pick(['Neutral Good', 'True Neutral', 'Lawful Neutral']),
      experiencePoints: level * 1000,
      edition,
      isMonster: false,
      isVendor: false,
      hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDiceTotal: `${level}d8 + ${conMod * level}`,
      hitDiceCurrent: level,
      armorClass: ac,
      initiativeBonus: dexMod,
      speed: race.includes('Wood Elf') ? 35 : 30,
      inspiration: false,
      deathSavesSuccesses: 0,
      deathSavesFailures: 0,
      abilities,
      savingThrowProficiencies: is35e ? ['FORT', 'WILL'] : ['INT', 'WIS'],
      skills: ['Perception', 'Nature', 'Survival', 'Animal Handling', 'Medicine'],
      attacks: [
        {
          id: 'atk_1',
          name: 'Yew Wood Scimitar',
          attackBonus: atkBonus,
          damage: `1d6 + ${dexMod}`,
          damageType: 'Slashing',
          range: '5 ft.',
          notes: 'Finesse, Light, Non-metallic Ironwood Edge'
        },
        {
          id: 'atk_2',
          name: 'Quarterstaff of Shillelagh',
          attackBonus: spellAtkBonus,
          damage: is35e ? `1d10 + ${wisMod}` : `1d8 + ${wisMod}`,
          damageType: 'Magical Bludgeoning',
          range: '5 ft.',
          notes: 'Infused with nature magic; strikes as enchanted magical weapon'
        },
        {
          id: 'atk_3',
          name: 'Produce Flame / Sling',
          attackBonus: spellAtkBonus,
          damage: `${Math.max(1, Math.floor((level + 1) / 5))}d8`,
          damageType: 'Fire',
          range: '30 ft.',
          notes: 'Conjures flickering flame in hand that can be hurled at targets'
        }
      ],
      classFeatures: [
        {
          id: 'feat_1',
          name: 'Wild Shape (2/day)',
          source: 'Druid Feature',
          description: `Assume the form of any beast with a CR up to ${level >= 8 ? '1 (Flying allowed)' : level >= 4 ? '1/2 (Swimming allowed)' : '1/4'}. Max duration: ${Math.floor(level / 2)} hours.`
        },
        {
          id: 'feat_2',
          name: 'Druidic Spellcasting',
          source: 'Spellcasting',
          description: `Prepared spells: Call Lightning, Plant Growth, Barkskin, Moonbeam, Cure Wounds, Faerie Fire, Goodberry. Spell Save DC: ${8 + (is35e ? bab : profBonus) + wisMod}.`
        },
        {
          id: 'feat_3',
          name: 'Land\'s Stride & Nature\'s Ward',
          source: 'Circle Feature',
          description: 'Moving through nonmagical difficult terrain costs no extra movement. Advantage on saving throws against magically manipulated plants.'
        },
        {
          id: 'feat_4',
          name: 'Fey Ancestry & Trance',
          source: 'Elven Heritage',
          description: 'Advantage on saving throws against being charmed; immune to magic sleep spells; meditates deeply for 4 hours instead of sleeping.'
        }
      ],
      wealth: { cp: 80, sp: 45, ep: 0, gp: 65, pp: 0 },
      inventory: [
        { name: 'Cured Hide Armor', quantity: 1, weight: 12, isMagic: false, costGp: 45, notes: 'AC 12 + Dex (max 2). Non-metallic cured beast hide.', itemType: 'Armor', armorAc: 12 },
        { name: 'Carved Oak Wooden Shield', quantity: 1, weight: 5, isMagic: false, costGp: 15, notes: '+2 AC. Carved from fallen ancient heartwood with sylvan warding runes.', itemType: 'Armor', armorAc: 2 },
        { name: 'Yew Wood Scimitar', quantity: 1, weight: 3, isMagic: false, costGp: 25, notes: 'Balanced curved blade crafted from hardened seasoned yew.', itemType: 'Weapon' },
        { name: 'Ashwood Quarterstaff', quantity: 1, weight: 4, isMagic: false, costGp: 5, notes: 'Focus staff bound with leather thongs and amber beads.', itemType: 'Weapon' },
        { name: 'Druidic Focus (Mistletoe & Holly Sprig)', quantity: 1, weight: 0.5, isMagic: true, costGp: 10, notes: 'Harvested under the full moon; acts as spellcasting focus.', itemType: 'Misc' },
        { name: 'Herbalism Kit', quantity: 1, weight: 3, isMagic: false, costGp: 15, notes: 'Mortar, pestle, clippers, glass vials, and wild poultices.', itemType: 'Gear' },
        { name: 'Potion of Healing', quantity: 2, weight: 1, isMagic: true, costGp: 100, notes: 'Restores 2d4+2 hit points when consumed.', itemType: 'Potion' },
        { name: 'Explorer\'s Survival Pack', quantity: 1, weight: 20, isMagic: false, costGp: 10, notes: 'Bedroll, mess kit, tinderbox, waterskin, 10 days rations, 50ft hempen rope.', itemType: 'Gear' },
        { name: 'Goodberry Satchel', quantity: 1, weight: 1, isMagic: true, costGp: 5, notes: 'Infused fresh berries providing total nourishment for a day.', itemType: 'Misc' }
      ],
      personalityTraits: 'Speaks with quiet deliberation; listens to the wind and the subtle cues of nature before deciding.',
      ideals: 'The primordial balance of the wildlands must be safeguarded against encroaching corruption and despoilment.',
      bonds: 'Sworn to protect the sacred groves and creature kin of the ancestral forests from unnatural incursions.',
      flaws: 'Distrusts overcrowded stone cities and has little patience for courtly intrigue and political posturing.',
      backstory: `Trained in the secluded sanctuaries of the elder woods, ${name} has answered the call of the grove wardens. Attuned to the rhythm of growth, seasons, and wild beasts, this guardian ventures forth across the realm whenever aberrant perils or dark blights threaten the equilibrium of nature.`
    };
  }

  // Fighter Template
  if (charClass === 'Fighter') {
    const subclass = customPrompt.toLowerCase().includes('battle') ? 'Battle Master' : 'Champion';
    const abilities = { STR: { score: 16 }, DEX: { score: 12 }, CON: { score: 15 }, INT: { score: 10 }, WIS: { score: 12 }, CHA: { score: 10 } };
    const conMod = Math.floor((abilities.CON.score - 10) / 2);
    const strMod = Math.floor((abilities.STR.score - 10) / 2);
    const hpMax = 10 + (level - 1) * 6 + conMod * level;
    return {
      id: `pc_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      race,
      characterClass: 'Fighter',
      subclass,
      level,
      background: 'Soldier / Veteran Vanguard',
      alignment: 'Lawful Good',
      experiencePoints: level * 1000,
      edition,
      isMonster: false,
      isVendor: false,
      hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDiceTotal: `${level}d10 + ${conMod * level}`,
      hitDiceCurrent: level,
      armorClass: 18,
      initiativeBonus: 1,
      speed: 30,
      abilities,
      savingThrowProficiencies: ['STR', 'CON'],
      skills: ['Athletics', 'Perception', 'Intimidation', 'Survival'],
      attacks: [
        { id: 'atk_1', name: 'Masterwork Longsword', attackBonus: bab + strMod, damage: `1d8 + ${strMod}`, damageType: 'Slashing', range: '5 ft.', notes: 'Versatile (1d10)' },
        { id: 'atk_2', name: 'Heavy Crossbow', attackBonus: bab + 1, damage: '1d10 + 1', damageType: 'Piercing', range: '100/400 ft.', notes: 'Ammunition, Loading, Two-Handed' }
      ],
      classFeatures: [
        { id: 'feat_1', name: 'Action Surge', source: 'Fighter', description: 'Take an additional standard action on your turn once per short rest.' },
        { id: 'feat_2', name: 'Second Wind', source: 'Fighter', description: `Regain 1d10 + ${level} HP as a bonus action once per short rest.` },
        { id: 'feat_3', name: level >= 5 ? 'Extra Attack' : 'Fighting Style (Defense)', source: 'Fighter', description: level >= 5 ? 'Attack twice when taking the Attack action.' : '+1 bonus to AC while wearing armor.' }
      ],
      wealth: { cp: 50, sp: 60, ep: 0, gp: 85, pp: 0 },
      inventory: [
        { name: 'Chain Mail / Splint Armor', quantity: 1, weight: 55, isMagic: false, costGp: 75, notes: 'AC 16-17 heavy plate harness.', itemType: 'Armor', armorAc: 16 },
        { name: 'Steel Heater Shield', quantity: 1, weight: 6, isMagic: false, costGp: 10, notes: '+2 AC defensive shield.', itemType: 'Armor', armorAc: 2 },
        { name: 'Masterwork Longsword', quantity: 1, weight: 3, isMagic: false, costGp: 30, notes: 'Tempered steel blade with balanced pommel.', itemType: 'Weapon' },
        { name: 'Heavy Crossbow & 20 Bolts', quantity: 1, weight: 18, isMagic: false, costGp: 50, notes: 'High-tension winch crossbow.', itemType: 'Weapon' },
        { name: 'Dungeoneer\'s Exploration Kit', quantity: 1, weight: 25, isMagic: false, costGp: 12, notes: 'Torches, rations, pitons, hempen rope.', itemType: 'Gear' },
        { name: 'Potion of Healing', quantity: 2, weight: 1, isMagic: true, costGp: 100, notes: 'Restores 2d4+2 HP.', itemType: 'Potion' }
      ],
      personalityTraits: 'Disciplined, vigilant, and stands firm in defense of comrades.',
      ideals: 'Honor and steadfast resolve under fire are what separate champions from sellswords.',
      bonds: 'Loyal to the shield-brothers and adventuring party who fought through the trenches together.',
      flaws: 'Reluctant to retreat even when overwhelming odds suggest strategic withdrawal.',
      backstory: `A seasoned frontline warrior hardened through campaign skirmishes, ${name} brings disciplined steel and tactical mastery to every confrontation.`
    };
  }

  // Wizard Template
  if (charClass === 'Wizard') {
    const subclass = customPrompt.toLowerCase().includes('abjur') ? 'School of Abjuration' : 'School of Evocation';
    const abilities = { STR: { score: 8 }, DEX: { score: 14 }, CON: { score: 14 }, INT: { score: 16 + (level >= 4 ? 2 : 0) }, WIS: { score: 12 }, CHA: { score: 10 } };
    const intMod = Math.floor((abilities.INT.score - 10) / 2);
    const conMod = Math.floor((abilities.CON.score - 10) / 2);
    const hpMax = 6 + (level - 1) * 4 + conMod * level;
    return {
      id: `pc_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      race,
      characterClass: 'Wizard',
      subclass,
      level,
      background: 'Sage / Arcane Scholar',
      alignment: 'Neutral Good',
      experiencePoints: level * 1000,
      edition,
      isMonster: false,
      isVendor: false,
      hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDiceTotal: `${level}d6 + ${conMod * level}`,
      hitDiceCurrent: level,
      armorClass: 12,
      initiativeBonus: 2,
      speed: 30,
      abilities,
      savingThrowProficiencies: ['INT', 'WIS'],
      skills: ['Arcana', 'History', 'Investigation', 'Insight'],
      attacks: [
        { id: 'atk_1', name: 'Arcane Fire Bolt', attackBonus: bab + intMod, damage: `${Math.max(1, Math.floor((level + 1) / 5))}d10`, damageType: 'Fire', range: '120 ft.', notes: 'Ignites flammable objects' },
        { id: 'atk_2', name: 'Silver Dagger', attackBonus: bab + 2, damage: '1d4 + 2', damageType: 'Piercing', range: '20/60 ft.', notes: 'Finesse, Light, Silvered' }
      ],
      classFeatures: [
        { id: 'feat_1', name: 'Arcane Recovery', source: 'Wizard', description: `Regain up to ${Math.ceil(level / 2)} spell slot levels during a short rest.` },
        { id: 'feat_2', name: 'Sculpt Spells / Arcane Ward', source: 'Tradition', description: 'Protect allies from evocation splash damage or absorb incoming harm with a barrier.' }
      ],
      wealth: { cp: 30, sp: 40, ep: 0, gp: 90, pp: 0 },
      inventory: [
        { name: 'Spellbook Bound in Dragonhide', quantity: 1, weight: 3, isMagic: true, costGp: 150, notes: 'Contains inscribed formulas: Fireball, Mage Armor, Shield, Magic Missile, Misty Step, Counterspell.', itemType: 'Misc' },
        { name: 'Arcane Crystal Staff', quantity: 1, weight: 4, isMagic: true, costGp: 20, notes: 'Spellcasting focus carved from ashwood capped with amethyst.', itemType: 'Weapon' },
        { name: 'Scholar\'s Pack & Ink Vials', quantity: 1, weight: 15, isMagic: false, costGp: 25, notes: 'Parchment, quill, ink, candles, book of lore.', itemType: 'Gear' },
        { name: 'Potion of Healing', quantity: 2, weight: 1, isMagic: true, costGp: 100, notes: 'Restores 2d4+2 HP.', itemType: 'Potion' }
      ],
      personalityTraits: 'Deeply analytical, always deciphering arcane glyphs and historical contexts.',
      ideals: 'Knowledge unlocked through careful study is the greatest power in creation.',
      bonds: 'Bound to protect ancient libraries and decipher forgotten planar anomalies.',
      flaws: 'Easily absorbed in magical theorizing when immediate physical danger is close at hand.',
      backstory: `An erudite spellcaster educated in grand arcane institutions, ${name} studies the delicate architecture of magical currents to safeguard the realm from planar anomalies.`
    };
  }

  // Rogue / NPC Specialist Template
  const rogueAbilities = { STR: { score: 10 }, DEX: { score: 16 + (level >= 4 ? 2 : 0) }, CON: { score: 14 }, INT: { score: 13 }, WIS: { score: 12 }, CHA: { score: 12 } };
  const rogueDexMod = Math.floor((rogueAbilities.DEX.score - 10) / 2);
  const rogueConMod = Math.floor((rogueAbilities.CON.score - 10) / 2);
  const rogueHp = 8 + (level - 1) * 5 + rogueConMod * level;

  return {
    id: `pc_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    race,
    characterClass: isNpc ? (charClass || 'Local Guild Specialist') : (charClass || 'Rogue'),
    subclass: isNpc ? 'Information Broker & Operative' : 'Thief / Scout Specialist',
    level,
    background: 'Criminal / Guild Infiltrator',
    alignment: pick(['Neutral Good', 'True Neutral', 'Chaotic Neutral']),
    experiencePoints: level * 1000,
    edition,
    isMonster: false,
    isVendor: false,
    hpMax: rogueHp,
    hpCurrent: rogueHp,
    hpTemp: 0,
    hitDiceTotal: `${level}d8 + ${rogueConMod * level}`,
    hitDiceCurrent: level,
    armorClass: 12 + rogueDexMod,
    initiativeBonus: rogueDexMod,
    speed: 30,
    abilities: rogueAbilities,
    savingThrowProficiencies: ['DEX', 'INT'],
    skills: ['Stealth', 'Sleight of Hand', 'Deception', 'Perception', 'Insight', 'Acrobatics'],
    attacks: [
      { id: 'atk_1', name: 'Masterwork Rapier', attackBonus: bab + rogueDexMod, damage: `1d8 + ${rogueDexMod}`, damageType: 'Piercing', range: '5 ft.', notes: 'Finesse' },
      { id: 'atk_2', name: 'Shortbow & Bodkin Arrows', attackBonus: bab + rogueDexMod, damage: `1d6 + ${rogueDexMod}`, damageType: 'Piercing', range: '80/320 ft.', notes: 'Two-Handed, Sneak Attack compatible' }
    ],
    classFeatures: [
      { id: 'feat_1', name: `Sneak Attack (${Math.ceil(level / 2)}d6)`, source: 'Rogue', description: `Deals extra ${Math.ceil(level / 2)}d6 damage on attacks with advantage or when an ally is adjacent.` },
      { id: 'feat_2', name: 'Cunning Action', source: 'Rogue', description: 'Dash, Disengage, or Hide as a bonus action on every turn.' }
    ],
    wealth: { cp: 40, sp: 50, ep: 0, gp: 55, pp: 0 },
    inventory: [
      { name: 'Studded Leather Armor', quantity: 1, weight: 13, isMagic: false, costGp: 45, notes: 'Light flexible armor granting 12 + Dex AC.', itemType: 'Armor', armorAc: 12 },
      { name: 'Masterwork Rapier', quantity: 1, weight: 2, isMagic: false, costGp: 25, notes: 'Precision tempered fencing blade.', itemType: 'Weapon' },
      { name: 'Shortbow & 20 Arrows', quantity: 1, weight: 4, isMagic: false, costGp: 25, notes: 'Compact recurve bow.', itemType: 'Weapon' },
      { name: 'Thieves\' Lockpicking Kit', quantity: 1, weight: 1, isMagic: false, costGp: 25, notes: 'Picks, tension wrenches, skeleton keys.', itemType: 'Gear' },
      { name: 'Potion of Healing', quantity: 2, weight: 1, isMagic: true, costGp: 100, notes: 'Restores 2d4+2 HP.', itemType: 'Potion' }
    ],
    personalityTraits: 'Alert, observant, and calculates escape vectors before entering any chamber.',
    ideals: 'Freedom of movement and survival rely upon knowing more than your adversary.',
    bonds: 'Guards the contacts who provided refuge when municipal warrants were issued.',
    flaws: 'Keeps contingencies secret from allies until necessity demands revelation.',
    backstory: `Operating quietly in the bustling boroughs and shaded trade conduits, ${name} leverages agility, keen senses, and quick blades to overcome insurmountable opposition.`
  };
}

// Quick NPC procedural generator wrapper (backward compatibility)
export function generateProceduralNpc(
  archetype: string = 'Tavern Bartender & Information Broker',
  tone: string = 'Mysterious & Suspicious',
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  level: number = 3
): any {
  return generateProceduralCharacter(customPrompt || archetype, edition, { activeLevel: level }, true);
}

// ==========================================
// 2B. PROCEDURAL MONSTER GENERATOR
// ==========================================
export function generateProceduralMonster(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  const p = customPrompt.toLowerCase();
  let cr = '3';
  const crMatch = customPrompt.match(/CR\s*(\d+(?:\/\d+)?)/i) || customPrompt.match(/challenge\s*rating\s*(\d+)/i);
  if (crMatch) cr = crMatch[1];
  const crNum = parseFloat(cr) || 3;

  let creatureName = 'Shadowclaw Chimera';
  let creatureType = 'Monstrosity';
  if (p.includes('drake') || p.includes('dragon')) {
    creatureName = 'Glacial Drake';
    creatureType = 'Dragon';
  } else if (p.includes('undead') || p.includes('wight') || p.includes('wraith')) {
    creatureName = 'Crypt Reaver Wraith';
    creatureType = 'Undead';
  } else if (p.includes('fiend') || p.includes('demon') || p.includes('devil')) {
    creatureName = 'Brimstone Hellhound Alpha';
    creatureType = 'Fiend';
  }

  const hp = Math.max(25, Math.round(crNum * 18 + 20));
  const ac = Math.min(19, Math.max(12, Math.round(13 + crNum * 0.7)));

  return {
    id: `monster_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: creatureName,
    race: creatureType,
    characterClass: 'Predator',
    challengeRating: cr,
    level: Math.max(1, Math.round(crNum)),
    isMonster: true,
    isVendor: false,
    hpMax: hp,
    hpCurrent: hp,
    hitDiceTotal: `${Math.max(3, Math.round(crNum * 2))}d10 + ${Math.round(crNum * 4)}`,
    armorClass: ac,
    speed: 40,
    edition,
    abilities: {
      STR: { score: 16 + Math.min(8, Math.round(crNum)) },
      DEX: { score: 14 },
      CON: { score: 15 + Math.min(6, Math.round(crNum)) },
      INT: { score: 6 },
      WIS: { score: 12 },
      CHA: { score: 8 }
    },
    attacks: [
      { id: 'm_atk_1', name: 'Rending Claws', attackBonus: Math.round(3 + crNum * 0.8), damage: `${Math.max(1, Math.round(crNum * 0.5))}d8 + 4`, damageType: 'Slashing', range: '5 ft.', notes: 'Multiattack: 2 attacks per turn' },
      { id: 'm_atk_2', name: 'Savage Bite / Breath', attackBonus: Math.round(3 + crNum * 0.8), damage: `${Math.max(2, Math.round(crNum))}d6 + 4`, damageType: 'Piercing / Elemental', range: '15-foot cone', notes: 'Recharge 5-6' }
    ],
    inventory: [
      { name: 'Pristine Beast Pelts & Claws', quantity: 2, weight: 10, isMagic: false, costGp: crNum * 40, itemType: 'Misc', notes: 'Valuable crafting reagents.' }
    ],
    description: `A terrifying ${creatureType} adapted to lethal ambushes. Thick armored hide deflects conventional strikes, while heightened predatory senses prevent it from being surprised.`
  };
}

// ==========================================
// 2C. PROCEDURAL MERCHANT GENERATOR
// ==========================================
export function generateProceduralMerchant(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  const p = customPrompt.toLowerCase();
  const isBlacksmith = p.includes('blacksmith') || p.includes('armor') || p.includes('weapon') || p.includes('iron');
  const isAlchemist = p.includes('alchem') || p.includes('potion') || p.includes('elixir');

  const shopName = isBlacksmith ? 'The Iron Anvil Armory' : isAlchemist ? 'Celestial Elixirs & Salves' : 'The Gilded Coin Emporium';
  const vendorClass = isBlacksmith ? 'Master Armorer' : isAlchemist ? 'Apothecary' : 'General Goods Merchant';
  const merchantName = isBlacksmith ? 'Torvald Deepforge' : isAlchemist ? 'Elowen Starwhisper' : 'Cedric Vance';
  const race = isBlacksmith ? 'Dwarf' : isAlchemist ? 'Elf' : 'Human';

  const wares = isBlacksmith
    ? [
        { name: 'Masterwork Longsword', quantity: 3, weight: 3, isMagic: false, costGp: 50, itemType: 'Weapon', notes: '+1 to attack rolls.' },
        { name: 'Heavy Steel Shield', quantity: 4, weight: 6, isMagic: false, costGp: 15, itemType: 'Armor', armorAc: 2, notes: '+2 AC.' },
        { name: 'Reinforced Half-Plate Harness', quantity: 1, weight: 40, isMagic: false, costGp: 750, itemType: 'Armor', armorAc: 15, notes: 'AC 15 + Dex (max 2).' },
        { name: 'Bundle of 20 Crossbow Bolts', quantity: 10, weight: 2, isMagic: false, costGp: 2, itemType: 'Misc', notes: 'Hardened steel heads.' }
      ]
    : isAlchemist
    ? [
        { name: 'Potion of Healing', quantity: 6, weight: 1, isMagic: true, costGp: 50, itemType: 'Potion', notes: 'Restores 2d4+2 HP.' },
        { name: 'Potion of Greater Healing', quantity: 2, weight: 1, isMagic: true, costGp: 150, itemType: 'Potion', notes: 'Restores 4d4+4 HP.' },
        { name: 'Antitoxin Vial', quantity: 4, weight: 0.5, isMagic: false, costGp: 50, itemType: 'Gear', notes: 'Advantage on saving throws against poison for 1 hour.' },
        { name: 'Alchemist\'s Fire Flask', quantity: 3, weight: 1, isMagic: false, costGp: 50, itemType: 'Gear', notes: 'Deals 1d4 fire damage every turn.' }
      ]
    : [
        { name: 'Explorer\'s Survival Pack', quantity: 5, weight: 20, isMagic: false, costGp: 10, itemType: 'Gear', notes: 'Rations, waterskin, bedroll, rope.' },
        { name: 'Hempen Rope (50 ft.)', quantity: 8, weight: 10, isMagic: false, costGp: 1, itemType: 'Gear', notes: 'Stout 50ft rope.' },
        { name: 'Bullseye Lantern', quantity: 3, weight: 2, isMagic: false, costGp: 12, itemType: 'Gear', notes: 'Casts bright light in a 60ft cone.' },
        { name: 'Potion of Healing', quantity: 3, weight: 1, isMagic: true, costGp: 50, itemType: 'Potion', notes: 'Standard restoration elixir.' }
      ];

  return {
    id: `merchant_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: merchantName,
    race,
    characterClass: vendorClass,
    subclass: shopName,
    level: 4,
    background: 'Guild Merchant',
    alignment: 'Neutral Good',
    isMonster: false,
    isVendor: true,
    vendorMargin: 100,
    hpMax: 28,
    hpCurrent: 28,
    armorClass: 13,
    speed: 30,
    edition,
    abilities: { STR: { score: 14 }, DEX: { score: 12 }, CON: { score: 14 }, INT: { score: 14 }, WIS: { score: 14 }, CHA: { score: 14 } },
    wealth: { cp: 200, sp: 300, ep: 0, gp: 450, pp: 10 },
    inventory: wares,
    description: `Proprietor of ${shopName}. Offers fair trades, durable equipment, and trustworthy regional information to traveling adventurers.`
  };
}

// ==========================================
// 2D. PROCEDURAL ITEM GENERATOR
// ==========================================
export function generateProceduralItem(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  const p = customPrompt.toLowerCase();
  const isWeapon = p.includes('sword') || p.includes('hammer') || p.includes('bow') || p.includes('dagger') || p.includes('weapon') || p.includes('blade');
  const isArmor = p.includes('armor') || p.includes('shield') || p.includes('plate') || p.includes('chain');

  if (isWeapon) {
    return {
      name: 'Sunforged Radiant Warhammer (+1)',
      itemType: 'Weapon',
      rarity: 'Rare',
      costGp: 1500,
      requiresAttunement: true,
      weaponStats: {
        attackBonus: 1,
        damage: '1d8+1 (+1d6 Radiant)',
        damageType: 'Bludgeoning / Radiant',
        range: '5 ft. (Thrown 20/60 ft.)',
        notes: 'Versatile (1d10). Returns to hand immediately after being thrown.'
      },
      description: 'Forged in celestial flame by dawnbringers. Glows with daylight upon command and deals bonus radiant damage against undead and fiends.'
    };
  }

  if (isArmor) {
    return {
      name: 'Mithral Ward Aegis (+1 Shield)',
      itemType: 'Armor',
      rarity: 'Uncommon',
      costGp: 850,
      armorAc: 3,
      requiresAttunement: false,
      description: 'Featherlight mithral shield inscribed with deflection wards. Imposes no stealth disadvantage and grants +3 to Armor Class.'
    };
  }

  return {
    name: 'Amulet of the Astral Traveler',
    itemType: 'Misc',
    rarity: 'Rare',
    costGp: 2200,
    requiresAttunement: true,
    description: 'An ethereal gemstone pendant that hums with planar resonance. Grants the wearer resistance to force damage and allows casting Misty Step twice per Long Rest.'
  };
}

// ==========================================
// 2E. PROCEDURAL SPELL GENERATOR
// ==========================================
export function generateProceduralSpell(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  const p = customPrompt.toLowerCase();
  let level = 3;
  const lvlMatch = customPrompt.match(/(\d+)(?:st|nd|rd|th)?\s*level/i) || customPrompt.match(/level\s*(\d+)/i);
  if (lvlMatch) level = Math.min(9, Math.max(0, parseInt(lvlMatch[1], 10)));

  return {
    name: level === 0 ? 'Spark of Aether' : 'Verdant Stasis / Chrono Strike',
    level,
    school: p.includes('transmut') ? 'Transmutation' : p.includes('abjur') ? 'Abjuration' : 'Evocation',
    castingTime: '1 Action',
    range: '60 feet',
    components: 'V, S, M (a dried sylvan petal)',
    duration: 'Concentration, up to 1 minute',
    concentration: true,
    ritual: false,
    damage: `${Math.max(2, level * 2)}d6`,
    damageType: 'Force / Radiant',
    saveType: 'DEX',
    description: `Tendrils of temporal light or verdant ivy erupt at the target point. Creatures within 15 feet must make a saving throw or take ${Math.max(2, level * 2)}d6 damage and have their movement speed halved for the duration.`
  };
}

// ==========================================
// 2F. PROCEDURAL QUEST & GRAPH NODE GENERATORS
// ==========================================
export function generateProceduralQuest(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  return {
    title: 'The Blight of the Whispering Grove',
    questGiver: 'Elder Faelyn Whisperleaf',
    location: 'Verdant Verge / Ancient Dolmens',
    summary: 'Dark necrotic seepage is suffocating the roots of the world-tree. The druidic circle requires valiant allies to locate and purge the corrupted altar.',
    objectives: [
      { description: 'Scout the petrified glade and locate the corrupted font.', optional: false },
      { description: 'Defeat the Blight Infused Drake guarding the cavern.', optional: false },
      { description: 'Purify the heart-stone using consecrated river water.', optional: true }
    ],
    complications: [
      'A rival mercenary company seeks the tainted heart-stone for black-market sale.',
      'Toxic spore clouds make resting inside the grove impossible without herbal masks.'
    ],
    rewards: {
      xp: 1800,
      gp: 350,
      items: ['Staff of the Woodland Warden', 'Potion of Greater Healing (x2)']
    }
  };
}

export function generateProceduralGraphNode(
  customPrompt: string = '',
  edition: RuleEdition = '5e',
  context?: any
): any {
  return {
    name: 'The Emerald Conclave Sanctum',
    type: 'location',
    region: 'Elderheart Forest',
    status: 'Active',
    faction: 'Circle of the Verdant Bloom',
    summary: 'A sheltered sanctuary of living trees woven together by elven druids. Serves as a meeting ground for rangers, wanderers, and wardens.',
    tags: ['Druidic', 'Sacred', 'Sanctuary', 'Wildlands'],
    connections: [
      { targetName: 'Elder Faelyn', relationship: 'Presiding Archdruid', targetType: 'npc' },
      { targetName: 'The Sunken Dolmen', relationship: 'Guarded ancient ruin to the north', targetType: 'location' }
    ]
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
// 7. HOMEBREW CLASS PROCEDURAL GENERATOR
// ==========================================
export function generateProceduralClass(prompt: string = '', edition: RuleEdition = '5e'): any {
  const classArchetypes = [
    {
      name: 'Chronomancer',
      hitDie: 'd6',
      primaryAbility: 'Intelligence',
      savingThrows: ['Intelligence', 'Wisdom'],
      role: 'Time Manipulation, Battlefield Controller & Reversal Specialist',
      description: 'Scholars of the temporal weave who alter the velocity of time, glimpse seconds into the future to avoid fatal strikes, and freeze adversaries in chronological stasis.',
      proficiencies: {
        armor: ['Light armor'],
        weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
        tools: ["Clockmaker's tools", "Calligrapher's supplies"],
        savingThrows: ['Intelligence', 'Wisdom'],
        skills: 'Choose three from Arcana, History, Insight, Investigation, Perception'
      },
      spellcasting: {
        type: 'Full',
        ability: 'Intelligence',
        notes: 'Prepares temporal spells from an inscribed Chronometer relic.'
      },
      featuresByLevel: [
        {
          level: 1,
          name: 'Temporal Slip',
          description: 'When hit by an attack, use a Reaction to shift 1 second back in time, adding your INT modifier to AC against that attack. Usable INT mod times per Long Rest.',
          actionType: 'Reaction',
          uses: 'INT mod / Long Rest'
        },
        {
          level: 2,
          name: 'Chronal Stasis',
          description: 'As an Action, force a target within 30 ft to make a Wisdom saving throw. On a failure, they are immobilized in a temporal lock until the end of their next turn.',
          actionType: 'Action',
          uses: '1 / Short Rest'
        },
        {
          level: 3,
          name: 'Temporal Order Specialization',
          description: 'Choose a Chronomancy Order archetype (Order of Paradox or Epoch Weaver).',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 5,
          name: 'Accelerated Step',
          description: 'Double your movement speed for 1 minute and gain an additional Bonus Action each round.',
          actionType: 'Bonus Action',
          uses: '1 / Long Rest'
        },
        {
          level: 20,
          name: 'Master of Eternity (Capstone)',
          description: 'Once per long rest, take an extra turn immediately following your current turn. During this turn, time is frozen for all other creatures.',
          actionType: 'Special',
          uses: '1 / Long Rest'
        }
      ],
      subclasses: [
        {
          name: 'Order of Paradox',
          description: 'Masters of rewinding enemy momentum and weaponizing causality loops.',
          features: [
            { level: 3, name: 'Echo Strike', description: 'When an enemy misses you in melee, an alternate timeline version of yourself strikes back for 1d8 + INT force damage.' },
            { level: 6, name: 'Fate Defiance', description: 'Reroll any saving throw or force an attacker to reroll a natural 20.' }
          ]
        },
        {
          name: 'Epoch Weaver',
          description: 'Guardians of cosmic history who manipulate aging, decay, and cellular acceleration.',
          features: [
            { level: 3, name: 'Withering Touch', description: 'Inflict 2d6 necrotic damage on a hit and reduce the target’s walking speed by 15 feet.' },
            { level: 6, name: 'Aura of Timelessness', description: 'All allies within 15 ft cannot be magically aged and have advantage on saves vs paralyzed/stunned.' }
          ]
        }
      ],
      quickBuild: 'Prioritize Intelligence as your highest score, followed by Constitution or Dexterity for survival.'
    },
    {
      name: 'Runecarver Juggernaut',
      hitDie: 'd10',
      primaryAbility: 'Strength & Constitution',
      savingThrows: ['Strength', 'Constitution'],
      role: 'Heavy Armored Frontline Bruiser, Elemental Glyphs & Arcane Impact',
      description: 'Ancient martial artisans who etch glowing runic scripts directly into armor, skin, and weapons to channel primordial elemental forces.',
      proficiencies: {
        armor: ['All armor', 'Shields'],
        weapons: ['Simple weapons', 'Martial weapons'],
        tools: ["Mason's tools", "Smith's tools"],
        savingThrows: ['Strength', 'Constitution'],
        skills: 'Choose two from Athletics, Arcana, Intimidation, Perception, Survival'
      },
      spellcasting: {
        type: 'None',
        ability: 'Constitution',
        notes: 'Inscribes runic glyphs that store latent magical surges without spell slots.'
      },
      featuresByLevel: [
        {
          level: 1,
          name: 'Runic Inscription',
          description: 'Inscribe up to 2 active Runes (Frost, Flame, Stone, Storm) onto your gear during a short rest. Each rune grants a passive resistance and an active burst.',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 2,
          name: 'Runic Overcharge',
          description: 'Expend an active rune to deal 2d8 elemental damage on a weapon hit and knock the enemy prone (DC 8 + Prof + CON).',
          actionType: 'Bonus Action',
          uses: 'CON mod / Short Rest'
        },
        {
          level: 3,
          name: 'Glyph Archetype Choice',
          description: 'Select your Runecarver Order (Order of the Stone Warden or Order of the Storm Cleaver).',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 5,
          name: 'Extra Attack',
          description: 'You can attack twice instead of once whenever you take the Attack action on your turn.',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 20,
          name: 'Living Primordial Monument (Capstone)',
          description: 'Transform into a 12-foot titan of glowing stone and energy for 1 minute: gain resistance to all damage, +4 STR, and melee attacks deal +2d10 force damage.',
          actionType: 'Bonus Action',
          uses: '1 / Long Rest'
        }
      ],
      subclasses: [
        {
          name: 'Order of the Stone Warden',
          description: 'Impenetrable defenders who draw strength from tectonic plates and subterranean bedrock.',
          features: [
            { level: 3, name: 'Bedrock Bastion', description: 'While wearing heavy armor, reduce all incoming bludgeoning, piercing, and slashing damage by 3.' },
            { level: 6, name: 'Tremor Shockwave', description: 'Slam the ground to create a 20ft radius difficult terrain zone and force enemies to make DEX saves or fall prone.' }
          ]
        },
        {
          name: 'Order of the Storm Cleaver',
          description: 'Fierce warriors who channel lightning arcs through two-handed blades.',
          features: [
            { level: 3, name: 'Thunderous Impact', description: 'Melee strikes release thunder claps dealing 1d6 thunder damage to adjacent foes.' },
            { level: 6, name: 'Lightning Leap', description: 'Leap up to 30 ft in an arc of lightning as a bonus action, dealing 2d8 lightning damage where you land.' }
          ]
        }
      ],
      quickBuild: 'Make Strength your highest score for powerful attacks, followed closely by Constitution for high hit points and rune save DCs.'
    },
    {
      name: 'Blood Hunter / Hemomancer',
      hitDie: 'd10',
      primaryAbility: 'Dexterity or Strength & Wisdom',
      savingThrows: ['Dexterity', 'Wisdom'],
      role: 'Sacrificial Striker, Dark Arcana & Crimson Rites',
      description: 'Tenacious warriors who have mastered forbidden hemocraft to imbue their weapons with elemental blood rites and curse their foes.',
      proficiencies: {
        armor: ['Light armor', 'Medium armor', 'Shields'],
        weapons: ['Simple weapons', 'Martial weapons'],
        tools: ["Alchemist's supplies"],
        savingThrows: ['Dexterity', 'Wisdom'],
        skills: 'Choose three from Athletics, Acrobatics, Arcana, History, Insight, Investigation, Survival'
      },
      spellcasting: {
        type: 'Third',
        ability: 'Wisdom',
        notes: 'Casts dark banishment and blood pact spells using hemocraft focus.'
      },
      featuresByLevel: [
        {
          level: 1,
          name: 'Crimson Rite',
          description: 'Sacrifice HP equal to your character level to awaken an elemental rite (Flame, Frost, or Storm) on your weapon, adding 1d4 damage of that type to every hit.',
          actionType: 'Bonus Action',
          uses: 'At Will (HP Cost)'
        },
        {
          level: 2,
          name: 'Blood Maledict & Blood Curses',
          description: 'Invoke dark blood curses to bind, blind, or debilitate enemies. You can amplify a curse by suffering damage equal to one hemocraft die.',
          actionType: 'Bonus Action',
          uses: 'WIS mod / Short Rest'
        },
        {
          level: 3,
          name: 'Blood Hunter Order',
          description: 'Choose your Hunter Order (Order of the Lycan or Order of the Ghostslayer).',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 5,
          name: 'Extra Attack',
          description: 'Attack twice whenever you take the Attack action on your turn.',
          actionType: 'Passive',
          uses: 'Passive'
        },
        {
          level: 20,
          name: 'Sanguine Mastery (Capstone)',
          description: 'Maximize all crimson rite and blood curse damage rolls. When you are reduced to 0 HP, immediately regain half your max HP once per Long Rest.',
          actionType: 'Passive',
          uses: '1 / Long Rest'
        }
      ],
      subclasses: [
        {
          name: 'Order of the Ghostslayer',
          description: 'Specialists in hunting undead, incorporeal spirits, and planar horrors.',
          features: [
            { level: 3, name: 'Rite of the Dawn', description: 'Crimson rite deals radiant damage, and deals extra damage against undead and fiends.' },
            { level: 6, name: 'Ethereal Step', description: 'Move through physical objects and creatures as if they were difficult terrain for 1 round.' }
          ]
        },
        {
          name: 'Order of the Lycan',
          description: 'Warriors who tame the beast within through controlled lycanthropic hybrid transformation.',
          features: [
            { level: 3, name: 'Hybrid Transformation', description: 'Transform into a predatory hybrid gaining +1 AC, Advantage on STR checks, and 1d6 slashing claws with bonus unarmed strike.' },
            { level: 6, name: 'Predatory Pounce', description: 'Gain +10 ft movement speed and advantage on tracking by scent.' }
          ]
        }
      ],
      quickBuild: 'Prioritize Dexterity (or Strength) for melee/ranged attacks, and Wisdom for Blood Curse DCs.'
    }
  ];

  const selected = pick(classArchetypes);
  const customName = prompt.trim() ? prompt.trim().split(' ')[0] : selected.name;

  return {
    ...selected,
    name: prompt.trim() ? prompt.trim() : selected.name,
    edition
  };
}

// ==========================================
// 8. HOMEBREW RACE PROCEDURAL GENERATOR
// ==========================================
export function generateProceduralRace(prompt: string = '', edition: RuleEdition = '5e'): any {
  const raceArchetypes = [
    {
      name: 'Voidtouched Astralkin',
      creatureType: 'Aberration',
      size: 'Medium',
      speed: 30,
      speedNotes: '30 ft. walking, 30 ft. hover fly speed while phased',
      abilityBonuses: [{ ability: 'INT', bonus: 2 }, { ability: 'DEX', bonus: 1 }],
      abilityBonusesStr: '+2 Intelligence, +1 Dexterity',
      darkvision: true,
      senses: 'Superior Darkvision 120 ft., Void Sense',
      description: 'Humanoids bathed in the cold radiance of deep space and astral rifts. Their skin glimmers with faint starlight constellations, and they can momentarily phase between dimensions to avoid harm.',
      traits: [
        {
          name: 'Astral Step',
          description: 'As a Bonus Action, teleport up to 30 feet to an unoccupied space you can see. Usable a number of times equal to your Proficiency Bonus per Long Rest.',
          actionType: 'Bonus Action',
          recharge: 'Proficiency Bonus / Long Rest'
        },
        {
          name: 'Cosmic Ward',
          description: 'You have resistance to Psychic damage and Force damage.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Vacuum Breath',
          description: 'You do not need to breathe air and can survive in the vacuum of the Astral Sea.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Innate Star-Sight',
          description: 'You know the Dancing Lights cantrip. At level 3, you can cast Misty Step once per long rest without spell slots.',
          actionType: 'Action',
          recharge: 'Long Rest'
        }
      ],
      languages: ['Common', 'Deep Speech', 'Celestial'],
      subraces: [
        { name: 'Nebula Stalker', description: 'Gains proficiency in Stealth and can turn invisible in dim light.', traitBonus: '+1 Stealth proficiency' },
        { name: 'Singularity Binder', description: 'Can create a 10ft gravity pull once per short rest pulling enemies 10ft toward you.', traitBonus: 'Gravity Pull ability' }
      ],
      ageAndLifespan: 'Mature around age 20 and can live up to 400 years.',
      alignmentTendencies: 'Tend toward chaotic or neutral alignments due to their detachment from worldly conventions.'
    },
    {
      name: 'Clockwork Automaton',
      creatureType: 'Construct',
      size: 'Medium',
      speed: 30,
      speedNotes: '30 ft. walking (Heavy armor does not reduce speed)',
      abilityBonuses: [{ ability: 'CON', bonus: 2 }, { ability: 'INT', bonus: 1 }],
      abilityBonusesStr: '+2 Constitution, +1 Intelligence (or +1 STR)',
      darkvision: true,
      senses: 'Darkvision 60 ft., Mechanical Auditory Sensors',
      description: 'Sentient beings constructed from reinforced brass alloys, springwork gears, and an alchemical ether-heart. Highly analytical, precise, and resilient against biological hazards.',
      traits: [
        {
          name: 'Construct Resilience',
          description: 'You have advantage on saving throws against being poisoned or paralyzed, and you are immune to poison damage and disease.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Integrated Plating',
          description: 'Your base AC cannot be lower than 16 (plus shield bonus if equipped). Armor cannot be removed against your will.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Sentry Rest',
          description: 'You do not need to sleep, eat, or drink. During a long rest, you remain motionless and alert for 6 hours.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Overcharge Core',
          description: 'As a Reaction when hit by a melee attack, discharge an electric burst dealing 2d8 lightning damage to the attacker (DC 8 + Prof + CON save for half).',
          actionType: 'Reaction',
          recharge: 'Short Rest'
        }
      ],
      languages: ['Common', 'Gnomish', 'Binary/Automaton Code'],
      subraces: [
        { name: 'Siege Engine Chassis', description: 'Counts as Large for carry/push/drag capacity and gains +1 STR.', traitBonus: 'Powerful Build' },
        { name: 'Chrono-Clockwork Chassis', description: 'Gains +2 to Initiative rolls and +5 ft walking speed.', traitBonus: '+2 Initiative' }
      ],
      ageAndLifespan: 'Immune to natural aging; with proper maintenance and oiling, can live indefinitely.',
      alignmentTendencies: 'Tend heavily toward lawful alignments (Lawful Neutral or Lawful Good).'
    },
    {
      name: 'Feywild Kitsune',
      creatureType: 'Fey',
      size: 'Medium',
      speed: 35,
      speedNotes: '35 ft. walking, nimble acrobatics',
      abilityBonuses: [{ ability: 'CHA', bonus: 2 }, { ability: 'DEX', bonus: 1 }],
      abilityBonusesStr: '+2 Charisma, +1 Dexterity',
      darkvision: true,
      senses: 'Darkvision 60 ft., Fey Perception',
      description: 'Graceful fox-humanoid shapechangers blessed by the archfey of the Feywild. They possess multiple fox tails reflecting their magical wisdom and can conjure illusions and foxfire.',
      traits: [
        {
          name: 'Shapechanger',
          description: 'As an Action, you can transform into the shape of a small red or arctic fox or return to your humanoid form. Your stats remain the same in both forms.',
          actionType: 'Action',
          recharge: 'At Will'
        },
        {
          name: 'Foxfire Magic',
          description: 'You know the Produce Flame cantrip. At level 3, cast Charm Person once per long rest. At level 5, cast Mirror Image once per long rest using CHA.',
          actionType: 'Action',
          recharge: 'Long Rest'
        },
        {
          name: 'Fey Ancestry',
          description: 'You have advantage on saving throws against being charmed, and magic cannot put you to sleep.',
          actionType: 'Passive',
          recharge: 'Passive'
        },
        {
          name: 'Nine-Tailed Grace',
          description: 'You have proficiency in the Acrobatics and Deception skills.',
          actionType: 'Passive',
          recharge: 'Passive'
        }
      ],
      languages: ['Common', 'Sylvan', 'Elvish'],
      subraces: [
        { name: 'Solar Spirit Kitsune', description: 'Foxfire deals radiant damage and sheds bright golden sunlight.', traitBonus: 'Radiant Foxfire' },
        { name: 'Shadow Moon Kitsune', description: 'Foxfire deals cold damage and gains proficiency in Stealth.', traitBonus: 'Cold Foxfire + Stealth' }
      ],
      ageAndLifespan: 'Grow an additional tail every century, living up to 900 years.',
      alignmentTendencies: 'Tend toward playful chaotic good or chaotic neutral alignments.'
    }
  ];

  const selected = pick(raceArchetypes);
  return {
    ...selected,
    name: prompt.trim() ? prompt.trim() : selected.name,
    edition
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
  if (entityType === 'class') {
    return {
      entity: generateProceduralClass(prompt, edition),
      entityType
    };
  }

  if (entityType === 'race') {
    return {
      entity: generateProceduralRace(prompt, edition),
      entityType
    };
  }

  if (entityType === 'treasure' || entityType === 'loot') {
    const tier = context?.tier || 'CR 5-10 (Tier 2)';
    return {
      entity: generateProceduralTreasure(tier, 'Dungeon Boss Chest', prompt, edition),
      entityType
    };
  }

  if (entityType === 'character') {
    return {
      entity: generateProceduralCharacter(prompt, edition, context, false),
      entityType
    };
  }

  if (entityType === 'npc') {
    return {
      entity: generateProceduralCharacter(prompt, edition, context, true),
      entityType
    };
  }

  if (entityType === 'monster') {
    return {
      entity: generateProceduralMonster(prompt, edition, context),
      entityType
    };
  }

  if (entityType === 'merchant') {
    return {
      entity: generateProceduralMerchant(prompt, edition, context),
      entityType
    };
  }

  if (entityType === 'item') {
    return {
      entity: generateProceduralItem(prompt, edition, context),
      entityType
    };
  }

  if (entityType === 'spell') {
    return {
      entity: generateProceduralSpell(prompt, edition, context),
      entityType
    };
  }

  if (entityType === 'quest') {
    return {
      entity: generateProceduralQuest(prompt, edition, context),
      entityType
    };
  }

  if (entityType === 'graph_node') {
    return {
      entity: generateProceduralGraphNode(prompt, edition, context),
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
