export type SupportedEdition = '5e' | '3.5e' | 'pathfinder' | 'shadowrun' | 'cthulhu';

export const SYSTEM_DISPLAY_NAMES: Record<SupportedEdition, string> = {
  '5e': 'D&D 5e (SRD)',
  '3.5e': 'D&D 3.5e Classic',
  'pathfinder': 'Pathfinder 2e',
  'shadowrun': 'Shadowrun 5e',
  'cthulhu': 'Call of Cthulhu 7e'
};

export const FANTASY_MAGIC_SCHOOLS = [
  'Evocation',
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Illusion',
  'Necromancy',
  'Transmutation',
  'Universal'
];

export const FANTASY_CREATURE_TYPES = [
  'Aberration',
  'Beast',
  'Celestial',
  'Construct',
  'Dragon',
  'Elemental',
  'Fey',
  'Fiend',
  'Giant',
  'Humanoid',
  'Monstrosity',
  'Ooze',
  'Plant',
  'Undead',
  'Custom'
];

export const FANTASY_DAMAGE_TYPES = [
  'Slashing',
  'Piercing',
  'Bludgeoning',
  'Fire',
  'Cold',
  'Lightning',
  'Thunder',
  'Acid',
  'Poison',
  'Radiant',
  'Necrotic',
  'Psychic',
  'Force'
];

export const CR_XP_MAP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000
};
