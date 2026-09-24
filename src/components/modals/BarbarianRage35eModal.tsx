import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35eRageStats } from '../../utils/calculators/classFeatures35eCalculators';
import { Flame, ShieldAlert, Heart, Zap, X, AlertTriangle } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface BarbarianRage35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
}

export const BarbarianRage35eModal: React.FC<BarbarianRage35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose
}) => {
  if (!isOpen) return null;

  const stats = calculate35eRageStats(character);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const handleEnterRage = () => {
    if (stats.dailyUsesRemaining <= 0) {
      setLogMessage('⚠️ No daily rage uses remaining!');
      return;
    }

    const tempHp = stats.totalTempHp;

    // Update character state: add temp HP, mark raging, decrement daily uses
    const updatedFeatures = character.classFeatures.map(f => {
      if (f.name.toLowerCase().includes('barbarian rage') && f.usesRemaining !== undefined) {
        return { ...f, usesRemaining: Math.max(0, f.usesRemaining - 1) };
      }
      return f;
    });

    const updatedChar: CharacterData = {
      ...character,
      classFeatures: updatedFeatures,
      isRaging35e: true,
      rageState35e: {
        roundsRemaining: stats.durationRounds,
        tempHpGranted: tempHp,
        rageType: stats.rageType,
        isFatiguedAfter: !stats.isTireless
      },
      hpTemp: (character.hpTemp || 0) + tempHp
    };

    onUpdateCharacter(updatedChar);
    playDiceSound();
    setLogMessage(`🔥 Entered ${stats.rageType.toUpperCase()} RAGE! (+${stats.strBonus} STR, +${stats.conBonus} CON, +${stats.willBonus} Will, -2 AC, +${tempHp} Temp HP for ${stats.durationRounds} rounds).`);
  };

  const handleEndRage = () => {
    const tempHpLoss = character.rageState35e?.tempHpGranted || stats.totalTempHp;
    const currentTempHp = character.hpTemp || 0;
    const newTempHp = Math.max(0, currentTempHp - tempHpLoss);

    // Apply fatigue condition if not tireless (Level 17+)
    const currentConditions = character.conditions || [];
    let nextConditions = [...currentConditions];
    if (!stats.isTireless && !nextConditions.some(c => c.toLowerCase().includes('fatigued'))) {
      nextConditions.push('Fatigued (-2 STR, -2 DEX, cannot run or charge)');
    }

    const updatedChar: CharacterData = {
      ...character,
      isRaging35e: false,
      rageState35e: undefined,
      hpTemp: newTempHp,
      conditions: nextConditions
    };

    onUpdateCharacter(updatedChar);
    playDiceSound();
    setLogMessage(`💨 Ceased raging.${!stats.isTireless ? ' Suffers Fatigue (-2 STR, -2 DEX) until rest.' : ' (Tireless: no fatigue!)'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Barbarian Rage Engine
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 25 • Level {stats.barbarianLevel} Barbarian ({stats.rageType.toUpperCase()} RAGE)
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
            <div className="p-2.5 bg-amber-950/70 border border-amber-500/50 rounded-xl text-xs text-amber-200">
              {logMessage}
            </div>
          )}

          {/* Active Status Banner */}
          {stats.isCurrentlyRaging ? (
            <div className="p-3 bg-red-950/60 border border-red-500/70 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-red-400 animate-bounce" />
                <div>
                  <span className="font-bold text-red-200 text-sm block">RAGE IS CURRENTLY ACTIVE!</span>
                  <span className="text-xs text-red-300/80 font-mono">
                    +{stats.strBonus} STR • +{stats.conBonus} CON • +{stats.willBonus} Will • -2 AC
                  </span>
                </div>
              </div>
              <button
                onClick={handleEndRage}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-lg text-xs font-bold transition"
              >
                End Rage
              </button>
            </div>
          ) : (
            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between">
              <div className="text-xs text-stone-300">
                Daily Uses Remaining:{' '}
                <span className="font-bold text-amber-300 font-mono text-sm">
                  {stats.dailyUsesRemaining}
                </span>{' '}
                / {stats.dailyUsesMax} per day
              </div>
              <button
                onClick={handleEnterRage}
                disabled={stats.dailyUsesRemaining <= 0}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Flame className="w-4 h-4" /> Enter Rage
              </button>
            </div>
          )}

          {/* Matrix of Bonuses */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 font-mono uppercase block">Strength</span>
              <span className="text-lg font-bold text-red-400 font-mono">+{stats.strBonus}</span>
              <span className="text-[10px] text-stone-500 block">+{Math.floor(stats.strBonus / 2)} Atk/Dmg</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 font-mono uppercase block">Constitution</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">+{stats.conBonus}</span>
              <span className="text-[10px] text-stone-500 block">+{stats.totalTempHp} Temp HP</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 font-mono uppercase block">Will Save</span>
              <span className="text-lg font-bold text-amber-400 font-mono">+{stats.willBonus}</span>
              <span className="text-[10px] text-stone-500 block">Morale Bonus</span>
            </div>

            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 font-mono uppercase block">Armor Class</span>
              <span className="text-lg font-bold text-rose-400 font-mono">-2</span>
              <span className="text-[10px] text-stone-500 block">Reckless Defense</span>
            </div>
          </div>

          {/* Duration & Mechanics */}
          <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2 text-xs text-stone-300">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Duration:</span>
              <span className="font-bold text-amber-300 font-mono">
                {stats.durationRounds} rounds (3 + CON modifier)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400">Post-Rage State:</span>
              <span className="font-mono text-stone-300">
                {stats.isTireless ? (
                  <span className="text-emerald-400 font-bold">Tireless (No fatigue!)</span>
                ) : (
                  <span className="text-amber-400">Fatigued (-2 STR, -2 DEX) until rest</span>
                )}
              </span>
            </div>

            {stats.hasIndomitableWill && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Indomitable Will (Lvl 14):</span>
                <span className="text-purple-300 font-bold font-mono">+4 Will vs Enchantment</span>
              </div>
            )}
          </div>

          {/* 3.5e RAW Restrictions Notice */}
          <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl flex items-start gap-2 text-xs text-amber-200/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>3.5e RAW Restriction:</strong> While in a rage, a barbarian cannot use any skills that require patience or concentration (such as Concentration, Craft, Handle Animal, or Spellcraft), nor can they cast spells or activate magic items that require command words or spell completion.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
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
