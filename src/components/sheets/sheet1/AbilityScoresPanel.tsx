import React, { useState } from 'react';
import { AbilityName, CharacterData } from '../../../types';
import {
  getAbilityModifier,
  formatModifier,
  getSavingThrowBonus,
  getEffectiveAbilityDetails,
  getEffectiveAbilities
} from '../../../utils/dndCalculations';
import { Dices, CheckSquare, Square, Sparkles, Info, X } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [activeStatPopover, setActiveStatPopover] = useState<AbilityName | null>(null);
  const abilitiesList: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const effectiveAbilities = getEffectiveAbilities(character);

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative">
      {abilitiesList.map((ability) => {
        const details = getEffectiveAbilityDetails(character, ability);
        const isModified = details.isOverridden || details.bonusAmount > 0;
        const score = details.effectiveScore;
        const baseScore = details.baseScore;
        const mod = details.modifier;
        const isSaveProf = character.savingThrowProficiencies.includes(ability);
        const saveBonus = getSavingThrowBonus(ability, effectiveAbilities, character.savingThrowProficiencies, character.level);
        const reason = details.overrideSource || (details.bonusSources.length > 0 ? details.bonusSources.join(', ') : undefined);
        const showPopover = activeStatPopover === ability;

        return (
          <div
            key={ability}
            className={`bg-stone-900 border ${
              isModified ? 'border-purple-600/70 shadow-purple-950/40' : 'border-amber-800/30'
            } hover:border-amber-600/60 rounded-2xl p-3 shadow-lg flex flex-col items-center justify-between transition group relative`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono font-extrabold uppercase text-amber-500 tracking-wider">
                {ability}
              </span>
              {isModified && (
                <button
                  type="button"
                  onClick={() => setActiveStatPopover(showPopover ? null : ability)}
                  className="flex items-center gap-0.5 text-[9px] bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded-full font-mono font-bold cursor-pointer transition"
                  title="Click to view stat modifier breakdown"
                >
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  {details.isOverridden ? 'Set' : '+Mod'}
                </button>
              )}
            </div>

            {/* Score & Modifier */}
            <div className="my-1.5 text-center flex flex-col items-center">
              {editingAbilities ? (
                <div className="flex items-center gap-1 my-1">
                  <span className="text-[10px] text-stone-400 font-mono">{t('stats.score', 'Score')}:</span>
                  <input
                    type="number"
                    min="1"
                    value={baseScore}
                    onChange={(e) => handleScoreChange(ability, parseInt(e.target.value) || 10)}
                    className="w-14 bg-stone-800 border border-amber-500 text-center font-mono text-base rounded font-bold text-amber-200"
                  />
                </div>
              ) : (
                <div
                  onClick={() => isModified && setActiveStatPopover(showPopover ? null : ability)}
                  className={isModified ? 'cursor-pointer' : ''}
                  title={isModified ? 'Click to inspect bonus sources' : undefined}
                >
                  <div className={`text-3xl font-serif font-extrabold ${isModified ? 'text-purple-200' : 'text-amber-100'}`}>
                    {score}
                  </div>
                  {isModified && (
                    <span className="text-[10px] text-stone-400 font-mono block -mt-0.5 line-through">
                      Base: {baseScore}
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs font-mono font-bold text-amber-300 bg-stone-950/90 px-2.5 py-0.5 rounded-full border border-stone-800 mt-1 shadow-inner">
                {t('stats.modifier', 'Mod')}: <span className="text-emerald-400">{formatModifier(mod)}</span>
              </div>
            </div>

            {/* Quick Roll Check Button */}
            <button
              onClick={() => onRoll(`${ability} Check`, 20, 1, mod, 'normal')}
              className="w-full mt-1 py-1 bg-stone-800 hover:bg-amber-700/80 text-amber-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
              title={`Roll ${ability} Check (d20${formatModifier(mod)})`}
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" /> {t('dice.roll', 'Roll')}
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
                  <span>{t('stats.save', 'Save')}</span>
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

            {/* Interactive Stat Source Breakdown Popover */}
            {showPopover && (
              <div className="absolute top-0 left-0 right-0 z-30 bg-stone-950 border border-purple-500 rounded-xl p-3 shadow-2xl space-y-2 text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <span className="font-mono text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {ability} Breakdown
                  </span>
                  <button
                    onClick={() => setActiveStatPopover(null)}
                    className="text-stone-400 hover:text-stone-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] space-y-1 text-stone-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Base Score:</span>
                    <span>{details.baseScore}</span>
                  </div>

                  {details.isOverridden && (
                    <div className="bg-purple-950/60 border border-purple-700/50 p-1.5 rounded text-[10px] text-purple-200">
                      <div className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" /> Score Override:
                      </div>
                      <div className="text-purple-300">{details.overrideSource || 'Magic Item (e.g. Gauntlets)'}</div>
                      <div className="text-right font-bold">Set to {details.effectiveScore}</div>
                    </div>
                  )}

                  {details.bonusAmount > 0 && (
                    <div className="bg-emerald-950/60 border border-emerald-700/50 p-1.5 rounded text-[10px] text-emerald-200">
                      <div className="font-bold">Bonus Sources (+{details.bonusAmount}):</div>
                      <div className="text-emerald-300">{details.bonusSources.join(', ') || 'Attuned Item / Feat'}</div>
                    </div>
                  )}

                  <div className="flex justify-between font-bold border-t border-stone-800 pt-1 text-amber-300">
                    <span>Effective:</span>
                    <span>{details.effectiveScore} ({formatModifier(details.modifier)})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

