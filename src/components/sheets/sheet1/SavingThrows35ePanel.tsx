import React from 'react';
import { CharacterData } from '../../../types';
import {
  getAbilityModifier,
  formatModifier,
  get35eFortSave,
  get35eRefSave,
  get35eWillSave
} from '../../../utils/dndCalculations';
import { Shield, Dices } from 'lucide-react';

interface SavingThrows35ePanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const SavingThrows35ePanel: React.FC<SavingThrows35ePanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  return (
    <div className="bg-stone-900 border border-amber-700/40 rounded-2xl p-4 shadow-xl text-stone-100">
      <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
        <div className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          D&D 3.5e Saving Throws (Fortitude / Reflex / Will)
        </div>
        <span className="text-xs text-stone-400 font-mono">Base Save + Ability Mod = Total Save</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fortitude Save */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-xs uppercase">Fortitude (FORT)</span>
            <span className="text-[10px] text-stone-400">
              CON Mod: {formatModifier(getAbilityModifier(character.abilities.CON?.score || 10))}
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-xs text-stone-400 flex items-center gap-1">
              <span>Base:</span>
              <input
                type="number"
                value={character.fortSaveBase ?? 4}
                onChange={(e) => onUpdateCharacter({ ...character, fortSaveBase: parseInt(e.target.value) || 0 })}
                className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
              />
            </div>
            <div className="text-2xl font-serif font-extrabold text-emerald-300">
              {formatModifier(get35eFortSave(character))}
            </div>
          </div>

          <button
            onClick={() => onRoll('Fortitude Save (3.5e)', 20, 1, get35eFortSave(character), 'normal')}
            className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
          >
            <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Fort Save
          </button>
        </div>

        {/* Reflex Save */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-xs uppercase">Reflex (REF)</span>
            <span className="text-[10px] text-stone-400">
              DEX Mod: {formatModifier(getAbilityModifier(character.abilities.DEX?.score || 10))}
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-xs text-stone-400 flex items-center gap-1">
              <span>Base:</span>
              <input
                type="number"
                value={character.refSaveBase ?? 1}
                onChange={(e) => onUpdateCharacter({ ...character, refSaveBase: parseInt(e.target.value) || 0 })}
                className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
              />
            </div>
            <div className="text-2xl font-serif font-extrabold text-emerald-300">
              {formatModifier(get35eRefSave(character))}
            </div>
          </div>

          <button
            onClick={() => onRoll('Reflex Save (3.5e)', 20, 1, get35eRefSave(character), 'normal')}
            className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
          >
            <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Ref Save
          </button>
        </div>

        {/* Will Save */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-xs uppercase">Will (WILL)</span>
            <span className="text-[10px] text-stone-400">
              WIS Mod: {formatModifier(getAbilityModifier(character.abilities.WIS?.score || 10))}
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-xs text-stone-400 flex items-center gap-1">
              <span>Base:</span>
              <input
                type="number"
                value={character.willSaveBase ?? 1}
                onChange={(e) => onUpdateCharacter({ ...character, willSaveBase: parseInt(e.target.value) || 0 })}
                className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
              />
            </div>
            <div className="text-2xl font-serif font-extrabold text-emerald-300">
              {formatModifier(get35eWillSave(character))}
            </div>
          </div>

          <button
            onClick={() => onRoll('Will Save (3.5e)', 20, 1, get35eWillSave(character), 'normal')}
            className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
          >
            <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Will Save
          </button>
        </div>
      </div>
    </div>
  );
};
