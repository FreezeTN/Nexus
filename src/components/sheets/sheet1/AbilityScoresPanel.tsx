import React from 'react';
import { AbilityName, CharacterData } from '../../../types';
import { getAbilityModifier, formatModifier, getSavingThrowBonus } from '../../../utils/dndCalculations';
import { Dices, CheckSquare, Square } from 'lucide-react';

interface AbilityScoresPanelProps {
  character: CharacterData;
  editingAbilities: boolean;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const AbilityScoresPanel: React.FC<AbilityScoresPanelProps> = ({
  character,
  editingAbilities,
  onUpdateCharacter,
  onRoll
}) => {
  const abilitiesList: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  const handleScoreChange = (ability: AbilityName, newScore: number) => {
    onUpdateCharacter({
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: { ...character.abilities[ability], score: Math.max(1, newScore) }
      }
    });
  };

  const handleSavingThrowToggle = (ability: AbilityName) => {
    const isProf = character.savingThrowProficiencies.includes(ability);
    const updated = isProf
      ? character.savingThrowProficiencies.filter(a => a !== ability)
      : [...character.savingThrowProficiencies, ability];
    onUpdateCharacter({ ...character, savingThrowProficiencies: updated });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {abilitiesList.map((ability) => {
        const score = character.abilities[ability]?.score || 10;
        const mod = getAbilityModifier(score);
        const isSaveProf = character.savingThrowProficiencies.includes(ability);
        const saveBonus = getSavingThrowBonus(ability, character.abilities, character.savingThrowProficiencies, character.level);

        return (
          <div
            key={ability}
            className="bg-stone-900 border border-amber-800/30 hover:border-amber-600/60 rounded-2xl p-3 shadow-lg flex flex-col items-center justify-between transition group"
          >
            <div className="text-xs font-mono font-extrabold uppercase text-amber-500 tracking-wider">
              {ability}
            </div>

            {/* Score & Modifier */}
            <div className="my-1.5 text-center flex flex-col items-center">
              {editingAbilities ? (
                <div className="flex items-center gap-1 my-1">
                  <span className="text-[10px] text-stone-400 font-mono">Score:</span>
                  <input
                    type="number"
                    min="1"
                    value={score}
                    onChange={(e) => handleScoreChange(ability, parseInt(e.target.value) || 10)}
                    className="w-14 bg-stone-800 border border-amber-500 text-center font-mono text-base rounded font-bold text-amber-200"
                  />
                </div>
              ) : (
                <div className="text-3xl font-serif font-extrabold text-amber-100">
                  {score}
                </div>
              )}

              <div className="text-xs font-mono font-bold text-amber-300 bg-stone-950/90 px-2.5 py-0.5 rounded-full border border-stone-800 mt-1 shadow-inner">
                Mod: <span className="text-emerald-400">{formatModifier(mod)}</span>
              </div>
            </div>

            {/* Quick Roll Check Button */}
            <button
              onClick={() => onRoll(`${ability} Ability Check`, 20, 1, mod, 'normal')}
              className="w-full mt-1 py-1 bg-stone-800 hover:bg-amber-700/80 text-amber-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
              title={`Roll ${ability} Check (d20${formatModifier(mod)})`}
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" /> Roll Check
            </button>

            {/* 5e Saving Throw Indicator */}
            {character.edition !== '3.5e' && (
              <div className="w-full mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleSavingThrowToggle(ability)}
                  className="flex items-center gap-1 text-stone-400 hover:text-amber-300 transition"
                  title="Toggle Saving Throw Proficiency"
                >
                  {isSaveProf ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>Save</span>
                </button>

                <button
                  onClick={() => onRoll(`${ability} Saving Throw`, 20, 1, saveBonus, 'normal')}
                  className="font-mono font-bold text-emerald-300 hover:underline"
                  title={`Roll ${ability} Save`}
                >
                  {formatModifier(saveBonus)}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
