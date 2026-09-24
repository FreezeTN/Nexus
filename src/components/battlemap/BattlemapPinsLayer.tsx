import React, { useState } from 'react';
import { BattlemapPin, MapPinType } from './battlemapTypes';
import { Eye, EyeOff, Trash2, Edit3, Settings, ShieldAlert, Sparkles, MapPin as PinIcon } from 'lucide-react';

interface BattlemapPinsLayerProps {
  pins: BattlemapPin[];
  cellSize: number;
  isDm: boolean;
  onSelectPin?: (pin: BattlemapPin) => void;
  selectedPinId?: string | null;
  onUpdatePin?: (pin: BattlemapPin) => void;
  onDeletePin?: (pinId: string) => void;
}

export const PIN_TYPE_CONFIG: Record<
  MapPinType,
  { label: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  trap: {
    label: 'Trap',
    icon: '🪤',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#dc2626'
  },
  secret_door: {
    label: 'Secret Door',
    icon: '🚪',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#9333ea'
  },
  treasure: {
    label: 'Treasure / Loot',
    icon: '💎',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.25)',
    borderColor: '#ca8a04'
  },
  ambush: {
    label: 'Ambush / Threat',
    icon: '⚔️',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.25)',
    borderColor: '#ea580c'
  },
  note: {
    label: 'DM Note / Clue',
    icon: '📜',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.25)',
    borderColor: '#0284c7'
  },
  hazard: {
    label: 'Hazard',
    icon: '🌋',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.25)',
    borderColor: '#db2777'
  }
};

export const BattlemapPinsLayer: React.FC<BattlemapPinsLayerProps> = ({
  pins,
  cellSize,
  isDm,
  onSelectPin,
  selectedPinId,
  onUpdatePin,
  onDeletePin
}) => {
  // Context menu state for pin
  const [pinContextMenu, setPinContextMenu] = useState<{
    pin: BattlemapPin;
    x: number;
    y: number;
  } | null>(null);

  // Filter pins: Players only see non-secret pins. DMs see all pins.
  const visiblePins = pins.filter((p) => isDm || !p.isSecret);

  return (
    <div className="pins-layer absolute inset-0 pointer-events-none z-30">
      {visiblePins.map((pin) => {
        const config = PIN_TYPE_CONFIG[pin.type] || PIN_TYPE_CONFIG.note;
        const isSelected = selectedPinId === pin.id;
        const leftPx = pin.x * cellSize;
        const topPx = pin.y * cellSize;

        return (
          <div
            key={pin.id}
            data-pin-id={pin.id}
            style={{
              left: `${leftPx}px`,
              top: `${topPx}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`
            }}
            className="absolute flex items-center justify-center pointer-events-auto group select-none"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelectPin?.(pin);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPinContextMenu({ pin, x: e.clientX, y: e.clientY });
            }}
            title={`${pin.title}${pin.dc ? ` (DC ${pin.dc})` : ''}\n${pin.description || 'No description'}\nClick to open properties • Right-click or hover ✕ to delete`}
          >
            {/* Ground Contact Shadow */}
            <div
              className="absolute rounded-full bg-black/60 blur-[3px] pointer-events-none -z-10"
              style={{
                width: `${cellSize * 0.65}px`,
                height: `${cellSize * 0.32}px`,
                bottom: `${cellSize * 0.1}px`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />

            {/* Pin Badge Circle Container */}
            <div
              className={`relative flex items-center justify-center rounded-full transition-transform duration-150 cursor-pointer shadow-2xl ${
                isSelected
                  ? 'scale-115 ring-3 ring-amber-400 shadow-amber-500/60'
                  : 'group-hover:scale-110'
              }`}
              style={{
                width: `${cellSize * 0.78}px`,
                height: `${cellSize * 0.78}px`,
                background: `radial-gradient(circle at 35% 35%, #27272a 0%, #18181b 70%, #09090b 100%)`,
                border: `2px solid ${config.borderColor}`,
                boxShadow: `0 4px 10px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)`
              }}
            >
              {/* Pulsing dashed ring if secret to DM */}
              {pin.isSecret && isDm && (
                <div
                  className="absolute -inset-1.5 rounded-full border border-purple-500/90 border-dashed animate-spin pointer-events-none"
                  style={{ animationDuration: '10s' }}
                />
              )}

              {/* Tint overlay */}
              <div
                className="absolute inset-0 rounded-full opacity-60"
                style={{ backgroundColor: config.bgColor }}
              />

              {/* Icon / Emoji */}
              <span
                className="relative text-base leading-none filter drop-shadow z-10 select-none"
                style={{ fontSize: `${cellSize * 0.4}px` }}
              >
                {config.icon}
              </span>

              {/* Secret Eye Badge for DM */}
              {pin.isSecret && isDm && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-[9px] text-purple-200 shadow font-bold z-20"
                  title="Secret to GM (Hidden from players)"
                >
                  👁️
                </div>
              )}

              {/* DC Tag Badge below pin */}
              {pin.dc !== undefined && (
                <div
                  className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-stone-950 border border-stone-700 text-[8.5px] font-mono font-bold text-stone-200 shadow z-20 whitespace-nowrap"
                  style={{ borderColor: config.borderColor }}
                >
                  DC {pin.dc}
                </div>
              )}
            </div>

            {/* Quick Actions Hover Toolbar (Delete & Edit) */}
            <div className="absolute -top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-stone-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-stone-700 shadow-xl">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelectPin?.(pin);
                }}
                className="p-1 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-400 transition cursor-pointer"
                title="Open pin properties"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDeletePin?.(pin.id);
                }}
                className="p-1 hover:bg-rose-950 rounded text-stone-300 hover:text-rose-400 transition cursor-pointer"
                title="Delete pin from map"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Pin Context Menu */}
      {pinContextMenu && (
        <div
          className="fixed z-50 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl py-1.5 w-52 text-xs font-sans text-stone-200 pointer-events-auto animate-fadeIn"
          style={{
            left: `${Math.min(window.innerWidth - 220, pinContextMenu.x)}px`,
            top: `${Math.min(window.innerHeight - 200, pinContextMenu.y)}px`
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[11px] font-bold text-amber-400 border-b border-stone-800 flex items-center gap-2 truncate">
            <span>{PIN_TYPE_CONFIG[pinContextMenu.pin.type]?.icon}</span>
            <span className="truncate">{pinContextMenu.pin.title}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectPin?.(pinContextMenu.pin);
              setPinContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-amber-300 flex items-center gap-2 transition"
          >
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>Open Properties</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdatePin?.({
                ...pinContextMenu.pin,
                isSecret: !pinContextMenu.pin.isSecret
              });
              setPinContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-stone-800 hover:text-purple-300 flex items-center gap-2 transition"
          >
            {pinContextMenu.pin.isSecret ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reveal to Players</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                <span>Hide as GM Secret</span>
              </>
            )}
          </button>

          <div className="h-px bg-stone-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onDeletePin?.(pinContextMenu.pin.id);
              setPinContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-950/70 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete from Map</span>
          </button>
        </div>
      )}

      {/* Backdrop to close context menu */}
      {pinContextMenu && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          onClick={() => setPinContextMenu(null)}
        />
      )}
    </div>
  );
};
