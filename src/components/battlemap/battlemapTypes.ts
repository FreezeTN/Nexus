export type GridType = 'square' | 'hex';

export type TerrainType =
  | 'open'
  | 'wall'
  | 'door'
  | 'difficult'
  | 'hazard'
  | 'water'
  | 'shallow_water'
  | 'ice'
  | 'climb'
  | 'web'
  | 'chasm'
  | 'cover_half'
  | 'cover_three_quarters'
  | 'elevation_high'
  | 'elevation_low';

export interface DoorState {
  isOpen: boolean;
  isLocked?: boolean;
  x?: number;
  y?: number;
}

export interface TerrainDefinition {
  id: TerrainType;
  name: string;
  icon: string;
  description: string;
  blocksMovement: boolean;
  blocksSight: boolean;
  movementCostMultiplier: number; // 1 = normal, 2 = difficult terrain (10ft per square)
  color: string;
  borderColor: string;
  bonusAc?: number;
}

export const TERRAIN_DEFINITIONS: Record<TerrainType, TerrainDefinition> = {
  open: {
    id: 'open',
    name: 'Open Ground',
    icon: '🧹',
    description: 'Normal passable terrain.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1,
    color: 'transparent',
    borderColor: 'transparent'
  },
  wall: {
    id: 'wall',
    name: 'Solid Wall',
    icon: '🧱',
    description: 'Impassable masonry, stone, or dungeon wall. Blocks movement and Line of Sight.',
    blocksMovement: true,
    blocksSight: true,
    movementCostMultiplier: Infinity,
    color: '#292524', // stone-800
    borderColor: '#78716c'
  },
  door: {
    id: 'door',
    name: 'Door',
    icon: '🚪',
    description: 'Interactive door. Blocks movement & Line of Sight when closed; clear when open.',
    blocksMovement: true, // when closed
    blocksSight: true,    // when closed
    movementCostMultiplier: 1,
    color: '#451a03', // amber-950
    borderColor: '#f59e0b'
  },
  difficult: {
    id: 'difficult',
    name: 'Difficult Terrain',
    icon: '🪨',
    description: 'Rubble, mud, deep snow, dense briars. Costs 2x movement (10 ft per square).',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(217, 119, 6, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  hazard: {
    id: 'hazard',
    name: 'Hazard / Lava',
    icon: '🌋',
    description: 'Lava, spikes, acid, fire pit. Costs 2x movement and triggers danger on enter.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(220, 38, 38, 0.3)',
    borderColor: '#ef4444'
  },
  water: {
    id: 'water',
    name: 'Deep Water',
    icon: '🌊',
    description: 'Flooded canal or deep river. Requires swimming (2x movement cost without swim speed).',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(14, 165, 233, 0.28)',
    borderColor: '#38bdf8'
  },
  shallow_water: {
    id: 'shallow_water',
    name: 'Shallow Water / Bog',
    icon: '💧',
    description: 'Ankle-to-knee deep water, creek, or swampy bog. Impedes movement (1.5x cost).',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1.5,
    color: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#7dd3fc'
  },
  ice: {
    id: 'ice',
    name: 'Slippery Ice / Snow',
    icon: '❄️',
    description: 'Frozen surface or slick glaze. Difficult terrain (2x movement) with footing hazard.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(186, 230, 253, 0.25)',
    borderColor: '#bae6fd'
  },
  climb: {
    id: 'climb',
    name: 'Steep Cliff / Climb',
    icon: '🧗',
    description: 'Steep rock face, rope ladder, or vertical surface (2x cost without climb speed).',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(168, 162, 158, 0.22)',
    borderColor: '#d6d3d1'
  },
  web: {
    id: 'web',
    name: 'Thick Webs / Vines',
    icon: '🕸️',
    description: 'Dense spiderwebs or clinging creepers. Difficult terrain (2x movement).',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(244, 244, 245, 0.18)',
    borderColor: '#e4e4e7'
  },
  chasm: {
    id: 'chasm',
    name: 'Chasm / Pit',
    icon: '🕳️',
    description: 'Bottomless drop or deep gorge. Impassable unless flying or climbing.',
    blocksMovement: true,
    blocksSight: false,
    movementCostMultiplier: Infinity,
    color: '#09090b',
    borderColor: '#52525b'
  },
  cover_half: {
    id: 'cover_half',
    name: 'Half Cover (+2 AC)',
    icon: '🛡️',
    description: 'Low stone wall, crates, fallen tree trunk. Grants +2 AC and DEX saving throws.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1.5,
    color: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
    bonusAc: 2
  },
  cover_three_quarters: {
    id: 'cover_three_quarters',
    name: '3/4 Cover (+5 AC)',
    icon: '🏰',
    description: 'Arrow slit, heavy portcullis, fortified embrasure. Grants +5 AC and DEX saves.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 2,
    color: 'rgba(99, 102, 241, 0.22)',
    borderColor: '#818cf8',
    bonusAc: 5
  },
  elevation_high: {
    id: 'elevation_high',
    name: 'High Ground (+10 ft)',
    icon: '⛰️',
    description: 'Elevated ledge or parapet. Grants tactical high-ground vantage.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1,
    color: 'rgba(234, 179, 8, 0.2)',
    borderColor: '#eab308'
  },
  elevation_low: {
    id: 'elevation_low',
    name: 'Sunken Trench (-10 ft)',
    icon: '⛏️',
    description: 'Depression or ditch providing partial trench concealment.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1,
    color: 'rgba(120, 113, 108, 0.2)',
    borderColor: '#a8a29e'
  }
};

export interface BattlemapCell {
  x: number; // 0-indexed column
  y: number; // 0-indexed row
  terrain?: TerrainType;
  label?: string;
  color?: string;
  isRevealed?: boolean;
}

export interface BattlemapToken {
  id: string; // matches Combatant id
  combatantId: string;
  name: string;
  x: number; // grid x
  y: number; // grid y
  sizeSquares: number; // 1 = 1x1 (Medium/Small), 2 = 2x2 (Large), 3 = 3x3 (Huge), 4 = 4x4 (Gargantuan)
  reachFeet?: number; // default 5ft
  elevationFeet?: number; // 0 default, positive if flying/perched, negative if pit
  color?: string;
  portraitUrl?: string;
  type: 'player' | 'ally' | 'enemy';
  isDefeated?: boolean;
  controlledBy?: string;
  label?: string;
}

export type BattlemapTheme = 'dungeon' | 'grass' | 'cave' | 'volcano' | 'snow' | 'ship' | 'void';
export type DiagonalRule = 'standard5e' | 'alternating35e' | 'euclidean';

export interface BattlemapConfig {
  id: string;
  title: string;
  gridColumns: number; // e.g. 24
  gridRows: number;    // e.g. 18
  feetPerSquare: number; // standard 5 ft
  gridType: GridType;
  theme: BattlemapTheme;
  diagonalRule: DiagonalRule;
  showCoordinates: boolean;
  showGridNumbers?: boolean;
  showMovementRings: boolean;
  showReachableGrid: boolean;
  snapToGrid: boolean;
  backgroundImageUrl?: string;
  enableDynamicVision?: boolean;
  defaultVisionFeet?: number; // default 60ft
}

export interface BattlemapState {
  config: BattlemapConfig;
  tokens: Record<string, BattlemapToken>; // Keyed by combatantId
  terrainOverrides?: Record<string, TerrainType>; // "x,y" => TerrainType
  doors?: Record<string, DoorState>; // "x,y" => DoorState
  fogOfWar?: Record<string, boolean>; // "x,y" => isExplored
  useFogOfWar?: boolean;
  visionMode?: 'dm' | 'player'; // DM see-through vs player perspective
  selectedTokenId?: string | null;
  targetTokenId?: string | null;
  activeAoE?: AoETemplate | null;
}

export const DEFAULT_BATTLEMAP_CONFIG: BattlemapConfig = {
  id: 'default-battlemap',
  title: 'Tactical Battlemap',
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
};

/**
 * Calculates tactical distance in feet between two grid coordinates based on D&D rules
 */
export function calculateGridDistanceFeet(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e'
): number {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);

  if (rule === 'standard5e') {
    // 5e standard Chebyshev distance: diagonal counts as 1 square (5 ft)
    return Math.max(dx, dy) * feetPerSquare;
  }

  if (rule === 'alternating35e') {
    // 3.5e / 5e Optional Variant: 5/10/5 rule (1st diag 5ft, 2nd diag 10ft, etc.)
    const maxDelta = Math.max(dx, dy);
    const minDelta = Math.min(dx, dy);
    const diagonalCount = minDelta;
    const straightCount = maxDelta - minDelta;
    const diagonalCostSquares = diagonalCount + Math.floor(diagonalCount / 2);
    return (straightCount + diagonalCostSquares) * feetPerSquare;
  }

  // Euclidean
  return Math.round((Math.hypot(dx, dy) * feetPerSquare) / 5) * 5;
}

/**
 * Checks if a terrain cell is impassable for standard ground movement
 */
export function isCellImpassable(
  x: number,
  y: number,
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>
): boolean {
  const key = `${x},${y}`;
  const terrain = terrainMap?.[key];
  if (terrain === 'wall' || terrain === 'chasm') return true;
  if (terrain === 'door') {
    const door = doors?.[key];
    // If door is closed or locked, it blocks movement
    if (!door || !door.isOpen) return true;
  }
  return false;
}

/**
 * Calculates step cost in feet to enter a given target cell, accounting for difficult terrain
 */
export function getCellMovementCost(
  x: number,
  y: number,
  baseCostFeet = 5,
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>
): number {
  if (isCellImpassable(x, y, terrainMap, doors)) {
    return Infinity;
  }

  const key = `${x},${y}`;
  const terrain = terrainMap?.[key];
  if (!terrain) return baseCostFeet;

  const def = TERRAIN_DEFINITIONS[terrain];
  if (!def) return baseCostFeet;

  return baseCostFeet * def.movementCostMultiplier;
}

/**
 * Calculates total path distance along a series of waypoints, accounting for terrain
 */
export function calculatePathDistanceFeet(
  waypoints: Array<{ x: number; y: number }>,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>
): number {
  if (waypoints.length < 2) return 0;
  let total = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const baseDistance = calculateGridDistanceFeet(
      from.x,
      from.y,
      to.x,
      to.y,
      feetPerSquare,
      rule
    );

    // Destination terrain movement penalty
    const destKey = `${to.x},${to.y}`;
    const destTerrain = terrainMap?.[destKey];
    if (destTerrain) {
      const def = TERRAIN_DEFINITIONS[destTerrain];
      const mult = def?.movementCostMultiplier ?? 1;
      total += baseDistance * mult;
    } else {
      total += baseDistance;
    }
  }

  return total;
}

/**
 * Calculates step-by-step ground movement cost between two points, factoring in
 * water, difficult terrain, ice, and special creature movement types.
 */
export function calculateDirectMoveCostFeet(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>,
  options?: {
    hasSwimSpeed?: boolean;
    hasClimbSpeed?: boolean;
    hasFlySpeed?: boolean;
    elevationFeet?: number;
  }
): { totalFeet: number; isPassable: boolean; blockedCell?: { x: number; y: number; reason: string } } {
  if (fromX === toX && fromY === toY) {
    return { totalFeet: 0, isPassable: true };
  }

  // Check destination directly
  if (isCellImpassable(toX, toY, terrainMap, doors)) {
    if (!(options?.hasFlySpeed || (options?.elevationFeet && options.elevationFeet > 0))) {
      return { totalFeet: Infinity, isPassable: false, blockedCell: { x: toX, y: toY, reason: 'Impassable terrain or closed door' } };
    }
  }

  // Sample points along the trajectory
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  const sx = fromX < toX ? 1 : -1;
  const sy = fromY < toY ? 1 : -1;
  let err = dx - dy;

  let curX = fromX;
  let curY = fromY;
  const visitedCells: Array<{ x: number; y: number }> = [];

  while (curX !== toX || curY !== toY) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
    visitedCells.push({ x: curX, y: curY });
  }

  const isFlying = Boolean(options?.hasFlySpeed || (options?.elevationFeet && options.elevationFeet > 0));

  let totalFeet = 0;
  for (const cell of visitedCells) {
    const key = `${cell.x},${cell.y}`;
    const terrain = terrainMap?.[key];
    const door = doors?.[key];

    if (terrain === 'wall' || (door && !door.isOpen)) {
      if (!isFlying) {
        return { totalFeet: Infinity, isPassable: false, blockedCell: { x: cell.x, y: cell.y, reason: 'Wall or closed door in path' } };
      }
    }

    if (terrain === 'chasm' && !isFlying) {
      return { totalFeet: Infinity, isPassable: false, blockedCell: { x: cell.x, y: cell.y, reason: 'Chasm in path' } };
    }

    let mult = 1;
    if (terrain && !isFlying) {
      const def = TERRAIN_DEFINITIONS[terrain];
      if (def) {
        if ((terrain === 'water' || terrain === 'shallow_water') && options?.hasSwimSpeed) {
          mult = 1;
        } else if (terrain === 'climb' && options?.hasClimbSpeed) {
          mult = 1;
        } else {
          mult = def.movementCostMultiplier;
        }
      }
    }

    totalFeet += feetPerSquare * mult;
  }

  return { totalFeet, isPassable: true };
}

export const BATTLEMAP_THEMES: Record<
  BattlemapTheme,
  { name: string; bg: string; gridColor: string; wallColor: string; difficultColor: string; icon: string }
> = {
  dungeon: {
    name: 'Dungeon Stone',
    bg: '#1c1917', // stone-900
    gridColor: 'rgba(168, 162, 158, 0.18)',
    wallColor: '#292524',
    difficultColor: 'rgba(217, 119, 6, 0.25)',
    icon: '🏰'
  },
  grass: {
    name: 'Wilderness Grassland',
    bg: '#14281d',
    gridColor: 'rgba(74, 222, 128, 0.18)',
    wallColor: '#1b3b28',
    difficultColor: 'rgba(234, 179, 8, 0.25)',
    icon: '🌲'
  },
  cave: {
    name: 'Cavern & Earth',
    bg: '#221b18',
    gridColor: 'rgba(214, 211, 209, 0.16)',
    wallColor: '#382e29',
    difficultColor: 'rgba(249, 115, 22, 0.25)',
    icon: '🪨'
  },
  volcano: {
    name: 'Volcanic Caldera',
    bg: '#26120e',
    gridColor: 'rgba(248, 113, 113, 0.22)',
    wallColor: '#451a13',
    difficultColor: 'rgba(239, 68, 68, 0.35)',
    icon: '🌋'
  },
  snow: {
    name: 'Glacial Tundra',
    bg: '#0f172a', // slate-900
    gridColor: 'rgba(186, 230, 253, 0.22)',
    wallColor: '#1e293b',
    difficultColor: 'rgba(56, 189, 248, 0.25)',
    icon: '❄️'
  },
  ship: {
    name: 'Wooden Deck / Ship',
    bg: '#271c14',
    gridColor: 'rgba(245, 158, 11, 0.2)',
    wallColor: '#452c1e',
    difficultColor: 'rgba(217, 119, 6, 0.25)',
    icon: '⛵'
  },
  void: {
    name: 'Astral Void / Deep Dark',
    bg: '#09090b', // zinc-950
    gridColor: 'rgba(168, 85, 247, 0.22)',
    wallColor: '#18181b',
    difficultColor: 'rgba(147, 51, 234, 0.3)',
    icon: '✨'
  }
};

// ==========================================
// PHASE 4: FOG OF WAR, LINE OF SIGHT & AOE
// ==========================================

export type AoEShape = 'circle' | 'cone' | 'cube' | 'line';

export interface AoETemplate {
  id: string;
  name: string;
  shape: AoEShape;
  originX: number; // grid column (float or int for smooth positioning)
  originY: number; // grid row (float or int)
  radiusFeet: number; // for circle
  lengthFeet: number; // for cone / line
  widthFeet?: number; // for line width or cube size
  sizeFeet?: number; // Size in feet alias
  angleDegrees: number; // 0 = East, 90 = South, 180 = West, 270 = North
  color: string;
  borderColor: string;
  saveType?: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA';
  saveDc?: number;
  damageDice?: string;
  damageType?: string;
  description?: string;
  isLocked?: boolean;
}

export interface SpellAoEPreset {
  id: string;
  name: string;
  icon: string;
  shape: AoEShape;
  sizeFeet: number;
  widthFeet?: number;
  color: string;
  borderColor: string;
  saveType?: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA';
  damageDice?: string;
  damageType?: string;
  description: string;
}

export const STANDARD_SPELL_AOE_PRESETS: SpellAoEPreset[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    shape: 'circle',
    sizeFeet: 20,
    color: 'rgba(239, 68, 68, 0.35)',
    borderColor: '#ef4444',
    saveType: 'DEX',
    damageDice: '8d6',
    damageType: 'Fire',
    description: '20-foot radius sphere of fiery explosion. Dexterity save for half damage.'
  },
  {
    id: 'burning_hands',
    name: 'Burning Hands',
    icon: '✋🔥',
    shape: 'cone',
    sizeFeet: 15,
    color: 'rgba(249, 115, 22, 0.38)',
    borderColor: '#f97316',
    saveType: 'DEX',
    damageDice: '3d6',
    damageType: 'Fire',
    description: '15-foot cone of sweeping flame from outstretched fingers.'
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    icon: '⚡',
    shape: 'line',
    sizeFeet: 100,
    widthFeet: 5,
    color: 'rgba(59, 130, 246, 0.38)',
    borderColor: '#3b82f6',
    saveType: 'DEX',
    damageDice: '8d6',
    damageType: 'Lightning',
    description: '100-foot long, 5-foot wide blast of crackling lightning.'
  },
  {
    id: 'cone_of_cold',
    name: 'Cone of Cold',
    icon: '❄️',
    shape: 'cone',
    sizeFeet: 60,
    color: 'rgba(56, 189, 248, 0.35)',
    borderColor: '#38bdf8',
    saveType: 'CON',
    damageDice: '8d8',
    damageType: 'Cold',
    description: '60-foot cone of howling frigid gale and subzero frost.'
  },
  {
    id: 'spirit_guardians',
    name: 'Spirit Guardians',
    icon: '👼',
    shape: 'circle',
    sizeFeet: 15,
    color: 'rgba(234, 179, 8, 0.3)',
    borderColor: '#eab308',
    saveType: 'WIS',
    damageDice: '3d8',
    damageType: 'Radiant',
    description: '15-foot aura of protective celestial or fiendish spirits. Halves movement speed.'
  },
  {
    id: 'web',
    name: 'Web',
    icon: '🕸️',
    shape: 'cube',
    sizeFeet: 20,
    color: 'rgba(228, 228, 231, 0.38)',
    borderColor: '#e4e4e7',
    saveType: 'DEX',
    description: '20-foot cube of thick, sticky webbing. Difficult terrain; Restrains targets.'
  },
  {
    id: 'hypnotic_pattern',
    name: 'Hypnotic Pattern',
    icon: '🌀',
    shape: 'cube',
    sizeFeet: 30,
    color: 'rgba(168, 85, 247, 0.35)',
    borderColor: '#a855f7',
    saveType: 'WIS',
    description: '30-foot cube of swirling kaleidoscope colors. Incapacitates on failed save.'
  },
  {
    id: 'darkness',
    name: 'Darkness',
    icon: '🌑',
    shape: 'circle',
    sizeFeet: 15,
    color: 'rgba(24, 24, 27, 0.75)',
    borderColor: '#71717a',
    description: '15-foot radius sphere of magical darkness impenetrable to standard darkvision.'
  },
  {
    id: 'faerie_fire',
    name: 'Faerie Fire',
    icon: '✨',
    shape: 'cube',
    sizeFeet: 20,
    color: 'rgba(236, 72, 153, 0.35)',
    borderColor: '#ec4899',
    saveType: 'DEX',
    description: '20-foot cube illuminating creatures; gives attack rolls against them Advantage.'
  },
  {
    id: 'shatter',
    name: 'Shatter',
    icon: '💥',
    shape: 'circle',
    sizeFeet: 10,
    color: 'rgba(14, 165, 233, 0.35)',
    borderColor: '#0284c7',
    saveType: 'CON',
    damageDice: '3d8',
    damageType: 'Thunder',
    description: '10-foot radius sphere of ear-splitting ringing sound.'
  }
];

export const SPELL_AOE_PRESETS = STANDARD_SPELL_AOE_PRESETS;

export type CoverType = 'none' | 'half' | 'three_quarters' | 'total';

export interface LineOfSightResult {
  hasLoS: boolean;
  cover: CoverType;
  bonusAc: number;
  blockedBy?: { x: number; y: number; label: string };
  distanceFeet: number;
}

/**
 * Checks if a terrain tile blocks Line of Sight
 */
export function doesCellBlockSight(
  x: number,
  y: number,
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>
): boolean {
  const key = `${x},${y}`;
  const terrain = terrainMap?.[key];
  if (terrain === 'wall') return true;
  if (terrain === 'door') {
    const door = doors?.[key];
    if (!door || !door.isOpen) return true;
  }
  return false;
}

/**
 * Calculates Line of Sight and Cover between two grid cells using ray traversal
 */
export function calculateLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>
): LineOfSightResult {
  const distanceFeet = calculateGridDistanceFeet(x1, y1, x2, y2, feetPerSquare, rule);

  if (x1 === x2 && y1 === y2) {
    return { hasLoS: true, cover: 'none', bonusAc: 0, distanceFeet: 0 };
  }

  // Bresenham line raycasting
  let maxCover: CoverType = 'none';
  let blockedBy: { x: number; y: number; label: string } | undefined;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let curX = x1;
  let curY = y1;

  while (true) {
    if (curX === x2 && curY === y2) break;

    // Advance ray
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }

    if (curX === x2 && curY === y2) break;

    const key = `${curX},${curY}`;
    const terrain = terrainMap?.[key];

    // Check wall or closed door
    if (doesCellBlockSight(curX, curY, terrainMap, doors)) {
      return {
        hasLoS: false,
        cover: 'total',
        bonusAc: 99,
        blockedBy: {
          x: curX,
          y: curY,
          label: terrain === 'door' ? 'Closed Door' : 'Solid Wall'
        },
        distanceFeet
      };
    }

    // Check partial cover
    if (terrain === 'cover_three_quarters') {
      maxCover = 'three_quarters';
    } else if (terrain === 'cover_half' && maxCover === 'none') {
      maxCover = 'half';
    }
  }

  const bonusAc = maxCover === 'three_quarters' ? 5 : maxCover === 'half' ? 2 : 0;
  return {
    hasLoS: true,
    cover: maxCover,
    bonusAc,
    blockedBy,
    distanceFeet
  };
}

/**
 * Calculates dynamic vision cells revealed by a token
 */
export function calculateVisibleCells(
  originX: number,
  originY: number,
  radiusSquares: number,
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>,
  maxCols = 24,
  maxRows = 16
): Set<string> {
  const visible = new Set<string>();
  visible.add(`${originX},${originY}`);

  const minX = Math.max(0, originX - radiusSquares);
  const maxX = Math.min(maxCols - 1, originX + radiusSquares);
  const minY = Math.max(0, originY - radiusSquares);
  const maxY = Math.min(maxRows - 1, originY + radiusSquares);

  // Cast ray to all boundary cells in bounding box
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (x === originX && y === originY) continue;

      const dist = Math.hypot(x - originX, y - originY);
      if (dist > radiusSquares + 0.5) continue;

      // Ray from origin to (x, y)
      const dx = Math.abs(x - originX);
      const dy = Math.abs(y - originY);
      const sx = originX < x ? 1 : -1;
      const sy = originY < y ? 1 : -1;
      let err = dx - dy;

      let curX = originX;
      let curY = originY;
      let isBlocked = false;

      while (true) {
        visible.add(`${curX},${curY}`);

        if (curX === x && curY === y) break;

        // If current cell blocks sight and is not the origin, tiles behind it are occluded
        if ((curX !== originX || curY !== originY) && doesCellBlockSight(curX, curY, terrainMap, doors)) {
          isBlocked = true;
          break;
        }

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          curX += sx;
        }
        if (e2 < dx) {
          err += dx;
          curY += sy;
        }
      }
    }
  }

  return visible;
}

/**
 * Checks whether a token intersects an active AoE template
 */
export function isTokenInsideAoE(
  tokenX: number,
  tokenY: number,
  tokenSizeSquares: number,
  aoe: AoETemplate,
  feetPerSquare = 5
): boolean {
  // Token center coordinates
  const tokenCenterX = tokenX + tokenSizeSquares / 2;
  const tokenCenterY = tokenY + tokenSizeSquares / 2;
  const tokenRadiusFeet = (tokenSizeSquares / 2) * feetPerSquare;

  if (aoe.shape === 'circle') {
    const dx = (tokenCenterX - (aoe.originX + 0.5)) * feetPerSquare;
    const dy = (tokenCenterY - (aoe.originY + 0.5)) * feetPerSquare;
    const dist = Math.hypot(dx, dy);
    return dist <= aoe.radiusFeet + tokenRadiusFeet;
  }

  if (aoe.shape === 'cube') {
    const halfWidthSquares = (aoe.radiusFeet || aoe.lengthFeet) / (2 * feetPerSquare);
    const minX = aoe.originX - halfWidthSquares;
    const maxX = aoe.originX + halfWidthSquares + 1;
    const minY = aoe.originY - halfWidthSquares;
    const maxY = aoe.originY + halfWidthSquares + 1;

    return (
      tokenX + tokenSizeSquares > minX &&
      tokenX < maxX &&
      tokenY + tokenSizeSquares > minY &&
      tokenY < maxY
    );
  }

  if (aoe.shape === 'cone') {
    // Cone origin at aoe.originX, aoe.originY
    const dxFeet = (tokenCenterX - (aoe.originX + 0.5)) * feetPerSquare;
    const dyFeet = (tokenCenterY - (aoe.originY + 0.5)) * feetPerSquare;
    const distFeet = Math.hypot(dxFeet, dyFeet);

    if (distFeet > aoe.lengthFeet + tokenRadiusFeet) return false;
    if (distFeet < tokenRadiusFeet) return true; // right on origin

    // Target angle from origin
    let angleRad = Math.atan2(dyFeet, dxFeet);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    // Cone angle difference (standard 5e cone angle is 53.13 degrees, or +- 26.5 deg from center line)
    let diff = Math.abs(angleDeg - aoe.angleDegrees);
    if (diff > 180) diff = 360 - diff;

    return diff <= 28;
  }

  if (aoe.shape === 'line') {
    // 5e Line: starts at origin, extends lengthFeet at angleDegrees, widthFeet wide
    const halfWidthFeet = ((aoe.widthFeet || 5) / 2) + tokenRadiusFeet;
    const lengthFeet = aoe.lengthFeet;

    const angleRad = (aoe.angleDegrees * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);

    const relX = (tokenCenterX - (aoe.originX + 0.5)) * feetPerSquare;
    const relY = (tokenCenterY - (aoe.originY + 0.5)) * feetPerSquare;

    // Project onto line direction
    const projAlong = relX * dirX + relY * dirY;
    if (projAlong < -tokenRadiusFeet || projAlong > lengthFeet + tokenRadiusFeet) {
      return false;
    }

    // Distance perpendicular to line
    const perpDist = Math.abs(-relX * dirY + relY * dirX);
    return perpDist <= halfWidthFeet;
  }

  return false;
}

// ==========================================
// BATTLEMAP LAYOUT PRE-BUILD & SAVE / LOAD
// ==========================================

export type BattlemapCategory =
  | 'dungeon'
  | 'wilderness'
  | 'tavern'
  | 'boss_arena'
  | 'cavern'
  | 'ruins'
  | 'urban'
  | 'custom';

export interface BattlemapLayoutToken {
  id: string;
  name: string;
  type: 'player' | 'ally' | 'enemy';
  x: number;
  y: number;
  tokenSize?: number;
  reachFeet?: number;
  elevationFeet?: number;
  speed?: number;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
  portraitUrl?: string;
  isSpawnPoint?: boolean;
}

export interface BattlemapLayout {
  id: string;
  name: string;
  description?: string;
  category: BattlemapCategory;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  isBuiltin?: boolean;
  isPublic?: boolean;

  config: BattlemapConfig;
  terrainMap: Record<string, TerrainType>;
  doors: Record<string, DoorState>;
  fogOfWar?: Record<string, boolean>;
  useFogOfWar?: boolean;
  activeAoE?: AoETemplate | null;
  tokens?: BattlemapLayoutToken[];
}

// ==========================================
// TELEPORT & SPELL TARGETING ON BATTLEMAP
// ==========================================

export interface ActiveTeleportState {
  sourceCombatantId: string;
  sourceCombatantName: string;
  abilityName: string; // e.g. "Misty Step", "Dimension Door", "Fey Step", "Shadow Step", "Teleport"
  rangeFeet: number; // e.g. 30, 60, 400, 500
  requiresLineOfSight?: boolean;
  description?: string;
}

export interface ActiveSpellTargetingState {
  sourceCombatantId: string;
  sourceCombatantName: string;
  spellId?: string;
  spellName: string;
  rangeFeet: number; // e.g. 30, 60, 120, 150
  shape?: 'single_target' | 'sphere' | 'cone' | 'line' | 'cube';
  areaSizeFeet?: number;
  damageDice?: string;
  damageType?: string;
  saveType?: string;
  saveDc?: number;
  description?: string;
}

