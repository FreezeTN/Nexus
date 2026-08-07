import React from 'react';
import { AbilityName, CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getSpellSaveDC,
  getSpellAttackBonus,
  getAbilityModifier,
  formatModifier
} from '../../../utils/dndCalculations';
import { Wand2, RefreshCw } from 'lucide-react';

interface SpellcastingStatsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const SpellcastingStatsPanel: React.FC<SpellcastingStatsPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const spellDC = getSpellSaveDC(character);
  const spellAtk = getSpellAttackBonus(character);
  const abilityMod = getAbilityModifier(character.abilities[character.spellcastingAbility]?.score || 10);

  const handleAbilityChange = (ability: AbilityName) => {
    onUpdateCharacter({
      ...character,
      spellcastingAbility: ability
    });
  };

  const handleSlotChange = (level: number, current: number, max?: number) => {
    const updatedSlots = character.spellSlots.map(s => {
      if (s.level === level) {
        return {
          ...s,
          current: Math.max(0, current),
          max: max !== undefined ? Math.max(0, max) : s.max
        };
      }
      return s;
    });
    onUpdateCharacter({ ...character, spellSlots: updatedSlots });
  };

  const handleRestoreAllSlots = () => {
    const restored = character.spellSlots.map(s => ({ ...s, current: s.max }));
    onUpdateCharacter({ ...character, spellSlots: restored });
  };

  return (
    <CollapsibleBox
      title="Spellcasting Stats & Slot Tracker"
      icon={<Wand2 className="w-5 h-5 text-amber-500" />}
      storageKey="sheet4_stats"
      headerExtra={
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRestoreAllSlots();
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg text-xs font-bold transition shadow"
          title="Restore all spell slots to maximum (Long Rest)"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Restore All Slots
        </button>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Ability, Save DC & Attack Bonus Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Spellcasting Ability Choice */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
            <span className="text-stone-400 font-serif font-bold text-xs uppercase block font-sans">
              Spellcasting Ability
            </span>
            <div className="my-2 flex items-center justify-between">
              <select
                value={character.spellcastingAbility}
                onChange={(e) => handleAbilityChange(e.target.value as AbilityName)}
                className="bg-stone-900 border border-amber-600/50 rounded-lg px-2 py-1 text-amber-200 font-bold font-mono focus:outline-none"
              >
                <option value="INT">Intelligence (INT)</option>
                <option value="WIS">Wisdom (WIS)</option>
                <option value="CHA">Charisma (CHA)</option>
                <option value="STR">Strength (STR)</option>
                <option value="DEX">Dexterity (DEX)</option>
                <option value="CON">Constitution (CON)</option>
              </select>
              <span className="font-mono text-sm font-bold text-amber-300">
                {formatModifier(abilityMod)}
              </span>
            </div>
          </div>

          {/* Spell Save DC */}
          <div className="bg-stone-950 p-3 rounded-xl border border-amber-600/30 flex flex-col items-center justify-center">
            <span className="text-stone-400 text-[10px] font-sans uppercase font-bold">Spell Save DC</span>
            <span className="text-2xl font-serif font-extrabold text-amber-300 my-0.5">{spellDC}</span>
            <span className="text-[9px] text-stone-500 font-mono">8 + Prof + Ability Mod</span>
          </div>

          {/* Spell Attack Modifier */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
            <span className="text-stone-400 text-[10px] font-sans uppercase font-bold">Spell Attack Bonus</span>
            <span className="text-2xl font-serif font-extrabold text-emerald-300 my-0.5">{formatModifier(spellAtk)}</span>
            <span className="text-[9px] text-stone-500 font-mono">Prof + Ability Mod</span>
          </div>
        </div>

        {/* Spell Slot Trackers (Levels 1 to 9) */}
        <div>
          <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
            Spell Slot Tracker (Click - / + or input slots remaining)
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const slot = character.spellSlots.find(s => s.level === lvl) || { level: lvl, current: 0, max: 0 };
              return (
                <div key={lvl} className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase">Lvl {lvl}</span>

                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleSlotChange(lvl, slot.current - 1)}
                      className="w-5 h-5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold rounded text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-bold text-amber-200 text-xs w-5">{slot.current}</span>
                    <button
                      onClick={() => handleSlotChange(lvl, slot.current + 1)}
                      className="w-5 h-5 bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-100 font-bold rounded text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-[9px] text-stone-500 flex items-center justify-center gap-0.5">
                    <span>/</span>
                    <input
                      type="number"
                      min="0"
                      value={slot.max}
                      onChange={(e) => handleSlotChange(lvl, slot.current, parseInt(e.target.value) || 0)}
                      className="w-6 bg-transparent text-center font-bold text-stone-400 border-b border-stone-800 p-0"
                      title="Max slots"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleBox>
  );
};
