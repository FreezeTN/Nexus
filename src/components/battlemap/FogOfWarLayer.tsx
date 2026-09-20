import React from 'react';
import { Combatant } from '../combat/encounter/encounterTypes';

interface FogOfWarLayerProps {
  gridColumns: number;
  gridRows: number;
  cellSizePx: number;
  fogOfWar: Record<string, boolean>; // "x,y" => true if revealed
  useFogOfWar: boolean;
  viewMode: 'dm' | 'player';
  boxStartCell: { x: number; y: number } | null;
  hoverCell: { x: number; y: number } | null;
  activeFogTool: 'reveal_brush' | 'shroud_brush' | 'reveal_box' | 'shroud_box';
  isEditingFog: boolean;
}

export const FogOfWarLayer: React.FC<FogOfWarLayerProps> = ({
  gridColumns,
  gridRows,
  cellSizePx,
  fogOfWar,
  useFogOfWar,
  viewMode,
  boxStartCell,
  hoverCell,
  activeFogTool,
  isEditingFog
}) => {
  if (!useFogOfWar) return null;

  const isDmView = viewMode === 'dm';

  // Render fog cells
  const fogTiles: React.ReactNode[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridColumns; c++) {
      const key = `${c},${r}`;
      const isRevealed = Boolean(fogOfWar[key]);

      // If revealed, no fog needed
      if (isRevealed) continue;

      const px = c * cellSizePx;
      const py = r * cellSizePx;

      if (isDmView) {
        // DM view: Translucent dark shroud so DM can see monsters and terrain underneath
        fogTiles.push(
          <g key={`fog-dm-${key}`} className="pointer-events-none">
            <rect
              x={px}
              y={py}
              width={cellSizePx}
              height={cellSizePx}
              fill="rgba(15, 12, 24, 0.65)"
              stroke="rgba(88, 28, 135, 0.25)"
              strokeWidth="0.5"
            />
            {/* Subtle fog icon / hatch */}
            <circle
              cx={px + cellSizePx / 2}
              cy={py + cellSizePx / 2}
              r="2"
              fill="rgba(168, 85, 247, 0.4)"
            />
          </g>
        );
      } else {
        // Player view: Pitch black impenetrable darkness
        fogTiles.push(
          <g key={`fog-player-${key}`} className="pointer-events-none">
            <rect
              x={px}
              y={py}
              width={cellSizePx}
              height={cellSizePx}
              fill="#09090b"
              stroke="#18181b"
              strokeWidth="0.5"
            />
            {/* Subtle misty cloud particle */}
            <path
              d={`M ${px + 10} ${py + cellSizePx / 2} Q ${px + 24} ${py + cellSizePx / 2 - 6} ${px + 38} ${py + cellSizePx / 2}`}
              stroke="rgba(63, 63, 70, 0.25)"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        );
      }
    }
  }

  // Box drag preview for Fog Reveal or Shroud
  const renderBoxPreview = () => {
    if (!isEditingFog || !boxStartCell || !hoverCell) return null;
    if (activeFogTool !== 'reveal_box' && activeFogTool !== 'shroud_box') return null;

    const minX = Math.min(boxStartCell.x, hoverCell.x);
    const maxX = Math.max(boxStartCell.x, hoverCell.x);
    const minY = Math.min(boxStartCell.y, hoverCell.y);
    const maxY = Math.max(boxStartCell.y, hoverCell.y);

    const w = (maxX - minX + 1) * cellSizePx;
    const h = (maxY - minY + 1) * cellSizePx;
    const isReveal = activeFogTool === 'reveal_box';

    return (
      <g className="pointer-events-none">
        <rect
          x={minX * cellSizePx}
          y={minY * cellSizePx}
          width={w}
          height={h}
          fill={isReveal ? 'rgba(234, 179, 8, 0.25)' : 'rgba(147, 51, 234, 0.35)'}
          stroke={isReveal ? '#eab308' : '#a855f7'}
          strokeWidth="2.5"
          strokeDasharray="5 3"
        />
        <rect
          x={minX * cellSizePx + w / 2 - 45}
          y={minY * cellSizePx + h / 2 - 12}
          width="90"
          height="24"
          rx="4"
          fill="#18181b"
          stroke={isReveal ? '#eab308' : '#a855f7'}
          strokeWidth="1"
        />
        <text
          x={minX * cellSizePx + w / 2}
          y={minY * cellSizePx + h / 2 + 4}
          textAnchor="middle"
          fill={isReveal ? '#fde047' : '#d8b4fe'}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isReveal ? 'Reveal' : 'Shroud'} {maxX - minX + 1}x{maxY - minY + 1}
        </text>
      </g>
    );
  };

  return (
    <g id="fog-of-war-layer">
      {fogTiles}
      {renderBoxPreview()}
    </g>
  );
};

/**
 * Determines whether a combatant is visible given Fog of War state
 */
export function isCombatantVisibleInFog(
  combatant: Combatant,
  fogOfWar: Record<string, boolean>,
  useFogOfWar: boolean,
  isDm: boolean,
  viewMode: 'dm' | 'player'
): boolean {
  // If fog of war is off, everyone is visible
  if (!useFogOfWar) return true;

  // Players and Allies are always visible to their own party
  if (combatant.type === 'player' || combatant.type === 'ally') return true;

  // If DM is in DM View, DM can see all monsters (shrouded ones will show with icon)
  if (isDm && viewMode === 'dm') return true;

  // In Player view or non-DM: Check if token's space is revealed
  const tokenSize = combatant.tokenSize || 1;
  const startX = combatant.mapX || 0;
  const startY = combatant.mapY || 0;

  for (let dx = 0; dx < tokenSize; dx++) {
    for (let dy = 0; dy < tokenSize; dy++) {
      const key = `${startX + dx},${startY + dy}`;
      if (fogOfWar[key]) {
        return true; // at least one square is revealed!
      }
    }
  }

  // Entirely shrouded in darkness
  return false;
}
