import { OwnedMount, CharacterData, GearItem } from '../types';
import { MerchantEncounterState } from '../components/combat/encounter/encounterTypes';
import { getTotalWealthInGold, deductGoldFromWealth, formatWealthDetailed } from '../utils/dndCalculations';

export interface MountPreset {
  id: string;
  name: string;
  type: string;
  costGp: number;
  size: 'Small' | 'Medium' | 'Large' | 'Huge';
  speed: string;
  ac: number;
  hp: number;
  hpMax: number;
  str: number;
  dex: number;
  con: number;
  carryingCapacityLbs: {
    light: number;
    medium: number;
    heavy: number;
  };
  isWarTrained: boolean;
  attacks: Array<{ name: string; bonus: number; damage: string; type: string }>;
  description: string;
  source: string;
}

export interface TackPreset {
  id: string;
  name: string;
  category: 'Saddle' | 'Barding' | 'Harness' | 'Service' | 'Container';
  costGp: number;
  costDisplay?: string;
  weightLbs: number;
  acBonus?: number;
  notes: string;
}

export const OFFICIAL_MOUNT_PRESETS: MountPreset[] = [
  {
    id: 'mount-heavy-warhorse',
    name: 'Heavy Warhorse',
    type: 'Heavy Warhorse',
    costGp: 400,
    size: 'Large',
    speed: '50 ft.',
    ac: 14,
    hp: 30,
    hpMax: 30,
    str: 18,
    dex: 13,
    con: 17,
    carryingCapacityLbs: { light: 300, medium: 600, heavy: 900 },
    isWarTrained: true,
    attacks: [
      { name: 'Hooves (x2)', bonus: 4, damage: '1d6+4', type: 'Bludgeoning' },
      { name: 'Bite', bonus: -1, damage: '1d4+2', type: 'Piercing' }
    ],
    description: 'Well-suited for battle and armored knights. Trained for combat (rider does not need Ride checks to control it while attacking). Can wear heavy barding.',
    source: 'PHB p. 131, Table 7-8'
  },
  {
    id: 'mount-light-warhorse',
    name: 'Light Warhorse',
    type: 'Light Warhorse',
    costGp: 150,
    size: 'Large',
    speed: '60 ft.',
    ac: 14,
    hp: 22,
    hpMax: 22,
    str: 16,
    dex: 13,
    con: 15,
    carryingCapacityLbs: { light: 230, medium: 460, heavy: 690 },
    isWarTrained: true,
    attacks: [
      { name: 'Hooves (x2)', bonus: 4, damage: '1d4+3', type: 'Bludgeoning' }
    ],
    description: 'Fast and responsive war mount. Highly favored by cavalry, horse archers, and light skirmishers.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-riding-horse',
    name: 'Riding Horse',
    type: 'Riding Horse',
    costGp: 75,
    size: 'Large',
    speed: '60 ft.',
    ac: 14,
    hp: 15,
    hpMax: 15,
    str: 16,
    dex: 13,
    con: 15,
    carryingCapacityLbs: { light: 150, medium: 300, heavy: 450 },
    isWarTrained: false,
    attacks: [
      { name: 'Hooves', bonus: -2, damage: '1d4+1', type: 'Bludgeoning' }
    ],
    description: 'Standard steed for overland travel. Not trained for battle (requires a DC 20 Ride check to attack or control during combat).',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-draft-horse',
    name: 'Heavy Draft Horse',
    type: 'Draft Horse',
    costGp: 200,
    size: 'Large',
    speed: '50 ft.',
    ac: 13,
    hp: 21,
    hpMax: 21,
    str: 18,
    dex: 13,
    con: 15,
    carryingCapacityLbs: { light: 400, medium: 800, heavy: 1200 },
    isWarTrained: false,
    attacks: [
      { name: 'Hooves', bonus: -2, damage: '1d6+2', type: 'Bludgeoning' }
    ],
    description: 'Bred for heavy labor, pulling wagons, and hauling gear. Immense carrying capacity.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-warpony',
    name: 'Warpony',
    type: 'Warpony',
    costGp: 100,
    size: 'Medium',
    speed: '40 ft.',
    ac: 15,
    hp: 13,
    hpMax: 13,
    str: 15,
    dex: 13,
    con: 14,
    carryingCapacityLbs: { light: 150, medium: 300, heavy: 450 },
    isWarTrained: true,
    attacks: [
      { name: 'Hooves (x2)', bonus: 3, damage: '1d3+2', type: 'Bludgeoning' }
    ],
    description: 'Combat-trained steed suited for Small riders (Halflings and Gnomes). Fearless and agile.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-pony',
    name: 'Pony',
    type: 'Pony',
    costGp: 30,
    size: 'Medium',
    speed: '40 ft.',
    ac: 13,
    hp: 11,
    hpMax: 11,
    str: 13,
    dex: 13,
    con: 12,
    carryingCapacityLbs: { light: 75, medium: 150, heavy: 225 },
    isWarTrained: false,
    attacks: [
      { name: 'Hooves', bonus: -3, damage: '1d3', type: 'Bludgeoning' }
    ],
    description: 'Reliable travel mount for Small adventurers or as a pack animal in rugged mountain terrain.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-riding-dog',
    name: 'Riding Dog',
    type: 'Riding Dog',
    costGp: 150,
    size: 'Medium',
    speed: '40 ft.',
    ac: 16,
    hp: 13,
    hpMax: 13,
    str: 15,
    dex: 15,
    con: 15,
    carryingCapacityLbs: { light: 100, medium: 200, heavy: 300 },
    isWarTrained: true,
    attacks: [
      { name: 'Bite', bonus: 3, damage: '1d6+3', type: 'Piercing (Trip DC 12)' }
    ],
    description: 'Bred and trained by halflings as war steeds. On a hit with its bite, can attempt to trip the opponent (+1 check).',
    source: 'PHB p. 131 / Monster Manual p. 272'
  },
  {
    id: 'mount-camel',
    name: 'Camel',
    type: 'Camel',
    costGp: 50,
    size: 'Large',
    speed: '50 ft.',
    ac: 13,
    hp: 19,
    hpMax: 19,
    str: 18,
    dex: 16,
    con: 14,
    carryingCapacityLbs: { light: 300, medium: 600, heavy: 900 },
    isWarTrained: false,
    attacks: [
      { name: 'Bite', bonus: 0, damage: '1d4+2', type: 'Bludgeoning' }
    ],
    description: 'Tough desert mount capable of traveling for days without water. Strong carrying capacity.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-donkey-mule',
    name: 'Donkey or Mule',
    type: 'Donkey or Mule',
    costGp: 8,
    size: 'Medium',
    speed: '30 ft.',
    ac: 13,
    hp: 11,
    hpMax: 11,
    str: 16,
    dex: 13,
    con: 17,
    carryingCapacityLbs: { light: 225, medium: 450, heavy: 675 },
    isWarTrained: false,
    attacks: [
      { name: 'Hooves', bonus: 1, damage: '1d4+3', type: 'Bludgeoning' }
    ],
    description: 'Steady, surefooted beast of burden. Superb at navigating narrow, treacherous slopes.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-elephant',
    name: 'Elephant',
    type: 'Elephant',
    costGp: 1000,
    size: 'Huge',
    speed: '40 ft.',
    ac: 15,
    hp: 45,
    hpMax: 45,
    str: 30,
    dex: 10,
    con: 21,
    carryingCapacityLbs: { light: 1332, medium: 2664, heavy: 4000 },
    isWarTrained: false,
    attacks: [
      { name: 'Slam', bonus: 8, damage: '2d6+10', type: 'Bludgeoning' },
      { name: 'Stamp (x2)', bonus: 3, damage: '2d6+5', type: 'Bludgeoning' }
    ],
    description: 'Massive mount capable of carrying howdahs and multiple combatants. Tramples foes with crushing weight.',
    source: 'PHB p. 131'
  },
  {
    id: 'mount-griffon',
    name: 'Griffon (Trained Egg/Young)',
    type: 'Griffon',
    costGp: 8500,
    size: 'Large',
    speed: '30 ft., fly 80 ft.',
    ac: 17,
    hp: 59,
    hpMax: 59,
    str: 20,
    dex: 15,
    con: 16,
    carryingCapacityLbs: { light: 260, medium: 520, heavy: 780 },
    isWarTrained: true,
    attacks: [
      { name: 'Bite', bonus: 8, damage: '2d6+5', type: 'Piercing' },
      { name: 'Claws (x2)', bonus: 6, damage: '1d4+2', type: 'Slashing' }
    ],
    description: 'Majestic flying mount combining the body of a lion and the head of an eagle. Requires an Exotic Military Saddle.',
    source: 'Monster Manual p. 139'
  },
  {
    id: 'mount-pegasus',
    name: 'Pegasus (Trained)',
    type: 'Pegasus',
    costGp: 3000,
    size: 'Large',
    speed: '60 ft., fly 120 ft.',
    ac: 14,
    hp: 34,
    hpMax: 34,
    str: 18,
    dex: 15,
    con: 16,
    carryingCapacityLbs: { light: 200, medium: 400, heavy: 600 },
    isWarTrained: true,
    attacks: [
      { name: 'Hooves (x2)', bonus: 7, damage: '1d6+4', type: 'Bludgeoning' }
    ],
    description: 'Winged celestial horse with extraordinary flight speed and good alignment.',
    source: 'Monster Manual p. 206'
  },
  {
    id: 'mount-hippogriff',
    name: 'Hippogriff (Trained)',
    type: 'Hippogriff',
    costGp: 3000,
    size: 'Large',
    speed: '50 ft., fly 100 ft.',
    ac: 15,
    hp: 25,
    hpMax: 25,
    str: 18,
    dex: 15,
    con: 16,
    carryingCapacityLbs: { light: 195, medium: 390, heavy: 585 },
    isWarTrained: true,
    attacks: [
      { name: 'Claws (x2)', bonus: 6, damage: '1d4+4', type: 'Slashing' },
      { name: 'Bite', bonus: 1, damage: '1d8+2', type: 'Piercing' }
    ],
    description: 'Fierce flying steed featuring the forelimbs and wings of an eagle and the hindquarters of a horse.',
    source: 'Monster Manual p. 152'
  }
];

export const OFFICIAL_TACK_PRESETS: TackPreset[] = [
  {
    id: 'tack-military-saddle',
    name: 'Military Saddle',
    category: 'Saddle',
    costGp: 20,
    weightLbs: 30,
    notes: 'Grants a +2 circumstance bonus on Ride checks to Stay in Saddle. Gives a 75% chance to remain in the saddle if knocked unconscious.',
  },
  {
    id: 'tack-riding-saddle',
    name: 'Riding Saddle',
    category: 'Saddle',
    costGp: 10,
    weightLbs: 25,
    notes: 'Standard leather saddle designed for long journeys and rider comfort.',
  },
  {
    id: 'tack-pack-saddle',
    name: 'Pack Saddle',
    category: 'Saddle',
    costGp: 5,
    weightLbs: 15,
    notes: 'Designed specifically to hold gear, crates, and sacks rather than a rider.',
  },
  {
    id: 'tack-exotic-military-saddle',
    name: 'Exotic Military Saddle',
    category: 'Saddle',
    costGp: 60,
    weightLbs: 40,
    notes: 'Required for riding unusual or flying mounts (Griffons, Pegasi, Dragons) in combat. +2 bonus to Stay in Saddle.',
  },
  {
    id: 'tack-exotic-riding-saddle',
    name: 'Exotic Riding Saddle',
    category: 'Saddle',
    costGp: 30,
    weightLbs: 30,
    notes: 'Specially contoured for exotic or flying mounts outside of direct combat.',
  },
  {
    id: 'tack-bit-and-bridle',
    name: 'Bit and Bridle',
    category: 'Harness',
    costGp: 2,
    weightLbs: 1,
    notes: 'Metal bit inserted into the mount\'s mouth with leather straps for steering.',
  },
  {
    id: 'tack-saddlebags',
    name: 'Saddlebags',
    category: 'Container',
    costGp: 4,
    weightLbs: 8,
    notes: 'Leather bags strapped behind the saddle. Can carry up to 30 lbs or 5 cubic feet of travel provisions.',
  },
  {
    id: 'tack-barding-chainmail',
    name: 'Chainmail Barding (Large)',
    category: 'Barding',
    costGp: 600,
    weightLbs: 80,
    acBonus: 5,
    notes: 'Heavy interlocking steel links custom fitted for a Large warhorse. Grants +5 Armor Bonus to AC (Max Dex +2, ACP -5).',
  },
  {
    id: 'tack-barding-scale',
    name: 'Scale Mail Barding (Large)',
    category: 'Barding',
    costGp: 200,
    weightLbs: 60,
    acBonus: 4,
    notes: 'Overlapping scale armor. Grants +4 Armor Bonus to AC (Max Dex +3, ACP -4).',
  },
  {
    id: 'tack-barding-leather',
    name: 'Leather Barding (Large)',
    category: 'Barding',
    costGp: 40,
    weightLbs: 30,
    acBonus: 2,
    notes: 'Hardened boiled leather protecting the chest and flanks. Grants +2 Armor Bonus to AC.',
  },
  {
    id: 'tack-barding-full-plate',
    name: 'Full Plate Barding (Large)',
    category: 'Barding',
    costGp: 6000,
    weightLbs: 100,
    acBonus: 8,
    notes: 'Masterwork articulated steel plates encasing the mount. Grants +8 Armor Bonus to AC (Max Dex +1, ACP -6).',
  },
  {
    id: 'tack-stabling-day',
    name: 'Stabling & Grooming (1 Day)',
    category: 'Service',
    costGp: 0.5,
    costDisplay: '5 SP',
    weightLbs: 0,
    notes: 'Clean stall, fresh hay, water, and grooming provided at a settlement stable.',
  },
  {
    id: 'tack-feed-day',
    name: 'Feed (1 Day)',
    category: 'Service',
    costGp: 0.05,
    costDisplay: '5 CP',
    weightLbs: 10,
    notes: 'Oats, grain, and forage for one day of mount exertion.',
  }
];

export function getBardingBonus(barding?: string): number {
  switch (barding) {
    case 'padded': return 1;
    case 'leather': return 2;
    case 'studded_leather': return 3;
    case 'chain_shirt': return 4;
    case 'scale_mail': return 4;
    case 'chainmail': return 5;
    case 'banded_mail': return 6;
    case 'full_plate': return 8;
    default: return 0;
  }
}

export function calculateMountEffectiveAC(mount: OwnedMount): number {
  const baseAc = mount.ac || 14;
  const bardingBonus = getBardingBonus(mount.barding);
  return baseAc + bardingBonus;
}

export function purchaseMountForCharacter(
  character: CharacterData,
  preset: MountPreset,
  customName?: string
): { updatedCharacter: CharacterData; success: boolean; message: string; newMount?: OwnedMount } {
  const wealthInfo = formatWealthDetailed(character.wealth);
  const totalAvailableGp = wealthInfo.totalGp;

  if (totalAvailableGp < preset.costGp - 0.001) {
    return {
      updatedCharacter: character,
      success: false,
      message: `⚠️ Not enough currency! You have ${wealthInfo.displayText} total purchasing power (${wealthInfo.breakdown}), but a ${preset.name} costs ${preset.costGp} GP.`
    };
  }

  const deduction = deductGoldFromWealth(preset.costGp, character.wealth);
  if (!deduction.success) {
    return {
      updatedCharacter: character,
      success: false,
      message: `⚠️ Not enough currency! You have ${wealthInfo.displayText} (${wealthInfo.breakdown}), but cannot cover ${preset.costGp} GP.`
    };
  }

  const newMount: OwnedMount = {
    id: `mount-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: customName?.trim() || preset.name,
    type: preset.type,
    costGp: preset.costGp,
    size: preset.size,
    speed: preset.speed,
    ac: preset.ac,
    hp: preset.hp,
    hpMax: preset.hpMax,
    carryingCapacityLbs: { ...preset.carryingCapacityLbs },
    isWarTrained: preset.isWarTrained,
    saddle: 'riding',
    barding: 'none',
    hasBitAndBridle: true,
    hasSaddlebags: false,
    attacks: [...preset.attacks],
    notes: preset.description
  };

  const currentMounts = Array.isArray(character.ownedMounts) ? character.ownedMounts : [];
  const updatedMounts = [...currentMounts, newMount];

  // Automatically make it the active mount if none active
  const shouldMakeActive = !character.activeMountId || currentMounts.length === 0;

  const updatedCharacter: CharacterData = {
    ...character,
    wealth: deduction.updatedWealth,
    ownedMounts: updatedMounts,
    activeMountId: shouldMakeActive ? newMount.id : character.activeMountId,
    isMounted: shouldMakeActive ? true : character.isMounted,
    mountInfo: shouldMakeActive ? {
      name: newMount.name,
      ac: calculateMountEffectiveAC(newMount),
      hp: newMount.hp,
      hpMax: newMount.hpMax,
      speed: newMount.speed,
      saddle: newMount.saddle,
      barding: newMount.barding,
      notes: newMount.notes
    } : character.mountInfo
  };

  return {
    updatedCharacter,
    success: true,
    message: `🐎 Purchased "${newMount.name}" (${preset.name}) for ${preset.costGp} GP! Added to character stables.`,
    newMount
  };
}

export function bindActiveMount(character: CharacterData, mountId: string): CharacterData {
  const mount = (character.ownedMounts || []).find(m => m.id === mountId);
  if (!mount) return character;

  return {
    ...character,
    activeMountId: mount.id,
    isMounted: true,
    mountInfo: {
      name: mount.name,
      ac: calculateMountEffectiveAC(mount),
      hp: mount.hp,
      hpMax: mount.hpMax,
      speed: mount.speed,
      saddle: mount.saddle,
      barding: mount.barding,
      notes: mount.notes
    }
  };
}

export function createMountMerchantPreset(): MerchantEncounterState {
  const mountWares: GearItem[] = OFFICIAL_MOUNT_PRESETS.map((m, idx) => ({
    id: `merchant-mount-${m.id}`,
    name: m.name,
    costGp: m.costGp,
    weight: 0,
    quantity: idx === 0 ? 2 : (m.costGp > 2000 ? 1 : 3),
    equipped: false,
    itemType: 'Misc',
    subCategory: 'Mount / Steed',
    notes: `${m.size} Steed • Speed: ${m.speed} • AC: ${m.ac} • HP: ${m.hpMax} • ${m.isWarTrained ? 'War-Trained' : 'Untrained'} • Str ${m.str}, Dex ${m.dex}. ${m.description}`,
    source: m.source
  }));

  const tackWares: GearItem[] = OFFICIAL_TACK_PRESETS.map(t => ({
    id: `merchant-tack-${t.id}`,
    name: t.name,
    costGp: t.costGp,
    weight: t.weightLbs,
    quantity: 4,
    equipped: false,
    itemType: t.category === 'Barding' ? 'Armor' : 'Misc',
    subCategory: 'Tack & Harness',
    acBonus: t.acBonus,
    notes: `${t.category} • ${t.notes}`,
    source: 'D&D 3.5e/5e SRD'
  }));

  return {
    merchantId: 'merchant-stablemaster-barnaby',
    merchantName: 'Barnaby Oakshield, Master of Horse',
    archetype: 'Stables Master & Steed Breeder',
    portraitUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    greeting: 'Fine steeds, sound of wind and limb! Warhorses for knights, swift coursers for couriers, and the finest military saddles in the realm.',
    personality: 'Gruff but honest horse-breeder who inspects horse teeth before shaking hands.',
    haggleDc: 13,
    haggleModifier: 0,
    goldGp: 850,
    vendorMargin: 100,
    inventory: [...mountWares, ...tackWares],
    statblock: {
      armorClass: 15,
      hp: 52,
      initiativeBonus: 1,
      attacks: 'Heavy club (+5 to hit, 1d8+3 bludgeoning)'
    }
  };
}
