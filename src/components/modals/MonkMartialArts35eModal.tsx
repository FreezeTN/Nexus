import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35eMonkStats } from '../../utils/calculators/classFeatures35eCalculators';
import { Shield, Zap, Heart, X, Sparkles, Wind, Target } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface MonkMartialArts35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
  onRoll?: (diceNotation: string, label: string) => void;
}

export const MonkMartialArts35eModal: React.FC<MonkMartialArts35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  if (!isOpen) return null;

  const stats = calculate35eMonkStats(character);
  const [healAmount, setHealAmount] = useState<number>(Math.min(5, stats.wholenessOfBodyRemaining));
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const handleRollStunningFist = () => {
    if (stats.stunningFistDailyUsesRemaining <= 0) {
      setLogMessage('⚠️ No Stunning Fist attempts remaining today!');
      return;
    }

    const nextUses = Math.max(0, stats.stunningFistDailyUsesRemaining - 1);
    onUpdateCharacter({
      ...character,
      stunningFistUsesRemaining: nextUses
    });

    playDiceSound();
    if (onRoll) {
      onRoll('1d20', 'Stunning Fist Attack');
    }
    setLogMessage(`🥋 Declared STUNNING FIST! Target must make DC ${stats.stunningFistDc} Fortitude save on hit or be Stunned for 1 round. (${nextUses}/${stats.stunningFistDailyUsesMax} attempts left).`);
  };

  const handleWholenessOfBody = () => {
    if (healAmount <= 0) return;
    if (healAmount > stats.wholenessOfBodyRemaining) {
      setLogMessage('⚠️ Cannot exceed remaining Wholeness of Body pool!');
      return;
    }

    const nextRemaining = stats.wholenessOfBodyRemaining - healAmount;
    const currentHp = character.hpCurrent || 0;
    const maxHp = character.hpMax || 10;
    const newHp = Math.min(maxHp, currentHp + healAmount);

    onUpdateCharacter({
      ...character,
      wholenessOfBodyRemaining: nextRemaining,
      hpCurrent: newHp
    });

    playDiceSound();
    setLogMessage(`🧘 Channeled Wholeness of Body to heal for ${healAmount} HP! (Current HP: ${newHp}/${maxHp} • Remaining pool: ${nextRemaining}/${stats.wholenessOfBodyMax}).`);
  };

  const handleRestoreDaily = () => {
    onUpdateCharacter({
      ...character,
      stunningFistUsesRemaining: stats.stunningFistDailyUsesMax,
      wholenessOfBodyRemaining: stats.wholenessOfBodyMax
    });
    setLogMessage(`✨ Restored daily Stunning Fist uses (${stats.stunningFistDailyUsesMax}) and Wholeness of Body pool (${stats.wholenessOfBodyMax}).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Monk Ki & Martial Arts Suite
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 39-42 • Level {stats.monkLevel} Monk (Unarmed: {stats.unarmedDamage})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 py-4 overflow-y-auto">
          {logMessage && (
            <div className="p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl text-xs text-amber-200">
              {logMessage}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Unarmed Dmg</span>
              <span className="text-xl font-bold text-amber-300 font-mono">{stats.unarmedDamage}</span>
              <span className="text-[10px] text-stone-500 block">Lethal/Nonlethal</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Monk AC Bonus</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">+{stats.totalMonkAcBonus}</span>
              <span className="text-[10px] text-stone-500 block">+{stats.monkAcWisBonus} WIS, +{stats.monkAcClassBonus} Lvl</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Fast Move</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">+{stats.fastMovementFt} ft</span>
              <span className="text-[10px] text-stone-500 block">Enhancement</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase font-mono block">Ki Strike</span>
              <span className="text-sm font-bold text-purple-300 font-mono">{stats.kiStrike}</span>
              <span className="text-[10px] text-stone-500 block">Overcomes DR</span>
            </div>
          </div>

          {/* Stunning Fist Action Section */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-serif font-bold text-amber-200 block">
                  Stunning Fist (DC {stats.stunningFistDc} Fortitude)
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Daily Uses: {stats.stunningFistDailyUsesRemaining} / {stats.stunningFistDailyUsesMax}
                </span>
              </div>

              <button
                onClick={handleRollStunningFist}
                disabled={stats.stunningFistDailyUsesRemaining <= 0}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Target className="w-4 h-4" /> Declare Stun Attack
              </button>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Target must succeed on a DC {stats.stunningFistDc} Fortitude save (10 + 1/2 monk level + WIS mod) or be stunned for 1 round.
            </p>
          </div>

          {/* Wholeness of Body Self-Healing */}
          {stats.monkLevel >= 7 && (
            <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-emerald-300 block">
                    Wholeness of Body (Lvl 7+)
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Pool: {stats.wholenessOfBodyRemaining} / {stats.wholenessOfBodyMax} HP (2× Monk Level)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={stats.wholenessOfBodyRemaining}
                    value={healAmount}
                    onChange={(e) => setHealAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-amber-300 font-mono text-center"
                  />
                  <button
                    onClick={handleWholenessOfBody}
                    disabled={stats.wholenessOfBodyRemaining <= 0}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded text-xs font-bold transition flex items-center gap-1"
                  >
                    <Heart className="w-3.5 h-3.5" /> Heal Self
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* High-Level Monk Defenses */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Diamond Body (Lvl 11):</span>
              <span className={`font-bold font-mono ${stats.hasDiamondBody ? 'text-emerald-400' : 'text-stone-600'}`}>
                {stats.hasDiamondBody ? 'Poison Immunity' : 'Locked'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Diamond Soul (Lvl 13):</span>
              <span className={`font-bold font-mono ${stats.hasDiamondSoul ? 'text-purple-400' : 'text-stone-600'}`}>
                {stats.hasDiamondSoul ? `SR ${stats.diamondSoulSr}` : 'Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-between items-center">
          <button
            onClick={handleRestoreDaily}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition"
          >
            Restore Daily Uses
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
