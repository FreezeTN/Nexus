import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Settings2,
  RotateCcw,
  Footprints,
  Zap,
  Check,
  X,
  Move,
  Plane,
  Ruler,
  Compass,
  CornerDownRight,
  Shield,
  Layers,
  ChevronDown,
  Sparkles,
  Users,
  Trash2,
  Target,
  Crosshair,
  Plus,
  Armchair,
  FolderOpen,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { openDetachedWindow } from '../../utils/useDetachedSync';
import { Combatant } from '../combat/encounter/encounterTypes';
import { CharacterData, Spell } from '../../types';
import {
  BattlemapConfig,
  BattlemapTheme,
  DEFAULT_BATTLEMAP_CONFIG,
  BATTLEMAP_THEMES,
  DiagonalRule,
  calculateGridDistanceFeet,
  calculatePathDistanceFeet,
  calculateDirectMoveCostFeet,
  TerrainType,
  DoorState,
  TERRAIN_DEFINITIONS,
  isCellImpassable,
  AoETemplate,
  SpellAoEPreset,
  SPELL_AOE_PRESETS,
  calculateLineOfSight,
  calculateVisibleCells,
  isTokenInsideAoE,
  BattlemapLayout,
  ActiveTeleportState,
  ActiveSpellTargetingState
} from './battlemapTypes';
import { TerrainPalette, TerrainDrawTool } from './TerrainPalette';
import { AoEControlPalette } from './AoEControlPalette';
import { AoETemplateLayer } from './AoETemplateLayer';
import { FogOfWarPalette } from './FogOfWarPalette';
import { FogOfWarLayer, isCombatantVisibleInFog } from './FogOfWarLayer';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../data/monsterPortraits';
import { ResetBattlemapModal } from './ResetBattlemapModal';
import { CombatantsDock } from './CombatantsDock';
import { BattlemapLayoutsModal } from './BattlemapLayoutsModal';
import { TeleportControlPalette } from './TeleportControlPalette';
import { SpellTargetingPalette, parseSpellToTargeting } from './SpellTargetingPalette';

export interface BattlemapCanvasProps {
  combatants: Combatant[];
  activeTurnIndex: number;
  currentUserId?: string;
  isDm: boolean;
  character?: CharacterData;
  allCharacters?: CharacterData[];
  onUpdateCombatantPosition?: (combatantId: string, x: number, y: number) => void;
  onMoveCombatant?: (
    combatantId: string,
    x: number,
    y: number,
    distanceFeet: number,
    waypoints?: Array<{ x: number; y: number }>,
    options?: { isTeleport?: boolean; isDmFreeMove?: boolean; abilityName?: string }
  ) => void;
  onDashCombatant?: (combatantId: string) => void;
  onResetMovement?: (combatantId: string) => void;
  onUpdateSpeed?: (combatantId: string, speed: number) => void;
  onSelectCombatant?: (combatantId: string | null) => void;
  selectedCombatantId?: string | null;
  targetCombatantId?: string | null;
  onSetTargetCombatant?: (combatantId: string | null) => void;
  onRemoveCombatant?: (combatantId: string) => void;
  onRemoveCombatantFromMap?: (combatantId: string) => void;
  onResetBattlemap?: (options: {
    clearTerrain?: boolean;
    clearDoors?: boolean;
    resetFog?: 'shroud' | 'reveal' | 'none';
    resetTokens?: 'spawn_points' | 'recall_all' | 'none';
    clearAoE?: boolean;
    gridColumns?: number;
    gridRows?: number;
  }) => void;
  onResetMapTokens?: (mode: 'spawn_points' | 'recall_all') => void;
  onOpenAddCombatantModal?: (type?: 'ally' | 'enemy') => void;
  onLoadLayout?: (layout: BattlemapLayout, options: {
    includeTokens: boolean;
    includeFog: boolean;
    replaceTerrain: boolean;
  }) => void;
  config?: BattlemapConfig;
  onUpdateConfig?: (config: BattlemapConfig) => void;
  terrainMap?: Record<string, TerrainType>;
  doors?: Record<string, DoorState>;
  onUpdateTerrain?: (terrain: Record<string, TerrainType>) => void;
  onToggleDoor?: (x: number, y: number) => void;
  onClearAllTerrain?: () => void;
  fogOfWar?: Record<string, boolean>;
  useFogOfWar?: boolean;
  onUpdateFogOfWar?: (fog: Record<string, boolean>, useFog?: boolean) => void;
  activeAoE?: AoETemplate | null;
  onUpdateAoE?: (aoe: AoETemplate | null) => void;
  onRollSavesForTargets?: (saveType: string, dc: number, targets: Combatant[]) => void;
  onApplyDamageToTargets?: (damageDice: string, damageType: string, targets: Combatant[]) => void;
  onMountCombatant?: (riderId: string, mountId: string) => void;
  onDismountCombatant?: (riderId: string, customDest?: { x: number; y: number }) => void;
  onToggleMountRole?: (combatantId: string) => void;
  isStandalone?: boolean;
  heightClass?: string;
  onPopoutBattlemap?: () => void;
}

const CELL_SIZE_PX = 48; // Base pixels per grid cell

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  combatants,
  activeTurnIndex,
  currentUserId,
  isDm,
  character,
  allCharacters = [],
  onUpdateCombatantPosition,
  onMoveCombatant,
  onDashCombatant,
  onResetMovement,
  onUpdateSpeed: _onUpdateSpeed,
  onSelectCombatant,
  selectedCombatantId,
  targetCombatantId,
  onSetTargetCombatant,
  onRemoveCombatant,
  onRemoveCombatantFromMap,
  onResetBattlemap,
  onResetMapTokens,
  onOpenAddCombatantModal,
  onLoadLayout,
  config = DEFAULT_BATTLEMAP_CONFIG,
  onUpdateConfig,
  terrainMap = {},
  doors = {},
  onUpdateTerrain,
  onToggleDoor,
  onClearAllTerrain,
  fogOfWar,
  useFogOfWar,
  onUpdateFogOfWar,
  activeAoE,
  onUpdateAoE,
  onRollSavesForTargets,
  onApplyDamageToTargets,
  onMountCombatant,
  onDismountCombatant,
  onToggleMountRole,
  isStandalone = false,
  heightClass,
  onPopoutBattlemap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const zoomRef = useRef<number>(zoom);
  zoomRef.current = zoom;
  const panRef = useRef<{ x: number; y: number }>(pan);
  panRef.current = pan;

  // Drag-and-drop state
  const [draggedCombatantId, setDraggedCombatantId] = useState<string | null>(null);
  const [dragHoverCell, setDragHoverCell] = useState<{ x: number; y: number } | null>(null);

  // Hover & selection state
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCombatantId, setHoveredCombatantId] = useState<string | null>(null);

  // Phase 2: Movement Waypoint Planning Mode
  const [isMovePlanning, setIsMovePlanning] = useState<boolean>(false);
  const [moveWaypoints, setMoveWaypoints] = useState<Array<{ x: number; y: number }>>([]);

  // Phase 3: Terrain Editor State
  const [isTerrainEditorOpen, setIsTerrainEditorOpen] = useState<boolean>(false);
  const [activeTerrainTool, setActiveTerrainTool] = useState<TerrainDrawTool>('brush');
  const [activeTerrainBrush, setActiveTerrainBrush] = useState<TerrainType>('wall');
  const [boxStartCell, setBoxStartCell] = useState<{ x: number; y: number } | null>(null);
  const [isPaintingTerrain, setIsPaintingTerrain] = useState<boolean>(false);

  // Phase 4: AoE, Fog of War, Dynamic Vision & Ruler State
  const [isAoEEditorOpen, setIsAoEEditorOpen] = useState<boolean>(false);
  const [isFogEditorOpen, setIsFogEditorOpen] = useState<boolean>(false);
  const [fogViewMode, setFogViewMode] = useState<'dm' | 'player'>(isDm ? 'dm' : 'player');
  const [activeFogTool, setActiveFogTool] = useState<'reveal_brush' | 'shroud_brush' | 'reveal_box' | 'shroud_box'>('reveal_brush');
  const [fogBoxStartCell, setFogBoxStartCell] = useState<{ x: number; y: number } | null>(null);
  const [isPaintingFog, setIsPaintingFog] = useState<boolean>(false);

  // Local state fallbacks if not passed as controlled props
  const [localFogOfWar, setLocalFogOfWar] = useState<Record<string, boolean>>(fogOfWar || {});
  const [localUseFogOfWar, setLocalUseFogOfWar] = useState<boolean>(useFogOfWar || false);
  const [localActiveAoE, setLocalActiveAoE] = useState<AoETemplate | null>(activeAoE || null);

  // Ruler state
  const [isRulerActive, setIsRulerActive] = useState<boolean>(false);
  const [rulerOrigin, setRulerOrigin] = useState<{ x: number; y: number } | null>(null);

  // Tokens Dock & Reset Management states
  const [isTokensDockOpen, setIsTokensDockOpen] = useState<boolean>(true);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showLayoutsModal, setShowLayoutsModal] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ combatant: Combatant; x: number; y: number } | null>(null);

  const handleApplyLayoutInternal = useCallback((layout: BattlemapLayout, options: {
    includeTokens: boolean;
    includeFog: boolean;
    replaceTerrain: boolean;
  }) => {
    if (onLoadLayout) {
      onLoadLayout(layout, options);
    } else {
      if (onUpdateConfig) {
        onUpdateConfig(layout.config);
      }
      if (options.replaceTerrain) {
        onUpdateTerrain?.(layout.terrainMap || {});
      } else {
        onUpdateTerrain?.({ ...terrainMap, ...(layout.terrainMap || {}) });
      }
      if (options.includeFog && onUpdateFogOfWar) {
        onUpdateFogOfWar(layout.fogOfWar || {}, layout.useFogOfWar);
      }
      if (layout.activeAoE !== undefined && onUpdateAoE) {
        onUpdateAoE(layout.activeAoE);
      }
    }
  }, [onLoadLayout, onUpdateConfig, onUpdateTerrain, terrainMap, onUpdateFogOfWar, onUpdateAoE]);

  useEffect(() => {
    if (fogOfWar !== undefined) setLocalFogOfWar(fogOfWar);
  }, [fogOfWar]);

  useEffect(() => {
    if (useFogOfWar !== undefined) setLocalUseFogOfWar(useFogOfWar);
  }, [useFogOfWar]);

  useEffect(() => {
    if (activeAoE !== undefined) setLocalActiveAoE(activeAoE);
  }, [activeAoE]);

  const currentAoETemplate = activeAoE !== undefined ? activeAoE : localActiveAoE;
  const currentFogOfWar = fogOfWar !== undefined ? fogOfWar : localFogOfWar;
  const currentUseFogOfWar = useFogOfWar !== undefined ? useFogOfWar : localUseFogOfWar;

  // UI Modals
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [editingSpeedId, setEditingSpeedId] = useState<string | null>(null);
  const [speedInputValue, setSpeedInputValue] = useState<number>(30);

  // DM Free Movement state (defaults to true for DMs)
  const [dmFreeMoveEnabled, setDmFreeMoveEnabled] = useState<boolean>(true);

  // Transient movement and tactical notifications
  const [movementNotice, setMovementNotice] = useState<{
    type: 'info' | 'error' | 'success' | 'warning';
    message: string;
  } | null>(null);

  // Teleportation State & Palette
  const [isTeleportModeOpen, setIsTeleportModeOpen] = useState<boolean>(false);
  const [activeTeleportState, setActiveTeleportState] = useState<ActiveTeleportState | null>(null);

  // Spell Targeting State & Palette
  const [isSpellTargetingOpen, setIsSpellTargetingOpen] = useState<boolean>(false);
  const [activeSpellTargetingState, setActiveSpellTargetingState] = useState<ActiveSpellTargetingState | null>(null);
  const [spellTargetOrigin, setSpellTargetOrigin] = useState<{ x: number; y: number } | null>(null);

  // Unified terrain keys for rendering (merges terrainMap and doors)
  const allTerrainKeys = useMemo(() => {
    return Array.from(new Set([...Object.keys(terrainMap || {}), ...Object.keys(doors || {})]));
  }, [terrainMap, doors]);

  // Root wrapper ref to isolate wheel events and avoid parent scrolling
  const outerWrapperRef = useRef<HTMLDivElement | null>(null);

  const themeConfig = BATTLEMAP_THEMES[config.theme] || BATTLEMAP_THEMES.dungeon;

  // Active combatant in the turn tracker
  const activeCombatant = combatants[activeTurnIndex];

  // Placed vs Unplaced combatants
  const placedCombatants = useMemo(() => {
    return combatants.filter((c) => c.isOnMap !== false);
  }, [combatants]);

  const unplacedCombatants = useMemo(() => {
    return combatants.filter((c) => c.isOnMap === false);
  }, [combatants]);

  // Resolve default grid positions for combatants that are on the map
  const positionedCombatants = useMemo(() => {
    let allyIndex = 0;
    let enemyIndex = 0;

    return combatants
      .filter((c) => c.isOnMap !== false)
      .map((c) => {
        let x = c.mapX;
        let y = c.mapY;

        const isMounted = Boolean(c.mountedOnId);
        const mount = isMounted ? combatants.find((m) => m.id === c.mountedOnId) : null;

        // If rider is mounted on a placed mount, sync coordinate to mount
        if (mount && typeof mount.mapX === 'number' && typeof mount.mapY === 'number') {
          x = mount.mapX;
          y = mount.mapY;
        }

        if (typeof x !== 'number' || typeof y !== 'number') {
          const isEnemy = c.type === 'enemy';
          if (isEnemy) {
            x = config.gridColumns - 3 - (enemyIndex % 4);
            y = 2 + Math.floor(enemyIndex / 4) * 2;
            enemyIndex++;
          } else {
            x = 2 + (allyIndex % 4);
            y = 2 + Math.floor(allyIndex / 4) * 2;
            allyIndex++;
          }
        }

        // Clamp into grid boundaries
        x = Math.max(0, Math.min(config.gridColumns - 1, x));
        y = Math.max(0, Math.min(config.gridRows - 1, y));

        const size = c.tokenSize || 1; // 1 = 1x1, 2 = 2x2, etc.

        // Speed & Movement Inheritance:
        // A mounted combatant uses the mount's speed and remaining movement
        const effectiveMover = mount || c;
        const baseSpeed = effectiveMover.speed || (mount ? 60 : 30);
        const remainingSpeed = typeof effectiveMover.movementRemaining === 'number'
          ? effectiveMover.movementRemaining
          : baseSpeed;
        const effectiveElevation = mount?.elevationFeet ?? c.elevationFeet;

        return {
          ...c,
          calculatedX: x,
          calculatedY: y,
          calculatedSize: size,
          calculatedBaseSpeed: baseSpeed,
          calculatedRemainingSpeed: remainingSpeed,
          elevationFeet: effectiveElevation,
          mountEntity: mount
        };
      });
  }, [combatants, config.gridColumns, config.gridRows]);

  // Current focal mover: selected combatant or active combatant
  const activeMover = useMemo(() => {
    if (selectedCombatantId) {
      return positionedCombatants.find((c) => c.id === selectedCombatantId) || null;
    }
    if (activeCombatant) {
      return positionedCombatants.find((c) => c.id === activeCombatant.id) || null;
    }
    return null;
  }, [selectedCombatantId, activeCombatant, positionedCombatants]);

  const canControlActiveMover = useMemo(() => {
    if (!activeMover) return false;
    return isDm || activeMover.controlledBy === currentUserId || activeMover.isPlayerChar;
  }, [activeMover, isDm, currentUserId]);

  // Associated CharacterData for the active mover / selected token
  const selectedCharacterData = useMemo<CharacterData | null>(() => {
    if (!activeMover) return character || null;

    if (
      activeMover.isPlayerChar ||
      activeMover.id === character?.id ||
      activeMover.name.toLowerCase() === character?.name?.toLowerCase()
    ) {
      return character || null;
    }

    if (allCharacters && allCharacters.length > 0) {
      const cleanMoverId = activeMover.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '').replace(/-\d+$/, '');
      const cleanMoverName = activeMover.name.toLowerCase().replace(/\s+#\d+$/, '');
      const found = allCharacters.find((ch) => {
        const cleanChId = ch.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '');
        return (
          ch.id === activeMover.id ||
          cleanChId === cleanMoverId ||
          ch.name.toLowerCase() === cleanMoverName ||
          ch.name.toLowerCase() === activeMover.name.toLowerCase()
        );
      });
      if (found) return found;
    }

    return character || null;
  }, [activeMover, character, allCharacters]);

  // Calculate Reachable Grid Tiles for the active mover
  const reachableZones = useMemo(() => {
    if (!config.showReachableGrid || !activeMover || !canControlActiveMover) {
      return { directTiles: [], dashTiles: [] };
    }

    const { calculatedX: originX, calculatedY: originY, calculatedRemainingSpeed, calculatedBaseSpeed, hasDashed } = activeMover;
    const dashBudget = calculatedRemainingSpeed + (hasDashed ? 0 : calculatedBaseSpeed);

    // Max search radius in squares
    const maxSquares = Math.ceil(dashBudget / config.feetPerSquare) + 1;
    const minCol = Math.max(0, originX - maxSquares);
    const maxCol = Math.min(config.gridColumns - 1, originX + maxSquares);
    const minRow = Math.max(0, originY - maxSquares);
    const maxRow = Math.min(config.gridRows - 1, originY + maxSquares);

    const directTiles: Array<{ x: number; y: number; distance: number }> = [];
    const dashTiles: Array<{ x: number; y: number; distance: number }> = [];

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (c === originX && r === originY) continue; // Skip origin square
        // Check if destination is impassable
        if (isCellImpassable(c, r, terrainMap, doors)) continue;

        let dist = calculateGridDistanceFeet(originX, originY, c, r, config.feetPerSquare, config.diagonalRule);
        const cellTerrain = terrainMap[`${c},${r}`];
        if (cellTerrain === 'difficult' || cellTerrain === 'hazard' || cellTerrain === 'water') {
          // Double movement cost for difficult terrain
          dist *= 2;
        }

        if (dist <= calculatedRemainingSpeed) {
          directTiles.push({ x: c, y: r, distance: dist });
        } else if (dist <= dashBudget) {
          dashTiles.push({ x: c, y: r, distance: dist });
        }
      }
    }

    return { directTiles, dashTiles };
  }, [
    config.showReachableGrid,
    config.feetPerSquare,
    config.diagonalRule,
    config.gridColumns,
    config.gridRows,
    activeMover,
    canControlActiveMover,
    terrainMap,
    doors
  ]);

  // Active Waypoint Path preview calculation
  const activePathWaypoints = useMemo(() => {
    if (!activeMover) return [];
    const startPoint = { x: activeMover.calculatedX, y: activeMover.calculatedY };
    if (moveWaypoints.length === 0) {
      if (isMovePlanning && hoverCell) {
        return [startPoint, hoverCell];
      }
      return [startPoint];
    }
    if (isMovePlanning && hoverCell) {
      // Append hoverCell if different from the last waypoint
      const last = moveWaypoints[moveWaypoints.length - 1];
      if (last.x !== hoverCell.x || last.y !== hoverCell.y) {
        return [startPoint, ...moveWaypoints, hoverCell];
      }
    }
    return [startPoint, ...moveWaypoints];
  }, [activeMover, moveWaypoints, isMovePlanning, hoverCell]);

  const activePathDistance = useMemo(() => {
    return calculatePathDistanceFeet(
      activePathWaypoints,
      config.feetPerSquare,
      config.diagonalRule,
      terrainMap,
      doors
    );
  }, [activePathWaypoints, config.feetPerSquare, config.diagonalRule, terrainMap, doors]);

  // Phase 3: Terrain statistics count
  const terrainCounts = useMemo(() => {
    let walls = 0;
    let doorsCount = 0;
    let difficult = 0;
    let cover = 0;
    let hazards = 0;

    Object.entries(terrainMap).forEach(([_, type]) => {
      if (type === 'wall') walls++;
      else if (type === 'door') doorsCount++;
      else if (type === 'difficult' || type === 'water') difficult++;
      else if (type === 'cover_half' || type === 'cover_three_quarters') cover++;
      else if (type === 'hazard' || type === 'chasm') hazards++;
    });

    return { walls, doors: doorsCount, difficult, cover, hazards };
  }, [terrainMap]);

  // Phase 3: Paint cell helper
  const paintCell = useCallback(
    (x: number, y: number, terrain: TerrainType) => {
      const key = `${x},${y}`;
      const nextTerrain = { ...terrainMap };
      if (terrain === 'open') {
        delete nextTerrain[key];
        onUpdateTerrain?.(nextTerrain);
      } else {
        nextTerrain[key] = terrain;
        onUpdateTerrain?.(nextTerrain);
      }
    },
    [terrainMap, onUpdateTerrain]
  );

  // Phase 3: Dungeon template applicator
  const handleApplyTemplate = (template: 'room' | 'pillars' | 'chasm_bridge') => {
    const updated = { ...terrainMap };

    if (template === 'room') {
      const minX = Math.max(1, Math.floor(config.gridColumns / 2) - 7);
      const maxX = Math.min(config.gridColumns - 2, minX + 13);
      const minY = Math.max(1, Math.floor(config.gridRows / 2) - 5);
      const maxY = Math.min(config.gridRows - 2, minY + 9);
      const doorX = Math.floor((minX + maxX) / 2);

      // Draw perimeter walls
      for (let x = minX; x <= maxX; x++) {
        updated[`${x},${minY}`] = 'wall';
        if (x !== doorX) {
          updated[`${x},${maxY}`] = 'wall';
        } else {
          updated[`${x},${maxY}`] = 'door';
        }
      }

      for (let y = minY; y <= maxY; y++) {
        updated[`${minX},${y}`] = 'wall';
        updated[`${maxX},${y}`] = 'wall';
      }

      // Add crates for half cover
      updated[`${minX + 3},${minY + 3}`] = 'cover_half';
      updated[`${maxX - 3},${minY + 3}`] = 'cover_half';
    } else if (template === 'pillars') {
      const midX = Math.floor(config.gridColumns / 2);
      const midY = Math.floor(config.gridRows / 2);
      const offsets = [
        { dx: -4, dy: -3 },
        { dx: 4, dy: -3 },
        { dx: -4, dy: 3 },
        { dx: 4, dy: 3 }
      ];
      offsets.forEach(({ dx, dy }) => {
        const px = midX + dx;
        const py = midY + dy;
        if (px >= 0 && px < config.gridColumns && py >= 0 && py < config.gridRows) {
          updated[`${px},${py}`] = 'cover_three_quarters';
          if (px + 1 < config.gridColumns) updated[`${px + 1},${py}`] = 'difficult';
        }
      });
    } else if (template === 'chasm_bridge') {
      const chasmCol = Math.floor(config.gridColumns / 2);
      const bridgeRow = Math.floor(config.gridRows / 2);

      for (let y = 0; y < config.gridRows; y++) {
        if (y === bridgeRow || y === bridgeRow + 1) {
          updated[`${chasmCol},${y}`] = 'difficult';
        } else {
          updated[`${chasmCol},${y}`] = 'chasm';
        }
      }
    }

    onUpdateTerrain?.(updated);
  };

  const handleClearAllTerrainInternal = () => {
    if (onClearAllTerrain) {
      onClearAllTerrain();
    } else {
      onUpdateTerrain?.({});
    }
  };

  // Phase 4: AoE caught combatants
  const aoeCaughtCombatants = useMemo(() => {
    if (!currentAoETemplate) return [];
    return positionedCombatants.filter((c) =>
      isTokenInsideAoE(
        c.calculatedX,
        c.calculatedY,
        c.calculatedSize,
        currentAoETemplate,
        config.feetPerSquare
      )
    );
  }, [currentAoETemplate, positionedCombatants, config.feetPerSquare]);

  // Phase 4: Ruler Line of Sight & Cover calculation
  const rulerLoS = useMemo(() => {
    if (!isRulerActive || !rulerOrigin || !hoverCell) return null;
    return calculateLineOfSight(
      rulerOrigin.x,
      rulerOrigin.y,
      hoverCell.x,
      hoverCell.y,
      config.feetPerSquare,
      config.diagonalRule,
      terrainMap,
      doors
    );
  }, [isRulerActive, rulerOrigin, hoverCell, terrainMap, doors, config.feetPerSquare, config.diagonalRule]);

  // Phase 4: Fog of War count
  const revealedCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < config.gridRows; r++) {
      for (let c = 0; c < config.gridColumns; c++) {
        if (currentFogOfWar[`${c},${r}`]) count++;
      }
    }
    return count;
  }, [currentFogOfWar, config.gridRows, config.gridColumns]);

  // Phase 4: Fog of war manipulators
  const handleSetFogTile = useCallback(
    (x: number, y: number, isRevealed: boolean) => {
      const key = `${x},${y}`;
      const nextFog = { ...currentFogOfWar, [key]: isRevealed };
      setLocalFogOfWar(nextFog);
      onUpdateFogOfWar?.(nextFog, currentUseFogOfWar);
    },
    [currentFogOfWar, currentUseFogOfWar, onUpdateFogOfWar]
  );

  const handleRevealAllFog = useCallback(() => {
    const allRevealed: Record<string, boolean> = {};
    for (let r = 0; r < config.gridRows; r++) {
      for (let c = 0; c < config.gridColumns; c++) {
        allRevealed[`${c},${r}`] = true;
      }
    }
    setLocalFogOfWar(allRevealed);
    setLocalUseFogOfWar(false);
    onUpdateFogOfWar?.(allRevealed, false);
  }, [config.gridRows, config.gridColumns, onUpdateFogOfWar]);

  const handleShroudAllFog = useCallback(() => {
    setLocalFogOfWar({});
    setLocalUseFogOfWar(true);
    onUpdateFogOfWar?.({}, true);
  }, [onUpdateFogOfWar]);

  const handleToggleUseFog = useCallback(
    (enabled: boolean) => {
      setLocalUseFogOfWar(enabled);
      onUpdateFogOfWar?.(currentFogOfWar, enabled);
    },
    [currentFogOfWar, onUpdateFogOfWar]
  );

  const handleAutoRevealPartyVision = useCallback(() => {
    const partyTokens = positionedCombatants.filter(
      (c) => (c.type === 'player' || c.type === 'ally') && (c.hpCurrent > 0 || !c.isDefeated)
    );

    const newFog = { ...currentFogOfWar };
    const radiusSquares = Math.round((config.defaultVisionFeet || 60) / config.feetPerSquare);

    partyTokens.forEach((pt) => {
      const revealed = calculateVisibleCells(
        pt.calculatedX,
        pt.calculatedY,
        radiusSquares,
        terrainMap,
        doors,
        config.gridColumns,
        config.gridRows
      );
      revealed.forEach((key) => {
        newFog[key] = true;
      });
    });

    setLocalFogOfWar(newFog);
    if (onUpdateFogOfWar) {
      onUpdateFogOfWar(newFog, true);
    }
  }, [positionedCombatants, currentFogOfWar, config, terrainMap, doors, onUpdateFogOfWar]);

  // Phase 4: AoE template manipulators
  const handleUpdateAoEInternal = useCallback(
    (template: AoETemplate | null) => {
      setLocalActiveAoE(template);
      onUpdateAoE?.(template);
    },
    [onUpdateAoE]
  );

  const handleApplyPreset = useCallback(
    (preset: SpellAoEPreset) => {
      const next: AoETemplate = {
        id: `aoe-${Date.now()}`,
        name: preset.name,
        shape: preset.shape,
        originX: hoverCell ? hoverCell.x : Math.floor(config.gridColumns / 2),
        originY: hoverCell ? hoverCell.y : Math.floor(config.gridRows / 2),
        radiusFeet: preset.shape === 'circle' ? preset.sizeFeet : preset.sizeFeet / 2,
        lengthFeet: preset.sizeFeet,
        widthFeet: preset.widthFeet || (preset.shape === 'cube' ? preset.sizeFeet : 5),
        sizeFeet: preset.sizeFeet,
        angleDegrees: 0,
        color: preset.color,
        borderColor: preset.borderColor,
        damageDice: preset.damageDice,
        damageType: preset.damageType,
        saveType: preset.saveType,
        saveDc: 15,
        description: preset.description,
        isLocked: false
      };
      handleUpdateAoEInternal(next);
    },
    [hoverCell, config.gridColumns, config.gridRows, handleUpdateAoEInternal]
  );

  // Drag Path & Movement Cost calculation taking terrain (water, difficult, ice, webs, climbing, doors) into account
  const dragPathCost = useMemo(() => {
    if (!draggedCombatantId || !dragHoverCell) return null;
    const mover = positionedCombatants.find((c) => c.id === draggedCombatantId);
    if (!mover) return null;
    return calculateDirectMoveCostFeet(
      mover.calculatedX,
      mover.calculatedY,
      dragHoverCell.x,
      dragHoverCell.y,
      config.feetPerSquare,
      config.diagonalRule,
      terrainMap,
      doors,
      {
        elevationFeet: mover.elevationFeet,
        hasSwimSpeed: (mover as any).speedSwim ? (mover as any).speedSwim > 0 : false,
        hasClimbSpeed: (mover as any).speedClimb ? (mover as any).speedClimb > 0 : false,
        hasFlySpeed: (mover as any).speedFly ? (mover as any).speedFly > 0 : false
      }
    );
  }, [draggedCombatantId, dragHoverCell, positionedCombatants, config.feetPerSquare, config.diagonalRule, terrainMap, doors]);

  const dragDistance = useMemo(() => {
    if (!dragPathCost) return 0;
    if (isFinite(dragPathCost.totalFeet)) return dragPathCost.totalFeet;
    if (!draggedCombatantId || !dragHoverCell) return 0;
    const mover = positionedCombatants.find((c) => c.id === draggedCombatantId);
    if (!mover) return 0;
    return calculateGridDistanceFeet(
      mover.calculatedX,
      mover.calculatedY,
      dragHoverCell.x,
      dragHoverCell.y,
      config.feetPerSquare,
      config.diagonalRule
    );
  }, [dragPathCost, draggedCombatantId, dragHoverCell, positionedCombatants, config.feetPerSquare, config.diagonalRule]);

  // Native Non-Passive Wheel Listener for Battlemap Zoom
  // React's synthetic onWheel is registered as passive by modern browsers, which ignores e.preventDefault()
  // and allows the parent character sheet modal / window to scroll away while zooming the map.
  // Using a native non-passive listener with e.preventDefault() + e.stopPropagation() isolates the scroll
  // strictly to the battlemap canvas and smoothly zooms centered on the user's mouse position.
  useEffect(() => {
    const container = containerRef.current;
    const outer = outerWrapperRef.current;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if ((e as any).stopImmediatePropagation) {
        (e as any).stopImmediatePropagation();
      }

      const targetContainer = container || outer;
      if (!targetContainer) return;

      const zoomFactor = 1.12;
      const isZoomIn = e.deltaY < 0;
      const prevZoom = zoomRef.current;

      const newZoom = isZoomIn
        ? Math.min(2.5, prevZoom * zoomFactor)
        : Math.max(0.4, prevZoom / zoomFactor);

      if (newZoom !== prevZoom) {
        const rect = targetContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const prevPan = panRef.current;

        const newPanX = mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom);
        const newPanY = mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    };

    if (container) container.addEventListener('wheel', handleNativeWheel, { passive: false });
    if (outer && outer !== container) outer.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      if (container) container.removeEventListener('wheel', handleNativeWheel);
      if (outer && outer !== container) outer.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Spacebar tracking for panning convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Global window listeners while panning so dragging off-canvas never gets stuck
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // If mouse button is no longer held down, immediately stop panning
      if (e.buttons === 0) {
        setIsPanning(false);
        hasDraggedRef.current = false;
        return;
      }
      const dist = Math.hypot(e.clientX - dragStartClientRef.current.x, e.clientY - dragStartClientRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning, panStart]);

  // Global dragend and drop listeners to guarantee map panning never gets stuck after token drag
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsPanning(false);
      setDraggedCombatantId(null);
      setDragHoverCell(null);
      hasDraggedRef.current = false;
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  // Dragging / Panning the map canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If target is inside a token or already dragging a token, do NOT pan the map!
    if (draggedCombatantId || (e.target as HTMLElement)?.closest?.('[data-token-draggable="true"]')) {
      return;
    }
    // If in terrain editing mode and left clicking, painting is handled by cell events
    if (isTerrainEditorOpen && isDm && e.button === 0) {
      return;
    }
    // If in fog editing mode and left clicking, painting is handled by cell events
    if (isFogEditorOpen && isDm && e.button === 0) {
      return;
    }
    // If placing ruler or unlocked AoE template with left click, let click handler place it
    if (e.button === 0 && (isRulerActive || (isAoEEditorOpen && currentAoETemplate && !currentAoETemplate.isLocked))) {
      return;
    }

    // Left click (0), middle click (1), or right click (2) on the map or empty space starts dragging
    if (e.button === 0 || e.button === 1 || e.button === 2 || isSpacePressed) {
      if (e.button === 2) {
        e.preventDefault();
      }
      setIsPanning(true);
      hasDraggedRef.current = false;
      dragStartClientRef.current = { x: e.clientX, y: e.clientY };
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      hasDraggedRef.current = false;
      dragStartClientRef.current = { x: touch.clientX, y: touch.clientY };
      setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - dragStartClientRef.current.x, touch.clientY - dragStartClientRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      // If primary mouse button is no longer pressed, cancel panning immediately
      if (e.buttons === 0 || draggedCombatantId) {
        setIsPanning(false);
        hasDraggedRef.current = false;
        return;
      }
      const dist = Math.hypot(e.clientX - dragStartClientRef.current.x, e.clientY - dragStartClientRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left - pan.x;
    const clientY = e.clientY - rect.top - pan.y;

    const cellX = Math.floor(clientX / (CELL_SIZE_PX * zoom));
    const cellY = Math.floor(clientY / (CELL_SIZE_PX * zoom));

    if (cellX >= 0 && cellX < config.gridColumns && cellY >= 0 && cellY < config.gridRows) {
      setHoverCell({ x: cellX, y: cellY });
      if (draggedCombatantId) {
        setDragHoverCell({ x: cellX, y: cellY });
      }
      if (isTerrainEditorOpen && isDm && isPaintingTerrain && activeTerrainTool !== 'box') {
        paintCell(cellX, cellY, activeTerrainTool === 'eraser' ? 'open' : activeTerrainBrush);
      }
      if (isFogEditorOpen && isDm && isPaintingFog) {
        if (activeFogTool === 'reveal_brush') {
          handleSetFogTile(cellX, cellY, true);
        } else if (activeFogTool === 'shroud_brush') {
          handleSetFogTile(cellX, cellY, false);
        }
      }
    } else {
      setHoverCell(null);
      setDragHoverCell(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);

    if (isTerrainEditorOpen && isDm) {
      if (activeTerrainTool === 'box' && boxStartCell && hoverCell) {
        const minX = Math.min(boxStartCell.x, hoverCell.x);
        const maxX = Math.max(boxStartCell.x, hoverCell.x);
        const minY = Math.min(boxStartCell.y, hoverCell.y);
        const maxY = Math.max(boxStartCell.y, hoverCell.y);

        const updated = { ...terrainMap };
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            const key = `${x},${y}`;
            if (activeTerrainBrush === 'open') {
              delete updated[key];
            } else {
              updated[key] = activeTerrainBrush;
            }
          }
        }
        onUpdateTerrain?.(updated);
        setBoxStartCell(null);
      }
      setIsPaintingTerrain(false);
    }

    if (isFogEditorOpen && isDm) {
      if ((activeFogTool === 'reveal_box' || activeFogTool === 'shroud_box') && fogBoxStartCell && hoverCell) {
        const minX = Math.min(fogBoxStartCell.x, hoverCell.x);
        const maxX = Math.max(fogBoxStartCell.x, hoverCell.x);
        const minY = Math.min(fogBoxStartCell.y, hoverCell.y);
        const maxY = Math.max(fogBoxStartCell.y, hoverCell.y);
        const isReveal = activeFogTool === 'reveal_box';

        const updated = { ...currentFogOfWar };
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            updated[`${x},${y}`] = isReveal;
          }
        }
        setLocalFogOfWar(updated);
        onUpdateFogOfWar?.(updated, currentUseFogOfWar);
        setFogBoxStartCell(null);
      }
      setIsPaintingFog(false);
    }
  };

  // Cell-level mouse event triggers for drawing
  const handleCellMouseDown = (cellX: number, cellY: number, e: React.MouseEvent) => {
    if (isTerrainEditorOpen && isDm && e.button === 0) {
      e.stopPropagation();
      if (activeTerrainTool === 'box') {
        setBoxStartCell({ x: cellX, y: cellY });
      } else if (activeTerrainTool === 'brush') {
        setIsPaintingTerrain(true);
        paintCell(cellX, cellY, activeTerrainBrush);
      } else if (activeTerrainTool === 'eraser') {
        setIsPaintingTerrain(true);
        paintCell(cellX, cellY, 'open');
      }
      return;
    }

    if (isFogEditorOpen && isDm && e.button === 0) {
      e.stopPropagation();
      if (activeFogTool === 'reveal_box' || activeFogTool === 'shroud_box') {
        setFogBoxStartCell({ x: cellX, y: cellY });
      } else if (activeFogTool === 'reveal_brush') {
        setIsPaintingFog(true);
        handleSetFogTile(cellX, cellY, true);
      } else if (activeFogTool === 'shroud_brush') {
        setIsPaintingFog(true);
        handleSetFogTile(cellX, cellY, false);
      }
      return;
    }

    // If placing ruler or unlocked AoE, let click handle it
    if (e.button === 0 && (isRulerActive || (isAoEEditorOpen && currentAoETemplate && !currentAoETemplate.isLocked))) {
      return;
    }

    // In normal mode, mouse down on any cell initiates map dragging, UNLESS user clicked a token or is dragging a token
    if (draggedCombatantId || (e.target as HTMLElement)?.closest?.('[data-token-draggable="true"]')) {
      return;
    }

    if (e.button === 0 || e.button === 1 || e.button === 2 || isSpacePressed) {
      if (e.button === 2) {
        e.preventDefault();
      }
      setIsPanning(true);
      hasDraggedRef.current = false;
      dragStartClientRef.current = { x: e.clientX, y: e.clientY };
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCellMouseEnter = (cellX: number, cellY: number) => {
    if (isTerrainEditorOpen && isDm && isPaintingTerrain) {
      if (activeTerrainTool === 'brush') {
        paintCell(cellX, cellY, activeTerrainBrush);
      } else if (activeTerrainTool === 'eraser') {
        paintCell(cellX, cellY, 'open');
      }
    }
    if (isFogEditorOpen && isDm && isPaintingFog) {
      if (activeFogTool === 'reveal_brush') {
        handleSetFogTile(cellX, cellY, true);
      } else if (activeFogTool === 'shroud_brush') {
        handleSetFogTile(cellX, cellY, false);
      }
    }
  };

  // Handle Token Drag Start
  const handleTokenDragStart = (e: React.DragEvent, combatantId: string) => {
    // Explicitly reset map panning so token drag does not pan or snap the canvas
    setIsPanning(false);
    hasDraggedRef.current = false;

    const c = combatants.find((item) => item.id === combatantId);
    if (!c) return;

    const canMove = isDm || c.controlledBy === currentUserId || c.isPlayerChar;
    if (!canMove) {
      e.preventDefault();
      return;
    }

    // Players cannot move tokens if their movement speed is exhausted (0 ft remaining)
    if (!isDm) {
      const remainingSpeed = typeof c.movementRemaining === 'number' ? c.movementRemaining : (c.speed || 30);
      if (remainingSpeed <= 0) {
        e.preventDefault();
        setMovementNotice({
          type: 'error',
          message: `Movement Locked: ${c.name} has 0 ft remaining this turn. Take a Dash action or wait for your next turn.`
        });
        return;
      }
    }

    setDraggedCombatantId(combatantId);
    setDragHoverCell(null);
    e.dataTransfer.setData('text/plain', combatantId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTokenDragEnd = () => {
    setDraggedCombatantId(null);
    setDragHoverCell(null);
    setIsPanning(false);
    hasDraggedRef.current = false;
  };

  // Handle Drop on Cell
  const handleCellDrop = (cellX: number, cellY: number, e?: React.DragEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPanning(false);
    hasDraggedRef.current = false;
    const combatantId =
      draggedCombatantId ||
      e?.dataTransfer?.getData('text/plain') ||
      e?.dataTransfer?.getData('combatantId');

    if (!combatantId) return;

    const c = combatants.find((item) => item.id === combatantId);
    if (!c) {
      setDraggedCombatantId(null);
      setDragHoverCell(null);
      return;
    }

    // Disallow dropping onto impassable terrain or closed doors for players (or if DM opted out of free move)
    const enforceImpassable = !isDm || !dmFreeMoveEnabled;
    if (enforceImpassable && isCellImpassable(cellX, cellY, terrainMap, doors)) {
      setMovementNotice({
        type: 'error',
        message: 'Cannot place creature on impassable terrain or closed door.'
      });
      setDraggedCombatantId(null);
      setDragHoverCell(null);
      return;
    }

    // Mounted Combat: Check if dropped onto an eligible mount!
    const targetMount = combatants.find((other) => {
      if (other.id === combatantId) return false;
      if (other.isOnMap === false) return false;
      const isEligibleMount = other.isMount || (other.tokenSize && other.tokenSize >= 2) || (other.speed && other.speed >= 40);
      const otherX = other.mapX;
      const otherY = other.mapY;
      const otherSize = other.tokenSize || 1;
      return (
        isEligibleMount &&
        typeof otherX === 'number' &&
        typeof otherY === 'number' &&
        cellX >= otherX &&
        cellX < otherX + otherSize &&
        cellY >= otherY &&
        cellY < otherY + otherSize
      );
    });

    if (targetMount && !c.mountedOnId && c.id !== targetMount.id && onMountCombatant) {
      onMountCombatant(combatantId, targetMount.id);
      setMovementNotice({
        type: 'info',
        message: `🐎 ${c.name} mounted ${targetMount.name}!`
      });
      setDraggedCombatantId(null);
      setDragHoverCell(null);
      return;
    }

    // Mounted Combat: If currently mounted and dropped onto an adjacent square, dismount!
    if (c.mountedOnId && onDismountCombatant) {
      onDismountCombatant(combatantId, { x: cellX, y: cellY });
      setMovementNotice({
        type: 'info',
        message: `🐎 ${c.name} dismounted into space (${String.fromCharCode(65 + (cellX % 26))}${cellY + 1})!`
      });
      setDraggedCombatantId(null);
      setDragHoverCell(null);
      return;
    }

    const isAlreadyOnMap = c.isOnMap !== false && typeof c.mapX === 'number' && typeof c.mapY === 'number';

    if (isAlreadyOnMap) {
      const pathCost = calculateDirectMoveCostFeet(
        c.mapX!,
        c.mapY!,
        cellX,
        cellY,
        config.feetPerSquare,
        config.diagonalRule,
        terrainMap,
        doors,
        {
          elevationFeet: c.elevationFeet,
          hasSwimSpeed: (c as any).speedSwim ? (c as any).speedSwim > 0 : false,
          hasClimbSpeed: (c as any).speedClimb ? (c as any).speedClimb > 0 : false,
          hasFlySpeed: (c as any).speedFly ? (c as any).speedFly > 0 : false
        }
      );

      // Enforce movement distance limit for players
      if (!isDm) {
        if (!pathCost.isPassable) {
          setMovementNotice({
            type: 'error',
            message: `Movement Blocked: ${pathCost.blockedCell?.reason || 'Impassable barrier in path'}.`
          });
          setDraggedCombatantId(null);
          setDragHoverCell(null);
          return;
        }

        const remainingSpeed = typeof c.movementRemaining === 'number' ? c.movementRemaining : (c.speed || 30);
        if (pathCost.totalFeet > remainingSpeed) {
          setMovementNotice({
            type: 'error',
            message: `Speed Exceeded: Move requires ${pathCost.totalFeet} ft, but ${c.name} only has ${remainingSpeed} ft remaining this turn.`
          });
          setDraggedCombatantId(null);
          setDragHoverCell(null);
          return;
        }
      }

      const moveFeet = isFinite(pathCost.totalFeet)
        ? pathCost.totalFeet
        : calculateGridDistanceFeet(
            c.mapX!,
            c.mapY!,
            cellX,
            cellY,
            config.feetPerSquare,
            config.diagonalRule
          );

      if (onMoveCombatant) {
        onMoveCombatant(combatantId, cellX, cellY, moveFeet, undefined, {
          isDmFreeMove: isDm && dmFreeMoveEnabled
        });
      } else if (onUpdateCombatantPosition) {
        onUpdateCombatantPosition(combatantId, cellX, cellY);
      }
    } else {
      // Placing unplaced or reserve token onto the map
      if (onUpdateCombatantPosition) {
        onUpdateCombatantPosition(combatantId, cellX, cellY);
      }
    }

    setDraggedCombatantId(null);
    setDragHoverCell(null);
  };

  // Handle drop onto Reserve Bench (removes token from map)
  const handleBenchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPanning(false);
    hasDraggedRef.current = false;
    const combatantId =
      draggedCombatantId ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('combatantId');

    if (combatantId && onRemoveCombatantFromMap) {
      onRemoveCombatantFromMap(combatantId);
      if (selectedCombatantId === combatantId && onSelectCombatant) {
        onSelectCombatant(null);
      }
    }
    setDraggedCombatantId(null);
    setDragHoverCell(null);
  };

  // Center view on active combatant
  const handleCenterOnActive = useCallback(() => {
    if (!activeCombatant || !containerRef.current) return;
    const found = positionedCombatants.find((c) => c.id === activeCombatant.id);
    if (!found) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tokenPixelX = (found.calculatedX + found.calculatedSize / 2) * CELL_SIZE_PX * zoom;
    const tokenPixelY = (found.calculatedY + found.calculatedSize / 2) * CELL_SIZE_PX * zoom;

    setPan({
      x: rect.width / 2 - tokenPixelX,
      y: rect.height / 2 - tokenPixelY
    });
  }, [activeCombatant, positionedCombatants, zoom]);

  // Center on specific combatant by ID
  const handleCenterOnCombatant = useCallback(
    (combatantId: string) => {
      if (!containerRef.current) return;
      const found = positionedCombatants.find((c) => c.id === combatantId);
      if (!found) return;

      const rect = containerRef.current.getBoundingClientRect();
      const tokenPixelX = (found.calculatedX + found.calculatedSize / 2) * CELL_SIZE_PX * zoom;
      const tokenPixelY = (found.calculatedY + found.calculatedSize / 2) * CELL_SIZE_PX * zoom;

      setPan({
        x: rect.width / 2 - tokenPixelX,
        y: rect.height / 2 - tokenPixelY
      });
    },
    [positionedCombatants, zoom]
  );

  // Center on selected combatant
  const handleCenterOnSelected = useCallback(() => {
    if (!activeMover || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const tokenPixelX = (activeMover.calculatedX + activeMover.calculatedSize / 2) * CELL_SIZE_PX * zoom;
    const tokenPixelY = (activeMover.calculatedY + activeMover.calculatedSize / 2) * CELL_SIZE_PX * zoom;

    setPan({
      x: rect.width / 2 - tokenPixelX,
      y: rect.height / 2 - tokenPixelY
    });
  }, [activeMover, zoom]);

  // Reset zoom & pan
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 20, y: 20 });
  };

  // Fullscreen mode toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Waypoint Path Planning Interaction
  const handleCellClick = (cellX: number, cellY: number, e: React.MouseEvent) => {
    // If user was dragging / panning the map, suppress the click
    if (hasDraggedRef.current) return;

    // Shift click is reserved for targeting
    if (e.shiftKey) return;

    // Phase 4: Ruler Line of Sight placement
    if (isRulerActive) {
      setRulerOrigin({ x: cellX, y: cellY });
      return;
    }

    // Phase 4: Unlocked AoE Template placement
    if (isAoEEditorOpen && currentAoETemplate && !currentAoETemplate.isLocked) {
      handleUpdateAoEInternal({
        ...currentAoETemplate,
        originX: cellX,
        originY: cellY
      });
      return;
    }

    // Check if cell has door and we clicked it to toggle
    const cellKey = `${cellX},${cellY}`;
    if (terrainMap[cellKey] === 'door') {
      onToggleDoor?.(cellX, cellY);
      return;
    }

    if (!activeMover || !canControlActiveMover) return;

    // Teleportation Target Square Selection
    if (activeTeleportState && activeMover) {
      if (isCellImpassable(cellX, cellY, terrainMap, doors)) {
        setMovementNotice({
          type: 'error',
          message: 'Cannot teleport into a solid wall or closed barrier.'
        });
        return;
      }
      const distFeet = calculateGridDistanceFeet(
        activeMover.calculatedX,
        activeMover.calculatedY,
        cellX,
        cellY,
        config.feetPerSquare,
        config.diagonalRule
      );
      if (distFeet > activeTeleportState.rangeFeet) {
        setMovementNotice({
          type: 'error',
          message: `Out of range: Target is ${distFeet} ft away (Max range: ${activeTeleportState.rangeFeet} ft).`
        });
        return;
      }
      handleExecuteTeleport(cellX, cellY);
      return;
    }

    // Spell Targeting Selection
    if (activeSpellTargetingState && activeMover) {
      if (activeSpellTargetingState.shape === 'single_target') {
        const clickedTarget = positionedCombatants.find(
          (c) =>
            cellX >= c.calculatedX &&
            cellX < c.calculatedX + c.calculatedSize &&
            cellY >= c.calculatedY &&
            cellY < c.calculatedY + c.calculatedSize
        );
        if (clickedTarget) {
          onSetTargetCombatant?.(clickedTarget.id);
          return;
        }
      } else {
        setSpellTargetOrigin({ x: cellX, y: cellY });
        return;
      }
    }

    if (isMovePlanning) {
      // Disallow placing waypoint on impassable cell
      if (isCellImpassable(cellX, cellY, terrainMap, doors)) {
        return;
      }

      // If clicking origin, do nothing
      if (cellX === activeMover.calculatedX && cellY === activeMover.calculatedY) {
        return;
      }

      // Check if clicking existing last waypoint: double-click to confirm
      if (moveWaypoints.length > 0) {
        const last = moveWaypoints[moveWaypoints.length - 1];
        if (last.x === cellX && last.y === cellY) {
          handleConfirmMove();
          return;
        }
      }

      // Add waypoint to path
      setMoveWaypoints((prev) => [...prev, { x: cellX, y: cellY }]);
    }
  };

  const handleExecuteTeleport = (targetX: number, targetY: number) => {
    if (!activeTeleportState || !activeMover) return;
    const distFeet = calculateGridDistanceFeet(
      activeMover.calculatedX,
      activeMover.calculatedY,
      targetX,
      targetY,
      config.feetPerSquare,
      config.diagonalRule
    );

    if (onMoveCombatant) {
      onMoveCombatant(activeMover.id, targetX, targetY, distFeet, undefined, {
        isTeleport: true,
        abilityName: activeTeleportState.abilityName
      });
    } else if (onUpdateCombatantPosition) {
      onUpdateCombatantPosition(activeMover.id, targetX, targetY);
    }

    setMovementNotice({
      type: 'success',
      message: `✨ ${activeMover.name} teleported ${distFeet} ft using ${activeTeleportState.abilityName}!`
    });

    setIsTeleportModeOpen(false);
    setActiveTeleportState(null);
  };

  const handleConfirmMove = () => {
    if (!activeMover || activePathWaypoints.length < 2) return;
    const destination = activePathWaypoints[activePathWaypoints.length - 1];

    if (!isDm) {
      const remaining = activeMover.calculatedRemainingSpeed;
      if (activePathDistance > remaining) {
        setMovementNotice({
          type: 'error',
          message: `Movement Exceeded: Path requires ${activePathDistance} ft, but ${activeMover.name} only has ${remaining} ft remaining.`
        });
        return;
      }
    }

    if (onMoveCombatant) {
      onMoveCombatant(
        activeMover.id,
        destination.x,
        destination.y,
        activePathDistance,
        activePathWaypoints,
        { isDmFreeMove: isDm && dmFreeMoveEnabled }
      );
    } else if (onUpdateCombatantPosition) {
      onUpdateCombatantPosition(activeMover.id, destination.x, destination.y);
    }

    // Reset waypoint state
    setMoveWaypoints([]);
    setIsMovePlanning(false);
  };

  const handleCancelMovePlanning = () => {
    setMoveWaypoints([]);
    setIsMovePlanning(false);
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else if (showResetModal) {
          setShowResetModal(false);
        } else if (isRulerActive || rulerOrigin) {
          setIsRulerActive(false);
          setRulerOrigin(null);
        } else if (boxStartCell) {
          setBoxStartCell(null);
          setIsPaintingTerrain(false);
        } else if (fogBoxStartCell) {
          setFogBoxStartCell(null);
          setIsPaintingFog(false);
        } else if (isTerrainEditorOpen) {
          setIsTerrainEditorOpen(false);
        } else if (isFogEditorOpen) {
          setIsFogEditorOpen(false);
        } else if (isAoEEditorOpen) {
          setIsAoEEditorOpen(false);
        } else if (isMovePlanning || moveWaypoints.length > 0) {
          handleCancelMovePlanning();
        } else if (selectedCombatantId) {
          if (onSelectCombatant) onSelectCombatant(null);
        } else if (targetCombatantId) {
          if (onSetTargetCombatant) onSetTargetCombatant(null);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isRulerActive || rulerOrigin) {
          setIsRulerActive(false);
          setRulerOrigin(null);
        } else if (selectedCombatantId) {
          onRemoveCombatantFromMap?.(selectedCombatantId);
          onSelectCombatant?.(null);
        } else if (currentAoETemplate) {
          handleUpdateAoEInternal(null);
        }
      } else if (e.key === 'Enter') {
        if (isMovePlanning && activePathWaypoints.length >= 2) {
          handleConfirmMove();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (activeMover && canControlActiveMover) {
          setIsMovePlanning((prev) => !prev);
        }
      } else if (e.key === 't' || e.key === 'T') {
        if (isDm) {
          setIsTerrainEditorOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMovePlanning,
    moveWaypoints,
    activePathWaypoints,
    selectedCombatantId,
    targetCombatantId,
    activeMover,
    canControlActiveMover,
    isDm,
    boxStartCell,
    isTerrainEditorOpen
  ]);

  const totalMapWidthPx = config.gridColumns * CELL_SIZE_PX;
  const totalMapHeightPx = config.gridRows * CELL_SIZE_PX;

  return (
    <div
      ref={outerWrapperRef}
      onWheel={(e) => {
        // Prevent scroll chaining to parent character sheet or window
        e.stopPropagation();
      }}
      className={`relative w-full rounded-2xl border border-stone-800 bg-stone-950 overflow-hidden shadow-2xl flex flex-col overscroll-contain touch-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
    >
      {/* Top Tactical Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800 z-20 flex-wrap gap-2">
        {/* Left Side: Title, Round & Mover Info */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-serif font-bold text-sm text-stone-100 flex items-center gap-1.5">
            <span>Tactical Battlemap</span>
            <span className="text-xs font-mono text-stone-400 font-normal">
              ({config.gridColumns}x{config.gridRows} squares • {config.feetPerSquare}ft)
            </span>
          </span>

          {/* Diagonal Rule Badge */}
          <button
            type="button"
            onClick={() => {
              if (isDm && onUpdateConfig) {
                const nextRule: DiagonalRule =
                  config.diagonalRule === 'standard5e'
                    ? 'alternating35e'
                    : config.diagonalRule === 'alternating35e'
                    ? 'euclidean'
                    : 'standard5e';
                onUpdateConfig({ ...config, diagonalRule: nextRule });
              }
            }}
            className={`hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
              config.diagonalRule === 'alternating35e'
                ? 'bg-purple-950/60 text-purple-300 border-purple-800/80'
                : config.diagonalRule === 'euclidean'
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                : 'bg-stone-950 text-stone-300 border-stone-800'
            } ${isDm ? 'hover:border-amber-500 cursor-pointer' : 'cursor-default'}`}
            title={
              isDm
                ? 'Click to cycle D&D diagonal measurement rule (5e Standard / 3.5e 5-10-5 / Euclidean)'
                : 'Active Measurement Rule'
            }
          >
            <Ruler className="w-3 h-3 text-stone-400" />
            <span>
              {config.diagonalRule === 'standard5e'
                ? '5e Chebyshev (5ft/diag)'
                : config.diagonalRule === 'alternating35e'
                ? '3.5e 5-10-5 Rule'
                : 'Euclidean (Direct)'}
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Turn Focus */}
          {activeCombatant && (
            <button
              type="button"
              onClick={handleCenterOnActive}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 rounded-lg font-bold transition shadow"
              title={`Center view on active combatant ${activeCombatant.name}`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Turn: {activeCombatant.name.slice(0, 12)}</span>
            </button>
          )}

          {/* Move Planning Toggle Button */}
          {activeMover && canControlActiveMover && (
            <button
              type="button"
              onClick={() => {
                if (isMovePlanning) {
                  handleCancelMovePlanning();
                } else {
                  setIsTeleportModeOpen(false);
                  setIsSpellTargetingOpen(false);
                  setIsMovePlanning(true);
                  setMoveWaypoints([]);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                isMovePlanning
                  ? 'bg-emerald-600 text-stone-950 shadow-emerald-600/30'
                  : 'bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700'
              }`}
              title="Toggle Tactical Movement Planning (Hot-key: M)"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>{isMovePlanning ? 'Cancel Move' : 'Move Mode'}</span>
            </button>
          )}

          {/* Teleportation Mode Toggle */}
          {activeMover && canControlActiveMover && (
            <button
              type="button"
              onClick={() => {
                const next = !isTeleportModeOpen;
                setIsTeleportModeOpen(next);
                if (next) {
                  setIsSpellTargetingOpen(false);
                  setIsMovePlanning(false);
                  setActiveTeleportState({
                    sourceCombatantId: activeMover.id,
                    sourceCombatantName: activeMover.name,
                    abilityName: 'Misty Step',
                    rangeFeet: 30,
                    requiresLineOfSight: true
                  });
                } else {
                  setActiveTeleportState(null);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                isTeleportModeOpen
                  ? 'bg-purple-600 text-stone-950 shadow-purple-600/30'
                  : 'bg-stone-950 hover:bg-stone-800 text-purple-300 border border-purple-800/60'
              }`}
              title="Teleport Movement (Choose destination square within range without expending walking speed)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTeleportModeOpen ? 'Cancel TP' : 'Teleport'}</span>
            </button>
          )}

          {/* Spell Targeting Mode Toggle */}
          {activeMover && canControlActiveMover && (
            <button
              type="button"
              onClick={() => {
                const next = !isSpellTargetingOpen;
                setIsSpellTargetingOpen(next);
                if (next) {
                  setIsTeleportModeOpen(false);
                  setIsMovePlanning(false);
                  const effectiveChar = selectedCharacterData || character;
                  const availableSpells = effectiveChar?.spells && effectiveChar.spells.length > 0
                    ? effectiveChar.spells
                    : (character?.spells || []);
                  const firstSpell = availableSpells[0];
                  if (firstSpell) {
                    setActiveSpellTargetingState(
                      parseSpellToTargeting(firstSpell, activeMover, effectiveChar)
                    );
                  } else {
                    setActiveSpellTargetingState({
                      sourceCombatantId: activeMover.id,
                      sourceCombatantName: activeMover.name,
                      spellName: 'Custom Spell',
                      rangeFeet: 60,
                      shape: 'single_target'
                    });
                  }
                } else {
                  setActiveSpellTargetingState(null);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                isSpellTargetingOpen
                  ? 'bg-rose-600 text-stone-950 shadow-rose-600/30'
                  : 'bg-stone-950 hover:bg-stone-800 text-rose-300 border border-rose-800/60'
              }`}
              title="Tactical Spell Targeting (Check ranges, cover, single targets, and area of effect cones/spheres)"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isSpellTargetingOpen ? 'Cancel Spell' : 'Target Spell'}</span>
            </button>
          )}

          {/* DM Free Movement Bypass Toggle */}
          {isDm && (
            <button
              type="button"
              onClick={() => setDmFreeMoveEnabled(!dmFreeMoveEnabled)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                dmFreeMoveEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                  : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-300'
              }`}
              title={
                dmFreeMoveEnabled
                  ? 'DM Free Move is ACTIVE: You can move any token anywhere on the map with no speed limit locks'
                  : 'Speed Limits Enforced: DMs are subject to normal movement limits'
              }
            >
              <span>👑</span>
              <span className="hidden xl:inline">{dmFreeMoveEnabled ? 'DM Free Move' : 'Speed Limits'}</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-stone-300 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition border-l border-stone-800 ml-0.5"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tokens Staging Tray Toggle */}
          <button
            type="button"
            onClick={() => setIsTokensDockOpen(!isTokensDockOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
              isTokensDockOpen
                ? 'bg-amber-950/90 text-amber-300 border border-amber-600/70 shadow-amber-900/20'
                : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800'
            }`}
            title="Toggle Tokens Dock & Reserve Staging Tray"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Tokens ({combatants.length})</span>
          </button>

          {/* Theme Quick Switcher */}
          {isDm && onUpdateConfig && (
            <div className="relative">
              <select
                value={config.theme}
                onChange={(e) => {
                  onUpdateConfig({
                    ...config,
                    theme: e.target.value as BattlemapTheme
                  });
                }}
                className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-300 font-serif font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                title="Change Battlemap Terrain Theme"
              >
                {(Object.keys(BATTLEMAP_THEMES) as BattlemapTheme[]).map((thm) => (
                  <option key={thm} value={thm}>
                    {BATTLEMAP_THEMES[thm].icon} {BATTLEMAP_THEMES[thm].name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phase 4: Spell AoE Template Toggle */}
          <button
            type="button"
            onClick={() => setIsAoEEditorOpen(!isAoEEditorOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
              isAoEEditorOpen
                ? 'bg-rose-600 text-stone-950 border-rose-600 shadow-rose-600/30'
                : 'bg-stone-950 hover:bg-stone-800 text-rose-300 border border-stone-800'
            }`}
            title="Spell AoE & Area Blast Templates (Circles, Cones, Cubes, Lines)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AoE</span>
            {currentAoETemplate && (
              <span className="ml-0.5 px-1 py-0.2 bg-stone-900 text-[10px] text-rose-400 rounded-full font-mono">
                {currentAoETemplate.radiusFeet || currentAoETemplate.lengthFeet || currentAoETemplate.sizeFeet}ft
              </span>
            )}
          </button>

          {/* Phase 4: Tactical Ruler & LoS */}
          <button
            type="button"
            onClick={() => {
              setIsRulerActive(!isRulerActive);
              if (isRulerActive) {
                setRulerOrigin(null);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
              isRulerActive
                ? 'bg-indigo-600 text-stone-950 border-indigo-600 shadow-indigo-600/30'
                : 'bg-stone-950 hover:bg-stone-800 text-indigo-300 border border-stone-800'
            }`}
            title="Line of Sight & Cover Ruler (Click two cells to measure sight, cover, and line of sight obstruction)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>LoS Ruler</span>
          </button>

          {/* Phase 4: Fog of War Toggle */}
          {isDm && (
            <button
              type="button"
              onClick={() => setIsFogEditorOpen(!isFogEditorOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                isFogEditorOpen
                  ? 'bg-purple-600 text-stone-950 border-purple-600 shadow-purple-600/30'
                  : currentUseFogOfWar
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-700'
                  : 'bg-stone-950 hover:bg-stone-800 text-purple-400 border border-stone-800'
              }`}
              title="Fog of War & Dynamic Vision (Brush/Box reveal & party line-of-sight auto-reveal)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Fog</span>
              {currentUseFogOfWar && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Phase 3: Terrain & Walls Palette Toggle */}
          {isDm && (
            <button
              type="button"
              onClick={() => setIsTerrainEditorOpen(!isTerrainEditorOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition shadow ${
                isTerrainEditorOpen
                  ? 'bg-amber-600 text-stone-950 border-amber-600 shadow-amber-600/30'
                  : 'bg-stone-950 hover:bg-stone-800 text-amber-300 border border-stone-800'
              }`}
              title="Open Tactical Terrain, Walls & Doors Palette (Hot-key: T)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Terrain</span>
              {(terrainCounts.walls > 0 || terrainCounts.doors > 0) && (
                <span className="ml-0.5 px-1 py-0.2 bg-stone-900 text-[10px] text-amber-400 rounded-full font-mono">
                  {terrainCounts.walls + terrainCounts.doors}
                </span>
              )}
            </button>
          )}

          {/* Battlemap Layouts (Save / Load / Pre-builds) */}
          {isDm && (
            <button
              type="button"
              onClick={() => setShowLayoutsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 hover:text-amber-200 border border-amber-700/70 transition shadow cursor-pointer"
              title="Battlemap Layouts & Pre-builds (Save current map, load ready-to-play arenas, or export/import JSON)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Layouts</span>
            </button>
          )}

          {/* Reset Map Modal Trigger */}
          {isDm && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold bg-stone-950 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 border border-stone-800 hover:border-rose-700/60 transition shadow"
              title="Reset Battlemap (Full reset, spawn points, recall tokens to reserve, clear terrain, or shroud fog)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset Map</span>
            </button>
          )}

          {/* Map Settings Modal / Toggle */}
          {isDm && onUpdateConfig && (
            <button
              type="button"
              onClick={() => setShowConfigModal(!showConfigModal)}
              className={`p-1.5 rounded-lg border transition ${
                showConfigModal
                  ? 'bg-amber-600 text-stone-950 border-amber-600'
                  : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border-stone-800'
              }`}
              title="Grid Dimensions & Map Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-lg transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Tactical Stage'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Popout Battlemap into individual window */}
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                if (onPopoutBattlemap) {
                  onPopoutBattlemap();
                } else {
                  openDetachedWindow('battlemap', character?.id);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold bg-stone-950 hover:bg-amber-950/60 text-amber-300 hover:text-amber-200 border border-amber-600/40 hover:border-amber-500 transition shadow"
              title="Pop out Battlemap into a separate window (Dual-screen tabletop mode: keep combat sheet in this window and map in another)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Popout</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Movement Notice Banner */}
      {movementNotice && (
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs font-bold border-b z-20 transition-all ${
            movementNotice.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-lg'
              : movementNotice.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-amber-800/80 shadow-lg'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-lg'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{movementNotice.type === 'error' ? '🚫' : movementNotice.type === 'warning' ? '⚠️' : '✨'}</span>
            <span>{movementNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMovementNotice(null)}
            className="p-1 hover:bg-black/30 rounded text-stone-400 hover:text-stone-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Mover Speed Lock Alert for Players */}
      {activeMover && !isDm && activeMover.calculatedRemainingSpeed <= 0 && !movementNotice && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border-b border-rose-900/60 text-xs text-rose-300 z-20">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-800 rounded font-mono font-bold text-[11px] text-rose-400">
              🔒 MOVEMENT LOCKED
            </span>
            <span>
              {activeMover.name} has exhausted all speed for this turn (0 ft remaining). Take Dash or wait for your next turn.
            </span>
          </div>
        </div>
      )}

      {/* Combatants Staging Dock & Reserve Tray */}
      <CombatantsDock
        combatants={combatants}
        placedCombatants={placedCombatants}
        unplacedCombatants={unplacedCombatants}
        selectedCombatantId={selectedCombatantId}
        activeCombatantId={activeCombatant?.id}
        onSelectCombatant={onSelectCombatant}
        onCenterOnCombatant={handleCenterOnCombatant}
        onRemoveCombatantFromMap={onRemoveCombatantFromMap}
        onRemoveCombatant={onRemoveCombatant}
        onOpenAddModal={onOpenAddCombatantModal}
        onRecallAllToReserve={() => {
          onSelectCombatant?.(null);
          onSetTargetCombatant?.(null);
          if (onResetBattlemap) {
            onResetBattlemap({ resetTokens: 'recall_all' });
          } else {
            onResetMapTokens?.('recall_all');
          }
        }}
        onResetSpawnPoints={() => {
          if (onResetBattlemap) {
            onResetBattlemap({
              resetTokens: 'spawn_points',
              gridColumns: config.gridColumns,
              gridRows: config.gridRows
            });
          } else {
            onResetMapTokens?.('spawn_points');
          }
        }}
        isDm={isDm}
        onTokenDragStart={handleTokenDragStart}
        onBenchDrop={handleBenchDrop}
        isOpen={isTokensDockOpen}
        onToggleOpen={() => setIsTokensDockOpen((prev) => !prev)}
      />

      {/* Phase 4: Spell AoE & Blast Templates Palette */}
      {isAoEEditorOpen && (
        <AoEControlPalette
          activeTemplate={currentAoETemplate}
          onUpdateTemplate={handleUpdateAoEInternal}
          caughtCombatants={aoeCaughtCombatants}
          isRulerActive={isRulerActive}
          onToggleRuler={() => {
            setIsRulerActive(!isRulerActive);
            if (isRulerActive) setRulerOrigin(null);
          }}
          onRollSavesForTargets={onRollSavesForTargets}
          onApplyDamageToTargets={onApplyDamageToTargets}
          onClose={() => setIsAoEEditorOpen(false)}
          selectedCharacter={selectedCharacterData}
          selectedCombatant={activeMover}
        />
      )}

      {/* Phase 4: Fog of War & Dynamic Vision Palette */}
      {isFogEditorOpen && isDm && (
        <FogOfWarPalette
          isEnabled={currentUseFogOfWar}
          onToggleEnabled={handleToggleUseFog}
          viewMode={fogViewMode}
          onChangeViewMode={setFogViewMode}
          activeTool={activeFogTool}
          onChangeTool={setActiveFogTool}
          onRevealAll={handleRevealAllFog}
          onShroudAll={handleShroudAllFog}
          onAutoRevealPartyVision={handleAutoRevealPartyVision}
          revealedCount={revealedCount}
          totalSquares={config.gridColumns * config.gridRows}
          onClose={() => setIsFogEditorOpen(false)}
        />
      )}

      {/* Phase 3: Tactical Terrain Palette Drawer */}
      {isTerrainEditorOpen && isDm && (
        <TerrainPalette
          activeTool={activeTerrainTool}
          onChangeTool={setActiveTerrainTool}
          activeTerrain={activeTerrainBrush}
          onChangeTerrain={setActiveTerrainBrush}
          terrainCount={terrainCounts}
          onApplyTemplate={handleApplyTemplate}
          onClearAllTerrain={handleClearAllTerrainInternal}
          onClose={() => setIsTerrainEditorOpen(false)}
        />
      )}

      {/* Teleportation Target Selection Palette */}
      {isTeleportModeOpen && activeTeleportState && activeMover && (
        <TeleportControlPalette
          activeTeleport={activeTeleportState}
          activeCombatant={activeMover}
          onUpdateTeleport={setActiveTeleportState}
          hoverCell={
            hoverCell
              ? {
                  x: hoverCell.x,
                  y: hoverCell.y,
                  distanceFeet: calculateGridDistanceFeet(
                    activeMover.calculatedX,
                    activeMover.calculatedY,
                    hoverCell.x,
                    hoverCell.y,
                    config.feetPerSquare,
                    config.diagonalRule
                  ),
                  isWithinRange:
                    calculateGridDistanceFeet(
                      activeMover.calculatedX,
                      activeMover.calculatedY,
                      hoverCell.x,
                      hoverCell.y,
                      config.feetPerSquare,
                      config.diagonalRule
                    ) <= activeTeleportState.rangeFeet,
                  isPassable: !isCellImpassable(hoverCell.x, hoverCell.y, terrainMap, doors)
                }
              : null
          }
          onConfirmTeleport={(x, y) => {
            handleExecuteTeleport(x, y);
          }}
          onClose={() => {
            setIsTeleportModeOpen(false);
            setActiveTeleportState(null);
          }}
        />
      )}

      {/* Spell Tactical Range & Direction Targeting Palette */}
      {isSpellTargetingOpen && activeSpellTargetingState && activeMover && (
        <SpellTargetingPalette
          activeTargeting={activeSpellTargetingState}
          activeCombatant={activeMover}
          character={character}
          selectedCharacter={selectedCharacterData}
          allCharacters={allCharacters}
          onUpdateTargeting={setActiveSpellTargetingState}
          caughtTargets={positionedCombatants.filter((c) => {
            if (activeSpellTargetingState.shape === 'single_target') {
              return targetCombatantId === c.id;
            }
            if (hoverCell) {
              const dist = calculateGridDistanceFeet(
                hoverCell.x,
                hoverCell.y,
                c.calculatedX,
                c.calculatedY,
                config.feetPerSquare,
                config.diagonalRule
              );
              return dist <= (activeSpellTargetingState.areaSizeFeet || 20);
            }
            return false;
          })}
          targetCombatant={positionedCombatants.find((c) => c.id === targetCombatantId) || null}
          cursorDistanceFeet={
            hoverCell
              ? calculateGridDistanceFeet(
                  activeMover.calculatedX,
                  activeMover.calculatedY,
                  hoverCell.x,
                  hoverCell.y,
                  config.feetPerSquare,
                  config.diagonalRule
                )
              : 0
          }
          onConfirmCast={(opts) => {
            setMovementNotice({
              type: 'success',
              message: `🔥 ${activeMover.name} casts ${opts?.spellName || activeSpellTargetingState.spellName}! (${opts?.targets.length || 0} target(s) affected)`
            });
            setIsSpellTargetingOpen(false);
            setActiveSpellTargetingState(null);
            setSpellTargetOrigin(null);
          }}
          onClose={() => {
            setIsSpellTargetingOpen(false);
            setActiveSpellTargetingState(null);
            setSpellTargetOrigin(null);
          }}
        />
      )}

      {/* DM Configuration Drawer */}
      {showConfigModal && isDm && onUpdateConfig && (
        <div className="bg-stone-900 border-b border-stone-800 p-3.5 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs animate-fadeIn z-20">
          <div>
            <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Columns (Width)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={config.gridColumns}
              onChange={(e) => onUpdateConfig({ ...config, gridColumns: Math.max(10, parseInt(e.target.value) || 20) })}
              className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
            />
          </div>
          <div>
            <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Rows (Height)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={config.gridRows}
              onChange={(e) => onUpdateConfig({ ...config, gridRows: Math.max(10, parseInt(e.target.value) || 16) })}
              className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
            />
          </div>
          <div>
            <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Measurement Rule</label>
            <select
              value={config.diagonalRule}
              onChange={(e) => onUpdateConfig({ ...config, diagonalRule: e.target.value as DiagonalRule })}
              className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
            >
              <option value="standard5e">5e Standard (5ft / square)</option>
              <option value="alternating35e">3.5e Variant (5-10-5 Rule)</option>
              <option value="euclidean">Euclidean Radius (Direct)</option>
            </select>
          </div>
          <div>
            <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Overlays</label>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showReachableGrid}
                  onChange={(e) => onUpdateConfig({ ...config, showReachableGrid: e.target.checked })}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Reachable Speed Grid</span>
              </label>
              <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showMovementRings}
                  onChange={(e) => onUpdateConfig({ ...config, showMovementRings: e.target.checked })}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Reach / Range Rings</span>
              </label>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Pan/Zoom Map Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full ${
          isFullscreen
            ? 'h-screen'
            : (heightClass || (isStandalone ? 'h-[calc(100vh-220px)] min-h-[580px]' : 'h-[540px]'))
        } select-none overflow-hidden overscroll-contain ${
          isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
        }`}
        style={{
          backgroundColor: themeConfig.bg
        }}
      >
        {/* Transform Layer for Pan and Zoom */}
        <div
          className="absolute origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: `${totalMapWidthPx}px`,
            height: `${totalMapHeightPx}px`
          }}
        >
          {/* SVG Grid Overlay */}
          <svg
            width={totalMapWidthPx}
            height={totalMapHeightPx}
            className="absolute inset-0 pointer-events-auto"
          >
            <defs>
              <pattern
                id="battlemap-grid-pattern"
                width={CELL_SIZE_PX}
                height={CELL_SIZE_PX}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${CELL_SIZE_PX} 0 L 0 0 0 ${CELL_SIZE_PX}`}
                  fill="none"
                  stroke={themeConfig.gridColor}
                  strokeWidth="1"
                />
              </pattern>

              {/* Waypoint Marker Arrow */}
              <marker
                id="waypoint-arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Grid Background Fill */}
            <rect
              width={totalMapWidthPx}
              height={totalMapHeightPx}
              fill="url(#battlemap-grid-pattern)"
            />

            {/* Phase 3: Tactical Terrain Tiles Layer */}
            {Object.entries(terrainMap).map(([key, terrainType]) => {
              if (!terrainType || terrainType === 'open') return null;
              const [xStr, yStr] = key.split(',');
              const tx = parseInt(xStr, 10);
              const ty = parseInt(yStr, 10);
              if (isNaN(tx) || isNaN(ty)) return null;

              const px = tx * CELL_SIZE_PX;
              const py = ty * CELL_SIZE_PX;
              const door = doors[key] || { isOpen: false };
              const isDoor = terrainType === 'door';

              if (terrainType === 'wall') {
                return (
                  <g key={`wall-${key}`}>
                    {/* Solid stone masonry block */}
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="#292524"
                      stroke="#44403c"
                      strokeWidth="1.5"
                    />
                    {/* Bevel highlights & mortar lines */}
                    <line x1={px} y1={py} x2={px + CELL_SIZE_PX} y2={py} stroke="#57534e" strokeWidth="2" />
                    <line x1={px} y1={py} x2={px} y2={py + CELL_SIZE_PX} stroke="#57534e" strokeWidth="2" />
                    <line x1={px} y1={py + CELL_SIZE_PX / 2} x2={px + CELL_SIZE_PX} y2={py + CELL_SIZE_PX / 2} stroke="#1c1917" strokeWidth="1" />
                    <line x1={px + CELL_SIZE_PX / 2} y1={py} x2={px + CELL_SIZE_PX / 2} y2={py + CELL_SIZE_PX / 2} stroke="#1c1917" strokeWidth="1" />
                    <circle cx={px + 12} cy={py + 12} r="1.5" fill="#57534e" />
                    <circle cx={px + 36} cy={py + 36} r="1.5" fill="#57534e" />
                  </g>
                );
              }

              if (isDoor) {
                const isOpen = door.isOpen;
                return (
                  <g
                    key={`door-${key}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDoor?.(tx, ty);
                    }}
                    className="cursor-pointer"
                  >
                    <title>{isOpen ? 'Open Door (Click to Close)' : 'Closed Door (Click to Open)'}</title>
                    {isOpen ? (
                      <>
                        {/* Open Door Frame & swing arc */}
                        <rect
                          x={px + 2}
                          y={py + 2}
                          width={CELL_SIZE_PX - 4}
                          height={CELL_SIZE_PX - 4}
                          fill="rgba(69, 26, 3, 0.15)"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        {/* Swung door leaf */}
                        <rect
                          x={px + 2}
                          y={py + 2}
                          width={6}
                          height={CELL_SIZE_PX - 4}
                          fill="#92400e"
                          stroke="#d97706"
                          strokeWidth="1"
                          rx="1"
                        />
                        <text
                          x={px + CELL_SIZE_PX / 2 + 3}
                          y={py + CELL_SIZE_PX / 2 + 5}
                          textAnchor="middle"
                          fontSize="16"
                        >
                          🚪
                        </text>
                        <text
                          x={px + CELL_SIZE_PX / 2 + 3}
                          y={py + CELL_SIZE_PX - 5}
                          textAnchor="middle"
                          fontSize="7"
                          fill="#fbbf24"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          OPEN
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Closed solid reinforced timber door */}
                        <rect
                          x={px + 2}
                          y={py + 2}
                          width={CELL_SIZE_PX - 4}
                          height={CELL_SIZE_PX - 4}
                          fill="#451a03"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          rx="3"
                        />
                        {/* Iron bands */}
                        <rect x={px + 4} y={py + 8} width={CELL_SIZE_PX - 8} height={3} fill="#78350f" />
                        <rect x={px + 4} y={py + CELL_SIZE_PX - 12} width={CELL_SIZE_PX - 8} height={3} fill="#78350f" />
                        <circle
                          cx={px + CELL_SIZE_PX / 2}
                          cy={py + CELL_SIZE_PX / 2}
                          r="10"
                          fill="#1c1917"
                          stroke="#d97706"
                          strokeWidth="1"
                        />
                        <text
                          x={px + CELL_SIZE_PX / 2}
                          y={py + CELL_SIZE_PX / 2 + 4}
                          textAnchor="middle"
                          fontSize="11"
                        >
                          🔒
                        </text>
                        <text
                          x={px + CELL_SIZE_PX / 2}
                          y={py + CELL_SIZE_PX - 5}
                          textAnchor="middle"
                          fontSize="7"
                          fill="#fbbf24"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          CLOSED
                        </text>
                      </>
                    )}
                  </g>
                );
              }

              if (terrainType === 'difficult') {
                return (
                  <g key={`diff-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(217, 119, 6, 0.22)"
                      stroke="rgba(245, 158, 11, 0.4)"
                      strokeWidth="1"
                    />
                    <circle cx={px + 12} cy={py + 14} r="3" fill="#d97706" opacity="0.6" />
                    <circle cx={px + 34} cy={py + 18} r="4" fill="#d97706" opacity="0.5" />
                    <circle cx={px + 22} cy={py + 34} r="3.5" fill="#d97706" opacity="0.6" />
                    <text
                      x={px + CELL_SIZE_PX - 10}
                      y={py + 12}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      🪨
                    </text>
                  </g>
                );
              }

              if (terrainType === 'hazard') {
                return (
                  <g key={`hazard-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(220, 38, 38, 0.35)"
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX / 2 + 5}
                      fontSize="16"
                      textAnchor="middle"
                    >
                      🌋
                    </text>
                  </g>
                );
              }

              if (terrainType === 'water') {
                return (
                  <g key={`water-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(14, 165, 233, 0.35)"
                      stroke="#0284c7"
                      strokeWidth="1"
                    />
                    <path
                      d={`M ${px + 6} ${py + 16} Q ${px + 16} ${py + 12} ${px + 26} ${py + 16} T ${px + 42} ${py + 16}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                    <path
                      d={`M ${px + 6} ${py + 32} Q ${px + 16} ${py + 28} ${px + 26} ${py + 32} T ${px + 42} ${py + 32}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 4}
                      fontSize="7"
                      fill="#bae6fd"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      SWIM 2x
                    </text>
                  </g>
                );
              }

              if (terrainType === 'shallow_water') {
                return (
                  <g key={`shallow-water-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(56, 189, 248, 0.2)"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <path
                      d={`M ${px + 8} ${py + 22} Q ${px + 18} ${py + 18} ${px + 28} ${py + 22} T ${px + 40} ${py + 22}`}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 16}
                      fontSize="11"
                      textAnchor="middle"
                    >
                      🌊
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 4}
                      fontSize="7"
                      fill="#7dd3fc"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      WADE 2x
                    </text>
                  </g>
                );
              }

              if (terrainType === 'ice') {
                return (
                  <g key={`ice-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(165, 243, 252, 0.25)"
                      stroke="#67e8f9"
                      strokeWidth="1"
                    />
                    {/* Crystal fracture lines */}
                    <line x1={px + 8} y1={py + 10} x2={px + 24} y2={py + 26} stroke="#e0f2fe" strokeWidth="1" opacity="0.7" />
                    <line x1={px + 24} y1={py + 26} x2={px + 40} y2={py + 18} stroke="#e0f2fe" strokeWidth="1" opacity="0.7" />
                    <line x1={px + 24} y1={py + 26} x2={px + 18} y2={py + 40} stroke="#e0f2fe" strokeWidth="1" opacity="0.7" />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 18}
                      fontSize="12"
                      textAnchor="middle"
                    >
                      🧊
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 4}
                      fontSize="7"
                      fill="#a5f3fc"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      ICE 2x
                    </text>
                  </g>
                );
              }

              if (terrainType === 'climb') {
                return (
                  <g key={`climb-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(180, 83, 9, 0.22)"
                      stroke="#d97706"
                      strokeWidth="1"
                    />
                    {/* Ladder rungs */}
                    <line x1={px + 12} y1={py + 6} x2={px + 12} y2={py + 42} stroke="#b45309" strokeWidth="2.5" />
                    <line x1={px + 36} y1={py + 6} x2={px + 36} y2={py + 42} stroke="#b45309" strokeWidth="2.5" />
                    <line x1={px + 12} y1={py + 12} x2={px + 36} y2={py + 12} stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1={px + 12} y1={py + 22} x2={px + 36} y2={py + 22} stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1={px + 12} y1={py + 32} x2={px + 36} y2={py + 32} stroke="#f59e0b" strokeWidth="1.5" />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 4}
                      fontSize="7"
                      fill="#fde68a"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      CLIMB 2x
                    </text>
                  </g>
                );
              }

              if (terrainType === 'web') {
                return (
                  <g key={`web-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="rgba(244, 244, 245, 0.16)"
                      stroke="#a1a1aa"
                      strokeWidth="1"
                    />
                    {/* Spiderweb spokes */}
                    <line x1={px + 4} y1={py + 4} x2={px + 44} y2={py + 44} stroke="#e4e4e7" strokeWidth="1" opacity="0.6" />
                    <line x1={px + 44} y1={py + 4} x2={px + 4} y2={py + 44} stroke="#e4e4e7" strokeWidth="1" opacity="0.6" />
                    <circle cx={px + 24} cy={py + 24} r="12" fill="none" stroke="#e4e4e7" strokeWidth="0.8" opacity="0.6" />
                    <circle cx={px + 24} cy={py + 24} r="6" fill="none" stroke="#e4e4e7" strokeWidth="0.8" opacity="0.6" />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 16}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      🕸️
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 4}
                      fontSize="7"
                      fill="#f4f4f5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      STICKY 2x
                    </text>
                  </g>
                );
              }

              if (terrainType === 'chasm') {
                return (
                  <g key={`chasm-${key}`}>
                    <rect
                      x={px}
                      y={py}
                      width={CELL_SIZE_PX}
                      height={CELL_SIZE_PX}
                      fill="#09090b"
                      stroke="#3f3f46"
                      strokeWidth="1.5"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX / 2 + 5}
                      fontSize="16"
                      textAnchor="middle"
                    >
                      🕳️
                    </text>
                  </g>
                );
              }

              if (terrainType === 'cover_half') {
                return (
                  <g key={`cover-half-${key}`}>
                    <rect
                      x={px + 2}
                      y={py + 2}
                      width={CELL_SIZE_PX - 4}
                      height={CELL_SIZE_PX - 4}
                      fill="rgba(16, 185, 129, 0.18)"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      rx="3"
                    />
                    <rect x={px + 6} y={py + 6} width={10} height={10} fill="#059669" rx="1" />
                    <rect x={px + CELL_SIZE_PX - 16} y={py + 6} width={10} height={10} fill="#059669" rx="1" />
                    <rect x={px + 4} y={py + CELL_SIZE_PX - 14} width={CELL_SIZE_PX - 8} height={10} rx="2" fill="#064e3b" />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 6}
                      fontSize="8"
                      fill="#6ee7b7"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      +2 AC
                    </text>
                  </g>
                );
              }

              if (terrainType === 'cover_three_quarters') {
                return (
                  <g key={`cover-three-quarters-${key}`}>
                    <rect
                      x={px + 2}
                      y={py + 2}
                      width={CELL_SIZE_PX - 4}
                      height={CELL_SIZE_PX - 4}
                      fill="rgba(99, 102, 241, 0.22)"
                      stroke="#818cf8"
                      strokeWidth="2"
                      rx="3"
                    />
                    <rect x={px + 4} y={py + CELL_SIZE_PX - 14} width={CELL_SIZE_PX - 8} height={10} rx="2" fill="#312e81" />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 20}
                      fontSize="13"
                      textAnchor="middle"
                    >
                      🏰
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 6}
                      fontSize="8"
                      fill="#c7d2fe"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      +5 AC
                    </text>
                  </g>
                );
              }

              if (terrainType === 'elevation_high') {
                return (
                  <g key={`elev-high-${key}`}>
                    <rect
                      x={px + 2}
                      y={py + 2}
                      width={CELL_SIZE_PX - 4}
                      height={CELL_SIZE_PX - 4}
                      fill="rgba(234, 179, 8, 0.2)"
                      stroke="#eab308"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 20}
                      fontSize="13"
                      textAnchor="middle"
                    >
                      ⛰️
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 6}
                      fontSize="8"
                      fill="#fde047"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      +10 FT
                    </text>
                  </g>
                );
              }

              if (terrainType === 'elevation_low') {
                return (
                  <g key={`elev-low-${key}`}>
                    <rect
                      x={px + 2}
                      y={py + 2}
                      width={CELL_SIZE_PX - 4}
                      height={CELL_SIZE_PX - 4}
                      fill="rgba(120, 113, 108, 0.2)"
                      stroke="#a8a29e"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + 20}
                      fontSize="13"
                      textAnchor="middle"
                    >
                      ⛏️
                    </text>
                    <text
                      x={px + CELL_SIZE_PX / 2}
                      y={py + CELL_SIZE_PX - 6}
                      fontSize="8"
                      fill="#d6d3d1"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      -10 FT
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* Box Tool Drawing Preview in Terrain Mode */}
            {isTerrainEditorOpen && activeTerrainTool === 'box' && boxStartCell && hoverCell && (() => {
              const minX = Math.min(boxStartCell.x, hoverCell.x);
              const maxX = Math.max(boxStartCell.x, hoverCell.x);
              const minY = Math.min(boxStartCell.y, hoverCell.y);
              const maxY = Math.max(boxStartCell.y, hoverCell.y);
              const w = (maxX - minX + 1) * CELL_SIZE_PX;
              const h = (maxY - minY + 1) * CELL_SIZE_PX;
              const cols = maxX - minX + 1;
              const rows = maxY - minY + 1;
              const widthFeet = cols * config.feetPerSquare;
              const heightFeet = rows * config.feetPerSquare;

              return (
                <g className="pointer-events-none">
                  <rect
                    x={minX * CELL_SIZE_PX}
                    y={minY * CELL_SIZE_PX}
                    width={w}
                    height={h}
                    fill={TERRAIN_DEFINITIONS[activeTerrainBrush]?.color || 'rgba(245, 158, 11, 0.2)'}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={minX * CELL_SIZE_PX + w / 2 - 50}
                    y={minY * CELL_SIZE_PX + h / 2 - 12}
                    width="100"
                    height="24"
                    rx="4"
                    fill="#18181b"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                  <text
                    x={minX * CELL_SIZE_PX + w / 2}
                    y={minY * CELL_SIZE_PX + h / 2 + 4}
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {cols}x{rows} ({widthFeet}x{heightFeet} ft)
                  </text>
                </g>
              );
            })()}

            {/* Phase 2: Reachable Movement Zone Grid Shading */}
            {reachableZones.dashTiles.map((tile) => (
              <rect
                key={`dash-${tile.x}-${tile.y}`}
                x={tile.x * CELL_SIZE_PX}
                y={tile.y * CELL_SIZE_PX}
                width={CELL_SIZE_PX}
                height={CELL_SIZE_PX}
                fill="rgba(245, 158, 11, 0.08)"
                stroke="rgba(245, 158, 11, 0.25)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            ))}

            {reachableZones.directTiles.map((tile) => (
              <rect
                key={`direct-${tile.x}-${tile.y}`}
                x={tile.x * CELL_SIZE_PX}
                y={tile.y * CELL_SIZE_PX}
                width={CELL_SIZE_PX}
                height={CELL_SIZE_PX}
                fill="rgba(16, 185, 129, 0.12)"
                stroke="rgba(16, 185, 129, 0.3)"
                strokeWidth="1"
              />
            ))}

            {/* Hover Cell Highlight */}
            {hoverCell && (
              <rect
                x={hoverCell.x * CELL_SIZE_PX}
                y={hoverCell.y * CELL_SIZE_PX}
                width={CELL_SIZE_PX}
                height={CELL_SIZE_PX}
                fill="rgba(245, 158, 11, 0.18)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Active Turn Token Reach Circle (5ft or reachFeet) */}
            {config.showMovementRings && activeCombatant && (() => {
              const activePos = positionedCombatants.find((c) => c.id === activeCombatant.id);
              if (!activePos) return null;
              const radiusSquares = Math.max(1, (activePos.reachFeet || 5) / config.feetPerSquare);
              const cx = (activePos.calculatedX + activePos.calculatedSize / 2) * CELL_SIZE_PX;
              const cy = (activePos.calculatedY + activePos.calculatedSize / 2) * CELL_SIZE_PX;
              const r = (radiusSquares + (activePos.calculatedSize - 1) / 2) * CELL_SIZE_PX;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="rgba(245, 158, 11, 0.07)"
                  stroke="rgba(245, 158, 11, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })()}

            {/* Selected Token Reach Circle */}
            {config.showMovementRings && selectedCombatantId && (() => {
              const sel = positionedCombatants.find((c) => c.id === selectedCombatantId);
              if (!sel || sel.id === activeCombatant?.id) return null;
              const radiusSquares = Math.max(1, (sel.reachFeet || 5) / config.feetPerSquare);
              const cx = (sel.calculatedX + sel.calculatedSize / 2) * CELL_SIZE_PX;
              const cy = (sel.calculatedY + sel.calculatedSize / 2) * CELL_SIZE_PX;
              const r = (radiusSquares + (sel.calculatedSize - 1) / 2) * CELL_SIZE_PX;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="rgba(56, 189, 248, 0.5)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              );
            })()}

            {/* Shift-Click Targeting Line between Selected Token and Target */}
            {selectedCombatantId && targetCombatantId && (() => {
              const from = positionedCombatants.find((c) => c.id === selectedCombatantId);
              const to = positionedCombatants.find((c) => c.id === targetCombatantId);
              if (!from || !to) return null;

              const x1 = (from.calculatedX + from.calculatedSize / 2) * CELL_SIZE_PX;
              const y1 = (from.calculatedY + from.calculatedSize / 2) * CELL_SIZE_PX;
              const x2 = (to.calculatedX + to.calculatedSize / 2) * CELL_SIZE_PX;
              const y2 = (to.calculatedY + to.calculatedSize / 2) * CELL_SIZE_PX;

              const distFeet = calculateGridDistanceFeet(
                from.calculatedX,
                from.calculatedY,
                to.calculatedX,
                to.calculatedY,
                config.feetPerSquare,
                config.diagonalRule
              );

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                  <rect
                    x={midX - 25}
                    y={midY - 10}
                    width="50"
                    height="20"
                    rx="4"
                    fill="#18181b"
                    stroke="#ef4444"
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="#fecaca"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {distFeet} ft
                  </text>
                </g>
              );
            })()}

            {/* Tactical Teleportation Range Aura & Target Preview Overlay */}
            {activeTeleportState && activeMover && (() => {
              const cx = (activeMover.calculatedX + activeMover.calculatedSize / 2) * CELL_SIZE_PX;
              const cy = (activeMover.calculatedY + activeMover.calculatedSize / 2) * CELL_SIZE_PX;
              const rangePx = (activeTeleportState.rangeFeet / config.feetPerSquare) * CELL_SIZE_PX;

              const targetCell = hoverCell;
              let targetDistFeet = 0;
              let isValidTarget = false;
              let isBlocked = false;

              if (targetCell) {
                targetDistFeet = calculateGridDistanceFeet(
                  activeMover.calculatedX,
                  activeMover.calculatedY,
                  targetCell.x,
                  targetCell.y,
                  config.feetPerSquare,
                  config.diagonalRule
                );
                isBlocked = isCellImpassable(targetCell.x, targetCell.y, terrainMap, doors);
                isValidTarget = targetDistFeet <= activeTeleportState.rangeFeet && !isBlocked;
              }

              return (
                <g className="pointer-events-none">
                  {/* Teleport Range Aura */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={rangePx}
                    fill="rgba(147, 51, 234, 0.08)"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  {/* Hover Cell Destination Preview */}
                  {targetCell && (
                    <g>
                      {/* Ethereal Tether Line */}
                      <line
                        x1={cx}
                        y1={cy}
                        x2={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        y2={(targetCell.y + 0.5) * CELL_SIZE_PX}
                        stroke={isValidTarget ? '#c084fc' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      {/* Destination Ghost Token */}
                      <rect
                        x={targetCell.x * CELL_SIZE_PX + 4}
                        y={targetCell.y * CELL_SIZE_PX + 4}
                        width={CELL_SIZE_PX - 8}
                        height={CELL_SIZE_PX - 8}
                        rx={8}
                        fill={isValidTarget ? 'rgba(192, 132, 252, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                        stroke={isValidTarget ? '#c084fc' : '#ef4444'}
                        strokeWidth="2"
                      />
                      <text
                        x={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        y={(targetCell.y + 0.5) * CELL_SIZE_PX + 4}
                        textAnchor="middle"
                        fontSize="16"
                      >
                        {isValidTarget ? '✨' : '🚫'}
                      </text>
                      {/* Distance Badge */}
                      <g transform={`translate(${(targetCell.x + 0.5) * CELL_SIZE_PX + 12}, ${(targetCell.y + 0.5) * CELL_SIZE_PX - 15})`}>
                        <rect
                          x="0"
                          y="0"
                          width="120"
                          height="20"
                          rx="4"
                          fill="#18181b"
                          stroke={isValidTarget ? '#c084fc' : '#ef4444'}
                          strokeWidth="1.5"
                        />
                        <text
                          x="60"
                          y="14"
                          textAnchor="middle"
                          fill="#f3e8ff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isBlocked
                            ? 'Blocked Square'
                            : `${targetDistFeet} ft / ${activeTeleportState.rangeFeet} ft`}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })()}

            {/* Tactical Spell Targeting Overlay */}
            {activeSpellTargetingState && activeMover && (() => {
              const cx = (activeMover.calculatedX + activeMover.calculatedSize / 2) * CELL_SIZE_PX;
              const cy = (activeMover.calculatedY + activeMover.calculatedSize / 2) * CELL_SIZE_PX;
              const rangePx = (activeSpellTargetingState.rangeFeet / config.feetPerSquare) * CELL_SIZE_PX;

              const targetCell = hoverCell;
              let targetDistFeet = 0;
              let isWithinSpellRange = false;

              if (targetCell) {
                targetDistFeet = calculateGridDistanceFeet(
                  activeMover.calculatedX,
                  activeMover.calculatedY,
                  targetCell.x,
                  targetCell.y,
                  config.feetPerSquare,
                  config.diagonalRule
                );
                isWithinSpellRange = targetDistFeet <= activeSpellTargetingState.rangeFeet;
              }

              return (
                <g className="pointer-events-none">
                  {/* Maximum Spell Range Boundary */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={rangePx}
                    fill="rgba(225, 29, 72, 0.05)"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="8 6"
                  />
                  {/* Targeting cursor line */}
                  {targetCell && (
                    <g>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        y2={(targetCell.y + 0.5) * CELL_SIZE_PX}
                        stroke={isWithinSpellRange ? '#fb7185' : '#ef4444'}
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                      {/* Crosshair reticle on cursor */}
                      <circle
                        cx={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        cy={(targetCell.y + 0.5) * CELL_SIZE_PX}
                        r="14"
                        fill="none"
                        stroke={isWithinSpellRange ? '#fb7185' : '#ef4444'}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={(targetCell.x + 0.5) * CELL_SIZE_PX - 18}
                        y1={(targetCell.y + 0.5) * CELL_SIZE_PX}
                        x2={(targetCell.x + 0.5) * CELL_SIZE_PX + 18}
                        y2={(targetCell.y + 0.5) * CELL_SIZE_PX}
                        stroke={isWithinSpellRange ? '#fb7185' : '#ef4444'}
                        strokeWidth="1.5"
                      />
                      <line
                        x1={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        y1={(targetCell.y + 0.5) * CELL_SIZE_PX - 18}
                        x2={(targetCell.x + 0.5) * CELL_SIZE_PX}
                        y2={(targetCell.y + 0.5) * CELL_SIZE_PX + 18}
                        stroke={isWithinSpellRange ? '#fb7185' : '#ef4444'}
                        strokeWidth="1.5"
                      />
                      {/* Distance Pill */}
                      <g transform={`translate(${(targetCell.x + 0.5) * CELL_SIZE_PX + 16}, ${(targetCell.y + 0.5) * CELL_SIZE_PX - 15})`}>
                        <rect
                          x="0"
                          y="0"
                          width="120"
                          height="20"
                          rx="4"
                          fill="#18181b"
                          stroke={isWithinSpellRange ? '#fb7185' : '#ef4444'}
                          strokeWidth="1"
                        />
                        <text
                          x="60"
                          y="14"
                          textAnchor="middle"
                          fill="#ffe4e6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {targetDistFeet} ft {isWithinSpellRange ? `(In Range)` : `(Out of Range)`}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })()}

            {/* Phase 2: Dragging Path Line & Distance Tooltip */}
            {draggedCombatantId && dragHoverCell && (() => {
              const mover = positionedCombatants.find((c) => c.id === draggedCombatantId);
              if (!mover) return null;

              const x1 = (mover.calculatedX + mover.calculatedSize / 2) * CELL_SIZE_PX;
              const y1 = (mover.calculatedY + mover.calculatedSize / 2) * CELL_SIZE_PX;
              const x2 = (dragHoverCell.x + 0.5) * CELL_SIZE_PX;
              const y2 = (dragHoverCell.y + 0.5) * CELL_SIZE_PX;

              const remaining = mover.calculatedRemainingSpeed;
              const baseSpeed = mover.calculatedBaseSpeed;
              const dashBudget = remaining + (mover.hasDashed ? 0 : baseSpeed);

              const isDmFree = isDm && dmFreeMoveEnabled;
              const isBlocked = !isDmFree && dragPathCost && !dragPathCost.isPassable;
              const isWithinDirect = isDmFree || dragDistance <= remaining;
              const isWithinDash = isDmFree || dragDistance <= dashBudget;

              const strokeColor = isBlocked
                ? '#ef4444'
                : isDmFree
                ? '#f59e0b'
                : isWithinDirect
                ? '#10b981'
                : isWithinDash
                ? '#f59e0b'
                : '#ef4444';

              const badgeText = isBlocked
                ? `🚫 Blocked (${dragPathCost?.blockedCell?.reason || 'Barrier'})`
                : isDmFree
                ? `👑 Free (${dragDistance} ft)`
                : isWithinDirect
                ? `${dragDistance} ft (${remaining - dragDistance} left)`
                : isWithinDash
                ? `${dragDistance} ft (Dash)`
                : `⚠️ ${dragDistance} ft (Exceeds ${remaining}ft)`;

              return (
                <g>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                  <circle cx={x2} cy={y2} r="5" fill={strokeColor} />
                  {/* Floating Distance Badge */}
                  <g transform={`translate(${x2 + 10}, ${y2 - 20})`}>
                    <rect
                      x="0"
                      y="0"
                      width={isBlocked ? 140 : 130}
                      height="22"
                      rx="5"
                      fill="#1c1917"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      className="shadow-xl"
                    />
                    <text
                      x={isBlocked ? 70 : 65}
                      y="14"
                      textAnchor="middle"
                      fill="#f5f5f4"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {badgeText}
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Phase 2: Planned Movement Waypoint Path */}
            {activeMover && activePathWaypoints.length >= 2 && (() => {
              const remaining = activeMover.calculatedRemainingSpeed;
              const dashBudget = remaining + (activeMover.hasDashed ? 0 : activeMover.calculatedBaseSpeed);

              const isDirect = activePathDistance <= remaining;
              const isDash = activePathDistance <= dashBudget;
              const pathColor = isDirect ? '#10b981' : isDash ? '#f59e0b' : '#ef4444';

              // Build points string for polyline
              const pointsStr = activePathWaypoints
                .map((pt) => `${(pt.x + 0.5) * CELL_SIZE_PX},${(pt.y + 0.5) * CELL_SIZE_PX}`)
                .join(' ');

              return (
                <g>
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke={pathColor}
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />

                  {/* Waypoint Knots along path */}
                  {activePathWaypoints.map((pt, idx) => {
                    const cx = (pt.x + 0.5) * CELL_SIZE_PX;
                    const cy = (pt.y + 0.5) * CELL_SIZE_PX;
                    const isEndpoint = idx === activePathWaypoints.length - 1;
                    const isStart = idx === 0;

                    if (isStart) return null;

                    // Calculate distance up to this point
                    const subPath = activePathWaypoints.slice(0, idx + 1);
                    const subDist = calculatePathDistanceFeet(subPath, config.feetPerSquare, config.diagonalRule);

                    return (
                      <g key={`wpt-${idx}`}>
                        <circle cx={cx} cy={cy} r={isEndpoint ? 7 : 4} fill={pathColor} stroke="#0c0a09" strokeWidth="1.5" />
                        <rect
                          x={cx - 18}
                          y={cy - 20}
                          width="36"
                          height="14"
                          rx="3"
                          fill="#1c1917"
                          stroke={pathColor}
                          strokeWidth="1"
                        />
                        <text
                          x={cx}
                          y={cy - 9}
                          textAnchor="middle"
                          fill="#fafaf9"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {subDist} ft
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {/* Grid Coordinates Label */}
            {config.showCoordinates && (
              <g className="pointer-events-none opacity-40">
                {Array.from({ length: config.gridColumns }).map((_, cIdx) => (
                  <text
                    key={`col-${cIdx}`}
                    x={cIdx * CELL_SIZE_PX + 4}
                    y={12}
                    fontSize="9"
                    fill="#a8a29e"
                    fontFamily="monospace"
                  >
                    {String.fromCharCode(65 + (cIdx % 26))}
                  </text>
                ))}
                {Array.from({ length: config.gridRows }).map((_, rIdx) => (
                  <text
                    key={`row-${rIdx}`}
                    x={4}
                    y={rIdx * CELL_SIZE_PX + 12}
                    fontSize="9"
                    fill="#a8a29e"
                    fontFamily="monospace"
                  >
                    {rIdx + 1}
                  </text>
                ))}
              </g>
            )}

            {/* Phase 4: Spell AoE Template & Ruler Layer */}
            <AoETemplateLayer
              template={currentAoETemplate}
              cellSizePx={CELL_SIZE_PX}
              feetPerSquare={config.feetPerSquare}
              caughtCombatants={aoeCaughtCombatants}
              isRulerActive={isRulerActive}
              rulerOrigin={rulerOrigin}
              hoverCell={hoverCell}
              diagonalRule={config.diagonalRule}
              terrainMap={terrainMap}
              doors={doors}
              onUpdateTemplate={handleUpdateAoEInternal}
              onClearRuler={() => {
                setIsRulerActive(false);
                setRulerOrigin(null);
              }}
              onClearAoE={() => handleUpdateAoEInternal(null)}
            />

            {/* Phase 4: Fog of War Layer */}
            <FogOfWarLayer
              gridColumns={config.gridColumns}
              gridRows={config.gridRows}
              cellSizePx={CELL_SIZE_PX}
              fogOfWar={currentFogOfWar}
              useFogOfWar={currentUseFogOfWar}
              viewMode={fogViewMode}
              boxStartCell={fogBoxStartCell}
              hoverCell={hoverCell}
              activeFogTool={activeFogTool}
              isEditingFog={isFogEditorOpen}
            />
          </svg>

          {/* Invisible Drop Grid Cells for Token Positioning, Waypoints, Terrain, and Fog */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${config.gridColumns}, ${CELL_SIZE_PX}px)`,
              gridTemplateRows: `repeat(${config.gridRows}, ${CELL_SIZE_PX}px)`
            }}
          >
            {Array.from({ length: config.gridRows }).map((_, row) =>
              Array.from({ length: config.gridColumns }).map((_, col) => {
                const isDoorCell = terrainMap[`${col},${row}`] === 'door';
                return (
                  <div
                    key={`${col}-${row}`}
                    onClick={(e) => handleCellClick(col, row, e)}
                    onMouseDown={(e) => handleCellMouseDown(col, row, e)}
                    onMouseEnter={() => handleCellMouseEnter(col, row)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => handleCellDrop(col, row, e)}
                    className={`w-full h-full ${
                      isTerrainEditorOpen && isDm
                        ? activeTerrainTool === 'eraser'
                          ? 'cursor-pointer hover:bg-rose-500/20'
                          : 'cursor-crosshair hover:bg-amber-500/20'
                        : isFogEditorOpen && isDm
                        ? activeFogTool.startsWith('reveal')
                          ? 'cursor-crosshair hover:bg-emerald-500/25'
                          : 'cursor-crosshair hover:bg-purple-500/25'
                        : isRulerActive
                        ? 'cursor-crosshair hover:bg-indigo-500/20'
                        : isAoEEditorOpen && currentAoETemplate && !currentAoETemplate.isLocked
                        ? 'cursor-crosshair hover:bg-rose-500/20'
                        : isDoorCell
                        ? 'cursor-pointer hover:bg-amber-500/15'
                        : isMovePlanning
                        ? 'cursor-crosshair hover:bg-emerald-500/10'
                        : isPanning
                        ? 'cursor-grabbing'
                        : isSpacePressed
                        ? 'cursor-grab'
                        : 'cursor-grab hover:bg-white/[0.02]'
                    }`}
                  />
                );
              })
            )}
          </div>

          {/* Render All Combatant Tokens */}
          {positionedCombatants.map((c) => {
            // Phase 4: Fog of War Visibility Check
            const isVisibleInFog = isCombatantVisibleInFog(
              c,
              currentFogOfWar,
              currentUseFogOfWar,
              isDm,
              fogViewMode
            );

            // In player view or non-DM, tokens hidden in fog are completely omitted
            if (!isVisibleInFog) return null;

            // In DM view, if token is hidden from players, show a dimmed shrouded indicator
            const isShroudedFromPlayers =
              currentUseFogOfWar &&
              !isCombatantVisibleInFog(c, currentFogOfWar, currentUseFogOfWar, false, 'player');

            // Phase 4: Check if caught inside active AoE shape
            const isCaughtInAoE = aoeCaughtCombatants.some((target) => target.id === c.id);

            const isActive = activeCombatant?.id === c.id;
            const isSelected = selectedCombatantId === c.id;
            const isTarget = targetCombatantId === c.id;
            const isDefeated = c.hpCurrent <= 0 || c.isDefeated;
            const isAlly = c.type === 'player' || c.type === 'ally';

            const tokenPixelSize = c.calculatedSize * CELL_SIZE_PX;
            const leftPx = c.calculatedX * CELL_SIZE_PX;
            const topPx = c.calculatedY * CELL_SIZE_PX;

            const hpPercent = Math.max(0, Math.min(100, Math.round((c.hpCurrent / Math.max(1, c.hpMax)) * 100)));
            const canControl = isDm || c.controlledBy === currentUserId || c.isPlayerChar;

            return (
              <div
                key={c.id}
                data-token-draggable="true"
                draggable={canControl && !isDefeated}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    e.stopPropagation();
                    setIsPanning(false);
                    hasDraggedRef.current = false;
                  }
                }}
                onDragStart={(e) => handleTokenDragStart(e, c.id)}
                onDragEnd={handleTokenDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.shiftKey) {
                    // Shift-click sets as target
                    if (onSetTargetCombatant) {
                      onSetTargetCombatant(targetCombatantId === c.id ? null : c.id);
                    }
                  } else {
                    // Regular click selects token
                    if (onSelectCombatant) {
                      onSelectCombatant(selectedCombatantId === c.id ? null : c.id);
                    }
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ combatant: c, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={() => setHoveredCombatantId(c.id)}
                onMouseLeave={() => setHoveredCombatantId(null)}
                className={`absolute transition-transform duration-100 flex flex-col items-center justify-center cursor-pointer group ${
                  canControl ? 'cursor-grab active:cursor-grabbing' : ''
                } ${isShroudedFromPlayers ? 'opacity-70' : ''}`}
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  width: `${tokenPixelSize}px`,
                  height: `${tokenPixelSize}px`,
                  zIndex: isActive ? 40 : isSelected ? 35 : isTarget ? 30 : 20
                }}
                title={`${c.name} (HP: ${c.hpCurrent}/${c.hpMax}, AC: ${c.armorClass}, Speed: ${c.calculatedRemainingSpeed}/${c.calculatedBaseSpeed}ft)\n${
                  isShroudedFromPlayers ? '[Hidden from Players in Fog]\n' : ''
                }${isCaughtInAoE ? '[Inside Active AoE Blast Area]\n' : ''}Drag to move. Click to select. Shift-click to target. Right-click for options.`}
              >
                {/* DM / Controller Quick Bench Button on hover or select */}
                {canControl && (hoveredCombatantId === c.id || isSelected) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCombatantFromMap?.(c.id);
                      if (selectedCombatantId === c.id) onSelectCombatant?.(null);
                    }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-stone-900 hover:bg-rose-600 border border-stone-600 hover:border-rose-400 text-stone-300 hover:text-white flex items-center justify-center text-[10px] shadow-lg z-50 transition"
                    title={`Bench ${c.name} (Move to reserve staging tray)`}
                  >
                    ✕
                  </button>
                )}
                {/* Active Turn Ping Glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-amber-500/30 -z-10" />
                )}

                {/* AoE Caught Blast Ring */}
                {isCaughtInAoE && (
                  <div className="absolute -inset-1 rounded-full animate-pulse border-2 border-rose-500 shadow-lg shadow-rose-500/50 -z-10" />
                )}

                {/* Token Circular Border & Portrait Container */}
                <div
                  className={`relative rounded-full p-0.5 shadow-xl transition-all ${
                    isCaughtInAoE
                      ? 'ring-4 ring-rose-500 shadow-rose-500/80 scale-105'
                      : isActive
                      ? 'ring-4 ring-amber-400 shadow-amber-500/50 scale-105'
                      : isSelected
                      ? 'ring-4 ring-sky-400 shadow-sky-500/50 scale-105'
                      : isTarget
                      ? 'ring-4 ring-rose-500 shadow-rose-500/50 scale-105'
                      : isAlly
                      ? 'ring-2 ring-emerald-500/80 hover:ring-emerald-400'
                      : 'ring-2 ring-rose-500/80 hover:ring-rose-400'
                  } ${isDefeated ? 'opacity-40 grayscale' : ''}`}
                  style={{
                    width: `${tokenPixelSize - 4}px`,
                    height: `${tokenPixelSize - 4}px`
                  }}
                >
                  <img
                    src={
                      c.portraitUrl && !c.portraitUrl.includes('raw.githubusercontent.com')
                        ? c.portraitUrl
                        : generateMonsterSvgPortrait(c.name)
                    }
                    alt=""
                    className="w-full h-full rounded-full object-cover bg-stone-900"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = generateMonsterSvgPortrait(c?.name);
                    }}
                  />

                  {/* Shrouded from Players Eye Badge (DM view) */}
                  {isShroudedFromPlayers && (
                    <div
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-[9px] text-purple-200 shadow font-bold"
                      title="Hidden from players in Fog of War"
                    >
                      👁️
                    </div>
                  )}

                  {/* Defeated Skull Overlay */}
                  {isDefeated && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-rose-400 font-bold text-xs">
                      ☠️
                    </div>
                  )}

                  {/* Concentrating Indicator */}
                  {c.isConcentrating && !isDefeated && (
                    <div
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-[9px] text-purple-200 shadow font-bold"
                      title="Concentrating on a spell"
                    >
                      C
                    </div>
                  )}

                  {/* Elevation Indicator if Flying / Elevated */}
                  {c.elevationFeet && c.elevationFeet !== 0 && (
                    <div
                      className="absolute -top-1 -left-1 px-1 py-0.2 bg-sky-950 border border-sky-400 text-sky-200 rounded text-[8px] font-mono font-bold flex items-center shadow"
                      title={`Elevation: ${c.elevationFeet} ft`}
                    >
                      ✈️{c.elevationFeet > 0 ? `+${c.elevationFeet}` : c.elevationFeet}
                    </div>
                  )}

                  {/* Mounted Saddle Indicator */}
                  {c.mountedOnId && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-950/95 border border-amber-400 text-amber-300 rounded-full text-[8px] font-mono font-bold flex items-center gap-0.5 shadow-lg z-30 pointer-events-none"
                      title={`Mounted on ${combatants.find((m) => m.id === c.mountedOnId)?.name || 'Mount'}`}
                    >
                      <span>🐎</span>
                      <span className="max-w-[50px] truncate">{combatants.find((m) => m.id === c.mountedOnId)?.name || 'Mounted'}</span>
                    </div>
                  )}

                  {/* Carrying Riders Indicator on Mount */}
                  {combatants.some((r) => r.mountedOnId === c.id) && (
                    <div
                      className="absolute -top-2 right-0 px-1.5 py-0.2 bg-amber-900 border border-amber-300 text-amber-200 rounded-full text-[8px] font-mono font-bold flex items-center gap-0.5 shadow z-30"
                      title={`Mount carrying: ${combatants.filter((r) => r.mountedOnId === c.id).map((r) => r.name).join(', ')}`}
                    >
                      <span>🏇</span>
                      <span>{combatants.filter((r) => r.mountedOnId === c.id).length}</span>
                    </div>
                  )}

                  {/* Designated Steed Badge */}
                  {c.isMount && !c.mountedOnId && (
                    <div
                      className="absolute top-0 -left-1 px-1 py-0.2 bg-stone-900/90 border border-amber-500/70 text-amber-400 rounded text-[8px] font-mono font-bold flex items-center shadow"
                      title="Designated Steed / Mount"
                    >
                      🐎
                    </div>
                  )}

                  {/* AC Badge */}
                  <div
                    className="absolute -bottom-1 -left-1 px-1 h-3.5 bg-stone-900 border border-stone-700 rounded text-[9px] font-mono font-bold text-stone-200 flex items-center shadow"
                    title={`Armor Class: ${c.armorClass}`}
                  >
                    🛡️{c.armorClass}
                  </div>

                  {/* Mini HP Bar under token */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4/5 h-1.5 bg-stone-950/90 rounded-full border border-stone-800 overflow-hidden shadow">
                    <div
                      className={`h-full transition-all duration-200 ${
                        hpPercent > 50
                          ? 'bg-emerald-500'
                          : hpPercent > 20
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Token Floating Name Label on Hover or Active */}
                {(isActive || isSelected || hoveredCombatantId === c.id) && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-950/95 border border-stone-700 rounded text-[10px] font-mono font-bold text-stone-100 whitespace-nowrap shadow-lg pointer-events-none z-50 flex items-center gap-1.5">
                    <span>{c.name}</span>
                    <span className="text-amber-400">({c.hpCurrent}/{c.hpMax} HP)</span>
                    <span className="text-emerald-400 font-normal">🏃 {c.calculatedRemainingSpeed}ft</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase 4: LoS Ruler Active Floating Bar */}
        {(isRulerActive || rulerOrigin) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-950/95 border border-indigo-500/70 rounded-xl px-3.5 py-1.5 shadow-2xl z-30 flex items-center gap-3 backdrop-blur-md animate-fadeIn">
            <Compass className="w-4 h-4 text-indigo-400" />
            <div className="text-xs font-mono text-indigo-200">
              {rulerOrigin ? (
                <span>
                  LoS measuring from <strong className="text-white">({rulerOrigin.x + 1}, {rulerOrigin.y + 1})</strong> • Hover cell for cover analysis
                </span>
              ) : (
                <span>Click any cell to set origin point for Line of Sight Ruler</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRulerActive(false);
                setRulerOrigin(null);
              }}
              className="px-2 py-0.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded text-xs font-bold border border-indigo-700 transition"
              title="Remove Line of Sight Ruler"
            >
              Clear LoS ✕
            </button>
          </div>
        )}

        {/* Phase 2: Floating Waypoint Action Bar when in Move Mode */}
        {isMovePlanning && activeMover && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-stone-950/95 border border-emerald-500/70 rounded-xl px-3.5 py-2 shadow-2xl z-30 flex items-center gap-3 animate-fadeIn backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>Planning Path: {activeMover.name}</span>
                  <span className="text-stone-400 font-normal">({activeMover.calculatedRemainingSpeed} ft remaining)</span>
                </div>
                <div className="text-xs font-mono font-bold text-stone-100 flex items-center gap-2">
                  <span>
                    Distance: <strong className={activePathDistance <= activeMover.calculatedRemainingSpeed ? 'text-emerald-400' : 'text-amber-400'}>{activePathDistance} ft</strong>
                  </span>
                  {activePathDistance > activeMover.calculatedRemainingSpeed && (
                    <span className="text-amber-400 text-[10px]">⚡ Requires Dash action</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-l border-stone-800 pl-3">
              <button
                type="button"
                onClick={handleConfirmMove}
                disabled={activePathWaypoints.length < 2}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition shadow ${
                  activePathWaypoints.length >= 2
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
                title="Confirm Move (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Move</span>
              </button>
              <button
                type="button"
                onClick={handleCancelMovePlanning}
                className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition"
                title="Cancel Move (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Active Combatant Movement HUD (Bottom-Left) */}
        {activeMover && canControlActiveMover && (
          <div className="absolute bottom-3 left-3 bg-stone-950/95 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-300 flex items-center gap-3 shadow-2xl z-20 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-stone-700 overflow-hidden shrink-0 bg-stone-900 flex items-center justify-center">
                <img
                  src={
                    activeMover.portraitUrl && !activeMover.portraitUrl.includes('raw.githubusercontent.com')
                      ? activeMover.portraitUrl
                      : generateMonsterSvgPortrait(activeMover.name)
                  }
                  alt=""
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = generateMonsterSvgPortrait(activeMover.name);
                  }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-sans flex items-center gap-1">
                  <span>{activeMover.name}</span>
                  {activeMover.hasDashed && (
                    <span className="text-amber-400 font-bold text-[9px] bg-amber-950/80 px-1 rounded border border-amber-800">
                      DASHED
                    </span>
                  )}
                  {activeMover.mountedOnId && (
                    <span className="text-amber-300 font-bold text-[9px] bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-700">
                      🐎 Mounted
                    </span>
                  )}
                  {combatants.some((r) => r.mountedOnId === activeMover.id) && (
                    <span className="text-amber-300 font-bold text-[9px] bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-700">
                      🏇 Carrying Rider
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                  <span className="text-emerald-400">{activeMover.calculatedRemainingSpeed} ft</span>
                  <span className="text-stone-500">/</span>
                  <span className="text-stone-400">{activeMover.calculatedBaseSpeed} ft speed</span>
                  {activeMover.mountedOnId && (
                    <span className="text-[10px] text-amber-400 font-normal">
                      (using {combatants.find((m) => m.id === activeMover.mountedOnId)?.name || 'mount'}'s speed)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mount & Dismount Controls */}
            {activeMover.mountedOnId && onDismountCombatant && (
              <div className="flex items-center border-l border-stone-800 pl-2">
                <button
                  type="button"
                  onClick={() => onDismountCombatant(activeMover.id)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/60 shadow transition"
                  title="Dismount from your steed into an adjacent space"
                >
                  <span>🐎 Dismount</span>
                </button>
              </div>
            )}

            {combatants.some((r) => r.mountedOnId === activeMover.id) && onDismountCombatant && (
              <div className="flex items-center border-l border-stone-800 pl-2">
                <button
                  type="button"
                  onClick={() => {
                    const rider = combatants.find((r) => r.mountedOnId === activeMover.id);
                    if (rider) onDismountCombatant(rider.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/60 shadow transition"
                  title="Dismount rider"
                >
                  <span>🐎 Dismount Rider</span>
                </button>
              </div>
            )}

            {!activeMover.mountedOnId && onMountCombatant && (() => {
              const adjacentMount = combatants.find((m) => {
                if (m.id === activeMover.id || m.isOnMap === false) return false;
                const isEligible = m.isMount || (m.tokenSize && m.tokenSize >= 2) || (m.speed && m.speed >= 40);
                if (!isEligible) return false;
                const dist = calculateGridDistanceFeet(
                  activeMover.calculatedX,
                  activeMover.calculatedY,
                  m.mapX ?? 0,
                  m.mapY ?? 0,
                  config.feetPerSquare,
                  config.diagonalRule
                );
                return dist <= 5 * (m.tokenSize || 1);
              });
              if (!adjacentMount) return null;
              return (
                <div className="flex items-center border-l border-stone-800 pl-2">
                  <button
                    type="button"
                    onClick={() => onMountCombatant(activeMover.id, adjacentMount.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 shadow transition"
                    title={`Mount ${adjacentMount.name}`}
                  >
                    <span>🐎 Mount {adjacentMount.name}</span>
                  </button>
                </div>
              );
            })()}

            {/* Dash & Reset Buttons */}
            <div className="flex items-center gap-1 border-l border-stone-800 pl-2">
              {onDashCombatant && (
                <button
                  type="button"
                  onClick={() => onDashCombatant(activeMover.id)}
                  disabled={activeMover.hasDashed && !isDm}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded transition ${
                    activeMover.hasDashed
                      ? 'bg-stone-900 text-stone-500 cursor-not-allowed border border-stone-800'
                      : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 shadow'
                  }`}
                  title="Dash action grants additional movement equal to speed for this turn"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Dash (+{activeMover.calculatedBaseSpeed}ft)</span>
                </button>
              )}

              {onResetMovement && (
                <button
                  type="button"
                  onClick={() => onResetMovement(activeMover.id)}
                  className="p-1 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded transition border border-stone-800"
                  title="Reset Movement Budget for this turn"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected / Target Combatant Info Card in Bottom-Right */}
        {(selectedCombatantId || targetCombatantId) && (
          <div className="absolute bottom-3 right-3 bg-stone-950/95 border border-stone-800 rounded-xl p-2.5 shadow-2xl z-20 flex items-center gap-3 animate-fadeIn backdrop-blur-md">
            {selectedCombatantId && (() => {
              const sel = positionedCombatants.find((c) => c.id === selectedCombatantId);
              if (!sel) return null;
              return (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-400 overflow-hidden shrink-0 bg-stone-900 flex items-center justify-center">
                    <img
                      src={
                        sel.portraitUrl && !sel.portraitUrl.includes('raw.githubusercontent.com')
                          ? sel.portraitUrl
                          : generateMonsterSvgPortrait(sel.name)
                      }
                      alt=""
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = generateMonsterSvgPortrait(sel.name);
                      }}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-sky-400 font-bold uppercase">Selected Token</div>
                    <div className="text-xs font-bold text-stone-100 flex items-center gap-1">
                      <span>{sel.name}</span>
                      <span className="text-[10px] text-stone-400">({sel.calculatedRemainingSpeed}ft left)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedCombatantId && targetCombatantId && (
              <span className="text-stone-600 font-bold">➔</span>
            )}

            {targetCombatantId && (() => {
              const tgt = positionedCombatants.find((c) => c.id === targetCombatantId);
              if (!tgt) return null;
              return (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500 overflow-hidden shrink-0 bg-stone-900 flex items-center justify-center">
                    <img
                      src={
                        tgt.portraitUrl && !tgt.portraitUrl.includes('raw.githubusercontent.com')
                          ? tgt.portraitUrl
                          : generateMonsterSvgPortrait(tgt.name)
                      }
                      alt=""
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = generateMonsterSvgPortrait(tgt.name);
                      }}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-400 font-bold uppercase">Targeted</div>
                    <div className="text-xs font-bold text-stone-100">{tgt.name}</div>
                  </div>
                </div>
              );
            })()}

            {selectedCombatantId && (
              <button
                type="button"
                onClick={() => {
                  onRemoveCombatantFromMap?.(selectedCombatantId);
                  onSelectCombatant?.(null);
                }}
                className="px-2 py-1 bg-stone-900 hover:bg-rose-950/80 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-600 rounded text-[11px] font-bold transition flex items-center gap-1"
                title="Remove token from map and move back to reserve tray"
              >
                <span>Bench</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onSelectCombatant) onSelectCombatant(null);
                if (onSetTargetCombatant) onSetTargetCombatant(null);
                setIsMovePlanning(false);
                setMoveWaypoints([]);
              }}
              className="ml-1 text-stone-500 hover:text-stone-300 text-xs px-1.5 py-0.5 rounded hover:bg-stone-800"
              title="Clear selection"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Context Menu for Token */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-stone-900/95 border border-stone-700 shadow-2xl rounded-xl py-1.5 min-w-[200px] text-xs text-stone-200 backdrop-blur-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-stone-800 font-bold flex items-center gap-2">
            <span className="truncate">{contextMenu.combatant.name}</span>
            <span className="text-[10px] text-stone-400 font-mono">({contextMenu.combatant.hpCurrent}/{contextMenu.combatant.hpMax} HP)</span>
          </div>

          <button
            type="button"
            onClick={() => {
              handleCenterOnCombatant(contextMenu.combatant.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-amber-400 flex items-center gap-2 transition"
          >
            <Eye className="w-3.5 h-3.5 text-stone-400" />
            <span>Center Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectCombatant?.(contextMenu.combatant.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-sky-400 flex items-center gap-2 transition"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Token</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSetTargetCombatant?.(contextMenu.combatant.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-rose-400 flex items-center gap-2 transition"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>Target Token</span>
          </button>

          {/* Mount Actions */}
          {contextMenu.combatant.mountedOnId && onDismountCombatant && (
            <button
              type="button"
              onClick={() => {
                onDismountCombatant(contextMenu.combatant.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-950/80 hover:text-amber-300 flex items-center gap-2 transition text-amber-400 font-medium"
            >
              <span>🐎 Dismount from Steed</span>
            </button>
          )}

          {combatants.some((r) => r.mountedOnId === contextMenu.combatant.id) && onDismountCombatant && (
            <button
              type="button"
              onClick={() => {
                const riders = combatants.filter((r) => r.mountedOnId === contextMenu.combatant.id);
                riders.forEach((r) => onDismountCombatant(r.id));
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-950/80 hover:text-amber-300 flex items-center gap-2 transition text-amber-400 font-medium"
            >
              <span>🐎 Dismount Rider</span>
            </button>
          )}

          {selectedCombatantId && selectedCombatantId !== contextMenu.combatant.id && onMountCombatant && (
            <button
              type="button"
              onClick={() => {
                onMountCombatant(selectedCombatantId, contextMenu.combatant.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-emerald-950/80 hover:text-emerald-300 flex items-center gap-2 transition text-emerald-400 font-medium"
            >
              <span>🐎 Mount on {contextMenu.combatant.name}</span>
            </button>
          )}

          {onToggleMountRole && (
            <button
              type="button"
              onClick={() => {
                onToggleMountRole(contextMenu.combatant.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-amber-300 flex items-center gap-2 transition text-stone-300"
            >
              <span>🐎 {contextMenu.combatant.isMount ? 'Remove Steed Role' : 'Designate as Steed / Mount'}</span>
            </button>
          )}

          <div className="h-px bg-stone-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onRemoveCombatantFromMap?.(contextMenu.combatant.id);
              if (selectedCombatantId === contextMenu.combatant.id) onSelectCombatant?.(null);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-amber-300 flex items-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Bench to Reserve Tray</span>
          </button>

          {isDm && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove ${contextMenu.combatant.name} from encounter entirely?`)) {
                  onRemoveCombatant?.(contextMenu.combatant.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-rose-950/70 hover:text-rose-300 flex items-center gap-2 transition text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete from Encounter</span>
            </button>
          )}

          <div className="h-px bg-stone-800 my-1" />

          <button
            type="button"
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-3 py-1 text-stone-500 hover:text-stone-300 transition text-[11px]"
          >
            Close
          </button>
        </div>
      )}

      {/* Reset Battlemap Modal */}
      <ResetBattlemapModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onFullReset={() => {
          setIsRulerActive(false);
          setRulerOrigin(null);
          handleUpdateAoEInternal(null);
          setLocalFogOfWar({});
          setLocalUseFogOfWar(true);
          handleResetView();
          onSelectCombatant?.(null);
          onSetTargetCombatant?.(null);

          if (onResetBattlemap) {
            onResetBattlemap({
              clearTerrain: true,
              clearDoors: true,
              resetFog: 'shroud',
              resetTokens: 'spawn_points',
              clearAoE: true,
              gridColumns: config.gridColumns,
              gridRows: config.gridRows
            });
          } else {
            onClearAllTerrain?.();
            onResetMapTokens?.('spawn_points');
            onUpdateFogOfWar?.({}, true);
            onUpdateAoE?.(null);
          }
        }}
        onResetSpawnPoints={() => {
          if (onResetBattlemap) {
            onResetBattlemap({
              resetTokens: 'spawn_points',
              gridColumns: config.gridColumns,
              gridRows: config.gridRows
            });
          } else {
            onResetMapTokens?.('spawn_points');
          }
        }}
        onRecallAllToReserve={() => {
          onSelectCombatant?.(null);
          onSetTargetCombatant?.(null);
          if (onResetBattlemap) {
            onResetBattlemap({ resetTokens: 'recall_all' });
          } else {
            onResetMapTokens?.('recall_all');
          }
        }}
        onClearTerrain={() => {
          if (onResetBattlemap) {
            onResetBattlemap({ clearTerrain: true, clearDoors: true });
          } else {
            handleClearAllTerrainInternal();
          }
        }}
        onClearOverlays={() => {
          setIsRulerActive(false);
          setRulerOrigin(null);
          handleUpdateAoEInternal(null);
          if (onResetBattlemap) {
            onResetBattlemap({ clearAoE: true });
          } else {
            onUpdateAoE?.(null);
          }
        }}
        onResetFog={(mode) => {
          if (mode === 'shroud') {
            setLocalFogOfWar({});
            setLocalUseFogOfWar(true);
          } else {
            setLocalUseFogOfWar(false);
          }
          if (onResetBattlemap) {
            onResetBattlemap({ resetFog: mode });
          } else {
            if (mode === 'shroud') handleShroudAllFog();
            else handleRevealAllFog();
          }
        }}
        onOpenLayouts={() => setShowLayoutsModal(true)}
      />

      {/* Battlemap Layouts (Save / Load / Pre-builds) Modal */}
      <BattlemapLayoutsModal
        isOpen={showLayoutsModal}
        onClose={() => setShowLayoutsModal(false)}
        currentConfig={config}
        currentTerrain={terrainMap}
        currentDoors={doors}
        currentFogOfWar={currentFogOfWar}
        currentUseFogOfWar={currentUseFogOfWar}
        currentAoE={currentAoETemplate}
        currentCombatants={combatants}
        userId={currentUserId}
        userName={isDm ? 'DM' : 'Player'}
        onApplyLayout={handleApplyLayoutInternal}
      />
    </div>
  );
};
