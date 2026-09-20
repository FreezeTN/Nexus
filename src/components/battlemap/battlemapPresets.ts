import { BattlemapLayout } from './battlemapTypes';

/**
 * High-quality ready-to-play pre-built tactical battlemaps for Dungeon Masters.
 */
export const PRESET_BATTLEMAP_LAYOUTS: BattlemapLayout[] = [
  {
    id: 'preset_sunken_crypt',
    name: 'The Sunken Crypt of Nerull',
    description: 'An ancient subterranean mausoleum featuring stone sarcophagi, iron-banded doors, a cursed sacrificial altar, and crumbling burial vaults.',
    category: 'dungeon',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_sunken_crypt',
      title: 'The Sunken Crypt of Nerull',
      gridColumns: 24,
      gridRows: 16,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'dungeon',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // Perimeter walls
      for (let x = 0; x < 24; x++) {
        t[`${x},0`] = 'wall';
        t[`${x},15`] = 'wall';
      }
      for (let y = 0; y < 16; y++) {
        t[`0,${y}`] = 'wall';
        t[`23,${y}`] = 'wall';
      }

      // Interior chamber walls separating West Vault, Central Altar, East Vault
      for (let y = 1; y < 7; y++) {
        t[`8,${y}`] = 'wall';
        t[`15,${y}`] = 'wall';
      }
      for (let y = 9; y < 15; y++) {
        t[`8,${y}`] = 'wall';
        t[`15,${y}`] = 'wall';
      }

      // Sarcophagi (Half Cover) in West Vault
      t['3,3'] = 'cover_half';
      t['3,4'] = 'cover_half';
      t['3,11'] = 'cover_half';
      t['3,12'] = 'cover_half';

      // Sarcophagi in East Vault
      t['20,3'] = 'cover_half';
      t['20,4'] = 'cover_half';
      t['20,11'] = 'cover_half';
      t['20,12'] = 'cover_half';

      // Central Chamber Altar (Hazard) & Pillars (Three Quarters Cover)
      t['11,7'] = 'cover_three_quarters';
      t['12,7'] = 'hazard'; // Cursed Altar
      t['11,8'] = 'hazard';
      t['12,8'] = 'cover_three_quarters';

      // Rubble & Bone Piles (Difficult Terrain)
      t['4,7'] = 'difficult';
      t['4,8'] = 'difficult';
      t['19,7'] = 'difficult';
      t['19,8'] = 'difficult';
      t['10,6'] = 'difficult';
      t['13,6'] = 'difficult';
      t['10,9'] = 'difficult';
      t['13,9'] = 'difficult';

      // Iron-banded doors
      t['8,7'] = 'door';
      t['8,8'] = 'door';
      t['15,7'] = 'door';
      t['15,8'] = 'door';
      t['11,0'] = 'door';
      t['12,0'] = 'door';

      return t;
    })(),
    doors: {
      '8,7': { x: 8, y: 7, isOpen: false, isLocked: false },
      '8,8': { x: 8, y: 8, isOpen: false, isLocked: false },
      '15,7': { x: 15, y: 7, isOpen: false, isLocked: true },
      '15,8': { x: 15, y: 8, isOpen: false, isLocked: true },
      '11,0': { x: 11, y: 0, isOpen: true, isLocked: false },
      '12,0': { x: 12, y: 0, isOpen: true, isLocked: false }
    },
    useFogOfWar: true,
    fogOfWar: (() => {
      const f: Record<string, boolean> = {};
      // Reveal entry hall (cols 9-14, rows 1-5), rest shrouded
      for (let x = 9; x <= 14; x++) {
        for (let y = 1; y <= 5; y++) {
          f[`${x},${y}`] = true;
        }
      }
      return f;
    })(),
    tokens: [
      {
        id: 'token_crypt_wight',
        name: 'Wight Commander',
        type: 'enemy',
        x: 11,
        y: 8,
        tokenSize: 1,
        hpMax: 45,
        hpCurrent: 45,
        armorClass: 14,
        speed: 30
      },
      {
        id: 'token_crypt_skel_1',
        name: 'Skeleton Guardian A',
        type: 'enemy',
        x: 3,
        y: 5,
        tokenSize: 1,
        hpMax: 13,
        hpCurrent: 13,
        armorClass: 13,
        speed: 30
      },
      {
        id: 'token_crypt_skel_2',
        name: 'Skeleton Guardian B',
        type: 'enemy',
        x: 20,
        y: 5,
        tokenSize: 1,
        hpMax: 13,
        hpCurrent: 13,
        armorClass: 13,
        speed: 30
      },
      {
        id: 'token_spawn_party_1',
        name: 'Party Entry Point A',
        type: 'player',
        x: 11,
        y: 1,
        isSpawnPoint: true
      },
      {
        id: 'token_spawn_party_2',
        name: 'Party Entry Point B',
        type: 'player',
        x: 12,
        y: 1,
        isSpawnPoint: true
      }
    ]
  },
  {
    id: 'preset_goblin_ambush',
    name: 'Goblin Ambush Gorge',
    description: 'A perilous canyon trail bisected by a rushing river chasm, connected by a rickety timber bridge, with high rocky bluffs favored by snipers.',
    category: 'wilderness',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_goblin_ambush',
      title: 'Whispering Gorge Ambush',
      gridColumns: 26,
      gridRows: 16,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'grass',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // River Chasm cutting through columns 12-14 (except bridge at rows 7-8)
      for (let y = 0; y < 16; y++) {
        if (y !== 7 && y !== 8) {
          t[`12,${y}`] = 'water';
          t[`13,${y}`] = 'chasm';
          t[`14,${y}`] = 'water';
        }
      }

      // West & East rocky cliffs (High Ground / Elevated)
      for (let y = 1; y < 6; y++) {
        t[`16,${y}`] = 'elevation_high';
        t[`17,${y}`] = 'elevation_high';
        t[`18,${y}`] = 'elevation_high';
      }
      for (let y = 10; y < 15; y++) {
        t[`16,${y}`] = 'elevation_high';
        t[`17,${y}`] = 'elevation_high';
        t[`18,${y}`] = 'elevation_high';
      }

      // Boulders (Half and 3/4 Cover)
      t['7,4'] = 'cover_three_quarters';
      t['8,4'] = 'cover_half';
      t['6,11'] = 'cover_half';
      t['7,11'] = 'cover_three_quarters';
      t['19,3'] = 'cover_half';
      t['19,12'] = 'cover_half';

      // Rocky scree (Difficult Terrain)
      t['11,6'] = 'difficult';
      t['11,7'] = 'difficult';
      t['11,8'] = 'difficult';
      t['11,9'] = 'difficult';
      t['15,6'] = 'difficult';
      t['15,7'] = 'difficult';
      t['15,8'] = 'difficult';
      t['15,9'] = 'difficult';

      return t;
    })(),
    doors: {},
    useFogOfWar: false,
    tokens: [
      {
        id: 'token_goblin_sniper_1',
        name: 'Goblin Archer 1 (High Ground)',
        type: 'enemy',
        x: 17,
        y: 3,
        elevationFeet: 10,
        hpMax: 9,
        hpCurrent: 9,
        armorClass: 13,
        speed: 30
      },
      {
        id: 'token_goblin_sniper_2',
        name: 'Goblin Archer 2 (High Ground)',
        type: 'enemy',
        x: 17,
        y: 12,
        elevationFeet: 10,
        hpMax: 9,
        hpCurrent: 9,
        armorClass: 13,
        speed: 30
      },
      {
        id: 'token_goblin_boss',
        name: 'Goblin Boss Grisk',
        type: 'enemy',
        x: 21,
        y: 8,
        hpMax: 24,
        hpCurrent: 24,
        armorClass: 15,
        speed: 30
      },
      {
        id: 'token_party_spawn_gorge_1',
        name: 'Caravan Vanguard',
        type: 'player',
        x: 4,
        y: 7,
        isSpawnPoint: true
      },
      {
        id: 'token_party_spawn_gorge_2',
        name: 'Caravan Rearguard',
        type: 'player',
        x: 4,
        y: 8,
        isSpawnPoint: true
      }
    ]
  },
  {
    id: 'preset_drunken_flagon_tavern',
    name: 'The Drunken Dragon Tavern',
    description: 'A bustling multi-room tavern complete with a sturdy bar counter, patron tables, blazing hearth, kitchen storeroom, and rear alley door.',
    category: 'tavern',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_tavern_brawl',
      title: 'The Drunken Dragon Tavern',
      gridColumns: 20,
      gridRows: 16,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'ship',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // Perimeter tavern walls
      for (let x = 0; x < 20; x++) {
        t[`${x},0`] = 'wall';
        t[`${x},15`] = 'wall';
      }
      for (let y = 0; y < 16; y++) {
        t[`0,${y}`] = 'wall';
        t[`19,${y}`] = 'wall';
      }

      // Kitchen & Storeroom partition wall
      for (let y = 1; y < 8; y++) {
        t[`13,${y}`] = 'wall';
      }
      for (let x = 13; x < 19; x++) {
        t[`${x},7`] = 'wall';
      }

      // Long Bar counter (Half Cover)
      for (let x = 3; x < 10; x++) {
        t[`${x},4`] = 'cover_half';
      }
      t['9,3'] = 'cover_half';
      t['9,2'] = 'cover_half';

      // Blazing Fireplace Hearth (Hazard)
      t['1,7'] = 'hazard';
      t['1,8'] = 'hazard';

      // Dining Tables (Half Cover)
      t['4,9'] = 'cover_half';
      t['5,9'] = 'cover_half';
      t['4,12'] = 'cover_half';
      t['5,12'] = 'cover_half';

      t['9,9'] = 'cover_half';
      t['10,9'] = 'cover_half';
      t['9,12'] = 'cover_half';
      t['10,12'] = 'cover_half';

      t['15,11'] = 'cover_half';
      t['16,11'] = 'cover_half';

      // Overturned Chairs / Ale Spills (Difficult Terrain)
      t['6,9'] = 'difficult';
      t['6,12'] = 'difficult';
      t['3,8'] = 'difficult';

      // Doors
      t['10,15'] = 'door';
      t['13,4'] = 'door';
      t['19,3'] = 'door';

      return t;
    })(),
    doors: {
      '10,15': { x: 10, y: 15, isOpen: true, isLocked: false }, // Main entrance
      '13,4': { x: 13, y: 4, isOpen: false, isLocked: false }, // Kitchen door
      '19,3': { x: 19, y: 3, isOpen: false, isLocked: true } // Kitchen back alley
    },
    useFogOfWar: false,
    tokens: [
      {
        id: 'token_barkeep',
        name: 'Grom the Barkeep',
        type: 'ally',
        x: 6,
        y: 2,
        hpMax: 30,
        hpCurrent: 30,
        armorClass: 12,
        speed: 30
      },
      {
        id: 'token_brawler_1',
        name: 'Rowdy Mercenary',
        type: 'enemy',
        x: 8,
        y: 9,
        hpMax: 22,
        hpCurrent: 22,
        armorClass: 13,
        speed: 30
      },
      {
        id: 'token_brawler_2',
        name: 'Drunken Ruffian',
        type: 'enemy',
        x: 10,
        y: 12,
        hpMax: 16,
        hpCurrent: 16,
        armorClass: 11,
        speed: 30
      },
      {
        id: 'token_spawn_tavern_entry',
        name: 'Tavern Threshold',
        type: 'player',
        x: 10,
        y: 14,
        isSpawnPoint: true
      }
    ]
  },
  {
    id: 'preset_volcano_caldera',
    name: 'Obsidian Caldera - Dragon Lair',
    description: 'A perilous volcanic chamber surrounded by rivers of molten magma, isolated basalt pedestals, and jagged obsidian monoliths.',
    category: 'boss_arena',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_volcano_caldera',
      title: 'Obsidian Caldera - Dragon Lair',
      gridColumns: 26,
      gridRows: 18,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'volcano',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // Molten Lava Channels (Hazard)
      for (let y = 0; y < 18; y++) {
        t[`8,${y}`] = 'hazard';
        t[`9,${y}`] = 'hazard';
        t[`17,${y}`] = 'hazard';
        t[`18,${y}`] = 'hazard';
      }

      // Stone stepping bridges over lava
      delete t['8,8'];
      delete t['9,8'];
      delete t['17,9'];
      delete t['18,9'];
      t['8,8'] = 'difficult';
      t['9,8'] = 'difficult';
      t['17,9'] = 'difficult';
      t['18,9'] = 'difficult';

      // Basalt Dais / Elevated High Ground in center
      for (let x = 12; x <= 14; x++) {
        for (let y = 7; y <= 10; y++) {
          t[`${x},${y}`] = 'elevation_high';
        }
      }

      // Obsidian Monoliths (Walls & 3/4 Cover)
      t['4,4'] = 'wall';
      t['4,13'] = 'wall';
      t['22,4'] = 'wall';
      t['22,13'] = 'wall';
      t['11,6'] = 'cover_three_quarters';
      t['15,6'] = 'cover_three_quarters';
      t['11,11'] = 'cover_three_quarters';
      t['15,11'] = 'cover_three_quarters';

      // Magma cracks (Difficult)
      t['13,5'] = 'difficult';
      t['13,12'] = 'difficult';

      return t;
    })(),
    doors: {},
    useFogOfWar: false,
    tokens: [
      {
        id: 'token_red_dragon',
        name: 'Young Red Dragon',
        type: 'enemy',
        x: 12,
        y: 7,
        tokenSize: 2, // Large 2x2 creature
        reachFeet: 10,
        elevationFeet: 10,
        hpMax: 178,
        hpCurrent: 178,
        armorClass: 18,
        speed: 40
      },
      {
        id: 'token_magma_mephit_1',
        name: 'Magma Mephit A',
        type: 'enemy',
        x: 7,
        y: 4,
        hpMax: 22,
        hpCurrent: 22,
        armorClass: 11,
        speed: 30
      },
      {
        id: 'token_magma_mephit_2',
        name: 'Magma Mephit B',
        type: 'enemy',
        x: 19,
        y: 13,
        hpMax: 22,
        hpCurrent: 22,
        armorClass: 11,
        speed: 30
      },
      {
        id: 'token_party_caldera_entry',
        name: 'Basalt Entry Ledge',
        type: 'player',
        x: 2,
        y: 8,
        isSpawnPoint: true
      }
    ]
  },
  {
    id: 'preset_astral_observatory',
    name: "Archmage's Astral Observatory",
    description: 'A levitating planar tower floating above the cosmic void, featuring glowing ward runes, an ethereal chasm, and arcane barrier lines.',
    category: 'ruins',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_astral_observatory',
      title: "Archmage's Astral Observatory",
      gridColumns: 24,
      gridRows: 16,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'void',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // Outer Cosmic Abyss (Chasm)
      for (let x = 0; x < 24; x++) {
        t[`${x},0`] = 'chasm';
        t[`${x},15`] = 'chasm';
      }
      for (let y = 0; y < 16; y++) {
        t[`0,${y}`] = 'chasm';
        t[`23,${y}`] = 'chasm';
      }

      // Central Arcane Dais (Elevated)
      for (let x = 10; x <= 13; x++) {
        for (let y = 6; y <= 9; y++) {
          t[`${x},${y}`] = 'elevation_high';
        }
      }

      // Force Pillars (Three Quarters Cover)
      t['6,4'] = 'cover_three_quarters';
      t['6,11'] = 'cover_three_quarters';
      t['17,4'] = 'cover_three_quarters';
      t['17,11'] = 'cover_three_quarters';

      // Planar Rifts (Hazard)
      t['10,3'] = 'hazard';
      t['13,3'] = 'hazard';
      t['10,12'] = 'hazard';
      t['13,12'] = 'hazard';

      // Teleport runes (Water representation / Arcane Pads)
      t['3,7'] = 'water';
      t['3,8'] = 'water';
      t['20,7'] = 'water';
      t['20,8'] = 'water';

      return t;
    })(),
    doors: {},
    useFogOfWar: false,
    tokens: [
      {
        id: 'token_astral_golem',
        name: 'Rune Golem Guardian',
        type: 'enemy',
        x: 11,
        y: 7,
        tokenSize: 2,
        reachFeet: 10,
        hpMax: 133,
        hpCurrent: 133,
        armorClass: 17,
        speed: 30
      },
      {
        id: 'token_astral_portal_spawn',
        name: 'Astral Portal Ingress',
        type: 'player',
        x: 3,
        y: 8,
        isSpawnPoint: true
      }
    ]
  },
  {
    id: 'preset_colosseum_arena',
    name: 'Imperial Colosseum of Champions',
    description: 'A grand circular gladiatorial arena with iron portcullises, spiked pit traps, spectator high terraces, and opposing gladiator gates.',
    category: 'boss_arena',
    isBuiltin: true,
    isPublic: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    config: {
      id: 'cfg_colosseum_arena',
      title: 'Imperial Colosseum of Champions',
      gridColumns: 26,
      gridRows: 18,
      feetPerSquare: 5,
      gridType: 'square',
      theme: 'dungeon',
      diagonalRule: 'standard5e',
      showCoordinates: true,
      showMovementRings: true,
      showReachableGrid: true,
      snapToGrid: true
    },
    terrainMap: (() => {
      const t: Record<string, any> = {};
      // Outer Arena Wall
      for (let x = 0; x < 26; x++) {
        t[`${x},0`] = 'wall';
        t[`${x},17`] = 'wall';
      }
      for (let y = 0; y < 18; y++) {
        t[`0,${y}`] = 'wall';
        t[`25,${y}`] = 'wall';
      }

      // Spectator Terraces / High Ground
      for (let x = 1; x < 25; x++) {
        t[`${x},1`] = 'elevation_high';
        t[`${x},16`] = 'elevation_high';
      }

      // Arena Spiked Pits (Hazard)
      t['8,6'] = 'hazard';
      t['8,11'] = 'hazard';
      t['17,6'] = 'hazard';
      t['17,11'] = 'hazard';

      // Center Trophy Dais & Obelisks
      t['12,8'] = 'cover_three_quarters';
      t['13,8'] = 'cover_three_quarters';
      t['12,9'] = 'cover_three_quarters';
      t['13,9'] = 'cover_three_quarters';

      // Sand Scree (Difficult Terrain)
      t['7,8'] = 'difficult';
      t['7,9'] = 'difficult';
      t['18,8'] = 'difficult';
      t['18,9'] = 'difficult';

      // Gates
      t['0,8'] = 'door';
      t['0,9'] = 'door';
      t['25,8'] = 'door';
      t['25,9'] = 'door';

      return t;
    })(),
    doors: {
      '0,8': { x: 0, y: 8, isOpen: true, isLocked: false }, // West Gate
      '0,9': { x: 0, y: 9, isOpen: true, isLocked: false },
      '25,8': { x: 25, y: 8, isOpen: false, isLocked: true }, // East Beast Gate
      '25,9': { x: 25, y: 9, isOpen: false, isLocked: true }
    },
    useFogOfWar: false,
    tokens: [
      {
        id: 'token_gladiator_boss',
        name: 'Reaver Maximus',
        type: 'enemy',
        x: 20,
        y: 8,
        tokenSize: 1,
        reachFeet: 5,
        hpMax: 112,
        hpCurrent: 112,
        armorClass: 16,
        speed: 30
      },
      {
        id: 'token_pit_beast',
        name: 'Caged Manticore',
        type: 'enemy',
        x: 23,
        y: 8,
        tokenSize: 2,
        hpMax: 68,
        hpCurrent: 68,
        armorClass: 14,
        speed: 30
      },
      {
        id: 'token_gladiator_spawn_w',
        name: 'Gladiator Team Gate (West)',
        type: 'player',
        x: 2,
        y: 8,
        isSpawnPoint: true
      }
    ]
  }
];
