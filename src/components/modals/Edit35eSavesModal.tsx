import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eBaseSaves,
  get35eSaveBreakdown,
  formatModifier
} from '../../utils/dndCalculations';
import {
  Shield,
  X,
  Check,
  Sparkles,
  HelpCircle,
  Dices,
  RefreshCw,
  Heart,
  Eye
} from 'lucide-react';

interface Edit35eSavesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const Edit35eSavesModal: React.FC<Edit35eSavesModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const level = Math.max(1, character.level || 1);
  const classBaseSaves = calculate35eBaseSaves(character.characterClass, level);

  const [fortBase, setFortBase] = useState<number>(character.fortSaveBase ?? classBaseSaves.fort);
  const [refBase, setRefBase] = useState<number>(character.refSaveBase ?? classBaseSaves.ref);
  const [willBase, setWillBase] = useState<number>(character.willSaveBase ?? classBaseSaves.will);

  const [fortMagic, setFortMagic] = useState<number>(character.fortSaveMagic || 0);
  const [refMagic, setRefMagic] = useState<number>(character.refSaveMagic || 0);
  const [willMagic, setWillMagic] = useState<number>(character.willSaveMagic || 0);

  const [fortMisc, setFortMisc] = useState<number>(character.fortSaveMisc || 0);
  const [refMisc, setRefMisc] = useState<number>(character.refSaveMisc || 0);
  const [willMisc, setWillMisc] = useState<number>(character.willSaveMisc || 0);

  const [divineGrace, setDivineGrace] = useState<boolean>(
    Boolean(
      character.divineGraceActive ||
      (character.characterClass?.toLowerCase().includes('paladin') && level >= 2)
    )
  );
  const [conditionalNotes, setConditionalNotes] = useState<string>(
    character.saveConditionalModifiers || ''
  );

  if (!isOpen) return null;

  // Temp character object for real-time calculation preview
  const previewChar: CharacterData = {
    ...character,
    fortSaveBase: fortBase,
    refSaveBase: refBase,
    willSaveBase: willBase,
    fortSaveMagic: fortMagic,
    refSaveMagic: refMagic,
    willSaveMagic: willMagic,
    fortSaveMisc: fortMisc,
    refSaveMisc: refMisc,
    willSaveMisc: willMisc,
    divineGraceActive: divineGrace,
    saveConditionalModifiers: conditionalNotes
  };

  const fortBreakdown = get35eSaveBreakdown(previewChar, 'fort');
  const refBreakdown = get35eSaveBreakdown(previewChar, 'ref');
  const willBreakdown = get35eSaveBreakdown(previewChar, 'will');

  const handleApplyClassDefaults = () => {
    setFortBase(classBaseSaves.fort);
    setRefBase(classBaseSaves.ref);
    setWillBase(classBaseSaves.will);
  };

  const handleApplyCloak = (bonus: number) => {
    setFortMagic(bonus);
    setRefMagic(bonus);
    setWillMagic(bonus);
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      fortSaveBase: fortBase,
      refSaveBase: refBase,
      willSaveBase: willBase,
      fortSaveMagic: fortMagic,
      refSaveMagic: refMagic,
      willSaveMagic: willMagic,
      fortSaveMisc: fortMisc,
      refSaveMisc: refMisc,
      willSaveMisc: willMisc,
      divineGraceActive: divineGrace,
      saveConditionalModifiers: conditionalNotes.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/70 border border-amber-600/40 rounded-xl text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-200">
                3.5e Saving Throws Breakdown
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {character.name} &bull; Level {level} {character.characterClass}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Helper Banner */}
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Standard 3.5e formula:{' '}
                <strong className="text-amber-200 font-mono">
                  Base + Ability Mod + Magic + Misc + Divine Grace = Total
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplyClassDefaults}
              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-700/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" /> Auto-Base from Class
            </button>
          </div>

          {/* Quick Cloak of Resistance Preset */}
          <div className="flex items-center justify-between bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <span className="text-stone-400 text-xs font-mono">
              Apply Cloak of Resistance (Resistance bonus to all saves):
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleApplyCloak(val)}
                  className={`px-2 py-0.5 rounded border transition ${
                    fortMagic === val && refMagic === val && willMagic === val
                      ? 'bg-amber-500 text-stone-950 border-amber-400'
                      : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleApplyCloak(0)}
                className="px-2 py-0.5 rounded border bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-800"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Saves Editor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FORTITUDE */}
            <div className="bg-stone-950 p-3.5 rounded-xl border border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300 text-sm">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Fortitude</span>
                </div>
                <div className="text-xl font-serif font-extrabold text-emerald-300 font-mono">
                  {formatModifier(fortBreakdown.total)}
                </div>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Base Save:</span>
                  <input
                    type="number"
                    value={fortBase}
                    onChange={(e) => setFortBase(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-1"
                  />
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>CON Mod:</span>
                  <span className="font-bold text-stone-200">
                    {formatModifier(fortBreakdown.abilityMod)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Magic/Cloak:</span>
                  <input
                    type="number"
                    value={fortMagic}
                    onChange={(e) => setFortMagic(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Misc/Feats:</span>
                  <input
                    type="number"
                    value={fortMisc}
                    onChange={(e) => setFortMisc(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                    title="e.g. Great Fortitude (+2)"
                  />
                </div>
                {fortBreakdown.divineGraceMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Divine Grace:</span>
                    <span>+{fortBreakdown.divineGraceMod}</span>
                  </div>
                )}
                {fortBreakdown.halflingMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Halfling Luck:</span>
                    <span>+{fortBreakdown.halflingMod}</span>
                  </div>
                )}
              </div>

              {onRoll && (
                <button
                  type="button"
                  onClick={() => onRoll('Fortitude Save (3.5e)', 20, 1, fortBreakdown.total, 'normal')}
                  className="w-full py-1.5 bg-stone-900 hover:bg-emerald-950 text-emerald-300 border border-stone-800 hover:border-emerald-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Roll Fortitude
                </button>
              )}
            </div>

            {/* REFLEX */}
            <div className="bg-stone-950 p-3.5 rounded-xl border border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300 text-sm">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Reflex</span>
                </div>
                <div className="text-xl font-serif font-extrabold text-emerald-300 font-mono">
                  {formatModifier(refBreakdown.total)}
                </div>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Base Save:</span>
                  <input
                    type="number"
                    value={refBase}
                    onChange={(e) => setRefBase(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-1"
                  />
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>DEX Mod:</span>
                  <span className="font-bold text-stone-200">
                    {formatModifier(refBreakdown.abilityMod)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Magic/Cloak:</span>
                  <input
                    type="number"
                    value={refMagic}
                    onChange={(e) => setRefMagic(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Misc/Feats:</span>
                  <input
                    type="number"
                    value={refMisc}
                    onChange={(e) => setRefMisc(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                    title="e.g. Lightning Reflexes (+2)"
                  />
                </div>
                {refBreakdown.divineGraceMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Divine Grace:</span>
                    <span>+{refBreakdown.divineGraceMod}</span>
                  </div>
                )}
                {refBreakdown.halflingMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Halfling Luck:</span>
                    <span>+{refBreakdown.halflingMod}</span>
                  </div>
                )}
              </div>

              {onRoll && (
                <button
                  type="button"
                  onClick={() => onRoll('Reflex Save (3.5e)', 20, 1, refBreakdown.total, 'normal')}
                  className="w-full py-1.5 bg-stone-900 hover:bg-emerald-950 text-emerald-300 border border-stone-800 hover:border-emerald-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Roll Reflex
                </button>
              )}
            </div>

            {/* WILL */}
            <div className="bg-stone-950 p-3.5 rounded-xl border border-amber-800/40 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Will</span>
                </div>
                <div className="text-xl font-serif font-extrabold text-emerald-300 font-mono">
                  {formatModifier(willBreakdown.total)}
                </div>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Base Save:</span>
                  <input
                    type="number"
                    value={willBase}
                    onChange={(e) => setWillBase(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-1"
                  />
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>WIS Mod:</span>
                  <span className="font-bold text-stone-200">
                    {formatModifier(willBreakdown.abilityMod)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Magic/Cloak:</span>
                  <input
                    type="number"
                    value={willMagic}
                    onChange={(e) => setWillMagic(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Misc/Feats:</span>
                  <input
                    type="number"
                    value={willMisc}
                    onChange={(e) => setWillMisc(parseInt(e.target.value) || 0)}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 p-1"
                    title="e.g. Iron Will (+2)"
                  />
                </div>
                {willBreakdown.divineGraceMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Divine Grace:</span>
                    <span>+{willBreakdown.divineGraceMod}</span>
                  </div>
                )}
                {willBreakdown.halflingMod > 0 && (
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Halfling Luck:</span>
                    <span>+{willBreakdown.halflingMod}</span>
                  </div>
                )}
              </div>

              {onRoll && (
                <button
                  type="button"
                  onClick={() => onRoll('Will Save (3.5e)', 20, 1, willBreakdown.total, 'normal')}
                  className="w-full py-1.5 bg-stone-900 hover:bg-emerald-950 text-emerald-300 border border-stone-800 hover:border-emerald-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Roll Will
                </button>
              )}
            </div>
          </div>

          {/* Divine Grace & Situational Modifiers */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={divineGrace}
                  onChange={(e) => setDivineGrace(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
                <div>
                  <span className="font-bold text-amber-200">Paladin Divine Grace</span>
                  <p className="text-[11px] text-stone-400">
                    Add Charisma modifier ({formatModifier(fortBreakdown.divineGraceMod || 0)}) as a bonus to all saving throws.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {divineGrace ? `+${fortBreakdown.divineGraceMod}` : 'Off'}
              </span>
            </label>

            <div className="pt-2 border-t border-stone-800">
              <label className="block text-stone-300 font-bold mb-1">
                Conditional Modifiers & Resistances
              </label>
              <input
                type="text"
                placeholder="e.g. +2 vs enchantments, +4 vs poison, +1 vs fear"
                value={conditionalNotes}
                onChange={(e) => setConditionalNotes(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 placeholder-stone-600 font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl transition text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs"
          >
            <Check className="w-4 h-4" /> Save Modifiers
          </button>
        </div>
      </div>
    </div>
  );
};
