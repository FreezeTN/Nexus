import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  TumbleTargetObjective,
  calculate35eTumbleDC,
  get35eTumbleBonus,
  roll35eTumbleCheck
} from '../../utils/dndCalculations';
import { Footprints, ShieldAlert, Dices, X, Wind, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TumbleAcrobaticsModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const TumbleAcrobaticsModal: React.FC<TumbleAcrobaticsModalProps> = ({
  isOpen,
  character,
  onClose,
  onRoll
}) => {
  const [objective, setObjective] = useState<TumbleTargetObjective>('threatened_square');
  const [additionalOpponents, setAdditionalOpponents] = useState<number>(0);
  const [acceleratedSpeed, setAcceleratedSpeed] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    d20: number;
    bonus: number;
    total: number;
    dc: number;
    passed: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const dcInfo = calculate35eTumbleDC(objective, { additionalOpponents, acceleratedSpeed });
  const bonusInfo = get35eTumbleBonus(character);

  const handleRoll = () => {
    const res = roll35eTumbleCheck(character, objective, { additionalOpponents, acceleratedSpeed });
    setLastResult(res);

    const objectiveLabel = objective === 'through_enemy_space'
      ? 'Through Enemy Space'
      : objective === 'free_fall'
      ? 'Soft Landing'
      : 'Avoid AoO';

    if (onRoll) {
      onRoll(`Tumble Check vs DC ${res.dc} (${objectiveLabel})`, 20, 1, res.bonus, 'normal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200">Tumble & Acrobatics Movement</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Rules As Written (PHB p. 84)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Maneuver Objective */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">Tumble Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as TumbleTargetObjective)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-amber-300 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="threatened_square">Move Through Threatened Squares (Avoid AoO) — Base DC 15</option>
              <option value="through_enemy_space">Move Directly Through Enemy's Occupied Space — Base DC 25</option>
              <option value="free_fall">Free Fall / Soft Landing (Ignore 10 ft of fall damage) — DC 15</option>
            </select>
            <p className="text-[11px] text-stone-400 italic px-1">{dcInfo.description}</p>
          </div>

          {/* Modifiers for enemies & accelerated speed */}
          {objective !== 'free_fall' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                <label className="text-xs text-stone-300 font-semibold block">Additional Enemies Beyond 1st</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdditionalOpponents(Math.max(0, additionalOpponents - 1))}
                    className="w-8 h-8 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-amber-300">
                    +{additionalOpponents * 2} DC ({additionalOpponents} extra)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdditionalOpponents(additionalOpponents + 1)}
                    className="w-8 h-8 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-stone-500 block text-center">+2 DC for each enemy past the 1st</span>
              </div>

              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-200 block">Accelerated Tumble</span>
                  <span className="text-[10px] text-stone-400">+5 DC to move at full normal speed instead of half speed</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceleratedSpeed}
                    onChange={(e) => setAcceleratedSpeed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* DC & Tumble Bonus Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Required Target DC</span>
              <span className="text-3xl font-serif font-black text-amber-400 my-0.5">DC {dcInfo.dc}</span>
              <span className="text-[10px] font-mono text-stone-500">{dcInfo.formula}</span>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Your Tumble Bonus</span>
              <div className="text-2xl font-serif font-black text-amber-400">
                {bonusInfo.total >= 0 ? `+${bonusInfo.total}` : bonusInfo.total}
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5" title={bonusInfo.breakdown.join(', ')}>
                {bonusInfo.breakdown.join(' + ')}
              </div>
            </div>
          </div>

          {/* Roll Result */}
          {lastResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                lastResult.passed
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-red-950/80 border-red-500 text-red-200'
              }`}
            >
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {lastResult.passed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>TUMBLE SUCCESS (No AoO Provoked)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>TUMBLE FAILED (AoO Provoked)</span>
                    </>
                  )}
                </div>
                <div className="text-xs opacity-90 mt-0.5">{lastResult.message}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-2xl font-black">{lastResult.total}</span>
                <span className="text-[10px] block opacity-70">vs DC {lastResult.dc}</span>
              </div>
            </div>
          )}

          {/* Roll Action */}
          <button
            type="button"
            onClick={handleRoll}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Dices className="w-5 h-5 text-stone-950" />
            <span>Roll Tumble Check (1d20 + {bonusInfo.total})</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
