import React, { useState } from 'react';
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
import { RuleEdition } from '../../types';

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
  activeCeilingFeet?: number;
  onChangeCeilingFeet?: (feet: number) => void;
  edition?: RuleEdition;
}

export const TerrainPalette: React.FC<TerrainPaletteProps> = ({
  activeTool,
  onChangeTool,
  activeTerrain,
  onChangeTerrain,
  terrainCount,
  onApplyTemplate,
  onClearAllTerrain,
  onClose,
  activeCeilingFeet = 10,
  onChangeCeilingFeet,
  edition = '5e'
}) => {
  const is35e = edition === '3.5e';
  const [confirmClearAll, setConfirmClearAll] = useState(false);
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
    'elevation_low',
    'sheltered'
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

          {confirmClearAll ? (
            <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-800 px-2 py-0.5 rounded-lg">
              <span className="text-[11px] text-rose-300 font-bold">Clear all?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllTerrain();
                  setConfirmClearAll(false);
                }}
                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-1.5 py-0.5 rounded border border-stone-700 text-stone-300 text-[11px] hover:text-white cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="flex items-center gap-1 px-2 py-1 bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800 hover:border-rose-800/80 rounded-lg transition cursor-pointer"
              title="Wipe all terrain"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}

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

          const displayName =
            type === 'cover_half'
              ? is35e
                ? 'Half Cover (+4 AC / +2 Ref)'
                : 'Half Cover (+2 AC / +2 DEX)'
              : type === 'cover_three_quarters'
              ? is35e
                ? '3/4 Cover (+7 AC / +3 Ref)'
                : '3/4 Cover (+5 AC / +5 DEX)'
              : def.name;

          const bonusAc =
            type === 'cover_half'
              ? (is35e ? 4 : 2)
              : type === 'cover_three_quarters'
              ? (is35e ? 7 : 5)
              : def.bonusAc;

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
              title={
                type === 'cover_half'
                  ? is35e
                    ? 'Standard Cover (3.5e PHB p. 150): Grants +4 AC and +2 on Reflex saving throws against attacks originating from across the cover.'
                    : 'Half Cover (5e PHB p. 196): Grants +2 AC and +2 on Dexterity saving throws.'
                  : type === 'cover_three_quarters'
                  ? is35e
                    ? 'Nine-Tenths / 3/4 Cover (3.5e PHB p. 151): Grants +7 AC and +3 on Reflex saving throws.'
                    : 'Three-Quarters Cover (5e PHB p. 196): Grants +5 AC and +5 on Dexterity saving throws.'
                  : def.description
              }
            >
              <span>{def.icon}</span>
              <span>{displayName}</span>
              {def.movementCostMultiplier > 1 && def.movementCostMultiplier < Infinity && (
                <span className="text-[9px] bg-stone-900/90 px-1 py-0.5 rounded text-amber-400 font-sans">
                  {def.movementCostMultiplier}x Move
                </span>
              )}
              {bonusAc && (
                <span className="text-[9px] bg-stone-900 px-1 rounded text-emerald-400">
                  +{bonusAc}AC
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Per-Tile Indoor Ceiling Height Controls (Active when Sheltered terrain is selected) */}
      {activeTerrain === 'sheltered' && onChangeCeilingFeet && (
        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg px-2.5 py-1.5 flex-wrap text-xs animate-fadeIn">
          <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
            <span>🏠</span> Tile Ceiling Height:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { feet: 8, label: "8' Cellar" },
              { feet: 10, label: "10' Standard" },
              { feet: 15, label: "15' Vaulted" },
              { feet: 20, label: "20' Hall" },
              { feet: 30, label: "30' Cathedral" },
              { feet: 50, label: "50' Cavern" }
            ].map(({ feet, label }) => (
              <button
                key={feet}
                type="button"
                onClick={() => onChangeCeilingFeet(feet)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                  activeCeilingFeet === feet
                    ? 'bg-amber-500 text-stone-950 shadow ring-1 ring-amber-400'
                    : 'bg-stone-900 text-amber-200 border border-amber-850 hover:bg-stone-800 hover:text-amber-100'
                }`}
                title={`Paint sheltered tile with ${feet} ft ceiling clearance`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] text-stone-400 font-mono">Custom:</span>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={activeCeilingFeet ?? 10}
              onChange={(e) => onChangeCeilingFeet(Math.max(5, parseInt(e.target.value, 10) || 10))}
              className="w-14 bg-stone-950 border border-amber-700/60 rounded px-1.5 py-0.5 text-amber-100 font-mono text-[11px] text-center"
              title="Enter custom ceiling height in feet"
            />
            <span className="text-[10px] text-stone-400 font-mono">ft</span>
          </div>
        </div>
      )}

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
