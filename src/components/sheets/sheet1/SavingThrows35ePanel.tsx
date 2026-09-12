import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import {
  get35eSaveBreakdown,
  formatModifier
} from '../../../utils/dndCalculations';
import { Shield, Dices, Settings, Sparkles, Heart, Eye } from 'lucide-react';
import { Edit35eSavesModal } from '../../modals/Edit35eSavesModal';

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
  const [showEditModal, setShowEditModal] = useState(false);

  const fort = get35eSaveBreakdown(character, 'fort');
  const ref = get35eSaveBreakdown(character, 'ref');
  const will = get35eSaveBreakdown(character, 'will');

  return (
    <div className="bg-stone-900 border border-amber-700/40 rounded-2xl p-4 shadow-xl text-stone-100 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>D&D 3.5e Saving Throws (Fortitude / Reflex / Will)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
            Base + Mod + Magic + Feats = Total
          </span>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition"
            title="Edit Base Saves, Magic items, Cloak of Resistance, Divine Grace, and Feats"
          >
            <Settings className="w-3.5 h-3.5" /> Edit Saves
          </button>
        </div>
      </div>

      {/* 3 Saves Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* FORTITUDE */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between hover:border-amber-600/50 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Fortitude
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                CON {formatModifier(fort.abilityMod)}
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="text-[11px] text-stone-400 font-mono">
                <div>Base: <strong className="text-amber-200">+{fort.base}</strong></div>
                {(fort.magicMod !== 0 || fort.miscMod !== 0 || fort.divineGraceMod > 0 || fort.halflingMod > 0) && (
                  <div className="text-[10px] text-emerald-400">
                    +{fort.magicMod + fort.miscMod + fort.divineGraceMod + fort.halflingMod} buffs
                  </div>
                )}
              </div>
              <div className="text-2xl font-serif font-extrabold text-emerald-300 font-mono">
                {formatModifier(fort.total)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={() => onRoll('Fortitude Save (3.5e)', 20, 1, fort.total, 'normal')}
              className="flex-1 py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Fort
            </button>
          </div>
        </div>

        {/* REFLEX */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between hover:border-amber-600/50 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Reflex
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                DEX {formatModifier(ref.abilityMod)}
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="text-[11px] text-stone-400 font-mono">
                <div>Base: <strong className="text-amber-200">+{ref.base}</strong></div>
                {(ref.magicMod !== 0 || ref.miscMod !== 0 || ref.divineGraceMod > 0 || ref.halflingMod > 0) && (
                  <div className="text-[10px] text-emerald-400">
                    +{ref.magicMod + ref.miscMod + ref.divineGraceMod + ref.halflingMod} buffs
                  </div>
                )}
              </div>
              <div className="text-2xl font-serif font-extrabold text-emerald-300 font-mono">
                {formatModifier(ref.total)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={() => onRoll('Reflex Save (3.5e)', 20, 1, ref.total, 'normal')}
              className="flex-1 py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Ref
            </button>
          </div>
        </div>

        {/* WILL */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between hover:border-amber-600/50 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Will
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                WIS {formatModifier(will.abilityMod)}
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="text-[11px] text-stone-400 font-mono">
                <div>Base: <strong className="text-amber-200">+{will.base}</strong></div>
                {(will.magicMod !== 0 || will.miscMod !== 0 || will.divineGraceMod > 0 || will.halflingMod > 0) && (
                  <div className="text-[10px] text-emerald-400">
                    +{will.magicMod + will.miscMod + will.divineGraceMod + will.halflingMod} buffs
                  </div>
                )}
              </div>
              <div className="text-2xl font-serif font-extrabold text-emerald-300 font-mono">
                {formatModifier(will.total)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={() => onRoll('Will Save (3.5e)', 20, 1, will.total, 'normal')}
              className="flex-1 py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Will
            </button>
          </div>
        </div>
      </div>

      {/* Conditional save notes display if present */}
      {character.saveConditionalModifiers && (
        <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-[11px] text-amber-300 font-mono flex items-center justify-between">
          <span>
            <strong>Conditional:</strong> {character.saveConditionalModifiers}
          </span>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="text-[10px] text-stone-400 hover:text-white underline ml-2"
          >
            Edit
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Edit35eSavesModal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}
    </div>
  );
};
