import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35ePsionicStats } from '../../utils/calculators/classFeatures35eCalculators';
import { Brain, Zap, Sparkles, X, Activity, ShieldAlert, Award } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface PsionicEngine35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
  onRoll?: (diceNotation: string, label: string) => void;
}

export const PsionicEngine35eModal: React.FC<PsionicEngine35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  if (!isOpen) return null;

  const stats = calculate35ePsionicStats(character);
  const [ppToSpend, setPpToSpend] = useState<number>(1);
  const [wildSurgeLevel, setWildSurgeLevel] = useState<number>(1);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const handleSpendPowerPoints = () => {
    if (ppToSpend <= 0) return;
    if (ppToSpend > stats.powerPointsRemaining) {
      setLogMessage('⚠️ Not enough Power Points remaining!');
      return;
    }

    const nextRemaining = stats.powerPointsRemaining - ppToSpend;
    onUpdateCharacter({
      ...character,
      psionicData: {
        ...(character.psionicData || {
          powerPointsMax: stats.totalPowerPointsMax,
          isPsionicFocused: false
        }),
        powerPointsRemaining: nextRemaining
      }
    });

    playDiceSound();
    setLogMessage(`🧠 Manifested power spending ${ppToSpend} PP! (Remaining: ${nextRemaining}/${stats.totalPowerPointsMax} PP).`);
  };

  const handleToggleFocus = () => {
    const nextFocus = !stats.isPsionicFocused;
    onUpdateCharacter({
      ...character,
      psionicData: {
        ...(character.psionicData || {
          powerPointsMax: stats.totalPowerPointsMax,
          powerPointsRemaining: stats.powerPointsRemaining
        }),
        isPsionicFocused: nextFocus
      }
    });

    playDiceSound();
    setLogMessage(nextFocus
      ? `🧘 Entered a state of serene Psionic Focus!`
      : `⚡ Expended Psionic Focus to empower an ability!`
    );
  };

  const handleMeditateForFocus = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const getSkillBonus = (name: string, defaultAbility: 'WIS' | 'CON') => {
      const sk = character.skills?.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
      const ranks = sk?.ranks !== undefined ? sk.ranks : 0;
      const misc = sk?.miscMod || 0;
      const abMod = Math.floor(((character.abilities[defaultAbility]?.score || 10) - 10) / 2);
      return ranks + misc + abMod;
    };
    const bestBonus = Math.max(getSkillBonus('autohypnosis', 'WIS'), getSkillBonus('concentration', 'CON'));
    const total = d20 + bestBonus;
    const passed = total >= 20;

    if (passed) {
      onUpdateCharacter({
        ...character,
        psionicData: {
          ...(character.psionicData || {
            powerPointsMax: stats.totalPowerPointsMax,
            powerPointsRemaining: stats.powerPointsRemaining
          }),
          isPsionicFocused: true
        }
      });
    }

    playDiceSound();
    if (onRoll) {
      onRoll(`1d20+${bestBonus}`, 'Meditate for Psionic Focus (DC 20)');
    }
    setLogMessage(`🧘 Meditate for Focus: [d20 (${d20}) + bonus (${bestBonus})] = ${total} vs DC 20. ${passed ? '✨ Success! Now Psionically Focused.' : '❌ Failed to achieve Focus.'}`);
  };

  const handleRollWildSurge = () => {
    const enervationChance = wildSurgeLevel * 5;
    const rollPercent = Math.floor(Math.random() * 100) + 1;
    const isEnervated = rollPercent <= enervationChance;

    playDiceSound();
    if (isEnervated) {
      const nextRemaining = Math.max(0, stats.powerPointsRemaining - wildSurgeLevel);
      onUpdateCharacter({
        ...character,
        psionicData: {
          ...(character.psionicData || {
            powerPointsMax: stats.totalPowerPointsMax,
            isPsionicFocused: false
          }),
          powerPointsRemaining: nextRemaining
        }
      });
      setLogMessage(`⚠️ PSYCHIC ENERVATION! Rolled ${rollPercent}% vs ${enervationChance}% threshold. Overcome by chaotic surge: lost ${wildSurgeLevel} PP and Dazed for 1 round!`);
    } else {
      setLogMessage(`✨ WILD SURGE +${wildSurgeLevel} Stabilized! Rolled ${rollPercent}% vs ${enervationChance}% threshold. Manifesting with +${wildSurgeLevel} Manifester Level!`);
    }
  };

  const handleRestorePP = () => {
    onUpdateCharacter({
      ...character,
      psionicData: {
        ...(character.psionicData || {
          isPsionicFocused: false
        }),
        powerPointsMax: stats.totalPowerPointsMax,
        powerPointsRemaining: stats.totalPowerPointsMax
      }
    });
    setLogMessage(`✨ Restored Power Points to maximum (${stats.totalPowerPointsMax} PP).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-950/80 border border-violet-500/50 text-violet-300">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Expanded Psionics Engine
              </h2>
              <p className="text-xs text-stone-400">
                Expanded Psionics Handbook (XPH) • Level {stats.manifesterLevel} {stats.psionicClass || 'Manifester'}
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
            <div className="p-2.5 bg-violet-950/80 border border-violet-500/50 rounded-xl text-xs text-violet-200">
              {logMessage}
            </div>
          )}

          {/* Power Points Pool */}
          <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 uppercase font-mono block">Power Points Reserve</span>
                <span className="text-2xl font-bold font-mono text-violet-300">
                  {stats.powerPointsRemaining} / {stats.totalPowerPointsMax} PP
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Base: {stats.basePowerPoints} PP • Bonus: +{stats.bonusPowerPoints} PP ({stats.keyAbility} Mod +{stats.keyAbilityMod})
                </span>
              </div>

              <button
                onClick={handleRestorePP}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded transition"
              >
                Restore PP
              </button>
            </div>

            {/* Spend PP Form */}
            <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
              <span className="text-xs text-stone-300">Manifest Power:</span>
              <input
                type="number"
                min={1}
                max={stats.powerPointsRemaining}
                value={ppToSpend}
                onChange={(e) => setPpToSpend(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-violet-300 font-mono text-center"
              />
              <button
                onClick={handleSpendPowerPoints}
                disabled={stats.powerPointsRemaining <= 0}
                className="px-3 py-1 bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow"
              >
                <Zap className="w-3.5 h-3.5" /> Spend PP
              </button>
            </div>
          </div>

          {/* Psionic Focus Section */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-serif font-bold text-amber-200 block">
                  Psionic Focus
                </span>
                <span className="text-[11px] text-stone-400">
                  State: {stats.isPsionicFocused ? (
                    <span className="text-emerald-400 font-bold font-mono">FOCUSED (Ready to expend)</span>
                  ) : (
                    <span className="text-stone-500 font-mono">Expended</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMeditateForFocus}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Meditate (DC 20)
                </button>
                <button
                  onClick={handleToggleFocus}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    stats.isPsionicFocused
                      ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/50'
                      : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/50'
                  }`}
                >
                  {stats.isPsionicFocused ? 'Expend Focus' : 'Mark Focused'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Expending your psionic focus allows you to use metapsionic feats (Empower Power, Maximize Power), gain maximum damage on Psionic Weapon, or take 15 on Concentration.
            </p>
          </div>

          {/* Wilder Wild Surge Section (if Wilder) */}
          {(stats.psionicClass === 'Wilder' || character.characterClass?.toLowerCase().includes('wilder')) && (
            <div className="p-3.5 bg-violet-950/40 border border-violet-500/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-violet-200 block">
                    Wilder Wild Surge
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Boost Manifester Level (+1 to +6 ML). 5% per surge level risk of Psychic Enervation.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={wildSurgeLevel}
                    onChange={(e) => setWildSurgeLevel(parseInt(e.target.value) || 1)}
                    className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-violet-300 font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                      <option key={lvl} value={lvl}>
                        +{lvl} ML ({lvl * 5}% Enervation)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRollWildSurge}
                    className="px-3 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded text-xs font-bold transition shadow"
                  >
                    Trigger Surge
                  </button>
                </div>
              </div>
            </div>
          )}
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
