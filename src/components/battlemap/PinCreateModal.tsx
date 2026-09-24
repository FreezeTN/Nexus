import React, { useState } from 'react';
import { BattlemapPin, MapPinType } from './battlemapTypes';
import { PIN_TYPE_CONFIG } from './BattlemapPinsLayer';
import { X, Check, EyeOff, MapPin } from 'lucide-react';

interface PinCreateModalProps {
  cell: { x: number; y: number };
  onSave: (pin: BattlemapPin) => void;
  onClose: () => void;
}

const PIN_PRESETS: Record<MapPinType, { title: string; desc: string; dc?: number }> = {
  trap: {
    title: 'Hidden Spike Pit',
    desc: 'Covered false floor. DC 15 Perception to spot. 2d10 piercing damage on fail (DC 14 Dex save half).',
    dc: 15
  },
  secret_door: {
    title: 'Concealed Stone Door',
    desc: 'Swings inward when torch sconce is pulled. DC 16 Investigation to detect seams.',
    dc: 16
  },
  treasure: {
    title: 'Locked Iron Chest',
    desc: 'Reinforced iron lock (DC 14 Thieves’ Tools). Contains 85 gp, potion of healing, and a silver dagger.',
    dc: 14
  },
  ambush: {
    title: 'Ambush Trigger Zone',
    desc: 'Stealth check 16. Two archers fire from arrow slits when PCs step into this square.',
    dc: 16
  },
  note: {
    title: 'Ancient Inscription',
    desc: 'Runes carved into stone: "Speak the name of the storm to open the vault."',
    dc: 12
  },
  hazard: {
    title: 'Unstable Crumbling Floor',
    desc: 'Walking creature exceeding 100 lbs causes 10ft collapse into cellar.',
    dc: 13
  }
};

export const PinCreateModal: React.FC<PinCreateModalProps> = ({ cell, onSave, onClose }) => {
  const [type, setType] = useState<MapPinType>('trap');
  const [title, setTitle] = useState(PIN_PRESETS.trap.title);
  const [description, setDescription] = useState(PIN_PRESETS.trap.desc);
  const [dc, setDc] = useState<string>(String(PIN_PRESETS.trap.dc || ''));
  const [isSecret, setIsSecret] = useState(true);

  const colLetter = String.fromCharCode(65 + cell.x);
  const coordLabel = `${colLetter}${cell.y + 1}`;

  const handleSelectType = (newType: MapPinType) => {
    setType(newType);
    const preset = PIN_PRESETS[newType];
    setTitle(preset.title);
    setDescription(preset.desc);
    setDc(preset.dc ? String(preset.dc) : '');
  };

  const handleConfirm = () => {
    const newPin: BattlemapPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: cell.x,
      y: cell.y,
      type,
      title: title.trim() || 'Map Note',
      description: description.trim(),
      dc: dc ? parseInt(dc, 10) || undefined : undefined,
      isSecret,
      createdAt: Date.now()
    };
    onSave(newPin);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleUp text-stone-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-100">
                Drop Secret GM Pin at <span className="font-mono text-amber-400">{coordLabel}</span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Tag traps, secret doors, hidden loot, or DM notes on this cell.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          {/* Pin Type Selector */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1.5">
              Pin Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PIN_TYPE_CONFIG) as MapPinType[]).map((tKey) => {
                const c = PIN_TYPE_CONFIG[tKey];
                const active = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => handleSelectType(tKey)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition text-left cursor-pointer ${
                      active
                        ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
              Pin Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Poison Dart Pressure Plate"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                DC Check (Optional)
              </label>
              <input
                type="number"
                min="1"
                max="35"
                value={dc}
                onChange={(e) => setDc(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Initial Visibility
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded bg-stone-900 border-stone-700 text-purple-600 focus:ring-0"
                />
                <span className="text-stone-300">GM Eyes Only</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
              Description / DM Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on detection, disarming, consequences, or narrative description..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Place Pin on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
