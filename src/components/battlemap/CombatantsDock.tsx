import React, { useState } from 'react';
import {
  Users,
  Plus,
  Armchair,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Shield,
  Heart,
  Footprints,
  RotateCcw
} from 'lucide-react';
import { Combatant } from '../combat/encounter/encounterTypes';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../data/monsterPortraits';

export interface CombatantsDockProps {
  combatants: Combatant[];
  placedCombatants: Combatant[];
  unplacedCombatants: Combatant[];
  selectedCombatantId?: string | null;
  activeCombatantId?: string | null;
  onSelectCombatant?: (id: string | null) => void;
  onCenterOnCombatant?: (combatantId: string) => void;
  onRemoveCombatantFromMap?: (id: string) => void;
  onRemoveCombatant?: (id: string) => void;
  onOpenAddModal?: (type?: 'ally' | 'enemy') => void;
  onRecallAllToReserve?: () => void;
  onResetSpawnPoints?: () => void;
  isDm: boolean;
  onTokenDragStart: (e: React.DragEvent, id: string) => void;
  onBenchDrop: (e: React.DragEvent) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const CombatantsDock: React.FC<CombatantsDockProps> = ({
  combatants,
  placedCombatants,
  unplacedCombatants,
  selectedCombatantId,
  activeCombatantId,
  onSelectCombatant,
  onCenterOnCombatant,
  onRemoveCombatantFromMap,
  onRemoveCombatant,
  onOpenAddModal,
  onRecallAllToReserve,
  onResetSpawnPoints,
  isDm,
  onTokenDragStart,
  onBenchDrop,
  isOpen,
  onToggleOpen
}) => {
  const [filter, setFilter] = useState<'all' | 'placed' | 'reserve'>('all');
  const [isDropHovered, setIsDropHovered] = useState<boolean>(false);

  const displayedCombatants = React.useMemo(() => {
    if (filter === 'placed') {
      return placedCombatants;
    }
    if (filter === 'reserve') {
      return unplacedCombatants;
    }
    return combatants;
  }, [combatants, placedCombatants, unplacedCombatants, filter]);

  return (
    <div
      id="combatants-staging-dock"
      className="bg-stone-900 border-b border-stone-800 transition-all duration-200 z-20"
    >
      {/* Top Bar / Dock Summary */}
      <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 font-bold text-stone-200 hover:text-amber-300 transition"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Tokens Dock</span>
            <span className="text-[11px] font-normal text-stone-400">
              ({placedCombatants.length} on grid / {unplacedCombatants.length} reserve)
            </span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          {isOpen && (
            <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800 ml-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  filter === 'all'
                    ? 'bg-stone-800 text-stone-100 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                All ({combatants.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('placed')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  filter === 'placed'
                    ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                On Grid ({placedCombatants.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('reserve')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  filter === 'reserve'
                    ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Reserve ({unplacedCombatants.length})
              </button>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2">
            {/* Drag to bench drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsDropHovered(true);
              }}
              onDragLeave={() => setIsDropHovered(false)}
              onDrop={(e) => {
                setIsDropHovered(false);
                onBenchDrop(e);
              }}
              className={`border border-dashed rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] transition cursor-pointer select-none ${
                isDropHovered
                  ? 'border-amber-400 bg-amber-950/60 text-amber-200 scale-105 shadow-md shadow-amber-500/20'
                  : 'border-stone-700 bg-stone-950/60 text-stone-400 hover:border-amber-600/70 hover:text-amber-300'
              }`}
              title="Drag any token from the map or roster here to bench it to Reserve"
            >
              <Armchair className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Drop here to bench</span>
            </div>

            {/* DM Quick Actions */}
            {isDm && (
              <>
                <button
                  type="button"
                  onClick={onRecallAllToReserve}
                  className="px-2 py-1 bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 rounded-lg text-[11px] transition flex items-center gap-1"
                  title="Recall all tokens off the grid into reserve"
                >
                  <Armchair className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline">Recall All</span>
                </button>
                <button
                  type="button"
                  onClick={onResetSpawnPoints}
                  className="px-2 py-1 bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-sky-300 border border-stone-800 rounded-lg text-[11px] transition flex items-center gap-1"
                  title="Reset all tokens to default spawn points"
                >
                  <RotateCcw className="w-3 h-3 text-sky-400" />
                  <span className="hidden md:inline">Spawn Zones</span>
                </button>
                {onOpenAddModal && (
                  <button
                    type="button"
                    onClick={() => onOpenAddModal('enemy')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-[11px] shadow transition flex items-center gap-1"
                    title="Add new monster or reinforcement combatant"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Entity</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Expandable Tokens Scroll Tray */}
      {isOpen && (
        <div className="px-3 pb-2.5 overflow-x-auto scrollbar-thin">
          {displayedCombatants.length === 0 ? (
            <div className="py-3 text-center text-xs text-stone-500 italic">
              {filter === 'reserve'
                ? 'All tokens are placed on the battlemap. Drag a token to the bench box to recall it.'
                : filter === 'placed'
                ? 'No tokens are currently on the battlemap. Drag a token from below onto any grid square.'
                : 'No combatants in this encounter yet.'}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-max py-1">
              {displayedCombatants.map((c) => {
                const isPlaced = c.isOnMap !== false;
                const isSelected = selectedCombatantId === c.id;
                const isActive = activeCombatantId === c.id;
                const isAlly = c.type === 'player' || c.type === 'ally';
                const hpPercent = Math.max(0, Math.min(100, Math.round((c.hpCurrent / Math.max(1, c.hpMax)) * 100)));
                const portrait = c.portraitUrl || getMonsterPortraitUrl(c.name);

                return (
                  <div
                    key={c.id}
                    draggable={true}
                    onDragStart={(e) => onTokenDragStart(e, c.id)}
                    onClick={() => {
                      if (isPlaced) {
                        onCenterOnCombatant?.(c.id);
                      }
                      onSelectCombatant?.(selectedCombatantId === c.id ? null : c.id);
                    }}
                    className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                      isSelected
                        ? 'bg-stone-800/95 border-sky-500 shadow-md shadow-sky-500/20'
                        : isActive
                        ? 'bg-stone-800/90 border-amber-500 shadow-md shadow-amber-500/20'
                        : !isPlaced
                        ? 'bg-amber-950/25 border-dashed border-amber-600/60 hover:border-amber-500 hover:bg-amber-950/40'
                        : isAlly
                        ? 'bg-stone-950/90 border-emerald-900/60 hover:border-emerald-700/80 hover:bg-stone-900'
                        : 'bg-stone-950/90 border-rose-900/60 hover:border-rose-700/80 hover:bg-stone-900'
                    }`}
                    title={`${c.name}\n${isPlaced ? `Placed at Grid (${(c.mapX ?? 0) + 1}, ${(c.mapY ?? 0) + 1})` : 'In Reserve'}\nDrag onto any grid cell to place or reposition!`}
                  >
                    {/* Miniature Avatar Ring */}
                    <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden bg-stone-800 border border-stone-700 flex items-center justify-center">
                      {portrait ? (
                        <img
                          src={portrait}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generateMonsterSvgPortrait(c.name);
                          }}
                        />
                      ) : (
                        <span className="text-[11px] font-bold text-stone-300">
                          {c.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}

                      {/* Status indicator pip */}
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-stone-950 ${
                          isPlaced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                    </div>

                    {/* Combatant Meta */}
                    <div className="flex flex-col min-w-[90px] max-w-[130px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-stone-200 truncate leading-tight">
                          {c.name}
                        </span>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden my-0.5">
                        <div
                          className={`h-full transition-all ${
                            hpPercent > 50
                              ? 'bg-emerald-500'
                              : hpPercent > 20
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                        <span>{c.hpCurrent}/{c.hpMax} HP</span>
                        <span>{c.armorClass} AC</span>
                      </div>
                    </div>

                    {/* Status badge & Quick Actions */}
                    <div className="flex flex-col items-end gap-1 ml-1">
                      {isPlaced ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 whitespace-nowrap">
                          {c.mapX !== undefined && c.mapY !== undefined
                            ? `${c.mapX + 1},${c.mapY + 1}`
                            : 'Grid'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 whitespace-nowrap animate-pulse">
                          Drag to Map
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        {isPlaced ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCombatantFromMap?.(c.id);
                            }}
                            className="p-1 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition"
                            title="Remove token from map (Bench to Reserve)"
                          >
                            <Armchair className="w-3 h-3" />
                          </button>
                        ) : null}

                        {isDm && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCombatant?.(c.id);
                            }}
                            className="p-1 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded transition"
                            title="Delete combatant from encounter"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
