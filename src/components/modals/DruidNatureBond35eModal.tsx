import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eDruidStats,
  Dnd35eDruidBreakdown
} from '../../utils/calculators/classFeatures35eCalculators';
import {
  PawPrint,
  Sparkles,
  TreePine,
  Shield,
  Heart,
  Zap,
  X,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DruidNatureBond35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const DruidNatureBond35eModal: React.FC<DruidNatureBond35eModalProps> = ({
  isOpen,
  character,
  onClose,
  onUpdateCharacter,
  onRoll
}) => {
  const [wildEmpathyRollResult, setWildEmpathyRollResult] = useState<{
    roll: number;
    total: number;
    attitudeOutcome: string;
  } | null>(null);

  if (!isOpen) return null;

  const druidStats: Dnd35eDruidBreakdown = calculate35eDruidStats(character);

  const handleRollWildEmpathy = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + druidStats.wildEmpathyBonus;

    let attitudeOutcome = 'Hostile (unmoved)';
    if (total >= 40) attitudeOutcome = 'Helpful (will take risks to aid)';
    else if (total >= 30) attitudeOutcome = 'Friendly (wishes you well, offers aid)';
    else if (total >= 20) attitudeOutcome = 'Indifferent (normal demeanor)';
    else if (total >= 15) attitudeOutcome = 'Unfriendly (wishes you ill, distrusts)';

    setWildEmpathyRollResult({ roll: d20, total, attitudeOutcome });

    if (onRoll) {
      onRoll('Wild Empathy Check (1d20 + Druid Lvl + Cha)', 20, 1, druidStats.wildEmpathyBonus, 'normal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-emerald-700/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 p-4 border-b border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-sm">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-emerald-200">
                  Druid Nature's Bond & Wild Empathy
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded-full font-mono font-bold">
                  Level {druidStats.druidLevel} Druid
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Official D&D 3.5e Player's Handbook p. 35 — Nature's abilities & animal kinship
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto font-sans">
          {/* Wild Empathy Check Card */}
          <div className="bg-stone-950 p-4 rounded-xl border border-emerald-800/60 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-200 uppercase tracking-wide">
                  Wild Empathy (PHB p. 35)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-600/70">
                Check Bonus: +{druidStats.wildEmpathyBonus}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              A druid can improve the attitude of an animal. This ability functions just like a Diplomacy check made to improve the attitude of a person. (Check bonus = 1d20 + Druid Level + Charisma modifier).
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleRollWildEmpathy}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-500 shadow-md transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-300" />
                Roll Wild Empathy (1d20 + {druidStats.wildEmpathyBonus})
              </button>

              {wildEmpathyRollResult && (
                <div className="text-right">
                  <span className="text-xs font-mono text-stone-400">
                    Rolled: {wildEmpathyRollResult.roll} + {druidStats.wildEmpathyBonus} ={' '}
                    <strong className="text-emerald-300 text-sm font-extrabold">{wildEmpathyRollResult.total}</strong>
                  </span>
                  <div className="text-[11px] font-bold text-emerald-400">
                    {wildEmpathyRollResult.attitudeOutcome}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nature's Passive Class Features Matrix */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <TreePine className="w-4 h-4 text-amber-400" />
              Nature Passives & Milestones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Woodland Stride */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.woodlandStride
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.woodlandStride ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Woodland Stride</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 2)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Move through nonmagical thorns, briars, and overgrown areas at normal speed without damage.
                  </p>
                </div>
              </div>

              {/* Trackless Step */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.tracklessStep
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.tracklessStep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Trackless Step</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 3)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Leave no trail in natural surroundings and cannot be tracked. May leave a trail if desired.
                  </p>
                </div>
              </div>

              {/* Resist Nature's Lure */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.resistNaturesLure
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.resistNaturesLure ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Resist Nature's Lure</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 4)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    +4 bonus on saving throws against the spell-like abilities of fey creatures.
                  </p>
                </div>
              </div>

              {/* Venom Immunity */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.venomImmunity
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.venomImmunity ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Venom Immunity</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 9)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Gain complete immunity to all organic and magical poisons.
                  </p>
                </div>
              </div>

              {/* A Thousand Faces */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.thousandFaces
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.thousandFaces ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>A Thousand Faces</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 13)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Alter appearance at will as if using the alter self spell in normal form.
                  </p>
                </div>
              </div>

              {/* Timeless Body */}
              <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                druidStats.timelessBody
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-500'
              }`}>
                {druidStats.timelessBody ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Timeless Body</span>
                    <span className="text-[10px] font-mono opacity-80">(Lvl 15)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    No longer take ability score penalties for aging and cannot be magically aged.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wild Shape Tier Progression Info */}
          {druidStats.druidLevel >= 5 && (
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between text-xs font-mono">
              <span className="text-stone-300 flex items-center gap-1.5">
                <PawPrint className="w-4 h-4 text-amber-400" />
                Wild Shape Capacity: <strong className="text-amber-300">{druidStats.wildShapeUsesMax}/day</strong>
              </span>
              <span className="text-stone-400">
                Forms: <strong className="text-emerald-300">{druidStats.wildShapeTypes.join(', ')}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
