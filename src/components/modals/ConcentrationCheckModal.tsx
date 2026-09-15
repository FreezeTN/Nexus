import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  ConcentrationDistractionType,
  calculate35eConcentrationDC,
  get35eConcentrationBonus,
  roll35eConcentrationCheck
} from '../../utils/dndCalculations';
import { Flame, Shield, Dices, X, Sparkles, AlertCircle, Info, Zap } from 'lucide-react';

interface ConcentrationCheckModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  initialSpellLevel?: number;
}

export const ConcentrationCheckModal: React.FC<ConcentrationCheckModalProps> = ({
  isOpen,
  character,
  onClose,
  onRoll,
  initialSpellLevel = 1
}) => {
  const [distractionType, setDistractionType] = useState<ConcentrationDistractionType>('defensive_casting');
  const [spellLevel, setSpellLevel] = useState<number>(initialSpellLevel);
  const [damageTaken, setDamageTaken] = useState<number>(8);
  const [useCombatCasting, setUseCombatCasting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    d20: number;
    bonus: number;
    total: number;
    dc: number;
    passed: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const dcInfo = calculate35eConcentrationDC({
    type: distractionType,
    spellLevel,
    damageTaken: distractionType === 'damaged_during' || distractionType === 'continuous_damage' ? damageTaken : undefined
  });

  const appliesCombatCasting = useCombatCasting || distractionType === 'defensive_casting' || distractionType === 'grappled_pinned';
  const bonusInfo = get35eConcentrationBonus(character, appliesCombatCasting);

  const DISTRACTION_LABELS: Record<ConcentrationDistractionType, string> = {
    defensive_casting: 'Defensive Casting',
    damaged_during: 'Damaged While Casting',
    continuous_damage: 'Continuous Damage',
    vigorous_motion: 'Vigorous Motion',
    violent_motion: 'Violent Motion',
    entangled: 'Entangled',
    grappled_pinned: 'Grappled / Pinned',
    weather_wind: 'High Wind',
    weather_storm: 'Storm / Tempest'
  };

  const handleRoll = () => {
    const res = roll35eConcentrationCheck(
      character,
      {
        type: distractionType,
        spellLevel,
        damageTaken: distractionType === 'damaged_during' || distractionType === 'continuous_damage' ? damageTaken : undefined
      },
      useCombatCasting
    );
    setLastResult(res);

    if (onRoll) {
      onRoll(`Concentration Check vs DC ${res.dc} (${DISTRACTION_LABELS[distractionType] || 'Defensive'})`, 20, 1, res.bonus, 'normal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-sky-600/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-stone-900 to-stone-900 p-4 border-b border-sky-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500 flex items-center justify-center text-sky-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-sky-200">Concentration & Defensive Casting</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Rules As Written (PHB p. 170-171)</p>
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
          {/* Distraction Scenario Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">Distraction Scenario</label>
            <select
              value={distractionType}
              onChange={(e) => setDistractionType(e.target.value as ConcentrationDistractionType)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-sky-300 font-medium focus:ring-1 focus:ring-sky-500 focus:outline-none"
            >
              <option value="defensive_casting">Casting Defensively in Melee (Avoids AoO) — DC 15 + Spell Level</option>
              <option value="damaged_during">Damaged During Casting (Readied Action / AoO) — DC 10 + Damage + Spell Level</option>
              <option value="continuous_damage">Ongoing Continuous Damage (Acid / Burn) — DC 10 + 1/2 Damage + Spell Level</option>
              <option value="vigorous_motion">Vigorous Motion (Moving Mount / Rough Boat) — DC 10 + Spell Level</option>
              <option value="violent_motion">Violent Motion (Galloping Mount / Stormy Sea) — DC 15 + Spell Level</option>
              <option value="entangled">Entangled (Net / Tanglefoot / Entangle) — DC 15 + Spell Level</option>
              <option value="grappled_pinned">Grappled or Pinned (Verbal Only) — DC 20 + Spell Level</option>
              <option value="weather_wind">High Wind / Sleet Weather — DC 5 + Spell Level</option>
              <option value="weather_storm">Severe Storm / Tempest / Hail — DC 10 + Spell Level</option>
            </select>
            <p className="text-[11px] text-stone-400 italic px-1">{dcInfo.description}</p>
          </div>

          {/* Spell Level & Damage Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
              <label className="text-xs text-stone-400 font-semibold block">Spell Level (0 to 9)</label>
              <input
                type="number"
                min="0"
                max="9"
                value={spellLevel}
                onChange={(e) => setSpellLevel(Math.max(0, Math.min(9, parseInt(e.target.value, 10) || 0)))}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-sm text-stone-200 font-mono"
              />
              <span className="text-[10px] text-stone-500">0 = Cantrip/Orison</span>
            </div>

            {(distractionType === 'damaged_during' || distractionType === 'continuous_damage') && (
              <div className="bg-stone-950 p-3 rounded-xl border border-red-900/50 space-y-1">
                <label className="text-xs text-red-300 font-semibold block">Damage Taken</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={damageTaken}
                  onChange={(e) => setDamageTaken(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-stone-900 border border-red-800 rounded-lg px-2.5 py-1.5 text-sm text-red-200 font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">
                  {distractionType === 'damaged_during' ? 'Full damage adds directly to DC' : '1/2 damage adds to DC'}
                </span>
              </div>
            )}
          </div>

          {/* Feat Toggles */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-200 block">Combat Casting Feat</span>
              <span className="text-[10px] text-stone-400">+4 bonus on Concentration checks to cast defensively or while grappled</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCombatCasting || (character.feats || []).some(f => f.name.toLowerCase().includes('combat casting'))}
                onChange={(e) => setUseCombatCasting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Target DC & Modifier Breakdown Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Required Target DC</span>
              <span className="text-3xl font-serif font-black text-amber-400 my-0.5">DC {dcInfo.dc}</span>
              <span className="text-[10px] font-mono text-stone-500">{dcInfo.formula}</span>
            </div>

            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Your Concentration</span>
              <div className="text-2xl font-serif font-black text-sky-400">
                {bonusInfo.total >= 0 ? `+${bonusInfo.total}` : bonusInfo.total}
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5" title={bonusInfo.breakdown.join(', ')}>
                {bonusInfo.breakdown.join(' + ')}
              </div>
            </div>
          </div>

          {/* Result Alert if rolled */}
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
                  {lastResult.passed ? '✨ SPELL PRESERVED & CAST' : '💥 SPELL DISRUPTED & LOST'}
                </div>
                <div className="text-xs opacity-90 mt-0.5">{lastResult.message}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-2xl font-black">{lastResult.total}</span>
                <span className="text-[10px] block opacity-70">vs DC {lastResult.dc}</span>
              </div>
            </div>
          )}

          {/* Roll Button */}
          <button
            type="button"
            onClick={handleRoll}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Dices className="w-5 h-5" />
            <span>Roll Concentration Check (1d20 + {bonusInfo.total})</span>
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
