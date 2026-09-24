import React, { useState } from 'react';
import { BattlemapPin, MapPinType } from './battlemapTypes';
import { PIN_TYPE_CONFIG } from './BattlemapPinsLayer';
import { Eye, EyeOff, Trash2, Edit3, Check, X, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

interface PinInspectorModalProps {
  pin: BattlemapPin;
  isDm: boolean;
  onClose: () => void;
  onUpdatePin: (updated: BattlemapPin) => void;
  onDeletePin: (pinId: string) => void;
}

export const PinInspectorModal: React.FC<PinInspectorModalProps> = ({
  pin,
  isDm,
  onClose,
  onUpdatePin,
  onDeletePin
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(pin.title);
  const [description, setDescription] = useState(pin.description || '');
  const [dc, setDc] = useState<string>(pin.dc !== undefined ? String(pin.dc) : '');
  const [type, setType] = useState<MapPinType>(pin.type);
  const [isSecret, setIsSecret] = useState(pin.isSecret);

  const colLetter = String.fromCharCode(65 + pin.x);
  const coordLabel = `${colLetter}${pin.y + 1}`;
  const config = PIN_TYPE_CONFIG[pin.type] || PIN_TYPE_CONFIG.note;

  const handleSave = () => {
    onUpdatePin({
      ...pin,
      title: title.trim() || 'Map Note',
      description: description.trim(),
      dc: dc ? parseInt(dc, 10) || undefined : undefined,
      type,
      isSecret
    });
    setIsEditing(false);
  };

  const handleToggleSecret = () => {
    const nextSecret = !pin.isSecret;
    onUpdatePin({
      ...pin,
      isSecret: nextSecret
    });
    setIsSecret(nextSecret);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleUp text-stone-100 font-sans"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Pin Theme Color */}
        <div
          className="px-5 py-4 border-b border-stone-800 flex items-center justify-between"
          style={{ backgroundColor: `${config.borderColor}15` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-stone-950 border border-stone-800 shadow-inner">
              {config.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                  {config.label}
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-stone-800 text-stone-300 rounded border border-stone-700">
                  📍 {coordLabel}
                </span>
                {pin.isSecret ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-purple-950/80 text-purple-300 rounded border border-purple-800">
                    <EyeOff className="w-2.5 h-2.5 text-purple-400" />
                    <span>GM Secret</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-emerald-950/80 text-emerald-300 rounded border border-emerald-800">
                    <Eye className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Revealed</span>
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-base text-stone-100 truncate mt-0.5">
                {pin.title}
              </h3>
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

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {isEditing ? (
            /* Editing Form */
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                  Pin Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(PIN_TYPE_CONFIG) as MapPinType[]).map((tKey) => {
                    const c = PIN_TYPE_CONFIG[tKey];
                    const active = type === tKey;
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => setType(tKey)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition text-left ${
                          active
                            ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                            : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:border-stone-700'
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
                  Pin Title / Label
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hidden Spike Pit Trap"
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
                    Visibility
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSecret}
                      onChange={(e) => setIsSecret(e.target.checked)}
                      className="rounded bg-stone-900 border-stone-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-stone-300">GM Only (Secret)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                  Description / Trigger Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details when triggered, damage dice, saving throw, or clues..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* View Details Mode */
            <div className="space-y-3">
              {pin.dc !== undefined && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold text-xs">
                    DC {pin.dc}
                  </span>
                  <span className="text-xs text-stone-300">
                    Difficulty Class to detect, disarm, or investigate.
                  </span>
                </div>
              )}

              <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs text-stone-300 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                {pin.description || <span className="italic text-stone-500">No additional description provided.</span>}
              </div>

              {isDm && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleToggleSecret}
                    className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow ${
                      pin.isSecret
                        ? 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border-emerald-700/80'
                        : 'bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border-purple-700/80'
                    }`}
                  >
                    {pin.isSecret ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reveal to Players (Party Spotted This)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                        <span>Hide as Secret (GM Eyes Only)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-semibold">Delete this pin?</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePin(pin.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(false);
                    }}
                    className="px-2 py-1 rounded border border-stone-700 text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/70 hover:text-rose-300 text-xs font-medium border border-rose-900/50 hover:border-rose-700 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Pin</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Pin</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
