import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getCharacterBab,
  get35eIterativeAttacks,
  format35eBabProgression,
  formatModifier,
  get35eGrapple
} from '../../utils/dndCalculations';
import { Swords, X, CheckCircle2, Shield, Info, HelpCircle } from 'lucide-react';

interface Edit35eBabModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const Edit35eBabModal: React.FC<Edit35eBabModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const currentBab = getCharacterBab(character);
  const [babValue, setBabValue] = useState<number>(currentBab);

  if (!isOpen) return null;

  const level = Math.max(1, character.level || 1);
  const fullBabPreset = level;
  const mediumBabPreset = Math.floor(level * 0.75);
  const poorBabPreset = Math.floor(level * 0.5);

  const previewIteratives = get35eIterativeAttacks(babValue, babValue);

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      bab: babValue,
      baseAttackBonus: babValue
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-lg text-amber-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-amber-200">
                3.5e Base Attack Bonus (BAB)
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {character.name} &bull; Level {level} {character.characterClass}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Explanation */}
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-300/90 flex gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                In <strong>D&D 3.5e</strong>, your Base Attack Bonus (BAB) increases with level and determines your attack rolls and extra iterative attacks on a <strong>Full Attack action</strong>:
              </p>
              <p className="text-[11px] text-stone-400">
                &bull; <strong>BAB +1 to +5:</strong> 1 attack &bull; <strong>BAB +6 to +10:</strong> 2 attacks (+0, -5)<br />
                &bull; <strong>BAB +11 to +15:</strong> 3 attacks (+0, -5, -10) &bull; <strong>BAB +16+:</strong> 4 attacks (+0, -5, -10, -15)
              </p>
            </div>
          </div>

          {/* Current BAB Input */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-bold text-stone-300 block uppercase tracking-wider">
              Base Attack Bonus (BAB)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={30}
                value={babValue}
                onChange={(e) => setBabValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-24 text-center text-2xl font-mono font-bold bg-stone-900 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-xs text-stone-400">Iterative Attacks on Full Attack:</div>
                <div className="text-base font-mono font-bold text-emerald-300">
                  {format35eBabProgression(babValue)}
                </div>
                <div className="text-[11px] text-stone-500">
                  {previewIteratives.length} total attack{previewIteratives.length > 1 ? 's' : ''} per round
                </div>
              </div>
            </div>

            {/* Quick Class Progression Presets */}
            <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
              <div className="text-[11px] font-bold text-stone-400">Quick Presets for Level {level}:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBabValue(fullBabPreset)}
                  className={`p-2 rounded-lg border text-left transition ${
                    babValue === fullBabPreset
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="text-xs font-bold">Full BAB (+{fullBabPreset})</div>
                  <div className="text-[10px] text-stone-400 truncate">Fighter, Paladin, Barbarian, Ranger</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBabValue(mediumBabPreset)}
                  className={`p-2 rounded-lg border text-left transition ${
                    babValue === mediumBabPreset
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="text-xs font-bold">Medium BAB (+{mediumBabPreset})</div>
                  <div className="text-[10px] text-stone-400 truncate">Cleric, Rogue, Monk, Druid, Bard</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBabValue(poorBabPreset)}
                  className={`p-2 rounded-lg border text-left transition ${
                    babValue === poorBabPreset
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="text-xs font-bold">Poor BAB (+{poorBabPreset})</div>
                  <div className="text-[10px] text-stone-400 truncate">Wizard, Sorcerer</div>
                </button>
              </div>
            </div>
          </div>

          {/* Iterative Attacks Breakdown Table */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span>Full Attack Sequence Breakdown</span>
              <span className="text-stone-500 font-normal text-[11px] font-mono">
                BAB {formatModifier(babValue)}
              </span>
            </div>
            <div className="space-y-1.5">
              {previewIteratives.map((it) => (
                <div
                  key={it.attackNumber}
                  className="flex items-center justify-between px-3 py-1.5 bg-stone-900 rounded-lg border border-stone-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center text-[10px] font-bold border border-amber-700/50">
                      {it.attackNumber}
                    </span>
                    <span className="text-stone-300 font-sans font-medium">{it.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[11px]">
                      {it.penalty === 0 ? 'Full BAB' : `${it.penalty} penalty`}
                    </span>
                    <span className="font-bold text-amber-300 text-sm">{it.display}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Dependent Stats: Grapple */}
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-400">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Resulting Grapple Check:</span>
            </div>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {formatModifier(babValue + (character.abilities.STR ? Math.floor((character.abilities.STR.score - 10) / 2) : 0))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save BAB</span>
          </button>
        </div>
      </div>
    </div>
  );
};
