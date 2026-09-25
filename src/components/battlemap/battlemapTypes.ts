import { RuleEdition } from '../../types';

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
  | 'elevation_low'
  | 'sheltered';

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
    name: 'Crates / Half Cover (+2 AC)',
    icon: '📦',
    description: 'Cargo crates, barrels, low stone parapet. Grants +2 AC and DEX saving throws.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1.5,
    color: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
    bonusAc: 2
  },
  cover_three_quarters: {
    id: 'cover_three_quarters',
    name: 'Pillar / Fortified (+5 AC)',
    icon: '🏛️',
    description: 'Heavy stone pillar, portcullis, fortified embrasure. Grants +5 AC and DEX saves.',
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
  },
  sheltered: {
    id: 'sheltered',
    name: 'Sheltered / Indoor Roof',
    icon: '🏠',
    description: 'Indoor room, cave, or roofed structure. Completely sheltered from overhead weather (rain, blizzard, wind) and capped by ceiling clearance.',
    blocksMovement: false,
    blocksSight: false,
    movementCostMultiplier: 1,
    color: 'rgba(217, 119, 6, 0.14)',
    borderColor: '#d97706'
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
  lightSource?: LightSourceType;
}

export type BattlemapTheme = 'dungeon' | 'grass' | 'cave' | 'volcano' | 'snow' | 'ship' | 'void';
export type DiagonalRule = 'standard5e' | 'alternating35e' | 'euclidean';
import { WeatherEffectType, WeatherDefinition, WEATHER_DEFINITIONS } from './weatherDefinitions';
export type { WeatherEffectType, WeatherDefinition };
export { WEATHER_DEFINITIONS };
export type LightSourceType = 'none' | 'torch' | 'lantern' | 'magical_light';

export type MapPinType = 'trap' | 'secret_door' | 'treasure' | 'note' | 'ambush' | 'hazard';

export interface BattlemapPin {
  id: string;
  x: number; // grid col
  y: number; // grid row
  type: MapPinType;
  title: string;
  description?: string;
  dc?: number; // e.g. DC 15 Perception / Investigation
  isSecret: boolean; // if true, only visible to GM
  color?: string;
  createdAt?: number;
}

export interface BattlemapPing {
  id: string;
  x: number; // grid col
  y: number; // grid row
  color?: string;
  label?: string;
  senderName?: string;
  timestamp: number;
}

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
  weatherEffect?: WeatherEffectType;
  showThreatReachRings?: boolean;
  showAoOWarnings?: boolean;
  enableTokenLighting?: boolean;
  shelteredCeilingFeet?: number; // Default ceiling height in feet for sheltered cells, e.g. 10 ft
  isEntirelyIndoors?: boolean; // If true, the whole map is indoors/subterranean (no overhead weather, full ceiling clamp)
  ceilingOverrides?: Record<string, number>; // Per-tile custom ceiling height in feet, e.g. "x,y" => 25
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
  snapToGrid: true,
  weatherEffect: 'none',
  showThreatReachRings: true,
  showAoOWarnings: true,
  enableTokenLighting: true
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
 * Calculates true 3D tactical distance factoring horizontal distance and vertical altitude difference (Z).
 * Supports standard 5e Chebyshev (max of horizontal or vertical) and 3.5e/Euclidean hypotenuse (sqrt(h^2 + dz^2)).
 */
export function calculateGridDistance3D(
  x1: number,
  y1: number,
  z1 = 0,
  x2: number,
  y2: number,
  z2 = 0,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e'
): number {
  const horizontalDist = calculateGridDistanceFeet(x1, y1, x2, y2, feetPerSquare, rule);
  const deltaZ = Math.abs((z1 || 0) - (z2 || 0));
  if (deltaZ === 0) return horizontalDist;

  if (rule === 'standard5e') {
    // 5e standard Chebyshev 3D (XGtE / DMG): distance equals the greater of horizontal or vertical span
    return Math.max(horizontalDist, deltaZ);
  }

  // Alternating 3.5e / Euclidean true hypotenuse: sqrt(h^2 + dz^2) rounded to nearest 5 ft
  return Math.round(Math.hypot(horizontalDist, deltaZ) / 5) * 5;
}

/**
 * Checks whether a specific grid square (at targetZ elevation) is threatened by a combatant's melee reach.
 * Defeated or incapacitated creatures do not threaten any squares.
 * Enforces vertical 3D reach constraints: if vertical height delta > reachFeet, square is NOT threatened.
 */
export function isSquareThreatenedByCombatant(
  cellX: number,
  cellY: number,
  combatant: {
    calculatedX?: number;
    calculatedY?: number;
    mapX?: number;
    mapY?: number;
    calculatedSize?: number;
    tokenSize?: number;
    reachFeet?: number;
    elevationFeet?: number;
    isDefeated?: boolean;
    hpCurrent?: number;
    conditions?: string[];
    reachType?: 'Tall' | 'Long';
    naturalReachOverrideFt?: number;
    isFlatFooted?: boolean;
    hasCombatReflexes?: boolean;
  },
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  targetZ = 0,
  edition: RuleEdition = '5e'
): boolean {
  if (combatant.isDefeated || (combatant.hpCurrent !== undefined && combatant.hpCurrent <= 0)) {
    return false;
  }
  // 3.5e RAW: Flat-footed combatants cannot make Attacks of Opportunity unless they possess Combat Reflexes
  if (edition === '3.5e' && combatant.isFlatFooted && !combatant.hasCombatReflexes) {
    return false;
  }

  const conds = combatant.conditions || [];
  if (
    conds.includes('Unconscious') ||
    conds.includes('Dead') ||
    conds.includes('Paralyzed') ||
    conds.includes('Petrified') ||
    conds.includes('Stunned') ||
    conds.includes('Incapacitated') ||
    (edition === '3.5e' && (conds.includes('Helpless') || conds.includes('Cowering') || conds.includes('Panicked')))
  ) {
    return false;
  }

  // Calculate reach in feet:
  // In 3.5e RAW (PHB p. 149): Large (Tall) creatures naturally have 10 ft reach; Huge (Tall) has 15 ft reach.
  // In 5e RAW: default reach is 5 ft unless explicitly specified in stat block or reach weapon.
  let reachFeet = combatant.reachFeet;
  if (!reachFeet) {
    if (edition === '3.5e') {
      const size = combatant.calculatedSize ?? combatant.tokenSize ?? 1;
      const isLong = combatant.reachType === 'Long';
      if (size >= 3) {
        reachFeet = isLong ? 10 : 15;
      } else if (size >= 2) {
        reachFeet = isLong ? 5 : 10;
      } else {
        reachFeet = 5;
      }
    } else {
      reachFeet = 5;
    }
  }

  const combatantZ = combatant.elevationFeet || 0;
  const verticalDelta = Math.abs(combatantZ - targetZ);

  // 3D Reach Gate: If vertical distance exceeds melee reach, square is not threatened
  if (verticalDelta > reachFeet) {
    return false;
  }

  const ox = combatant.calculatedX ?? combatant.mapX ?? 0;
  const oy = combatant.calculatedY ?? combatant.mapY ?? 0;
  const size = combatant.calculatedSize ?? combatant.tokenSize ?? 1;

  // If the cell is inside the creature's own occupied body space, it's not a threatened attack square
  if (cellX >= ox && cellX < ox + size && cellY >= oy && cellY < oy + size && verticalDelta === 0) {
    return false;
  }

  // Find distance to the closest border cell of the creature
  const closestX = Math.max(ox, Math.min(cellX, ox + size - 1));
  const closestY = Math.max(oy, Math.min(cellY, oy + size - 1));

  const distFeet = calculateGridDistance3D(cellX, cellY, targetZ, closestX, closestY, combatantZ, feetPerSquare, rule);
  return distFeet <= reachFeet;
}

/**
 * Detects whether moving from startCell to destCell provokes an Attack of Opportunity (AoO)
 * - 5e RAW (PHB p. 195): Provoked ONLY when moving out of a creature's reach (exiting the threatened area).
 * - 3.5e RAW (PHB p. 137): Provoked whenever moving OUT of ANY threatened square, even if moving to another threatened square!
 */
export function detectAoOProvoked(
  mover: {
    id: string;
    type?: 'player' | 'ally' | 'enemy';
    elevationFeet?: number;
  },
  startCell: { x: number; y: number; z?: number },
  destCell: { x: number; y: number; z?: number },
  combatants: Array<any>,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  edition: RuleEdition = '5e'
): { provoked: boolean; threateningEnemies: any[]; reason?: string } {
  // Determine who is hostile to this mover
  const isMoverEnemy = mover.type === 'enemy';
  const threateningEnemies: any[] = [];
  const startZ = startCell.z ?? mover.elevationFeet ?? 0;
  const destZ = destCell.z ?? mover.elevationFeet ?? 0;

  for (const c of combatants) {
    if (c.id === mover.id || (!c.isOnMap && c.isOnMap !== undefined)) continue;
    const isEnemy = isMoverEnemy ? (c.type === 'player' || c.type === 'ally') : (c.type === 'enemy');
    if (!isEnemy) continue;

    // Check if enemy threatened startCell with 3D reach
    const threatenedStart = isSquareThreatenedByCombatant(startCell.x, startCell.y, c, feetPerSquare, rule, startZ, edition);
    if (!threatenedStart) continue;

    const threatenedDest = isSquareThreatenedByCombatant(destCell.x, destCell.y, c, feetPerSquare, rule, destZ, edition);

    if (edition === '3.5e') {
      // In 3.5e RAW (PHB p. 137): Moving out of ANY threatened square provokes an AoO
      // (Unless using 5-foot step or Withdraw action)
      threateningEnemies.push(c);
    } else {
      // In 5e RAW (PHB p. 195): Moving out of reach (leaving the threatened perimeter) provokes an AoO
      if (!threatenedDest) {
        threateningEnemies.push(c);
      }
    }
  }

  const reason = edition === '3.5e'
    ? '3.5e RAW: Moving out of a threatened square provokes an Attack of Opportunity'
    : '5e RAW: Moving out of reach provokes an Attack of Opportunity';

  return {
    provoked: threateningEnemies.length > 0,
    threateningEnemies,
    reason
  };
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
 * Calculates total path distance along a series of waypoints, accounting for terrain,
 * diagonal movement rules (5e / 3.5e alternating / euclidean), and difficult terrain multipliers.
 */
export function calculatePathDistanceFeet(
  waypoints: Array<{ x: number; y: number }>,
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
): number {
  if (waypoints.length < 2) return 0;
  let total = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    // If terrainMap is provided, trace intermediate tiles using calculateDirectMoveCostFeet
    if (terrainMap) {
      const stepCost = calculateDirectMoveCostFeet(
        from.x,
        from.y,
        to.x,
        to.y,
        feetPerSquare,
        rule,
        terrainMap,
        doors,
        options
      );
      if (stepCost.isPassable && isFinite(stepCost.totalFeet)) {
        total += stepCost.totalFeet;
        continue;
      }
    }

    // Fallback or straight line calculation
    const baseDistance = calculateGridDistanceFeet(
      from.x,
      from.y,
      to.x,
      to.y,
      feetPerSquare,
      rule
    );

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
  elevationFeet?: number; // Altitude of AoE center/origin in feet (default 0)
  heightFeet?: number; // Vertical cylinder/column height in feet (e.g. 40ft Flame Strike, 20ft sphere)
  angleDegrees: number; // 0 = East, 90 = South, 180 = West, 270 = North
  color: string;
  borderColor: string;
  saveType?: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA';
  saveDc?: number;
  damageDice?: string;
  damageType?: string;
  description?: string;
  isLocked?: boolean;
  terrainEffect?: TerrainType; // Dynamic terrain transmutation (e.g. 'hazard', 'ice', 'web', 'difficult', 'water', 'open')
  terrainDurationRounds?: number; // Duration in rounds or 0 for permanent
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
  distance3dFeet?: number;
  elevationDiffFeet?: number;
  weatherObscured?: boolean;
  weatherDisadvantage?: boolean;
  weatherRuleText?: string;
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
 * Calculates Line of Sight and Cover between two grid cells using ray traversal in 3D.
 * Factors in vertical altitude: steep high-ground firing angles can bypass or reduce low ground cover.
 * Factors in atmospheric weather conditions: severe storms/sandstorms/blizzards obscure vision beyond max visibility range.
 */
export function calculateLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  feetPerSquare = 5,
  rule: DiagonalRule = 'standard5e',
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>,
  z1 = 0,
  z2 = 0,
  weatherEffect?: WeatherEffectType
): LineOfSightResult {
  const distanceFeet = calculateGridDistanceFeet(x1, y1, x2, y2, feetPerSquare, rule);
  const elevationDiffFeet = Math.abs((z1 || 0) - (z2 || 0));
  const distance3dFeet = calculateGridDistance3D(x1, y1, z1, x2, y2, z2, feetPerSquare, rule);

  const isPoint1Sheltered = terrainMap?.[`${Math.round(x1)},${Math.round(y1)}`] === 'sheltered';
  const isPoint2Sheltered = terrainMap?.[`${Math.round(x2)},${Math.round(y2)}`] === 'sheltered';
  const bothPointsSheltered = isPoint1Sheltered && isPoint2Sheltered;

  const weatherDef = (weatherEffect && weatherEffect !== 'none' && !bothPointsSheltered) ? WEATHER_DEFINITIONS[weatherEffect] : undefined;

  // Check if distance exceeds weather visibility cap (e.g. 30ft in blizzard/sandstorm, 35ft in mist, 60ft in storm)
  if (weatherDef?.maxVisibilityFeet && distance3dFeet > weatherDef.maxVisibilityFeet) {
    return {
      hasLoS: false,
      cover: 'total',
      bonusAc: 99,
      blockedBy: {
        x: x2,
        y: y2,
        label: `${weatherDef.name} Heavy Obscurement (Max ${weatherDef.maxVisibilityFeet} ft)`
      },
      distanceFeet,
      distance3dFeet,
      elevationDiffFeet,
      weatherObscured: true,
      weatherDisadvantage: weatherDef.disadvantageRangedAttacks,
      weatherRuleText: `${weatherDef.name}: Sight blocked beyond ${weatherDef.maxVisibilityFeet} ft (Heavy Obscurement)`
    };
  }

  if (x1 === x2 && y1 === y2) {
    return {
      hasLoS: true,
      cover: 'none',
      bonusAc: 0,
      distanceFeet: 0,
      distance3dFeet: elevationDiffFeet,
      elevationDiffFeet,
      weatherObscured: false,
      weatherDisadvantage: weatherDef?.disadvantageRangedAttacks,
      weatherRuleText: weatherDef?.disadvantageRangedAttacks ? `${weatherDef.name}: Disadvantage on ranged attacks` : undefined
    };
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
        distanceFeet,
        distance3dFeet,
        elevationDiffFeet,
        weatherObscured: false,
        weatherDisadvantage: weatherDef?.disadvantageRangedAttacks,
        weatherRuleText: weatherDef?.disadvantageRangedAttacks ? `${weatherDef.name}: Disadvantage on ranged attacks` : undefined
      };
    }

    // Check partial cover
    // Tactical vertical angle: If attacker has significant elevation advantage (e.g. z1 > z2 and steep decline),
    // low ground waist-high cover (cover_half) is bypassed by looking directly down over it!
    const isSteepDownwardAngle = z1 > z2 && elevationDiffFeet >= distanceFeet;
    if (terrain === 'cover_three_quarters') {
      maxCover = isSteepDownwardAngle ? 'half' : 'three_quarters';
    } else if (terrain === 'cover_half' && maxCover === 'none') {
      if (!isSteepDownwardAngle) {
        maxCover = 'half';
      }
    }
  }

  const bonusAc = maxCover === 'three_quarters' ? 5 : maxCover === 'half' ? 2 : 0;
  return {
    hasLoS: true,
    cover: maxCover,
    bonusAc,
    blockedBy,
    distanceFeet,
    distance3dFeet,
    elevationDiffFeet,
    weatherObscured: false,
    weatherDisadvantage: weatherDef?.disadvantageRangedAttacks,
    weatherRuleText: weatherDef?.disadvantageRangedAttacks ? `${weatherDef.name}: Disadvantage on ranged attacks` : undefined
  };
}

/**
 * Calculates dynamic vision cells revealed by a token, taking into account walls, doors, and weather visibility caps.
 */
export function calculateVisibleCells(
  originX: number,
  originY: number,
  radiusSquares: number,
  terrainMap?: Record<string, TerrainType>,
  doors?: Record<string, DoorState>,
  maxCols = 24,
  maxRows = 16,
  weatherEffect?: WeatherEffectType,
  feetPerSquare = 5
): Set<string> {
  const visible = new Set<string>();
  visible.add(`${originX},${originY}`);

  const isOriginSheltered = terrainMap?.[`${originX},${originY}`] === 'sheltered';
  let effectiveRadiusSquares = radiusSquares;
  if (weatherEffect && weatherEffect !== 'none' && !isOriginSheltered) {
    const weatherDef = WEATHER_DEFINITIONS[weatherEffect];
    if (weatherDef?.maxVisibilityFeet) {
      const weatherLimitSquares = Math.max(1, Math.floor(weatherDef.maxVisibilityFeet / feetPerSquare));
      effectiveRadiusSquares = Math.min(radiusSquares, weatherLimitSquares);
    }
  }

  const minX = Math.max(0, originX - effectiveRadiusSquares);
  const maxX = Math.min(maxCols - 1, originX + effectiveRadiusSquares);
  const minY = Math.max(0, originY - effectiveRadiusSquares);
  const maxY = Math.min(maxRows - 1, originY + effectiveRadiusSquares);

  // Cast ray to all boundary cells in bounding box
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (x === originX && y === originY) continue;

      const dist = Math.hypot(x - originX, y - originY);
      if (dist > effectiveRadiusSquares + 0.5) continue;

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
 * Determines whether a cell is sheltered from outdoor weather (roofed indoor area or entirely indoor map).
 */
export function isCellSheltered(
  x: number,
  y: number,
  terrainMap?: Record<string, TerrainType>,
  isEntirelyIndoors?: boolean
): boolean {
  if (isEntirelyIndoors) return true;
  if (!terrainMap) return false;
  return terrainMap[`${Math.round(x)},${Math.round(y)}`] === 'sheltered';
}

/**
 * Gets the ceiling height clearance in feet for a specific tile.
 * Priority:
 * 1. Tile-specific override in config.ceilingOverrides["x,y"]
 * 2. Map-level config.shelteredCeilingFeet (default 10) if sheltered or map is entirely indoors
 * 3. 300 ft (open sky) if unsheltered outdoors
 */
export function getTileCeilingFeet(
  x: number,
  y: number,
  config?: BattlemapConfig,
  terrainMap?: Record<string, TerrainType>
): number {
  const key = `${Math.round(x)},${Math.round(y)}`;
  if (config?.ceilingOverrides?.[key] !== undefined) {
    return config.ceilingOverrides[key];
  }
  const isSheltered = isCellSheltered(x, y, terrainMap, config?.isEntirelyIndoors);
  if (isSheltered) {
    return config?.shelteredCeilingFeet ?? 10;
  }
  return 300; // Open sky
}

/**
 * Calculates the maximum allowed altitude/elevation in feet for a creature at a given location.
 * In 5e RAW, indoor flight is constrained by ceiling height and creature vertical space (PHB p. 191).
 * For example, a 10 ft ceiling permits a Medium creature (5 ft space) to rise at most 5 ft off the ground.
 */
export function getMaxAllowedElevation(
  isSheltered: boolean,
  ceilingFeet = 10,
  tokenSize = 1
): number {
  if (!isSheltered) return 300; // Open sky outdoors
  const creatureHeight = Math.max(5, (tokenSize || 1) * 5);
  return Math.max(0, ceilingFeet - creatureHeight);
}

/**
 * Checks whether a token intersects an active AoE template in 3D space
 */
export function isTokenInsideAoE(
  tokenX: number,
  tokenY: number,
  tokenSizeSquares: number,
  aoe: AoETemplate,
  feetPerSquare = 5,
  tokenElevationFeet = 0
): boolean {
  const tokenZ = tokenElevationFeet || 0;
  const aoeZ = aoe.elevationFeet || 0;
  const deltaZ = Math.abs(tokenZ - aoeZ);

  // Vertical boundary check for 3D AoE shapes
  if (aoe.shape === 'circle') {
    // 3D Sphere (e.g. Fireball)
    const tokenCenterX = tokenX + tokenSizeSquares / 2;
    const tokenCenterY = tokenY + tokenSizeSquares / 2;
    const tokenRadiusFeet = (tokenSizeSquares / 2) * feetPerSquare;

    const dx = (tokenCenterX - (aoe.originX + 0.5)) * feetPerSquare;
    const dy = (tokenCenterY - (aoe.originY + 0.5)) * feetPerSquare;
    const dist3D = Math.hypot(dx, dy, deltaZ);
    return dist3D <= aoe.radiusFeet + tokenRadiusFeet;
  }

  // Cylindrical / Cube / Column AoE: verify vertical thickness
  const aoeHeight = aoe.heightFeet || (aoe.shape === 'cube' ? (aoe.radiusFeet || aoe.lengthFeet || 20) : 40);
  if (deltaZ > aoeHeight) {
    return false;
  }

  // Token center coordinates
  const tokenCenterX = tokenX + tokenSizeSquares / 2;
  const tokenCenterY = tokenY + tokenSizeSquares / 2;
  const tokenRadiusFeet = (tokenSizeSquares / 2) * feetPerSquare;

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

/**
 * Calculates all grid cells (x, y) covered by an AoE template.
 * Used for dynamic battlefield modification (e.g. burning into hazard, freezing into ice, casting webs/grease).
 */
export function getAoECoveredCells(
  aoe: AoETemplate,
  gridColumns: number,
  gridRows: number,
  feetPerSquare = 5
): Array<{ x: number; y: number }> {
  const covered: Array<{ x: number; y: number }> = [];

  // Determine conservative bounding box
  let minCol = 0;
  let maxCol = gridColumns - 1;
  let minRow = 0;
  let maxRow = gridRows - 1;

  const maxRadiusSquares = Math.ceil(
    Math.max(aoe.radiusFeet || 0, aoe.lengthFeet || 0, aoe.widthFeet || 0, 20) / feetPerSquare
  ) + 1;

  minCol = Math.max(0, Math.floor(aoe.originX - maxRadiusSquares));
  maxCol = Math.min(gridColumns - 1, Math.ceil(aoe.originX + maxRadiusSquares));
  minRow = Math.max(0, Math.floor(aoe.originY - maxRadiusSquares));
  maxRow = Math.min(gridRows - 1, Math.ceil(aoe.originY + maxRadiusSquares));

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      // Check if a 1x1 token at (c, r) with 0 elevation is inside the AoE
      if (isTokenInsideAoE(c, r, 1, aoe, feetPerSquare, aoe.elevationFeet || 0)) {
        covered.push({ x: c, y: r });
      }
    }
  }

  return covered;
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
  weatherEffect?: WeatherEffectType;
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

