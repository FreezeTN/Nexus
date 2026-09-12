import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  roll35eForcedMarchCheck,
  roll35eExtremeColdCheck,
  roll35eExtremeHeatCheck,
  roll35eSuffocationCheck,
  getEffectiveAbilities,
  getAbilityModifier
} from '../../utils/dndCalculations';
import { Sun, Snowflake, Waves, Compass, Heart, AlertTriangle, Dices, X, CheckCircle2, Shield } from 'lucide-react';

interface EnvironmentalHazardsModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const EnvironmentalHazardsModal: React.FC<EnvironmentalHazardsModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  const [activeTab, setActiveTab] = useState<'march' | 'cold' | 'heat' | 'suffocation'>('march');
  const [extraHours, setExtraHours] = useState<number>(1);
  const [coldChecks, setColdChecks] = useState<number>(1);
  const [heatChecks, setHeatChecks] = useState<number>(1);
  const [breathRounds, setBreathRounds] = useState<number>(20);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const abilities = getEffectiveAbilities(character);
  const conScore = abilities.CON?.score || 10;
  const hasEndurance = (character.feats || []).some(f => f.name.toLowerCase().includes('endurance'));

  const applyCondition = (condName: string) => {
    const current = character.conditions || [];
    if (!current.includes(condName)) {
      onUpdateCharacter({
        ...character,
        conditions: [...current, condName]
      });
    }
  };

  const handleRollMarch = () => {
    const res = roll35eForcedMarchCheck(character, extraHours);
    setLastMessage(res.message);

    if (onRoll) {
      onRoll(`Forced March Check (Hour ${8 + extraHours}, DC ${res.dc})`, 20, 1, res.bonus, 'normal');
    }

    if (!res.passed && res.inflictsCondition) {
      applyCondition(res.inflictsCondition);
    }
  };

  const handleRollCold = () => {
    const res = roll35eExtremeColdCheck(character, coldChecks);
    setLastMessage(res.message);

    if (onRoll) {
      onRoll(`Extreme Cold Save (Check #${coldChecks}, DC ${res.dc})`, 20, 1, res.bonus, 'normal');
    }

    if (!res.passed && res.inflictsCondition) {
      applyCondition(res.inflictsCondition);
    }
  };

  const handleRollHeat = () => {
    const res = roll35eExtremeHeatCheck(character, heatChecks);
    setLastMessage(res.message);

    if (onRoll) {
      onRoll(`Extreme Heat Save (Check #${heatChecks}, DC ${res.dc})`, 20, 1, res.bonus, 'normal');
    }

    if (!res.passed && res.inflictsCondition) {
      applyCondition(res.inflictsCondition);
    }
  };

  const handleRollSuffocation = () => {
    const res = roll35eSuffocationCheck(character, breathRounds);
    setLastMessage(res.message);

    if (res.dc > 0 && onRoll) {
      onRoll(`Suffocation Check (Round ${breathRounds}, DC ${res.dc})`, 20, 1, res.bonus, 'normal');
    }

    if (!res.passed && res.inflictsCondition) {
      applyCondition(res.inflictsCondition);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-700/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600 flex items-center justify-center text-amber-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200">Environmental Hazards & Survival</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Rules As Written (DMG p. 302-304)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Endurance Feat Status Banner */}
        <div className="px-5 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${hasEndurance ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span className="text-stone-300">
              Endurance Feat: <b className={hasEndurance ? 'text-emerald-400' : 'text-stone-500'}>{hasEndurance ? 'ACTIVE (+4 Bonus)' : 'Not Taken'}</b>
            </span>
          </div>
          <span className="text-stone-400 font-mono">CON Score: {conScore} ({conScore * 2} Breath Rounds)</span>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 p-2 bg-stone-950 border-b border-stone-800 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('march')}
            className={`py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'march'
                ? 'bg-amber-900/60 border border-amber-600/60 text-amber-200'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Forced March</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cold')}
            className={`py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'cold'
                ? 'bg-sky-900/60 border border-sky-600/60 text-sky-200'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Extreme Cold</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heat')}
            className={`py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'heat'
                ? 'bg-orange-900/60 border border-orange-600/60 text-orange-200'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Extreme Heat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suffocation')}
            className={`py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'suffocation'
                ? 'bg-teal-900/60 border border-teal-600/60 text-teal-200'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Suffocation</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Result Alert */}
          {lastMessage && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{lastMessage}</span>
            </div>
          )}

          {/* TAB 1: Forced March */}
          {activeTab === 'march' && (
            <div className="space-y-3">
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">Extra Hours of Marching (Past 8 Hours)</label>
                  <span className="text-xs font-mono font-bold text-amber-400">Hour {8 + extraHours} (DC {10 + 2 * extraHours})</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={extraHours}
                    onChange={(e) => setExtraHours(parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono font-bold text-sm bg-stone-900 px-2 py-1 rounded border border-stone-700">
                    +{extraHours}h
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  RAW: For each hour of marching past 8 hours, character must succeed on a Constitution check (DC 10 + 2/extra hour) or take 1d6 points of nonlethal damage and become <b>Fatigued</b>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRollMarch}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-black rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Dices className="w-5 h-5 text-stone-950" />
                <span>Roll Forced March Constitution Check</span>
              </button>
            </div>
          )}

          {/* TAB 2: Extreme Cold */}
          {activeTab === 'cold' && (
            <div className="space-y-3">
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">Consecutive Hours Exposed</label>
                  <span className="text-xs font-mono font-bold text-sky-400">Check #{coldChecks} (DC {15 + coldChecks - 1})</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={coldChecks}
                    onChange={(e) => setColdChecks(parseInt(e.target.value, 10))}
                    className="flex-1 accent-sky-500 cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono font-bold text-sm bg-stone-900 px-2 py-1 rounded border border-stone-700">
                    {coldChecks}h
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  RAW: Below 40°F, make a Fortitude save every hour (DC 15, +1 per previous check). Failure deals 1d6 nonlethal damage and induces hypothermia (<b>Fatigued</b>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleRollCold}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Dices className="w-5 h-5" />
                <span>Roll Extreme Cold Fortitude Save</span>
              </button>
            </div>
          )}

          {/* TAB 3: Extreme Heat */}
          {activeTab === 'heat' && (
            <div className="space-y-3">
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">Consecutive Hours Exposed</label>
                  <span className="text-xs font-mono font-bold text-orange-400">Check #{heatChecks} (DC {15 + heatChecks - 1})</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={heatChecks}
                    onChange={(e) => setHeatChecks(parseInt(e.target.value, 10))}
                    className="flex-1 accent-orange-500 cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono font-bold text-sm bg-stone-900 px-2 py-1 rounded border border-stone-700">
                    {heatChecks}h
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  RAW: Above 90°F, character must make a Fortitude save every hour (DC 15, +1 per previous check). Failure deals 1d4 nonlethal damage and induces heat exhaustion (<b>Fatigued</b>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleRollHeat}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Dices className="w-5 h-5" />
                <span>Roll Extreme Heat Fortitude Save</span>
              </button>
            </div>
          )}

          {/* TAB 4: Suffocation */}
          {activeTab === 'suffocation' && (
            <div className="space-y-3">
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">Rounds Holding Breath</label>
                  <span className="text-xs font-mono font-bold text-teal-400">
                    {breathRounds <= conScore * 2 ? `Safe (${breathRounds}/${conScore * 2} rounds)` : `Check DC ${10 + (breathRounds - conScore * 2)}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={conScore * 2 + 20}
                    value={breathRounds}
                    onChange={(e) => setBreathRounds(parseInt(e.target.value, 10))}
                    className="flex-1 accent-teal-500 cursor-pointer"
                  />
                  <span className="w-12 text-center font-mono font-bold text-sm bg-stone-900 px-2 py-1 rounded border border-stone-700">
                    {breathRounds}r
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  RAW: A character can hold their breath for 2 rounds per point of Constitution ({conScore * 2} rounds). Each round thereafter requires a Constitution check (DC 10, +1 per previous round). Failure means the character immediately falls <b>Unconscious</b> (0 HP), and in the next round drops to -1 HP and is <b>Dying</b>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRollSuffocation}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Dices className="w-5 h-5" />
                <span>Roll Suffocation / Drowning Check</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
