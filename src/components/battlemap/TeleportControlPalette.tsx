import React, { useState } from 'react';
import {
  Sparkles,
  Navigation,
  X,
  Compass,
  Check,
  AlertCircle,
  Footprints,
  Maximize2
} from 'lucide-react';
import { ActiveTeleportState } from './battlemapTypes';
import { Combatant } from '../combat/encounter/encounterTypes';

export interface TeleportPreset {
  id: string;
  name: string;
  rangeFeet: number;
  actionCost: 'bonus' | 'action' | 'reaction' | 'special';
  description: string;
  icon: string;
  requiresLineOfSight: boolean;
}

export const TELEPORT_PRESETS: TeleportPreset[] = [
  {
    id: 'misty_step',
    name: 'Misty Step',
    rangeFeet: 30,
    actionCost: 'bonus',
    description: 'Briefly surrounded by silvery mist, teleport up to 30 ft to an unoccupied space you can see.',
    icon: '🌫️',
    requiresLineOfSight: true
  },
  {
    id: 'fey_step',
    name: 'Fey Step',
    rangeFeet: 30,
    actionCost: 'bonus',
    description: 'Eladrin / Fey magic teleport up to 30 ft with seasonal riders.',
    icon: '🧚',
    requiresLineOfSight: true
  },
  {
    id: 'shadow_step',
    name: 'Shadow Step',
    rangeFeet: 60,
    actionCost: 'bonus',
    description: 'Monk Way of Shadow: teleport from shadow to shadow up to 60 ft, gaining advantage on your next melee attack.',
    icon: '🌑',
    requiresLineOfSight: true
  },
  {
    id: 'thunder_step',
    name: 'Thunder Step',
    rangeFeet: 90,
    actionCost: 'action',
    description: 'Teleport up to 90 ft; leaves a thunderous clap audible 300 ft dealing 3d10 thunder to creatures left behind.',
    icon: '⚡',
    requiresLineOfSight: true
  },
  {
    id: 'dimension_door',
    name: 'Dimension Door',
    rangeFeet: 400,
    actionCost: 'action',
    description: 'Teleport up to 400 ft to any spot you can visualize or describe by distance and direction, even without line of sight.',
    icon: '🚪',
    requiresLineOfSight: false
  },
  {
    id: 'blink_dog',
    name: 'Blink',
    rangeFeet: 40,
    actionCost: 'bonus',
    description: 'Magical teleportation up to 40 ft (e.g. Blink Dog or Cape of the Mountebank).',
    icon: '✨',
    requiresLineOfSight: true
  }
];

interface TeleportControlPaletteProps {
  activeTeleport: ActiveTeleportState | null;
  activeCombatant: Combatant;
  onUpdateTeleport: (state: ActiveTeleportState | null) => void;
  hoverCell?: {
    x: number;
    y: number;
    distanceFeet: number;
    isWithinRange: boolean;
    isPassable: boolean;
  } | null;
  onConfirmTeleport?: (x: number, y: number) => void;
  onClose: () => void;
}

export const TeleportControlPalette: React.FC<TeleportControlPaletteProps> = ({
  activeTeleport,
  activeCombatant,
  onUpdateTeleport,
  hoverCell,
  onConfirmTeleport,
  onClose
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('misty_step');
  const [customRange, setCustomRange] = useState<number>(activeTeleport?.rangeFeet || 30);

  const currentRange = activeTeleport?.rangeFeet || customRange;

  const handleSelectPreset = (preset: TeleportPreset) => {
    setSelectedPresetId(preset.id);
    setCustomRange(preset.rangeFeet);
    onUpdateTeleport({
      sourceCombatantId: activeCombatant.id,
      sourceCombatantName: activeCombatant.name,
      abilityName: preset.name,
      rangeFeet: preset.rangeFeet,
      requiresLineOfSight: preset.requiresLineOfSight,
      description: preset.description
    });
  };

  const handleCustomRangeChange = (feet: number) => {
    const val = Math.max(5, Math.min(1000, feet));
    setCustomRange(val);
    onUpdateTeleport({
      sourceCombatantId: activeCombatant.id,
      sourceCombatantName: activeCombatant.name,
      abilityName: activeTeleport?.abilityName || 'Custom Teleport',
      rangeFeet: val,
      requiresLineOfSight: activeTeleport?.requiresLineOfSight ?? true,
      description: `Teleport up to ${val} ft.`
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-950/95 via-stone-900/95 to-indigo-950/95 border-b border-purple-800/80 p-3 flex flex-col gap-2.5 text-xs animate-fadeIn z-30 shadow-2xl backdrop-blur-sm">
      {/* Top Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-serif font-bold text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Arcane Teleportation Targeter</span>
          </div>
          <span className="bg-purple-900/80 text-purple-200 border border-purple-600/60 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold">
            Caster: {activeCombatant.name}
          </span>
          <span className="text-stone-400 text-[11px]">
            Click any valid highlighted cell on the battlemap to instantly teleport!
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hoverCell && hoverCell.isWithinRange && hoverCell.isPassable && onConfirmTeleport && (
            <button
              type="button"
              onClick={() => onConfirmTeleport(hoverCell.x, hoverCell.y)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-bold rounded-lg shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Teleport ({hoverCell.distanceFeet} ft)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-lg transition"
            title="Cancel Teleportation"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Presets Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <span className="text-[10px] text-purple-400/80 font-mono uppercase shrink-0">Presets:</span>
        {TELEPORT_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id && currentRange === preset.rangeFeet;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition shadow-sm ${
                isSelected
                  ? 'bg-purple-900/90 text-purple-100 border-purple-400 ring-2 ring-purple-400/50'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-purple-700 hover:bg-purple-950/40'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
              <span className="text-[10px] bg-purple-950 px-1.5 py-0.5 rounded text-purple-300 border border-purple-700/50">
                {preset.rangeFeet} ft
              </span>
            </button>
          );
        })}

        {/* Custom Range Input */}
        <div className="flex items-center gap-1.5 bg-stone-950 border border-purple-800/60 rounded-xl px-2.5 py-1 shrink-0">
          <span className="text-[11px] text-stone-400 font-sans">Range:</span>
          <input
            type="number"
            min={5}
            max={1000}
            step={5}
            value={currentRange}
            onChange={(e) => handleCustomRangeChange(parseInt(e.target.value, 10) || 5)}
            className="w-16 bg-stone-900 border border-stone-700 text-purple-200 font-mono text-xs px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-purple-400"
          />
          <span className="text-[11px] text-purple-300 font-mono">ft</span>
        </div>
      </div>

      {/* Dynamic Status / Hover Information */}
      <div className="bg-stone-950/90 border border-purple-900/60 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-stone-300 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-purple-300 flex items-center gap-1 font-mono">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Targeting Status:</span>
          </span>

          {hoverCell ? (
            !hoverCell.isPassable ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Cannot teleport: Space is blocked by a solid barrier.
              </span>
            ) : !hoverCell.isWithinRange ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Target out of range ({hoverCell.distanceFeet} ft &gt; {currentRange} ft max).
              </span>
            ) : (
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Valid destination ({hoverCell.distanceFeet} ft of {currentRange} ft). Click cell to teleport!
              </span>
            )
          ) : (
            <span className="text-stone-400 italic">
              Hover mouse over the battlemap to preview landing location.
            </span>
          )}
        </div>

        <div className="text-[10px] text-purple-300/80 font-mono flex items-center gap-2">
          <span>✨ Does not deplete walking movement speed</span>
        </div>
      </div>
    </div>
  );
};
