import React, { useState } from 'react';
import { Attack, CharacterData } from '../../types';
import {
  formatModifier,
  get35eEffectiveThreatRange,
  calculate35eCriticalDamage,
  rollCompoundDamage
} from '../../utils/dndCalculations';
import {
  Swords,
  X,
  Dices,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface CriticalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attack: Attack;
  character: CharacterData;
  initialThreatRoll?: number;
  attackBonus?: number;
  initialAttackBonus?: number;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const CriticalConfirmationModal: React.FC<CriticalConfirmationModalProps> = ({
  isOpen,
  onClose,
  attack,
  character,
  initialThreatRoll = 20,
  attackBonus,
  initialAttackBonus,
  onRoll,
  onRollDamage
}) => {
  if (!isOpen) return null;

  const effectiveAttackBonus = initialAttackBonus !== undefined ? initialAttackBonus : (attackBonus ?? attack.attackBonus ?? 0);

  const threatInfo = get35eEffectiveThreatRange(attack);
  const critMultiplier = attack.critMultiplier || 2;
  const baseDamageExpr = attack.damage || '1d8';

  const [confirmD20, setConfirmD20] = useState<number | null>(() => {
    return Math.floor(Math.random() * 20) + 1;
  });
  const [targetAc, setTargetAc] = useState<number>(15);
  const [isManualConfirmed, setIsManualConfirmed] = useState<boolean | null>(null);
  const [damageResult, setDamageResult] = useState<{
    total: number;
    breakdown: string;
    isCritical: boolean;
  } | null>(null);

  const confirmTotal = confirmD20 !== null ? confirmD20 + effectiveAttackBonus : null;
  const isConfirmed = isManualConfirmed !== null
    ? isManualConfirmed
    : confirmTotal !== null
    ? confirmTotal >= targetAc
    : true;

  const handleRollConfirmation = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    setConfirmD20(roll);
    setIsManualConfirmed(null);
    setDamageResult(null);
  };

  const handleRollDamage = (confirmed: boolean) => {
    if (confirmed) {
      // 3.5e Critical Hit: Multiplies base dice and flat damage bonuses by critMultiplier
      const critCalc = calculate35eCriticalDamage(baseDamageExpr, critMultiplier);
      const rolled = rollCompoundDamage(critCalc.multipliedExpr, false);
      setDamageResult({
        total: rolled.totalDamage,
        breakdown: `${critCalc.multipliedExpr}: ${rolled.breakdown}`,
        isCritical: true
      });
      if (onRollDamage) {
        onRollDamage(
          `[CRITICAL HIT (x${critMultiplier})] ${attack.name}`,
          critCalc.multipliedExpr
        );
      }
    } else {
      // Regular Hit
      const rolled = rollCompoundDamage(baseDamageExpr, false);
      setDamageResult({
        total: rolled.totalDamage,
        breakdown: `${baseDamageExpr}: ${rolled.breakdown}`,
        isCritical: false
      });
      if (onRollDamage) {
        onRollDamage(
          `[Regular Hit (Unconfirmed)] ${attack.name}`,
          baseDamageExpr
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-500/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-lg text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-amber-200">
                  Critical Threat Roll!
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
                  3.5e Confirmation
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                {attack.name} &bull; Threat Range: <strong className="text-amber-300">{threatInfo.label}</strong> &bull; Multiplier: <strong className="text-amber-300">&times;{critMultiplier}</strong>
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Natural Roll Banner */}
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-amber-200 block">
                  Threat Rolled: Natural {initialThreatRoll}!
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Meets threat range threshold ({threatInfo.label})
                </span>
              </div>
            </div>
            <div className="text-xl font-serif font-black text-amber-300 px-3 py-1 bg-stone-900 border border-amber-600/50 rounded-lg">
              {initialThreatRoll}
            </div>
          </div>

          {/* Confirmation Check Box */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Confirmation Roll
              </span>
              <button
                onClick={handleRollConfirmation}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 hover:underline"
              >
                <Dices className="w-3.5 h-3.5" /> Re-roll (d20)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-mono">d20 Roll</span>
                <span className="text-lg font-mono font-bold text-stone-200">
                  {confirmD20 ?? '-'}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-[10px] text-stone-400 block font-mono">Attack Bonus</span>
                <span className="text-lg font-mono font-bold text-amber-400">
                  {formatModifier(effectiveAttackBonus)}
                </span>
              </div>
              <div className="bg-amber-950/60 p-2 rounded-lg border border-amber-600/40">
                <span className="text-[10px] text-amber-300 block font-mono">Total vs AC</span>
                <span className="text-lg font-mono font-black text-amber-200">
                  {confirmTotal ?? '-'}
                </span>
              </div>
            </div>

            {/* Target AC Setting */}
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-stone-400">Target AC Threshold:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={targetAc}
                  onChange={(e) => {
                    setTargetAc(parseInt(e.target.value) || 10);
                    setIsManualConfirmed(null);
                  }}
                  className="w-14 bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-center text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Outcome Status Banner */}
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              isConfirmed
                ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200'
                : 'bg-rose-950/70 border-rose-600/60 text-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {isConfirmed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider">
                    {isConfirmed ? `Critical Hit Confirmed! (x${critMultiplier})` : 'Threat Not Confirmed (Regular Hit)'}
                  </div>
                  <div className="text-[11px] opacity-80 font-mono">
                    {isConfirmed
                      ? `Total ${confirmTotal} beats target AC ${targetAc}`
                      : `Total ${confirmTotal} does not beat AC ${targetAc}`}
                  </div>
                </div>
              </div>

              {/* Manual Override Toggle */}
              <button
                onClick={() => setIsManualConfirmed(!isConfirmed)}
                className="text-[10px] underline font-mono opacity-70 hover:opacity-100"
              >
                Override: {isConfirmed ? 'Mark Miss' : 'Force Hit'}
              </button>
            </div>
          </div>

          {/* Damage Roll Action Section */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRollDamage(true)}
                className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50"
              >
                <Flame className="w-4 h-4 text-stone-950" />
                <span>Roll Critical Dmg (&times;{critMultiplier})</span>
              </button>
              <button
                onClick={() => handleRollDamage(false)}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-700"
              >
                <Swords className="w-4 h-4 text-stone-400" />
                <span>Roll Regular Dmg (1x)</span>
              </button>
            </div>

            {/* Damage Result Output */}
            {damageResult && (
              <div className="bg-stone-950 border border-amber-600/50 rounded-xl p-3 text-center animate-in fade-in duration-150">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                  {damageResult.isCritical ? `⚡ Multiplied Critical Damage (x${critMultiplier})` : 'Standard Damage'}
                </span>
                <div className="text-2xl font-serif font-black text-amber-300 my-0.5">
                  {damageResult.total} <span className="text-xs font-sans font-normal text-stone-400">{attack.damageType || 'Damage'}</span>
                </div>
                <div className="text-xs font-mono text-stone-400 bg-stone-900/80 px-2 py-1 rounded border border-stone-800 truncate">
                  {damageResult.breakdown}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
