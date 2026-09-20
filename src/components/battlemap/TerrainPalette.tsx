import React from 'react';
import {
  Paintbrush,
  Square,
  Eraser,
  Trash2,
  Columns,
  DoorClosed,
  Layers,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import {
  TerrainType,
  TERRAIN_DEFINITIONS,
  TerrainDefinition,
  DoorState
} from './battlemapTypes';

export type TerrainDrawTool = 'brush' | 'box' | 'eraser';

interface TerrainPaletteProps {
  activeTool: TerrainDrawTool;
  onChangeTool: (tool: TerrainDrawTool) => void;
  activeTerrain: TerrainType;
  onChangeTerrain: (terrain: TerrainType) => void;
  terrainCount: {
    walls: number;
    doors: number;
    difficult: number;
    cover: number;
    hazards: number;
  };
  onApplyTemplate: (template: 'room' | 'pillars' | 'chasm_bridge') => void;
  onClearAllTerrain: () => void;
  onClose: () => void;
}

export const TerrainPalette: React.FC<TerrainPaletteProps> = ({
  activeTool,
  onChangeTool,
  activeTerrain,
  onChangeTerrain,
  terrainCount,
  onApplyTemplate,
  onClearAllTerrain,
  onClose
}) => {
  // Available selectable terrain types (excluding open which is covered by eraser)
  const selectableTerrains: TerrainType[] = [
    'wall',
    'door',
    'difficult',
    'water',
    'shallow_water',
    'ice',
    'climb',
    'web',
    'cover_half',
    'cover_three_quarters',
    'hazard',
    'chasm',
    'elevation_high',
    'elevation_low'
  ];

  const currentDef = TERRAIN_DEFINITIONS[activeTerrain] || TERRAIN_DEFINITIONS.wall;

  return (
    <div className="bg-stone-900 border-b border-stone-800 p-3 flex flex-col gap-2.5 text-xs animate-fadeIn z-30 shadow-xl">
      {/* Top row: Tools, Status, and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-serif font-bold text-amber-400">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Tactical Terrain & Objects Editor</span>
          </div>

          {/* Tool Mode Buttons */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-lg p-0.5 ml-2">
            <button
              type="button"
              onClick={() => onChangeTool('brush')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
                activeTool === 'brush'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
              title="Single Cell Brush: Click or drag to paint"
            >
              <Paintbrush className="w-3 h-3" />
              <span>Cell Brush</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTool('box')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
                activeTool === 'box'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
              title="Box / Rectangle: Click and drag to fill a rectangular area"
            >
              <Square className="w-3 h-3" />
              <span>Box / Room</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeTool('eraser');
                onChangeTerrain('open');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-stone-100 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
              title="Eraser: Click or drag to remove terrain"
            >
              <Eraser className="w-3 h-3" />
              <span>Eraser</span>
            </button>
          </div>
        </div>

        {/* Quick Dungeon Templates & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-lg p-0.5">
            <span className="text-[10px] text-stone-500 font-mono px-1.5 uppercase">Presets:</span>
            <button
              type="button"
              onClick={() => onApplyTemplate('room')}
              className="px-2 py-0.5 text-[11px] text-stone-300 hover:text-amber-400 hover:bg-stone-800 rounded transition font-serif"
              title="Add a 14x10 stone chamber with perimeter walls and an entry door"
            >
              🏰 Room
            </button>
            <button
              type="button"
              onClick={() => onApplyTemplate('pillars')}
              className="px-2 py-0.5 text-[11px] text-stone-300 hover:text-amber-400 hover:bg-stone-800 rounded transition font-serif"
              title="Add 4 tactical stone pillars providing cover"
            >
              🏛️ Pillars
            </button>
            <button
              type="button"
              onClick={() => onApplyTemplate('chasm_bridge')}
              className="px-2 py-0.5 text-[11px] text-stone-300 hover:text-amber-400 hover:bg-stone-800 rounded transition font-serif"
              title="Add a deep chasm bisecting the map with a narrow bridge"
            >
              🌉 Bridge
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all walls, doors, and terrain from the battlemap?')) {
                onClearAllTerrain();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800 hover:border-rose-800/80 rounded-lg transition"
            title="Wipe all terrain"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition ml-1"
            title="Close Terrain Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terrain Palette Brush Selection Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
        {selectableTerrains.map((type) => {
          const def = TERRAIN_DEFINITIONS[type];
          const isSelected = activeTool !== 'eraser' && activeTerrain === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (activeTool === 'eraser') onChangeTool('brush');
                onChangeTerrain(type);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition shadow-sm ${
                isSelected
                  ? 'bg-amber-950/80 text-amber-200 border-amber-500 ring-2 ring-amber-500/40'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
              }`}
            >
              <span>{def.icon}</span>
              <span>{def.name}</span>
              {def.movementCostMultiplier > 1 && def.movementCostMultiplier < Infinity && (
                <span className="text-[9px] bg-stone-900/90 px-1 py-0.5 rounded text-amber-400 font-sans">
                  {def.movementCostMultiplier}x Move
                </span>
              )}
              {def.bonusAc && (
                <span className="text-[9px] bg-stone-900 px-1 rounded text-emerald-400">
                  +{def.bonusAc}AC
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Brush Help & Tactical Rule Description */}
      <div className="bg-stone-950 border border-stone-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] text-stone-400 font-sans gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-stone-200 font-bold flex items-center gap-1 font-mono">
            <span>{currentDef.icon}</span>
            <span>{currentDef.name}:</span>
          </span>
          <span>{currentDef.description}</span>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500 border-l border-stone-800 pl-3">
          <span>🧱 {terrainCount.walls} Walls</span>
          <span>🚪 {terrainCount.doors} Doors</span>
          <span>🪨 {terrainCount.difficult} Difficult</span>
          <span>🛡️ {terrainCount.cover} Cover</span>
        </div>
      </div>
    </div>
  );
};
