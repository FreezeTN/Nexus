import React from 'react';
import { RotateCcw, Zap, Users, Armchair, Layers, Compass, Eye, X, FolderOpen } from 'lucide-react';

export interface ResetBattlemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFullReset: () => void;
  onResetSpawnPoints: () => void;
  onRecallAllToReserve: () => void;
  onClearTerrain: () => void;
  onClearOverlays: () => void;
  onResetFog: (mode: 'shroud' | 'reveal') => void;
  onResetCamera?: () => void;
  onOpenLayouts?: () => void;
}

export const ResetBattlemapModal: React.FC<ResetBattlemapModalProps> = ({
  isOpen,
  onClose,
  onFullReset,
  onResetSpawnPoints,
  onRecallAllToReserve,
  onClearTerrain,
  onClearOverlays,
  onResetFog,
  onOpenLayouts
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="reset-battlemap-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="reset-battlemap-modal-dialog"
        className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100">Reset Tactical Battlemap</h3>
              <p className="text-xs text-stone-400">Choose an action to reset, clear, or recall map elements.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut Banner to Load Saved/Preset Layout */}
        {onOpenLayouts && (
          <div className="mt-3 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Looking to load a pre-built or saved battlemap layout instead?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLayouts();
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow"
            >
              Browse Layouts
            </button>
          </div>
        )}

        {/* Options List */}
        <div className="mt-3 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* 1. Full Reset */}
          <button
            type="button"
            onClick={() => {
              onFullReset();
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3.5 bg-stone-950/90 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-700/60 rounded-xl text-left transition group"
          >
            <div className="p-2 bg-rose-900/30 rounded-lg text-rose-400 group-hover:bg-rose-900/50 transition shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-100 group-hover:text-rose-300 transition">
                Full Map Reset (Blank Slate)
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Clears all terrain, obstacles, and doors; covers map in Fog of War; resets token positions to spawn zones; removes active AoE and Line of Sight rulers.
              </p>
            </div>
          </button>

          {/* 2. Reset Starting Positions */}
          <button
            type="button"
            onClick={() => {
              onResetSpawnPoints();
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 bg-stone-950/80 hover:bg-sky-950/40 border border-stone-800 hover:border-sky-700/60 rounded-xl text-left transition group"
          >
            <div className="p-2 bg-sky-900/30 rounded-lg text-sky-400 group-hover:bg-sky-900/50 transition shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-100 group-hover:text-sky-300 transition">
                Reset Tokens to Starting Spawn Zones
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Places players on the left spawn zone and monsters on the right spawn zone with full turn movement restored.
              </p>
            </div>
          </button>

          {/* 3. Recall All to Reserve */}
          <button
            type="button"
            onClick={() => {
              onRecallAllToReserve();
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 bg-stone-950/80 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-700/60 rounded-xl text-left transition group"
          >
            <div className="p-2 bg-amber-900/30 rounded-lg text-amber-400 group-hover:bg-amber-900/50 transition shrink-0 mt-0.5">
              <Armchair className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-100 group-hover:text-amber-300 transition">
                Recall All Tokens to Reserve Dock (Clean Grid)
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Takes all combatant tokens off the grid into the Reserve Staging Dock, allowing you to drag and place them manually.
              </p>
            </div>
          </button>

          {/* 4. Clear Terrain & Walls */}
          <button
            type="button"
            onClick={() => {
              onClearTerrain();
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 bg-stone-950/80 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 rounded-xl text-left transition group"
          >
            <div className="p-2 bg-stone-800 rounded-lg text-stone-300 group-hover:bg-stone-700 transition shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-100 group-hover:text-stone-200 transition">
                Clear All Terrain, Walls & Doors
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Erases all walls, chasms, water, and doors, returning the map to an open dungeon floor. Keeps tokens and fog.
              </p>
            </div>
          </button>

          {/* 5. Clear Overlays (Rulers & AoE) */}
          <button
            type="button"
            onClick={() => {
              onClearOverlays();
              onClose();
            }}
            className="w-full flex items-start gap-3 p-3 bg-stone-950/80 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 rounded-xl text-left transition group"
          >
            <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400 group-hover:bg-indigo-900/50 transition shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-100 group-hover:text-indigo-300 transition">
                Remove Line of Sight Ruler & AoE Templates
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Removes any active ruler measurement lines, cover rays, and spell blast templates.
              </p>
            </div>
          </button>

          {/* 6. Fog of War Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onResetFog('shroud');
                onClose();
              }}
              className="p-2.5 bg-stone-950/80 hover:bg-purple-950/40 border border-stone-800 hover:border-purple-700/60 rounded-xl text-left transition flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-purple-300">Shroud All in Fog</div>
                <div className="text-[10px] text-stone-500">Darken entire grid</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFog('reveal');
                onClose();
              }}
              className="p-2.5 bg-stone-950/80 hover:bg-emerald-950/40 border border-stone-800 hover:border-emerald-700/60 rounded-xl text-left transition flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-emerald-300">Reveal All Fog</div>
                <div className="text-[10px] text-stone-500">Remove all fog cover</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
