import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { getMaxHpBreakdown } from '../../utils/dndCalculations';
import { Heart, Shield, Sparkles, X, Plus, Minus, Zap, RefreshCw, AlertTriangle, Info } from 'lucide-react';

interface MaxHpInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const MaxHpInspectorModal: React.FC<MaxHpInspectorModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  if (!isOpen) return null;

  const breakdown = getMaxHpBreakdown(character);

  const [baseMaxInput, setBaseMaxInput] = useState<number>(character.hpMax || 10);
  const [modInput, setModInput] = useState<number>(character.maxHpModifier || 0);

  const handleSave = () => {
    const validBase = Math.max(1, baseMaxInput);
    const updated: CharacterData = {
      ...character,
      hpMax: validBase,
      maxHpModifier: modInput,
      hpCurrent: Math.min(character.hpCurrent, Math.max(1, baseMaxInput + modInput + breakdown.featBonus + breakdown.equippedItemBonus))
    };
    onUpdateCharacter(updated);
    onClose();
  };

  const applyModPreset = (delta: number) => {
    setModInput(prev => prev + delta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-serif font-bold text-base">
            <Heart className="w-5 h-5 fill-rose-500/20 text-rose-500" />
            <span>Hit Point Maximum Breakdown</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh] text-stone-200 text-xs">
          {/* Main Total Highlight */}
          <div className="bg-gradient-to-br from-stone-950 via-rose-950/30 to-stone-950 border border-rose-900/60 p-4 rounded-xl text-center shadow-inner">
            <span className="text-stone-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
              Effective Max Hit Points
            </span>
            <div className="text-4xl font-extrabold font-serif text-rose-400 drop-shadow-md">
              {breakdown.effectiveMaxHp} <span className="text-base text-stone-400 font-normal font-sans">HP</span>
            </div>
            {breakdown.exhaustionHalved && (
              <div className="mt-2 text-amber-400 font-bold flex items-center justify-center gap-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Halved due to Level 4+ Exhaustion</span>
              </div>
            )}
          </div>

          {/* Contributing Sources List */}
          <div className="space-y-2">
            <label className="text-amber-200 font-bold uppercase tracking-wider text-[10px] block border-b border-stone-800 pb-1">
              Active Max HP Contributors
            </label>
            <ul className="space-y-1.5 font-mono text-[11px]">
              {breakdown.details.map((detail, idx) => (
                <li
                  key={idx}
                  className="bg-stone-950/80 border border-stone-800/80 p-2 rounded-lg flex items-center justify-between"
                >
                  <span className="text-stone-300">{detail}</span>
                  {idx === 0 && <span className="text-stone-500 text-[10px] uppercase font-sans">Permanent</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Form Controls */}
          <div className="space-y-4 pt-2 border-t border-stone-800">
            {/* Base Max HP Input */}
            <div>
              <label className="block text-stone-300 font-bold mb-1">
                Base Max HP <span className="text-stone-500 font-normal text-[11px]">(Permanent Class & Level HP)</span>
              </label>
              <input
                type="number"
                min="1"
                value={baseMaxInput}
                onChange={(e) => setBaseMaxInput(parseInt(e.target.value) || 1)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-amber-200 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Active Max HP Modifier (Spells / Life Drain) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-rose-300 font-bold">
                  Active Max HP Modifier <span className="text-stone-400 font-normal text-[11px]">(Spells, Drain, Curses)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModInput(0)}
                  className="text-[10px] text-stone-400 hover:text-stone-200 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset 0
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={modInput}
                  onChange={(e) => setModInput(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +5 or -10"
                  className="w-full bg-stone-950 border border-rose-800/60 rounded-xl p-2.5 text-rose-300 font-mono font-bold text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                <span className="text-stone-500 font-semibold text-[10px] mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyModPreset(5)}
                  className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-2 py-1 rounded-lg font-mono font-bold transition"
                  title="Cast Aid (+5 Max HP)"
                >
                  +5 (Aid 2nd)
                </button>
                <button
                  type="button"
                  onClick={() => applyModPreset(10)}
                  className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-2 py-1 rounded-lg font-mono font-bold transition"
                  title="Cast Aid at 3rd level (+10 Max HP)"
                >
                  +10 (Aid 3rd)
                </button>
                <button
                  type="button"
                  onClick={() => applyModPreset(-5)}
                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg font-mono font-bold transition"
                  title="Life Drain / Specter / Wight Attack"
                >
                  -5 (Drain)
                </button>
                <button
                  type="button"
                  onClick={() => applyModPreset(-10)}
                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg font-mono font-bold transition"
                  title="Vampire Bite / Curse"
                >
                  -10 (Vampire)
                </button>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-stone-950/90 border border-amber-800/40 rounded-xl text-[11px] text-stone-400 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5">Dynamic Item & Feat Max HP Rules:</strong>
              Equipped items (e.g., <em>Ring of Vitality +10 Max HP</em>) or Feats (e.g., <em>Tough</em>) automatically contribute to Effective Max HP as long as they remain equipped or active on the character.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold transition text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl font-bold transition text-xs shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
