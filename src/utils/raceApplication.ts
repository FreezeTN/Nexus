import { CharacterData, ClassFeature, RuleEdition, RacialSkillBonus, AbilityName } from '../types';
import { CompendiumItem, loadCustomCompendiumEntries, BASE_COMPENDIUM_RACES, BASE_35E_COMPENDIUM_RACES } from '../data/compendiumData';
import {
  parseAbilityScoreBonuses,
  getScalingStatAtLevel,
  parseDamageReductionFromText,
  parseNaturalArmorFromText,
  parseSpellResistanceFromText,
  parseEnergyResistancesFromText,
  parseSlashProgression
} from './homebrewValidator';
import { recalculateCharacterAC } from './dndCalculations';
import { SRD_RACIAL_SKILL_BONUSES } from './racialSkillBonusEngine';
import {
  CLASSIC_SRD_HALF_BREEDS,
  ClassicSRDHalfBreed,
  BaseCreature35e,
  HalfBreedTemplate35e,
  resolve35eHalfBreedTemplate
} from '../data/halfBreedData';

export interface RacialSpeedDetails {
  speed: number;
  speedFly?: number;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
  specialNotes?: string;
  source: string;
}

export interface CalculatedRaceStats {
  raceName: string;
  abilityBonuses: Record<string, number>;
  abilityBonusSummary: string[];
  racialSkillBonuses: RacialSkillBonus[];
  damageReduction: {
    value: number;
    bypass: string;
    hasScaling: boolean;
  };
  naturalArmor: {
    bonus: number;
    hasScaling: boolean;
  };
  spellResistance: {
    value: number;
    hasScaling: boolean;
  };
  energyResistances: Record<string, number>;
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  speed: number;
  speedFly?: number;
  speedSwim?: number;
  speedClimb?: number;
  speedBurrow?: number;
  speedNotes?: string;
  sizeCategory: 'Tiny' | 'Small' | 'Medium' | 'Large';
  darkvision: boolean | number | string;
  senses: string;
  traits: ClassFeature[];
  naturalWeapons: Array<{
    name: string;
    damageDice: string;
    damageType: string;
    range: string;
    notes?: string;
  }>;
}

/**
 * Returns the standard racial movement profile for any race in 3.5e or 5e.
 */
export function getRacialBaseSpeed(raceName?: string, edition?: RuleEdition): RacialSpeedDetails {
  if (!raceName || !raceName.trim()) {
    return { speed: 30, source: 'Default Humanoid' };
  }

  const raw = raceName.trim();
  const lower = raw.toLowerCase();
  const is35e = edition === '3.5e';

  // Specific Racial Speed Rules & Subraces
  if (lower.includes('centaur')) {
    return {
      speed: is35e ? 50 : 40,
      specialNotes: is35e ? '3.5e Large monstrous humanoid 50 ft. base land speed' : '5e Centaur 40 ft. base walking speed',
      source: is35e ? '3.5e Centaur (50 ft)' : '5e Centaur (40 ft)'
    };
  }

  if (lower.includes('aarakocra')) {
    return {
      speed: 25,
      speedFly: 50,
      specialNotes: 'Fly 50 ft. (cannot wear medium or heavy armor)',
      source: 'Aarakocra (25 ft / Fly 50 ft)'
    };
  }

  if (lower.includes('wood elf')) {
    return {
      speed: is35e ? 30 : 35,
      specialNotes: is35e ? '3.5e Wood Elf (30 ft)' : 'Fleet of Foot: Base walking speed is 35 ft',
      source: is35e ? '3.5e Wood Elf' : '5e Wood Elf (35 ft)'
    };
  }

  if (lower.includes('tabaxi') || lower.includes('catfolk')) {
    return {
      speed: 30,
      speedClimb: 20,
      specialNotes: 'Feline Agility & 20 ft. Climb Speed',
      source: 'Tabaxi (30 ft / Climb 20 ft)'
    };
  }

  if (lower.includes('triton') || lower.includes('sea elf') || lower.includes('water genasi')) {
    return {
      speed: 30,
      speedSwim: 30,
      specialNotes: 'Amphibious with 30 ft. Swim Speed',
      source: `${raw} (30 ft / Swim 30 ft)`
    };
  }

  if (lower.includes('lizardfolk')) {
    return {
      speed: 30,
      speedSwim: 30,
      specialNotes: '30 ft. Swim Speed',
      source: 'Lizardfolk (30 ft / Swim 30 ft)'
    };
  }

  if (lower.includes('winged tiefling') || (lower.includes('tiefling') && lower.includes('winged'))) {
    return {
      speed: 30,
      speedFly: 30,
      specialNotes: 'Bat wings with 30 ft. Fly speed',
      source: 'Winged Tiefling (30 ft / Fly 30 ft)'
    };
  }

  // Dwarf (all subraces: Hill Dwarf, Mountain Dwarf, Deep Dwarf, Duergar)
  if (lower.includes('dwarf')) {
    return {
      speed: is35e ? 20 : 25,
      specialNotes: is35e
        ? '3.5e Land speed 20 ft. Speed is never reduced by medium/heavy armor or encumbrance.'
        : '5e Land speed 25 ft. Speed is not reduced by wearing heavy armor.',
      source: is35e ? '3.5e Dwarf (20 ft)' : '5e Dwarf (25 ft)'
    };
  }

  // Halfling (Lightfoot, Stout, Deep, Tallfellow, Ghostwise)
  if (lower.includes('halfling')) {
    return {
      speed: is35e ? 20 : 25,
      specialNotes: is35e ? '3.5e Small size base land speed 20 ft.' : '5e Small size base walking speed 25 ft.',
      source: is35e ? '3.5e Halfling (20 ft)' : '5e Halfling (25 ft)'
    };
  }

  // Gnome (Rock Gnome, Forest Gnome, Deep Gnome / Svirfneblin)
  if (lower.includes('gnome') || lower.includes('svirfneblin')) {
    return {
      speed: is35e ? 20 : 25,
      specialNotes: is35e ? '3.5e Small size base land speed 20 ft.' : '5e Small size base walking speed 25 ft.',
      source: is35e ? '3.5e Gnome (20 ft)' : '5e Gnome (25 ft)'
    };
  }

  if (lower.includes('goblin') || lower.includes('kobold')) {
    return {
      speed: 30,
      source: `${raw} (30 ft)`
    };
  }

  if (edition === 'shadowrun') {
    return {
      speed: 10,
      specialNotes: 'Walking Rate 10m / Running Rate 25m base',
      source: 'Shadowrun Metatype'
    };
  }

  if (edition === 'cthulhu') {
    return {
      speed: 8,
      specialNotes: 'Movement Rate (MOV 8)',
      source: 'CoC 7e Investigator'
    };
  }

  return {
    speed: 30,
    source: 'Standard Humanoid (30 ft)'
  };
}

/**
 * Normalizes an ability score name to 3-letter uppercase (STR, DEX, CON, INT, WIS, CHA)
 */
export function normalizeAbilityName(stat: string): string | null {
  const s = (stat || '').trim().toUpperCase();
  if (['STR', 'STRENGTH'].includes(s)) return 'STR';
  if (['DEX', 'DEXTERITY'].includes(s)) return 'DEX';
  if (['CON', 'CONSTITUTION'].includes(s)) return 'CON';
  if (['INT', 'INTELLIGENCE'].includes(s)) return 'INT';
  if (['WIS', 'WISDOM'].includes(s)) return 'WIS';
  if (['CHA', 'CHARISMA'].includes(s)) return 'CHA';
  if (['ALL'].includes(s)) return 'ALL';
  return null;
}

/**
 * Searches custom compendium entries and classic SRD half-breed catalogs to find matching race data.
 */
export function findRaceInCompendiumOrSRD(
  raceName: string,
  edition?: RuleEdition,
  customEntries?: CompendiumItem[]
): CompendiumItem | null {
  if (!raceName || !raceName.trim()) return null;

  // Clean race name in case of emoji decorations or badge suffixes from dropdowns
  let cleanName = raceName.trim();
  cleanName = cleanName.replace(/^[✨🌟🧬🧝\s]+/, '').replace(/\s*\((Homebrew|Custom|Half-Breed|Half-Breed Template|Template|Universal)[^)]*\)$/i, '').trim();

  const rawTarget = raceName.trim().toLowerCase();
  const target = cleanName.toLowerCase();

  // 1. Search provided or loaded custom compendium entries + base SRD races according to edition
  const custom = customEntries || loadCustomCompendiumEntries();
  const baseRaces = edition === '3.5e' ? BASE_35E_COMPENDIUM_RACES : BASE_COMPENDIUM_RACES;
  const entries = [...custom, ...baseRaces];
  const isRaceCat = (cat?: string) => cat === 'races' || cat === 'race' || cat?.toLowerCase() === 'races' || cat?.toLowerCase() === 'race';

  const foundCustom = entries.find(
    e => isRaceCat(e.category) && (
      e.name.trim().toLowerCase() === target ||
      e.name.trim().toLowerCase() === rawTarget
    )
  );
  if (foundCustom) return foundCustom;

  // Partial match fallback for custom races (e.g. "Tiefling Trueblood" vs "Tiefling Trueblood Lineage")
  const partialCustom = entries.find(
    e => isRaceCat(e.category) && (
      e.name.toLowerCase().includes(target) || target.includes(e.name.toLowerCase())
    )
  );
  if (partialCustom) return partialCustom;

  // 2. Search Classic SRD Half-Breed entries
  const srdMatch = CLASSIC_SRD_HALF_BREEDS.find(
    hb => hb.name.toLowerCase() === target ||
          hb.id.toLowerCase() === target ||
          target.includes(hb.name.toLowerCase()) ||
          (target.includes('half-dragon') && hb.id.includes('half-dragon')) ||
          (target.includes('half-elf') && hb.id.includes('half-elf')) ||
          (target.includes('half-orc') && hb.id.includes('half-orc'))
  );

  if (srdMatch) {
    return convertSrdHalfBreedToCompendiumItem(srdMatch);
  }

  // 3. Fallback: Core race basic stats generator
  return generateStandardRaceCompendiumFallback(cleanName, edition);
}

/**
 * Converts a ClassicSRDHalfBreed into a CompendiumItem representation
 */
function convertSrdHalfBreedToCompendiumItem(srd: ClassicSRDHalfBreed): CompendiumItem {
  const abilityBonuses: Array<{ ability: string; bonus: number }> = [];
  const text = srd.statBonusText || '';
  const parsed = parseAbilityScoreBonuses(text);
  for (const p of parsed) {
    abilityBonuses.push({ ability: p.stat, bonus: p.value });
  }

  // Parse natural armor, DR, resistances if any in traits/description
  const fullText = `${srd.description} ${srd.traits.map(t => `${t.name}: ${t.description}`).join('\n')}`;
  const detectedNat = parseNaturalArmorFromText(fullText, 1);
  const detectedDr = parseDamageReductionFromText(fullText, 1);
  const detectedRes = parseEnergyResistancesFromText(fullText, 1);

  const energyResistances = detectedRes.map(r => ({
    energyType: r.energyType,
    value: r.value
  }));

  const immunities: string[] = [];
  if (fullText.toLowerCase().includes('poison immunity') || fullText.toLowerCase().includes('immune to poison')) {
    immunities.push('Poison');
  }
  if (fullText.toLowerCase().includes('sleep immunity') || fullText.toLowerCase().includes('immune to sleep')) {
    immunities.push('Sleep');
  }
  if (fullText.toLowerCase().includes('paralysis immunity') || fullText.toLowerCase().includes('immune to paralysis')) {
    immunities.push('Paralysis');
  }

  return {
    id: `comp-srd-${srd.id}`,
    name: srd.name,
    category: 'races',
    edition: srd.edition,
    source: srd.source,
    description: srd.description,
    raceData: {
      size: srd.size,
      speed: srd.speed,
      darkvision: srd.hasDarkvision ? 60 : false,
      senses: srd.hasDarkvision ? 'Darkvision 60 ft.' : srd.hasLowLightVision ? 'Low-Light Vision' : 'Normal',
      abilityBonuses,
      abilityBonusesStr: srd.statBonusText,
      naturalArmorBonus: detectedNat?.value || (srd.id.includes('half-dragon') ? 4 : undefined),
      damageReductionValue: detectedDr?.value || (srd.id.includes('half-fiend') ? 5 : undefined),
      damageReductionBypass: detectedDr?.bypass || (srd.id.includes('half-fiend') ? 'magic' : undefined),
      energyResistances,
      immunities,
      traits: srd.traits.map(t => ({
        name: t.name,
        description: t.description,
        actionType: 'Passive',
        recharge: 'Passive'
      })),
      isHalfBreed: true,
      halfBreedData: {
        isClassicSRD: true,
        classicSRDId: srd.id
      }
    }
  };
}

/**
 * Provides basic SRD race info for standard races if not in custom compendium
 */
function generateStandardRaceCompendiumFallback(raceName: string, edition?: RuleEdition): CompendiumItem | null {
  const rLower = raceName.toLowerCase();
  const is35e = edition === '3.5e';
  const racialSpeed = getRacialBaseSpeed(raceName, edition);

  let abilityBonuses: Array<{ ability: string; bonus: number }> = [];
  let size = 'Medium';
  let speed = racialSpeed.speed;
  let speedFly = racialSpeed.speedFly;
  let speedSwim = racialSpeed.speedSwim;
  let speedClimb = racialSpeed.speedClimb;
  let speedBurrow = racialSpeed.speedBurrow;
  let speedNotes = racialSpeed.specialNotes;
  let darkvision: boolean | number = false;
  let naturalArmorBonus: number | undefined;
  let energyResistances: Array<{ energyType: string; value: number }> = [];
  let immunities: string[] = [];
  const traits: Array<{ name: string; description: string }> = [];

  if (rLower.includes('human')) {
    if (is35e) {
      abilityBonuses = [];
      traits.push({ name: 'Extra Feat', description: '1 extra feat at 1st level.' });
      traits.push({ name: 'Bonus Skill Points', description: '4 extra skill points at 1st level, and 1 extra skill point at each additional level.' });
    } else {
      abilityBonuses = [{ ability: 'ALL', bonus: 1 }];
      traits.push({ name: 'Versatile', description: '+1 to all ability scores, extra skill/feat.' });
    }
  } else if (rLower.includes('wood elf')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'CON', bonus: -2 }];
    } else {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'WIS', bonus: 1 }];
    }
    darkvision = 60;
    traits.push({ name: 'Fleet of Foot', description: is35e ? 'Base land speed is 30 ft.' : 'Base walking speed is 35 ft.' });
    traits.push({ name: 'Fey Ancestry', description: 'Advantage on saving throws against charm, magic cannot sleep you.' });
    traits.push({ name: 'Mask of the Wild', description: 'Can attempt to hide even when only lightly obscured.' });
  } else if (rLower.includes('elf')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'CON', bonus: -2 }];
      traits.push({ name: 'Immunity to Magic Sleep', description: 'Immune to magical sleep spells and effects.' });
      traits.push({ name: 'Enchantment Resistance', description: '+2 racial save bonus vs enchantment spells/effects.' });
      traits.push({ name: 'Keen Senses', description: '+2 racial bonus on Listen, Search, and Spot checks.' });
    } else {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }];
      darkvision = 60;
      traits.push({ name: 'Fey Ancestry', description: 'Advantage on saving throws against charm, magic cannot sleep you.' });
      traits.push({ name: 'Keen Senses', description: 'Proficiency in Perception skill.' });
    }
  } else if (rLower.includes('dwarf')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'CON', bonus: 2 }, { ability: 'CHA', bonus: -2 }];
      speed = 20;
    } else {
      abilityBonuses = [{ ability: 'CON', bonus: 2 }];
    }
    darkvision = 60;
    energyResistances.push({ energyType: 'poison', value: 5 });
    traits.push({ name: 'Dwarven Resilience', description: is35e ? '+2 racial save bonus vs poison and spells.' : 'Advantage on saves vs poison, resistance against poison damage.' });
    traits.push({
      name: is35e ? 'Steady Footing' : 'Dwarven Toughness',
      description: is35e
        ? 'Base land speed 20 ft. Speed is never reduced by medium or heavy armor or encumbrance.'
        : 'Base walking speed 25 ft. Speed is not reduced by wearing heavy armor.'
    });
  } else if (rLower.includes('halfling')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'STR', bonus: -2 }];
      speed = 20;
    } else {
      abilityBonuses = [{ ability: 'DEX', bonus: 2 }];
    }
    size = 'Small';
    traits.push({ name: 'Lucky', description: is35e ? '+1 racial bonus on all saving throws.' : 'Reroll 1s on d20 attacks, checks, or saves.' });
    traits.push({ name: 'Halfling Nimbleness', description: 'Can move through space of creatures of a larger size.' });
  } else if (rLower.includes('dragonborn')) {
    abilityBonuses = [{ ability: 'STR', bonus: 2 }, { ability: 'CHA', bonus: 1 }];
    traits.push({ name: 'Draconic Breath Weapon', description: 'Exhale elemental destructive energy in an area.' });
    traits.push({ name: 'Draconic Resistance', description: 'Resistance to energy damage matching your ancestry.' });
  } else if (rLower.includes('tiefling')) {
    abilityBonuses = [{ ability: 'CHA', bonus: 2 }, { ability: 'INT', bonus: 1 }];
    darkvision = 60;
    energyResistances.push({ energyType: 'fire', value: 5 });
    traits.push({ name: 'Hellish Resistance', description: 'Resistance against fire damage.' });
    traits.push({ name: 'Infernal Legacy', description: 'Innate thaumaturgy, hellish rebuke, darkness spells.' });
  } else if (rLower.includes('gnome') || rLower.includes('svirfneblin')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'CON', bonus: 2 }, { ability: 'STR', bonus: -2 }];
      speed = 20;
    } else {
      abilityBonuses = [{ ability: 'INT', bonus: 2 }];
    }
    size = 'Small';
    darkvision = 60;
    traits.push({ name: 'Gnome Cunning', description: 'Advantage on INT, WIS, CHA saves against magic.' });
  } else if (rLower.includes('half-orc') || rLower.includes('orc')) {
    if (is35e) {
      abilityBonuses = [{ ability: 'STR', bonus: 2 }, { ability: 'INT', bonus: -2 }, { ability: 'CHA', bonus: -2 }];
    } else {
      abilityBonuses = [{ ability: 'STR', bonus: 2 }, { ability: 'CON', bonus: 1 }];
    }
    darkvision = 60;
    traits.push({ name: is35e ? 'Orc Blood' : 'Relentless Endurance', description: is35e ? 'Considered an orc for all effects related to race.' : 'Drop to 1 HP instead of 0 once per long rest.' });
  } else if (rLower.includes('half-elf')) {
    abilityBonuses = [];
    traits.push({ name: 'Immunity to Magic Sleep', description: 'Immune to magical sleep spells and effects.' });
    traits.push({ name: 'Enchantment Resistance', description: '+2 racial save bonus vs enchantment spells/effects.' });
    traits.push({ name: 'Keen Senses', description: '+1 racial bonus on Listen, Search, and Spot checks.' });
    traits.push({ name: 'Diplomatic Grace', description: '+2 racial bonus on Diplomacy and Gather Information checks.' });
  } else if (rLower.includes('centaur')) {
    abilityBonuses = [{ ability: 'STR', bonus: 2 }, { ability: 'WIS', bonus: 1 }];
    traits.push({ name: 'Equine Mobility', description: is35e ? '50 ft. base land speed' : '40 ft. base walking speed' });
  } else if (rLower.includes('tabaxi') || rLower.includes('catfolk')) {
    abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'CHA', bonus: 1 }];
    traits.push({ name: 'Feline Agility', description: 'When moving on your turn in combat, you can double your speed until end of turn.' });
    traits.push({ name: "Cat's Claws", description: 'Climbing speed of 20 feet and 1d4 slashing unarmed strikes.' });
  } else if (rLower.includes('aarakocra')) {
    abilityBonuses = [{ ability: 'DEX', bonus: 2 }, { ability: 'WIS', bonus: 1 }];
    traits.push({ name: 'Flight', description: 'You have a flying speed of 50 feet while not wearing medium or heavy armor.' });
  } else if (rLower.includes('triton') || rLower.includes('sea elf')) {
    abilityBonuses = [{ ability: 'CON', bonus: 1 }, { ability: 'STR', bonus: 1 }, { ability: 'CHA', bonus: 1 }];
    traits.push({ name: 'Amphibious', description: 'Can breathe air and water, swim speed 30 ft.' });
  } else if (rLower.includes('lizardfolk')) {
    abilityBonuses = [{ ability: 'CON', bonus: 2 }, { ability: 'WIS', bonus: 1 }];
    naturalArmorBonus = is35e ? 5 : 3;
    traits.push({ name: 'Natural Armor', description: 'Tough scaly hide provides natural armor bonus.' });
    traits.push({ name: 'Swim Speed', description: 'Swimming speed of 30 feet.' });
  } else {
    // If not specifically matched, use default humanoid with racial speed lookup
    return {
      id: `comp-std-${rLower.replace(/\s+/g, '-')}`,
      name: raceName,
      category: 'races',
      edition: edition || '5e',
      source: 'Standard System Reference',
      description: `Standard ${raceName} race option.`,
      raceData: {
        size,
        speed,
        speedFly,
        speedSwim,
        speedClimb,
        speedBurrow,
        speedNotes,
        darkvision,
        abilityBonuses,
        naturalArmorBonus,
        energyResistances,
        immunities,
        traits: []
      }
    };
  }

  return {
    id: `comp-std-${rLower.replace(/\s+/g, '-')}`,
    name: raceName,
    category: 'races',
    edition: edition || '5e',
    source: 'Standard System Reference',
    description: `Standard ${raceName} race option.`,
    raceData: {
      size,
      speed,
      speedFly,
      speedSwim,
      speedClimb,
      speedBurrow,
      speedNotes,
      darkvision,
      abilityBonuses,
      naturalArmorBonus,
      energyResistances,
      immunities,
      traits: traits.map(t => ({
        name: t.name,
        description: t.description,
        actionType: 'Passive',
        recharge: 'Passive'
      }))
    }
  };
}

/**
 * Evaluates all raw and level-scaling stats of a race for a given character level.
 */
export function calculateRaceBonusesAndDefenses(
  raceItemOrData: CompendiumItem | any,
  characterLevel: number = 1
): CalculatedRaceStats {
  const rd = raceItemOrData.raceData ? raceItemOrData.raceData : raceItemOrData;
  const raceName = raceItemOrData.name || rd?.name || 'Custom Race';
  const desc = raceItemOrData.description || '';

  // 1. Ability Score Bonuses
  const abilityBonuses: Record<string, number> = {
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0
  };
  const abilityBonusSummary: string[] = [];

  // A. Check structured rd.abilityBonuses array
  if (Array.isArray(rd?.abilityBonuses) && rd.abilityBonuses.length > 0) {
    for (const b of rd.abilityBonuses) {
      const rawStat = b.ability || b.stat || b.name || '';
      const norm = normalizeAbilityName(rawStat);
      const val = Number(b.bonus ?? b.value ?? b.modifier ?? 0);
      if (norm === 'ALL') {
        Object.keys(abilityBonuses).forEach(k => {
          abilityBonuses[k] += val;
        });
        abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} All`);
      } else if (norm && norm in abilityBonuses) {
        abilityBonuses[norm] += val;
        abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} ${norm}`);
      }
    }
  } else if (rd?.abilityBonuses && typeof rd.abilityBonuses === 'object' && !Array.isArray(rd.abilityBonuses)) {
    // B. Check rd.abilityBonuses object e.g. { STR: 2, DEX: 1 }
    for (const [k, v] of Object.entries(rd.abilityBonuses)) {
      const norm = normalizeAbilityName(k);
      const val = Number(v ?? 0);
      if (norm && norm in abilityBonuses && val !== 0) {
        abilityBonuses[norm] += val;
        abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} ${norm}`);
      }
    }
  }

  // C. Check rd.abilityModifiers
  if (rd?.abilityModifiers && typeof rd.abilityModifiers === 'object') {
    for (const [k, v] of Object.entries(rd.abilityModifiers)) {
      const norm = normalizeAbilityName(k);
      const val = Number(v ?? 0);
      if (norm && norm in abilityBonuses && abilityBonuses[norm] === 0 && val !== 0) {
        abilityBonuses[norm] += val;
        abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} ${norm}`);
      }
    }
  }

  // D. Check rd.abilityBonusesStr or description
  const textToParse = rd?.abilityBonusesStr || (abilityBonusSummary.length === 0 ? desc : '');
  if (textToParse) {
    const parsed = parseAbilityScoreBonuses(textToParse);
    for (const p of parsed) {
      const norm = normalizeAbilityName(p.stat);
      const val = Number(p.value || 0);
      if (norm === 'ALL') {
        Object.keys(abilityBonuses).forEach(k => {
          if (abilityBonuses[k] === 0) {
            abilityBonuses[k] += val;
          }
        });
        if (!abilityBonusSummary.some(s => s.includes('All'))) {
          abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} All`);
        }
      } else if (norm && norm in abilityBonuses) {
        if (abilityBonuses[norm] === 0 && val !== 0) {
          abilityBonuses[norm] = val;
          abilityBonusSummary.push(`${val >= 0 ? '+' : ''}${val} ${norm}`);
        }
      }
    }
  }

  // 2. Damage Reduction (DR)
  let drValue = rd?.damageReductionValue ?? 0;
  let drBypass = (rd?.damageReductionBypass || '-').trim().toLowerCase();
  let hasDrScaling = false;

  if (Array.isArray(rd?.damageReductionScaling) && rd.damageReductionScaling.length > 0) {
    drValue = getScalingStatAtLevel(rd.damageReductionScaling, characterLevel);
    hasDrScaling = true;
  } else if (rd?.damageReductionScalingProgression) {
    const parsed = parseSlashProgression(rd.damageReductionScalingProgression);
    if (parsed && parsed.scaling.length > 0) {
      drValue = getScalingStatAtLevel(parsed.scaling, characterLevel);
      hasDrScaling = true;
    }
  } else if (drValue === 0 && desc) {
    const detectedDr = parseDamageReductionFromText(desc, characterLevel);
    if (detectedDr) {
      drValue = detectedDr.value;
      drBypass = detectedDr.bypass || '-';
      hasDrScaling = (detectedDr.scaling && detectedDr.scaling.length > 0) || false;
    }
  }

  // 3. Natural Armor
  let natArmorBonus = rd?.naturalArmorBonus ?? 0;
  let hasNatScaling = false;

  if (Array.isArray(rd?.naturalArmorScaling) && rd.naturalArmorScaling.length > 0) {
    natArmorBonus = getScalingStatAtLevel(rd.naturalArmorScaling, characterLevel);
    hasNatScaling = true;
  } else if (rd?.naturalArmorScalingProgression) {
    const parsed = parseSlashProgression(rd.naturalArmorScalingProgression);
    if (parsed && parsed.scaling.length > 0) {
      natArmorBonus = getScalingStatAtLevel(parsed.scaling, characterLevel);
      hasNatScaling = true;
    }
  } else if (natArmorBonus === 0 && desc) {
    const detectedNat = parseNaturalArmorFromText(desc, characterLevel);
    if (detectedNat) {
      natArmorBonus = detectedNat.value;
      hasNatScaling = (detectedNat.scaling && detectedNat.scaling.length > 0) || false;
    }
  }

  // 4. Spell Resistance (SR)
  let spellResistanceVal = rd?.spellResistanceBase ?? 0;
  let hasSrScaling = false;

  if (Array.isArray(rd?.spellResistanceScaling) && rd.spellResistanceScaling.length > 0) {
    const extraSr = getScalingStatAtLevel(rd.spellResistanceScaling, characterLevel);
    spellResistanceVal = (rd?.spellResistanceBase || 10) + extraSr;
    hasSrScaling = true;
  } else if (rd?.spellResistanceScalingProgression?.includes('Level')) {
    spellResistanceVal = 10 + characterLevel;
    hasSrScaling = true;
  } else if (spellResistanceVal === 0 && desc) {
    const detectedSr = parseSpellResistanceFromText(desc, characterLevel);
    if (detectedSr) {
      spellResistanceVal = detectedSr.value;
      hasSrScaling = (detectedSr.scaling && detectedSr.scaling.length > 0) || false;
    }
  }

  // 5. Energy Resistances (3.5e & 5e)
  const energyResistances: Record<string, number> = {};
  const damageResistances: string[] = [];

  if (Array.isArray(rd?.energyResistances) && rd.energyResistances.length > 0) {
    for (const er of rd.energyResistances) {
      const typeKey = (er.energyType || '').toLowerCase();
      if (!typeKey) continue;
      let val = er.value || 5;
      if (Array.isArray(er.scaling) && er.scaling.length > 0) {
        val = getScalingStatAtLevel(er.scaling, characterLevel);
      } else if (er.scalingProgression) {
        const parsed = parseSlashProgression(er.scalingProgression);
        if (parsed && parsed.scaling.length > 0) {
          val = getScalingStatAtLevel(parsed.scaling, characterLevel);
        }
      }
      energyResistances[typeKey] = Math.max(energyResistances[typeKey] || 0, val);
      if (!damageResistances.includes(typeKey)) {
        damageResistances.push(typeKey);
      }
    }
  }

  // Add 5e damage resistances
  if (Array.isArray(rd?.damageResistances5e)) {
    for (const dr of rd.damageResistances5e) {
      const drLower = dr.toLowerCase();
      if (!damageResistances.includes(drLower)) {
        damageResistances.push(drLower);
      }
      if (!(drLower in energyResistances)) {
        energyResistances[drLower] = 5;
      }
    }
  }

  // Parse resistances from description if none specified
  if (Object.keys(energyResistances).length === 0 && desc) {
    const detectedERs = parseEnergyResistancesFromText(desc, characterLevel);
    for (const er of detectedERs) {
      const typeKey = (er.energyType || '').toLowerCase();
      energyResistances[typeKey] = Math.max(energyResistances[typeKey] || 0, er.value);
      if (!damageResistances.includes(typeKey)) {
        damageResistances.push(typeKey);
      }
    }
  }

  // 6. Immunities (Damage & Condition)
  const damageImmunities: string[] = [];
  const conditionImmunities: string[] = [];

  if (Array.isArray(rd?.immunities)) {
    for (const imm of rd.immunities) {
      const immStr = imm.trim();
      if (['Sleep', 'Paralysis', 'Charm', 'Petrification', 'Mind-Affecting'].includes(immStr)) {
        conditionImmunities.push(immStr);
      } else {
        damageImmunities.push(immStr);
      }
    }
  }

  if (Array.isArray(rd?.damageImmunities5e)) {
    for (const di of rd.damageImmunities5e) {
      if (!damageImmunities.includes(di)) damageImmunities.push(di);
    }
  }

  if (Array.isArray(rd?.conditionImmunities5e)) {
    for (const ci of rd.conditionImmunities5e) {
      if (!conditionImmunities.includes(ci)) conditionImmunities.push(ci);
    }
  }

  // Parse immunities from description if needed
  if (damageImmunities.length === 0 && desc) {
    const textLower = desc.toLowerCase();
    if (textLower.includes('immune to poison') || textLower.includes('poison immunity')) {
      damageImmunities.push('Poison');
      conditionImmunities.push('Poisoned');
    }
    if (textLower.includes('immune to sleep') || textLower.includes('magic cannot put you to sleep')) {
      conditionImmunities.push('Sleep');
    }
    if (textLower.includes('immune to paralysis') || textLower.includes('paralysis immunity')) {
      conditionImmunities.push('Paralysis');
    }
    if (textLower.includes('immune to disease') || textLower.includes('disease immunity')) {
      conditionImmunities.push('Disease');
    }
  }

  // 7. Senses & Darkvision
  const darkvision = rd?.darkvision !== undefined ? rd.darkvision : (desc.toLowerCase().includes('darkvision') ? 60 : false);
  const senses = rd?.senses || (darkvision ? `Darkvision ${darkvision === true ? 60 : darkvision} ft.` : 'Normal');

  // 8. Traits & Spell-Like Abilities
  const traits: ClassFeature[] = [];
  if (Array.isArray(rd?.traits)) {
    for (const t of rd.traits) {
      traits.push({
        id: 'rt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: t.name,
        source: `${raceName} Racial Trait`,
        description: t.description,
        recharge: (t.recharge as any) || 'Passive'
      });
    }
  }

  // Append 3.5e Spell-Like Abilities unlocked at current level
  if (Array.isArray(rd?.spellLikeAbilities)) {
    for (const sla of rd.spellLikeAbilities) {
      if ((sla.minLevel || 1) <= characterLevel) {
        traits.push({
          id: 'sla-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: `SLA: ${sla.spellName} (${sla.usage})`,
          source: `${raceName} Spell-Like Ability`,
          description: `Unlocked at ${sla.levelRange || 'Level ' + sla.minLevel}. Usage: ${sla.usage}. ${sla.notes || ''}`,
          recharge: sla.usage.includes('day') ? 'Long Rest' : sla.usage.includes('will') ? 'None' : 'Special'
        });
      }
    }
  }

  // Append 5e Innate Spells unlocked at current level
  if (Array.isArray(rd?.innateSpells5e)) {
    for (const s of rd.innateSpells5e) {
      if ((s.level || 1) <= characterLevel) {
        traits.push({
          id: 'isp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: `Innate: ${s.spellName} (${s.recharge})`,
          source: `${raceName} Innate Spellcasting`,
          description: `Cast ${s.spellName} (${s.recharge}) using ${s.ability || 'Charisma'}.`,
          recharge: s.recharge.includes('Rest') ? 'Long Rest' : 'None'
        });
      }
    }
  }

  // 9. Natural Weapons
  const naturalWeapons: Array<{
    name: string;
    damageDice: string;
    damageType: string;
    range: string;
    notes?: string;
  }> = [];

  if (Array.isArray(rd?.naturalWeapons)) {
    for (const nw of rd.naturalWeapons) {
      naturalWeapons.push({
        name: `${nw.name} (Natural)`,
        damageDice: nw.damage || '1d6',
        damageType: 'Physical',
        range: 'Melee (5 ft.)',
        notes: nw.notes || `${raceName} Natural Weapon`
      });
    }
  }

  // 10. Racial Skill Bonuses
  let racialSkillBonuses: RacialSkillBonus[] = [];

  // A. Check structured racialSkillBonuses on rd or raceItemOrData
  if (Array.isArray(rd?.racialSkillBonuses) && rd.racialSkillBonuses.length > 0) {
    racialSkillBonuses = [...rd.racialSkillBonuses];
  } else if (Array.isArray(raceItemOrData?.racialSkillBonuses) && raceItemOrData.racialSkillBonuses.length > 0) {
    racialSkillBonuses = [...raceItemOrData.racialSkillBonuses];
  }

  // B. If empty, check skillAffinities or skillAffinitiesStr
  const skillAffText = rd?.skillAffinities || rd?.skillAffinitiesStr || '';
  if (racialSkillBonuses.length === 0 && skillAffText) {
    const regex = /([+-]?\d+)\s*(?:racial\s*bonus\s*(?:on|to)\s*)?([A-Za-z\s()]+?)(?:checks?)?(?:,|$|\.|\n)/gi;
    let sm: RegExpExecArray | null;
    while ((sm = regex.exec(skillAffText)) !== null) {
      const bVal = parseInt(sm[1], 10);
      const skName = sm[2]?.trim();
      if (!isNaN(bVal) && skName && skName.length < 30) {
        racialSkillBonuses.push({
          id: `rsb-aff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'specific',
          skillName: skName,
          bonus: bVal,
          source: `${raceName} Skill Affinity`
        });
      }
    }
  }

  // C. Fallback: check SRD standard racial skill catalog
  if (racialSkillBonuses.length === 0) {
    const rLower = raceName.toLowerCase().trim();
    for (const [key, bonuses] of Object.entries(SRD_RACIAL_SKILL_BONUSES)) {
      if (rLower.includes(key)) {
        racialSkillBonuses = [...bonuses];
        break;
      }
    }
  }

  return {
    raceName,
    abilityBonuses,
    abilityBonusSummary,
    racialSkillBonuses,
    damageReduction: {
      value: drValue,
      bypass: drBypass || '-',
      hasScaling: hasDrScaling
    },
    naturalArmor: {
      bonus: natArmorBonus,
      hasScaling: hasNatScaling
    },
    spellResistance: {
      value: spellResistanceVal,
      hasScaling: hasSrScaling
    },
    energyResistances,
    damageResistances,
    damageImmunities,
    conditionImmunities,
    speed: (() => {
      const racialSpeedInfo = getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any);
      let sp = (rd?.speed !== undefined && rd.speed > 0) ? rd.speed : racialSpeedInfo.speed;
      // Enforce 3.5e specific racial movement rules (Dwarves, Halflings, Gnomes are 20 ft)
      if ((rd?.edition === '3.5e' || raceItemOrData.edition === '3.5e') && (raceName.toLowerCase().includes('dwarf') || raceName.toLowerCase().includes('halfling') || raceName.toLowerCase().includes('gnome'))) {
        sp = 20;
      }
      return sp;
    })(),
    speedFly: rd?.speedFly ?? getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any).speedFly,
    speedSwim: rd?.speedSwim ?? getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any).speedSwim,
    speedClimb: rd?.speedClimb ?? getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any).speedClimb,
    speedBurrow: rd?.speedBurrow ?? getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any).speedBurrow,
    speedNotes: rd?.speedNotes ?? getRacialBaseSpeed(raceName, (rd?.edition || raceItemOrData.edition) as any).specialNotes,
    sizeCategory: (rd?.size as any) || 'Medium',
    darkvision,
    senses,
    traits,
    naturalWeapons
  };
}

/**
 * Applies a race's stats, modifiers, defenses, traits, and attacks to a CharacterData object.
 * Returns a refreshed, AC-recalculated CharacterData.
 */
export function applyRaceToCharacter(
  character: CharacterData,
  raceItemOrData: CompendiumItem | any,
  options?: {
    applyAbilities?: boolean;
    replaceTraits?: boolean;
    isNewCharacterCreation?: boolean;
  }
): CharacterData {
  if (!character) return character;

  const charLevel = character.level || 1;
  const calculated = calculateRaceBonusesAndDefenses(raceItemOrData, charLevel);
  const raceName = raceItemOrData.name || raceItemOrData.raceData?.name || character.race;

  // 1. Ability Scores Application (Clean Non-Stacking with Previous Racial Bonuses)
  const updatedAbilities: Record<string, any> = { ...(character.abilities || {}) };
  const applyAbilities = options?.applyAbilities !== false;

  const prevRacialBonuses: Record<string, number> = { ...(character.appliedRacialAbilityBonuses || {}) };
  const hadTrackedBonuses = Boolean(character.appliedRacialAbilityBonuses);

  // If character didn't have tracked bonuses stored, but has an existing different race, derive previous bonuses to back them out
  if (!hadTrackedBonuses && character.race && character.race.trim().toLowerCase() !== raceName.trim().toLowerCase() && !options?.isNewCharacterCreation) {
    const prevRaceItem = findRaceInCompendiumOrSRD(character.race, character.edition);
    if (prevRaceItem) {
      const prevCalculated = calculateRaceBonusesAndDefenses(prevRaceItem, charLevel);
      Object.assign(prevRacialBonuses, prevCalculated.abilityBonuses);
    }
  }

  if (applyAbilities) {
    const statKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    for (const stat of statKeys) {
      const prevBonus = Number(prevRacialBonuses[stat] || 0);
      const newBonus = Number(calculated.abilityBonuses[stat] || 0);
      const netDiff = options?.isNewCharacterCreation ? newBonus : (newBonus - prevBonus);
      if (netDiff !== 0) {
        const currentScore = Number(updatedAbilities[stat]?.score) || 10;
        updatedAbilities[stat] = {
          ...(updatedAbilities[stat] || {}),
          score: Math.max(1, currentScore + netDiff)
        };
      }
    }
  }

  // 2. Damage Reduction (DR)
  const damageReductionValue = calculated.damageReduction.value > 0
    ? calculated.damageReduction.value
    : character.damageReductionValue;
  const damageReductionBypass = calculated.damageReduction.value > 0
    ? calculated.damageReduction.bypass
    : (character.damageReductionBypass || '-');

  // 3. Natural Armor Bonus
  const naturalArmorBonus = calculated.naturalArmor.bonus > 0
    ? calculated.naturalArmor.bonus
    : character.naturalArmorBonus;

  // 4. Spell Resistance
  const spellResist = calculated.spellResistance.value > 0
    ? calculated.spellResistance.value
    : character.spellResist;

  // 5. Energy Resistances (merge with existing)
  const resolvedEnergyRes: Record<string, number> = { ...(character.energyResistances || {}) };
  for (const [eType, eVal] of Object.entries(calculated.energyResistances)) {
    resolvedEnergyRes[eType] = Math.max(resolvedEnergyRes[eType] || 0, eVal);
  }

  // 6. Damage Resistances & Immunities
  const mergedDamageResistances = Array.from(
    new Set([...(character.damageResistances || []), ...calculated.damageResistances])
  );
  const mergedDamageImmunities = Array.from(
    new Set([...(character.damageImmunities || []), ...calculated.damageImmunities])
  );
  const mergedConditionImmunities = Array.from(
    new Set([...(character.conditionImmunities || []), ...calculated.conditionImmunities])
  );

  // 7. Racial Traits & Features (clear old racial traits to prevent duplicating)
  const currentFeatures = Array.isArray(character.classFeatures) ? character.classFeatures : [];
  const nonRacialFeatures = options?.replaceTraits !== false
    ? currentFeatures.filter(
        f => !f.source?.includes('Racial Trait') &&
             !f.source?.includes('Spell-Like Ability') &&
             !f.source?.includes('Innate Spellcasting')
      )
    : currentFeatures;

  const mergedFeatures = [...nonRacialFeatures, ...calculated.traits];

  // 8. Natural Weapons in customAttacks
  const currentAttacks = Array.isArray(character.customAttacks) ? [...character.customAttacks] : [];
  for (const nw of calculated.naturalWeapons) {
    const exists = currentAttacks.some(a => a.name.toLowerCase() === nw.name.toLowerCase());
    if (!exists) {
      currentAttacks.push({
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: nw.name,
        attackBonus: 0,
        damageDice: nw.damageDice,
        damageType: nw.damageType,
        range: nw.range,
        notes: nw.notes
      });
    }
  }

  // 9. Speed & Senses
  const racialSpeedInfo = getRacialBaseSpeed(raceName, character.edition);
  const isRaceChanged = !character.race || character.race.trim().toLowerCase() !== raceName.trim().toLowerCase();
  
  // If the race changed, or user hasn't manually overridden speed, or is new character, apply the new race speed
  let speed = calculated.speed > 0 ? calculated.speed : racialSpeedInfo.speed;
  if (!isRaceChanged && character.speedOverridden && character.speed > 0) {
    speed = character.speed; // Preserve manual speed override if race hasn't changed
  }
  const speedFly = calculated.speedFly ?? racialSpeedInfo.speedFly;
  const speedSwim = calculated.speedSwim ?? racialSpeedInfo.speedSwim;
  const speedClimb = calculated.speedClimb ?? racialSpeedInfo.speedClimb;
  const speedBurrow = calculated.speedBurrow ?? racialSpeedInfo.speedBurrow;
  const baseRacialSpeed = calculated.speed > 0 ? calculated.speed : racialSpeedInfo.speed;
  const sizeCategory = calculated.sizeCategory || character.sizeCategory || 'Medium';
  const senses = character.senses && character.senses !== 'Normal'
    ? `${character.senses}, ${calculated.senses}`
    : calculated.senses;

  // 10. Update 5e Skill Proficiencies if granted by racial traits
  let updatedSkills = Array.isArray(character.skills) ? [...character.skills] : [];
  if (character.edition !== '3.5e') {
    for (const trait of calculated.traits) {
      const tLower = (trait.name + ' ' + trait.description).toLowerCase();
      for (const sk of updatedSkills) {
        if (
          tLower.includes(`proficiency in ${sk.name.toLowerCase()}`) ||
          tLower.includes(`proficient in ${sk.name.toLowerCase()}`)
        ) {
          sk.proficient = true;
        }
      }
    }
  }

  // 11. Construct and recalculate AC
  const updatedChar: CharacterData = {
    ...character,
    race: raceName,
    abilities: updatedAbilities as any,
    appliedRacialAbilityBonuses: { ...calculated.abilityBonuses },
    racialSkillBonuses: calculated.racialSkillBonuses,
    skills: updatedSkills,
    speed,
    speedFly,
    speedSwim,
    speedClimb,
    speedBurrow,
    baseRacialSpeed,
    speedOverridden: isRaceChanged ? false : Boolean(character.speedOverridden),
    sizeCategory,
    senses,
    damageReductionValue,
    damageReductionBypass,
    naturalArmorBonus,
    spellResist,
    energyResistances: resolvedEnergyRes,
    damageResistances: mergedDamageResistances,
    damageImmunities: mergedDamageImmunities,
    conditionImmunities: mergedConditionImmunities,
    classFeatures: mergedFeatures,
    customAttacks: currentAttacks
  };

  return recalculateCharacterAC(updatedChar);
}

/**
 * Re-evaluates level-scaling race stats (DR, Nat Armor, Energy Res, SR, unlocked SLAs)
 * when a character's level advances.
 */
export function recalculateScalingRaceStats(
  character: CharacterData,
  customEntries?: CompendiumItem[]
): CharacterData {
  if (!character || !character.race) return character;

  const raceItem = findRaceInCompendiumOrSRD(character.race, character.edition, customEntries);
  if (!raceItem || !raceItem.raceData) return character;

  const charLevel = character.level || 1;
  const calculated = calculateRaceBonusesAndDefenses(raceItem, charLevel);

  let updated = { ...character };

  // Update scaling DR if present
  if (calculated.damageReduction.hasScaling || calculated.damageReduction.value > 0) {
    updated.damageReductionValue = calculated.damageReduction.value;
    updated.damageReductionBypass = calculated.damageReduction.bypass;
  }

  // Update scaling Natural Armor if present
  if (calculated.naturalArmor.hasScaling || calculated.naturalArmor.bonus > 0) {
    updated.naturalArmorBonus = calculated.naturalArmor.bonus;
  }

  // Update scaling Spell Resistance if present
  if (calculated.spellResistance.hasScaling || calculated.spellResistance.value > 0) {
    updated.spellResist = calculated.spellResistance.value;
  }

  // Update scaling Energy Resistances
  const resolvedEnergyRes: Record<string, number> = { ...(character.energyResistances || {}) };
  for (const [eType, eVal] of Object.entries(calculated.energyResistances)) {
    resolvedEnergyRes[eType] = Math.max(resolvedEnergyRes[eType] || 0, eVal);
  }
  updated.energyResistances = resolvedEnergyRes;

  // Unlock newly available Spell-Like Abilities / Innate Spells for this level
  const existingFeatureNames = new Set((character.classFeatures || []).map(f => f.name.toLowerCase()));
  const newFeaturesToUnlock = calculated.traits.filter(
    t => !existingFeatureNames.has(t.name.toLowerCase())
  );

  if (newFeaturesToUnlock.length > 0) {
    updated.classFeatures = [...(character.classFeatures || []), ...newFeaturesToUnlock];
  }

  // Ensure racialSkillBonuses are attached if not present
  if ((!updated.racialSkillBonuses || updated.racialSkillBonuses.length === 0) && calculated.racialSkillBonuses.length > 0) {
    updated.racialSkillBonuses = calculated.racialSkillBonuses;
  }
  // Record applied racial ability bonuses for UI badges and tooltips without modifying ability scores.
  // Racial ability score bonuses are applied only once at character creation and must never be re-added on level up.
  if (!updated.appliedRacialAbilityBonuses && Object.values(calculated.abilityBonuses).some(v => v !== 0)) {
    updated.appliedRacialAbilityBonuses = { ...calculated.abilityBonuses };
  }

  return recalculateCharacterAC(updated);
}

/**
 * Applies a 3.5e Half-Breed Template to a character based on their Base Creature.
 * Implements the official + supplementary Half-Breed inheritance logic:
 * - Base Creature traits & physical characteristics are retained.
 * - Template abilities and traits are gained.
 * - Numerical bonuses to abilities, natural armor, and saves stack cumulatively.
 * - Duplicate traits take the higher value.
 * - Conflicting traits are resolved via DM/player choice or suppressed.
 * - Racial skill points from templates are waived if the character has class levels.
 * - Level Adjustment and precedence logs are tracked.
 */
export function applyHalfBreedTemplate35eToCharacter(
  character: CharacterData,
  baseCreature: BaseCreature35e,
  template: HalfBreedTemplate35e,
  options?: {
    dragonVariety?: string;
    conflictChoices?: Record<string, 'base' | 'template' | 'suppress'>;
    applyAbilities?: boolean;
    customRaceName?: string;
  }
): CharacterData {
  if (!character) return character;

  const charLevel = character.level || 1;
  const hasClassLevels = charLevel >= 1 || !!character.characterClass;

  const resolved = resolve35eHalfBreedTemplate(
    baseCreature,
    template,
    charLevel,
    hasClassLevels,
    options?.dragonVariety,
    options?.conflictChoices
  );

  const finalRaceName = options?.customRaceName?.trim() || resolved.compositeName;

  // 1. Ability Scores (Cumulative bonuses)
  const updatedAbilities: Record<string, any> = { ...(character.abilities || {}) };
  if (options?.applyAbilities !== false) {
    const stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
    for (const s of stats) {
      const netModifier = resolved.abilities[s] || 0;
      if (netModifier !== 0) {
        const currentScore = updatedAbilities[s]?.score ?? 10;
        updatedAbilities[s] = {
          ...(updatedAbilities[s] || {}),
          score: Math.max(1, currentScore + netModifier)
        };
      }
    }
  }

  // 2. Natural Armor
  const naturalArmorBonus = resolved.naturalArmor;

  // 3. Senses
  const senseParts: string[] = [];
  if (resolved.darkvisionFeet > 0) {
    senseParts.push(`Darkvision ${resolved.darkvisionFeet} ft.`);
  }
  if (resolved.hasLowLightVision) {
    senseParts.push('Low-Light Vision');
  }
  if (resolved.hasBlindsight && resolved.blindsightFeet) {
    senseParts.push(`Blindsight ${resolved.blindsightFeet} ft.`);
  }
  const senses = senseParts.join(', ') || 'Normal';

  // 4. Immunities & Resistances
  const mergedDamageImmunities = Array.from(
    new Set([...(character.damageImmunities || []), ...resolved.damageImmunities])
  );
  const mergedConditionImmunities = Array.from(
    new Set([...(character.conditionImmunities || []), ...resolved.conditionImmunities])
  );
  const resolvedEnergyRes: Record<string, number> = { ...(character.energyResistances || {}) };
  for (const [eType, eVal] of Object.entries(resolved.energyResistances)) {
    resolvedEnergyRes[eType] = Math.max(resolvedEnergyRes[eType] || 0, eVal);
  }

  // 5. DR & SR
  const damageReductionValue = resolved.damageReduction?.value || character.damageReductionValue;
  const damageReductionBypass = resolved.damageReduction?.bypass || character.damageReductionBypass;
  const spellResist = resolved.spellResistanceText ? (charLevel + 10) : character.spellResist;

  // 6. Features & Traits
  const currentFeatures = Array.isArray(character.classFeatures) ? character.classFeatures : [];
  // Strip previous racial and template features to avoid duplicate stacks
  const cleanFeatures = currentFeatures.filter(
    f => !f.source?.includes('Base Creature:') &&
         !f.source?.includes('Template:') &&
         !f.source?.includes('Half-Breed') &&
         !f.source?.includes('Racial Trait')
  );

  const newFeatures: ClassFeature[] = [
    {
      id: `feat-hb-composite-${Date.now()}`,
      name: `Half-Breed Template: ${finalRaceName}`,
      source: 'Half-Breed Rules (Base Creature + Inherited Template)',
      description: `[Base Creature: ${baseCreature.name} | Template: ${template.name} (ECL LA +${template.levelAdjustment})]
• Size & Movement: ${resolved.size}, Land Speed ${resolved.speed} ft${resolved.flySpeed ? `, Fly Speed ${resolved.flySpeed} ft (${resolved.flyManeuverability})` : ''}
• Natural Armor Bonus: +${resolved.naturalArmor} AC (${resolved.naturalArmorBreakdown.base} Base + ${resolved.naturalArmorBreakdown.template} Template)
• Inherited Senses: ${senses}
• Skill Points Status: ${resolved.skillPointsNotice}
• Order of Precedence:\n${resolved.precedenceLog.join('\n')}`
    },
    ...resolved.retainedBaseTraits.map(t => ({
      id: `feat-base-${t.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      name: `[Base Heritage] ${t.name}`,
      source: `Base Creature: ${baseCreature.name}`,
      description: t.description
    })),
    ...resolved.gainedTemplateTraits.map(t => ({
      id: `feat-tpl-${t.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      name: `[Template] ${t.name}`,
      source: `Template: ${template.name}`,
      description: t.description
    }))
  ];

  // 7. Natural Attacks
  const currentAttacks = Array.isArray(character.customAttacks) ? [...character.customAttacks] : [];
  if (Array.isArray(template.naturalAttacks)) {
    for (const na of template.naturalAttacks) {
      const exists = currentAttacks.some(a => a.name.toLowerCase() === na.name.toLowerCase());
      if (!exists) {
        currentAttacks.push({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: na.name,
          attackBonus: 0,
          damageDice: na.damageDice,
          damageType: na.damageType,
          range: 'Melee (5 ft.)',
          notes: na.notes || `${template.name} Natural Weapon`
        });
      }
    }
  }

  // Collect Racial Skill Bonuses from Template, Base Creature, and Compendium
  const collectedRacialSkillBonuses: RacialSkillBonus[] = [
    ...(resolved.racialSkillBonuses || []),
    ...(template.racialSkillBonuses || []),
    ...(baseCreature.racialSkillBonuses || [])
  ];

  try {
    const compEntries = loadCustomCompendiumEntries();
    const tplEntry = compEntries.find(e =>
      (e.category === 'races' || (e.category as string) === 'race') &&
      (e.name.toLowerCase() === template.name.toLowerCase() || e.id === template.id || template.name.toLowerCase().includes(e.name.toLowerCase()))
    );
    if (tplEntry) {
      const rd: any = tplEntry.raceData || tplEntry;
      if (Array.isArray(rd.racialSkillBonuses)) {
        for (const b of rd.racialSkillBonuses) {
          if (!collectedRacialSkillBonuses.some(existing => existing.id === b.id)) {
            collectedRacialSkillBonuses.push(b);
          }
        }
      }
    }
    const baseEntry = compEntries.find(e =>
      (e.category === 'races' || (e.category as string) === 'race') &&
      (e.name.toLowerCase() === baseCreature.name.toLowerCase() || e.id === baseCreature.id)
    );
    if (baseEntry) {
      const rd: any = baseEntry.raceData || baseEntry;
      if (Array.isArray(rd.racialSkillBonuses)) {
        for (const b of rd.racialSkillBonuses) {
          if (!collectedRacialSkillBonuses.some(existing => existing.id === b.id)) {
            collectedRacialSkillBonuses.push(b);
          }
        }
      }
    }
  } catch {
    // Ignore storage lookup errors
  }

  const srdBaseBonuses = SRD_RACIAL_SKILL_BONUSES[baseCreature.id.toLowerCase()];
  if (Array.isArray(srdBaseBonuses)) {
    for (const b of srdBaseBonuses) {
      if (!collectedRacialSkillBonuses.some(existing => existing.id === b.id)) {
        collectedRacialSkillBonuses.push(b);
      }
    }
  }

  const updatedChar: CharacterData = {
    ...character,
    race: finalRaceName,
    abilities: updatedAbilities as any,
    appliedRacialAbilityBonuses: { ...resolved.abilities },
    speed: resolved.speed,
    sizeCategory: resolved.size,
    senses,
    naturalArmorBonus,
    damageReductionValue,
    damageReductionBypass,
    spellResist,
    damageImmunities: mergedDamageImmunities,
    conditionImmunities: mergedConditionImmunities,
    energyResistances: resolvedEnergyRes,
    classFeatures: [...cleanFeatures, ...newFeatures],
    customAttacks: currentAttacks,
    racialSkillBonuses: collectedRacialSkillBonuses,
    hybridHeritage: {
      enabled: true,
      isTemplateMode: true,
      isClassicSRD: false,
      templateId: template.id,
      templateName: template.name,
      baseRaceId: baseCreature.id,
      baseRaceName: baseCreature.name,
      primaryParent: baseCreature.name,
      secondaryParent: template.name,
      customHybridName: finalRaceName,
      dragonVariety: options?.dragonVariety,
      speedFeet: resolved.speed,
      sizeCategory: resolved.size,
      hasDarkvision: resolved.darkvisionFeet > 0,
      levelAdjustment: template.levelAdjustment,
      retainedBaseTraits: resolved.retainedBaseTraits.map(t => t.name),
      gainedTemplateTraits: resolved.gainedTemplateTraits.map(t => t.name),
      skillPointsRuleNotice: resolved.skillPointsNotice,
      precedenceSummary: resolved.precedenceLog,
      conflictsResolved: options?.conflictChoices
    },
    optionalRules: {
      ...(character.optionalRules || {}),
      useHalfBreedTemplate35e: true
    }
  };

  return recalculateCharacterAC(updatedChar);
}

