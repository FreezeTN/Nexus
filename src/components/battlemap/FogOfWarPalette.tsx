import React from 'react';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Brush,
  Eraser,
  Square,
  Sparkles,
  RefreshCw,
  Sliders,
  Layers,
  ShieldAlert,
  Users
} from 'lucide-react';

export type FogToolType = 'reveal_brush' | 'shroud_brush' | 'reveal_box' | 'shroud_box';

interface FogOfWarPaletteProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  viewMode: 'dm' | 'player';
  onChangeViewMode: (mode: 'dm' | 'player') => void;
  activeTool: FogToolType;
  onChangeTool: (tool: FogToolType) => void;
  onRevealAll: () => void;
  onShroudAll: () => void;
  onAutoRevealPartyVision: () => void;
  revealedCount: number;
  totalSquares: number;
  onClose: () => void;
}

export const FogOfWarPalette: React.FC<FogOfWarPaletteProps> = ({
  isEnabled,
  onToggleEnabled,
  viewMode,
  onChangeViewMode,
  activeTool,
  onChangeTool,
  onRevealAll,
  onShroudAll,
  onAutoRevealPartyVision,
  revealedCount,
  totalSquares,
  onClose
}) => {
  const percentRevealed = totalSquares > 0 ? Math.round((revealedCount / totalSquares) * 100) : 0;

  return (
    <div
      id="fog-of-war-palette"
      className="bg-stone-900 border-b border-stone-800 p-3 text-xs text-stone-300 shadow-xl animate-fadeIn z-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Master Toggle & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Header Title */}
          <div className="flex items-center gap-1.5 font-bold text-amber-300 pr-2 border-r border-stone-700">
            <Moon className="w-4 h-4 text-purple-400" />
            <span className="font-serif">Fog of War & Vision</span>
          </div>

          {/* Master Enable/Disable Toggle */}
          <button
            type="button"
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow ${
              isEnabled
                ? 'bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-600 shadow-purple-900/30'
                : 'bg-stone-950 hover:bg-stone-800 text-stone-400 border border-stone-800'
            }`}
          >
            {isEnabled ? <Eye className="w-3.5 h-3.5 text-purple-300" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Fog of War: {isEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </button>

          {/* Perspective View Mode Toggle (DM vs Player Preview) */}
          {isEnabled && (
            <div className="flex items-center bg-stone-950 p-0.5 rounded border border-stone-800">
              <button
                type="button"
                onClick={() => onChangeViewMode('dm')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  viewMode === 'dm'
                    ? 'bg-stone-800 text-amber-300 font-bold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="DM View: See through fog translucently with hidden monster markers"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>DM View (Translucent)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('player')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                  viewMode === 'player'
                    ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Player Preview: Solid black darkness hiding fogged enemies"
              >
                <Moon className="w-3 h-3 text-purple-400" />
                <span>Player Preview</span>
              </button>
            </div>
          )}

          {/* Revealed stats badge */}
          {isEnabled && (
            <div className="px-2 py-0.5 bg-stone-950 rounded border border-stone-800 text-[11px] font-mono text-stone-400">
              Revealed: <span className="text-amber-400 font-bold">{revealedCount}</span> / {totalSquares} ({percentRevealed}%)
            </div>
          )}
        </div>

        {/* Center: Painting & Revealing Tools */}
        {isEnabled && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tool Selector */}
            <div className="flex items-center bg-stone-950 p-0.5 rounded border border-stone-800">
              <button
                type="button"
                onClick={() => onChangeTool('reveal_brush')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                  activeTool === 'reveal_brush'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-stone-400 hover:text-amber-300'
                }`}
                title="Reveal Brush: Click/drag to reveal tiles"
              >
                <Sun className="w-3 h-3 text-amber-300" />
                <span>Reveal Tile</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTool('reveal_box')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                  activeTool === 'reveal_box'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-stone-400 hover:text-amber-300'
                }`}
                title="Reveal Box: Drag a rectangle to reveal an entire room"
              >
                <Square className="w-3 h-3 text-amber-300" />
                <span>Reveal Box</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTool('shroud_brush')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                  activeTool === 'shroud_brush'
                    ? 'bg-stone-700 text-purple-300 font-bold'
                    : 'text-stone-400 hover:text-purple-300'
                }`}
                title="Shroud Brush: Click/drag to hide tiles back into fog"
              >
                <Moon className="w-3 h-3 text-purple-400" />
                <span>Shroud Tile</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTool('shroud_box')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                  activeTool === 'shroud_box'
                    ? 'bg-stone-700 text-purple-300 font-bold'
                    : 'text-stone-400 hover:text-purple-300'
                }`}
                title="Shroud Box: Drag a box to cover with fog"
              >
                <Square className="w-3 h-3 text-purple-400" />
                <span>Shroud Box</span>
              </button>
            </div>

            {/* Dynamic Party Vision Auto-Reveal */}
            <button
              type="button"
              onClick={onAutoRevealPartyVision}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 rounded font-bold transition text-[11px] shadow"
              title="Calculate Raycast Line of Sight from all party members (60 ft Darkvision / Torch) and reveal visible tiles"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reveal Party LoS</span>
            </button>

            {/* Reveal All & Shroud All Quick Actions */}
            <button
              type="button"
              onClick={onRevealAll}
              className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-200 rounded transition text-[11px]"
              title="Reveal all squares on the battlemap"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Reveal All</span>
            </button>

            <button
              type="button"
              onClick={onShroudAll}
              className="flex items-center gap-1 px-2 py-1 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-rose-300 rounded transition text-[11px]"
              title="Shroud the entire map back into darkness"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset / Shroud All</span>
            </button>
          </div>
        )}

        {/* Right: Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-200 text-xs px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
