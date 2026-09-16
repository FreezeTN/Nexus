import React, { useState, useMemo } from 'react';
import { CharacterData, Skill, RacialSkillBonus } from '../../types';
import { resolveRacialSkillBonus } from '../../utils/racialSkillBonusEngine';
import { formatModifier } from '../../utils/dndCalculations';
import { Dices, Check, X, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface ConditionalSkillRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill;
  character: CharacterData;
  edition?: '5e' | '3.5e';
  baseModifier: number; // The modifier calculated without conditions
  calculateWithConditions: (activeConditionIds: string[]) => number;
  onRoll: (label: string, diceCount: number, diceSides: number, modifier: number, rollType?: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const ConditionalSkillRollModal: React.FC<ConditionalSkillRollModalProps> = ({
  isOpen,
  onClose,
  skill,
  character,
  edition = '5e',
  baseModifier,
  calculateWithConditions,
  onRoll
}) => {
  if (!isOpen) return null;

  const resolution = useMemo(() => {
    return resolveRacialSkillBonus(skill, character);
  }, [skill, character]);

  const conditionalBonuses = resolution.conditionalMatches;

  // Selected conditional bonus IDs
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>(() => {
    // Default to first condition selected for convenience
    return conditionalBonuses.length > 0 ? [conditionalBonuses[0].bonusObj.id] : [];
  });

  const toggleCondition = (id: string) => {
    setSelectedConditionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Compute final modifier with chosen conditions
  const currentModifier = useMemo(() => {
    return calculateWithConditions(selectedConditionIds);
  }, [calculateWithConditions, selectedConditionIds]);

  // Compute effective racial bonus with non-stacking preview
  const previewResolution = useMemo(() => {
    return resolveRacialSkillBonus(skill, character, selectedConditionIds);
  }, [skill, character, selectedConditionIds]);

  const hasActiveCondition = selectedConditionIds.length > 0;
  const highestActiveConditionBonus = Math.max(
    0,
    ...conditionalBonuses
      .filter(c => selectedConditionIds.includes(c.bonusObj.id))
      .map(c => c.value)
  );

  const racialBonusApplied = previewResolution.effectiveTotalWithConditions;
  const unconditionalRacial = resolution.unconditionalBonus;

  const handleExecuteRoll = (rollType: 'normal' | 'advantage' | 'disadvantage' = 'normal') => {
    const activeDesc = conditionalBonuses
      .filter(c => selectedConditionIds.includes(c.bonusObj.id))
      .map(c => c.condition || 'situational')
      .join(', ');

    const conditionTag = activeDesc ? ` [Racial: ${activeDesc}]` : '';
    const label = `${skill.name} Check${conditionTag}${edition === '3.5e' ? ' (3.5e)' : ''}`;

    onRoll(label, 20, 1, currentModifier, rollType);
    onClose();
  };

  const handleRollStandard = () => {
    const label = `${skill.name} Check${edition === '3.5e' ? ' (3.5e)' : ''}`;
    onRoll(label, 20, 1, baseModifier, 'normal');
    onClose();
  };

  return (
    <div
      id="modal-conditional-skill-roll"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-stone-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <span>{skill.name} Check</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-stone-800 text-amber-400">
                  {skill.ability}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Situational Racial Skill Bonus Selection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Situation Notice */}
          <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span>This character has racial bonus conditions that apply to </span>
              <strong className="text-amber-300">{skill.name}</strong>
              <span>. Select whether the circumstances apply to this specific roll:</span>
            </div>
          </div>

          {/* Conditional Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
              Specific Circumstances / Conditions
            </label>

            {conditionalBonuses.map(cb => {
              const isSelected = selectedConditionIds.includes(cb.bonusObj.id);
              return (
                <button
                  key={cb.bonusObj.id}
                  type="button"
                  onClick={() => toggleCondition(cb.bonusObj.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 shadow-sm shadow-amber-950/40'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSelected
                        ? 'bg-amber-500 border-amber-400 text-stone-950'
                        : 'border-stone-600 bg-stone-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-stone-200">
                        {cb.condition ? `Condition: ${cb.condition}` : 'Situational Condition'}
                      </span>
                      <span className="font-mono font-bold text-amber-400 text-sm shrink-0">
                        +{cb.value} Racial
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Source: {cb.source}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stacking Rule Callout */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Standard Base Modifier:</span>
              <span className="font-mono font-semibold text-stone-300">{formatModifier(baseModifier)}</span>
            </div>

            <div className="flex items-center justify-between text-stone-300">
              <span className="text-stone-400">Effective Racial Bonus:</span>
              <span className="font-mono font-semibold text-amber-400">
                {racialBonusApplied > 0 ? `+${racialBonusApplied}` : '+0'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-200 pt-1 border-t border-stone-800">
              <span className="font-medium">Total Roll Modifier:</span>
              <span className="font-mono font-bold text-emerald-400 text-base">
                {formatModifier(currentModifier)}
              </span>
            </div>

            <div className="text-[10px] text-stone-500 pt-1 flex items-center gap-1.5 border-t border-stone-800/60">
              <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                <strong>Non-Stacking Rule:</strong> In D&D, racial bonuses do not stack. Only the highest bonus applies (unconditional {unconditionalRacial > 0 ? `+${unconditionalRacial}` : 'none'} vs conditional {highestActiveConditionBonus > 0 ? `+${highestActiveConditionBonus}` : 'none'}).
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => handleExecuteRoll('normal')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition"
            >
              <Dices className="w-4 h-4" />
              <span>
                {hasActiveCondition
                  ? `Roll with Racial Bonus (${formatModifier(currentModifier)})`
                  : `Roll Check (${formatModifier(currentModifier)})`}
              </span>
            </button>

            {hasActiveCondition && (
              <button
                type="button"
                onClick={handleRollStandard}
                className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <span>Roll Standard without Condition ({formatModifier(baseModifier)})</span>
              </button>
            )}

            {edition === '5e' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecuteRoll('advantage')}
                  className="py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 text-xs font-semibold transition"
                >
                  Advantage
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteRoll('disadvantage')}
                  className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/50 text-rose-300 text-xs font-semibold transition"
                >
                  Disadvantage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
