import React from 'react';
import {
  AoETemplate,
  calculateGridDistanceFeet,
  calculateLineOfSight,
  CoverType,
  TerrainType,
  DoorState,
  DiagonalRule
} from './battlemapTypes';
import { Combatant } from '../combat/encounter/encounterTypes';

interface AoETemplateLayerProps {
  template: AoETemplate | null;
  cellSizePx: number;
  feetPerSquare: number;
  caughtCombatants: Combatant[];
  // Ruler props
  isRulerActive: boolean;
  rulerOrigin: { x: number; y: number } | null;
  hoverCell: { x: number; y: number } | null;
  diagonalRule: DiagonalRule;
  terrainMap: Record<string, TerrainType>;
  doors: Record<string, DoorState>;
  onUpdateTemplate?: (template: AoETemplate) => void;
  onClearRuler?: () => void;
  onClearAoE?: () => void;
}

export const AoETemplateLayer: React.FC<AoETemplateLayerProps> = ({
  template,
  cellSizePx,
  feetPerSquare,
  caughtCombatants,
  isRulerActive,
  rulerOrigin,
  hoverCell,
  diagonalRule,
  terrainMap,
  doors,
  onUpdateTemplate,
  onClearRuler,
  onClearAoE
}) => {
  // SVG Elements for AoE template
  const renderAoE = () => {
    if (!template) return null;

    const originPxX = (template.originX + 0.5) * cellSizePx;
    const originPxY = (template.originY + 0.5) * cellSizePx;
    const radiusPx = (template.radiusFeet / feetPerSquare) * cellSizePx;
    const lengthPx = (template.lengthFeet / feetPerSquare) * cellSizePx;
    const widthPx = ((template.widthFeet || 5) / feetPerSquare) * cellSizePx;

    if (template.shape === 'circle') {
      return (
        <g id="aoe-circle-shape" className="transition-all duration-150">
          {/* Outer glowing border */}
          <circle
            cx={originPxX}
            cy={originPxY}
            r={radiusPx}
            fill={template.color}
            stroke={template.borderColor}
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          {/* Inner accent ring */}
          <circle
            cx={originPxX}
            cy={originPxY}
            r={Math.max(4, radiusPx * 0.4)}
            fill="none"
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Center target crosshair */}
          <circle cx={originPxX} cy={originPxY} r="4" fill={template.borderColor} />
          <line
            x1={originPxX - 10}
            y1={originPxY}
            x2={originPxX + 10}
            y2={originPxY}
            stroke={template.borderColor}
            strokeWidth="1.5"
          />
          <line
            x1={originPxX}
            y1={originPxY - 10}
            x2={originPxX}
            y2={originPxY + 10}
            stroke={template.borderColor}
            strokeWidth="1.5"
          />

          {/* Dimension Label Tag */}
          <rect
            x={originPxX - 35}
            y={originPxY - radiusPx - 20}
            width="70"
            height="18"
            rx="4"
            fill="#18181b"
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x={originPxX}
            y={originPxY - radiusPx - 7}
            textAnchor="middle"
            fill="#fef08a"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {template.name} ({template.radiusFeet}ft)
          </text>
        </g>
      );
    }

    if (template.shape === 'cube') {
      const halfSquares = (template.radiusFeet || template.lengthFeet) / (2 * feetPerSquare);
      const cubeSizePx = ((template.radiusFeet || template.lengthFeet) / feetPerSquare) * cellSizePx;
      const leftPx = originPxX - cubeSizePx / 2;
      const topPx = originPxY - cubeSizePx / 2;

      return (
        <g id="aoe-cube-shape">
          <rect
            x={leftPx}
            y={topPx}
            width={cubeSizePx}
            height={cubeSizePx}
            fill={template.color}
            stroke={template.borderColor}
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
          {/* Grid hashes inside cube */}
          <line
            x1={leftPx}
            y1={topPx + cubeSizePx / 2}
            x2={leftPx + cubeSizePx}
            y2={topPx + cubeSizePx / 2}
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1={leftPx + cubeSizePx / 2}
            y1={topPx}
            x2={leftPx + cubeSizePx / 2}
            y2={topPx + cubeSizePx}
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.4"
          />
          {/* Center dot */}
          <circle cx={originPxX} cy={originPxY} r="3" fill={template.borderColor} />

          {/* Dimension Label */}
          <rect
            x={leftPx + cubeSizePx / 2 - 35}
            y={topPx - 20}
            width="70"
            height="18"
            rx="4"
            fill="#18181b"
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x={leftPx + cubeSizePx / 2}
            y={topPx - 7}
            textAnchor="middle"
            fill="#fef08a"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {template.name} ({template.lengthFeet}ft)
          </text>
        </g>
      );
    }

    if (template.shape === 'cone') {
      // 5e Cone: 53.13 degree angle (+- 26.56 deg) from center line
      const halfAngleRad = (26.56 * Math.PI) / 180;
      const angleRad = (template.angleDegrees * Math.PI) / 180;

      const p1Angle = angleRad - halfAngleRad;
      const p2Angle = angleRad + halfAngleRad;

      const p1X = originPxX + lengthPx * Math.cos(p1Angle);
      const p1Y = originPxY + lengthPx * Math.sin(p1Angle);
      const p2X = originPxX + lengthPx * Math.cos(p2Angle);
      const p2Y = originPxY + lengthPx * Math.sin(p2Angle);

      // Arc path
      const arcSweep = 0; // standard small arc
      const pathD = `M ${originPxX} ${originPxY} L ${p1X} ${p1Y} A ${lengthPx} ${lengthPx} 0 0 1 ${p2X} ${p2Y} Z`;

      // Central directional ray
      const midRayX = originPxX + lengthPx * Math.cos(angleRad);
      const midRayY = originPxY + lengthPx * Math.sin(angleRad);

      return (
        <g id="aoe-cone-shape">
          <path
            d={pathD}
            fill={template.color}
            stroke={template.borderColor}
            strokeWidth="2.5"
            strokeDasharray="6 3"
          />
          {/* Central guidance line */}
          <line
            x1={originPxX}
            y1={originPxY}
            x2={midRayX}
            y2={midRayY}
            stroke={template.borderColor}
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          {/* Origin dot */}
          <circle cx={originPxX} cy={originPxY} r="4" fill={template.borderColor} />

          {/* Directional arrow tip */}
          <circle cx={midRayX} cy={midRayY} r="3" fill="#fef08a" />

          {/* Label tag */}
          <rect
            x={midRayX - 35}
            y={midRayY - 20}
            width="70"
            height="18"
            rx="4"
            fill="#18181b"
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x={midRayX}
            y={midRayY - 7}
            textAnchor="middle"
            fill="#fef08a"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {template.name} ({template.lengthFeet}ft)
          </text>
        </g>
      );
    }

    if (template.shape === 'line') {
      const angleRad = (template.angleDegrees * Math.PI) / 180;
      const dirX = Math.cos(angleRad);
      const dirY = Math.sin(angleRad);
      const perpX = -dirY;
      const perpY = dirX;

      const halfW = widthPx / 2;

      const corner1X = originPxX + perpX * halfW;
      const corner1Y = originPxY + perpY * halfW;

      const corner2X = originPxX - perpX * halfW;
      const corner2Y = originPxY - perpY * halfW;

      const corner3X = corner2X + dirX * lengthPx;
      const corner3Y = corner2Y + dirY * lengthPx;

      const corner4X = corner1X + dirX * lengthPx;
      const corner4Y = corner1Y + dirY * lengthPx;

      const pathD = `M ${corner1X} ${corner1Y} L ${corner2X} ${corner2Y} L ${corner3X} ${corner3Y} L ${corner4X} ${corner4Y} Z`;

      const endCenterX = originPxX + dirX * lengthPx;
      const endCenterY = originPxY + dirY * lengthPx;

      return (
        <g id="aoe-line-shape">
          <path
            d={pathD}
            fill={template.color}
            stroke={template.borderColor}
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />
          {/* Origin and End dots */}
          <circle cx={originPxX} cy={originPxY} r="3.5" fill={template.borderColor} />
          <circle cx={endCenterX} cy={endCenterY} r="3.5" fill="#fef08a" />

          {/* Label tag */}
          <rect
            x={originPxX + (dirX * lengthPx) / 2 - 40}
            y={originPxY + (dirY * lengthPx) / 2 - 20}
            width="80"
            height="18"
            rx="4"
            fill="#18181b"
            stroke={template.borderColor}
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x={originPxX + (dirX * lengthPx) / 2}
            y={originPxY + (dirY * lengthPx) / 2 - 7}
            textAnchor="middle"
            fill="#fef08a"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {template.name} ({template.lengthFeet}x{template.widthFeet || 5}ft)
          </text>
        </g>
      );
    }

    return null;
  };

  // Targeting highlight brackets around caught tokens
  const renderTargetHighlights = () => {
    if (!template || caughtCombatants.length === 0) return null;

    return (
      <g id="aoe-target-highlights" className="pointer-events-none">
        {caughtCombatants.map((target) => {
          const tx = (target.mapX || 0) * cellSizePx;
          const ty = (target.mapY || 0) * cellSizePx;
          const size = (target.tokenSize || 1) * cellSizePx;
          const isEnemy = target.type === 'enemy';

          return (
            <g key={`target-caught-${target.id}`}>
              {/* Target glowing box */}
              <rect
                x={tx + 1}
                y={ty + 1}
                width={size - 2}
                height={size - 2}
                fill={isEnemy ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}
                stroke={isEnemy ? '#ef4444' : '#10b981'}
                strokeWidth="2.5"
                rx="6"
                className="animate-pulse"
              />
              {/* Target Crosshair Corners */}
              <path
                d={`M ${tx + 4} ${ty + 12} L ${tx + 4} ${ty + 4} L ${tx + 12} ${ty + 4}`}
                stroke={isEnemy ? '#f87171' : '#34d399'}
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${tx + size - 12} ${ty + 4} L ${tx + size - 4} ${ty + 4} L ${tx + size - 4} ${ty + 12}`}
                stroke={isEnemy ? '#f87171' : '#34d399'}
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${tx + 4} ${ty + size - 12} L ${tx + 4} ${ty + size - 4} L ${tx + 12} ${ty + size - 4}`}
                stroke={isEnemy ? '#f87171' : '#34d399'}
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${tx + size - 12} ${ty + size - 4} L ${tx + size - 4} ${ty + size - 4} L ${tx + size - 4} ${ty + size - 12}`}
                stroke={isEnemy ? '#f87171' : '#34d399'}
                strokeWidth="2.5"
                fill="none"
              />
              {/* Target caught badge */}
              <rect
                x={tx + size / 2 - 25}
                y={ty - 14}
                width="50"
                height="14"
                rx="3"
                fill="#1c1917"
                stroke={isEnemy ? '#ef4444' : '#10b981'}
                strokeWidth="1"
              />
              <text
                x={tx + size / 2}
                y={ty - 4}
                textAnchor="middle"
                fontSize="8.5"
                fill={isEnemy ? '#fca5a5' : '#86efac'}
                fontWeight="bold"
                fontFamily="monospace"
              >
                TARGET
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Line of Sight and Cover Ruler
  const renderRuler = () => {
    if (!isRulerActive || !rulerOrigin || !hoverCell) return null;
    if (rulerOrigin.x === hoverCell.x && rulerOrigin.y === hoverCell.y) return null;

    const x1Px = (rulerOrigin.x + 0.5) * cellSizePx;
    const y1Px = (rulerOrigin.y + 0.5) * cellSizePx;
    const x2Px = (hoverCell.x + 0.5) * cellSizePx;
    const y2Px = (hoverCell.y + 0.5) * cellSizePx;

    const los = calculateLineOfSight(
      rulerOrigin.x,
      rulerOrigin.y,
      hoverCell.x,
      hoverCell.y,
      feetPerSquare,
      diagonalRule,
      terrainMap,
      doors
    );

    const midX = (x1Px + x2Px) / 2;
    const midY = (y1Px + y2Px) / 2;

    let lineColor = '#06b6d4'; // cyan-500
    let labelText = `${los.distanceFeet} ft • Clear LoS`;
    let labelBg = '#0e7490';

    if (!los.hasLoS) {
      lineColor = '#ef4444'; // rose-500
      labelText = `${los.distanceFeet} ft • Blocked (${los.blockedBy?.label || 'Wall'})`;
      labelBg = '#991b1b';
    } else if (los.cover === 'three_quarters') {
      lineColor = '#818cf8'; // indigo-400
      labelText = `${los.distanceFeet} ft • 3/4 Cover (+5 AC)`;
      labelBg = '#3730a3';
    } else if (los.cover === 'half') {
      lineColor = '#10b981'; // emerald-500
      labelText = `${los.distanceFeet} ft • Half Cover (+2 AC)`;
      labelBg = '#065f46';
    }

    return (
      <g id="tactical-ruler-los">
        {/* Source point dot with click to remove */}
        <circle
          cx={x1Px}
          cy={y1Px}
          r="6"
          fill="#06b6d4"
          stroke="#ffffff"
          strokeWidth="1.5"
          className="cursor-pointer pointer-events-auto hover:fill-rose-500"
          onClick={(e) => {
            e.stopPropagation();
            onClearRuler?.();
          }}
        />

        {/* Ruler Line */}
        <line
          x1={x1Px}
          y1={y1Px}
          x2={x2Px}
          y2={y2Px}
          stroke={lineColor}
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="pointer-events-none"
        />

        {/* Target point crosshair */}
        <circle cx={x2Px} cy={y2Px} r="5" fill={lineColor} stroke="#ffffff" strokeWidth="1.5" className="pointer-events-none" />

        {/* Blocked Point indicator if LoS is interrupted */}
        {los.blockedBy && (
          <g className="pointer-events-none">
            <circle
              cx={(los.blockedBy.x + 0.5) * cellSizePx}
              cy={(los.blockedBy.y + 0.5) * cellSizePx}
              r="7"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={(los.blockedBy.x + 0.5) * cellSizePx}
              y={(los.blockedBy.y + 0.5) * cellSizePx + 3.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
            >
              ✕
            </text>
          </g>
        )}

        {/* Measurement and LoS Badge with interactive remove button */}
        <g
          className="cursor-pointer pointer-events-auto group"
          onClick={(e) => {
            e.stopPropagation();
            onClearRuler?.();
          }}
        >
          <rect
            x={midX - 80}
            y={midY - 14}
            width="160"
            height="26"
            rx="6"
            fill={labelBg}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.95"
            className="shadow-lg hover:brightness-110 transition"
          />
          <text
            x={midX - 10}
            y={midY + 2.5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {labelText}
          </text>
          {/* Explicit red remove button on badge */}
          <rect
            x={midX + 56}
            y={midY - 9}
            width="18"
            height="18"
            rx="4"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="0.8"
            className="hover:fill-rose-700"
          />
          <text
            x={midX + 65}
            y={midY + 3.5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
          >
            ✕
          </text>
        </g>
      </g>
    );
  };

  return (
    <g id="phase-4-aoe-and-ruler-layer">
      {renderAoE()}
      {renderTargetHighlights()}
      {renderRuler()}
    </g>
  );
};
